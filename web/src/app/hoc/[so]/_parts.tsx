'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { BookOpen, ChevronRight } from 'lucide-react';
import { db } from '@/lib/db';
import { useActiveDrafts } from '@/lib/active-drafts';
import { resolveLessonCtaText } from '@/lib/lesson-cta';
import { buttonVariants } from '@/components/ui/button';
import { PaperSlip } from '@/components/PaperStage';
import { LessonProgress } from '@/components/LessonProgress';
import { cn } from '@/lib/utils';

export function LessonHeroSlip({
  lessonNum,
  totalVocab,
}: {
  lessonNum: number;
  totalVocab: number;
}) {
  const drafts = useActiveDrafts();
  const vocabDraft = drafts.vocabDraft?.lesson === lessonNum ? drafts.vocabDraft : null;

  const prefix = `vocab-${String(lessonNum).padStart(2, '0')}-`;
  const learnedCount = useLiveQuery(
    () => db.reviewItems.where('targetId').startsWith(prefix).count(),
    [prefix],
    0,
  );

  const { ctaText } = resolveLessonCtaText({
    vocabDraft,
    learnedCount,
    totalVocab,
  });

  const href = vocabDraft?.resumeHref ?? `/hoc/${lessonNum}/tu-vung`;

  return (
    <PaperSlip className="space-y-3 shadow-xs">
      <LessonProgress lesson={lessonNum} total={totalVocab} />
      <Link
        href={href}
        className={cn(
          buttonVariants({ size: 'quiz' }),
          'w-full justify-between gap-3 px-4 sm:px-5 text-base font-semibold shadow-none sm:text-lg',
        )}
      >
        <BookOpen className="size-5 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left">{ctaText}</span>
        <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
      </Link>
    </PaperSlip>
  );
}
