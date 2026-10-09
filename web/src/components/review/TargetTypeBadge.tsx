import { cn } from '@/lib/utils';
import type { TargetType } from '@/types';

export const TARGET_TYPE_LABEL: Record<TargetType, string> = {
  vocab: 'Từ vựng',
  grammar: 'Ngữ pháp',
  kanji: 'Kanji',
  particle: 'Trợ từ',
  listening: 'Nghe',
};

/**
 * Ánh xạ CỐ ĐỊNH loại mục tiêu → slot màu: màu gắn với thực thể, không
 * gắn với thứ hạng — đổi bộ lọc không được đổi màu của các mục còn lại.
 * Màu nằm ở chấm tròn, chữ luôn mang màu chữ: chart-3/4/5 có tương phản dưới 3:1 trên nền
 * card nên không được dùng làm màu chữ.
 */
const TARGET_TYPE_DOT: Record<TargetType, string> = {
  vocab: 'bg-chart-1',
  grammar: 'bg-chart-2',
  kanji: 'bg-chart-3',
  particle: 'bg-chart-4',
  listening: 'bg-chart-5',
};

export function TargetTypeBadge({ type, className }: { type: TargetType; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-2 shrink-0 rounded-full', TARGET_TYPE_DOT[type])}
      />
      {TARGET_TYPE_LABEL[type]}
    </span>
  );
}
