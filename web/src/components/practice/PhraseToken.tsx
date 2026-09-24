'use client';

import { m } from 'framer-motion';
import { cn } from '@/lib/utils';

// Spring theo DESIGN.md §Motion (kéo/di chuyển khối từ).
const TOKEN_SPRING = { type: 'spring', stiffness: 400, damping: 30 } as const;

export function PhraseToken({
  children,
  onClick,
  disabled = false,
  used = false,
  layoutId,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  used?: boolean;
  /** Cùng layoutId ở kho và thanh trả lời để khối từ bay giữa hai chỗ. Cần LazyMotion domMax. */
  layoutId?: string;
}) {
  return (
    <m.button
      type="button"
      layoutId={layoutId}
      transition={TOKEN_SPRING}
      disabled={disabled || used}
      aria-hidden={used}
      tabIndex={used ? -1 : 0}
      onClick={used || disabled ? undefined : onClick}
      className={cn(
        'flex h-12 min-h-12 items-center justify-center rounded-xl px-4 text-base font-medium',
        // Không transition `transform`: framer-motion điều khiển transform khi bay.
        'bg-secondary text-secondary-foreground transition-[color,background-color,opacity,translate] duration-150 ease-out',
        'outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px',
        'jp jp-vocab select-none',
        used
          ? 'pointer-events-none opacity-40'
          : 'cursor-pointer hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]',
      )}
    >
      {children}
    </m.button>
  );
}
