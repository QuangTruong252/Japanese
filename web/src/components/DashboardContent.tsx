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
import { ProgressBar } from '@/components/LessonProgress';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Play,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Sunrise,
  Sun,
  Moon,
  Download,
  HelpCircle,
  ChevronDown,
  Clock,
  BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Furigana } from '@/components/Furigana';
import { Illustration } from '@/components/Illustration';
import { DashboardReinforcement } from '@/components/DashboardReinforcement';
import { formatOptionalBrackets } from '@/lib/japanese';

export function DashboardContent({ summaries }: { summaries: LessonSummary[] }) {
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

  // Số nội dung cần củng cố (từng sai ít nhất 1 lần)
  const weakCount = useLiveQuery(
    () => db.reviewItems.filter((item) => item.incorrectCount > 0).count(),
    []
  ) ?? 0;

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
  const totalInActive = activeSummary.vocabCount;
  const isNewUser =
    !queue.hasAnyReviewItem && (vocabTargetIds?.length ?? 0) === 0 && learnedThroughLesson === 0;

  // Nháp dở dang dạng hàng hiển thị; nháp Luyện/Ôn đứng trước vì đang dở giữa một phiên câu hỏi
  const draftRows = [
    drafts.practiceDraft && {
      key: 'practice',
      title:
        drafts.practiceDraft.label +
        (drafts.practiceDraft.label === 'Luyện tập' && drafts.practiceDraft.selectedLessons?.length
          ? ` · Bài ${drafts.practiceDraft.selectedLessons.join(', ')}`
          : ''),
      detail: `Đang ở câu ${drafts.practiceDraft.currentQuestionIndex}/${drafts.practiceDraft.totalQuestions}`,
      href: drafts.practiceDraft.resumeHref,
      onClick: clearNewSessionRequest,
    },
    drafts.vocabDraft && {
      key: 'vocab',
      title: `Học từ vựng · Bài ${drafts.vocabDraft.lesson}`,
      detail: `Đang ở từ ${drafts.vocabDraft.currentWordIndex}/${drafts.vocabDraft.totalWords}`,
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
  const newCount = queue.newTargetIds.length;

  // Lời chào và định dạng ngày tháng
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const dateFormatted = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const GreetingIcon = hour < 12 ? Sunrise : hour < 18 ? Sun : Moon;
  const heading = ctaDecision.isPrimaryReview ? 'Hôm nay ôn một chút'
    : isResume ? 'Tiếp tục từ nơi bạn dừng' : isNewUser ? 'Bắt đầu một nhịp học mới' : 'Học tiếp theo nhịp của bạn';

  return (
    <main className="mx-auto w-full max-w-[1440px]">
      <header className="relative">
        <div className="flex items-start gap-3 px-5 pb-2 pt-4 sm:px-8 lg:absolute lg:left-6 lg:top-5 lg:z-10 lg:rounded-xl lg:bg-background/95 lg:p-3">
          <GreetingIcon className="mt-1 size-7 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xl font-bold tracking-tight sm:text-2xl">{greeting}</p>
            <p className="mt-1 text-sm text-muted-foreground">{dateFormatted}</p>
          </div>
        </div>
        <Illustration
          asset={{ src: '/assets/illustrations/ui/banners/paper-town-v1.webp', width: 1200, height: 400, alt: { vi: '' } }}
          sizes="(min-width: 1696px) 1440px, (min-width: 1024px) calc(100vw - 256px), 100vw"
          className="paper-panorama h-44 w-full object-cover sm:h-64 lg:h-80 xl:h-96" eager
        />
      </header>

      <div className="grid gap-8 px-5 pb-8 pt-3 sm:px-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-8 lg:px-10 lg:pt-5 xl:gap-10">
        <div className="min-w-0">
          {queue.loading ? (
            <section aria-label="Đang tải việc học hôm nay" className="flex flex-col gap-4 py-4">
              <Skeleton className="h-10 w-3/4" /><Skeleton className="h-5 w-1/2" /><Skeleton className="h-14 w-full max-w-md" />
            </section>
          ) : (
            <section aria-labelledby="next-action-heading" className="flex flex-col gap-4">
              <div>
                <h1 id="next-action-heading" className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl xl:text-5xl">{heading}</h1>
                {ctaDecision.isPrimaryReview ? (
                  <>
                    <p lang="ja" className="jp mt-1 text-2xl font-bold text-muted-foreground xl:text-4xl">少しずつ</p>
                    <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                      {[queue.totalDueCount > 0 && `${queue.totalDueCount} mục đến hạn`, newCount > 0 && `${newCount} mục mới`].filter(Boolean).join(' · ')}
                      {minutesEstimate !== null && <> · khoảng {minutesEstimate} phút</>}
                      {queue.remainingDue > 0 && <> · còn {queue.remainingDue} mục cho lô sau</>}
                    </p>
                  </>
                ) : isResume && primaryDraft ? (
                  <p className="mt-3 text-sm text-muted-foreground">{primaryDraft.title} · {primaryDraft.detail}</p>
                ) : (
                  <div className="mt-3">
                    <p className="text-base font-semibold">Bài {activeLessonNum} · {activeSummary.title.vi}</p>
                    {activeSummary.jpTitle && <Furigana text={formatOptionalBrackets(activeSummary.jpTitle)} className="mt-1 text-2xl font-bold" />}
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{activeSummary.description.vi}</p>
                  </div>
                )}
              </div>
              {queue.hasAnyReviewItem && !ctaDecision.isPrimaryReview && (
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  <span>Đã ôn xong các mục đến hạn. {queue.dueTomorrowCount > 0 ? `Ngày mai có ${queue.dueTomorrowCount} mục.` : 'Ngày mai chưa có mục nào đến hạn.'}</span>
                </p>
              )}
              <Link href={ctaDecision.href} onClick={isResume ? primaryDraft?.onClick : undefined}
                className={cn(buttonVariants({ size: 'quiz' }), 'h-14 w-full gap-3 text-base font-semibold sm:max-w-md sm:text-lg')}>
                {ctaDecision.isPrimaryReview ? <Play className="fill-current" aria-hidden="true" /> : <BookOpen aria-hidden="true" />}
                {ctaDecision.ctaText}<ArrowRight aria-hidden="true" />
              </Link>
              {isNewUser && !isResume && (
                <Link href="/cai-dat#hoc-den-bai" className="inline-flex min-h-11 w-fit items-center text-sm font-medium text-primary underline-offset-4 hover:underline">Tôi đã học đến bài…</Link>
              )}
            </section>
          )}
          {secondaryDrafts.length > 0 && (
            <section aria-label="Tiếp tục phiên dở dang" className="mt-5 flex flex-col divide-y divide-border border-y border-border">
              {secondaryDrafts.map(row => (
                <Link key={row.key} href={row.href} onClick={row.onClick} className="flex min-h-20 items-center gap-3 rounded-lg py-3 outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring">
                  <Clock className="size-6 shrink-0" aria-hidden="true" />
                  <div className="min-w-0 flex-1"><p className="text-base font-semibold">Tiếp tục phiên</p><p className="mt-1 text-sm text-muted-foreground">{row.title} · {row.detail}</p></div>
                  <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
                </Link>
              ))}
            </section>
          )}
          {ctaDecision.isPrimaryReview ? (
            <section aria-label="Bài đang học" className="mt-5 flex items-start gap-4 border-t border-border pt-5">
              <span className="hidden text-8xl font-bold leading-none tracking-tight text-muted-foreground/30 xl:block" aria-hidden="true">{String(activeLessonNum).padStart(2, '0')}</span>
              {activeLessonNum === 1 && (
                <Illustration asset={{ src: '/assets/illustrations/scenes/self-introduction-v1.webp', width: 800, height: 600, alt: { vi: '' } }}
                  sizes="96px" className="h-32 w-24 shrink-0 rounded-xl object-cover xl:hidden" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Bài {activeLessonNum}</p>
                {activeSummary.jpTitle && <Furigana text={formatOptionalBrackets(activeSummary.jpTitle)} className="text-xl font-bold sm:text-2xl" />}
                <h2 className="mt-1 text-base font-semibold">{activeSummary.title.vi}</h2>
                <div className="mt-3"><ProgressBar learned={learnedInActive} total={totalInActive} /></div>
                <Link href={`/hoc/${activeLessonNum}`} className={cn(buttonVariants({ variant: 'outline', size: 'quiz' }), 'mt-3 w-full gap-2 border-primary text-primary sm:w-auto')}>Vào bài học <ArrowRight aria-hidden="true" /></Link>
              </div>
            </section>
          ) : !isNewUser && (
            <div className="mt-5 border-t border-border pt-4"><ProgressBar learned={learnedInActive} total={totalInActive} /></div>
          )}
        </div>
        <aside aria-label="Nội dung bổ trợ" className="flex min-w-0 flex-col gap-4 lg:border-l lg:border-border lg:pl-6 xl:pl-8">
          {weakCount > 0 && (
            <section aria-labelledby="reinforce-heading" className="flex flex-col gap-4 rounded-xl bg-muted/60 p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="reinforce-heading" className="text-lg font-bold">Nội dung cần củng cố</h2><span className="text-sm text-muted-foreground">{weakCount} nội dung</span></div>
              <DashboardReinforcement />
              <Link href="/on-tap/diem-yeu" className={cn(buttonVariants({ variant: 'outline', size: 'quiz' }), 'w-full gap-2 border-primary text-primary')}>Xem và luyện lại <ChevronRight aria-hidden="true" /></Link>
            </section>
          )}
          <Link href="/hoc/tra-cuu/kana" className="flex min-h-20 items-center gap-4 rounded-xl bg-muted/60 px-5 py-4 text-base font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring">
            <BookOpen className="size-6 shrink-0" aria-hidden="true" /><span className="flex-1">Bảng chữ Kana</span><ChevronRight className="size-5" aria-hidden="true" />
          </Link>
          <Link href="/ca-nhan" className="flex min-h-14 items-center gap-3 rounded-xl bg-muted/60 px-5 py-3 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring">
            <BarChart2 className="size-5 shrink-0" aria-hidden="true" /><span className="flex-1">Xem tiến độ trên máy</span><ChevronRight className="size-5" aria-hidden="true" />
          </Link>
          <Link href="/cai-dat#heading-data" className="flex min-h-14 items-center gap-3 rounded-xl px-5 py-3 text-sm text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring">
            <Download className="size-5 shrink-0" aria-hidden="true" /><span className="flex-1">Dữ liệu & sao lưu</span><ChevronRight className="size-5" aria-hidden="true" />
          </Link>
          <p className="border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">Học tiếng Nhật theo nhịp của bạn.</p>
        </aside>
      </div>
      <details className="group mx-5 mb-8 border-t border-border pt-4 sm:mx-8 lg:mx-10">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring">
          <span className="flex items-center gap-2"><HelpCircle className="size-4 shrink-0" aria-hidden="true" />Chọn Học bài, Luyện tập hay Ôn tập?</span><ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="flex max-w-2xl flex-col gap-2 pb-4 pt-3 text-sm leading-relaxed text-muted-foreground">
          <p><strong className="text-foreground">Học bài:</strong> gặp từ vựng và mẫu câu mới theo thứ tự giáo trình.</p>
          <p><strong className="text-foreground">Luyện tập:</strong> chủ động làm bài theo những bài bạn chọn.</p>
          <p><strong className="text-foreground">Ôn tập:</strong> nhắc lại kiến thức theo lịch ôn của bạn.</p>
        </div>
      </details>
    </main>
  );
}
