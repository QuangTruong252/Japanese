'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
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
import { db } from '@/lib/db';
import { summarizeSession } from '@/lib/practice';
import {
  clearPracticeDraft,
  particleHint,
  PRACTICE_DRAFT_VERSION,
  savePracticeDraft,
  shouldSaveDraftOnAnswer,
} from '@/lib/practice-draft';
import { savePracticeSession } from '@/lib/practice-write';
import { describeNextReviews, resolveNextBatchPlan, type NextBatchPlanResult } from '@/lib/review-queue';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type {
  AnswerResult,
  PracticeConfig,
  PracticeSession,
  QuestionItem,
  ReviewItem,
} from '@/types';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

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
  const { setCurrentQuestionIndex } = useUIStore();

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

  const initialIndexRef = useRef(initialIndex);
  useEffect(() => {
    setCurrentQuestionIndex(initialIndexRef.current);
    startQuestionTimer();
  }, [setCurrentQuestionIndex, startQuestionTimer]);

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
      const measured = results.length === 1 ? [{ ...results[0]!, elapsedMs }] : results;

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
    if (!answered && !isFinished) return;

    if (currentIndex + 1 < questions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setCurrentQuestionIndex(nextIdx);
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
    setCurrentQuestionIndex,
    startQuestionTimer,
    saveResults,
    allResults,
  ]);

  // Phím tắt: Escape mở dialog thoát, Space sang câu tiếp khi đã trả lời
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (e.key === 'Escape') {
        e.preventDefault();
        if (!answered && !isPaused) {
          pauseQuestionTimer();
        }
        setExitDialogOpen(true);
        return;
      }

      if (isInput) return;

      if ((e.key === ' ' || e.code === 'Space' || e.key === 'Enter') && answered) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answered, isPaused, pauseQuestionTimer, handleNext]);

  const incorrectQuestions = useMemo(() => {
    const wrongTargetIds = new Set(
      allResults.filter((r) => !r.isCorrect).map((r) => r.targetId),
    );
    return questions.filter((q) => {
      if (q.pairs && q.pairs.length > 0) {
        return q.pairs.some((p) => wrongTargetIds.has(p.targetId));
      }
      return wrongTargetIds.has(q.targetId);
    });
  }, [questions, allResults]);

  const userAnswerByTargetId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of allResults) {
      if (r.userAnswer !== undefined) {
        map[r.targetId] = r.userAnswer ?? '';
      }
    }
    return map;
  }, [allResults]);

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

  const handleRetryIncorrect = () => {
    if (incorrectQuestions.length === 0) return;
    savePracticeDraft({
      version: PRACTICE_DRAFT_VERSION,
      questions: incorrectQuestions,
      currentIndex: 0,
      results: [],
      elapsedSec: 0,
      savedAt: Date.now(),
      config: {
        mode: 'lesson',
        lessons: [...new Set(incorrectQuestions.map((q) => q.lesson))].sort((a, b) => a - b),
        maxLearnedLesson: Math.max(0, ...incorrectQuestions.map((q) => q.lesson)),
        selectedTypes: [...new Set(incorrectQuestions.map((q) => q.type))],
        questionCount: incorrectQuestions.length,
      },
    });
    router.push(`/luyen-tap/phien?resume=${Date.now()}`);
  };

  // Màn hình kết quả sau khi hoàn thành lô ôn
  if (isFinished) {
    const displaySession: PracticeSession =
      savedSession ?? summarizeSession(config, allResults, sessionDuration);
    const percentage = Math.round(displaySession.accuracyRate * 100);
    const hasMore = nextBatchPlan ? nextBatchPlan.hasMore : false;
    const nextPlayableCount = nextBatchPlan ? nextBatchPlan.playableCount : 0;
    const totalDueRemaining = nextBatchPlan ? nextBatchPlan.totalDueCount : 0;
    const isPlanLoading = savedSession === null || nextBatchPlan === null;

    return (
      <main className="mx-auto max-w-xl space-y-6 px-4 py-8">
        {/* Thông báo tiếp cận cho Screen Reader */}
        <div role="status" className="sr-only">
          Đã hoàn thành lô ôn tập. Tỷ lệ đúng {percentage}%, {displaySession.correctCount} trên{' '}
          {displaySession.totalQuestions} câu.
        </div>

        <div className="space-y-1 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-400 motion-safe:ease-in-out motion-safe:fill-mode-both">
          <h1 className="font-heading text-xl font-medium">Kết quả ôn tập</h1>
          <p className="text-sm text-muted-foreground">
            Đã hoàn thành lô ôn tập theo lịch ({displaySession.totalQuestions} mục)
          </p>
        </div>

        {saveError && (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-destructive"
          >
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="size-5 shrink-0" />
              <span>Lỗi lưu kết quả vào bộ nhớ máy</span>
            </div>
            <p className="text-sm">{saveError}</p>
            <div className="pt-1">
              <Button size="sm" variant="destructive" onClick={() => void saveResults(allResults)}>
                Thử lại
              </Button>
            </div>
          </div>
        )}

        {/* Thẻ thống kê */}
        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-card p-4 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-400 motion-safe:ease-in-out motion-safe:fill-mode-both motion-safe:delay-40">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Tỷ lệ đúng</span>
            <p className="text-2xl font-bold tracking-tight text-primary">{percentage}%</p>
          </div>
          <div className="space-y-1 border-x border-border">
            <span className="text-xs text-muted-foreground">Số câu đúng</span>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {displaySession.correctCount}/{displaySession.totalQuestions}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Thời lượng</span>
            <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {formatDuration(displaySession.durationSeconds)}
            </p>
          </div>
        </div>

        {nextReviewLine && (
          <p className="text-center text-sm text-muted-foreground">
            Lần ôn kế tiếp: {nextReviewLine}
          </p>
        )}

        {/* Khối trạng thái tiếp lô hoặc hoàn tất */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 text-center space-y-3">
          {isPlanLoading ? (
            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                Đang lưu và tính toán lô ôn tiếp theo...
              </p>
            </div>
          ) : hasMore ? (
            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                {totalDueRemaining > 0
                  ? `Còn ${totalDueRemaining} mục đến hạn ôn tập`
                  : `Có ${nextPlayableCount} mục mới sẵn sàng ôn tập`}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Bạn có thể làm tiếp lô tiếp theo ({nextPlayableCount} mục) hoặc dừng lại để nghỉ ngơi.
              </p>
            </div>
          ) : nextBatchPlan?.blockedReason === 'no-audio' ? (
            <div className="space-y-1 text-warning-foreground">
              <p className="font-semibold">
                Các mục đến hạn còn lại chỉ có câu dạng nghe, nhưng thiết bị chưa có giọng tiếng Nhật (ja-JP).
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Hạn ôn của các mục này được giữ nguyên. Bạn có thể cài đặt giọng đọc để tiếp tục.
              </p>
            </div>
          ) : nextBatchPlan?.blockedReason === 'no-questions' ? (
            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                Không thể tạo câu hỏi cho các mục còn lại. Hạn ôn được giữ nguyên.
              </p>
            </div>
          ) : (
            <div className="space-y-1 text-success">
              <div className="flex items-center justify-center gap-1.5 font-semibold">
                <CheckCircle2 className="size-5 shrink-0" />
                <span>Đã ôn hết các mục đến hạn hôm nay!</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Không còn mục nào cần ôn tập lúc này. Nhịp học của bạn đang rất tốt.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-2">
            {!isPlanLoading && hasMore ? (
              <>
                <Button
                  size="quiz"
                  className="w-full text-base font-medium"
                  onClick={onStartNextBatch}
                >
                  Ôn lô tiếp ({nextPlayableCount} mục)
                </Button>
                <Button
                  size="quiz"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/')}
                >
                  Về Bảng tin
                </Button>
              </>
            ) : (
              <>
                {nextBatchPlan?.blockedReason === 'no-audio' && (
                  <Button
                    size="quiz"
                    className="w-full text-base font-medium"
                    onClick={() => router.push('/cai-dat/audio')}
                  >
                    Cài đặt âm thanh
                  </Button>
                )}
                <Button
                  size="quiz"
                  className="w-full text-base font-medium"
                  onClick={() => router.push('/')}
                >
                  Về Bảng tin
                </Button>
                <Button
                  size="quiz"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/on-tap/diem-yeu')}
                >
                  Xem điểm yếu của tôi
                </Button>
              </>
            )}
            <Button
              size="quiz"
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => router.push('/on-tap')}
            >
              Về trang ôn tập
            </Button>
          </div>
        </div>

        {/* Danh sách câu sai nếu có */}
        {incorrectQuestions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-foreground">
              Câu sai cần chú ý ({incorrectQuestions.length})
            </h2>
            <div className="space-y-3">
              {incorrectQuestions.map((q) => {
                const answerText = Array.isArray(q.answer) ? q.answer.join(', ') : q.answer;
                const userAnswer = userAnswerByTargetId[q.targetId];
                return (
                  <div
                    key={q.id}
                    className="space-y-2 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="jp jp-example font-medium">
                      <Furigana text={q.prompt} />
                    </div>
                    {userAnswer !== undefined && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Bạn trả lời: </span>
                        {userAnswer.trim().length > 0 ? (
                          <span className="jp jp-vocab font-medium text-destructive">
                            {userAnswer}
                          </span>
                        ) : (
                          <span className="italic text-muted-foreground">(Chưa biết)</span>
                        )}
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-muted-foreground">Đáp án đúng: </span>
                      <span className="jp jp-vocab font-medium text-foreground">
                        {answerText}
                      </span>
                    </div>
                    {q.explanationVi && (
                      <p className="text-xs text-muted-foreground">{q.explanationVi}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <Button
              size="quiz"
              variant="outline"
              className="w-full"
              onClick={handleRetryIncorrect}
            >
              <RotateCcw className="mr-2 size-5" />
              Luyện lại {incorrectQuestions.length} câu sai
            </Button>
          </div>
        )}
      </main>
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
              <section aria-label="Nội dung câu hỏi">
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
                        <span className="jp jp-vocab font-medium text-foreground">
                          {Array.isArray(currentQuestion.answer)
                            ? currentQuestion.answer.join(', ')
                            : currentQuestion.answer}
                        </span>
                      </p>
                      {currentHint && (
                        <p className="rounded-lg bg-warning/10 p-2.5 text-xs text-warning-foreground border border-warning/20">
                          <span className="font-semibold">Gợi ý:</span> {currentHint}
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tạm dừng hoặc thoát phiên ôn tập?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có thể lưu lại tiến độ để ôn tiếp sau, hoặc bỏ phiên để xóa tiến trình dở.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel
              size="quiz"
              className="w-full sm:w-auto"
              onClick={handleCancelExit}
            >
              Tiếp tục làm
            </AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              size="quiz"
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
              onClick={handleDiscardAndExit}
            >
              Bỏ phiên
            </Button>
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
