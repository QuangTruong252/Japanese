import { Suspense } from 'react';
import { PageTitle, SectionHeader } from '@/components/PaperKit';
import { PracticeMethods } from '@/components/practice/PracticeMethods';
import { ActiveDraftRows } from '@/components/practice/ActiveDraftRows';
import { LegacyPracticeRedirect } from '@/components/practice/LegacyPracticeRedirect';
import { Skeleton } from '@/components/ui/skeleton';

export default function PracticePage() {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-5xl px-4 pt-6"><Skeleton className="h-56 w-full rounded-xl" /></main>}>
    <LegacyPracticeRedirect>
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-12 pt-3 sm:px-6 lg:px-8">
      <PageTitle title="Luyện tập" />
      <ActiveDraftRows />
      <section aria-labelledby="practice-methods-heading">
        <SectionHeader id="practice-methods-heading" title="Cách luyện" />
        <PracticeMethods />
      </section>
    </main>
    </LegacyPracticeRedirect>
    </Suspense>
  );
}
