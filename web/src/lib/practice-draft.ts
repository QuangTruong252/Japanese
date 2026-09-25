import type {
  AnswerResult,
  PracticeConfig,
  QuestionItem,
} from '../types/index.ts';
import { normalizeJapaneseInput, toKanaSentence } from './japanese.ts';

export const PRACTICE_DRAFT_KEY = 'jp:practice-draft';
export const PRACTICE_DRAFT_VERSION = 1;

// Biến module tự về false khi tải lại trang — phân biệt "vừa bấm Bắt đầu" với "trình duyệt reload".
let newSessionRequested = false;

export function markNewSessionRequested(): void {
  newSessionRequested = true;
}

export function wasNewSessionRequested(): boolean {
  return newSessionRequested;
}

export interface PracticeDraft {
  version: number;
  questions: QuestionItem[];
  currentIndex: number;
  results: AnswerResult[];
  elapsedSec: number;
  savedAt: number;
  config?: PracticeConfig;
}

/**
 * Xác định xem có nên lưu nháp sau khi trả lời câu hỏi hay không.
 * Ở câu cuối cùng (currentIndex + 1 >= totalQuestions), không lưu nháp
 * để tránh câu cuối bị lặp lại hoặc tính 2 lần khi khôi phục.
 */
export function shouldSaveDraftOnAnswer(
  currentIndex: number,
  totalQuestions: number,
): boolean {
  return currentIndex + 1 < totalQuestions;
}

/**
 * Kiểm tra tính hợp lệ của bản nháp phiên luyện tập.
 * Trả về PracticeDraft đã chuẩn hóa nếu hợp lệ, null nếu hỏng hoặc khác version.
 */
export function validatePracticeDraft(data: unknown): PracticeDraft | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const obj = data as Record<string, unknown>;

  if (obj.version !== PRACTICE_DRAFT_VERSION) {
    return null;
  }

  if (!Array.isArray(obj.questions) || obj.questions.length === 0) {
    return null;
  }

  // Kiểm tra cấu trúc câu hỏi cơ bản
  for (const q of obj.questions) {
    if (
      !q ||
      typeof q !== 'object' ||
      typeof q.id !== 'string' ||
      typeof q.type !== 'string' ||
      typeof q.lesson !== 'number' ||
      typeof q.targetId !== 'string' ||
      typeof q.prompt !== 'string' ||
      q.answer === undefined
    ) {
      return null;
    }
  }

  if (
    typeof obj.currentIndex !== 'number' ||
    !Number.isFinite(obj.currentIndex) ||
    obj.currentIndex < 0 ||
    obj.currentIndex >= obj.questions.length
  ) {
    return null;
  }

  if (!Array.isArray(obj.results)) {
    return null;
  }

  const elapsedSec =
    typeof obj.elapsedSec === 'number' && Number.isFinite(obj.elapsedSec) && obj.elapsedSec >= 0
      ? Math.round(obj.elapsedSec)
      : 0;

  const savedAt =
    typeof obj.savedAt === 'number' && Number.isFinite(obj.savedAt) && obj.savedAt > 0
      ? obj.savedAt
      : Date.now();

  const config =
    obj.config && typeof obj.config === 'object'
      ? (obj.config as PracticeConfig)
      : undefined;

  return {
    version: PRACTICE_DRAFT_VERSION,
    questions: obj.questions as QuestionItem[],
    currentIndex: Math.floor(obj.currentIndex),
    results: obj.results as AnswerResult[],
    elapsedSec,
    savedAt,
    ...(config ? { config } : {}),
  };
}

export function serializePracticeDraft(draft: PracticeDraft): string {
  return JSON.stringify(draft);
}

export function deserializePracticeDraft(raw: string): PracticeDraft | null {
  try {
    const parsed = JSON.parse(raw);
    return validatePracticeDraft(parsed);
  } catch {
    return null;
  }
}

function getStorage(storage?: Storage): Storage | null {
  if (storage) return storage;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

type DraftListener = () => void;
const draftListeners = new Set<DraftListener>();

let cachedDraft: PracticeDraft | null = null;
let lastRawDraft: string | null = null;

export function subscribePracticeDraft(listener: DraftListener): () => void {
  draftListeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === PRACTICE_DRAFT_KEY) {
      lastRawDraft = e.newValue;
      cachedDraft = e.newValue ? deserializePracticeDraft(e.newValue) : null;
      listener();
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }
  return () => {
    draftListeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
}

export function getPracticeDraftSnapshot(): PracticeDraft | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  const raw = window.localStorage.getItem(PRACTICE_DRAFT_KEY);
  if (raw === lastRawDraft && cachedDraft !== null) {
    return cachedDraft;
  }
  lastRawDraft = raw;
  cachedDraft = loadPracticeDraft();
  return cachedDraft;
}

export function savePracticeDraft(draft: PracticeDraft, storage?: Storage): boolean {
  const store = getStorage(storage);
  if (!store) return false;
  try {
    const validated = validatePracticeDraft(draft);
    if (!validated) return false;
    const serialized = serializePracticeDraft(validated);
    store.setItem(PRACTICE_DRAFT_KEY, serialized);
    lastRawDraft = serialized;
    cachedDraft = validated;
    draftListeners.forEach((fn) => fn());
    return true;
  } catch {
    return false;
  }
}

export function loadPracticeDraft(storage?: Storage): PracticeDraft | null {
  const store = getStorage(storage);
  if (!store) return null;
  try {
    const raw = store.getItem(PRACTICE_DRAFT_KEY);
    if (!raw) return null;
    return deserializePracticeDraft(raw);
  } catch {
    return null;
  }
}

export function clearPracticeDraft(storage?: Storage): void {
  const store = getStorage(storage);
  if (!store) return;
  try {
    store.removeItem(PRACTICE_DRAFT_KEY);
    lastRawDraft = null;
    cachedDraft = null;
    draftListeners.forEach((fn) => fn());
  } catch {
    // Bỏ qua lỗi truy cập storage
  }
}

/**
 * Gợi ý có mục tiêu khi câu trả lời sai của người dùng chỉ khác đáp án
 * ở các trợ từ đọc khác viết: わ↔は, え↔へ, お↔を.
 * Tuyệt đối không thay đổi kết quả chấm.
 */
export function particleHint(
  user: string,
  expected: string | string[],
): string | null {
  if (!user || user.trim().length === 0) return null;

  const expectedList = Array.isArray(expected) ? expected : [expected];
  if (expectedList.length === 0) return null;

  const normUser = normalizeJapaneseInput(user);
  if (!normUser) return null;

  // Nếu người dùng đã khớp với một trong các đáp án đúng thì không gợi ý sai trợ từ
  for (const exp of expectedList) {
    const normExp = normalizeJapaneseInput(toKanaSentence(exp));
    if (normUser === normExp) {
      return null;
    }
  }

  // Duyệt qua các đáp án kỳ vọng để tìm xem có đáp án nào CHỈ khác ở trợ từ không
  for (const exp of expectedList) {
    const normExp = normalizeJapaneseInput(toKanaSentence(exp));
    if (!normExp) continue;

    // So sánh độ dài
    if (normUser.length !== normExp.length) {
      continue;
    }

    let onlyParticleMismatch = true;
    let hasWaHa = false;
    let hasEHe = false;
    let hasOWo = false;
    let hasHaWa = false;
    let hasHeE = false;
    let hasWoO = false;

    for (let i = 0; i < normUser.length; i++) {
      const u = normUser[i];
      const e = normExp[i];

      if (u === e) continue;

      if (u === 'わ' && e === 'は') {
        hasWaHa = true;
      } else if (u === 'は' && e === 'わ') {
        hasHaWa = true;
      } else if (u === 'え' && e === 'へ') {
        hasEHe = true;
      } else if (u === 'へ' && e === 'え') {
        hasHeE = true;
      } else if (u === 'お' && e === 'を') {
        hasOWo = true;
      } else if (u === 'を' && e === 'お') {
        hasWoO = true;
      } else {
        // Có ký tự khác biệt không thuộc nhóm trợ từ nhầm lẫn
        onlyParticleMismatch = false;
        break;
      }
    }

    if (
      onlyParticleMismatch &&
      (hasWaHa || hasEHe || hasOWo || hasHaWa || hasHeE || hasWoO)
    ) {
      const hints: string[] = [];
      if (hasWaHa) {
        hints.push("Trợ từ は đọc là 'wa' nhưng viết は — khi gõ romaji hãy gõ 'ha'");
      }
      if (hasEHe) {
        hints.push("Trợ từ へ đọc là 'e' nhưng viết へ — khi gõ romaji hãy gõ 'he'");
      }
      if (hasOWo) {
        hints.push("Trợ từ を đọc là 'o' nhưng viết を — khi gõ romaji hãy gõ 'wo'");
      }
      if (hasHaWa) {
        hints.push("Chữ わ đọc là 'wa' và viết là わ — khi gõ romaji hãy gõ 'wa'");
      }
      if (hasHeE) {
        hints.push("Chữ え đọc là 'e' và viết là え — khi gõ romaji hãy gõ 'e'");
      }
      if (hasWoO) {
        hints.push("Chữ お đọc là 'o' và viết là お — khi gõ romaji hãy gõ 'o'");
      }
      return hints.join('; ');
    }
  }

  return null;
}
