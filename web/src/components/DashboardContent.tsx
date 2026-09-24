'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useDueClock } from '@/lib/use-due-clock';
import { countLearnedByLesson, currentStreak } from '@/lib/stats';
import type { LessonSummary } from '@/lib/lessons';
import { SyncBadge } from '@/components/SyncBadge';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { ProgressBar } from '@/components/LessonProgress';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  RotateCcw,
  BookOpen,
  ArrowRight,
  Flame,
  Settings,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardContent({ summaries }: { summaries: LessonSummary[] }) {
  const now = useDueClock();

  // 1. Số mục đến hạn (FSRS)
  const dueCount = useLiveQuery(
    () => db.reviewItems.where('dueAt').belowOrEqual(now).count(),
    [now]
  );

  // 2. Lấy danh sách ID từ vựng đã học để tính tiến độ theo bài
  const vocabTargetIds = useLiveQuery(
    () => db.reviewItems.where('targetId').startsWith('vocab-').primaryKeys(),
    [],
    [] as string[]
  );
  const learnedByLesson = useMemo(
    () => countLearnedByLesson(vocabTargetIds ?? []),
    [vocabTargetIds]
  );

  // 3. Số nội dung cần củng cố (từng sai ít nhất 1 lần)
  const weakCount = useLiveQuery(
    () => db.reviewItems.filter((item) => item.incorrectCount > 0).count(),
    []
  ) ?? 0;

  // 4. Lịch sử phiên trong 90 ngày để tính Streak nhẹ nhàng (P2)
  const historyCutoff = useMemo(
    () => new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    [now]
  );
  const recentSessions = useLiveQuery(
    () => db.practiceSessions.where('createdAt').above(historyCutoff).reverse().sortBy('createdAt'),
    [historyCutoff]
  );
  const streak = useMemo(
    () => currentStreak(recentSessions ?? [], now),
    [recentSessions, now]
  );

  // 5. Xác định bài học hiện tại (đồng bộ chuẩn xác với LessonGrid / SPEC-03)
  const activeLessonInfo = useMemo(() => {
    let completed = 0;
    let inProgressLesson: number | null = null;

    for (const s of summaries) {
      const learned = learnedByLesson.get(s.number) ?? 0;
      if (s.vocabCount > 0 && learned >= s.vocabCount) {
        completed++;
      } else if (learned > 0 && inProgressLesson === null) {
        inProgressLesson = s.number;
      }
    }

    const activeLessonNum = inProgressLesson ?? (completed < 25 ? completed + 1 : 1);
    const activeSummary = summaries.find((s) => s.number === activeLessonNum) ?? summaries[0];
    const learnedInActive = learnedByLesson.get(activeLessonNum) ?? 0;
    const totalInActive = activeSummary.vocabCount;
    const isNewUser = (vocabTargetIds?.length ?? 0) === 0;
    return {
      activeLessonNum,
      activeSummary,
      learnedInActive,
      totalInActive,
      isNewUser,
    };
  }, [summaries, learnedByLesson, vocabTargetIds]);

  // Lời chào và định dạng ngày tháng
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const dateFormatted = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const {
    activeLessonNum,
    activeSummary,
    learnedInActive,
    totalInActive,
    isNewUser,
  } = activeLessonInfo;

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

          {/* Nhịp học P2: Tín hiệu chuỗi ngày nhẹ nhàng, không gây áp lực */}
          {streak.days > 0 && (
            <div className="pt-1.5 flex items-center gap-2">
              <div
                title={`Chuỗi ${streak.days} ngày học liên tục`}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 shadow-xs"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                <span>{streak.days} ngày liên tục</span>
              </div>
            </div>
          )}
        </div>

        {/* Lối vào thứ cấp cho Tìm kiếm, Tài khoản & Cài đặt (chỉ hiện trên Mobile/Tablet) */}
        <div className="flex items-center gap-2 pt-1 lg:hidden">
          <SearchTrigger iconOnly className="size-9 rounded-xl" />
          <SyncBadge className="h-9 px-2.5 rounded-xl text-xs shadow-2xs" />
          <Link
            href="/cai-dat"
            aria-label="Cài đặt và Tài khoản"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'gap-1.5 h-9 px-3 rounded-xl border-border/80'
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
      {dueCount === undefined ? (
        // Trạng thái chờ tải dữ liệu Dexie: Skeleton nhẹ chống chớp giao diện
        <Card className="p-6 border border-border/80 animate-pulse bg-card space-y-4">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-12 w-48 bg-muted rounded-xl" />
        </Card>
      ) : dueCount > 0 ? (
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
                Ôn tập các mục đến hạn
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl">
                Bạn có <strong className="text-foreground font-semibold">{dueCount}</strong> mục đến
                hạn ôn tập hôm nay theo lịch lặp lại ngắt quãng (FSRS). Ôn đều đặn giúp củng cố trí nhớ
                dài hạn.
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
                Bắt đầu ôn ({dueCount} mục)
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
        // TH2: dueCount = 0 -> HỢP NHẤT thành một thẻ duy nhất mang nút chính
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
                : `${activeSummary.description.vi}. Không có mục nào đến hạn ôn hôm nay, bạn có thể tiếp tục tiến độ bài học!`}
            </p>
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
