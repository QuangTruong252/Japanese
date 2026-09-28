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
