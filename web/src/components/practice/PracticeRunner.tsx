'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Pause, Play, X } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { Button } from '@/components/ui/button';
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
import { QuestionCloze } from './QuestionCloze';
import { QuestionListening } from './QuestionListening';
import { QuestionMatching } from './QuestionMatching';
import { QuestionMc } from './QuestionMc';
import { QuestionReorder } from './QuestionReorder';
import { SessionResult } from './SessionResult';
import { savePracticeSession } from '@/lib/practice-write';
import { summarizeSession } from '@/lib/practice';
import { describeNextReviews } from '@/lib/review-queue';
import {
  clearPracticeDraft,
  savePracticeDraft,
  particleHint,
  PRACTICE_DRAFT_VERSION,
} from '@/lib/practice-draft';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type {
  AnswerResult,
  PracticeConfig,
  PracticeSession,
  QuestionItem,
} from '@/types';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function PracticeRunner({
  questions,
  config,
  initialIndex = 0,
  initialResults = [],
  initialDuration = 0,
}: {
  questions: QuestionItem[];
  config: PracticeConfig;
  initialIndex?: number;
  initialResults?: AnswerResult[];
  initialDuration?: number;
}) {
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

  // Đo thời gian làm bài của từng câu không tính lúc tạm dừng (startedAtRef)
  const questionActiveMsRef = useRef<number>(0);
  const lastResumeTimeRef = useRef<number | null>(null);

  const currentQuestion = questions[currentIndex];
  // Phiên ôn và phiên luyện dùng chung toàn bộ khung này; chỉ khác nhãn và đường thoát.
  const isDue = config.mode === 'due';

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

  // Đặt lại con trỏ câu trong store khi mount và ghi nhận mốc thời gian bắt đầu (chỉ chạy khi mount)
  const initialIndexRef = useRef(initialIndex);
  useEffect(() => {
    setCurrentQuestionIndex(initialIndexRef.current);
    startQuestionTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đồng hồ tổng phiên: tự dừng khi đã trả lời hoặc đang tạm dừng
  useEffect(() => {
    if (isFinished || isPaused || answered) return;
    const timer = setInterval(() => {
      setSessionDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished, isPaused, answered]);

  // Nút tạm dừng/tiếp tục bấm giờ
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

  // Ánh xạ targetId -> bài học (cho cả câu thường lẫn từng cặp của dạng matching)
  const lessonByTargetId = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of questions) {
      if (q.pairs && q.pairs.length > 0) {
        for (const p of q.pairs) {
          map.set(p.targetId, q.lesson);
        }
      }
      map.set(q.targetId, q.lesson);
    }
    return map;
  }, [questions]);

  // Ghi nhận đáp án: PracticeRunner giữ đồng hồ và ghi đè elapsedMs khi results.length === 1
  const handleAnswer = useCallback(
    (results: AnswerResult[]) => {
      if (answered) return;
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

      // Cập nhật nháp sau mỗi câu trả lời (chỉ lưu khi chưa phải câu cuối)
      if (currentIndex + 1 < questions.length) {
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
    [answered, pauseQuestionTimer, getQuestionElapsedMs, allResults, questions, currentIndex, sessionDuration, config],
  );

  // Ghi kết quả Dexie một transaction duy nhất
  const saveResults = useCallback(
    async (finalResults: AnswerResult[]) => {
      setSaveError(null);
      try {
        const { session, reviewItems } = await savePracticeSession({
          config,
          results: finalResults,
          lessonByTargetId,
          durationSeconds: sessionDuration,
        });
        setSavedSession(session);
        setNextReviewLine(describeNextReviews(reviewItems.map((item) => item.dueAt), new Date()));
        // Kết thúc phiên (saveResults thành công) -> xóa nháp (Requirement 2)
        clearPracticeDraft();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Lỗi lưu phiên vào cơ sở dữ liệu');
      }
    },
    [config, lessonByTargetId, sessionDuration],
  );

  // Sang câu tiếp theo hoặc kết thúc
  const handleNext = useCallback(() => {
    if (currentIndex + 1 < questions.length) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      setCurrentQuestionIndex(next);
      setAnswered(false);
      setLastResult(null);
      setIsPaused(false);
      startQuestionTimer();

      // Cập nhật nháp cho câu hỏi tiếp theo
      savePracticeDraft({
        version: PRACTICE_DRAFT_VERSION,
        questions,
        currentIndex: next,
        results: allResults,
        elapsedSec: sessionDuration,
        savedAt: Date.now(),
        config,
      });
    } else {
      setIsFinished(true);
      void saveResults(allResults);
    }
  }, [currentIndex, questions, setCurrentQuestionIndex, startQuestionTimer, allResults, sessionDuration, config, saveResults]);

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

      if (e.key === ' ' || e.code === 'Space') {
        if (answered) {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answered, handleNext, isPaused, pauseQuestionTimer]);

  // Danh sách các câu hỏi bị trả lời sai
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

  // Gom câu trả lời của người dùng theo targetId để hiển thị ở màn kết quả
  const userAnswers = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of allResults) {
      if (r.userAnswer !== undefined) {
        map[r.targetId] = r.userAnswer ?? '';
      }
    }
    return map;
  }, [allResults]);

  // Tính đáp án đúng để hiển thị trong vùng phản hồi
  const correctAnswerText = useMemo(() => {
    if (!currentQuestion) return '';
    if (currentQuestion.type === 'matching' && currentQuestion.pairs) {
      return currentQuestion.pairs.map((p) => `${p.jp} ↔ ${p.vi}`).join(' · ');
    }
    return Array.isArray(currentQuestion.answer)
      ? currentQuestion.answer.join(', ')
      : currentQuestion.answer;
  }, [currentQuestion]);

  // Gợi ý trợ từ khi người dùng làm sai
  const currentHint = useMemo(() => {
    if (!lastResult || lastResult.isCorrect || !currentQuestion) return null;
    const userAnswer = lastResult.userAnswer;
    if (!userAnswer) return null;
    return particleHint(userAnswer, currentQuestion.answer);
  }, [lastResult, currentQuestion]);

  // Thoát: Lưu và học tiếp sau (nút chính)
  const handleSaveAndExit = () => {
    setExitDialogOpen(false);
    // Nếu đã trả lời và đang ở câu cuối -> kết thúc phiên như bấm Tiếp (lưu Dexie, hiện kết quả), không lưu nháp
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
    router.push(isDue ? '/on-tap' : '/luyen-tap');
  };

  // Thoát: Bỏ phiên (xóa nháp)
  const handleDiscardAndExit = () => {
    clearPracticeDraft();
    setExitDialogOpen(false);
    router.push(isDue ? '/on-tap' : '/luyen-tap');
  };

  // Hủy thoát: Tiếp tục làm
  const handleCancelExit = () => {
    setExitDialogOpen(false);
    if (!answered && !isPaused) {
      resumeQuestionTimer();
    }
  };

  // Nếu phiên đã hoàn tất: hiển thị màn hình kết quả
  if (isFinished) {
    const displaySession: PracticeSession = savedSession ?? summarizeSession(config, allResults, sessionDuration);

    return (
      <SessionResult
        session={displaySession}
        incorrectQuestions={incorrectQuestions}
        saveError={saveError}
        onRetrySave={() => void saveResults(allResults)}
        mode={config.mode}
        nextReviewLine={nextReviewLine}
        userAnswers={userAnswers}
      />
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const renderQuestionComponent = () => {
    switch (currentQuestion.type) {
      case 'matching':
        return (
          <QuestionMatching
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
      case 'cloze':
        return (
          <QuestionCloze
            key={currentQuestion.id}
            question={currentQuestion}
            answered={answered}
            onAnswer={handleAnswer}
          />
        );
      case 'mc':
      default:
        return (
          <QuestionMc
            key={currentQuestion.id}
            question={currentQuestion}
            answered={answered}
            onAnswer={handleAnswer}
          />
        );
    }
  };

  const userAnswerText = lastResult?.userAnswer;

  return (
    <main className="fixed inset-0 z-40 mx-auto flex w-full max-w-xl flex-col bg-background overflow-hidden px-4">
      {/* Thanh điều hướng và thông tin phiên */}
      <header className="flex h-14 shrink-0 items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="quiz"
          className="size-11 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => {
            if (!answered && !isPaused) pauseQuestionTimer();
            setExitDialogOpen(true);
          }}
          aria-label="Thoát phiên"
        >
          <X className="size-6" />
        </Button>

        <span className="text-sm font-medium text-muted-foreground">
          {isDue
            ? `Ôn tập · ${currentIndex + 1}/${questions.length}`
            : `${currentIndex + 1}/${questions.length}`}
        </span>

        {/* Nút tạm dừng / tiếp tục đồng hồ */}
        <Button
          type="button"
          variant="ghost"
          size="quiz"
          className="h-11 min-w-11 px-2.5 text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          onClick={togglePause}
          disabled={answered || isFinished}
          aria-label={isPaused ? 'Tiếp tục bấm giờ' : 'Tạm dừng bấm giờ'}
        >
          {isPaused ? (
            <Play className="size-4 fill-current text-primary" />
          ) : (
            <Pause className="size-4" />
          )}
          <span className="text-sm font-medium tabular-nums">
            {formatDuration(sessionDuration)}
          </span>
        </Button>
      </header>

      {/* Tiến độ phiên: scaleX để chỉ chạy trên compositor */}
      <div className="h-1 shrink-0 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div
          className="h-full origin-left bg-primary transition-transform duration-250 ease-smooth-out"
          style={{ transform: `scaleX(${(currentIndex + (answered ? 1 : 0)) / questions.length})` }}
        />
      </div>

      {/* VÙNG CÂU HỎI: co được, min-h-0 + overflow-y-auto để chính nó thu nhỏ */}
      <section
        key={`prompt-${currentQuestion.id}`}
        className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto py-4 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-250 motion-safe:ease-in-out"
      >
        {/* Lớp phủ khi tạm dừng */}
        {isPaused && !answered && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/95 backdrop-blur-xs p-6 text-center gap-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150">
            <div className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
              <Pause className="size-7" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-foreground">Phiên đang tạm dừng</h2>
              <p className="mt-1 text-sm text-muted-foreground">Đồng hồ và thời gian làm bài đã được dừng lại.</p>
            </div>
            <Button
              size="quiz"
              className="w-full max-w-xs"
              onClick={togglePause}
            >
              Tiếp tục làm bài
            </Button>
          </div>
        )}

        {currentQuestion.type !== 'listening' ? (
          <>
            {currentQuestion.context && (
              <p className="mb-2 text-sm text-muted-foreground">
                {currentQuestion.context}
              </p>
            )}
            <div className="jp jp-quiz">
              <Furigana text={currentQuestion.prompt} />
            </div>
          </>
        ) : (
          <p className="text-sm font-medium text-muted-foreground">
            Nghe và nhập lại câu tiếng Nhật
          </p>
        )}
      </section>

      {/* VÙNG TRẢ LỜI: luôn ở nửa dưới */}
      <section key={`answer-${currentQuestion.id}`} className="shrink-0 pb-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-250 motion-safe:ease-in-out">
        {renderQuestionComponent()}

        {/* VÙNG PHẢN HỒI: hiện sau khi trả lời */}
        {answered && lastResult && (
          <div
            aria-live="polite"
            className={cn(
              'mt-4 rounded-xl border p-4 transition-colors duration-150',
              'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 motion-safe:ease-out',
              lastResult.isCorrect
                ? 'border-success/30 bg-success/10'
                : 'border-destructive/30 bg-destructive/10',
            )}
          >
            <div className="flex items-center gap-2 font-medium">
              {lastResult.isCorrect ? (
                <>
                  <Check className="size-5 shrink-0 text-success animate-draw-check" />
                  <span className="text-success">Chính xác!</span>
                </>
              ) : (
                <>
                  <X className="size-5 shrink-0 text-destructive" />
                  <span className="text-destructive">Chưa chính xác</span>
                </>
              )}
            </div>

            {!lastResult.isCorrect && (
              <div className="mt-2 space-y-1 text-sm">
                {userAnswerText !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Bạn trả lời: </span>
                    {userAnswerText.trim().length > 0 ? (
                      <span className="jp jp-vocab font-medium text-destructive">
                        {userAnswerText}
                      </span>
                    ) : (
                      <span className="italic text-muted-foreground">(Chưa biết)</span>
                    )}
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Đáp án đúng: </span>
                  <span className="jp jp-vocab font-medium text-foreground">
                    {correctAnswerText}
                  </span>
                </div>
                {currentHint && (
                  <div className="mt-2 rounded-lg border border-warning/40 bg-warning/10 p-2.5 text-xs text-warning-foreground">
                    💡 {currentHint}
                  </div>
                )}
              </div>
            )}

            {currentQuestion.explanationVi && (
              <p className="mt-1 text-sm text-muted-foreground">
                {currentQuestion.explanationVi}
              </p>
            )}

            <div className="mt-4">
              <Button
                size="quiz"
                className="w-full"
                onClick={handleNext}
              >
                {currentIndex + 1 < questions.length ? 'Tiếp tục' : 'Xem kết quả'}
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Hộp thoại xác nhận thoát với 3 lựa chọn */}
      <AlertDialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isDue ? 'Tạm dừng hoặc thoát phiên ôn tập?' : 'Tạm dừng hoặc thoát phiên luyện tập?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có thể lưu lại tiến độ để học tiếp sau, hoặc bỏ phiên để xóa dữ liệu làm dở.
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
