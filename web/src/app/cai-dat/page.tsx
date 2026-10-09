'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CloudUpload,
  Disc3,
  RotateCcw,
  Trash2,
  Volume2,
} from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { InstallAppCard } from '@/components/InstallAppCard';
import { PageTitle, SectionHeader } from '@/components/PaperKit';
import { AccountSection, type SettingsNotice } from '@/components/settings/AccountSection';
import { ActionRow } from '@/components/settings/ActionRow';
import { NumberStepper } from '@/components/settings/NumberStepper';
import { SegmentedControl } from '@/components/settings/SegmentedControl';
import { SettingsGroup } from '@/components/settings/SettingRow';
import { SettingSwitch } from '@/components/settings/SettingSwitch';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
} from '@/lib/settings';
import { speak } from '@/lib/tts';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    applySettingsToDOM(settings);
  }, [settings]);

  // Lắng nghe thay đổi theme system khi tab đang mở
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

  // 2. Đọc thống kê dữ liệu hiện có trên máy
  const reviewCount = useLiveQuery(() => db.reviewItems.count(), []) ?? 0;
  const sessionCount = useLiveQuery(() => db.practiceSessions.count(), []) ?? 0;
  const audioCount = useLiveQuery(() => db.audioFiles.count(), []) ?? 0;

  // 3. Trạng thái Export / Import / Wipe
  const [notification, setNotification] = useState<SettingsNotice | null>(null);

  // Hộp thoại xem trước Import
  const [importPreview, setImportPreview] = useState<ParsedImportData | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isImporting, setIsImporting] = useState(false);

  // Hộp thoại xác nhận thay thế dữ liệu (nếu chọn Replace)
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);

  // Hộp thoại xác nhận Xóa toàn bộ dữ liệu
  const [wipeConfirmOpen, setWipeConfirmOpen] = useState(false);
  const [wipeInputText, setWipeInputText] = useState('');
  const [isWiping, setIsWiping] = useState(false);

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
        saveSettings(importPreview.settings);
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
  const wipeInputId = useId();

  if (!mounted) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <PageTitle title="Cài đặt" />
      </main>
    );
  }

  const hasAnyData = reviewCount > 0 || sessionCount > 0;

  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 px-4 py-6 pb-28 lg:pb-12">
      <PageTitle title="Cài đặt" />

      {notification && (
        <div
          role={notification.type === 'error' ? 'alert' : 'status'}
          aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
          className={cn(
            'flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm',
            notification.type === 'success' ? 'border-success/40' : 'border-destructive/40',
          )}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />
          ) : (
            <AlertCircle className="size-5 shrink-0 text-destructive" aria-hidden="true" />
          )}
          <span className="min-w-0 flex-1 text-foreground">{notification.message}</span>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 shrink-0 px-3"
            onClick={() => setNotification(null)}
          >
            Đóng
          </Button>
        </div>
      )}

      <AccountSection onNotify={setNotification} />

      {/* HIỂN THỊ */}
      <section aria-labelledby="heading-display">
        <SectionHeader id="heading-display" title="Hiển thị" />
        <SettingsGroup>
          <SettingSwitch
            label="Hiện furigana"
            checked={settings.furigana}
            onCheckedChange={(furigana) => saveSettings({ furigana })}
          />
          <SegmentedControl
            label="Cỡ furigana"
            labelId="label-furigana-size"
            value={settings.furiganaSize}
            options={[
              { value: 'normal', text: 'Thường', ariaLabel: 'Cỡ furigana thường' },
              { value: 'large', text: 'Lớn', ariaLabel: 'Cỡ furigana lớn' },
            ]}
            onChange={(furiganaSize) => saveSettings({ furiganaSize })}
          />
          <SettingSwitch
            label="Ẩn bản dịch khi đọc bài"
            checked={settings.hideTranslations}
            onCheckedChange={(hideTranslations) => saveSettings({ hideTranslations })}
          />
          <SegmentedControl
            label="Giao diện"
            labelId="label-theme"
            value={settings.theme}
            options={[
              { value: 'light', text: 'Sáng', ariaLabel: 'Giao diện sáng' },
              { value: 'dark', text: 'Tối', ariaLabel: 'Giao diện tối' },
              { value: 'system', text: 'Hệ thống', ariaLabel: 'Giao diện theo hệ thống' },
            ]}
            onChange={(theme) => saveSettings({ theme })}
          />
          {/* Ô xem trước: chạy qua đúng class `jp`/`translation` của màn đọc để thấy tác dụng của các tùy chọn trên */}
          <div className="p-4">
            <div className="space-y-1 rounded-lg bg-secondary px-4 py-3">
              <div className="jp jp-vocab text-lg font-medium text-foreground">
                <Furigana text="私[わたし]は 学生[がくせい]です。" />
              </div>
              <p className="translation text-sm text-muted-foreground">Tôi là học sinh.</p>
            </div>
          </div>
        </SettingsGroup>
      </section>

      {/* HỌC TẬP */}
      <section aria-labelledby="heading-learning">
        <SectionHeader id="heading-learning" title="Học tập" />
        <SettingsGroup>
          <NumberStepper
            label="Số mục mới mỗi ngày"
            unit="mục"
            value={settings.dailyNewLimit}
            min={1}
            max={100}
            step={5}
            onChange={(dailyNewLimit) => saveSettings({ dailyNewLimit })}
          />
          <NumberStepper
            label="Số mục mỗi lô ôn"
            unit="mục"
            value={settings.reviewBatchSize}
            min={5}
            max={100}
            step={5}
            onChange={(reviewBatchSize) => saveSettings({ reviewBatchSize })}
          />
          <NumberStepper
            id="hoc-den-bai"
            label="Đã học đến bài"
            hint={
              settings.learnedThroughLesson === 0
                ? 'Chưa khai báo. Nếu đã học Minna trước đây, chọn bài cuối bạn đã học — từ vựng các bài đó sẽ vào lịch ôn dần theo số mục mới mỗi ngày.'
                : `Từ vựng bài 1–${settings.learnedThroughLesson} vào lịch ôn dần theo số mục mới mỗi ngày. Hạ số này không xóa mục đã vào lịch.`
            }
            unit="bài"
            value={settings.learnedThroughLesson}
            min={0}
            max={25}
            step={1}
            onChange={(learnedThroughLesson) => saveSettings({ learnedThroughLesson })}
          />
          <div className="px-4 py-3">
            <label htmlFor={volumeId} className="block cursor-pointer text-base font-medium text-foreground">
              Âm lượng phát âm
            </label>
            <div className="mt-1 flex items-center gap-3">
              <input
                id={volumeId}
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.soundVolume}
                onChange={(e) => saveSettings({ soundVolume: Number.parseFloat(e.target.value) })}
                className="h-11 min-w-0 flex-1 cursor-pointer accent-primary"
              />
              <span className="w-10 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                {Math.round(settings.soundVolume * 100)}%
              </span>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 shrink-0 gap-1.5 border-primary/40 px-3 text-primary hover:text-primary"
                onClick={() => speak('こんにちは', settings.soundVolume)}
              >
                <Volume2 />
                Nghe thử
              </Button>
            </div>
          </div>
        </SettingsGroup>
      </section>

      {/* DỮ LIỆU */}
      <section aria-labelledby="heading-data">
        <SectionHeader id="heading-data" title="Dữ liệu" />
        <SettingsGroup>
          <ActionRow
            icon={<CloudUpload />}
            title="Sao lưu dữ liệu"
            detail={`${reviewCount} mục ôn tập · ${sessionCount} phiên luyện tập`}
            disabled={!hasAnyData}
            onClick={handleExport}
          />
          <ActionRow
            icon={<RotateCcw />}
            title="Khôi phục từ bản sao lưu"
            onClick={() => fileInputRef.current?.click()}
          />
          <ActionRow
            href="/cai-dat/audio"
            icon={<Disc3 />}
            title="Audio đĩa CD"
            detail={audioCount > 0 ? `${audioCount}/100 track` : 'Chưa nạp'}
          />
        </SettingsGroup>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleFileChange}
        />
      </section>

      {/* ỨNG DỤNG (tự ẩn khi đã cài) */}
      <InstallAppCard />

      <Button
        type="button"
        variant="outline"
        size="quiz"
        className="w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => {
          setWipeInputText('');
          setWipeConfirmOpen(true);
        }}
      >
        <Trash2 />
        Xóa toàn bộ dữ liệu
      </Button>

      {/* DIALOG XEM TRƯỚC KHI NHẬP FILE */}
      <Dialog
        open={importPreview !== null}
        onOpenChange={(open) => {
          if (!open) setImportPreview(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Khôi phục từ bản sao lưu</DialogTitle>
            <DialogDescription className="truncate">
              {importPreview?.fileName}
            </DialogDescription>
          </DialogHeader>

          {importPreview && (
            <div className="space-y-4 py-2">
              <div className="space-y-1 rounded-xl border border-border bg-card p-3 text-sm">
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
                <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-card p-3 text-sm text-foreground">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                  <span>
                    {importPreview.skippedReviewItemsCount + importPreview.skippedSessionsCount} bản
                    ghi không đọc được và sẽ bị bỏ qua.
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <span id="label-import-mode" className="text-sm font-medium text-foreground">
                  Chọn chế độ nhập:
                </span>

                <div role="radiogroup" aria-labelledby="label-import-mode" className="grid gap-2">
                  <label
                    className={cn(
                      'flex min-h-14 cursor-pointer flex-col rounded-xl border p-3 text-left text-sm transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring',
                      importMode === 'merge'
                        ? 'border-primary bg-accent ring-1 ring-primary'
                        : 'border-border bg-card hover:bg-muted/60',
                    )}
                  >
                    <input
                      type="radio"
                      name="import-mode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="sr-only"
                    />
                    <span className="flex items-center justify-between font-medium text-foreground">
                      <span>Gộp dữ liệu (Khuyên dùng)</span>
                      {importMode === 'merge' && (
                        <Check className="size-4 text-primary" aria-hidden="true" />
                      )}
                    </span>
                    <span className="mt-0.5 text-muted-foreground">
                      Giữ dữ liệu hiện có; các mục trùng lặp sẽ lấy bản có cập nhật mới hơn.
                    </span>
                  </label>

                  <label
                    className={cn(
                      'flex min-h-14 cursor-pointer flex-col rounded-xl border p-3 text-left text-sm transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring',
                      importMode === 'replace'
                        ? 'border-destructive bg-destructive/10 ring-1 ring-destructive'
                        : 'border-border bg-card hover:bg-muted/60',
                    )}
                  >
                    <input
                      type="radio"
                      name="import-mode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="sr-only"
                    />
                    <span className="flex items-center justify-between font-medium text-destructive">
                      <span>Thay thế toàn bộ</span>
                      {importMode === 'replace' && (
                        <Check className="size-4 text-destructive" aria-hidden="true" />
                      )}
                    </span>
                    <span className="mt-0.5 text-muted-foreground">
                      Xóa toàn bộ dữ liệu trên máy hiện tại trước khi nạp dữ liệu từ bản sao lưu.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-8"
              onClick={() => setImportPreview(null)}
              disabled={isImporting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className="min-h-11 sm:min-h-8"
              onClick={handleProceedImport}
              disabled={isImporting}
            >
              {isImporting ? 'Đang khôi phục...' : 'Khôi phục dữ liệu'}
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
              máy, thay bằng {importPreview?.reviewItems.length} mục từ bản sao lưu. Hành động này không
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

      {/* ALERT DIALOG XÓA TOÀN BỘ DỮ LIỆU */}
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
              className="h-11 text-center font-bold uppercase tracking-widest"
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
    </main>
  );
}
