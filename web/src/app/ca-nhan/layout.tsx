'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, TrendingUp, BarChart3 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function CaNhanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isThongKe = pathname === '/ca-nhan/thong-ke' || pathname.startsWith('/ca-nhan/thong-ke/');
  const isTienDo = !isThongKe && (pathname === '/ca-nhan' || pathname.startsWith('/ca-nhan'));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-32 sm:pb-20">
      {/* 1. Header Trang Cá Nhân */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <span>Hồ sơ học tập</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Cá nhân
          </h1>
          <p className="text-sm text-muted-foreground">
            Tiến trình học tập, thống kê chi tiết và tài khoản cá nhân.
          </p>
        </div>

        {/* Lối phụ sang Cài đặt & Dữ liệu */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/cai-dat"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'min-h-[44px] sm:min-h-9 px-3.5 rounded-xl border-border/80 gap-2 text-xs sm:text-sm font-medium hover:border-primary/40'
            )}
            aria-label="Đến Cài đặt & Dữ liệu"
          >
            <Settings className="size-4 text-muted-foreground" />
            <span>Cài đặt & Dữ liệu</span>
          </Link>
        </div>
      </header>

      {/* 2. URL Tabs: Tiến độ vs Thống kê */}
      <nav
        aria-label="Phân khu cá nhân"
        role="tablist"
        className="inline-flex w-full sm:w-auto p-1 rounded-xl bg-muted/60 border border-border/60 gap-1 select-none"
      >
        <Link
          href="/ca-nhan"
          role="tab"
          aria-selected={isTienDo}
          aria-controls="panel-tiendo"
          className={cn(
            'flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition duration-150 outline-none',
            'focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[44px]',
            isTienDo
              ? 'bg-background text-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          )}
        >
          <TrendingUp className="size-4 shrink-0" />
          <span>Tiến độ</span>
        </Link>

        <Link
          href="/ca-nhan/thong-ke"
          role="tab"
          aria-selected={isThongKe}
          aria-controls="panel-thongke"
          className={cn(
            'flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition duration-150 outline-none',
            'focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[44px]',
            isThongKe
              ? 'bg-background text-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          )}
        >
          <BarChart3 className="size-4 shrink-0" />
          <span>Thống kê</span>
        </Link>
      </nav>

      {/* 3. Nội dung của Tab */}
      <div id={isThongKe ? 'panel-thongke' : 'panel-tiendo'} role="tabpanel">
        {children}
      </div>
    </main>
  );
}
