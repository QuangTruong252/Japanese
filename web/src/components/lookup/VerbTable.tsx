'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, FilterX } from 'lucide-react';
import type { VerbItem } from '@/types/lookup';
import { filterVerbs } from '@/lib/lookup';
import { Furigana } from '@/components/Furigana';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VerbTableProps {
  verbs: VerbItem[];
}

export function VerbTable({ verbs }: VerbTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramQuery = searchParams.get('q') ?? '';
  const paramGroup = searchParams.get('nhom');
  const paramLesson = searchParams.get('bai');

  const [query, setQuery] = useState(paramQuery);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(
    paramGroup ? Number(paramGroup) : null
  );
  const [selectedLesson, setSelectedLesson] = useState<number | null>(
    paramLesson ? Number(paramLesson) : null
  );

  const firstMatchDesktopRef = useRef<HTMLTableRowElement | null>(null);
  const firstMatchMobileRef = useRef<HTMLElement | null>(null);

  // Cập nhật URL Search Params
  const updateUrl = (newQuery: string, newGroup: number | null, newLesson: number | null) => {
    const params = new URLSearchParams();
    if (newQuery.trim()) params.set('q', newQuery.trim());
    if (newGroup !== null) params.set('nhom', String(newGroup));
    if (newLesson !== null) params.set('bai', String(newLesson));

    const str = params.toString();
    router.replace(str ? `?${str}` : window.location.pathname, { scroll: false });
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    updateUrl(val, selectedGroup, selectedLesson);
  };

  const handleGroupSelect = (group: number | null) => {
    setSelectedGroup(group);
    updateUrl(query, group, selectedLesson);
  };

  const handleLessonChange = (val: string) => {
    const lesson = val === 'all' ? null : Number(val);
    setSelectedLesson(lesson);
    updateUrl(query, selectedGroup, lesson);
  };

  const resetFilters = () => {
    setQuery('');
    setSelectedGroup(null);
    setSelectedLesson(null);
    updateUrl('', null, null);
  };

  // Lọc danh sách động từ
  const filteredVerbs = useMemo(() => {
    return filterVerbs(verbs, {
      group: selectedGroup,
      lesson: selectedLesson,
      query,
    });
  }, [verbs, selectedGroup, selectedLesson, query]);

  // Cuộn tới kết quả khớp đầu tiên nếu có paramQuery
  useEffect(() => {
    if (query.trim()) {
      if (typeof window !== 'undefined' && window.innerWidth < 768 && firstMatchMobileRef.current) {
        firstMatchMobileRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (firstMatchDesktopRef.current) {
        firstMatchDesktopRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [query]);

  const hasFilter = query.trim() !== '' || selectedGroup !== null || selectedLesson !== null;

  return (
    <div className="space-y-5">
      {/* 1. Ô tìm kiếm & Bộ lọc (control ≥44px, wrap trong 390px) */}
      <section
        aria-label="Tìm kiếm và lọc động từ"
        className="space-y-4 p-4 rounded-2xl border border-border/80 bg-card shadow-xs"
      >
        {/* Input Tìm kiếm ?q= */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Tìm động từ (あう, 行きます, gặp...)"
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

        {/* Hàng nút lọc Nhóm và Bài: wrap trong 390px, chip/select/nút ≥44px */}
        <div className="flex flex-wrap items-center gap-3 pt-0.5">
          {/* Nhóm động từ (Nhóm 1, Nhóm 2, Nhóm 3) kèm màu token Washi */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleGroupSelect(null)}
              className={cn(
                'min-h-11 h-11 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition inline-flex items-center justify-center',
                'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring',
                selectedGroup === null
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              Tất cả
            </button>

            <button
              type="button"
              onClick={() => handleGroupSelect(selectedGroup === 1 ? null : 1)}
              className={cn(
                'min-h-11 h-11 px-3.5 rounded-xl text-xs sm:text-sm font-semibold border transition inline-flex items-center justify-center',
                'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring',
                selectedGroup === 1
                  ? 'bg-verb-1 text-primary-foreground border-verb-1 shadow-xs'
                  : 'bg-verb-1/10 text-verb-1 border-verb-1/30 hover:bg-verb-1/20'
              )}
            >
              Nhóm 1
            </button>

            <button
              type="button"
              onClick={() => handleGroupSelect(selectedGroup === 2 ? null : 2)}
              className={cn(
                'min-h-11 h-11 px-3.5 rounded-xl text-xs sm:text-sm font-semibold border transition inline-flex items-center justify-center',
                'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring',
                selectedGroup === 2
                  ? 'bg-verb-2 text-primary-foreground border-verb-2 shadow-xs'
                  : 'bg-verb-2/10 text-verb-2 border-verb-2/30 hover:bg-verb-2/20'
              )}
            >
              Nhóm 2
            </button>

            <button
              type="button"
              onClick={() => handleGroupSelect(selectedGroup === 3 ? null : 3)}
              className={cn(
                'min-h-11 h-11 px-3.5 rounded-xl text-xs sm:text-sm font-semibold border transition inline-flex items-center justify-center',
                'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring',
                selectedGroup === 3
                  ? 'bg-verb-3 text-primary-foreground border-verb-3 shadow-xs'
                  : 'bg-verb-3/10 text-verb-3 border-verb-3/30 hover:bg-verb-3/20'
              )}
            >
              Nhóm 3
            </button>
          </div>

          {/* Dropdown Bài và Nút Xóa */}
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="verb-filter-lesson" className="text-xs font-semibold text-muted-foreground shrink-0">
              Bài:
            </label>
            <select
              id="verb-filter-lesson"
              value={selectedLesson ?? 'all'}
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

            {hasFilter && (
              <Button
                type="button"
                variant="ghost"
                onClick={resetFilters}
                className="h-11 min-h-11 px-3.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground"
              >
                <FilterX className="size-4 mr-1" />
                Xóa
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Danh sách / Bảng động từ */}
      {filteredVerbs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-4 bg-card/50">
          <p className="text-sm font-medium text-muted-foreground">
            Không tìm thấy động từ nào khớp với điều kiện lọc.
          </p>
          <Button type="button" variant="secondary" onClick={resetFilters} className="min-h-11 px-4">
            Xóa bộ lọc
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 2a. Mobile view (<md): Dạng thẻ danh sách, hiện nghĩa ngay, không cuộn ngang */}
          <div className="space-y-3 block md:hidden" aria-label="Danh sách động từ N5">
            {filteredVerbs.map((v, idx) => {
              const isFirstMatch = query.trim() !== '' && idx === 0;
              const match = v.verb.match(/\[([^\]]*〜)\]$/);
              const mainVerb = match ? v.verb.slice(0, match.index) : v.verb;
              const colocation = match ? match[1] : null;

              return (
                <article
                  key={v.id}
                  ref={isFirstMatch ? firstMatchMobileRef : undefined}
                  className={cn(
                    'p-4 rounded-2xl border border-border/80 bg-card shadow-2xs space-y-3 transition-colors',
                    isFirstMatch && 'bg-primary/10 border-primary/40'
                  )}
                >
                  {/* Dòng đầu: Động từ + Nhóm badge + Bài badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Furigana text={mainVerb} className="font-bold text-base text-foreground" />
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-md inline-block',
                            v.group === 1 && 'bg-verb-1/15 text-verb-1',
                            v.group === 2 && 'bg-verb-2/15 text-verb-2',
                            v.group === 3 && 'bg-verb-3/15 text-verb-3'
                          )}
                        >
                          Nhóm {v.group}
                        </span>
                      </div>
                      {colocation && (
                        <span className="text-xs text-muted-foreground block font-normal">
                          （{colocation}）
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0 border border-border/60">
                      Bài {v.lesson}
                    </span>
                  </div>

                  {/* Dòng 2: Nghĩa tiếng Việt — thấy ngay không cần vuốt */}
                  <div className="text-sm font-medium text-foreground">
                    {v.meaning.vi}
                  </div>

                  {/* Dòng 3: 5 thể chia hiện gọn gàng bên dưới theo lưới 2-3 cột nhỏ */}
                  <div className="pt-2 border-t border-border/50 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-muted/40 p-2 rounded-xl space-y-0.5">
                      <span className="text-[10px] font-semibold text-muted-foreground block">ます</span>
                      <span lang="ja" className="font-jp font-medium text-foreground text-xs sm:text-sm block">
                        {v.masu}
                      </span>
                    </div>

                    <div className="bg-muted/40 p-2 rounded-xl space-y-0.5">
                      <span className="text-[10px] font-semibold text-muted-foreground block">て</span>
                      <span lang="ja" className="font-jp font-medium text-foreground text-xs sm:text-sm block">
                        {v.te}
                      </span>
                    </div>

                    <div className="bg-muted/40 p-2 rounded-xl space-y-0.5">
                      <span className="text-[10px] font-semibold text-muted-foreground block">Từ điển</span>
                      <span lang="ja" className="font-jp font-bold text-foreground text-xs sm:text-sm block">
                        {v.dictionary}
                      </span>
                    </div>

                    <div className="bg-muted/40 p-2 rounded-xl space-y-0.5">
                      <span className="text-[10px] font-semibold text-muted-foreground block">ない</span>
                      <span lang="ja" className="font-jp font-medium text-foreground text-xs sm:text-sm block">
                        {v.nai ?? '—'}
                      </span>
                    </div>

                    <div className="bg-muted/40 p-2 rounded-xl space-y-0.5 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-semibold text-muted-foreground block">た</span>
                      <span lang="ja" className="font-jp font-medium text-foreground text-xs sm:text-sm block">
                        {v.ta}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* 2b. Desktop view (≥md): Bảng giữ nguyên nhưng đưa cột Nghĩa lên ngay sau Động từ */}
          <div
            tabIndex={0}
            role="region"
            aria-label="Bảng chia 156 động từ N5"
            className="hidden md:block overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-xs focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring"
          >
            <table className="w-full text-left text-sm border-collapse">
              <caption className="sr-only">
                Bảng 156 động từ N5 với cột nghĩa ngay sau động từ và 5 thể: ます, て, từ điển, ない, た
              </caption>
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground">
                  <th scope="col" className="sticky left-0 bg-muted py-3.5 px-4 z-20 min-w-[130px] shadow-[1px_0_0_0_var(--color-border)]">
                    Động từ
                  </th>
                  {/* Cột Nghĩa đưa lên ngay sau Động từ */}
                  <th scope="col" className="py-3.5 px-4 min-w-[150px]">
                    Nghĩa
                  </th>
                  <th scope="col" className="py-3.5 px-3 min-w-[100px]">ます</th>
                  <th scope="col" className="py-3.5 px-3 min-w-[90px]">て</th>
                  <th scope="col" className="py-3.5 px-3 min-w-[90px]">Từ điển</th>
                  <th scope="col" className="py-3.5 px-3 min-w-[90px]">ない</th>
                  <th scope="col" className="py-3.5 px-3 min-w-[90px]">た</th>
                  <th scope="col" className="py-3.5 px-3 min-w-[70px] text-center">Bài</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredVerbs.map((v, idx) => {
                  const isFirstMatch = query.trim() !== '' && idx === 0;

                  return (
                    <tr
                      key={v.id}
                      ref={isFirstMatch ? firstMatchDesktopRef : undefined}
                      className={cn(
                        'transition-colors duration-100 hover:bg-muted/30',
                        isFirstMatch && 'bg-primary/10'
                      )}
                    >
                      {/* Cột 1: Động từ ghim cố định sticky */}
                      <th
                        scope="row"
                        className={cn(
                          'sticky left-0 py-3 px-4 z-10 font-normal',
                          'bg-card shadow-[1px_0_0_0_var(--color-border)]',
                          isFirstMatch && 'bg-primary/15'
                        )}
                      >
                        {(() => {
                          const match = v.verb.match(/\[([^\]]*〜)\]$/);
                          const mainVerb = match ? v.verb.slice(0, match.index) : v.verb;
                          const colocation = match ? match[1] : null;

                          return (
                            <div className="space-y-1">
                              <Furigana text={mainVerb} className="font-bold text-sm sm:text-base text-foreground" />
                              {colocation && (
                                <span className="text-[11px] text-muted-foreground block font-normal leading-tight">
                                  （{colocation}）
                                </span>
                              )}
                              <div>
                                <span
                                  className={cn(
                                    'text-[10px] font-bold px-1.5 py-0.2 rounded-md inline-block',
                                    v.group === 1 && 'bg-verb-1/15 text-verb-1',
                                    v.group === 2 && 'bg-verb-2/15 text-verb-2',
                                    v.group === 3 && 'bg-verb-3/15 text-verb-3'
                                  )}
                                >
                                  Nhóm {v.group}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </th>

                      {/* Cột 2: Nghĩa ngay sau Động từ */}
                      <td className="py-3 px-4 text-foreground font-medium text-xs sm:text-sm">
                        {v.meaning.vi}
                      </td>

                      {/* Cột 3: ます */}
                      <td className="py-3 px-3 font-jp text-foreground whitespace-nowrap">
                        {v.masu}
                      </td>

                      {/* Cột 4: て */}
                      <td className="py-3 px-3 font-jp text-foreground whitespace-nowrap">
                        {v.te}
                      </td>

                      {/* Cột 5: Từ điển */}
                      <td className="py-3 px-3 font-jp font-semibold text-foreground whitespace-nowrap">
                        {v.dictionary}
                      </td>

                      {/* Cột 6: ない */}
                      <td className="py-3 px-3 font-jp text-foreground whitespace-nowrap">
                        {v.nai ?? '—'}
                      </td>

                      {/* Cột 7: た */}
                      <td className="py-3 px-3 font-jp text-foreground whitespace-nowrap">
                        {v.ta}
                      </td>

                      {/* Cột 8: Bài */}
                      <td className="py-3 px-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                        Bài {v.lesson}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
