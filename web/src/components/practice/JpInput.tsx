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
      <label htmlFor={id} className="sr-only">
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
          'jp h-12 w-full rounded-lg border-2 bg-card px-4 text-center text-[1.25rem]',
          'transition-colors duration-150 ease-out',
          'outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
          'disabled:opacity-50',
          state === 'idle' && 'border-border',
          state === 'correct' && 'border-success bg-success/10',
          state === 'incorrect' && 'border-destructive bg-destructive/10 motion-safe:jp-shake',
        )}
      />
      <p id={captionId} className="text-center text-sm text-muted-foreground">
        Gõ romaji, chữ tự chuyển sang hiragana
      </p>
    </div>
  );
}
