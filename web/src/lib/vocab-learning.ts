import { applyReview, pushElapsedSample, Rating, type Grade } from '@/lib/fsrs';
import { db } from '@/lib/db';
import type { ReviewItem } from '@/types';

export function getVocabLearningTime(): number {
  return Date.now();
}

export function getVocabTargetId(lesson: number, wordIndex: number): string {
  return `vocab-${String(lesson).padStart(2, '0')}-${String(wordIndex + 1).padStart(2, '0')}`;
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
}): Promise<ReviewItem> {
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

    await db.reviewItems.put(next);
    await db.pendingSync.add({
      id: `sync-vocab-${targetId}-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      payload: { kind: 'practice', reviewItems: [next] },
      createdAt: now.getTime(),
    });

    return next;
  });
}
