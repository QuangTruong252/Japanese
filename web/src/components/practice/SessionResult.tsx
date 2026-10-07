'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
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
  isPlanLoading = false,
  blockedReason,
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
  isPlanLoading?: boolean;
  blockedReason?: string | null;
}) {
  const router = useRouter();
  const isDue = mode === 'due';

  // Finding 9: Gom toàn bộ danh sách bài học từ config hoặc session
  const lessons = useMemo(() => {
    const list = config?.lessons ?? session.selectedLessons ?? [];
    return [...new Set(list)].sort((a, b) => a - b);
  }, [config?.lessons, session.selectedLessons]);

  const lessonsParam = lessons.length > 0 ? lessons.join(',') : '';
  const practiceHref = lessonsParam ? `/luyen-tap?lessons=${lessonsParam}` : '/luyen-tap';
  const lessonsLabel = lessons.length > 0 ? `Bài ${lessons.join(', ')}` : 'Luyện tập';
  const primaryLesson = lessons[0];
  const lessonHref = primaryLesson ? `/hoc/${primaryLesson}` : '/hoc';

  useEffect(() => {
    router.prefetch('/luyen-tap');
    router.prefetch('/on-tap');
    router.prefetch('/');
    if (primaryLesson) {
      router.prefetch(lessonHref);
    }
  }, [router, lessonHref, primaryLesson]);

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
    router.push(href);
  };

  const minutes = Math.max(1, Math.round(session.durationSeconds / 60));
  const durationText = `${minutes} phút`;

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
          isPlanLoading ? (
            <Button size="quiz" className="w-full" disabled>
              Đang lưu và tính toán...
            </Button>
          ) : hasMoreDue ? (
            <Button
              size="quiz"
              className="w-full"
              onClick={onContinueReview ?? (() => router.push('/on-tap'))}
            >
              Ôn lô tiếp
            </Button>
          ) : blockedReason === 'no-audio' ? (
            <Button
              size="quiz"
              className="w-full"
              onClick={() => router.push('/cai-dat/audio')}
            >
              Cài đặt âm thanh
            </Button>
          ) : (
            <Button
              size="quiz"
              className="w-full"
              onClick={() => router.push('/')}
            >
              Về Bảng tin
            </Button>
          )
        ) : (
          <Button
            size="quiz"
            className="w-full"
            onClick={() => router.push(practiceHref)}
          >
            Luyện tiếp
          </Button>
        )}
      </PaperSlip>

      {/* Lỗi lưu bộ nhớ máy nếu có (Finding 11: size="quiz" variant="outline" text-destructive) */}
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
              <Button
                size="quiz"
                variant="outline"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onRetrySave}
              >
                Thử lại
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Thông báo trạng thái lô ôn tập khi không còn mục tiếp tục */}
      {isDue && !isPlanLoading && !hasMoreDue && (
        <>
          {blockedReason === 'no-audio' ? (
            <div className="space-y-1 rounded-xl border border-warning/40 bg-warning/10 p-4 text-warning">
              <p className="font-semibold text-sm">
                Các mục đến hạn còn lại chỉ có câu dạng nghe, nhưng thiết bị chưa có giọng tiếng Nhật (ja-JP).
              </p>
              <p className="text-xs text-muted-foreground">
                Hạn ôn của các mục này được giữ nguyên. Bạn có thể cài đặt giọng đọc để tiếp tục.
              </p>
            </div>
          ) : blockedReason === 'no-questions' ? (
            <div className="space-y-1 rounded-xl border border-border bg-card p-4">
              <p className="font-semibold text-sm text-foreground">
                Không thể tạo câu hỏi cho các mục còn lại. Hạn ôn được giữ nguyên.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-4 text-sm font-medium text-success">
              <CheckCircle2 className="size-5 shrink-0" />
              <span>Đã xong các mục đến hạn lúc này</span>
            </div>
          )}
        </>
      )}

      {/* Danh sách câu cần xem lại hoặc trạng thái hoàn hảo (Finding 10) */}
      {incorrectQuestions.length === 0 ? (
        <div className="flex items-center gap-2.5 py-4 text-sm font-medium text-success">
          <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
          <span>Đúng tất cả {session.totalQuestions} câu</span>
        </div>
      ) : (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">
            Câu cần xem lại ({incorrectQuestions.length})
          </h2>
          <div className="divide-y divide-border">
            {incorrectQuestions.map((q) => {
              const answerText = Array.isArray(q.answer) ? q.answer.join(', ') : q.answer;
              const userAnswer = userAnswerFor(userAnswers, q);

              return (
                <div key={q.id} className="space-y-2 py-4">
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

      {/* Các dòng lối tắt: không đóng khung thẻ, ngăn cách bằng đường kẻ hairline (Finding 8, 10) */}
      <div className="divide-y divide-border border-t border-b border-border">
        {incorrectQuestions.length > 0 && (
          <button
            type="button"
            onClick={handleRetryIncorrect}
            className="flex min-h-14 w-full items-center gap-3 py-3 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring"
          >
            <span className="shrink-0 text-muted-foreground [&_svg]:size-5" aria-hidden="true">
              <RotateCcw className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-medium text-foreground">Làm lại câu sai</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Luyện lại {incorrectQuestions.length} câu chưa đúng
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        )}
        {isDue ? (
          <>
            <LinkRow
              href="/on-tap/diem-yeu"
              icon={<AlertCircle className="size-5" />}
              title="Xem điểm yếu của tôi"
            />
            <LinkRow
              href="/on-tap"
              icon={<BookOpen className="size-5" />}
              title="Về trang ôn tập"
            />
          </>
        ) : (
          lessons.length === 1 && (
            <LinkRow
              href={lessonHref}
              icon={<BookOpen className="size-5" />}
              title={`Về Bài ${lessons[0]}`}
            />
          )
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
