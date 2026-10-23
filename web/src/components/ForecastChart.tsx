import { ChartColumn } from 'lucide-react';
import { forecastDayLabel, type ForecastDay } from '@/lib/review-forecast';
import { cn } from '@/lib/utils';

/** Biểu đồ cột 7 ngày; số liệu nằm cả trên cột lẫn trong `aria-label` vì cột chỉ là hình. */
export function ForecastChart({ days, as: Heading = 'h2' }: { days: ForecastDay[]; as?: 'h2' | 'h3' }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const labels = days.map(forecastDayLabel);
  const summary = days.map((d, i) => `${labels[i]} ${d.count}`).join(', ');
  return (
    <div>
      <Heading className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
        <ChartColumn className="size-5 text-primary" aria-hidden="true" />
        Lịch ôn 7 ngày
      </Heading>
      <div role="img" aria-label={`Lịch ôn 7 ngày: ${summary}`} className="mt-3 flex h-32 items-end gap-2">
        {days.map((d, i) => (
          <div
            key={i}
            className={cn('flex min-w-0 flex-col items-center justify-end gap-1', i === 0 ? 'flex-[1.7]' : 'flex-1')}
          >
            <span
              className={cn('text-xs tabular-nums', i === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground')}
            >
              {d.count}
            </span>
            <div
              className={cn(
                'w-full max-w-9 rounded-t-md',
                i === 0 ? 'bg-primary' : 'border border-b-0 border-border bg-secondary',
              )}
              style={{ height: Math.max(4, Math.round((d.count / max) * 72)) }}
            />
            <span
              className={cn('whitespace-nowrap text-xs', i === 0 ? 'font-medium text-foreground' : 'text-muted-foreground')}
            >
              {labels[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
