'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useDueClock } from '@/lib/use-due-clock';
import {
  LayoutDashboard,
  BookOpen,
  Dumbbell,
  RotateCcw,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return () => {};
      }
      const media = window.matchMedia(query);
      media.addEventListener('change', callback);
      return () => media.removeEventListener('change', callback);
    },
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false
  );
}

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
  const isDesktop = useMediaQuery('(min-width: 640px)');

  // Đếm số mục đến hạn. Mốc thời gian lấy từ useDueClock: thời gian trôi qua không phải là
  // thay đổi của Dexie, nên useLiveQuery một mình sẽ để badge đứng yên khi tab mở lâu
  // (SPEC-02 §2.2).
  const now = useDueClock();
  const dueCount =
    useLiveQuery(
      () => db.reviewItems.where('dueAt').belowOrEqual(now).count(),
      [now]
    ) ?? 0;

  // Luồng làm bài chiếm trọn màn hình và có nút thoát riêng: dock ở đây vừa thừa vừa làm
  // trang cao quá 100dvh (children của layout có pb-32/pb-40), phá ràng buộc không cuộn
  // của SPEC-04 §3.2. Màn phiên ôn cũng fixed inset-0 nên dock vừa thừa vừa làm trang cao quá 100dvh.
  if (pathname.startsWith('/luyen-tap/phien') || pathname.startsWith('/on-tap/phien')) return null;

  return (
    <nav
      aria-label="Điều hướng chính"
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
                'group relative flex flex-col sm:flex-row items-center justify-center',
                'w-14 h-14 sm:w-13 sm:h-13',
                'rounded-2xl sm:rounded-full transition-all duration-200 ease-out outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'active:scale-95',
                isActive
                  ? 'text-primary bg-primary/15 dark:bg-primary/25 shadow-inner'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              {/* Tooltip macOS (chỉ hiển thị khi hover trên thiết bị >=640px, không render ở mobile) */}
              {isDesktop && (
                <div
                  role="tooltip"
                  className={cn(
                    'pointer-events-none absolute -top-11 sm:-top-12 left-1/2 -translate-x-1/2',
                    'px-2.5 py-1 rounded-md bg-foreground text-background text-[11px] font-medium tracking-wide whitespace-nowrap shadow-xl',
                    'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150',
                    'flex items-center gap-1.5 z-50'
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
              )}

              {/* Icon */}
              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn(
                    'w-[22px] h-[22px] sm:w-6.5 sm:h-6.5 shrink-0 transition-transform duration-150',
                    'sm:group-hover:scale-115 sm:group-hover:-translate-y-0.5'
                  )}
                />

                {/* Badge thông báo FSRS số đếm quá hạn */}
                {showBadge && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-2.5 sm:-top-1.5 sm:-right-2 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none shadow-sm motion-safe:animate-pulse"
                  >
                    {dueCount > 99 ? '99+' : dueCount}
                  </span>
                )}
              </div>

              {/* Nhãn chữ hiển thị trên mobile, ẩn từ 640px (sm) */}
              <span
                className={cn(
                  'text-[10px] leading-tight tracking-tight sm:hidden max-w-[52px] truncate px-0.5 mt-0.5',
                  isActive ? 'font-semibold' : 'font-medium'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* SPEC-13: Nút tìm kiếm nhanh Ctrl+K và vạch ngăn tạm ẩn cho tới khi hoàn thành route /tim-kiem */}
    </nav>
  );
}
