'use client';

import { Undo2 } from 'lucide-react';
import { FeatureIcon } from '@/components/FeatureIcon';
import { Illustration } from '@/components/Illustration';
import { ListRow } from '@/components/PaperKit';
import { Button } from '@/components/ui/button';
import { REVIEW_COMPLETE_ART } from '@/lib/illustrations';
import type { RatingCounts } from '@/lib/vocab-draft';
import { RATING_OPTIONS, ratingKey } from './vocab-shared';

export function VocabComplete({
  wordCount,
  counts,
  lessonNumber,
  canUndo,
  saving,
  undoError,
  onUndo,
  onMore,
}: {
  wordCount: number;
  counts: RatingCounts;
  lessonNumber: number;
  canUndo: boolean;
  saving: boolean;
  undoError: string | null;
  onUndo: () => void;
  onMore: () => void;
}) {
  return (
    <section className="flex flex-1 flex-col justify-center gap-6 py-8">
      <div className="space-y-3 text-center">
        <Illustration asset={REVIEW_COMPLETE_ART} sizes="112px" className="mx-auto size-28 object-contain" />
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Đã học xong {wordCount} từ</h1>
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {RATING_OPTIONS.map(({ grade, label }) => (
          <div key={grade} className="rounded-xl border border-border bg-card px-3 py-3 text-center">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{counts[ratingKey(grade)]}</dd>
          </div>
        ))}
      </dl>
      <div className="space-y-2">
        {canUndo && (
          <Button
            type="button"
            variant="ghost"
            size="quiz"
            className="w-full text-muted-foreground"
            disabled={saving}
            onClick={onUndo}
          >
            <Undo2 aria-hidden="true" />
            Hoàn tác thẻ cuối
          </Button>
        )}
        {undoError && <p role="alert" className="text-center text-sm text-destructive">{undoError}</p>}
        <Button type="button" size="quiz" className="w-full" onClick={onMore}>
          Học thêm từ trong bài
        </Button>
        <ListRow
          href={`/hoc/${lessonNumber}`}
          icon={<FeatureIcon name="lesson" />}
          title={`Về nội dung bài ${lessonNumber}`}
        />
      </div>
    </section>
  );
}
