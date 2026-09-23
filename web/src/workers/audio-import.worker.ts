import JSZip from 'jszip';
import {
  parseAudioTrackPath,
  validateZipLimits,
  parseAndValidateManifest,
  MAX_ZIP_ENTRIES,
  MAX_SINGLE_FILE_SIZE,
  MAX_COMPRESSION_RATIO,
} from '@/lib/audio-zip';

export interface WorkerStartMessage {
  type: 'START';
  file: File;
  existingHashes: Record<string, string>;
}

export interface WorkerCancelMessage {
  type: 'CANCEL';
}

export type WorkerInMessage = WorkerStartMessage | WorkerCancelMessage;

export interface ExtractedTrack {
  id: string;
  lesson: number;
  type: string;
  buffer: ArrayBuffer;
  size: number;
  sha256: string;
}

export interface WorkerProgressMessage {
  type: 'PROGRESS';
  current: number;
  total: number;
  currentFile: string;
}

export interface WorkerBatchMessage {
  type: 'BATCH';
  tracks: ExtractedTrack[];
}

export interface WorkerCompleteMessage {
  type: 'COMPLETE';
  totalImported: number;
  corruptedFiles: string[];
  skippedFiles: string[];
  conflicts: string[];
}

export interface WorkerErrorMessage {
  type: 'ERROR';
  message: string;
}

export type WorkerOutMessage =
  | WorkerProgressMessage
  | WorkerBatchMessage
  | WorkerCompleteMessage
  | WorkerErrorMessage;

const ctx: Worker = self as unknown as Worker;

let isCancelled = false;

ctx.onmessage = async (event: MessageEvent<WorkerInMessage>) => {
  const data = event.data;

  if (data.type === 'CANCEL') {
    isCancelled = true;
    return;
  }

  if (data.type === 'START') {
    isCancelled = false;
    const { file, existingHashes } = data;

    try {
      // 1. Nạp zip
      const zip = await JSZip.loadAsync(file);

      const entries = Object.keys(zip.files).filter((name) => !zip.files[name]?.dir);

      // 2. Kiểm tra giới hạn số lượng file
      if (entries.length > MAX_ZIP_ENTRIES) {
        ctx.postMessage({
          type: 'ERROR',
          message: `Số lượng file trong gói vượt quá giới hạn (${entries.length} > ${MAX_ZIP_ENTRIES}).`,
        } satisfies WorkerErrorMessage);
        return;
      }

      // 3. Kiểm tra manifest.json
      const manifestEntry = zip.file('manifest.json') || zip.file('minna-audio/manifest.json');
      if (!manifestEntry) {
        ctx.postMessage({
          type: 'ERROR',
          message: 'Không tìm thấy file manifest.json trong gói ZIP.',
        } satisfies WorkerErrorMessage);
        return;
      }

      const manifestContent = await manifestEntry.async('string');
      const manifestRes = parseAndValidateManifest(manifestContent);
      if (!manifestRes.valid || !manifestRes.manifest) {
        ctx.postMessage({
          type: 'ERROR',
          message: manifestRes.error || 'manifest.json không hợp lệ.',
        } satisfies WorkerErrorMessage);
        return;
      }
      const manifest = manifestRes.manifest;

      // 4. Lọc các track hợp lệ và kiểm tra dung lượng sơ bộ
      let totalUncompressed = 0;
      const validTrackEntries: Array<{ relativePath: string; entry: JSZip.JSZipObject }> = [];
      const skippedFiles: string[] = [];

      for (const rawName of entries) {
        if (rawName.endsWith('manifest.json')) continue;

        // Chuẩn hóa tên đường dẫn nếu nằm trong thư mục gốc dạng minna-audio/L01/...
        const normalizedPath = rawName.replace(/^[^/]+\/(?=L\d{2}\/)/, '');
        const parsed = parseAudioTrackPath(normalizedPath);

        if (!parsed) {
          skippedFiles.push(rawName);
          continue;
        }

        const entry = zip.files[rawName];
        if (!entry) continue;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawData = (entry as any)._data;
        if (rawData && rawData.uncompressedSize !== undefined) {
          totalUncompressed += rawData.uncompressedSize;
          if (rawData.uncompressedSize > MAX_SINGLE_FILE_SIZE) {
            skippedFiles.push(rawName);
            continue;
          }
          if (
            rawData.compressedSize &&
            rawData.uncompressedSize / rawData.compressedSize > MAX_COMPRESSION_RATIO
          ) {
            ctx.postMessage({
              type: 'ERROR',
              message: 'Tỉ lệ nén bất thường (> 100x), nghi ngờ gói zip gây nổ bộ nhớ.',
            } satisfies WorkerErrorMessage);
            return;
          }
        }

        validTrackEntries.push({ relativePath: normalizedPath, entry });
      }

      const limitsCheck = validateZipLimits({
        entryCount: entries.length,
        uncompressedTotal: totalUncompressed,
      });
      if (!limitsCheck.valid) {
        ctx.postMessage({
          type: 'ERROR',
          message: limitsCheck.error || 'Vượt quá giới hạn tài nguyên cho phép.',
        } satisfies WorkerErrorMessage);
        return;
      }

      if (validTrackEntries.length === 0) {
        ctx.postMessage({
          type: 'ERROR',
          message: 'Không tìm thấy file audio hợp lệ nào (theo định dạng L01..L25) trong gói ZIP.',
        } satisfies WorkerErrorMessage);
        return;
      }

      // 5. Tiến hành giải nén, băm SHA-256 và gom lô 20 file
      const total = validTrackEntries.length;
      let current = 0;
      let totalImported = 0;
      const corruptedFiles: string[] = [];
      const conflicts: string[] = [];
      let batch: ExtractedTrack[] = [];

      for (const item of validTrackEntries) {
        if (isCancelled) {
          return;
        }

        current++;
        ctx.postMessage({
          type: 'PROGRESS',
          current,
          total,
          currentFile: item.relativePath,
        } satisfies WorkerProgressMessage);

        const buffer = await item.entry.async('arraybuffer');
        if (buffer.byteLength > MAX_SINGLE_FILE_SIZE) {
          corruptedFiles.push(item.relativePath);
          continue;
        }

        // Băm SHA-256 bằng Web Crypto API
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        const expectedHash = manifest[item.relativePath] || manifest[item.entry.name];

        if (!expectedHash || expectedHash.toLowerCase() !== hashHex.toLowerCase()) {
          corruptedFiles.push(item.relativePath);
          continue;
        }

        // Kiểm tra TOFU
        const oldHash = existingHashes[item.relativePath];
        if (oldHash && oldHash.toLowerCase() !== hashHex.toLowerCase()) {
          conflicts.push(item.relativePath);
        }

        const parsed = parseAudioTrackPath(item.relativePath)!;
        batch.push({
          id: item.relativePath,
          lesson: parsed.lesson,
          type: parsed.type,
          buffer,
          size: buffer.byteLength,
          sha256: hashHex,
        });
        totalImported++;

        // Khi đủ lô 20 file (hoặc đến file cuối), chuyển về Main Thread
        if (batch.length >= 20 || current === total) {
          const transferList = batch.map((t) => t.buffer);
          ctx.postMessage(
            {
              type: 'BATCH',
              tracks: batch,
            } satisfies WorkerBatchMessage,
            transferList
          );
          batch = [];
        }
      }

      ctx.postMessage({
        type: 'COMPLETE',
        totalImported,
        corruptedFiles,
        skippedFiles,
        conflicts,
      } satisfies WorkerCompleteMessage);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định khi giải nén ZIP.';
      ctx.postMessage({
        type: 'ERROR',
        message: msg,
      } satisfies WorkerErrorMessage);
    }
  }
};
