'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';
import { useActiveDrafts } from '@/lib/active-drafts';
import { resolveLessonCtaText } from '@/lib/lesson-cta';
import { buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TornCard } from '@/components/PaperKit';
import { cn } from '@/lib/utils';

/** Thẻ hành động chính của bài: tiến độ từ vựng + nút học/tiếp tục. */
export function LessonHeroCard({
  lessonNum,
  totalVocab,
  className,
}: {
  lessonNum: number;
  totalVocab: number;
  className?: string;
}) {
  const drafts = useActiveDrafts();
  const vocabDraft = drafts.vocabDraft?.lesson === lessonNum ? drafts.vocabDraft : null;

  // Đọc bài không tạo reviewItems, nên 0 là đúng khi chưa học từ nào.
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
    <section aria-labelledby="lesson-vocab-card" className={className}>
      <TornCard>
        <p id="lesson-vocab-card" className="font-serif text-sm font-bold tracking-wide text-primary">
          / Từ vựng /
        </p>
        <Progress
          value={learnedCount}
          max={Math.max(totalVocab, 1)}
          getAriaValueText={() => `${learnedCount} trên ${totalVocab} từ đã vào lịch ôn`}
          className="mt-3 flex-col items-start gap-1.5"
        >
          <span className="order-last text-sm tabular-nums text-muted-foreground">
            {learnedCount === 0 ? 'Chưa bắt đầu' : `Đã vào lịch ôn ${learnedCount}/${totalVocab}`}
          </span>
        </Progress>
        <Link
          href={href}
          className={cn(
            buttonVariants({ size: 'quiz' }),
            'mt-5 h-auto min-h-12 w-full py-3 font-semibold',
          )}
        >
          <span className="whitespace-normal text-center">{ctaText}</span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </TornCard>
    </section>
  );
}
