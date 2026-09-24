'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Dexie from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { Furigana } from '@/components/Furigana';
import { TARGET_TYPE_LABEL, TargetTypeBadge } from '@/components/review/TargetTypeBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/db';
import { buildTargetLabels } from '@/lib/review-queue';
import { useQuestionPool } from '@/lib/use-question-pool';
import { cn } from '@/lib/utils';
import type { TargetType } from '@/types';

const TARGET_TYPES: TargetType[] = ['vocab', 'grammar', 'kanji', 'particle', 'listening'];
const FILTERS: (TargetType | 'all')[] = ['all', ...TARGET_TYPES];

const dateText = (value?: string | Date | null): string =>
  value ? new Date(value).toLocaleDateString('vi-VN') : '—';

export default function WeakPointsPage() {
  const [filter, setFilter] = useState<TargetType | 'all'>('all');

  const items = useLiveQuery(async () => {
    const types = filter === 'all' ? TARGET_TYPES : [filter];
    // Index tổ hợp [targetType+incorrectCount] có sẵn trong schema: chặn "từ 1 lần sai trở
    // lên" ngay ở tầng index thay vì duyệt cả bảng rồi lọc trong JS (SPEC-05 §2).
    const lists = await Promise.all(
      types.map((type) =>
        db.reviewItems
          .where('[targetType+incorrectCount]')
          .between([type, 1], [type, Dexie.maxKey])
          .toArray(),
      ),
    );
    return lists.flat().sort((a, b) => b.incorrectCount - a.incorrectCount);
  }, [filter]);

  const rows = useMemo(() => items ?? [], [items]);

  const lessons = useMemo(
    () => [...new Set(rows.map((row) => row.lesson))].filter((n) => n > 0).sort((a, b) => a - b),
    [rows],
  );
  const { questions } = useQuestionPool(lessons);
  const labels = useMemo(() => buildTargetLabels(questions), [questions]);

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
      <div className="space-y-4">
        <h1 className="font-heading text-xl font-medium">Ôn tập</h1>
        <div className="flex items-center gap-6 border-b border-border/80 text-sm">
          <Link
            href="/on-tap"
            className="text-muted-foreground hover:text-foreground pb-2.5 -mb-px transition-colors"
          >
            Hôm nay
          </Link>
          <Link
            href="/on-tap/diem-yeu"
            className="font-semibold text-primary border-b-2 border-primary pb-2.5 -mb-px transition-colors"
          >
            Điểm yếu của tôi
          </Link>
        </div>
      </div>

      <div role="group" aria-label="Lọc theo loại mục tiêu" className="flex flex-wrap gap-2">
        {FILTERS.map((value) => {
          const selected = filter === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => setFilter(value)}
              className={cn(
                'flex min-h-12 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-150 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px',
                selected
                  ? 'border-2 border-primary bg-accent text-foreground'
                  : 'border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {value === 'all' ? 'Tất cả' : TARGET_TYPE_LABEL[value]}
            </button>
          );
        })}
      </div>

      {items === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Chưa có điểm yếu nào được ghi nhận — mọi mục bạn đã làm đều đúng.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Bảng điểm yếu, xếp theo số lần sai giảm dần</caption>
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Nội dung
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Loại
                </th>
                <th scope="col" className="py-2 pr-3 font-medium whitespace-nowrap">
                  Sai / Tổng
                </th>
                <th scope="col" className="py-2 pr-3 font-medium whitespace-nowrap">
                  Sai gần nhất
                </th>
                <th scope="col" className="py-2 font-medium whitespace-nowrap">
                  Hạn ôn kế
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const label = labels.get(item.targetId);
                const total = item.correctCount + item.incorrectCount;
                return (
                  <tr key={item.targetId} className="border-b border-border/60 align-top">
                    <td className="py-3 pr-3">
                      <div className="jp jp-vocab font-medium">
                        {label ? (
                          <Furigana text={label.jp} />
                        ) : (
                          <span className="text-muted-foreground">{item.targetId}</span>
                        )}
                      </div>
                      {label?.vi && <p className="text-xs text-muted-foreground">{label.vi}</p>}
                    </td>
                    <td className="py-3 pr-3">
                      <TargetTypeBadge type={item.targetType} />
                    </td>
                    <td className="py-3 pr-3 tabular-nums whitespace-nowrap">
                      {item.incorrectCount}/{total}
                    </td>
                    <td className="py-3 pr-3 whitespace-nowrap text-muted-foreground">
                      {dateText(item.lastFailedAt)}
                    </td>
                    <td className="py-3 whitespace-nowrap text-muted-foreground">
                      {dateText(item.dueAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
