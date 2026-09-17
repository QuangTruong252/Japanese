'use client';

import { cn } from '@/lib/utils';

export function PhraseToken({
  children,
  onClick,
  disabled = false,
  used = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  used?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled || used}
      aria-hidden={used}
      tabIndex={used ? -1 : 0}
      onClick={used || disabled ? undefined : onClick}
      className={cn(
        'flex h-12 min-h-12 items-center justify-center rounded-xl px-4 text-base font-medium',
        'bg-secondary text-secondary-foreground transition-all duration-150 ease-out',
        'outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px',
        'jp jp-vocab select-none',
        used
          ? 'pointer-events-none opacity-40'
          : 'cursor-pointer hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]',
      )}
    >
      {children}
    </button>
  );
}
