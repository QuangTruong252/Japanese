'use client';

import { useState, useEffect, useRef, useMemo, useId } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, CornerDownLeft, ArrowDown, ArrowUp } from 'lucide-react';
import { useUIStore } from '@/lib/store';
import {
  buildSearchIndex,
  getCachedSearchIndex,
  executeSearch,
  type SearchEntry,
  type SearchKind,
} from '@/lib/search';
import { Furigana } from '@/components/Furigana';
import { cn } from '@/lib/utils';

const KIND_LABELS: Record<SearchKind, string> = {
  vocab: 'TỪ VỰNG',
  grammar: 'NGỮ PHÁP',
  kanji: 'KANJI',
  verb: 'ĐỘNG TỪ',
  table: 'BẢNG THAM CHIẾU',
  lesson: 'BÀI HỌC',
};

const SUGGESTIONS = ['学生', 'がくせい', 'gakusei', 'hoc sinh'];

interface SearchModalInnerProps {
  onClose: () => void;
}

function SearchModalInner({ onClose }: SearchModalInnerProps) {
  const router = useRouter();
  const listboxId = useId();

  const cached = getCachedSearchIndex();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [entries, setEntries] = useState<SearchEntry[]>(() => cached ?? []);
  const [isLoadingIndex, setIsLoadingIndex] = useState(() => !cached);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxRef = useRef<HTMLUListElement | null>(null);

  // 1. Khi mount: lưu active element trước đó, focus input, khi unmount trả lại focus
  useEffect(() => {
    const prevEl = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => {
      prevEl?.focus?.();
    };
  }, []);

  // 2. Nạp dữ liệu chỉ mục lazy khi modal mở (nếu chưa có cache)
  useEffect(() => {
    if (cached) return;
    let active = true;
    buildSearchIndex()
      .then((data) => {
        if (active) {
          setEntries(data);
          setIsLoadingIndex(false);
        }
      })
      .catch(() => {
        if (active) setIsLoadingIndex(false);
      });
    return () => {
      active = false;
    };
  }, [cached]);

  // 3. Thực thi tìm kiếm
  const { results, totalMatches } = useMemo(() => {
    return executeSearch(entries, query);
  }, [entries, query]);

  // Cuộn mục active vào tầm nhìn
  useEffect(() => {
    if (results.length > 0) {
      const activeEl = listboxRef.current?.querySelector('[aria-selected="true"]');
      activeEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, results.length]);

  // 4. Xử lý thay đổi từ khóa
  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelectedIndex(0);
  };

  const handleChipClick = (chip: string) => {
    setQuery(chip);
    setSelectedIndex(0);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery('');
    setSelectedIndex(0);
    inputRef.current?.focus();
  };

  // 5. Điều khiển bàn phím trong hộp thoại
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[selectedIndex];
      if (target) {
        onClose();
        router.push(target.href);
      }
    } else if (e.key === 'Tab') {
      // Bẫy focus trong dialog, Tab không đóng hộp (SPEC-13 §6 & §7)
      e.preventDefault();
    }
  };

  const handleSelect = (item: SearchEntry) => {
    onClose();
    router.push(item.href);
  };

  // Gom nhóm kết quả để hiển thị header nhóm
  let globalItemIndex = 0;
  const groupedResults: Array<{ kind: SearchKind; items: Array<{ entry: SearchEntry; index: number }> }> = [];

  for (const item of results) {
    let group = groupedResults.find((g) => g.kind === item.kind);
    if (!group) {
      group = { kind: item.kind, items: [] };
      groupedResults.push(group);
    }
    group.items.push({ entry: item, index: globalItemIndex++ });
  }

  const activeDescendantId = results[selectedIndex]
    ? `search-item-${results[selectedIndex].id}`
    : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hộp tìm kiếm toàn cục"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 sm:pt-[12vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'w-full bg-card shadow-2xl flex flex-col overflow-hidden',
          // Mobile: chiếm toàn màn hình
          'h-full sm:h-auto sm:max-h-[80vh] sm:max-w-xl sm:rounded-2xl sm:border sm:border-border/80',
          'transition-all duration-150 motion-safe:animate-in motion-safe:fade-in-0'
        )}
      >
        {/* 1. Header & Ô nhập Combobox */}
        <div className="flex items-center gap-3 p-3.5 sm:p-4 border-b border-border/80 bg-background shrink-0">
          <Search className="size-5 text-muted-foreground shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeDescendantId}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm từ vựng, ngữ pháp, kanji…"
            className="flex-1 bg-transparent text-base sm:text-lg font-medium text-foreground placeholder:text-muted-foreground outline-hidden"
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="size-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X className="size-4" />
            </button>
          )}

          {/* Nút Hủy trên mobile */}
          <button
            type="button"
            onClick={onClose}
            className="sm:hidden text-sm font-semibold text-primary px-1 hover:opacity-80 cursor-pointer"
          >
            Hủy
          </button>
        </div>

        {/* Thông báo số lượng cho screen reader */}
        <div className="sr-only" aria-live="polite">
          {query.trim() ? `${totalMatches} kết quả cho ${query}` : ''}
        </div>

        {/* 2. Thân danh sách kết quả / Trạng thái */}
        <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-border/40">
          {/* Trạng thái đang nạp chỉ mục lần đầu */}
          {isLoadingIndex && (
            <div className="p-4 space-y-3">
              <div className="h-12 rounded-xl bg-muted/60 animate-pulse" />
              <div className="h-12 rounded-xl bg-muted/40 animate-pulse" />
              <div className="h-12 rounded-xl bg-muted/20 animate-pulse" />
            </div>
          )}

          {/* Trạng thái chưa gõ gì: Gợi ý cách dùng */}
          {!isLoadingIndex && !query.trim() && (
            <div className="p-5 sm:p-6 space-y-3 text-center sm:text-left">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Gõ chữ Hán, kana, romaji hoặc tiếng Việt (không dấu).
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                {SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleChipClick(sug)}
                    className="px-2.5 py-1 rounded-lg border border-border bg-muted/40 text-xs font-medium text-foreground hover:bg-muted hover:border-primary/40 transition-colors cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trạng thái không có kết quả */}
          {!isLoadingIndex && query.trim() && results.length === 0 && (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Không tìm thấy &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Thử gõ romaji (ví dụ: <span className="font-mono">gakusei</span>), tiếng Việt không dấu, hoặc kiểm tra lại chính tả.
              </p>
            </div>
          )}

          {/* Danh sách kết quả có nhóm */}
          {!isLoadingIndex && query.trim() && results.length > 0 && (
            <ul
              id={listboxId}
              ref={listboxRef}
              role="listbox"
              aria-label="Kết quả tìm kiếm"
              className="py-2 focus:outline-hidden"
            >
              {groupedResults.map((group) => (
                <li key={group.kind} role="presentation" className="list-none">
                  {/* Tiêu đề nhóm */}
                  <div
                    role="presentation"
                    className="px-4 pt-3 pb-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase select-none"
                  >
                    {KIND_LABELS[group.kind]}
                  </div>

                  {/* Danh sách mục trong nhóm */}
                  <div role="presentation" className="space-y-0.5">
                    {group.items.map(({ entry, index }) => {
                      const isActive = index === selectedIndex;

                      return (
                        <div
                          key={entry.id}
                          id={`search-item-${entry.id}`}
                          role="option"
                          aria-selected={isActive}
                          onClick={() => handleSelect(entry)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={cn(
                            'group flex items-center justify-between min-h-[48px] px-4 py-2.5 cursor-pointer transition-colors border-l-2',
                            isActive
                              ? 'bg-muted border-l-primary'
                              : 'border-l-transparent hover:bg-muted/40'
                          )}
                        >
                          <div className="flex flex-col min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              {entry.label.includes('[') && entry.label.includes(']') ? (
                                <Furigana text={entry.label} className="font-bold text-sm sm:text-base text-foreground" />
                              ) : (
                                <span lang="ja" className="font-jp font-bold text-sm sm:text-base text-foreground">
                                  {entry.label}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {entry.sublabel}
                            </span>
                          </div>

                          {entry.badge && (
                            <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                              {entry.badge}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </li>
              ))}

              {/* Thông báo nếu còn kết quả ngoài top 20 */}
              {totalMatches > 20 && (
                <li role="presentation" className="p-3 text-center text-xs text-muted-foreground list-none">
                  Còn {totalMatches - 20} kết quả khác — gõ thêm từ khóa để thu hẹp
                </li>
              )}
            </ul>
          )}
        </div>

        {/* 3. Chân hộp thoại hướng dẫn phím tắt (chỉ hiện desktop) */}
        <div className="hidden sm:flex items-center justify-between px-4 py-2.5 border-t border-border/80 bg-muted/30 text-xs text-muted-foreground shrink-0 select-none">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-card">
                <ArrowUp className="size-3" />
                <ArrowDown className="size-3" />
              </span>
              <span>di chuyển</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-card font-mono text-[10px]">
                <CornerDownLeft className="size-3 inline" />
              </kbd>
              <span>mở</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-card font-mono text-[10px]">
                esc
              </kbd>
              <span>đóng</span>
            </span>
          </div>

          <span className="text-[11px] text-muted-foreground">
            {totalMatches > 0 && `${totalMatches} kết quả`}
          </span>
        </div>
      </div>
    </div>
  );
}

export function SearchDialog() {
  const isSearchOpen = useUIStore((s) => s.isSearchOpen);
  const openSearch = useUIStore((s) => s.openSearch);
  const closeSearch = useUIStore((s) => s.closeSearch);

  // Đăng ký phím tắt toàn cục Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isSearchOpen) {
          closeSearch();
        } else {
          openSearch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, openSearch, closeSearch]);

  if (!isSearchOpen) return null;

  return <SearchModalInner onClose={closeSearch} />;
}
