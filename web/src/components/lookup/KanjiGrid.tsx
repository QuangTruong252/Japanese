'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, FilterX } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { KanjiData } from '@/types/lookup';
import { filterKanji, getKanjiLesson } from '@/lib/lookup';
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
  const paramLesson = searchParams.get('bai');
  const paramStrokes = searchParams.get('net');
  const paramOnlyLearned = searchParams.get('da_hoc') === '1';

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
  const updateParams = (newLesson: string, newStrokes: string, newLearned: boolean) => {
    const params = new URLSearchParams();
    if (newLesson !== 'all') params.set('bai', newLesson);
    if (newStrokes !== 'all') params.set('net', newStrokes);
    if (newLearned) params.set('da_hoc', '1');

    const str = params.toString();
    router.replace(str ? `?${str}` : window.location.pathname, { scroll: false });
  };

  const handleLessonChange = (val: string) => {
    setSelectedLesson(val);
    updateParams(val, selectedStrokes, onlyLearned);
  };

  const handleStrokesChange = (val: string) => {
    setSelectedStrokes(val);
    updateParams(selectedLesson, val, onlyLearned);
  };

  const handleLearnedToggle = () => {
    const next = !onlyLearned;
    setOnlyLearned(next);
    updateParams(selectedLesson, selectedStrokes, next);
  };

  const resetFilters = () => {
    setSelectedLesson('all');
    setSelectedStrokes('all');
    setOnlyLearned(false);
    updateParams('all', 'all', false);
  };

  // Lọc danh sách
  const filteredList = useMemo(() => {
    return filterKanji(
      kanjiList,
      {
        lesson: selectedLesson === 'all' ? null : Number(selectedLesson),
        strokes: selectedStrokes === 'all' ? null : Number(selectedStrokes),
        onlyLearned,
      },
      learnedKanjiSet
    );
  }, [kanjiList, selectedLesson, selectedStrokes, onlyLearned, learnedKanjiSet]);

  // Danh sách các số nét có thật trong 169 chữ
  const availableStrokes = useMemo(() => {
    const set = new Set(kanjiList.map((k) => k.strokes));
    return Array.from(set).sort((a, b) => a - b);
  }, [kanjiList]);

  const hasActiveFilter = selectedLesson !== 'all' || selectedStrokes !== 'all' || onlyLearned;

  return (
    <div className="space-y-6">
      {/* 1. Thanh Bộ lọc */}
      <section
        aria-label="Bộ lọc Kanji"
        className="flex flex-wrap items-center gap-3 sm:gap-4 p-4 rounded-2xl border border-border/80 bg-card shadow-xs"
      >
        {/* Lọc theo bài */}
        <div className="flex flex-col gap-1 min-w-[110px]">
          <label htmlFor="filter-lesson" className="text-xs font-semibold text-muted-foreground">
            Bài
          </label>
          <select
            id="filter-lesson"
            value={selectedLesson}
            onChange={(e) => handleLessonChange(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-sm font-medium text-foreground focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring"
          >
            <option value="all">Tất cả</option>
            {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={String(n)}>
                Bài {n}
              </option>
            ))}
          </select>
        </div>

        {/* Lọc theo số nét */}
        <div className="flex flex-col gap-1 min-w-[110px]">
          <label htmlFor="filter-strokes" className="text-xs font-semibold text-muted-foreground">
            Số nét
          </label>
          <select
            id="filter-strokes"
            value={selectedStrokes}
            onChange={(e) => handleStrokesChange(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-sm font-medium text-foreground focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring"
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
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted-foreground">
            Chỉ chữ đã học
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={onlyLearned}
            disabled={learnedKanjiSet.size === 0}
            onClick={handleLearnedToggle}
            className={cn(
              'relative inline-flex h-9 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
              'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
              onlyLearned ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block size-7 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out mt-0.5',
                onlyLearned ? 'translate-x-5' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>

        {/* Nút Xóa bộ lọc nếu đang áp dụng */}
        {hasActiveFilter && (
          <div className="flex flex-col justify-end self-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              <FilterX className="size-3.5 mr-1" />
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </section>

      {/* 2. Lưới ô vuông Kanji */}
      {filteredList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-4 bg-card/50">
          <p className="text-sm font-medium text-muted-foreground">
            Không có chữ nào khớp bộ lọc.
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={resetFilters}>
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
                  'group relative flex flex-col items-center justify-between min-h-[92px] p-2.5 rounded-2xl',
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
                  className="font-jp text-3xl sm:text-4xl font-medium text-foreground group-hover:text-primary transition-colors mt-1"
                >
                  {k.character}
                </span>

                {/* Cách đọc chính */}
                <span className="font-jp text-[11px] text-muted-foreground line-clamp-1 text-center">
                  {reading}
                </span>

                {/* Số bài / Badge */}
                <div className="mt-1 flex flex-col items-center">
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
