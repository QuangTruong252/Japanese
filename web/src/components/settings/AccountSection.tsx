'use client';

import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import { CloudOff, LogOut, RefreshCw, User } from 'lucide-react';
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
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const syncEngineStatus = useSyncExternalStore(
    subscribeSyncStatus,
    getSyncStatusSnapshot,
    getServerSyncStatusSnapshot,
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
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
      });

      return () => subscription.unsubscribe();
    } catch {
      // Supabase unconfigured or error
    }
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
        {!currentUser ? (
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
              {syncEngineStatus.state === 'synced' && (
                <span className="font-medium text-success">
                  Đã đồng bộ{' '}
                  {syncEngineStatus.lastSyncedAt
                    ? `· ${syncEngineStatus.lastSyncedAt.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : ''}
                </span>
              )}
              {syncEngineStatus.state === 'pending' && (
                <span className="font-medium text-warning">
                  Chờ đồng bộ ({syncEngineStatus.pendingCount} mục)
                </span>
              )}
              {syncEngineStatus.state === 'syncing' && (
                <span className="font-medium text-warning">Đang đẩy và kéo dữ liệu…</span>
              )}
              {syncEngineStatus.state === 'offline' && <span>Ngoại tuyến — đã lưu trên máy</span>}
              {syncEngineStatus.state === 'unconfigured' && <span>Đã lưu trên máy</span>}
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
