import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  targetTypeFromId,
  shuffle,
  buildSession,
  checkTextAnswer,
  checkOptionAnswer,
  checkReorderAnswer,
  applyResults,
  summarizeSession,
} from './practice.ts';
import { ELAPSED_SAMPLE_SIZE } from './fsrs.ts';
import type {
  AnswerResult,
  PracticeConfig,
  QuestionItem,
  ReviewItem,
} from '../types/index.ts';

const q = (over: Partial<QuestionItem>): QuestionItem => ({
  id: 'q',
  type: 'mc',
  lesson: 1,
  auxiliaryLessons: [1],
  targetId: 'vocab-01-01',
  prompt: '私',
  answer: 'わたし',
  ...over,
});

const config = (over: Partial<PracticeConfig> = {}): PracticeConfig => ({
  mode: 'lesson',
  lessons: [1],
  maxLearnedLesson: 1,
  selectedTypes: ['mc', 'matching', 'cloze', 'reorder', 'listening'],
  questionCount: 10,
  ...over,
});

// rng tất định: luôn trả 0 -> shuffle giữ nguyên thứ tự đảo ngược xác định được
const zeroRng = () => 0;

test('targetTypeFromId đọc tiền tố của targetId', () => {
  assert.equal(targetTypeFromId('vocab-01-03'), 'vocab');
  assert.equal(targetTypeFromId('grammar-05-02'), 'grammar');
  assert.equal(targetTypeFromId('particle-wo'), 'particle');
  assert.equal(targetTypeFromId('kanji-042'), 'kanji');
  // Không khớp tiền tố nào thì về 'vocab' thay vì ném lỗi giữa phiên làm bài
  assert.equal(targetTypeFromId('gì-đó-lạ'), 'vocab');
});

test('shuffle không làm mất hay nhân bản phần tử', () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffle(input, zeroRng);
  assert.equal(out.length, 5);
  assert.deepEqual([...out].sort((a, b) => a - b), input);
  assert.deepEqual(input, [1, 2, 3, 4, 5], 'không được sửa mảng gốc');
});

test('buildSession cắt đúng questionCount và báo số câu bị loại vì thiếu audio', () => {
  const all: QuestionItem[] = [
    q({ id: 'a', targetId: 'vocab-01-01' }),
    q({ id: 'b', targetId: 'vocab-01-02' }),
    q({ id: 'c', targetId: 'vocab-01-03' }),
    q({ id: 'd', type: 'listening', targetId: 'grammar-01-01' }),
  ];
  const r = buildSession(all, config({ questionCount: 2 }), new Set(), undefined, zeroRng);
  assert.equal(r.questions.length, 2);
  assert.equal(r.eligibleCount, 3);
  assert.equal(r.excludedAudioCount, 1);
});

test('buildSession: người dùng mới chọn bài 1 vẫn ra câu hỏi (ca hồi quy)', () => {
  // maxLearnedLesson phải bằng max(lessons) = 1, không phải 0.
  const all = [q({ auxiliaryLessons: [1] })];
  const r = buildSession(all, config({ lessons: [1], maxLearnedLesson: 1 }), new Set(['tts']));
  assert.equal(r.questions.length, 1);
});

test('checkTextAnswer chấp nhận biến thể và bỏ qua khác biệt được phép', () => {
  const item = q({ type: 'cloze', answer: 'を', acceptedVariants: ['を', 'ヲ'] });
  assert.equal(checkTextAnswer('を', item), true);
  assert.equal(checkTextAnswer('wo', item), true, 'romaji tự chuyển sang hiragana');
  assert.equal(checkTextAnswer(' を ', item), true, 'bỏ khoảng trắng thừa');
  assert.equal(checkTextAnswer('は', item), false, 'sai nghĩa vẫn phải là sai');
});

test('checkTextAnswer chấm được câu kana của dạng nghe', () => {
  const item = q({ type: 'listening', answer: 'わたしは がくせいです' });
  assert.equal(checkTextAnswer('わたしはがくせいです', item), true);
  assert.equal(checkTextAnswer('わたしは がくせいです。', item), true);
  assert.equal(checkTextAnswer('あなたは がくせいです', item), false);
});

test('checkOptionAnswer so khớp phương án đã chọn', () => {
  const item = q({ options: ['わたし', 'あなた'], answer: 'わたし' });
  assert.equal(checkOptionAnswer('わたし', item), true);
  assert.equal(checkOptionAnswer('あなた', item), false);
});

test('checkReorderAnswer so khớp thứ tự toàn câu', () => {
  const item = q({ type: 'reorder', answer: ['わたしは', 'がくせい', 'です'] });
  assert.equal(checkReorderAnswer(['わたしは', 'がくせい', 'です'], item), true);
  assert.equal(checkReorderAnswer(['がくせい', 'わたしは', 'です'], item), false);
  assert.equal(checkReorderAnswer(['わたしは', 'がくせい'], item), false);
});

test('applyResults tạo bản ghi mới với createdAt và đếm đúng', () => {
  const now = new Date('2026-09-17T10:00:00Z');
  const out = applyResults(
    [],
    [{ targetId: 'vocab-01-01', targetType: 'vocab', isCorrect: true, elapsedMs: 3000, usedHint: false }],
    new Map([['vocab-01-01', 1]]),
    now,
  );
  assert.equal(out.length, 1);
  const item = out[0]!;
  assert.equal(item.targetId, 'vocab-01-01');
  assert.equal(item.lesson, 1);
  assert.equal(item.createdAt, now.toISOString());
  assert.equal(item.correctCount, 1);
  assert.equal(item.incorrectCount, 0);
  assert.deepEqual(item.recentElapsedMs, [3000]);
  assert.ok(item.dueAt instanceof Date);
});

test('applyResults chỉ ghi mẫu thời gian khi trả lời ĐÚNG', () => {
  const now = new Date('2026-09-17T10:00:00Z');
  const out = applyResults(
    [],
    [{ targetId: 'vocab-01-01', targetType: 'vocab', isCorrect: false, elapsedMs: 9000, usedHint: false }],
    new Map([['vocab-01-01', 1]]),
    now,
  );
  assert.deepEqual(out[0]!.recentElapsedMs, []);
  assert.equal(out[0]!.incorrectCount, 1);
  assert.equal(out[0]!.lastFailedAt, now.toISOString());
});

test('applyResults giữ đúng 5 mẫu gần nhất sau 6 lần đúng', () => {
  const now = new Date('2026-09-17T10:00:00Z');
  const results: AnswerResult[] = Array.from({ length: 6 }, (_, i) => ({
    targetId: 'vocab-01-01',
    targetType: 'vocab' as const,
    isCorrect: true,
    elapsedMs: (i + 1) * 1000,
    usedHint: false,
  }));
  const out = applyResults([], results, new Map([['vocab-01-01', 1]]), now);
  assert.equal(out.length, 1, 'cùng targetId chỉ ra một bản ghi');
  assert.equal(out[0]!.recentElapsedMs.length, ELAPSED_SAMPLE_SIZE);
  assert.deepEqual(out[0]!.recentElapsedMs, [2000, 3000, 4000, 5000, 6000]);
  assert.equal(out[0]!.correctCount, 6);
});

test('applyResults giữ nguyên createdAt của bản ghi đã có', () => {
  const now = new Date('2026-09-17T10:00:00Z');
  const existing: ReviewItem = {
    targetId: 'vocab-01-01',
    targetType: 'vocab',
    lesson: 1,
    incorrectCount: 2,
    correctCount: 4,
    dueAt: new Date('2026-09-10T00:00:00Z'),
    fsrsCard: undefined as never,
    updatedAt: '2026-09-10T00:00:00.000Z',
    createdAt: '2026-09-01T00:00:00.000Z',
    recentElapsedMs: [1000, 2000],
  };
  const out = applyResults(
    [existing],
    [{ targetId: 'vocab-01-01', targetType: 'vocab', isCorrect: true, elapsedMs: 1500, usedHint: false }],
    new Map([['vocab-01-01', 1]]),
    now,
  );
  assert.equal(out[0]!.createdAt, '2026-09-01T00:00:00.000Z');
  assert.equal(out[0]!.correctCount, 5);
  assert.equal(out[0]!.updatedAt, now.toISOString());
});

test('trả lời sai cho dueAt gần hơn hẳn so với trả lời đúng', () => {
  const now = new Date('2026-09-17T10:00:00Z');
  const lessons = new Map([['vocab-01-01', 1]]);
  const base = { targetId: 'vocab-01-01', targetType: 'vocab' as const, elapsedMs: 3000, usedHint: false };
  const wrong = applyResults([], [{ ...base, isCorrect: false }], lessons, now)[0]!;
  const right = applyResults([], [{ ...base, isCorrect: true }], lessons, now)[0]!;
  assert.ok(
    wrong.dueAt.getTime() < right.dueAt.getTime(),
    'Again phải lên lịch sớm hơn Good',
  );
});

test('applyResults xử lý nhiều targetId của một lượt matching', () => {
  const now = new Date('2026-09-17T10:00:00Z');
  const results: AnswerResult[] = [
    { targetId: 'vocab-01-01', targetType: 'vocab', isCorrect: true, elapsedMs: 1000, usedHint: false },
    { targetId: 'vocab-01-02', targetType: 'vocab', isCorrect: false, elapsedMs: 4000, usedHint: false },
    { targetId: 'vocab-01-03', targetType: 'vocab', isCorrect: true, elapsedMs: 1200, usedHint: false },
  ];
  const lessons = new Map(results.map((r) => [r.targetId, 1]));
  const out = applyResults([], results, lessons, now);
  assert.equal(out.length, 3);
  const wrong = out.find((i) => i.targetId === 'vocab-01-02')!;
  assert.equal(wrong.incorrectCount, 1, 'chỉ cặp sai mới tăng incorrectCount');
  assert.equal(out.find((i) => i.targetId === 'vocab-01-01')!.incorrectCount, 0);
});

test('summarizeSession tính đúng tỷ lệ theo tổng câu', () => {
  const now = new Date('2026-09-17T10:00:00Z');
  const results: AnswerResult[] = [
    { targetId: 'a', targetType: 'vocab', isCorrect: true, elapsedMs: 1000, usedHint: false },
    { targetId: 'b', targetType: 'vocab', isCorrect: false, elapsedMs: 1000, usedHint: false },
  ];
  const s = summarizeSession(config({ lessons: [1, 2] }), results, 42, now);
  assert.equal(s.totalQuestions, 2);
  assert.equal(s.correctCount, 1);
  assert.equal(s.accuracyRate, 0.5);
  assert.equal(s.durationSeconds, 42);
  assert.deepEqual(s.selectedLessons, [1, 2]);
  assert.equal(s.createdAt, now.toISOString());
  assert.ok(s.id.length > 0);
});

test('summarizeSession đếm theo mục tiêu đã chấm, không theo số câu hiện ra', () => {
  // Ca hồi quy: một lượt ghép cặp là MỘT câu nhưng chấm 5 mục tiêu. Lấy số câu thì bản ghi
  // tự mâu thuẫn (correctCount > totalQuestions) và SPEC-07 tính sai tỷ lệ đúng.
  const now = new Date('2026-09-17T10:00:00Z');
  const pairResults: AnswerResult[] = ['a', 'b', 'c', 'd', 'e'].map((id, i) => ({
    targetId: id,
    targetType: 'vocab' as const,
    isCorrect: i < 3,
    elapsedMs: 1000,
    usedHint: false,
  }));
  const s = summarizeSession(config(), pairResults, 30, now);
  assert.equal(s.totalQuestions, 5);
  assert.equal(s.correctCount, 3);
  assert.equal(s.accuracyRate, 3 / 5);
  assert.ok(s.correctCount <= s.totalQuestions);
});

test('buildSession ở mode due chỉ lấy một câu cho mỗi mục tiêu', () => {
  const questions: QuestionItem[] = [
    { id: 'c1', type: 'cloze', lesson: 1, auxiliaryLessons: [1], targetId: 'particle-wo',
      prompt: 'p1', answer: 'を' },
    { id: 'c2', type: 'cloze', lesson: 2, auxiliaryLessons: [2], targetId: 'particle-wo',
      prompt: 'p2', answer: 'を' },
    { id: 'c3', type: 'cloze', lesson: 3, auxiliaryLessons: [3], targetId: 'particle-wo',
      prompt: 'p3', answer: 'を' },
    { id: 'm1', type: 'mc', lesson: 1, auxiliaryLessons: [1], targetId: 'vocab-01-01',
      prompt: '私', answer: 'わたし' },
  ];
  const config: PracticeConfig = {
    mode: 'due',
    lessons: [1, 2, 3],
    maxLearnedLesson: 3,
    selectedTypes: ['mc', 'cloze'],
    questionCount: 10,
  };

  const result = buildSession(
    questions,
    config,
    new Set<string>(),
    new Set(['particle-wo', 'vocab-01-01']),
    () => 0,
  );

  assert.equal(result.questions.length, 2);
  assert.equal(new Set(result.questions.map((q) => q.targetId)).size, 2);
  // eligibleCount vẫn là số câu hợp lệ TRƯỚC khi khử trùng lặp
  assert.equal(result.eligibleCount, 4);
});

test('buildSession ở mode lesson KHÔNG khử trùng lặp mục tiêu', () => {
  const questions: QuestionItem[] = [
    { id: 'a', type: 'mc', lesson: 1, auxiliaryLessons: [1], targetId: 'vocab-01-01',
      prompt: '私', answer: 'わたし' },
    { id: 'b', type: 'mc', lesson: 1, auxiliaryLessons: [1], targetId: 'vocab-01-01',
      prompt: '私[わたし]', answer: 'tôi' },
  ];
  const config: PracticeConfig = {
    mode: 'lesson',
    lessons: [1],
    maxLearnedLesson: 1,
    selectedTypes: ['mc'],
    questionCount: 10,
  };

  assert.equal(
    buildSession(questions, config, new Set<string>(), undefined, () => 0).questions.length,
    2,
  );
});
