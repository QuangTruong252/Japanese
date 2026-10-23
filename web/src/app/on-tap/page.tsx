'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlarmClock, AlertCircle, ArrowRight, ChartColumn, Clock, RefreshCw, Volume2, WifiOff } from 'lucide-react';
import { FeatureIcon, type FeatureIconName } from '@/components/FeatureIcon';
import { Furigana } from '@/components/Furigana';
import { Illustration } from '@/components/Illustration';
import { Accent, BentoGrid, ListRow, PageTitle, SectionHeader, Tile, TornCard } from '@/components/PaperKit';
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
import { AUDIO_IMPORT_ENABLED } from '@/lib/features';
import { REVIEW_COMPLETE_ART } from '@/lib/illustrations';
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
import { forecastDayLabel, reviewForecast, type ForecastDay } from '@/lib/review-forecast';
import { secondsPerQuestion } from '@/lib/stats';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useDueQueue } from '@/lib/use-due-queue';
import { useJapaneseVoice } from '@/lib/use-question-pool';
import { useReviewDraft } from '@/lib/use-review-draft';
import { cn } from '@/lib/utils';
import type { TargetType } from '@/types';
import { ReinforcementSection } from './ReinforcementSection';

const TYPE_ORDER: TargetType[] = ['vocab', 'grammar', 'kanji', 'particle', 'listening'];

const TYPE_ICON: Record<TargetType, FeatureIconName> = {
  vocab: 'vocab',
  grammar: 'grammar',
  kanji: 'kanji',
  particle: 'grammar',
  listening: 'listening',
};

const MAIN_CLASS = 'mx-auto w-full max-w-5xl space-y-8 px-4 pb-12 pt-3 sm:px-6 lg:max-w-[1200px] lg:px-8';

// Mobile xem trước 5 mục; từ md hiện 12 để lấp trọn hàng ở cả 2 và 3 cột.
const PREVIEW_MOBILE = 5;
const PREVIEW_WIDE = 12;

/** Biểu đồ cột 7 ngày; số liệu nằm cả trên cột lẫn trong `aria-label` vì cột chỉ là hình. */
function ForecastChart({ days }: { days: ForecastDay[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const labels = days.map(forecastDayLabel);
  const summary = days.map((d, i) => `${labels[i]} ${d.count}`).join(', ');
  return (
    <div>
      <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
        <ChartColumn className="size-5 text-primary" aria-hidden="true" />
        Lịch ôn 7 ngày
      </h2>
      <div role="img" aria-label={`Lịch ôn 7 ngày: ${summary}`} className="mt-3 flex h-32 items-end gap-2">
        {days.map((d, i) => (
          <div
            key={i}
            className={cn('flex min-w-0 flex-col items-center justify-end gap-1', i === 0 ? 'flex-[1.7]' : 'flex-1')}
          >
            <span
              className={cn('text-xs tabular-nums', i === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground')}
            >
              {d.count}
            </span>
            <div
              className={cn(
                'w-full max-w-9 rounded-t-md',
                i === 0 ? 'bg-primary' : 'border border-b-0 border-border bg-secondary',
              )}
              style={{ height: Math.max(4, Math.round((d.count / max) * 72)) }}
            />
            <span
              className={cn('whitespace-nowrap text-xs', i === 0 ? 'font-medium text-foreground' : 'text-muted-foreground')}
            >
              {labels[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

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

  // Chỉ đọc cột dueAt qua index, và chỉ tới hết ngày thứ 7 của lịch ôn.
  const forecastDueDates = useLiveQuery(
    () => {
      const end = new Date(queue.now.getFullYear(), queue.now.getMonth(), queue.now.getDate() + 7);
      return db.reviewItems.where('dueAt').below(end).keys() as Promise<Date[]>;
    },
    [queue.now],
    [] as Date[],
  );
  const forecast = useMemo(
    () => reviewForecast(forecastDueDates ?? [], queue.now),
    [forecastDueDates, queue.now],
  );

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

  // Thông báo ngoại tuyến và chờ đồng bộ: dòng nhỏ có icon, không dựng hộp
  const networkStatusNotice = (
    <>
      {!isOnline && (
        <p role="status" className="flex items-start gap-2 text-sm text-muted-foreground">
          <WifiOff className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <span>
            Đang ngoại tuyến. Dữ liệu ôn tập được lưu trên máy và sẽ đồng bộ khi có kết nối mạng.
          </span>
        </p>
      )}
      {syncNotice && (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <RefreshCw className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
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
          </span>
        </p>
      )}
    </>
  );

  // Phiên đang dở: "Tiếp tục phiên ôn" là nút đỏ duy nhất khi có nháp
  const draftResumeCard = hasActiveDraft && draft && (
    <TornCard>
      <p className="font-serif text-sm font-bold tracking-wide text-primary">/ Phiên dở /</p>
      <p className="mt-1.5 font-serif text-2xl font-bold tracking-tight text-foreground">
        Phiên dở · câu {Math.min(draft.currentIndex + 1, draft.questions.length)}/{draft.questions.length}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Đã trả lời {draft.currentIndex} trên {draft.questions.length} câu.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button
          size="quiz"
          className="w-full font-semibold sm:flex-1"
          onClick={() => router.push('/on-tap/phien?resume=1')}
        >
          Tiếp tục phiên ôn
          <ArrowRight aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="quiz"
          className="w-full sm:w-auto"
          onClick={() => setConfirmDiscardOpen(true)}
        >
          Bỏ nháp
        </Button>
      </div>
    </TornCard>
  );

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

  // Khung chung của mọi trạng thái (trừ đang tải): tiêu đề, thông báo mạng, nháp dở, hộp thoại bỏ nháp.
  // `wide`: nội dung là lưới Bento tràn bề ngang; các trạng thái còn lại giữ cột hẹp.
  const shell = (content: ReactNode, wide = false) => (
    <main className={MAIN_CLASS}>
      <PageTitle title="Ôn tập hôm nay" />
      <div className="space-y-8">
        {(!isOnline || syncNotice) && <div className="max-w-2xl space-y-2">{networkStatusNotice}</div>}
        {draftResumeCard && <div className="max-w-2xl">{draftResumeCard}</div>}
        {discardDraftDialog}
        {wide ? content : <div className="max-w-2xl space-y-8">{content}</div>}
      </div>
    </main>
  );

  // Trạng thái đang tải
  if (loading) {
    return (
      <main className={MAIN_CLASS}>
        <PageTitle title="Ôn tập hôm nay" />
        <div className="max-w-2xl space-y-8">
          <Skeleton className="h-56 w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  // Trạng thái: Người học mới, chưa từng có mục ôn nào
  if (!queue.hasAnyReviewItem && totalCount === 0 && queue.learnedLessons.length === 0) {
    return shell(
      <>
        <h2 className="font-serif text-2xl font-semibold text-foreground">Chưa có gì để ôn</h2>
        <div className="space-y-2">
          <ListRow
            href="/hoc"
            icon={<FeatureIcon name="lesson" />}
            title="Bắt đầu học bài"
            detail="Khám phá các bài học Minna no Nihongo N5"
          />
        </div>
      </>,
    );
  }

  // Trạng thái: Đã đạt hạn mức mục mới hôm nay
  if (totalCount === 0 && queue.limitReached) {
    return shell(
      <>
        <div className="text-center">
          <Illustration
            asset={REVIEW_COMPLETE_ART}
            sizes="(min-width: 640px) 224px, 192px"
            className="mx-auto size-48 object-contain sm:size-56"
          />
          <h2 className="mt-2 font-serif text-2xl font-semibold text-foreground">
            Đã đạt hạn mức mục mới hôm nay
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hạn mức: {queue.dailyNewLimit} mục mới mỗi ngày
          </p>
        </div>
        <div className="space-y-2">
          <ListRow
            href="/hoc"
            icon={<FeatureIcon name="lesson" />}
            title="Học bài mới"
            detail="Học thêm từ vựng và ngữ pháp mới"
          />
          <ListRow href="/" icon={<FeatureIcon name="home" />} title="Về Bảng tin" />
        </div>
        <ReinforcementSection weakCount={weakCount} />
      </>,
    );
  }

  // Trạng thái: Đã ôn xong hôm nay
  if (totalCount === 0) {
    const nextDueText = queue.dueTomorrowCount > 0
      ? `${queue.dueTomorrowCount} mục vào ngày mai`
      : 'ngày mai chưa có mục nào';

    return shell(
      <>
        <div className="text-center">
          <Illustration
            asset={REVIEW_COMPLETE_ART}
            sizes="(min-width: 640px) 224px, 192px"
            className="mx-auto size-48 object-contain sm:size-56"
          />
          <h2 className="mt-2 font-serif text-2xl font-semibold text-foreground">
            Hôm nay đã ôn xong
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Lượt tiếp theo: {nextDueText}</p>
        </div>
        <div className="space-y-2">
          <ListRow
            href="/hoc"
            icon={<FeatureIcon name="lesson" />}
            title="Học bài mới"
            detail="Tiếp tục học từ vựng và ngữ pháp"
          />
          <ListRow href="/" icon={<FeatureIcon name="home" />} title="Về Bảng tin" />
        </div>
        <ReinforcementSection weakCount={weakCount} />
      </>,
    );
  }

  // Trạng thái: Bị chặn (thiếu giọng Nhật hoặc thiếu câu hỏi hợp lệ)
  if (!canStart) {
    return shell(
      <>
        <div className="space-y-3">
          <h2 className="font-serif text-2xl font-semibold text-foreground">{dueSummaryText}</h2>
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
        <div className="space-y-2">
          {AUDIO_IMPORT_ENABLED && preview.excludedAudioCount > 0 && (
            <ListRow
              href="/cai-dat/audio"
              icon={<Volume2 />}
              title="Cài đặt âm thanh"
              detail="Thêm giọng tiếng Nhật để ôn câu nghe"
            />
          )}
          <ListRow href="/hoc" icon={<FeatureIcon name="lesson" />} title="Học bài khác" />
          <ListRow href="/" icon={<FeatureIcon name="home" />} title="Về Bảng tin" />
        </div>
        <ReinforcementSection weakCount={weakCount} />
      </>,
    );
  }

  // Dữ liệu cho trạng thái đến hạn ôn tập
  const breakdownText = TYPE_ORDER.filter((type) => (breakdown[type] ?? 0) > 0)
    .map((type) => `${breakdown[type]} ${TARGET_TYPE_LABEL[type].toLowerCase()}`)
    .join(' · ');

  const remainingBatchesText = describeRemainingBatches(queue.remainingDue, queue.reviewBatchSize);

  // Danh sách các mục trong lô hiện tại (xem trước 5 dòng ở mobile, 12 từ md)
  const batchItems = [
    ...queue.dueItems.map((item) => ({ targetId: item.targetId, dueAt: item.dueAt })),
    ...queue.newTargetIds.map((targetId) => ({ targetId, dueAt: null as Date | null })),
  ];
  const previewRows = batchItems.slice(0, PREVIEW_WIDE);
  const remainingMobile = Math.max(0, batchItems.length - PREVIEW_MOBILE);
  const remainingWide = Math.max(0, batchItems.length - PREVIEW_WIDE);

  return shell(
    <>
      <BentoGrid className="max-w-2xl md:max-w-none">
      <section aria-labelledby="review-today-heading" className="relative md:col-span-2 lg:col-span-7">
        <Accent kind="sprig-left" className="-right-5 -top-10 w-32" />
        <TornCard fill>
          <p
            id="review-today-heading"
            className="font-serif text-sm font-bold tracking-wide text-primary"
          >
            / Hôm nay /
          </p>
          <p className="mt-1.5 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            <span aria-hidden="true">{dueSummaryText}</span>
            <span className="sr-only">
              Hôm nay có {queue.totalDueCount} mục đến hạn ôn tập và {newCount} mục mới.
            </span>
          </p>
          {minutesEstimate !== null && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="size-4 shrink-0" aria-hidden="true" />
              khoảng {minutesEstimate} phút
            </p>
          )}
          {breakdownText && (
            <p className="mt-1 text-sm text-muted-foreground">{breakdownText}</p>
          )}

          {preview.excludedAudioCount > 0 && (
            <div
              role="status"
              className="mt-3 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-foreground"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
              <span>
                Tạm thời bỏ qua {preview.excludedAudioCount} câu nghe do thiết bị chưa có giọng tiếng Nhật (ja-JP).
                {AUDIO_IMPORT_ENABLED && (
                  <>
                    {' '}
                    <Link href="/cai-dat/audio" className="font-semibold underline underline-offset-2 hover:text-foreground">
                      Cài đặt âm thanh
                    </Link>
                  </>
                )}
              </span>
            </div>
          )}

          <Button
            size="quiz"
            variant={startAction.buttonVariant}
            className="mt-5 w-full font-semibold md:w-auto md:min-w-72"
            onClick={handleStartClick}
          >
            Bắt đầu ôn
            <ArrowRight aria-hidden="true" />
          </Button>

          {queue.remainingDue > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">{remainingBatchesText}</p>
          )}
        </TornCard>
      </section>

      <Tile as="section" span={5} full className="hidden md:block">
        <ForecastChart days={forecast} />
      </Tile>

      {/* Lô này: xem trước tối đa 5 mục của lô hiện tại (chỉ xem, không bấm) */}
      <section aria-labelledby="batch-preview-heading" className="md:col-span-2 lg:col-span-12">
        <SectionHeader id="batch-preview-heading" title="Lô này" />
        <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0 lg:grid-cols-3">
          {previewRows.map((row, index) => {
            const label = labels.get(row.targetId);
            const late = row.dueAt ? overdueDays(row.dueAt, queue.now) : 0;
            const type = targetTypeFromId(row.targetId);
            return (
              <li
                key={row.targetId}
                className={cn(
                  'flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 md:min-h-14 md:items-center md:py-2',
                  index >= PREVIEW_MOBILE && 'max-md:hidden',
                )}
              >
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-6"
                  aria-hidden="true"
                >
                  <FeatureIcon name={TYPE_ICON[type]} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="jp-vocab text-lg font-medium text-foreground">
                    {label ? (
                      <Furigana text={label.jp} />
                    ) : (
                      <span className="text-muted-foreground">{row.targetId}</span>
                    )}
                  </div>
                  {label?.vi && <p className="text-sm text-muted-foreground">{label.vi}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <TargetTypeBadge type={type} />
                  {late > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <AlarmClock className="size-3" aria-hidden="true" />
                      Quá hạn {late} ngày
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {remainingMobile > 0 && (
          <p className="mt-2 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-center text-sm text-muted-foreground md:hidden">
            và {remainingMobile} mục khác
          </p>
        )}
        {remainingWide > 0 && (
          <p className="mt-2 hidden rounded-xl border border-dashed border-border bg-secondary/50 px-4 py-3 text-center text-sm text-muted-foreground md:block">
            và {remainingWide} mục khác
          </p>
        )}
      </section>

      <div className="md:col-span-2 lg:col-span-12">
        <ReinforcementSection weakCount={weakCount} wide />
      </div>
      </BentoGrid>

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
    </>,
    true,
  );
}
