import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { n5Progress } from '@/lib/n5-progress';

/**
 * Dải tiến độ N5: mỗi bài một ô bo tròn đánh số, tô `primary` từ dưới lên theo tỉ lệ từ đã vào lịch ôn.
 * "Bài xong" = mọi từ của bài đã vào lịch ôn, hoặc bài ≤ `learnedThroughLesson` (người học khai báo).
 * Bài xong tô đầy kèm dấu check; `activeLesson` có viền đỏ. Mỗi ô là link `/hoc/N`.
 * Chỉ hiện từ `md` (mobile chưa có dải này); lưới xuống hàng để mỗi ô đủ vùng chạm 44 px.
 */
export function N5Progress({
  learnedByLesson,
  vocabCountByLesson,
  activeLesson,
  learnedThroughLesson = 0,
  className,
}: {
  learnedByLesson: Map<number, number>;
  vocabCountByLesson: Map<number, number>;
  activeLesson?: number;
  learnedThroughLesson?: number;
  className?: string;
}) {
  const lessons = n5Progress(learnedByLesson, vocabCountByLesson, learnedThroughLesson);
  const doneCount = lessons.filter((l) => l.done).length;
  return (
    <section aria-label="Tiến độ N5" className={cn('hidden md:block', className)}>
      <p className="mb-2 flex items-baseline justify-between text-sm">
        <span className="font-serif font-semibold text-foreground">Tiến độ N5</span>
        <span className="tabular-nums text-muted-foreground">
          {doneCount}/{lessons.length} bài xong
        </span>
      </p>
      <ol className="grid md:grid-cols-[repeat(auto-fit,minmax(44px,1fr))] md:gap-1">
        {lessons.map((l) => (
          <li key={l.number}>
            <Link
              href={`/hoc/${l.number}`}
              aria-label={`Bài ${l.number}, ${l.learned}/${l.total} từ`}
              title={`Bài ${l.number} · ${l.learned}/${l.total} từ`}
              aria-current={l.number === activeLesson ? 'step' : undefined}
              className={cn(
                'relative flex md:min-h-11 md:min-w-11 items-center justify-center overflow-hidden rounded-md border bg-card text-[11px] font-medium tabular-nums text-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
                l.number === activeLesson ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-foreground/30',
              )}
            >
              <span
                aria-hidden="true"
                className={cn('absolute inset-x-0 bottom-0', l.done ? 'bg-primary' : 'bg-primary/35')}
                style={{ height: `${Math.round(l.ratio * 100)}%` }}
              />
              {l.done ? (
                <Check className="relative size-3 stroke-[3] text-primary-foreground" aria-hidden="true" />
              ) : (
                <span className="relative" aria-hidden="true">
                  {l.number}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
