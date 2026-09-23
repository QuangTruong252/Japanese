'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '@/lib/db';
import { MAX_ZIP_FILE_SIZE } from '@/lib/audio-zip';
import type { AudioFileRecord } from '@/types';
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

  const workerRef = useRef<Worker | null>(null);

  const cleanupWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  // Cảnh báo beforeunload khi đang nạp (SPEC-09 §5)
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

  // Dọn worker khi unmount
  useEffect(() => {
    return () => {
      cleanupWorker();
    };
  }, [cleanupWorker]);

  const cancelImport = useCallback(() => {
    if (workerRef.current) {
      const cancelMsg: WorkerInMessage = { type: 'CANCEL' };
      workerRef.current.postMessage(cancelMsg);
      cleanupWorker();
    }
    setIsImporting(false);
    setProgress(null);
  }, [cleanupWorker]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const startImport = useCallback(
    async (file: File) => {
      // 1. Kiểm tra kích thước file ZIP ở main thread trước khi mở worker (SPEC-09 §2.1b)
      if (file.size > MAX_ZIP_FILE_SIZE) {
        setError('File ZIP vượt quá dung lượng tối đa cho phép (2 GB).');
        return;
      }

      setError(null);
      setCorruptedFiles([]);
      setConflicts([]);
      setIsImporting(true);
      setProgress({
        current: 0,
        total: 100,
        currentFile: 'Khởi tạo gói ZIP...',
        percent: 0,
      });

      try {
        // 2. Lấy danh sách hash hiện có để kiểm tra TOFU
        const existingRecords = await db.audioFiles.toArray();
        const existingHashes: Record<string, string> = {};
        for (const record of existingRecords) {
          existingHashes[record.id] = record.sha256;
        }

        cleanupWorker();

        // 3. Khởi tạo Web Worker
        const worker = new Worker(
          new URL('@/workers/audio-import.worker.ts', import.meta.url)
        );
        workerRef.current = worker;

        worker.onmessage = async (event: MessageEvent<WorkerOutMessage>) => {
          const msg = event.data;

          if (msg.type === 'PROGRESS') {
            const percent =
              msg.total > 0 ? Math.round((msg.current / msg.total) * 100) : 0;
            setProgress({
              current: msg.current,
              total: msg.total,
              currentFile: msg.currentFile,
              percent,
            });
          } else if (msg.type === 'BATCH') {
            // Nhận lô ~20 file, tạo Blob và ghi db.audioFiles.bulkPut độc lập
            const records: AudioFileRecord[] = msg.tracks.map((t) => ({
              id: t.id,
              lesson: t.lesson,
              type: t.type,
              blob: new Blob([t.buffer], { type: 'audio/mpeg' }),
              size: t.size,
              sha256: t.sha256,
            }));

            try {
              await db.audioFiles.bulkPut(records);
            } catch (dexieErr) {
              console.error('Lỗi khi ghi batch vào IndexedDB:', dexieErr);
            }
          } else if (msg.type === 'COMPLETE') {
            setCorruptedFiles(msg.corruptedFiles);
            setConflicts(msg.conflicts);
            setIsImporting(false);
            setProgress(null);
            cleanupWorker();
          } else if (msg.type === 'ERROR') {
            setError(msg.message);
            setIsImporting(false);
            setProgress(null);
            cleanupWorker();
          }
        };

        worker.onerror = (e) => {
          console.error('Worker error:', e);
          setError('Đã xảy ra lỗi trong quá trình xử lý Web Worker.');
          setIsImporting(false);
          setProgress(null);
          cleanupWorker();
        };

        const startMsg: WorkerInMessage = {
          type: 'START',
          file,
          existingHashes,
        };
        worker.postMessage(startMsg);
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : 'Không thể khởi động tiến trình nạp audio.';
        setError(errorMsg);
        setIsImporting(false);
        setProgress(null);
        cleanupWorker();
      }
    },
    [cleanupWorker]
  );

  return {
    isImporting,
    progress,
    corruptedFiles,
    conflicts,
    error,
    startImport,
    cancelImport,
    clearError,
  };
}
