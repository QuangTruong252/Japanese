import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterExercises } from './filter.ts';
import type { QuestionItem, PracticeConfig } from '../types/index.ts';

const mockQuestions: QuestionItem[] = [
  {
    id: 'q1',
    type: 'mc',
    lesson: 1,
    auxiliaryLessons: [1],
    targetId: 'vocab-01-01',
    prompt: '私',
    answer: 'わたし',
  },
  {
    id: 'q2',
    type: 'reorder',
    lesson: 1,
    auxiliaryLessons: [1, 5], // cần kiến thức bài 5
    targetId: 'grammar-01-01',
    prompt: 'Câu bài 1 dùng từ bài 5',
    answer: ['A', 'B', 'C', 'D'],
  },
  {
    id: 'q3',
    type: 'listening',
    lesson: 1,
    auxiliaryLessons: [1],
    audioKey: 'audio-01',
    targetId: 'grammar-01-02',
    prompt: 'Listening prompt',
    answer: 'nghe',
  },
];

test('filterExercises lọc theo bài và chặn auxiliaryLessons > maxLearnedLesson', () => {
  const config: PracticeConfig = {
    mode: 'lesson',
    lessons: [1],
    maxLearnedLesson: 2, // chỉ học đến bài 2, q2 có aux = 5 phải bị chặn
    selectedTypes: ['mc', 'reorder'],
    questionCount: 10,
  };

  const { eligibleQuestions } = filterExercises(mockQuestions, config, new Set());
  assert.equal(eligibleQuestions.length, 1);
  assert.equal(eligibleQuestions[0]!.id, 'q1');
});

test('filterExercises ở mode due chỉ lấy đúng dueTargetIds', () => {
  const config: PracticeConfig = {
    mode: 'due',
    lessons: [],
    maxLearnedLesson: 10,
    selectedTypes: ['mc', 'reorder'],
    questionCount: 10,
  };

  const dueTargets = new Set(['vocab-01-01']);
  const { eligibleQuestions } = filterExercises(mockQuestions, config, new Set(), dueTargets);
  assert.equal(eligibleQuestions.length, 1);
  assert.equal(eligibleQuestions[0]!.id, 'q1');
});

test('filterExercises loại bỏ câu thiếu audio và tăng excludedAudioCount', () => {
  const config: PracticeConfig = {
    mode: 'lesson',
    lessons: [1],
    maxLearnedLesson: 10,
    selectedTypes: ['listening'],
    questionCount: 10,
  };

  // Không có key "audio-01" trong availableAudioKeys
  const res1 = filterExercises(mockQuestions, config, new Set());
  assert.equal(res1.eligibleQuestions.length, 0);
  assert.equal(res1.excludedAudioCount, 1);

  // Có key "audio-01"
  const res2 = filterExercises(mockQuestions, config, new Set(['audio-01']));
  assert.equal(res2.eligibleQuestions.length, 1);
  assert.equal(res2.excludedAudioCount, 0);
});

test('mode due: loại dạng matching khỏi bể câu hỏi', () => {
  const matchingQuestion: QuestionItem = {
    id: 'm1',
    type: 'matching',
    lesson: 1,
    auxiliaryLessons: [1],
    targetId: 'vocab-01-01',
    prompt: 'Ghép cặp',
    options: ['a', 'b', 'c', 'd'],
    answer: ['a', 'b', 'c', 'd'],
    pairs: [
      { targetId: 'vocab-01-01', jp: 'A[あ]', vi: 'a' },
      { targetId: 'vocab-01-02', jp: 'B[い]', vi: 'b' },
      { targetId: 'vocab-01-03', jp: 'C[う]', vi: 'c' },
      { targetId: 'vocab-01-04', jp: 'D[え]', vi: 'd' },
    ],
  };

  const config: PracticeConfig = {
    mode: 'due',
    lessons: [1],
    maxLearnedLesson: 1,
    selectedTypes: ['mc', 'matching'],
    questionCount: 10,
  };

  const { eligibleQuestions } = filterExercises(
    [matchingQuestion],
    config,
    new Set(['tts']),
    new Set(['vocab-01-01'])
  );

  assert.deepEqual(eligibleQuestions, []);

  // Cùng câu đó vẫn dùng được ở chế độ luyện theo bài
  const lessonMode = filterExercises(
    [matchingQuestion],
    { ...config, mode: 'lesson' },
    new Set(['tts'])
  );
  assert.equal(lessonMode.eligibleQuestions.length, 1);
});
