'use client';

import { useState, useSyncExternalStore, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useDueClock } from '@/lib/use-due-clock';
import { currentStreak, minutesOnDay } from '@/lib/stats';
import { SyncBadge } from '@/components/SyncBadge';
import {
  LayoutDashboard,
  BookOpen,
  Dumbbell,
  RotateCcw,
  BarChart3,
  Settings,
  Flame,
  Clock,
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
  const [mobileStatusOpen, setMobileStatusOpen] = useState(false);

  // 1. Đếm số mục đến hạn (FSRS)
  const now = useDueClock();
  const dueCount =
    useLiveQuery(
      () => db.reviewItems.where('dueAt').belowOrEqual(now).count(),
      [now]
    ) ?? 0;

  // 2. Lấy dữ liệu phiên 90 ngày để tính Streak và thời gian học hôm nay
  const historyCutoff = useMemo(
    () => new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    [now]
  );
  const recentSessions = useLiveQuery(
    () => db.practiceSessions.where('createdAt').above(historyCutoff).reverse().sortBy('createdAt'),
    [historyCutoff]
  );
  const sessions = recentSessions ?? [];
  const streak = currentStreak(sessions, now);
  const todayMinutes = minutesOnDay(sessions, now);

  // Luồng làm bài chiếm trọn màn hình và có nút thoát riêng
  if (pathname.startsWith('/luyen-tap/phien') || pathname.startsWith('/on-tap/phien')) return null;

  return (
    <>
      {/* Mobile Status Popover Overlay (Hiển thị khi chạm vào nút trạng thái trên mobile) */}
      {!isDesktop && mobileStatusOpen && (
        <div
          role="dialog"
          aria-label="Trạng thái học tập hôm nay"
          className="fixed bottom-22 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xs rounded-2xl bg-card/95 backdrop-blur-xl border border-border/80 p-3.5 shadow-2xl space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tiến độ hôm nay
            </span>
            <button
              type="button"
              onClick={() => setMobileStatusOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded"
            >
              Đóng
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
              <span>{streak.days} ngày streak</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted border border-border text-foreground font-medium">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <span>{todayMinutes}/30 phút</span>
            </div>
          </div>
          <div className="pt-0.5 flex justify-center">
            <SyncBadge showTextOnMobile />
          </div>
        </div>
      )}

      {/* Floating Apple Dock Bar */}
      <nav
        aria-label="Điều hướng chính"
        className={cn(
          'fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] sm:bottom-6 left-1/2 -translate-x-1/2 z-50',
          'flex items-center gap-1 sm:gap-2 p-1.5 sm:px-3 sm:py-2',
          'rounded-full',
          'bg-background/90 dark:bg-card/90 backdrop-blur-2xl',
          'border border-border/80 dark:border-white/10',
          'shadow-2xl shadow-black/10 dark:shadow-black/60 ring-1 ring-black/5 dark:ring-white/5',
          'transition-all duration-300 select-none'
        )}
      >
        {/* Phân vùng 1 (Trái): Logo thương hiệu Washi */}
        <Link
          href="/"
          aria-label="Trang chủ Washi"
          className="flex items-center gap-2 pl-1 pr-1 sm:pr-2 group outline-none"
        >
          <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0 transition-transform group-hover:scale-105">
            <Image
              src="/brand/logo.png"
              alt="Logo Washi"
              width={28}
              height={28}
              className="object-contain"
              priority
            />
          </div>
          <div className="hidden md:flex flex-col leading-tight">
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs sm:text-sm text-foreground tracking-tight">
                Washi
              </span>
              <span className="font-jp text-[11px] text-primary font-medium">
                和紙
              </span>
            </div>
            <span className="text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider">
              N5 Master
            </span>
          </div>
        </Link>

        {/* Vạch ngăn cách 1 */}
        <div className="w-[1px] h-6 bg-border/80 self-center hidden sm:block" role="separator" />

        {/* Phân vùng 2 (Giữa): 6 Tab điều hướng chính */}
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
                  'group relative flex flex-col items-center justify-center',
                  'w-11 h-11 sm:w-11 sm:h-11',
                  'rounded-xl sm:rounded-full transition-all duration-200 ease-out outline-none',
                  'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'active:scale-95',
                  isActive
                    ? 'text-primary bg-primary/15 dark:bg-primary/25 shadow-inner font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                {/* Tooltip macOS (hiển thị khi hover trên PC) */}
                {isDesktop && (
                  <div
                    role="tooltip"
                    className={cn(
                      'pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2',
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
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                  </div>
                )}

                {/* Icon */}
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={cn(
                      'w-5 h-5 sm:w-5.5 sm:h-5.5 shrink-0 transition-transform duration-150',
                      'sm:group-hover:scale-115 sm:group-hover:-translate-y-0.5'
                    )}
                  />

                  {/* Badge số đếm quá hạn FSRS */}
                  {showBadge && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1.5 -right-2 sm:-top-1.5 sm:-right-2 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none shadow-sm motion-safe:animate-pulse"
                    >
                      {dueCount > 99 ? '99+' : dueCount}
                    </span>
                  )}
                </div>

                {/* Chấm tròn Active */}
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-primary mt-0.5 absolute bottom-1" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Vạch ngăn cách 2 */}
        <div className="w-[1px] h-6 bg-border/80 self-center hidden sm:block" role="separator" />

        {/* Phân vùng 3 (Phải): Trạng thái học tập */}
        {/* Desktop view (>=640px) */}
        <div className="hidden sm:flex items-center gap-1.5 pr-1">
          {/* Streak Chip */}
          <div
            title={`Chuỗi ${streak.days} ngày học liên tục`}
            className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-semibold text-amber-700 dark:text-amber-400 shadow-sm"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <span>{streak.days} ngày</span>
          </div>

          {/* Time Chip */}
          <div
            title={`Hôm nay đã học ${todayMinutes} trên 30 phút mục tiêu`}
            className="hidden lg:flex items-center gap-1 bg-muted/80 border border-border/80 px-2.5 py-1 rounded-full text-xs font-medium text-foreground shadow-sm"
          >
            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{todayMinutes}/30p</span>
          </div>

          {/* Cloud Sync Badge */}
          <SyncBadge />
        </div>

        {/* Mobile view (<640px): Icon toggle popover */}
        <div className="sm:hidden flex items-center pr-0.5">
          <button
            type="button"
            onClick={() => setMobileStatusOpen((prev) => !prev)}
            aria-label="Xem tiến độ và trạng thái học hôm nay"
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
              mobileStatusOpen
                ? 'bg-primary/20 text-primary'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground'
            )}
          >
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </button>
        </div>
      </nav>
    </>
  );
}
