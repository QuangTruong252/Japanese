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

/** Ký tự Hán — dùng để kiểm câu đã kana hóa hết chưa */
const KANJI_CHAR = /[一-鿿㐀-䶿々〆ヶ]/;

/** Dấu câu bỏ qua khi chấm: người chép chính tả gõ hay không gõ đều được (SPEC-01 §4.5) */
const SKIPPED_PUNCTUATION = /[。、．，！？!?「」『』・…‥]/g;

/**
 * Chuyển câu notation furigana thành chuỗi kana thuần.
 * "私[わたし]は 会社員[かいしゃいん]です。" -> "わたしは かいしゃいんです。"
 * Không phân tích hình thái: chỉ thay mỗi cụm Kanji[đọc] bằng chính phần đọc.
 */
export function toKanaSentence(text: string): string {
  return text.replace(KANJI_RUN_WITH_READING, '$2');
}

/** Còn chữ Hán nghĩa là câu thiếu cách đọc — không đoán, loại khỏi bể câu hỏi nghe */
export function containsKanji(text: string): boolean {
  return KANJI_CHAR.test(text);
}

/**
 * Chuẩn hóa input câu trả lời người dùng:
 * - Chuyển Romaji sang Hiragana qua wanakana
 * - Chuyển full-width sang half-width hoặc ngược lại
 * - Xóa khoảng trắng thừa (cả dấu cách tiếng Nhật \u3000 lẫn Latin)
 */
export function normalizeJapaneseInput(input: string): string {
  if (!input) return '';
  const trimmed = input
    .normalize('NFKC')
    .trim()
    .replace(/[\s\u3000]+/g, '')
    .replace(SKIPPED_PUNCTUATION, '');
  return wanakana.toHiragana(trimmed, { useObsoleteKana: false });
}

/**
 * Chuyển romaji sang hiragana NGAY TRONG LÚC GÕ, giữ nguyên phụ âm chưa đủ cặp
 * ("h" vẫn là "h", "ha" thành "は"). Dùng cho ô nhập controlled của React.
 *
 * Không dùng `wanakana.bind()` cho ô nhập controlled: bind ghi thẳng vào DOM node,
 * còn React render lại từ state của nó và ghi đè ngược — state đọng lại ở "h" trong
 * khi màn hình hiện "は", và bài bị chấm sai (SPEC-04 §B.3).
 */
export function toTypedKana(input: string): string {
  // NFKC gộp full-width ASCII về half-width ("ｈａ" -> "ha") và nửa-rộng katakana về
  // đủ-rộng. wanakana không tự làm bước này, nên IME ở chế độ chữ La-tinh đủ-rộng sẽ
  // không bao giờ chuyển được thành kana.
  return wanakana.toKana(input.normalize('NFKC'), { IMEMode: 'toHiragana' });
}

export { wanakana };
