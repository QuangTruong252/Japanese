import { db } from './db.ts';
import { loadSettings, type AppSettings } from './settings.ts';
import type { PracticeSession, ReviewItem, TargetType } from '../types/index.ts';

export interface ExportFile {
  schemaVersion: 1;
  exportedAt: string; // ISO 8601
  app: 'minna-n5';
  settings: AppSettings;
  reviewItems: ReviewItem[];
  practiceSessions: PracticeSession[];
}

export interface ParsedImportData {
  fileName: string;
  schemaVersion: 1;
  exportedAt: string;
  app: 'minna-n5';
  settings?: AppSettings;
  reviewItems: ReviewItem[];
  practiceSessions: PracticeSession[];
  skippedReviewItemsCount: number;
  skippedSessionsCount: number;
}

export type ParseImportResult =
  | { ok: true; data: ParsedImportData }
  | { ok: false; error: string; code: 'INVALID_JSON' | 'UNSUPPORTED_VERSION' | 'NOT_AN_APP_FILE' | 'NO_VALID_DATA' };

const VALID_TARGET_TYPES: Set<TargetType> = new Set([
  'vocab',
  'grammar',
  'kanji',
  'particle',
  'listening',
]);

const isValidIsoDate = (d: unknown): boolean => {
  if (typeof d !== 'string' && !(d instanceof Date)) return false;
  const t = new Date(d).getTime();
  return !Number.isNaN(t);
};

export function validateReviewItem(raw: unknown): ReviewItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  if (typeof item.targetId !== 'string' || item.targetId.trim().length === 0) return null;
  if (!VALID_TARGET_TYPES.has(item.targetType as TargetType)) return null;
  if (typeof item.lesson !== 'number' || item.lesson < 0) return null;
  if (typeof item.incorrectCount !== 'number' || item.incorrectCount < 0) return null;
  if (typeof item.correctCount !== 'number' || item.correctCount < 0) return null;
  if (!isValidIsoDate(item.dueAt)) return null;

  const dueAt = new Date(item.dueAt as string | Date);
  const updatedAt = typeof item.updatedAt === 'string' && isValidIsoDate(item.updatedAt)
    ? item.updatedAt
    : new Date().toISOString();

  const createdAt = typeof item.createdAt === 'string' && isValidIsoDate(item.createdAt)
    ? item.createdAt
    : updatedAt;

  const recentElapsedMs = Array.isArray(item.recentElapsedMs)
    ? (item.recentElapsedMs.filter((n) => typeof n === 'number' && n >= 0) as number[])
    : [];

  const lastFailedAt = typeof item.lastFailedAt === 'string' && isValidIsoDate(item.lastFailedAt)
    ? item.lastFailedAt
    : undefined;

  // Validate FSRS Card
  const rawCard = item.fsrsCard as Record<string, unknown> | undefined;
  if (!rawCard || typeof rawCard !== 'object') return null;
  if (!isValidIsoDate(rawCard.due)) return null;

  const fsrsCard = {
    ...rawCard,
    due: new Date(rawCard.due as string | Date),
    last_review: rawCard.last_review && isValidIsoDate(rawCard.last_review)
      ? new Date(rawCard.last_review as string | Date)
      : undefined,
  } as unknown as ReviewItem['fsrsCard'];

  return {
    targetId: item.targetId,
    targetType: item.targetType as TargetType,
    lesson: item.lesson,
    incorrectCount: item.incorrectCount,
    correctCount: item.correctCount,
    lastFailedAt,
    dueAt,
    fsrsCard,
    updatedAt,
    createdAt,
    recentElapsedMs,
  };
}

export function validatePracticeSession(raw: unknown): PracticeSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;

  if (typeof s.id !== 'string' || s.id.trim().length === 0) return null;
  if (!Array.isArray(s.selectedLessons)) return null;
  if (!Array.isArray(s.exerciseTypes)) return null;
  if (typeof s.totalQuestions !== 'number' || s.totalQuestions < 0) return null;
  if (typeof s.correctCount !== 'number' || s.correctCount < 0) return null;
  if (typeof s.accuracyRate !== 'number' || s.accuracyRate < 0) return null;
  if (typeof s.durationSeconds !== 'number' || s.durationSeconds < 0) return null;
  if (typeof s.createdAt !== 'string' || !isValidIsoDate(s.createdAt)) return null;

  return {
    id: s.id,
    selectedLessons: s.selectedLessons.filter((n) => typeof n === 'number'),
    exerciseTypes: s.exerciseTypes.filter((t) => typeof t === 'string') as PracticeSession['exerciseTypes'],
    totalQuestions: s.totalQuestions,
    correctCount: s.correctCount,
    accuracyRate: s.accuracyRate,
    durationSeconds: s.durationSeconds,
    createdAt: s.createdAt,
  };
}

export function parseAndValidateImport(
  jsonText: string,
  fileName = 'import.json',
): ParseImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return {
      ok: false,
      code: 'INVALID_JSON',
      error: 'File này không phải JSON hợp lệ. Vui lòng kiểm tra lại file đã chọn.',
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      ok: false,
      code: 'NOT_AN_APP_FILE',
      error: 'File này không phải bản xuất của ứng dụng.',
    };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.app !== 'minna-n5') {
    return {
      ok: false,
      code: 'NOT_AN_APP_FILE',
      error: 'File này không phải bản xuất của ứng dụng MaiPace.',
    };
  }

  if (typeof obj.schemaVersion !== 'number' || obj.schemaVersion > 1) {
    return {
      ok: false,
      code: 'UNSUPPORTED_VERSION',
      error: 'File được tạo bởi phiên bản mới hơn. Vui lòng cập nhật ứng dụng trước khi nhập.',
    };
  }

  const rawReviewItems = Array.isArray(obj.reviewItems) ? obj.reviewItems : [];
  const rawSessions = Array.isArray(obj.practiceSessions) ? obj.practiceSessions : [];

  let skippedReviewItemsCount = 0;
  const validReviewItems: ReviewItem[] = [];
  for (const item of rawReviewItems) {
    const validated = validateReviewItem(item);
    if (validated) {
      validReviewItems.push(validated);
    } else {
      skippedReviewItemsCount++;
    }
  }

  let skippedSessionsCount = 0;
  const validSessions: PracticeSession[] = [];
  for (const s of rawSessions) {
    const validated = validatePracticeSession(s);
    if (validated) {
      validSessions.push(validated);
    } else {
      skippedSessionsCount++;
    }
  }

  if (validReviewItems.length === 0 && validSessions.length === 0) {
    return {
      ok: false,
      code: 'NO_VALID_DATA',
      error: 'Không tìm thấy dữ liệu học tập hợp lệ trong file.',
    };
  }

  return {
    ok: true,
    data: {
      fileName,
      schemaVersion: 1,
      exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
      app: 'minna-n5',
      settings: obj.settings as AppSettings | undefined,
      reviewItems: validReviewItems,
      practiceSessions: validSessions,
      skippedReviewItemsCount,
      skippedSessionsCount,
    },
  };
}

export function mergeReviewItems(existing: ReviewItem[], incoming: ReviewItem[]): ReviewItem[] {
  const map = new Map<string, ReviewItem>();
  for (const item of existing) {
    map.set(item.targetId, item);
  }

  for (const item of incoming) {
    const prev = map.get(item.targetId);
    if (!prev) {
      map.set(item.targetId, item);
    } else {
      // Last-write-wins by updatedAt
      const prevTime = new Date(prev.updatedAt).getTime();
      const nextTime = new Date(item.updatedAt).getTime();
      if (nextTime >= prevTime) {
        map.set(item.targetId, item);
      }
    }
  }

  return Array.from(map.values());
}

export function mergePracticeSessions(
  existing: PracticeSession[],
  incoming: PracticeSession[],
): PracticeSession[] {
  const map = new Map<string, PracticeSession>();
  for (const s of existing) {
    map.set(s.id, s);
  }
  for (const s of incoming) {
    map.set(s.id, s);
  }
  return Array.from(map.values()).sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
}

export async function createExportData(): Promise<ExportFile> {
  const [reviewItems, practiceSessions] = await Promise.all([
    db.reviewItems.toArray(),
    db.practiceSessions.toArray(),
  ]);

  const settings = loadSettings();

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    app: 'minna-n5',
    settings,
    reviewItems,
    practiceSessions,
  };
}

export function downloadExportFile(data: ExportFile): void {
  const nowStr = new Date().toISOString().slice(0, 10);
  const fileName = `minna-tien-do-${nowStr}.json`;
  const jsonBlob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(jsonBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function executeImport(
  importData: ParsedImportData,
  mode: 'merge' | 'replace',
): Promise<{ reviewCount: number; sessionCount: number }> {
  let finalReviews: ReviewItem[] = [];
  let finalSessions: PracticeSession[] = [];

  await db.transaction('rw', db.reviewItems, db.practiceSessions, db.pendingSync, async () => {
    if (mode === 'replace') {
      await db.reviewItems.clear();
      await db.practiceSessions.clear();
      finalReviews = importData.reviewItems;
      finalSessions = importData.practiceSessions;
    } else {
      const existingReviews = await db.reviewItems.toArray();
      const existingSessions = await db.practiceSessions.toArray();
      finalReviews = mergeReviewItems(existingReviews, importData.reviewItems);
      finalSessions = mergePracticeSessions(existingSessions, importData.practiceSessions);
    }

    await db.reviewItems.bulkPut(finalReviews);
    await db.practiceSessions.bulkPut(finalSessions);

    const pendingId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `import-${Date.now()}`;

    await db.pendingSync.add({
      id: pendingId,
      payload: {
        v: 1,
        kind: 'import',
        reviewItems: finalReviews,
        sessions: finalSessions,
        replaced: mode === 'replace',
      },
      createdAt: Date.now(),
    });
  });

  return {
    reviewCount: finalReviews.length,
    sessionCount: finalSessions.length,
  };
}

export async function executeWipeAllData(): Promise<void> {
  await db.transaction('rw', db.reviewItems, db.practiceSessions, db.pendingSync, async () => {
    await db.reviewItems.clear();
    await db.practiceSessions.clear();
    await db.pendingSync.clear();
  });

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem('jp:lastPulledAt');
    } catch {
      // ignore
    }
  }
}
