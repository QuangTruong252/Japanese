'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AnswerOptionState = 'idle' | 'selected' | 'correct' | 'incorrect';

const STATE_CLASS: Record<AnswerOptionState, string> = {
  idle: 'bg-card border-border hover:bg-accent',
  selected: 'bg-accent border-primary',
  correct: 'bg-success/10 border-success',
  incorrect: 'bg-destructive/10 border-destructive motion-safe:animate-jp-shake',
};

export function AnswerOption({
  children,
  state,
  index,
  disabled = false,
  className,
  onClick,
}: {
  children: React.ReactNode;
  state: AnswerOptionState;
  index?: number;
  disabled?: boolean;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      // aria-disabled chứ không phải disabled: sau khi chấm, ô vẫn phải Tab tới được để người
      // dùng screen reader đọc lại đáp án đúng/sai. onClick đã được chặn ở component dạng bài.
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      aria-pressed={state === 'selected'}
      className={cn(
        'flex min-h-12 w-full items-center gap-3 rounded-xl border-2 p-4 text-left',
        'transition-colors duration-150 ease-out',
        'outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        'active:translate-y-px',
        disabled && 'pointer-events-none',
        // Chỉ làm mờ ô KHÔNG mang thông tin. Ô đúng/sai phải giữ nguyên độ tương phản,
        // nếu không thì phản hồi chính là thứ bị mờ đi (SPEC-04 §5, §7).
        disabled && state === 'idle' && 'opacity-50',
        STATE_CLASS[state],
        className,
      )}
    >
      {index !== undefined && (
        <span className="text-muted-foreground hidden size-6 shrink-0 items-center justify-center rounded-md border text-xs md:flex">
          {index}
        </span>
      )}
      <span className="jp jp-vocab flex-1">{children}</span>
      {state === 'correct' && (
        <>
          <Check className="text-success size-5 shrink-0" />
          <span className="sr-only">Đúng</span>
        </>
      )}
      {state === 'incorrect' && (
        <>
          <X className="text-destructive size-5 shrink-0" />
          <span className="sr-only">Sai</span>
        </>
      )}
    </button>
  );
}
