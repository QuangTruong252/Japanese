'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Progress } from '@/components/ui/progress';

/** Thanh tiến độ thuần — lưới /hoc đã có sẵn số, không query lại (SPEC-03 §4). */
export function ProgressBar({ learned, total }: { learned: number; total: number }) {
  return (
    <Progress
      value={learned}
      max={Math.max(total, 1)}
      getAriaValueText={() => `${learned} trên ${total} từ đã vào lịch ôn`}
      className="flex-col items-start gap-1.5"
    >
      <span className="text-xs text-muted-foreground tabular-nums">
        {learned === 0 ? 'Chưa học' : `Đã học ${learned}/${total}`}
      </span>
    </Progress>
  );
}

/** Tiến độ một bài cho trang chi tiết. Đọc bài không tạo reviewItems — 0 là đúng. */
export function LessonProgress({ lesson, total }: { lesson: number; total: number }) {
  const prefix = `vocab-${String(lesson).padStart(2, '0')}-`;
  const learned = useLiveQuery(
    () => db.reviewItems.where('targetId').startsWith(prefix).count(),
    [prefix],
    0
  );
  return <ProgressBar learned={learned} total={total} />;
}
