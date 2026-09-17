'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
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
}: {
  questions: QuestionItem[];
  config: PracticeConfig;
}) {
  const router = useRouter();
  const { setCurrentQuestionIndex } = useUIStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [allResults, setAllResults] = useState<AnswerResult[]>([]);
  const [answered, setAnswered] = useState(false);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);

  const [sessionDuration, setSessionDuration] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [savedSession, setSavedSession] = useState<PracticeSession | null>(null);
  const [nextReviewLine, setNextReviewLine] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);

  const startedAtRef = useRef<number>(0);
  const currentQuestion = questions[currentIndex];
  // Phiên ôn và phiên luyện dùng chung toàn bộ khung này; chỉ khác nhãn và đường thoát.
  const isDue = config.mode === 'due';

  // Đặt lại con trỏ câu trong store khi mount và ghi nhận mốc thời gian bắt đầu
  useEffect(() => {
    setCurrentQuestionIndex(0);
    startedAtRef.current = performance.now();
  }, [setCurrentQuestionIndex]);

  // Đồng hồ tổng phiên
  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setSessionDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished]);

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
      const startTime = startedAtRef.current || performance.now();
      const elapsedMs = Math.max(1, Math.round(performance.now() - startTime));
      const measured = results.length === 1 ? [{ ...results[0]!, elapsedMs }] : results;

      setAllResults((prev) => [...prev, ...measured]);
      const hasIncorrect = measured.some((r) => !r.isCorrect);
      const representativeResult = hasIncorrect
        ? (measured.find((r) => !r.isCorrect) ?? measured[0])
        : measured[0];
      setLastResult(representativeResult ?? null);
      setAnswered(true);
    },
    [answered],
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
      startedAtRef.current = performance.now();
    } else {
      setIsFinished(true);
      void saveResults(allResults);
    }
  }, [currentIndex, questions.length, setCurrentQuestionIndex, saveResults, allResults]);

  // Phím tắt: Escape mở dialog thoát, Space sang câu tiếp khi đã trả lời
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (e.key === 'Escape') {
        e.preventDefault();
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
  }, [answered, handleNext]);

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

  return (
    <main className="fixed inset-0 z-40 mx-auto flex w-full max-w-xl flex-col bg-background overflow-hidden px-4">
      {/* Thanh điều hướng và thông tin phiên */}
      <header className="flex h-14 shrink-0 items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="quiz"
          className="size-12 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => setExitDialogOpen(true)}
          aria-label="Thoát phiên"
        >
          <X className="size-6" />
        </Button>

        <span className="text-sm font-medium text-muted-foreground">
          {isDue
            ? `Ôn tập · ${currentIndex + 1}/${questions.length}`
            : `${currentIndex + 1}/${questions.length}`}
        </span>

        <span className="text-sm font-medium text-muted-foreground tabular-nums">
          ⏱ {formatDuration(sessionDuration)}
        </span>
      </header>

      {/* VÙNG CÂU HỎI: co được, min-h-0 + overflow-y-auto để chính nó thu nhỏ */}
      <section className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto py-4 text-center">
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
      <section className="shrink-0 pb-4">
        {renderQuestionComponent()}

        {/* VÙNG PHẢN HỒI: hiện sau khi trả lời */}
        {answered && lastResult && (
          <div
            aria-live="polite"
            className={cn(
              'mt-4 rounded-xl border p-4 transition-colors duration-150',
              lastResult.isCorrect
                ? 'border-success/30 bg-success/10'
                : 'border-destructive/30 bg-destructive/10',
            )}
          >
            <div className="flex items-center gap-2 font-medium">
              {lastResult.isCorrect ? (
                <>
                  <Check className="size-5 shrink-0 text-success" />
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
              <div className="mt-2 text-sm">
                <span className="text-muted-foreground">Đáp án đúng: </span>
                <span className="jp jp-vocab font-medium text-foreground">
                  {correctAnswerText}
                </span>
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

      {/* Hộp thoại xác nhận thoát */}
      <AlertDialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isDue ? 'Thoát phiên ôn tập?' : 'Thoát phiên luyện tập?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tiến độ của phiên này sẽ không được lưu nếu bạn thoát bây giờ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="quiz">Tiếp tục làm</AlertDialogCancel>
            <AlertDialogAction
              size="quiz"
              variant="destructive"
              onClick={() => router.push(isDue ? '/on-tap' : '/luyen-tap')}
            >
              Thoát
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
