import type { Lesson, LocalizedText, VocabWord } from '../types/index.ts';

export interface LessonSummary {
  number: number;
  level: 'n5' | 'n4';
  title: LocalizedText;
  jpTitle?: string;
  description: LocalizedText;
  verification: 'verified' | 'unverified';
  vocabCount: number;
  grammarCount: number;
}

interface VocabFile {
  level: 'n5' | 'n4';
  lesson: number;
  words: VocabWord[];
}

export const AVAILABLE_N5_LESSONS: readonly number[] = Object.freeze(
  Array.from({ length: 25 }, (_, i) => i + 1)
);

const LESSON_LOADERS: Record<number, () => Promise<{ default: unknown }>> = {
  1: () => import('../data/n5/lessons/lesson-01.json', { with: { type: 'json' } }),
  2: () => import('../data/n5/lessons/lesson-02.json', { with: { type: 'json' } }),
  3: () => import('../data/n5/lessons/lesson-03.json', { with: { type: 'json' } }),
  4: () => import('../data/n5/lessons/lesson-04.json', { with: { type: 'json' } }),
  5: () => import('../data/n5/lessons/lesson-05.json', { with: { type: 'json' } }),
  6: () => import('../data/n5/lessons/lesson-06.json', { with: { type: 'json' } }),
  7: () => import('../data/n5/lessons/lesson-07.json', { with: { type: 'json' } }),
  8: () => import('../data/n5/lessons/lesson-08.json', { with: { type: 'json' } }),
  9: () => import('../data/n5/lessons/lesson-09.json', { with: { type: 'json' } }),
  10: () => import('../data/n5/lessons/lesson-10.json', { with: { type: 'json' } }),
  11: () => import('../data/n5/lessons/lesson-11.json', { with: { type: 'json' } }),
  12: () => import('../data/n5/lessons/lesson-12.json', { with: { type: 'json' } }),
  13: () => import('../data/n5/lessons/lesson-13.json', { with: { type: 'json' } }),
  14: () => import('../data/n5/lessons/lesson-14.json', { with: { type: 'json' } }),
  15: () => import('../data/n5/lessons/lesson-15.json', { with: { type: 'json' } }),
  16: () => import('../data/n5/lessons/lesson-16.json', { with: { type: 'json' } }),
  17: () => import('../data/n5/lessons/lesson-17.json', { with: { type: 'json' } }),
  18: () => import('../data/n5/lessons/lesson-18.json', { with: { type: 'json' } }),
  19: () => import('../data/n5/lessons/lesson-19.json', { with: { type: 'json' } }),
  20: () => import('../data/n5/lessons/lesson-20.json', { with: { type: 'json' } }),
  21: () => import('../data/n5/lessons/lesson-21.json', { with: { type: 'json' } }),
  22: () => import('../data/n5/lessons/lesson-22.json', { with: { type: 'json' } }),
  23: () => import('../data/n5/lessons/lesson-23.json', { with: { type: 'json' } }),
  24: () => import('../data/n5/lessons/lesson-24.json', { with: { type: 'json' } }),
  25: () => import('../data/n5/lessons/lesson-25.json', { with: { type: 'json' } }),
};

const VOCAB_LOADERS: Record<number, () => Promise<{ default: unknown }>> = {
  1: () => import('../data/n5/vocab/lesson-01.json', { with: { type: 'json' } }),
  2: () => import('../data/n5/vocab/lesson-02.json', { with: { type: 'json' } }),
  3: () => import('../data/n5/vocab/lesson-03.json', { with: { type: 'json' } }),
  4: () => import('../data/n5/vocab/lesson-04.json', { with: { type: 'json' } }),
  5: () => import('../data/n5/vocab/lesson-05.json', { with: { type: 'json' } }),
  6: () => import('../data/n5/vocab/lesson-06.json', { with: { type: 'json' } }),
  7: () => import('../data/n5/vocab/lesson-07.json', { with: { type: 'json' } }),
  8: () => import('../data/n5/vocab/lesson-08.json', { with: { type: 'json' } }),
  9: () => import('../data/n5/vocab/lesson-09.json', { with: { type: 'json' } }),
  10: () => import('../data/n5/vocab/lesson-10.json', { with: { type: 'json' } }),
  11: () => import('../data/n5/vocab/lesson-11.json', { with: { type: 'json' } }),
  12: () => import('../data/n5/vocab/lesson-12.json', { with: { type: 'json' } }),
  13: () => import('../data/n5/vocab/lesson-13.json', { with: { type: 'json' } }),
  14: () => import('../data/n5/vocab/lesson-14.json', { with: { type: 'json' } }),
  15: () => import('../data/n5/vocab/lesson-15.json', { with: { type: 'json' } }),
  16: () => import('../data/n5/vocab/lesson-16.json', { with: { type: 'json' } }),
  17: () => import('../data/n5/vocab/lesson-17.json', { with: { type: 'json' } }),
  18: () => import('../data/n5/vocab/lesson-18.json', { with: { type: 'json' } }),
  19: () => import('../data/n5/vocab/lesson-19.json', { with: { type: 'json' } }),
  20: () => import('../data/n5/vocab/lesson-20.json', { with: { type: 'json' } }),
  21: () => import('../data/n5/vocab/lesson-21.json', { with: { type: 'json' } }),
  22: () => import('../data/n5/vocab/lesson-22.json', { with: { type: 'json' } }),
  23: () => import('../data/n5/vocab/lesson-23.json', { with: { type: 'json' } }),
  24: () => import('../data/n5/vocab/lesson-24.json', { with: { type: 'json' } }),
  25: () => import('../data/n5/vocab/lesson-25.json', { with: { type: 'json' } }),
};

const lessonCache = new Map<number, Promise<Lesson>>();
const vocabCache = new Map<number, Promise<VocabWord[]>>();

/**
 * Nạp động dữ liệu ngữ pháp và câu ví dụ của một bài học N5.
 * Được cache trong bộ nhớ (memoize) để không parse lại.
 */
export function loadLesson(lessonNum: number): Promise<Lesson> {
  const loader = LESSON_LOADERS[lessonNum];
  if (!loader) {
    return Promise.reject(
      new Error(`Bài học N5 không tồn tại hoặc chưa hỗ trợ: bài ${lessonNum}`)
    );
  }

  let cached = lessonCache.get(lessonNum);
  if (!cached) {
    cached = loader().then((mod) => mod.default as Lesson);
    lessonCache.set(lessonNum, cached);
  }

  return cached;
}

/**
 * Nạp động dữ liệu từ vựng của một bài học N5.
 */
export function loadVocab(lessonNum: number): Promise<VocabWord[]> {
  const loader = VOCAB_LOADERS[lessonNum];
  if (!loader) {
    return Promise.reject(
      new Error(`Từ vựng bài học N5 không tồn tại hoặc chưa hỗ trợ: bài ${lessonNum}`)
    );
  }

  let cached = vocabCache.get(lessonNum);
  if (!cached) {
    cached = loader().then((mod) => (mod.default as VocabFile).words);
    vocabCache.set(lessonNum, cached);
  }

  return cached;
}

/**
 * Nạp đồng thời bài học và từ vựng của một bài.
 */
export async function loadLessonData(
  lessonNum: number
): Promise<{ lesson: Lesson; vocab: VocabWord[] }> {
  const [lesson, vocab] = await Promise.all([
    loadLesson(lessonNum),
    loadVocab(lessonNum),
  ]);
  return { lesson, vocab };
}

/**
 * Nạp danh sách các bài học đã chọn (phục vụ SPEC-04 luyện tập theo bài).
 */
export async function loadLessons(lessonNums: number[]): Promise<Lesson[]> {
  return Promise.all(lessonNums.map((n) => loadLesson(n)));
}

/**
 * Nạp từ vựng của nhiều bài học dưới dạng Map<lessonNumber, VocabWord[]>.
 */
export async function loadVocabMap(
  lessonNums: number[]
): Promise<Map<number, VocabWord[]>> {
  const entries = await Promise.all(
    lessonNums.map(async (n) => [n, await loadVocab(n)] as const)
  );
  return new Map(entries);
}

/**
 * Nạp thông tin tóm tắt của một bài học (cho danh sách /hoc).
 */
export async function loadLessonSummary(lessonNum: number): Promise<LessonSummary> {
  const { lesson, vocab } = await loadLessonData(lessonNum);
  return {
    number: lesson.number,
    level: lesson.level,
    title: lesson.title,
    jpTitle: lesson.jpTitle,
    description: lesson.description,
    verification: lesson.verification ?? 'unverified',
    vocabCount: vocab.length,
    grammarCount: lesson.grammar.length,
  };
}

/**
 * Nạp danh sách tóm tắt toàn bộ 25 bài học N5 phục vụ màn /hoc (SPEC-03 §2, §5).
 */
export async function loadLessonSummaries(): Promise<LessonSummary[]> {
  return Promise.all(AVAILABLE_N5_LESSONS.map((n) => loadLessonSummary(n)));
}

/**
 * Xóa bộ nhớ cache (dùng trong test hoặc khi nạp lại dữ liệu).
 */
export function clearLessonCache(): void {
  lessonCache.clear();
  vocabCache.clear();
}

/**
 * Đổi tham số route `/hoc/[so]` thành số bài, hoặc null nếu không hợp lệ (SPEC-03 §3, SPEC-12 §7).
 * Regex chặn cả '01', '1.5', '1e1', ' 1 ' — Number() một mình nhận hết những thứ đó.
 */
export function parseLessonNumber(raw: string): number | null {
  const n = /^[1-9][0-9]*$/.test(raw) ? Number(raw) : NaN;
  return AVAILABLE_N5_LESSONS.includes(n) ? n : null;
}
