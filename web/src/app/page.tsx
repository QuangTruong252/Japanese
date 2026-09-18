'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { DailyKanji } from '@/components/DailyKanji';
import { TargetTypeBadge } from '@/components/review/TargetTypeBadge';
import {
  Flame,
  Clock,
  Target,
  BookOpen,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { accuracyOverDays, currentStreak, minutesOnDay, countLearnedByLesson } from '@/lib/stats';
import { useDueClock } from '@/lib/use-due-clock';
import { targetTypeFromId } from '@/lib/practice';

export default function DashboardPage() {
  const now = useDueClock();

  // 1. Query các mục đến hạn ôn (FSRS)
  const dueItems = useLiveQuery(
    () => db.reviewItems.where('dueAt').belowOrEqual(now).toArray(),
    [now]
  );
  const dueCount = dueItems ? dueItems.length : 0;

  // 2. Query lịch sử phiên trong 90 ngày
  const historyCutoff = useMemo(
    () => new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    [now]
  );
  const recentSessions = useLiveQuery(
    () => db.practiceSessions.where('createdAt').above(historyCutoff).reverse().sortBy('createdAt'),
    [historyCutoff]
  );

  // 3. Query 3 điểm yếu hàng đầu
  const weakItems = useLiveQuery(async () => {
    const items = await db.reviewItems
      .filter((item) => item.incorrectCount > 0)
      .toArray();
    return items.sort((a, b) => b.incorrectCount - a.incorrectCount).slice(0, 3);
  }, []);
  const topWeakItems = weakItems ?? [];

  // 4. Query tổng từ vựng đã học
  const vocabTargetIds = useLiveQuery(
    () => db.reviewItems.where('targetId').startsWith('vocab-').primaryKeys(),
    [],
    [] as string[]
  );
  const learnedCount = vocabTargetIds.length;
  const learnedByLesson = useMemo(() => countLearnedByLesson(vocabTargetIds), [vocabTargetIds]);

  // Số liệu tính bằng src/lib/stats.ts
  const sessions = recentSessions ?? [];
  const streak = currentStreak(sessions, now);
  const todayMinutes = minutesOnDay(sessions, now);
  const accuracyRate7d = accuracyOverDays(sessions, 7, now);

  // Bài học đang học dở hoặc gần nhất
  const lastLesson = recentSessions?.[0]?.selectedLessons?.[0] || 1;
  const learnedInActiveLesson = learnedByLesson.get(lastLesson) ?? 0;
  // Ước tính trung bình 35 từ/bài cho Minna N5
  const estimatedLessonTotal = 35;
  const activeLessonProgress = Math.min(100, Math.round((learnedInActiveLesson / estimatedLessonTotal) * 100));

  // Lời chào theo giờ địa phương
  const hour = now.getHours();
  const greetingTime = hour < 12 ? 'buổi sáng' : hour < 18 ? 'buổi chiều' : 'buổi tối';

  // Định dạng ngày tháng
  const dateStr = useMemo(() => {
    return now.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [now]);

  // Phân loại thẻ đến hạn theo dạng
  const dueBreakdown = useMemo(() => {
    if (!dueItems) return { vocab: 0, grammar: 0, other: 0 };
    let vocab = 0;
    let grammar = 0;
    let other = 0;
    for (const item of dueItems) {
      if (item.targetType === 'vocab') vocab++;
      else if (item.targetType === 'grammar') grammar++;
      else other++;
    }
    return { vocab, grammar, other };
  }, [dueItems]);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
      {/* 1. Hero Greeting Banner (Đầu trang thoáng đãng, không Top Header cố định) */}
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Minna no Nihongo N5 · Khóa học cơ bản</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
              Chào {greetingTime}, Hoàng Nam! 🎌
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="font-jp text-primary font-medium">「七転び八起き」</span> — Ngã bảy lần, đứng dậy tám lần. Chúc bạn một ngày học tập hứng khởi!
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Hôm nay
            </span>
            <div className="text-sm font-semibold text-foreground capitalize">
              {dateStr}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Hàng 4 Thẻ Bento Metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Chuỗi học tập */}
        <Card className="rounded-2xl border-border/80 bg-card shadow-sm hover:border-primary/40 transition-colors">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Chuỗi học tập
              </span>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {streak.days} <span className="text-sm font-normal text-muted-foreground">ngày</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {streak.days > 0 ? 'Duy trì phong độ đều đặn!' : 'Bắt đầu bài học hôm nay!'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Thời gian học hôm nay */}
        <Card className="rounded-2xl border-border/80 bg-card shadow-sm hover:border-primary/40 transition-colors">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Thời gian hôm nay
              </span>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {todayMinutes} <span className="text-sm font-normal text-muted-foreground">/ 30 phút</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((todayMinutes / 30) * 100))}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Tỷ lệ nhớ FSRS */}
        <Card className="rounded-2xl border-border/80 bg-card shadow-sm hover:border-primary/40 transition-colors">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tỷ lệ nhớ 7 ngày
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {accuracyRate7d !== null ? `${accuracyRate7d}%` : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {accuracyRate7d !== null && accuracyRate7d >= 85
                  ? 'Ghi nhớ dài hạn ổn định'
                  : 'Theo chu kỳ lặp ngắt quãng'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Từ vựng tích lũy N5 */}
        <Card className="rounded-2xl border-border/80 bg-card shadow-sm hover:border-primary/40 transition-colors">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Từ vựng N5
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {learnedCount} <span className="text-sm font-normal text-muted-foreground">/ 650 từ</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((learnedCount / 650) * 100)}% toàn bộ từ vựng N5
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. Cặp Thẻ Trọng Tâm: Bài Đang Học Dở & Hàng Đợi Ôn Tập SRS (Quy tắc nút động 1A) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Thẻ Bài đang học dở (7 Cột) */}
        <Card className="lg:col-span-7 rounded-2xl border-border/80 bg-card shadow-sm flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary/80" />
          <CardContent className="p-6 sm:p-7 space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Bài đang học dở dang
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Bài {lastLesson} / 25
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Bài {lastLesson}: Minna no Nihongo
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Tiếp tục rèn luyện từ vựng mới và các mẫu câu ngữ pháp trọng điểm của bài.
                </p>
              </div>

              {/* Thống kê nhỏ trong bài */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60 text-xs">
                  <span className="text-muted-foreground block text-[11px]">Từ vựng đã nắm</span>
                  <span className="font-bold text-foreground text-sm">{learnedInActiveLesson} từ</span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60 text-xs">
                  <span className="text-muted-foreground block text-[11px]">Tiến trình bài</span>
                  <span className="font-bold text-foreground text-sm">{activeLessonProgress}%</span>
                </div>
                <div className="hidden sm:block p-2.5 rounded-xl bg-muted/50 border border-border/60 text-xs">
                  <span className="text-muted-foreground block text-[11px]">Ngữ pháp</span>
                  <span className="font-bold text-foreground text-sm">4 mẫu câu</span>
                </div>
              </div>

              {/* Progress Bar bài học */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(8, activeLessonProgress)}%` }}
                />
              </div>
            </div>

            {/* CTA Nút học tiếp: Secondary nếu có bài ôn, Primary nếu hết bài ôn (Quyết định 1A) */}
            <div className="pt-2">
              <Link
                href={`/hoc/${lastLesson}`}
                className={cn(
                  buttonVariants({
                    variant: dueCount > 0 ? 'outline' : 'default',
                    size: 'lg',
                  }),
                  'w-full sm:w-auto px-6 font-semibold flex items-center justify-center gap-2 rounded-xl',
                  dueCount === 0 && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                <span>Học tiếp bài {lastLesson}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Thẻ Hàng đợi Ôn tập SRS (5 Cột) */}
        <Card className={cn(
          'lg:col-span-5 rounded-2xl border-border/80 bg-card shadow-sm flex flex-col justify-between overflow-hidden relative',
          dueCount > 0 ? 'border-primary/30' : 'bg-muted/20'
        )}>
          {dueCount > 0 && <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />}
          <CardContent className="p-6 sm:p-7 space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-primary" />
                  <span>Ôn tập ngắt quãng FSRS</span>
                </span>
                {dueCount > 0 && (
                  <span className="text-xs font-bold text-destructive-foreground bg-destructive px-2 py-0.5 rounded-full">
                    {dueCount} đến hạn
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  {dueCount > 0
                    ? `${dueCount} mục cần bạn ôn tập`
                    : 'Đã hoàn tất mục tiêu hôm nay!'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {dueCount > 0
                    ? 'Ôn tập đúng chu kỳ FSRS giúp chuyển kiến thức vào vùng trí nhớ dài hạn bền vững.'
                    : 'Không còn mục nào quá hạn. Bạn có thể học bài mới hoặc nghỉ ngơi để não bộ củng cố kiến thức.'}
                </p>
              </div>

              {/* Phân loại các mục đến hạn */}
              {dueCount > 0 ? (
                <div className="space-y-2 pt-1 text-xs">
                  {dueBreakdown.vocab > 0 && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-muted/60 border border-border/60">
                      <span className="text-muted-foreground font-medium">Từ vựng (Vocabulary)</span>
                      <span className="font-bold text-foreground">{dueBreakdown.vocab} thẻ</span>
                    </div>
                  )}
                  {dueBreakdown.grammar > 0 && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-muted/60 border border-border/60">
                      <span className="text-muted-foreground font-medium">Mẫu ngữ pháp (Bunpou)</span>
                      <span className="font-bold text-foreground">{dueBreakdown.grammar} thẻ</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Toàn bộ thẻ ôn tập đều đang ở trạng thái tối ưu</span>
                </div>
              )}
            </div>

            {/* CTA Nút Ôn tập: Primary nếu có bài ôn, Secondary/Ghost nếu 0 mục (Quyết định 1A) */}
            <div className="pt-2">
              {dueCount > 0 ? (
                <Link
                  href="/on-tap"
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'w-full font-semibold flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20'
                  )}
                >
                  <Zap className="w-4 h-4 fill-primary-foreground" />
                  <span>Bắt đầu phiên ôn ({dueCount} mục)</span>
                </Link>
              ) : (
                <Link
                  href="/on-tap"
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'lg' }),
                    'w-full font-medium flex items-center justify-center gap-2 rounded-xl text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>Xem hàng đợi ôn tập</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 4. Khối thứ hai: Widget Kanji Hôm Nay & Điểm Yếu Cần Củng Cố */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Widget Kanji hôm nay (5 Cột) */}
        <div className="lg:col-span-5 flex flex-col">
          <DailyKanji />
        </div>

        {/* Điểm yếu cần củng cố (7 Cột) */}
        <Card className="lg:col-span-7 rounded-2xl border-border/80 bg-card shadow-sm flex flex-col justify-between">
          <CardContent className="p-6 sm:p-7 space-y-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <AlertCircle className="w-3.5 h-3.5 text-primary" />
                  <span className="uppercase tracking-wider">Điểm yếu cần củng cố</span>
                </div>
                <Link
                  href="/on-tap/diem-yeu"
                  className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span>Xem tất cả</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <p className="text-xs text-muted-foreground mt-1">
                Tự động nhận diện các từ vựng và cấu trúc bạn hay làm sai nhất:
              </p>

              <div className="space-y-2.5 mt-3">
                {topWeakItems.length === 0 ? (
                  <div className="p-4 rounded-xl bg-muted/40 text-center text-xs text-muted-foreground">
                    Chưa ghi nhận lỗi sai nào — các bài tập của bạn đều đạt kết quả chính xác!
                  </div>
                ) : (
                  topWeakItems.map((item) => (
                    <div
                      key={item.targetId}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/70 transition-colors"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <TargetTypeBadge type={targetTypeFromId(item.targetId)} />
                          <span className="text-sm font-semibold text-foreground truncate">
                            {item.targetId.replace(/^(vocab|grammar|kanji)-/, '')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Bài {item.lesson} · Đã sai {item.incorrectCount} lần
                        </p>
                      </div>

                      <Link
                        href={`/luyen-tap?lesson=${item.lesson}`}
                        className={cn(
                          buttonVariants({ variant: 'outline', size: 'sm' }),
                          'text-xs font-medium shrink-0 rounded-lg hover:border-primary hover:text-primary'
                        )}
                      >
                        Luyện lại
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60">
              <span>Gợi ý: Dành 5 phút luyện lại các mục sai để sửa phản xạ</span>
              <Link href="/on-tap/diem-yeu" className="font-semibold text-primary hover:underline">
                Chi tiết lỗi →
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
