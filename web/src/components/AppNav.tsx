'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useDueClock } from '@/lib/use-due-clock';
import { SyncBadge } from '@/components/SyncBadge';
import {
  LayoutDashboard,
  BookOpen,
  Dumbbell,
  RotateCcw,
  BarChart3,
  Settings,
  Search,
} from 'lucide-react';
import { useUIStore } from '@/lib/store';
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
];

export function AppNav() {
  const pathname = usePathname();
  const openSearch = useUIStore((s) => s.openSearch);

  // Đếm số mục đến hạn (FSRS) theo thời gian thực
  const now = useDueClock();
  const dueCount =
    useLiveQuery(
      () => db.reviewItems.where('dueAt').belowOrEqual(now).count(),
      [now]
    ) ?? 0;

  // Luồng làm bài và học từ vựng chiếm trọn màn hình, có điều hướng riêng.
  if (
    pathname.startsWith('/luyen-tap/phien') ||
    pathname.startsWith('/on-tap/phien') ||
    /^\/hoc\/\d+\/tu-vung$/.test(pathname)
  ) {
    return null;
  }

  return (
    <>
      {/* ========================================================
          1. Mobile & Tablet Shell (< 1024px): Floating Dock 5 mục
          ======================================================== */}
      <nav
        aria-label="Điều hướng chính"
        className={cn(
          'fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] inset-x-4 mx-auto z-50',
          'flex items-center justify-between gap-1 px-2.5 py-1.5',
          'rounded-full max-w-md w-auto',
          'bg-background/90 dark:bg-card/90 backdrop-blur-2xl',
          'border border-border/80 dark:border-white/10',
          'shadow-xl shadow-black/5 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/5',
          'lg:hidden select-none'
        )}
      >
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
                'flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-2xl transition-all duration-150 outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon className="w-5 h-5 shrink-0" />
                {showBadge && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 -right-2 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none shadow-sm"
                  >
                    {dueCount > 99 ? '99+' : dueCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] mt-0.5 tracking-tight font-medium',
                  isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ========================================================
          2. Desktop Shell (>= 1024px): Left Sidebar cố định w-64
          ======================================================== */}
      <aside
        aria-label="Điều hướng ứng dụng"
        className="hidden lg:flex fixed inset-y-0 left-0 w-64 z-40 flex-col justify-between border-r border-border bg-card p-4 select-none"
      >
        <div>
          {/* Đỉnh: Logo thương hiệu MaiPace */}
          <Link
            href="/"
            aria-label="Về trang chủ MaiPace"
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/50 transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
              <Image
                src="/brand/maipace-mark.svg"
                alt=""
                width={24}
                height={24}
                style={{ width: 'auto', height: 'auto' }}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-foreground tracking-tight">
                  MaiPace
                </span>
                <span className="font-jp text-xs text-primary font-medium">
                  マイペース
                </span>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Minna no Nihongo N5
              </span>
            </div>
          </Link>

          {/* Nút tìm kiếm nhanh Ctrl+K (SPEC-13) */}
          <button
            type="button"
            onClick={openSearch}
            className={cn(
              'mt-5 w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium',
              'border border-border/80 bg-muted/40 text-muted-foreground transition-all duration-150',
              'hover:bg-muted/70 hover:text-foreground hover:border-primary/40',
              'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/60 cursor-pointer'
            )}
            aria-label="Tìm kiếm nội dung (Ctrl+K)"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span>Tìm kiếm...</span>
            </div>
            <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-border bg-background text-muted-foreground shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Giữa: 5 tab chính */}
          <nav className="mt-5 space-y-1" aria-label="Menu chính">
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
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 outline-none',
                    'focus-visible:ring-2 focus-visible:ring-primary/60',
                    isActive
                      ? 'bg-primary/15 text-primary font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </div>

                  {showBadge && (
                    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold">
                      {dueCount > 99 ? '99+' : dueCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Đáy: Khối Tài khoản thứ cấp (SyncBadge + Cài đặt) */}
        <div className="pt-3 border-t border-border/80 space-y-2">
          <div className="px-1 space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Đồng bộ dữ liệu
              </span>
            </div>
            <SyncBadge className="w-full justify-start px-3 py-1.5 text-xs shadow-2xs" />
          </div>

          <Link
            href="/cai-dat"
            className={cn(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 outline-none',
              'focus-visible:ring-2 focus-visible:ring-primary/60',
              pathname === '/cai-dat'
                ? 'bg-primary/15 text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span>Cài đặt & Dữ liệu</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
