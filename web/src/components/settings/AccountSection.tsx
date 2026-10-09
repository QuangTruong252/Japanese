'use client';

import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import { CloudOff, LogOut, RefreshCw, User } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { SectionHeader } from '@/components/PaperKit';
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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/db';
import { resolveSyncBadgeState } from '@/lib/stats';
import {
  getSyncStatusSnapshot,
  getServerSyncStatusSnapshot,
  signInWithGoogle,
  signOut,
  subscribeSyncStatus,
  triggerSync,
} from '@/lib/sync';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { GoogleIcon } from './GoogleIcon';
import { SettingsGroup } from './SettingRow';

export type SettingsNotice = { type: 'success' | 'error'; message: string };

interface AuthUser {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}

/** Mục Tài khoản & Đồng bộ: trạng thái đăng nhập Supabase, đồng bộ thủ công, đăng xuất. */
export function AccountSection({ onNotify }: { onNotify: (notice: SettingsNotice) => void }) {
  const headingId = useId();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(isSupabaseConfigured);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const syncEngineStatus = useSyncExternalStore(
    subscribeSyncStatus,
    getSyncStatusSnapshot,
    getServerSyncStatusSnapshot,
  );

  const dexiePendingCount = useLiveQuery(() => db.pendingSync.count(), []) ?? 0;
  const syncResolution = resolveSyncBadgeState({
    pendingCount: Math.max(dexiePendingCount, syncEngineStatus.pendingCount),
    isLoggedIn: currentUser !== null,
    engineState: syncEngineStatus.state,
  });

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
      onNotify({
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
      onNotify({
        type: 'success',
        message: 'Đã đăng xuất. Dữ liệu trên máy vẫn được giữ nguyên.',
      });
    }
  };

  return (
    <section aria-labelledby={headingId} id="heading-account" className="scroll-mt-24">
      <SectionHeader id={headingId} title="Tài khoản & Đồng bộ" />
      <SettingsGroup className="space-y-3 p-4 divide-y-0">
        {isCheckingSession ? (
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40 max-w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ) : !currentUser ? (
          <>
            <div className="flex items-center gap-3">
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"
                aria-hidden="true"
              >
                <CloudOff className="size-7" />
              </span>
              <div className="min-w-0">
                <p className="sr-only">Trạng thái:</p>
                <p className="font-medium text-foreground">Chỉ lưu trên máy</p>
                <p className="text-sm text-muted-foreground">
                  {isSupabaseConfigured()
                    ? 'Đăng nhập để đồng bộ giữa các thiết bị'
                    : 'Chưa thiết lập kết nối Supabase'}
                </p>
              </div>
            </div>
            {isSupabaseConfigured() && (
              <Button
                type="button"
                variant="outline"
                size="quiz"
                className="w-full gap-2.5"
                onClick={handleGoogleSignIn}
                disabled={isLoggingIn}
              >
                <GoogleIcon className="size-5 shrink-0" />
                <span>{isLoggingIn ? 'Đang chuyển hướng…' : 'Đăng nhập bằng Google'}</span>
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              {currentUser.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName || 'Avatar'}
                  className="size-12 shrink-0 rounded-full border border-border object-cover"
                />
              ) : (
                <span
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
                  aria-hidden="true"
                >
                  <User className="size-6" />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{currentUser.displayName}</p>
                <p className="truncate text-sm text-muted-foreground">{currentUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                size="quiz"
                className="gap-2"
                onClick={() => triggerSync()}
                disabled={syncEngineStatus.state === 'syncing'}
              >
                <RefreshCw
                  className={cn(syncEngineStatus.state === 'syncing' && 'animate-spin')}
                />
                <span>{syncEngineStatus.state === 'syncing' ? 'Đang đồng bộ…' : 'Đồng bộ ngay'}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="quiz"
                className="gap-2"
                onClick={() => setLogoutConfirmOpen(true)}
              >
                <LogOut />
                <span>Đăng xuất</span>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 border-t border-border pt-3 text-sm text-muted-foreground">
              <span>Trạng thái:</span>
              <span className={cn('font-medium', syncResolution.state === 'synced' && 'text-success', (syncResolution.state === 'pending' || syncResolution.state === 'syncing') && 'text-warning')}>
                {syncResolution.label}
              </span>
            </div>
          </>
        )}
      </SettingsGroup>

      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đăng xuất?</AlertDialogTitle>
            <AlertDialogDescription>
              Tiến độ học tập hiện tại vẫn được lưu an toàn trên thiết bị này. Các thay đổi mới
              sau khi đăng xuất sẽ không được đồng bộ lên máy chủ cho tới khi bạn đăng nhập lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction variant="outline" onClick={handleSignOut}>
              Đăng xuất
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
