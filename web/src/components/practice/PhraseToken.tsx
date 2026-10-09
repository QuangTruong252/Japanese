'use client';

import { m } from 'framer-motion';
import { cn } from '@/lib/utils';

// Spring kéo/di chuyển khối từ.
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
        // Viên giấy: nền card, viền mảnh, bóng nhẹ. Khối đã dùng chỉ còn khung đứt tại chỗ.
        'flex min-h-14 items-center justify-center rounded-xl border px-4 text-base font-medium',
        // Không transition `transform`: framer-motion điều khiển transform khi bay.
        'transition-[color,background-color,opacity,translate] duration-150 ease-out',
        'outline-none focus-visible:ring-3 focus-visible:ring-ring active:translate-y-px',
        'jp jp-display jp-example select-none',
        used
          ? 'pointer-events-none border-dashed border-border bg-transparent opacity-40'
          : 'cursor-pointer border-border bg-card text-foreground shadow-sm hover:bg-muted/60',
      )}
    >
      {children}
    </m.button>
  );
}
