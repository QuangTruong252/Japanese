'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Furigana } from '@/components/Furigana';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import {
  savePracticeDraft,
  PRACTICE_DRAFT_VERSION,
} from '@/lib/practice-draft';
import type { PracticeConfig, PracticeSession, QuestionItem } from '@/types';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function SessionResult({
  session,
  incorrectQuestions,
  saveError,
  onRetrySave,
  mode = 'lesson',
  nextReviewLine,
  userAnswers = {},
}: {
  session: PracticeSession;
  incorrectQuestions: QuestionItem[];
  saveError?: string | null;
  onRetrySave?: () => void;
  mode?: PracticeConfig['mode'];
  nextReviewLine?: string | null;
  userAnswers?: Record<string, string>;
}) {
  const router = useRouter();
  useEffect(() => {
    router.prefetch('/luyen-tap');
    router.prefetch('/');
  }, [router]);
  const percentage = Math.round(session.accuracyRate * 100);
  const isDue = mode === 'due';

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

    const href = `/luyen-tap/phien?resume=${Date.now()}`;
    // Đang ở trang phiên: đổi query tại chỗ (App Router đồng bộ useSearchParams, không gọi
    // server) để làm lại câu sai được cả khi mất mạng. Từ trang khác mới cần điều hướng.
    if (window.location.pathname === '/luyen-tap/phien') window.history.pushState(null, '', href);
    else router.push(href);
  };

  return (
    <main className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <div className="space-y-1 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-400 motion-safe:ease-in-out motion-safe:fill-mode-both">
        <h1 className="font-heading text-xl font-medium">
          {isDue ? 'Kết quả ôn tập' : 'Kết quả luyện tập'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isDue
            ? 'Đã hoàn thành phiên ôn tập theo lịch'
            : 'Đã hoàn thành phiên luyện tập tiếng Nhật'}
        </p>
      </div>

      {/* Thông báo lỗi ghi Dexie nếu có */}
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
          {onRetrySave && (
            <div className="pt-1">
              <Button size="sm" variant="destructive" onClick={onRetrySave}>
                Thử lại
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Thẻ tóm tắt kết quả */}
      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-card p-4 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-400 motion-safe:ease-in-out motion-safe:fill-mode-both motion-safe:delay-40">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Tỷ lệ đúng</span>
          <p className="text-2xl font-bold tracking-tight text-primary">
            {percentage}%
          </p>
        </div>
        <div className="space-y-1 border-x border-border">
          <span className="text-xs text-muted-foreground">Số câu đúng</span>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {session.correctCount}/{session.totalQuestions}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Thời lượng</span>
          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatDuration(session.durationSeconds)}
          </p>
        </div>
      </div>

      {isDue && nextReviewLine && (
        <p className="text-center text-sm text-muted-foreground">
          Lần ôn kế tiếp: {nextReviewLine}
        </p>
      )}

      {/* Danh sách câu sai hoặc lời khen */}
      {incorrectQuestions.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-success/30 bg-success/10 p-4 text-center text-sm font-medium text-success">
          <CheckCircle2 className="size-5 shrink-0" />
          <span>Hoàn hảo! Bạn đã trả lời đúng tất cả các câu hỏi.</span>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            Câu sai ({incorrectQuestions.length})
          </h2>
          <div className="space-y-3">
            {incorrectQuestions.map((q) => {
              const answerText = Array.isArray(q.answer) ? q.answer.join(', ') : q.answer;
              const userAnswer = userAnswers[q.targetId];
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
                    <p className="text-xs text-muted-foreground">
                      {q.explanationVi}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Điều hướng */}
      <div className="flex flex-col gap-3 pt-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-400 motion-safe:ease-in-out motion-safe:fill-mode-both motion-safe:delay-80">
        {incorrectQuestions.length > 0 && (
          <Button
            size="quiz"
            className="w-full"
            onClick={handleRetryIncorrect}
          >
            <RotateCcw className="mr-2 size-5" />
            Làm lại câu sai
          </Button>
        )}
        <Button
          size="quiz"
          variant={incorrectQuestions.length > 0 ? 'outline' : 'default'}
          className="w-full"
          onClick={() => router.push(isDue ? '/on-tap' : '/luyen-tap')}
        >
          {isDue ? 'Về ôn tập' : 'Luyện phiên mới'}
        </Button>
        <Button
          size="quiz"
          variant="outline"
          className="w-full"
          onClick={() => router.push('/')}
        >
          Về trang chủ
        </Button>
      </div>
    </main>
  );
}
