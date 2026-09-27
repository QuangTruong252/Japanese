'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useDueClock } from '@/lib/use-due-clock';
import { resolveSyncBadgeState } from '@/lib/stats';
import {
  getSyncStatusSnapshot,
  getServerSyncStatusSnapshot,
  subscribeSyncStatus,
} from '@/lib/sync';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  BookOpen,
  Dumbbell,
  RotateCcw,
  Search,
  Settings,
  User,
  CloudCheck,
  CloudOff,
  CloudUpload,
  RefreshCw,
} from 'lucide-react';
import { isNavActive } from '@/lib/nav';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isDueTarget?: boolean;
}

interface AuthUser {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}

// 5 đích điều hướng chính theo SPEC-16 & DESIGN.md §Navigation:
// Bảng tin · Học bài · Luyện tập · Ôn tập · Tra cứu
const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Bảng tin', icon: LayoutDashboard },
  { href: '/hoc', label: 'Học bài', icon: BookOpen },
  { href: '/luyen-tap', label: 'Luyện tập', icon: Dumbbell },
  { href: '/on-tap', label: 'Ôn tập', icon: RotateCcw, isDueTarget: true },
  { href: '/hoc/tra-cuu', label: 'Tra cứu', icon: Search },
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

  // Trạng thái tài khoản & sync cho sidebar và header mobile
  const dexiePendingCount = useLiveQuery(() => db.pendingSync.count(), []) ?? 0;
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setCurrentUser({
            id: user.id,
            email: user.email,
            displayName:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0],
            avatarUrl: user.user_metadata?.avatar_url,
          });
        }
      }).catch(() => {
        // Ignore unconfigured
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email,
            displayName:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split('@')[0],
            avatarUrl: session.user.user_metadata?.avatar_url,
          });
        } else {
          setCurrentUser(null);
        }
      });

      return () => subscription.unsubscribe();
    } catch {
      // Supabase unconfigured / unavailable
    }
  }, []);

  const engineStatus = useSyncExternalStore(
    subscribeSyncStatus,
    getSyncStatusSnapshot,
    getServerSyncStatusSnapshot,
  );

  const totalPending = Math.max(dexiePendingCount, engineStatus.pendingCount);

  const syncResolution = resolveSyncBadgeState({
    pendingCount: totalPending,
    isLoggedIn: Boolean(currentUser),
    engineState: engineStatus.state,
  });

  // Luồng làm bài và học từ vựng chiếm trọn màn hình, có điều hướng riêng.
  if (
    pathname.startsWith('/luyen-tap/phien') ||
    pathname.startsWith('/on-tap/phien') ||
    /^\/hoc\/\d+\/tu-vung$/.test(pathname)
  ) {
    return null;
  }

  const isProfileActive = pathname === '/ca-nhan' || pathname.startsWith('/ca-nhan/');

  return (
    <>
      {/* ========================================================
          0. Mobile Top Bar (< 1024px): Header với Nút Tài khoản
          Mở Profile/Thống kê từ cả năm màn chính ở 390px trong một chạm
          ======================================================== */}
      <header
        className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2 bg-background/95 dark:bg-card/95 backdrop-blur-md border-b border-border/70"
        aria-label="Thanh đầu trang"
      >
        <Link
          href="/"
          aria-label="Về trang chủ MaiPace"
          className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-lg py-1"
        >
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
            <Image
              src="/brand/maipace-mark.svg"
              alt=""
              width={18}
              height={18}
              className="object-contain"
              priority
            />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">
            MaiPace
          </span>
        </Link>

        {/* Nút Tài khoản góc phải: tối thiểu 48px vùng chạm */}
        <Link
          href="/ca-nhan"
          aria-label={
            currentUser?.displayName
              ? `Tài khoản ${currentUser.displayName}`
              : 'Tài khoản'
          }
          className={cn(
            'inline-flex items-center gap-2 min-h-[48px] px-3.5 py-1.5 rounded-full text-xs font-medium border transition duration-150 outline-none select-none cursor-pointer',
            'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2',
            isProfileActive
              ? 'border-primary/50 text-primary bg-primary/10 font-semibold shadow-xs'
              : 'border-border/80 bg-card text-foreground hover:bg-muted/70'
          )}
        >
          <div className="relative shrink-0 flex items-center justify-center">
            {currentUser?.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={currentUser.avatarUrl}
                alt=""
                className="size-6 rounded-full object-cover border border-border/80"
              />
            ) : (
              <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                <User className="size-3.5" />
              </div>
            )}
          </div>
          <span className="truncate max-w-[110px]">
            {currentUser?.displayName || 'Tài khoản'}
          </span>
        </Link>
      </header>

      {/* ========================================================
          1. Mobile & Tablet Shell (< 1024px): Floating Dock 5 mục
          Bảng tin · Học · Luyện · Ôn · Tra cứu (thứ năm trỏ /hoc/tra-cuu)
          ======================================================== */}
      <nav
        aria-label="Điều hướng chính"
        className={cn(
          'fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] inset-x-4 mx-auto z-50',
          'flex items-center justify-between gap-1 px-2.5 py-1.5',
          'rounded-full max-w-md w-auto',
          'bg-background/95 dark:bg-card/95',
          'border border-border/80 dark:border-white/10',
          'shadow-xl shadow-black/5 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/5',
          'lg:hidden select-none'
        )}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = isNavActive(item.href, pathname);
          const showBadge = item.isDueTarget && dueCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={showBadge ? `${item.label}, ${dueCount} mục đến hạn` : item.label}
              className={cn(
                'flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-2xl transition duration-150 outline-none',
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
          5 mục chính + khối cuối sidebar dẫn /ca-nhan (SPEC-16)
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
              'border border-border/80 bg-muted/40 text-muted-foreground transition duration-150',
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

          {/* Giữa: 5 tab chính (Bảng tin · Học bài · Luyện tập · Ôn tập · Tra cứu) */}
          <nav className="mt-5 space-y-1" aria-label="Menu chính">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = isNavActive(item.href, pathname);
              const showBadge = item.isDueTarget && dueCount > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 outline-none',
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

        {/* Đáy: Khối Tài khoản dẫn /ca-nhan có trạng thái sync bằng chữ (SPEC-16 §3) */}
        <div className="pt-3 border-t border-border/80 space-y-2">
          {/* Lối vào Hồ sơ /ca-nhan */}
          <Link
            href="/ca-nhan"
            aria-current={isProfileActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition duration-150 outline-none border border-transparent',
              'focus-visible:ring-2 focus-visible:ring-primary/60',
              isProfileActive
                ? 'bg-primary/15 text-primary font-semibold border-primary/20 shadow-xs'
                : 'text-foreground hover:bg-muted/60'
            )}
          >
            {currentUser?.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={currentUser.avatarUrl}
                alt=""
                className="size-8 rounded-full border border-border object-cover shrink-0"
              />
            ) : (
              <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium shrink-0">
                <User className="size-4" />
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1 leading-tight">
              <span className="font-medium text-sm truncate">
                {currentUser?.displayName || 'Cá nhân & Tiến độ'}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate mt-0.5">
                {syncResolution.state === 'synced' && (
                  <CloudCheck className="size-3 text-success shrink-0" />
                )}
                {(syncResolution.state === 'pending' || syncResolution.state === 'syncing') && (
                  <CloudUpload className={cn('size-3 text-warning shrink-0', syncResolution.state === 'syncing' && 'animate-spin')} />
                )}
                {(syncResolution.state === 'offline' || syncResolution.state === 'unconfigured') && (
                  <CloudOff className="size-3 text-muted-foreground shrink-0" />
                )}
                <span className="truncate">{syncResolution.label}</span>
              </span>
            </div>
          </Link>

          {/* Lối phụ sang Cài đặt & Dữ liệu */}
          <Link
            href="/cai-dat"
            className={cn(
              'flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition duration-150 outline-none',
              'focus-visible:ring-2 focus-visible:ring-primary/60',
              pathname === '/cai-dat'
                ? 'bg-primary/15 text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Cài đặt & Dữ liệu</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
