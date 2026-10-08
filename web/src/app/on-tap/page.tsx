'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlarmClock, AlertCircle, Info, Play, RotateCcw } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { Stage, PaperSlip, LinkRow } from '@/components/PaperStage';
import { DashboardReinforcement } from '@/components/DashboardReinforcement';
import { TARGET_TYPE_LABEL, TargetTypeBadge } from '@/components/review/TargetTypeBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { db } from '@/lib/db';
import { buildSession, targetTypeFromId } from '@/lib/practice';
import {
  buildTargetLabels,
  countByTargetType,
  describeRemainingBatches,
  formatDraftOverwriteWarning,
  hasActiveReviewDraft,
  overdueDays,
  resolveReviewStartAction,
  resolveReviewSyncNotice,
} from '@/lib/review-queue';
import { secondsPerQuestion } from '@/lib/stats';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useDueQueue } from '@/lib/use-due-queue';
import { useJapaneseVoice } from '@/lib/use-question-pool';
import { useReviewDraft } from '@/lib/use-review-draft';
import type { IllustrationAsset, TargetType } from '@/types';

const TYPE_ORDER: TargetType[] = ['vocab', 'grammar', 'kanji', 'particle', 'listening'];

const REVIEW_COMPLETE_ASSET: IllustrationAsset = {
  src: '/assets/illustrations/ui/states/review-complete-v1.webp',
  width: 512,
  height: 512,
  alt: { vi: '' },
};

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

export default function ReviewTodayPage() {
  const router = useRouter();
  useEffect(() => {
    router.prefetch('/on-tap/phien');
    router.prefetch('/on-tap/diem-yeu');
    router.prefetch('/hoc');
    router.prefetch('/');
  }, [router]);

  const queue = useDueQueue();
  const hasVoice = useJapaneseVoice();
  const { draft, clearDraft } = useReviewDraft();
  const isOnline = useOnlineStatus();

  // Trạng thái Supabase Auth chỉ đọc session cục bộ (onAuthStateChange), không gọi mạng getUser
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    try {
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsLoggedIn(Boolean(session?.user));
      });
      return () => subscription.unsubscribe();
    } catch {
      // Supabase unconfigured / unavailable
    }
  }, []);

  const hasActiveDraft = hasActiveReviewDraft(draft);
  const [confirmNewSessionOpen, setConfirmNewSessionOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const startAction = resolveReviewStartAction(hasActiveDraft);

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

  // Thời gian thật mỗi câu từ các phiên gần đây để tính thời gian ôn (như Home trong DashboardContent)
  const recentSessions = useLiveQuery(
    () => db.practiceSessions.orderBy('createdAt').reverse().limit(20).toArray(),
    [],
  );
  const batchCount = queue.sessionTargetIds.size;
  const minutesEstimate = useMemo(() => {
    const spq = secondsPerQuestion(recentSessions ?? []);
    return spq === null ? null : Math.max(1, Math.round((batchCount * spq) / 60));
  }, [recentSessions, batchCount]);

  // Đếm số mục cần củng cố (từng sai ít nhất 1 lần)
  const weakCount = useLiveQuery(
    () => db.reviewItems.filter((item) => item.incorrectCount > 0).count(),
    [],
  ) ?? 0;

  const loading = queue.loading || hasVoice === null;
  const dueCount = queue.dueItems.length;
  const newCount = queue.newTargetIds.length;
  const totalCount = dueCount + newCount;
  const canStart = !loading && totalCount > 0 && preview.eligibleCount > 0;
  const dueSummaryText = [
    queue.totalDueCount > 0 ? `${queue.totalDueCount} mục đến hạn` : null,
    newCount > 0 ? `${newCount} mục mới` : null,
  ].filter(Boolean).join(' · ') || `${totalCount} mục ôn tập`;

  const handleStartClick = useCallback(() => {
    if (!canStart) return;
    if (hasActiveDraft) {
      setConfirmNewSessionOpen(true);
      return;
    }
    router.push('/on-tap/phien');
  }, [canStart, hasActiveDraft, router, setConfirmNewSessionOpen]);

  const handleConfirmNewSession = useCallback(() => {
    setConfirmNewSessionOpen(false);
    clearDraft();
    router.push('/on-tap/phien');
  }, [clearDraft, router, setConfirmNewSessionOpen]);

  const handleConfirmDiscard = useCallback(() => {
    setConfirmDiscardOpen(false);
    clearDraft();
  }, [clearDraft, setConfirmDiscardOpen]);

  // Phím tắt Space: ưu tiên tiếp tục nháp nếu có
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.code !== 'Space') return;
      if (confirmNewSessionOpen || confirmDiscardOpen) return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName)) return;
      event.preventDefault();
      if (hasActiveDraft) {
        router.push('/on-tap/phien?resume=1');
      } else {
        handleStartClick();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmNewSessionOpen, confirmDiscardOpen, hasActiveDraft, handleStartClick, router]);

  const syncNotice = useMemo(
    () =>
      resolveReviewSyncNotice({
        pendingSyncCount: queue.pendingSyncCount,
        isOnline,
        isConfigured: isSupabaseConfigured(),
        isLoggedIn,
      }),
    [queue.pendingSyncCount, isOnline, isLoggedIn],
  );

  // Khối thông báo ngoại tuyến và pending sync
  const networkStatusBanner = (
    <>
      {!isOnline && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-foreground"
        >
          <AlertCircle className="size-4 shrink-0 text-warning" aria-hidden="true" />
          <span>
            Đang ngoại tuyến. Dữ liệu ôn tập được lưu trên máy và sẽ đồng bộ khi có kết nối mạng.
          </span>
        </div>
      )}
      {syncNotice && (
        <p className="text-xs text-muted-foreground">
          {syncNotice.text}
          {syncNotice.kind === 'anonymous' && (
            <>
              {' '}
              <Link
                href={syncNotice.actionHref}
                className="underline underline-offset-2 hover:text-foreground"
              >
                {syncNotice.actionText}
              </Link>
              .
            </>
          )}
        </p>
      )}
    </>
  );

  // Mảnh giấy phiên đang dở nếu có bản nháp (Finding 27, kích thước quiz 48px, câu có số)
  const draftResumeSlip = hasActiveDraft && draft && (
    <PaperSlip className="mt-0 space-y-4 border-primary/30">
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Phiên dở dang
        </span>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Phiên dở · câu {Math.min(draft.currentIndex + 1, draft.questions.length)}/{draft.questions.length}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Đã trả lời {draft.currentIndex} trên {draft.questions.length} câu. Tiếp tục để hoàn thành phiên ôn này.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
        <Button
          size="quiz"
          className="w-full sm:flex-1 text-base font-semibold"
          onClick={() => router.push('/on-tap/phien?resume=1')}
        >
          <Play className="mr-1.5 size-4" aria-hidden="true" />
          Tiếp tục phiên ôn
        </Button>
        <Button
          variant="outline"
          size="quiz"
          className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
          onClick={() => setConfirmDiscardOpen(true)}
        >
          <RotateCcw className="mr-1.5 size-4" aria-hidden="true" />
          Bỏ nháp
        </Button>
      </div>
    </PaperSlip>
  );

  // Hộp thoại xác nhận hủy bỏ phiên nháp ôn tập (Finding 27)
  const discardDraftDialog = (
    <AlertDialog
      open={confirmDiscardOpen}
      onOpenChange={setConfirmDiscardOpen}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bỏ phiên ôn tập đang dở?</AlertDialogTitle>
          <AlertDialogDescription>
            Tiến độ phiên ôn tập hiện tại (đã làm câu {draft ? Math.min(draft.currentIndex + 1, draft.questions.length) : 0}/{draft?.questions?.length ?? 0}) sẽ bị hủy và không thể khôi phục.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel onClick={() => setConfirmDiscardOpen(false)}>
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirmDiscard}
          >
            Bỏ nháp
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Khối "Cần củng cố" dùng chung cho các màn
  const reinforcementSection = (
    <section aria-labelledby="reinforce-heading" className="space-y-2 pt-2">
      <h2 id="reinforce-heading" className="text-base font-semibold text-foreground">
        Cần củng cố
      </h2>
      <div className="divide-y divide-border">
        {weakCount > 0 && <DashboardReinforcement limit={3} />}
        <LinkRow
          href="/on-tap/diem-yeu"
          title="Điểm yếu của tôi"
          detail={weakCount > 0 ? `Xem toàn bộ ${weakCount} mục đã từng trả lời sai` : 'Chưa có mục nào cần củng cố'}
        />
      </div>
    </section>
  );

  // Trạng thái đang tải
  if (loading) {
    return (
      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 pb-28 sm:pb-12">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Ôn tập hôm nay</h1>
        <Skeleton className="h-44 w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </main>
    );
  }

  // Trạng thái: Người học mới, chưa từng có mục ôn nào
  if (!queue.hasAnyReviewItem && totalCount === 0 && queue.learnedLessons.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 pb-28 sm:pb-12">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Ôn tập hôm nay</h1>
        {networkStatusBanner}
        {draftResumeSlip}
        {discardDraftDialog}
        <div className="rounded-xl border border-border bg-card p-6 text-center space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Chưa có gì để ôn</h2>
          <p className="text-sm text-muted-foreground">
            Lịch ôn được tạo từ những bài bạn đã học hoặc luyện tập. Hãy bắt đầu từ bài 1.
          </p>
        </div>
        <div className="divide-y divide-border pt-2">
          <LinkRow
            href="/hoc"
            title="Bắt đầu học bài"
            detail="Khám phá các bài học Minna no Nihongo N5"
          />
        </div>
      </main>
    );
  }

  // Trạng thái: Đã đạt hạn mức mục mới hôm nay
  if (totalCount === 0 && queue.limitReached) {
    return (
      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 pb-28 sm:pb-12">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Ôn tập hôm nay</h1>
        {networkStatusBanner}
        {draftResumeSlip}
        {discardDraftDialog}
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Info className="size-6 shrink-0 text-info" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-foreground">
              Đã đạt hạn mức mục mới hôm nay
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Bạn đã hoàn thành các mục đến hạn và đạt hạn mức {queue.dailyNewLimit} mục mới hôm nay. Hãy quay lại vào ngày mai hoặc học thêm bài mới.
          </p>
        </div>
        <div className="divide-y divide-border">
          <LinkRow
            href="/hoc"
            title="Học bài mới"
            detail="Học thêm từ vựng và ngữ pháp mới"
          />
          <LinkRow
            href="/"
            title="Về Bảng tin"
          />
        </div>
        {reinforcementSection}
      </main>
    );
  }

  // Trạng thái: Đã ôn xong hôm nay
  if (totalCount === 0) {
    const nextDueText = queue.dueTomorrowCount > 0
      ? `${queue.dueTomorrowCount} mục vào ngày mai`
      : 'ngày mai chưa có mục nào';

    return (
      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 pb-28 sm:pb-12">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Ôn tập hôm nay</h1>
        {networkStatusBanner}
        {draftResumeSlip}
        {discardDraftDialog}
        <div className="space-y-4">
          <Stage
            asset={REVIEW_COMPLETE_ASSET}
            sizes="(max-width: 672px) 100vw, 672px"
            imageClassName="h-48 sm:h-56 object-contain mx-auto"
          />
          <div className="space-y-1 text-center">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              Hôm nay đã ôn xong
            </h2>
            <p className="text-sm text-muted-foreground">
              Lượt tiếp theo: {nextDueText}
            </p>
          </div>
        </div>
        <div className="divide-y divide-border">
          <LinkRow
            href="/hoc"
            title="Học bài mới"
            detail="Tiếp tục học từ vựng và ngữ pháp"
          />
          <LinkRow
            href="/"
            title="Về Bảng tin"
          />
        </div>
        {reinforcementSection}
      </main>
    );
  }

  // Trạng thái: Bị chặn (thiếu giọng Nhật hoặc thiếu câu hỏi hợp lệ) (Decision D2: plain block, no nested card)
  if (!canStart) {
    return (
      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 pb-28 sm:pb-12">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Ôn tập hôm nay</h1>
        {networkStatusBanner}
        {draftResumeSlip}
        {discardDraftDialog}
        <div className="space-y-3">
          <p className="text-xl font-semibold text-foreground">
            {dueSummaryText}
          </p>
          {preview.excludedAudioCount > 0 ? (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-foreground">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Các mục đến hạn chỉ có câu dạng nghe, nhưng thiết bị chưa có giọng tiếng Nhật (ja-JP).
                </p>
                <p className="text-xs text-muted-foreground">
                  Chưa tạo được phiên ôn cho các câu nghe; hạn ôn của các mục này được giữ nguyên.
                </p>
              </div>
            </div>
          ) : (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
              <p className="text-sm font-medium">
                Không có câu hỏi nào hợp lệ cho các mục đang đến hạn. Hạn ôn của chúng được giữ nguyên.
              </p>
            </div>
          )}
        </div>
        <div className="divide-y divide-border">
          {preview.excludedAudioCount > 0 && (
            <LinkRow
              href="/cai-dat/audio"
              title="Cài đặt âm thanh"
              detail="Thêm giọng tiếng Nhật để ôn câu nghe"
            />
          )}
          <LinkRow
            href="/hoc"
            title="Học bài khác"
          />
          <LinkRow
            href="/"
            title="Về Bảng tin"
          />
        </div>
        {reinforcementSection}
      </main>
    );
  }

  // Dữ liệu cho trạng thái đến hạn ôn tập
  const breakdownText = TYPE_ORDER.filter((type) => (breakdown[type] ?? 0) > 0)
    .map((type) => `${breakdown[type]} ${TARGET_TYPE_LABEL[type].toLowerCase()}`)
    .join(' · ');

  const remainingBatchesText = describeRemainingBatches(queue.remainingDue, queue.reviewBatchSize);

  // Danh sách các mục trong lô hiện tại (tối đa 5 dòng xem trước)
  const batchItems = [
    ...queue.dueItems.map((item) => ({ targetId: item.targetId, dueAt: item.dueAt })),
    ...queue.newTargetIds.map((targetId) => ({ targetId, dueAt: null as Date | null })),
  ];
  const previewRows = batchItems.slice(0, 5);
  const remainingInBatch = Math.max(0, batchItems.length - 5);

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 pb-28 sm:pb-12">
      <h1 className="font-heading text-2xl font-semibold text-foreground">Ôn tập hôm nay</h1>
      {networkStatusBanner}
      {draftResumeSlip}
      {discardDraftDialog}

      {/* 1. Mảnh giấy điều khiển: không cảnh nền, yên tĩnh */}
      <PaperSlip className="mt-0 space-y-4">
        <div className="space-y-1">
          <p className="text-xl sm:text-2xl font-semibold text-foreground">
            <span aria-hidden="true">{dueSummaryText}</span>
            <span className="sr-only">
              Hôm nay có {queue.totalDueCount} mục đến hạn ôn tập và {newCount} mục mới.
            </span>
          </p>
          {minutesEstimate !== null && (
            <p className="text-sm text-muted-foreground">khoảng {minutesEstimate} phút</p>
          )}
        </div>

        <Button
          size="quiz"
          variant={startAction.buttonVariant}
          className="w-full text-base font-medium"
          onClick={handleStartClick}
        >
          Bắt đầu ôn
        </Button>

        {breakdownText && (
          <p className="text-sm text-muted-foreground">
            {breakdownText}
          </p>
        )}

        {preview.excludedAudioCount > 0 && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-foreground"
          >
            <AlertCircle className="size-4 shrink-0 text-warning" aria-hidden="true" />
            <span>
              Tạm thời bỏ qua {preview.excludedAudioCount} câu nghe do thiết bị chưa có giọng tiếng Nhật (ja-JP).{' '}
              <Link href="/cai-dat/audio" className="font-semibold underline underline-offset-2 hover:text-foreground">
                Cài đặt âm thanh
              </Link>
            </span>
          </div>
        )}

        {queue.remainingDue > 0 && (
          <p className="text-sm text-muted-foreground">
            {remainingBatchesText}
          </p>
        )}
      </PaperSlip>

      {/* 2. Lô này: xem trước tối đa 5 mục của lô hiện tại (chỉ xem, không bấm) */}
      <section aria-labelledby="batch-preview-heading" className="space-y-2">
        <h2 id="batch-preview-heading" className="text-base font-semibold text-foreground">
          Lô này
        </h2>
        <ul className="divide-y divide-border">
          {previewRows.map((row) => {
            const label = labels.get(row.targetId);
            const late = row.dueAt ? overdueDays(row.dueAt, queue.now) : 0;
            return (
              <li
                key={row.targetId}
                className="flex flex-col items-start gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="jp jp-vocab text-lg font-medium text-foreground">
                    {label ? (
                      <Furigana text={label.jp} />
                    ) : (
                      <span className="text-muted-foreground">{row.targetId}</span>
                    )}
                  </div>
                  {label?.vi && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{label.vi}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  {late > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-sm bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                      <AlarmClock className="size-3" aria-hidden="true" />
                      <span>Quá hạn {late} ngày</span>
                    </span>
                  )}
                  <TargetTypeBadge type={targetTypeFromId(row.targetId)} />
                </div>
              </li>
            );
          })}
        </ul>
        {remainingInBatch > 0 && (
          <p className="text-sm text-muted-foreground pt-1">
            và {remainingInBatch} mục khác
          </p>
        )}
      </section>

      {/* 3. Cần củng cố: 3 mục sai nhiều nhất + LinkRow Điểm yếu của tôi */}
      {reinforcementSection}

      {/* Hộp thoại xác nhận ghi đè phiên nháp ôn tập đang dở */}
      <AlertDialog
        open={confirmNewSessionOpen}
        onOpenChange={setConfirmNewSessionOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bắt đầu phiên ôn tập mới?</AlertDialogTitle>
            <AlertDialogDescription>
              {formatDraftOverwriteWarning(
                draft?.currentIndex ?? 0,
                draft?.questions.length ?? 0,
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel onClick={() => setConfirmNewSessionOpen(false)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmNewSession}
            >
              Bắt đầu mới
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

