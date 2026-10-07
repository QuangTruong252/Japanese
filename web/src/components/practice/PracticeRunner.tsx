'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Lightbulb, Pause, X } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
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
import { summarizeIncorrect, summarizeSession } from '@/lib/practice';
import { describeNextReviews } from '@/lib/review-queue';
import {
  clearPracticeDraft,
  savePracticeDraft,
  particleHint,
  PRACTICE_DRAFT_VERSION,
} from '@/lib/practice-draft';
import { cn } from '@/lib/utils';
import { containsJapanese, stripFurigana } from '@/lib/japanese';
import type {
  AnswerResult,
  PracticeConfig,
  PracticeSession,
  QuestionItem,
} from '@/types';

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
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
  // Nút thoát điều hướng về trang trước: prefetch để thoát được cả khi đang mất mạng.
  useEffect(() => {
    router.prefetch(isDue ? '/on-tap' : '/luyen-tap');
  }, [router, isDue]);

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

  // Ghi nhận mốc thời gian bắt đầu câu đầu tiên (chỉ chạy khi mount)
  useEffect(() => {
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
  }, [currentIndex, questions, startQuestionTimer, allResults, sessionDuration, config, saveResults]);

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

      if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
        if (answered) {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answered, handleNext, isPaused, pauseQuestionTimer]);

  // Chỉ dẫn ngữ cảnh câu hỏi cho vùng câu hỏi
  const instruction = useMemo(() => {
    if (currentQuestion?.context) return currentQuestion.context;
    switch (currentQuestion?.type) {
      case 'mc':
        return 'Chọn nghĩa đúng';
      case 'cloze':
        return 'Điền từ thích hợp vào chỗ trống';
      case 'listening':
        return 'Nghe và nhập lại câu tiếng Nhật';
      case 'matching':
        return 'Ghép các cặp từ tương ứng';
      case 'reorder':
        return 'Sắp xếp các từ thành câu hoàn chỉnh';
      default:
        return 'Chọn đáp án đúng';
    }
  }, [currentQuestion]);

  // Câu sai và câu trả lời theo từng câu (một từ có thể nằm ở nhiều câu)
  const { incorrectQuestions, userAnswers } = useMemo(
    () => summarizeIncorrect(questions, allResults),
    [questions, allResults],
  );

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
    <main className="fixed inset-0 z-40 mx-auto flex w-full max-w-xl flex-col bg-background overflow-hidden px-4 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] sm:px-6">
      {/* Thông báo tiếp cận cho Screen Reader */}
      <div role="status" className="sr-only">
        {`Câu ${currentIndex + 1} trên ${questions.length}`}
      </div>

      {/* Thanh trên: nút đóng (×), tiến độ mỏng, nút tạm dừng, số câu "7/20" bên phải */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-1">
        <Button
          type="button"
          variant="ghost"
          size="quiz"
          className="size-12 shrink-0 px-0 text-muted-foreground hover:text-foreground"
          onClick={() => {
            if (!answered && !isPaused) pauseQuestionTimer();
            setExitDialogOpen(true);
          }}
          aria-label="Thoát phiên"
        >
          <X className="size-5" aria-hidden="true" />
        </Button>

        <div className="min-w-0 flex-1 mx-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div
            className="h-full origin-left bg-primary transition-transform duration-250 ease-smooth-out"
            style={{ transform: `scaleX(${(currentIndex + (answered ? 1 : 0)) / questions.length})` }}
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="quiz"
          className="size-12 shrink-0 px-0 sm:w-auto sm:px-2.5 sm:gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={togglePause}
          disabled={answered || isFinished}
          aria-label="Tạm dừng phiên"
        >
          <Pause className="size-5" aria-hidden="true" />
          <span className="hidden sm:inline text-sm font-medium tabular-nums">
            {formatDuration(sessionDuration)}
          </span>
        </Button>

        <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
          {currentIndex + 1}/{questions.length}
        </span>
      </header>

      {/* KHÔNG CUỘN TRANG (Finding 3): Grid 3 vùng - chỉ vùng câu hỏi được cuộn nếu dài, footer và feedback luôn cố định */}
      <div className="relative grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto_auto] overflow-hidden">
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

        {/* VÙNG CÂU HỎI (Finding 1, 3): chỉ dẫn mờ, prompt chữ Nhật to; chỉ cuộn khi thực sự tràn, không hiện loa trước khi chấm */}
        <section
          key={`prompt-${currentQuestion.id}`}
          className="flex min-h-0 flex-col items-center overflow-y-auto px-2 py-4 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-250 motion-safe:ease-in-out"
        >
          <div className="my-auto flex w-full max-w-full flex-col items-center justify-center">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              {instruction}
            </p>

            {currentQuestion.type !== 'listening' ? (
              <div
                className={cn(
                  'jp font-bold tracking-tight text-foreground text-center break-words max-w-full',
                  stripFurigana(currentQuestion.prompt).length <= 12
                    ? 'text-5xl sm:text-6xl text-[3.5rem] leading-none'
                    : 'text-xl sm:text-2xl font-semibold jp-quiz',
                )}
              >
                <Furigana text={currentQuestion.prompt} />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Nghe và nhập lại câu tiếng Nhật
                </p>
              </div>
            )}
          </div>
        </section>

        {/* VÙNG TRẢ LỜI (nửa dưới, trong tầm với ngón cái): các options full-width 56px, xl radius, card + hairline, 8px gap */}
        <section
          key={`answer-${currentQuestion.id}`}
          className="w-full shrink-0 pb-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-250 motion-safe:ease-in-out"
        >
          {renderQuestionComponent()}
        </section>

        {/* VÙNG PHẢN HỒI (tấm trượt lên từ đáy sau khi trả lời, motion-safe only) */}
        {answered && lastResult && (
          <div
            role="region"
            aria-label="Phản hồi kết quả"
            aria-live="polite"
            className={cn(
              'shrink-0 rounded-t-2xl border-t-2 bg-card p-4 sm:p-5 shadow-lg',
              'transition-colors duration-150',
              'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-250 motion-safe:ease-smooth-out',
              lastResult.isCorrect ? 'border-success' : 'border-destructive',
            )}
          >
            <div className="flex flex-col gap-3">
              {/* Icon + "Đúng rồi" / "Chưa đúng" + Loa phát âm sau khi chấm (Finding 1, 6) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full',
                      lastResult.isCorrect
                        ? 'bg-success/15 text-success'
                        : 'bg-destructive/15 text-destructive',
                    )}
                  >
                    {lastResult.isCorrect ? (
                      <Check className="size-5 stroke-[2.5]" aria-hidden="true" />
                    ) : (
                      <X className="size-5 stroke-[2.5]" aria-hidden="true" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-base font-semibold',
                      lastResult.isCorrect ? 'text-success' : 'text-destructive',
                    )}
                  >
                    {lastResult.isCorrect ? 'Đúng rồi' : 'Chưa đúng'}
                  </span>
                </div>

                {/* Loa phát âm câu hỏi chỉ xuất hiện sau khi chấm (Finding 1) */}
                {containsJapanese(currentQuestion.prompt) && currentQuestion.type !== 'listening' && (
                  <SpeakButton
                    text={stripFurigana(currentQuestion.prompt)}
                    label="câu hỏi"
                  />
                )}
              </div>

              {/* Câu đầy đủ kèm furigana và nghĩa (khi có trong dữ liệu) - Finding 6 */}
              {(currentQuestion.explanationJp || currentQuestion.explanationVi) && (
                <div className="space-y-1 rounded-lg bg-muted/40 p-3">
                  {currentQuestion.explanationJp && (
                    <div className="jp jp-example font-medium text-foreground leading-loose">
                      <Furigana text={currentQuestion.explanationJp} />
                    </div>
                  )}
                  {currentQuestion.explanationVi && (
                    <p className="text-sm text-muted-foreground">
                      {currentQuestion.explanationVi}
                    </p>
                  )}
                </div>
              )}

              {/* Hiển thị thêm đáp án đúng nếu câu sai ở các dạng không có options */}
              {!lastResult.isCorrect && currentQuestion.type !== 'mc' && (
                <div className="space-y-1 text-sm">
                  {userAnswerText !== undefined && userAnswerText.trim().length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Bạn trả lời: </span>
                      <span className="jp font-medium text-destructive line-through">
                        {userAnswerText}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Đáp án đúng: </span>
                    <Furigana
                      text={correctAnswerText}
                      zoomable={false}
                      className="jp font-medium text-success"
                    />
                  </div>
                </div>
              )}

              {/* Gợi ý trợ từ khi làm sai */}
              {!lastResult.isCorrect && currentHint && (
                <p className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 p-2 text-xs text-foreground">
                  <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-info" aria-hidden="true" />
                  <span><span className="font-semibold">Gợi ý:</span> {currentHint}</span>
                </p>
              )}

              {/* Nút son duy nhất "Tiếp tục" (size quiz, full width on mobile) */}
              <div className="pt-1">
                <Button
                  size="quiz"
                  className="w-full"
                  onClick={handleNext}
                >
                  {currentIndex + 1 < questions.length ? 'Tiếp tục' : 'Xem kết quả'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

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
