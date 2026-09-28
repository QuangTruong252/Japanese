import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTargetLabels,
  collectTargetIds,
  countByTargetType,
  describeNextReviews,
  describeRemainingBatches,
  lessonFromTargetId,
  overdueDays,
  planReviewBatch,
  resolveNextBatchPlan,
  selectNewTargetIds,
  withDeclaredLessons,
} from './review-queue.ts';
import type { QuestionItem, ReviewItem } from '../types/index.ts';

const q = (over: Partial<QuestionItem>): QuestionItem => ({
  id: 'q',
  type: 'mc',
  lesson: 1,
  auxiliaryLessons: [1],
  targetId: 'vocab-01-01',
  prompt: 'p',
  answer: 'a',
  ...over,
});

const mockItem = (over: Partial<ReviewItem>): ReviewItem => ({
  targetId: 'vocab-01-01',
  targetType: 'vocab',
  lesson: 1,
  correctCount: 0,
  incorrectCount: 0,
  dueAt: new Date(),
  createdAt: '2026-09-20T00:00:00.000Z',
  updatedAt: '2026-09-20T00:00:00.000Z',
  fsrsCard: {
    due: new Date(),
    stability: 1,
    difficulty: 1,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    state: 0,
    last_review: new Date(),
    learning_steps: 0,
  },
  recentElapsedMs: [],
  ...over,
});

test('lessonFromTargetId đọc số bài, trợ từ không có số bài', () => {
  assert.equal(lessonFromTargetId('vocab-03-07'), 3);
  assert.equal(lessonFromTargetId('grammar-12-01'), 12);
  assert.equal(lessonFromTargetId('particle-wo'), 0);
});

test('collectTargetIds gom cả targetId trong pairs của dạng matching', () => {
  const ids = collectTargetIds([
    q({
      id: 'm1',
      type: 'matching',
      targetId: 'vocab-01-01',
      pairs: [
        { targetId: 'vocab-01-01', jp: '私[わたし]', vi: 'tôi' },
        { targetId: 'vocab-01-02', jp: '学生[がくせい]', vi: 'học sinh' },
      ],
    }),
    q({ id: 'c1', type: 'cloze', targetId: 'particle-wo' }),
  ]);
  assert.deepEqual(ids, ['particle-wo', 'vocab-01-01', 'vocab-01-02']);
});

test('collectTargetIds xếp bài nhỏ trước', () => {
  const ids = collectTargetIds([
    q({ targetId: 'vocab-05-01' }),
    q({ targetId: 'vocab-02-03' }),
    q({ targetId: 'grammar-02-01' }),
  ]);
  assert.deepEqual(ids, ['grammar-02-01', 'vocab-02-03', 'vocab-05-01']);
});

test('selectNewTargetIds bỏ mục đã có lịch ôn và cắt theo hạn mức còn lại', () => {
  const pool = ['vocab-01-01', 'vocab-01-02', 'vocab-01-03', 'vocab-01-04'];
  const existing = new Set(['vocab-01-02']);
  assert.deepEqual(selectNewTargetIds(pool, existing, 2), ['vocab-01-01', 'vocab-01-03']);
});

test('selectNewTargetIds trả rỗng khi hết hạn mức', () => {
  assert.deepEqual(selectNewTargetIds(['vocab-01-01'], new Set(), 0), []);
  assert.deepEqual(selectNewTargetIds(['vocab-01-01'], new Set(), -3), []);
});

test('countByTargetType phân rã theo loại mục tiêu', () => {
  const counts = countByTargetType(['vocab-01-01', 'vocab-01-02', 'grammar-01-01', 'particle-wo']);
  assert.equal(counts.vocab, 2);
  assert.equal(counts.grammar, 1);
  assert.equal(counts.particle, 1);
  assert.equal(counts.kanji, 0);
  assert.equal(counts.listening, 0);
});

test('overdueDays đếm theo nửa đêm giờ địa phương, chưa quá hạn thì 0', () => {
  const now = new Date(2026, 8, 17, 9, 0, 0);
  assert.equal(overdueDays(new Date(2026, 8, 14, 23, 30, 0), now), 3);
  assert.equal(overdueDays(new Date(2026, 8, 17, 1, 0, 0), now), 0);
  assert.equal(overdueDays(new Date(2026, 8, 19, 1, 0, 0), now), 0);
});

test('describeNextReviews gom theo ngày địa phương và lấy các mốc gần nhất', () => {
  const now = new Date(2026, 8, 17, 9, 0, 0);
  const dates = [
    new Date(2026, 8, 18, 8, 0, 0),
    new Date(2026, 8, 18, 20, 0, 0),
    new Date(2026, 8, 18, 22, 0, 0),
    new Date(2026, 8, 21, 8, 0, 0),
  ];
  assert.equal(describeNextReviews(dates, now), '3 mục ngày mai, 1 mục sau 4 ngày');
  assert.equal(describeNextReviews([], now), '');
});

test('buildTargetLabels ưu tiên nguồn mang cả tiếng Nhật lẫn nghĩa', () => {
  const labels = buildTargetLabels([
    q({ id: 'mc-read-vocab-01-01', type: 'mc', targetId: 'vocab-01-01', prompt: '私', answer: 'わたし' }),
    q({ id: 'mc-mean-vocab-01-01', type: 'mc', targetId: 'vocab-01-01', prompt: '私[わたし]', answer: 'tôi' }),
    q({ id: 'cloze-1', type: 'cloze', targetId: 'particle-wo', prompt: '＿', answer: 'を' }),
    q({
      id: 'reorder-1',
      type: 'reorder',
      targetId: 'grammar-01-01',
      prompt: 'dịch',
      answer: ['A', 'B'],
      explanationJp: '私[わたし]は 学生[がくせい]です',
      explanationVi: 'Tôi là học sinh',
    }),
  ]);
  assert.deepEqual(labels.get('vocab-01-01'), { jp: '私[わたし]', vi: 'tôi' });
  assert.deepEqual(labels.get('particle-wo'), { jp: 'を', vi: 'Trợ từ' });
  assert.deepEqual(labels.get('grammar-01-01'), {
    jp: '私[わたし]は 学生[がくせい]です',
    vi: 'Tôi là học sinh',
  });
});

test('planReviewBatch: mục đến hạn lấp lô trước, mục mới chỉ lấp chỗ trống', () => {
  const pool = ['vocab-01-01', 'vocab-01-02', 'vocab-01-03'];
  const plan = planReviewBatch(['a', 'b'], pool, new Set(), 20, 3);
  assert.deepEqual(plan.batchDue, ['a', 'b']);
  assert.deepEqual(plan.newTargetIds, ['vocab-01-01']);
  assert.equal(plan.remainingDue, 0);
});

test('planReviewBatch: tồn đọng ≥ một lô thì không nạp mục mới', () => {
  const due = Array.from({ length: 50 }, (_, i) => `d${i}`);
  const plan = planReviewBatch(due, ['vocab-01-01'], new Set(), 20, 20);
  assert.equal(plan.batchDue.length, 20);
  assert.deepEqual(plan.batchDue.slice(0, 2), ['d0', 'd1']);
  assert.deepEqual(plan.newTargetIds, []);
  assert.equal(plan.remainingDue, 30);
});

test('planReviewBatch: vẫn chịu hạn mức mục mới còn lại trong ngày', () => {
  const pool = ['vocab-01-01', 'vocab-01-02', 'vocab-01-03'];
  assert.deepEqual(planReviewBatch([], pool, new Set(), 1, 20).newTargetIds, ['vocab-01-01']);
  assert.deepEqual(planReviewBatch([], pool, new Set(), 0, 20).newTargetIds, []);
});

test('withDeclaredLessons gộp bài 1..N, không trùng, xếp tăng dần', () => {
  assert.deepEqual(withDeclaredLessons([2, 7], 3), [1, 2, 3, 7]);
  assert.deepEqual(withDeclaredLessons([5], 0), [5]);
});

test('describeRemainingBatches mô tả chính xác số mục và số lô còn lại', () => {
  assert.equal(describeRemainingBatches(0, 20), '');
  assert.equal(describeRemainingBatches(-5, 20), '');
  assert.equal(
    describeRemainingBatches(15, 20),
    'Còn 15 mục đến hạn cho lô tiếp theo. Mỗi lô tối đa 20 mục; tạm chưa nạp mục mới cho tới khi ôn kịp.',
  );
  assert.equal(
    describeRemainingBatches(45, 20),
    'Còn 45 mục đến hạn cho khoảng 3 lô sau. Mỗi lô tối đa 20 mục; tạm chưa nạp mục mới cho tới khi ôn kịp.',
  );
});

test('planReviewBatch: chia liên tiếp các lô cho tới khi hết mục đến hạn', () => {
  // Giả lập 45 mục đến hạn, lô 20 mục
  const allDue = Array.from({ length: 45 }, (_, i) => `item-${i + 1}`);
  const pool = ['new-1', 'new-2'];
  const existing = new Set<string>();

  // Lô 1: lấy 20 mục đầu, còn 25
  const batch1 = planReviewBatch(allDue, pool, existing, 20, 20);
  assert.equal(batch1.batchDue.length, 20);
  assert.equal(batch1.remainingDue, 25);
  assert.deepEqual(batch1.newTargetIds, []);

  // Lô 2: sau khi lô 1 hoàn thành, còn 25 mục -> lấy 20 mục tiếp, còn 5
  const remainingAfterBatch1 = allDue.slice(20);
  const batch2 = planReviewBatch(remainingAfterBatch1, pool, existing, 20, 20);
  assert.equal(batch2.batchDue.length, 20);
  assert.equal(batch2.remainingDue, 5);
  assert.deepEqual(batch2.newTargetIds, []);

  // Lô 3: sau khi lô 2 hoàn thành, còn 5 mục -> lấy 5 mục, lấp 15 mục mới (nếu quota cho phép)
  const remainingAfterBatch2 = allDue.slice(40);
  const batch3 = planReviewBatch(remainingAfterBatch2, pool, existing, 20, 20);
  assert.equal(batch3.batchDue.length, 5);
  assert.equal(batch3.remainingDue, 0);
  assert.deepEqual(batch3.newTargetIds, ['new-1', 'new-2']);
});

test('resolveNextBatchPlan: tính chính xác số câu playable cho lô kế tiếp (có cả due và new mục tiêu)', () => {
  const now = new Date('2026-09-28T08:00:00.000Z');
  const past = new Date('2026-09-27T08:00:00.000Z');

  const allReviewItems: ReviewItem[] = [
    mockItem({
      targetId: 'vocab-01-01',
      targetType: 'vocab',
      lesson: 1,
      correctCount: 1,
      incorrectCount: 0,
      dueAt: past,
    }),
    mockItem({
      targetId: 'vocab-01-02',
      targetType: 'vocab',
      lesson: 1,
      correctCount: 2,
      incorrectCount: 0,
      dueAt: past,
    }),
  ];

  const poolQuestions: QuestionItem[] = [
    q({ id: 'q1', targetId: 'vocab-01-01', type: 'mc' }),
    q({ id: 'q2', targetId: 'vocab-01-02', type: 'mc' }),
    q({ id: 'q3', targetId: 'vocab-01-03', type: 'mc' }),
  ];

  // Batch size 20, dailyNewLimit 20, newLoadedToday 0.
  // 2 mục due + 1 mục new (vocab-01-03) -> tổng 3 mục playable
  const plan = resolveNextBatchPlan({
    allReviewItems,
    poolQuestions,
    dailyNewLimit: 20,
    reviewBatchSize: 20,
    now,
    availableAudioKeys: new Set(['tts']),
  });

  assert.equal(plan.hasMore, true);
  assert.equal(plan.playableCount, 3);
  assert.equal(plan.batchDue.length, 2);
  assert.deepEqual(plan.newTargetIds, ['vocab-01-03']);
  assert.equal(plan.remainingDue, 0);
  assert.equal(plan.totalDueCount, 2);
});

test('resolveNextBatchPlan: chặn nạp mục mới khi dailyNewLimit đã đạt giới hạn hôm nay', () => {
  const now = new Date('2026-09-28T08:00:00.000Z');
  const past = new Date('2026-09-27T08:00:00.000Z');

  const allReviewItems: ReviewItem[] = [
    mockItem({
      targetId: 'vocab-01-01',
      targetType: 'vocab',
      lesson: 1,
      correctCount: 1,
      incorrectCount: 0,
      dueAt: past,
      createdAt: '2026-09-28T01:00:00.000Z', // Tạo hôm nay -> tính vào newLoadedToday
    }),
  ];

  const poolQuestions: QuestionItem[] = [
    q({ id: 'q1', targetId: 'vocab-01-01', type: 'mc' }),
    q({ id: 'q2', targetId: 'vocab-01-02', type: 'mc' }),
  ];

  // dailyNewLimit = 1, mà đã nạp 1 hôm nay -> remainingNewQuota = 0 -> không nạp vocab-01-02
  const plan = resolveNextBatchPlan({
    allReviewItems,
    poolQuestions,
    dailyNewLimit: 1,
    reviewBatchSize: 20,
    now,
    availableAudioKeys: new Set(['tts']),
  });

  assert.equal(plan.hasMore, true);
  assert.equal(plan.playableCount, 1);
  assert.deepEqual(plan.newTargetIds, []);
  assert.equal(plan.totalDueCount, 1);
});

test('resolveNextBatchPlan: trả về hasMore = false khi không còn mục due lẫn mục new', () => {
  const now = new Date('2026-09-28T08:00:00.000Z');
  const future = new Date('2026-09-29T08:00:00.000Z');

  const allReviewItems: ReviewItem[] = [
    mockItem({
      targetId: 'vocab-01-01',
      targetType: 'vocab',
      lesson: 1,
      correctCount: 1,
      incorrectCount: 0,
      dueAt: future, // Chưa đến hạn
    }),
  ];

  // Bể chỉ có đúng mục vocab-01-01 đã có lịch ôn
  const poolQuestions: QuestionItem[] = [
    q({ id: 'q1', targetId: 'vocab-01-01', type: 'mc' }),
  ];

  const plan = resolveNextBatchPlan({
    allReviewItems,
    poolQuestions,
    dailyNewLimit: 20,
    reviewBatchSize: 20,
    now,
    availableAudioKeys: new Set(['tts']),
  });

  assert.equal(plan.hasMore, false);
  assert.equal(plan.playableCount, 0);
  assert.equal(plan.remainingDue, 0);
  assert.equal(plan.totalDueCount, 0);
});

test('resolveNextBatchPlan: phát hiện blockedReason = no-audio khi các mục chỉ có câu nghe mà thiếu giọng đọc', () => {
  const now = new Date('2026-09-28T08:00:00.000Z');
  const past = new Date('2026-09-27T08:00:00.000Z');

  const allReviewItems: ReviewItem[] = [
    mockItem({
      targetId: 'listening-01-01',
      targetType: 'listening',
      lesson: 1,
      correctCount: 1,
      incorrectCount: 0,
      dueAt: past,
    }),
  ];

  const poolQuestions: QuestionItem[] = [
    q({ id: 'l1', targetId: 'listening-01-01', type: 'listening' }),
  ];

  // availableAudioKeys rỗng (không có tts)
  const plan = resolveNextBatchPlan({
    allReviewItems,
    poolQuestions,
    dailyNewLimit: 20,
    reviewBatchSize: 20,
    now,
    availableAudioKeys: new Set(),
  });

  assert.equal(plan.hasMore, false);
  assert.equal(plan.playableCount, 0);
  assert.equal(plan.blockedReason, 'no-audio');
  assert.equal(plan.totalDueCount, 1);
});

test('resolveNextBatchPlan: mỗi targetId chỉ sinh 1 câu trong mode due dù bể câu hỏi có nhiều câu cùng target', () => {
  const now = new Date('2026-09-28T08:00:00.000Z');
  const past = new Date('2026-09-27T08:00:00.000Z');

  const allReviewItems: ReviewItem[] = [
    mockItem({
      targetId: 'vocab-01-01',
      targetType: 'vocab',
      lesson: 1,
      correctCount: 1,
      incorrectCount: 0,
      dueAt: past,
    }),
  ];

  // 3 câu hỏi khác nhau cho cùng một targetId vocab-01-01
  const poolQuestions: QuestionItem[] = [
    q({ id: 'q1-1', targetId: 'vocab-01-01', type: 'mc' }),
    q({ id: 'q1-2', targetId: 'vocab-01-01', type: 'cloze' }),
    q({ id: 'q1-3', targetId: 'vocab-01-01', type: 'reorder' }),
  ];

  const plan = resolveNextBatchPlan({
    allReviewItems,
    poolQuestions,
    dailyNewLimit: 20,
    reviewBatchSize: 20,
    now,
    availableAudioKeys: new Set(['tts']),
  });

  // Hợp đồng mode: 'due' đảm bảo 1 câu cho 1 mục tiêu ôn tập
  assert.equal(plan.playableCount, 1);
});


