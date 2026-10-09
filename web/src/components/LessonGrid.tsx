'use client';

import { useState, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { countLearnedByLesson, pickActiveLesson } from '@/lib/stats';
import { DEFAULT_SETTINGS, getSettingsSnapshot, subscribeSettings } from '@/lib/settings';
import { useActiveDrafts } from '@/lib/active-drafts';
import type { LessonSummary } from '@/lib/lessons';
import type { IllustrationAsset } from '@/types';
import { ArrowRight, BookOpen, Check, ChevronRight, Circle, Play, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Furigana } from '@/components/Furigana';
import { Illustration } from '@/components/Illustration';
import { PaperCloud, SoftScene, TornCard } from '@/components/PaperKit';
import { formatOptionalBrackets, stripFurigana } from '@/lib/japanese';

const FALLBACK_SCENE_COVER: IllustrationAsset = {
  src: '/assets/illustrations/scenes/self-introduction-v1.webp',
  width: 800,
  height: 600,
  alt: {
    vi: '',
  },
};

const LESSON_GROUPS = [
  { label: 'Bài 1–5', min: 1, max: 5 },
  { label: 'Bài 6–10', min: 6, max: 10 },
  { label: 'Bài 11–15', min: 11, max: 15 },
  { label: 'Bài 16–20', min: 16, max: 20 },
  { label: 'Bài 21–25', min: 21, max: 25 },
] as const;

type LessonState = 'learned' | 'current' | 'todo';

/** Ô tròn trên thanh dòng thời gian; trang trí, trạng thái đã có chữ trong dòng. */
function TimelineNode({ state }: { state: LessonState }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative z-10 flex size-8 items-center justify-center rounded-full border-2',
        state === 'learned' && 'border-primary bg-primary text-primary-foreground',
        state === 'current' && 'border-primary bg-card text-primary',
        state === 'todo' && 'border-border bg-card text-muted-foreground/60',
      )}
    >
      {state === 'learned' && <Check className="size-4 stroke-[3]" />}
      {state === 'current' && <Play className="size-3.5 fill-current" />}
      {state === 'todo' && <Circle className="size-2.5" />}
    </span>
  );
}

export function LessonGrid({ summaries }: { summaries: LessonSummary[] }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Lắng nghe các nháp dở dang
  const drafts = useActiveDrafts();

  // 1 query cho cả danh sách: danh sách targetId từ vựng đã vào lịch ôn
  const targetIds = useLiveQuery(
    () => db.reviewItems.where('targetId').startsWith('vocab-').primaryKeys(),
    [],
    [] as string[]
  );
  const learnedByLesson = useMemo(() => countLearnedByLesson(targetIds ?? []), [targetIds]);
  const { learnedThroughLesson } = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    () => DEFAULT_SETTINGS,
  );

  // Phân loại trạng thái các bài học
  const lessonStats = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    for (const s of summaries) {
      const learned = learnedByLesson.get(s.number) ?? 0;
      const isDone =
        (s.vocabCount > 0 && learned >= s.vocabCount) || s.number <= learnedThroughLesson;
      if (isDone) {
        completed++;
      } else if (learned > 0) {
        inProgress++;
      } else {
        notStarted++;
      }
    }

    const activeNum = pickActiveLesson(summaries, learnedByLesson, learnedThroughLesson);

    return {
      completed,
      inProgress,
      notStarted,
      activeLessonNum: activeNum,
    };
  }, [summaries, learnedByLesson, learnedThroughLesson]);

  const isAllLearned = summaries.length > 0 && lessonStats.completed >= summaries.length;
  const isNewLearner =
    lessonStats.completed === 0 &&
    lessonStats.inProgress === 0 &&
    learnedThroughLesson === 0 &&
    (targetIds?.length ?? 0) === 0;

  // Bài đang học: nếu đã học hết tất cả 25 bài thì hiển thị bài cuối cùng (Bài 25)
  const activeLessonNum = isAllLearned
    ? (summaries[summaries.length - 1]?.number ?? 25)
    : lessonStats.activeLessonNum;
  const activeSummary = summaries.find((s) => s.number === activeLessonNum) ?? summaries[0];
  const learnedInActive = learnedByLesson.get(activeLessonNum) ?? 0;
  const totalInActive = activeSummary?.vocabCount ?? 0;
  const activeVocabDraft =
    drafts.vocabDraft?.lesson === activeLessonNum ? drafts.vocabDraft : null;

  // Lọc bài học theo tìm kiếm văn bản
  const filteredSummaries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return summaries;

    return summaries.filter((s) => {
      const matchNumber = String(s.number) === q || `bài ${s.number}`.includes(q);
      const matchVi = s.title?.vi?.toLowerCase().includes(q);
      const rawJp = s.jpTitle?.toLowerCase() ?? '';
      const strippedJp = s.jpTitle
        ? stripFurigana(formatOptionalBrackets(s.jpTitle)).toLowerCase()
        : '';
      const matchJp = rawJp.includes(q) || strippedJp.includes(q);
      const matchDesc = s.description?.vi?.toLowerCase().includes(q);
      return matchNumber || matchVi || matchJp || matchDesc;
    });
  }, [summaries, searchQuery]);

  let ctaText: string;
  let ctaHref: string;

  if (isAllLearned) {
    ctaText = `Ôn lại Bài ${activeLessonNum}`;
    ctaHref = `/hoc/${activeLessonNum}`;
  } else if (activeVocabDraft) {
    ctaText = `Tiếp tục từ vựng (${activeVocabDraft.currentWordIndex}/${activeVocabDraft.totalWords})`;
    ctaHref = activeVocabDraft.resumeHref;
  } else if (isNewLearner) {
    ctaText = 'Bắt đầu Bài 1';
    ctaHref = '/hoc/1';
  } else {
    ctaText = `Tiếp tục Bài ${activeLessonNum}`;
    ctaHref = `/hoc/${activeLessonNum}`;
  }

  const sceneCover = activeSummary?.cover ?? FALLBACK_SCENE_COVER;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-3 sm:px-6 lg:px-8">
      <SoftScene
        asset={sceneCover}
        sizes="(min-width: 1024px) 1024px, 100vw"
        eager
        imageClassName="h-48 object-center sm:h-64 sm:object-[center_30%] lg:h-72 lg:object-[center_20%]"
        className="-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full"
      />
      <PaperCloud className="-mt-7 w-fit">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Học bài
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {summaries.length} bài · đã học {lessonStats.completed}
        </p>
      </PaperCloud>

      <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(21rem,0.8fr)]">
        {/* Thẻ đang học đứng đầu trên mobile, sang cột phụ từ xl */}
        <aside
          aria-labelledby="hoc-active-heading"
          className="min-w-0 xl:order-2"
        >
          <div className="xl:sticky xl:top-6">
            <TornCard>
              <p
                id="hoc-active-heading"
                className="font-serif text-sm font-bold tracking-wide text-primary"
              >
                / Đang học /
              </p>
              <p className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-muted-foreground">
                <BookOpen className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Bài {activeLessonNum} · {activeSummary?.title?.vi}
              </p>
              {activeSummary?.jpTitle && (
                <Furigana
                  text={formatOptionalBrackets(activeSummary.jpTitle)}
                  zoomable={false}
                  className="jp-display mt-3 block text-2xl font-bold text-foreground sm:text-3xl"
                />
              )}
              <div className="mt-4 flex items-center gap-3">
                <Progress
                  value={learnedInActive}
                  max={Math.max(1, totalInActive)}
                  getAriaValueText={() => `${learnedInActive} trên ${totalInActive} từ đã vào lịch ôn`}
                  className="min-w-0 flex-1"
                />
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {learnedInActive}/{totalInActive} từ
                </span>
              </div>
              <Link
                href={ctaHref}
                className={cn(
                  buttonVariants({
                    variant: isAllLearned ? 'secondary' : 'default',
                    size: 'quiz',
                  }),
                  'mt-5 h-auto min-h-12 w-full py-3 font-semibold',
                )}
              >
                <span className="whitespace-normal text-center">{ctaText}</span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </TornCard>
          </div>
        </aside>

        <div className="min-w-0 space-y-6 xl:order-1">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="lesson-filter"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc bài học..."
              aria-label="Lọc bài học"
              className="h-12 rounded-xl border-border bg-card pl-11 pr-12 text-base md:text-base dark:bg-card"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-0 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-r-xl text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
                aria-label="Xóa bộ lọc"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <section aria-label="Lộ trình bài học">
            {filteredSummaries.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card/50 px-4 py-10 text-center">
                <p className="text-base font-semibold text-foreground">Không có bài khớp</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11')}
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div>
                {LESSON_GROUPS.map((group) => {
                  const groupLessons = filteredSummaries.filter(
                    (s) => s.number >= group.min && s.number <= group.max,
                  );
                  if (groupLessons.length === 0) return null;
                  const isFirstGroup = groupLessons[0].number === filteredSummaries[0].number;

                  return (
                    <div key={group.label}>
                      {/* Thanh dọc không hở: tiêu đề nhóm nằm bên phải thanh, thanh chạy qua bằng đoạn riêng (trừ trước ô tròn đầu) */}
                      <div className="relative pb-2 pl-11 pt-4 first:pt-0">
                        {!isFirstGroup && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-0 left-4 w-0.5 -translate-x-1/2 bg-border"
                          />
                        )}
                        <h2 className="text-lg font-semibold text-foreground">{group.label}</h2>
                      </div>
                      <ol>
                        {groupLessons.map((s) => {
                          const learned = learnedByLesson.get(s.number) ?? 0;
                          const isLearned =
                            (s.vocabCount > 0 && learned >= s.vocabCount) ||
                            s.number <= learnedThroughLesson;
                          const isCurrent = !isAllLearned && s.number === activeLessonNum;
                          const state: LessonState = isLearned
                            ? 'learned'
                            : isCurrent
                              ? 'current'
                              : 'todo';
                          const isFirst = s.number === filteredSummaries[0].number;
                          const isLast = s.number === filteredSummaries[filteredSummaries.length - 1].number;

                          return (
                            <li key={s.number} className="flex gap-3 py-1">
                              {/* Thanh dọc chạy suốt nhóm; ô tròn nằm trên thanh, ngoài thẻ dòng */}
                              <div className="relative flex w-8 shrink-0 items-center justify-center">
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    'absolute left-1/2 w-0.5 -translate-x-1/2',
                                    state === 'learned' ? 'bg-primary/40' : 'bg-border',                                    isFirst && isLast
                                      ? 'hidden'
                                      : isFirst
                                        ? 'bottom-0 top-1/2'
                                        : isLast
                                          ? 'bottom-1/2 top-0'
                                          : 'inset-y-0',
                                  )}
                                />
                                <TimelineNode state={state} />
                              </div>

                              <Link
                                href={`/hoc/${s.number}`}
                                className={cn(
                                  'group flex min-w-0 flex-1 items-center gap-3 rounded-xl border bg-card p-3 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring',
                                  isCurrent ? 'border-primary/40 bg-accent/40' : 'border-border',
                                )}
                              >
                                <Illustration
                                  asset={s.cover ?? FALLBACK_SCENE_COVER}
                                  sizes="48px"
                                  className="size-12 shrink-0 rounded-lg bg-secondary object-cover"
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="flex flex-wrap items-baseline gap-x-2">
                                    <span className="text-sm font-semibold text-foreground">
                                      Bài {s.number}
                                    </span>
                                    {isLearned ? (
                                      <span className="text-sm font-medium text-success">Đã học</span>
                                    ) : isCurrent ? (
                                      <span className="text-sm font-semibold text-primary">
                                        Đang học {learned}/{s.vocabCount}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">Chưa học</span>
                                    )}
                                  </span>
                                  {s.jpTitle && (
                                    <span className="jp block font-medium text-foreground">
                                      <Furigana
                                        text={formatOptionalBrackets(s.jpTitle)}
                                        zoomable={false}
                                      />
                                    </span>
                                  )}
                                  <span
                                    className={cn(
                                      'block text-sm',
                                      s.jpTitle
                                        ? 'text-muted-foreground'
                                        : 'font-semibold text-foreground',
                                    )}
                                  >
                                    {s.title.vi}
                                  </span>
                                </span>
                                <ChevronRight
                                  className="size-5 shrink-0 text-muted-foreground"
                                  aria-hidden="true"
                                />
                              </Link>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
