import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getAllVerbs } from '@/lib/lookup';
import { VerbTable } from '@/components/lookup/VerbTable';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Bảng Động từ N5 · Tra cứu · MaiPace',
  description: 'Bảng 156 động từ N5 Minna no Nihongo với 5 thể: ます, て, từ điển, ない, た.',
};

export default function VerbsLookupPage() {
  const verbs = getAllVerbs();

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
          <span>Tra cứu</span>
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Động từ
          </h1>
          <p className="text-sm text-muted-foreground">
            156 động từ · 5 thể
          </p>
        </div>
      </header>

      {/* 2. Bảng Động từ bọc trong Suspense cho useSearchParams */}
      <Suspense fallback={<div className="h-96 rounded-2xl border border-border/60 bg-card/40 animate-pulse" />}>
        <VerbTable verbs={verbs} />
      </Suspense>
    </main>
  );
}
