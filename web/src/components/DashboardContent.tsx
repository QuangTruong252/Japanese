'use client';

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, BookOpen, ChevronRight, Clock, TableProperties } from 'lucide-react';
import { db } from '@/lib/db';
import { useDueQueue } from '@/lib/use-due-queue';
import { countLearnedByLesson, pickActiveLesson } from '@/lib/stats';
import { DEFAULT_SETTINGS, getSettingsSnapshot, subscribeSettings } from '@/lib/settings';
import { useActiveDrafts } from '@/lib/active-drafts';
import { clearNewSessionRequest } from '@/lib/practice-draft';
import { resolveDashboardCta } from '@/lib/dashboard-cta';
import type { LessonSummary } from '@/lib/lessons';
import type { IllustrationAsset } from '@/types';
import { AUDIO_IMPORT_ENABLED } from '@/lib/features';
import { REVIEW_COMPLETE_ART, SECTION_THUMB } from '@/lib/illustrations';
import { Accent, SoftScene, PaperCloud, TornCard, SectionHeader, ListRow, PartRow, BentoGrid, Tile } from '@/components/PaperKit';
import { CountUp } from '@/components/PaperMotion';
import { reviewForecast } from '@/lib/review-forecast';
import { ForecastChart } from '@/components/ForecastChart';
import { Illustration } from '@/components/Illustration';
import { FeatureIcon, type FeatureIconName } from '@/components/FeatureIcon';
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

/** Bảng tin v3 "Sách sống", bố cục C2. */
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
  const writingDueCount = useLiveQuery(
    () => db.writingCards.where('dueAt').belowOrEqual(now).count(),
    [now],
    0,
  );
  // Chỉ đọc cột dueAt qua index, và chỉ tới hết ngày thứ 7 của lịch ôn.
  const forecastDueDates = useLiveQuery(
    () => {
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
      return db.reviewItems.where('dueAt').below(end).keys() as Promise<Date[]>;
    },
    [now],
    [] as Date[],
  );
  const forecast = useMemo(() => reviewForecast(forecastDueDates ?? [], now), [forecastDueDates, now]);
  const writingDuePreview = useLiveQuery(
    () => db.writingCards.where('dueAt').belowOrEqual(now).limit(3).primaryKeys(),
    [now],
    [] as string[],
  );
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

  const draftList = draftRows.map((row) => (
    <ListRow
      key={row.key}
      href={row.href}
      onClick={row.onClick}
      icon={<Clock />}
      title={row.title}
      detail={row.detail}
    />
  ));

  const parts: PartData[] = [
    {
      key: 'vocab',
      href: `/hoc/${activeLessonNum}/tu-vung`,
      icon: 'vocab',
      title: 'Từ vựng',
      detail: `${activeSummary.vocabCount} từ`,
      image: activeSummary.vocabThumb ?? SECTION_THUMB.vocab,
    },
    {
      key: 'grammar',
      href: `/hoc/${activeLessonNum}#ngu-phap`,
      icon: 'grammar',
      title: 'Ngữ pháp',
      detail: `${activeSummary.grammarCount} mẫu`,
      image: activeSummary.grammarThumb ?? SECTION_THUMB.grammar,
    },
    ...(activeSummary.dialogueCount > 0
      ? [
          {
            key: 'dialogue',
            href: `/hoc/${activeLessonNum}#hoi-thoai`,
            icon: 'dialogue',
            title: 'Hội thoại',
            detail: `${activeSummary.dialogueCount} tình huống`,
            image: SECTION_THUMB.dialogue,
          } satisfies PartData,
        ]
      : []),
    ...(AUDIO_IMPORT_ENABLED
      ? [
          {
            key: 'listening',
            href: `/hoc/${activeLessonNum}#nghe`,
            icon: 'listening',
            title: 'Luyện nghe',
            image: SECTION_THUMB.listening,
          } satisfies PartData,
        ]
      : []),
  ];

  // Người mới chưa có mục nào: lịch toàn số 0 chỉ là nhiễu, nên ẩn hẳn.
  const showForecast = !isNewUser;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-3 sm:px-6 lg:max-w-[1200px] lg:px-8">
      <SoftScene
        asset={coverAsset}
        sizes="(min-width: 1024px) 1024px, 100vw"
        eager
        imageClassName="h-48 object-center sm:h-64 sm:object-[center_30%] lg:h-72 lg:object-[center_20%]"
        className="-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full md:hidden"
      />
      <PaperCloud className="-mt-1.5 w-fit md:mt-0">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          {greeting}
        </h1>
      </PaperCloud>

      <BentoGrid className="mt-6 md:mt-4">
        <section aria-labelledby="home-today-heading" className="relative md:col-span-2 lg:col-span-12 xl:col-span-8">
          <Accent kind="sprig-left" className="-right-5 -top-10 w-32" />
          <TornCard fill className="md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] md:p-0">
            <div className="min-w-0 md:p-7">
              <p
                id="home-today-heading"
                className="font-serif text-sm font-bold tracking-wide text-primary"
              >
                / Hôm nay /
              </p>
              <p className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-muted-foreground">
                <BookOpen className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Bài {activeLessonNum} · {activeSummary.title.vi}
              </p>
              {heroJapanese && (
                <div className="mt-3 flex items-start gap-2">
                  <Furigana
                    text={heroJapanese}
                    className="jp-display min-w-0 flex-1 text-2xl font-bold text-foreground sm:text-3xl"
                  />
                  {todaySentence && (
                    <SpeakButton
                      text={todaySentence.kana || toKanaSentence(todaySentence.jp)}
                      label={stripFurigana(todaySentence.jp)}
                      iconClassName="size-4"
                      className="size-11 w-11 rounded-full border border-border bg-secondary text-primary hover:bg-accent"
                    />
                  )}
                </div>
              )}
              {heroTranslation && (
                <p className="mt-1 text-sm italic leading-6 text-muted-foreground">{heroTranslation}</p>
              )}
              <Link
                href={cta.href}
                className={cn(buttonVariants({ size: 'quiz' }), 'mt-5 w-full font-semibold')}
              >
                {cta.ctaText}
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            {/* Tranh bìa nằm trong thẻ từ md; mép trái xé bằng clip-path, mobile giữ tranh tràn đầu trang. */}
            <div className="tilt-hover relative hidden min-h-72 md:block [clip-path:polygon(7%_0,3%_9%,6%_19%,1%_30%,5%_42%,0_53%,4%_65%,1%_77%,5%_89%,2%_100%,100%_100%,100%_0)]">
              <Illustration
                asset={coverAsset}
                sizes="(min-width: 1280px) 400px, 45vw"
                className="absolute inset-0 size-full object-cover dark:brightness-[0.88]"
              />
            </div>
          </TornCard>

          <div className="mt-3 space-y-2 md:hidden">
            {draftList}
            {batchCount > 0 && (
              <ListRow
                href={cta.reviewHref}
                icon={<FeatureIcon name="review" />}
                title="Ôn tập đến hạn"
                detail={dueSummaryText || `${batchCount} mục`}
              />
            )}
            {writingDueCount > 0 && (
              <ListRow
                href="/luyen-viet/phien?mode=den-han"
                icon={<FeatureIcon name="kana" />}
                title="Viết chữ đến hạn"
                detail={`${writingDueCount} chữ`}
              />
            )}
            {isDoneToday && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <Illustration asset={REVIEW_COMPLETE_ART} sizes="56px" className="size-14 shrink-0 object-contain" />
                <p className="font-medium text-foreground">Đã xong phần ôn hôm nay</p>
              </div>
            )}
            {isDoneToday && (
              <ListRow href="/luyen-tap" icon={<FeatureIcon name="practice" />} title="Luyện tập tự chọn" />
            )}
          </div>
        </section>

        <Tile
          as="section"
          span={12}
          full={!showForecast}
          className="paper-stack hidden md:block xl:col-span-4"
        >
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 xl:block">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground [&_svg]:size-7"
                  aria-hidden="true"
                >
                  <FeatureIcon name="review" />
                </span>
                <h2 className="font-serif text-xl font-semibold text-foreground">Ôn tập đến hạn</h2>
              </div>
              {isDoneToday ? (
                <>
                  <div className="mt-4 flex items-center gap-3">
                    <Illustration asset={REVIEW_COMPLETE_ART} sizes="64px" className="size-16 shrink-0 object-contain" />
                    <p className="font-medium text-foreground">Đã xong phần ôn hôm nay</p>
                  </div>
                  <ListRow
                    href="/luyen-tap"
                    icon={<FeatureIcon name="practice" />}
                    title="Luyện tập tự chọn"
                    className="mt-3"
                  />
                </>
              ) : batchCount > 0 ? (
                <>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <p className="flex items-baseline gap-2">
                      <CountUp
                        value={queue.totalDueCount}
                        className="font-serif text-6xl font-bold leading-none text-foreground"
                      />
                      <span className="text-base text-muted-foreground">đến hạn</span>
                    </p>
                    {queue.newTargetIds.length > 0 && (
                      <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                        {queue.newTargetIds.length} mới
                      </span>
                    )}
                  </div>
                  <Link
                    href={cta.reviewHref}
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'quiz' }),
                      'mt-4 w-full border-primary/40 font-semibold text-primary hover:bg-accent hover:text-primary',
                    )}
                  >
                    Ôn ngay
                  </Link>
                </>
              ) : (
                <p className="mt-4 text-muted-foreground">Chưa có mục nào để ôn. Học vài từ rồi quay lại nhé.</p>
              )}
            </div>
            {showForecast && (
              <div className="hidden lg:block xl:mt-5 xl:border-t xl:border-border xl:pt-4">
                <ForecastChart days={forecast} as="h3" />
              </div>
            )}
          </div>
        </Tile>

        {showForecast && (
          <Tile as="section" className="hidden md:block lg:hidden">
            <ForecastChart days={forecast} />
          </Tile>
        )}

        {draftList.length > 0 && (
          <div className="hidden space-y-2 md:col-span-2 md:block lg:col-span-12">{draftList}</div>
        )}

        <section
          aria-labelledby="home-parts-grid-heading"
          className="hidden md:col-span-2 md:grid md:grid-cols-2 md:gap-4 lg:col-span-12 lg:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] lg:gap-5"
        >
          <h2 id="home-parts-grid-heading" className="sr-only">
            Các phần trong bài
          </h2>
          {parts.map((part) => (
            <PartTile key={part.key} part={part} />
          ))}
          {writingDueCount > 0 && <WritingTile count={writingDueCount} chars={writingDuePreview ?? []} />}
        </section>

        <section aria-labelledby="home-parts-heading" className="md:hidden">
          <SectionHeader
            id="home-parts-heading"
            title="Các phần trong bài"
            href={`/hoc/${activeLessonNum}`}
          />
          <div className="space-y-2">
            {parts.map((part) => (
              <PartRow
                key={part.key}
                href={part.href}
                icon={<FeatureIcon name={part.icon} />}
                title={part.title}
                detail={part.detail}
                image={part.image}
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="home-quick-search" className="md:hidden">
          <SectionHeader id="home-quick-search" title="Tra cứu" />
          <div className="relative">
            <SearchTrigger
              variant="bar"
              placeholder="Tìm từ, ngữ pháp, kanji…"
              className="rounded-xl pr-14 shadow-none"
            />
            <Link
              href="/hoc/tra-cuu"
              aria-label="Bảng tra"
              title="Bảng tra"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                // Canh giữa bằng margin, không bằng translate: hiệu ứng nhấn của nút ghi đè translate làm nút nhảy xuống.
                'absolute inset-y-0 right-1 my-auto size-11 rounded-lg text-muted-foreground',
              )}
            >
              <TableProperties className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </BentoGrid>
    </main>
  );
}

interface PartData {
  key: string;
  href: string;
  icon: FeatureIconName;
  title: string;
  detail?: string;
  image: IllustrationAsset;
}

const PART_ICON_CLASS =
  'flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-6';
const TILE_LINK_CLASS = 'flex h-full flex-col rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring';

/** Thẻ phần bài (md+): thấp, chỉ icon, tên, số liệu, chevron; cả thẻ là link. */
function PartTile({ part }: { part: PartData }) {
  return (
    <Tile interactive className="p-0 lg:p-0">
      <Link href={part.href} className={TILE_LINK_CLASS}>
        <span className="flex items-center gap-3 p-4 md:max-lg:gap-2 md:max-lg:p-3">
          <span className={PART_ICON_CLASS} aria-hidden="true">
            <FeatureIcon name={part.icon} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-serif text-lg font-semibold text-foreground">{part.title}</span>
            {part.detail && <span className="block text-sm text-muted-foreground">{part.detail}</span>}
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </span>
      </Link>
    </Tile>
  );
}

// Hai đường kẻ mảnh chia ô viết thành bốn phần, như vở tập viết.
const WRITING_GRID =
  'bg-[linear-gradient(to_right,transparent_calc(50%-0.5px),var(--border)_calc(50%-0.5px),var(--border)_calc(50%+0.5px),transparent_calc(50%+0.5px)),linear-gradient(to_bottom,transparent_calc(50%-0.5px),var(--border)_calc(50%-0.5px),var(--border)_calc(50%+0.5px),transparent_calc(50%+0.5px))]';

/** Thẻ "Viết chữ đến hạn" (md+) hiện vài chữ đến hạn thật trong ô kẻ; một hàng ngang, rộng hai ô. */
function WritingTile({ count, chars }: { count: number; chars: string[] }) {
  return (
    <Tile interactive className="overflow-hidden p-0 md:col-span-2 lg:p-0">
      <Link
        href="/luyen-viet/phien?mode=den-han"
        className={cn(TILE_LINK_CLASS, 'md:flex-row md:items-center')}
      >
        <span className="flex items-center gap-3 p-4 md:flex-1">
          <span className={PART_ICON_CLASS} aria-hidden="true">
            <FeatureIcon name="kana" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-serif text-lg font-semibold text-foreground">Viết chữ đến hạn</span>
            <span className="block text-sm text-muted-foreground">{count} chữ</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground md:hidden" aria-hidden="true" />
        </span>
        <span
          aria-hidden="true"
          className="flex flex-1 items-center justify-center gap-2 p-4 pt-0 md:justify-end md:pt-4"
        >
          {chars.map((char) => (
            <span
              key={char}
              className={cn(
                'jp jp-display flex size-12 items-center justify-center rounded-md border border-border bg-background text-2xl leading-none text-foreground',
                WRITING_GRID,
              )}
            >
              {char}
            </span>
          ))}
        </span>
      </Link>
    </Tile>
  );
}
