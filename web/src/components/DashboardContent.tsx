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
import { Stage, LinkRow } from '@/components/PaperStage';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CalendarDays, CheckCircle2, Clock, Play } from 'lucide-react';
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
  const queue = useDueQueue();
  const now = queue.now;
  const { learnedThroughLesson } = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    () => DEFAULT_SETTINGS,
  );
  const batchCount = queue.sessionTargetIds.size;
  const drafts = useActiveDrafts();

  const vocabTargetIds = useLiveQuery(
    () => db.reviewItems.where('targetId').startsWith('vocab-').primaryKeys(),
    [],
    [] as string[],
  );
  const learnedByLesson = useMemo(
    () => countLearnedByLesson(vocabTargetIds ?? []),
    [vocabTargetIds],
  );

  const recentSessions = useLiveQuery(
    () => db.practiceSessions.orderBy('createdAt').reverse().limit(20).toArray(),
    [],
  );
  const minutesEstimate = useMemo(() => {
    const spq = secondsPerQuestion(recentSessions ?? []);
    return spq === null ? null : Math.max(1, Math.round((batchCount * spq) / 60));
  }, [recentSessions, batchCount]);

  const activeLessonNum = pickActiveLesson(summaries, learnedByLesson, learnedThroughLesson);
  const activeSummary = summaries.find((s) => s.number === activeLessonNum) ?? summaries[0];
  const learnedInActive = learnedByLesson.get(activeLessonNum) ?? 0;
  const totalInActive = activeSummary?.vocabCount ?? 0;
  const isNewUser =
    !queue.hasAnyReviewItem &&
    (vocabTargetIds?.length ?? 0) === 0 &&
    learnedThroughLesson === 0;

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

  const ctaDecision = resolveDashboardCta({
    batchCount,
    isNewUser,
    activeLessonNum,
    activeLessonTitle: activeSummary?.title?.vi,
    resumeDraft: primaryDraft && { href: primaryDraft.href, heading: primaryDraft.title },
    hasPracticeDraft: drafts.practiceDraft !== null,
  });

  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  const coverAsset =
    activeSummary?.cover ??
    summaries[0]?.cover ?? {
      src: '/assets/illustrations/scenes/self-introduction-v1.webp',
      width: 800,
      height: 600,
      alt: { vi: '' },
    };

  const todaySentence = useMemo(
    () => pickTodaySentence(lessonExamples[activeLessonNum], now, activeLessonNum),
    [lessonExamples, now, activeLessonNum],
  );
  const heroJapanese = todaySentence?.jp ?? activeSummary?.jpTitle ?? '';
  const heroTranslation = todaySentence?.vi ?? activeSummary?.title?.vi ?? '';

  const dueSummaryText = [
    queue.totalDueCount > 0 ? `${queue.totalDueCount} mục đến hạn` : null,
    queue.newTargetIds.length > 0 ? `${queue.newTargetIds.length} mục mới` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const isReviewPrimary = ctaDecision.kind === 'review';
  const primaryIsLesson =
    ctaDecision.kind === 'start_first_lesson' || ctaDecision.kind === 'continue_lesson';
  const primaryIsDraft = ctaDecision.kind === 'resume_draft';

  if (queue.loading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-3 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>

        <Skeleton className="mt-5 h-48 w-full rounded-none sm:h-60 lg:h-72" />

        <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(21rem,0.8fr)]">
          <div className="space-y-3">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-60 w-full rounded-xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-3 sm:px-6 lg:px-8">
      <header className="mb-4">
        <p className="text-sm text-muted-foreground">{greeting},</p>
        <h1 className="mt-0.5 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Hôm nay
        </h1>
      </header>

      <Stage
        asset={coverAsset}
        sizes="(min-width: 1024px) 768px, 100vw"
        eager
        imageClassName="h-48 w-full object-cover object-center sm:h-60 lg:h-72"
        className="-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full"
      />

      <div className="mt-4 grid gap-7 xl:grid-cols-[minmax(0,1.2fr)_minmax(21rem,0.8fr)] xl:gap-8">
        <div className="min-w-0 space-y-7">
          <section aria-labelledby="home-today-heading">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <CalendarDays className="size-4.5 shrink-0 text-primary" aria-hidden="true" />
                <h2
                  id="home-today-heading"
                  className="font-serif text-xl font-semibold tracking-tight text-foreground"
                >
                  Hôm nay
                </h2>
              </div>
              <Link
                href={`/hoc/${activeLessonNum}`}
                className="shrink-0 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Xem bài
              </Link>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    Bài {activeLessonNum} · {activeSummary.title.vi}
                  </p>

                  {heroJapanese && (
                    <div className="mt-3 flex items-start gap-2">
                      <Furigana
                        text={heroJapanese}
                        className="min-w-0 flex-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
                      />
                      {todaySentence && (
                        <SpeakButton
                          text={todaySentence.kana || toKanaSentence(todaySentence.jp)}
                          label={stripFurigana(todaySentence.jp)}
                          iconClassName="size-4"
                        />
                      )}
                    </div>
                  )}

                  {heroTranslation && (
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {heroTranslation}
                    </p>
                  )}
                </div>
              </div>

              {!isNewUser && (
                <div className="mt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-foreground">Tiến độ từ vựng</span>
                    <span className="tabular-nums text-muted-foreground">
                      {learnedInActive}/{totalInActive}
                    </span>
                  </div>
                  <Progress
                    value={learnedInActive}
                    max={Math.max(1, totalInActive)}
                    aria-label={`Tiến độ từ vựng Bài ${activeLessonNum}`}
                    aria-valuetext={`${learnedInActive} trên ${totalInActive} từ đã vào lịch ôn`}
                    className="mt-2 w-full"
                  />
                </div>
              )}

              {(primaryIsLesson || primaryIsDraft) && (
                <div className="mt-4 border-t border-border pt-4">
                  {primaryIsDraft && primaryDraft && (
                    <p className="mb-3 text-sm text-muted-foreground">
                      {primaryDraft.title} · {primaryDraft.detail}
                    </p>
                  )}
                  <Link
                    href={primaryIsDraft && primaryDraft ? primaryDraft.href : ctaDecision.href}
                    onClick={primaryIsDraft && primaryDraft ? primaryDraft.onClick : undefined}
                    className={cn(
                      buttonVariants({ size: 'quiz' }),
                      'w-full gap-2 text-base font-semibold',
                    )}
                  >
                    {primaryIsDraft ? (
                      <Play className="size-5 fill-current" aria-hidden="true" />
                    ) : (
                      <BookOpen className="size-5" aria-hidden="true" />
                    )}
                    {ctaDecision.ctaText}
                  </Link>
                </div>
              )}
            </div>

            {isReviewPrimary && (
              <LinkRow
                href={`/hoc/${activeLessonNum}`}
                icon={<BookOpen />}
                title={`Bài ${activeLessonNum} · ${activeSummary.title.vi}`}
                detail={`${learnedInActive}/${totalInActive} từ đã vào lịch ôn`}
                className="mt-1 border-b border-border"
              />
            )}

            {draftRows.length > 0 && !primaryIsDraft && (
              <div className="mt-1 divide-y divide-border border-b border-border">
                {draftRows.map((row) => (
                  <LinkRow
                    key={row.key}
                    href={row.href}
                    onClick={row.onClick}
                    icon={<Clock />}
                    title={`Phiên dở · ${row.title}`}
                    detail={row.detail}
                  />
                ))}
              </div>
            )}
          </section>

          {(isReviewPrimary || (!isNewUser && queue.hasAnyReviewItem)) && (
            <section aria-labelledby="home-review-heading">
              <div className="mb-3 flex items-center gap-2">
                {isReviewPrimary ? (
                  <CalendarDays className="size-4.5 shrink-0 text-primary" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="size-4.5 shrink-0 text-success" aria-hidden="true" />
                )}
                <h2
                  id="home-review-heading"
                  className="font-serif text-xl font-semibold tracking-tight text-foreground"
                >
                  Ôn tập đến hạn
                </h2>
              </div>

              {isReviewPrimary ? (
                <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {dueSummaryText || `${batchCount} mục ôn tập`}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {minutesEstimate !== null
                          ? `Khoảng ${minutesEstimate} phút`
                          : 'Ưu tiên các mục đang đến hạn'}
                      </p>
                    </div>
                    {queue.remainingDue > 0 && (
                      <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                        +{queue.remainingDue} lượt sau
                      </span>
                    )}
                  </div>

                  <Link
                    href={ctaDecision.href}
                    className={cn(
                      buttonVariants({ size: 'quiz' }),
                      'mt-4 w-full gap-2 text-base font-semibold',
                    )}
                  >
                    <Play className="size-5 fill-current" aria-hidden="true" />
                    {ctaDecision.ctaText}
                  </Link>
                </div>
              ) : (
                <LinkRow
                  href="/on-tap"
                  icon={<CheckCircle2 className="text-success" />}
                  title="Hôm nay đã ôn xong"
                  detail={
                    queue.dueTomorrowCount > 0
                      ? `Lượt tiếp theo ngày mai: ${queue.dueTomorrowCount} mục`
                      : 'Ngày mai chưa có mục nào đến hạn'
                  }
                  className="border-y border-border"
                />
              )}
            </section>
          )}
        </div>

        <aside className="min-w-0">
          <section aria-labelledby="home-quick-search" className="xl:sticky xl:top-6">
            <h2
              id="home-quick-search"
              className="font-serif text-xl font-semibold tracking-tight text-foreground"
            >
              Tra cứu nhanh
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tìm từ vựng, ngữ pháp hoặc kanji.
            </p>
            <SearchTrigger
              variant="bar"
              placeholder="Tìm từ vựng, ngữ pháp, kanji…"
              className="mt-3 rounded-xl shadow-none"
            />
          </section>
        </aside>
      </div>
    </main>
  );
}
