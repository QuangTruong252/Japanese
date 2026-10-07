'use client';

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useDueQueue } from '@/lib/use-due-queue';
import { countLearnedByLesson, pickActiveLesson, secondsPerQuestion } from '@/lib/stats';
import { DEFAULT_SETTINGS, getSettingsSnapshot, subscribeSettings } from '@/lib/settings';
import { useActiveDrafts } from '@/lib/active-drafts';
import { clearNewSessionRequest } from '@/lib/practice-draft';
import { resolveDashboardCta } from '@/lib/dashboard-cta';
import type { LessonSummary } from '@/lib/lessons';
import { Stage, PaperSlip, LinkRow } from '@/components/PaperStage';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Play, BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Furigana } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { stripFurigana, toKanaSentence } from '@/lib/japanese';
import { pickTodaySentence, type TodaySentenceItem } from '@/lib/today-sentence';

export function DashboardContent({
  summaries,
  lessonExamples = {},
}: {
  summaries: LessonSummary[];
  lessonExamples?: Record<number, TodaySentenceItem[]>;
}) {
  // Cùng hook với /on-tap để hai màn luôn ra một con số (SPEC-02 §3.2, SPEC-18 §2).
  const queue = useDueQueue();
  const now = queue.now;
  const { learnedThroughLesson } = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    () => DEFAULT_SETTINGS,
  );
  const batchCount = queue.sessionTargetIds.size;

  // Lắng nghe cả nháp học từ vựng và nháp luyện tập (SPEC-18 §3, §5)
  const drafts = useActiveDrafts();

  // Tiến độ theo bài: danh sách ID từ vựng đã vào lịch ôn
  const vocabTargetIds = useLiveQuery(
    () => db.reviewItems.where('targetId').startsWith('vocab-').primaryKeys(),
    [],
    [] as string[]
  );
  const learnedByLesson = useMemo(
    () => countLearnedByLesson(vocabTargetIds ?? []),
    [vocabTargetIds]
  );

  // Thời gian thật mỗi câu từ các phiên gần đây, để ước lượng số phút của lô ôn
  const recentSessions = useLiveQuery(
    () => db.practiceSessions.orderBy('createdAt').reverse().limit(20).toArray(),
    []
  );
  const minutesEstimate = useMemo(() => {
    const spq = secondsPerQuestion(recentSessions ?? []);
    return spq === null ? null : Math.max(1, Math.round((batchCount * spq) / 60));
  }, [recentSessions, batchCount]);

  // Bài đang học — cùng logic với /hoc (pickActiveLesson)
  const activeLessonNum = pickActiveLesson(summaries, learnedByLesson, learnedThroughLesson);
  const activeSummary = summaries.find((s) => s.number === activeLessonNum) ?? summaries[0];
  const learnedInActive = learnedByLesson.get(activeLessonNum) ?? 0;
  const totalInActive = activeSummary?.vocabCount ?? 0;
  const isNewUser =
    !queue.hasAnyReviewItem && (vocabTargetIds?.length ?? 0) === 0 && learnedThroughLesson === 0;

  // Nháp dở dang dạng hàng hiển thị; nháp Luyện/Ôn đứng trước vì đang dở giữa một phiên câu hỏi
  const draftRows = [
    drafts.practiceDraft && {
      key: 'practice',
      title:
        drafts.practiceDraft.label +
        (drafts.practiceDraft.label === 'Luyện tập' && drafts.practiceDraft.selectedLessons?.length
          ? ` Bài ${drafts.practiceDraft.selectedLessons.join(', ')}`
          : ''),
      detail: `câu ${drafts.practiceDraft.currentQuestionIndex}/${drafts.practiceDraft.totalQuestions}`,
      href: drafts.practiceDraft.resumeHref,
      onClick: clearNewSessionRequest,
    },
    drafts.vocabDraft && {
      key: 'vocab',
      title: `Học từ vựng Bài ${drafts.vocabDraft.lesson}`,
      detail: `từ ${drafts.vocabDraft.currentWordIndex}/${drafts.vocabDraft.totalWords}`,
      href: drafts.vocabDraft.resumeHref,
      onClick: undefined,
    },
  ].filter((row) => !!row);
  const primaryDraft = draftRows[0] ?? null;

  // Quyết định CTA chính theo helper thuần (SPEC-18 §3, §6)
  const ctaDecision = resolveDashboardCta({
    batchCount,
    isNewUser,
    activeLessonNum,
    activeLessonTitle: activeSummary?.title?.vi,
    resumeDraft: primaryDraft && { href: primaryDraft.href, heading: primaryDraft.title },
    hasPracticeDraft: drafts.practiceDraft !== null,
  });
  const isResume = ctaDecision.kind === 'resume_draft';
  const secondaryDrafts = isResume ? draftRows.slice(1) : draftRows;

  // Lời chào một dòng trên giấy
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  // Cảnh bìa của bài đang học (fallback về bài 1)
  const coverAsset =
    activeSummary?.cover ??
    summaries[0]?.cover ?? {
      src: '/assets/illustrations/scenes/self-introduction-v1.webp',
      width: 800,
      height: 600,
      alt: { vi: '' },
    };

  // Câu hôm nay: ví dụ ngữ pháp cố định trong ngày của bài đang học
  const todaySentence = useMemo(
    () => pickTodaySentence(lessonExamples[activeLessonNum], now, activeLessonNum),
    [lessonExamples, now, activeLessonNum]
  );

  if (queue.loading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-3 sm:px-6 lg:px-8">
        <header className="mb-3 sm:mb-4">
          <Skeleton className="h-5 w-32" />
        </header>
        <div className="grid grid-cols-1 items-start gap-y-0 xl:grid-cols-12 xl:gap-8">
          <div className="xl:col-span-7">
            <Skeleton className="h-56 w-full rounded-xl sm:h-64 md:h-72" />
          </div>
          <div className="flex flex-col gap-4 xl:col-span-5">
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="flex flex-col gap-2 pt-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Tổng hợp mục đến hạn và mục mới cho khối ôn tập (Finding 12 / D1)
  const dueSummaryText = [
    queue.totalDueCount > 0 ? `${queue.totalDueCount} mục đến hạn` : null,
    queue.newTargetIds.length > 0 ? `${queue.newTargetIds.length} mục mới` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  // Quyết định các dòng LinkRow phụ hiển thị dưới PaperSlip
  const showDraftRows = ctaDecision.kind === 'review' ? draftRows : secondaryDrafts;
  const showLessonRow =
    !isNewUser && (ctaDecision.kind === 'review' || ctaDecision.kind === 'resume_draft');
  const showDoneTodayRow = !isNewUser && queue.hasAnyReviewItem && ctaDecision.kind !== 'review';

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-3 sm:px-6 lg:px-8">
      {/* 1. Một dòng chào nhỏ trên giấy */}
      <header className="mb-3 sm:mb-4">
        <h1 className="text-sm font-medium text-muted-foreground">{greeting}</h1>
      </header>

      {/* Bố cục: mobile xếp dọc; 1280px chia 7/12 (stage) và 5/12 (slip + rows) */}
      <div className="grid grid-cols-1 items-start gap-y-0 xl:grid-cols-12 xl:gap-8">
        {/* Sân khấu bên trái ở 1280px (7/12) */}
        <div className="xl:col-span-7">
          <Stage
            asset={coverAsset}
            sizes="(min-width: 1280px) 672px, 100vw"
            eager
            imageClassName="h-56 sm:h-64 md:h-72 w-full object-cover object-top"
            className="w-full"
          />
          {/* 3. "Câu hôm nay": bong bóng thoại trong normal flow trực tiếp dưới cảnh */}
          {todaySentence && (
            <div className="relative mt-2 rounded-xl border border-border bg-card p-3 sm:p-4">
              {/* Đuôi bong bóng thoại hướng lên nhân vật trên cảnh */}
              <div
                className="absolute -top-1.5 left-8 size-3 rotate-45 border-l border-t border-border bg-card"
                aria-hidden="true"
              />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Furigana
                    text={todaySentence.jp}
                    className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
                  />
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                    {todaySentence.vi}
                  </p>
                </div>
                <div className="shrink-0">
                  <SpeakButton
                    text={todaySentence.kana || toKanaSentence(todaySentence.jp)}
                    label={stripFurigana(todaySentence.jp)}
                    iconClassName="size-4"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mảnh giấy và các dòng liên kết bên phải ở 1280px (5/12) */}
        <div className="flex flex-col gap-4 xl:col-span-5">
          {/* 4. Mảnh giấy chỉ chứa khối khẩn cấp nhất + một nút son duy nhất */}
          <PaperSlip className={cn(todaySentence ? 'mt-3 xl:mt-0' : 'xl:mt-0')}>
            {ctaDecision.kind === 'review' ? (
              <div className="flex flex-col gap-3">
                <div className="space-y-0.5">
                  <p className="text-base font-semibold">
                    {dueSummaryText || (batchCount > 0 ? `${batchCount} mục ôn tập` : 'Ôn tập')}
                  </p>
                  {minutesEstimate !== null && (
                    <p className="text-sm text-muted-foreground">
                      khoảng {minutesEstimate} phút
                    </p>
                  )}
                </div>
                <Link
                  href={ctaDecision.href}
                  className={cn(buttonVariants({ size: 'quiz' }), 'w-full gap-2 text-base font-semibold')}
                >
                  <Play className="size-5 fill-current" aria-hidden="true" />
                  {ctaDecision.ctaText}
                </Link>
              </div>
            ) : ctaDecision.kind === 'resume_draft' && primaryDraft ? (
              <div className="flex flex-col gap-3">
                <p className="text-base font-semibold">
                  {primaryDraft.title} · {primaryDraft.detail}
                </p>
                <Link
                  href={primaryDraft.href}
                  onClick={primaryDraft.onClick}
                  className={cn(buttonVariants({ size: 'quiz' }), 'w-full gap-2 text-base font-semibold')}
                >
                  <Play className="size-5 fill-current" aria-hidden="true" />
                  {ctaDecision.ctaText}
                </Link>
              </div>
            ) : ctaDecision.kind === 'start_first_lesson' ? (
              <div className="flex flex-col gap-3">
                <p className="text-base font-semibold">
                  Bài 1 · {activeSummary.title.vi}
                </p>
                <Link
                  href="/hoc/1"
                  className={cn(buttonVariants({ size: 'quiz' }), 'w-full gap-2 text-base font-semibold')}
                >
                  <BookOpen className="size-5" aria-hidden="true" />
                  {ctaDecision.ctaText}
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-base font-semibold">
                  Bài {activeLessonNum} · {activeSummary.title.vi} · {learnedInActive}/{totalInActive} từ
                </p>
                <Progress
                  value={learnedInActive}
                  max={Math.max(1, totalInActive)}
                  aria-label={`Tiến độ từ vựng Bài ${activeLessonNum}`}
                  aria-valuetext={`${learnedInActive} trên ${totalInActive} từ đã vào lịch ôn`}
                  className="w-full"
                />
                <Link
                  href={ctaDecision.href}
                  className={cn(buttonVariants({ size: 'quiz' }), 'w-full gap-2 text-base font-semibold')}
                >
                  <BookOpen className="size-5" aria-hidden="true" />
                  {ctaDecision.ctaText}
                </Link>
              </div>
            )}
          </PaperSlip>

          {/* 5. Các khối còn lại dưới dạng LinkRow, mỗi khối đúng 1 link */}
          {(showDraftRows.length > 0 || showLessonRow || showDoneTodayRow) && (
            <div className="divide-y divide-border border-b border-border">
              {/* Phiên dở dang */}
              {showDraftRows.map((row) => (
                <LinkRow
                  key={row.key}
                  href={row.href}
                  onClick={row.onClick}
                  icon={<Clock />}
                  title={`Phiên dở · ${row.title} · ${row.detail}`}
                />
              ))}

              {/* Bài đang học */}
              {showLessonRow && (
                <LinkRow
                  href={`/hoc/${activeLessonNum}`}
                  icon={<BookOpen />}
                  title={`Bài ${activeLessonNum} · ${activeSummary.title.vi} · ${learnedInActive}/${totalInActive} từ`}
                >
                  <div className="mt-2">
                    <Progress
                      value={learnedInActive}
                      max={Math.max(1, totalInActive)}
                      aria-label={`Tiến độ từ vựng Bài ${activeLessonNum}`}
                      aria-valuetext={`${learnedInActive} trên ${totalInActive} từ đã vào lịch ôn`}
                      className="w-full"
                    />
                  </div>
                </LinkRow>
              )}

              {/* Ôn tập khi không khẩn cấp (đã ôn xong) */}
              {showDoneTodayRow && (
                <LinkRow
                  href="/on-tap"
                  icon={<CheckCircle2 className="text-success" />}
                  title={
                    queue.dueTomorrowCount > 0
                      ? `Hôm nay đã ôn xong · lượt tiếp theo ngày mai (${queue.dueTomorrowCount} mục)`
                      : 'Hôm nay đã ôn xong · ngày mai chưa có mục nào'
                  }
                />
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
