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
import {
  Search,
  Check,
  Clock,
  Circle,
  ChevronRight,
  ArrowRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Furigana } from '@/components/Furigana';
import { Illustration } from '@/components/Illustration';
import { Stage, PaperSlip } from '@/components/PaperStage';
import { formatOptionalBrackets, stripFurigana } from '@/lib/japanese';

const FALLBACK_SCENE_COVER: IllustrationAsset = {
  src: '/assets/illustrations/scenes/self-introduction-v1.webp',
  width: 800,
  height: 600,
  alt: {
    vi: 'Cảnh minh họa bài học Minna no Nihongo',
  },
};

const LESSON_GROUPS = [
  { label: 'Bài 1–5', min: 1, max: 5 },
  { label: 'Bài 6–10', min: 6, max: 10 },
  { label: 'Bài 11–15', min: 11, max: 15 },
  { label: 'Bài 16–20', min: 16, max: 20 },
  { label: 'Bài 21–25', min: 21, max: 25 },
] as const;

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

  // Bài học hiện tại trên Stage: nếu đã học hết tất cả 25 bài thì hiển thị bài cuối cùng (Bài 25)
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

  const stageCover = activeSummary?.cover ?? FALLBACK_SCENE_COVER;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Header: h1 "Học bài" + "25 bài · đã học N" + small "Lọc bài học" text field */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Học bài
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {summaries.length} bài · đã học {lessonStats.completed}
          </p>
        </div>

        <div className="w-full sm:w-64 space-y-1.5">
          <label
            htmlFor="lesson-filter"
            className="block text-xs font-semibold text-muted-foreground"
          >
            Lọc bài học
          </label>
          <div className="relative">
            <Search
              className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="lesson-filter"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc bài học..."
              aria-label="Lọc bài học"
              className="w-full h-12 pl-10 pr-12 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="size-12 inline-flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rounded-r-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Xóa bộ lọc"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main content: At 1280px (xl:), stage sticky in left 5/12 column, route in right 7/12 column */}
      <div className="xl:grid xl:grid-cols-12 xl:gap-10 xl:items-start">
        {/* Left 5/12 column: Stage + PaperSlip */}
        <section
          aria-label="Bài đang học"
          className="xl:col-span-5 xl:sticky xl:top-6"
        >
          <Stage
            asset={stageCover}
            sizes="(min-width: 1280px) 40vw, 100vw"
            imageClassName="h-48 sm:h-56 xl:h-64"
            className="-mx-4 sm:mx-0"
          />
          <PaperSlip>
            <p className="text-sm font-medium text-muted-foreground">
              Bài {activeLessonNum} · {activeSummary?.title?.vi ?? 'Minna no Nihongo'}
            </p>
            {activeSummary?.jpTitle && (
              <div className="jp text-2xl sm:text-3xl font-bold text-foreground mt-1">
                <Furigana
                  text={formatOptionalBrackets(activeSummary.jpTitle)}
                  zoomable={false}
                />
              </div>
            )}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {learnedInActive}/{totalInActive} từ
                </span>
                {totalInActive > 0 && (
                  <span className="tabular-nums">
                    {Math.round((learnedInActive / totalInActive) * 100)}%
                  </span>
                )}
              </div>
              <Progress
                value={learnedInActive}
                max={Math.max(1, totalInActive)}
                className="w-full"
              />
            </div>

            <Link
              href={ctaHref}
              className={cn(
                buttonVariants({
                  variant: isAllLearned ? 'secondary' : 'default',
                  size: 'quiz',
                }),
                'mt-4 w-full justify-center',
              )}
            >
              <span>{ctaText}</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </PaperSlip>
        </section>

        {/* Right 7/12 column: Stepped Route of 25 lessons */}
        <section
          aria-label="Lộ trình bài học"
          className="mt-8 xl:mt-0 xl:col-span-7"
        >
          {filteredSummaries.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-xl border border-dashed border-border bg-card/50">
              <p className="text-base font-semibold text-foreground">
                Không có bài khớp
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Không tìm thấy bài học nào phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={cn(
                  buttonVariants({ variant: 'secondary', size: 'default' }),
                  'mt-4 rounded-xl text-xs font-medium',
                )}
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {LESSON_GROUPS.map((group) => {
                const groupLessons = filteredSummaries.filter(
                  (s) => s.number >= group.min && s.number <= group.max,
                );
                if (groupLessons.length === 0) return null;

                return (
                  <div key={group.label} className="space-y-1">
                    {/* Section label */}
                    <div className="flex items-center gap-2 pl-9 py-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {group.label}
                      </span>
                    </div>

                    {/* Stepped Route stations */}
                    <div className="flex flex-col divide-y divide-border">
                      {groupLessons.map((s) => {
                        const learned = learnedByLesson.get(s.number) ?? 0;
                        const isLearned =
                          (s.vocabCount > 0 && learned >= s.vocabCount) ||
                          s.number <= learnedThroughLesson;
                        const isCurrent =
                          !isAllLearned && s.number === activeLessonNum;
                        const isNotStarted = !isLearned && !isCurrent;

                        // Xác định xem đường mực nối lên/nối xuống:
                        const isFirstInFiltered = s.number === filteredSummaries[0]?.number;
                        const isLastInFiltered =
                          s.number ===
                          filteredSummaries[filteredSummaries.length - 1]?.number;

                        return (
                          <Link
                            key={s.number}
                            href={`/hoc/${s.number}`}
                            className="group flex items-center gap-3 sm:gap-4 py-3 sm:py-3.5 px-2 -mx-2 rounded-xl transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
                          >
                            {/* Station node column with ink line */}
                            <div className="relative flex flex-col items-center justify-center shrink-0 w-6 self-stretch">
                              <span
                                className={cn(
                                  'absolute w-px bg-border -z-0',
                                  isFirstInFiltered && !isLastInFiltered
                                    ? 'top-1/2 bottom-0'
                                    : isLastInFiltered && !isFirstInFiltered
                                      ? 'top-0 bottom-1/2'
                                      : isFirstInFiltered && isLastInFiltered
                                        ? 'hidden'
                                        : 'top-0 bottom-0',
                                )}
                                aria-hidden="true"
                              />
                              {isLearned ? (
                                <span className="relative z-10 size-4 rounded-full bg-success text-success-foreground flex items-center justify-center ring-4 ring-background">
                                  <Check
                                    className="size-2.5 stroke-[3]"
                                    aria-hidden="true"
                                  />
                                </span>
                              ) : isCurrent ? (
                                <span className="relative z-10 size-4 rounded-full border-2 border-primary bg-background ring-4 ring-background flex items-center justify-center">
                                  <span className="size-1.5 rounded-full bg-primary" />
                                </span>
                              ) : (
                                <span className="relative z-10 size-3 rounded-full border-2 border-muted-foreground/40 bg-background ring-4 ring-background" />
                              )}
                            </div>

                            {/* 64px scene thumbnail */}
                            <div className="size-16 shrink-0 rounded-lg overflow-hidden bg-muted relative">
                              <Illustration
                                asset={s.cover ?? FALLBACK_SCENE_COVER}
                                sizes="64px"
                                className={cn(
                                  'size-16 object-cover',
                                  isNotStarted && 'grayscale opacity-60',
                                )}
                              />
                            </div>

                            {/* Lesson details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-muted-foreground">
                                  Bài {s.number}
                                </span>
                                {isLearned ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                                    <Check
                                      className="size-3 stroke-[2.5]"
                                      aria-hidden="true"
                                    />
                                    Đã học
                                  </span>
                                ) : isCurrent ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                                    <Clock className="size-3" aria-hidden="true" />
                                    Đang học {learned}/{s.vocabCount}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <Circle
                                      className="size-2.5"
                                      aria-hidden="true"
                                    />
                                    Chưa học
                                  </span>
                                )}
                              </div>

                              {s.jpTitle ? (
                                <div className="jp jp-example font-medium text-foreground truncate mt-0.5">
                                  <Furigana
                                    text={formatOptionalBrackets(s.jpTitle)}
                                    zoomable={false}
                                  />
                                </div>
                              ) : (
                                <span className="block text-base font-semibold text-foreground truncate mt-0.5">
                                  {s.title.vi}
                                </span>
                              )}

                              {s.jpTitle ? (
                                <span className="block text-sm font-normal text-muted-foreground truncate">
                                  {s.title.vi}
                                </span>
                              ) : null}
                            </div>

                            {/* Chevron */}
                            <ChevronRight
                              className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                              aria-hidden="true"
                            />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
