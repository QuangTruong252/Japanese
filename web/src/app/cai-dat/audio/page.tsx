'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  AlertCircle,
  CheckCircle2,
  FileArchive,
  Info,
  Loader2,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { PageTitle, SectionHeader } from '@/components/PaperKit';
import { AudioPackageGuide } from '@/components/settings/AudioPackageGuide';
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
import { Progress } from '@/components/ui/progress';
import { db } from '@/lib/db';
import { formatStorageSize } from '@/lib/audio-zip';
import { useAudioImport } from '@/hooks/use-audio-import';
import { cn } from '@/lib/utils';

export default function AudioSettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [storageEstimate, setStorageEstimate] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const {
    isImporting,
    progress,
    corruptedFiles,
    error,
    importedLessons,
    startImport,
    cancelImport,
    clearError,
  } = useAudioImport();

  // Đọc danh sách audioFiles từ Dexie
  const audioFiles = useLiveQuery(() => db.audioFiles.toArray(), []);

  // Ước tính dung lượng bộ nhớ trống từ trình duyệt
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.storage?.estimate) {
      navigator.storage.estimate().then((est) => {
        if (est.quota && est.usage !== undefined) {
          const available = Math.max(0, est.quota - est.usage);
          setStorageEstimate(formatStorageSize(available));
        }
      });
    }
  }, []);

  const totalTracks = audioFiles?.length ?? 0;
  const totalBytes = audioFiles?.reduce((acc, f) => acc + (f.size || 0), 0) ?? 0;

  // Bản đồ số track theo từng bài học (1..25)
  const lessonTrackMap = new Map<number, number>();
  if (audioFiles) {
    for (const file of audioFiles) {
      lessonTrackMap.set(file.lesson, (lessonTrackMap.get(file.lesson) || 0) + 1);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      clearError();
      startImport(file);
    }
    // Reset value để người dùng có thể chọn lại cùng 1 file nếu muốn
    e.target.value = '';
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteAllAudio = () => {
    startDeleteTransition(async () => {
      try {
        await db.audioFiles.clear();
        setShowDeleteDialog(false);
      } catch (err) {
        console.error('Lỗi khi xóa audio:', err);
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-6 pb-28 lg:pb-12">
      <PageTitle back={{ href: '/cai-dat', label: 'Cài đặt' }} title="Audio đĩa CD" />

      {/* Thư viện hiện tại */}
      <div className="rounded-xl border border-border bg-card px-4 py-3">
        <div className="text-sm text-muted-foreground">Thư viện hiện tại</div>
        <div className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
          {totalTracks > 0
            ? `${totalTracks} track · ${formatStorageSize(totalBytes)}`
            : 'Chưa có audio'}
        </div>
        <div className="mt-0.5 text-sm text-muted-foreground">
          {totalTracks > 0
            ? 'Đã kiểm toàn vẹn gói'
            : storageEstimate
            ? `Bộ nhớ trình duyệt còn trống khoảng ${storageEstimate}`
            : 'File audio nằm lại trên máy bạn, không được tải lên đâu cả.'}
        </div>
      </div>

      {/* Lưới 25 bài học */}
      <section aria-labelledby="heading-lessons">
        <SectionHeader id="heading-lessons" title="Tình trạng bài học" />
        <div className="mb-3 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
            Đầy đủ
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block size-3.5 rounded-full border border-warning bg-warning/30"
              aria-hidden="true"
            />
            Thiếu track
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {Array.from({ length: 25 }, (_, i) => i + 1).map((lessonNum) => {
            const trackCount = lessonTrackMap.get(lessonNum) || 0;
            const isFull = trackCount === 4;
            const isPartial = trackCount > 0 && trackCount < 4;

            return (
              <div
                key={lessonNum}
                role="img"
                aria-label={`Bài ${lessonNum}, ${trackCount} trên 4 track`}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center rounded-xl border px-1 py-2 text-center',
                  trackCount === 0
                    ? 'border-dashed border-border/60 text-muted-foreground'
                    : cn('bg-card text-foreground', isPartial ? 'border-warning/50' : 'border-border'),
                )}
              >
                <span className="font-semibold">{lessonNum}</span>
                <span className="flex h-5 items-center justify-center" aria-hidden="true">
                  {isFull && <CheckCircle2 className="size-4 text-success" />}
                  {isPartial && (
                    <span className="text-xs font-semibold text-warning">{trackCount}/4</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cảnh báo file hỏng */}
      {corruptedFiles.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-card p-4">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
          <div className="min-w-0 space-y-1">
            <div className="font-medium text-foreground">
              {corruptedFiles.length} file không khớp mã kiểm tra
            </div>
            <p className="text-sm text-muted-foreground">
              Kiểm tra gói ZIP rồi nạp lại. Các track hợp lệ khác vẫn được giữ nguyên.
            </p>
            <ul className="max-h-32 space-y-0.5 overflow-y-auto pt-1 font-mono text-xs text-foreground/80">
              {corruptedFiles.map((file) => (
                <li key={file} className="break-all">• {file}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Nạp xong */}
      {importedLessons !== null && importedLessons > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-success/40 bg-card p-4" role="status">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          <div className="text-sm font-medium text-foreground">
            Đã nạp audio cho {importedLessons} bài.
          </div>
        </div>
      )}

      {/* Lỗi chung */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-card p-4">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
          <div className="text-sm font-medium text-foreground">{error}</div>
        </div>
      )}

      {/* Điều khiển / tiến trình */}
      <div className="space-y-4">
        {isImporting && progress ? (
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-sm font-medium text-foreground">
              <span>Đang xử lý gói audio...</span>
              <span className="tabular-nums">{progress.percent}%</span>
            </div>
            <Progress value={progress.percent} />
            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <div className="min-w-0 truncate font-mono" aria-live="polite" aria-atomic="true">
                {progress.currentFile} ({progress.current}/{progress.total})
              </div>
              <Button type="button" variant="outline" className="min-h-11 shrink-0 px-4" onClick={cancelImport}>
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="hidden"
              id="audio-zip-input"
            />

            {totalTracks === 0 ? (
              <Button type="button" size="quiz" className="w-full" onClick={handleTriggerFileInput}>
                <FileArchive />
                <span>Chọn file ZIP</span>
              </Button>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  size="quiz"
                  className="flex-1"
                  onClick={handleTriggerFileInput}
                >
                  <FileArchive className="text-muted-foreground" />
                  <span>Nạp lại file ZIP</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="quiz"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 />
                  <span>Gỡ audio</span>
                </Button>
              </div>
            )}

            {/* Chờ dữ liệu về rồi mới dựng, để mục không đóng lại khi đã có track */}
            {audioFiles && <AudioPackageGuide defaultOpen={totalTracks === 0} />}
          </>
        )}

        <div className="flex items-center justify-center gap-1.5 pt-1 text-sm text-muted-foreground">
          <Info className="size-4 shrink-0" aria-hidden="true" />
          <span>Audio chỉ được lưu trên máy này.</span>
        </div>
      </div>

      {/* Hộp thoại xác nhận gỡ toàn bộ audio */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Gỡ toàn bộ audio?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm text-muted-foreground">
              <span>
                Toàn bộ {totalTracks} track ({formatStorageSize(totalBytes)}) sẽ bị xóa khỏi bộ nhớ máy này. Tính năng Shadowing sẽ tạm ngưng cho tới khi bạn nạp lại.
              </span>
              <span className="block font-medium text-foreground">
                Tiến độ học tập và thẻ ôn tập của bạn hoàn toàn không bị ảnh hưởng.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteAllAudio}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  <span>Đang xóa...</span>
                </>
              ) : (
                'Gỡ audio'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
