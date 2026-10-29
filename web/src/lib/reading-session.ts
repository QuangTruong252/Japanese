import type { ReadingPassage, ReadingQuestion, ReadingSession } from '../types/reading.ts';
import { READING_DATA_VERSION, readingPassage, validateReadingPassage } from './reading-data.ts';
import type { ReadingScope } from './reading.ts';

export const READING_QUESTION_COUNT = 3;

/** Mọi action mang `revision` và `questionIndex` mà màn hình đang thấy, để bản ghi mới hơn không bị ghi đè bởi trạng thái cũ. */
export type ReadingAction =
  | { type: 'select'; optionId: string }
  | { type: 'submit' }
  | { type: 'next' };

export type ReadingActionRef = { revision: number; questionIndex: number };

/**
 * `applied`: đã đổi. `noop`: không có gì để đổi (nộp lặp, chọn lại cùng đáp án, phiên đã xong).
 * `stale`: action phát từ trạng thái cũ (tab khác đã ghi); UI nạp lại `session` thay vì phát lại.
 */
export type ReadingActionResult = { status: 'applied' | 'noop' | 'stale'; session: ReadingSession };

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function startSession(passage: ReadingPassage, scope: ReadingScope, now: Date): ReadingSession {
  const errors = validateReadingPassage(passage);
  if (errors.length) throw new Error(`Bài đọc không hợp lệ: ${errors[0]}`);
  const stamp = now.toISOString();
  return {
    id: newId(),
    scope: scope.lesson,
    filter: { minCoverage: scope.minCoverage, maxNewGrammar: scope.maxNewGrammar },
    dataVersion: READING_DATA_VERSION,
    passage: structuredClone(passage),
    questionIndex: 0,
    selectedOptionId: null,
    answers: [],
    startedAt: stamp,
    updatedAt: stamp,
    revision: 0,
  };
}

export function createReadingSession(passage: ReadingPassage, scope: ReadingScope, now = new Date()): ReadingSession {
  return startSession(passage, scope, now);
}

/** Bài trong catalog đã đổi phiên bản kể từ khi phiên bắt đầu: hiện nhãn "Bản đã cập nhật" khi làm lại. */
export const isReadingSessionOutdated = (session: ReadingSession): boolean => session.dataVersion !== READING_DATA_VERSION;

/**
 * "Làm lại": phiên mới từ bài hiện tại trong catalog, giữ scope/filter của phiên gốc; kết quả cũ không đổi.
 * Trả null khi bài không còn trong catalog (vẫn đọc được kết quả cũ qua bản chụp).
 */
export function restartReadingSession(session: ReadingSession, now = new Date(), lookup: (id: string) => ReadingPassage | undefined = readingPassage): ReadingSession | null {
  const current = lookup(session.passage.id);
  return current ? startSession(current, { lesson: session.scope, ...session.filter }, now) : null;
}

const questionAt = (session: ReadingSession, index = session.questionIndex): ReadingQuestion | undefined => session.passage.questions[index];

/** Chấm bằng ID lựa chọn so với ID đáp án, không so chuỗi. */
export const isReadingAnswerCorrect = (question: ReadingQuestion, selectedOptionId: string): boolean => question.correctOptionId === selectedOptionId;

/** Câu hiện tại đã nộp, đang chờ "Tiếp theo". */
export const isReadingAwaitingNext = (session: ReadingSession): boolean => !session.completedAt && session.answers.length > session.questionIndex;

export function applyReadingAction(session: ReadingSession, action: ReadingAction, ref: ReadingActionRef, now = new Date()): ReadingActionResult {
  const noop: ReadingActionResult = { status: 'noop', session };
  const question = questionAt(session);
  if (session.completedAt || !question) return noop;
  // Nộp lặp cùng câu (bấm đúp, hai tab) không phải lỗi và không thay đáp án đầu.
  if (action.type === 'submit' && ref.questionIndex === session.questionIndex && session.answers.length > session.questionIndex) return noop;
  if (ref.revision !== session.revision || ref.questionIndex !== session.questionIndex) return { status: 'stale', session };

  const stamp = now.toISOString();
  const base = { ...session, updatedAt: stamp, revision: session.revision + 1 };
  const answered = session.answers.length > session.questionIndex;

  switch (action.type) {
    case 'select':
      if (answered || session.selectedOptionId === action.optionId || !question.options.some((o) => o.id === action.optionId)) return noop;
      return { status: 'applied', session: { ...base, selectedOptionId: action.optionId } };
    case 'submit': {
      if (!session.selectedOptionId) return noop;
      const answers = [...session.answers, { questionId: question.id, selectedOptionId: session.selectedOptionId }];
      const finished = session.questionIndex === session.passage.questions.length - 1;
      // Câu cuối: đáp án và completedAt ghi cùng một lần.
      return { status: 'applied', session: { ...base, answers, selectedOptionId: null, ...(finished ? { completedAt: stamp } : {}) } };
    }
    case 'next':
      // "Tiếp theo" không bỏ qua câu chưa nộp.
      if (!answered) return noop;
      return { status: 'applied', session: { ...base, questionIndex: session.questionIndex + 1, selectedOptionId: null } };
  }
}

export interface ReadingQuestionResult {
  question: ReadingQuestion;
  selectedOptionId: string;
  correct: boolean;
}

/** Điểm không lưu riêng, luôn tính từ đáp án và bản chụp để không thể lệch. */
export function readingResults(session: ReadingSession): ReadingQuestionResult[] {
  return session.answers.flatMap((answer, i) => {
    const question = questionAt(session, i);
    return question ? [{ question, selectedOptionId: answer.selectedOptionId, correct: isReadingAnswerCorrect(question, answer.selectedOptionId) }] : [];
  });
}

export const readingScore = (session: ReadingSession): { correct: number; total: number } =>
  ({ correct: readingResults(session).filter((r) => r.correct).length, total: session.passage.questions.length });

/** Nhiều phiên dở cùng bài: bản cập nhật gần nhất, bằng nhau thì ID tăng dần. */
export function pickResumableSession<T extends Pick<ReadingSession, 'id' | 'updatedAt' | 'completedAt' | 'passage'>>(sessions: readonly T[], passageId: string): T | undefined {
  return sessions
    .filter((s) => !s.completedAt && s.passage.id === passageId)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
}

const timestamp = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v));

/** Kiểm cả bản ghi: bản chụp bài hợp lệ, vị trí, đáp án và hoàn tất nhất quán với nhau. Sai thì null. */
export function validateReadingSession(raw: unknown): ReadingSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as ReadingSession;
  const f = s.filter as Partial<ReadingSession['filter']> | undefined;
  if (typeof s.id !== 'string' || !s.id || !Number.isInteger(s.scope) || s.scope < 1 || s.scope > 25 ||
      !f || !Number.isInteger(f.minCoverage) || f.minCoverage! < 80 || f.minCoverage! > 100 || !Number.isInteger(f.maxNewGrammar) || f.maxNewGrammar! < 0 || f.maxNewGrammar! > 2 ||
      !Number.isInteger(s.dataVersion) || s.dataVersion < 1 || !timestamp(s.startedAt) || !timestamp(s.updatedAt) ||
      (s.completedAt !== undefined && !timestamp(s.completedAt)) || !Number.isInteger(s.revision) || s.revision < 0 ||
      !Array.isArray(s.answers) || validateReadingPassage(s.passage).length > 0) return null;
  const questions = s.passage.questions;
  const optionOf = (q: ReadingQuestion, id: unknown) => q.options.some((o) => o.id === id);
  if (!Number.isInteger(s.questionIndex) || s.questionIndex < 0 || s.questionIndex >= questions.length) return null;
  if (s.answers.length > questions.length || !s.answers.every((a, i) => a && a.questionId === questions[i]!.id && optionOf(questions[i]!, a.selectedOptionId))) return null;

  if (s.completedAt) {
    return s.answers.length === questions.length && s.questionIndex === questions.length - 1 && s.selectedOptionId === null ? s : null;
  }
  // Đang dở: câu hiện tại chưa nộp (answers = index) hoặc đã nộp chờ "Tiếp theo" (answers = index + 1, chưa phải câu cuối).
  if (s.answers.length !== s.questionIndex && s.answers.length !== s.questionIndex + 1) return null;
  if (s.answers.length === questions.length) return null;
  if (s.answers.length === s.questionIndex + 1) return s.selectedOptionId === null ? s : null;
  return s.selectedOptionId === null || optionOf(questions[s.questionIndex]!, s.selectedOptionId) ? s : null;
}

/** Gộp sao lưu: khác ID giữ cả hai; cùng ID giữ nguyên bản local (kể cả snapshot khác) và đếm số bản trùng bỏ qua. */
export function mergeReadingSessions(existing: readonly ReadingSession[], incoming: readonly ReadingSession[]): { added: ReadingSession[]; duplicates: number } {
  const ids = new Set(existing.map((s) => s.id));
  const added: ReadingSession[] = [];
  let duplicates = 0;
  for (const next of incoming) {
    if (ids.has(next.id)) duplicates++;
    else { ids.add(next.id); added.push(next); }
  }
  return { added, duplicates };
}
