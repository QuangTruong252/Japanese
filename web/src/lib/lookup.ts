import type {
  KanjiData,
  KanjiExample,
  VerbItem,
  ReferenceDocument,
  VocabRef,
} from '../types/lookup.ts';
import { ALL_KANJI, KANJI_MAP } from '../data/n5/kanji-index.ts';
import verbsRaw from '../data/n5/verbs/verbs.json' with { type: 'json' };
import { stripFurigana } from './japanese.ts';

// 10 Bảng tham chiếu
import adjectivesDoc from '../data/n5/reference/adjectives.json' with { type: 'json' };
import calendarDoc from '../data/n5/reference/calendar.json' with { type: 'json' };
import countersDoc from '../data/n5/reference/counters.json' with { type: 'json' };
import demonstrativesDoc from '../data/n5/reference/demonstratives.json' with { type: 'json' };
import familyDoc from '../data/n5/reference/family.json' with { type: 'json' };
import greetingsDoc from '../data/n5/reference/greetings.json' with { type: 'json' };
import numbersDoc from '../data/n5/reference/numbers.json' with { type: 'json' };
import particlesDoc from '../data/n5/reference/particles.json' with { type: 'json' };
import questionWordsDoc from '../data/n5/reference/question-words.json' with { type: 'json' };
import timeDoc from '../data/n5/reference/time.json' with { type: 'json' };

// 25 File Từ vựng Minna no Nihongo N5
import vocab01 from '../data/n5/vocab/lesson-01.json' with { type: 'json' };
import vocab02 from '../data/n5/vocab/lesson-02.json' with { type: 'json' };
import vocab03 from '../data/n5/vocab/lesson-03.json' with { type: 'json' };
import vocab04 from '../data/n5/vocab/lesson-04.json' with { type: 'json' };
import vocab05 from '../data/n5/vocab/lesson-05.json' with { type: 'json' };
import vocab06 from '../data/n5/vocab/lesson-06.json' with { type: 'json' };
import vocab07 from '../data/n5/vocab/lesson-07.json' with { type: 'json' };
import vocab08 from '../data/n5/vocab/lesson-08.json' with { type: 'json' };
import vocab09 from '../data/n5/vocab/lesson-09.json' with { type: 'json' };
import vocab10 from '../data/n5/vocab/lesson-10.json' with { type: 'json' };
import vocab11 from '../data/n5/vocab/lesson-11.json' with { type: 'json' };
import vocab12 from '../data/n5/vocab/lesson-12.json' with { type: 'json' };
import vocab13 from '../data/n5/vocab/lesson-13.json' with { type: 'json' };
import vocab14 from '../data/n5/vocab/lesson-14.json' with { type: 'json' };
import vocab15 from '../data/n5/vocab/lesson-15.json' with { type: 'json' };
import vocab16 from '../data/n5/vocab/lesson-16.json' with { type: 'json' };
import vocab17 from '../data/n5/vocab/lesson-17.json' with { type: 'json' };
import vocab18 from '../data/n5/vocab/lesson-18.json' with { type: 'json' };
import vocab19 from '../data/n5/vocab/lesson-19.json' with { type: 'json' };
import vocab20 from '../data/n5/vocab/lesson-20.json' with { type: 'json' };
import vocab21 from '../data/n5/vocab/lesson-21.json' with { type: 'json' };
import vocab22 from '../data/n5/vocab/lesson-22.json' with { type: 'json' };
import vocab23 from '../data/n5/vocab/lesson-23.json' with { type: 'json' };
import vocab24 from '../data/n5/vocab/lesson-24.json' with { type: 'json' };
import vocab25 from '../data/n5/vocab/lesson-25.json' with { type: 'json' };

const ALL_REFERENCE_DOCS: ReferenceDocument[] = [
  adjectivesDoc as unknown as ReferenceDocument,
  calendarDoc as unknown as ReferenceDocument,
  countersDoc as unknown as ReferenceDocument,
  demonstrativesDoc as unknown as ReferenceDocument,
  familyDoc as unknown as ReferenceDocument,
  greetingsDoc as unknown as ReferenceDocument,
  numbersDoc as unknown as ReferenceDocument,
  particlesDoc as unknown as ReferenceDocument,
  questionWordsDoc as unknown as ReferenceDocument,
  timeDoc as unknown as ReferenceDocument,
].sort((a, b) => a.order - b.order);

const REFERENCE_MAP: Map<string, ReferenceDocument> = new Map(
  ALL_REFERENCE_DOCS.map((doc) => [doc.slug, doc])
);

const ALL_VERBS: VerbItem[] = (verbsRaw.verbs as unknown as VerbItem[]) ?? [];

const ALL_VOCAB_LESSONS = [
  vocab01, vocab02, vocab03, vocab04, vocab05,
  vocab06, vocab07, vocab08, vocab09, vocab10,
  vocab11, vocab12, vocab13, vocab14, vocab15,
  vocab16, vocab17, vocab18, vocab19, vocab20,
  vocab21, vocab22, vocab23, vocab24, vocab25,
];

const KANJI_CHAR_REGEX = /[一-鿿㐀-䶿々〆ヶ]/g;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Lấy toàn bộ 169 chữ Kanji N5.
 */
export function getAllKanji(): KanjiData[] {
  return ALL_KANJI;
}

/**
 * Lấy chi tiết một chữ Kanji theo ký tự chữ Hán (vd: '人').
 */
export function getKanjiByChar(char: string): KanjiData | undefined {
  return KANJI_MAP.get(char);
}

/**
 * Lấy toàn bộ 156 động từ N5 5 thể.
 */
export function getAllVerbs(): VerbItem[] {
  return ALL_VERBS;
}

/**
 * Lấy danh sách 10 bảng tham chiếu theo thứ tự chuẩn.
 */
export function getAllReferenceDocs(): ReferenceDocument[] {
  return ALL_REFERENCE_DOCS;
}

/**
 * Lấy bảng tham chiếu theo slug (vd: 'demonstratives').
 */
export function getReferenceDocBySlug(slug: string): ReferenceDocument | undefined {
  return REFERENCE_MAP.get(slug);
}

/**
 * Ví dụ Kanji đã có nghĩa tiếng Việt thật chưa (trùng tiếng Anh = chưa dịch, SPEC-12 §2.1).
 * Nếu vi trùng hệt en (không phân biệt hoa thường), mục đó chưa dịch thật.
 */
export function isExampleVerified(example: KanjiExample): boolean {
  if (!example.meaning?.vi || !example.meaning?.en) return false;
  return example.meaning.vi.trim().toLowerCase() !== example.meaning.en.trim().toLowerCase();
}

/**
 * Dựng chỉ mục tra ngược: từ ký tự Kanji (vd '人') sang danh sách từ vựng chứa chữ đó.
 */
export function buildKanjiVocabIndex(
  vocabByLesson: Array<{
    lesson: number;
    words: Array<{ id: string; word: string; kana: string; meaning: { vi: string; en?: string } }>;
  }>
): Map<string, VocabRef[]> {
  const index = new Map<string, VocabRef[]>();

  for (const lessonFile of vocabByLesson) {
    const lessonNum = lessonFile.lesson;
    const words = lessonFile.words;

    words.forEach((w, idx) => {
      const targetId = `vocab-${pad2(lessonNum)}-${pad2(idx + 1)}`;
      const plain = stripFurigana(w.word);
      const matched = plain.match(KANJI_CHAR_REGEX);
      if (!matched) return;

      const uniqueKanji = new Set(matched);
      const ref: VocabRef = {
        id: w.id,
        targetId,
        lesson: lessonNum,
        word: w.word,
        kana: w.kana,
        meaning: w.meaning,
      };

      for (const char of uniqueKanji) {
        let list = index.get(char);
        if (!list) {
          list = [];
          index.set(char, list);
        }
        list.push(ref);
      }
    });
  }

  return index;
}

let cachedKanjiVocabIndex: Map<string, VocabRef[]> | null = null;

/**
 * Lấy chỉ mục tra ngược Kanji ↔ Từ vựng trên toàn bộ 25 bài học N5.
 * Được cache singleton tại runtime.
 */
export function getKanjiVocabIndex(): Map<string, VocabRef[]> {
  if (!cachedKanjiVocabIndex) {
    cachedKanjiVocabIndex = buildKanjiVocabIndex(ALL_VOCAB_LESSONS);
  }
  return cachedKanjiVocabIndex;
}

/**
 * Lấy số bài học của Kanji: nếu có trong dữ liệu thì dùng, nếu không thì suy từ bài sớm nhất trong từ vựng.
 */
export function getKanjiLesson(kanji: KanjiData): number | undefined {
  if (kanji.lesson !== undefined) return kanji.lesson;
  const words = getKanjiVocabIndex().get(kanji.character);
  if (words && words.length > 0) {
    return Math.min(...words.map((w) => w.lesson));
  }
  return undefined;
}

/**
 * Lọc danh sách Kanji theo bài học, số nét và trạng thái "đã học".
 */
export function filterKanji(
  list: KanjiData[],
  filters: {
    lesson?: number | null;
    strokes?: number | null;
    onlyLearned?: boolean;
  },
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
    return true;
  });
}

/**
 * Lọc danh sách Động từ theo nhóm, bài học và từ khóa tìm kiếm q.
 */
export function filterVerbs(
  list: VerbItem[],
  filters: {
    group?: number | null;
    lesson?: number | null;
    query?: string;
  }
): VerbItem[] {
  const query = filters.query?.trim().toLowerCase() ?? '';

  return list.filter((v) => {
    if (filters.group && v.group !== filters.group) {
      return false;
    }
    if (filters.lesson && v.lesson !== filters.lesson) {
      return false;
    }
    if (query) {
      const matchDict = v.dictionary.toLowerCase().includes(query);
      const matchMasu = v.masu.toLowerCase().includes(query);
      const matchTe = v.te.toLowerCase().includes(query);
      const matchTa = v.ta.toLowerCase().includes(query);
      const matchNai = v.nai?.toLowerCase().includes(query) ?? false;
      const matchVerb = stripFurigana(v.verb).toLowerCase().includes(query);
      const matchMeaning = v.meaning.vi.toLowerCase().includes(query);

      if (
        !matchDict &&
        !matchMasu &&
        !matchTe &&
        !matchTa &&
        !matchNai &&
        !matchVerb &&
        !matchMeaning
      ) {
        return false;
      }
    }
    return true;
  });
}
