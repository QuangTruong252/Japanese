import {
  HIRAGANA_BASIC_ROWS,
  HIRAGANA_DAKUON_ROWS,
  KATAKANA_BASIC_ROWS,
  KATAKANA_DAKUON_ROWS,
} from '../data/kana.ts';
import { hasStrokes } from './strokes.ts';
import type { WritingCard } from '../types/index.ts';

export type CharStatus = 'new' | 'due' | 'hard' | 'known';

const ROMAJI = new Map<string, { romaji: string; altRomaji?: string }>();
for (const rows of [HIRAGANA_BASIC_ROWS, KATAKANA_BASIC_ROWS, HIRAGANA_DAKUON_ROWS, KATAKANA_DAKUON_ROWS]) {
  for (const row of rows) {
    for (const cell of row.cells) {
      if (cell) ROMAJI.set(cell.kana, { romaji: cell.romaji, altRomaji: cell.altRomaji });
    }
  }
}

export function kanaInfo(char: string): { romaji: string; altRomaji?: string } | undefined {
  return ROMAJI.get(char);
}

/** Tham số URL là đầu vào không tin cậy: chỉ giữ chữ có dữ liệu nét, bỏ trùng, giữ thứ tự. */
export function parseWritingChars(param: string | null): string[] {
  if (!param) return [];
  return [...new Set([...param].filter(hasStrokes))];
}

/** Đến hạn ưu tiên hơn khó: chữ khó nhưng chưa đến hạn thì chưa cần ôn ngay. */
export function charStatus(card: WritingCard | undefined, now: Date): CharStatus {
  if (!card) return 'new';
  if (card.dueAt <= now) return 'due';
  return card.incorrectCount > 0 ? 'hard' : 'known';
}

export function writingCountsText(due: number, hard: number): string {
  return [due > 0 && `${due} chữ đến hạn`, hard > 0 && `${hard} chữ khó`].filter(Boolean).join(' · ');
}
