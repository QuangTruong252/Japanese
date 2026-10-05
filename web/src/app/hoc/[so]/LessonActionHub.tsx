'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useActiveDrafts } from '@/lib/active-drafts';
import { buttonVariants } from '@/components/ui/button';
import {
  BookOpen,
  ChevronRight,
  Headphones,
  ScrollText,
  PencilLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Furigana } from '@/components/Furigana';
import { ProgressBar } from '@/components/LessonProgress';

import { resolveLessonCtaText } from '@/lib/lesson-cta';

interface LessonActionHubProps {
  lessonNum: number;
  totalVocab: number;
  grammarCount: number;
  introWord?: string;
  introMeaning?: string;
}

export function LessonActionHub({
  lessonNum,
  totalVocab,
  grammarCount,
  introWord,
  introMeaning,
}: LessonActionHubProps) {
  const drafts = useActiveDrafts();
  const vocabDraft = drafts.vocabDraft?.lesson === lessonNum ? drafts.vocabDraft : null;

  const prefix = `vocab-${String(lessonNum).padStart(2, '0')}-`;
  const learnedCount = useLiveQuery(
    () => db.reviewItems.where('targetId').startsWith(prefix).count(),
    [prefix],
    0,
  );

  // Xác định nhãn và trạng thái cho CTA chính (SPEC-18 §3: Học từ vựng là CTA số 1)
  const { ctaText, isResuming } = resolveLessonCtaText({
    vocabDraft,
    learnedCount,
    totalVocab,
  });

  return (
    <div className="flex flex-col gap-3 pt-1">
      {/* 1. CTA Chính (Primary Button duy nhất ở header bài) */}
      <div>
        <Link
          href={`/hoc/${lessonNum}/tu-vung`}
          className={cn(
            buttonVariants({ size: 'quiz' }),
            'h-auto min-h-16 w-full justify-between gap-3 px-5 py-4 text-lg font-semibold'
          )}
        >
          <BookOpen aria-hidden="true" />
          <span className="min-w-0 flex-1 whitespace-normal text-left">{ctaText}</span>
          <ChevronRight aria-hidden="true" />
        </Link>
        {introWord && introMeaning && !isResuming && (
          <div className="flex items-center justify-center gap-5 rounded-xl bg-accent/50 px-5 py-3">
            <Furigana text={introWord} className="text-2xl font-semibold" />
            <span className="border-l border-border pl-5 text-sm">{introMeaning}</span>
          </div>
        )}
      </div>
      <ProgressBar learned={learnedCount} total={totalVocab} />

      {/* 2. Lối vào nhanh: Ngữ pháp, Nghe, Xem toàn bộ bài & Luyện tập Bài N (SPEC-18 §3) */}
      <div className="flex flex-col divide-y divide-border text-base">
        <a
          href="#ngu-phap"
          className={cn(
            'flex min-h-14 items-center gap-3 rounded-lg px-3 font-semibold outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring'
          )}
        >
          <BookOpen className="size-6" aria-hidden="true" />
          <span className="flex-1">Ngữ pháp</span>
          <span className="text-sm font-normal text-muted-foreground">{grammarCount} mẫu</span>
          <ChevronRight className="size-5" aria-hidden="true" />
        </a>

        <a
          href="#nghe"
          className={cn(
            'flex min-h-14 items-center gap-3 rounded-lg px-3 font-semibold outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring'
          )}
        >
          <Headphones className="size-6" aria-hidden="true" />
          <span className="flex-1">Nghe</span>
          <ChevronRight className="size-5" aria-hidden="true" />
        </a>

        <a
          href="#tu-vung"
          className={cn(
            'flex min-h-14 items-center gap-3 rounded-lg px-3 font-semibold outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring'
          )}
        >
          <ScrollText className="size-6" aria-hidden="true" />
          <span className="flex-1">Xem toàn bộ bài</span>
          <ChevronRight className="size-5" aria-hidden="true" />
        </a>
      </div>
        <Link
          href={`/luyen-tap?lessons=${lessonNum}`}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'quiz' }),
            'w-full gap-3 border-primary text-primary'
          )}
        >
          <PencilLine aria-hidden="true" />
          <span>Luyện tập bài {lessonNum}</span>
          <ChevronRight aria-hidden="true" />
        </Link>
    </div>
  );
}
