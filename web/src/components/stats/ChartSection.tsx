'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Mục biểu đồ: tiêu đề sans cùng kiểu `SectionHeader`, nút ghost mở bảng số liệu cạnh tiêu đề.
 * `SectionHeader` không có chỗ cho nút hành động nên tiêu đề được dựng lại ở đây.
 */
export function ChartSection({
  id,
  title,
  tableLabel,
  table,
  children,
}: {
  id: string;
  title: string;
  /** Tên đầy đủ của nút cho trình đọc màn hình, bắt đầu bằng chữ hiển thị "Bảng số liệu". */
  tableLabel: string;
  table: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section aria-labelledby={id}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 id={id} className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={open}
          aria-label={tableLabel}
          onClick={() => setOpen((v) => !v)}
          className="min-h-11 gap-1 px-3 text-muted-foreground"
        >
          Bảng số liệu
          <ChevronDown className={cn('transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </Button>
      </div>
      {children}
      {open && (
        <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-border bg-card">{table}</div>
      )}
    </section>
  );
}
