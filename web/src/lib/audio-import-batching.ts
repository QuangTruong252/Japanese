export interface BatchEntry {
  relativePath: string;
  /** Tên gốc trong ZIP; manifest có thể khai theo tên này thay vì đường dẫn chuẩn hóa */
  entryName: string;
  read(): Promise<ArrayBuffer>;
}

export interface BatchTrack {
  id: string;
  lesson: number;
  type: string;
  buffer: ArrayBuffer;
  size: number;
  sha256: string;
}

export interface BatchLoopDeps {
  entries: BatchEntry[];
  manifest: Record<string, string>;
  existingHashes: Record<string, string>;
  maxFileSize: number;
  batchSize: number;
  parsePath(path: string): { lesson: number; type: string } | null;
  sha256(buffer: ArrayBuffer): Promise<string>;
  onProgress(current: number, total: number, file: string): void;
  onBatch(tracks: BatchTrack[]): void;
  isCancelled(): boolean;
}

/**
 * Giải nén, kiểm hash và gom lô. Trả null nếu bị Hủy (không gửi lô dư). Lô dư được gửi sau vòng lặp,
 * nên file cuối hỏng không làm mất các track tốt đứng trước nó.
 */
export async function runBatchLoop(deps: BatchLoopDeps) {
  const { entries, manifest, existingHashes } = deps;
  const corruptedFiles: string[] = [];
  const conflicts: string[] = [];
  let totalImported = 0;
  let batch: BatchTrack[] = [];
  const flush = () => {
    if (batch.length === 0) return;
    deps.onBatch(batch);
    batch = [];
  };

  let current = 0;
  for (const item of entries) {
    if (deps.isCancelled()) return null;
    current++;
    deps.onProgress(current, entries.length, item.relativePath);

    const buffer = await item.read();
    if (buffer.byteLength > deps.maxFileSize) {
      corruptedFiles.push(item.relativePath);
      continue;
    }

    const hashHex = await deps.sha256(buffer);
    const expectedHash = manifest[item.relativePath] || manifest[item.entryName];
    if (!expectedHash || expectedHash.toLowerCase() !== hashHex.toLowerCase()) {
      corruptedFiles.push(item.relativePath);
      continue;
    }

    // Kiểm tra TOFU
    const oldHash = existingHashes[item.relativePath];
    if (oldHash && oldHash.toLowerCase() !== hashHex.toLowerCase()) conflicts.push(item.relativePath);

    const parsed = deps.parsePath(item.relativePath)!;
    batch.push({
      id: item.relativePath,
      lesson: parsed.lesson,
      type: parsed.type,
      buffer,
      size: buffer.byteLength,
      sha256: hashHex,
    });
    totalImported++;
    if (batch.length >= deps.batchSize) flush();
  }

  if (deps.isCancelled()) return null;
  flush();
  return { totalImported, corruptedFiles, conflicts };
}
