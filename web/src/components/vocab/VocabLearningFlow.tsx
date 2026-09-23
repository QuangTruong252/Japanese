'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Furigana } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/db';
import { applyReview, Rating, type Grade } from '@/lib/fsrs';
import { stripFurigana, toKanaSentence } from '@/lib/japanese';
import { getVocabLearningTime, getVocabTargetId, saveVocabRecall } from '@/lib/vocab-learning';
import { cn } from '@/lib/utils';
import type { ExampleSentence, ReviewItem, VocabWord } from '@/types';

interface VocabLearningFlowProps {
  lessonNumber: number;
  lessonTitle: string;
  verified: boolean;
  words: VocabWord[];
  examples: ExampleSentence[];
}

interface VocabEntry {
  targetId: string;
  word: VocabWord;
  example?: ExampleSentence;
  reviewItem?: ReviewItem;
}

interface RatingOption {
  grade: Grade;
  label: string;
  hint: string;
  icon: typeof RotateCcw;
  statusClassName: string;
  className: string;
}

const RATING_OPTIONS: RatingOption[] = [
  {
    grade: Rating.Again,
    label: 'Quên mất',
    hint: 'Gặp lại sớm',
    icon: RotateCcw,
    statusClassName: 'text-destructive',
    className: 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10',
  },
  {
    grade: Rating.Hard,
    label: 'Khó nhớ',
    hint: 'Nhớ sau khi cố gắng',
    icon: TriangleAlert,
    statusClassName: 'text-warning',
    className: 'border-warning/30 bg-warning/5 hover:bg-warning/10',
  },
  {
    grade: Rating.Good,
    label: 'Nhớ được',
    hint: 'Đúng như dự kiến',
    icon: Check,
    statusClassName: 'text-success',
    className: 'border-success/30 bg-success/5 hover:bg-success/10',
  },
  {
    grade: Rating.Easy,
    label: 'Dễ nhớ',
    hint: 'Nhớ ngay',
    icon: Sparkles,
    statusClassName: 'text-primary',
    className: 'border-primary/30 bg-accent/40 hover:bg-accent',
  },
];

type RatingCounts = Record<'again' | 'hard' | 'good' | 'easy', number>;

const EMPTY_RATING_COUNTS: RatingCounts = { again: 0, hard: 0, good: 0, easy: 0 };

function ratingKey(grade: Grade): keyof RatingCounts {
  if (grade === Rating.Again) return 'again';
  if (grade === Rating.Hard) return 'hard';
  if (grade === Rating.Easy) return 'easy';
  return 'good';
}

function formatInterval(dueAt: Date, now: Date): string {
  const minutes = Math.max(1, Math.ceil((dueAt.getTime() - now.getTime()) / 60_000));
  if (minutes < 60) return 'trong vài phút';
  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return `trong ${hours} giờ`;
  const days = Math.ceil(hours / 24);
  return `trong ${days} ngày`;
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'short' }).format(value);
}

function getAccuracy(item: ReviewItem): number {
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

function findExampleForWord(word: VocabWord, examples: ExampleSentence[]): ExampleSentence | undefined {
  const surface = stripFurigana(word.word).replace(/[\s　]/gu, '').normalize('NFKC');
  const reading = word.kana.normalize('NFKC');
  const surfaceTerms = new Set([surface]);
  const readingTerms = new Set([reading]);

  if (word.type.startsWith('verb-') && reading.endsWith('ます')) {
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

function MemoryRankings({ entries }: { entries: VocabEntry[] }) {
  const reviewed = entries.flatMap((entry) => {
    const item = entry.reviewItem;
    if (!item || item.correctCount + item.incorrectCount === 0) return [];
    return [{ ...entry, reviewItem: item, accuracy: getAccuracy(item) }];
  });

  const mostStable = [...reviewed]
    .filter(({ reviewItem }) => reviewItem.correctCount > 0)
    .sort(
      (a, b) =>
        b.accuracy - a.accuracy ||
        b.reviewItem.fsrsCard.stability - a.reviewItem.fsrsCard.stability,
    )
    .slice(0, 5);
  const needsPractice = [...reviewed]
    .filter(({ reviewItem }) => reviewItem.incorrectCount > 0)
    .sort(
      (a, b) =>
        (b.reviewItem.incorrectCount / (b.reviewItem.correctCount + b.reviewItem.incorrectCount)) -
          (a.reviewItem.incorrectCount / (a.reviewItem.correctCount + a.reviewItem.incorrectCount)) ||
        b.reviewItem.incorrectCount - a.reviewItem.incorrectCount ||
        a.reviewItem.fsrsCard.stability - b.reviewItem.fsrsCard.stability,
    )
    .slice(0, 5);

  if (reviewed.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Chưa có lượt luyện hoặc ôn. Kết quả sẽ hiện ở đây sau khi bạn học từ đầu tiên.
      </p>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <MemoryList
        title="Nhớ ổn định"
        description="Ưu tiên tỷ lệ nhớ đúng, sau đó là độ ổn định FSRS."
        icon={CheckCheck}
        entries={mostStable}
        emptyText="Chưa có từ nào được nhớ đúng."
        value={(item) => `${item.accuracy}% nhớ đúng · ôn ${formatDate(item.reviewItem.dueAt)}`}
      />
      <MemoryList
        title="Cần củng cố"
        description="Xếp theo số lần quên; mở lại thẻ để luyện tiếp."
        icon={CircleHelp}
        entries={needsPractice}
        emptyText="Chưa ghi nhận lần quên nào."
        value={(item) => `${item.reviewItem.incorrectCount} lần quên · ${item.accuracy}% nhớ đúng`}
      />
    </div>
  );
}

function MemoryList({
  title,
  description,
  icon: Icon,
  entries,
  emptyText,
  value,
}: {
  title: string;
  description: string;
  icon: typeof Check;
  entries: (VocabEntry & { reviewItem: ReviewItem; accuracy: number })[];
  emptyText: string;
  value: (entry: VocabEntry & { reviewItem: ReviewItem; accuracy: number }) => string;
}) {
  return (
    <section className="space-y-3" aria-label={title}>
      <div className="space-y-1">
        <h3 className="flex items-center gap-2 font-semibold">
          <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ol className="divide-y divide-border border-y border-border">
          {entries.map((entry) => (
            <li key={entry.targetId} className="flex min-w-0 items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="jp jp-vocab font-medium">
                  <Furigana text={entry.word.word} />
                </div>
                <p className="truncate text-xs text-muted-foreground">{entry.word.meaning.vi}</p>
              </div>
              <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {value(entry)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function VocabLearningFlow({
  lessonNumber,
  lessonTitle,
  verified,
  words,
  examples,
}: VocabLearningFlowProps) {
  const prefix = `vocab-${String(lessonNumber).padStart(2, '0')}-`;
  const storedReviewItems = useLiveQuery(
    () => db.reviewItems.where('targetId').startsWith(prefix).toArray(),
    [prefix],
  );
  const entries = useMemo<VocabEntry[]>(
    () => words.map((word, index) => ({
      word,
      targetId: getVocabTargetId(lessonNumber, index),
      example: findExampleForWord(word, examples),
    })),
    [examples, lessonNumber, words],
  );
  const reviewByTargetId = useMemo(
    () => new Map((storedReviewItems ?? []).map((item) => [item.targetId, item])),
    [storedReviewItems],
  );
  const entriesWithProgress = useMemo(
    () => entries.map((entry) => ({ ...entry, reviewItem: reviewByTargetId.get(entry.targetId) })),
    [entries, reviewByTargetId],
  );
  const availableEntries = useMemo(
    () => entriesWithProgress.filter(({ word }) => Boolean(word.meaning.vi.trim())),
    [entriesWithProgress],
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(entries.filter(({ word }) => Boolean(word.meaning.vi.trim())).map(({ targetId }) => targetId)),
  );
  const [stage, setStage] = useState<'select' | 'study' | 'complete'>('select');
  const [sessionWords, setSessionWords] = useState<VocabEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [ratingCounts, setRatingCounts] = useState<RatingCounts>(EMPTY_RATING_COUNTS);
  const cardStartedAt = useRef(0);
  const studyContentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (stage === 'study') studyContentRef.current?.focus();
  }, [currentIndex, revealed, stage]);

  const selectedCount = availableEntries.filter(({ targetId }) => selectedIds.has(targetId)).length;
  const activeWord = sessionWords[currentIndex];
  const activeReviewItem = activeWord ? reviewByTargetId.get(activeWord.targetId) : undefined;
  const ratingPreviews = useMemo(() => {
    if (!activeWord || !revealed) return [];
    const now = new Date();
    return RATING_OPTIONS.map((option) => ({
      ...option,
      interval: formatInterval(applyReview(activeReviewItem?.fsrsCard, option.grade, now).dueAt, now),
    }));
  }, [activeReviewItem?.fsrsCard, activeWord, revealed]);

  const toggleWord = (targetId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(targetId)) next.delete(targetId);
      else next.add(targetId);
      return next;
    });
  };

  const startSession = () => {
    const chosen = availableEntries.filter(({ targetId }) => selectedIds.has(targetId));
    if (chosen.length === 0 || storedReviewItems === undefined) return;
    setSessionWords(chosen.map(({ targetId, word, example }) => ({ targetId, word, example })));
    setCurrentIndex(0);
    setRevealed(false);
    setRatingCounts({ ...EMPTY_RATING_COUNTS });
    setSaveError(null);
    cardStartedAt.current = Date.now();
    setStage('study');
  };

  const rateCurrentWord = async (grade: Grade) => {
    if (!activeWord || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveVocabRecall({
        targetId: activeWord.targetId,
        lesson: lessonNumber,
        grade,
        elapsedMs: getVocabLearningTime() - cardStartedAt.current,
      });
      setRatingCounts((counts) => ({ ...counts, [ratingKey(grade)]: counts[ratingKey(grade)] + 1 }));
      if (currentIndex + 1 >= sessionWords.length) {
        setStage('complete');
      } else {
        setCurrentIndex((index) => index + 1);
        setRevealed(false);
        cardStartedAt.current = getVocabLearningTime();
      }
    } catch {
      setSaveError('Chưa lưu được kết quả vào máy. Hãy thử lại; thẻ này chưa được ghi nhận.');
    } finally {
      setSaving(false);
    }
  };

  const backHref = `/hoc/${lessonNumber}`;

  return (
    <main className="fixed inset-0 z-[60] bg-background">
      <div className="absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain">
        <div
          className={cn(
            'mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6 sm:pt-5',
            stage === 'select'
              ? 'pb-[calc(7rem+env(safe-area-inset-bottom))]'
              : 'pb-[calc(2rem+env(safe-area-inset-bottom))]',
          )}
        >
        <header className="flex min-h-12 items-center justify-between gap-3">
          {stage === 'study' ? (
            <Button
              type="button"
              variant="ghost"
              size="quiz"
              className="-ml-2 px-3 text-muted-foreground"
              onClick={() => setStage('select')}
              aria-label="Thoát lượt học, kết quả từng thẻ đã được lưu"
            >
              <ArrowLeft aria-hidden="true" />
              <span>Thoát</span>
            </Button>
          ) : (
            <Link
              href={backHref}
              className={cn(buttonVariants({ variant: 'ghost', size: 'quiz' }), '-ml-2 px-3 text-muted-foreground')}
            >
              <ArrowLeft aria-hidden="true" />
              <span>Về bài {lessonNumber}</span>
            </Link>
          )}
          <span className="truncate text-right text-sm text-muted-foreground">Bài {lessonNumber}</span>
        </header>

        {stage === 'select' && (
          <div className="w-full min-w-0 space-y-8 py-6">
            <section className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Học từ vựng bài {lessonNumber}</h1>
              <p className="text-sm text-muted-foreground">{lessonTitle}</p>
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                Nhìn từ tiếng Nhật, tự nhớ nghĩa rồi chọn mức độ nhớ. Mỗi lần đánh giá sẽ cập nhật lịch ôn FSRS.
              </p>
              {!verified && (
                <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
                  Nội dung bài này chưa được đối chiếu với bản in.
                </p>
              )}
            </section>

            <section className="space-y-4" aria-labelledby="vocab-selection-title">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 id="vocab-selection-title" className="text-lg font-semibold">Chọn từ muốn học</h2>
                  <p className="text-sm text-muted-foreground">
                    Đã chọn {selectedCount} / {availableEntries.length} từ
                  </p>
                </div>
                <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="quiz"
                    className="w-full min-w-0 px-2 text-sm"
                    onClick={() => setSelectedIds(new Set(availableEntries.map(({ targetId }) => targetId)))}
                  >
                    Chọn tất cả
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="quiz"
                    className="w-full min-w-0 px-2 text-sm"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Bỏ chọn
                  </Button>
                </div>
              </div>

              {storedReviewItems === undefined ? (
                <div className="space-y-2" aria-label="Đang tải tiến độ từ vựng">
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              ) : (
                <ul className="divide-y divide-border border-y border-border">
                  {entriesWithProgress.map(({ targetId, word, reviewItem }) => {
                    const hasMeaning = Boolean(word.meaning.vi.trim());
                    const selected = selectedIds.has(targetId);
                    const attempts = reviewItem ? reviewItem.correctCount + reviewItem.incorrectCount : 0;
                    const progressText = reviewItem
                      ? `${getAccuracy(reviewItem)}% nhớ đúng · ${reviewItem.incorrectCount} lần quên`
                      : 'Chưa có lượt luyện hoặc ôn';
                    return (
                      <li key={targetId}>
                        <button
                          type="button"
                          aria-pressed={selected}
                          disabled={!hasMeaning}
                          aria-label={`${selected ? 'Bỏ chọn' : 'Chọn'} ${stripFurigana(word.word)}, ${word.meaning.vi || 'chưa có bản dịch'}`}
                          onClick={() => toggleWord(targetId)}
                          className={cn(
                            'flex min-h-[76px] w-full items-center gap-3 px-2 py-3 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
                            selected && 'bg-accent/60',
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              'flex size-6 shrink-0 items-center justify-center rounded-md border',
                              selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card',
                            )}
                          >
                            {selected && <Check className="size-4" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="jp jp-vocab block font-medium"><Furigana text={word.word} /></span>
                            <span className="block text-sm text-foreground/90">
                              {hasMeaning ? word.meaning.vi : 'Chưa có bản dịch tiếng Việt'}
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {attempts > 0 ? `${progressText} · ôn ${formatDate(reviewItem!.dueAt)}` : progressText}
                            </span>
                          </span>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="space-y-4 border-t border-border pt-6" aria-labelledby="memory-title">
              <div className="space-y-1">
                <h2 id="memory-title" className="text-lg font-semibold">Theo dõi khả năng ghi nhớ</h2>
                <p className="text-sm text-muted-foreground">
                  Từ được xếp theo kết quả luyện, tự đánh giá và độ ổn định FSRS.
                </p>
              </div>
              <MemoryRankings entries={entriesWithProgress} />
            </section>
          </div>
        )}

        {stage === 'study' && activeWord && (
          <div className="flex flex-1 flex-col py-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Tự nhớ nghĩa của từ</span>
                <span className="tabular-nums">{currentIndex + 1} / {sessionWords.length}</span>
              </div>
              <progress
                className="h-1.5 w-full overflow-hidden rounded-full accent-primary"
                value={currentIndex + (revealed ? 1 : 0)}
                max={sessionWords.length}
                aria-label={`Tiến độ học từ ${currentIndex + 1} trên ${sessionWords.length}`}
              />
            </div>

            <section
              ref={studyContentRef}
              tabIndex={-1}
              className="flex flex-1 flex-col items-center justify-center gap-5 py-6 text-center"
              aria-live="polite"
            >
              <article className="w-full max-w-xl space-y-5 rounded-xl border border-border bg-card p-5 text-left sm:p-7">
                <div className="space-y-3 text-center">
                  <p className="text-sm text-muted-foreground">Bài {lessonNumber} · Từ {currentIndex + 1}</p>
                  <div className="jp jp-quiz text-3xl sm:text-4xl">
                    <Furigana text={activeWord.word.word} />
                  </div>
                </div>

                {revealed ? (
                  <div className="space-y-5 border-t border-border pt-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <h2 className="text-sm font-medium text-muted-foreground">Ý nghĩa</h2>
                        <p className="text-xl font-semibold leading-relaxed text-foreground">
                          {activeWord.word.meaning.vi}
                        </p>
                      </div>
                      <SpeakButton
                        text={activeWord.word.kana}
                        label={stripFurigana(activeWord.word.word)}
                        visibleLabel="Nghe từ"
                      />
                    </div>

                    <div className="space-y-3 border-t border-border pt-5">
                      <h2 className="text-sm font-semibold">Câu ví dụ trong bài</h2>
                      {activeWord.example ? (
                        <div className="space-y-2">
                          <Furigana
                            text={activeWord.example.jp}
                            className="jp jp-example block text-base font-medium sm:text-lg"
                          />
                          {activeWord.example.translation.vi.trim() && (
                            <div className="flex items-end justify-between gap-3">
                              <p className="min-w-0 flex-1 text-sm leading-relaxed text-muted-foreground">
                                {activeWord.example.translation.vi}
                              </p>
                              <SpeakButton
                                text={stripFurigana(activeWord.example.jp)}
                                label="câu ví dụ"
                                visibleLabel="Nghe câu"
                              />
                            </div>
                          )}
                          {!activeWord.example.translation.vi.trim() && (
                            <SpeakButton
                              text={stripFurigana(activeWord.example.jp)}
                              label="câu ví dụ"
                              visibleLabel="Nghe câu"
                            />
                          )}
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          Bài này chưa có câu ví dụ khớp với từ vựng này.
                        </p>
                      )}
                    </div>

                    {activeReviewItem && (
                      <p className="border-t border-border pt-4 text-sm text-muted-foreground">
                        Trước đây: {getAccuracy(activeReviewItem)}% nhớ đúng · {activeReviewItem.incorrectCount} lần quên
                      </p>
                    )}

                    <section className="space-y-3 border-t border-border pt-5" aria-labelledby="rating-title">
                      <div className="space-y-1 text-center">
                        <h2 id="rating-title" className="text-base font-semibold">Bạn nhớ từ này thế nào?</h2>
                        <p className="text-xs text-muted-foreground">Chọn mức gần nhất để đặt lịch ôn tiếp theo.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {ratingPreviews.map(({ grade, label, hint, icon: Icon, statusClassName, className, interval }) => (
                          <Button
                            key={grade}
                            type="button"
                            variant="outline"
                            size="quiz"
                            disabled={saving}
                            onClick={() => rateCurrentWord(grade)}
                            className={cn('h-auto min-h-[76px] w-full justify-start gap-3 whitespace-normal rounded-xl border px-3 py-2 text-left', className)}
                          >
                            <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', statusClassName, 'bg-background/70')}>
                              <Icon aria-hidden="true" className="size-4" />
                            </span>
                            <span className="flex min-w-0 flex-col items-start leading-tight">
                              <span className="font-semibold text-foreground">{label}</span>
                              <span className="mt-1 text-[11px] font-normal text-muted-foreground">{hint}</span>
                              <span className="mt-1 text-xs font-medium tabular-nums text-foreground">{interval}</span>
                            </span>
                          </Button>
                        ))}
                      </div>
                      {saving && <p role="status" className="text-center text-sm text-muted-foreground">Đang lưu kết quả…</p>}
                    </section>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 border-t border-border pt-5 text-center">
                    <div className="space-y-2 text-muted-foreground">
                      <CircleHelp className="mx-auto size-6" aria-hidden="true" />
                      <p className="text-sm">Thử nhớ nghĩa trước khi lật thẻ.</p>
                    </div>
                    <SpeakButton
                      text={activeWord.word.kana}
                      label={stripFurigana(activeWord.word.word)}
                      visibleLabel="Nghe từ"
                    />
                    <Button type="button" size="quiz" className="w-full" onClick={() => setRevealed(true)}>
                      Lật thẻ xem đáp án
                      <ChevronRight aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </article>
            </section>

            {saveError && <p role="alert" className="mx-auto w-full max-w-xl text-sm text-destructive">{saveError}</p>}
          </div>
        )}

        {stage === 'complete' && (
          <section className="flex flex-1 flex-col justify-center gap-8 py-8">
            <div className="space-y-3 text-center">
              <CheckCheck className="mx-auto size-10 text-success" aria-hidden="true" />
              <h1 className="text-2xl font-semibold">Đã học xong {sessionWords.length} từ</h1>
              <p className="text-sm text-muted-foreground">Kết quả từng từ đã lưu trên thiết bị và đưa vào lịch ôn FSRS.</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {RATING_OPTIONS.map(({ grade, label, icon: Icon, statusClassName }) => (
                <div key={grade} className="space-y-1 rounded-xl border border-border p-4 text-center">
                  <dt className={cn('flex items-center justify-center gap-1 text-xs', statusClassName)}>
                    <Icon className="size-4" aria-hidden="true" />{label}
                  </dt>
                  <dd className="text-2xl font-semibold tabular-nums">{ratingCounts[ratingKey(grade)]}</dd>
                </div>
              ))}
            </dl>
            <div className="space-y-2">
              <Button type="button" size="quiz" className="w-full" onClick={() => setStage('select')}>
                Học thêm từ trong bài
              </Button>
              <Link
                href={backHref}
                className={cn(buttonVariants({ variant: 'outline', size: 'quiz' }), 'w-full')}
              >
                Về nội dung bài {lessonNumber}
              </Link>
            </div>
          </section>
        )}
        </div>
      </div>
      {stage === 'select' && (
        <footer className="absolute inset-x-0 bottom-0 z-10 border-t border-border bg-background px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-6">
          <div className="mx-auto w-full max-w-3xl sm:flex sm:justify-end">
            <Button
              type="button"
              size="quiz"
              className="w-full min-w-0 sm:w-auto sm:min-w-48"
              disabled={selectedCount === 0 || storedReviewItems === undefined}
              onClick={startSession}
            >
              {selectedCount > 0 ? `Học ${selectedCount} từ` : 'Chọn ít nhất 1 từ'}
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </footer>
      )}
    </main>
  );
}
