import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAndValidateImport,
  mergeReviewItems,
  mergePracticeSessions,
  validateReviewItem,
} from './backup.ts';
import type { ReviewItem, PracticeSession } from '../types/index.ts';

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
