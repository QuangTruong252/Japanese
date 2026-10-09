'use client';

import { useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { MAX_ZIP_FILE_SIZE } from '@/lib/audio-zip';
import { createAudioImportRunner } from '@/lib/audio-import-session';
import type {
  WorkerInMessage,
  WorkerOutMessage,
} from '@/workers/audio-import.worker';

export interface ImportProgress {
  current: number;
  total: number;
  currentFile: string;
  percent: number;
}

export function useAudioImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [corruptedFiles, setCorruptedFiles] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importedLessons, setImportedLessons] = useState<number | null>(null);

  const [runner] = useState(() =>
    createAudioImportRunner({
      readHashes: async () => {
        // Hash hiện có để worker kiểm tra TOFU
        const hashes: Record<string, string> = {};
        for (const record of await db.audioFiles.toArray()) hashes[record.id] = record.sha256;
        return hashes;
      },
      startWorker: (file, existingHashes, onMessage, onWorkerError) => {
        const worker = new Worker(new URL('@/workers/audio-import.worker.ts', import.meta.url));
        worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => onMessage(event.data);
        worker.onerror = (e) => {
          console.error('Worker error:', e);
          onWorkerError();
        };
        const startMsg: WorkerInMessage = { type: 'START', file, existingHashes };
        worker.postMessage(startMsg);
        return () => worker.terminate();
      },
      store: {
        get: (ids) => db.audioFiles.bulkGet(ids),
        put: async (records) => {
          await db.audioFiles.bulkPut(records);
        },
        restore: ({ restore, remove }) =>
          db.transaction('rw', db.audioFiles, async () => {
            await db.audioFiles.bulkDelete(remove);
            await db.audioFiles.bulkPut(restore);
          }),
      },
      onProgress: (msg) =>
        setProgress({
          current: msg.current,
          total: msg.total,
          currentFile: msg.currentFile,
          percent: msg.total > 0 ? Math.round((msg.current / msg.total) * 100) : 0,
        }),
      onSuccess: (result) => {
        setCorruptedFiles(result.corruptedFiles);
        setConflicts(result.conflicts);
        setImportedLessons(result.lessons);
      },
      onError: setError,
      onEnd: () => {
        setIsImporting(false);
        setProgress(null);
      },
    }),
  );

  // Cảnh báo beforeunload khi đang nạp
  useEffect(() => {
    if (!isImporting) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isImporting]);

  // Rời trang giữa chừng = Hủy: dừng worker và hoàn tác
  useEffect(() => runner.cancel, [runner]);

  const cancelImport = runner.cancel;

  const clearError = useCallback(() => {
    setError(null);
    setImportedLessons(null);
  }, []);

  const startImport = useCallback(
    async (file: File) => {
      // Kiểm tra kích thước file ZIP ở main thread trước khi mở worker
      if (file.size > MAX_ZIP_FILE_SIZE) {
        setError('File ZIP vượt quá dung lượng tối đa cho phép (2 GB).');
        return;
      }

      setError(null);
      setImportedLessons(null);
      setCorruptedFiles([]);
      setConflicts([]);
      setIsImporting(true);
      setProgress({
        current: 0,
        total: 100,
        currentFile: 'Khởi tạo gói ZIP...',
        percent: 0,
      });

      await runner.start(file);
    },
    [runner]
  );

  return {
    isImporting,
    progress,
    corruptedFiles,
    conflicts,
    error,
    importedLessons,
    startImport,
    cancelImport,
    clearError,
  };
}
