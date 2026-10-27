import type { DictationSentence } from './dictation.ts';
import { DICTATION_DATA_VERSION, DICTATION_SENTENCES, isDictationAnswer, localDay, selectDailyDictation } from './dictation.ts';
import { containsKanji, toKanaSentence } from './japanese.ts';

export const DICTATION_SCOPE_KEY = 'jp:dictation-scope';

export interface DictationSession {
  id: string;
  day: string;
  scope: number;
  dataVersion: string;
  sentences: DictationSentence[];
  answers: { value: string; correct: boolean }[];
  index: number;
  input: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
}

export function createDictationSession(day: string, scope: number, now = new Date()): DictationSession {
  const sentences = selectDailyDictation(day, scope);
  if (!sentences.length) throw new Error('Chưa có câu đã xác minh cho phạm vi này.');
  return {
    id: `${day}:${scope}:${DICTATION_DATA_VERSION}`, day, scope, dataVersion: DICTATION_DATA_VERSION,
    sentences, answers: [], index: 0, input: '', startedAt: now.toISOString(), updatedAt: now.toISOString(),
  };
}

/** First answers are immutable, including when two tabs submit the same question. */
export function answerDictation(session: DictationSession, index: number, value: string): DictationSession {
  if (session.completedAt || session.index !== index || session.answers[index]) return session;
  return {
    ...session, input: value,
    answers: [...session.answers, { value, correct: isDictationAnswer(value, session.sentences[index]) }],
    updatedAt: new Date().toISOString(),
  };
}

export function advanceDictation(session: DictationSession, index: number): DictationSession {
  if (session.completedAt || session.index !== index || !session.answers[index]) return session;
  const finished = index === session.sentences.length - 1;
  const now = new Date().toISOString();
  return { ...session, index: index + 1, input: '', updatedAt: now, ...(finished ? { completedAt: now } : {}) };
}

export function validateDictationSession(raw: unknown): DictationSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as DictationSession;
  const timestamp = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.day) || !Number.isInteger(s.scope) || s.scope < 1 || s.scope > 25 ||
      typeof s.dataVersion !== 'string' || !s.dataVersion || s.id !== `${s.day}:${s.scope}:${s.dataVersion}` ||
      !timestamp(s.startedAt) || !timestamp(s.updatedAt) || typeof s.input !== 'string' ||
      !Array.isArray(s.sentences) || !s.sentences.length || s.sentences.length > 5 ||
      !Array.isArray(s.answers) || s.answers.length > s.sentences.length ||
      !Number.isInteger(s.index) || s.index < 0 || s.index > s.sentences.length ||
      (s.completedAt !== undefined && !timestamp(s.completedAt))) return null;
  if (new Set(s.sentences.map((q) => q?.id)).size !== s.sentences.length) return null;
  if (localDay(new Date(`${s.day}T12:00:00`)) !== s.day) return null;
  for (const q of s.sentences) {
    if (!q || typeof q.id !== 'string' || !q.id || !Number.isInteger(q.lesson) || q.lesson < 1 ||
        !Number.isInteger(q.minimumLesson) || q.minimumLesson < q.lesson || q.minimumLesson > s.scope ||
        !['jp', 'kana', 'vi'].every((key) => typeof q[key as keyof DictationSentence] === 'string' && q[key as keyof DictationSentence])) return null;
    if (q.kana !== toKanaSentence(q.jp) || containsKanji(q.kana) || /[\[\]0-9０-９A-Za-z]/u.test(q.kana)) return null;
    if (s.dataVersion === DICTATION_DATA_VERSION) {
      const reviewed = DICTATION_SENTENCES.find((sentence) => sentence.id === q.id);
      if (!reviewed || ['lesson', 'minimumLesson', 'jp', 'kana', 'vi'].some((key) => q[key as keyof DictationSentence] !== reviewed[key as keyof DictationSentence])) return null;
    }
  }
  if (s.answers.some((a, i) => !a || typeof a.value !== 'string' || typeof a.correct !== 'boolean' ||
      a.correct !== isDictationAnswer(a.value, s.sentences[i]))) return null;
  if (s.completedAt ? s.index !== s.sentences.length || s.answers.length !== s.sentences.length
    : s.index >= s.sentences.length || (s.answers.length !== s.index && s.answers.length !== s.index + 1)) return null;
  return s;
}

/** Merging backups never replaces a first answer with a shorter or conflicting attempt. */
export function mergeDictationSessions(existing: DictationSession[], incoming: DictationSession[]): DictationSession[] {
  const byId = new Map(existing.map((s) => [s.id, s]));
  for (const next of incoming) {
    const prev = byId.get(next.id);
    if (!prev) { byId.set(next.id, next); continue; }
    const prefixMatches = prev.sentences.length === next.sentences.length && prev.sentences.every((q, i) =>
      ['id', 'lesson', 'minimumLesson', 'jp', 'kana', 'vi'].every((key) => q[key as keyof DictationSentence] === next.sentences[i]?.[key as keyof DictationSentence])) &&
      prev.answers.every((a, i) => a.value === next.answers[i]?.value && a.correct === next.answers[i]?.correct);
    if (prefixMatches && (next.answers.length > prev.answers.length ||
        (next.answers.length === prev.answers.length && next.index >= prev.index && next.updatedAt >= prev.updatedAt))) byId.set(next.id, next);
  }
  return [...byId.values()];
}
