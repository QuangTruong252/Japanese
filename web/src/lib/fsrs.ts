import {
  fsrs,
  generatorParameters,
  Rating,
  createEmptyCard,
  type Card,
  type Grade,
} from 'ts-fsrs';

// FSRS scheduler với tham số enable_fuzz để tránh dồn thẻ cùng ngày
const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

/** Số mẫu thời gian trả lời giữ lại cho mỗi mục tiêu (SPEC-04 §2.2) */
export const ELAPSED_SAMPLE_SIZE = 5;

/**
 * Median của các mẫu thời gian trả lời đúng gần nhất. Mảng rỗng -> null (lần đầu).
 */
export function medianElapsedMs(samples: number[]): number | null {
  if (samples.length === 0) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

/**
 * Thêm một mẫu thời gian trả lời ĐÚNG, giữ tối đa ELAPSED_SAMPLE_SIZE mẫu gần nhất.
 * Câu trả lời sai không nói gì về độ thành thạo nên không được ghi mẫu.
 */
export function pushElapsedSample(samples: number[], elapsedMs: number): number[] {
  return [...samples, elapsedMs].slice(-ELAPSED_SAMPLE_SIZE);
}

/**
 * Suy ra Rating từ kết quả chấm tự động + tốc độ trả lời (so với median)
 */
export function rateAnswer(
  isCorrect: boolean,
  elapsedMs: number,
  medianMs: number | null,
  usedHint: boolean = false
): Grade {
  if (!isCorrect) return Rating.Again;
  if (medianMs === null) return Rating.Good; // Lần đầu tiên: chưa có mốc so sánh
  if (elapsedMs > medianMs * 2) return Rating.Hard;
  if (elapsedMs < medianMs / 2 && !usedHint) return Rating.Easy;
  return Rating.Good;
}

/**
 * Cập nhật lịch ôn cho một mục tiêu theo thuật toán FSRS.
 * Trả về Card mới và ngày đến hạn ôn kế tiếp (dueAt).
 */
export function applyReview(
  card: Card | null | undefined,
  rating: Grade,
  now: Date = new Date()
) {
  const currentCard: Card = card ? card : createEmptyCard(now);
  const recordLogItem = scheduler.next(currentCard, now, rating);
  return {
    card: recordLogItem.card,
    dueAt: recordLogItem.card.due,
  };
}

/** Thẻ chưa từng ôn — dùng khi hoàn tác lượt chấm đầu tiên đã lỡ đồng bộ lên server. */
export function newCard(now: Date = new Date()): Card {
  return createEmptyCard(now);
}

export { Rating };
export type { Card, Grade };
