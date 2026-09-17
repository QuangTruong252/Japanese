import type { QuestionItem, PracticeConfig } from '../types/index.ts';

export interface FilterResult {
  eligibleQuestions: QuestionItem[];
  excludedAudioCount: number;
}

export const filterExercises = (
  allQuestions: QuestionItem[],
  config: PracticeConfig,
  availableAudioKeys: Set<string>,
  dueTargetIds?: Set<string>
): FilterResult => {
  // 1. Khoanh vùng mục tiêu: theo bài đã chọn hoặc theo lịch ôn đến hạn
  let pool =
    config.mode === 'due' && dueTargetIds
      ? allQuestions.filter((q) => dueTargetIds.has(q.targetId))
      : allQuestions.filter((q) => config.lessons.includes(q.lesson));

  // 2. Rà soát kiến thức phụ trợ: Mọi bài phụ trợ trong câu phải <= maxLearnedLesson
  pool = pool.filter((q) => q.auxiliaryLessons.every((l) => l <= config.maxLearnedLesson));

  // 3. Lọc theo dạng bài đã chọn
  pool = pool.filter((q) => config.selectedTypes.includes(q.type));

  // 3b. Ở chế độ ôn theo lịch, loại dạng ghép cặp: một lượt matching gom 4-5 mục tiêu có
  // hạn ôn khác nhau vào cùng một lần chấm (SPEC-01 §4.2).
  if (config.mode === 'due') {
    pool = pool.filter((q) => q.type !== 'matching');
  }

  // 4. Tiền kiểm tra Audio (Pre-flight Check)
  let excludedAudioCount = 0;
  const eligibleQuestions: QuestionItem[] = [];

  for (const q of pool) {
    if (q.type === 'listening' || q.audioKey) {
      const audioKey = q.audioKey ?? 'tts';
      if (availableAudioKeys.has(audioKey)) {
        eligibleQuestions.push(q);
      } else {
        excludedAudioCount++;
      }
    } else {
      eligibleQuestions.push(q);
    }
  }

  return { eligibleQuestions, excludedAudioCount };
};
