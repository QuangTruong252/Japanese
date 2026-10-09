import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getAllKanji, getKanjiVocabIndex } from '@/lib/lookup';
import { KanjiGrid } from '@/components/lookup/KanjiGrid';
import { PageTitle } from '@/components/PaperKit';

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

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-24 sm:px-6 lg:px-8 lg:pb-12">
      <PageTitle title="Kanji" meta="169 chữ N5" back={{ href: '/hoc/tra-cuu', label: 'Tra cứu' }} />

      {/* Suspense vì KanjiGrid đọc useSearchParams */}
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl border border-border bg-card" />}>
        <KanjiGrid kanjiList={allKanji} kanjiTargetIds={kanjiTargetIds} />
      </Suspense>
    </main>
  );
}
