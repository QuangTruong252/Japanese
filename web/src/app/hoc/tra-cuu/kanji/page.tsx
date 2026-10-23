import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getAllKanji, getKanjiVocabIndex } from '@/lib/lookup';
import { KanjiGrid } from '@/components/lookup/KanjiGrid';
import { LookupHeader } from '@/components/lookup/LookupHeader';
import { FeatureIcon } from '@/components/FeatureIcon';
import { BackLink, ListRow } from '@/components/PaperKit';

export const metadata: Metadata = {
  title: 'Tra cứu Kanji N5 · MaiPace',
  description: '169 chữ Kanji N5 Minna no Nihongo kèm âm On, Kun, số nét và từ ghép.',
};

export default function KanjiLookupPage() {
  const allKanji = getAllKanji();
  const vocabIndex = getKanjiVocabIndex();

  // Tạo map char -> danh sách targetIds phục vụ kiểm tra "đã học" ở client
  const kanjiTargetIds: Record<string, string[]> = {};
  for (const k of allKanji) {
    const refs = vocabIndex.get(k.character) ?? [];
    kanjiTargetIds[k.character] = refs.map((r) => r.targetId);
  }

  const header = (
    <>
      <LookupHeader title="Kanji" meta="169 chữ N5" />
      <ListRow
        href="/luyen-viet?tab=kanji"
        icon={<FeatureIcon name="kanji" />}
        title="Luyện viết kanji"
        className="lg:hidden"
      />
    </>
  );

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-24 sm:px-6 md:pb-12 lg:max-w-[1200px] lg:px-8">
      <BackLink href="/hoc/tra-cuu" label="Tra cứu" />

      {/* Suspense vì KanjiGrid đọc useSearchParams */}
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl border border-border bg-card" />}>
        <KanjiGrid kanjiList={allKanji} kanjiTargetIds={kanjiTargetIds} header={header} />
      </Suspense>
    </main>
  );
}
