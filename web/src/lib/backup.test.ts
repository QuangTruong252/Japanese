import { test } from 'node:test';
import { db } from './db.ts';
import assert from 'node:assert/strict';
import {
  parseAndValidateImport,
  mergeReviewItems,
  mergePracticeSessions,
  validateReviewItem,
  isReplacePayload,
  validateWritingCard,
  mergeWritingCards,
  createExportData,
  executeImport,
  executeWipeAllData,
  type ParsedImportData,
} from './backup.ts';
import type { ReviewItem, PracticeSession, WritingCard } from '../types/index.ts';
import { createDictationSession, answerDictation } from './dictation-session.ts';
import { applyTranslationAction, createTranslationSession } from './translation-session.ts';
import { applyReadingAction, createReadingSession } from './reading-session.ts';
import { makeDialogueFixture } from './reading.test-helpers.ts';

const createMockReviewItem = (overrides?: Partial<ReviewItem>): ReviewItem => ({
  targetId: 'vocab-1-1',
  targetType: 'vocab',
  lesson: 1,
  incorrectCount: 0,
  correctCount: 2,
  dueAt: new Date('2026-09-25T00:00:00.000Z'),
  updatedAt: '2026-09-22T10:00:00.000Z',
  createdAt: '2026-09-20T10:00:00.000Z',
  recentElapsedMs: [1500, 2000],
  fsrsCard: {
    due: new Date('2026-09-25T00:00:00.000Z'),
    stability: 2,
    difficulty: 4,
    elapsed_days: 1,
    scheduled_days: 3,
    reps: 2,
    lapses: 0,
    state: 2,
    last_review: new Date('2026-09-22T10:00:00.000Z'),
    learning_steps: 0,
  } as unknown as ReviewItem['fsrsCard'],
  ...overrides,
});

const createMockSession = (overrides?: Partial<PracticeSession>): PracticeSession => ({
  id: 'sess-1',
  selectedLessons: [1],
  exerciseTypes: ['mc'],
  totalQuestions: 10,
  correctCount: 9,
  accuracyRate: 0.9,
  durationSeconds: 120,
  createdAt: '2026-09-22T10:00:00.000Z',
  ...overrides,
});

test('parseAndValidateImport: từ chối JSON không hợp lệ', () => {
  const res = parseAndValidateImport('not-a-json', 'corrupt.json');
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.code, 'INVALID_JSON');
  }
});

test('parseAndValidateImport: từ chối file không đúng app hoặc schemaVersion mới hơn', () => {
  const notApp = JSON.stringify({ app: 'other-app', schemaVersion: 1 });
  const res1 = parseAndValidateImport(notApp);
  assert.equal(res1.ok, false);
  if (!res1.ok) assert.equal(res1.code, 'NOT_AN_APP_FILE');

  const futureVer = JSON.stringify({ app: 'minna-n5', schemaVersion: 99 });
  const res2 = parseAndValidateImport(futureVer);
  assert.equal(res2.ok, false);
  if (!res2.ok) assert.equal(res2.code, 'UNSUPPORTED_VERSION');
});

test('parseAndValidateImport: nạp thành công và chuyển dueAt string thành Date', () => {
  const valid = {
    schemaVersion: 1,
    app: 'minna-n5',
    exportedAt: '2026-09-22T11:00:00.000Z',
    reviewItems: [createMockReviewItem()],
    practiceSessions: [createMockSession()],
  };

  const res = parseAndValidateImport(JSON.stringify(valid), 'tien-do.json');
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.data.reviewItems.length, 1);
    assert.ok(res.data.reviewItems[0].dueAt instanceof Date);
    assert.equal(res.data.reviewItems[0].dueAt.toISOString(), '2026-09-25T00:00:00.000Z');
    assert.ok(res.data.reviewItems[0].fsrsCard.due instanceof Date);
    assert.equal(res.data.practiceSessions.length, 1);
  }
});

test('parseAndValidateImport: bỏ qua bản ghi hỏng và đếm số bỏ qua', () => {
  const mixed = {
    schemaVersion: 1,
    app: 'minna-n5',
    reviewItems: [
      createMockReviewItem({ targetId: 'valid-1' }),
      { targetId: '', targetType: 'invalid-type' }, // Hỏng
      { targetId: 'corrupt-2', dueAt: 'not-a-date' }, // Hỏng
      createMockReviewItem({ targetId: 'valid-2' }),
    ],
    practiceSessions: [
      createMockSession({ id: 'sess-1' }),
      { id: '' }, // Hỏng
    ],
  };

  const res = parseAndValidateImport(JSON.stringify(mixed));
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.data.reviewItems.length, 2);
    assert.equal(res.data.skippedReviewItemsCount, 2);
    assert.equal(res.data.practiceSessions.length, 1);
    assert.equal(res.data.skippedSessionsCount, 1);
  }
});

test('validateReviewItem: từ chối targetType không hợp lệ hoặc thiếu fsrsCard', () => {
  assert.equal(validateReviewItem(null), null);
  assert.equal(validateReviewItem({ targetId: '1', targetType: 'unknown' }), null);
  assert.equal(validateReviewItem({ targetId: '1', targetType: 'vocab', fsrsCard: null }), null);
});

test('mergeReviewItems: mục trùng targetId thì bản có updatedAt mới hơn sẽ thắng', () => {
  const existing: ReviewItem[] = [
    createMockReviewItem({
      targetId: 'vocab-1',
      correctCount: 1,
      updatedAt: '2026-09-20T10:00:00.000Z',
    }),
    createMockReviewItem({
      targetId: 'vocab-2',
      correctCount: 5,
      updatedAt: '2026-09-22T10:00:00.000Z',
    }),
  ];

  const incoming: ReviewItem[] = [
    // vocab-1 mới hơn existing -> lấy incoming
    createMockReviewItem({
      targetId: 'vocab-1',
      correctCount: 3,
      updatedAt: '2026-09-21T10:00:00.000Z',
    }),
    // vocab-2 cũ hơn existing -> giữ existing
    createMockReviewItem({
      targetId: 'vocab-2',
      correctCount: 2,
      updatedAt: '2026-09-21T10:00:00.000Z',
    }),
    // vocab-3 mới hoàn toàn -> thêm vào
    createMockReviewItem({
      targetId: 'vocab-3',
      correctCount: 4,
      updatedAt: '2026-09-22T11:00:00.000Z',
    }),
  ];

  const merged = mergeReviewItems(existing, incoming);
  assert.equal(merged.length, 3);

  const v1 = merged.find((i) => i.targetId === 'vocab-1');
  assert.equal(v1?.correctCount, 3);

  const v2 = merged.find((i) => i.targetId === 'vocab-2');
  assert.equal(v2?.correctCount, 5);

  const v3 = merged.find((i) => i.targetId === 'vocab-3');
  assert.equal(v3?.correctCount, 4);
});

test('mergePracticeSessions: khử trùng lặp theo session id', () => {
  const existing: PracticeSession[] = [createMockSession({ id: 's1', correctCount: 8 })];
  const incoming: PracticeSession[] = [
    createMockSession({ id: 's1', correctCount: 9 }),
    createMockSession({ id: 's2', correctCount: 10 }),
  ];

  const merged = mergePracticeSessions(existing, incoming);
  assert.equal(merged.length, 2);
});

test('isReplacePayload: máy chưa liên kết tài khoản không bao giờ gửi replaced', () => {
  assert.equal(isReplacePayload('replace', null), false);
  assert.equal(isReplacePayload('replace', 'user-1'), true);
  assert.equal(isReplacePayload('merge', 'user-1'), false);
});

const createMockWritingCard = (overrides?: Partial<WritingCard>): WritingCard => ({
  char: 'あ',
  fsrsCard: createMockReviewItem().fsrsCard,
  dueAt: new Date('2026-09-25T00:00:00.000Z'),
  correctCount: 2,
  incorrectCount: 1,
  lastFailedAt: '2026-09-21T00:00:00.000Z',
  createdAt: '2026-09-20T00:00:00.000Z',
  updatedAt: '2026-09-22T00:00:00.000Z',
  ...overrides,
});

test('validateWritingCard: restores dates and applies the review timestamp fallbacks', () => {
  const raw = createMockWritingCard();
  const restored = validateWritingCard(JSON.parse(JSON.stringify(raw)));
  assert.deepEqual(restored, raw);
  assert.ok(restored?.fsrsCard.last_review instanceof Date);
  const fallback = validateWritingCard({ ...raw, createdAt: null, updatedAt: 'invalid', lastFailedAt: 'invalid' });
  assert.ok(fallback);
  assert.ok(!Number.isNaN(Date.parse(fallback.updatedAt)));
  assert.equal(fallback.createdAt, fallback.updatedAt);
  assert.equal(fallback.lastFailedAt, undefined);
});

test('validateWritingCard: rejects invalid characters, counts, dates and FSRS cards', () => {
  const valid = createMockWritingCard();
  for (const invalid of [null, {},
    { ...valid, char: '' }, { ...valid, char: 'あい' },
    { ...valid, correctCount: -1 }, { ...valid, incorrectCount: -1 },
    { ...valid, correctCount: NaN }, { ...valid, incorrectCount: Infinity },
    { ...valid, dueAt: 'invalid' }, { ...valid, fsrsCard: undefined },
    { ...valid, fsrsCard: { ...valid.fsrsCard, due: 'invalid' } },
  ]) assert.equal(validateWritingCard(invalid), null);
});

test('parseAndValidateImport: accepts writing-only data, skips bad cards and restores dates', () => {
  const res = parseAndValidateImport(JSON.stringify({
    schemaVersion: 1, app: 'minna-n5', writingCards: [createMockWritingCard(), { char: '' }],
  }));
  assert.ok(res.ok);
  assert.equal(res.data.writingCards?.length, 1);
  assert.equal(res.data.skippedWritingCardsCount, 1);
  assert.deepEqual(res.data.writingCards?.[0], createMockWritingCard());
  assert.deepEqual(res.data.reviewItems, []);
  assert.deepEqual(res.data.practiceSessions, []);
});

test('parseAndValidateImport: old backups omit writingCards; explicit empty arrays stay present', () => {
  const old = { schemaVersion: 1, app: 'minna-n5', reviewItems: [createMockReviewItem()] };
  const res = parseAndValidateImport(JSON.stringify(old));
  assert.ok(res.ok);
  assert.equal(res.data.writingCards, undefined);
  assert.equal(Object.hasOwn(res.data, 'writingCards'), false);
  assert.equal(res.data.skippedWritingCardsCount, 0);
  const empty = parseAndValidateImport(JSON.stringify({ ...old, writingCards: [] }));
  assert.ok(empty.ok);
  assert.deepEqual(empty.data.writingCards, []);
  const invalid = parseAndValidateImport(JSON.stringify({ schemaVersion: 1, app: 'minna-n5', writingCards: [{}] }));
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.code, 'NO_VALID_DATA');
});

test('parseAndValidateImport: non-array writingCards are omitted', () => {
  for (const writingCards of [null, {}, 'invalid']) {
    const res = parseAndValidateImport(JSON.stringify({
      schemaVersion: 1, app: 'minna-n5', reviewItems: [createMockReviewItem()], writingCards,
    }));
    assert.ok(res.ok);
    assert.equal(res.data.writingCards, undefined);
    assert.equal(res.data.skippedWritingCardsCount, 0);
  }
});

test('parseAndValidateImport: all-invalid writing cards are omitted without losing the skipped count', () => {
  const res = parseAndValidateImport(JSON.stringify({
    schemaVersion: 1, app: 'minna-n5', reviewItems: [createMockReviewItem()],
    writingCards: [{ char: '' }, { char: 'あい' }],
  }));
  assert.ok(res.ok);
  assert.equal(res.data.writingCards, undefined);
  assert.equal(res.data.skippedWritingCardsCount, 2);
  assert.equal(res.data.reviewItems.length, 1);
});

test('mergeWritingCards: newer or equal incoming wins; older incoming loses; new characters added', () => {
  const existing = [createMockWritingCard(), createMockWritingCard({ char: 'い' }), createMockWritingCard({ char: 'う' })];
  const incoming = [
    createMockWritingCard({ updatedAt: '2026-09-23T00:00:00.000Z', correctCount: 3 }),
    createMockWritingCard({ char: 'い', updatedAt: '2026-09-21T00:00:00.000Z', correctCount: 4 }),
    createMockWritingCard({ char: 'う', correctCount: 5 }),
    createMockWritingCard({ char: 'え' }),
  ];
  const merged = mergeWritingCards(existing, incoming);
  assert.deepEqual(merged.map((card) => [card.char, card.correctCount]), [['あ', 3], ['い', 2], ['う', 5], ['え', 2]]);
  assert.equal(existing[0].correctCount, 2);
});

test('createExportData: includes writing cards and keeps schemaVersion 1', async (t) => {
  const writing = [createMockWritingCard()];
  t.mock.method(db.reviewItems, 'toArray', async () => []);
  t.mock.method(db.practiceSessions, 'toArray', async () => []);
  t.mock.method(db.writingCards, 'toArray', async () => writing);
  t.mock.method(db.dictationSessions, 'toArray', async () => []);
  t.mock.method(db.translationSessions, 'toArray', async () => []);
  t.mock.method(db.readingSessions, 'toArray', async () => []);
  const data = await createExportData();
  assert.equal(data.schemaVersion, 1);
  assert.deepEqual(data.writingCards, writing);
  const parsed = parseAndValidateImport(JSON.stringify(data));
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.data.writingCards, writing);
});

for (const mode of ['replace', 'merge'] as const) {
  for (const kind of ['old', 'empty', 'cards'] as const) {
    test(`executeImport: ${mode} ${kind} backup respects writing field presence and sync isolation`, async (t) => {
      const existing = [createMockWritingCard(), createMockWritingCard({ char: 'い' })];
      const incoming = kind === 'cards' ? [createMockWritingCard({ correctCount: 3, updatedAt: '2026-09-23T00:00:00.000Z' })] : [];
      const data: ParsedImportData = {
        fileName: 'test.json', schemaVersion: 1, app: 'minna-n5', exportedAt: '2026-09-23T00:00:00.000Z',
        reviewItems: [], practiceSessions: [], skippedReviewItemsCount: 0, skippedSessionsCount: 0,
        skippedWritingCardsCount: 0, ...(kind === 'old' ? {} : { writingCards: incoming }),
      };
      t.mock.method(db, 'transaction', async (access: unknown, tables: unknown, run: () => Promise<unknown>) => {
        assert.equal(access, 'rw');
        assert.deepEqual(tables, [db.reviewItems, db.practiceSessions, db.pendingSync, db.writingCards, db.dictationSessions, db.translationSessions, db.readingSessions]);
        return run();
      });
      for (const table of [db.reviewItems, db.practiceSessions]) {
        t.mock.method(table, 'clear', async () => {});
        t.mock.method(table, 'toArray', async () => []);
        t.mock.method(table, 'bulkPut', async () => '');
      }
      const read = t.mock.method(db.writingCards, 'toArray', async () => existing);
      const clear = t.mock.method(db.writingCards, 'clear', async () => {});
      const put = t.mock.method(db.writingCards, 'bulkPut', async () => '');
      const sync = t.mock.method(db.pendingSync, 'add', async () => 'sync');
      const result = await executeImport(data, mode);
      if (kind === 'old') {
        assert.equal(read.mock.callCount(), 0);
        assert.equal(clear.mock.callCount(), 0);
        assert.equal(put.mock.callCount(), 0);
        assert.equal(result.writingCount, 0);
      } else {
        const expected = mode === 'replace' ? incoming : mergeWritingCards(existing, incoming);
        assert.equal(clear.mock.callCount(), mode === 'replace' ? 1 : 0);
        assert.equal(read.mock.callCount(), mode === 'merge' ? 1 : 0);
        assert.deepEqual(put.mock.calls[0].arguments, [expected]);
        assert.equal(result.writingCount, expected.length);
      }
      assert.equal(sync.mock.callCount(), 1);
      const syncRecord = sync.mock.calls[0].arguments[0];
      assert.ok(syncRecord);
      assert.deepEqual(syncRecord.payload,
        { v: 1, kind: 'import', reviewItems: [], sessions: [], replaced: false });
    });
  }
}

test('executeWipeAllData: clears writing cards in the same transaction as other learning tables', async (t) => {
  const tables = [db.reviewItems, db.practiceSessions, db.pendingSync, db.writingCards, db.dictationSessions, db.translationSessions, db.readingSessions];
  let inside = false;
  t.mock.method(db, 'transaction', async (access: unknown, actual: unknown, run: () => Promise<void>) => {
    assert.equal(access, 'rw'); assert.deepEqual(actual, tables);
    inside = true; await run(); inside = false;
  });
  const clears = tables.map((table) => t.mock.method(table, 'clear', async () => { assert.ok(inside); }));
  await executeWipeAllData();
  for (const clear of clears) assert.equal(clear.mock.callCount(), 1);
});

test('dictation backup roundtrip rejects corrupt snapshots and does not erase all-invalid data', () => {
  const session = createDictationSession('2026-10-27', 10);
  const payload = { app: 'minna-n5', schemaVersion: 1, dictationSessions: [session] };
  const parsed = parseAndValidateImport(JSON.stringify(payload));
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.data.dictationSessions, [session]);
  const corrupted = { ...session, answers: [{ value: '', correct: true }] };
  const mixed = parseAndValidateImport(JSON.stringify({ ...payload, reviewItems: [createMockReviewItem()], dictationSessions: [corrupted] }));
  assert.ok(mixed.ok);
  assert.equal(mixed.data.dictationSessions, undefined);
  assert.equal(mixed.data.skippedDictationSessionsCount, 1);
});

for (const mode of ['merge', 'replace'] as const) {
  test(`dictation ${mode} import stays local and old backup preserves sessions`, async (t) => {
    const base = createDictationSession('2026-10-27', 10);
    const progressed = answerDictation(base, 0, base.sentences[0].kana);
    t.mock.method(db, 'transaction', async (_access: unknown, _tables: unknown, run: () => Promise<unknown>) => run());
    for (const table of [db.reviewItems, db.practiceSessions, db.writingCards]) {
      t.mock.method(table, 'clear', async () => {});
      t.mock.method(table, 'toArray', async () => []);
      t.mock.method(table, 'bulkPut', async () => '');
    }
    const sync = t.mock.method(db.pendingSync, 'add', async () => 'sync');
    t.mock.method(db.dictationSessions, 'toArray', async () => [base]);
    const clear = t.mock.method(db.dictationSessions, 'clear', async () => {});
    const put = t.mock.method(db.dictationSessions, 'bulkPut', async () => '');
    const data: ParsedImportData = { fileName: 'test.json', schemaVersion: 1, app: 'minna-n5', exportedAt: new Date().toISOString(), reviewItems: [], practiceSessions: [], skippedReviewItemsCount: 0, skippedSessionsCount: 0, skippedWritingCardsCount: 0 };
    await executeImport(data, mode);
    assert.equal(put.mock.callCount(), 0);
    assert.equal(clear.mock.callCount(), 0);
    const result = await executeImport({ ...data, dictationSessions: [progressed] }, mode);
    assert.deepEqual(put.mock.calls[0].arguments[0], [progressed]);
    assert.equal(clear.mock.callCount(), mode === 'replace' ? 1 : 0);
    assert.equal(result.dictationCount, 1);
    const record = sync.mock.calls[1].arguments[0] as { payload: Record<string, unknown> };
    assert.equal('dictationSessions' in record.payload, false);
  });
}

test('translation backup roundtrip keeps self-confirmed answers, rejects forged automatic ones, and old backups stay readable', () => {
  const base = createTranslationSession(1, 'jp-vi', 5);
  const reviewing = applyTranslationAction(base, 0, { type: 'answer', value: 'không phải câu mẫu' });
  const confirmed = applyTranslationAction(reviewing, 0, { type: 'confirm', correct: true });
  const payload = { app: 'minna-n5', schemaVersion: 1, translationSessions: [confirmed] };
  const parsed = parseAndValidateImport(JSON.stringify(payload));
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.data.translationSessions, [confirmed]);
  assert.equal(parsed.data.skippedTranslationSessionsCount, 0);

  const forged = { ...confirmed, answers: [{ ...confirmed.answers[0], source: 'automatic' }] };
  const mixed = parseAndValidateImport(JSON.stringify({ ...payload, reviewItems: [createMockReviewItem()], translationSessions: [forged] }));
  assert.ok(mixed.ok);
  assert.equal(mixed.data.translationSessions, undefined);
  assert.equal(mixed.data.skippedTranslationSessionsCount, 1);

  const old = parseAndValidateImport(JSON.stringify({ app: 'minna-n5', schemaVersion: 1, reviewItems: [createMockReviewItem()] }));
  assert.ok(old.ok);
  assert.equal(old.data.translationSessions, undefined);
});

for (const mode of ['merge', 'replace'] as const) {
  test(`translation ${mode} import never erases local sessions when the backup has none`, async (t) => {
    const base = createTranslationSession(1, 'vi-jp', 5);
    const progressed = applyTranslationAction(base, 0, { type: 'unknown' });
    t.mock.method(db, 'transaction', async (_access: unknown, _tables: unknown, run: () => Promise<unknown>) => run());
    for (const table of [db.reviewItems, db.practiceSessions, db.writingCards, db.dictationSessions]) {
      t.mock.method(table, 'clear', async () => {});
      t.mock.method(table, 'toArray', async () => []);
      t.mock.method(table, 'bulkPut', async () => '');
    }
    t.mock.method(db.pendingSync, 'add', async () => 'sync');
    t.mock.method(db.translationSessions, 'toArray', async () => [base]);
    const clear = t.mock.method(db.translationSessions, 'clear', async () => {});
    const put = t.mock.method(db.translationSessions, 'bulkPut', async () => '');
    const data: ParsedImportData = { fileName: 'test.json', schemaVersion: 1, app: 'minna-n5', exportedAt: new Date().toISOString(), reviewItems: [], practiceSessions: [], skippedReviewItemsCount: 0, skippedSessionsCount: 0, skippedWritingCardsCount: 0 };
    await executeImport(data, mode);
    assert.equal(put.mock.callCount(), 0);
    assert.equal(clear.mock.callCount(), 0);
    const result = await executeImport({ ...data, translationSessions: [progressed] }, mode);
    assert.deepEqual(put.mock.calls[0].arguments[0], [progressed]);
    assert.equal(clear.mock.callCount(), mode === 'replace' ? 1 : 0);
    assert.equal(result.translationCount, 1);
  });
}

test('wipe clears translation sessions and the saved translation config', async (t) => {
  const clear = t.mock.method(db.translationSessions, 'clear', async () => {});
  const readingClear = t.mock.method(db.readingSessions, 'clear', async () => {});
  for (const table of [db.reviewItems, db.practiceSessions, db.pendingSync, db.writingCards, db.dictationSessions]) t.mock.method(table, 'clear', async () => {});
  t.mock.method(db, 'transaction', async (_access: unknown, _tables: unknown, run: () => Promise<void>) => run());
  const removed: string[] = [];
  const windowDesc = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { value: { localStorage: { removeItem: (key: string) => removed.push(key), getItem: () => null, setItem: () => {} } }, configurable: true });
  try { await executeWipeAllData(); }
  finally { if (windowDesc) Object.defineProperty(globalThis, 'window', windowDesc); else delete (globalThis as { window?: unknown }).window; }
  assert.equal(clear.mock.callCount(), 1);
  assert.equal(readingClear.mock.callCount(), 1);
  assert.ok(removed.includes('jp:translation-config'));
  assert.ok(removed.includes('jp:reading-scope'));
  assert.ok(removed.includes('jp:reading-display'));
});

const readingFixture = await makeDialogueFixture();
const readingScope = { lesson: 10, minCoverage: 90, maxNewGrammar: 1 };
const startedReading = () => createReadingSession(readingFixture, readingScope);
const progressedReading = () => {
  const s = startedReading();
  const picked = applyReadingAction(s, { type: 'select', optionId: 'a' }, { revision: 0, questionIndex: 0 }).session;
  return applyReadingAction(picked, { type: 'submit' }, { revision: 1, questionIndex: 0 }).session;
};

test('reading backup roundtrip: xuất có readingSessions, backup cũ thiếu trường vẫn đọc được, bản lỗi bị đếm', async (t) => {
  const session = progressedReading();
  t.mock.method(db.reviewItems, 'toArray', async () => [createMockReviewItem()]);
  t.mock.method(db.practiceSessions, 'toArray', async () => []);
  t.mock.method(db.writingCards, 'toArray', async () => []);
  t.mock.method(db.dictationSessions, 'toArray', async () => []);
  t.mock.method(db.translationSessions, 'toArray', async () => []);
  t.mock.method(db.readingSessions, 'toArray', async () => [session]);
  const exported = await createExportData();
  assert.deepEqual(exported.readingSessions, [session]);
  const parsed = parseAndValidateImport(JSON.stringify(exported));
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.data.readingSessions, [session]);
  assert.equal(parsed.data.skippedReadingSessionsCount, 0);

  const forged = { ...session, answers: [{ questionId: 'q1', selectedOptionId: 'khong-co' }] };
  const mixed = parseAndValidateImport(JSON.stringify({ ...exported, readingSessions: [session, forged] }));
  assert.ok(mixed.ok);
  assert.deepEqual(mixed.data.readingSessions, [session]);
  assert.equal(mixed.data.skippedReadingSessionsCount, 1);

  const badGlossary = { ...session, passage: { ...session.passage, glossary: [{ ...session.passage.glossary[0]!, exampleJp: { bad: true } }, ...session.passage.glossary.slice(1)] } };
  const typed = parseAndValidateImport(JSON.stringify({ ...exported, readingSessions: [session, badGlossary] }));
  assert.ok(typed.ok);
  assert.deepEqual([typed.data.readingSessions, typed.data.skippedReadingSessionsCount], [[session], 1]);

  const allBad = parseAndValidateImport(JSON.stringify({ ...exported, readingSessions: [forged] }));
  assert.ok(allBad.ok);
  assert.equal(allBad.data.readingSessions, undefined, 'toàn bản ghi lỗi không được hiểu là yêu cầu xóa');
  assert.equal(allBad.data.skippedReadingSessionsCount, 1);

  const old = parseAndValidateImport(JSON.stringify({ app: 'minna-n5', schemaVersion: 1, reviewItems: [createMockReviewItem()] }));
  assert.ok(old.ok);
  assert.equal(old.data.readingSessions, undefined);
  const empty = parseAndValidateImport(JSON.stringify({ app: 'minna-n5', schemaVersion: 1, reviewItems: [createMockReviewItem()], readingSessions: [] }));
  assert.ok(empty.ok);
  assert.deepEqual(empty.data.readingSessions, []);

  // Mảng đọc rỗng là ý định xóa; thiếu trường, sai kiểu hoặc toàn bản ghi lỗi vẫn là không có dữ liệu.
  const bare = { app: 'minna-n5', schemaVersion: 1, reviewItems: [], practiceSessions: [] };
  assert.ok(parseAndValidateImport(JSON.stringify({ ...bare, readingSessions: [] })).ok);
  for (const readingSessions of [undefined, null, {}, 'x', [forged]]) {
    const r = parseAndValidateImport(JSON.stringify({ ...bare, readingSessions }));
    assert.ok(!r.ok && r.code === 'NO_VALID_DATA');
  }
});

for (const mode of ['merge', 'replace'] as const) {
  test(`reading ${mode} import: backup cũ không động vào bảng đọc, mảng rỗng chỉ xóa khi replace`, async (t) => {
    const local = progressedReading();
    t.mock.method(db, 'transaction', async (_access: unknown, _tables: unknown, run: () => Promise<unknown>) => run());
    for (const table of [db.reviewItems, db.practiceSessions, db.writingCards, db.dictationSessions, db.translationSessions]) {
      t.mock.method(table, 'clear', async () => {});
      t.mock.method(table, 'toArray', async () => []);
      t.mock.method(table, 'bulkPut', async () => '');
    }
    t.mock.method(db.pendingSync, 'add', async () => 'sync');
    t.mock.method(db.readingSessions, 'toArray', async () => [local]);
    const clear = t.mock.method(db.readingSessions, 'clear', async () => {});
    const put = t.mock.method(db.readingSessions, 'bulkPut', async () => '');
    const data: ParsedImportData = { fileName: 'test.json', schemaVersion: 1, app: 'minna-n5', exportedAt: new Date().toISOString(), reviewItems: [], practiceSessions: [], skippedReviewItemsCount: 0, skippedSessionsCount: 0, skippedWritingCardsCount: 0 };

    await executeImport(data, mode);
    assert.equal(put.mock.callCount() + clear.mock.callCount(), 0);

    await executeImport({ ...data, readingSessions: [] }, mode);
    assert.equal(clear.mock.callCount(), mode === 'replace' ? 1 : 0);

    // Backup chỉ còn mảng đọc rỗng (mọi bảng khác rỗng) vẫn phải qua bước parse rồi xóa bảng khi replace.
    const emptyOnly = parseAndValidateImport(JSON.stringify({ app: 'minna-n5', schemaVersion: 1, readingSessions: [], reviewItems: [], practiceSessions: [] }));
    assert.ok(emptyOnly.ok);
    clear.mock.resetCalls();
    await executeImport(emptyOnly.data, mode);
    assert.equal(clear.mock.callCount(), mode === 'replace' ? 1 : 0);

    // Cùng ID với local nhưng bản chụp khác: merge giữ local và báo trùng; replace thay hẳn.
    const sameId = { ...local, passage: { ...local.passage, titleVi: 'khác' } };
    const fresh = { ...startedReading(), id: 'khac-id' };
    put.mock.resetCalls();
    const result = await executeImport({ ...data, readingSessions: [sameId, fresh] }, mode);
    if (mode === 'merge') {
      assert.deepEqual(put.mock.calls[0]!.arguments[0], [fresh]);
      assert.deepEqual([result.readingCount, result.readingDuplicates], [1, 1]);
    } else {
      assert.deepEqual(put.mock.calls[0]!.arguments[0], [sameId, fresh]);
      assert.deepEqual([result.readingCount, result.readingDuplicates], [2, 0]);
    }
  });
}
