import { isDictationAnswer, type DictationSentence } from './dictation.ts';
import { containsKanji, normalizeJapaneseInput, stripFurigana, toKanaSentence } from './japanese.ts';
import { TRANSLATION_SENTENCES, type TranslationSentence } from './translation-data.ts';

export type TranslationDirection = 'jp-vi' | 'vi-jp';
export type TranslationMode = TranslationDirection | 'mixed';
export type TranslationCount = number | 'all';

export const TRANSLATION_COUNTS = [5, 10, 20] as const;

const SENTENCE_BY_ID = new Map(TRANSLATION_SENTENCES.map((sentence) => [sentence.id, sentence]));

export const translationSentence = (id: string): TranslationSentence | undefined => SENTENCE_BY_ID.get(id);

export function availableTranslationSentences(scope: number): TranslationSentence[] {
  if (!Number.isInteger(scope) || scope < 1 || scope > 25) return [];
  return TRANSLATION_SENTENCES.filter((sentence) => sentence.minimumLesson <= scope);
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/** Mỗi câu nguồn chỉ có một chiều trong một lượt; Trộn chia gần đều hai chiều rồi xáo thứ tự. */
export function selectTranslationItems(
  scope: number,
  mode: TranslationMode,
  count: TranslationCount,
  random: () => number = Math.random,
): { id: string; direction: TranslationDirection }[] {
  const pool = shuffle(availableTranslationSentences(scope), random);
  const size = count === 'all' ? pool.length : Math.max(0, Math.min(Math.floor(count), pool.length));
  const picked = pool.slice(0, size);
  const directions: TranslationDirection[] = mode === 'mixed'
    ? shuffle(picked.map((_, i): TranslationDirection => (i % 2 ? 'vi-jp' : 'jp-vi')), random)
    : picked.map(() => mode);
  return picked.map((sentence, i) => ({ id: sentence.id, direction: directions[i]! }));
}

const EDGE_PUNCTUATION = /^[\p{P}\p{S}\s]+|[\p{P}\p{S}\s]+$/gu;

/** NFC, bỏ dấu câu đầu/cuối, gộp khoảng trắng, không phân biệt hoa/thường; dấu thanh được giữ. */
export function normalizeVietnamese(text: string): string {
  return text.normalize('NFC').toLowerCase().replace(/\s+/gu, ' ').replace(EDGE_PUNCTUATION, '');
}

// Bao hai đầu bằng dấu cách để "ăn" không khớp giữa "năn".
function vietnameseWords(text: string): string {
  return ` ${text.normalize('NFC').toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, ' ').trim()} `;
}

export function isTranslationMatch(value: string, sentence: TranslationSentence, direction: TranslationDirection): boolean {
  if (direction === 'jp-vi') {
    const answer = normalizeVietnamese(value);
    return answer !== '' && answer === normalizeVietnamese(sentence.vi);
  }
  // isDictationAnswer chỉ đọc `jp`; giữ nguyên quy tắc chấm kana/kanji của bài nghe.
  return isDictationAnswer(value, { jp: sentence.jp } as DictationSentence);
}

export interface KeywordCheck {
  /** Dạng hiển thị: tiếng Việt (Nhật → Việt) hoặc tiếng Nhật có furigana (Việt → Nhật). */
  text: string;
  hit: boolean;
}

/** Gợi ý đối chiếu ý chính, không phải kết luận đúng/sai. Từ khóa thiếu trường của chiều này thì bỏ qua. */
export function keywordChecks(value: string, sentence: TranslationSentence, direction: TranslationDirection): KeywordCheck[] {
  if (direction === 'jp-vi') {
    const words = vietnameseWords(value);
    return sentence.keywords.flatMap(({ vi }) => (vi ? [{ text: vi, hit: words.includes(vietnameseWords(vi)) }] : []));
  }
  const answer = normalizeJapaneseInput(value);
  return sentence.keywords.map(({ jp }) => {
    // Một ký tự kana (て) nằm được trong mọi từ khác (あるいて), nên chỉ tính khi viết bằng chữ Hán.
    const forms = [toKanaSentence(jp), stripFurigana(jp)].map(normalizeJapaneseInput).filter((form) => form.length >= 2 || containsKanji(form));
    return { text: jp, hit: answer !== '' && forms.some((form) => answer.includes(form)) };
  });
}

export interface TranslationHint {
  jp?: string;
  vi?: string;
}

/** Từ khóa đầu tiên có trường cần hiện; Việt → Nhật hiện cả từ Nhật và nghĩa, Nhật → Việt chỉ hiện nghĩa. */
export function translationHint(sentence: TranslationSentence, direction: TranslationDirection): TranslationHint | null {
  const keyword = direction === 'jp-vi' ? sentence.keywords.find((k) => k.vi) : sentence.keywords[0];
  if (!keyword) return null;
  return direction === 'jp-vi' ? { vi: keyword.vi } : { jp: keyword.jp, ...(keyword.vi ? { vi: keyword.vi } : {}) };
}
