import type { ReactNode } from 'react';

/** Ô số liệu: nhãn nhỏ, số lớn, đơn vị. Không icon, dòng phụ hay link để bố cục không vỡ khi chữ dài. */
export function StatTile({ label, value, unit }: { label: string; value: ReactNode; unit?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 font-serif text-3xl font-semibold leading-tight tabular-nums text-foreground">
        <span className="min-w-0 break-words">{value}</span>
        {unit && <span className="font-sans text-sm font-normal text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}
