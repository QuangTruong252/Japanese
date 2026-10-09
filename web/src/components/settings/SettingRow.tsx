import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Một khối giấy chia dòng bằng đường kẻ mảnh; các dòng con không có viền riêng. */
export function SettingsGroup({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('divide-y divide-border rounded-xl border border-border bg-card', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/** Dòng cài đặt: nhãn bên trái, điều khiển bên phải; chữ dài xuống dòng, hint nằm dưới cả dòng. */
export function SettingRow({
  id,
  label,
  labelFor,
  labelId,
  hint,
  nowrap,
  className,
  children,
}: {
  id?: string;
  label: string;
  /** Có điều khiển nhập liệu thật thì liên kết nhãn bằng `htmlFor`; nhóm nút dùng `labelId` + `aria-labelledby`. */
  labelFor?: string;
  labelId?: string;
  hint?: ReactNode;
  /** Giữ điều khiển cùng hàng với nhãn (nhãn tự xuống dòng) thay vì đẩy xuống dòng dưới. */
  nowrap?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const labelClass = 'text-base font-medium text-foreground';
  return (
    <div id={id} className={cn('scroll-mt-24 px-4 py-3', className)}>
      <div
        className={cn(
          'flex min-h-11 items-center justify-between gap-x-4 gap-y-2',
          !nowrap && 'flex-wrap',
        )}
      >
        {labelFor ? (
          <label htmlFor={labelFor} className={cn(labelClass, 'min-w-0 cursor-pointer')}>
            {label}
          </label>
        ) : (
          <span id={labelId} className={cn(labelClass, 'min-w-0')}>
            {label}
          </span>
        )}
        {children}
      </div>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
