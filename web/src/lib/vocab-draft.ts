// Nháp lượt học flashcard: giữ đúng thẻ đang học khi tải lại trang (localStorage).
const VOCAB_DRAFT_VERSION = 1;

export type RatingCounts = Record<'again' | 'hard' | 'good' | 'easy', number>;

export interface VocabDraft {
  targetIds: string[];
  currentIndex: number;
  /** Số thẻ đã chấm theo từng mức, để màn tổng kết đúng cả khi lượt học bị tải lại giữa chừng. */
  counts?: RatingCounts;
}

function parseCounts(value: unknown): RatingCounts | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const v = value as Record<string, unknown>;
  const keys = ['again', 'hard', 'good', 'easy'] as const;
  if (!keys.every((k) => typeof v[k] === 'number' && Number.isInteger(v[k]) && (v[k] as number) >= 0)) return undefined;
  return { again: v.again as number, hard: v.hard as number, good: v.good as number, easy: v.easy as number };
}

export function vocabDraftKey(lesson: number): string {
  return `jp:vocab-draft:${lesson}`;
}

/** Đọc nháp lượt học; dữ liệu hỏng, lệch phiên bản hoặc chứa từ không còn trong bài thì bỏ. */
export function parseVocabDraft(raw: string | null, knownIds: ReadonlySet<string>): VocabDraft | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as { version?: unknown; targetIds?: unknown; currentIndex?: unknown; counts?: unknown };
    if (value.version !== VOCAB_DRAFT_VERSION || !Array.isArray(value.targetIds)) return null;
    const targetIds = value.targetIds.filter((id): id is string => typeof id === 'string');
    if (targetIds.length === 0 || targetIds.length !== value.targetIds.length) return null;
    if (!targetIds.every((id) => knownIds.has(id))) return null;
    const index = value.currentIndex;
    if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index >= targetIds.length) return null;
    const counts = parseCounts(value.counts);
    return counts ? { targetIds, currentIndex: index, counts } : { targetIds, currentIndex: index };
  } catch {
    return null;
  }
}

export function serializeVocabDraft(draft: VocabDraft): string {
  return JSON.stringify({ version: VOCAB_DRAFT_VERSION, ...draft });
}

// Đọc/ghi localStorage cho useSyncExternalStore. Ghi trong cùng tab cũng phải báo cho người nghe.
const listeners = new Set<() => void>();

export function subscribeVocabDraft(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

export function readVocabDraftRaw(lesson: number): string | null {
  try {
    return window.localStorage.getItem(vocabDraftKey(lesson));
  } catch {
    return null;
  }
}

export function writeVocabDraft(lesson: number, draft: VocabDraft | null): void {
  try {
    if (draft) window.localStorage.setItem(vocabDraftKey(lesson), serializeVocabDraft(draft));
    else window.localStorage.removeItem(vocabDraftKey(lesson));
  } catch {
    // Hết quota hoặc chế độ riêng tư: bỏ qua, chỉ mất khả năng học tiếp.
  }
  listeners.forEach((listener) => listener());
}
