import { cn } from '@/lib/utils';

const DOT: Record<number, string> = { 1: 'bg-verb-1', 2: 'bg-verb-2', 3: 'bg-verb-3' };

/** Nhóm động từ: màu nằm ở chấm tròn, chữ giữ màu chữ chính vì màu verb-N không đủ tương phản làm chữ ở cả hai theme. */
export function VerbGroupBadge({ group, prefix }: { group: number; prefix?: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-foreground">
      <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', DOT[group])} />
      {prefix}Nhóm {group}
    </span>
  );
}
