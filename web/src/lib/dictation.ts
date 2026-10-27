import source from '../data/n5/dictation.json' with { type: 'json' };
import { containsKanji, normalizeJapaneseInput, parseFurigana, toKanaSentence } from './japanese.ts';

export interface DictationSentence {
  id: string;
  lesson: number;
  minimumLesson: number;
  jp: string;
  kana: string;
  vi: string;
}

export const DICTATION_DATA_VERSION = source.version;

// Chỉ tập câu đã duyệt được đóng gói; không suy phạm vi từ việc dò chuỗi con.
export const DICTATION_SENTENCES: DictationSentence[] = source.sentences
  .map(({ id, lesson, minimumLesson, jp, vi }) => ({ id, lesson, minimumLesson, jp, vi, kana: toKanaSentence(jp) }))
  .filter((sentence) => !containsKanji(sentence.kana) && !/[\[\]0-9０-９A-Za-z]/u.test(sentence.kana));

export function localDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function hash(text: string): number {
  let value = 2166136261;
  for (const character of text) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return value >>> 0;
}

export function selectDailyDictation(day: string, scope: number): DictationSentence[] {
  if (!Number.isInteger(scope) || scope < 1 || scope > 25 || !/^\d{4}-\d{2}-\d{2}$/u.test(day)) return [];
  const date = new Date(`${day}T12:00:00`);
  if (!Number.isFinite(date.getTime()) || localDay(date) !== day) return [];

  const seed = `${day}:${scope}:${DICTATION_DATA_VERSION}`;
  const groups = new Map<number, DictationSentence[]>();
  for (const sentence of DICTATION_SENTENCES) {
    if (sentence.minimumLesson > scope) continue;
    const group = groups.get(sentence.lesson) ?? [];
    group.push(sentence);
    groups.set(sentence.lesson, group);
  }
  const rank = (key: string) => hash(`${seed}:${key}`);
  const lessons = [...groups.keys()].sort((a, b) => rank(`lesson:${a}`) - rank(`lesson:${b}`) || a - b);
  for (const group of groups.values()) {
    group.sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));
  }

  const selected: DictationSentence[] = [];
  // Mỗi lượt lấy một câu mỗi bài trước khi dùng câu thứ hai của cùng bài.
  for (let round = 0; selected.length < 5; round++) {
    let added = false;
    for (const lesson of lessons) {
      const sentence = groups.get(lesson)![round];
      if (!sentence) continue;
      selected.push(sentence);
      added = true;
      if (selected.length === 5) break;
    }
    if (!added) break;
  }
  return selected;
}

export function isDictationAnswer(value: string, sentence: DictationSentence): boolean {
  const answer = normalizeJapaneseInput(value);
  if (!answer) return false;
  let positions = new Set([0]);
  // IME có thể đổi chỉ vài cụm sang kanji; mỗi cụm chỉ nhận chữ gốc hoặc cách đọc đã có.
  for (const { base, ruby } of parseFurigana(sentence.jp)) {
    const variants = new Set([base, ...(ruby ? [ruby] : [])].map(normalizeJapaneseInput));
    const next = new Set<number>();
    for (const position of positions) {
      for (const variant of variants) {
        if (answer.startsWith(variant, position)) next.add(position + variant.length);
      }
    }
    if (next.size === 0) return false;
    positions = next;
  }
  return positions.has(answer.length);
}
