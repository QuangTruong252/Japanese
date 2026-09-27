'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useActiveDrafts } from '@/lib/active-drafts';
import { buttonVariants } from '@/components/ui/button';
import {
  BookOpen,
  ArrowRight,
  Headphones,
  ScrollText,
  Dumbbell,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { resolveLessonCtaText } from '@/lib/lesson-cta';

interface LessonActionHubProps {
  lessonNum: number;
  totalVocab: number;
  grammarCount: number;
}

export function LessonActionHub({
  lessonNum,
  totalVocab,
  grammarCount,
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
    <div className="space-y-3.5 pt-1">
      {/* 1. CTA Chính (Primary Button duy nhất ở header bài) */}
      <div>
        <Link
          href={`/hoc/${lessonNum}/tu-vung`}
          className={cn(
            buttonVariants({ size: 'quiz' }),
            'w-full sm:w-auto font-semibold text-base shadow-sm justify-center gap-2'
          )}
        >
          {vocabDraft ? (
            <Sparkles className="size-5 text-primary-foreground" aria-hidden="true" />
          ) : (
            <BookOpen className="size-5 text-primary-foreground" aria-hidden="true" />
          )}
          <span>{ctaText}</span>
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      </div>

      {/* 2. Lối vào nhanh: Ngữ pháp, Nghe, Xem toàn bộ bài & Luyện tập Bài N (SPEC-18 §3) */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs sm:text-sm">
        <a
          href="#tu-vung"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'min-h-11 h-11 px-3.5 rounded-xl font-medium gap-1.5 border-border/80 text-foreground hover:text-primary hover:border-primary/40'
          )}
        >
          <ScrollText className="size-4 text-primary" aria-hidden="true" />
          <span>Xem toàn bộ bài</span>
        </a>

        <a
          href="#ngu-phap"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'min-h-11 h-11 px-3.5 rounded-xl font-medium gap-1.5 border-border/80 text-foreground hover:text-primary hover:border-primary/40'
          )}
        >
          <BookOpen className="size-4 text-primary" aria-hidden="true" />
          <span>Ngữ pháp ({grammarCount})</span>
        </a>

        <a
          href="#nghe"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'min-h-11 h-11 px-3.5 rounded-xl font-medium gap-1.5 border-border/80 text-foreground hover:text-primary hover:border-primary/40'
          )}
        >
          <Headphones className="size-4 text-primary" aria-hidden="true" />
          <span>Luyện nghe</span>
        </a>

        <Link
          href={`/luyen-tap?lessons=${lessonNum}`}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'min-h-11 h-11 px-3.5 rounded-xl font-medium gap-1.5 border-border/80 text-foreground hover:text-primary hover:border-primary/40 ml-auto'
          )}
        >
          <Dumbbell className="size-4 text-primary" aria-hidden="true" />
          <span>Luyện tập bài {lessonNum}</span>
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
