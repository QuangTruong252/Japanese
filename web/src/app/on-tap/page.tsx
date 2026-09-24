'use client';

import { useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlarmClock, ArrowRight } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { TARGET_TYPE_LABEL, TargetTypeBadge } from '@/components/review/TargetTypeBadge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { buildSession, targetTypeFromId } from '@/lib/practice';
import {
  buildTargetLabels,
  countByTargetType,
  overdueDays,
  type TargetLabel,
} from '@/lib/review-queue';
import { useDueQueue } from '@/lib/use-due-queue';
import { useJapaneseVoice } from '@/lib/use-question-pool';
import { cn } from '@/lib/utils';
import type { TargetType } from '@/types';

const TYPE_ORDER: TargetType[] = ['vocab', 'grammar', 'kanji', 'particle', 'listening'];

/** Danh sách xem trước chỉ để biết sắp ôn gì; dài quá thì cắt, không phân trang. */
const PREVIEW_LIMIT = 20;

function PreviewRow({
  targetId,
  label,
  dueAt,
  now,
}: {
  targetId: string;
  label?: TargetLabel;
  dueAt: Date | null;
  now: Date;
}) {
  const late = dueAt ? overdueDays(dueAt, now) : 0;

  return (
    <li className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4">
      <div className="min-w-0 space-y-1">
        <div className="jp jp-vocab font-medium">
          {label ? (
            <Furigana text={label.jp} />
          ) : (
            <span className="text-muted-foreground">{targetId}</span>
          )}
        </div>
        {label?.vi && <p className="text-sm text-muted-foreground">{label.vi}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <TargetTypeBadge type={targetTypeFromId(targetId)} />
        {dueAt === null ? (
          <span className="text-xs text-muted-foreground">Mục mới</span>
        ) : late > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
            <AlarmClock className="size-3" aria-hidden="true" />
            trễ {late} ngày
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Đến hạn hôm nay</span>
        )}
      </div>
    </li>
  );
}

export default function ReviewTodayPage() {
  const router = useRouter();
  const queue = useDueQueue();
  const hasVoice = useJapaneseVoice();

  const audioKeys = useMemo(() => new Set(hasVoice ? ['tts'] : []), [hasVoice]);
  const labels = useMemo(() => buildTargetLabels(queue.questions), [queue.questions]);
  const breakdown = useMemo(
    () => countByTargetType([...queue.sessionTargetIds]),
    [queue.sessionTargetIds],
  );

  // Dựng thử phiên để biết có câu nào hợp lệ không. hasVoice === null nghĩa là còn đang dò
  // giọng ja-JP: dựng lúc đó sẽ chốt audioKeys rỗng và loại oan hết câu nghe.
  const preview = useMemo(() => {
    if (hasVoice === null || queue.loading || queue.sessionTargetIds.size === 0) {
      return { eligibleCount: 0, excludedAudioCount: 0 };
    }
    const { eligibleCount, excludedAudioCount } = buildSession(
      queue.questions,
      queue.config,
      audioKeys,
      queue.sessionTargetIds,
    );
    return { eligibleCount, excludedAudioCount };
  }, [hasVoice, queue.loading, queue.questions, queue.config, queue.sessionTargetIds, audioKeys]);

  const loading = queue.loading || hasVoice === null;
  const dueCount = queue.dueItems.length;
  const newCount = queue.newTargetIds.length;
  const totalCount = dueCount + newCount;
  const canStart = !loading && totalCount > 0 && preview.eligibleCount > 0;

  const startSession = useCallback(() => {
    if (canStart) router.push('/on-tap/phien');
  }, [canStart, router]);

  // Phím tắt Space (SPEC-05 §6). Bỏ qua khi tiêu điểm đang nằm ở phần tử tự xử lý Space.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.code !== 'Space') return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName)) return;
      event.preventDefault();
      startSession();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [startSession]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
        <div className="space-y-4">
          <h1 className="font-heading text-xl font-medium">Ôn tập</h1>
          <div className="flex items-center gap-6 border-b border-border/80 text-sm">
            <span className="font-semibold text-primary border-b-2 border-primary pb-2.5 -mb-px">
              Hôm nay
            </span>
            <Link
              href="/on-tap/diem-yeu"
              className="text-muted-foreground hover:text-foreground pb-2.5 -mb-px transition-colors"
            >
              Điểm yếu của tôi
            </Link>
          </div>
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-5 w-56" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  // Chưa học gì bao giờ: lịch ôn rỗng vì chưa có gì sinh ra nó.
  if (!queue.hasAnyReviewItem) {
    return (
      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
        <div className="space-y-4">
          <h1 className="font-heading text-xl font-medium">Ôn tập</h1>
          <div className="flex items-center gap-6 border-b border-border/80 text-sm">
            <Link
              href="/on-tap"
              className="font-semibold text-primary border-b-2 border-primary pb-2.5 -mb-px transition-colors"
            >
              Hôm nay
            </Link>
            <Link
              href="/on-tap/diem-yeu"
              className="text-muted-foreground hover:text-foreground pb-2.5 -mb-px transition-colors"
            >
              Điểm yếu của tôi
            </Link>
          </div>
        </div>
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <h2 className="text-lg font-semibold">Chưa có gì để ôn</h2>
            <p className="text-sm text-muted-foreground">
              Lịch ôn được tạo từ những gì bạn đã làm. Hãy bắt đầu từ bài 1.
            </p>
            <Link href="/hoc/1" className={cn(buttonVariants({ size: 'quiz' }), 'w-full sm:w-auto')}>
              Bắt đầu bài 1
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Đã ôn xong hôm nay — trạng thái gặp thường xuyên nhất, phải có nội dung và lối đi tiếp.
  if (totalCount === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
        <div className="space-y-4">
          <h1 className="font-heading text-xl font-medium">Ôn tập</h1>
          <div className="flex items-center gap-6 border-b border-border/80 text-sm">
            <Link
              href="/on-tap"
              className="font-semibold text-primary border-b-2 border-primary pb-2.5 -mb-px transition-colors"
            >
              Hôm nay
            </Link>
            <Link
              href="/on-tap/diem-yeu"
              className="text-muted-foreground hover:text-foreground pb-2.5 -mb-px transition-colors"
            >
              Điểm yếu của tôi
            </Link>
          </div>
        </div>
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <h2 className="text-lg font-semibold">Đã ôn xong hôm nay</h2>
            <p className="text-sm text-muted-foreground">
              {queue.dueTomorrowCount > 0
                ? `Ngày mai có ${queue.dueTomorrowCount} mục đến hạn ôn tập.`
                : 'Ngày mai chưa có mục nào đến hạn ôn tập.'}
            </p>
            {queue.limitReached && (
              <p className="text-sm text-muted-foreground">
                Đã đủ {queue.dailyNewLimit} mục mới hôm nay.
              </p>
            )}
            <Link href="/hoc" className={cn(buttonVariants({ size: 'quiz' }), 'w-full sm:w-auto')}>
              Học bài mới
            </Link>
          </CardContent>
        </Card>
        <Link
          href="/on-tap/diem-yeu"
          className="inline-flex min-h-12 items-center gap-1 text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Điểm yếu của tôi <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </main>
    );
  }

  const previewRows = [
    ...queue.dueItems.map((item) => ({ targetId: item.targetId, dueAt: item.dueAt })),
    ...queue.newTargetIds.map((targetId) => ({ targetId, dueAt: null as Date | null })),
  ].slice(0, PREVIEW_LIMIT);

  const breakdownText = TYPE_ORDER.filter((type) => breakdown[type] > 0)
    .map((type) => `${breakdown[type]} ${TARGET_TYPE_LABEL[type].toLowerCase()}`)
    .join(' · ');

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
      <div className="space-y-4">
        <h1 className="font-heading text-xl font-medium">Ôn tập</h1>
        <div className="flex items-center gap-6 border-b border-border/80 text-sm">
          <Link
            href="/on-tap"
            className="font-semibold text-primary border-b-2 border-primary pb-2.5 -mb-px transition-colors"
          >
            Hôm nay
          </Link>
          <Link
            href="/on-tap/diem-yeu"
            className="text-muted-foreground hover:text-foreground pb-2.5 -mb-px transition-colors"
          >
            Điểm yếu của tôi
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <p className="text-lg font-semibold text-foreground">
            <span aria-hidden="true">
              {dueCount} mục đến hạn · {newCount} mục mới
            </span>
            <span className="sr-only">
              Hôm nay có {dueCount} mục đến hạn ôn tập và {newCount} mục mới.
            </span>
          </p>

          {!canStart && preview.excludedAudioCount > 0 && (
            <p role="alert" className="text-sm text-destructive">
              Các mục đến hạn chỉ còn câu dạng nghe, mà máy này không có giọng tiếng Nhật
              (ja-JP). Chưa tạo được phiên; hạn ôn của chúng giữ nguyên.
            </p>
          )}
          {!canStart && preview.excludedAudioCount === 0 && (
            <p role="alert" className="text-sm text-destructive">
              Không có câu hỏi nào hợp lệ cho các mục đang đến hạn. Hạn ôn giữ nguyên.
            </p>
          )}

          <Button size="quiz" className="w-full" disabled={!canStart} onClick={startSession}>
            Bắt đầu ôn
          </Button>

          {queue.limitReached && (
            <p className="text-sm text-muted-foreground">
              Đã đủ {queue.dailyNewLimit} mục mới hôm nay — hôm nay không nạp thêm mục mới nữa.
            </p>
          )}
        </CardContent>
      </Card>

      {breakdownText && <p className="text-sm text-muted-foreground">{breakdownText}</p>}

      <ul className="space-y-3">
        {previewRows.map((row) => (
          <PreviewRow
            key={row.targetId}
            targetId={row.targetId}
            label={labels.get(row.targetId)}
            dueAt={row.dueAt}
            now={queue.now}
          />
        ))}
      </ul>

      {totalCount > previewRows.length && (
        <p className="text-sm text-muted-foreground">
          … và {totalCount - previewRows.length} mục nữa trong phiên.
        </p>
      )}

      <Link
        href="/on-tap/diem-yeu"
        className="inline-flex min-h-12 items-center gap-1 text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Điểm yếu của tôi <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </main>
  );
}
