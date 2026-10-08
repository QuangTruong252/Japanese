'use client';

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, CalendarDays, Clock, Dumbbell, Headphones, TableProperties } from 'lucide-react';
import { db } from '@/lib/db';
import { useDueQueue } from '@/lib/use-due-queue';
import { countLearnedByLesson, pickActiveLesson } from '@/lib/stats';
import { DEFAULT_SETTINGS, getSettingsSnapshot, subscribeSettings } from '@/lib/settings';
import { useActiveDrafts } from '@/lib/active-drafts';
import { clearNewSessionRequest } from '@/lib/practice-draft';
import { resolveDashboardCta } from '@/lib/dashboard-cta';
import type { LessonSummary } from '@/lib/lessons';
import type { IllustrationAsset } from '@/types';
import { SoftScene, PaperCloud, TornCard, SectionHeader, ListRow, PartRow } from '@/components/PaperKit';
import { Illustration } from '@/components/Illustration';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Furigana } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { stripFurigana, toKanaSentence } from '@/lib/japanese';
import { pickTodaySentence, type TodaySentenceItem } from '@/lib/today-sentence';

const FALLBACK_COVER: IllustrationAsset = {
  src: '/assets/illustrations/scenes/self-introduction-v1.webp',
  width: 800,
  height: 600,
  alt: { vi: '' },
};

const DONE_ASSET: IllustrationAsset = {
  src: '/assets/illustrations/ui/states/review-complete-v1.webp',
  width: 512,
  height: 512,
  alt: { vi: '' },
};

/** Bảng tin v3 "Sách sống", bố cục C2 (spec 2026-10-08 §4). */
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

  const activeLessonNum = pickActiveLesson(summaries, learnedByLesson, learnedThroughLesson);
  const activeSummary = summaries.find((s) => s.number === activeLessonNum) ?? summaries[0];
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

  const cta = resolveDashboardCta({
    isNewUser,
    activeLessonNum,
    activeLessonTitle: activeSummary?.title?.vi,
    hasPracticeDraft: drafts.practiceDraft !== null,
  });

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  const coverAsset = activeSummary?.cover ?? summaries[0]?.cover ?? FALLBACK_COVER;

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
  const isDoneToday = !isNewUser && queue.hasAnyReviewItem && batchCount === 0;

  if (queue.loading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-3 sm:px-6 lg:px-8">
        <Skeleton className="-mx-4 h-48 w-[calc(100%+2rem)] rounded-none sm:mx-0 sm:h-64 sm:w-full" />
        <Skeleton className="mt-4 h-8 w-44" />
        <Skeleton className="mt-6 h-56 w-full rounded-xl" />
        <Skeleton className="mt-3 h-14 w-full rounded-xl" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-3 sm:px-6 lg:px-8">
      <SoftScene
        asset={coverAsset}
        sizes="(min-width: 1024px) 1024px, 100vw"
        eager
        imageClassName="h-48 object-center sm:h-64 sm:object-[center_30%] lg:h-72 lg:object-[center_20%]"
        className="-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full"
      />
      <PaperCloud className="-mt-7 w-fit">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {greeting}
        </h1>
      </PaperCloud>

      <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(21rem,0.8fr)]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="home-today-heading">
            <SectionHeader
              id="home-today-heading"
              title="Hôm nay"
              href={`/hoc/${activeLessonNum}`}
              linkLabel="Xem bài"
            />
            <TornCard>
              <p className="text-sm font-medium text-muted-foreground">
                Bài {activeLessonNum} · {activeSummary.title.vi}
              </p>
              {heroJapanese && (
                <div className="mt-3 flex items-start gap-2">
                  <Furigana
                    text={heroJapanese}
                    className="jp-display min-w-0 flex-1 text-2xl font-semibold text-foreground sm:text-3xl"
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
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{heroTranslation}</p>
              )}
              <Link
                href={cta.href}
                className={cn(buttonVariants({ size: 'quiz' }), 'mt-5 w-full font-semibold')}
              >
                {cta.ctaText}
                <ArrowRight aria-hidden="true" />
              </Link>
            </TornCard>

            <div className="mt-3 space-y-2">
              {draftRows.map((row) => (
                <ListRow
                  key={row.key}
                  href={row.href}
                  onClick={row.onClick}
                  icon={<Clock />}
                  title={row.title}
                  detail={row.detail}
                />
              ))}
              {batchCount > 0 && (
                <ListRow
                  href={cta.reviewHref}
                  icon={<CalendarDays />}
                  title="Ôn tập đến hạn"
                  detail={dueSummaryText || `${batchCount} mục`}
                />
              )}
              {isDoneToday && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <Illustration asset={DONE_ASSET} sizes="56px" className="size-14 shrink-0 object-contain" />
                  <p className="font-medium text-foreground">Đã xong phần ôn hôm nay</p>
                </div>
              )}
              {isDoneToday && (
                <ListRow href="/luyen-tap" icon={<Dumbbell />} title="Luyện tập tự chọn" />
              )}
            </div>
          </section>

          <section aria-labelledby="home-parts-heading">
            <SectionHeader id="home-parts-heading" title="Các phần trong bài" />
            <div className="space-y-2">
              <PartRow
                href={`/hoc/${activeLessonNum}/tu-vung`}
                index={1}
                title="Từ vựng"
                detail={`${activeSummary.vocabCount} từ`}
                image={activeSummary.vocabThumb}
              />
              <PartRow
                href={`/hoc/${activeLessonNum}#ngu-phap`}
                index={2}
                title="Ngữ pháp"
                detail={`${activeSummary.grammarCount} mẫu`}
                image={activeSummary.grammarThumb}
              />
              <PartRow
                href={`/hoc/${activeLessonNum}#nghe`}
                index={3}
                title="Luyện nghe"
                icon={<Headphones />}
              />
            </div>
          </section>
        </div>

        <aside className="min-w-0">
          <section aria-labelledby="home-quick-search" className="xl:sticky xl:top-6">
            <SectionHeader id="home-quick-search" title="Tra cứu" />
            <div className="flex gap-2">
              <SearchTrigger
                variant="bar"
                placeholder="Tìm từ, ngữ pháp, kanji…"
                className="min-w-0 flex-1 rounded-xl shadow-none"
              />
              <Link
                href="/hoc/tra-cuu"
                aria-label="Bảng tra"
                title="Bảng tra"
                className={cn(buttonVariants({ variant: 'outline', size: 'icon-lg' }), 'size-12 shrink-0 rounded-xl')}
              >
                <TableProperties className="size-5" aria-hidden="true" />
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
