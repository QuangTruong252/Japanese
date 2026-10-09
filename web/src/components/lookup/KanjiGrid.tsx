'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, FilterX, Search, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { KanjiData } from '@/types/lookup';
import { getKanjiLesson } from '@/lib/lookup';
import { filterKanjiWithQuery } from '@/lib/kanji-filter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const selectLabelClass =
  'flex h-11 items-center gap-1.5 rounded-xl border border-border bg-card pl-3 pr-1 text-sm font-medium';
const selectClass =
  'h-full min-w-0 rounded-lg bg-transparent pr-1 text-sm font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring';

interface KanjiGridProps {
  kanjiList: KanjiData[];
  kanjiTargetIds: Record<string, string[]>;
}

export function KanjiGrid({ kanjiList, kanjiTargetIds }: KanjiGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Đọc params từ URL
  const paramQuery = searchParams.get('q') ?? '';
  const paramLesson = searchParams.get('bai');
  const paramStrokes = searchParams.get('net');
  const paramOnlyLearned = searchParams.get('da_hoc') === '1';

  const [query, setQuery] = useState<string>(paramQuery);
  const [selectedLesson, setSelectedLesson] = useState<string>(paramLesson ?? 'all');
  const [selectedStrokes, setSelectedStrokes] = useState<string>(paramStrokes ?? 'all');
  const [onlyLearned, setOnlyLearned] = useState<boolean>(paramOnlyLearned);

  // Truy vấn reviewItems từ IndexedDB để xác định chữ đã học
  const reviewItems = useLiveQuery(() => db.reviewItems.toArray());

  const learnedTargetIdSet = useMemo(() => {
    if (!reviewItems) return new Set<string>();
    return new Set(reviewItems.map((r) => r.targetId));
  }, [reviewItems]);

  const learnedKanjiSet = useMemo(() => {
    const set = new Set<string>();
    for (const [char, targetIds] of Object.entries(kanjiTargetIds)) {
      if (targetIds.some((id) => learnedTargetIdSet.has(id))) {
        set.add(char);
      }
    }
    return set;
  }, [kanjiTargetIds, learnedTargetIdSet]);

  // Cập nhật URL khi đổi bộ lọc
  const updateParams = (
    newQuery: string,
    newLesson: string,
    newStrokes: string,
    newLearned: boolean
  ) => {
    const params = new URLSearchParams();
    if (newQuery.trim()) params.set('q', newQuery.trim());
    if (newLesson !== 'all') params.set('bai', newLesson);
    if (newStrokes !== 'all') params.set('net', newStrokes);
    if (newLearned) params.set('da_hoc', '1');

    const str = params.toString();
    router.replace(str ? `?${str}` : window.location.pathname, { scroll: false });
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    updateParams(val, selectedLesson, selectedStrokes, onlyLearned);
  };

  const handleLessonChange = (val: string) => {
    setSelectedLesson(val);
    updateParams(query, val, selectedStrokes, onlyLearned);
  };

  const handleStrokesChange = (val: string) => {
    setSelectedStrokes(val);
    updateParams(query, selectedLesson, val, onlyLearned);
  };

  const handleLearnedToggle = () => {
    const next = !onlyLearned;
    setOnlyLearned(next);
    updateParams(query, selectedLesson, selectedStrokes, next);
  };

  const resetFilters = () => {
    setQuery('');
    setSelectedLesson('all');
    setSelectedStrokes('all');
    setOnlyLearned(false);
    updateParams('', 'all', 'all', false);
  };

  // Lọc danh sách
  const filteredList = useMemo(() => {
    return filterKanjiWithQuery(
      kanjiList,
      {
        lesson: selectedLesson === 'all' ? null : Number(selectedLesson),
        strokes: selectedStrokes === 'all' ? null : Number(selectedStrokes),
        onlyLearned,
        query,
      },
      learnedKanjiSet
    );
  }, [kanjiList, selectedLesson, selectedStrokes, onlyLearned, query, learnedKanjiSet]);

  // Danh sách các số nét có thật trong 169 chữ
  const availableStrokes = useMemo(() => {
    const set = new Set(kanjiList.map((k) => k.strokes));
    return Array.from(set).sort((a, b) => a - b);
  }, [kanjiList]);

  const hasActiveFilter =
    query.trim() !== '' || selectedLesson !== 'all' || selectedStrokes !== 'all' || onlyLearned;

  return (
    <div className="space-y-5">
      <section aria-label="Tìm kiếm và bộ lọc Kanji" className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Tìm kanji (人, ひと, hito, nhân, người...)"
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => handleQueryChange('')}
              className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="filter-lesson" className={selectLabelClass}>
            <span className="text-muted-foreground">Bài:</span>
            <select
              id="filter-lesson"
              value={selectedLesson}
              onChange={(e) => handleLessonChange(e.target.value)}
              className={selectClass}
            >
              <option value="all">Tất cả bài</option>
              {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={String(n)}>
                  Bài {n}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="filter-strokes" className={selectLabelClass}>
            <span className="text-muted-foreground">Nét:</span>
            <select
              id="filter-strokes"
              value={selectedStrokes}
              onChange={(e) => handleStrokesChange(e.target.value)}
              className={selectClass}
            >
              <option value="all">Tất cả</option>
              {availableStrokes.map((s) => (
                <option key={s} value={String(s)}>
                  {s} nét
                </option>
              ))}
            </select>
          </label>

          <div className="flex min-h-11 items-center">
            {/* Nút cao 44 px làm vùng chạm; thanh trượt nhìn thấy nằm bên trong */}
            <button
              type="button"
              id="filter-learned-toggle"
              role="switch"
              aria-checked={onlyLearned}
              disabled={learnedKanjiSet.size === 0}
              onClick={handleLearnedToggle}
              className="group flex h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span
                className={cn(
                  'relative inline-flex h-7 w-12 rounded-full border-2 border-transparent transition-colors',
                  onlyLearned ? 'bg-primary' : 'bg-muted',
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block size-6 rounded-full bg-background shadow-md transition-transform',
                    onlyLearned ? 'translate-x-5' : 'translate-x-0',
                  )}
                />
              </span>
            </button>
            <label htmlFor="filter-learned-toggle" className="flex min-h-11 cursor-pointer select-none items-center text-sm font-medium text-foreground">
              Chỉ chữ đã học
            </label>
          </div>

          {hasActiveFilter && (
            <Button type="button" variant="ghost" onClick={resetFilters} className="h-11 min-h-11 px-3 text-sm text-muted-foreground hover:text-foreground">
              <FilterX className="mr-1 size-4" aria-hidden="true" />
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </section>

      {filteredList.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">Không có chữ nào khớp bộ lọc.</p>
          <Button type="button" variant="secondary" onClick={resetFilters} className="min-h-11 px-4">
            Xóa bộ lọc
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3 md:grid-cols-8">
          {filteredList.map((k) => {
            const isLearned = learnedKanjiSet.has(k.character);
            const lesson = getKanjiLesson(k);
            const reading = k.kunyomi[0] ?? k.onyomi[0] ?? '';
            const meaning = k.meanings.vi[0] ?? '';

            return (
              <Link
                key={k.character}
                href={`/hoc/tra-cuu/kanji/${encodeURIComponent(k.character)}`}
                aria-label={`${k.character}${k.hanviet ? ` (${k.hanviet})` : ''} — ${meaning}, bài ${lesson ?? 'N5'}${isLearned ? ', đã học' : ''}`}
                className="relative flex flex-col items-center gap-0.5 rounded-xl border border-border bg-card px-1 pb-2 pt-2 text-center outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring"
              >
                {isLearned && (
                  <span
                    title="Đã học"
                    className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-accent text-primary"
                  >
                    <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                )}

                <span lang="ja" className="jp-display text-3xl font-medium leading-tight text-foreground sm:text-4xl">
                  {k.character}
                </span>
                {k.hanviet && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">{k.hanviet}</span>
                )}
                <span className="text-xs text-foreground">{meaning}</span>
                <span lang="ja" className="jp text-xs leading-snug text-muted-foreground">
                  {reading}
                </span>

                <span
                  className={cn(
                    'mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs',
                    isLearned ? 'bg-accent font-semibold text-primary' : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {isLearned ? 'Đã học' : lesson ? `Bài ${lesson}` : 'N5'}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
