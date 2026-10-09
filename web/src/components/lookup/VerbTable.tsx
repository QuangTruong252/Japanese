'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, FilterX } from 'lucide-react';
import type { VerbItem } from '@/types/lookup';
import { filterVerbs } from '@/lib/lookup';
import { Furigana } from '@/components/Furigana';
import { Chip } from '@/components/PaperKit';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const GROUP_DOT: Record<number, string> = {
  1: 'bg-verb-1',
  2: 'bg-verb-2',
  3: 'bg-verb-3',
};

/** Màu nằm ở chấm tròn, chữ giữ màu chữ: màu verb-N không đủ tương phản làm chữ ở cả hai theme. */
function VerbGroupBadge({ group }: { group: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-foreground">
      <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', GROUP_DOT[group])} />
      Nhóm {group}
    </span>
  );
}

/** Tách cụm đi kèm ở cuối chuỗi, ví dụ `会[あ]います[ともだちに〜]`. */
function splitCollocation(verb: string) {
  const match = verb.match(/\[([^\]]*〜)\]$/);
  return {
    mainVerb: match ? verb.slice(0, match.index) : verb,
    collocation: match ? match[1] : null,
  };
}

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
      <section aria-label="Tìm kiếm và lọc động từ" className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Tìm động từ (あう, 行きます, gặp...)"
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
          <Chip pressed={selectedGroup === null} onClick={() => handleGroupSelect(null)}>
            Tất cả
          </Chip>
          {[1, 2, 3].map((g) => (
            <Chip
              key={g}
              pressed={selectedGroup === g}
              onClick={() => handleGroupSelect(selectedGroup === g ? null : g)}
            >
              Nhóm {g}
            </Chip>
          ))}

          <label
            htmlFor="verb-filter-lesson"
            className="flex h-11 items-center gap-1.5 rounded-xl border border-border bg-card pl-3 pr-1 text-sm font-medium"
          >
            <span className="text-muted-foreground">Bài:</span>
            <select
              id="verb-filter-lesson"
              value={selectedLesson ?? 'all'}
              onChange={(e) => handleLessonChange(e.target.value)}
              className="h-full min-w-0 rounded-lg bg-transparent pr-1 text-sm font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring"
            >
              <option value="all">Tất cả bài</option>
              {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={String(n)}>
                  Bài {n}
                </option>
              ))}
            </select>
          </label>

          {hasFilter && (
            <Button
              type="button"
              variant="ghost"
              onClick={resetFilters}
              className="h-11 min-h-11 px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              <FilterX className="mr-1 size-4" aria-hidden="true" />
              Xóa
            </Button>
          )}
        </div>
      </section>

      {filteredVerbs.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Không tìm thấy động từ nào khớp với điều kiện lọc.
          </p>
          <Button type="button" variant="secondary" onClick={resetFilters} className="min-h-11 px-4">
            Xóa bộ lọc
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile (<md): thẻ giấy, nghĩa thấy ngay, không cuộn ngang */}
          <div className="space-y-3 md:hidden" aria-label="Danh sách động từ N5">
            {filteredVerbs.map((v, idx) => {
              const isFirstMatch = query.trim() !== '' && idx === 0;
              const { mainVerb, collocation } = splitCollocation(v.verb);
              const forms = [
                { label: 'ます', value: v.masu },
                { label: 'て', value: v.te },
                { label: 'Từ điển', value: v.dictionary },
                { label: 'ない', value: v.nai ?? '—' },
                { label: 'た', value: v.ta },
              ];

              return (
                <article
                  key={v.id}
                  ref={isFirstMatch ? firstMatchMobileRef : undefined}
                  className={cn(
                    'space-y-3 rounded-xl border border-border bg-card p-4',
                    isFirstMatch && 'border-primary/40 bg-accent'
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Furigana text={mainVerb} className="jp-display text-2xl font-bold text-foreground" />
                      <VerbGroupBadge group={v.group} />
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                        Bài {v.lesson}
                      </span>
                    </div>
                    {collocation && <p className="text-sm text-muted-foreground">（{collocation}）</p>}
                    <p className="text-sm text-foreground">{v.meaning.vi}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {forms.map((f) => (
                      <div key={f.label} className="rounded-lg border border-border bg-secondary px-1 py-1.5 text-center">
                        <span className="block text-xs text-muted-foreground">{f.label}</span>
                        <span lang="ja" className="jp block text-sm font-medium text-foreground">
                          {f.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Từ md: bảng, cột Động từ ghim bên trái */}
          <div
            tabIndex={0}
            role="region"
            aria-label="Bảng chia 156 động từ N5"
            className="hidden overflow-x-auto rounded-xl border border-border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring md:block"
          >
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Bảng 156 động từ N5 với cột nghĩa ngay sau động từ và 5 thể: ます, て, từ điển, ない, た
              </caption>
              <thead>
                <tr className="border-b border-border bg-secondary text-xs font-semibold text-muted-foreground">
                  <th scope="col" className="sticky left-0 z-20 min-w-32 bg-secondary px-4 py-3 shadow-[1px_0_0_0_var(--color-border)]">
                    Động từ
                  </th>
                  <th scope="col" className="min-w-36 px-4 py-3">Nghĩa</th>
                  <th scope="col" className="min-w-24 px-3 py-3">ます</th>
                  <th scope="col" className="min-w-24 px-3 py-3">て</th>
                  <th scope="col" className="min-w-24 px-3 py-3">Từ điển</th>
                  <th scope="col" className="min-w-24 px-3 py-3">ない</th>
                  <th scope="col" className="min-w-24 px-3 py-3">た</th>
                  <th scope="col" className="min-w-16 px-3 py-3 text-center">Bài</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVerbs.map((v, idx) => {
                  const isFirstMatch = query.trim() !== '' && idx === 0;
                  const { mainVerb, collocation } = splitCollocation(v.verb);

                  return (
                    <tr
                      key={v.id}
                      ref={isFirstMatch ? firstMatchDesktopRef : undefined}
                      className={cn('transition-colors hover:bg-muted/30', isFirstMatch && 'bg-accent')}
                    >
                      <th
                        scope="row"
                        className={cn(
                          'sticky left-0 z-10 px-4 py-3 font-normal shadow-[1px_0_0_0_var(--color-border)]',
                          isFirstMatch ? 'bg-accent' : 'bg-card'
                        )}
                      >
                        <div className="space-y-1">
                          <Furigana text={mainVerb} className="text-base font-bold text-foreground" />
                          {collocation && (
                            <span className="block text-xs font-normal leading-tight text-muted-foreground">
                              （{collocation}）
                            </span>
                          )}
                          <VerbGroupBadge group={v.group} />
                        </div>
                      </th>
                      <td className="px-4 py-3 text-foreground">{v.meaning.vi}</td>
                      <td className="jp whitespace-nowrap px-3 py-3 text-foreground">{v.masu}</td>
                      <td className="jp whitespace-nowrap px-3 py-3 text-foreground">{v.te}</td>
                      <td className="jp whitespace-nowrap px-3 py-3 font-semibold text-foreground">{v.dictionary}</td>
                      <td className="jp whitespace-nowrap px-3 py-3 text-foreground">{v.nai ?? '—'}</td>
                      <td className="jp whitespace-nowrap px-3 py-3 text-foreground">{v.ta}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-center text-xs text-muted-foreground">
                        Bài {v.lesson}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
