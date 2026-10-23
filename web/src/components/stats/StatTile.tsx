import type { ReactNode } from 'react';
import { CountUp } from '@/components/PaperMotion';

/**
 * Ô số liệu: nhãn nhỏ, số lớn, đơn vị. Không icon, dòng phụ hay link để bố cục không vỡ khi chữ dài.
 * Mobile hiện số cuối; chỉ từ md mới chạy `CountUp`. Hậu tố nằm sát số, tách khỏi đơn vị.
 */
export function StatTile({ label, value, suffix = '', unit }: { label: string; value: ReactNode; suffix?: string; unit?: string }) {
  const shown = typeof value === 'number' ? value.toLocaleString('vi-VN') : value;
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-4 lg:p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 font-serif text-3xl font-semibold leading-tight tabular-nums text-foreground lg:text-4xl">
        <span className="min-w-0 break-words">
          {typeof value === 'number' && value < 1000 ? (
            <>
              <span className="md:hidden">{shown}{suffix}</span>
              <span className="hidden md:inline"><CountUp value={value} />{suffix}</span>
            </>
          ) : <>{shown}{suffix}</>}
        </span>
        {unit && <span className="font-sans text-sm font-normal text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}
