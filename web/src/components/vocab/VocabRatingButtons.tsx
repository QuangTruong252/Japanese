'use client';

import { Rating, type Grade } from '@/lib/fsrs';
import { Button } from '@/components/ui/button';
import { RATING_OPTIONS } from './vocab-shared';

export function VocabRatingButtons({
  intervals,
  saving,
  onRate,
}: {
  intervals: Map<Grade, string>;
  saving: boolean;
  onRate: (grade: Grade) => void;
}) {
  return (
    <section className="mx-auto w-full max-w-xl" aria-label="Mức độ ghi nhớ">
      <div className="grid grid-cols-2 gap-2">
        {RATING_OPTIONS.map(({ grade, label, icon: Icon }) => {
          const interval = intervals.get(grade) ?? '';
          return (
            <Button
              key={grade}
              type="button"
              variant={grade === Rating.Good ? 'default' : 'outline'}
              aria-label={`${label}, ôn lại ${interval}`}
              title={`Ôn lại ${interval}`}
              disabled={saving}
              onClick={() => onRate(grade)}
              className="h-auto min-h-14 min-w-0 justify-start gap-3 rounded-xl px-3 py-2 text-left"
            >
              <Icon aria-hidden="true" className="size-7 shrink-0" />
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold">{label}</span>
                <span className="text-xs font-normal opacity-80">{interval}</span>
              </span>
            </Button>
          );
        })}
      </div>
      {saving && (
        <p role="status" className="mt-1 text-center text-sm text-muted-foreground">Đang lưu kết quả…</p>
      )}
    </section>
  );
}

export function VocabRatingHelp() {
  return (
    <details className="w-full max-w-xl text-center text-sm">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-muted-foreground underline underline-offset-4">
          Nên chọn mức nào?
        </summary>
        <div className="space-y-2 pb-2 text-left">
          <dl className="space-y-1.5">
            {RATING_OPTIONS.map(({ grade, label, hint }) => (
              <div key={grade} className="flex gap-2">
                <dt className="w-20 shrink-0 font-medium">{label}</dt>
                <dd className="text-muted-foreground">{hint}</dd>
              </div>
            ))}
          </dl>
          <p className="text-muted-foreground">Vuốt thẻ sang phải: Nhớ được · sang trái: Quên mất.</p>
        </div>
      </details>
  );
}
