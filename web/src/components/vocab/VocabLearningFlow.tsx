'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Undo2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { LazyMotion, MotionConfig, animate, domMax, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { Button, buttonVariants } from '@/components/ui/button';
import { db } from '@/lib/db';
import { applyReview, Rating, type Grade } from '@/lib/fsrs';
import { getVocabLearningTime, getVocabTargetId, saveVocabRecall, undoVocabRecall, type VocabRecallRecord } from '@/lib/vocab-learning';
import { type RatingCounts, parseVocabDraft, readVocabDraftRaw, subscribeVocabDraft, writeVocabDraft } from '@/lib/vocab-draft';
import { cn } from '@/lib/utils';
import type { ExampleSentence, VocabWord } from '@/types';
import { VocabCard } from './VocabCard';
import { VocabComplete } from './VocabComplete';
import { VocabRatingButtons, VocabRatingHelp } from './VocabRatingButtons';
import { VocabSelectStep } from './VocabSelectStep';
import { RATING_OPTIONS, findExampleForWord, formatInterval, ratingKey, type VocabEntry } from './vocab-shared';

interface VocabLearningFlowProps {
  lessonNumber: number;
  lessonTitle: string;
  words: VocabWord[];
  examples: ExampleSentence[];
}

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
  // true = đang xem mặt sau (đáp án); chạm thẻ lật qua lại, chấm điểm chỉ ở mặt sau.
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
  const ratingIntervals = useMemo(() => {
    const intervals = new Map<Grade, string>();
    if (!activeWord || !revealed) return intervals;
    const now = new Date();
    for (const { grade } of RATING_OPTIONS) {
      intervals.set(grade, formatInterval(applyReview(activeReviewItem?.fsrsCard, grade, now).dueAt, now));
    }
    return intervals;
  }, [activeReviewItem?.fsrsCard, activeWord, revealed]);

  const presets = [
    ...QUICK_PICK_SIZES.filter((size) => size < availableEntries.length).map((size) => ({
      label: `${size} từ`,
      ids: pickFirst(size),
    })),
    { label: 'Tất cả', ids: new Set(availableEntries.map(({ targetId }) => targetId)) },
    { label: 'Bỏ chọn', ids: new Set<string>() },
  ];

  const toggleWord = (targetId: string) => {
    const next = new Set(selectedIds);
    if (next.has(targetId)) next.delete(targetId);
    else next.add(targetId);
    setPickedIds(next);
  };

  const beginStudy = (chosen: VocabEntry[], startIndex: number, counts: RatingCounts = EMPTY_RATING_COUNTS) => {
    setSessionWords(chosen.map(({ targetId, word, example }) => ({ targetId, word, example })));
    setCurrentIndex(startIndex);
    setRevealed(false);
    setRatingCounts({ ...counts });
    setSaveError(null);
    setLastRecall(null);
    setUndoError(null);
    cardStartedAt.current = getVocabLearningTime();
    writeVocabDraft(lessonNumber, { targetIds: chosen.map(({ targetId }) => targetId), currentIndex: startIndex, counts });
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
    beginStudy(draft.targetIds.map((id) => byId.get(id)!), draft.currentIndex, draft.counts);
  };

  // Lối "Tiếp tục" từ Bảng tin (?tiep-tuc=1) vào thẳng thẻ đang dở, không dừng ở màn chọn từ.
  // Đọc URL ở client thay vì useSearchParams để trang vẫn prerender tĩnh.
  const autoResumeDone = useRef(false);
  useEffect(() => {
    if (autoResumeDone.current || stage !== 'select' || !draft || storedReviewItems === undefined) return;
    if (new URLSearchParams(window.location.search).get('tiep-tuc') !== '1') return;
    autoResumeDone.current = true;
    window.history.replaceState(null, '', window.location.pathname);
    // Đồng bộ một lần với URL sau khi Dexie tải xong (ref chặn lặp): chỉ thêm đúng một lần render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resumeDraft();
  });

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
      const counts = { ...ratingCounts, [key]: Math.max(0, ratingCounts[key] - 1) };
      setRatingCounts(counts);
      setCurrentIndex(lastRecall.index);
      setRevealed(true);
      setStage('study');
      writeVocabDraft(lessonNumber, {
        targetIds: sessionWords.map(({ targetId }) => targetId),
        currentIndex: lastRecall.index,
        counts,
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
      const counts = { ...ratingCounts, [ratingKey(grade)]: ratingCounts[ratingKey(grade)] + 1 };
      setRatingCounts(counts);
      if (currentIndex + 1 >= sessionWords.length) {
        writeVocabDraft(lessonNumber, null);
        setStage('complete');
      } else {
        writeVocabDraft(lessonNumber, {
          targetIds: sessionWords.map(({ targetId }) => targetId),
          currentIndex: currentIndex + 1,
          counts,
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
    <main className="fixed inset-0 z-40 bg-background">
      <div className="absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain">
        <div
          className={cn(
            'mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6 sm:pt-5',
            stage === 'select'
              ? 'pb-[calc(7rem+env(safe-area-inset-bottom))]'
              : stage === 'study' && revealed
                ? 'pb-[calc(11.5rem+env(safe-area-inset-bottom))]'
                : 'pb-[calc(2rem+env(safe-area-inset-bottom))]',
          )}
        >
          <header className="flex min-h-12 items-center justify-between gap-3">
            {stage === 'study' ? (
              <Button
                type="button"
                variant="outline"
                size="quiz"
                className="px-4"
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
                <ChevronLeft aria-hidden="true" />
                <span>Về bài {lessonNumber}</span>
              </Link>
            )}
            <span className="truncate text-right text-sm font-medium text-muted-foreground">Bài {lessonNumber}</span>
          </header>

          {stage === 'select' && (
            <VocabSelectStep
              lessonNumber={lessonNumber}
              lessonTitle={lessonTitle}
              entries={entriesWithProgress}
              availableCount={availableEntries.length}
              selectedIds={selectedIds}
              selectedCount={selectedCount}
              presets={presets}
              loading={storedReviewItems === undefined}
              draft={draft}
              onApplyPreset={setPickedIds}
              onToggle={toggleWord}
              onResumeDraft={resumeDraft}
              onDiscardDraft={() => writeVocabDraft(lessonNumber, null)}
            />
          )}

          {stage === 'study' && activeWord && (
            <div className="flex flex-1 flex-col py-4">
              <div className="space-y-2">
                <div className="flex min-h-11 items-center justify-between text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Từ {currentIndex + 1} / {sessionWords.length}</span>
                  {lastRecall && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="quiz"
                      className="-mr-2 px-3 text-sm text-primary"
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
                className="flex flex-1 flex-col items-center justify-center gap-4 py-5 text-center outline-none"
                aria-live="polite"
              >
                <LazyMotion features={domMax} strict>
                  <MotionConfig reducedMotion="user">
                    <VocabCard
                      key={activeWord.targetId}
                      entry={activeWord}
                      revealed={revealed}
                      canSwipe={revealed && !saving}
                      dragX={dragX}
                      dragRotate={dragRotate}
                      onFlip={() => setRevealed((value) => !value)}
                      onSwipeEnd={handleSwipeEnd}
                    />
                  </MotionConfig>
                </LazyMotion>

                {revealed && <VocabRatingHelp />}
              </section>

              {saveError && <p role="alert" className="mx-auto w-full max-w-xl text-sm text-destructive">{saveError}</p>}
            </div>
          )}

          {stage === 'complete' && (
            <VocabComplete
              wordCount={sessionWords.length}
              counts={ratingCounts}
              lessonNumber={lessonNumber}
              canUndo={Boolean(lastRecall)}
              saving={saving}
              undoError={undoError}
              onUndo={undoLastRecall}
              onMore={() => setStage('select')}
            />
          )}
        </div>
      </div>
      {stage === 'study' && activeWord && revealed && (
        <footer className="absolute inset-x-0 bottom-0 z-10 border-t border-border bg-background px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-6">
          <div className="mx-auto w-full max-w-2xl">
            <VocabRatingButtons intervals={ratingIntervals} saving={saving} onRate={rateCurrentWord} />
          </div>
        </footer>
      )}
      {stage === 'select' && (
        <footer className="absolute inset-x-0 bottom-0 z-10 border-t border-border bg-background px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-6">
          <div className="mx-auto w-full max-w-2xl">
            <Button
              type="button"
              size="quiz"
              className="w-full min-w-0"
              disabled={selectedCount === 0 || storedReviewItems === undefined}
              onClick={startSession}
            >
              {selectedCount > 0 ? `Học ${selectedCount} từ` : 'Chọn ít nhất 1 từ'}
              {selectedCount > 0 && <ChevronRight aria-hidden="true" />}
            </Button>
          </div>
        </footer>
      )}
    </main>
  );
}
