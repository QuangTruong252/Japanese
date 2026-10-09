'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { containsJapanese } from '@/lib/japanese';

export type AnswerOptionState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'revealed-correct';

// Viền 1px đổi màu + vòng mảnh thay cho viền dày, để ô không xê dịch khi đổi trạng thái.
const STATE_CLASS: Record<AnswerOptionState, string> = {
  idle: 'border-border bg-card text-foreground hover:bg-accent',
  selected: 'border-primary bg-accent text-foreground ring-1 ring-primary',
  correct: 'border-success bg-success/10 text-foreground ring-1 ring-success',
  incorrect: 'border-destructive bg-destructive/10 text-foreground ring-1 ring-destructive motion-safe:animate-jp-shake',
  'revealed-correct': 'border-success bg-success/10 text-foreground ring-1 ring-success',
};

const BADGE_CLASS: Record<AnswerOptionState, string> = {
  idle: 'bg-secondary text-muted-foreground',
  selected: 'bg-primary/10 text-primary',
  correct: 'bg-success/15 text-success',
  incorrect: 'bg-destructive/15 text-destructive',
  'revealed-correct': 'bg-success/15 text-success',
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
  /** Chữ cho trình đọc màn hình; trên màn chỉ hiện icon. */
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
        'flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left',
        'transition-colors duration-150 ease-out',
        'outline-none focus-visible:ring-3 focus-visible:ring-ring',
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
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-medium tabular-nums',
            BADGE_CLASS[state],
          )}
          aria-hidden="true"
        >
          {index}
        </span>
      )}
      {/* Đáp án nghĩa tiếng Việt dùng font giao diện; chữ Nhật mới dùng bậc jp-vocab */}
      <span
        className={cn(
          'min-w-0 flex-1',
          typeof children === 'string' && !containsJapanese(children)
            ? 'text-base font-normal'
            : 'jp jp-vocab',
        )}
      >
        {children}
      </span>
      {state === 'correct' && (
        <span className="shrink-0 text-success">
          <Check className="size-6 stroke-[2.5]" aria-hidden="true" />
          <span className="sr-only">{feedbackLabel ?? 'Đúng'}</span>
        </span>
      )}
      {state === 'incorrect' && (
        <span className="shrink-0 text-destructive">
          <X className="size-6 stroke-[2.5]" aria-hidden="true" />
          <span className="sr-only">{feedbackLabel ?? 'Chưa đúng'}</span>
        </span>
      )}
      {state === 'revealed-correct' && (
        <span className="shrink-0 text-success">
          <Check className="size-6 stroke-[2.5]" aria-hidden="true" />
          <span className="sr-only">{feedbackLabel ?? 'Đáp án đúng'}</span>
        </span>
      )}
    </button>
  );
}
