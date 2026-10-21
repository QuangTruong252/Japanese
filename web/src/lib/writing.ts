import { db } from './db.ts';
import { applyReview, Rating, type Grade } from './fsrs.ts';
import type { WritingCard } from '../types/index.ts';

export interface WritingResult { misses: number; hintUsed: boolean }
export type WritingStep = { char: string; phase: 'learn' | 'recall' };

export function rateWriting(result: WritingResult): Grade {
  if (result.hintUsed) return Rating.Again;
  return result.misses >= 1 ? Rating.Hard : Rating.Good;
}

export function nextWritingCard(
  prev: WritingCard | undefined,
  char: string,
  result: WritingResult,
  now: Date,
): WritingCard {
  const rating = rateWriting(result);
  const correct = rating === Rating.Good;
  const { card, dueAt } = applyReview(prev?.fsrsCard, rating, now);
  const iso = now.toISOString();
  return {
    char,
    fsrsCard: card,
    dueAt,
    correctCount: (prev?.correctCount ?? 0) + Number(correct),
    incorrectCount: (prev?.incorrectCount ?? 0) + Number(!correct),
    lastFailedAt: correct ? prev?.lastFailedAt : iso,
    createdAt: prev?.createdAt ?? iso,
    updatedAt: iso,
  };
}

export async function recordWriting(
  char: string,
  result: WritingResult,
  now: Date = new Date(),
): Promise<WritingCard> {
  return db.transaction('rw', db.writingCards, async () => {
    const previous = await db.writingCards.get(char);
    const next = nextWritingCard(previous, char, result, now);
    await db.writingCards.put(next);
    return next;
  });
}

export function dueChars(cards: WritingCard[], now: Date): string[] {
  return cards.filter((card) => card.dueAt <= now)
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime() || a.char.localeCompare(b.char))
    .map((card) => card.char);
}

export function hardChars(cards: WritingCard[]): string[] {
  return cards.filter((card) => card.incorrectCount > 0)
    .sort((a, b) => b.incorrectCount - a.incorrectCount ||
      (b.lastFailedAt ?? '').localeCompare(a.lastFailedAt ?? ''))
    .map((card) => card.char);
}

function shuffleItems<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
}

export function buildWritingSession(
  chars: string[],
  known: ReadonlySet<string>,
  shuffle: <T>(items: T[]) => T[] = shuffleItems,
): WritingStep[] {
  const unique = [...new Set(chars)];
  // Tách hai pha để chữ mới được viết lại sau vài chữ khác thay vì ngay sau khi học.
  return [
    ...unique.filter((char) => !known.has(char)).map((char): WritingStep => ({ char, phase: 'learn' })),
    ...shuffle([...unique]).map((char): WritingStep => ({ char, phase: 'recall' })),
  ];
}
