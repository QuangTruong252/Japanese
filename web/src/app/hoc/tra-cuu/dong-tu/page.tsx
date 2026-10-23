import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getAllVerbs } from '@/lib/lookup';
import { VerbTable } from '@/components/lookup/VerbTable';
import { LookupHeader } from '@/components/lookup/LookupHeader';
import { BackLink } from '@/components/PaperKit';

export const metadata: Metadata = {
  title: 'Bảng Động từ N5 · Tra cứu · MaiPace',
  description: 'Bảng 156 động từ N5 Minna no Nihongo với 5 thể: ます, て, từ điển, ない, た.',
};

export default function VerbsLookupPage() {
  const verbs = getAllVerbs();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-24 sm:px-6 md:pb-12 lg:max-w-[1200px] lg:px-8">
      <BackLink href="/hoc/tra-cuu" label="Tra cứu" />

      {/* Suspense vì VerbTable đọc useSearchParams */}
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl border border-border bg-card" />}>
        <VerbTable verbs={verbs} header={<LookupHeader title="Động từ" meta="156 động từ · 5 thể" />} />
      </Suspense>
    </main>
  );
}
