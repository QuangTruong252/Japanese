'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { FeedbackPanel, PauseLayer, QuestionPrompt, SessionHeader, SessionShell } from './SessionFrame';
import { savePracticeSession } from '@/lib/practice-write';
import { summarizeIncorrect, summarizeSession } from '@/lib/practice';
import { describeNextReviews } from '@/lib/review-queue';
import {
  clearPracticeDraft,
  savePracticeDraft,
  PRACTICE_DRAFT_VERSION,
  shouldAdvanceOnKey,
} from '@/lib/practice-draft';
import type {
  AnswerResult,
  PracticeConfig,
  PracticeSession,
  QuestionItem,
} from '@/types';

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
  // Focus mặc định của dialog thoát nằm ở nút đầu tiên ("Bỏ phiên"); Esc rồi Space sẽ xóa phiên. Đặt focus vào nút an toàn.
  const keepGoingRef = useRef<HTMLButtonElement>(null);

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
    if (isFinished) return;
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
  }, [isFinished, currentIndex, questions, startQuestionTimer, allResults, sessionDuration, config, saveResults]);

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
  }, [answered, exitDialogOpen, handleNext, isFinished, isPaused, pauseQuestionTimer]);

  // Câu sai và câu trả lời theo từng câu (một từ có thể nằm ở nhiều câu)
  const { incorrectQuestions, userAnswers } = useMemo(
    () => summarizeIncorrect(questions, allResults),
    [questions, allResults],
  );

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

  return (
    <SessionShell>
      {/* Thông báo tiếp cận cho Screen Reader */}
      <div role="status" className="sr-only">
        {`Câu ${currentIndex + 1} trên ${questions.length}`}
      </div>

      <SessionHeader
        regionLabel="Phiên luyện tập"
        exitLabel="Thoát phiên"
        onExit={() => {
          if (!answered && !isPaused) pauseQuestionTimer();
          setExitDialogOpen(true);
        }}
        index={currentIndex}
        total={questions.length}
        progress={(currentIndex + (answered ? 1 : 0)) / questions.length}
        duration={sessionDuration}
        isPaused={isPaused}
        pauseLabel={isPaused ? 'Tiếp tục làm bài' : 'Tạm dừng phiên'}
        pauseDisabled={answered || isFinished}
        onTogglePause={togglePause}
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {isPaused && !answered && (
          <PauseLayer title="Phiên đang tạm dừng" resumeLabel="Tiếp tục làm bài" onResume={togglePause} />
        )}

        {/* Chỉ vùng câu hỏi cuộn khi tràn; khối phản hồi luôn nằm dưới cùng */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2">
          <div
            key={currentQuestion.id}
            className="my-auto w-full space-y-6 py-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-250 motion-safe:ease-in-out"
          >
            <QuestionPrompt question={currentQuestion} />
            {renderQuestionComponent()}
          </div>
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

      {/* Hộp thoại xác nhận thoát với 3 lựa chọn */}
      <AlertDialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <AlertDialogContent initialFocus={keepGoingRef}>
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
