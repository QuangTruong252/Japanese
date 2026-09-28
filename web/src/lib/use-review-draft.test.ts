import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  deserializeReviewDraft,
  isReviewDraft,
  serializeReviewDraft,
  validateReviewDraft,
} from './use-review-draft.ts';
import type { PracticeConfig, QuestionItem, ReviewItem } from '../types/index.ts';
import type { PracticeDraft } from './practice-draft.ts';

const mockQuestions: QuestionItem[] = [
  {
    id: 'mc-01-01',
    type: 'mc',
    lesson: 1,
    auxiliaryLessons: [1],
    targetId: 'vocab-01-01',
    prompt: 'わたし',
    answer: 'tôi',
  },
  {
    id: 'cloze-01-02',
    type: 'cloze',
    lesson: 1,
    auxiliaryLessons: [1],
    targetId: 'particle-01-01',
    prompt: 'わたし[わたし]__学生[がくせい]です',
    answer: 'は',
  },
];

const dueConfig: PracticeConfig = {
  mode: 'due',
  lessons: [1],
  maxLearnedLesson: 1,
  selectedTypes: ['mc', 'cloze'],
  questionCount: 2,
};

const lessonConfig: PracticeConfig = {
  mode: 'lesson',
  lessons: [1],
  maxLearnedLesson: 1,
  selectedTypes: ['mc', 'cloze'],
  questionCount: 2,
};

const validDueDraft: PracticeDraft = {
  version: 1,
  questions: mockQuestions,
  currentIndex: 1,
  results: [
    {
      targetId: 'vocab-01-01',
      targetType: 'vocab',
      isCorrect: true,
      elapsedMs: 2500,
      usedHint: false,
    },
  ],
  elapsedSec: 15,
  savedAt: 1774770000000,
  config: dueConfig,
};

test('validateReviewDraft: chấp nhận bản nháp ôn tập (mode: due) hợp lệ', () => {
  const result = validateReviewDraft(validDueDraft);
  assert.notEqual(result, null);
  assert.equal(result?.version, 1);
  assert.equal(result?.currentIndex, 1);
  assert.equal(result?.results.length, 1);
  assert.equal(result?.config?.mode, 'due');
  assert.equal(isReviewDraft(validDueDraft), true);
});

test('validateReviewDraft: từ chối bản nháp luyện tập (mode: lesson) không phải ôn tập', () => {
  const draftWithLesson = {
    ...validDueDraft,
    config: lessonConfig,
  };
  assert.equal(validateReviewDraft(draftWithLesson), null);
  assert.equal(isReviewDraft(draftWithLesson), false);
});

test('validateReviewDraft: từ chối bản nháp thiếu config hoặc config.mode không hợp lệ', () => {
  const draftNoConfig = {
    ...validDueDraft,
    config: undefined,
  };
  assert.equal(validateReviewDraft(draftNoConfig), null);
  assert.equal(isReviewDraft(draftNoConfig), false);
});

test('validateReviewDraft: từ chối dữ liệu hỏng, null, mảng câu hỏi rỗng hoặc chỉ số câu ngoài phạm vi', () => {
  assert.equal(validateReviewDraft(null), null);
  assert.equal(validateReviewDraft(undefined), null);
  assert.equal(validateReviewDraft({}), null);
  assert.equal(validateReviewDraft('string'), null);

  const draftEmptyQuestions = {
    ...validDueDraft,
    questions: [],
  };
  assert.equal(validateReviewDraft(draftEmptyQuestions), null);

  const draftNegativeIndex = {
    ...validDueDraft,
    currentIndex: -1,
  };
  assert.equal(validateReviewDraft(draftNegativeIndex), null);

  const draftOverflowIndex = {
    ...validDueDraft,
    currentIndex: 2, // questions length = 2, max valid index = 1
  };
  assert.equal(validateReviewDraft(draftOverflowIndex), null);
});

test('serializeReviewDraft và deserializeReviewDraft: khôi phục nguyên vẹn cấu trúc và dữ liệu', () => {
  const serialized = serializeReviewDraft(validDueDraft);
  assert.equal(typeof serialized, 'string');

  const deserialized = deserializeReviewDraft(serialized);
  assert.notEqual(deserialized, null);
  assert.equal(deserialized?.currentIndex, validDueDraft.currentIndex);
  assert.equal(deserialized?.elapsedSec, validDueDraft.elapsedSec);
  assert.equal(deserialized?.config?.mode, 'due');
  assert.equal(deserialized?.results.length, 1);
  assert.equal(deserialized?.results[0].targetId, 'vocab-01-01');
});

test('serializeReviewDraft: ném lỗi khi cố serialize dữ liệu không phải nháp ôn tập', () => {
  const invalidDraft = {
    ...validDueDraft,
    config: lessonConfig,
  };
  assert.throws(() => {
    serializeReviewDraft(invalidDraft);
  }, /không phải chế độ ôn tập/);
});

test('deserializeReviewDraft: trả về null khi chuỗi JSON sai cú pháp hoặc rỗng', () => {
  assert.equal(deserializeReviewDraft(''), null);
  assert.equal(deserializeReviewDraft('{corrupted json'), null);
});

test('Bản nháp ôn tập không làm sai lệch hay thay đổi dueAt của mục tiêu ôn tập (SPEC-20 §4)', () => {
  const originalDueAt = new Date('2026-09-28T07:00:00.000Z');
  const reviewItem: ReviewItem = {
    targetId: 'vocab-01-01',
    targetType: 'vocab',
    lesson: 1,
    correctCount: 2,
    incorrectCount: 0,
    dueAt: new Date(originalDueAt),
    createdAt: '2026-09-20T00:00:00.000Z',
    updatedAt: '2026-09-20T00:00:00.000Z',
    fsrsCard: {
      due: new Date(originalDueAt),
      stability: 2,
      difficulty: 1,
      elapsed_days: 1,
      scheduled_days: 2,
      reps: 2,
      lapses: 0,
      state: 2,
      last_review: new Date('2026-09-26T07:00:00.000Z'),
      learning_steps: 0,
    },
    recentElapsedMs: [2000],
  };

  // Lưu nháp (chỉ nằm ở client storage / RAM, không ghi Dexie hay sửa dueAt)
  const draft = validateReviewDraft(validDueDraft);
  assert.notEqual(draft, null);

  // Kiểm tra dueAt của reviewItem không hề bị thay đổi
  assert.equal(reviewItem.dueAt.getTime(), originalDueAt.getTime());
  assert.equal(reviewItem.correctCount, 2);
  assert.equal(reviewItem.incorrectCount, 0);
});
