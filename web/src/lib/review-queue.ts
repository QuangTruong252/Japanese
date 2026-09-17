import type { QuestionItem, TargetType } from '../types/index.ts';
import { targetTypeFromId } from './practice.ts';
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
