'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  FileArchive,
  Info,
  Loader2,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { db } from '@/lib/db';
import { formatStorageSize } from '@/lib/audio-zip';
import {
  SAMPLE_MANIFEST_JSON,
  MANIFEST_FIELD_DOCS,
} from '@/lib/audio-manifest-sample';
import { useAudioImport } from '@/hooks/use-audio-import';
import { cn } from '@/lib/utils';

function AudioPackageGuide() {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(SAMPLE_MANIFEST_JSON);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
      throw new Error('Clipboard API unavailable');
    } catch {
      // Fallback: chọn văn bản trong DOM để người dùng dễ dàng bấm Ctrl+C
      if (codeRef.current) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(codeRef.current);
        selection?.removeAllRanges();
        selection?.addRange(range);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <Card className="border border-border/70 bg-muted/30">
      <CardContent className="p-4 space-y-4 text-xs text-muted-foreground">
        {/* Cách tạo gói: 3 bước ngắn */}
        <div className="space-y-2">
          <div className="font-semibold text-foreground text-sm">
            Cách tạo gói audio (.zip)
          </div>
          <ol className="space-y-1.5 list-decimal list-inside text-muted-foreground leading-relaxed">
            <li>
              <strong className="text-foreground font-medium">Đặt tên file:</strong> Gom các file MP3 theo từng thư mục bài học (<code className="font-mono text-foreground">L01</code>, <code className="font-mono text-foreground">L02</code>...). Đặt tên file theo chuẩn: <code className="font-mono text-foreground">01_vocab.mp3</code>, <code className="font-mono text-foreground">02_sentence_patterns.mp3</code>, <code className="font-mono text-foreground">03_examples.mp3</code>, <code className="font-mono text-foreground">04_conversation.mp3</code>.
            </li>
            <li>
              <strong className="text-foreground font-medium">Tạo manifest.json:</strong> Đặt file <code className="font-mono text-foreground">manifest.json</code> ở thư mục gốc chứa mã SHA-256 của từng file MP3 để ứng dụng kiểm tra tính toàn vẹn khi giải nén.
            </li>
            <li>
              <strong className="text-foreground font-medium">Nén thành file ZIP:</strong> Chọn các thư mục bài học cùng file <code className="font-mono text-foreground">manifest.json</code> nén thành 1 file ZIP (tối đa 2 GB) rồi nạp vào máy.
            </li>
          </ol>
        </div>

        {/* Cấu trúc cây thư mục */}
        <div className="space-y-1.5">
          <div className="font-medium text-foreground text-xs">Cấu trúc thư mục chuẩn:</div>
          <pre className="p-2.5 rounded-lg bg-card border border-border/60 font-mono text-[11px] leading-relaxed text-foreground overflow-x-auto">
{`minna-audio/
├── L01/
│   ├── 01_vocab.mp3
│   ├── 02_sentence_patterns.mp3
│   ├── 03_examples.mp3
│   └── 04_conversation.mp3
├── L02/ ...
└── manifest.json`}
          </pre>
        </div>

        {/* Mục gập Mẫu manifest.json */}
        <details className="group rounded-xl border border-border/80 bg-card p-3 transition-colors">
          <summary className="flex cursor-pointer items-center justify-between text-xs font-semibold text-foreground select-none list-none outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span>Mẫu manifest.json</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
          </summary>

          <div className="mt-3 pt-3 border-t border-border/60 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-muted-foreground">manifest.json (1 bài, 2 track mẫu)</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                aria-label={copied ? 'Đã sao chép' : 'Sao chép nội dung manifest.json'}
                className="h-8 px-2.5 text-xs font-medium border-border/80 hover:bg-accent flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Sao chép</span>
                  </>
                )}
              </Button>
            </div>

            <pre
              ref={codeRef}
              tabIndex={0}
              className="p-2.5 rounded-lg bg-muted/40 border border-border/60 font-mono text-[11px] leading-relaxed text-foreground overflow-x-auto focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {SAMPLE_MANIFEST_JSON}
            </pre>

            {/* Chú thích ngắn từng field */}
            <div className="space-y-1.5 pt-1 text-[11px] border-t border-border/40">
              <div className="font-semibold text-foreground">Chú thích các trường:</div>
              <ul className="space-y-1 text-muted-foreground">
                {MANIFEST_FIELD_DOCS.map((doc) => (
                  <li key={doc.name} className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
                    <span className="font-mono text-foreground shrink-0 font-medium">• {doc.name}:</span>
                    <span>{doc.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

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
    startImport,
    cancelImport,
    clearError,
  } = useAudioImport();

  // Đọc danh sách audioFiles từ Dexie
  const audioFiles = useLiveQuery(() => db.audioFiles.toArray(), []);

  // Ước tính dung lượng bộ nhớ trống từ trình duyệt (SPEC-09 §2)
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
    <div className="mx-auto max-w-2xl px-4 py-6 pb-28 lg:pb-12 space-y-6">
      {/* 1. Header & Điều hướng */}
      <div className="space-y-2">
        <Link
          href="/cai-dat"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cài đặt</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Audio đĩa CD
        </h1>
        <p className="text-sm text-muted-foreground">
          Nạp gói ZIP audio của bạn để luyện nghe trên máy này.
        </p>
      </div>

      {/* 2. Thẻ Thư viện hiện tại */}
      <Card className="border border-border/80 bg-card shadow-xs">
        <CardContent className="p-5 space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">
            Thư viện hiện tại
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {totalTracks > 0
              ? `${totalTracks} track · ${formatStorageSize(totalBytes)}`
              : 'Chưa có audio'}
          </div>
          <div className="text-xs text-muted-foreground/90">
            {totalTracks > 0
              ? 'Đã kiểm toàn vẹn gói'
              : storageEstimate
              ? `Bộ nhớ trình duyệt còn trống khoảng ${storageEstimate}`
              : 'File audio nằm lại trên máy bạn, không được tải lên đâu cả.'}
          </div>
        </CardContent>
      </Card>

      {/* 3. Lưới 25 bài học */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Tình trạng bài học
          </h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Đầy đủ</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3.5 h-3.5 rounded-full border border-amber-500 bg-amber-500/30" />
              <span>Thiếu track</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {Array.from({ length: 25 }, (_, i) => i + 1).map((lessonNum) => {
            const trackCount = lessonTrackMap.get(lessonNum) || 0;
            const isFull = trackCount === 4;
            const isPartial = trackCount > 0 && trackCount < 4;

            return (
              <div
                key={lessonNum}
                aria-label={`Bài ${lessonNum}, ${trackCount} trên 4 track`}
                className={cn(
                  'flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border text-center transition-colors',
                  isFull
                    ? 'border-border/80 bg-card text-foreground'
                    : isPartial
                    ? 'border-amber-500/40 bg-amber-500/5 text-foreground'
                    : 'border-dashed border-border/60 bg-muted/20 text-muted-foreground/70'
                )}
              >
                <span className="text-sm font-bold">{lessonNum}</span>
                <div className="mt-1 h-5 flex items-center justify-center">
                  {isFull && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {isPartial && (
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 leading-tight">
                      {trackCount}/4
                    </span>
                  )}
                  {trackCount === 0 && (
                    <span className="text-[10px] text-muted-foreground/50">
                      0/4
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Cảnh báo lỗi / file hỏng (Trạng thái D) */}
      {corruptedFiles.length > 0 && (
        <Card className="border border-destructive/40 bg-destructive/5 text-destructive dark:text-destructive-foreground">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start gap-2.5">
              <TriangleAlert className="w-5 h-5 shrink-0 mt-0.5 text-destructive" />
              <div className="space-y-1">
                <div className="text-sm font-semibold">
                  {corruptedFiles.length} file không khớp mã kiểm tra
                </div>
                <p className="text-xs text-muted-foreground">
                  Kiểm tra gói ZIP rồi nạp lại. Các track hợp lệ khác vẫn được giữ nguyên.
                </p>
                <ul className="text-xs font-mono space-y-0.5 pt-1 text-foreground/80 max-h-32 overflow-y-auto">
                  {corruptedFiles.map((file) => (
                    <li key={file}>• {file}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lỗi chung nếu có */}
      {error && (
        <Card className="border border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-2.5 text-destructive">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm font-medium">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* 5. Khối điều khiển / Tiến độ (Trạng thái B hoặc A/C) */}
      <div className="space-y-3 pt-2">
        {isImporting && progress ? (
          <Card className="border border-border/80 bg-card p-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-foreground">
                <span>Đang xử lý gói audio...</span>
                <span>{progress.percent}%</span>
              </div>
              <Progress value={progress.percent} className="h-2" />
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <div
                className="truncate font-mono"
                aria-live="polite"
                aria-atomic="true"
              >
                {progress.currentFile} ({progress.current}/{progress.total})
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelImport}
                className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10"
              >
                Hủy
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Input file ẩn */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="hidden"
              id="audio-zip-input"
            />

            {totalTracks === 0 ? (
              <div className="space-y-4">
                <AudioPackageGuide />

                <Button
                  onClick={handleTriggerFileInput}
                  size="quiz"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                >
                  <FileArchive className="w-5 h-5 mr-2" />
                  <span>Chọn file ZIP</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleTriggerFileInput}
                    variant="outline"
                    size="quiz"
                    className="flex-1 font-medium border-border/80 hover:bg-accent"
                  >
                    <FileArchive className="w-5 h-5 mr-2 text-muted-foreground" />
                    <span>Nạp lại file ZIP</span>
                  </Button>

                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    variant="outline"
                    size="quiz"
                    className="sm:w-auto font-medium text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    <span>Gỡ audio</span>
                  </Button>
                </div>

                {/* Hướng dẫn tạo gói & mẫu manifest khi cần tra cứu lại */}
                <details className="group rounded-xl border border-border/70 bg-card p-3 transition-colors">
                  <summary className="flex cursor-pointer items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground select-none list-none outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span>Hướng dẫn cấu trúc gói & mẫu manifest.json</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 pt-3 border-t border-border/60">
                    <AudioPackageGuide />
                  </div>
                </details>
              </div>
            )}
          </div>
        )}

        {/* Ghi chú chân trang */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-2">
          <Info className="w-3.5 h-3.5" />
          <span>Audio chỉ được lưu trên máy này.</span>
        </div>
      </div>

      {/* 6. Hộp thoại xác nhận gỡ toàn bộ audio */}
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
              onClick={handleDeleteAllAudio}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
