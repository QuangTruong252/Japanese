'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  FeedbackPanel,
  PauseLayer,
  QuestionPrompt,
  SessionHeader,
  SessionShell,
} from '@/components/practice/SessionFrame';
import { db } from '@/lib/db';
import { summarizeIncorrect, summarizeSession } from '@/lib/practice';
import {
  clearPracticeDraft,
  PRACTICE_DRAFT_VERSION,
  savePracticeDraft,
  shouldAdvanceOnKey,
  shouldSaveDraftOnAnswer,
} from '@/lib/practice-draft';
import { savePracticeSession } from '@/lib/practice-write';
import { describeNextReviews, resolveNextBatchPlan, type NextBatchPlanResult } from '@/lib/review-queue';
import { DEFAULT_SETTINGS } from '@/lib/settings';
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
    <SessionShell>
      {/* Thông báo tiếp cận cho Screen Reader */}
      <div role="status" className="sr-only">
        {`Câu ${currentIndex + 1} trên ${questions.length}`}
      </div>

      <SessionHeader
        regionLabel="Ôn tập theo lịch"
        exitLabel="Tạm dừng hoặc thoát phiên ôn tập"
        onExit={() => {
          pauseQuestionTimer();
          setExitDialogOpen(true);
        }}
        index={currentIndex}
        total={questions.length}
        progress={(currentIndex + 1) / questions.length}
        duration={sessionDuration}
        isPaused={isPaused}
        pauseLabel={isPaused ? 'Tiếp tục bấm giờ' : 'Tạm dừng bấm giờ'}
        pauseDisabled={answered}
        onTogglePause={togglePause}
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {isPaused && (
          <PauseLayer title="Đang tạm dừng phiên ôn tập" resumeLabel="Tiếp tục ôn" onResume={togglePause} />
        )}

        {/* Chỉ vùng câu hỏi cuộn khi tràn; khối phản hồi luôn nằm dưới cùng */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2">
          {/* Gỡ câu hỏi khi tạm dừng (như trước): lớp tạm dừng chỉ là phần trình bày */}
          {!isPaused && (
            <section
              aria-label="Nội dung câu hỏi"
              key={currentQuestion.id}
              className="my-auto w-full space-y-6 py-2"
            >
              <QuestionPrompt question={currentQuestion} />
              {renderQuestionComponent()}
            </section>
          )}
        </div>

        {answered && lastResult && (
          <FeedbackPanel
            question={currentQuestion}
            result={lastResult}
            isLast={currentIndex + 1 >= questions.length}
            onNext={handleNext}
          />
        )}
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
    </SessionShell>
  );
}
