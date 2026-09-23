/**
 * SPEC-09: Thư viện thuần kiểm tra và xử lý audio zip
 */

export const MAX_ZIP_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB
export const MAX_ZIP_ENTRIES = 200;
export const MAX_UNCOMPRESSED_TOTAL = 4 * 1024 * 1024 * 1024; // 4 GB
export const MAX_SINGLE_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
export const MAX_COMPRESSION_RATIO = 100;

export type AudioTrackType = 'vocab' | 'sentence_patterns' | 'examples' | 'conversation';

export interface ParsedTrackPath {
  lesson: number;
  trackNumber: number;
  type: AudioTrackType;
}

const TRACK_PATH_REGEX = /^L(\d{2})\/(\d{2})_(vocab|sentence_patterns|examples|conversation)\.mp3$/;

/**
 * Kiểm tra và phân tích đường dẫn track audio chuẩn
 * Khớp: L01/01_vocab.mp3 ... L25/04_conversation.mp3
 */
export function parseAudioTrackPath(path: string): ParsedTrackPath | null {
  // Chặn path traversal và ký tự lạ
  if (path.includes('..') || path.startsWith('/') || path.startsWith('\\')) {
    return null;
  }

  const match = path.match(TRACK_PATH_REGEX);
  if (!match) {
    return null;
  }

  const lesson = parseInt(match[1]!, 10);
  const trackNumber = parseInt(match[2]!, 10);
  const type = match[3]! as AudioTrackType;

  // Giới hạn Minna no Nihongo I: Bài 1 đến 25, 4 track mỗi bài
  if (lesson < 1 || lesson > 25) {
    return null;
  }
  if (trackNumber < 1 || trackNumber > 4) {
    return null;
  }

  return { lesson, trackNumber, type };
}

export interface ZipLimitsInput {
  fileSize?: number;
  entryCount?: number;
  uncompressedTotal?: number;
  maxSingleSize?: number;
  maxCompressionRatio?: number;
}

/**
 * Kiểm tra các giới hạn an toàn trước khi giải nén (SPEC-09 §2.1b)
 */
export function validateZipLimits(limits: ZipLimitsInput): { valid: boolean; error?: string } {
  if (limits.fileSize !== undefined && limits.fileSize > MAX_ZIP_FILE_SIZE) {
    return { valid: false, error: 'File ZIP vượt quá dung lượng tối đa cho phép (2 GB).' };
  }
  if (limits.entryCount !== undefined && limits.entryCount > MAX_ZIP_ENTRIES) {
    return { valid: false, error: `Số lượng file trong gói vượt quá giới hạn (${MAX_ZIP_ENTRIES} files).` };
  }
  if (limits.uncompressedTotal !== undefined && limits.uncompressedTotal > MAX_UNCOMPRESSED_TOTAL) {
    return { valid: false, error: 'Tổng dung lượng sau giải nén vượt quá 4 GB.' };
  }
  if (limits.maxSingleSize !== undefined && limits.maxSingleSize > MAX_SINGLE_FILE_SIZE) {
    return { valid: false, error: 'File đơn lẻ vượt quá dung lượng tối đa 100 MB.' };
  }
  if (limits.maxCompressionRatio !== undefined && limits.maxCompressionRatio > MAX_COMPRESSION_RATIO) {
    return { valid: false, error: 'Tỉ lệ nén bất thường (> 100x), nghi ngờ gói zip gây nổ bộ nhớ.' };
  }
  return { valid: true };
}

const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/i;

/**
 * Kiểm tra và parse manifest.json từ gói zip
 */
export function parseAndValidateManifest(rawJson: string): {
  valid: boolean;
  manifest?: Record<string, string>;
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { valid: false, error: 'Định dạng manifest.json không phải là JSON object.' };
    }

    const keys = Object.keys(parsed);
    if (keys.length === 0) {
      return { valid: false, error: 'manifest.json không chứa bản ghi kiểm tra nào.' };
    }

    const manifest: Record<string, string> = {};
    for (const key of keys) {
      const hash = parsed[key];
      if (typeof hash !== 'string' || !SHA256_HEX_REGEX.test(hash.trim())) {
        return { valid: false, error: `Mã hash của entry "${key}" không phải là SHA-256 hex hợp lệ.` };
      }
      manifest[key] = hash.trim().toLowerCase();
    }

    return { valid: true, manifest };
  } catch {
    return { valid: false, error: 'Không thể đọc nội dung file manifest.json (JSON không hợp lệ).' };
  }
}

/**
 * Định dạng dung lượng byte thành chuỗi người dùng dễ đọc
 */
export function formatStorageSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  const formatted = val % 1 === 0 ? val.toString() : val.toFixed(1);
  return `${formatted} ${units[i]}`;
}

/**
 * Phát hiện track có mã hash khác so với bản ghi đã có trước đây (Trust-On-First-Use)
 */
export function detectHashConflicts(
  existingHashes: Record<string, string>,
  newManifest: Record<string, string>
): string[] {
  const conflicts: string[] = [];
  for (const [id, newHash] of Object.entries(newManifest)) {
    const existing = existingHashes[id];
    if (existing && existing.toLowerCase() !== newHash.toLowerCase()) {
      conflicts.push(id);
    }
  }
  return conflicts;
}
