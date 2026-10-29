import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import { register } from 'node:module';
import { State } from 'ts-fsrs';
import { addReadingWordToReview, readingReviewTargetId, type ReadingReviewDeps } from './reading-review.ts';
import { db } from './db.ts';
import { loadVocab } from './lessons.ts';
import type { PendingSyncRecord, ReviewItem } from '../types/index.ts';

// vocab-learning dùng alias `@/` mà node không phân giải; hook này chỉ để test chạy luồng ghi thật của nó.
const srcRoot = new URL('../', import.meta.url).href;
register(`data:text/javascript,${encodeURIComponent(`export const resolve = (spec, ctx, next) => next(spec.startsWith('@/') ? ${JSON.stringify(srcRoot)} + spec.slice(2) + '.ts' : spec, ctx);`)}`);

// Định dạng ID cố định ở đây để lệch với getVocabTargetId thì test của vocab-learning/ôn tập lộ ra ở chỗ khác.
const deps = (existing: Set<string> = new Set()) => {
  const created: [string, number][] = [];
  const value: ReadingReviewDeps = {
    loadWords: loadVocab,
    targetId: (lesson, index) => `vocab-${String(lesson).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`,
    async addIfMissing(targetId, lesson) {
      if (existing.has(targetId)) return false;
      existing.add(targetId);
      created.push([targetId, lesson]);
      return true;
    },
  };
  return { value, created };
};

test('targetId theo vị trí từ trong vocab của bài, không có vocabRef hoặc từ đã mất thì null', async () => {
  const words = await loadVocab(10);
  const index = words.findIndex((w) => w.id === 'arimasu');
  assert.ok(index >= 0);
  const expected = `vocab-10-${String(index + 1).padStart(2, '0')}`;
  assert.equal(await readingReviewTargetId({ vocabRef: { lesson: 10, wordId: 'arimasu' } }, deps().value), expected);
  assert.equal(await readingReviewTargetId({}, deps().value), null);
  assert.equal(await readingReviewTargetId({ vocabRef: { lesson: 10, wordId: 'khong-co' } }, deps().value), null);
});

test('mục không có ref N5 không tạo gì', async () => {
  const { value, created } = deps();
  assert.equal(await addReadingWordToReview({}, value), 'unsupported');
  assert.equal(await addReadingWordToReview({ vocabRef: { lesson: 10, wordId: 'khong-co' } }, value), 'unsupported');
  assert.deepEqual(created, []);
});

test('thêm lần đầu tạo mục khó; lần hai báo đã có, không tạo trùng', async () => {
  const { value, created } = deps();
  const entry = { vocabRef: { lesson: 10, wordId: 'arimasu' } };
  assert.equal(await addReadingWordToReview(entry, value), 'added');
  assert.equal(await addReadingWordToReview(entry, value), 'exists');
  assert.equal(created.length, 1);
  assert.equal(created[0]![1], 10);
});

test('từ đã có sẵn trong lịch ôn thì giữ nguyên', async () => {
  const entry = { vocabRef: { lesson: 10, wordId: 'arimasu' } };
  const id = (await readingReviewTargetId(entry, deps().value))!;
  const { value, created } = deps(new Set([id]));
  assert.equal(await addReadingWordToReview(entry, value), 'exists');
  assert.deepEqual(created, []);
});

// Dexie giả trong bộ nhớ: transaction chạy tuần tự, vào lồng thì dùng chung, lỗi thì trả bảng về như cũ.
function fakeDb(t: TestContext, seed: ReviewItem[] = [], failPendingAdd = false) {
  const reviewItems = new Map(seed.map((item) => [item.targetId, item]));
  const pending: PendingSyncRecord[] = [];
  const inside = new AsyncLocalStorage<true>();
  let queue: Promise<unknown> = Promise.resolve();
  t.mock.method(db.reviewItems, 'get', async (id: string) => reviewItems.get(id));
  t.mock.method(db.reviewItems, 'put', async (item: ReviewItem) => void reviewItems.set(item.targetId, item));
  t.mock.method(db.pendingSync, 'get', async (id: string) => pending.find((r) => r.id === id));
  t.mock.method(db.pendingSync, 'add', async (record: PendingSyncRecord) => {
    if (failPendingAdd) throw new Error('pendingSync lỗi');
    pending.push(record);
    return record.id;
  });
  t.mock.method(db, 'transaction', (async (_mode: unknown, _tables: unknown, _more: unknown, run?: () => Promise<unknown>) => {
    const body = (run ?? _more ?? _tables) as () => Promise<unknown>;
    if (inside.getStore()) return body();
    const result = queue.then(async () => {
      const before = [new Map(reviewItems), [...pending]] as const;
      try {
        return await inside.run(true, body);
      } catch (error) {
        reviewItems.clear();
        before[0].forEach((v, k) => reviewItems.set(k, v));
        pending.splice(0, pending.length, ...before[1]);
        throw error;
      }
    });
    queue = result.catch(() => {});
    return result;
  }) as unknown as typeof db.transaction);
  return { reviewItems, pending };
}

const arimasu = { vocabRef: { lesson: 10, wordId: 'arimasu' } };
const arimasuId = async () => (await readingReviewTargetId(arimasu))!;

test('luồng thật: lần đầu tạo đúng targetId với thẻ FSRS khó và một pendingSync', async (t) => {
  const { reviewItems, pending } = fakeDb(t);
  assert.equal(await addReadingWordToReview(arimasu), 'added');
  const id = await arimasuId();
  assert.match(id, /^vocab-10-\d{2}$/);
  assert.deepEqual([...reviewItems.keys()], [id]);
  const item = reviewItems.get(id)!;
  assert.deepEqual([item.targetType, item.lesson, item.correctCount, item.incorrectCount], ['vocab', 10, 0, 1]);
  assert.equal(item.fsrsCard.state, State.Learning);
  assert.ok(item.lastFailedAt);
  assert.equal(pending.length, 1);
  assert.deepEqual(pending[0]!.payload, { kind: 'practice', reviewItems: [item] });
});

test('luồng thật: hai lần gọi đồng thời chỉ tạo một mục và một pendingSync', async (t) => {
  const { reviewItems, pending } = fakeDb(t);
  const results = await Promise.all([addReadingWordToReview(arimasu), addReadingWordToReview(arimasu)]);
  assert.deepEqual([...results].sort(), ['added', 'exists']);
  assert.equal(reviewItems.size, 1);
  assert.equal(pending.length, 1);
});

test('luồng thật: pendingSync lỗi thì reviewItems cũng được hoàn lại', async (t) => {
  const { reviewItems, pending } = fakeDb(t, [], true);
  await assert.rejects(addReadingWordToReview(arimasu), /pendingSync lỗi/);
  assert.equal(reviewItems.size, 0);
  assert.equal(pending.length, 0);
});

test('luồng thật: từ đã có trong lịch ôn giữ nguyên lịch cũ, không ghi pendingSync', async (t) => {
  const id = await arimasuId();
  const existing = { targetId: id, targetType: 'vocab', lesson: 10, correctCount: 4, incorrectCount: 0, dueAt: new Date('2027-01-01'), updatedAt: '2026-10-01T00:00:00.000Z', createdAt: '2026-09-01T00:00:00.000Z', recentElapsedMs: [900] } as ReviewItem;
  const { reviewItems, pending } = fakeDb(t, [existing]);
  assert.equal(await addReadingWordToReview(arimasu), 'exists');
  assert.equal(reviewItems.get(id), existing);
  assert.equal(pending.length, 0);
});
