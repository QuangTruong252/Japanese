import * as wanakana from 'wanakana';
import type { KanjiData } from '@/types/lookup';
import { getKanjiLesson } from './lookup.ts';
import { normalizeSearchText } from './search.ts';

export interface KanjiFilterOptions {
  lesson?: number | null;
  strokes?: number | null;
  onlyLearned?: boolean;
  query?: string;
}

/**
 * Kiểm tra một chữ Kanji có khớp với từ khóa tìm kiếm hay không.
 * Hỗ trợ:
 * 1. Khớp trực tiếp ký tự Hán tự (vd: "人")
 * 2. Khớp nghĩa Hán Việt / Tiếng Việt (bỏ dấu, chuẩn hóa đ->d, vd: "nhân", "nhan", "người", "nguoi")
 * 3. Khớp âm On / Kun qua Kana (Hiragana/Katakana) hoặc Romaji (vd: "ひと", "hito", "ジン", "jin")
 */
export function matchKanjiQuery(kanji: KanjiData, rawQuery: string): boolean {
  const query = rawQuery.trim();
  if (!query) return true;

  // 1. Khớp ký tự Hán tự
  if (kanji.character.includes(query)) {
    return true;
  }

  // 2. Khớp nghĩa Hán Việt / Tiếng Việt (bỏ dấu, đ->d qua normalizeSearchText)
  const normQuery = normalizeSearchText(query);
  if (normQuery) {
    const meaningMatch = kanji.meanings.vi.some((meaning) => {
      const normMeaning = normalizeSearchText(meaning);
      return normMeaning.includes(normQuery);
    });
    if (meaningMatch) {
      return true;
    }
  }

  // 3. Khớp âm On/Kun qua Kana hoặc Romaji
  const queryLower = query.toLowerCase();
  const queryClean = queryLower.replace(/[.\s]/g, '');
  const queryCleanHira = wanakana.toHiragana(queryClean);
  const queryCleanKata = wanakana.toKatakana(queryClean);
  const queryCleanRomaji = wanakana.toRomaji(queryClean).toLowerCase();

  // Kiểm tra Onyomi (Katakana)
  for (const on of kanji.onyomi) {
    const onLower = on.toLowerCase();
    const onClean = onLower.replace(/[.\s]/g, '');
    const onHira = wanakana.toHiragana(onClean);
    const onRomaji = wanakana.toRomaji(onClean).toLowerCase();

    if (
      onLower.includes(queryLower) ||
      onClean.includes(queryClean) ||
      onClean.includes(queryCleanKata) ||
      onHira.includes(queryCleanHira) ||
      onRomaji.includes(queryCleanRomaji)
    ) {
      return true;
    }
  }

  // Kiểm tra Kunyomi (Hiragana, có thể có dấu chấm okurigana như あ.う)
  for (const kun of kanji.kunyomi) {
    const kunLower = kun.toLowerCase();
    const kunClean = kunLower.replace(/[.\s]/g, '');
    const kunKata = wanakana.toKatakana(kunClean);
    const kunRomaji = wanakana.toRomaji(kunClean).toLowerCase();

    if (
      kunLower.includes(queryLower) ||
      kunClean.includes(queryClean) ||
      kunClean.includes(queryCleanHira) ||
      kunKata.includes(queryCleanKata) ||
      kunRomaji.includes(queryCleanRomaji)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Lọc danh sách Kanji theo bài học, số nét, trạng thái đã học và từ khóa tìm kiếm.
 */
export function filterKanjiWithQuery(
  list: KanjiData[],
  filters: KanjiFilterOptions,
  learnedCharSet?: Set<string>
): KanjiData[] {
  return list.filter((k) => {
    if (filters.lesson) {
      const l = getKanjiLesson(k);
      if (l !== filters.lesson) return false;
    }
    if (filters.strokes && k.strokes !== filters.strokes) {
      return false;
    }
    if (filters.onlyLearned && (!learnedCharSet || !learnedCharSet.has(k.character))) {
      return false;
    }
    if (filters.query && !matchKanjiQuery(k, filters.query)) {
      return false;
    }
    return true;
  });
}
