import * as wanakana from 'wanakana';

export interface FuriganaSegment {
  base: string;
  ruby?: string;
}

// Bắt chuỗi Kanji liền trước dấu ngoặc vuông chứa cách đọc
// Ví dụ: "食[た]べます" -> base: '食', ruby: 'た', base: 'べます'
const KANJI_RUN_WITH_READING = /([一-鿿㐀-䶿々〆〇ヶ]+)\[([^\]]+)\]/g;

/**
 * Phân tích chuỗi furigana notation thành các đoạn render <ruby>
 */
export function parseFurigana(text: string): FuriganaSegment[] {
  const segments: FuriganaSegment[] = [];
  let lastIndex = 0;

  const matches = text.matchAll(KANJI_RUN_WITH_READING);
  const pushPlain = (plain: string) => {
    if (plain) segments.push({ base: plain });
  };

  for (const match of matches) {
    const [, base, ruby] = match;
    pushPlain(text.slice(lastIndex, match.index));
    segments.push({ base: base ?? '', ruby });
    lastIndex = (match.index ?? 0) + match[0].length;
  }

  pushPlain(text.slice(lastIndex));
  return segments;
}

/**
 * Xóa bỏ furigana để lấy văn bản thuần (dùng cho tiêu đề, accessibility, câu hỏi trắc nghiệm đọc)
 */
export function stripFurigana(text: string): string {
  return text.replace(KANJI_RUN_WITH_READING, '$1');
}

/**
 * Chuẩn hóa input câu trả lời người dùng:
 * - Chuyển Romaji sang Hiragana qua wanakana
 * - Chuyển full-width sang half-width hoặc ngược lại
 * - Xóa khoảng trắng thừa (cả dấu cách tiếng Nhật \u3000 lẫn Latin)
 */
export function normalizeJapaneseInput(input: string): string {
  if (!input) return '';
  const trimmed = input.trim().replace(/[\s\u3000]+/g, '');
  return wanakana.toHiragana(trimmed, { useObsoleteKana: false });
}

export { wanakana };
