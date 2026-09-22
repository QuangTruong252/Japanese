'use client';

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Download,
  LogOut,
  Minus,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
  Upload,
  User,
  Volume2,
} from 'lucide-react';
import { Furigana } from '@/components/Furigana';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  createExportData,
  downloadExportFile,
  executeImport,
  executeWipeAllData,
  parseAndValidateImport,
  type ParsedImportData,
} from '@/lib/backup';
import { db } from '@/lib/db';
import {
  applySettingsToDOM,
  DEFAULT_SETTINGS,
  getSettingsSnapshot,
  loadSettings,
  saveSettings,
  subscribeSettings,
  type AppSettings,
} from '@/lib/settings';
import { useUIStore } from '@/lib/store';
import {
  getSyncStatusSnapshot,
  signInWithGoogle,
  signOut,
  subscribeSyncStatus,
  triggerSync,
} from '@/lib/sync';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { speak } from '@/lib/tts';
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

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Quản lý cài đặt AppSettings qua useSyncExternalStore
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    () => DEFAULT_SETTINGS,
  );
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const {
    setFurigana: storeSetFurigana,
    setFuriganaSize: storeSetFuriganaSize,
    setHideTranslations: storeSetHideTranslations,
    setTheme: storeSetTheme,
  } = useUIStore();

  useEffect(() => {
    applySettingsToDOM(settings);
  }, [settings]);

  // Lắng nghe thay đổi theme system khi tab đang mở (SPEC-06 §6)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const current = loadSettings();
      if (current.theme === 'system') {
        applySettingsToDOM(current);
      }
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      saveSettings(patch);

      if (patch.furigana !== undefined) storeSetFurigana(patch.furigana);
      if (patch.furiganaSize !== undefined) storeSetFuriganaSize(patch.furiganaSize);
      if (patch.hideTranslations !== undefined) storeSetHideTranslations(patch.hideTranslations);
      if (patch.theme !== undefined) storeSetTheme(patch.theme);
    },
    [storeSetFurigana, storeSetFuriganaSize, storeSetHideTranslations, storeSetTheme],
  );

  // 2. Đọc thống kê dữ liệu hiện có trên máy
  const reviewCount = useLiveQuery(() => db.reviewItems.count(), []) ?? 0;
  const sessionCount = useLiveQuery(() => db.practiceSessions.count(), []) ?? 0;

  // 3. Trạng thái Export / Import / Wipe
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Hộp thoại xem trước Import
  const [importPreview, setImportPreview] = useState<ParsedImportData | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isImporting, setIsImporting] = useState(false);

  // Hộp thoại xác nhận thay thế dữ liệu (nếu chọn Replace)
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);

  // Hộp thoại xác nhận Xóa toàn bộ dữ liệu (Danger Zone)
  const [wipeConfirmOpen, setWipeConfirmOpen] = useState(false);
  const [wipeInputText, setWipeInputText] = useState('');
  const [isWiping, setIsWiping] = useState(false);

  // 4. Trạng thái Supabase Auth & Sync (SPEC-08)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const syncEngineStatus = useSyncExternalStore(
    subscribeSyncStatus,
    getSyncStatusSnapshot,
    () => ({
      state: 'offline' as const,
      pendingCount: 0,
      lastSyncedAt: null,
    }),
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

  // 4. Xử lý xuất file JSON
  const handleExport = async () => {
    try {
      const data = await createExportData();
      downloadExportFile(data);
      setNotification({
        type: 'success',
        message: 'Đã xuất file tiến độ học tập thành công.',
      });
    } catch {
      setNotification({
        type: 'error',
        message: 'Không thể xuất file. Vui lòng thử lại sau.',
      });
    }
  };

  // 5. Xử lý chọn file để nhập
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset value để có thể chọn lại cùng file nếu muốn
    event.target.value = '';

    try {
      const text = await file.text();
      const result = parseAndValidateImport(text, file.name);

      if (!result.ok) {
        setNotification({
          type: 'error',
          message: result.error,
        });
        return;
      }

      setImportPreview(result.data);
      setImportMode('merge');
      setNotification(null);
    } catch {
      setNotification({
        type: 'error',
        message: 'Không thể đọc file. Vui lòng kiểm tra định dạng file.',
      });
    }
  };

  // 6. Thực hiện nhập dữ liệu
  const handleProceedImport = async () => {
    if (!importPreview) return;

    if (importMode === 'replace') {
      setConfirmReplaceOpen(true);
      return;
    }

    await doExecuteImport('merge');
  };

  const doExecuteImport = async (mode: 'merge' | 'replace') => {
    if (!importPreview) return;
    setIsImporting(true);
    try {
      const result = await executeImport(importPreview, mode);

      // Cập nhật cài đặt nếu file có chứa settings
      if (importPreview.settings) {
        updateSettings(importPreview.settings);
      }

      setNotification({
        type: 'success',
        message: `Đã nhập thành công ${result.reviewCount} mục ôn tập và ${result.sessionCount} phiên luyện tập (${mode === 'replace' ? 'chế độ Thay thế' : 'chế độ Gộp'}).`,
      });
      setImportPreview(null);
      setConfirmReplaceOpen(false);
    } catch {
      setNotification({
        type: 'error',
        message: 'Quá trình nhập dữ liệu thất bại. Dữ liệu cũ vẫn được giữ nguyên.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // 7. Thực hiện xóa toàn bộ dữ liệu máy
  const handleConfirmWipe = async () => {
    if (wipeInputText !== 'XÓA') return;
    setIsWiping(true);
    try {
      await executeWipeAllData();
      setWipeConfirmOpen(false);
      setWipeInputText('');
      router.push('/');
    } catch {
      setNotification({
        type: 'error',
        message: 'Không thể xóa dữ liệu. Vui lòng thử lại.',
      });
      setIsWiping(false);
    }
  };

  const volumeId = useId();
  const dailyNewLimitId = useId();
  const wipeInputId = useId();

  if (!mounted) {
    return (
      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
        <h1 className="font-heading text-xl font-medium">Cài đặt</h1>
      </main>
    );
  }

  const hasAnyData = reviewCount > 0 || sessionCount > 0;

  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 px-4 py-6 pb-28">
      <div>
        <h1 className="font-heading text-xl font-medium text-foreground">Cài đặt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tùy chỉnh giao diện, trải nghiệm học tập và quản lý dữ liệu trên máy.
        </p>
      </div>

      {notification && (
        <div
          role={notification.type === 'error' ? 'alert' : 'status'}
          aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
          className={cn(
            'flex items-center gap-3 rounded-xl border p-4 text-sm transition-all',
            notification.type === 'success'
              ? 'border-success/30 bg-success/10 text-success-foreground'
              : 'border-destructive/30 bg-destructive/10 text-destructive',
          )}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="size-5 shrink-0 text-success" />
          ) : (
            <AlertCircle className="size-5 shrink-0 text-destructive" />
          )}
          <span className="flex-1">{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Đóng
          </button>
        </div>
      )}

      {/* NHÓM 1: HIỂN THỊ */}
      <section className="space-y-4" aria-labelledby="heading-display">
        <h2 id="heading-display" className="font-heading text-base font-medium text-foreground">
          Hiển thị
        </h2>

        <Card>
          <CardContent className="divide-y divide-border p-0">
            {/* Hiện furigana */}
            <div className="flex items-center justify-between gap-4 p-4">
              <div className="space-y-0.5">
                <label
                  htmlFor="toggle-furigana"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Hiện furigana
                </label>
                <p className="text-xs text-muted-foreground">
                  Hiển thị chữ kana nhỏ phía trên chữ Hán
                </p>
              </div>
              <button
                id="toggle-furigana"
                type="button"
                role="switch"
                aria-checked={settings.furigana}
                onClick={() => updateSettings({ furigana: !settings.furigana })}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 outline-none',
                  settings.furigana ? 'bg-primary' : 'bg-muted',
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block size-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-150 ease-out',
                    settings.furigana ? 'translate-x-5' : 'translate-x-0',
                  )}
                />
              </button>
            </div>

            {/* Cỡ furigana */}
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <span id="label-furigana-size" className="text-sm font-medium text-foreground">
                  Cỡ furigana
                </span>
                <p className="text-xs text-muted-foreground">
                  Kích thước tương đối so với chữ Hán
                </p>
              </div>
              <ToggleGroup
                aria-labelledby="label-furigana-size"
                variant="outline"
                size="sm"
                value={[settings.furiganaSize]}
                onValueChange={(val: string[]) => {
                  const chosen = val[val.length - 1];
                  if (chosen === 'normal' || chosen === 'large') {
                    updateSettings({ furiganaSize: chosen });
                  }
                }}
              >
                <ToggleGroupItem value="normal" aria-label="Cỡ furigana thường">
                  Thường
                </ToggleGroupItem>
                <ToggleGroupItem value="large" aria-label="Cỡ furigana lớn">
                  Lớn
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Ẩn bản dịch khi đọc bài */}
            <div className="flex items-center justify-between gap-4 p-4">
              <div className="space-y-0.5">
                <label
                  htmlFor="toggle-hide-translations"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Ẩn bản dịch khi đọc bài
                </label>
                <p className="text-xs text-muted-foreground">
                  Tự nhớ: làm mờ nghĩa tiếng Việt cho đến khi chạm hoặc rê chuột vào
                </p>
              </div>
              <button
                id="toggle-hide-translations"
                type="button"
                role="switch"
                aria-checked={settings.hideTranslations}
                onClick={() => updateSettings({ hideTranslations: !settings.hideTranslations })}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 outline-none',
                  settings.hideTranslations ? 'bg-primary' : 'bg-muted',
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block size-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-150 ease-out',
                    settings.hideTranslations ? 'translate-x-5' : 'translate-x-0',
                  )}
                />
              </button>
            </div>

            {/* Giao diện */}
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <span id="label-theme" className="text-sm font-medium text-foreground">
                  Giao diện
                </span>
                <p className="text-xs text-muted-foreground">
                  Màu sắc hiển thị của toàn bộ ứng dụng
                </p>
              </div>
              <ToggleGroup
                aria-labelledby="label-theme"
                variant="outline"
                size="sm"
                value={[settings.theme]}
                onValueChange={(val: string[]) => {
                  const chosen = val[val.length - 1];
                  if (chosen === 'light' || chosen === 'dark' || chosen === 'system') {
                    updateSettings({ theme: chosen });
                  }
                }}
              >
                <ToggleGroupItem value="light" aria-label="Giao diện sáng">
                  Sáng
                </ToggleGroupItem>
                <ToggleGroupItem value="dark" aria-label="Giao diện tối">
                  Tối
                </ToggleGroupItem>
                <ToggleGroupItem value="system" aria-label="Giao diện theo hệ thống">
                  Hệ thống
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardContent>
        </Card>

        {/* Ô xem trước (SPEC-06 §3.1) */}
        <div className="rounded-xl border border-border bg-card/60 p-4">
          <p className="text-xs font-medium text-muted-foreground">Xem trước hiển thị:</p>
          <div className="mt-2 space-y-1">
            <div className="jp jp-vocab text-lg font-medium text-foreground">
              <Furigana text="私[わたし]は 学生[がくせい]です。" />
            </div>
            <p className="translation text-sm text-muted-foreground">Tôi là học sinh.</p>
          </div>
          {settings.hideTranslations && (
            <p className="mt-2 text-xs text-muted-foreground/80 italic">
              (Bản dịch đang được làm mờ — chạm hoặc rê chuột vào dòng tiếng Việt để đọc)
            </p>
          )}
        </div>
      </section>

      {/* NHÓM 2: HỌC TẬP */}
      <section className="space-y-4" aria-labelledby="heading-learning">
        <h2 id="heading-learning" className="font-heading text-base font-medium text-foreground">
          Học tập
        </h2>

        <Card>
          <CardContent className="divide-y divide-border p-0">
            {/* Số mục mới mỗi ngày */}
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <label
                  htmlFor={dailyNewLimitId}
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Số mục mới mỗi ngày
                </label>
                <p className="text-xs text-muted-foreground">
                  Giới hạn số lượng mục mới nạp vào hàng đợi Ôn tập (/on-tap)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Giảm 5 mục"
                  disabled={settings.dailyNewLimit <= 1}
                  onClick={() =>
                    updateSettings({
                      dailyNewLimit: Math.max(1, settings.dailyNewLimit - 5),
                    })
                  }
                >
                  <Minus className="size-4" />
                </Button>
                <Input
                  id={dailyNewLimitId}
                  type="number"
                  min={1}
                  max={100}
                  value={settings.dailyNewLimit}
                  onChange={(e) => {
                    const val = Number.parseInt(e.target.value, 10);
                    if (!Number.isNaN(val)) {
                      updateSettings({
                        dailyNewLimit: Math.max(1, Math.min(100, val)),
                      });
                    }
                  }}
                  className="h-8 w-16 text-center tabular-nums font-medium"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Tăng 5 mục"
                  disabled={settings.dailyNewLimit >= 100}
                  onClick={() =>
                    updateSettings({
                      dailyNewLimit: Math.min(100, settings.dailyNewLimit + 5),
                    })
                  }
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            {/* Âm lượng phát âm */}
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label
                    htmlFor={volumeId}
                    className="text-sm font-medium text-foreground cursor-pointer"
                  >
                    Âm lượng phát âm
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Giọng đọc mẫu TTS cho từ vựng và câu ví dụ
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {Math.round(settings.soundVolume * 100)}%
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => speak('こんにちは', settings.soundVolume)}
                  >
                    <Volume2 className="size-3.5" />
                    Nghe thử
                  </Button>
                </div>
              </div>

              <input
                id={volumeId}
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.soundVolume}
                onChange={(e) =>
                  updateSettings({ soundVolume: Number.parseFloat(e.target.value) })
                }
                className="w-full accent-primary h-2 cursor-pointer rounded-lg bg-muted"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* NHÓM 3: DỮ LIỆU */}
      <section className="space-y-4" aria-labelledby="heading-data">
        <h2 id="heading-data" className="font-heading text-base font-medium text-foreground">
          Dữ liệu
        </h2>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tiến độ trên thiết bị</CardTitle>
            <CardDescription className="text-xs">
              {reviewCount} mục ôn tập · {sessionCount} phiên luyện tập trên máy này
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="quiz"
                  className="w-full gap-2"
                  disabled={!hasAnyData}
                  onClick={handleExport}
                >
                  <Download className="size-4" />
                  Xuất file JSON
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Gồm tiến độ ôn tập và lịch sử luyện tập. Không gồm audio.
                </p>
              </div>

              <div className="space-y-1.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="quiz"
                  className="w-full gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="size-4" />
                  Nhập từ file
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Khôi phục hoặc gộp tiến độ từ file JSON đã xuất trước đó.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* NHÓM 4: TÀI KHOẢN (SPEC-08) */}
      <section className="space-y-4" aria-labelledby="heading-account">
        <h2 id="heading-account" className="font-heading text-base font-medium text-foreground">
          Tài khoản
        </h2>

        <Card>
          <CardContent className="p-5">
            {!isSupabaseConfigured() ? (
              <div className="space-y-1 text-center py-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Chưa thiết lập kết nối Supabase
                </p>
                <p className="text-xs text-muted-foreground">
                  Tiến độ học tập luôn được lưu an toàn trên máy (IndexedDB) và hoạt động ngoại tuyến đầy đủ.
                </p>
              </div>
            ) : !currentUser ? (
              <div className="space-y-3 py-1 text-center sm:text-left">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Đăng nhập để đồng bộ tiến độ giữa điện thoại và máy tính.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dữ liệu học của bạn vẫn nằm trên máy và vẫn dùng được khi không đăng nhập.
                  </p>
                </div>
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="quiz"
                    className="gap-2.5 w-full sm:w-auto"
                    onClick={handleGoogleSignIn}
                    disabled={isLoggingIn}
                  >
                    <GoogleIcon className="size-4 shrink-0" />
                    <span>{isLoggingIn ? 'Đang chuyển hướng…' : 'Đăng nhập bằng Google'}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {currentUser.avatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.displayName || 'Avatar'}
                        className="size-10 rounded-full border border-border object-cover"
                      />
                    ) : (
                      <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                        <User className="size-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {currentUser.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="gap-1.5 h-9"
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
                      className="gap-1.5 h-9"
                      onClick={() => setLogoutConfirmOpen(true)}
                    >
                      <LogOut className="size-3.5" />
                      <span>Đăng xuất</span>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground border-t border-border/60">
                  <span>Trạng thái:</span>
                  {syncEngineStatus.state === 'synced' && (
                    <span className="text-success font-medium">
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
                    <span className="text-warning font-medium">
                      Chờ đồng bộ ({syncEngineStatus.pendingCount} mục)
                    </span>
                  )}
                  {syncEngineStatus.state === 'syncing' && (
                    <span className="text-warning font-medium">Đang đẩy và kéo dữ liệu…</span>
                  )}
                  {syncEngineStatus.state === 'offline' && <span>Ngoại tuyến — đã lưu trên máy</span>}
                  {syncEngineStatus.state === 'unconfigured' && <span>Đã lưu trên máy</span>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* NHÓM 5: VÙNG NGUY HIỂM */}
      <section className="space-y-4" aria-labelledby="heading-danger">
        <h2 id="heading-danger" className="font-heading text-base font-medium text-destructive">
          Vùng nguy hiểm
        </h2>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TriangleAlert className="size-4 text-destructive" />
              <CardTitle className="text-sm font-medium text-destructive">
                Xóa toàn bộ dữ liệu
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Xóa sạch lịch sử ôn tập, kết quả bài làm và hàng đợi đồng bộ trên thiết bị này.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="destructive"
              size="quiz"
              className="w-full sm:w-auto"
              onClick={() => {
                setWipeInputText('');
                setWipeConfirmOpen(true);
              }}
            >
              <Trash2 className="size-4 mr-2" />
              Xóa toàn bộ dữ liệu
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* DIALOG XEM TRƯỚC KHI NHẬP FILE (SPEC-06 §3.2) */}
      <Dialog
        open={importPreview !== null}
        onOpenChange={(open) => {
          if (!open) setImportPreview(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nhập từ file</DialogTitle>
            <DialogDescription className="truncate">
              {importPreview?.fileName}
            </DialogDescription>
          </DialogHeader>

          {importPreview && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-border bg-card/60 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mục ôn tập:</span>
                  <span className="font-medium">{importPreview.reviewItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phiên luyện tập:</span>
                  <span className="font-medium">{importPreview.practiceSessions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày xuất:</span>
                  <span className="font-medium">
                    {new Date(importPreview.exportedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              {importPreview.skippedReviewItemsCount + importPreview.skippedSessionsCount > 0 && (
                <div className="rounded-lg bg-warning/10 p-3 text-xs text-warning flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>
                    {importPreview.skippedReviewItemsCount + importPreview.skippedSessionsCount} bản
                    ghi không đọc được và sẽ bị bỏ qua.
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-xs font-medium text-foreground">Chọn chế độ nhập:</span>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode('merge')}
                    className={cn(
                      'flex flex-col text-left p-3 rounded-lg border text-sm transition-colors',
                      importMode === 'merge'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-card hover:bg-muted/40',
                    )}
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span>Gộp dữ liệu (Khuyên dùng)</span>
                      {importMode === 'merge' && <Check className="size-4 text-primary" />}
                    </div>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      Giữ dữ liệu hiện có; các mục trùng lặp sẽ lấy bản có cập nhật mới hơn.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={cn(
                      'flex flex-col text-left p-3 rounded-lg border text-sm transition-colors',
                      importMode === 'replace'
                        ? 'border-destructive bg-destructive/5 ring-1 ring-destructive'
                        : 'border-border bg-card hover:bg-muted/40',
                    )}
                  >
                    <div className="flex items-center justify-between font-medium text-destructive">
                      <span>Thay thế toàn bộ</span>
                      {importMode === 'replace' && (
                        <Check className="size-4 text-destructive" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      Xóa toàn bộ dữ liệu trên máy hiện tại trước khi nạp dữ liệu từ file.
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportPreview(null)}
              disabled={isImporting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleProceedImport}
              disabled={isImporting}
            >
              {isImporting ? 'Đang nhập...' : 'Nhập dữ liệu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG XÁC NHẬN THAY THẾ (Nếu chọn chế độ Replace) */}
      <AlertDialog open={confirmReplaceOpen} onOpenChange={setConfirmReplaceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thay thế dữ liệu?</AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác này sẽ xóa {reviewCount} mục ôn tập và {sessionCount} phiên hiện có trên
              máy, thay bằng {importPreview?.reviewItems.length} mục từ file. Hành động này không
              thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isImporting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isImporting}
              onClick={() => doExecuteImport('replace')}
            >
              {isImporting ? 'Đang thay thế...' : 'Xác nhận thay thế'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ALERT DIALOG XÓA TOÀN BỘ DỮ LIỆU (Danger Zone) */}
      <AlertDialog open={wipeConfirmOpen} onOpenChange={setWipeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Xóa toàn bộ dữ liệu học tập?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>
                Thao tác này sẽ xóa vĩnh viễn {reviewCount} mục ôn tập, {sessionCount} phiên luyện
                tập và hàng đợi đồng bộ trên máy này. Audio đã nạp sẽ không bị ảnh hưởng.
              </span>
              <span className="block font-medium text-foreground">
                Để xác nhận, vui lòng gõ đúng chữ <strong>XÓA</strong> vào ô bên dưới:
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2">
            <Input
              id={wipeInputId}
              type="text"
              placeholder="Gõ XÓA để xác nhận"
              value={wipeInputText}
              onChange={(e) => setWipeInputText(e.target.value)}
              className="text-center font-bold tracking-widest uppercase"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWiping}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={wipeInputText !== 'XÓA' || isWiping}
              onClick={handleConfirmWipe}
            >
              {isWiping ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ALERT DIALOG XÁC NHẬN ĐĂNG XUẤT (SPEC-08) */}
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
    </main>
  );
}
