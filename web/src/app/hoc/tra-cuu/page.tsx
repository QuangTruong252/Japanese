import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Table2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Tra cứu · MaiPace',
  description: 'Tra cứu Kanji, Động từ và các Bảng tham chiếu Minna no Nihongo N5.',
};

export default function TraCuuHubPage() {
  const categories = [
    {
      href: '/hoc/tra-cuu/kanji',
      title: 'Kanji',
      subtitle: '169 chữ N5',
      icon: (
        <div className="flex flex-col items-center justify-center font-jp leading-none select-none">
          <span className="text-[10px] text-muted-foreground mb-0.5">ひと</span>
          <span className="text-2xl font-bold text-foreground">人</span>
        </div>
      ),
    },
    {
      href: '/hoc/tra-cuu/dong-tu',
      title: 'Động từ',
      subtitle: '156 động từ · 5 thể',
      icon: (
        <div className="flex flex-col items-center justify-center font-jp leading-none select-none">
          <span className="text-[10px] text-muted-foreground mb-0.5">い</span>
          <span className="text-xl font-bold text-foreground">行く</span>
        </div>
      ),
    },
    {
      href: '/hoc/tra-cuu/bang',
      title: 'Bảng tham chiếu',
      subtitle: '10 bảng',
      icon: <Table2 className="size-6 text-foreground/80" />,
    },
  ];

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 sm:px-6 pt-6 sm:pt-10 pb-24">
      {/* 1. Header & Điều hướng quay lại */}
      <header className="space-y-4">
        <Link
          href="/hoc"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            '-ml-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors'
          )}
        >
          <ChevronLeft className="size-4 mr-1" />
          <span>Học bài</span>
        </Link>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Tra cứu
            </h1>
            <p className="text-sm text-muted-foreground">
              Chọn nội dung bạn muốn xem lại.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="size-11 sm:size-12 rounded-xl" />
            <SearchTrigger iconOnly />
          </div>
        </div>
      </header>

      {/* 2. Danh sách các khu vực tra cứu */}
      <nav aria-label="Các mục tra cứu" className="space-y-3.5">
        {categories.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className={cn(
              'group flex items-center justify-between p-4 sm:p-5 rounded-2xl',
              'border border-border/80 bg-card shadow-xs transition-all duration-150',
              'hover:border-primary/40 hover:shadow-sm hover:translate-y-[-1px]',
              'active:translate-y-[1px]',
              'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring'
            )}
          >
            <div className="flex items-center gap-4">
              <div className="size-13 rounded-xl bg-muted/60 border border-border/40 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                {cat.icon}
              </div>
              <div className="space-y-0.5">
                <h2 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {cat.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {cat.subtitle}
                </p>
              </div>
            </div>

            <ChevronRight className="size-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </nav>
    </main>
  );
}
