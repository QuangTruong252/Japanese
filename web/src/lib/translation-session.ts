import { isTranslationMatch, selectTranslationItems, translationSentence, type TranslationCount, type TranslationDirection, type TranslationMode } from './translation.ts';
import { TRANSLATION_DATA_VERSION } from './translation-data.ts';

export const TRANSLATION_CONFIG_KEY = 'jp:translation-config';

export interface TranslationItem {
  id: string;
  direction: TranslationDirection;
  hintUsed?: boolean;
}

export interface TranslationAnswer {
  /** Lần trả lời đầu; rỗng khi bấm "Chưa biết". */
  value: string;
  /** `reviewing`: chưa khớp mẫu, chờ người học tự xác nhận (chưa tính đúng hay sai). */
  status: 'reviewing' | 'graded';
  correct: boolean;
  source?: 'automatic' | 'self';
}

export interface TranslationSession {
  id: string;
  mode: TranslationMode;
  scope: number;
  dataVersion: string;
  items: TranslationItem[];
  answers: TranslationAnswer[];
  index: number;
  input: string;
  elapsedSec: number;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type TranslationAction =
  | { type: 'input'; value: string }
  | { type: 'hint' }
  | { type: 'answer'; value: string }
  | { type: 'unknown' }
  | { type: 'confirm'; correct: boolean }
  | { type: 'next' }
  /** Chỉ ghi đồng hồ, không đổi tiến độ. */
  | { type: 'tick' };

const MODES: readonly string[] = ['jp-vi', 'vi-jp', 'mixed'];
const DIRECTIONS: readonly string[] = ['jp-vi', 'vi-jp'];

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function startSession(scope: number, mode: TranslationMode, items: TranslationItem[], now: Date): TranslationSession {
  if (!items.length) throw new Error('Chưa có câu cho phạm vi này.');
  const stamp = now.toISOString();
  return { id: newId(), mode, scope, dataVersion: TRANSLATION_DATA_VERSION, items, answers: [], index: 0, input: '', elapsedSec: 0, startedAt: stamp, updatedAt: stamp };
}

export function createTranslationSession(scope: number, mode: TranslationMode, count: TranslationCount, now = new Date(), random?: () => number): TranslationSession {
  return startSession(scope, mode, selectTranslationItems(scope, mode, count, random), now);
}

/** Phiên mới chỉ gồm các câu Cần ôn của phiên đã xong, giữ nguyên chiều của từng câu. */
export function createRetrySession(session: TranslationSession, now = new Date()): TranslationSession {
  const items = session.items.filter((_, i) => session.answers[i]?.status === 'graded' && !session.answers[i]!.correct).map(({ id, direction }) => ({ id, direction }));
  return startSession(session.scope, session.mode, items, now);
}

/** Lần trả lời đầu không bao giờ bị thay, kể cả khi hai tab cùng gửi một câu. */
export function applyTranslationAction(session: TranslationSession, index: number, action: TranslationAction, elapsedSec = 0): TranslationSession {
  if (session.completedAt || session.index !== index) return session;
  const item = session.items[index];
  const answer = session.answers[index];
  const sentence = item && translationSentence(item.id);
  if (!item || !sentence) return session;
  const now = new Date().toISOString();
  const base = { ...session, elapsedSec: Math.max(session.elapsedSec, Math.floor(elapsedSec)), updatedAt: now };
  const withAnswer = (next: TranslationAnswer, input: string): TranslationSession => ({ ...base, input, answers: [...session.answers, next] });

  switch (action.type) {
    case 'tick':
      return base.elapsedSec > session.elapsedSec ? base : session;
    case 'input':
      return answer ? session : { ...base, input: action.value };
    case 'hint':
      return answer || item.hintUsed ? session : { ...base, items: session.items.map((it, i) => (i === index ? { ...it, hintUsed: true } : it)) };
    case 'answer': {
      if (answer || !action.value.trim()) return session;
      return isTranslationMatch(action.value, sentence, item.direction)
        ? withAnswer({ value: action.value, status: 'graded', correct: true, source: 'automatic' }, action.value)
        : withAnswer({ value: action.value, status: 'reviewing', correct: false }, action.value);
    }
    case 'unknown':
      return answer ? session : withAnswer({ value: '', status: 'graded', correct: false, source: 'self' }, '');
    case 'confirm':
      if (answer?.status !== 'reviewing') return session;
      return { ...base, answers: session.answers.map((a, i) => (i === index ? { ...a, status: 'graded', correct: action.correct, source: 'self' } : a)) };
    case 'next': {
      if (answer?.status !== 'graded') return session;
      const finished = index === session.items.length - 1;
      return { ...base, index: index + 1, input: '', ...(finished ? { completedAt: now } : {}) };
    }
  }
}

/**
 * Gom việc lưu của một câu: input gõ gần nhất chưa lưu được sẽ được ghi lại trước mọi action khác,
 * nên một action thành công không che mất lỗi lưu input. `dirty` còn true khi input mới nhất chưa vào kho.
 */
export function createTranslationSaver(write: (action: TranslationAction) => Promise<void>) {
  let pending: string | null = null;
  return {
    get dirty() { return pending !== null; },
    /** Thử lại action lỗi: input luôn lấy giá trị mới nhất thay vì bản cũ. */
    retryOf(failed: TranslationAction): TranslationAction {
      return failed.type === 'input' && pending !== null ? { type: 'input', value: pending } : failed;
    },
    async save(action: TranslationAction): Promise<void> {
      if (action.type === 'input') pending = action.value;
      const flush = pending;
      if (flush !== null) {
        await write({ type: 'input', value: flush });
        if (pending === flush) pending = null;
      }
      if (action.type !== 'input') await write(action);
    },
  };
}

export function translationTally(session: TranslationSession) {
  const graded = session.answers.filter((a) => a.status === 'graded');
  return {
    automatic: graded.filter((a) => a.correct && a.source === 'automatic').length,
    self: graded.filter((a) => a.correct && a.source === 'self').length,
    review: graded.filter((a) => !a.correct).length,
    hinted: session.items.filter((item) => item.hintUsed).length,
  };
}

function validAnswer(a: unknown, item: TranslationItem): a is TranslationAnswer {
  if (!a || typeof a !== 'object') return false;
  const { value, status, correct, source } = a as TranslationAnswer;
  if (typeof value !== 'string' || typeof correct !== 'boolean') return false;
  if (status === 'reviewing') return source === undefined && !correct && value.trim() !== '' && !isTranslationMatch(value, translationSentence(item.id)!, item.direction);
  if (status !== 'graded' || (source !== 'automatic' && source !== 'self')) return false;
  if (value.trim() === '') return source === 'self' && !correct;
  // Khớp mẫu luôn là tự động; không khớp thì chỉ có thể do người học tự xác nhận.
  return isTranslationMatch(value, translationSentence(item.id)!, item.direction) ? source === 'automatic' && correct : source === 'self';
}

export function validateTranslationSession(raw: unknown): TranslationSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as TranslationSession;
  const timestamp = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value));
  if (typeof s.id !== 'string' || !s.id || !MODES.includes(s.mode) || !Number.isInteger(s.scope) || s.scope < 1 || s.scope > 25 ||
      typeof s.dataVersion !== 'string' || !s.dataVersion || !timestamp(s.startedAt) || !timestamp(s.updatedAt) ||
      typeof s.input !== 'string' || !Number.isInteger(s.elapsedSec) || s.elapsedSec < 0 ||
      !Array.isArray(s.items) || !s.items.length || !Array.isArray(s.answers) || s.answers.length > s.items.length ||
      !Number.isInteger(s.index) || s.index < 0 || s.index > s.items.length ||
      (s.completedAt !== undefined && !timestamp(s.completedAt))) return null;
  for (const item of s.items) {
    if (!item || typeof item.id !== 'string' || !DIRECTIONS.includes(item.direction) ||
        (item.hintUsed !== undefined && typeof item.hintUsed !== 'boolean') ||
        (s.mode !== 'mixed' && item.direction !== s.mode)) return null;
    const sentence = translationSentence(item.id);
    if (!sentence || sentence.minimumLesson > s.scope) return null;
  }
  if (new Set(s.items.map((item) => item.id)).size !== s.items.length) return null;
  if (!s.answers.every((a, i) => validAnswer(a, s.items[i]!))) return null;
  if (s.completedAt) return s.index === s.items.length && s.answers.length === s.items.length && s.answers.every((a) => a.status === 'graded') ? s : null;
  if (s.index >= s.items.length || (s.answers.length !== s.index && s.answers.length !== s.index + 1)) return null;
  // Chỉ câu đang làm được ở trạng thái chờ xác nhận.
  return s.answers.every((a, i) => a.status === 'graded' || i === s.index) ? s : null;
}

const progress = (s: TranslationSession) => s.index + s.answers.length + s.answers.filter((a) => a.status === 'graded').length;

/** Gộp sao lưu không bao giờ thay lần trả lời hay xác nhận đã có bằng bản ngắn hơn hoặc mâu thuẫn. */
export function mergeTranslationSessions(existing: TranslationSession[], incoming: TranslationSession[]): TranslationSession[] {
  const byId = new Map(existing.map((s) => [s.id, s]));
  for (const next of incoming) {
    const prev = byId.get(next.id);
    if (!prev) { byId.set(next.id, next); continue; }
    const sameItems = prev.items.length === next.items.length && prev.items.every((item, i) => item.id === next.items[i]?.id && item.direction === next.items[i]?.direction);
    const keepsAnswers = prev.answers.every((a, i) => {
      const other = next.answers[i];
      return other && other.value === a.value && (a.status === 'reviewing' || (other.status === 'graded' && other.correct === a.correct && other.source === a.source));
    });
    const keepsHints = prev.items.every((item, i) => !item.hintUsed || next.items[i]?.hintUsed);
    if (!sameItems || !keepsAnswers || !keepsHints) continue;
    if (progress(next) > progress(prev) || (progress(next) === progress(prev) && next.updatedAt >= prev.updatedAt)) byId.set(next.id, next);
  }
  return [...byId.values()];
}

export interface TranslationConfig {
  mode: TranslationMode;
  scope: number;
  count: TranslationCount;
}

export function parseTranslationConfig(raw: string | null): TranslationConfig | null {
  try {
    const c = JSON.parse(raw ?? '') as TranslationConfig;
    const validCount = c.count === 'all' || c.count === 5 || c.count === 10 || c.count === 20;
    return MODES.includes(c.mode) && Number.isInteger(c.scope) && c.scope >= 1 && c.scope <= 25 && validCount ? { mode: c.mode, scope: c.scope, count: c.count } : null;
  } catch {
    return null;
  }
}
