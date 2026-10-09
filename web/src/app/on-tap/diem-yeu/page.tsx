'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Dexie from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { Furigana } from '@/components/Furigana';
import { Chip, PageTitle } from '@/components/PaperKit';
import { TARGET_TYPE_LABEL, TargetTypeBadge } from '@/components/review/TargetTypeBadge';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/db';
import { loadLessonData } from '@/lib/lessons';
import { buildTargetLabels, lessonFromTargetId } from '@/lib/review-queue';
import { useQuestionPool } from '@/lib/use-question-pool';
import { cn } from '@/lib/utils';
import type { TargetType } from '@/types';

const TARGET_TYPES: TargetType[] = ['vocab', 'grammar', 'kanji', 'particle', 'listening'];
const FILTERS: (TargetType | 'all')[] = ['all', ...TARGET_TYPES];

const dateText = (value?: string | Date | null): string =>
  value ? new Date(value).toLocaleDateString('vi-VN') : '—';

const TARGET_TYPE_PRACTICE_MAP: Partial<Record<TargetType, string>> = {
  particle: 'cloze',
  listening: 'listening',
};

function getAnchor(targetId: string, map: Map<string, string>): string {
  if (map.has(targetId)) return map.get(targetId)!;
  const directVocab = /^vocab-([a-zA-Z_-]+)$/.exec(targetId);
  if (directVocab) return `#vocab-${directVocab[1]}`;
  const directGrammar = /^grammar-([a-zA-Z_-]+)$/.exec(targetId);
  if (directGrammar) return `#grammar-${directGrammar[1]}`;
  return '';
}

export default function WeakPointsPage() {
  const [filter, setFilter] = useState<TargetType | 'all'>('all');

  const items = useLiveQuery(async () => {
    const types = filter === 'all' ? TARGET_TYPES : [filter];
    // Index tổ hợp [targetType+incorrectCount] có sẵn trong schema: chặn "từ 1 lần sai trở
    // lên" ngay ở tầng index thay vì duyệt cả bảng rồi lọc trong JS.
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

  // Nạp dữ liệu các bài có điểm yếu để map targetId sang anchor (#vocab-<id> hoặc #grammar-<id>)
  const [anchorMap, setAnchorMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (lessons.length === 0) return;
    let active = true;
    Promise.all(lessons.map((n) => loadLessonData(n)))
      .then((dataList) => {
        if (!active) return;
        const map = new Map<string, string>();
        for (const { lesson, vocab } of dataList) {
          const lNum = lesson.number;
          const padL = String(lNum).padStart(2, '0');
          vocab.forEach((w, idx) => {
            const targetId = `vocab-${padL}-${String(idx + 1).padStart(2, '0')}`;
            map.set(targetId, `#vocab-${w.id}`);
          });
          lesson.grammar.forEach((g, idx) => {
            const targetId = `grammar-${padL}-${String(idx + 1).padStart(2, '0')}`;
            map.set(targetId, `#grammar-${g.id}`);
          });
        }
        setAnchorMap(map);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [lessons]);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 pb-12 pt-3 sm:px-6 lg:px-8">
      <PageTitle back={{ href: '/on-tap', label: 'Ôn tập' }} title="Điểm yếu của tôi" />

      <div className="max-w-2xl space-y-4">
        <div
          role="group"
          aria-label="Lọc theo loại mục tiêu"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {FILTERS.map((value) => (
            <Chip key={value} pressed={filter === value} onClick={() => setFilter(value)}>
              {value === 'all' ? 'Tất cả' : TARGET_TYPE_LABEL[value]}
            </Chip>
          ))}
        </div>

        {items === undefined ? (
          <div className="space-y-2">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Chưa có điểm yếu nào được ghi nhận — mọi mục bạn đã làm đều đúng.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((item) => {
              const label = labels.get(item.targetId);
              const total = item.correctCount + item.incorrectCount;
              const lessonNum = item.lesson > 0 ? item.lesson : lessonFromTargetId(item.targetId);
              const practiceType = TARGET_TYPE_PRACTICE_MAP[item.targetType];
              const practiceHref =
                lessonNum > 0
                  ? practiceType
                    ? `/luyen-tap?lessons=${lessonNum}&type=${practiceType}`
                    : `/luyen-tap?lessons=${lessonNum}`
                  : '/luyen-tap';

              const anchor = getAnchor(item.targetId, anchorMap);
              const studyHref = lessonNum > 0 ? `/hoc/${lessonNum}${anchor}` : '/hoc';

              return (
                <li
                  key={item.targetId}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <div className="jp-vocab text-lg font-medium text-foreground">
                        {label ? (
                          <Furigana text={label.jp} />
                        ) : (
                          <span className="text-muted-foreground">{item.targetId}</span>
                        )}
                      </div>
                      <TargetTypeBadge type={item.targetType} />
                    </div>
                    {label?.vi && <p className="text-sm text-foreground/80">{label.vi}</p>}
                    <p className="text-sm text-muted-foreground">
                      Sai {item.incorrectCount}/{total} · sai gần nhất {dateText(item.lastFailedAt)} · ôn lại{' '}
                      {dateText(item.dueAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={practiceHref}
                      aria-label={`Luyện bài ${lessonNum || ''}`}
                      className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11 px-4')}
                    >
                      Luyện
                    </Link>
                    <Link
                      href={studyHref}
                      aria-label={`Xem bài ${lessonNum || ''}`}
                      className={cn(
                        buttonVariants({ variant: 'ghost' }),
                        'min-h-11 px-4 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      Xem bài
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
