'use client';

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useDueQueue } from '@/lib/use-due-queue';
import { countLearnedByLesson, pickActiveLesson, secondsPerQuestion } from '@/lib/stats';
import { DEFAULT_SETTINGS, getSettingsSnapshot, subscribeSettings } from '@/lib/settings';
import { useActiveDrafts } from '@/lib/active-drafts';
import { clearNewSessionRequest } from '@/lib/practice-draft';
import { resolveDashboardCta } from '@/lib/dashboard-cta';
import type { LessonSummary } from '@/lib/lessons';
import { Stage, PaperSlip, LinkRow } from '@/components/PaperStage';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Play, BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Furigana } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { stripFurigana, toKanaSentence } from '@/lib/japanese';
import { pickTodaySentence, type TodaySentenceItem } from '@/lib/today-sentence';

export function DashboardContent({
  summaries,
  lessonExamples = {},
}: {
  summaries: LessonSummary[];
  lessonExamples?: Record<number, TodaySentenceItem[]>;
}) {
  // Cùng hook với /on-tap để hai màn luôn ra một con số.
  const queue = useDueQueue();
  const now = queue.now;
  const { learnedThroughLesson } = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    () => DEFAULT_SETTINGS,
  );
  const batchCount = queue.sessionTargetIds.size;

  // Lắng nghe cả nháp học từ vựng và nháp luyện tập.
  const drafts = useActiveDrafts();

  // Tiến độ theo bài: danh sách ID từ vựng đã vào lịch ôn.
  const vocabTargetIds = useLiveQuery(
    () => db.reviewItems.where('targetId').startsWith('vocab-').primaryKeys(),
    [],
    [] as string[],
  );
  const learnedByLesson = useMemo(
    () => countLearnedByLesson(vocabTargetIds ?? []),
    [vocabTargetIds],
  );

  // Thời gian thật mỗi câu từ các phiên gần đây, dùng để ước lượng lô ôn.
  const recentSessions = useLiveQuery(
    () => db.practiceSessions.orderBy('createdAt').reverse().limit(20).toArray(),
    [],
  );
  const minutesEstimate = useMemo(() => {
    const spq = secondsPerQuestion(recentSessions ?? []);
    return spq === null ? null : Math.max(1, Math.round((batchCount * spq) / 60));
  }, [recentSessions, batchCount]);

  // Bài đang học — cùng logic với /hoc.
  const activeLessonNum = pickActiveLesson(summaries, learnedByLesson, learnedThroughLesson);
  const activeSummary = summaries.find((s) => s.number === activeLessonNum) ?? summaries[0];
  const learnedInActive = learnedByLesson.get(activeLessonNum) ?? 0;
  const totalInActive = activeSummary?.vocabCount ?? 0;
  const isNewUser =
    !queue.hasAnyReviewItem &&
    (vocabTargetIds?.length ?? 0) === 0 &&
    learnedThroughLesson === 0;

  // Nháp Luyện/Ôn đứng trước vì người học đang dở giữa một phiên câu hỏi.
  const draftRows = [
    drafts.practiceDraft && {
      key: 'practice',
      title:
        drafts.practiceDraft.label +
        (drafts.practiceDraft.label === 'Luyện tập' &&
        drafts.practiceDraft.selectedLessons?.length
          ? ` Bài ${drafts.practiceDraft.selectedLessons.join(', ')}`
          : ''),
      detail: `Câu ${drafts.practiceDraft.currentQuestionIndex}/${drafts.practiceDraft.totalQuestions}`,
      href: drafts.practiceDraft.resumeHref,
      onClick: clearNewSessionRequest,
    },
    drafts.vocabDraft && {
      key: 'vocab',
      title: `Học từ vựng Bài ${drafts.vocabDraft.lesson}`,
      detail: `Từ ${drafts.vocabDraft.currentWordIndex}/${drafts.vocabDraft.totalWords}`,
      href: drafts.vocabDraft.resumeHref,
      onClick: undefined,
    },
  ].filter((row) => !!row);
  const primaryDraft = draftRows[0] ?? null;

  // Quyết định CTA chính theo helper thuần; giữ nguyên logic business hiện có.
  const ctaDecision = resolveDashboardCta({
    batchCount,
    isNewUser,
    activeLessonNum,
    activeLessonTitle: activeSummary?.title?.vi,
    resumeDraft: primaryDraft && { href: primaryDraft.href, heading: primaryDraft.title },
    hasPracticeDraft: drafts.practiceDraft !== null,
  });
  const isResume = ctaDecision.kind === 'resume_draft';
  const secondaryDrafts = isResume ? draftRows.slice(1) : draftRows;

  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  // Cảnh bài đang học. Ảnh chỉ cung cấp ngữ cảnh; nội dung học và CTA vẫn là HTML thật.
  const coverAsset =
    activeSummary?.cover ??
    summaries[0]?.cover ?? {
      src: '/assets/illustrations/scenes/self-introduction-v1.webp',
      width: 800,
      height: 600,
      alt: { vi: '' },
    };

  // Câu học cố định trong ngày; fallback về jpTitle khi bài không có ví dụ phù hợp.
  const todaySentence = useMemo(
    () => pickTodaySentence(lessonExamples[activeLessonNum], now, activeLessonNum),
    [lessonExamples, now, activeLessonNum],
  );
  const heroJapanese = todaySentence?.jp ?? activeSummary?.jpTitle ?? '';
  const heroTranslation = todaySentence?.vi ?? activeSummary?.title?.vi ?? '';

  if (queue.loading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-3 sm:px-6 lg:px-8">
        <header className="mb-5 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-24" />
        </header>

        <div className="grid grid-cols-1 items-start xl:grid-cols-12 xl:gap-8">
          <div className="xl:col-span-7">
            <Skeleton className="h-44 w-full rounded-xl sm:h-56 md:h-64 xl:h-72" />
          </div>
          <div className="-mt-8 flex flex-col gap-4 xl:col-span-5 xl:mt-0">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-3 h-12 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  const dueSummaryText = [
    queue.totalDueCount > 0 ? `${queue.totalDueCount} mục đến hạn` : null,
    queue.newTargetIds.length > 0 ? `${queue.newTargetIds.length} mục mới` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const showDraftRows = ctaDecision.kind === 'review' ? draftRows : secondaryDrafts;
  const showLessonRow =
    !isNewUser && (ctaDecision.kind === 'review' || ctaDecision.kind === 'resume_draft');
  const showDoneTodayRow =
    !isNewUser && queue.hasAnyReviewItem && ctaDecision.kind !== 'review';

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-3 sm:px-6 lg:px-8">
      <header className="mb-5">
        <p className="text-sm font-medium text-muted-foreground">{greeting}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Hôm nay
        </h1>
      </header>

      <div className="grid grid-cols-1 items-start xl:grid-cols-12 xl:gap-8">
        {/* Scene → Language: cảnh tạo ngữ cảnh, không chứa text/control baked vào ảnh. */}
        <div className="xl:col-span-7">
          <Stage
            asset={coverAsset}
            sizes="(min-width: 1280px) 672px, 100vw"
            eager
            imageClassName="h-44 w-full object-cover object-top sm:h-56 md:h-64 xl:h-72"
            className="w-full"
          />
        </div>

        {/* Editorial + action: content co giãn theo dữ liệu, không fixed-height. */}
        <div className="flex flex-col gap-4 xl:col-span-5">
          <PaperSlip className="xl:mt-0">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  N5 · Bài {activeLessonNum}
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {activeSummary.title.vi}
                </p>

                {heroJapanese && (
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <Furigana
                      text={heroJapanese}
                      className="min-w-0 flex-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
                    />
                    {todaySentence && (
                      <div className="shrink-0 pt-1">
                        <SpeakButton
                          text={todaySentence.kana || toKanaSentence(todaySentence.jp)}
                          label={stripFurigana(todaySentence.jp)}
                          iconClassName="size-4"
                        />
                      </div>
                    )}
                  </div>
                )}

                {heroTranslation && (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {heroTranslation}
                  </p>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Việc tiếp theo
                </p>

                {ctaDecision.kind === 'review' ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {dueSummaryText ||
                          (batchCount > 0 ? `${batchCount} mục ôn tập` : 'Ôn tập')}
                      </p>
                      {minutesEstimate !== null && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Khoảng {minutesEstimate} phút
                        </p>
                      )}
                    </div>
                    <Link
                      href={ctaDecision.href}
                      className={cn(
                        buttonVariants({ size: 'quiz' }),
                        'w-full gap-2 text-base font-semibold',
                      )}
                    >
                      <Play className="size-5 fill-current" aria-hidden="true" />
                      {ctaDecision.ctaText}
                    </Link>
                  </div>
                ) : ctaDecision.kind === 'resume_draft' && primaryDraft ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {primaryDraft.title}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {primaryDraft.detail}
                      </p>
                    </div>
                    <Link
                      href={primaryDraft.href}
                      onClick={primaryDraft.onClick}
                      className={cn(
                        buttonVariants({ size: 'quiz' }),
                        'w-full gap-2 text-base font-semibold',
                      )}
                    >
                      <Play className="size-5 fill-current" aria-hidden="true" />
                      {ctaDecision.ctaText}
                    </Link>
                  </div>
                ) : ctaDecision.kind === 'start_first_lesson' ? (
                  <Link
                    href="/hoc/1"
                    className={cn(
                      buttonVariants({ size: 'quiz' }),
                      'w-full gap-2 text-base font-semibold',
                    )}
                  >
                    <BookOpen className="size-5" aria-hidden="true" />
                    {ctaDecision.ctaText}
                  </Link>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="text-sm font-medium text-foreground">Tiến độ từ vựng</p>
                        <p className="text-sm tabular-nums text-muted-foreground">
                          {learnedInActive}/{totalInActive}
                        </p>
                      </div>
                      <Progress
                        value={learnedInActive}
                        max={Math.max(1, totalInActive)}
                        aria-label={`Tiến độ từ vựng Bài ${activeLessonNum}`}
                        aria-valuetext={`${learnedInActive} trên ${totalInActive} từ đã vào lịch ôn`}
                        className="mt-2 w-full"
                      />
                    </div>
                    <Link
                      href={ctaDecision.href}
                      className={cn(
                        buttonVariants({ size: 'quiz' }),
                        'w-full gap-2 text-base font-semibold',
                      )}
                    >
                      <BookOpen className="size-5" aria-hidden="true" />
                      {ctaDecision.ctaText}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </PaperSlip>

          {(showDraftRows.length > 0 || showLessonRow || showDoneTodayRow) && (
            <div className="divide-y divide-border border-b border-border">
              {showDraftRows.map((row) => (
                <LinkRow
                  key={row.key}
                  href={row.href}
                  onClick={row.onClick}
                  icon={<Clock />}
                  title={`Phiên dở · ${row.title}`}
                  detail={row.detail}
                />
              ))}

              {showLessonRow && (
                <LinkRow
                  href={`/hoc/${activeLessonNum}`}
                  icon={<BookOpen />}
                  title={`Bài ${activeLessonNum} · ${activeSummary.title.vi}`}
                  detail={`${learnedInActive}/${totalInActive} từ đã vào lịch ôn`}
                >
                  <div className="mt-2">
                    <Progress
                      value={learnedInActive}
                      max={Math.max(1, totalInActive)}
                      aria-label={`Tiến độ từ vựng Bài ${activeLessonNum}`}
                      aria-valuetext={`${learnedInActive} trên ${totalInActive} từ đã vào lịch ôn`}
                      className="w-full"
                    />
                  </div>
                </LinkRow>
              )}

              {showDoneTodayRow && (
                <LinkRow
                  href="/on-tap"
                  icon={<CheckCircle2 className="text-success" />}
                  title="Ôn tập · Hôm nay đã xong"
                  detail={
                    queue.dueTomorrowCount > 0
                      ? `Lượt tiếp theo ngày mai: ${queue.dueTomorrowCount} mục`
                      : 'Ngày mai chưa có mục nào đến hạn'
                  }
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Một lối tra cứu chức năng, không biến Home thành lưới shortcut. */}
      <section className="mt-8 border-t border-border pt-5" aria-labelledby="home-quick-search">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)] md:items-center md:gap-6">
          <div>
            <h2 id="home-quick-search" className="text-base font-semibold text-foreground">
              Tra cứu nhanh
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tìm từ vựng, ngữ pháp hoặc kanji.
            </p>
          </div>
          <SearchTrigger
            variant="bar"
            placeholder="Tìm từ, ngữ pháp, kanji…"
            className="rounded-xl shadow-none"
          />
        </div>
      </section>
    </main>
  );
}
