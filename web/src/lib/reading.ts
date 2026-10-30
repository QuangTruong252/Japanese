import { getCharacter, MAIN_CHARACTER_IDS } from './characters.ts';
import { stripFurigana, toKanaSentence, wanakana } from './japanese.ts';
import { normalizeSearchText } from './search-text.ts';
import type { ReadingCoverageBucket, ReadingFilter, ReadingPassage, ReadingSession } from '../types/reading.ts';

export const READING_SCOPE_KEY = 'jp:reading-scope';

export const DEFAULT_READING_FILTER: ReadingFilter = { minCoverage: 90, maxNewGrammar: 1 };

export interface ReadingScope extends ReadingFilter {
  /** Mốc "Đến bài N", 1–25. */
  lesson: number;
}

export type ReadingStatus = 'in-progress' | 'unread' | 'completed';

const inRange = (v: unknown, min: number, max: number): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;

/** Số loại riêng biệt thuộc bài ≤ N. */
export function knownTypes(bucket: ReadingCoverageBucket, lesson: number): number {
  let sum = 0;
  for (const [key, count] of Object.entries(bucket.byLesson)) if (Number(key) <= lesson) sum += count;
  return sum;
}

export interface ReadingNewCounts {
  newVocab: number;
  newGrammar: number;
}

/** Từ mới = tổng − đã biết; ngữ pháp mới = mẫu bài > N cộng mẫu chưa ánh xạ. Đếm loại, không đếm lần dùng. */
export function readingNewCounts(passage: ReadingPassage, lesson: number): ReadingNewCounts {
  const { vocab, grammar } = passage.coverage;
  return { newVocab: vocab.totalTypes - knownTypes(vocab, lesson), newGrammar: grammar.totalTypes - knownTypes(grammar, lesson) };
}

/** So sánh số nguyên, không làm tròn: 100 × đã biết ≥ ngưỡng × tổng. Tổng = 0 là bài không hợp lệ. */
export function isReadingEligible(passage: ReadingPassage, scope: ReadingScope): boolean {
  const { vocab } = passage.coverage;
  if (vocab.totalTypes <= 0) return false;
  return 100 * knownTypes(vocab, scope.lesson) >= scope.minCoverage * vocab.totalTypes &&
    readingNewCounts(passage, scope.lesson).newGrammar <= scope.maxNewGrammar;
}

/** Đang dở ưu tiên hơn đã hoàn thành; chưa có phiên nào là chưa đọc. */
export function readingStatuses(sessions: Pick<ReadingSession, 'passage' | 'completedAt'>[]): Map<string, ReadingStatus> {
  const statuses = new Map<string, ReadingStatus>();
  for (const { passage, completedAt } of sessions) {
    if (!completedAt) statuses.set(passage.id, 'in-progress');
    else if (statuses.get(passage.id) !== 'in-progress') statuses.set(passage.id, 'completed');
  }
  return statuses;
}

export interface ReadingListItem extends ReadingNewCounts {
  passage: ReadingPassage;
  status: ReadingStatus;
  /** Có từ hoặc mẫu ngữ pháp mới so với mốc: hiện nhãn "Có kiến thức mới". */
  hasNew: boolean;
}

const STATUS_ORDER: Record<ReadingStatus, number> = { 'in-progress': 0, unread: 1, completed: 2 };

/** Dựng mục danh sách (đếm từ mới theo mốc `lesson`) rồi sắp: đang dở, chưa đọc, đã xong; mỗi nhóm ít mục mới trước, rồi ID. Không dùng điểm. */
export function buildReadingItems(
  passages: readonly ReadingPassage[],
  lesson: number,
  statuses: ReadonlyMap<string, ReadingStatus> = new Map(),
): ReadingListItem[] {
  return passages
    .map((passage) => {
      const counts = readingNewCounts(passage, lesson);
      return { passage, ...counts, status: statuses.get(passage.id) ?? 'unread', hasNew: counts.newVocab + counts.newGrammar > 0 };
    })
    .sort((a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      a.newVocab + a.newGrammar - (b.newVocab + b.newGrammar) ||
      (a.passage.id < b.passage.id ? -1 : a.passage.id > b.passage.id ? 1 : 0));
}

/** Lọc theo mốc rồi sắp. */
export function listReadingPassages(
  passages: readonly ReadingPassage[],
  scope: ReadingScope,
  statuses: ReadonlyMap<string, ReadingStatus> = new Map(),
): ReadingListItem[] {
  return buildReadingItems(passages.filter((passage) => isReadingEligible(passage, scope)), scope.lesson, statuses);
}

interface PassageSearchText { vi: string; jp: string }
const searchIndexes = new WeakMap<readonly ReadingPassage[], PassageSearchText[]>();

/** Phần tiếng Nhật gộp thêm bản hiragana để "マイ" khớp "まい"; id romaji của nhân vật chính chỉ gắn vào bài có nhân vật đó. */
function passageSearchText(p: ReadingPassage): PassageSearchText {
  const jp = [
    ...p.sentences.flatMap((s) => [stripFurigana(s.jp), toKanaSentence(s.jp)]),
    ...p.glossary.flatMap((g) => [stripFurigana(g.labelJp), g.reading ?? '']),
    ...(p.roles ?? []).flatMap((r) => [stripFurigana(r.name), toKanaSentence(r.name)]),
  ].join('\n');
  const cast = MAIN_CHARACTER_IDS.filter((id) => p.roles?.some((r) => r.id === id) || jp.includes(stripFurigana(getCharacter(id)!.name)));
  const vi = [p.titleVi, ...p.sentences.map((s) => s.vi), ...p.glossary.flatMap((g) => g.meaningsVi), ...cast].join('\n');
  return { vi: normalizeSearchText(vi), jp: normalizeSearchText(`${jp}\n${wanakana.toHiragana(jp)}`) };
}

/**
 * Mọi từ của truy vấn phải khớp. Từ đọc trọn thành kana thử thêm bản hiragana trên phần tiếng Nhật (サカナ → さかな,
 * hanami → はなみ); từ Latin dưới 3 chữ không đổi, vì từ Việt như "ca" thành か có trong gần như mọi bài. Truy vấn rỗng trả hết.
 */
export function searchReadingPassages(passages: readonly ReadingPassage[], query: string): ReadingPassage[] {
  const words = normalizeSearchText(query).split(' ').filter(Boolean);
  if (!words.length) return [...passages];
  let index = searchIndexes.get(passages);
  if (!index) searchIndexes.set(passages, (index = passages.map(passageSearchText)));
  const terms = words.map((w) => {
    const kana = wanakana.toHiragana(w);
    const usable = kana !== w && wanakana.isKana(kana) && (!/^[a-z]+$/u.test(w) || w.length >= 3);
    return { w, kana: usable ? kana : null };
  });
  return passages.filter((_, i) => {
    const { vi, jp } = index[i]!;
    return terms.every(({ w, kana }) => vi.includes(w) || jp.includes(w) || (kana !== null && jp.includes(kana)));
  });
}

/** Validate cả object; sai bất kỳ trường nào thì bỏ cả cấu hình. */
export function parseReadingScope(raw: string | null): ReadingScope | null {
  try {
    const c = JSON.parse(raw ?? '') as Record<string, unknown> | null;
    if (!c || c.version !== 1 || !inRange(c.lesson, 1, 25) || !inRange(c.minCoverage, 80, 100) || !inRange(c.maxNewGrammar, 0, 2)) return null;
    return { lesson: c.lesson, minCoverage: c.minCoverage, maxNewGrammar: c.maxNewGrammar };
  } catch {
    return null;
  }
}

/** Lỗi localStorage (bị chặn, hết dung lượng) không được chặn chọn mốc trong phiên hiện tại. */
export function loadReadingScope(): ReadingScope | null {
  try {
    return parseReadingScope(window.localStorage.getItem(READING_SCOPE_KEY));
  } catch {
    return null;
  }
}

export function saveReadingScope(scope: ReadingScope): boolean {
  try {
    window.localStorage.setItem(READING_SCOPE_KEY, JSON.stringify({ version: 1, ...scope }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Cấu hình đã lưu hợp lệ thắng; chưa có thì lấy `learnedThroughLesson` làm giá trị khởi đầu; bằng 0 thì
 * null: người học phải tự chọn mốc, không tự chọn bài 1. Tiến độ học đổi sau đó không đổi lựa chọn đã lưu.
 */
export function resolveReadingScope(stored: ReadingScope | null, learnedThroughLesson: number): ReadingScope | null {
  if (stored) return stored;
  return inRange(learnedThroughLesson, 1, 25) ? { lesson: learnedThroughLesson, ...DEFAULT_READING_FILTER } : null;
}
