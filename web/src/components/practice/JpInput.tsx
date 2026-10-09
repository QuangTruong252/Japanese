'use client';

import { useId } from 'react';
import { toTypedKana } from '@/lib/japanese';
import { cn } from '@/lib/utils';

export function JpInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  label,
  state = 'idle',
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  label: string;
  state?: 'idle' | 'correct' | 'incorrect';
}) {
  const id = useId();
  const captionId = `${id}-caption`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={captionId}
        value={value}
        disabled={disabled}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        onChange={(e) => onChange(toTypedKana(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit();
          }
        }}
        className={cn(
          'jp h-14 w-full rounded-xl border bg-card px-4 text-left text-2xl',
          'transition-colors duration-150 ease-out',
          'outline-none focus-visible:ring-3 focus-visible:ring-ring',
          state === 'idle' && 'border-border disabled:opacity-50',
          state === 'correct' && 'border-success bg-success/10 ring-1 ring-success',
          state === 'incorrect' && 'border-destructive bg-destructive/10 ring-1 ring-destructive motion-safe:animate-jp-shake',
        )}
      />
      <p id={captionId} className="text-sm text-muted-foreground">
        Gõ romaji, chữ tự chuyển sang hiragana
      </p>
    </div>
  );
}
