'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Accent, PageTitle } from '@/components/PaperKit';
import { cn } from '@/lib/utils';

const TAB_BASE =
  'inline-flex min-h-11 flex-1 items-center justify-center rounded-lg px-5 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring';

export default function CaNhanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isThongKe = pathname === '/ca-nhan/thong-ke' || pathname.startsWith('/ca-nhan/thong-ke/');
  const isTienDo = !isThongKe && pathname.startsWith('/ca-nhan');

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-12 pt-3 sm:px-6 lg:max-w-[1200px] lg:px-8">
      <div className="relative w-fit">
        <PageTitle title="Cá nhân" />
        {isThongKe && <Accent kind="petals" className="left-full top-0 ml-2 w-14 md:block" />}
      </div>

      <nav
        aria-label="Phân khu cá nhân"
        role="tablist"
        className="flex w-full select-none gap-1 rounded-xl border border-border bg-secondary p-1 sm:w-80"
      >
        <Link
          href="/ca-nhan"
          role="tab"
          aria-selected={isTienDo}
          aria-controls="panel-tiendo"
          className={cn(
            TAB_BASE,
            isTienDo
              ? 'bg-card font-bold text-primary shadow-sm'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
          )}
        >
          Tiến độ
        </Link>
        <Link
          href="/ca-nhan/thong-ke"
          role="tab"
          aria-selected={isThongKe}
          aria-controls="panel-thongke"
          className={cn(
            TAB_BASE,
            isThongKe
              ? 'bg-card font-bold text-primary shadow-sm'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
          )}
        >
          Thống kê
        </Link>
      </nav>

      <div id={isThongKe ? 'panel-thongke' : 'panel-tiendo'} role="tabpanel">
        {children}
      </div>
    </main>
  );
}
