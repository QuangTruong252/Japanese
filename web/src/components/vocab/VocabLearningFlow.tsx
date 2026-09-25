'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  RotateCcw,
  Sparkles,
  Undo2,
  Turtle,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { LazyMotion, MotionConfig, animate, domMax, m, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { Furigana } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/db';
import { applyReview, Rating, type Grade } from '@/lib/fsrs';
import { stripFurigana, toKanaSentence } from '@/lib/japanese';
import { getVocabLearningTime, getVocabTargetId, saveVocabRecall, undoVocabRecall, type VocabRecallRecord } from '@/lib/vocab-learning';
import { parseVocabDraft, readVocabDraftRaw, subscribeVocabDraft, writeVocabDraft } from '@/lib/vocab-draft';
import { cn } from '@/lib/utils';
import type { ExampleSentence, ReviewItem, VocabWord } from '@/types';

interface VocabLearningFlowProps {
  lessonNumber: number;
  lessonTitle: string;
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
    hint: 'Không nhớ ra nghĩa, hoặc nhớ sai.',
    icon: RotateCcw,
    statusClassName: 'text-destructive',
    className: 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10',
  },
  {
    grade: Rating.Hard,
    label: 'Khó nhớ',
    hint: 'Chỉ nhớ một nửa, hoặc phải nghĩ rất lâu.',
    icon: Turtle,
    statusClassName: 'text-warning',
    className: 'border-warning/30 bg-warning/5 hover:bg-warning/10',
  },
  {
    grade: Rating.Good,
    label: 'Nhớ được',
    hint: 'Nhớ đúng sau một chút suy nghĩ.',
    icon: Check,
    statusClassName: 'text-success',
    className: 'border-success/30 bg-success/5 hover:bg-success/10',
  },
  {
    grade: Rating.Easy,
    label: 'Dễ nhớ',
    hint: 'Nhớ ngay, không phải nghĩ.',
    icon: Sparkles,
    statusClassName: 'text-primary',
    className: 'border-primary/30 bg-accent/40 hover:bg-accent',
  },
];

type RatingCounts = Record<'again' | 'hard' | 'good' | 'easy', number>;

// Vuốt thẻ đã lật: phải = Nhớ được, trái = Quên mất. Là lối tắt, bốn nút vẫn giữ nguyên.
const SWIPE_DISTANCE = 100;
const SWIPE_VELOCITY = 500;

const EMPTY_RATING_COUNTS: RatingCounts = { again: 0, hard: 0, good: 0, easy: 0 };
const QUICK_PICK_SIZES = [5, 10] as const;
const DEFAULT_PICK_SIZE = 10;

interface LastRecall {
  record: VocabRecallRecord;
  index: number;
  grade: Grade;
}

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
        description="Ưu tiên tỷ lệ nhớ đúng, sau đó là mức độ nhớ lâu."
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
      example: word.example ?? findExampleForWord(word, examples),
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
  // null = chưa tự chọn: mặc định một lượt ngắn, ưu tiên từ chưa vào lịch ôn.
  const [pickedIds, setPickedIds] = useState<Set<string> | null>(null);
  const pickFirst = (size: number) => {
    const fresh = availableEntries.filter(({ reviewItem }) => !reviewItem);
    const pool = fresh.length >= Math.min(size, availableEntries.length) ? fresh : availableEntries;
    return new Set(pool.slice(0, size).map(({ targetId }) => targetId));
  };
  const selectedIds = pickedIds ?? pickFirst(DEFAULT_PICK_SIZE);
  const [stage, setStage] = useState<'select' | 'study' | 'complete'>('select');
  const [sessionWords, setSessionWords] = useState<VocabEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [ratingCounts, setRatingCounts] = useState<RatingCounts>(EMPTY_RATING_COUNTS);
  const [lastRecall, setLastRecall] = useState<LastRecall | null>(null);
  const [undoError, setUndoError] = useState<string | null>(null);
  const draftRaw = useSyncExternalStore(
    subscribeVocabDraft,
    () => readVocabDraftRaw(lessonNumber),
    () => null,
  );
  const draft = useMemo(
    () => parseVocabDraft(draftRaw, new Set(availableEntries.map(({ targetId }) => targetId))),
    [availableEntries, draftRaw],
  );
  const cardStartedAt = useRef(0);
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-240, 240], [-6, 6]);
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
    const next = new Set(selectedIds);
    if (next.has(targetId)) next.delete(targetId);
    else next.add(targetId);
    setPickedIds(next);
  };

  const beginStudy = (chosen: VocabEntry[], startIndex: number) => {
    setSessionWords(chosen.map(({ targetId, word, example }) => ({ targetId, word, example })));
    setCurrentIndex(startIndex);
    setRevealed(false);
    setRatingCounts({ ...EMPTY_RATING_COUNTS });
    setSaveError(null);
    setLastRecall(null);
    setUndoError(null);
    cardStartedAt.current = getVocabLearningTime();
    writeVocabDraft(lessonNumber, { targetIds: chosen.map(({ targetId }) => targetId), currentIndex: startIndex });
    setStage('study');
  };

  const startSession = () => {
    const chosen = availableEntries.filter(({ targetId }) => selectedIds.has(targetId));
    if (chosen.length === 0 || storedReviewItems === undefined) return;
    beginStudy(chosen, 0);
  };

  const resumeDraft = () => {
    if (!draft || storedReviewItems === undefined) return;
    const byId = new Map(availableEntries.map((entry) => [entry.targetId, entry]));
    beginStudy(draft.targetIds.map((id) => byId.get(id)!), draft.currentIndex);
  };

  const undoLastRecall = async () => {
    if (!lastRecall || saving) return;
    setSaving(true);
    setUndoError(null);
    try {
      if (!(await undoVocabRecall(lastRecall.record))) {
        setUndoError('Không hoàn tác được vì từ này vừa được cập nhật ở lượt khác.');
        setLastRecall(null);
        return;
      }
      const key = ratingKey(lastRecall.grade);
      setRatingCounts((counts) => ({ ...counts, [key]: Math.max(0, counts[key] - 1) }));
      setCurrentIndex(lastRecall.index);
      setRevealed(true);
      setStage('study');
      writeVocabDraft(lessonNumber, {
        targetIds: sessionWords.map(({ targetId }) => targetId),
        currentIndex: lastRecall.index,
      });
      cardStartedAt.current = getVocabLearningTime();
      setLastRecall(null);
    } catch {
      setUndoError('Chưa hoàn tác được. Hãy thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const rateCurrentWord = async (grade: Grade): Promise<boolean> => {
    if (!activeWord || saving) return false;
    setSaving(true);
    setSaveError(null);
    try {
      const record = await saveVocabRecall({
        targetId: activeWord.targetId,
        lesson: lessonNumber,
        grade,
        elapsedMs: getVocabLearningTime() - cardStartedAt.current,
      });
      setLastRecall({ record, index: currentIndex, grade });
      setUndoError(null);
      setRatingCounts((counts) => ({ ...counts, [ratingKey(grade)]: counts[ratingKey(grade)] + 1 }));
      if (currentIndex + 1 >= sessionWords.length) {
        writeVocabDraft(lessonNumber, null);
        setStage('complete');
      } else {
        writeVocabDraft(lessonNumber, {
          targetIds: sessionWords.map(({ targetId }) => targetId),
          currentIndex: currentIndex + 1,
        });
        setCurrentIndex((index) => index + 1);
        setRevealed(false);
        cardStartedAt.current = getVocabLearningTime();
      }
      return true;
    } catch {
      setSaveError('Chưa lưu được kết quả vào máy. Hãy thử lại; thẻ này chưa được ghi nhận.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSwipeEnd = async (_: unknown, info: PanInfo) => {
    const dir = info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY ? 1
      : info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY ? -1 : 0;
    if (dir === 0 || saving) return; // dragSnapToOrigin đưa thẻ về chỗ
    await animate(dragX, dir * window.innerWidth, { duration: 0.2, ease: [0.22, 1, 0.36, 1] });
    if (!(await rateCurrentWord(dir > 0 ? Rating.Good : Rating.Again))) dragX.set(0); // lưu lỗi: thẻ cũ quay lại
  };

  // Thẻ mới về giữa trước khi vẽ, để thẻ cũ không nháy lại giữa màn hình.
  useLayoutEffect(() => {
    dragX.set(0);
  }, [currentIndex, dragX]);

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
                Nhìn từ tiếng Nhật, tự nhớ nghĩa rồi chọn mức độ nhớ. Mức bạn chọn quyết định khi nào app nhắc ôn lại từ đó.
              </p>
            </section>

            {draft && storedReviewItems !== undefined && (
              <section
                aria-label="Lượt học đang dở"
                className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-accent/40 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm">
                  Bạn đang học dở: thẻ {draft.currentIndex + 1} / {draft.targetIds.length}.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <Button type="button" size="quiz" className="px-4 text-sm" onClick={resumeDraft}>
                    Học tiếp
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="quiz"
                    className="px-4 text-sm"
                    onClick={() => writeVocabDraft(lessonNumber, null)}
                  >
                    Bỏ lượt dở
                  </Button>
                </div>
              </section>
            )}

            <section className="space-y-4" aria-labelledby="vocab-selection-title">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 id="vocab-selection-title" className="text-lg font-semibold">Chọn từ muốn học</h2>
                  <p className="text-sm text-muted-foreground">
                    Đã chọn {selectedCount} / {availableEntries.length} từ
                  </p>
                </div>
                <div className="flex w-full min-w-0 gap-2 sm:w-auto" role="group" aria-label="Chọn nhanh số từ">
                  {QUICK_PICK_SIZES.filter((size) => size < availableEntries.length).map((size) => (
                    <Button
                      key={size}
                      type="button"
                      variant="outline"
                      size="quiz"
                      className="min-w-0 flex-1 px-2 text-sm"
                      onClick={() => setPickedIds(pickFirst(size))}
                    >
                      {size} từ
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="quiz"
                    className="min-w-0 flex-1 px-2 text-sm"
                    onClick={() => setPickedIds(new Set(availableEntries.map(({ targetId }) => targetId)))}
                  >
                    Tất cả
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="quiz"
                    className="min-w-0 flex-1 px-2 text-sm"
                    onClick={() => setPickedIds(new Set())}
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
                          role="checkbox"
                          aria-checked={selected}
                          disabled={!hasMeaning}
                          aria-label={`${selected ? 'Bỏ chọn' : 'Chọn'} ${stripFurigana(word.word)}`}
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
                            <span className="jp jp-vocab block font-medium">
                              <Furigana text={word.word} />
                              {word.verbForms && (
                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                  (Masu: {stripFurigana(word.verbForms.masu)})
                                </span>
                              )}
                            </span>
                            {!hasMeaning && <span className="block text-sm text-muted-foreground">Chưa có bản dịch tiếng Việt</span>}
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {attempts > 0 ? `${progressText} · ôn ${formatDate(reviewItem!.dueAt)}` : progressText}
                            </span>
                          </span>
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
                  Từ được xếp theo kết quả luyện và tự đánh giá của bạn.
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
                <span>Bài {lessonNumber} · Từ {currentIndex + 1} / {sessionWords.length}</span>
                {lastRecall && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="quiz"
                    className="-mr-2 px-3 text-sm text-muted-foreground"
                    disabled={saving}
                    onClick={undoLastRecall}
                    aria-label={`Hoàn tác lần chấm ${RATING_OPTIONS.find((o) => o.grade === lastRecall.grade)?.label ?? ''} cho thẻ trước`}
                  >
                    <Undo2 aria-hidden="true" />
                    Hoàn tác
                  </Button>
                )}
              </div>
              {undoError && <p role="alert" className="text-sm text-destructive">{undoError}</p>}
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={sessionWords.length}
                aria-valuenow={currentIndex}
                aria-label={`Đã đánh giá ${currentIndex} trên ${sessionWords.length} từ`}
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full origin-left bg-primary transition-transform duration-250 ease-smooth-out"
                  style={{ transform: `scaleX(${currentIndex / Math.max(1, sessionWords.length)})` }}
                />
              </div>
            </div>

            <section
              ref={studyContentRef}
              tabIndex={-1}
              className="flex flex-1 flex-col items-center justify-center gap-3 py-5 text-center"
              aria-live="polite"
            >
              <LazyMotion features={domMax} strict>
              <MotionConfig reducedMotion="user">
              <m.article
                key={activeWord.targetId}
                drag={revealed && !saving ? 'x' : false}
                dragSnapToOrigin
                dragElastic={0.6}
                onDragEnd={handleSwipeEnd}
                style={{ x: dragX, rotate: dragRotate }}
                className="w-full max-w-xl text-left [perspective:1200px] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-250 motion-safe:ease-in-out"
              >
                <div className={cn(
                  'grid w-full [transform-style:preserve-3d] motion-safe:transition-transform motion-safe:duration-[250ms] motion-safe:ease-in-out',
                  revealed && '[transform:rotateY(180deg)]',
                )}>
                  <div
                    aria-hidden={revealed}
                    inert={revealed}
                    className="relative col-start-1 row-start-1 flex min-h-[24rem] flex-col rounded-xl border border-border bg-card [backface-visibility:hidden]"
                  >
                    <button
                      type="button"
                      aria-label={`Lật thẻ xem đáp án của ${stripFurigana(activeWord.word.word)}`}
                      onClick={() => setRevealed(true)}
                      className="absolute inset-0 z-10 cursor-pointer rounded-xl border-0 bg-transparent p-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                    <div className="absolute right-3 top-3 z-20">
                      <SpeakButton text={activeWord.word.kana} label={stripFurigana(activeWord.word.word)} />
                    </div>
                    <div className="pointer-events-none flex flex-1 flex-col items-center justify-center gap-1 px-8 py-16 text-center">
                      {activeWord.word.verbGroup && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 mb-2">
                          Động từ Nhóm {activeWord.word.verbGroup}
                        </span>
                      )}
                      <div className="jp jp-quiz text-4xl font-medium sm:text-5xl">
                        <Furigana text={stripFurigana(activeWord.word.word)} zoomable={false} />
                      </div>
                      <span className="jp jp-example text-sm text-muted-foreground">{activeWord.word.kana}</span>
                    </div>
                  </div>

                  <div
                    aria-hidden={!revealed}
                    inert={!revealed}
                    hidden={!revealed}
                    className={cn(
                      'relative col-start-1 row-start-1 min-h-[24rem] flex-col rounded-xl border border-border bg-card [backface-visibility:hidden] [transform:rotateY(180deg)]',
                      revealed ? 'flex' : 'hidden',
                    )}
                  >
                    <div className="absolute right-3 top-3 z-20">
                      <SpeakButton text={activeWord.word.kana} label={stripFurigana(activeWord.word.word)} />
                    </div>
                    <div className="flex flex-1 flex-col px-5 pb-5 pt-16 sm:px-7 sm:pb-7">
                      <div className="flex flex-1 items-center justify-center py-6 text-center">
                        <p className="text-2xl font-semibold leading-relaxed text-foreground sm:text-3xl">
                          {activeWord.word.meaning.vi}
                        </p>
                      </div>

                      {activeWord.word.verbForms && (
                        <div className="rounded-xl border border-border/70 bg-muted/40 p-3 mb-3 space-y-2">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                            Các thể chia cơ bản
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-muted-foreground font-medium">Masu (Lịch sự)</span>
                              <span className="font-semibold text-foreground"><Furigana text={activeWord.word.verbForms.masu} /></span>
                            </div>
                            {activeWord.word.verbForms.te && (
                              <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground font-medium">Te (Nối / Đang làm)</span>
                                <span className="font-semibold text-foreground"><Furigana text={activeWord.word.verbForms.te} /></span>
                              </div>
                            )}
                            {activeWord.word.verbForms.nai && (
                              <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground font-medium">Nai (Phủ định)</span>
                                <span className="font-semibold text-foreground"><Furigana text={activeWord.word.verbForms.nai} /></span>
                              </div>
                            )}
                            {activeWord.word.verbForms.ta && (
                              <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground font-medium">Ta (Quá khứ)</span>
                                <span className="font-semibold text-foreground"><Furigana text={activeWord.word.verbForms.ta} /></span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <section className="space-y-3 border-t border-border pt-5" aria-labelledby="example-title">
                        <div className="flex items-center gap-1.5">
                          <h2 id="example-title" className="text-sm font-semibold">Câu ví dụ</h2>
                          {activeWord.example && (
                            <SpeakButton
                              text={activeWord.example.kana ?? toKanaSentence(activeWord.example.jp)}
                              label="câu ví dụ"
                              iconClassName="size-4"
                            />
                          )}
                        </div>
                        {activeWord.example ? (
                          <div className="space-y-2">
                            <Furigana
                              text={activeWord.example.jp}
                              className="jp jp-example block text-base font-medium sm:text-lg"
                              zoomable={false}
                            />
                            {activeWord.example.kana && activeWord.example.kana !== stripFurigana(activeWord.example.jp) && (
                              <p className="jp jp-example text-sm text-muted-foreground">{activeWord.example.kana}</p>
                            )}
                            {activeWord.example.translation.vi.trim() && (
                              <p className="text-sm leading-relaxed text-muted-foreground">
                                {activeWord.example.translation.vi}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            Bài này chưa có câu ví dụ khớp với từ vựng này.
                          </p>
                        )}
                      </section>
                    </div>
                  </div>
                </div>
              </m.article>
              </MotionConfig>
              </LazyMotion>

              {revealed ? (
                <section className="w-full max-w-xl" aria-label="Mức độ ghi nhớ">
                  <div className="grid grid-cols-4 gap-2">
                    {ratingPreviews.map(({ grade, label, icon: Icon, statusClassName, className, interval }) => (
                      <div key={grade} className="flex min-w-0 flex-col items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="quiz"
                          aria-label={`${label}, ôn lại ${interval}`}
                          title={`Ôn lại ${interval}`}
                          disabled={saving}
                          onClick={() => rateCurrentWord(grade)}
                          className={cn('h-14 w-full min-w-12 rounded-xl px-0', className)}
                        >
                          <Icon aria-hidden="true" className="size-6" />
                        </Button>
                        <span className={cn('text-center text-xs leading-tight sm:text-sm', statusClassName)}>{label}</span>
                        <span className="text-center text-[11px] leading-tight text-muted-foreground">
                          Ôn lại {interval}
                        </span>
                      </div>
                    ))}
                  </div>
                  <details className="mt-3 rounded-xl border border-border px-3 text-left text-sm">
                    <summary className="flex min-h-11 cursor-pointer items-center text-muted-foreground">
                      Nên chọn mức nào?
                    </summary>
                    <dl className="space-y-1.5 pb-3">
                      {RATING_OPTIONS.map(({ grade, label, hint, statusClassName }) => (
                        <div key={grade} className="flex gap-2">
                          <dt className={cn('w-20 shrink-0 font-medium', statusClassName)}>{label}</dt>
                          <dd className="text-muted-foreground">{hint}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                  {saving ? (
                    <p role="status" className="mt-2 text-center text-sm text-muted-foreground">Đang lưu kết quả…</p>
                  ) : (
                    <p className="mt-2 text-center text-xs text-muted-foreground">Vuốt thẻ sang phải: Nhớ được · sang trái: Quên mất</p>
                  )}
                </section>
              ) : (
                <p className="text-sm text-muted-foreground">Chạm thẻ để xem đáp án.</p>
              )}
            </section>

            {saveError && <p role="alert" className="mx-auto w-full max-w-xl text-sm text-destructive">{saveError}</p>}
          </div>
        )}

        {stage === 'complete' && (
          <section className="flex flex-1 flex-col justify-center gap-8 py-8">
            <div className="space-y-3 text-center">
              <CheckCheck className="mx-auto size-10 text-success" aria-hidden="true" />
              <h1 className="text-2xl font-semibold">Đã học xong {sessionWords.length} từ</h1>
              <p className="text-sm text-muted-foreground">Kết quả từng từ đã lưu trên thiết bị và đưa vào lịch ôn.</p>
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
              {lastRecall && (
                <Button
                  type="button"
                  variant="ghost"
                  size="quiz"
                  className="w-full text-muted-foreground"
                  disabled={saving}
                  onClick={undoLastRecall}
                >
                  <Undo2 aria-hidden="true" />
                  Hoàn tác thẻ cuối
                </Button>
              )}
              {undoError && <p role="alert" className="text-center text-sm text-destructive">{undoError}</p>}
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
