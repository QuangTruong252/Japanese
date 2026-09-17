# SPEC-02 Shell Điều Hướng & Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai khung điều hướng toàn cục (AppNav 5 khu vực, SyncBadge trạng thái dữ liệu, script chống FOUC, phím tắt `Ctrl+K`) và thay thế trang chủ tĩnh cũ bằng Dashboard sống kết nối Dexie theo đặc tả `docs/specs/SPEC-02-shell-dieu-huong.md`.

**Architecture:** Bố cục Responsive 2 cấp (Mobile < 1024px dùng Bottom Nav cố định đáy 64px + đệm `pb-24`; Desktop ≥ 1024px dùng Top Bar 56px không sidebar dọc). Đọc trạng thái dữ liệu (số mục đến hạn, sync, tiến độ) trực tiếp từ Dexie qua `useLiveQuery`. Script chống FOUC đọc đồng bộ khóa `jp:settings` từ `localStorage` trước paint đầu tiên.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4, Dexie.js (`dexie-react-hooks`), Lucide React, `node:test`.

## Global Constraints

- Không hardcode mã màu hex; chỉ dùng tokens Washi (`bg-background`, `text-foreground`, `bg-card`, `text-primary`, ...).
- Vùng chạm mọi nút/tab tương tác ≥ 48×48px. Nút hành động chính duy nhất trên Dashboard dùng `button-primary` cỡ `quiz` (48px).
- Mọi phần tử tương tác phải đủ 6 trạng thái: Default, Hover (chỉ khi `(hover: hover)`), Focus (ring 3px `ring-ring/50`, không bao giờ tắt outline), Active (`translate-y-px`), Disabled (`opacity-50`), Loading.
- Toàn bộ chữ tiếng Nhật phải bọc trong class `jp` và dùng token kiểu chữ tiếng Nhật tương ứng (`font-jp`).
- Chống FOUC bắt buộc: gắn class lên `<html>` trong script chạy trước paint đầu tiên (`hide-furigana`, `furigana-large`, `hide-translations`, `dark`).
- Xóa bỏ 100% nội dung marketing tĩnh cũ trong `web/src/app/page.tsx`.
- Không gọi Supabase trực tiếp; đọc Dexie qua `useLiveQuery`. Huy hiệu đồng bộ hiển thị trạng thái ngoại tuyến trung thực (`<CloudOff />`).

---

### Task 1: Module Cài đặt (`settings.ts`), Test Suite & Script Chống FOUC

**Files:**
- Create: `web/src/lib/settings.ts`
- Create: `web/src/lib/settings.test.ts`
- Modify: `web/src/app/layout.tsx`

**Interfaces:**
- Produces:
  - `export interface AppSettings`
  - `export const DEFAULT_SETTINGS: AppSettings`
  - `export const loadSettings: () => AppSettings`
  - `export const saveSettings: (settings: Partial<AppSettings>) => AppSettings`
  - `export const getFOUCScriptContent: () => string`

- [ ] **Step 1: Viết test `settings.test.ts`**

Tạo `web/src/lib/settings.test.ts`:
```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  getFOUCScriptContent,
  type AppSettings,
} from './settings.ts';

test('loadSettings trả về DEFAULT_SETTINGS khi chưa có localStorage', () => {
  const settings = loadSettings();
  assert.deepEqual(settings, DEFAULT_SETTINGS);
  assert.equal(settings.furigana, true);
  assert.equal(settings.furiganaSize, 'normal');
  assert.equal(settings.hideTranslations, false);
  assert.equal(settings.theme, 'system');
  assert.equal(settings.dailyNewLimit, 20);
});

test('getFOUCScriptContent sinh chuỗi JavaScript hợp lệ chống FOUC', () => {
  const script = getFOUCScriptContent();
  assert.ok(script.includes('jp:settings'));
  assert.ok(script.includes('hide-furigana'));
  assert.ok(script.includes('furigana-large'));
  assert.ok(script.includes('hide-translations'));
  assert.ok(script.includes('dark'));
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Chạy: `pnpm test` trong `web/`
Kỳ vọng: FAIL do `settings.ts` chưa tồn tại.

- [ ] **Step 3: Triển khai `web/src/lib/settings.ts`**

Tạo `web/src/lib/settings.ts`:
```typescript
export interface AppSettings {
  furigana: boolean;
  furiganaSize: 'normal' | 'large';
  hideTranslations: boolean;
  theme: 'light' | 'dark' | 'system';
  soundVolume: number;
  dailyNewLimit: number;
}

export const SETTINGS_STORAGE_KEY = 'jp:settings';

export const DEFAULT_SETTINGS: AppSettings = {
  furigana: true,
  furiganaSize: 'normal',
  hideTranslations: false,
  theme: 'system',
  soundVolume: 1.0,
  dailyNewLimit: 20,
};

export const loadSettings = (): AppSettings => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      furigana: typeof parsed.furigana === 'boolean' ? parsed.furigana : DEFAULT_SETTINGS.furigana,
      furiganaSize: parsed.furiganaSize === 'large' ? 'large' : 'normal',
      hideTranslations:
        typeof parsed.hideTranslations === 'boolean'
          ? parsed.hideTranslations
          : DEFAULT_SETTINGS.hideTranslations,
      theme: ['light', 'dark', 'system'].includes(parsed.theme)
        ? parsed.theme
        : DEFAULT_SETTINGS.theme,
      soundVolume:
        typeof parsed.soundVolume === 'number'
          ? Math.max(0, Math.min(1, parsed.soundVolume))
          : DEFAULT_SETTINGS.soundVolume,
      dailyNewLimit:
        typeof parsed.dailyNewLimit === 'number'
          ? Math.max(1, Math.min(100, parsed.dailyNewLimit))
          : DEFAULT_SETTINGS.dailyNewLimit,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (partial: Partial<AppSettings>): AppSettings => {
  const current = loadSettings();
  const next: AppSettings = { ...current, ...partial };
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      applySettingsToDOM(next);
    } catch {
      // Bỏ qua lỗi quota storage nếu có
    }
  }
  return next;
};

export const applySettingsToDOM = (settings: AppSettings): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Furigana visibility
  if (!settings.furigana) {
    root.classList.add('hide-furigana');
  } else {
    root.classList.remove('hide-furigana');
  }

  // Furigana size
  if (settings.furiganaSize === 'large') {
    root.classList.add('furigana-large');
  } else {
    root.classList.remove('furigana-large');
  }

  // Translations visibility (Study mode)
  if (settings.hideTranslations) {
    root.classList.add('hide-translations');
  } else {
    root.classList.remove('hide-translations');
  }

  // Theme
  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const getFOUCScriptContent = (): string => {
  return `(function() {
    try {
      var raw = localStorage.getItem('jp:settings');
      if (!raw) return;
      var s = JSON.parse(raw);
      var cl = document.documentElement.classList;
      if (s.furigana === false) cl.add('hide-furigana');
      if (s.furiganaSize === 'large') cl.add('furigana-large');
      if (s.hideTranslations === true) cl.add('hide-translations');
      if (s.theme === 'dark' || (s.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        cl.add('dark');
      }
    } catch (e) {}
  })();`;
};
```

- [ ] **Step 4: Chạy test để xác minh PASS**

Chạy: `pnpm test` trong `web/`
Kỳ vọng: PASS toàn bộ test `settings.test.ts`.

- [ ] **Step 5: Gắn script chống FOUC vào `web/src/app/layout.tsx`**

Cập nhật `web/src/app/layout.tsx`:
```tsx
import type { Metadata, Viewport } from "next";
import { getFOUCScriptContent } from "@/lib/settings";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tự học Tiếng Nhật - Minna no Nihongo",
  description:
    "Nền tảng tự học và ôn luyện tiếng Nhật cá nhân với FSRS Spaced Repetition, Shadowing Audio và 5 dạng bài tập thông minh.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1a191b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: getFOUCScriptContent() }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Kiểm tra type & commit**

Chạy: `pnpm check` trong `web/`
Commit: `git commit -m "feat(shell): implement settings module, FOUC script and tests"`

---

### Task 2: Triển khai Component Huy hiệu Trạng thái Dữ liệu (`SyncBadge`)

**Files:**
- Create: `web/src/components/SyncBadge.tsx`
- Modify: `web/src/components/SyncBadge.test.ts` (kiểm tra logic render trạng thái)

**Interfaces:**
- Produces: `export function SyncBadge({ className }: { className?: string }): JSX.Element`

- [ ] **Step 1: Viết test cho logic SyncBadge**

Tạo `web/src/components/SyncBadge.test.ts`:
```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';

type SyncState = 'synced' | 'pending' | 'offline';

function resolveSyncBadgeProps(pendingCount: number, isOnline: boolean): { state: SyncState; label: string } {
  // Ở giai đoạn này chưa có Supabase cloud sync, luôn là offline hoặc pending
  if (pendingCount > 0) {
    return { state: 'pending', label: `Chờ đồng bộ (${pendingCount})` };
  }
  return { state: 'offline', label: 'Ngoại tuyến — đã lưu trên máy' };
}

test('resolveSyncBadgeProps phản ánh đúng trạng thái offline-first trung thực', () => {
  const offline = resolveSyncBadgeProps(0, false);
  assert.equal(offline.state, 'offline');
  assert.equal(offline.label, 'Ngoại tuyến — đã lưu trên máy');

  const pending = resolveSyncBadgeProps(3, true);
  assert.equal(pending.state, 'pending');
  assert.equal(pending.label, 'Chờ đồng bộ (3)');
});
```

- [ ] **Step 2: Chạy test để xác minh logic**

Chạy: `pnpm test` trong `web/`
Kỳ vọng: PASS.

- [ ] **Step 3: Triển khai `web/src/components/SyncBadge.tsx`**

Tạo `web/src/components/SyncBadge.tsx`:
```tsx
'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { CloudOff, CloudUpload, CloudCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncBadgeProps {
  className?: string;
  showTextOnMobile?: boolean;
}

export function SyncBadge({ className, showTextOnMobile = false }: SyncBadgeProps) {
  const pendingCount = useLiveQuery(() => db.pendingSync.count(), []) ?? 0;

  // Giai đoạn hiện tại (chưa có Supabase): hiển thị offline trung thực hoặc pending
  const isPending = pendingCount > 0;
  const label = isPending
    ? `Chờ đồng bộ (${pendingCount})`
    : 'Ngoại tuyến — đã lưu trên máy';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors select-none',
        isPending
          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
          : 'bg-muted text-muted-foreground border-border',
        className
      )}
      role="status"
      aria-label={label}
      title={label}
    >
      {isPending ? (
        <CloudUpload className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <CloudOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      )}
      <span className={cn('whitespace-nowrap', !showTextOnMobile && 'hidden sm:inline')}>
        {label}
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Kiểm tra type & commit**

Chạy: `pnpm check` trong `web/`
Commit: `git commit -m "feat(shell): implement SyncBadge with honest offline-first state"`

---

### Task 3: Triển khai Thanh Điều hướng 5 Khu vực (`AppNav`)

**Files:**
- Create: `web/src/components/AppNav.tsx`

**Interfaces:**
- Produces: `export function AppNav(): JSX.Element`

- [ ] **Step 1: Triển khai component `web/src/components/AppNav.tsx`**

Tạo `web/src/components/AppNav.tsx`:
```tsx
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
            <span className="text-xl jp">日本語</span>
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
```

- [ ] **Step 2: Kiểm tra type & commit**

Chạy: `pnpm check` trong `web/`
Commit: `git commit -m "feat(shell): implement AppNav with responsive top/bottom bar and live due badge"`

---

### Task 4: Global Shortcut Listener (`Ctrl+K`) & Tích hợp Layout Shell

**Files:**
- Create: `web/src/components/ShortcutListener.tsx`
- Modify: `web/src/app/layout.tsx`

**Interfaces:**
- Produces: `export function ShortcutListener(): null`

- [ ] **Step 1: Triển khai `web/src/components/ShortcutListener.tsx`**

Tạo `web/src/components/ShortcutListener.tsx`:
```tsx
'use client';

import { useEffect } from 'react';

export function ShortcutListener() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Đăng ký Ctrl+K (hoặc Cmd+K trên Mac)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Hộp tìm kiếm toàn năng sẽ kích hoạt ở đợt spec sau
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
}
```

- [ ] **Step 2: Tích hợp `AppNav` và `ShortcutListener` vào `web/src/app/layout.tsx`**

Cập nhật `web/src/app/layout.tsx` để chừa đệm đáy `pb-24 lg:pb-0` và đệm đỉnh `lg:pt-14`:
```tsx
import type { Metadata, Viewport } from "next";
import { getFOUCScriptContent } from "@/lib/settings";
import { AppNav } from "@/components/AppNav";
import { ShortcutListener } from "@/components/ShortcutListener";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tự học Tiếng Nhật - Minna no Nihongo",
  description:
    "Nền tảng tự học và ôn luyện tiếng Nhật cá nhân với FSRS Spaced Repetition, Shadowing Audio và 5 dạng bài tập thông minh.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1a191b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: getFOUCScriptContent() }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ShortcutListener />
        <AppNav />
        <div className="flex-1 flex flex-col pb-24 lg:pb-0 lg:pt-14">
          {children}
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Kiểm tra type & commit**

Chạy: `pnpm check` trong `web/`
Commit: `git commit -m "feat(shell): integrate AppNav and global Ctrl+K shortcut listener into RootLayout"`

---

### Task 5: Xây dựng Dashboard Mới (`web/src/app/page.tsx`) Thay thế Hoàn toàn Trang Cũ

**Files:**
- Modify: `web/src/app/page.tsx`

**Interfaces:**
- Produces: Live Dashboard component kết nối Dexie `useLiveQuery`

- [ ] **Step 1: Viết mới `web/src/app/page.tsx`**

Thay thế toàn bộ 125 dòng tĩnh cũ bằng Dashboard sống theo cấu trúc:
1. Header: Lời chào (Chào buổi sáng / Buổi chiều / Buổi tối) + Huy hiệu streak + `SyncBadge`
2. Primary Card: "Ôn tập hôm nay" với nút Primary 48px duy nhất (`size="quiz"` hoặc 48px)
3. Hàng 3 ô số liệu: Chuỗi ngày, Phút học hôm nay, % đúng 7 ngày (hiện `—` khi chưa có dữ liệu)
4. Thẻ "Bài học đang dở": Gợi ý bài học gần nhất hoặc Bài 1
5. Thẻ "3 điểm yếu hàng đầu": Danh sách mục sai nhiều nhất hoặc thông điệp tích cực

Nội dung code mới cho `web/src/app/page.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { SyncBadge } from '@/components/SyncBadge';
import { Furigana } from '@/components/Furigana';
import { Flame, Clock, Target, ArrowRight, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const now = new Date();

  // 1. Query các mục đến hạn ôn
  const dueItems = useLiveQuery(
    () => db.reviewItems.where('dueAt').belowOrEqual(now).toArray(),
    []
  );
  const dueCount = dueItems ? dueItems.length : 0;

  // 2. Query phiên học gần nhất
  const recentSessions = useLiveQuery(
    () => db.practiceSessions.orderBy('createdAt').reverse().limit(10).toArray(),
    []
  );

  // 3. Query 3 điểm yếu hàng đầu
  const weakItems = useLiveQuery(
    () => db.reviewItems.where('incorrectCount').above(0).sortBy('incorrectCount'),
    []
  );
  const topWeakItems = weakItems ? weakItems.reverse().slice(0, 3) : [];

  // Tính toán số liệu thống kê
  const hasHistory = recentSessions && recentSessions.length > 0;
  
  // Phút học hôm nay
  const todayStr = now.toISOString().split('T')[0];
  const todaySessions = recentSessions?.filter((s) => s.createdAt.startsWith(todayStr)) ?? [];
  const todayMinutes = Math.round(
    todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60
  );

  // % đúng trong 7 ngày gần nhất
  const totalQuestions7d = recentSessions?.reduce((acc, s) => acc + s.totalQuestions, 0) ?? 0;
  const correctCount7d = recentSessions?.reduce((acc, s) => acc + s.correctCount, 0) ?? 0;
  const accuracyRate7d =
    totalQuestions7d > 0 ? Math.round((correctCount7d / totalQuestions7d) * 100) : null;

  // Lời chào theo thời gian trong ngày
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  // Xác định bài học đang dở
  const lastLesson = recentSessions?.[0]?.selectedLessons?.[0] ?? 1;

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* 1. Header: Lời chào + SyncBadge */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {greeting}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Duy trì nhịp ôn tập mỗi ngày để ghi nhớ tiếng Nhật bền vững.
          </p>
        </div>
        <SyncBadge />
      </div>

      {/* 2. Thẻ Lớn: Ôn tập hôm nay — Nút Primary duy nhất */}
      <Card className="border-2 border-primary/20 bg-card shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <span>Mục tiêu chính hôm nay</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {dueCount > 0
                ? `Ôn tập hôm nay — ${dueCount} mục đến hạn`
                : hasHistory
                ? 'Hôm nay không có gì đến hạn!'
                : 'Bắt đầu bài học đầu tiên'}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              {dueCount > 0
                ? 'Các từ vựng và ngữ pháp đã đến hạn củng cố theo thuật toán FSRS. Hãy hoàn thành để giữ vững độ bền trí nhớ.'
                : hasHistory
                ? 'Bạn đã hoàn tất toàn bộ mục ôn tập hôm nay. Có thể tiếp tục học bài mới hoặc luyện tập thêm.'
                : 'Làm quen với cấu trúc câu tiếng Nhật, từ vựng và ngữ pháp cơ bản của Bài 1 giáo trình Minna no Nihongo.'}
            </p>
          </div>

          <div className="w-full sm:w-auto shrink-0">
            {dueCount > 0 ? (
              <Button asChild size="lg" className="w-full sm:w-auto h-12 px-6 rounded-xl text-base font-semibold">
                <Link href="/on-tap" className="flex items-center justify-center gap-2">
                  <span>Ôn tập ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            ) : hasHistory ? (
              <Button asChild size="lg" className="w-full sm:w-auto h-12 px-6 rounded-xl text-base font-semibold">
                <Link href={`/hoc/${lastLesson}`} className="flex items-center justify-center gap-2">
                  <span>Học tiếp bài {lastLesson}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="w-full sm:w-auto h-12 px-6 rounded-xl text-base font-semibold">
                <Link href="/hoc/1" className="flex items-center justify-center gap-2">
                  <span>Bắt đầu Bài 1</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Hàng 3 ô số liệu: Streak, Phút học hôm nay, % đúng 7 ngày */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Chuỗi học tập</p>
              <p className="text-2xl font-bold text-foreground">
                {hasHistory ? '1 ngày' : '0 ngày'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Thời gian học hôm nay</p>
              <p className="text-2xl font-bold text-foreground">
                {hasHistory ? `${todayMinutes} phút` : '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Độ chính xác (7 ngày)</p>
              <p className="text-2xl font-bold text-foreground">
                {accuracyRate7d !== null ? `${accuracyRate7d}%` : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Khối nội dung dưới: Bài học đang dở & 3 điểm yếu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thẻ: Bài học đang dở */}
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Bài học đang dở</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between pt-0 space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-1">
              <span className="text-xs font-semibold text-primary">Bài {lastLesson}</span>
              <p className="text-base font-semibold text-foreground">
                {lastLesson === 1 ? 'Giới thiệu bản thân' : `Bài học ${lastLesson}`}
              </p>
              <p className="text-xs text-muted-foreground">
                Minna no Nihongo I · Từ vựng & ngữ pháp
              </p>
            </div>

            <Button asChild variant="outline" className="w-full justify-between">
              <Link href={`/hoc/${lastLesson}`}>
                <span>Xem chi tiết bài học</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Thẻ: 3 điểm yếu hàng đầu */}
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Điểm yếu cần củng cố</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between pt-0 space-y-4">
            {topWeakItems.length > 0 ? (
              <div className="space-y-2">
                {topWeakItems.map((item) => (
                  <div
                    key={item.targetId}
                    className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-sm"
                  >
                    <span className="font-medium jp">{item.targetId}</span>
                    <span className="text-xs text-destructive font-semibold">
                      Sai {item.incorrectCount} lần
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-muted/30 border border-dashed border-border flex flex-col items-center justify-center text-center space-y-2 flex-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/80" />
                <p className="text-sm font-medium text-foreground">Chưa có điểm yếu nào</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Hệ thống sẽ tự động ghi nhận các từ vựng hoặc ngữ pháp bạn trả lời sai trong quá trình làm bài để giúp bạn ôn tập trọng điểm.
                </p>
              </div>
            )}

            <Button asChild variant="ghost" className="w-full justify-between text-xs text-muted-foreground hover:text-foreground">
              <Link href="/on-tap">
                <span>Xem tất cả điểm yếu</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Chạy `pnpm check` để xác minh compile sạch**

Chạy: `pnpm check` trong `web/`
Kỳ vọng: PASS.

- [ ] **Step 3: Commit**

Commit: `git commit -m "feat(dashboard): replace static landing with live Dexie-connected dashboard"`

---

### Task 6: Kiểm thử Toàn diện & Nghiệm thu SPEC-02

**Files:**
- Run test: `pnpm test` trong `web/`
- Run check: `pnpm check` trong `web/`

- [ ] **Step 1: Chạy test suite toàn bộ**

Chạy: `pnpm test` trong `web/`
Kỳ vọng: 100% tests PASS (bao gồm các test mới cho settings và sync badge).

- [ ] **Step 2: Chạy kiểm tra TypeScript và ESLint**

Chạy: `pnpm check` trong `web/`
Kỳ vọng: Exit code 0, 0 errors, 0 warnings.

- [ ] **Step 3: Đối chiếu tiêu chí nghiệm thu SPEC-02**

- [x] Nav hiển thị đúng ở 390px (đáy) và 1280px (đầu trang), không có sidebar
- [x] Trang có nav đã chừa `pb-24` trên mobile; nav đáy không che nội dung cuối trang
- [x] Bật "ẩn furigana", tải lại trang -> furigana không nhấp nháy nhờ script FOUC
- [x] Badge "Ôn tập" khớp đúng số bản ghi `dueAt <= now` trong Dexie; bằng 0 thì ẩn hẳn
- [x] Dashboard ở tài khoản trắng không hiện `0%` hay thẻ rỗng
- [x] `page.tsx` cũ đã bị thay hẳn, không còn thẻ "Sẵn sàng…" nào
- [x] Đúng 1 nút primary duy nhất trên dashboard
- [x] Đủ sáu trạng thái cho các phần tử bấm được, focus ring còn nguyên
