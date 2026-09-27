'use client';

import { Search } from 'lucide-react';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface SearchTriggerProps {
  className?: string;
  iconOnly?: boolean;
  variant?: 'default' | 'icon' | 'bar';
  placeholder?: string;
}

export function SearchTrigger({
  className,
  iconOnly = false,
  variant = 'default',
  placeholder = 'Tìm từ, chữ, ngữ pháp…',
}: SearchTriggerProps) {
  const openSearch = useUIStore((s) => s.openSearch);

  if (iconOnly || variant === 'icon') {
    return (
      <button
        type="button"
        onClick={openSearch}
        aria-label="Tìm kiếm nội dung (Ctrl+K)"
        className={cn(
          'size-11 sm:size-12 rounded-xl border border-border/80 bg-card flex items-center justify-center text-muted-foreground',
          'hover:text-foreground hover:border-primary/40 hover:bg-muted/40 transition shadow-2xs cursor-pointer',
          'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring',
          className
        )}
      >
        <Search className="size-5" />
      </button>
    );
  }

  if (variant === 'bar') {
    return (
      <button
        type="button"
        onClick={openSearch}
        aria-label="Mở hộp tìm kiếm (Ctrl+K)"
        className={cn(
          'group flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 rounded-2xl',
          'border border-border/80 bg-card text-muted-foreground shadow-2xs',
          'hover:border-primary/40 hover:bg-muted/30 hover:text-foreground transition duration-150 cursor-pointer',
          'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring',
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Search className="size-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          <span className="text-sm sm:text-base font-normal text-muted-foreground group-hover:text-foreground truncate">
            {placeholder}
          </span>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border/80 bg-muted/60 text-[11px] font-mono text-muted-foreground">
          <span>Ctrl</span>
          <span>K</span>
        </kbd>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openSearch}
      className={cn(
        'flex min-h-11 items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border border-border/80 bg-card text-muted-foreground',
        'hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition shadow-2xs cursor-pointer',
        'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring',
        className
      )}
    >
      <Search className="size-4 text-primary" />
      <span>Tìm kiếm (Ctrl+K)</span>
    </button>
  );
}
