import { useSyncExternalStore } from 'react';
import {
  getPracticeDraftSnapshot,
  subscribePracticeDraft,
  type PracticeDraft,
} from './practice-draft.ts';
import { readVocabDraftRaw, subscribeVocabDraft } from './vocab-draft.ts';

export interface ActiveVocabDraft {
  lesson: number;
  currentWordIndex: number; // 1-based (e.g. từ thứ 3)
  totalWords: number;
  resumeHref: string;
}

export interface ActivePracticeDraftInfo {
  currentQuestionIndex: number; // 1-based (e.g. câu thứ 5)
  totalQuestions: number;
  selectedLessons?: number[];
  resumeHref: string;
  /** Nháp ôn (`mode: 'due'`) và nháp luyện dùng chung một khóa lưu. */
  label: 'Luyện tập' | 'Ôn tập';
}

export interface ActiveDraftsState {
  vocabDraft: ActiveVocabDraft | null;
  practiceDraft: ActivePracticeDraftInfo | null;
}

/**
 * Tìm nháp học từ vựng cho một bài cụ thể.
 * Trả về null nếu không có nháp hoặc nháp đã hoàn tất.
 */
export function getActiveVocabDraftForLesson(
  lesson: number,
  storage?: Storage,
): ActiveVocabDraft | null {
  try {
    const raw = storage
      ? storage.getItem(`jp:vocab-draft:${lesson}`)
      : readVocabDraftRaw(lesson);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      parsed.version === 1 &&
      Array.isArray(parsed.targetIds) &&
      parsed.targetIds.length > 0 &&
      typeof parsed.currentIndex === 'number' &&
      Number.isInteger(parsed.currentIndex) &&
      parsed.currentIndex >= 0 &&
      parsed.currentIndex < parsed.targetIds.length
    ) {
      return {
        lesson,
        currentWordIndex: parsed.currentIndex + 1,
        totalWords: parsed.targetIds.length,
        resumeHref: `/hoc/${lesson}/tu-vung?tiep-tuc=1`,
      };
    }
  } catch {
    // Bỏ qua dữ liệu hỏng
  }
  return null;
}

/**
 * Tìm nháp học từ vựng đầu tiên còn đang dở trong 25 bài N5.
 */
export function findActiveVocabDraft(storage?: Storage): ActiveVocabDraft | null {
  for (let lesson = 1; lesson <= 25; lesson++) {
    const draft = getActiveVocabDraftForLesson(lesson, storage);
    if (draft) return draft;
  }
  return null;
}

/**
 * Chuyển đổi PracticeDraft thô thành ActivePracticeDraftInfo nếu phiên chưa hoàn thành.
 */
export function getActivePracticeDraftInfo(
  draft: PracticeDraft | null,
): ActivePracticeDraftInfo | null {
  if (!draft || !Array.isArray(draft.questions) || draft.questions.length === 0) {
    return null;
  }
  const total = draft.questions.length;
  const current = draft.currentIndex ?? 0;
  if (current < 0 || current >= total) {
    return null;
  }
  return {
    currentQuestionIndex: current + 1,
    totalQuestions: total,
    selectedLessons: draft.config?.lessons,
    ...(draft.config?.mode === 'due'
      ? { resumeHref: '/on-tap/phien?resume=1', label: 'Ôn tập' as const }
      : { resumeHref: '/luyen-tap/phien', label: 'Luyện tập' as const }),
  };
}

let cachedActiveDrafts: ActiveDraftsState = { vocabDraft: null, practiceDraft: null };
let lastSerialized = '';

export function getActiveDraftsSnapshot(): ActiveDraftsState {
  if (typeof window === 'undefined') {
    return { vocabDraft: null, practiceDraft: null };
  }

  const vocab = findActiveVocabDraft();
  const practice = getActivePracticeDraftInfo(getPracticeDraftSnapshot());
  const serialized = `${vocab ? `${vocab.lesson}:${vocab.currentWordIndex}/${vocab.totalWords}` : 'none'}|${practice ? `${practice.currentQuestionIndex}/${practice.totalQuestions}` : 'none'}`;

  if (serialized !== lastSerialized) {
    lastSerialized = serialized;
    cachedActiveDrafts = { vocabDraft: vocab, practiceDraft: practice };
  }

  return cachedActiveDrafts;
}

const SERVER_SNAPSHOT: ActiveDraftsState = { vocabDraft: null, practiceDraft: null };

/**
 * Hook lắng nghe cả nháp học từ vựng và nháp luyện tập.
 */
export function useActiveDrafts(): ActiveDraftsState {
  return useSyncExternalStore(
    (callback) => {
      const unsubPractice = subscribePracticeDraft(callback);
      const unsubVocab = subscribeVocabDraft(callback);
      return () => {
        unsubPractice();
        unsubVocab();
      };
    },
    getActiveDraftsSnapshot,
    () => SERVER_SNAPSHOT,
  );
}
