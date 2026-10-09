'use client';

import type { HeatmapDay, HeatmapWeek } from '@/lib/stats';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Năm mức từ nền kem (secondary) đến đỏ son (primary) bằng độ đậm của primary.
const LEVEL_CLASS: Record<HeatmapDay['level'], string> = {
  0: 'border border-border bg-secondary',
  1: 'bg-primary/25',
  2: 'bg-primary/50',
  3: 'bg-primary/75',
  4: 'bg-primary',
};

const CELL = 'size-5 shrink-0 rounded-sm';

/** Lịch nhiệt: mỗi cột một tuần (T2 → CN), ô của ngày chưa tới vẽ nét đứt. */
export function HeatmapChart({ weeks, now }: { weeks: HeatmapWeek[]; now: Date }) {
  return (
    <div>
      {/* Cuộn ngang trong vùng này khi màn quá hẹp, không đẩy cả trang */}
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2">
          <div className="flex h-[164px] w-6 select-none flex-col justify-between py-0.5 text-xs text-muted-foreground" aria-hidden="true">
            <span>T2</span>
            <span>T4</span>
            <span>T6</span>
            <span>CN</span>
          </div>
          <div className="flex gap-1">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.days.map((day) => (
                  <HeatmapCell key={day.dayKey} day={day} future={day.date.getTime() > now.getTime()} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground" aria-hidden="true">
        <span>Ít</span>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <span key={level} className={cn('size-4 rounded-sm', LEVEL_CLASS[level])} />
        ))}
        <span>Nhiều</span>
      </div>
    </div>
  );
}

function HeatmapCell({ day, future }: { day: HeatmapDay; future: boolean }) {
  const displayMins = day.sessionCount > 0 && day.minutes === 0 ? 'Dưới 1 phút' : `${day.minutes} phút`;
  const tooltipText = `${day.label} (${day.dayKey}): ${displayMins} · ${day.sessionCount} phiên`;

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={tooltipText}
        className={cn(
          CELL,
          'cursor-pointer outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
          future ? 'border border-dashed border-border bg-transparent' : LEVEL_CLASS[day.level],
        )}
      />
      <TooltipContent side="top">
        <p className="text-xs font-medium">{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
