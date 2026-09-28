import type { PracticeConfig, QuestionItem, ReviewItem, TargetType } from '../types/index.ts';
import { buildSession, targetTypeFromId } from './practice.ts';
import { startOfLocalDay } from './stats.ts';

/** Nội dung hiển thị của một mục tiêu ôn tập. */
export interface TargetLabel {
  /** Chuỗi tiếng Nhật, có thể mang notation furigana thô `私[わたし]は` — render qua <Furigana>. */
  jp: string;
  /** Nghĩa tiếng Việt; rỗng khi dữ liệu không có. */
  vi: string;
}

const DAY_MS = 86_400_000;

/**
 * Số bài suy từ targetId (`vocab-03-07` → 3). `particle-wo` dùng chung cho mọi bài nên
 * không mang số bài: trả 0.
 */
export function lessonFromTargetId(targetId: string): number {
  const match = /^[a-z]+-(\d{2})-\d{2}$/.exec(targetId);
  return match ? Number(match[1]) : 0;
}

/**
 * Mọi targetId mà bể câu hỏi có thể hỏi tới, kể cả targetId nằm trong `pairs` của dạng
 * matching (mỗi cặp có lịch ôn riêng — SPEC-01 §4.2). Xếp bài nhỏ trước: người mới học
 * không bị nạp mục của bài 20 trước bài 2.
 */
export function collectTargetIds(questions: QuestionItem[]): string[] {
  const ids = new Set<string>();
  for (const question of questions) {
    ids.add(question.targetId);
    for (const pair of question.pairs ?? []) {
      ids.add(pair.targetId);
    }
  }
  return [...ids].sort(
    (a, b) => lessonFromTargetId(a) - lessonFromTargetId(b) || (a < b ? -1 : a > b ? 1 : 0),
  );
}

/**
 * Mục tiêu chưa từng vào lịch ôn, cắt theo hạn mức mục mới CÒN LẠI trong ngày (SPEC-05 §2.1).
 * `remaining <= 0` nghĩa là đã đủ hạn mức: trả rỗng, không nạp thêm.
 */
export function selectNewTargetIds(
  poolTargetIds: string[],
  existingTargetIds: Set<string>,
  remaining: number,
): string[] {
  if (remaining <= 0) return [];
  const fresh: string[] = [];
  for (const id of poolTargetIds) {
    if (existingTargetIds.has(id)) continue;
    fresh.push(id);
    if (fresh.length >= remaining) break;
  }
  return fresh;
}

/**
 * Chia hàng đợi thành một lô (SPEC-05 §2.1a). Mục đến hạn (đã xếp quá hạn lâu nhất trước) lấp
 * lô trước; mục mới chỉ lấp chỗ còn trống — nên khi tồn đọng ≥ một lô thì không nạp mục mới.
 */
export function planReviewBatch<T>(
  dueItems: T[],
  poolTargetIds: string[],
  existingTargetIds: Set<string>,
  remainingNewQuota: number,
  batchSize: number,
): { batchDue: T[]; newTargetIds: string[]; remainingDue: number } {
  const batchDue = dueItems.slice(0, batchSize);
  const room = Math.min(remainingNewQuota, batchSize - batchDue.length);
  return {
    batchDue,
    newTargetIds: selectNewTargetIds(poolTargetIds, existingTargetIds, room),
    remainingDue: dueItems.length - batchDue.length,
  };
}

export interface NextBatchPlanResult {
  /** Các mục đến hạn trong lô này */
  batchDue: ReviewItem[];
  /** Các targetId mục mới được bổ sung vào lô này */
  newTargetIds: string[];
  /** Toàn bộ targetId trong phiên ôn = batchDue + newTargetIds */
  sessionTargetIds: Set<string>;
  /** Số lượng câu hỏi thực tế có thể chơi được trong lô này (khớp chính xác buildSession) */
  playableCount: number;
  /** Số mục đến hạn còn lại sau lô này */
  remainingDue: number;
  /** Tổng số mục đến hạn hiện tại trong toàn bộ hàng đợi */
  totalDueCount: number;
  /** Có phiên ôn tiếp theo khả dụng hay không (playableCount > 0) */
  hasMore: boolean;
  /** Lý do nếu còn mục tiêu nhưng không tạo được câu nào */
  blockedReason?: 'no-audio' | 'no-questions';
}

/**
 * Tính toán kế hoạch lô ôn tập tiếp theo (SPEC-20).
 * Hàm thuần kết hợp planReviewBatch với buildSession:
 * - Tôn trọng hạn mức mục mới còn lại trong ngày (dailyNewLimit - newLoadedToday);
 * - Chỉ nạp mục mới khi batch còn chỗ trống (ưu tiên mục đến hạn trước);
 * - Kiểm tra câu hỏi thực tế tạo được qua buildSession (loại bỏ trường hợp thiếu giọng ja-JP hoặc thiếu câu hỏi);
 * - Đảm bảo số N hiển thị trên nút "Ôn lô tiếp (N mục)" luôn khớp 100% với số câu hỏi của phiên được tạo.
 */
export function resolveNextBatchPlan({
  allReviewItems,
  poolQuestions,
  dailyNewLimit,
  reviewBatchSize,
  now,
  availableAudioKeys,
  config,
}: {
  allReviewItems: ReviewItem[];
  poolQuestions: QuestionItem[];
  dailyNewLimit: number;
  reviewBatchSize: number;
  now: Date;
  availableAudioKeys: Set<string>;
  config?: PracticeConfig;
}): NextBatchPlanResult {
  const startTodayIso = startOfLocalDay(now).toISOString();
  const newLoadedToday = allReviewItems.filter((item) => item.createdAt >= startTodayIso).length;
  const remainingNewQuota = Math.max(0, dailyNewLimit - newLoadedToday);

  const allDueItems = allReviewItems
    .filter((item) => item.dueAt.getTime() <= now.getTime())
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());

  const existingTargetIds = new Set(allReviewItems.map((item) => item.targetId));
  const poolTargetIds = collectTargetIds(poolQuestions);

  const plan = planReviewBatch(
    allDueItems,
    poolTargetIds,
    existingTargetIds,
    remainingNewQuota,
    reviewBatchSize,
  );

  const sessionTargetIds = new Set([
    ...plan.batchDue.map((item) => item.targetId),
    ...plan.newTargetIds,
  ]);

  if (sessionTargetIds.size === 0) {
    return {
      batchDue: [],
      newTargetIds: [],
      sessionTargetIds,
      playableCount: 0,
      remainingDue: 0,
      totalDueCount: 0,
      hasMore: false,
    };
  }

  const computedMaxLesson =
    config?.maxLearnedLesson && config.maxLearnedLesson > 0
      ? config.maxLearnedLesson
      : Math.max(0, ...poolQuestions.map((item) => item.lesson), ...(config?.lessons ?? []));

  const sessionConfig: PracticeConfig = {
    mode: 'due',
    lessons:
      config?.lessons && config.lessons.length > 0
        ? config.lessons
        : [...new Set(poolQuestions.map((item) => item.lesson))],
    maxLearnedLesson: computedMaxLesson,
    selectedTypes: config?.selectedTypes ?? ['mc', 'matching', 'cloze', 'reorder', 'listening'],
    questionCount: sessionTargetIds.size,
  };

  const { questions: playableQuestions, excludedAudioCount } = buildSession(
    poolQuestions,
    sessionConfig,
    availableAudioKeys,
    sessionTargetIds,
  );

  let blockedReason: 'no-audio' | 'no-questions' | undefined;
  if (playableQuestions.length === 0) {
    if (excludedAudioCount > 0 && availableAudioKeys.size === 0) {
      blockedReason = 'no-audio';
    } else {
      blockedReason = 'no-questions';
    }
  }

  return {
    batchDue: plan.batchDue,
    newTargetIds: plan.newTargetIds,
    sessionTargetIds,
    playableCount: playableQuestions.length,
    remainingDue: plan.remainingDue,
    totalDueCount: allDueItems.length,
    hasMore: playableQuestions.length > 0,
    blockedReason,
  };
}

/**
 * Mô tả số mục và số lô còn lại (SPEC-20 §3, §5).
 */
export function describeRemainingBatches(remainingDue: number, batchSize: number): string {
  if (remainingDue <= 0) return '';
  const batches = Math.ceil(remainingDue / batchSize);
  return `Còn ${remainingDue} mục đến hạn cho ${batches > 1 ? `khoảng ${batches} lô sau` : 'lô tiếp theo'}. Mỗi lô tối đa ${batchSize} mục; tạm chưa nạp mục mới cho tới khi ôn kịp.`;
}

/** Gộp bài 1…N người học khai báo đã học vào tập bài đã có trong lịch ôn. */
export function withDeclaredLessons(learnedLessons: number[], learnedThroughLesson: number): number[] {
  const all = new Set(learnedLessons);
  for (let lesson = 1; lesson <= learnedThroughLesson; lesson++) all.add(lesson);
  return [...all].sort((a, b) => a - b);
}

/** Phân rã theo loại mục tiêu cho dòng "12 từ vựng · 4 ngữ pháp · 2 trợ từ". */
export function countByTargetType(targetIds: string[]): Record<TargetType, number> {
  const counts: Record<TargetType, number> = {
    vocab: 0,
    grammar: 0,
    kanji: 0,
    particle: 0,
    listening: 0,
  };
  for (const id of targetIds) {
    counts[targetTypeFromId(id)] += 1;
  }
  return counts;
}

/**
 * Số ngày trễ, cắt theo nửa đêm GIỜ ĐỊA PHƯƠNG. Đến hạn lúc 23:30 hôm qua mà bây giờ là
 * 00:30 hôm nay thì trễ 1 ngày, không phải 0. Chưa quá hạn → 0.
 */
export function overdueDays(dueAt: Date, now: Date): number {
  const diff = startOfLocalDay(now).getTime() - startOfLocalDay(dueAt).getTime();
  return diff <= 0 ? 0 : Math.round(diff / DAY_MS);
}

/**
 * Dòng "Lần ôn kế tiếp" của màn kết quả (SPEC-05 §3.3): "3 mục ngày mai, 12 mục sau 4 ngày".
 * Gom theo ngày địa phương, lấy `maxGroups` mốc gần nhất. Không có gì → chuỗi rỗng.
 */
export function describeNextReviews(dueDates: Date[], now: Date, maxGroups = 3): string {
  const today = startOfLocalDay(now).getTime();
  const byOffset = new Map<number, number>();

  for (const due of dueDates) {
    const offset = Math.max(0, Math.round((startOfLocalDay(due).getTime() - today) / DAY_MS));
    byOffset.set(offset, (byOffset.get(offset) ?? 0) + 1);
  }

  return [...byOffset.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(0, maxGroups)
    .map(([offset, count]) => {
      const when = offset === 0 ? 'hôm nay' : offset === 1 ? 'ngày mai' : `sau ${offset} ngày`;
      return `${count} mục ${when}`;
    })
    .join(', ');
}

/**
 * Nội dung hiển thị của từng mục tiêu, suy từ chính bể câu hỏi — không nạp lại file dữ liệu
 * và không tạo nguồn sự thật thứ hai. Một targetId có nhiều câu nên giữ câu mang nhiều thông
 * tin nhất: điểm cao thắng.
 */
export function buildTargetLabels(questions: QuestionItem[]): Map<string, TargetLabel> {
  const best = new Map<string, { score: number; label: TargetLabel }>();

  const put = (targetId: string, score: number, label: TargetLabel): void => {
    const current = best.get(targetId);
    if (!current || score > current.score) {
      best.set(targetId, { score, label });
    }
  };

  const answerText = (question: QuestionItem): string =>
    Array.isArray(question.answer) ? question.answer.join(' ') : question.answer;

  for (const question of questions) {
    if (question.pairs && question.pairs.length > 0) {
      for (const pair of question.pairs) {
        put(pair.targetId, 3, { jp: pair.jp, vi: pair.vi });
      }
      continue;
    }

    switch (question.type) {
      case 'mc':
        // `mc-mean-*`: prompt là từ CÒN furigana, answer là nghĩa tiếng Việt — nguồn tốt nhất.
        // `mc-read-*`: prompt đã bị bỏ furigana, chỉ dùng khi không còn nguồn nào khác.
        if (question.id.startsWith('mc-mean-')) {
          put(question.targetId, 3, { jp: question.prompt, vi: answerText(question) });
        } else {
          put(question.targetId, 0, { jp: question.prompt, vi: '' });
        }
        break;
      case 'cloze':
        put(question.targetId, 1, { jp: answerText(question), vi: 'Trợ từ' });
        break;
      case 'reorder':
      case 'listening':
        put(question.targetId, 2, {
          jp: question.explanationJp ?? question.prompt,
          vi: question.explanationVi ?? '',
        });
        break;
      default:
        break;
    }
  }

  const labels = new Map<string, TargetLabel>();
  for (const [targetId, entry] of best) {
    labels.set(targetId, entry.label);
  }
  return labels;
}

export type ReviewSyncNotice =
  | {
      kind: 'anonymous';
      count: number;
      text: string;
      actionText: string;
      actionHref: string;
    }
  | {
      kind: 'pending';
      count: number;
      text: string;
    };

/**
 * Xác định nội dung hiển thị dòng trạng thái sync trên trang /on-tap (SPEC-20, Lỗi #2).
 * - Chưa cấu hình Supabase (!isConfigured): trả về null (không hiện dòng chờ đồng bộ lên máy chủ).
 * - Đang offline (!isOnline) hoặc không có bản ghi chờ (pendingSyncCount <= 0): trả về null.
 * - Đã cấu hình nhưng chưa đăng nhập: nhắc lưu trên máy và dẫn link /ca-nhan để đăng nhập.
 * - Đã cấu hình và đã đăng nhập: báo số kết quả đang chờ đồng bộ lên máy chủ.
 */
export function resolveReviewSyncNotice({
  pendingSyncCount,
  isOnline,
  isConfigured,
  isLoggedIn,
}: {
  pendingSyncCount: number;
  isOnline: boolean;
  isConfigured: boolean;
  isLoggedIn: boolean;
}): ReviewSyncNotice | null {
  if (!Number.isFinite(pendingSyncCount) || pendingSyncCount <= 0 || !isOnline) {
    return null;
  }
  if (!isConfigured) {
    return null;
  }
  if (!isLoggedIn) {
    return {
      kind: 'anonymous',
      count: pendingSyncCount,
      text: `${pendingSyncCount} kết quả lưu trên máy; `,
      actionText: 'đăng nhập để đồng bộ',
      actionHref: '/ca-nhan',
    };
  }
  return {
    kind: 'pending',
    count: pendingSyncCount,
    text: `${pendingSyncCount} kết quả ôn đang chờ đồng bộ lên máy chủ.`,
  };
}

/**
 * Kiểm tra xem người học có bản nháp ôn tập đang dở dang hay không.
 */
export function hasActiveReviewDraft(
  draft: { currentIndex: number; questions: unknown[] } | null | undefined,
): boolean {
  return Boolean(
    draft &&
      Array.isArray(draft.questions) &&
      draft.questions.length > 0 &&
      draft.currentIndex < draft.questions.length,
  );
}

export interface ReviewStartActionConfig {
  hasActiveDraft: boolean;
  buttonVariant: 'default' | 'outline';
  requiresConfirmation: boolean;
}

/**
 * Quyết định mức ưu tiên của nút "Bắt đầu ôn" khi có nháp dở dang (SPEC-20, Lỗi #6).
 * Khi có nháp: "Tiếp tục phiên ôn" là primary duy nhất; "Bắt đầu ôn" hạ xuống outline và cần xác nhận.
 * Khi không có nháp: "Bắt đầu ôn" giữ mức primary (default) và không cần xác nhận.
 */
export function resolveReviewStartAction(hasActiveDraft: boolean): ReviewStartActionConfig {
  return {
    hasActiveDraft,
    buttonVariant: hasActiveDraft ? 'outline' : 'default',
    requiresConfirmation: hasActiveDraft,
  };
}

/**
 * Lời cảnh báo trong AlertDialog khi người học chọn bắt đầu phiên ôn mới dù đang có nháp dở.
 */
export function formatDraftOverwriteWarning(
  currentIndex: number,
  totalQuestions: number,
): string {
  const current = Math.max(1, currentIndex + 1);
  const total = Math.max(1, totalQuestions);
  return `Bạn đang có một phiên ôn dở dang (câu ${current}/${total}). Bắt đầu mới sẽ thay thế và xóa bỏ bài làm dở này.`;
}

