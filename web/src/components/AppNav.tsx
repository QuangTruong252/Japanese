'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import {
  LayoutDashboard,
  BookOpen,
  Dumbbell,
  RotateCcw,
  BarChart3,
  Settings,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isDueTarget?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Bảng tin', icon: LayoutDashboard },
  { href: '/hoc', label: 'Học bài', icon: BookOpen },
  { href: '/luyen-tap', label: 'Luyện tập', icon: Dumbbell },
  { href: '/on-tap', label: 'Ôn tập', icon: RotateCcw, isDueTarget: true },
  { href: '/thong-ke', label: 'Thống kê', icon: BarChart3 },
  { href: '/cai-dat', label: 'Cài đặt', icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();

  // Đếm số mục đến hạn trực tiếp từ Dexie
  const dueCount =
    useLiveQuery(
      () => db.reviewItems.where('dueAt').belowOrEqual(new Date()).count(),
      []
    ) ?? 0;

  return (
    <nav
      role="navigation"
      aria-label="Thanh điều hướng Apple Dock"
      className={cn(
        'fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] sm:bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2',
        'rounded-full',
        'bg-background/85 dark:bg-card/80 backdrop-blur-2xl',
        'border border-border/70 dark:border-white/10',
        'shadow-2xl shadow-black/10 dark:shadow-black/60 ring-1 ring-black/5 dark:ring-white/5',
        'transition-all duration-300 select-none'
      )}
    >
      {/* Các tab điều hướng chính */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const showBadge = item.isDueTarget && dueCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={showBadge ? `${item.label}, ${dueCount} mục đến hạn` : item.label}
              className={cn(
                'group relative flex items-center justify-center',
                'w-11 h-11 sm:w-13 sm:h-13',
                'rounded-full transition-all duration-200 ease-out outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'active:scale-95',
                isActive
                  ? 'text-primary bg-primary/15 dark:bg-primary/25 shadow-inner'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              {/* Tooltip macOS (chỉ hiển thị khi hover trên thiết bị có chuột) */}
              <div
                role="tooltip"
                className={cn(
                  'pointer-events-none absolute -top-11 sm:-top-12 left-1/2 -translate-x-1/2',
                  'px-2.5 py-1 rounded-md bg-foreground text-background text-[11px] font-medium tracking-wide whitespace-nowrap shadow-xl',
                  'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150',
                  'hidden sm:flex items-center gap-1.5 z-50'
                )}
              >
                <span>{item.label}</span>
                {showBadge && (
                  <span className="px-1 py-0.2 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">
                    {dueCount > 99 ? '99+' : dueCount}
                  </span>
                )}
                {/* Mũi tên nhọn chỉ xuống */}
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
              </div>

              {/* Icon kích thước lớn nổi bật, có hiệu ứng hover zoom */}
              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn(
                    'w-6 h-6 sm:w-6.5 sm:h-6.5 shrink-0 transition-transform duration-150',
                    'sm:group-hover:scale-115 sm:group-hover:-translate-y-0.5'
                  )}
                />

                {/* Badge thông báo FSRS số đếm quá hạn */}
                {showBadge && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 -right-2 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none shadow-sm animate-pulse"
                  >
                    {dueCount > 99 ? '99+' : dueCount}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Vạch ngăn divider mỏng thanh lịch (chỉ hiện từ sm trở lên) */}
      <div
        aria-hidden="true"
        className="hidden sm:block h-6 w-[1px] bg-border/60 dark:bg-white/15 mx-1"
      />

      {/* Tiện ích mở rộng trên Laptop/Desktop: Nút Tìm kiếm nhanh Ctrl+K */}
      <Link
        href="/tim-kiem"
        aria-label="Tìm kiếm (Ctrl+K)"
        className={cn(
          'group relative hidden sm:flex items-center justify-center',
          'w-11 h-11 sm:w-13 sm:h-13',
          'rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60',
          'transition-all duration-200 ease-out outline-none active:scale-95',
          'focus-visible:ring-2 focus-visible:ring-primary/60'
        )}
      >
        <div
          role="tooltip"
          className={cn(
            'pointer-events-none absolute -top-11 sm:-top-12 left-1/2 -translate-x-1/2',
            'px-2.5 py-1 rounded-md bg-foreground text-background text-[11px] font-medium whitespace-nowrap shadow-xl',
            'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150',
            'flex items-center gap-1.5 z-50'
          )}
        >
          <span>Tìm kiếm</span>
          <kbd className="text-[10px] font-mono bg-background/20 px-1 py-0.5 rounded">⌘K</kbd>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
        </div>

        <Search className="w-6 h-6 sm:w-6.5 sm:h-6.5 shrink-0 transition-transform duration-150 sm:group-hover:scale-115 sm:group-hover:-translate-y-0.5" />
      </Link>
    </nav>
  );
}
