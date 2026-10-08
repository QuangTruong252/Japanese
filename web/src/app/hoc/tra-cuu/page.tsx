import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { cn } from '@/lib/utils';
import { FeatureIcon, type FeatureIconName } from '@/components/FeatureIcon';

export const metadata: Metadata = {
  title: 'Tra cứu · MaiPace',
  description: 'Tra cứu bảng chữ cái Kana, Kanji, Động từ và các Bảng tham chiếu Minna no Nihongo N5.',
};

interface LookupCategory {
  icon: FeatureIconName;
  title: string;
  description: string;
  href: string;
}

const CATEGORIES: LookupCategory[] = [
  {
    icon: 'kana',
    title: 'Kana',
    description: 'Bảng chữ và cách viết',
    href: '/hoc/tra-cuu/kana',
  },
  {
    icon: 'kanji',
    title: 'Kanji',
    description: 'Chữ Hán N5',
    href: '/hoc/tra-cuu/kanji',
  },
  {
    icon: 'verbs',
    title: 'Động từ',
    description: 'Chia theo nhóm',
    href: '/hoc/tra-cuu/dong-tu',
  },
  {
    icon: 'lookup',
    title: 'Bảng tham chiếu',
    description: 'Số đếm, thời gian, trợ từ',
    href: '/hoc/tra-cuu/bang',
  },
];

export default function TraCuuHubPage() {
  return (
    <main className="mx-auto w-full max-w-2xl xl:max-w-5xl space-y-6 px-4 sm:px-6 pt-6 sm:pt-10 pb-24 lg:pb-12">
      {/* 1. Header Hub Tra cứu (h1 "Tra cứu") */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Tra cứu
        </h1>
        <p className="text-sm text-muted-foreground">
          Tra cứu bảng chữ cái, chữ Hán, động từ và các bảng tham chiếu.
        </p>
      </header>

      {/* 2. Trường tìm kiếm nổi bật ở đầu trang (48px, search icon, mở search dialog) */}
      <section aria-label="Tìm kiếm nội dung">
        <SearchTrigger
          variant="bar"
          placeholder="Tìm từ, chữ, ngữ pháp…"
          className="rounded-xl"
        />
      </section>

      {/* 3. Bốn danh mục tra cứu chính: 2×2 trên mobile/tablet, 1 hàng tại 1280px */}
      <nav aria-label="Các mục tra cứu" className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className={cn(
              'group flex flex-col justify-between rounded-xl border border-border bg-card p-4 sm:p-5 min-h-[136px]',
              'transition-colors duration-150 hover:bg-muted/60 hover:border-border/80',
              'active:translate-y-px outline-none focus-visible:ring-3 focus-visible:ring-ring'
            )}
          >
            <FeatureIcon name={cat.icon} className="size-10 text-primary" />
            <div className="mt-3 space-y-0.5">
              <h2 className="text-base font-medium text-foreground group-hover:text-primary transition-colors">
                {cat.title}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                {cat.description}
              </p>
            </div>
          </Link>
        ))}
      </nav>
    </main>
  );
}

