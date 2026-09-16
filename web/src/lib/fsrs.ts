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

export { Rating };
export type { Card, Grade };
