'use client';

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useDueQueue } from '@/lib/use-due-queue';
import { countLearnedByLesson, pickActiveLesson, secondsPerQuestion } from '@/lib/stats';
import { DEFAULT_SETTINGS, getSettingsSnapshot, subscribeSettings } from '@/lib/settings';
import type { LessonSummary } from '@/lib/lessons';
import { SyncBadge } from '@/components/SyncBadge';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { ProgressBar } from '@/components/LessonProgress';
import { ThemeToggle } from '@/components/ThemeToggle';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  RotateCcw,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Settings,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardContent({ summaries }: { summaries: LessonSummary[] }) {
  // Cùng hook với /on-tap để hai màn luôn ra một con số (SPEC-02 §3.2).
  const queue = useDueQueue();
  const now = queue.now;
  const { learnedThroughLesson } = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    () => DEFAULT_SETTINGS,
  );
  const batchCount = queue.sessionTargetIds.size;

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

  // Lời chào và định dạng ngày tháng
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const dateFormatted = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });


  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* ========================================================
          1. Header: Lời chào + Lối vào Tài khoản & Cài đặt (< lg)
          ======================================================== */}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground capitalize">
            {dateFormatted}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {greeting}
          </h1>

        </div>

        {/* Lối vào thứ cấp cho Tìm kiếm, Tài khoản, Chủ đề & Cài đặt */}
        <div className="flex items-center gap-2 pt-1">
          <SearchTrigger iconOnly className="size-9 rounded-xl lg:hidden" />
          <SyncBadge className="h-9 px-2.5 rounded-xl text-xs shadow-2xs lg:hidden" />
          <ThemeToggle className="size-9 rounded-xl" />
          <Link
            href="/cai-dat"
            aria-label="Cài đặt và Tài khoản"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'gap-1.5 h-9 px-3 rounded-xl border-border/80 lg:hidden'
            )}
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span className="hidden sm:inline text-xs font-medium">Cài đặt</span>
          </Link>
        </div>
      </header>

      {/* ========================================================
          2. Khối P0 Hành động chính & Bài đang học (Luật hợp nhất)
          ======================================================== */}
      {queue.loading ? (
        // Trạng thái chờ tải dữ liệu Dexie: Skeleton nhẹ chống chớp giao diện
        <Card className="p-6 border border-border/80 animate-pulse bg-card space-y-4">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-12 w-48 bg-muted rounded-xl" />
        </Card>
      ) : batchCount > 0 ? (
        // TH1: Có mục đến hạn -> Ôn tập là P0, Bài đang học là P1 bên dưới
        <div className="space-y-4">
          {/* Card P0: Bắt đầu ôn tập */}
          <Card className="border-2 border-primary/30 bg-card shadow-sm p-6 sm:p-8 space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Việc nên làm tiếp theo</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Ôn tập
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl">
                <strong className="text-foreground font-semibold">{batchCount} mục</strong>
                {minutesEstimate !== null && <> · khoảng {minutesEstimate} phút</>}
                {queue.remainingDue > 0 && <> · còn {queue.remainingDue} mục đến hạn cho lô sau</>}
              </p>
            </div>

            <div>
              <Link
                href="/on-tap"
                className={cn(
                  buttonVariants({ size: 'quiz' }),
                  'w-full sm:w-auto font-semibold text-base shadow-sm'
                )}
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Bắt đầu ôn
              </Link>
            </div>
          </Card>

          {/* Card P1: Bài đang học */}
          <Card className="border border-border/80 bg-card p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Bài đang học
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Bài {activeLessonNum}: {activeSummary.title.vi}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {activeSummary.description.vi}
                </p>
              </div>

              <Link
                href={`/hoc/${activeLessonNum}`}
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'h-10 px-4 rounded-xl shrink-0 self-start sm:self-auto font-medium'
                )}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Vào bài học
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>

            <div className="pt-1">
              <ProgressBar learned={learnedInActive} total={totalInActive} />
            </div>
          </Card>
        </div>
      ) : (
        // TH2: lô ôn = 0 -> HỢP NHẤT thành một thẻ duy nhất mang nút chính
        <Card className="border-2 border-primary/20 bg-card shadow-sm p-6 sm:p-8 space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Việc nên làm tiếp theo</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {isNewUser
                ? 'Bắt đầu bài 1: Giới thiệu bản thân'
                : `Bài đang học: Bài ${activeLessonNum} — ${activeSummary.title.vi}`}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              {isNewUser
                ? 'Chào mừng bạn đến với MaiPace! Hãy bắt đầu bài học đầu tiên với từ vựng, ngữ pháp và mẫu câu giao tiếp cơ bản.'
                : activeSummary.description.vi}
            </p>
            {queue.hasAnyReviewItem && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
                <span>
                  Đã ôn xong các mục đến hạn.{' '}
                  {queue.dueTomorrowCount > 0
                    ? `Ngày mai có ${queue.dueTomorrowCount} mục.`
                    : 'Ngày mai chưa có mục nào đến hạn.'}
                </span>
              </p>
            )}
          </div>

          {!isNewUser && (
            <div className="max-w-md pt-1">
              <ProgressBar learned={learnedInActive} total={totalInActive} />
            </div>
          )}

          <div>
            <Link
              href={`/hoc/${activeLessonNum}`}
              className={cn(
                buttonVariants({ size: 'quiz' }),
                'w-full sm:w-auto font-semibold text-base shadow-sm'
              )}
            >
              <BookOpen className="w-5 h-5 mr-2" />
              {isNewUser ? 'Bắt đầu bài 1' : `Học tiếp bài ${activeLessonNum}`}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            {isNewUser && (
              <Link
                href="/cai-dat#hoc-den-bai"
                className="mt-3 inline-flex min-h-12 items-center text-sm font-medium text-primary underline-offset-4 hover:underline sm:mt-0 sm:ml-4"
              >
                Tôi đã học đến bài…
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* ========================================================
          3. Khối P1: Cần củng cố (Ẩn hoàn toàn nếu weakCount = 0)
          ======================================================== */}
      {weakCount > 0 && (
        <Card className="border border-border/80 bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <AlertCircle className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="font-semibold text-sm sm:text-base text-foreground">
                {weakCount} nội dung cần củng cố
              </div>
              <p className="text-xs text-muted-foreground">
                Các từ vựng hoặc điểm ngữ pháp bạn từng trả lời sai trong các phiên trước.
              </p>
            </div>
          </div>

          <Link
            href="/on-tap/diem-yeu"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'shrink-0 self-start sm:self-auto rounded-xl font-medium'
            )}
          >
            Xem và luyện lại
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </Card>
      )}
    </main>
  );
}
