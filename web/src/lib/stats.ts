import type { PracticeSession } from '@/types';

/**
 * Số liệu học tập — hàm thuần, nhận mảng trả số (SPEC-07 §2.2).
 * Không đọc Dexie, không gọi Date.now() bên trong: `now` luôn là tham số, nếu không thì
 * không test được. Dashboard (SPEC-02) và trang Thống kê (SPEC-07) dùng chung module này.
 */

/** Nửa đêm giờ ĐỊA PHƯƠNG, không phải UTC (SPEC-07 §2.1) */
export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Khóa ngày địa phương dạng YYYY-MM-DD, dùng để gom phiên theo ngày */
export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Một phiên thuộc về ngày của createdAt — thời điểm ghi xong (SPEC-07 §2.1) */
const sessionDayKey = (session: PracticeSession): string =>
  localDayKey(new Date(session.createdAt));

export interface StreakResult {
  days: number;
  /** true khi chuỗi có thể còn dài hơn: ngày cũ nhất trong dữ liệu cũng có phiên */
  truncated: boolean;
}

/**
 * Chuỗi ngày liên tiếp tính lùi từ hôm nay. Hôm nay chưa học thì vẫn tính từ hôm qua trở về
 * trước — chuỗi chưa đứt cho tới khi hết ngày.
 */
export function currentStreak(sessions: PracticeSession[], now: Date): StreakResult {
  if (sessions.length === 0) return { days: 0, truncated: false };

  const days = new Set(sessions.map(sessionDayKey));
  const cursor = startOfLocalDay(now);

  // Hôm nay chưa học: bắt đầu đếm từ hôm qua, không reset về 0.
  if (!days.has(localDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let count = 0;
  while (days.has(localDayKey(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Dữ liệu cục bộ có thể bị cắt (SPEC-08 §2.3 chỉ kéo về 90 ngày): nếu ngày cũ nhất đang có
  // cũng nằm trong chuỗi thì chuỗi thật có thể dài hơn — nói "90+" thay vì "90".
  const oldest = [...days].sort()[0]!;
  const truncated = count > 0 && oldest === localDayKey(new Date(cursor.getTime() + 86400000));

  return { days: count, truncated };
}

/** Tổng số phút học trong một ngày (làm tròn) */
export function minutesOnDay(sessions: PracticeSession[], day: Date): number {
  const key = localDayKey(day);
  const seconds = sessions
    .filter((s) => sessionDayKey(s) === key)
    .reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
  return Math.round(seconds / 60);
}

/**
 * Tỷ lệ đúng trong `days` ngày gần nhất, tính theo TỔNG CÂU chứ không phải trung bình cộng
 * accuracyRate của các phiên — một phiên 2 câu không được cùng trọng số với phiên 30 câu.
 * Trả null khi không có phiên nào: "chưa có dữ liệu" khác "làm sai hết".
 */
export function accuracyOverDays(
  sessions: PracticeSession[],
  days: number,
  now: Date
): number | null {
  const cutoff = startOfLocalDay(now);
  cutoff.setDate(cutoff.getDate() - (days - 1));

  const inWindow = sessions.filter((s) => new Date(s.createdAt) >= cutoff);
  const total = inWindow.reduce((sum, s) => sum + s.totalQuestions, 0);
  if (total === 0) return null;

  const correct = inWindow.reduce((sum, s) => sum + s.correctCount, 0);
  return Math.round((correct / total) * 100);
}

/**
 * Đếm số mục từ vựng đã VÀO LỊCH ÔN theo bài (SPEC-03 §4) — "đã học", không phải "đã thuộc".
 * Đầu vào là mảng primary key của `reviewItems`; hàm thuần, không đọc Dexie.
 */
export function countLearnedByLesson(targetIds: string[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const id of targetIds) {
    const m = /^vocab-(\d{2})-\d{2}$/.exec(id);
    if (!m) continue;
    const lesson = Number(m[1]);
    counts.set(lesson, (counts.get(lesson) ?? 0) + 1);
  }
  return counts;
}
