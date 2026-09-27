'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useDueClock } from '@/lib/use-due-clock';
import { loadLessonSummaries, type LessonSummary } from '@/lib/lessons';
import { loadSettings } from '@/lib/settings';
import { countLearnedByLesson, pickActiveLesson, resolveSyncBadgeState } from '@/lib/stats';
import {
  getSyncStatusSnapshot,
  getServerSyncStatusSnapshot,
  signInWithGoogle,
  signOut,
  subscribeSyncStatus,
  triggerSync,
} from '@/lib/sync';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import {
  BookOpen,
  CheckCircle2,
  Clock,
  CloudCheck,
  CloudOff,
  CloudUpload,
  Dumbbell,
  Layers,
  LogOut,
  RefreshCw,
  RotateCcw,
  Sparkles,
  TriangleAlert,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthUser {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function CaNhanPage() {
  const now = useDueClock();

  // 1. Dữ liệu tiến độ từ Dexie
  const sessions = useLiveQuery(() => db.practiceSessions.toArray());
  const reviewItems = useLiveQuery(() => db.reviewItems.toArray());
  const dexiePendingCount = useLiveQuery(() => db.pendingSync.count()) ?? 0;

  // Số mục đến hạn ôn tập
  const dueCount = useLiveQuery(
    () => db.reviewItems.where('dueAt').belowOrEqual(now).count(),
    [now]
  ) ?? 0;

  // Danh sách tóm tắt 25 bài N5
  const [summaries, setSummaries] = useState<LessonSummary[]>([]);
  useEffect(() => {
    let active = true;
    loadLessonSummaries().then((data) => {
      if (active) setSummaries(data);
    });
    return () => {
      active = false;
    };
  }, []);

  // 2. Trạng thái Auth & Supabase
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const syncEngineStatus = useSyncExternalStore(
    subscribeSyncStatus,
    getSyncStatusSnapshot,
    getServerSyncStatusSnapshot,
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsCheckingSession(false);
      return;
    }
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setCurrentUser({
            id: user.id,
            email: user.email,
            displayName:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0],
            avatarUrl: user.user_metadata?.avatar_url,
          });
        }
        setIsCheckingSession(false);
      }).catch(() => {
        setIsCheckingSession(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email,
            displayName:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split('@')[0],
            avatarUrl: session.user.user_metadata?.avatar_url,
          });
          triggerSync();
        } else {
          setCurrentUser(null);
        }
        setIsCheckingSession(false);
      });

      return () => subscription.unsubscribe();
    } catch {
      setIsCheckingSession(false);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setNotification({
        type: 'error',
        message: `Đăng nhập không thành công: ${error.message}`,
      });
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      setCurrentUser(null);
      setLogoutConfirmOpen(false);
      setNotification({
        type: 'success',
        message: 'Đã đăng xuất. Dữ liệu trên máy vẫn được giữ nguyên.',
      });
    }
  };

  // Tính số lượng mục chờ đồng bộ thực tế
  const totalPending = Math.max(dexiePendingCount, syncEngineStatus.pendingCount);

  const syncResolution = resolveSyncBadgeState({
    pendingCount: totalPending,
    isLoggedIn: Boolean(currentUser),
    engineState: syncEngineStatus.state,
  });

  // 3. Phân tích tiến độ học tập bài
  const settings = loadSettings();
  const learnedThroughLesson = settings.learnedThroughLesson ?? 0;

  const learnedByLesson = useMemo(() => {
    if (!reviewItems) return new Map<number, number>();
    const targetIds = reviewItems.map((item) => item.targetId);
    return countLearnedByLesson(targetIds);
  }, [reviewItems]);

  const activeLessonNum = useMemo(() => {
    if (summaries.length === 0) return 1;
    return pickActiveLesson(summaries, learnedByLesson, learnedThroughLesson);
  }, [summaries, learnedByLesson, learnedThroughLesson]);

  const activeSummary = useMemo(() => {
    return summaries.find((s) => s.number === activeLessonNum) ?? summaries[0];
  }, [summaries, activeLessonNum]);

  const learnedInActive = learnedByLesson.get(activeLessonNum) ?? 0;
  const totalInActive = activeSummary?.vocabCount ?? 0;
  const activePercent = totalInActive > 0 ? Math.min(100, Math.round((learnedInActive / totalInActive) * 100)) : 0;

  // Đếm số bài đã hoàn thành
  const completedLessonsCount = useMemo(() => {
    if (summaries.length === 0) return 0;
    return summaries.filter((s) => {
      if (s.number <= learnedThroughLesson) return true;
      const learned = learnedByLesson.get(s.number) ?? 0;
      return s.vocabCount > 0 && learned >= s.vocabCount;
    }).length;
  }, [summaries, learnedThroughLesson, learnedByLesson]);

  // Kiểm tra nếu người dùng chưa có bất kỳ dữ liệu nào
  const isGuestEmpty =
    !currentUser &&
    (sessions?.length ?? 0) === 0 &&
    (reviewItems?.length ?? 0) === 0 &&
    learnedThroughLesson === 0;

  const isLoadingData = sessions === undefined || reviewItems === undefined || summaries.length === 0;

  if (isLoadingData) {
    return (
      <div className="space-y-6 animate-pulse">
        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-72 mb-4" />
          <Skeleton className="h-10 w-40" />
        </Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Thông báo thao tác */}
      {notification && (
        <div
          role={notification.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={cn(
            'flex items-center justify-between gap-3 rounded-xl border p-4 text-sm transition',
            notification.type === 'success'
              ? 'border-success/30 bg-success/10 text-success-foreground'
              : 'border-destructive/30 bg-destructive/10 text-destructive',
          )}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs font-semibold hover:underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* ========================================================
          1. THẺ TÀI KHOẢN & ĐỒNG BỘ
          ======================================================== */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="font-heading text-lg font-semibold text-foreground">
                Tài khoản & Đồng bộ
              </CardTitle>
              <CardDescription>
                {currentUser
                  ? 'Đồng bộ tiến độ an toàn giữa các thiết bị với Supabase.'
                  : 'Tiến độ học tập luôn được lưu trữ an toàn trên thiết bị này.'}
              </CardDescription>
            </div>

            {/* Trạng thái Sync Badge */}
            <div className="self-start sm:self-auto">
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border select-none',
                  syncResolution.state === 'synced' && 'bg-success/10 text-success border-success/20',
                  syncResolution.state === 'pending' && 'bg-warning/10 text-warning border-warning/20',
                  syncResolution.state === 'syncing' && 'bg-warning/10 text-warning border-warning/20 animate-pulse',
                  (syncResolution.state === 'offline' || syncResolution.state === 'unconfigured') &&
                    'bg-muted text-muted-foreground border-border'
                )}
              >
                {syncResolution.state === 'synced' && <CloudCheck className="size-3.5 shrink-0" />}
                {(syncResolution.state === 'pending' || syncResolution.state === 'syncing') && (
                  <CloudUpload className={cn('size-3.5 shrink-0', syncResolution.state === 'syncing' && 'animate-spin')} />
                )}
                {(syncResolution.state === 'offline' || syncResolution.state === 'unconfigured') && (
                  <CloudOff className="size-3.5 shrink-0" />
                )}
                <span>{syncResolution.label}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          {isCheckingSession ? (
            <div className="flex items-center gap-3 py-2">
              <Skeleton className="size-11 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-60" />
              </div>
            </div>
          ) : !isSupabaseConfigured() ? (
            <div className="rounded-xl bg-muted/40 p-4 border border-border/60 space-y-1">
              <p className="text-sm font-medium text-foreground">
                Đồng bộ chưa khả dụng trên bản này
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ứng dụng đang hoạt động ở chế độ lưu máy (offline-first). Toàn bộ dữ liệu bài học, lịch ôn và thống kê vẫn được bảo toàn trọn vẹn trong trình duyệt của bạn.
              </p>
            </div>
          ) : !currentUser ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-border/60">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Tiến độ trên máy này
                  </p>
                  <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                    Đăng nhập bằng tài khoản Google để đồng bộ tiến độ học sang điện thoại hoặc máy tính khác bất cứ lúc nào.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="quiz"
                  onClick={handleGoogleSignIn}
                  disabled={isLoggingIn}
                  className="gap-2.5 min-h-[48px] px-5 shrink-0 cursor-pointer shadow-xs"
                >
                  <GoogleIcon className="size-4 shrink-0" />
                  <span>{isLoggingIn ? 'Đang kết nối…' : 'Đăng nhập bằng Google'}</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border/60">
              <div className="flex items-center gap-3.5">
                {currentUser.avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName || 'Avatar'}
                    className="size-11 rounded-full border border-border object-cover shrink-0"
                  />
                ) : (
                  <div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium shrink-0">
                    <User className="size-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {currentUser.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 min-h-[40px] px-3.5 cursor-pointer"
                  onClick={() => triggerSync()}
                  disabled={syncEngineStatus.state === 'syncing'}
                >
                  <RefreshCw
                    className={cn(
                      'size-3.5',
                      syncEngineStatus.state === 'syncing' && 'animate-spin',
                    )}
                  />
                  <span>
                    {syncEngineStatus.state === 'syncing' ? 'Đang đồng bộ…' : 'Đồng bộ ngay'}
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 min-h-[40px] px-3.5 cursor-pointer hover:text-destructive hover:border-destructive/40"
                  onClick={() => setLogoutConfirmOpen(true)}
                >
                  <LogOut className="size-3.5" />
                  <span>Đăng xuất</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================
          2. TIẾN ĐỘ HỌC TẬP CỤC BỘ TRÊN MÁY
          ======================================================== */}
      {isGuestEmpty ? (
        <Card className="border-dashed py-12 px-6 text-center">
          <CardContent className="max-w-md mx-auto space-y-4 p-0">
            <div className="size-14 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="size-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-foreground">
                Tiến độ bằng 0
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bạn chưa bắt đầu bài học nào trên thiết bị này. Bắt đầu ngay với Bài 1 để khám phá từ vựng và ngữ pháp tiếng Nhật cơ bản!
              </p>
            </div>
            <div className="pt-2">
              <Link href="/hoc/1">
                <Button size="quiz" className="gap-2 min-h-[48px] px-6 cursor-pointer">
                  <Sparkles className="size-4" />
                  <span>Bắt đầu Bài 1</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Card Bài đang học */}
          <Card className="relative overflow-hidden border-primary/20 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    Bài đang học
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Minna no Nihongo N5
                  </span>
                </div>
                <span className="text-xs font-semibold text-primary">
                  {activePercent}% hoàn thành
                </span>
              </div>
              <CardTitle className="font-heading text-xl font-bold text-foreground mt-1">
                Bài {activeLessonNum}: {activeSummary?.title.vi}
              </CardTitle>
              {activeSummary?.jpTitle && (
                <p className="font-jp text-xs text-muted-foreground">
                  {activeSummary.jpTitle}
                </p>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Progress value={activePercent} className="h-2.5" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{learnedInActive}/{totalInActive} từ vựng đã học</span>
                  <span>{Math.max(0, totalInActive - learnedInActive)} từ còn lại</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <p className="text-xs text-muted-foreground">
                  {learnedInActive === 0
                    ? 'Chưa học từ vựng nào trong bài này.'
                    : learnedInActive >= totalInActive
                      ? 'Đã học xong toàn bộ từ vựng của bài!'
                      : 'Đang học dở dang, tiếp tục để hoàn thành bài.'}
                </p>
                <Link href={`/hoc/${activeLessonNum}`} className="self-start sm:self-auto">
                  <Button size="quiz" className="gap-2 min-h-[48px] px-5 cursor-pointer">
                    <BookOpen className="size-4" />
                    <span>Tiếp tục học Bài {activeLessonNum}</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Hàng 4 Stat Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Tile 1: Mục trong lịch ôn */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-4 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium uppercase tracking-wider">Lịch ôn tập</span>
                  <Layers className="size-4 text-[hsl(var(--chart-4))]" />
                </div>
                <div className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {reviewItems?.length.toLocaleString('vi-VN') ?? 0}
                  <span className="text-sm font-normal text-muted-foreground ml-1.5">mục</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  Đã nạp vào FSRS
                </p>
              </CardContent>
            </Card>

            {/* Tile 2: Cần ôn hôm nay */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-4 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium uppercase tracking-wider">Đến hạn ôn</span>
                  <RotateCcw className="size-4 text-[hsl(var(--chart-1))]" />
                </div>
                <div className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {dueCount}
                  <span className="text-sm font-normal text-muted-foreground ml-1.5">mục</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {dueCount > 0 ? (
                    <Link href="/on-tap" className="text-primary hover:underline font-medium">
                      Ôn tập ngay →
                    </Link>
                  ) : (
                    'Đã ôn hết hôm nay'
                  )}
                </p>
              </CardContent>
            </Card>

            {/* Tile 3: Bài đã hoàn thành */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-4 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium uppercase tracking-wider">Hoàn thành</span>
                  <CheckCircle2 className="size-4 text-[hsl(var(--chart-2))]" />
                </div>
                <div className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {completedLessonsCount}
                  <span className="text-sm font-normal text-muted-foreground ml-1.5">/ 25 bài</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {completedLessonsCount === 25 ? 'Đã hoàn thành N5!' : 'Tiến trình N5'}
                </p>
              </CardContent>
            </Card>

            {/* Tile 4: Phiên đã luyện */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-4 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium uppercase tracking-wider">Phiên luyện</span>
                  <Dumbbell className="size-4 text-[hsl(var(--chart-3))]" />
                </div>
                <div className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {sessions?.length.toLocaleString('vi-VN') ?? 0}
                  <span className="text-sm font-normal text-muted-foreground ml-1.5">phiên</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  Luyện tập tổng cộng
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================
          3. HỘP THOẠI XÁC NHẬN ĐĂNG XUẤT (SPEC-08)
          ======================================================== */}
      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              {totalPending > 0 && <TriangleAlert className="size-5 text-warning shrink-0" />}
              <span>Xác nhận đăng xuất</span>
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground pt-1">
                <p>
                  Bạn có chắc chắn muốn đăng xuất khỏi tài khoản <strong>{currentUser?.email}</strong>?
                </p>
                {totalPending > 0 ? (
                  <div className="rounded-lg bg-warning/10 border border-warning/20 p-3 text-xs text-warning-foreground space-y-1">
                    <p className="font-semibold text-warning">
                      Bạn có {totalPending} mục chưa đồng bộ lên máy chủ!
                    </p>
                    <p>
                      Các mục này sẽ được lưu an toàn trên máy và chỉ được đẩy lên khi bạn đăng nhập lại đúng tài khoản này trên thiết bị này.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs">
                    Toàn bộ tiến độ học tập trên máy này vẫn được bảo toàn nguyên vẹn sau khi đăng xuất.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              Đăng xuất
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
