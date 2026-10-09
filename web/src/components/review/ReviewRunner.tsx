'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Pause,
  Play,
  X,
} from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { QuestionCloze } from '@/components/practice/QuestionCloze';
import { QuestionListening } from '@/components/practice/QuestionListening';
import { QuestionMc } from '@/components/practice/QuestionMc';
import { QuestionReorder } from '@/components/practice/QuestionReorder';
import { SessionResult } from '@/components/practice/SessionResult';
import { db } from '@/lib/db';
import { summarizeIncorrect, summarizeSession } from '@/lib/practice';
import {
  clearPracticeDraft,
  particleHint,
  PRACTICE_DRAFT_VERSION,
  savePracticeDraft,
  shouldAdvanceOnKey,
  shouldSaveDraftOnAnswer,
} from '@/lib/practice-draft';
import { savePracticeSession } from '@/lib/practice-write';
import { describeNextReviews, resolveNextBatchPlan, type NextBatchPlanResult } from '@/lib/review-queue';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import { cn } from '@/lib/utils';
import type {
  AnswerResult,
  PracticeConfig,
  PracticeSession,
  QuestionItem,
  ReviewItem,
} from '@/types';

export interface ReviewRunnerProps {
  questions: QuestionItem[];
  config: PracticeConfig;
  initialIndex?: number;
  initialResults?: AnswerResult[];
  initialDuration?: number;
  reviewBatchSize: number;
  onStartNextBatch: () => void;
  allPoolQuestions?: QuestionItem[];
  availableAudioKeys?: Set<string>;
  dailyNewLimit?: number;
}

export function ReviewRunner({
  questions,
  config,
  initialIndex = 0,
  initialResults = [],
  initialDuration = 0,
  reviewBatchSize,
  onStartNextBatch,
  allPoolQuestions,
  availableAudioKeys,
  dailyNewLimit,
}: ReviewRunnerProps) {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [allResults, setAllResults] = useState<AnswerResult[]>(initialResults);
  const [answered, setAnswered] = useState(false);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);

  const [sessionDuration, setSessionDuration] = useState(initialDuration);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [savedSession, setSavedSession] = useState<PracticeSession | null>(null);
  const [nextReviewLine, setNextReviewLine] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  // Focus mặc định của dialog thoát nằm ở nút đầu tiên ("Bỏ phiên"); Esc rồi Space sẽ xóa phiên. Đặt focus vào nút an toàn.
  const keepGoingRef = useRef<HTMLButtonElement>(null);
  const [nextBatchPlan, setNextBatchPlan] = useState<NextBatchPlanResult | null>(null);

  const isSavingRef = useRef(false);
  const savedSessionRef = useRef<PracticeSession | null>(null);

  // Đo thời gian làm bài của từng câu không tính lúc tạm dừng
  const questionActiveMsRef = useRef<number>(0);
  const lastResumeTimeRef = useRef<number | null>(null);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    router.prefetch('/on-tap');
    router.prefetch('/');
    router.prefetch('/on-tap/diem-yeu');
  }, [router]);

  const pauseQuestionTimer = useCallback(() => {
    if (lastResumeTimeRef.current !== null) {
      questionActiveMsRef.current += performance.now() - lastResumeTimeRef.current;
      lastResumeTimeRef.current = null;
    }
  }, []);

  const resumeQuestionTimer = useCallback(() => {
    lastResumeTimeRef.current = performance.now();
  }, []);

  const startQuestionTimer = useCallback(() => {
    questionActiveMsRef.current = 0;
    lastResumeTimeRef.current = performance.now();
  }, []);

  const getQuestionElapsedMs = useCallback(() => {
    let total = questionActiveMsRef.current;
    if (lastResumeTimeRef.current !== null) {
      total += performance.now() - lastResumeTimeRef.current;
    }
    return Math.max(1, Math.round(total));
  }, []);

  useEffect(() => {
    startQuestionTimer();
  }, [startQuestionTimer]);

  // Đồng hồ tổng phiên
  useEffect(() => {
    if (isFinished || isPaused || answered) return;
    const timer = setInterval(() => {
      setSessionDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished, isPaused, answered]);

  const togglePause = useCallback(() => {
    if (answered || isFinished) return;
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        pauseQuestionTimer();
      } else {
        resumeQuestionTimer();
      }
      return next;
    });
  }, [answered, isFinished, pauseQuestionTimer, resumeQuestionTimer]);

  const lessonByTargetId = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of questions) {
      map.set(q.targetId, q.lesson);
    }
    return map;
  }, [questions]);

  // Ghi kết quả vào Dexie (nguyên tử) và tính toán chính xác lô tiếp theo (hàm thuần)
  const saveResults = useCallback(
    async (resultsToSave: AnswerResult[]) => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      try {
        setSaveError(null);
        let session = savedSessionRef.current;
        let reviewItems: ReviewItem[] = [];

        if (!session) {
          const res = await savePracticeSession({
            config,
            results: resultsToSave,
            lessonByTargetId,
            durationSeconds: sessionDuration,
          });
          session = res.session;
          reviewItems = res.reviewItems;
          savedSessionRef.current = session;
          setSavedSession(session);
        }

        const now = new Date();
        if (reviewItems.length > 0) {
          setNextReviewLine(describeNextReviews(reviewItems.map((r: ReviewItem) => r.dueAt), now));
        }

        // Tính toán lô tiếp theo bằng resolveNextBatchPlan
        // (khớp 100% logic useDueQueue/planReviewBatch, tính cả newTargetIds và lọc audio/câu hỏi hợp lệ)
        const allItems = await db.reviewItems.toArray();
        const nextPlan = resolveNextBatchPlan({
          allReviewItems: allItems,
          poolQuestions: allPoolQuestions ?? questions,
          dailyNewLimit: dailyNewLimit ?? DEFAULT_SETTINGS.dailyNewLimit,
          reviewBatchSize,
          now,
          availableAudioKeys: availableAudioKeys ?? new Set(['tts']),
          config,
        });
        setNextBatchPlan(nextPlan);

        clearPracticeDraft();
      } catch (err) {
        setSaveError(
          err instanceof Error
            ? err.message
            : 'Không thể lưu kết quả phiên ôn tập vào bộ nhớ máy.',
        );
      } finally {
        isSavingRef.current = false;
      }
    },
    [
      config,
      lessonByTargetId,
      sessionDuration,
      allPoolQuestions,
      questions,
      dailyNewLimit,
      reviewBatchSize,
      availableAudioKeys,
    ],
  );

  const handleAnswer = useCallback(
    (results: AnswerResult[]) => {
      if (answered || isPaused) return;
      pauseQuestionTimer();

      const elapsedMs = getQuestionElapsedMs();
      const questionId = questions[currentIndex]?.id;
      const measured = (results.length === 1 ? [{ ...results[0]!, elapsedMs }] : results).map(
        (r) => ({ ...r, questionId }),
      );

      const nextResults = [...allResults, ...measured];
      setAllResults(nextResults);
      const hasIncorrect = measured.some((r) => !r.isCorrect);
      const representativeResult = hasIncorrect
        ? (measured.find((r) => !r.isCorrect) ?? measured[0])
        : measured[0];
      setLastResult(representativeResult ?? null);
      setAnswered(true);

      if (shouldSaveDraftOnAnswer(currentIndex, questions.length)) {
        savePracticeDraft({
          version: PRACTICE_DRAFT_VERSION,
          questions,
          currentIndex: currentIndex + 1,
          results: nextResults,
          elapsedSec: sessionDuration,
          savedAt: Date.now(),
          config,
        });
      }
    },
    [
      answered,
      isPaused,
      pauseQuestionTimer,
      getQuestionElapsedMs,
      allResults,
      currentIndex,
      questions,
      sessionDuration,
      config,
    ],
  );

  const handleNext = useCallback(() => {
    if (!answered || isFinished) return;

    if (currentIndex + 1 < questions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setAnswered(false);
      setLastResult(null);
      startQuestionTimer();
    } else {
      setIsFinished(true);
      void saveResults(allResults);
    }
  }, [
    answered,
    isFinished,
    currentIndex,
    questions.length,
    startQuestionTimer,
    saveResults,
    allResults,
  ]);

  // Phím tắt: Escape mở dialog thoát, Space sang câu tiếp khi đã trả lời
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;

      if (e.key === 'Escape') {
        e.preventDefault();
        if (!answered && !isPaused) {
          pauseQuestionTimer();
        }
        setExitDialogOpen(true);
        return;
      }

      if (
        shouldAdvanceOnKey({
          key: e.key,
          code: e.code,
          targetTag: target?.tagName,
          answered,
          isFinished,
          exitDialogOpen,
        })
      ) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answered, exitDialogOpen, isFinished, isPaused, pauseQuestionTimer, handleNext]);

  // Câu sai và câu trả lời theo từng câu (một từ có thể nằm ở nhiều câu)
  const { incorrectQuestions, userAnswers } = useMemo(
    () => summarizeIncorrect(questions, allResults),
    [questions, allResults],
  );

  const currentHint = useMemo(() => {
    if (!lastResult || lastResult.isCorrect || !currentQuestion) return null;
    const userAnswer = lastResult.userAnswer;
    if (!userAnswer) return null;
    return particleHint(userAnswer, currentQuestion.answer);
  }, [lastResult, currentQuestion]);

  const handleSaveAndExit = () => {
    setExitDialogOpen(false);
    if (answered && currentIndex + 1 >= questions.length) {
      handleNext();
      return;
    }
    const resumeIndex = answered ? currentIndex + 1 : currentIndex;
    savePracticeDraft({
      version: PRACTICE_DRAFT_VERSION,
      questions,
      currentIndex: resumeIndex,
      results: allResults,
      elapsedSec: sessionDuration,
      savedAt: Date.now(),
      config,
    });
    router.push('/on-tap');
  };

  const handleDiscardAndExit = () => {
    clearPracticeDraft();
    setExitDialogOpen(false);
    router.push('/on-tap');
  };

  const handleCancelExit = () => {
    setExitDialogOpen(false);
    if (!answered && !isPaused) {
      resumeQuestionTimer();
    }
  };

  // Màn hình kết quả sau khi hoàn thành lô ôn (Finding 7)
  if (isFinished) {
    const displaySession: PracticeSession =
      savedSession ?? summarizeSession(config, allResults, sessionDuration);
    const hasMore = nextBatchPlan ? nextBatchPlan.hasMore : false;
    const isPlanLoading = savedSession === null || nextBatchPlan === null;

    return (
      <SessionResult
        session={displaySession}
        incorrectQuestions={incorrectQuestions}
        saveError={saveError}
        onRetrySave={() => void saveResults(allResults)}
        mode="due"
        nextReviewLine={nextReviewLine}
        userAnswers={userAnswers}
        config={config}
        hasMoreDue={!isPlanLoading && hasMore}
        onContinueReview={onStartNextBatch}
        isPlanLoading={isPlanLoading}
        blockedReason={nextBatchPlan?.blockedReason}
      />
    );
  }

  if (!currentQuestion) return null;

  const renderQuestionComponent = () => {
    switch (currentQuestion.type) {
      case 'mc':
        return (
          <QuestionMc
            key={currentQuestion.id}
            question={currentQuestion}
            answered={answered}
            onAnswer={handleAnswer}
          />
        );
      case 'cloze':
        return (
          <QuestionCloze
            key={currentQuestion.id}
            question={currentQuestion}
            answered={answered}
            onAnswer={handleAnswer}
          />
        );
      case 'reorder':
        return (
          <QuestionReorder
            key={currentQuestion.id}
            question={currentQuestion}
            answered={answered}
            onAnswer={handleAnswer}
          />
        );
      case 'listening':
        return (
          <QuestionListening
            key={currentQuestion.id}
            question={currentQuestion}
            answered={answered}
            onAnswer={handleAnswer}
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className="fixed inset-0 z-40 flex flex-col justify-between overflow-y-auto bg-background px-4 py-4 sm:py-6">
      <div className="mx-auto w-full max-w-xl space-y-4">
        {/* Thanh tiêu đề phiên */}
        <header className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-xl"
            aria-label="Tạm dừng hoặc thoát phiên ôn tập"
            onClick={() => {
              pauseQuestionTimer();
              setExitDialogOpen(true);
            }}
          >
            <X className="size-5" />
          </Button>

          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-muted-foreground">
              Ôn tập theo lịch
            </span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              Câu {currentIndex + 1} / {questions.length}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-xl"
            aria-label={isPaused ? 'Tiếp tục bấm giờ' : 'Tạm dừng bấm giờ'}
            onClick={togglePause}
          >
            {isPaused ? <Play className="size-5" /> : <Pause className="size-5" />}
          </Button>
        </header>

        {/* Thanh tiến trình hỗ trợ Accessibility */}
        <div
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={questions.length}
          aria-valuetext={`Câu ${currentIndex + 1} trên ${questions.length}`}
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Nội dung câu hỏi */}
        <div className="space-y-6 pt-2">
          {isPaused ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border p-6 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                Đang tạm dừng phiên ôn tập
              </p>
              <Button size="quiz" onClick={togglePause}>
                <Play className="mr-2 size-5" />
                Tiếp tục ôn
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <section aria-label="Nội dung câu hỏi" className="space-y-5">
                {/* Đề bài như ở Luyện tập: dạng nghe chỉ có lời dặn, đề là âm thanh */}
                <div key={`prompt-${currentQuestion.id}`} className="flex flex-col items-center text-center">
                  {currentQuestion.type === 'listening' ? (
                    <p className="text-sm font-medium text-muted-foreground">
                      Nghe và nhập lại câu tiếng Nhật
                    </p>
                  ) : (
                    <>
                      {currentQuestion.context && (
                        <p className="mb-2 text-sm text-muted-foreground">{currentQuestion.context}</p>
                      )}
                      <div className="jp jp-quiz">
                        <Furigana text={currentQuestion.prompt} />
                      </div>
                    </>
                  )}
                </div>
                {renderQuestionComponent()}
              </section>

              {/* Vùng phản hồi sau khi trả lời */}
              {answered && lastResult && (
                <section
                  aria-live="polite"
                  className={cn(
                    'space-y-3 rounded-2xl border p-4 sm:p-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-200',
                    lastResult.isCorrect
                      ? 'border-success/30 bg-success/10'
                      : 'border-destructive/30 bg-destructive/10',
                  )}
                >
                  <div className="flex items-center gap-2">
                    {lastResult.isCorrect ? (
                      <CheckCircle2 className="size-5 shrink-0 text-success" />
                    ) : (
                      <AlertCircle className="size-5 shrink-0 text-destructive" />
                    )}
                    <span
                      className={cn(
                        'font-semibold text-sm sm:text-base',
                        lastResult.isCorrect ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {lastResult.isCorrect ? 'Chính xác!' : 'Chưa chính xác'}
                    </span>
                  </div>

                  {!lastResult.isCorrect && (
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        Đáp án đúng:{' '}
                        <Furigana
                          text={
                            Array.isArray(currentQuestion.answer)
                              ? currentQuestion.answer.join(', ')
                              : currentQuestion.answer
                          }
                          zoomable={false}
                          className="jp-vocab font-medium text-foreground"
                        />
                      </p>
                      {currentHint && (
                        <p className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 p-2.5 text-xs text-foreground">
                          <Lightbulb className="mt-px size-3.5 shrink-0 text-info" aria-hidden="true" />
                          <span><span className="font-semibold">Gợi ý:</span> {currentHint}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {currentQuestion.explanationVi && (
                    <p className="text-xs text-muted-foreground">
                      {currentQuestion.explanationVi}
                    </p>
                  )}

                  <div className="pt-2">
                    <Button
                      size="quiz"
                      className="w-full text-base font-medium"
                      onClick={handleNext}
                    >
                      {currentIndex + 1 < questions.length ? 'Tiếp tục' : 'Xem kết quả'}
                    </Button>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hộp thoại xác nhận thoát phiên */}
      <AlertDialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <AlertDialogContent initialFocus={keepGoingRef}>
          <AlertDialogHeader>
            <AlertDialogTitle>Tạm dừng hoặc thoát phiên ôn tập?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có thể lưu lại tiến độ để ôn tiếp sau, hoặc bỏ phiên để xóa tiến trình dở.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* Bỏ phiên tách khỏi cặp chính: cuối cột trên mobile, sát trái trên desktop */}
          <AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="quiz"
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive sm:mr-auto sm:w-auto"
              onClick={handleDiscardAndExit}
            >
              Bỏ phiên
            </Button>
            <AlertDialogCancel
              ref={keepGoingRef}
              size="quiz"
              className="w-full sm:w-auto"
              onClick={handleCancelExit}
            >
              Tiếp tục làm
            </AlertDialogCancel>
            <AlertDialogAction
              size="quiz"
              className="w-full sm:w-auto"
              onClick={handleSaveAndExit}
            >
              Lưu và học tiếp sau
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
