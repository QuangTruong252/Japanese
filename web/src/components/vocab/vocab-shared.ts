import { Frown, Laugh, Meh, Smile } from 'lucide-react';
import { Rating, type Grade } from '@/lib/fsrs';
import { stripFurigana, toKanaSentence } from '@/lib/japanese';
import type { RatingCounts } from '@/lib/vocab-draft';
import type { ExampleSentence, ReviewItem, VocabWord } from '@/types';

export interface VocabEntry {
  targetId: string;
  word: VocabWord;
  example?: ExampleSentence;
  reviewItem?: ReviewItem;
}

export interface RatingOption {
  grade: Grade;
  label: string;
  hint: string;
  icon: typeof Frown;
}

export const RATING_OPTIONS: RatingOption[] = [
  { grade: Rating.Again, label: 'Quên mất', hint: 'Không nhớ ra nghĩa, hoặc nhớ sai.', icon: Frown },
  { grade: Rating.Hard, label: 'Khó nhớ', hint: 'Chỉ nhớ một nửa, hoặc phải nghĩ rất lâu.', icon: Meh },
  { grade: Rating.Good, label: 'Nhớ được', hint: 'Nhớ đúng sau một chút suy nghĩ.', icon: Smile },
  { grade: Rating.Easy, label: 'Dễ nhớ', hint: 'Nhớ ngay, không phải nghĩ.', icon: Laugh },
];

export function ratingKey(grade: Grade): keyof RatingCounts {
  if (grade === Rating.Again) return 'again';
  if (grade === Rating.Hard) return 'hard';
  if (grade === Rating.Easy) return 'easy';
  return 'good';
}

export function formatInterval(dueAt: Date, now: Date): string {
  const minutes = Math.max(1, Math.ceil((dueAt.getTime() - now.getTime()) / 60_000));
  if (minutes < 60) return 'trong vài phút';
  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return `trong ${hours} giờ`;
  const days = Math.ceil(hours / 24);
  return `trong ${days} ngày`;
}

export function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'short' }).format(value);
}

export function getAccuracy(item: ReviewItem): number {
  const attempts = item.correctCount + item.incorrectCount;
  return attempts === 0 ? 0 : Math.round((item.correctCount / attempts) * 100);
}

const JAPANESE_BOUNDARY_BEFORE = /[\s　、。，．！？!?「『（(はがをにへとでもの]/u;
const JAPANESE_BOUNDARY_AFTER = /[\s　、。，．！？!?」』）)]/u;
const JAPANESE_PARTICLE = /^[はがをにへとでものかねよ]$/u;

function containsWholeStudyTerm(sentence: string, term: string): boolean {
  if (!term) return false;
  let index = sentence.indexOf(term);
  while (index !== -1) {
    const before = index > 0 ? sentence[index - 1] : '';
    const after = sentence[index + term.length] ?? '';
    const startsAtBoundary = !before || JAPANESE_BOUNDARY_BEFORE.test(before);
    const endsAtBoundary = !after || JAPANESE_BOUNDARY_AFTER.test(after) || JAPANESE_PARTICLE.test(after);
    if (startsAtBoundary && endsAtBoundary) return true;
    index = sentence.indexOf(term, index + 1);
  }
  return false;
}

export function findExampleForWord(word: VocabWord, examples: ExampleSentence[]): ExampleSentence | undefined {
  const surface = stripFurigana(word.word).replace(/[\s　]/gu, '').normalize('NFKC');
  const reading = word.kana.normalize('NFKC');
  const surfaceTerms = new Set([surface]);
  const readingTerms = new Set([reading]);

  if (word.verbForms) {
    const { dictionary, masu, te, nai, ta, dictionaryKana, masuKana, teKana, naiKana, taKana } = word.verbForms;
    for (const form of [dictionary, masu, te, nai, ta]) {
      if (form) surfaceTerms.add(stripFurigana(form).replace(/[\s　]/gu, '').normalize('NFKC'));
    }
    for (const k of [dictionaryKana, masuKana, teKana, naiKana, taKana]) {
      if (k) readingTerms.add(k.normalize('NFKC'));
    }
  } else if (word.type.startsWith('verb-') && reading.endsWith('ます')) {
    const readingStem = reading.slice(0, -2);
    const surfaceStem = surface.endsWith('ます') ? surface.slice(0, -2) : '';
    for (const ending of ['ます', 'ました', 'ません', 'ませんでした', 'ましょう']) {
      readingTerms.add(`${readingStem}${ending}`);
      if (surfaceStem) surfaceTerms.add(`${surfaceStem}${ending}`);
    }
  }

  return examples.find((example) => {
    const writtenSentence = stripFurigana(example.jp).normalize('NFKC');
    const spokenSentence = toKanaSentence(example.jp).normalize('NFKC');
    return (
      [...surfaceTerms].some((term) => containsWholeStudyTerm(writtenSentence, term)) ||
      [...readingTerms].some((term) => containsWholeStudyTerm(spokenSentence, term))
    );
  });
}
