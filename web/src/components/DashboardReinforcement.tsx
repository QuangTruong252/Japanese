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

/** Hai mục thật từ lịch sử; dùng cùng nguồn nhãn với màn Điểm yếu. */
export function DashboardReinforcement() {
  const rows = useLiveQuery(() => db.reviewItems.filter(item => item.incorrectCount > 0).limit(2).toArray(), []);
  const lessons = useMemo(() => [...new Set((rows ?? []).map(row => row.lesson))].filter(n => n > 0), [rows]);
  const { questions } = useQuestionPool(lessons);
  const labels = useMemo(() => buildTargetLabels(questions), [questions]);

  return (
    <div className="divide-y divide-border rounded-xl bg-background px-4">
      {(rows ?? []).map(row => {
        const label = labels.get(row.targetId);
        return (
          <Link key={row.targetId} href="/on-tap/diem-yeu" className="flex min-h-20 items-center gap-3 rounded-lg py-3 outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring">
            <div className="min-w-0 flex-1">
              {label ? <Furigana text={label.jp} className="line-clamp-2 text-xl font-semibold" /> : <p className="font-semibold">{TARGET_TYPE_LABEL[row.targetType]} · Bài {row.lesson}</p>}
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{label?.vi || `Đã trả lời sai ${row.incorrectCount} lần`}</p>
            </div>
            <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
          </Link>
        );
      })}
    </div>
  );
}
