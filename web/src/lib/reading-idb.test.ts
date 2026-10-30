import 'fake-indexeddb/auto';
import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { makeDialogueFixture } from './reading.test-helpers.ts';
import type { ReadingPassage } from '../types/reading.ts';
import { READING_PASSAGES } from './reading-data.ts';
import type { ReadingAction } from './reading-session.ts';

// IndexedDB thật (fake-indexeddb) và hai "tab": mỗi tab nạp riêng một bản reading-store/reading-review/db.ts (hậu tố ?tab=N lan theo import tương đối),
// nên có hai kết nối Dexie độc lập cùng một database, giống hai tab trình duyệt. `@/` là alias của app mà node không phân giải.
const srcRoot = new URL('../', import.meta.url).href;
register(`data:text/javascript,${encodeURIComponent(`
export const resolve = async (spec, ctx, next) => {
  const tab = /\\?tab=\\d+$/.exec(ctx.parentURL ?? '')?.[0] ?? '';
  const result = await next(spec.startsWith('@/') ? ${JSON.stringify(srcRoot)} + spec.slice(2) + '.ts' : spec, ctx);
  return tab && result.url.startsWith('file:') && !result.url.includes('node_modules') ? { ...result, url: result.url + tab } : result;
};`)}`);

const tabs = await Promise.all([1, 2].map(async (n) => ({
  db: (await import(`./db.ts?tab=${n}`) as typeof import('./db.ts')).db,
  store: await import(`./reading-store.ts?tab=${n}`) as typeof import('./reading-store.ts'),
  review: await import(`./reading-review.ts?tab=${n}`) as typeof import('./reading-review.ts'),
})));
const [a, b] = tabs as [(typeof tabs)[number], (typeof tabs)[number]];
assert.notEqual(a.db, b.db);

const scope = { lesson: 10, minCoverage: 85, maxNewGrammar: 2 };
let passage: ReadingPassage;
before(async () => { passage = await makeDialogueFixture(); });
beforeEach(async () => {
  await Promise.all([a.db.readingSessions.clear(), a.db.reviewItems.clear(), a.db.pendingSync.clear()]);
});
after(() => { a.db.close(); b.db.close(); });

const correctOf = (s: { passage: ReadingPassage; questionIndex: number }) => s.passage.questions[s.questionIndex]!;
const wrongOf = (s: { passage: ReadingPassage; questionIndex: number }) => { const q = correctOf(s); return q.options.find((o) => o.id !== q.correctOptionId)!.id; };

test('mở phiên: lưu thật, mở lại (cả từ tab khác) tiếp tục đúng phiên dở, không tạo thêm', async () => {
  const first = await a.store.openReadingSession(passage, scope);
  assert.deepEqual(await a.store.getReadingSession(first.id), first);
  const again = await b.store.openReadingSession(passage, scope);
  assert.equal(again.id, first.id);
  assert.equal(await a.db.readingSessions.count(), 1);
  assert.equal((await b.store.findLatestUnfinishedSession())?.id, first.id);
});

test('hai tab mở cùng bài cùng lúc: kết nối nào cũng chỉ thấy phiên đã lưu, không mất phiên nào', async () => {
  const opened = await Promise.all([a.store.openReadingSession(passage, scope), b.store.openReadingSession(passage, scope)]);
  const stored = await a.db.readingSessions.toArray();
  assert.ok(stored.length >= 1 && stored.length <= 2);
  for (const s of opened) assert.ok(stored.some((x) => x.id === s.id), 'phiên trả về phải đã nằm trong DB');
  // Nếu hai phiên cùng được tạo thì "tiếp tục" vẫn chọn một bản xác định, bản kia được giữ.
  const resumed = await a.store.findResumableSession(passage.id);
  assert.equal(resumed?.id, (await b.store.findResumableSession(passage.id))?.id);
});

test('làm trọn phiên qua updateReading, tab khác đọc lại đúng kết quả và điểm', async () => {
  let s = await a.store.openReadingSession(passage, scope);
  for (let i = 0; i < passage.questions.length; i++) {
    const ref = () => ({ revision: s.revision, questionIndex: s.questionIndex });
    const pick = i === 0 ? wrongOf(s) : correctOf(s).correctOptionId;
    const actions: ReadingAction[] = [{ type: 'select', optionId: pick }, { type: 'submit' }, ...(i < passage.questions.length - 1 ? [{ type: 'next' as const }] : [])];
    for (const action of actions) {
      const r = await a.store.updateReading(s.id, action, ref());
      assert.equal(r.status, 'applied', JSON.stringify(action));
      s = (r as { session: typeof s }).session;
    }
  }
  const reloaded = (await b.store.getReadingSession(s.id))!;
  assert.deepEqual(reloaded, s);
  assert.ok(reloaded.completedAt);
  assert.equal(reloaded.answers.length, 3);
  assert.equal(await b.store.findResumableSession(passage.id), undefined);
  assert.equal(await b.store.findLatestUnfinishedSession(), undefined);
});

test('hai tab chọn đáp án khác nhau từ cùng revision: một bên applied, bên kia stale, bản ghi giữ đúng lựa chọn của bên thắng', async () => {
  const s = await a.store.openReadingSession(passage, scope);
  const q = correctOf(s);
  const [x, y] = q.options.map((o) => o.id);
  const ref = { revision: s.revision, questionIndex: s.questionIndex };
  const results = await Promise.all([
    a.store.updateReading(s.id, { type: 'select', optionId: x! }, ref),
    b.store.updateReading(s.id, { type: 'select', optionId: y! }, ref),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), ['applied', 'stale']);
  const stored = (await a.db.readingSessions.get(s.id))!;
  assert.equal(stored.revision, 1);
  const winner = results.findIndex((r) => r.status === 'applied');
  assert.equal(stored.selectedOptionId, winner === 0 ? x : y);
  // Tab thua nạp lại `session` từ kết quả stale và phát lại được từ revision mới.
  const loser = results[1 - winner] as { session: typeof stored };
  assert.deepEqual(loser.session, stored);
});

test('hai tab cùng nộp một câu: đáp án đầu giữ nguyên, lần nộp thứ hai là noop, không ghi đè', async () => {
  const s0 = await a.store.openReadingSession(passage, scope);
  const picked = wrongOf(s0);
  const sel = await a.store.updateReading(s0.id, { type: 'select', optionId: picked }, { revision: 0, questionIndex: 0 });
  assert.equal(sel.status, 'applied');
  const ref = { revision: 1, questionIndex: 0 };
  const results = await Promise.all([
    a.store.updateReading(s0.id, { type: 'submit' }, ref),
    b.store.updateReading(s0.id, { type: 'submit' }, ref),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), ['applied', 'noop']);
  const stored = (await b.db.readingSessions.get(s0.id))!;
  assert.deepEqual(stored.answers, [{ questionId: correctOf(s0).id, selectedOptionId: picked }]);
  assert.equal(stored.revision, 2);
});

test('action từ màn hình cũ sau khi tab khác đã đi tiếp bị stale, không ghi', async () => {
  const s0 = await a.store.openReadingSession(passage, scope);
  const pick = correctOf(s0).correctOptionId;
  await a.store.updateReading(s0.id, { type: 'select', optionId: pick }, { revision: 0, questionIndex: 0 });
  await a.store.updateReading(s0.id, { type: 'submit' }, { revision: 1, questionIndex: 0 });
  const before = (await a.db.readingSessions.get(s0.id))!;
  const stale = await b.store.updateReading(s0.id, { type: 'select', optionId: wrongOf(s0) }, { revision: 0, questionIndex: 0 });
  assert.equal(stale.status, 'stale');
  assert.deepEqual(await b.db.readingSessions.get(s0.id), before);
});

test('updateReading: ID không có → missing; bản ghi hỏng → invalid và giữ nguyên', async () => {
  assert.deepEqual(await a.store.updateReading('khong-co', { type: 'submit' }, { revision: 0, questionIndex: 0 }), { status: 'missing' });
  const s = await a.store.openReadingSession(passage, scope);
  const broken = { ...s, questionIndex: 99 };
  await a.db.readingSessions.put(broken);
  assert.deepEqual(await b.store.updateReading(s.id, { type: 'submit' }, { revision: 0, questionIndex: 99 }), { status: 'invalid' });
  assert.deepEqual(await a.db.readingSessions.get(s.id), broken);
});

test('làm lại: bài còn trong catalog tạo phiên mới và giữ nguyên phiên cũ; bài không còn thì null, không ghi gì', async () => {
  const real = READING_PASSAGES[0]!;
  let s = await a.store.openReadingSession(real, scope);
  s = (await a.store.updateReading(s.id, { type: 'select', optionId: correctOf(s).options[0]!.id }, { revision: 0, questionIndex: 0 }) as { session: typeof s }).session;
  const next = await b.store.restartReading(s.id);
  assert.ok(next && next.id !== s.id && next.revision === 0 && next.passage.id === real.id);
  assert.deepEqual(await a.db.readingSessions.get(s.id), s);
  assert.equal(await a.db.readingSessions.count(), 2);

  const orphan = await a.store.openReadingSession(passage, scope);
  assert.equal(await b.store.restartReading(orphan.id), null);
  assert.equal(await a.db.readingSessions.count(), 3);
});

const entry = { vocabRef: { lesson: 10, wordId: 'arimasu' } };

test('nút "+" thật: lần đầu tạo một reviewItem và một pendingSync, lần hai (tab khác) báo đã có và không tạo trùng', async () => {
  assert.equal(await a.review.addReadingWordToReview(entry), 'added');
  assert.equal(await b.review.addReadingWordToReview(entry), 'exists');
  assert.equal(await a.review.addReadingWordToReview(entry), 'exists');
  const items = await b.db.reviewItems.toArray();
  const id = (await a.review.readingReviewTargetId(entry))!;
  assert.deepEqual(items.map((i) => i.targetId), [id]);
  assert.deepEqual([items[0]!.targetType, items[0]!.lesson, items[0]!.incorrectCount], ['vocab', 10, 1]);
  assert.equal(await b.db.pendingSync.count(), 1);
});

test('nút "+" thật: hai tab bấm cùng lúc chỉ tạo một mục, kết quả added + exists', async () => {
  const results = await Promise.all([a.review.addReadingWordToReview(entry), b.review.addReadingWordToReview(entry), a.review.addReadingWordToReview(entry)]);
  assert.deepEqual([...results].sort(), ['added', 'exists', 'exists']);
  assert.equal(await a.db.reviewItems.count(), 1);
  assert.equal(await a.db.pendingSync.count(), 1);
});

test('nút "+" thật: từ đã có trong lịch ôn giữ nguyên lịch, không ghi pendingSync', async () => {
  await a.review.addReadingWordToReview(entry);
  const id = (await a.review.readingReviewTargetId(entry))!;
  const seeded = { ...(await a.db.reviewItems.get(id))!, correctCount: 4, incorrectCount: 0, dueAt: new Date('2027-01-01') };
  await a.db.reviewItems.put(seeded);
  await a.db.pendingSync.clear();
  assert.equal(await b.review.addReadingWordToReview(entry), 'exists');
  assert.deepEqual(await b.db.reviewItems.get(id), seeded);
  assert.equal(await b.db.pendingSync.count(), 0);
});
