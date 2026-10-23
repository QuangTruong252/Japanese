'use client';

import { useMemo, useState, useEffect, useRef, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, FilterX, ChevronDown, ChevronRight } from 'lucide-react';
import type { VerbItem } from '@/types/lookup';
import { filterVerbs } from '@/lib/lookup';
import { Furigana } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { VerbGroupBadge } from '@/components/VerbGroupBadge';
import { Accent, BookSpread, Chip, Ribbon } from '@/components/PaperKit';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function verbForms(v: VerbItem) {
  return [
    { label: 'ます', value: v.masu },
    { label: 'て', value: v.te },
    { label: 'Từ điển', value: v.dictionary },
    { label: 'ない', value: v.nai ?? '—' },
    { label: 'た', value: v.ta },
  ];
}

/** Chi tiết một động từ ở trang phải của sách mở (PC): 5 thể, mỗi thể có nút đọc. */
function VerbPanel({ verb }: { verb: VerbItem }) {
  const { mainVerb, collocation } = splitCollocation(verb.verb);
  return (
    <div className="relative space-y-5 pb-24">
      <div className="space-y-2 border-b border-border pb-4">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
          <Furigana text={mainVerb} className="jp-display text-5xl font-semibold leading-tight text-foreground" />
          {collocation && <span className="pb-1 text-sm text-muted-foreground">（{collocation}）</span>}
        </div>
        <p className="font-serif text-xl text-muted-foreground">{verb.meaning.vi}</p>
        <div className="flex flex-wrap items-center gap-2">
          <VerbGroupBadge group={verb.group} />
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">Bài {verb.lesson}</span>
        </div>
      </div>

      <dl className="space-y-2">
        {verbForms(verb).map((f) => (
          <div key={f.label} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2">
            <dt className="w-16 shrink-0 text-sm text-muted-foreground">{f.label}</dt>
            <dd lang="ja" className="jp-display min-w-0 flex-1 text-2xl font-semibold text-foreground">
              {f.value}
            </dd>
            {f.value !== '—' && (
              <SpeakButton
                text={f.value}
                label={`${f.label}: ${f.value}`}
                iconClassName="size-4"
                className="size-11 w-11 rounded-full border border-border bg-secondary text-primary hover:bg-accent"
              />
            )}
          </div>
        ))}
      </dl>

      <Accent kind="sprig-left" className="bottom-0 right-0 w-28" />
    </div>
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
  /** Đầu trang (tiêu đề) nằm trong trang trái của sách mở. */
  header: ReactNode;
}

export function VerbTable({ verbs, header }: VerbTableProps) {
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

  // Hàng được chọn: tablet mở rộng tại chỗ, PC hiện ở trang phải (chưa chọn thì PC lấy hàng đầu)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const firstMatchDesktopRef = useRef<HTMLLIElement | null>(null);
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
  const activeVerb = filteredVerbs.find((v) => v.id === selectedId) ?? filteredVerbs[0];

  const left = (
    <div className="space-y-6">
      {header}
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

          {/* Từ md: danh sách dày; tablet mở rộng hàng tại chỗ, PC chọn hàng để xem ở trang phải */}
          <ul aria-label="Danh sách 156 động từ N5" className="hidden divide-y divide-border border-y border-border md:block">
            {filteredVerbs.map((v, idx) => {
              const isFirstMatch = query.trim() !== '' && idx === 0;
              const isOpen = selectedId === v.id;
              const isActive = activeVerb?.id === v.id;
              const { mainVerb } = splitCollocation(v.verb);

              return (
                <li
                  key={v.id}
                  ref={isFirstMatch ? firstMatchDesktopRef : undefined}
                  className={cn('relative transition-colors', isOpen && 'bg-accent', isActive && 'lg:bg-accent')}
                >
                  {isActive && <Ribbon className="top-4 max-lg:hidden" />}
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setSelectedId(isOpen ? null : v.id)}
                    className="flex min-h-14 w-full items-center gap-3 px-3 py-1 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring"
                  >
                    <Furigana
                      text={mainVerb}
                      zoomable={false}
                      className="jp-display w-44 shrink-0 text-xl font-semibold text-foreground"
                    />
                    <span className="min-w-0 flex-1 text-sm text-foreground">{v.meaning.vi}</span>
                    <VerbGroupBadge group={v.group} />
                    <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">Bài {v.lesson}</span>
                    {isOpen ? (
                      <ChevronDown className="size-5 shrink-0 text-muted-foreground lg:hidden" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="grid grid-cols-5 gap-2 px-3 pb-3 lg:hidden">
                      {verbForms(v).map((f) => (
                        <div key={f.label} className="rounded-lg border border-border bg-card px-1 py-2 text-center">
                          <span className="block text-xs text-muted-foreground">{f.label}</span>
                          <span lang="ja" className="jp-display block text-lg font-semibold text-foreground">
                            {f.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      </div>
    </div>
  );

  const right = (
    <aside aria-label="Chi tiết động từ" aria-live="polite" className="hidden lg:block">
      {activeVerb && <VerbPanel key={activeVerb.id} verb={activeVerb} />}
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
