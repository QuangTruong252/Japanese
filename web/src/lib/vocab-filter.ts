/** Nhóm lọc từ vựng trong một bài, phân theo reviewItem của từ (targetId theo vị trí từ trong bài). */
export type VocabFilter = 'all' | 'new' | 'reviewing' | 'hard';

/** Ngưỡng từ khó: cùng trang Điểm yếu và "Chữ khó" luyện viết. */
const HARD_MIN_INCORRECT = 1;

/** Phải khớp `getVocabTargetId`; viết lại ở đây vì module đó kéo theo Dexie nên test node không nạp được. */
export function vocabTargetId(lesson: number, index: number): string {
  return `vocab-${String(lesson).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
}

/** Nhóm cụ thể của một từ; `incorrectCount` undefined nghĩa là chưa có reviewItem. */
export function classifyVocab(incorrectCount: number | undefined): Exclude<VocabFilter, 'all'>[] {
  if (incorrectCount === undefined) return ['new'];
  return incorrectCount >= HARD_MIN_INCORRECT ? ['reviewing', 'hard'] : ['reviewing'];
}

/**
 * `reviews` ánh xạ targetId → incorrectCount của reviewItem. Trả về số đếm từng nhóm và chỉ số các từ
 * thuộc từng nhóm (từ khó cũng tính là đang ôn).
 */
export function groupVocab(lesson: number, total: number, reviews: ReadonlyMap<string, number>) {
  const indices: Record<VocabFilter, number[]> = { all: [], new: [], reviewing: [], hard: [] };
  for (let i = 0; i < total; i++) {
    indices.all.push(i);
    for (const g of classifyVocab(reviews.get(vocabTargetId(lesson, i)))) indices[g].push(i);
  }
  const counts = {
    all: indices.all.length,
    new: indices.new.length,
    reviewing: indices.reviewing.length,
    hard: indices.hard.length,
  } satisfies Record<VocabFilter, number>;
  return { counts, indices };
}

/** Lọc danh sách từ theo nhóm, giữ thứ tự bài. */
export function filterVocab<T>(words: readonly T[], indices: readonly number[]): T[] {
  return indices.map((i) => words[i]);
}
