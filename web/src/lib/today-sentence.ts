export interface TodaySentenceItem {
  jp: string;
  vi: string;
  kana?: string;
}

/**
 * Định dạng chuỗi YYYY-MM-DD theo giờ địa phương (SPEC-18 §3, "cố định trong ngày").
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Hàm băm chuỗi DJB2 tất định, trả về số nguyên không âm.
 */
export function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash >>> 0);
}

/**
 * Chọn câu ví dụ ngữ pháp cố định trong ngày cho bài học đang học (SPEC-18 v2).
 * - Cùng ngày + cùng bài -> luôn ra cùng một câu (idempotent / deterministic).
 * - Danh sách rỗng, null hoặc undefined -> trả về null để ẩn bong bóng thoại.
 * - 1 câu -> luôn trả về câu duy nhất đó.
 */
export function pickTodaySentence(
  examples?: TodaySentenceItem[] | null,
  dateOrKey?: Date | string,
  lessonNum?: number
): TodaySentenceItem | null {
  if (!examples || examples.length === 0) {
    return null;
  }
  if (examples.length === 1) {
    return examples[0];
  }

  const dateKey = typeof dateOrKey === 'string'
    ? dateOrKey
    : getLocalDateKey(dateOrKey instanceof Date ? dateOrKey : new Date());

  const key = lessonNum !== undefined ? `${dateKey}:lesson-${lessonNum}` : dateKey;
  const hash = hashString(key);
  const index = hash % examples.length;
  return examples[index] ?? examples[0];
}
