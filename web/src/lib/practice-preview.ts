import type { ExerciseType } from '../types/index.ts';
import {
  VALID_PRACTICE_EXERCISE_TYPES,
  VALID_PRACTICE_QUESTION_COUNTS,
  isDefaultPracticePreset,
  validatePracticePreset,
  type PracticePreset,
} from './settings.ts';

export interface ResolveInitialPracticeConfigOptions {
  lessonsParam?: string | null;
  typeParam?: string | null;
  savedPreset?: unknown;
  activeLessonNum?: number | null;
}

export interface PracticeInitialConfig {
  lessons: number[];
  types: ExerciseType[];
  questionCount: number;
}

/**
 * Phân tích chuỗi query param `lessons` (ví dụ: "1,2,5" hoặc "3").
 * Loại bỏ giá trị không phải số nguyên trong khoảng 1..25, khử trùng lặp và sắp xếp tăng dần.
 */
export function parseLessonsParam(param?: string | null): number[] {
  if (!param) return [];
  const parsed = param
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 25);
  return parsed.length > 0 ? [...new Set(parsed)].sort((a, b) => a - b) : [];
}

/**
 * Xác định cấu hình luyện tập ban đầu (SPEC-19 §2):
 * 1. Bài học: `?lessons=N` thắng; rồi `practicePreset` hợp lệ; rồi bài đang học cục bộ (1..25); người mới -> Bài 1.
 * 2. Dạng bài: `?type=T` thắng nếu hợp lệ; rồi `practicePreset.types` hợp lệ; fallback 5 dạng bài chuẩn.
 * 3. Số câu: `practicePreset.questionCount` nếu thuộc [10, 15, 20, 30]; fallback 15.
 */
export function resolveInitialPracticeConfig(
  options: ResolveInitialPracticeConfigOptions,
): PracticeInitialConfig {
  const rawPreset =
    options.savedPreset && typeof options.savedPreset === 'object'
      ? (options.savedPreset as Partial<PracticePreset>)
      : null;
  const isDefault = rawPreset ? isDefaultPracticePreset(validatePracticePreset(rawPreset)) : false;
  const usefulPreset = rawPreset && !isDefault ? rawPreset : null;

  // 1. Phân giải danh sách bài học
  let lessons: number[] = [1];
  const fromParam = parseLessonsParam(options.lessonsParam);

  if (fromParam.length > 0) {
    lessons = fromParam;
  } else if (usefulPreset && Array.isArray(usefulPreset.lessons)) {
    const validPresetLessons = usefulPreset.lessons.filter(
      (n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 25,
    );
    if (validPresetLessons.length > 0) {
      lessons = [...new Set(validPresetLessons)].sort((a, b) => a - b);
    } else if (
      typeof options.activeLessonNum === 'number' &&
      Number.isInteger(options.activeLessonNum) &&
      options.activeLessonNum >= 1 &&
      options.activeLessonNum <= 25
    ) {
      lessons = [options.activeLessonNum];
    }
  } else if (
    typeof options.activeLessonNum === 'number' &&
    Number.isInteger(options.activeLessonNum) &&
    options.activeLessonNum >= 1 &&
    options.activeLessonNum <= 25
  ) {
    lessons = [options.activeLessonNum];
  }

  // 2. Phân giải danh sách dạng bài
  let types: ExerciseType[] = [...VALID_PRACTICE_EXERCISE_TYPES];
  if (
    options.typeParam &&
    VALID_PRACTICE_EXERCISE_TYPES.includes(options.typeParam as ExerciseType)
  ) {
    types = [options.typeParam as ExerciseType];
  } else if (usefulPreset && Array.isArray(usefulPreset.types)) {
    const validPresetTypes = usefulPreset.types.filter((t): t is ExerciseType =>
      typeof t === 'string' && VALID_PRACTICE_EXERCISE_TYPES.includes(t as ExerciseType),
    );
    if (validPresetTypes.length > 0) {
      types = [...new Set(validPresetTypes)];
    }
  }

  // 3. Phân giải số lượng câu hỏi
  let questionCount = 15;
  if (
    usefulPreset &&
    typeof usefulPreset.questionCount === 'number' &&
    VALID_PRACTICE_QUESTION_COUNTS.includes(
      usefulPreset.questionCount as 10 | 15 | 20 | 30,
    )
  ) {
    questionCount = usefulPreset.questionCount;
  }

  return { lessons, types, questionCount };
}

/**
 * Tính số câu thực tế tạo được từ cấu hình hiện tại.
 * M = min(questionCount, eligibleCount). Nếu eligibleCount <= 0 thì M = 0.
 */
export function computeActualQuestionCount(
  requestedCount: number,
  eligibleCount: number,
): number {
  if (eligibleCount <= 0 || requestedCount <= 0) return 0;
  return Math.min(requestedCount, eligibleCount);
}

/**
 * Sinh nhãn cho nút CTA bắt đầu luyện tập (SPEC-19 §1, §3).
 * Khi bị chặn hoặc 0 câu -> "Bắt đầu".
 * Khi có câu hợp lệ -> "Bắt đầu M câu".
 */
export function getPracticeStartButtonText(
  actualCount: number,
  blockedReason?: string | null,
): string {
  if (blockedReason || actualCount <= 0) {
    return 'Bắt đầu';
  }
  return `Bắt đầu ${actualCount} câu`;
}

/**
 * Xác định lý do bị chặn của phiên luyện tập nếu có.
 * Dùng cho `aria-describedby` và thông báo lỗi đọc được.
 */
export function getPracticeBlockedReason(options: {
  selectedLessons: number[];
  selectedTypes: ExerciseType[];
  eligibleCount: number;
  loading?: boolean;
}): string | null {
  if (options.selectedLessons.length === 0) {
    return 'Chưa chọn bài nào. Vui lòng chọn ít nhất một bài học.';
  }
  if (options.selectedTypes.length === 0) {
    return 'Chưa chọn dạng bài nào. Vui lòng chọn ít nhất một dạng bài.';
  }
  if (!options.loading && options.eligibleCount === 0) {
    return 'Không có câu nào hợp lệ với lựa chọn hiện tại. Thử chọn thêm bài hoặc thêm dạng bài.';
  }
  return null;
}

/**
 * Định dạng tiêu đề tóm tắt cho card bắt đầu nhanh trên màn đầu (SPEC-19 §1, §3).
 * Ví dụ: "Sẵn sàng luyện Bài 3 · 15 câu · 5 dạng bài"
 */
export function formatPracticeSummaryTitle(
  lessons: number[],
  actualCount: number,
  typesCount: number,
): string {
  if (lessons.length === 0) {
    return 'Chưa chọn bài học';
  }
  const lessonText =
    lessons.length === 1
      ? `Bài ${lessons[0]}`
      : lessons.length === 25
        ? 'Tất cả 25 bài'
        : `Bài ${lessons.join(', ')}`;

  const countText = `${actualCount} câu`;
  const typeText = `${typesCount} dạng`;

  return `Sẵn sàng luyện ${lessonText} · ${countText} · ${typeText}`;
}
