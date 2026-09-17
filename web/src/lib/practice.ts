import type {
  AnswerResult,
  PracticeConfig,
  PracticeSession,
  QuestionItem,
  ReviewItem,
  TargetType,
} from '../types/index.ts';
import { filterExercises } from './filter.ts';
import {
  applyReview,
  medianElapsedMs,
  pushElapsedSample,
  rateAnswer,
} from './fsrs.ts';
import { normalizeJapaneseInput } from './japanese.ts';

const TARGET_TYPES: readonly TargetType[] = ['vocab', 'grammar', 'kanji', 'particle', 'listening'];

/**
 * targetId dạng `vocab-01-03`, `grammar-05-02`, `particle-wo`. QuestionItem không mang
 * targetType nên suy từ tiền tố. Không khớp thì về 'vocab' — giữa phiên làm bài, ném lỗi
 * tệ hơn nhiều so với xếp nhầm nhóm.
 */
export function targetTypeFromId(targetId: string): TargetType {
  const prefix = targetId.split('-')[0] as TargetType;
  return TARGET_TYPES.includes(prefix) ? prefix : 'vocab';
}

/** Fisher-Yates. `rng` là tham số để test tất định được. */
export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function buildSession(
  allQuestions: QuestionItem[],
  config: PracticeConfig,
  availableAudioKeys: Set<string>,
  dueTargetIds?: Set<string>,
  rng: () => number = Math.random,
): { questions: QuestionItem[]; excludedAudioCount: number; eligibleCount: number } {
  const { eligibleQuestions, excludedAudioCount } = filterExercises(
    allQuestions,
    config,
    availableAudioKeys,
    dueTargetIds,
  );
  return {
    questions: shuffle(eligibleQuestions, rng).slice(0, config.questionCount),
    excludedAudioCount,
    eligibleCount: eligibleQuestions.length,
  };
}

const answerStrings = (question: QuestionItem): string[] =>
  Array.isArray(question.answer) ? question.answer : [question.answer];

/**
 * Chấm ô nhập (dạng 3 và 5). Chỉ chuẩn hóa những khác biệt được phép — romaji↔kana,
 * full-width↔half-width, khoảng trắng, dấu câu. Không có luật nào biến đáp án sai nghĩa
 * thành đúng.
 */
export function checkTextAnswer(input: string, question: QuestionItem): boolean {
  const normalized = normalizeJapaneseInput(input);
  if (normalized.length === 0) return false;
  const accepted = [...answerStrings(question), ...(question.acceptedVariants ?? [])];
  return accepted.some((a) => normalizeJapaneseInput(a) === normalized);
}

export function checkOptionAnswer(chosen: string, question: QuestionItem): boolean {
  return answerStrings(question).includes(chosen);
}

export function checkReorderAnswer(chosen: string[], question: QuestionItem): boolean {
  const expected = answerStrings(question);
  return (
    chosen.length === expected.length && chosen.every((token, i) => token === expected[i])
  );
}

/**
 * Áp một loạt kết quả lên lịch ôn. Đơn vị là targetId: cùng một targetId xuất hiện nhiều lần
 * trong phiên thì applyReview chạy lần lượt theo đúng thứ tự trả lời, không gộp.
 * Trả về mảng ReviewItem để bulkPut — hàm thuần, không chạm Dexie.
 */
export function applyResults(
  existing: ReviewItem[],
  results: AnswerResult[],
  lessonByTargetId: Map<string, number>,
  now: Date = new Date(),
): ReviewItem[] {
  const iso = now.toISOString();
  const draft = new Map<string, ReviewItem>(existing.map((item) => [item.targetId, item]));

  for (const result of results) {
    const previous = draft.get(result.targetId);
    const rating = rateAnswer(
      result.isCorrect,
      result.elapsedMs,
      medianElapsedMs(previous?.recentElapsedMs ?? []),
      result.usedHint,
    );
    const { card, dueAt } = applyReview(previous?.fsrsCard, rating, now);

    draft.set(result.targetId, {
      targetId: result.targetId,
      targetType: previous?.targetType ?? result.targetType,
      lesson: previous?.lesson ?? lessonByTargetId.get(result.targetId) ?? 0,
      correctCount: (previous?.correctCount ?? 0) + (result.isCorrect ? 1 : 0),
      incorrectCount: (previous?.incorrectCount ?? 0) + (result.isCorrect ? 0 : 1),
      lastFailedAt: result.isCorrect ? previous?.lastFailedAt : iso,
      dueAt,
      fsrsCard: card,
      updatedAt: iso,
      createdAt: previous?.createdAt ?? iso,
      // Thời gian của một câu trả sai không nói gì về độ thành thạo.
      recentElapsedMs: result.isCorrect
        ? pushElapsedSample(previous?.recentElapsedMs ?? [], result.elapsedMs)
        : (previous?.recentElapsedMs ?? []),
    });
  }

  return [...draft.values()];
}

export function summarizeSession(
  config: PracticeConfig,
  results: AnswerResult[],
  totalQuestions: number,
  durationSeconds: number,
  now: Date = new Date(),
): PracticeSession {
  const correctCount = results.filter((r) => r.isCorrect).length;
  return {
    id: `session-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    selectedLessons: [...config.lessons],
    exerciseTypes: [...config.selectedTypes],
    totalQuestions,
    correctCount,
    accuracyRate: results.length === 0 ? 0 : correctCount / results.length,
    durationSeconds,
    createdAt: now.toISOString(),
  };
}
