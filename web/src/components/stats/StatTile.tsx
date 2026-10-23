import type { ReactNode } from 'react';
import { CountUp } from '@/components/PaperMotion';

/**
 * Ô số liệu: nhãn nhỏ, số lớn, đơn vị. Không icon, dòng phụ hay link để bố cục không vỡ khi chữ dài.
 * `value` là số thì chạy `CountUp`; từ 1000 trở lên hiện thẳng dạng `1.234` vì `CountUp` không tách nghìn.
 */
export function StatTile({ label, value, unit }: { label: string; value: ReactNode; unit?: string }) {
  const shown =
    typeof value === 'number' ? value >= 1000 ? value.toLocaleString('vi-VN') : <CountUp value={value} /> : value;
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-4 lg:p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 font-serif text-3xl font-semibold leading-tight tabular-nums text-foreground lg:text-4xl">
        <span className="min-w-0 break-words">{shown}</span>
        {unit && <span className="font-sans text-sm font-normal text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}
