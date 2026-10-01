import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getActiveVocabDraftForLesson,
  findActiveVocabDraft,
  getActivePracticeDraftInfo,
} from './active-drafts.ts';
import type { PracticeDraft } from './practice-draft.ts';

class MemoryStorage implements Storage {
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

test('getActiveVocabDraftForLesson trả về thông tin nháp từ vựng hợp lệ', () => {
  const storage = new MemoryStorage();
  storage.setItem(
    'jp:vocab-draft:5',
    JSON.stringify({
      version: 1,
      targetIds: ['vocab-05-01', 'vocab-05-02', 'vocab-05-03', 'vocab-05-04'],
      currentIndex: 2,
    })
  );

  const draft = getActiveVocabDraftForLesson(5, storage);
  assert.ok(draft);
  assert.equal(draft.lesson, 5);
  assert.equal(draft.currentWordIndex, 3); // 1-indexed
  assert.equal(draft.totalWords, 4);
  assert.equal(draft.resumeHref, '/hoc/5/tu-vung?tiep-tuc=1');
});

test('getActiveVocabDraftForLesson trả về null khi nháp đã hoàn tất', () => {
  const storage = new MemoryStorage();
  storage.setItem(
    'jp:vocab-draft:5',
    JSON.stringify({
      version: 1,
      targetIds: ['vocab-05-01', 'vocab-05-02'],
      currentIndex: 2, // Đã xong hết 2 từ
    })
  );

  const draft = getActiveVocabDraftForLesson(5, storage);
  assert.equal(draft, null);
});

test('findActiveVocabDraft tìm đúng bài đầu tiên có nháp', () => {
  const storage = new MemoryStorage();
  storage.setItem(
    'jp:vocab-draft:7',
    JSON.stringify({
      version: 1,
      targetIds: ['vocab-07-01', 'vocab-07-02'],
      currentIndex: 0,
    })
  );

  const draft = findActiveVocabDraft(storage);
  assert.ok(draft);
  assert.equal(draft.lesson, 7);
  assert.equal(draft.currentWordIndex, 1);
  assert.equal(draft.totalWords, 2);
  assert.equal(draft.resumeHref, '/hoc/7/tu-vung?tiep-tuc=1');
});

test('getActivePracticeDraftInfo trả về câu hiện tại và tổng số câu', () => {
  const draft: PracticeDraft = {
    version: 1,
    questions: [
      { id: 'q1', type: 'multiple_choice', prompt: 'a', options: ['a', 'b'], answer: 'a' } as unknown as PracticeDraft['questions'][number],
      { id: 'q2', type: 'multiple_choice', prompt: 'b', options: ['a', 'b'], answer: 'b' } as unknown as PracticeDraft['questions'][number],
      { id: 'q3', type: 'multiple_choice', prompt: 'c', options: ['a', 'b'], answer: 'c' } as unknown as PracticeDraft['questions'][number],
    ],
    currentIndex: 1,
    results: [],
    elapsedSec: 10,
    savedAt: Date.now(),
    config: { mode: 'lesson', lessons: [1, 2], maxLearnedLesson: 2, selectedTypes: ['mc'], questionCount: 3 },
  };

  const info = getActivePracticeDraftInfo(draft);
  assert.ok(info);
  assert.equal(info.currentQuestionIndex, 2);
  assert.equal(info.totalQuestions, 3);
  assert.deepEqual(info.selectedLessons, [1, 2]);
  assert.equal(info.resumeHref, '/luyen-tap/phien');
});

test('getActivePracticeDraftInfo trả về null khi phiên đã hoàn tất', () => {
  const draft: PracticeDraft = {
    version: 1,
    questions: [
      { id: 'q1', type: 'multiple_choice', prompt: 'a', options: ['a', 'b'], answer: 'a' } as unknown as PracticeDraft['questions'][number],
    ],
    currentIndex: 1, // Đã tới câu cuối
    results: [],
    elapsedSec: 10,
    savedAt: Date.now(),
  };

  const info = getActivePracticeDraftInfo(draft);
  assert.equal(info, null);
});

test('getActiveVocabDraftForLesson loại bỏ nháp hỏng (JSON lỗi, version lệch, targetIds rỗng/sai kiểu, currentIndex âm)', () => {
  const storage = new MemoryStorage();

  // JSON lỗi cú pháp
  storage.setItem('jp:vocab-draft:1', '{malformed-json');
  assert.equal(getActiveVocabDraftForLesson(1, storage), null);

  // version khác 1
  storage.setItem('jp:vocab-draft:2', JSON.stringify({ version: 2, targetIds: ['v1'], currentIndex: 0 }));
  assert.equal(getActiveVocabDraftForLesson(2, storage), null);

  // targetIds rỗng hoặc không phải array
  storage.setItem('jp:vocab-draft:3', JSON.stringify({ version: 1, targetIds: [], currentIndex: 0 }));
  assert.equal(getActiveVocabDraftForLesson(3, storage), null);

  storage.setItem('jp:vocab-draft:4', JSON.stringify({ version: 1, targetIds: 'not-an-array', currentIndex: 0 }));
  assert.equal(getActiveVocabDraftForLesson(4, storage), null);

  // currentIndex âm hoặc số thực
  storage.setItem('jp:vocab-draft:5', JSON.stringify({ version: 1, targetIds: ['v1'], currentIndex: -1 }));
  assert.equal(getActiveVocabDraftForLesson(5, storage), null);

  storage.setItem('jp:vocab-draft:6', JSON.stringify({ version: 1, targetIds: ['v1', 'v2'], currentIndex: 1.5 }));
  assert.equal(getActiveVocabDraftForLesson(6, storage), null);
});

test('getActiveVocabDraftForLesson loại bỏ nháp đã hết hạn / hoàn tất vượt quá giới hạn', () => {
  const storage = new MemoryStorage();

  // currentIndex = length (hoàn tất)
  storage.setItem('jp:vocab-draft:1', JSON.stringify({ version: 1, targetIds: ['v1', 'v2'], currentIndex: 2 }));
  assert.equal(getActiveVocabDraftForLesson(1, storage), null);

  // currentIndex > length (vượt quá / hết hạn)
  storage.setItem('jp:vocab-draft:2', JSON.stringify({ version: 1, targetIds: ['v1'], currentIndex: 99 }));
  assert.equal(getActiveVocabDraftForLesson(2, storage), null);
});

test('getActivePracticeDraftInfo loại bỏ nháp hỏng (null, questions rỗng, currentIndex âm)', () => {
  assert.equal(getActivePracticeDraftInfo(null), null);

  const emptyQuestionsDraft = {
    version: 1,
    questions: [],
    currentIndex: 0,
    results: [],
    elapsedSec: 0,
    savedAt: Date.now(),
  } as unknown as PracticeDraft;
  assert.equal(getActivePracticeDraftInfo(emptyQuestionsDraft), null);

  const negativeIndexDraft = {
    version: 1,
    questions: [
      { id: 'q1', type: 'multiple_choice', prompt: 'a', options: ['a', 'b'], answer: 'a' } as unknown as PracticeDraft['questions'][number],
    ],
    currentIndex: -1,
    results: [],
    elapsedSec: 0,
    savedAt: Date.now(),
  } as PracticeDraft;
  assert.equal(getActivePracticeDraftInfo(negativeIndexDraft), null);
});

test('getActivePracticeDraftInfo loại bỏ nháp luyện tập đã hết hạn hoặc vượt quá tổng số câu', () => {
  const expiredDraft = {
    version: 1,
    questions: [
      { id: 'q1', type: 'multiple_choice', prompt: 'a', options: ['a', 'b'], answer: 'a' } as unknown as PracticeDraft['questions'][number],
    ],
    currentIndex: 10, // Vượt xa số câu
    results: [],
    elapsedSec: 25,
    savedAt: Date.now(),
  } as PracticeDraft;

  assert.equal(getActivePracticeDraftInfo(expiredDraft), null);
});

test('findActiveVocabDraft bỏ qua toàn bộ bài nếu chỉ có nháp hỏng hoặc nháp đã hoàn tất', () => {
  const storage = new MemoryStorage();
  storage.setItem('jp:vocab-draft:1', '{bad json');
  storage.setItem('jp:vocab-draft:2', JSON.stringify({ version: 1, targetIds: ['v1'], currentIndex: 1 })); // Đã xong
  storage.setItem('jp:vocab-draft:3', JSON.stringify({ version: 99, targetIds: ['v1'], currentIndex: 0 })); // Version sai

  assert.equal(findActiveVocabDraft(storage), null);
});

test('getActivePracticeDraftInfo sinh resumeHref chuẩn /luyen-tap/phien cho nháp hợp lệ, không có href khi không có nháp hoặc nháp đã xong', () => {
  // Ca đúng: nháp luyện hợp lệ -> có resumeHref trỏ thẳng /luyen-tap/phien
  const validDraft: PracticeDraft = {
    version: 1,
    questions: [
      { id: 'q1', type: 'multiple_choice', prompt: 'a', options: ['a', 'b'], answer: 'a' } as unknown as PracticeDraft['questions'][number],
      { id: 'q2', type: 'multiple_choice', prompt: 'b', options: ['a', 'b'], answer: 'b' } as unknown as PracticeDraft['questions'][number],
    ],
    currentIndex: 0,
    results: [],
    elapsedSec: 5,
    savedAt: Date.now(),
    config: { mode: 'lesson', lessons: [5], maxLearnedLesson: 5, selectedTypes: ['mc'], questionCount: 2 },
  };
  const activeInfo = getActivePracticeDraftInfo(validDraft);
  assert.ok(activeInfo);
  assert.equal(activeInfo.resumeHref, '/luyen-tap/phien');

  // Ca sai 1: không có nháp (null) -> null (không có href)
  assert.equal(getActivePracticeDraftInfo(null), null);

  // Ca sai 2: nháp đã xong (currentIndex >= total) -> null (không có href)
  const completedDraft: PracticeDraft = {
    ...validDraft,
    currentIndex: 2,
  };
  assert.equal(getActivePracticeDraftInfo(completedDraft), null);

  // Ca sai 3: nháp hỏng (currentIndex âm) -> null (không có href)
  const negativeDraft: PracticeDraft = {
    ...validDraft,
    currentIndex: -1,
  };
  assert.equal(getActivePracticeDraftInfo(negativeDraft), null);
});

test('getActiveVocabDraftForLesson sinh resumeHref /hoc/:lesson/tu-vung?tiep-tuc=1 (vào thẳng thẻ dở) cho nháp từ vựng hợp lệ, null khi không có hoặc đã xong', () => {
  const storage = new MemoryStorage();
  storage.setItem(
    'jp:vocab-draft:4',
    JSON.stringify({
      version: 1,
      targetIds: ['vocab-04-01', 'vocab-04-02'],
      currentIndex: 0,
    })
  );

  // Ca đúng: nháp hợp lệ -> resumeHref trỏ thẳng /hoc/4/tu-vung
  const activeVocab = getActiveVocabDraftForLesson(4, storage);
  assert.ok(activeVocab);
  assert.equal(activeVocab.resumeHref, '/hoc/4/tu-vung?tiep-tuc=1');

  // Ca sai 1: không có nháp -> null (không có href)
  assert.equal(getActiveVocabDraftForLesson(8, storage), null);

  // Ca sai 2: nháp đã hoàn tất -> null (không có href)
  storage.setItem(
    'jp:vocab-draft:4',
    JSON.stringify({
      version: 1,
      targetIds: ['vocab-04-01', 'vocab-04-02'],
      currentIndex: 2,
    })
  );
  assert.equal(getActiveVocabDraftForLesson(4, storage), null);
});


test('getActivePracticeDraftInfo phân biệt nháp ôn (mode due) với nháp luyện dùng chung khóa lưu', () => {
  const q = { id: 'q1', type: 'mc', prompt: 'a', options: ['a', 'b'], answer: 'a' } as unknown as PracticeDraft['questions'][number];
  const base: PracticeDraft = {
    version: 1,
    questions: [q, q],
    currentIndex: 1,
    results: [],
    elapsedSec: 5,
    savedAt: Date.now(),
    config: { mode: 'due', lessons: [1], maxLearnedLesson: 1, selectedTypes: ['mc'], questionCount: 2 },
  };
  const review = getActivePracticeDraftInfo(base);
  assert.equal(review?.label, 'Ôn tập');
  assert.equal(review?.resumeHref, '/on-tap/phien?resume=1');

  const practice = getActivePracticeDraftInfo({ ...base, config: { ...base.config!, mode: 'lesson' } });
  assert.equal(practice?.label, 'Luyện tập');
  assert.equal(practice?.resumeHref, '/luyen-tap/phien');
});
