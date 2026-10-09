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

/**
 * Ở phiên ôn theo lịch, mỗi mục tiêu chỉ được hỏi MỘT câu. Một targetId có thể có hàng chục
 * câu (`particle-wo` xuất hiện ở mọi bài): không khử trùng lặp thì một mục chiếm hết phiên,
 * các mục đến hạn còn lại không được hỏi và dueAt của chúng đứng yên.
 */
function oneQuestionPerTarget(questions: QuestionItem[]): QuestionItem[] {
  const seen = new Set<string>();
  const picked: QuestionItem[] = [];
  for (const question of questions) {
    if (seen.has(question.targetId)) continue;
    seen.add(question.targetId);
    picked.push(question);
  }
  return picked;
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
  // Câu ghép cặp không có cặp nào thì không có gì để chấm: runner không có phản hồi để hiện và kẹt.
  const shuffled = shuffle(
    eligibleQuestions.filter((q) => q.type !== 'matching' || (q.pairs?.length ?? 0) > 0),
    rng,
  );
  const picked = config.mode === 'due' ? oneQuestionPerTarget(shuffled) : shuffled;

  return {
    questions: picked.slice(0, config.questionCount),
    excludedAudioCount,
    eligibleCount: eligibleQuestions.length,
  };
}

/** Văn bản câu trả lời của người học cho dạng sắp xếp: các cụm đã chọn, theo thứ tự chọn. */
export function reorderUserAnswer(chosenWords: string[]): string {
  return chosenWords.join(' ');
}

/** Đáp án đúng dạng chuỗi; các cụm của câu sắp xếp nối bằng dấu cách, cùng khuôn `reorderUserAnswer`. */
export function answerText(answer: string | string[]): string {
  return Array.isArray(answer) ? answer.join(' ') : answer;
}

/**
 * Văn bản các lần ghép sai của dạng ghép cặp, cùng khuôn `jp ↔ vi` với đáp án đúng.
 * Rỗng nếu người học ghép đúng hết (khi đó không có câu sai để hiện).
 */
export function matchingUserAnswer(
  attempts: { leftTargetId: string; rightTargetId: string }[],
  pairs: { targetId: string; jp: string; vi: string }[],
): string {
  const byId = new Map(pairs.map((p) => [p.targetId, p]));
  return attempts
    .map((a) => `${byId.get(a.leftTargetId)?.jp ?? ''} ↔ ${byId.get(a.rightTargetId)?.vi ?? ''}`)
    .join(' · ');
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

/**
 * `totalQuestions` đếm MỤC TIÊU ĐÃ CHẤM, không phải số câu hiện ra. Một lượt ghép cặp là
 * một câu nhưng chấm 5 mục tiêu; lấy số câu thì bản ghi tự mâu thuẫn (correctCount 18 trên
 * totalQuestions 8) và tính sai tỷ lệ đúng.
 */
export function summarizeSession(
  config: PracticeConfig,
  results: AnswerResult[],
  durationSeconds: number,
  now: Date = new Date(),
): PracticeSession {
  const correctCount = results.filter((r) => r.isCorrect).length;
  const totalQuestions = results.length;
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

/**
 * Câu sai và câu trả lời của người học cho màn kết quả, gom theo từng câu: một từ có thể vừa
 * hỏi cách đọc vừa hỏi nghĩa trong cùng phiên, gom theo targetId sẽ gán nhầm câu trả lời.
 * Kết quả cũ (nháp trước khi có questionId) vẫn khớp theo targetId.
 */
export function summarizeIncorrect(
  questions: QuestionItem[],
  results: AnswerResult[],
): { incorrectQuestions: QuestionItem[]; userAnswers: Record<string, string> } {
  const wrongQuestionIds = new Set<string>();
  const legacyWrongTargetIds = new Set<string>();
  const userAnswers: Record<string, string> = {};
  for (const r of results) {
    if (!r.isCorrect) {
      if (r.questionId) wrongQuestionIds.add(r.questionId);
      else legacyWrongTargetIds.add(r.targetId);
    }
    if (r.userAnswer !== undefined) userAnswers[r.questionId ?? r.targetId] = r.userAnswer;
  }
  const incorrectQuestions = questions.filter((q) =>
    wrongQuestionIds.has(q.id) ||
    (q.pairs && q.pairs.length > 0
      ? q.pairs.some((p) => legacyWrongTargetIds.has(p.targetId))
      : legacyWrongTargetIds.has(q.targetId)),
  );
  return { incorrectQuestions, userAnswers };
}

/** Câu trả lời đã gõ/chọn cho một câu ở màn kết quả (khóa mới theo câu, khóa cũ theo từ). */
export function userAnswerFor(userAnswers: Record<string, string>, q: QuestionItem): string | undefined {
  return userAnswers[q.id] ?? userAnswers[q.targetId];
}

