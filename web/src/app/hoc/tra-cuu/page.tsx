import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Table2 } from 'lucide-react';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Tra cứu · MaiPace',
  description: 'Tra cứu bảng chữ cái Kana, Kanji, Động từ và các Bảng tham chiếu Minna no Nihongo N5.',
};

export default function TraCuuHubPage() {
  const categories = [
    {
      href: '/hoc/tra-cuu/kana',
      title: 'Bảng chữ Kana',
      subtitle: 'Hiragana & Katakana · 46 âm cơ bản, âm đục và âm ghép',
      icon: (
        <div className="flex items-center justify-center font-jp leading-none select-none text-xl font-bold">
          <span className="text-primary">あ</span>
          <span className="text-muted-foreground text-sm ml-0.5">ア</span>
        </div>
      ),
    },
    {
      href: '/hoc/tra-cuu/kanji',
      title: 'Kanji',
      subtitle: '169 chữ N5 · Âm On, Kun, số nét và từ ghép',
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
      subtitle: '156 động từ · 5 thể chia: ます, て, từ điển, ない, た',
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
      subtitle: '10 bảng tra cứu nhanh chuyên đề ngữ pháp và từ vựng',
      icon: <Table2 className="size-6 text-foreground/80" />,
    },
  ];

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 sm:px-6 pt-6 sm:pt-10 pb-24">
      {/* 1. Header Hub Tra cứu (SPEC-17 §3, B17.1: đích dock cấp một, không có breadcrumb về Học bài) */}
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Tra cứu
            </h1>
            <p className="text-sm text-muted-foreground">
              Tra cứu nhanh bảng chữ cái, chữ Hán, động từ và các bảng tham chiếu ngữ pháp.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="size-11 sm:size-12 rounded-xl" />
          </div>
        </div>
      </header>

      {/* 2. Trường tìm kiếm nổi bật ở đầu trang (SPEC-17 §3) */}
      <section aria-label="Tìm kiếm nhanh">
        <SearchTrigger
          variant="bar"
          placeholder="Tìm từ, chữ, ngữ pháp…"
          className="w-full"
        />
      </section>

      {/* 3. Bốn danh mục tra cứu chính */}
      <nav aria-label="Các mục tra cứu" className="space-y-3.5">
        {categories.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className={cn(
              'group flex items-center justify-between min-h-[76px] p-4 sm:p-5 rounded-2xl',
              'border border-border/80 bg-card shadow-xs transition duration-150',
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

            <ChevronRight className="size-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition" />
          </Link>
        ))}
      </nav>
    </main>
  );
}
