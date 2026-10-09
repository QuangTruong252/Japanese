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
import { TornCard, SectionHeader, ListRow } from '@/components/PaperKit';
import { FeatureIcon } from '@/components/FeatureIcon';
import { Furigana } from '@/components/Furigana';
import { StatTile } from '@/components/stats/StatTile';
import { Button, buttonVariants } from '@/components/ui/button';
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
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CloudCheck,
  CloudOff,
  CloudUpload,
  LogOut,
  RefreshCw,
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

function SyncIcon({ state }: { state: string }) {
  if (state === 'synced') return <CloudCheck className="size-3.5 shrink-0 text-success" aria-hidden="true" />;
  if (state === 'pending' || state === 'syncing')
    return (
      <CloudUpload
        className={cn('size-3.5 shrink-0 text-warning', state === 'syncing' && 'animate-spin')}
        aria-hidden="true"
      />
    );
  return <CloudOff className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />;
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
  const [isCheckingSession, setIsCheckingSession] = useState(isSupabaseConfigured);
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
    if (!isSupabaseConfigured()) return;
    // Chỉ đọc session cục bộ: onAuthStateChange phát INITIAL_SESSION ngay khi đăng ký.
    const supabase = createClient();
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
      } else {
        setCurrentUser(null);
      }
      setIsCheckingSession(false);
    });
    return () => subscription.unsubscribe();
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
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <Skeleton className="h-56 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const accountBlock = 'rounded-xl border border-border bg-card p-4';

  return (
    <div className="space-y-8">
      {notification && (
        <div
          role={notification.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={cn(
            'flex items-start gap-3 rounded-xl border bg-card p-4 text-sm',
            notification.type === 'success' ? 'border-border text-foreground' : 'border-destructive/40 text-destructive',
          )}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          ) : (
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          )}
          <span className="min-w-0 flex-1">{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="-my-2 -mr-2 min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold text-foreground outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring"
          >
            Đóng
          </button>
        </div>
      )}

      {isGuestEmpty ? (
        <TornCard className="space-y-4 text-center">
          <h2 className="font-serif text-xl font-semibold text-foreground">Chưa có tiến độ</h2>
          <Link
            href="/hoc/1"
            className={cn(buttonVariants({ size: 'quiz' }), 'w-full font-semibold sm:w-auto sm:px-6')}
          >
            Bắt đầu Bài 1
            <ArrowRight aria-hidden="true" />
          </Link>
        </TornCard>
      ) : (
        <>
          <section aria-labelledby="progress-active-heading" className="space-y-3">
            <TornCard>
              <p id="progress-active-heading" className="font-serif text-sm font-bold tracking-wide text-primary">
                / Bài đang học /
              </p>
              <p className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-muted-foreground">
                <BookOpen className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Bài {activeLessonNum} · {activeSummary?.title.vi}
              </p>
              {activeSummary?.jpTitle && (
                <Furigana
                  text={activeSummary.jpTitle}
                  className="jp-display mt-3 block text-2xl font-bold text-foreground sm:text-3xl"
                />
              )}
              <div className="mt-4">
                <Progress value={activePercent} className="gap-0" aria-label={`Bài ${activeLessonNum}: ${activePercent}% từ vựng đã học`} />
                <p className="mt-2 text-sm text-muted-foreground tabular-nums">
                  {learnedInActive}/{totalInActive} từ · {activePercent}%
                </p>
              </div>
              <Link
                href={`/hoc/${activeLessonNum}`}
                className={cn(buttonVariants({ size: 'quiz' }), 'mt-5 w-full font-semibold')}
              >
                Tiếp tục học Bài {activeLessonNum}
                <ArrowRight aria-hidden="true" />
              </Link>
            </TornCard>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Lịch ôn tập" value={(reviewItems?.length ?? 0).toLocaleString('vi-VN')} unit="mục" />
              <StatTile label="Đến hạn ôn" value={dueCount.toLocaleString('vi-VN')} unit="mục" />
              <StatTile label="Hoàn thành" value={completedLessonsCount} unit="/ 25 bài" />
              <StatTile label="Phiên luyện" value={(sessions?.length ?? 0).toLocaleString('vi-VN')} unit="phiên" />
            </div>

            {dueCount > 0 && (
              <ListRow
                href="/on-tap"
                icon={<FeatureIcon name="review" />}
                title="Ôn tập ngay"
                detail={`${dueCount} mục đến hạn`}
              />
            )}
          </section>
        </>
      )}

      <section aria-labelledby="account-heading">
        <SectionHeader id="account-heading" title="Tài khoản" />
        <div className={accountBlock}>
          {isCheckingSession ? (
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ) : currentUser ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {currentUser.avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentUser.avatarUrl}
                    alt=""
                    className="size-11 shrink-0 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <User className="size-5" aria-hidden="true" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="break-words font-medium text-foreground">{currentUser.displayName}</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <SyncIcon state={syncResolution.state} />
                    <span className="min-w-0">{syncResolution.label}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 flex-1 gap-1.5 px-3.5"
                  onClick={() => triggerSync()}
                  disabled={syncEngineStatus.state === 'syncing'}
                >
                  <RefreshCw
                    className={cn('size-4', syncEngineStatus.state === 'syncing' && 'animate-spin')}
                    aria-hidden="true"
                  />
                  {syncEngineStatus.state === 'syncing' ? 'Đang đồng bộ…' : 'Đồng bộ ngay'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 gap-1.5 px-3.5 text-muted-foreground hover:text-destructive"
                  onClick={() => setLogoutConfirmOpen(true)}
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Đăng xuất
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"
                  aria-hidden="true"
                >
                  <CloudOff className="size-5" />
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="font-medium text-foreground">Chỉ lưu trên máy</p>
                  {!isSupabaseConfigured() && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Bản này chưa cấu hình đồng bộ (Supabase) nên chưa đăng nhập được. Tiến độ vẫn lưu an toàn trên máy.
                    </p>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="quiz"
                onClick={handleGoogleSignIn}
                disabled={isLoggingIn || !isSupabaseConfigured()}
                className="w-full gap-2.5 px-5"
              >
                <GoogleIcon className="size-4 shrink-0" />
                {isLoggingIn ? 'Đang kết nối…' : 'Đăng nhập bằng Google'}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          3. HỘP THOẠI XÁC NHẬN ĐĂNG XUẤT
          ======================================================== */}
      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              {totalPending > 0 && <TriangleAlert className="size-5 text-warning shrink-0" />}
              <span>Xác nhận đăng xuất</span>
            </AlertDialogTitle>
            <AlertDialogDescription render={<div />}>
              <div className="space-y-3 text-sm text-muted-foreground pt-1">
                <p>
                  Bạn có chắc chắn muốn đăng xuất khỏi tài khoản <strong>{currentUser?.email}</strong>?
                </p>
                {totalPending > 0 ? (
                  <div className="rounded-lg bg-warning/10 border border-warning/20 p-3 text-xs text-foreground space-y-1">
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
