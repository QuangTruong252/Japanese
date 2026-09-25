import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAuxiliaryIndex,
  clearQuestionsCache,
  extractAuxiliaryLessons,
  generateQuestions,
  PARTICLE_PATTERN,
} from './questions.ts';
import type { Lesson, VocabWord } from '../types/index.ts';

test('buildAuxiliaryIndex & extractAuxiliaryLessons: quét từ dài trước ngắn', () => {
  const vocabMap = new Map<number, VocabWord[]>([
    [
      1,
      [
        {
          id: '01-01',
          lesson: 1,
          word: '会社[かいしゃ]',
          kana: 'かいしゃ',
          meaning: { vi: 'công ty' },
          type: 'noun',
        },
      ],
    ],
    [
      2,
      [
        {
          id: '02-01',
          lesson: 2,
          word: '会社員[かいしゃいん]',
          kana: 'かいしゃいん',
          meaning: { vi: 'nhân viên công ty' },
          type: 'noun',
        },
      ],
    ],
  ]);

  const index = buildAuxiliaryIndex(vocabMap);
  const lessons = extractAuxiliaryLessons('私[わたし]は 会社員[かいしゃいん]です。', index);
  // Phải match "会社員" (bài 2), không được match nhầm "会社" (bài 1)
  assert.deepEqual(lessons, [2]);
});

test('PARTICLE_PATTERN regex chỉ khớp trợ từ sau ngoặc ] hoặc katakana', () => {
  const sentence = '私[わたし]は 学生[がくせい]です。';
  const matches = [...sentence.matchAll(PARTICLE_PATTERN)];
  assert.equal(matches.length, 1);
  assert.equal(matches[0]![1], 'は');

  // Câu thuần kana không bị khớp nhầm
  const kanaSentence = 'わたしはがくせいです';
  const kanaMatches = [...kanaSentence.matchAll(PARTICLE_PATTERN)];
  assert.equal(kanaMatches.length, 0);
});

test('generateQuestions sinh đủ 5 dạng bài và tuân thủ các điều kiện lọc', () => {
  const mockLessons: Lesson[] = [
    {
      level: 'n5',
      number: 1,
      title: { vi: 'Bài 1' },
      description: { vi: 'Mô tả bài 1' },
      sourceRef: { book: 'Minna no Nihongo I', pages: '1-10' },
      grammar: [
        {
          id: '01-01',
          title: { vi: 'N1 は N2 です' },
          pattern: { vi: 'N1 は N2 です' },
          explanation: { vi: 'Giải thích' },
          examples: [
            // 4 khối bunsetsu => hợp lệ cho reorder
            {
              jp: '私[わたし]は 明日[あした] 京都[きょうと]へ 行[い]きます。',
              translation: { vi: 'Tôi ngày mai đi Kyoto.' },
            },
            // 2 khối bunsetsu => không hợp lệ cho reorder
            { jp: '学生[がくせい] です。', translation: { vi: 'Là học sinh.' } },
          ],
        },
      ],
    },
  ];

  const mockVocab = new Map<number, VocabWord[]>([
    [
      1,
      [
        { id: '01-01', lesson: 1, word: '私[わたし]', kana: 'わたし', meaning: { vi: 'tôi' }, type: 'pronoun' },
        { id: '01-02', lesson: 1, word: '学生[がくせい]', kana: 'がくせい', meaning: { vi: 'học sinh' }, type: 'noun' },
        { id: '01-03', lesson: 1, word: '先生[せんせい]', kana: 'せんせい', meaning: { vi: 'giáo viên' }, type: 'noun' },
        { id: '01-04', lesson: 1, word: '会社員[かいしゃいん]', kana: 'かいしゃいん', meaning: { vi: 'nhân viên' }, type: 'noun' },
        { id: '01-05', lesson: 1, word: '医者[いしゃ]', kana: 'いしゃ', meaning: { vi: 'bác sĩ' }, type: 'noun' },
      ],
    ],
  ]);

  const questions = generateQuestions(mockLessons, mockVocab);
  const types = new Set(questions.map((q) => q.type));

  assert.ok(types.has('mc'), 'Phải có câu hỏi mc');
  assert.ok(types.has('matching'), 'Phải có câu hỏi matching');
  assert.ok(types.has('cloze'), 'Phải có câu hỏi cloze');
  assert.ok(types.has('reorder'), 'Phải có câu hỏi reorder');
  assert.ok(types.has('listening'), 'Phải có câu hỏi listening');

  // Kiểm tra targetId convention
  const mc = questions.find((q) => q.type === 'mc');
  assert.match(mc!.targetId, /^vocab-01-\d{2}$/);

  const cloze = questions.find((q) => q.type === 'cloze');
  assert.match(cloze!.targetId, /^particle-/);

  const reorder = questions.find((q) => q.type === 'reorder');
  assert.match(reorder!.targetId, /^grammar-01-01$/);
});

test('generateQuestions memo hóa kết quả theo tập bài học', () => {
  clearQuestionsCache();

  const mockLessons: Lesson[] = [
    {
      level: 'n5',
      number: 1,
      title: { vi: 'Bài 1' },
      description: { vi: 'Mô tả' },
      grammar: [],
    },
  ];
  const mockVocab = new Map<number, VocabWord[]>([
    [1, [{ id: '01-01', lesson: 1, word: '私[わたし]', kana: 'わたし', meaning: { vi: 'tôi' }, type: 'pronoun' }]],
  ]);

  const q1 = generateQuestions(mockLessons, mockVocab);
  const q2 = generateQuestions(mockLessons, mockVocab);
  // Phải trả về cùng một instance do đã được cache
  assert.equal(q1, q2);

  // Sau khi xóa cache, gọi lại sẽ sinh instance mới
  clearQuestionsCache();
  const q3 = generateQuestions(mockLessons, mockVocab);
  assert.notEqual(q1, q3);
  assert.equal(q3.length, q1.length);
});

test('sinh câu hỏi MC Đọc và Nghĩa từ động từ sử dụng thể từ điển và đáp án kana từ điển', () => {
  const mockLessons: Lesson[] = [
    {
      level: 'n5',
      number: 7,
      title: { vi: 'Bài 7' },
      description: { vi: 'Mô tả bài 7' },
      grammar: [],
    },
  ];
  const mockVocab = new Map<number, VocabWord[]>([
    [
      7,
      [
        {
          id: 'kirimasu',
          lesson: 7,
          word: '切[き]る',
          kana: 'きる',
          meaning: { vi: 'cắt' },
          type: 'verb-godan',
          verbGroup: 1,
          verbForms: {
            dictionary: '切[き]る',
            dictionaryKana: 'きる',
            masu: '切[き]ります',
            masuKana: 'きります',
          },
        },
      ],
    ],
  ]);
  const questions = generateQuestions(mockLessons, mockVocab);
  const readQ = questions.find((q) => q.id === 'mc-read-vocab-07-01');
  assert.ok(readQ);
  assert.equal(readQ.prompt, '切る');
  assert.equal(readQ.answer, 'きる');

  const meanQ = questions.find((q) => q.id === 'mc-mean-vocab-07-01');
  assert.ok(meanQ);
  assert.equal(meanQ.prompt, '切[き]る');
  assert.equal(meanQ.answer, 'cắt');
});

