'use client';

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlarmClock, AlertCircle, ArrowRight, Play, RotateCcw } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { TARGET_TYPE_LABEL, TargetTypeBadge } from '@/components/review/TargetTypeBadge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { buildSession, targetTypeFromId } from '@/lib/practice';
import {
  buildTargetLabels,
  countByTargetType,
  describeRemainingBatches,
  overdueDays,
  type TargetLabel,
} from '@/lib/review-queue';
import { useDueQueue } from '@/lib/use-due-queue';
import { useJapaneseVoice } from '@/lib/use-question-pool';
import { useReviewDraft } from '@/lib/use-review-draft';
import { cn } from '@/lib/utils';
import type { TargetType } from '@/types';

const TYPE_ORDER: TargetType[] = ['vocab', 'grammar', 'kanji', 'particle', 'listening'];

/** Danh sách xem trước chỉ để biết sắp ôn gì; dài quá thì cắt, không phân trang. */
const PREVIEW_LIMIT = 20;

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function useOnlineStatus() {
  return useSyncExternalStore(subscribeOnline, getOnlineSnapshot, () => true);
}

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
            <span>trễ {late} ngày</span>
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
  useEffect(() => {
    router.prefetch('/on-tap/phien');
    router.prefetch('/on-tap/diem-yeu');
    router.prefetch('/');
  }, [router]);

  const queue = useDueQueue();
  const hasVoice = useJapaneseVoice();
  const { draft, clearDraft } = useReviewDraft();
  const isOnline = useOnlineStatus();

  const audioKeys = useMemo(() => new Set(hasVoice ? ['tts'] : []), [hasVoice]);
  const labels = useMemo(() => buildTargetLabels(queue.questions), [queue.questions]);
  const breakdown = useMemo(
    () => countByTargetType([...queue.sessionTargetIds]),
    [queue.sessionTargetIds],
  );

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
  const maxLesson = queue.config.maxLearnedLesson;

  const startSession = useCallback(() => {
    if (canStart) router.push('/on-tap/phien');
  }, [canStart, router]);

  // Phím tắt Space (SPEC-05 §6, SPEC-20 §6)
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

  const headerTabs = (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-medium">Ôn tập</h1>
        <p className="text-xs text-muted-foreground">
          Ôn tập ngắt quãng FSRS theo lịch và củng cố điểm yếu
        </p>
      </div>
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
  );

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 pb-28 sm:pb-12">
        {headerTabs}
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-5 w-56" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  // Khối thông báo ngoại tuyến và pending sync
  const networkStatusBanner = (
    <>
      {!isOnline && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs sm:text-sm text-warning-foreground"
        >
          <AlertCircle className="size-4 shrink-0 text-warning" aria-hidden="true" />
          <span>
            Đang ngoại tuyến. Dữ liệu ôn tập được lưu trên máy và sẽ đồng bộ khi có kết nối mạng.
          </span>
        </div>
      )}
      {queue.pendingSyncCount > 0 && isOnline && (
        <p className="text-xs text-muted-foreground">
          {queue.pendingSyncCount} kết quả ôn đang chờ đồng bộ lên máy chủ.
        </p>
      )}
    </>
  );

  // Khối phiên đang dở nếu có bản nháp
  const draftResumeCard = draft && (
    <Card className="border-primary/40 bg-accent/30">
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Phiên ôn tập đang dở
            </span>
            <p className="text-sm font-medium text-foreground">
              Đã trả lời {draft.currentIndex} trên {draft.questions.length} câu
            </p>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {new Date(draft.savedAt).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <Button
            size="quiz"
            className="w-full sm:flex-1"
            onClick={() => router.push('/on-tap/phien?resume=1')}
          >
            <Play className="mr-2 size-4" />
            Tiếp tục phiên ôn
          </Button>
          <Button
            size="quiz"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={clearDraft}
          >
            <RotateCcw className="mr-2 size-4" />
            Bỏ phiên dở
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Trạng thái 1: Chưa có bài nào
  if (!queue.hasAnyReviewItem && totalCount === 0 && queue.learnedLessons.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 pb-28 sm:pb-12">
        {headerTabs}
        {networkStatusBanner}
        {draftResumeCard}
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <h2 className="text-lg font-semibold">Chưa có gì để ôn</h2>
            <p className="text-sm text-muted-foreground">
              Lịch ôn được tạo từ những bài bạn đã học hoặc luyện tập. Hãy bắt đầu từ bài 1.
            </p>
            <Link href="/hoc/1" className={cn(buttonVariants({ size: 'quiz' }), 'w-full sm:w-auto')}>
              Bắt đầu bài 1
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Trạng thái 2: Đã ôn xong hôm nay
  if (totalCount === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 pb-28 sm:pb-12">
        {headerTabs}
        {networkStatusBanner}
        {draftResumeCard}
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/hoc" className={cn(buttonVariants({ size: 'quiz' }), 'w-full sm:w-auto')}>
                Học bài mới
              </Link>
              <Link
                href="/"
                className={cn(buttonVariants({ variant: 'outline', size: 'quiz' }), 'w-full sm:w-auto')}
              >
                Về Bảng tin
              </Link>
            </div>
          </CardContent>
        </Card>
        <div className="pt-2">
          <Link
            href="/on-tap/diem-yeu"
            className="inline-flex min-h-12 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span>Xem điểm yếu của tôi</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </main>
    );
  }

  // Trạng thái 3: Bị chặn (thiếu câu hỏi hoặc thiếu audio giọng Nhật)
  if (!canStart) {
    return (
      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 pb-28 sm:pb-12">
        {headerTabs}
        {networkStatusBanner}
        {draftResumeCard}
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-lg font-semibold text-foreground">
              {dueCount} mục đến hạn · {newCount} mục mới
            </p>

            {preview.excludedAudioCount > 0 ? (
              <div role="alert" className="space-y-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-warning-foreground">
                <p className="text-sm font-medium">
                  Các mục đến hạn chỉ có câu dạng nghe, nhưng trình duyệt hoặc thiết bị chưa có giọng tiếng Nhật (ja-JP).
                </p>
                <p className="text-xs text-muted-foreground">
                  Chưa tạo được phiên ôn cho các câu nghe; hạn ôn của các mục này được giữ nguyên.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    href="/cai-dat/audio"
                    className={cn(buttonVariants({ size: 'quiz' }), 'w-full sm:w-auto')}
                  >
                    Cài đặt âm thanh
                  </Link>
                  <Link
                    href="/hoc"
                    className={cn(buttonVariants({ variant: 'outline', size: 'quiz' }), 'w-full sm:w-auto')}
                  >
                    Học bài khác
                  </Link>
                </div>
              </div>
            ) : (
              <div role="alert" className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                <p className="text-sm font-medium">
                  Không có câu hỏi nào hợp lệ cho các mục đang đến hạn. Hạn ôn được giữ nguyên.
                </p>
                <div className="pt-1">
                  <Link
                    href="/hoc"
                    className={cn(buttonVariants({ size: 'quiz' }), 'w-full sm:w-auto')}
                  >
                    Xem danh sách bài học
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="pt-2">
          <Link
            href="/on-tap/diem-yeu"
            className="inline-flex min-h-12 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span>Điểm yếu của tôi</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
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

  const remainingBatchesText = describeRemainingBatches(queue.remainingDue, queue.reviewBatchSize);

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 pb-28 sm:pb-12">
      {headerTabs}
      {networkStatusBanner}
      {draftResumeCard}

      {/* Thẻ điều khiển phiên ôn */}
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

          <Button size="quiz" className="w-full text-base font-medium" onClick={startSession}>
            Bắt đầu ôn
          </Button>

          {queue.remainingDue > 0 && (
            <p className="text-sm text-muted-foreground">
              {remainingBatchesText}
            </p>
          )}

          {queue.limitReached && (
            <p className="text-sm text-muted-foreground">
              Đã đủ {queue.dailyNewLimit} mục mới hôm nay — tạm không nạp thêm mục mới nữa.
            </p>
          )}

          {newCount > 0 && (
            <p className="text-xs sm:text-sm text-muted-foreground border-t border-border/60 pt-3">
              Khi bạn bắt đầu một bài hoặc khai báo đã học đến bài đó, các từ và mẫu câu khác của bài được đưa dần vào Ôn tập — tối đa {queue.dailyNewLimit} mục mới mỗi ngày{maxLesson > 0 ? ` (hiện tới bài ${maxLesson})` : ''}. Nếu chưa đọc bài, hãy{' '}
              {maxLesson > 0 ? (
                <Link
                  href={`/hoc/${maxLesson}`}
                  className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  học bài {maxLesson} trước
                </Link>
              ) : (
                <Link
                  href="/hoc"
                  className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  học bài trước
                </Link>
              )}{' '}
              hoặc điều chỉnh tại{' '}
              <Link
                href="/cai-dat#hoc-den-bai"
                className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
              >
                cài đặt &quot;đã học đến bài&quot;
              </Link>.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Phân rã theo loại mục tiêu */}
      {breakdownText && <p className="text-sm text-muted-foreground">{breakdownText}</p>}

      {/* Danh sách xem trước mục tiêu trong lô */}
      <section aria-label="Xem trước các mục ôn tập">
        <h2 className="sr-only">Xem trước danh sách mục ôn tập trong lô</h2>
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
      </section>

      {totalCount > previewRows.length && (
        <p className="text-sm text-muted-foreground">
          … và {totalCount - previewRows.length} mục nữa trong lô này.
        </p>
      )}

      {/* Link phụ đến Điểm yếu */}
      <div className="pt-2">
        <Link
          href="/on-tap/diem-yeu"
          className="inline-flex min-h-12 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span>Điểm yếu của tôi</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
