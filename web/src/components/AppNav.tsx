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
  Search,
  Settings,
  User,
  CloudCheck,
  CloudOff,
  CloudUpload,
} from 'lucide-react';
import { formatNavBadgeCount, isNavActive, shouldHideAppChrome } from '@/lib/nav';
import { AccountButton } from '@/components/profile/AccountButton';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { FeatureIcon, type FeatureIconName } from '@/components/FeatureIcon';

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

const featureIcon = (name: FeatureIconName) =>
  function NavFeatureIcon({ className }: { className?: string }) {
    return <FeatureIcon name={name} className={className} />;
  };

// 5 đích điều hướng chính theo SPEC-16 & DESIGN.md §Navigation:
// Bảng tin · Học bài · Luyện tập · Ôn tập · Tra cứu
const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Bảng tin', icon: featureIcon('home') },
  { href: '/hoc', label: 'Học bài', icon: featureIcon('lesson') },
  { href: '/luyen-tap', label: 'Luyện tập', icon: featureIcon('practice') },
  { href: '/on-tap', label: 'Ôn tập', icon: featureIcon('review'), isDueTarget: true },
  { href: '/hoc/tra-cuu', label: 'Tra cứu', icon: featureIcon('lookup') },
];

// Nút icon trên thanh đầu mobile: vùng chạm 44px, không viền để nhóm bốn nút không nặng
const HEADER_ICON = 'h-[44px] w-[44px] shrink-0 border-transparent bg-transparent shadow-none';
const HEADER_ICON_BASE =
  'rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition outline-none focus-visible:ring-3 focus-visible:ring-ring';

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
      // Chỉ đọc session cục bộ: onAuthStateChange phát INITIAL_SESSION ngay khi đăng ký, không gọi mạng getUser()
      const supabase = createClient();
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

  // Luồng làm bài và học từ vựng chiếm trọn màn hình, có điều hướng riêng (SPEC-16 B16.3).
  if (shouldHideAppChrome(pathname)) {
    return null;
  }

  const isProfileActive = pathname === '/ca-nhan' || pathname.startsWith('/ca-nhan/');
  const isSettingsActive = pathname === '/cai-dat' || pathname.startsWith('/cai-dat/');

  return (
    <>
      {/* ========================================================
          0. Mobile Top Bar (< 1024px): Header với Nút Tài khoản
          Mở Profile/Thống kê từ cả năm màn chính ở 390px trong một chạm
          ======================================================== */}
      <header
        className="lg:hidden shrink-0 z-30 flex items-center justify-between gap-1 px-4 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-2 bg-background"
        aria-label="Thanh đầu trang"
      >
        <Link
          href="/"
          aria-label="Về trang chủ MaiPace"
          className="flex min-w-0 items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-lg py-1"
        >
          <div className="flex size-8 shrink-0 items-center justify-center">
            <Image
              src="/brand/maipace-mark.svg"
              alt=""
              width={24}
              height={24}
              className="object-contain"
              priority
            />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground max-[380px]:text-lg">
            MaiPace
          </span>
        </Link>

        {/* Hành động toàn cục (mobile): Tìm kiếm · Giao diện · Cài đặt · Tài khoản. Trang không tự đặt lại. */}
        <div className="flex shrink-0 items-center">
          <SearchTrigger iconOnly className={HEADER_ICON} />
          <ThemeToggle className={HEADER_ICON} />
          <Link
            href="/cai-dat"
            aria-label="Cài đặt"
            aria-current={isSettingsActive ? 'page' : undefined}
            className={cn(HEADER_ICON_BASE, HEADER_ICON, isSettingsActive && 'text-primary')}
          >
            <Settings className="size-5" aria-hidden="true" />
          </Link>
          <AccountButton user={currentUser}className="h-[48px] w-[48px] min-h-0 justify-center border-transparent bg-transparent p-0" />
        </div>
      </header>

      {/* ========================================================
          1. Mobile & Tablet Shell (< 1024px): Floating Dock 5 mục
          Bảng tin · Học · Luyện · Ôn · Tra cứu (thứ năm trỏ /hoc/tra-cuu)
          ======================================================== */}
      <nav
        aria-label="Điều hướng chính"
        className={cn(
          'fixed bottom-0 inset-x-0 z-50',
          'flex items-center justify-around gap-1 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]',
          'bg-background border-t border-border',
          'lg:hidden select-none'
        )}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = isNavActive(item.href, pathname);
          const badgeText = item.isDueTarget ? formatNavBadgeCount(dueCount) : null;
          const showBadge = badgeText !== null;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={showBadge ? `${item.label}, ${dueCount} mục đến hạn` : item.label}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center min-h-[48px] gap-1 pt-1 pb-2 px-1 rounded-lg transition duration-150 outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2',
                isActive
                  ? 'text-primary font-semibold after:absolute after:bottom-0 after:h-0.5 after:w-7 after:rounded-full after:bg-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon className="size-6 shrink-0" aria-hidden="true" />
                {showBadge && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 -right-2.5 inline-flex items-center justify-center min-w-5 h-4.5 px-1 rounded-full bg-primary text-primary-foreground text-xs font-bold leading-none shadow-xs"
                  >
                    {badgeText}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs mt-0.5 tracking-tight font-medium',
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
        className="hidden lg:flex fixed inset-y-0 left-0 w-64 z-40 flex-col justify-between border-r border-border bg-background px-6 py-8 select-none"
      >
        <div>
          {/* Đỉnh: Logo thương hiệu MaiPace */}
          <Link
            href="/"
            aria-label="Về trang chủ MaiPace"
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/50 transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <div className="flex size-9 items-center justify-center shrink-0">
              <Image
                src="/brand/maipace-mark.svg"
                alt=""
                width={28}
                height={28}
                style={{ width: 'auto', height: 'auto' }}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-3xl text-foreground tracking-tight">
                  MaiPace
                </span>
              </div>
            </div>
          </Link>

          {/* Hành động toàn cục (desktop): Tìm kiếm Ctrl+K (SPEC-13) + Giao diện; Cài đặt ở đáy sidebar */}
          <div className="mt-8 flex items-center gap-2">
            <button
              type="button"
              onClick={openSearch}
              className={cn(
                'min-w-0 flex-1 flex items-center justify-between px-2 py-2.5 rounded-xl text-sm font-medium',
                'text-muted-foreground transition duration-150',
                'hover:bg-muted/70 hover:text-foreground hover:border-primary/40',
                'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/60 cursor-pointer'
              )}
              aria-label="Tìm kiếm nội dung (Ctrl+K)"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="whitespace-nowrap">Tìm kiếm</span>
              </div>
            </button>
            <ThemeToggle className="size-11 shrink-0" />
          </div>

          {/* Giữa: 5 tab chính (Bảng tin · Học bài · Luyện tập · Ôn tập · Tra cứu) */}
          <nav className="mt-6 space-y-3" aria-label="Menu chính">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = isNavActive(item.href, pathname);
              const badgeText = item.isDueTarget ? formatNavBadgeCount(dueCount) : null;
              const showBadge = badgeText !== null;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={showBadge ? `${item.label}, ${dueCount} mục đến hạn` : undefined}
                  className={cn(
                    'flex min-h-14 items-center justify-between px-2 py-3 border-b-2 border-transparent text-base font-medium transition duration-150 outline-none',
                    'focus-visible:ring-2 focus-visible:ring-primary/60',
                    isActive
                      ? 'border-primary text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-6 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>

                  {showBadge && (
                    <span
                      aria-hidden="true"
                      className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-xs"
                    >
                      {badgeText}
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
              <span className="flex items-center gap-1 text-xs text-muted-foreground truncate mt-0.5">
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
