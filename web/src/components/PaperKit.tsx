import type { CSSProperties, ElementType, MouseEventHandler, ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Illustration } from '@/components/Illustration';
import type { IllustrationAsset } from '@/types';
import { cn } from '@/lib/utils';
import { SpotlightSurface } from '@/components/PaperMotion';

/** Bộ thành phần giấy v3 "Sách sống", dùng chung cho mọi màn. */

/** Tranh có mép trên và dưới xé giấy. Ảnh lỗi thì chỉ còn nội dung con, chữ vẫn đọc được. */
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
    <div className={cn('paper-tear', className)}>
      <Illustration
        asset={asset}
        sizes={sizes}
        eager={eager}
        className={cn('block w-full object-cover dark:brightness-[0.88]', imageClassName ?? 'h-48 sm:h-64')}
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
export function TornCard({
  className,
  fill,
  children,
}: {
  className?: string;
  /** Cao hết ô cha (dùng trong lưới để bằng chiều cao ô bên cạnh). */
  fill?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn('torn-card-shadow', fill && 'h-full')}>
      <div className={cn('torn-card p-5 sm:p-6', fill && 'h-full', className)}>{children}</div>
    </div>
  );
}

type BackTarget = { href: string; label: string; onClick?: MouseEventHandler<HTMLAnchorElement> };

/**
 * Nút quay lại của trang con, dính đầu vùng cuộn để quay về được ở bất cứ đâu trên trang dài.
 * Phải là con trực tiếp của khối bao cả trang (sticky chỉ dính trong khối cha) và khối đó có
 * padding ngang `px-4 sm:px-6 lg:px-8` để nền tràn kín mép. Cao đúng 44 px (`h-11`): thanh dính
 * khác trên cùng trang đặt `top-11` để nằm ngay dưới.
 */
export function BackLink({ href, label, onClick }: BackTarget) {
  return (
    <div className="sticky top-0 z-20 -mx-4 mb-1 flex h-11 items-center bg-background/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <Link
        href={href}
        onClick={onClick}
        className="-ml-2 inline-flex min-h-11 items-center gap-0.5 rounded-lg px-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        {label}
      </Link>
    </div>
  );
}

/** Đầu màn không có tranh: nút quay lại nhỏ (trang con), tiêu đề serif, một dòng số liệu. */
export function PageTitle({ title, meta, back }: { title: ReactNode; meta?: ReactNode; back?: BackTarget }) {
  return (
    <>
      {back && <BackLink {...back} />}
      <header className={back ? undefined : 'pt-2'}>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {meta && <p className="mt-1 text-sm text-muted-foreground">{meta}</p>}
      </header>
    </>
  );
}

/** Viên thuốc bật–tắt để lọc hoặc chọn; trạng thái chọn nằm ở `aria-pressed`. */
export function Chip({
  pressed,
  onClick,
  icon,
  disabled,
  title,
  className,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        pressed
          ? 'border-primary/40 bg-accent text-primary'
          : 'border-border bg-card text-foreground hover:bg-muted/60',
        className,
      )}
    >
      {icon}
      {children}
    </button>
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

/**
 * Dòng giấy: cả dòng là link; icon và chevron bám dòng đầu khi chữ xuống dòng.
 * Không có `href` thì là nút (việc phải chạy trước khi điều hướng, ví dụ ghi nháp).
 */
export function ListRow({
  href,
  onClick,
  icon,
  title,
  detail,
  className,
}: {
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  className?: string;
}) {
  const rowClass = cn(
    'flex min-h-14 w-full items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring',
    className,
  );
  const body = (
    <>
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
    </>
  );
  return href ? (
    <Link href={href} onClick={onClick} className={rowClass}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={rowClass}>
      {body}
    </button>
  );
}

/**
 * Lưới Bento cho màn tổng quan: dưới `md` là khối thường (giữ nhịp mobile), `md` hai cột, `lg` mười hai cột.
 * Con trực tiếp nên là `Tile`; cỡ ô chọn bằng `span`/`full` của `Tile`.
 */
export function BentoGrid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('max-md:space-y-8 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-12 lg:gap-5', className)}>
      {children}
    </div>
  );
}

// Chuỗi class tĩnh để Tailwind quét thấy.
const TILE_SPAN = {
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  12: 'lg:col-span-12',
} as const;

/**
 * Ô giấy của `BentoGrid`. `span` là số cột (trên 12) từ `lg`; `full` chiếm cả hai cột ở `md`.
 * Có padding mặc định `p-5 lg:p-6`; `bleed` bỏ padding khi nội dung cần tràn mép (tranh).
 * `interactive` thêm vệt sáng theo con trỏ (chỉ chuột). Không lồng Tile trong Tile.
 */
export function Tile({
  span,
  full,
  interactive,
  bleed,
  as = 'div',
  className,
  children,
}: {
  span?: keyof typeof TILE_SPAN;
  full?: boolean;
  interactive?: boolean;
  bleed?: boolean;
  as?: 'div' | 'section' | 'article' | 'aside' | 'li';
  className?: string;
  children: ReactNode;
}) {
  const cls = cn(
    'relative rounded-2xl border border-border bg-card shadow-[0_6px_16px_-6px_color-mix(in_oklch,var(--foreground)_12%,transparent)]',
    !bleed && 'p-5 lg:p-6',
    full && 'md:col-span-2',
    span && TILE_SPAN[span],
    interactive && 'spotlight',
    className,
  );
  if (interactive) {
    return (
      <SpotlightSurface as={as} className={cls}>
        {children}
      </SpotlightSurface>
    );
  }
  const Tag: ElementType = as;
  return <Tag className={cls}>{children}</Tag>;
}

/**
 * Hai trang sách cho màn nội dung. Dưới `lg` xếp dọc (không viền, không dính); từ `lg` hai cột với gáy sách
 * ở rãnh giữa. `leftWidth`: `narrow` ≈ 1/3 : 2/3, `wide` ≈ 3/5 : 2/5.
 * `sticky` giữ một cột đứng yên khi cuộn trong `#app-scroll-container`; nếu trang có `BackLink` dính (44 px)
 * truyền `stickyTop="4.25rem"` để cột nằm dưới nó (mặc định `1.5rem`).
 */
export function BookSpread({
  left,
  right,
  leftWidth = 'narrow',
  sticky,
  stickyTop,
  className,
}: {
  left: ReactNode;
  right: ReactNode;
  leftWidth?: 'narrow' | 'wide';
  sticky?: 'left' | 'right';
  stickyTop?: string;
  className?: string;
}) {
  const stickyCls =
    'lg:sticky lg:top-[var(--sticky-top,1.5rem)] lg:max-h-[calc(100dvh-var(--sticky-top,1.5rem)-1.5rem)] lg:self-start lg:overflow-y-auto scrollbar-none';
  const narrow = leftWidth === 'narrow';
  return (
    <div
      className={cn(
        'max-lg:space-y-8 lg:grid',
        // Cột giữa 2.5rem là gáy sách; trang hẹp có bề rộng tối thiểu để thẻ hành động không bị bóp ở 1024 px.
        narrow
          ? 'lg:grid-cols-[minmax(16.5rem,1fr)_2.5rem_minmax(0,2fr)]'
          : 'lg:grid-cols-[minmax(0,3fr)_2.5rem_minmax(18rem,2fr)]',
        className,
      )}
      style={stickyTop ? ({ '--sticky-top': stickyTop } as CSSProperties) : undefined}
    >
      <div className={cn('min-w-0 lg:col-start-1 lg:row-start-1', sticky === 'left' && stickyCls)}>{left}</div>
      <div className={cn('min-w-0 lg:col-start-3 lg:row-start-1', sticky === 'right' && stickyCls)}>{right}</div>
      {/* Gáy sách: đường mảnh + bóng mờ, kéo hết chiều cao hàng. */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none relative hidden lg:col-start-2 lg:row-start-1 lg:block',
          'bg-[linear-gradient(to_right,transparent,color-mix(in_oklch,var(--foreground)_5%,transparent)_50%,transparent)]',
          'after:absolute after:inset-y-0 after:left-1/2 after:border-l after:border-border/70',
        )}
      />
    </div>
  );
}

/**
 * Ruy-băng đỏ đánh dấu mục đang chọn trong mục lục. Cha phải `relative`; mặc định bám mép trái, đổi `top`
 * bằng `className` nếu cần.
 */
export function Ribbon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute top-2 left-0 h-6 w-[5px] bg-primary [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)]',
        className,
      )}
    />
  );
}

/**
 * Thẻ "vé" cho hành động chính: như `TornCard` nhưng có đường đục lỗ ngang gần mép trên, hai khuyết tròn ở
 * hai mép và nhãn serif đỏ phía trên đường. Mỗi màn vẫn chỉ một TornCard hoặc Ticket.
 */
export function Ticket({ label, className, children }: { label?: string; className?: string; children: ReactNode }) {
  return (
    <div className="torn-card-shadow">
      <div className="torn-card">
        <p className={cn('px-5 pb-3 font-serif text-sm font-semibold text-primary sm:px-6', label ? 'pt-4' : 'pt-7')}>
          {label && `/ ${label} /`}
        </p>
        <div aria-hidden="true" className="relative border-t-2 border-dashed border-border">
          <span className="absolute -top-2.5 -left-2.5 size-5 rounded-full border border-border bg-background" />
          <span className="absolute -top-2.5 -right-2.5 size-5 rounded-full border border-border bg-background" />
        </div>
        <div className={cn('p-5 sm:p-6', className)}>{children}</div>
      </div>
    </div>
  );
}

/** Phím tắt. Mặc định chỉ hiện khi có chuột (máy cảm ứng không có bàn phím để bấm); `always` để luôn hiện. */
export function Kbd({ always, className, children }: { always?: boolean; className?: string; children: ReactNode }) {
  return (
    <kbd
      className={cn(
        'h-5 items-center rounded border border-border bg-secondary px-1.5 font-sans text-xs font-medium text-secondary-foreground',
        always ? 'inline-flex' : 'hidden [@media(hover:hover)_and_(pointer:fine)]:inline-flex',
        className,
      )}
    >
      {children}
    </kbd>
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
