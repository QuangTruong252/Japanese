import { applyReview, pushElapsedSample, Rating, type Grade } from '@/lib/fsrs';
import { db } from '@/lib/db';
import type { ReviewItem } from '@/types';

export function getVocabLearningTime(): number {
  return Date.now();
}

export function getVocabTargetId(lesson: number, wordIndex: number): string {
  return `vocab-${String(lesson).padStart(2, '0')}-${String(wordIndex + 1).padStart(2, '0')}`;
}

export interface VocabRecallRecord {
  next: ReviewItem;
  /** Trạng thái trước lần chấm; undefined nếu từ chưa từng vào lịch ôn. */
  previous?: ReviewItem;
  syncId: string;
}

/** Persist one self-rated vocabulary recall and its sync payload atomically. */
export async function saveVocabRecall({
  targetId,
  lesson,
  grade,
  elapsedMs,
}: {
  targetId: string;
  lesson: number;
  grade: Grade;
  elapsedMs: number;
}): Promise<VocabRecallRecord> {
  return db.transaction('rw', db.reviewItems, db.pendingSync, async () => {
    const previous = await db.reviewItems.get(targetId);
    const previousUpdateMs = previous ? Date.parse(previous.updatedAt) : 0;
    const now = new Date(Math.max(Date.now(), Number.isFinite(previousUpdateMs) ? previousUpdateMs + 1 : 0));
    const iso = now.toISOString();
    const remembered = grade !== Rating.Again;
    const { card, dueAt } = applyReview(previous?.fsrsCard, grade, now);
    const next: ReviewItem = {
      targetId,
      targetType: 'vocab',
      lesson,
      correctCount: (previous?.correctCount ?? 0) + Number(remembered),
      incorrectCount: (previous?.incorrectCount ?? 0) + Number(!remembered),
      lastFailedAt: remembered ? previous?.lastFailedAt : iso,
      dueAt,
      fsrsCard: card,
      updatedAt: iso,
      createdAt: previous?.createdAt ?? iso,
      recentElapsedMs: remembered
        ? pushElapsedSample(previous?.recentElapsedMs ?? [], Math.max(0, Math.round(elapsedMs)))
        : (previous?.recentElapsedMs ?? []),
    };

    const syncId = `sync-vocab-${targetId}-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
    await db.reviewItems.put(next);
    await db.pendingSync.add({
      id: syncId,
      payload: { kind: 'practice', reviewItems: [next] },
      createdAt: now.getTime(),
    });

    return { next, previous, syncId };
  });
}

/**
 * Hoàn tác một lần tự chấm. Từ đã có trong lịch ôn: ghi lại bản trước với updatedAt mới
 * để thắng LWW khi đồng bộ. Từ mới: chỉ xóa được khi lượt chấm chưa đẩy lên server.
 * Trả về false nếu không hoàn tác được.
 */
export async function undoVocabRecall({ next, previous, syncId }: VocabRecallRecord): Promise<boolean> {
  return db.transaction('rw', db.reviewItems, db.pendingSync, async () => {
    const current = await db.reviewItems.get(next.targetId);
    if (!current || current.updatedAt !== next.updatedAt) return false; // đã bị ghi đè bởi lượt khác

    if (!previous) {
      if (!(await db.pendingSync.get(syncId))) return false;
      await db.pendingSync.delete(syncId);
      await db.reviewItems.delete(next.targetId);
      return true;
    }

    const now = new Date(Math.max(Date.now(), Date.parse(next.updatedAt) + 1));
    const restored: ReviewItem = { ...previous, updatedAt: now.toISOString() };
    await db.reviewItems.put(restored);
    if (await db.pendingSync.get(syncId)) {
      await db.pendingSync.delete(syncId);
    }
    await db.pendingSync.add({
      id: `sync-vocab-${next.targetId}-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      payload: { kind: 'practice', reviewItems: [restored] },
      createdAt: now.getTime(),
    });
    return true;
  });
}
