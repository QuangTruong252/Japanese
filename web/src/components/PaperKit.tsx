import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Illustration } from '@/components/Illustration';
import type { IllustrationAsset } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Bộ thành phần giấy v3 "Sách sống" (spec 2026-10-08 §3). Dùng song song PaperStage.tsx;
 * các màn cũ chuyển dần sang bộ này.
 */

/** Tranh chữ nhật, mép tan vào giấy. Ảnh lỗi thì chỉ còn nội dung con, chữ vẫn đọc được. */
export function SoftScene({
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
  /** Chiều cao tranh theo màn, ví dụ `h-48 sm:h-64`. */
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
        className={cn('soft-scene w-full object-cover', imageClassName ?? 'h-48 sm:h-64')}
      />
      {children}
    </div>
  );
}

/** Nền mây giấy sau khối chữ đặt trên tranh (tăng tương phản, không thành hộp). */
export function PaperCloud({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('paper-cloud', className)}>{children}</div>;
}

/** Thẻ giấy washi mép xé, chứa đúng một hành động chính của màn. */
export function TornCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className="torn-card-shadow">
      <div className={cn('torn-card p-5 sm:p-6', className)}>{children}</div>
    </div>
  );
}

/** Tiêu đề mục + nút viên thuốc tùy chọn. Xuống dòng khi tiêu đề dài. */
export function SectionHeader({
  id,
  title,
  href,
  linkLabel = 'Xem tất cả',
}: {
  id: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <h2 id={id} className="text-lg font-semibold text-foreground">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="inline-flex min-h-9 items-center gap-0.5 rounded-full bg-secondary px-3 text-sm font-medium text-secondary-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring"
        >
          {linkLabel}
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

/** Dòng giấy: cả dòng là link; icon và chevron bám dòng đầu khi chữ xuống dòng. */
export function ListRow({
  href,
  onClick,
  icon,
  title,
  detail,
  className,
}: {
  href: string;
  onClick?: () => void;
  icon?: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex min-h-14 items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring',
        className,
      )}
    >
      {icon && (
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-6"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 pt-1">
        <span className="block font-medium text-foreground">{title}</span>
        {detail && <span className="mt-0.5 block text-sm text-muted-foreground">{detail}</span>}
      </span>
      <ChevronRight className="mt-2 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}

/** Hàng phần bài: icon thành phần, tiêu đề + số liệu cùng hàng, ảnh nhỏ thật. */
export function PartRow({
  href,
  icon,
  title,
  detail,
  image,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  detail?: string;
  image?: IllustrationAsset;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card p-3 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring"
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-6"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
        <span className="font-medium text-foreground">{title}</span>
        {detail && <span className="text-sm text-muted-foreground/80">{detail}</span>}
      </span>
      {image && (
        <Illustration asset={image} sizes="48px" className="size-12 shrink-0 rounded-lg bg-secondary object-cover" />
      )}
    </Link>
  );
}
