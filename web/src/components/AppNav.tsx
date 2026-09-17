'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { BookOpen, Dumbbell, RotateCcw, BarChart3, Settings } from 'lucide-react';
import { SyncBadge } from '@/components/SyncBadge';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isDueTarget?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/hoc', label: 'Học', icon: BookOpen },
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
    <>
      {/* 1. Desktop Top Bar (≥ 1024px) */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 h-14 bg-card/95 backdrop-blur border-b border-border z-40 px-6 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-primary font-semibold tracking-tight hover:opacity-90 transition-opacity"
          >
            <span className="text-xl font-bold jp">日本語</span>
            <span className="text-sm text-muted-foreground font-normal">| Minna</span>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Điều hướng chính (desktop)">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const showBadge = item.isDueTarget && dueCount > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={showBadge ? `${item.label}, ${dueCount} mục đến hạn` : item.label}
                  className={cn(
                    'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-primary/50',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {showBadge && (
                    <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
                      {dueCount > 99 ? '99+' : dueCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <SyncBadge />
        </div>
      </header>

      {/* 2. Mobile Bottom Bar (< 1024px) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border shadow-md z-40 pb-[env(safe-area-inset-bottom)]"
        aria-label="Điều hướng chính (mobile)"
      >
        <div className="grid grid-cols-5 h-full max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const showBadge = item.isDueTarget && dueCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                aria-label={showBadge ? `${item.label}, ${dueCount} mục đến hạn` : item.label}
                className={cn(
                  'relative flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-primary/50 active:translate-y-px',
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="relative">
                  <Icon className="w-6 h-6 shrink-0" />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2.5 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none shadow-sm">
                      {dueCount > 99 ? '99+' : dueCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
