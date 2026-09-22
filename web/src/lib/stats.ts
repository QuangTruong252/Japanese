import type { PracticeSession, ReviewItem, TargetType } from '@/types';

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

/** Format ngày ngắn dạng DD/MM */
export function formatDayShort(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}`;
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
  now: Date,
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

export interface DayValue {
  date: Date;
  dayKey: string;
  label: string;
  value: number;
  hasData: boolean;
  totalQuestions?: number;
  correctCount?: number;
  sessionCount?: number;
}

/**
 * Phút học từng ngày trong cửa sổ `days` ngày gần nhất (tính cả hôm nay) (SPEC-07 §2.2).
 */
export function dailyMinutes(sessions: PracticeSession[], days: number, now: Date): DayValue[] {
  const results: DayValue[] = [];
  const startDay = startOfLocalDay(now);
  startDay.setDate(startDay.getDate() - (days - 1));

  for (let i = 0; i < days; i++) {
    const current = new Date(startDay);
    current.setDate(startDay.getDate() + i);
    const key = localDayKey(current);

    const daySessions = sessions.filter((s) => sessionDayKey(s) === key);
    const totalSecs = daySessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    const mins = Math.round(totalSecs / 60);

    results.push({
      date: current,
      dayKey: key,
      label: formatDayShort(current),
      value: mins,
      hasData: daySessions.length > 0,
      sessionCount: daySessions.length,
    });
  }

  return results;
}

/**
 * Tỷ lệ đúng từng ngày trong cửa sổ `days` ngày gần nhất (SPEC-07 §2.2).
 * Ngày không có phiên có hasData = false, value = 0 (tránh nối đường thẳng qua khoảng trống).
 */
export function dailyAccuracy(sessions: PracticeSession[], days: number, now: Date): DayValue[] {
  const results: DayValue[] = [];
  const startDay = startOfLocalDay(now);
  startDay.setDate(startDay.getDate() - (days - 1));

  for (let i = 0; i < days; i++) {
    const current = new Date(startDay);
    current.setDate(startDay.getDate() + i);
    const key = localDayKey(current);

    const daySessions = sessions.filter((s) => sessionDayKey(s) === key);
    const totalQ = daySessions.reduce((sum, s) => sum + s.totalQuestions, 0);
    const correctQ = daySessions.reduce((sum, s) => sum + s.correctCount, 0);

    const acc = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;

    results.push({
      date: current,
      dayKey: key,
      label: formatDayShort(current),
      value: acc,
      hasData: totalQ > 0,
      totalQuestions: totalQ,
      correctCount: correctQ,
      sessionCount: daySessions.length,
    });
  }

  return results;
}

/**
 * Gom số lượng mục theo từng loại mục tiêu (SPEC-07 §2.2, §3.1).
 * Cố định: vocab, grammar, kanji, particle, listening.
 */
export function targetsByType(items: ReviewItem[]): Record<TargetType, number> {
  const counts: Record<TargetType, number> = {
    vocab: 0,
    grammar: 0,
    kanji: 0,
    particle: 0,
    listening: 0,
  };

  for (const item of items) {
    if (item.targetType && counts[item.targetType] !== undefined) {
      counts[item.targetType]++;
    }
  }

  return counts;
}

export interface HeatmapDay {
  date: Date;
  dayKey: string;
  label: string;
  minutes: number;
  sessionCount: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface HeatmapWeek {
  days: HeatmapDay[];
}

/**
 * Lưới lịch nhiệt `weeksCount` tuần gần nhất (SPEC-07 §3.1, §5).
 * Tuần bắt đầu từ Thứ Hai (Monday = 1) và kết thúc ở Chủ Nhật (Sunday = 0).
 * Cấp độ 0: Không học
 * Cấp độ 1: 1-10 phút (kể cả 0 phút nếu có ít nhất 1 phiên - SPEC-07 §5)
 * Cấp độ 2: 11-20 phút
 * Cấp độ 3: 21-35 phút
 * Cấp độ 4: > 35 phút
 */
export function activityHeatmap(
  sessions: PracticeSession[],
  weeksCount: number,
  now: Date,
): HeatmapWeek[] {
  // Tìm Chủ Nhật của tuần hiện tại (kết thúc lưới)
  const today = startOfLocalDay(now);
  const dayOfWeek = today.getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

  const endSunday = new Date(today);
  endSunday.setDate(today.getDate() + daysUntilSunday);

  // Đi lùi lại đúng weeksCount tuần (mỗi tuần 7 ngày)
  const totalDays = weeksCount * 7;
  const startMonday = new Date(endSunday);
  startMonday.setDate(endSunday.getDate() - totalDays + 1);

  // Map nhanh các session theo localDayKey
  const sessionMap = new Map<string, PracticeSession[]>();
  for (const s of sessions) {
    const key = sessionDayKey(s);
    const list = sessionMap.get(key) || [];
    list.push(s);
    sessionMap.set(key, list);
  }

  const weeks: HeatmapWeek[] = [];
  const currentDay = new Date(startMonday);

  for (let w = 0; w < weeksCount; w++) {
    const days: HeatmapDay[] = [];
    for (let d = 0; d < 7; d++) {
      const key = localDayKey(currentDay);
      const daySessions = sessionMap.get(key) || [];

      const totalSecs = daySessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
      const mins = Math.round(totalSecs / 60);
      const sCount = daySessions.length;

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (sCount > 0) {
        if (mins <= 10) level = 1; // Có học là có tô
        else if (mins <= 20) level = 2;
        else if (mins <= 35) level = 3;
        else level = 4;
      }

      days.push({
        date: new Date(currentDay),
        dayKey: key,
        label: formatDayShort(currentDay),
        minutes: mins,
        sessionCount: sCount,
        level,
      });

      currentDay.setDate(currentDay.getDate() + 1);
    }
    weeks.push({ days });
  }

  return weeks;
}
