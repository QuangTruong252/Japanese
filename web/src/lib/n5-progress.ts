export interface LessonProgress {
  number: number;
  learned: number;
  total: number;
  /** 0..1 phần từ đã vào lịch ôn. Bài người học khai báo đã học xong thì 1. */
  ratio: number;
  done: boolean;
}

/**
 * Tiến độ một bài. "Xong" = mọi từ của bài đã vào lịch ôn, hoặc bài ≤ `learnedThroughLesson`
 * (người học khai báo đã học trước đó). Bài không có từ thì chỉ xong theo khai báo.
 */
export function lessonProgress(
  number: number,
  learned: number,
  total: number,
  learnedThroughLesson = 0,
): LessonProgress {
  const declared = number <= learnedThroughLesson;
  const done = declared || (total > 0 && learned >= total);
  const ratio = done ? 1 : total > 0 ? Math.min(1, learned / total) : 0;
  return { number, learned, total, ratio, done };
}

/** Tiến độ các bài theo thứ tự số bài, từ số bài trong `vocabCountByLesson`. */
export function n5Progress(
  learnedByLesson: Map<number, number>,
  vocabCountByLesson: Map<number, number>,
  learnedThroughLesson = 0,
): LessonProgress[] {
  return [...vocabCountByLesson.keys()]
    .sort((a, b) => a - b)
    .map((n) =>
      lessonProgress(n, learnedByLesson.get(n) ?? 0, vocabCountByLesson.get(n) ?? 0, learnedThroughLesson),
    );
}
