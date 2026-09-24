'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { collectTargetIds, planReviewBatch, withDeclaredLessons } from '@/lib/review-queue';
import { DEFAULT_SETTINGS, loadSettings } from '@/lib/settings';
import { startOfLocalDay } from '@/lib/stats';
import { useDueClock } from '@/lib/use-due-clock';
import { useQuestionPool } from '@/lib/use-question-pool';
import type { ExerciseType, PracticeConfig, QuestionItem, ReviewItem } from '@/types';

/**
 * Phiên ôn không cho người học chọn dạng bài: lấy hết. `filterExercises` tự loại `matching`
 * ở `mode: 'due'` vì một lượt ghép cặp gom nhiều mục tiêu khác hạn ôn (SPEC-01 §4.2).
 */
const ALL_EXERCISE_TYPES: ExerciseType[] = ['mc', 'matching', 'cloze', 'reorder', 'listening'];

export interface DueQueue {
  loading: boolean;
  /** Mốc "bây giờ" dùng chung cho mọi phép so hạn ôn của trang. */
  now: Date;
  /** Mục đến hạn của lô này, quá hạn lâu nhất xếp trước (SPEC-05 §2.1a). */
  dueItems: ReviewItem[];
  /** Mục đến hạn còn lại sau lô này — ôn ở lô sau. */
  remainingDue: number;
  /** Mục tiêu mới của lô: chỉ lấp chỗ trống, đã cắt theo hạn mức còn lại. */
  newTargetIds: string[];
  /** Tập mục tiêu của phiên ôn = đến hạn + mới, tối đa một lô. */
  sessionTargetIds: Set<string>;
  reviewBatchSize: number;
  newLoadedToday: number;
  dailyNewLimit: number;
  limitReached: boolean;
  dueTomorrowCount: number;
  hasAnyReviewItem: boolean;
  learnedLessons: number[];
  questions: QuestionItem[];
  config: PracticeConfig;
}

/**
 * Hàng đợi ôn tập hôm nay. Cả `/on-tap` lẫn `/on-tap/phien` dùng chung hook này để hai màn
 * không bao giờ tính ra hai con số khác nhau.
 */
export function useDueQueue(): DueQueue {
  const now = useDueClock();

  const snapshot = useLiveQuery(async () => {
    // loadSettings đọc localStorage. Callback của useLiveQuery chỉ chạy phía client nên
    // không lệch hydrate, và không phải gọi setState trong effect.
    const { dailyNewLimit, reviewBatchSize, learnedThroughLesson } = loadSettings();

    const startToday = startOfLocalDay(now);
    const startTomorrow = new Date(startToday);
    startTomorrow.setDate(startTomorrow.getDate() + 1);
    const startDayAfter = new Date(startToday);
    startDayAfter.setDate(startDayAfter.getDate() + 2);
    // createdAt là chuỗi ISO: so chuỗi với chuỗi. So chuỗi với Date luôn ra false.
    const startTodayIso = startToday.toISOString();

    // ponytail: đọc cả bảng một lần rồi lọc trong JS. Cần trường `lesson` (không nằm trong
    // index nào) cùng bốn con số khác; một lần đọc rẻ hơn bốn truy vấn. Bảng bị chặn trần bởi
    // dailyNewLimit (mặc định 20 mục/ngày). Quay lại truy vấn index `dueAt` nếu vượt ~10k dòng.
    const all = await db.reviewItems.toArray();

    return {
      dailyNewLimit,
      reviewBatchSize,
      allDueItems: all
        .filter((item) => item.dueAt.getTime() <= now.getTime())
        .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime()),
      existingTargetIds: new Set(all.map((item) => item.targetId)),
      newLoadedToday: all.filter((item) => item.createdAt >= startTodayIso).length,
      dueTomorrowCount: all.filter(
        (item) => item.dueAt >= startTomorrow && item.dueAt < startDayAfter,
      ).length,
      hasAnyReviewItem: all.length > 0,
      learnedLessons: withDeclaredLessons(
        [...new Set(all.map((item) => item.lesson))].filter((lesson) => lesson > 0),
        learnedThroughLesson,
      ),
    };
  }, [now]);

  const learnedLessons = useMemo(() => snapshot?.learnedLessons ?? [], [snapshot]);
  const { questions, loading: poolLoading } = useQuestionPool(learnedLessons);

  const plan = useMemo(() => {
    if (!snapshot) return { batchDue: [] as ReviewItem[], newTargetIds: [] as string[], remainingDue: 0 };
    return planReviewBatch(
      snapshot.allDueItems,
      collectTargetIds(questions),
      snapshot.existingTargetIds,
      Math.max(0, snapshot.dailyNewLimit - snapshot.newLoadedToday),
      snapshot.reviewBatchSize,
    );
  }, [snapshot, questions]);
  const { batchDue: dueItems, newTargetIds, remainingDue } = plan;

  const sessionTargetIds = useMemo(
    () => new Set([...dueItems.map((item) => item.targetId), ...newTargetIds]),
    [dueItems, newTargetIds],
  );

  const config = useMemo<PracticeConfig>(
    () => ({
      mode: 'due',
      lessons: learnedLessons,
      // Spec §2.1 viết "số bài lớn nhất trong các mục đang đến hạn". Lấy đúng chữ đó thì câu
      // của các mục MỚI thuộc bài cao hơn sẽ bị bước 2 của filterExercises loại sạch
      // (auxiliaryLessons > maxLearnedLesson). Dùng bài lớn nhất ĐÃ vào lịch ôn — mọi mục
      // trong phiên đều thuộc các bài người học đã gặp.
      maxLearnedLesson: learnedLessons.length > 0 ? Math.max(...learnedLessons) : 0,
      selectedTypes: ALL_EXERCISE_TYPES,
      questionCount: sessionTargetIds.size,
    }),
    [learnedLessons, sessionTargetIds],
  );

  return {
    loading: snapshot === undefined || poolLoading,
    now,
    dueItems,
    remainingDue,
    newTargetIds,
    sessionTargetIds,
    reviewBatchSize: snapshot?.reviewBatchSize ?? DEFAULT_SETTINGS.reviewBatchSize,
    newLoadedToday: snapshot?.newLoadedToday ?? 0,
    dailyNewLimit: snapshot?.dailyNewLimit ?? DEFAULT_SETTINGS.dailyNewLimit,
    limitReached: snapshot ? snapshot.newLoadedToday >= snapshot.dailyNewLimit : false,
    dueTomorrowCount: snapshot?.dueTomorrowCount ?? 0,
    hasAnyReviewItem: snapshot?.hasAnyReviewItem ?? false,
    learnedLessons,
    questions,
    config,
  };
}
