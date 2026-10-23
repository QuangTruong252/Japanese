'use client';

import { useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, FilterX, Search, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { KanjiData } from '@/types/lookup';
import { getKanjiLesson } from '@/lib/lookup';
import { filterKanjiWithQuery } from '@/lib/kanji-filter';
import { Button, buttonVariants } from '@/components/ui/button';
import { Accent, BookSpread } from '@/components/PaperKit';
import { KanjiDetailPanel } from '@/components/lookup/KanjiDetailPanel';
import { cn } from '@/lib/utils';

const selectLabelClass =
  'flex h-11 items-center gap-1.5 rounded-xl border border-border bg-card pl-3 pr-1 text-sm font-medium';
const selectClass =
  'h-full min-w-0 rounded-lg bg-transparent pr-1 text-sm font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring';

interface KanjiGridProps {
  kanjiList: KanjiData[];
  kanjiTargetIds: Record<string, string[]>;
  /** Đầu trang (tiêu đề, lối vào luyện viết) nằm trong trang trái của sách mở. */
  header: ReactNode;
}

export function KanjiGrid({ kanjiList, kanjiTargetIds, header }: KanjiGridProps) {
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

  // Từ `lg` bấm chữ là chọn để xem chi tiết ở trang phải; dưới `lg` link đi thẳng sang trang chữ
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const selectedKanji = kanjiList.find((k) => k.character === selectedChar);
  const selectOnWide = (ch: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || !window.matchMedia('(min-width: 1024px)').matches) return;
    e.preventDefault();
    setSelectedChar(ch);
  };

  const hasActiveFilter =
    query.trim() !== '' || selectedLesson !== 'all' || selectedStrokes !== 'all' || onlyLearned;

  const left = (
    <div className="space-y-6">
      {header}
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
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 lg:gap-2 xl:grid-cols-7">
          {filteredList.map((k) => {
            const isLearned = learnedKanjiSet.has(k.character);
            const isSelected = k.character === selectedChar;
            const lesson = getKanjiLesson(k);
            const reading = k.kunyomi[0] ?? k.onyomi[0] ?? '';
            const meaning = k.meanings.vi[0] ?? '';

            return (
              <Link
                key={k.character}
                href={`/hoc/tra-cuu/kanji/${encodeURIComponent(k.character)}`}
                onClick={selectOnWide(k.character)}
                aria-current={isSelected ? 'true' : undefined}
                aria-label={`${k.character}${k.hanviet ? ` (${k.hanviet})` : ''} — ${meaning}, bài ${lesson ?? 'N5'}${isLearned ? ', đã học' : ''}`}
                className={cn(
                  'relative flex min-w-0 flex-col items-center gap-0.5 rounded-xl border px-1 pb-2 pt-2 text-center outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring lg:gap-0 lg:pb-1.5 lg:pt-1.5',
                  isSelected ? 'border-primary/40 bg-accent' : 'border-border bg-card hover:bg-muted/60',
                )}
              >
                {isLearned && (
                  <span
                    title="Đã học"
                    className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-accent text-primary"
                  >
                    <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                )}

                <span lang="ja" className="jp-display text-3xl font-medium leading-tight text-foreground sm:text-4xl lg:text-3xl lg:leading-none">
                  {k.character}
                </span>
                {k.hanviet && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">{k.hanviet}</span>
                )}
                <span className="text-xs text-foreground lg:w-full lg:truncate">{meaning}</span>
                <span lang="ja" className="jp text-xs leading-snug text-muted-foreground lg:w-full lg:truncate">
                  {reading}
                </span>

                <span
                  className={cn(
                    'mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs lg:mt-0.5 lg:py-0',
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
    </div>
  );

  const right = (
    <aside aria-label="Chi tiết chữ Hán" aria-live="polite" className="hidden lg:block">
      {selectedKanji ? (
        <KanjiDetailPanel key={selectedKanji.character} kanji={selectedKanji} />
      ) : (
        <div className="relative flex min-h-96 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="font-serif text-xl font-semibold text-foreground">Chọn một chữ</p>
          <p className="max-w-64 text-sm text-muted-foreground">
            Bấm hoặc nhấn Enter trên một chữ bên trái để xem thứ tự nét, âm đọc và từ ghép ngay tại đây.
          </p>
          <Link
            href="/luyen-viet?tab=kanji"
            className={cn(buttonVariants({ variant: 'secondary' }), 'min-h-11 px-4')}
          >
            Luyện viết kanji
          </Link>
          <Accent kind="sprig-left" className="bottom-0 right-0 w-28" />
        </div>
      )}
    </aside>
  );

  return (
    <BookSpread
      leftWidth="wide"
      sticky="right"
      stickyTop="4.25rem"
      className="max-lg:space-y-0"
      left={left}
      right={right}
    />
  );
}
