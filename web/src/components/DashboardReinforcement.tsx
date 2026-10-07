'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight } from 'lucide-react';
import { db } from '@/lib/db';
import { buildTargetLabels } from '@/lib/review-queue';
import { useQuestionPool } from '@/lib/use-question-pool';
import { Furigana } from '@/components/Furigana';
import { TARGET_TYPE_LABEL } from '@/components/review/TargetTypeBadge';
import { cn } from '@/lib/utils';

export interface DashboardReinforcementProps {
  limit?: number;
  className?: string;
}

/**
 * Hiển thị các mục có số lần trả lời sai nhiều nhất từ lịch sử (SPEC-05 §2, SPEC-20).
 * Dùng chung nguồn nhãn với màn Điểm yếu (/on-tap/diem-yeu).
 */
export function DashboardReinforcement({
  limit = 3,
  className,
}: DashboardReinforcementProps) {
  const rows = useLiveQuery(
    async () => {
      const items = await db.reviewItems.filter((item) => item.incorrectCount > 0).toArray();
      return items
        .sort((a, b) => b.incorrectCount - a.incorrectCount || (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
        .slice(0, limit);
    },
    [limit],
  );

  const lessons = useMemo(
    () => [...new Set((rows ?? []).map((row) => row.lesson))].filter((n) => n > 0),
    [rows],
  );
  const { questions } = useQuestionPool(lessons);
  const labels = useMemo(() => buildTargetLabels(questions), [questions]);

  if (!rows || rows.length === 0) {
    return null;
  }

  return (
    <div className={cn('divide-y divide-border', className)}>
      {rows.map((row) => {
        const label = labels.get(row.targetId);
        return (
          <Link
            key={row.targetId}
            href="/on-tap/diem-yeu"
            className="flex min-h-14 items-center justify-between gap-3 py-3 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring"
          >
            <div className="min-w-0 flex-1">
              <div className="jp jp-vocab text-lg font-medium text-foreground">
                {label ? (
                  <Furigana text={label.jp} />
                ) : (
                  <span className="font-medium text-foreground">
                    {TARGET_TYPE_LABEL[row.targetType]} · Bài {row.lesson}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-baseline gap-2 text-muted-foreground">
                {label?.vi && (
                  <span className="min-w-0 truncate text-sm">{label.vi}</span>
                )}
                <span className="shrink-0 text-xs">
                  {label?.vi ? '· ' : ''}sai {row.incorrectCount} lần
                </span>
              </div>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        );
      })}
    </div>
  );
}

