import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Illustration } from '@/components/Illustration';
import type { IllustrationAsset } from '@/types';
import { cn } from '@/lib/utils';

/**
 * "Sân khấu + mảnh giấy" (DESIGN.md §Patterns): cảnh tràn ngang, mờ dần vào giấy; con
 * (bong bóng thoại…) do màn tự đặt tuyệt đối. Ảnh lỗi thì chỉ còn con, chữ vẫn đọc được.
 */
export function Stage({
  asset,
  sizes,
  eager,
  imageClassName,
  className,
  children,
}: {
  asset: IllustrationAsset;
  sizes: string;
  eager?: boolean;
  /** Chiều cao cảnh theo màn, ví dụ `h-52 sm:h-72`. */
  imageClassName?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn('relative', className)}>
      <Illustration
        asset={asset}
        sizes={sizes}
        eager={eager}
        className={cn('paper-scene w-full object-cover', imageClassName ?? 'h-52 sm:h-72')}
      />
      {children}
    </div>
  );
}

/** Mảnh giấy lấn lên mép dưới cảnh, chứa đúng một hành động chính của màn. */
export function PaperSlip({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('relative z-10 -mt-8 rounded-xl border border-border bg-card p-4 sm:p-5', className)}>
      {children}
    </div>
  );
}

/**
 * Dòng phụ: cả dòng là link, chevron phải, không nút, không khung. Đặt trong vùng
 * `divide-y divide-border` để có đường mảnh giữa các dòng.
 */
export function LinkRow({
  href,
  onClick,
  icon,
  title,
  detail,
  children,
  className,
}: {
  href: string;
  onClick?: () => void;
  icon?: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  /** Nội dung thêm dưới tiêu đề, ví dụ thanh tiến độ. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex min-h-14 items-center gap-3 py-3 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring',
        className,
      )}
    >
      {icon && <span className="shrink-0 text-muted-foreground [&_svg]:size-5" aria-hidden="true">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium">{title}</span>
        {detail && <span className="mt-0.5 block text-sm text-muted-foreground">{detail}</span>}
        {children}
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}
