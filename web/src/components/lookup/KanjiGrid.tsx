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
    <div className="space-y-6">
      {/* 1. Thanh Tìm kiếm & Bộ lọc */}
      <section
        aria-label="Tìm kiếm và bộ lọc Kanji"
        className="space-y-4 p-4 rounded-2xl border border-border/80 bg-card shadow-xs"
      >
        {/* Input Tìm kiếm ≥44px */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Tìm kanji (人, ひと, hito, nhân, người...)"
            className="w-full h-11 pl-10 pr-9 rounded-xl border border-border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => handleQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-7 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Các bộ lọc phụ: Bài, Số nét, Đã học, Nút xóa (wrap trong 390px, control ≥44px) */}
        <div className="flex flex-wrap items-center gap-3 pt-0.5">
          {/* Lọc theo bài */}
          <div className="flex items-center gap-2">
            <label htmlFor="filter-lesson" className="text-xs font-semibold text-muted-foreground shrink-0">
              Bài:
            </label>
            <select
              id="filter-lesson"
              value={selectedLesson}
              onChange={(e) => handleLessonChange(e.target.value)}
              className="h-11 min-h-11 px-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring"
            >
              <option value="all">Tất cả bài</option>
              {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={String(n)}>
                  Bài {n}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo số nét */}
          <div className="flex items-center gap-2">
            <label htmlFor="filter-strokes" className="text-xs font-semibold text-muted-foreground shrink-0">
              Nét:
            </label>
            <select
              id="filter-strokes"
              value={selectedStrokes}
              onChange={(e) => handleStrokesChange(e.target.value)}
              className="h-11 min-h-11 px-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring"
            >
              <option value="all">Tất cả</option>
              {availableStrokes.map((s) => (
                <option key={s} value={String(s)}>
                  {s} nét
                </option>
              ))}
            </select>
          </div>

          {/* Switch Chỉ chữ đã học */}
          <div className="flex items-center gap-2 min-h-11">
            <button
              type="button"
              id="filter-learned-toggle"
              role="switch"
              aria-checked={onlyLearned}
              disabled={learnedKanjiSet.size === 0}
              onClick={handleLearnedToggle}
              className={cn(
                'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                onlyLearned ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block size-6 transform rounded-full bg-background shadow-md ring-0 transition duration-200 ease-in-out',
                  onlyLearned ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
            <label
              htmlFor="filter-learned-toggle"
              className="text-xs font-semibold text-muted-foreground cursor-pointer select-none"
            >
              Chỉ chữ đã học
            </label>
          </div>

          {/* Nút Xóa bộ lọc nếu đang áp dụng */}
          {hasActiveFilter && (
            <Button
              type="button"
              variant="ghost"
              onClick={resetFilters}
              className="h-11 min-h-11 px-3 text-xs sm:text-sm text-muted-foreground hover:text-foreground"
            >
              <FilterX className="size-4 mr-1" />
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </section>

      {/* 2. Lưới ô vuông Kanji */}
      {filteredList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-4 bg-card/50">
          <p className="text-sm font-medium text-muted-foreground">
            Không có chữ nào khớp bộ lọc.
          </p>
          <Button type="button" variant="secondary" onClick={resetFilters} className="min-h-11 px-4">
            Xóa bộ lọc
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 sm:gap-3.5">
          {filteredList.map((k) => {
            const isLearned = learnedKanjiSet.has(k.character);
            const lesson = getKanjiLesson(k);
            const reading = k.kunyomi[0] ?? k.onyomi[0] ?? '';
            const meaning = k.meanings.vi[0] ?? '';

            return (
              <Link
                key={k.character}
                href={`/hoc/tra-cuu/kanji/${encodeURIComponent(k.character)}`}
                aria-label={`${k.character} — ${meaning}, bài ${lesson ?? 'N5'}${isLearned ? ', đã học' : ''}`}
                className={cn(
                  'group relative flex flex-col items-center justify-between min-h-[104px] sm:min-h-[110px] p-2 sm:p-2.5 rounded-2xl',
                  'border border-border/80 bg-card shadow-2xs transition duration-150',
                  'hover:border-primary/50 hover:shadow-xs hover:translate-y-[-1px]',
                  'active:translate-y-[1px]',
                  'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring'
                )}
              >
                {/* Dấu chấm/badge Đã học */}
                {isLearned && (
                  <span
                    title="Đã học"
                    className="absolute top-2 right-2 size-4 rounded-full bg-primary flex items-center justify-center shadow-xs"
                  >
                    <Check className="size-2.5 text-primary-foreground stroke-3" />
                  </span>
                )}

                {/* Chữ Hán lớn */}
                <span
                  lang="ja"
                  className="font-jp text-2xl sm:text-3xl font-medium text-foreground group-hover:text-primary transition-colors mt-0.5"
                >
                  {k.character}
                </span>

                {/* Nghĩa ngắn tiếng Việt / Hán Việt */}
                <span className="text-xs font-semibold text-foreground line-clamp-1 text-center capitalize px-0.5">
                  {meaning}
                </span>

                {/* Cách đọc chính (âm On / Kun) */}
                <span className="font-jp text-[11px] text-muted-foreground line-clamp-1 text-center px-0.5">
                  {reading}
                </span>

                {/* Số bài / Badge */}
                <div className="mt-0.5 flex flex-col items-center">
                  {isLearned ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
                      Đã học
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">
                      {lesson ? `Bài ${lesson}` : 'N5'}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
