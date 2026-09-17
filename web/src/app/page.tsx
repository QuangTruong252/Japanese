'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { SyncBadge } from '@/components/SyncBadge';
import { Flame, Clock, Target, ArrowRight, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const now = new Date();

  // 1. Query các mục đến hạn ôn
  const dueItems = useLiveQuery(
    () => db.reviewItems.where('dueAt').belowOrEqual(now).toArray(),
    []
  );
  const dueCount = dueItems ? dueItems.length : 0;

  // 2. Query phiên học gần nhất
  const recentSessions = useLiveQuery(
    () => db.practiceSessions.orderBy('createdAt').reverse().limit(10).toArray(),
    []
  );

  // 3. Query 3 điểm yếu hàng đầu
  const weakItems = useLiveQuery(
    () => db.reviewItems.where('incorrectCount').above(0).sortBy('incorrectCount'),
    []
  );
  const topWeakItems = weakItems ? weakItems.reverse().slice(0, 3) : [];

  // Tính toán Streak và Phút học hôm nay
  const todayStr = now.toISOString().slice(0, 10);
  const todaySessions = recentSessions?.filter(
    (s) => s.createdAt.slice(0, 10) === todayStr
  ) || [];

  const todayMinutes = Math.round(
    todaySessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 60
  );

  // Tính độ chính xác 7 ngày gần nhất
  const sevenDaysAgoStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const pastWeekSessions = recentSessions?.filter((s) => s.createdAt >= sevenDaysAgoStr) || [];
  const totalQuestions7d = pastWeekSessions.reduce((acc, s) => acc + s.totalQuestions, 0);
  const correctCount7d = pastWeekSessions.reduce((acc, s) => acc + s.correctCount, 0);
  const accuracyRate7d =
    totalQuestions7d > 0 ? Math.round((correctCount7d / totalQuestions7d) * 100) : null;

  // Bài học gần nhất
  const lastLesson = recentSessions?.[0]?.selectedLessons?.[0] || 1;
  const hasHistory = (recentSessions && recentSessions.length > 0) || dueCount > 0;

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* 1. Thanh tiêu đề & trạng thái đồng bộ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Bảng tin học tập
          </h1>
          <p className="text-sm text-muted-foreground">
            Tiếp tục hành trình chinh phục tiếng Nhật của bạn
          </p>
        </div>
        <SyncBadge />
      </div>

      {/* 2. Banner Hành động chính (Duy nhất 1 Primary Action) */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              {dueCount > 0 ? 'Cần ôn tập hôm nay' : hasHistory ? 'Đã hoàn thành mục tiêu ngày' : 'Bắt đầu hành trình'}
            </span>
            <h2 className="text-xl font-bold text-foreground">
              {dueCount > 0
                ? `${dueCount} mục đang chờ bạn ôn tập`
                : hasHistory
                ? 'Tuyệt vời! Không còn bài nào quá hạn'
                : 'Khởi đầu với Bài 1: Giới thiệu bản thân'}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              {dueCount > 0
                ? 'Ôn tập đúng lúc theo thuật toán ngắt quãng FSRS giúp ghi nhớ từ vựng và mẫu câu lâu dài mà không bị quá tải.'
                : hasHistory
                ? 'Bạn đã hoàn tất toàn bộ mục ôn tập hôm nay. Có thể tiếp tục học bài mới hoặc luyện tập thêm.'
                : 'Làm quen với cấu trúc câu tiếng Nhật, từ vựng và ngữ pháp cơ bản của Bài 1 giáo trình Minna no Nihongo.'}
            </p>
          </div>

          <div className="w-full sm:w-auto shrink-0">
            {dueCount > 0 ? (
              <Link
                href="/on-tap"
                className={cn(
                  buttonVariants({ size: 'quiz' }),
                  'w-full sm:w-auto px-6 font-semibold flex items-center justify-center gap-2'
                )}
              >
                <span>Ôn tập ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : hasHistory ? (
              <Link
                href={`/hoc/${lastLesson}`}
                className={cn(
                  buttonVariants({ size: 'quiz' }),
                  'w-full sm:w-auto px-6 font-semibold flex items-center justify-center gap-2'
                )}
              >
                <span>Học tiếp bài {lastLesson}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/hoc/1"
                className={cn(
                  buttonVariants({ size: 'quiz' }),
                  'w-full sm:w-auto px-6 font-semibold flex items-center justify-center gap-2'
                )}
              >
                <span>Bắt đầu Bài 1</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Hàng 3 ô số liệu: Streak, Phút học hôm nay, % đúng 7 ngày */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Chuỗi học tập</p>
              <p className="text-2xl font-bold text-foreground">
                {hasHistory ? '1 ngày' : '0 ngày'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Thời gian học hôm nay</p>
              <p className="text-2xl font-bold text-foreground">
                {hasHistory ? `${todayMinutes} phút` : '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Độ chính xác (7 ngày)</p>
              <p className="text-2xl font-bold text-foreground">
                {accuracyRate7d !== null ? `${accuracyRate7d}%` : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Khối nội dung dưới: Bài học đang dở & 3 điểm yếu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thẻ: Bài học đang dở */}
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Bài học đang dở</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between pt-0 space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-1">
              <span className="text-xs font-semibold text-primary">Bài {lastLesson}</span>
              <p className="text-base font-semibold text-foreground">
                {lastLesson === 1 ? 'Giới thiệu bản thân' : `Bài học ${lastLesson}`}
              </p>
              <p className="text-xs text-muted-foreground">
                Minna no Nihongo I · Từ vựng & ngữ pháp
              </p>
            </div>

            <Link
              href={`/hoc/${lastLesson}`}
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-between')}
            >
              <span>Xem chi tiết bài học</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>

        {/* Thẻ: 3 điểm yếu hàng đầu */}
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Điểm yếu cần củng cố</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between pt-0 space-y-4">
            {topWeakItems.length > 0 ? (
              <div className="space-y-2">
                {topWeakItems.map((item) => (
                  <div
                    key={item.targetId}
                    className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-sm"
                  >
                    <span className="font-medium jp">{item.targetId}</span>
                    <span className="text-xs text-destructive font-semibold">
                      Sai {item.incorrectCount} lần
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-muted/30 border border-dashed border-border flex flex-col items-center justify-center text-center space-y-2 flex-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/80" />
                <p className="text-sm font-medium text-foreground">Chưa có điểm yếu nào</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Hệ thống sẽ tự động ghi nhận các từ vựng hoặc ngữ pháp bạn trả lời sai trong quá trình làm bài để giúp bạn ôn tập trọng điểm.
                </p>
              </div>
            )}

            <Link
              href="/on-tap"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'w-full justify-between text-xs text-muted-foreground hover:text-foreground'
              )}
            >
              <span>Xem tất cả điểm yếu</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
