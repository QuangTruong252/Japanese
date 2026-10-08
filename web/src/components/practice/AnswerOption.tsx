'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { containsJapanese } from '@/lib/japanese';

export type AnswerOptionState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'revealed-correct';

const STATE_CLASS: Record<AnswerOptionState, string> = {
  idle: 'bg-card border-border hover:bg-accent text-foreground',
  selected: 'bg-accent border-primary border-2 text-foreground',
  correct: 'bg-success/10 border-success border-2 text-foreground',
  incorrect: 'bg-destructive/10 border-destructive border-2 text-foreground motion-safe:animate-jp-shake',
  'revealed-correct': 'bg-card border-success border-2 text-foreground',
};

export function AnswerOption({
  children,
  state,
  index,
  disabled = false,
  className,
  feedbackLabel,
  onClick,
}: {
  children: React.ReactNode;
  state: AnswerOptionState;
  index?: number;
  disabled?: boolean;
  className?: string;
  feedbackLabel?: string;
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
        'flex min-h-14 w-full items-center gap-3 rounded-xl border p-4 text-left',
        'transition-colors duration-150 ease-out',
        'outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        'active:translate-y-px',
        disabled && 'pointer-events-none',
        // Chỉ làm mờ ô KHÔNG mang thông tin. Ô đúng/sai phải giữ nguyên độ tương phản,
        // nếu không thì phản hồi chính là thứ bị mờ đi.
        disabled && state === 'idle' && 'opacity-50',
        STATE_CLASS[state],
        className,
      )}
    >
      {index !== undefined && (
        <span className="hidden size-6 shrink-0 items-center justify-center rounded-md border border-border text-xs text-muted-foreground md:flex">
          {index}
        </span>
      )}
      {/* Đáp án nghĩa tiếng Việt dùng font giao diện; chữ Nhật mới dùng bậc jp-vocab */}
      <span
        className={cn(
          'flex-1',
          typeof children === 'string' && !containsJapanese(children)
            ? 'text-base font-normal'
            : 'jp jp-vocab',
        )}
      >
        {children}
      </span>
      {state === 'correct' && (
        <div className="flex shrink-0 items-center gap-1.5 text-success">
          <Check className="size-5 shrink-0" aria-hidden="true" />
          <span className="sr-only">Đúng</span>
        </div>
      )}
      {state === 'incorrect' && (
        <div className="flex shrink-0 items-center gap-1.5 text-destructive">
          <X className="size-5 shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold">{feedbackLabel ?? 'Chưa đúng'}</span>
        </div>
      )}
      {state === 'revealed-correct' && (
        <div className="flex shrink-0 items-center gap-1.5 text-success">
          <Check className="size-5 shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold">{feedbackLabel ?? 'Đáp án đúng'}</span>
        </div>
      )}
    </button>
  );
}
