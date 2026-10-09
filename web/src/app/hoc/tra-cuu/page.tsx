import type { Metadata } from 'next';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { ListRow, PageTitle } from '@/components/PaperKit';
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
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-24 sm:px-6 lg:px-8 lg:pb-12">
      <PageTitle title="Tra cứu" />

      <section aria-label="Tìm kiếm nội dung">
        <SearchTrigger variant="bar" placeholder="Tìm từ, chữ, ngữ pháp…" className="rounded-xl" />
      </section>

      <nav aria-label="Các mục tra cứu" className="grid gap-2 md:grid-cols-2">
        {CATEGORIES.map((cat) => (
          <ListRow
            key={cat.href}
            href={cat.href}
            icon={<FeatureIcon name={cat.icon} />}
            title={cat.title}
            detail={cat.description}
          />
        ))}
      </nav>
    </main>
  );
}
