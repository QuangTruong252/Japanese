import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import type { ReadingPassage } from '../types/reading.ts';
import {
  DEFAULT_READING_FILTER,
  isReadingEligible,
  knownTypes,
  listReadingPassages,
  loadReadingScope,
  parseReadingScope,
  readingNewCounts,
  readingStatuses,
  resolveReadingScope,
  saveReadingScope,
  READING_SCOPE_KEY,
  type ReadingScope,
} from './reading.ts';

const bucket = (byLesson: Record<string, number>, unknownTypes = 0) => ({ totalTypes: Object.values(byLesson).reduce((a, b) => a + b, 0) + unknownTypes, byLesson, unknownTypes });
const passage = (id: string, vocab: ReturnType<typeof bucket>, grammar: ReturnType<typeof bucket> = bucket({})): ReadingPassage =>
  ({ id, coverage: { version: 2, vocab, grammar } }) as ReadingPassage;
const scope = (lesson: number, minCoverage = 90, maxNewGrammar = 1): ReadingScope => ({ lesson, minCoverage, maxNewGrammar });

test('knownTypes cộng byLesson[1..N], newCounts đếm loại chưa biết kể cả unknown', () => {
  const p = passage('a', bucket({ 3: 4, 10: 3 }, 1), bucket({ 3: 1, 12: 1 }, 1));
  assert.equal(knownTypes(p.coverage.vocab, 2), 0);
  assert.equal(knownTypes(p.coverage.vocab, 3), 4);
  assert.equal(knownTypes(p.coverage.vocab, 25), 7);
  assert.deepEqual(readingNewCounts(p, 3), { newVocab: 4, newGrammar: 2 });
  assert.deepEqual(readingNewCounts(p, 12), { newVocab: 1, newGrammar: 1 });
});

test('lọc coverage ở biên: so sánh số nguyên, không làm tròn', () => {
  // 9/10 = 90% đúng ngưỡng; 8/9 = 88,9% không đạt 89% dù làm tròn sẽ thành 89.
  const nine = passage('a', bucket({ 1: 9 }, 1));
  assert.equal(isReadingEligible(nine, scope(1, 90)), true);
  assert.equal(isReadingEligible(nine, scope(1, 91)), false);
  const eight = passage('b', bucket({ 1: 8 }, 1));
  assert.equal(isReadingEligible(eight, scope(1, 89)), false);
  assert.equal(isReadingEligible(eight, scope(1, 88)), true);
  assert.equal(isReadingEligible(nine, scope(1, 100)), false);
  assert.equal(isReadingEligible(passage('c', bucket({ 1: 5 })), scope(1, 100)), true);
});

test('từ unknown luôn là mới; mốc thấp loại bài, mốc cao nhận bài', () => {
  const p = passage('a', bucket({ 5: 10 }, 1));
  assert.equal(isReadingEligible(p, scope(4, 80)), false);
  assert.equal(isReadingEligible(p, scope(5, 90)), true);
  assert.equal(isReadingEligible(p, scope(25, 100)), false);
});

test('totalTypes = 0 là bài không hợp lệ', () => {
  assert.equal(isReadingEligible(passage('a', bucket({})), scope(25, 80)), false);
});

test('ngữ pháp mới: tối đa maxNewGrammar, external luôn tính mới', () => {
  const p = passage('a', bucket({ 1: 10 }), bucket({ 1: 2, 5: 1 }, 1));
  assert.equal(isReadingEligible(p, scope(1, 90, 1)), false);
  assert.equal(isReadingEligible(p, scope(1, 90, 2)), true);
  assert.equal(isReadingEligible(p, scope(5, 90, 1)), true);
  assert.equal(isReadingEligible(p, scope(5, 90, 0)), false);
});

test('sắp xếp: đang dở, chưa đọc, đã xong; ít mục mới trước, rồi ID; đang dở thắng đã xong', () => {
  const passages = [
    passage('d', bucket({ 1: 10 }, 1)),
    passage('c', bucket({ 1: 10 })),
    passage('b', bucket({ 1: 10 })),
    passage('a', bucket({ 1: 10 })),
    passage('e', bucket({ 1: 10 }, 1)),
    passage('x', bucket({ 9: 10 })),
  ];
  const statuses = readingStatuses([
    { passage: passages[2]!, completedAt: '2026-10-29T00:00:00.000Z' },
    { passage: passages[0]!, completedAt: '2026-10-29T00:00:00.000Z' },
    { passage: passages[0]!, completedAt: undefined },
  ]);
  const items = listReadingPassages(passages, scope(1), statuses);
  assert.deepEqual(items.map((i) => [i.passage.id, i.status]), [
    ['d', 'in-progress'], ['a', 'unread'], ['c', 'unread'], ['e', 'unread'], ['b', 'completed'],
  ]);
  assert.equal(items.find((i) => i.passage.id === 'a')!.hasNew, false);
  assert.equal(items.find((i) => i.passage.id === 'e')!.hasNew, true);
});

test('parseReadingScope: hợp lệ trả đủ, thiếu/sai bất kỳ trường nào bỏ cả cấu hình', () => {
  const ok = JSON.stringify({ version: 1, lesson: 10, minCoverage: 85, maxNewGrammar: 2 });
  assert.deepEqual(parseReadingScope(ok), { lesson: 10, minCoverage: 85, maxNewGrammar: 2 });
  for (const bad of [
    { version: 2, lesson: 10, minCoverage: 90, maxNewGrammar: 1 },
    { version: 1, lesson: 0, minCoverage: 90, maxNewGrammar: 1 },
    { version: 1, lesson: 26, minCoverage: 90, maxNewGrammar: 1 },
    { version: 1, lesson: 1.5, minCoverage: 90, maxNewGrammar: 1 },
    { version: 1, lesson: 10, minCoverage: 79, maxNewGrammar: 1 },
    { version: 1, lesson: 10, minCoverage: 101, maxNewGrammar: 1 },
    { version: 1, lesson: 10, minCoverage: 90, maxNewGrammar: 3 },
    { version: 1, lesson: 10, minCoverage: 90 },
  ]) assert.equal(parseReadingScope(JSON.stringify(bad)), null);
  assert.equal(parseReadingScope('{hỏng'), null);
  assert.equal(parseReadingScope(null), null);
  assert.equal(parseReadingScope('null'), null);
});

test('resolveReadingScope: đã lưu thắng; chưa có thì lấy learnedThroughLesson > 0; bằng 0 phải chọn', () => {
  const stored = scope(7, 85, 0);
  assert.deepEqual(resolveReadingScope(stored, 12), stored);
  assert.deepEqual(resolveReadingScope(null, 12), { lesson: 12, ...DEFAULT_READING_FILTER });
  assert.equal(resolveReadingScope(null, 0), null);
  assert.equal(resolveReadingScope(null, 99), null);
});

/** Thay `window` toàn cục trong một test rồi trả lại như cũ. */
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
function stubWindow(t: TestContext, value: unknown) {
  Object.defineProperty(globalThis, 'window', { value, configurable: true });
  t.after(() => {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else delete (globalThis as { window?: unknown }).window;
  });
}

test('load/save scope qua localStorage; lỗi localStorage không ném', (t) => {
  const store = new Map<string, string>();
  const fakeWindow = { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) } };
  stubWindow(t, fakeWindow);
  assert.equal(loadReadingScope(), null);
  assert.equal(saveReadingScope(scope(6, 95, 0)), true);
  assert.deepEqual(JSON.parse(store.get(READING_SCOPE_KEY)!), { version: 1, lesson: 6, minCoverage: 95, maxNewGrammar: 0 });
  assert.deepEqual(loadReadingScope(), scope(6, 95, 0));
  store.set(READING_SCOPE_KEY, '{"version":1,"lesson":6}');
  assert.equal(loadReadingScope(), null);

  const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('quota'); } };
  stubWindow(t, { localStorage: blocked });
  assert.equal(loadReadingScope(), null);
  assert.equal(saveReadingScope(scope(6)), false);
});
