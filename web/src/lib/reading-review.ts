import type { ReadingGlossaryEntry } from '../types/reading.ts';
import { db } from './db.ts';
import { loadVocab } from './lessons.ts';
import { Rating } from './fsrs.ts';

export type ReadingReviewResult = 'added' | 'exists' | 'unsupported';

export interface ReadingReviewDeps {
  loadWords(lesson: number): Promise<{ id: string }[]>;
  targetId(lesson: number, wordIndex: number): string | Promise<string>;
  /** Tạo mục khó nếu chưa có, trong một transaction; trả true khi đã tạo. */
  addIfMissing(targetId: string, lesson: number): Promise<boolean>;
}

// vocab-learning dùng alias `@/`, nên nạp lúc gọi: module này vẫn kiểm thử được bằng deps giả.
const defaultDeps: ReadingReviewDeps = {
  loadWords: loadVocab,
  targetId: async (lesson, index) => (await import('./vocab-learning.ts')).getVocabTargetId(lesson, index),
  async addIfMissing(targetId, lesson) {
    const { saveVocabRecall } = await import('./vocab-learning.ts');
    // Kiểm và tạo cùng transaction với luồng ghi ôn tập sẵn có (lồng vào nhau), nên bấm đúp hay hai tab không tạo trùng.
    return db.transaction('rw', db.reviewItems, db.pendingSync, async () => {
      if (await db.reviewItems.get(targetId)) return false;
      await saveVocabRecall({ targetId, lesson, grade: Rating.Again, elapsedMs: 0 });
      return true;
    });
  },
};

/** ID mục ôn tập của từ N5 mà mục glossary trỏ tới; null khi mục không có `vocabRef` hoặc từ không còn trong dữ liệu. */
export async function readingReviewTargetId(
  entry: Pick<ReadingGlossaryEntry, 'vocabRef'>,
  deps: Pick<ReadingReviewDeps, 'loadWords' | 'targetId'> = defaultDeps,
): Promise<string | null> {
  const ref = entry.vocabRef;
  if (!ref) return null;
  const index = (await deps.loadWords(ref.lesson)).findIndex((word) => word.id === ref.wordId);
  return index < 0 ? null : await deps.targetId(ref.lesson, index);
}

/**
 * Nút "+" trong popover: thêm từ N5 như một mục khó (chấm Again qua luồng vocab hiện có, nên FSRS và pendingSync
 * do luồng đó lo). Đã có trong lịch ôn thì giữ nguyên lịch cũ, không tạo trùng.
 */
export async function addReadingWordToReview(entry: Pick<ReadingGlossaryEntry, 'vocabRef'>, deps: ReadingReviewDeps = defaultDeps): Promise<ReadingReviewResult> {
  const targetId = await readingReviewTargetId(entry, deps);
  if (!targetId) return 'unsupported';
  return (await deps.addIfMissing(targetId, entry.vocabRef!.lesson)) ? 'added' : 'exists';
}
