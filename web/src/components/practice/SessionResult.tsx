'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Home,
  RotateCcw,
  X,
} from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { Button } from '@/components/ui/button';
import { LinkRow, PaperSlip, Stage } from '@/components/PaperStage';
import {
  savePracticeDraft,
  PRACTICE_DRAFT_VERSION,
} from '@/lib/practice-draft';
import { userAnswerFor } from '@/lib/practice';
import type { PracticeConfig, PracticeSession, QuestionItem } from '@/types';

export function SessionResult({
  session,
  incorrectQuestions,
  saveError,
  onRetrySave,
  mode = 'lesson',
  nextReviewLine,
  userAnswers = {},
  config,
  hasMoreDue = false,
  onContinueReview,
}: {
  session: PracticeSession;
  incorrectQuestions: QuestionItem[];
  saveError?: string | null;
  onRetrySave?: () => void;
  mode?: PracticeConfig['mode'];
  nextReviewLine?: string | null;
  userAnswers?: Record<string, string>;
  config?: PracticeConfig;
  hasMoreDue?: boolean;
  onContinueReview?: () => void;
}) {
  const router = useRouter();
  const primaryLesson = config?.lessons?.[0] ?? session.selectedLessons?.[0];
  const lessonHref = primaryLesson ? `/hoc/${primaryLesson}` : '/hoc';
  const isDue = mode === 'due';

  useEffect(() => {
    router.prefetch('/luyen-tap');
    router.prefetch('/on-tap');
    router.prefetch('/');
    router.prefetch(lessonHref);
  }, [router, lessonHref]);

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
    if (window.location.pathname === '/luyen-tap/phien') {
      window.history.pushState(null, '', href);
    } else {
      router.push(href);
    }
  };

  const minutes = Math.max(1, Math.round(session.durationSeconds / 60));
  const durationText = `${minutes} phút`;
  const lessonsLabel = primaryLesson ? `Bài ${primaryLesson}` : 'Luyện tập';

  return (
    <main className="mx-auto w-full max-w-xl space-y-6 px-4 py-6 sm:py-8">
      {/* Thông báo tiếp cận cho Screen Reader */}
      <div role="status" className="sr-only">
        {isDue
          ? `Đã hoàn thành phiên ôn tập. Đã ôn ${session.totalQuestions} mục, ${session.correctCount} câu đúng.`
          : `Đã hoàn thành phiên luyện tập. ${session.correctCount} trên ${session.totalQuestions} câu đúng.`}
      </div>

      {/* Sân khấu nhỏ (160px tall, mờ vào giấy) */}
      <Stage
        asset={{
          src: '/assets/illustrations/scenes/eating-together-v1.webp',
          width: 1200,
          height: 600,
          alt: { vi: '' },
        }}
        sizes="(max-width: 640px) 100vw, 576px"
        imageClassName="h-40 w-full object-cover"
      />

      {/* Mảnh giấy lấn lên mép dưới cảnh, chứa tiêu đề số liệu và nút son duy nhất */}
      <PaperSlip className="-mt-8 space-y-4">
        {isDue ? (
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Đã ôn {session.totalQuestions} mục
            </h1>
            {nextReviewLine ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Lần ôn kế tiếp: {nextReviewLine}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                {durationText} · Ôn tập
              </p>
            )}
          </div>
        ) : (
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {session.correctCount}/{session.totalQuestions} câu đúng
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {durationText} · {lessonsLabel}
            </p>
          </div>
        )}

        {/* Nút son duy nhất */}
        {isDue ? (
          hasMoreDue && (
            <Button
              size="quiz"
              className="w-full"
              onClick={onContinueReview ?? (() => router.push('/on-tap'))}
            >
              Ôn lô tiếp
            </Button>
          )
        ) : (
          <Button
            size="quiz"
            className="w-full"
            onClick={() => router.push(primaryLesson ? `/luyen-tap?lessons=${primaryLesson}` : '/luyen-tap')}
          >
            Luyện tiếp
          </Button>
        )}
      </PaperSlip>

      {/* Lỗi lưu bộ nhớ máy nếu có */}
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

      {/* Danh sách câu cần xem lại hoặc trạng thái hoàn hảo */}
      {incorrectQuestions.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-4 text-sm font-medium text-success">
          <CheckCircle2 className="size-5 shrink-0" />
          <span>Hoàn hảo! Bạn đã trả lời đúng tất cả các câu hỏi.</span>
        </div>
      ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            Câu cần xem lại ({incorrectQuestions.length})
          </h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {incorrectQuestions.map((q) => {
              const answerText = Array.isArray(q.answer) ? q.answer.join(', ') : q.answer;
              const userAnswer = userAnswerFor(userAnswers, q);

              return (
                <div key={q.id} className="space-y-2 p-4">
                  {/* Prompt tiếng Nhật */}
                  <div className="jp text-base font-medium text-foreground">
                    <Furigana text={q.prompt} />
                  </div>

                  {/* Câu trả lời của người học bị gạch ngang màu destructive kèm icon X */}
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <X className="size-4 shrink-0" aria-hidden="true" />
                    <span className="text-xs text-muted-foreground">Bạn trả lời:</span>
                    <span className="jp font-medium line-through">
                      {userAnswer && userAnswer.trim().length > 0 ? userAnswer : '(Chưa biết)'}
                    </span>
                  </div>

                  {/* Đáp án đúng màu success kèm icon Check */}
                  <div className="flex items-center gap-2 text-sm text-success">
                    <Check className="size-4 shrink-0" aria-hidden="true" />
                    <span className="text-xs text-muted-foreground">Đáp án đúng:</span>
                    <span className="jp font-medium">
                      <Furigana text={answerText} zoomable={false} />
                    </span>
                  </div>

                  {/* Giải thích tiếng Việt nếu có */}
                  {q.explanationVi && (
                    <p className="pt-1 text-xs text-muted-foreground">
                      {q.explanationVi}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Các dòng lối tắt: LinkRow có đường mảnh và chevron */}
      <div className="divide-y divide-border rounded-xl border border-border bg-card px-2">
        {incorrectQuestions.length > 0 && (
          <LinkRow
            href="#"
            onClick={handleRetryIncorrect}
            icon={<RotateCcw className="size-5" />}
            title="Làm lại câu sai"
            detail={`Luyện lại ${incorrectQuestions.length} câu chưa đúng`}
          />
        )}
        {primaryLesson && !isDue && (
          <LinkRow
            href={lessonHref}
            icon={<BookOpen className="size-5" />}
            title={`Về Bài ${primaryLesson}`}
          />
        )}
        <LinkRow
          href="/"
          icon={<Home className="size-5" />}
          title="Về Bảng tin"
        />
      </div>
    </main>
  );
}
