import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRACTICE_DRAFT_KEY,
  PRACTICE_DRAFT_VERSION,
  validatePracticeDraft,
  serializePracticeDraft,
  deserializePracticeDraft,
  savePracticeDraft,
  loadPracticeDraft,
  clearPracticeDraft,
  particleHint,
  type PracticeDraft,
} from './practice-draft.ts';
import type { QuestionItem } from '../types/index.ts';

const mockQuestions: QuestionItem[] = [
  {
    id: 'q1',
    type: 'cloze',
    lesson: 1,
    auxiliaryLessons: [1],
    targetId: 't1',
    prompt: 'わたし[わたし]は 学生[がくせい]です',
    answer: 'は',
  },
  {
    id: 'q2',
    type: 'listening',
    lesson: 1,
    auxiliaryLessons: [1],
    targetId: 't2',
    prompt: 'わたしはがくせいです',
    answer: 'わたしはがくせいです',
  },
];

class MockStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

test('validatePracticeDraft: chấp nhận draft hợp lệ', () => {
  const validDraft: PracticeDraft = {
    version: PRACTICE_DRAFT_VERSION,
    questions: mockQuestions,
    currentIndex: 1,
    results: [
      {
        targetId: 't1',
        targetType: 'vocab',
        isCorrect: true,
        elapsedMs: 2500,
        usedHint: false,
        userAnswer: 'は',
      },
    ],
    elapsedSec: 15,
    savedAt: 1700000000000,
    config: {
      mode: 'lesson',
      lessons: [1],
      maxLearnedLesson: 1,
      selectedTypes: ['cloze', 'listening'],
      questionCount: 2,
    },
  };

  const validated = validatePracticeDraft(validDraft);
  assert.ok(validated !== null);
  assert.equal(validated.version, PRACTICE_DRAFT_VERSION);
  assert.equal(validated.currentIndex, 1);
  assert.equal(validated.questions.length, 2);
  assert.equal(validated.results.length, 1);
  assert.equal(validated.elapsedSec, 15);
  assert.equal(validated.savedAt, 1700000000000);
});

test('validatePracticeDraft: từ chối draft không hợp lệ hoặc khác version', () => {
  // Không phải object
  assert.equal(validatePracticeDraft(null), null);
  assert.equal(validatePracticeDraft('invalid string'), null);
  assert.equal(validatePracticeDraft(123), null);

  // Khác version
  assert.equal(
    validatePracticeDraft({
      version: 99,
      questions: mockQuestions,
      currentIndex: 0,
      results: [],
      elapsedSec: 0,
      savedAt: 1,
    }),
    null,
  );

  // Danh sách câu hỏi rỗng
  assert.equal(
    validatePracticeDraft({
      version: PRACTICE_DRAFT_VERSION,
      questions: [],
      currentIndex: 0,
      results: [],
      elapsedSec: 0,
      savedAt: 1,
    }),
    null,
  );

  // Câu hỏi thiếu thuộc tính bắt buộc
  assert.equal(
    validatePracticeDraft({
      version: PRACTICE_DRAFT_VERSION,
      questions: [{ id: 'bad' }],
      currentIndex: 0,
      results: [],
      elapsedSec: 0,
      savedAt: 1,
    }),
    null,
  );

  // currentIndex vượt quá giới hạn
  assert.equal(
    validatePracticeDraft({
      version: PRACTICE_DRAFT_VERSION,
      questions: mockQuestions,
      currentIndex: 2, // Chỉ có 2 câu, index hợp lệ là 0 hoặc 1
      results: [],
      elapsedSec: 0,
      savedAt: 1,
    }),
    null,
  );

  assert.equal(
    validatePracticeDraft({
      version: PRACTICE_DRAFT_VERSION,
      questions: mockQuestions,
      currentIndex: -1,
      results: [],
      elapsedSec: 0,
      savedAt: 1,
    }),
    null,
  );
});

test('serialize và deserialize: hoạt động ổn định và chống crash khi dữ liệu hỏng', () => {
  const draft: PracticeDraft = {
    version: PRACTICE_DRAFT_VERSION,
    questions: mockQuestions,
    currentIndex: 0,
    results: [],
    elapsedSec: 5,
    savedAt: 1700000000000,
  };

  const serialized = serializePracticeDraft(draft);
  const deserialized = deserializePracticeDraft(serialized);
  assert.deepEqual(deserialized, draft);

  // Chuỗi JSON hỏng không làm crash
  assert.equal(deserializePracticeDraft('{ bad json'), null);
  assert.equal(deserializePracticeDraft(''), null);
});

test('savePracticeDraft, loadPracticeDraft, clearPracticeDraft với storage', () => {
  const storage = new MockStorage();

  const draft: PracticeDraft = {
    version: PRACTICE_DRAFT_VERSION,
    questions: mockQuestions,
    currentIndex: 0,
    results: [],
    elapsedSec: 8,
    savedAt: 1700000000000,
  };

  // Lưu draft
  const saved = savePracticeDraft(draft, storage);
  assert.equal(saved, true);
  assert.ok(storage.getItem(PRACTICE_DRAFT_KEY) !== null);

  // Đọc lại draft
  const loaded = loadPracticeDraft(storage);
  assert.deepEqual(loaded, draft);

  // Thử lưu draft hỏng -> trả về false, không ghi đè dữ liệu cũ
  const invalidDraft = { ...draft, version: 999 };
  const saveFailed = savePracticeDraft(invalidDraft, storage);
  assert.equal(saveFailed, false);
  assert.deepEqual(loadPracticeDraft(storage), draft);

  // Xóa draft
  clearPracticeDraft(storage);
  assert.equal(loadPracticeDraft(storage), null);
  assert.equal(storage.getItem(PRACTICE_DRAFT_KEY), null);
});

test('particleHint: phát hiện gợi ý trợ từ đúng các cặp và loại bỏ các ca không liên quan', () => {
  // Ca có gợi ý: わ thay cho は
  const hintWaHa = particleHint('わたしわ', 'わたしは');
  assert.ok(hintWaHa !== null);
  assert.match(hintWaHa, /Trợ từ は đọc là 'wa' nhưng viết は/);

  // Ca có gợi ý khi expected có furigana notation
  const hintFurigana = particleHint('わたしわ', '私[わたし]は');
  assert.ok(hintFurigana !== null);
  assert.match(hintFurigana, /Trợ từ は đọc là 'wa' nhưng viết は/);

  // Ca có gợi ý khi gõ romaji (wanakana chuyển 'watashiwa' thành 'わたしわ')
  const hintRomaji = particleHint('watashiwa', 'わたしは');
  assert.ok(hintRomaji !== null);
  assert.match(hintRomaji, /Trợ từ は đọc là 'wa' nhưng viết は/);

  // Ca có gợi ý: え thay cho へ
  const hintEHe = particleHint('とうきょうえ', 'とうきょうへ');
  assert.ok(hintEHe !== null);
  assert.match(hintEHe, /Trợ từ へ đọc là 'e' nhưng viết へ/);

  // Ca có gợi ý: お thay cho を
  const hintOWo = particleHint('ほんお', 'ほんを');
  assert.ok(hintOWo !== null);
  assert.match(hintOWo, /Trợ từ を đọc là 'o' nhưng viết を/);

  // Ca có cả hai trợ từ cùng lúc
  const hintBoth = particleHint('わたしわ ほんお', 'わたしは ほんを');
  assert.ok(hintBoth !== null);
  assert.match(hintBoth, /Trợ từ は/);
  assert.match(hintBoth, /Trợ từ を/);

  // Ca KHÔNG có gợi ý: sai từ khác hẳn
  assert.equal(particleHint('がくせい', 'せんせい'), null);

  // Ca KHÔNG có gợi ý: khớp nhau hoàn toàn
  assert.equal(particleHint('わたしは', 'わたしは'), null);
  assert.equal(particleHint('watashiha', 'わたしは'), null);

  // Ca KHÔNG có gợi ý: rỗng
  assert.equal(particleHint('', 'わたしは'), null);
  assert.equal(particleHint('   ', 'わたしは'), null);

  // Ca KHÔNG có gợi ý: sai độ dài hoặc thêm từ thừa
  assert.equal(particleHint('わたし', 'わたしは'), null);
  assert.equal(particleHint('わたしはです', 'わたしは'), null);
});

test('Kịch bản acceptance: 15 câu -> làm 2 câu -> lưu nháp -> khôi phục ở câu 3/15 -> hoàn thành xóa nháp -> tạo nháp làm lại câu sai', () => {
  const storage = new MockStorage();

  // Tạo 15 câu hỏi mẫu
  const fifteenQuestions: QuestionItem[] = Array.from({ length: 15 }, (_, i) => ({
    id: `q-${i + 1}`,
    type: 'cloze',
    lesson: 1,
    auxiliaryLessons: [1],
    targetId: `t-${i + 1}`,
    prompt: `Câu hỏi ${i + 1}`,
    answer: 'は',
  }));

  // Người dùng bắt đầu phiên 15 câu, trả lời 2 câu (câu 1 đúng, câu 2 sai)
  const resultsAfterTwo = [
    {
      targetId: 't-1',
      targetType: 'vocab' as const,
      isCorrect: true,
      elapsedMs: 3000,
      usedHint: false,
      userAnswer: 'は',
    },
    {
      targetId: 't-2',
      targetType: 'vocab' as const,
      isCorrect: false,
      elapsedMs: 4000,
      usedHint: false,
      userAnswer: 'わ',
    },
  ];

  // Người dùng chọn "Lưu và học tiếp sau"
  const draftToSave: PracticeDraft = {
    version: PRACTICE_DRAFT_VERSION,
    questions: fifteenQuestions,
    currentIndex: 2, // Tiếp tục ở câu thứ 3 (index 2: 3/15)
    results: resultsAfterTwo,
    elapsedSec: 25,
    savedAt: 1700000000000,
    config: {
      mode: 'lesson',
      lessons: [1],
      maxLearnedLesson: 1,
      selectedTypes: ['cloze'],
      questionCount: 15,
    },
  };

  savePracticeDraft(draftToSave, storage);

  // Khôi phục phiên từ nháp
  const resumed = loadPracticeDraft(storage);
  assert.ok(resumed !== null);
  assert.equal(resumed.currentIndex, 2);
  assert.equal(resumed.questions.length, 15);
  assert.equal(resumed.results.length, 2);
  assert.equal(resumed.elapsedSec, 25);
  assert.equal(resumed.results[0]?.isCorrect, true);
  assert.equal(resumed.results[1]?.isCorrect, false);

  // Khi hoàn thành phiên -> xóa nháp
  clearPracticeDraft(storage);
  assert.equal(loadPracticeDraft(storage), null);

  // Màn kết quả: người dùng bấm "Làm lại câu sai"
  const wrongQuestions = fifteenQuestions.filter((q) => q.targetId === 't-2');
  assert.equal(wrongQuestions.length, 1);

  const retryDraft: PracticeDraft = {
    version: PRACTICE_DRAFT_VERSION,
    questions: wrongQuestions,
    currentIndex: 0,
    results: [],
    elapsedSec: 0,
    savedAt: 1700000010000,
  };

  savePracticeDraft(retryDraft, storage);
  const loadedRetry = loadPracticeDraft(storage);
  assert.ok(loadedRetry !== null);
  assert.equal(loadedRetry.currentIndex, 0);
  assert.equal(loadedRetry.questions.length, 1);
  assert.equal(loadedRetry.questions[0]?.targetId, 't-2');
});

