import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getAllKanji, getKanjiVocabIndex } from '@/lib/lookup';
import { KanjiGrid } from '@/components/lookup/KanjiGrid';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    <main className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 pt-6 sm:pt-10 pb-24">
      {/* 1. Header & Điều hướng quay lại */}
      <header className="space-y-4">
        <Link
          href="/hoc/tra-cuu"
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'min-h-11 px-3 -ml-3 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors'
          )}
        >
          <ChevronLeft className="size-4 mr-1" />
          <span>Trở về</span>
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Kanji
          </h1>
          <p className="text-sm text-muted-foreground">
            169 chữ N5
          </p>
        </div>
      </header>

      {/* 2. Lưới và Bộ lọc bọc trong Suspense cho useSearchParams */}
      <Suspense fallback={<div className="h-64 rounded-2xl border border-border/60 bg-card/40 animate-pulse" />}>
        <KanjiGrid kanjiList={allKanji} kanjiTargetIds={kanjiTargetIds} />
      </Suspense>
    </main>
  );
}
