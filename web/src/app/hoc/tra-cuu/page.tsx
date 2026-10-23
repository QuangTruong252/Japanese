import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { Accent, BentoGrid, ListRow, PageTitle, SectionHeader, Tile } from '@/components/PaperKit';
import { FeatureIcon, type FeatureIconName } from '@/components/FeatureIcon';
import { DocChip } from '@/components/lookup/ReferenceBook';
import { getAllKanji, getAllReferenceDocs, getAllVerbs, getKanjiByChar } from '@/lib/lookup';
import { getKanaGroups } from '@/data/kana';
import { stripFurigana } from '@/lib/japanese';
import { cn } from '@/lib/utils';

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

/** Ô kẻ chữ thập mờ giống ô luyện viết, chứa một chữ Mincho lớn. */
function RuledChar({ char, note, className }: { char: string; note?: string; className?: string }) {
  return (
    <span
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-xl border border-border bg-background',
        className,
      )}
    >
      <span aria-hidden="true" className="absolute inset-y-2 left-1/2 border-l border-dashed border-border" />
      <span aria-hidden="true" className="absolute inset-x-2 top-1/2 border-t border-dashed border-border" />
      <span lang="ja" className="jp-display relative select-none text-6xl font-semibold leading-none text-foreground">
        {char}
      </span>
      {note && <span className="absolute bottom-1 right-2 text-xs text-muted-foreground">{note}</span>}
    </span>
  );
}

export default function TraCuuHubPage() {
  const kanjiCount = getAllKanji().length;
  const verbs = getAllVerbs();
  const docs = getAllReferenceDocs();
  const kanaCount = getKanaGroups('hiragana')[0].rows.flatMap((row) => row.cells).filter(Boolean).length;

  // Mẫu chữ lấy từ dữ liệu thật: 人, 行きます → いって, hàng đầu bảng đại từ chỉ thị
  const sampleKanji = getKanjiByChar('人');
  const sampleVerb = verbs.find((v) => v.dictionary === 'いく');
  const demonstratives = docs.find((d) => d.slug === 'demonstratives')?.sections[0]?.tables[0]?.rows[0];
  const demoCells = (demonstratives ?? []).filter((c): c is string => typeof c === 'string');

  const samples: Record<string, { sample: ReactNode; count: string }> = {
    '/hoc/tra-cuu/kana': {
      sample: (
        <span className="flex gap-3">
          <RuledChar char="あ" className="size-28 lg:size-32" />
          <RuledChar char="ア" className="size-28 lg:size-32" />
        </span>
      ),
      count: `${kanaCount} âm cơ bản`,
    },
    '/hoc/tra-cuu/kanji': {
      sample: sampleKanji && (
        <RuledChar char={sampleKanji.character} note={`${sampleKanji.strokes} nét`} className="size-28 lg:size-32" />
      ),
      count: `${kanjiCount} chữ`,
    },
    '/hoc/tra-cuu/dong-tu': {
      sample: sampleVerb && (
        <span lang="ja" className="jp-display flex flex-wrap items-baseline gap-x-2 text-3xl font-semibold text-foreground">
          {stripFurigana(sampleVerb.verb)}
          <span aria-hidden="true" className="text-primary">
            →
          </span>
          {sampleVerb.te}
        </span>
      ),
      count: `${verbs.length} động từ · 5 thể`,
    },
    '/hoc/tra-cuu/bang': {
      sample: demoCells.length === 4 && (
        <span
          lang="ja"
          className="jp-display grid grid-cols-2 divide-x divide-y divide-border rounded-xl border border-border bg-background text-2xl font-semibold text-foreground [&>span]:px-5 [&>span]:py-3 [&>span]:text-center"
        >
          {demoCells.map((cell) => (
            <span key={cell}>{cell}</span>
          ))}
        </span>
      ),
      count: `${docs.length} bảng`,
    },
  };

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-24 sm:px-6 md:pb-12 lg:max-w-[1200px] lg:px-8">
      <div className="relative">
        <PageTitle title="Tra cứu" />
        <Accent kind="sprig-right" className="-top-3 left-36 w-28" />
      </div>

      <section aria-label="Tìm kiếm nội dung">
        <SearchTrigger variant="bar" placeholder="Tìm từ, chữ, ngữ pháp…" className="rounded-xl md:min-h-14" />
      </section>

      <nav aria-label="Các mục tra cứu" className="grid gap-2 md:hidden">
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

      <BentoGrid className="max-md:hidden">
        {CATEGORIES.map((cat) => {
          const { sample, count } = samples[cat.href];
          return (
            <Link
              key={cat.href}
              href={cat.href}
              className="block rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring lg:col-span-6"
            >
              <Tile interactive className="flex h-full flex-col gap-5 lg:min-h-64 lg:flex-row lg:items-center lg:gap-6">
                <div className="flex min-h-32 flex-1 items-center justify-center">{sample}</div>
                <div className="min-w-0 lg:w-44 lg:shrink-0">
                  <span
                    aria-hidden="true"
                    className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-6"
                  >
                    <FeatureIcon name={cat.icon} />
                  </span>
                  <h2 className="mt-3 font-serif text-xl font-semibold text-foreground">{cat.title}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{cat.description}</p>
                  <p className="mt-2 flex items-center justify-between text-sm tabular-nums text-muted-foreground">
                    {count}
                    <ChevronRight className="size-5" aria-hidden="true" />
                  </p>
                </div>
              </Tile>
            </Link>
          );
        })}
      </BentoGrid>

      <section aria-labelledby="lookup-tables" className="max-md:hidden">
        <SectionHeader id="lookup-tables" title="Bảng tham chiếu" href="/hoc/tra-cuu/bang" />
        <div className="flex flex-wrap gap-2">
          {docs.map((doc) => (
            <DocChip key={doc.slug} href={`/hoc/tra-cuu/bang/${doc.slug}`}>
              {doc.title.vi}
            </DocChip>
          ))}
        </div>
      </section>
    </main>
  );
}
