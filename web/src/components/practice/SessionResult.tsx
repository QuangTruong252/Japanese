'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, Check, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { FeatureIcon, type FeatureIconName } from '@/components/FeatureIcon';
import { Furigana } from '@/components/Furigana';
import { ListRow, SectionHeader, SoftScene, TornCard } from '@/components/PaperKit';
import { Button } from '@/components/ui/button';
import {
  savePracticeDraft,
  PRACTICE_DRAFT_VERSION,
} from '@/lib/practice-draft';
import { containsJapanese } from '@/lib/japanese';
import { userAnswerFor } from '@/lib/practice';
import type { PracticeConfig, PracticeSession, QuestionItem } from '@/types';

const RESULT_SCENE = {
  src: '/assets/illustrations/scenes/eating-together-v1.webp',
  width: 1200,
  height: 600,
  alt: { vi: '' },
};

/** Dòng hành động trông như ListRow nhưng là nút: ghi nháp rồi mới điều hướng nên không thể là link. */
function ActionRow({
  icon,
  title,
  detail,
  onClick,
}: {
  icon: FeatureIconName;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"
        aria-hidden="true"
      >
        <FeatureIcon name={icon} className="size-6" />
      </span>
      <span className="min-w-0 flex-1 pt-1">
        <span className="block font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{detail}</span>
      </span>
      <ChevronRight className="mt-2 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}

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

  // Gom toàn bộ danh sách bài học từ config hoặc session
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
    <main className="mx-auto w-full max-w-2xl px-4 pb-12 pt-3 sm:px-6">
      {/* Thông báo tiếp cận cho Screen Reader */}
      <div role="status" className="sr-only">
        {isDue
          ? `Đã hoàn thành phiên ôn tập. Đã ôn ${session.totalQuestions} mục, ${session.correctCount} câu đúng.`
          : `Đã hoàn thành phiên luyện tập. ${session.correctCount} trên ${session.totalQuestions} câu đúng.`}
      </div>

      <SoftScene
        asset={RESULT_SCENE}
        sizes="(min-width: 672px) 672px, 100vw"
        eager
        imageClassName="h-40 object-center"
        className="-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full"
      />

      {/* Thẻ giấy lấn lên mép dưới tranh: số liệu và nút son duy nhất */}
      <div className="relative -mt-8">
        <TornCard>
          <p className="font-serif text-sm font-bold tracking-wide text-primary">/ Kết quả /</p>
          {isDue ? (
            <>
              <h1 className="mt-2 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                Đã ôn <span className="text-5xl font-bold text-primary">{session.totalQuestions}</span> mục
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {nextReviewLine ? `Lần ôn kế tiếp: ${nextReviewLine}` : `${durationText} · Ôn tập`}
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-2 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                <span className="text-5xl font-bold text-primary">{session.correctCount}</span>
                <span className="text-4xl font-bold">/{session.totalQuestions}</span> câu đúng
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {durationText} · {lessonsLabel}
              </p>
            </>
          )}

          {/* Nút son duy nhất */}
          <div className="mt-5">
            {isDue ? (
              isPlanLoading ? (
                <Button size="quiz" className="w-full font-semibold" disabled>
                  Đang lưu và tính toán...
                </Button>
              ) : hasMoreDue ? (
                <Button
                  size="quiz"
                  className="w-full font-semibold"
                  onClick={onContinueReview ?? (() => router.push('/on-tap'))}
                >
                  Ôn lô tiếp
                  <ArrowRight aria-hidden="true" />
                </Button>
              ) : blockedReason === 'no-audio' ? (
                <Button
                  size="quiz"
                  className="w-full font-semibold"
                  onClick={() => router.push('/cai-dat/audio')}
                >
                  Cài đặt âm thanh
                  <ArrowRight aria-hidden="true" />
                </Button>
              ) : (
                <Button size="quiz" className="w-full font-semibold" onClick={() => router.push('/')}>
                  Về Bảng tin
                  <ArrowRight aria-hidden="true" />
                </Button>
              )
            ) : (
              <Button
                size="quiz"
                className="w-full font-semibold"
                onClick={() => router.push(practiceHref)}
              >
                Luyện tiếp
                <ArrowRight aria-hidden="true" />
              </Button>
            )}
          </div>
        </TornCard>
      </div>

      <div className="mt-6 space-y-6">
        {/* Lỗi lưu bộ nhớ máy nếu có */}
        {saveError && (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-destructive"
          >
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
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
                <p className="text-sm font-semibold">
                  Các mục đến hạn còn lại chỉ có câu dạng nghe, nhưng thiết bị chưa có giọng tiếng Nhật (ja-JP).
                </p>
                <p className="text-xs text-muted-foreground">
                  Hạn ôn của các mục này được giữ nguyên. Bạn có thể cài đặt giọng đọc để tiếp tục.
                </p>
              </div>
            ) : blockedReason === 'no-questions' ? (
              <div className="space-y-1 rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">
                  Không thể tạo câu hỏi cho các mục còn lại. Hạn ôn được giữ nguyên.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-4 text-sm font-medium text-success">
                <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
                <span>Đã xong các mục đến hạn lúc này</span>
              </div>
            )}
          </>
        )}

        {/* Danh sách câu cần xem lại hoặc trạng thái hoàn hảo */}
        {incorrectQuestions.length === 0 ? (
          <div className="flex items-center gap-2.5 text-sm font-medium text-success">
            <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
            <span>Đúng tất cả {session.totalQuestions} câu</span>
          </div>
        ) : (
          <section aria-labelledby="result-review-heading">
            <SectionHeader id="result-review-heading" title={`Câu cần xem lại (${incorrectQuestions.length})`} />
            <ol className="divide-y divide-border border-y border-border">
              {incorrectQuestions.map((q, i) => {
                const answerText = Array.isArray(q.answer) ? q.answer.join(', ') : q.answer;
                const userAnswer = userAnswerFor(userAnswers, q);

                return (
                  <li key={q.id} className="flex items-start gap-3 py-4">
                    <span
                      className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      {containsJapanese(q.prompt) ? (
                        <Furigana text={q.prompt} className="jp-display max-w-full text-lg font-bold text-foreground" />
                      ) : (
                        <p className="text-base font-medium text-foreground">{q.prompt}</p>
                      )}

                      {/* Câu trả lời của người học bị gạch ngang kèm icon X */}
                      <div className="flex flex-wrap items-center gap-x-2 text-sm text-destructive">
                        <X className="size-4 shrink-0" aria-hidden="true" />
                        <span className="text-xs text-muted-foreground">Bạn trả lời:</span>
                        {userAnswer && userAnswer.trim().length > 0 ? (
                          <span className="jp font-medium line-through">{userAnswer}</span>
                        ) : (
                          <span className="italic text-muted-foreground">Chưa biết</span>
                        )}
                      </div>

                      {/* Đáp án đúng kèm icon Check */}
                      <div className="flex flex-wrap items-center gap-x-2 text-sm text-success">
                        <Check className="size-4 shrink-0" aria-hidden="true" />
                        <span className="text-xs text-muted-foreground">Đáp án đúng:</span>
                        <span className="jp font-medium">
                          <Furigana text={answerText} zoomable={false} />
                        </span>
                      </div>

                      {q.explanationVi && <p className="text-sm text-muted-foreground">{q.explanationVi}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {/* Các dòng điều hướng */}
        <div className="space-y-2">
          {incorrectQuestions.length > 0 && (
            <ActionRow
              icon="practice"
              title="Làm lại câu sai"
              detail={`Luyện lại ${incorrectQuestions.length} câu chưa đúng`}
              onClick={handleRetryIncorrect}
            />
          )}
          {isDue ? (
            <>
              <ListRow
                href="/on-tap/diem-yeu"
                icon={<FeatureIcon name="weak-points" />}
                title="Xem điểm yếu của tôi"
              />
              <ListRow href="/on-tap" icon={<FeatureIcon name="review" />} title="Về trang ôn tập" />
            </>
          ) : (
            lessons.length === 1 && (
              <ListRow href={lessonHref} icon={<FeatureIcon name="lesson" />} title={`Về Bài ${lessons[0]}`} />
            )
          )}
          <ListRow href="/" icon={<FeatureIcon name="home" />} title="Về Bảng tin" />
        </div>
      </div>
    </main>
  );
}
