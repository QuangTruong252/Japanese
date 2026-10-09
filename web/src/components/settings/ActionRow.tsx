import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Dòng giấy trong khối cài đặt, cùng dáng với `ListRow` nhưng không viền riêng (khối cha kẻ đường).
 * Có `href` thì là link, không thì là nút. `expanded` (nếu có) biến dòng thành nút mở/thu.
 */
export function ActionRow({
  href,
  onClick,
  disabled,
  expanded,
  icon,
  title,
  detail,
}: {
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  expanded?: boolean;
  icon: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
}) {
  const className =
    'flex min-h-14 w-full items-start gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';
  const body = (
    <>
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-6"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 pt-1">
        <span className="block font-medium text-foreground">{title}</span>
        {detail && <span className="mt-0.5 block text-sm text-muted-foreground">{detail}</span>}
      </span>
      <ChevronRight
        className={cn(
          'mt-2 size-5 shrink-0 text-muted-foreground transition-transform',
          expanded && 'rotate-90',
        )}
        aria-hidden="true"
      />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-expanded={expanded}
      className={className}
    >
      {body}
    </button>
  );
}
