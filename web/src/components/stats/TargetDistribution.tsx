import type { TargetType } from '@/types';
import { cn } from '@/lib/utils';

const TARGETS: { key: TargetType; label: string; bgClass: string }[] = [
  { key: 'vocab', label: 'Từ vựng', bgClass: 'bg-chart-1' },
  { key: 'grammar', label: 'Ngữ pháp', bgClass: 'bg-chart-2' },
  { key: 'kanji', label: 'Hán tự', bgClass: 'bg-chart-3' },
  { key: 'particle', label: 'Trợ từ', bgClass: 'bg-chart-4' },
  { key: 'listening', label: 'Luyện nghe', bgClass: 'bg-chart-5' },
];

/** Thanh xếp chồng theo loại mục tiêu, kèm năm ô nhỏ: nhãn, số lượng, phần trăm. */
export function TargetDistribution({
  counts,
  total,
}: {
  counts: Partial<Record<TargetType, number>> | null;
  total: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
        {total > 0 &&
          TARGETS.map(({ key, label, bgClass }) => {
            const count = counts?.[key] ?? 0;
            if (count === 0) return null;
            const percent = (count / total) * 100;
            return (
              <div
                key={key}
                style={{ width: `${percent}%` }}
                className={cn('h-full', bgClass)}
                title={`${label}: ${count} mục (${Math.round(percent)}%)`}
              />
            );
          })}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {TARGETS.map(({ key, label, bgClass }) => {
          const count = counts?.[key] ?? 0;
          const percent = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key} className="min-w-0 rounded-xl border border-border bg-card p-3">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={cn('size-2.5 shrink-0 rounded-sm', bgClass)} aria-hidden="true" />
                <span className="min-w-0">{label}</span>
              </p>
              <p className="mt-1 flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="font-serif text-xl font-semibold tabular-nums text-foreground">{count}</span>
                <span className="text-sm text-muted-foreground tabular-nums">{percent}%</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
