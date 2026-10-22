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
import { ArrowRight, BookOpen, Check, Play, Search, X } from 'lucide-react';
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

// Tâm thẻ theo bề ngang khối lộ trình: thẻ rộng 78%, lệch trái thì tâm 39%, lệch phải thì 61%
const centerX = (index: number) => (index % 2 === 0 ? 39 : 61);

/** Nét nối giữa các thẻ; bài đã học thì tô đỏ, còn lại xám nhạt. */
function RoadLine({
  d,
  height,
  learned,
  className,
}: {
  d: string;
  height: number;
  learned: boolean;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className={cn('block w-full', className)}
    >
      <path
        d={d}
        fill="none"
        strokeWidth={4}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className={learned ? 'stroke-primary/60' : 'stroke-muted-foreground/30'}
      />
    </svg>
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
      <PaperCloud className="-mt-1.5 w-fit">
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
              <div className="mx-auto max-w-md">
                {LESSON_GROUPS.map((group) => {
                  const groupLessons = filteredSummaries.filter(
                    (s) => s.number >= group.min && s.number <= group.max,
                  );
                  if (groupLessons.length === 0) return null;
                  const firstIndex = filteredSummaries.indexOf(groupLessons[0]);
                  const prevLesson = filteredSummaries[firstIndex - 1];
                  const isLessonLearned = (s: LessonSummary) =>
                    (s.vocabCount > 0 && (learnedByLesson.get(s.number) ?? 0) >= s.vocabCount) ||
                    s.number <= learnedThroughLesson;

                  return (
                    <div key={group.label}>
                      {prevLesson ? (
                        // Nét đi từ thẻ cuối nhóm trước, qua mốc ở tâm, tới thẻ đầu nhóm sau; mốc có nền giấy nên nằm "trên đường"
                        <div className="relative flex h-14 items-center justify-center">
                          <RoadLine
                            d={`M ${centerX(firstIndex - 1)} 0 C ${centerX(firstIndex - 1)} 14 50 14 50 28 C 50 42 ${centerX(firstIndex)} 42 ${centerX(firstIndex)} 56`}
                            height={56}
                            learned={isLessonLearned(prevLesson)}
                            className="absolute inset-0 size-full"
                          />
                          <h2 className="relative bg-background px-3 font-serif text-sm font-semibold text-muted-foreground">
                            {group.label}
                          </h2>
                        </div>
                      ) : (
                        <h2 className="mx-auto mb-3 w-fit bg-background px-3 font-serif text-sm font-semibold text-muted-foreground">
                          {group.label}
                        </h2>
                      )}
                      <ol>
                        {groupLessons.map((s, i) => {
                          const index = firstIndex + i;
                          const learned = learnedByLesson.get(s.number) ?? 0;
                          const isLearned = isLessonLearned(s);
                          const isCurrent = !isAllLearned && s.number === activeLessonNum;
                          const state: LessonState = isLearned
                            ? 'learned'
                            : isCurrent
                              ? 'current'
                              : 'todo';

                          return (
                            <li key={s.number}>
                              <Link
                                href={`/hoc/${s.number}`}
                                className={cn(
                                  'relative isolate grid w-[78%] overflow-hidden rounded-2xl border bg-card outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
                                  index % 2 === 0 ? 'mr-auto' : 'ml-auto',
                                  isCurrent
                                    ? 'border-primary ring-2 ring-primary/40'
                                    : 'border-border hover:border-foreground/30',
                                )}
                              >
                                {/* Phóng nhẹ để cắt mép nhạt của tranh, mép tan vào màu giấy thay vì thành khung sáng */}
                                <Illustration
                                  asset={s.cover ?? FALLBACK_SCENE_COVER}
                                  sizes="(min-width: 640px) 384px, 78vw"
                                  className="absolute inset-0 size-full scale-110 object-cover dark:brightness-[0.88]"
                                />
                                {/* Ô giữ tỉ lệ 3:2 tối thiểu; thẻ cao thêm được khi chữ dài, không cắt chữ */}
                                <span aria-hidden="true" className="col-start-1 row-start-1 aspect-[3/2]" />
                                <span className="relative col-start-1 row-start-1 flex flex-col">
                                  <span className="m-3 inline-flex items-center gap-2 self-start rounded-full border border-border bg-card/85 py-1 pl-3 pr-1.5 backdrop-blur-sm">
                                    <span className="text-sm font-semibold text-foreground">
                                      Bài {s.number}
                                    </span>
                                    <span className="sr-only">
                                      {state === 'learned'
                                        ? ', Đã học'
                                        : state === 'current'
                                          ? `, Đang học, ${learned}/${s.vocabCount} từ`
                                          : ', Chưa học'}
                                    </span>
                                    <span
                                      aria-hidden="true"
                                      className={cn(
                                        'flex size-5 items-center justify-center rounded-full',
                                        state === 'learned' && 'bg-success text-success-foreground',
                                        state === 'current' && 'bg-primary text-primary-foreground',
                                        state === 'todo' && 'border-2 border-muted-foreground/60',
                                      )}
                                    >
                                      {state === 'learned' && <Check className="size-3 stroke-[3]" />}
                                      {state === 'current' && <Play className="size-2.5 fill-current" />}
                                    </span>
                                  </span>
                                  {/* Mảnh giấy xé đè lên chân tranh, nền đặc để chữ đọc rõ */}
                                  <span className="paper-tear-above mt-auto block bg-card px-4 pb-3 pt-2 [--tear-paper:var(--card)]">
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
                                </span>
                              </Link>
                              {i < groupLessons.length - 1 && (
                                <RoadLine
                                  d={`M ${centerX(index)} 0 C ${centerX(index)} 20 ${centerX(index + 1)} 20 ${centerX(index + 1)} 40`}
                                  height={40}
                                  learned={isLearned}
                                  className="h-10"
                                />
                              )}
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
