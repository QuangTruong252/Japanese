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
  initSyncEngine,
  subscribeSyncStatus,
  triggerSync,
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
import { formatNavBadgeCount, isNavActive, shouldHideAppChrome, trackPath } from '@/lib/nav';
import { applySettingsToDOM, loadSettings } from '@/lib/settings';
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

// 5 đích điều hướng chính:
// Bảng tin · Học bài · Luyện tập · Ôn tập · Tra cứu
const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Bảng tin', icon: featureIcon('nav-home') },
  { href: '/hoc', label: 'Học bài', icon: featureIcon('nav-lesson') },
  { href: '/luyen-tap', label: 'Luyện tập', icon: featureIcon('nav-practice') },
  { href: '/on-tap', label: 'Ôn tập', icon: featureIcon('nav-review'), isDueTarget: true },
  { href: '/hoc/tra-cuu', label: 'Tra cứu', icon: featureIcon('nav-lookup') },
];

// Nút icon trên thanh đầu mobile: vùng chạm 44px, không viền để nhóm bốn nút không nặng
const HEADER_ICON = 'h-[44px] w-[44px] shrink-0 border-transparent bg-transparent shadow-none';
const HEADER_ICON_BASE =
  'rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition outline-none focus-visible:ring-3 focus-visible:ring-ring';

const FOCUS_RING = 'outline-none focus-visible:ring-3 focus-visible:ring-ring';

function NavBadge({ text, className }: { text: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold leading-none text-primary-foreground shadow-xs',
        className
      )}
    >
      {text}
    </span>
  );
}

function Avatar({ user }: { user: AuthUser | null }) {
  return user?.avatarUrl ? (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={user.avatarUrl}
      alt=""
      className="size-9 shrink-0 rounded-full border border-border object-cover"
    />
  ) : (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
      <User className="size-5" aria-hidden="true" />
    </span>
  );
}

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

  // AppNav có mặt trên mọi trang nên đây là nơi duy nhất gắn bộ tự đồng bộ: hàng đợi pendingSync được đẩy dù người học không mở trang nào có nút đồng bộ.
  useEffect(() => initSyncEngine(), []);
  useEffect(() => trackPath(pathname), [pathname]);

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
          triggerSync();
        } else {
          setCurrentUser(null);
        }
      });

      return () => subscription.unsubscribe();
    } catch {
      // Supabase unconfigured / unavailable
    }
  }, []);

  // Theme "Theo hệ thống" phải đổi ngay khi hệ điều hành đổi sáng/tối. Đặt ở đây vì AppNav luôn mount,
  // kể cả ở màn làm bài (chỉ ẩn phần hiển thị).
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const current = loadSettings();
      if (current.theme === 'system') applySettingsToDOM(current);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
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
  if (shouldHideAppChrome(pathname)) {
    return null;
  }

  const isProfileActive = pathname === '/ca-nhan' || pathname.startsWith('/ca-nhan/');
  const isSettingsActive = pathname === '/cai-dat' || pathname.startsWith('/cai-dat/');

  return (
    <>
      {/* ========================================================
          0. Mobile Top Bar (< 768px): Header với Nút Tài khoản
          Mở Profile/Thống kê từ cả năm màn chính ở 390px trong một chạm
          ======================================================== */}
      <header
        className="md:hidden shrink-0 z-30 flex items-center justify-between gap-1 px-4 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-2 bg-background"
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
          1. Mobile Shell (< 768px): thanh dưới 5 mục
          Bảng tin · Học · Luyện · Ôn · Tra cứu (thứ năm trỏ /hoc/tra-cuu)
          ======================================================== */}
      <nav
        aria-label="Điều hướng chính"
        className={cn(
          'fixed bottom-0 inset-x-0 z-50',
          'flex items-center justify-around gap-1 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]',
          'bg-background border-t border-border',
          'md:hidden select-none'
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
                  'text-xs mt-0.5 whitespace-nowrap tracking-tight font-medium',
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
          2. Tablet Shell (768–1023px): rail trái 80px
          Logo · 5 đích · Tìm · Giao diện · Cài đặt · Hồ sơ
          ======================================================== */}
      <aside
        aria-label="Điều hướng ứng dụng"
        className="hidden md:flex lg:hidden fixed inset-y-0 left-0 w-20 z-40 flex-col items-center justify-between border-r border-border bg-background py-4 select-none"
      >
        <div className="flex w-full flex-col items-center gap-4">
          <Link
            href="/"
            aria-label="Về trang chủ MaiPace"
            className={cn('flex size-12 items-center justify-center rounded-xl', FOCUS_RING)}
          >
            <Image
              src="/brand/maipace-mark.svg"
              alt=""
              width={32}
              height={32}
              className="size-8 object-contain"
              priority
            />
          </Link>

          <nav aria-label="Menu chính" className="flex w-full flex-col items-center gap-1 px-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = isNavActive(item.href, pathname);
              const badgeText = item.isDueTarget ? formatNavBadgeCount(dueCount) : null;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={badgeText ? `${item.label}, ${dueCount} mục đến hạn` : item.label}
                  className={cn(
                    'flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-xl py-1 transition duration-150',
                    FOCUS_RING,
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'relative flex h-8 w-14 items-center justify-center rounded-full',
                      isActive && 'bg-accent'
                    )}
                  >
                    <Icon className="size-6 shrink-0" aria-hidden="true" />
                    {badgeText && <NavBadge text={badgeText} className="absolute -top-1 right-0.5" />}
                  </span>
                  <span className={cn('text-xs whitespace-nowrap', isActive ? 'font-semibold' : 'font-medium')}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col items-center gap-1">
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
          <Link
            href="/ca-nhan"
            aria-label={currentUser?.displayName ? `Cá nhân & Tiến độ, ${currentUser.displayName}` : 'Cá nhân & Tiến độ'}
            aria-current={isProfileActive ? 'page' : undefined}
            className={cn(
              'mt-1 flex size-12 items-center justify-center rounded-full',
              FOCUS_RING,
              isProfileActive && 'bg-accent ring-2 ring-primary/40'
            )}
          >
            <Avatar user={currentUser} />
          </Link>
        </div>
      </aside>

      {/* ========================================================
          3. Desktop Shell (>= 1024px): sidebar cố định w-60
          Logo · Tìm + Giao diện · 5 đích · hàng hồ sơ + Cài đặt
          ======================================================== */}
      <aside
        aria-label="Điều hướng ứng dụng"
        className="hidden lg:flex fixed inset-y-0 left-0 w-60 z-40 flex-col justify-between border-r border-border bg-background px-4 py-6 select-none"
      >
        <div>
          <Link
            href="/"
            aria-label="Về trang chủ MaiPace"
            className={cn('flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/50', FOCUS_RING)}
          >
            <Image
              src="/brand/maipace-mark.svg"
              alt=""
              width={32}
              height={32}
              className="size-8 shrink-0 object-contain"
              priority
            />
            <span className="text-2xl font-bold tracking-tight text-foreground">MaiPace</span>
          </Link>

          <div className="mt-6 flex items-center gap-2">
            <button
              type="button"
              onClick={openSearch}
              aria-label="Tìm kiếm nội dung (Ctrl+K)"
              className={cn(
                'flex h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium',
                'text-muted-foreground transition duration-150 hover:bg-muted/60 hover:text-foreground',
                FOCUS_RING
              )}
            >
              <Search className="size-4 shrink-0" aria-hidden="true" />
              <span className="flex-1 whitespace-nowrap text-left">Tìm kiếm</span>
              <kbd className="shrink-0 whitespace-nowrap rounded-md border border-border bg-secondary px-1.5 py-0.5 font-sans text-xs text-muted-foreground">
                Ctrl K
              </kbd>
            </button>
            <ThemeToggle className="size-11 shrink-0" />
          </div>

          <nav className="mt-6 space-y-1" aria-label="Menu chính">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = isNavActive(item.href, pathname);
              const badgeText = item.isDueTarget ? formatNavBadgeCount(dueCount) : null;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={badgeText ? `${item.label}, ${dueCount} mục đến hạn` : undefined}
                  className={cn(
                    'relative flex min-h-12 items-center justify-between rounded-xl px-3 text-base transition duration-150',
                    FOCUS_RING,
                    isActive
                      ? 'bg-accent font-semibold text-primary'
                      : 'font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 h-6 w-1.5 -translate-y-1/2 bg-primary [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)]"
                    />
                  )}
                  <span className="flex items-center gap-3">
                    <Icon className="size-6 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                  {badgeText && <NavBadge text={badgeText} />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1 border-t border-border pt-3">
          <Link
            href="/ca-nhan"
            aria-current={isProfileActive ? 'page' : undefined}
            className={cn(
              'flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-sm transition duration-150',
              FOCUS_RING,
              isProfileActive ? 'bg-accent text-primary' : 'text-foreground hover:bg-muted/60'
            )}
          >
            <Avatar user={currentUser} />
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className={cn('truncate text-sm', isProfileActive ? 'font-semibold' : 'font-medium')}>
                {currentUser?.displayName || 'Cá nhân & Tiến độ'}
              </span>
              <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                {syncResolution.state === 'synced' && <CloudCheck className="size-3 shrink-0 text-success" />}
                {(syncResolution.state === 'pending' || syncResolution.state === 'syncing') && (
                  <CloudUpload
                    className={cn('size-3 shrink-0 text-warning', syncResolution.state === 'syncing' && 'animate-spin')}
                  />
                )}
                {(syncResolution.state === 'offline' || syncResolution.state === 'unconfigured') && (
                  <CloudOff className="size-3 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{syncResolution.label}</span>
              </span>
            </span>
          </Link>
          <Link
            href="/cai-dat"
            aria-label="Cài đặt"
            aria-current={isSettingsActive ? 'page' : undefined}
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-xl transition duration-150',
              FOCUS_RING,
              isSettingsActive ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <Settings className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </aside>
    </>
  );
}
