import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { Illustration } from '@/components/Illustration';
import { GrammarMeaning } from '@/components/grammar/GrammarMeaning';
import { patternMarks } from '@/lib/grammar';
import { SECTION_THUMB } from '@/lib/illustrations';
import { cn } from '@/lib/utils';
import type { GrammarPoint } from '@/types';

/** Mục lục ngữ pháp của một bài: mỗi điểm một dòng link tới trang riêng; điểm đang xem nền sakura. */
export function GrammarIndex({
  lessonNum,
  points,
  currentId,
  className,
}: {
  lessonNum: number;
  points: GrammarPoint[];
  currentId?: string;
  className?: string;
}) {
  return (
    <ul className={cn('space-y-2', className)}>
      {points.map((point) => {
        const current = point.id === currentId;
        return (
          <li key={point.id}>
            <Link
              href={`/hoc/${lessonNum}/ngu-phap/${point.id}`}
              aria-current={current ? 'page' : undefined}
              className={cn(
                'flex min-h-16 items-start gap-3 rounded-xl border p-3 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
                current ? 'border-primary/40 bg-accent' : 'border-border bg-card hover:bg-muted/60',
              )}
            >
              <Illustration
                asset={point.illustration ?? SECTION_THUMB.grammar}
                sizes="48px"
                className="size-12 shrink-0 rounded-lg bg-secondary object-cover"
              />
              <span className="min-w-0 flex-1">
                <Furigana
                  text={point.pattern.vi}
                  marks={patternMarks(point.pattern.vi, point.slots)}
                  markStyle="index"
                  className="text-base font-medium text-foreground"
                />
                <span className="block text-sm text-muted-foreground">
                  <GrammarMeaning title={point.title.vi} />
                </span>
              </span>
              <ChevronRight className="mt-3.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
