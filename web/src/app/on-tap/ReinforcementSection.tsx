'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { FeatureIcon } from '@/components/FeatureIcon';
import { Furigana } from '@/components/Furigana';
import { ListRow, SectionHeader } from '@/components/PaperKit';
import { TARGET_TYPE_LABEL } from '@/components/review/TargetTypeBadge';
import { db } from '@/lib/db';
import { buildTargetLabels } from '@/lib/review-queue';
import { useQuestionPool } from '@/lib/use-question-pool';

const WEAK_LIMIT = 3;

/** Mục "Cần củng cố": ba mục sai nhiều nhất và lối vào màn Điểm yếu. */
export function ReinforcementSection({ weakCount }: { weakCount: number }) {
  const rows = useLiveQuery(
    async () => {
      const items = await db.reviewItems.filter((item) => item.incorrectCount > 0).toArray();
      return items
        .sort(
          (a, b) =>
            b.incorrectCount - a.incorrectCount ||
            (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''),
        )
        .slice(0, WEAK_LIMIT);
    },
    [],
  );

  const lessons = useMemo(
    () => [...new Set((rows ?? []).map((row) => row.lesson))].filter((n) => n > 0),
    [rows],
  );
  const { questions } = useQuestionPool(lessons);
  const labels = useMemo(() => buildTargetLabels(questions), [questions]);

  return (
    <section aria-labelledby="reinforce-heading">
      <SectionHeader id="reinforce-heading" title="Cần củng cố" />
      <div className="space-y-2">
        {weakCount > 0 &&
          (rows ?? []).map((row) => {
            const label = labels.get(row.targetId);
            return (
              <ListRow
                key={row.targetId}
                href="/on-tap/diem-yeu"
                icon={<FeatureIcon name="weak-points" />}
                title={
                  label ? (
                    <Furigana text={label.jp} className="jp-vocab text-lg" />
                  ) : (
                    `${TARGET_TYPE_LABEL[row.targetType]} · Bài ${row.lesson}`
                  )
                }
                detail={`${label?.vi ? `${label.vi} · ` : ''}sai ${row.incorrectCount} lần`}
              />
            );
          })}
        <ListRow
          href="/on-tap/diem-yeu"
          icon={<FeatureIcon name="weak-points" />}
          title="Điểm yếu của tôi"
          detail={
            weakCount > 0
              ? `Xem toàn bộ ${weakCount} mục đã từng trả lời sai`
              : 'Chưa có mục nào cần củng cố'
          }
        />
      </div>
    </section>
  );
}
