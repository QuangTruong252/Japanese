'use client';

import { Search } from 'lucide-react';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface SearchTriggerProps {
  className?: string;
  iconOnly?: boolean;
}

export function SearchTrigger({ className, iconOnly = false }: SearchTriggerProps) {
  const openSearch = useUIStore((s) => s.openSearch);

  if (iconOnly) {
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
