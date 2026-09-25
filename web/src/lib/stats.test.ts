import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  accuracyOverDays,
  currentStreak,
  localDayKey,
  minutesOnDay,
  startOfLocalDay,
  countLearnedByLesson,
  dailyMinutes,
  dailyAccuracy,
  targetsByType,
  activityHeatmap,
  pickActiveLesson,
  secondsPerQuestion,
  secondsOnDay,
  sessionCountOnDay,
  hasStudiedOnDay,
  formatStudyTimeToday,
  resolveSyncBadgeState,
} from './stats.ts';
import type { PracticeSession, ReviewItem } from '../types/index.ts';

/** Phiên học lúc `local` (giờ địa phương của máy chạy test) */
const session = (
  local: string,
  overrides: Partial<PracticeSession> = {}
): PracticeSession => ({
  id: `s-${local}-${Math.random()}`,
  selectedLessons: [1],
  exerciseTypes: ['mc'],
  totalQuestions: 10,
  correctCount: 10,
  accuracyRate: 100,
  durationSeconds: 600,
  createdAt: new Date(local).toISOString(),
  ...overrides,
});

test('startOfLocalDay: nửa đêm giờ địa phương, không phải UTC', () => {
  const start = startOfLocalDay(new Date(2026, 8, 17, 23, 30));
  assert.equal(start.getHours(), 0);
  assert.equal(start.getMinutes(), 0);
  assert.equal(start.getDate(), 17);
});

test('phiên lúc 23:30 giờ địa phương tính vào HÔM NAY', () => {
  // Ca hồi quy: toISOString().slice(0,10) đẩy phiên này sang ngày khác ở mọi múi giờ > 0
  const now = new Date(2026, 8, 17, 23, 45);
  const late = session('2026-09-17T23:30:00');

  assert.equal(localDayKey(new Date(late.createdAt)), localDayKey(now));
  assert.equal(minutesOnDay([late], now), 10);
  assert.equal(currentStreak([late], now).days, 1);
});

test('currentStreak: đếm ngày liên tiếp, đứt quãng thì dừng', () => {
  const now = new Date(2026, 8, 17, 9, 0);
  const sessions = [
    session('2026-09-17T08:00:00'),
    session('2026-09-16T08:00:00'),
    session('2026-09-15T08:00:00'),
    // nghỉ ngày 14
    session('2026-09-13T08:00:00'),
  ];

  assert.equal(currentStreak(sessions, now).days, 3);
});

test('currentStreak: hôm nay chưa học thì vẫn tính từ hôm qua, không reset về 0', () => {
  const now = new Date(2026, 8, 17, 0, 30);
  const sessions = [session('2026-09-16T20:00:00'), session('2026-09-15T20:00:00')];

  assert.equal(currentStreak(sessions, now).days, 2);
});

test('currentStreak: rỗng trả 0, không truncated', () => {
  assert.deepEqual(currentStreak([], new Date(2026, 8, 17)), { days: 0, truncated: false });
});

test('currentStreak: đánh dấu truncated khi ngày cũ nhất cũng nằm trong chuỗi', () => {
  const now = new Date(2026, 8, 17, 9, 0);
  // Dữ liệu chỉ còn 3 ngày và cả 3 đều liên tiếp -> chuỗi thật có thể dài hơn
  const sessions = [
    session('2026-09-17T08:00:00'),
    session('2026-09-16T08:00:00'),
    session('2026-09-15T08:00:00'),
  ];

  const result = currentStreak(sessions, now);
  assert.equal(result.days, 3);
  assert.equal(result.truncated, true);
});

test('accuracyOverDays: tính theo tổng câu, không phải trung bình cộng các phiên', () => {
  const now = new Date(2026, 8, 17, 12, 0);
  const sessions = [
    session('2026-09-17T08:00:00', { totalQuestions: 2, correctCount: 1, accuracyRate: 50 }),
    session('2026-09-16T08:00:00', { totalQuestions: 30, correctCount: 30, accuracyRate: 100 }),
  ];

  // 31/32 = 96.875 -> 97, KHÔNG phải trung bình cộng (50 + 100) / 2 = 75
  assert.equal(accuracyOverDays(sessions, 7, now), 97);
});

test('accuracyOverDays: ngoài cửa sổ thì không tính; rỗng trả null chứ không phải 0', () => {
  const now = new Date(2026, 8, 17, 12, 0);
  const old = session('2026-09-01T08:00:00', { totalQuestions: 10, correctCount: 0 });

  assert.equal(accuracyOverDays([old], 7, now), null);
  assert.equal(accuracyOverDays([], 7, now), null);
});

test('minutesOnDay: cộng đúng thời lượng trong ngày, làm tròn phút', () => {
  const now = new Date(2026, 8, 17, 12, 0);
  const sessions = [
    session('2026-09-17T08:00:00', { durationSeconds: 90 }),
    session('2026-09-17T09:00:00', { durationSeconds: 150 }),
    session('2026-09-16T09:00:00', { durationSeconds: 3600 }),
  ];

  assert.equal(minutesOnDay(sessions, now), 4);
});

test('countLearnedByLesson gom targetId từ vựng theo bài', () => {
  const counts = countLearnedByLesson([
    'vocab-01-01', 'vocab-01-02', 'vocab-03-07',
    'grammar-01-01',      // không phải từ vựng
    'particle-wa',        // không phải từ vựng
    'vocab-watashi',      // neo trang chi tiết, không phải targetId ôn tập
    'vocab-1-1',          // thiếu pad 2 chữ số
  ]);
  assert.equal(counts.get(1), 2);
  assert.equal(counts.get(3), 1);
  assert.equal(counts.get(2), undefined);
  assert.equal(counts.size, 2);
});

test('countLearnedByLesson trả Map rỗng khi chưa ôn gì', () => {
  assert.equal(countLearnedByLesson([]).size, 0);
});

test('dailyMinutes sinh đúng số ngày và tính đúng số phút từng ngày', () => {
  const now = new Date(2026, 8, 17, 12, 0);
  const sessions = [
    session('2026-09-17T08:00:00', { durationSeconds: 600 }), // 10p
    session('2026-09-15T10:00:00', { durationSeconds: 1200 }), // 20p
  ];

  const results = dailyMinutes(sessions, 3, now);
  assert.equal(results.length, 3);
  assert.equal(results[0].dayKey, '2026-09-15');
  assert.equal(results[0].value, 20);
  assert.equal(results[0].hasData, true);

  assert.equal(results[1].dayKey, '2026-09-16');
  assert.equal(results[1].value, 0);
  assert.equal(results[1].hasData, false);

  assert.equal(results[2].dayKey, '2026-09-17');
  assert.equal(results[2].value, 10);
  assert.equal(results[2].hasData, true);
});

test('dailyAccuracy đánh dấu ngày không có phiên là hasData = false', () => {
  const now = new Date(2026, 8, 17, 12, 0);
  const sessions = [
    session('2026-09-17T08:00:00', { totalQuestions: 10, correctCount: 8 }), // 80%
  ];

  const results = dailyAccuracy(sessions, 2, now);
  assert.equal(results.length, 2);
  assert.equal(results[0].dayKey, '2026-09-16');
  assert.equal(results[0].hasData, false);
  assert.equal(results[0].value, 0);

  assert.equal(results[1].dayKey, '2026-09-17');
  assert.equal(results[1].hasData, true);
  assert.equal(results[1].value, 80);
});

test('targetsByType đếm đúng số mục theo từng loại mục tiêu', () => {
  const items = [
    { targetType: 'vocab' },
    { targetType: 'vocab' },
    { targetType: 'grammar' },
    { targetType: 'kanji' },
    { targetType: 'particle' },
  ] as unknown as ReviewItem[];

  const counts = targetsByType(items);
  assert.equal(counts.vocab, 2);
  assert.equal(counts.grammar, 1);
  assert.equal(counts.kanji, 1);
  assert.equal(counts.particle, 1);
  assert.equal(counts.listening, 0);
});

test('activityHeatmap tạo đủ 12 tuần và tô đúng level (kể cả 0 phút vẫn level 1 nếu có phiên)', () => {
  const now = new Date(2026, 8, 17, 12, 0); // Thứ 5
  const sessions = [
    session('2026-09-17T08:00:00', { durationSeconds: 0 }), // 0 giây nhưng có học -> level 1
    session('2026-09-16T08:00:00', { durationSeconds: 900 }), // 15 phút -> level 2
    session('2026-09-15T08:00:00', { durationSeconds: 1800 }), // 30 phút -> level 3
    session('2026-09-14T08:00:00', { durationSeconds: 3000 }), // 50 phút -> level 4
  ];

  const weeks = activityHeatmap(sessions, 12, now);
  assert.equal(weeks.length, 12);
  // Mỗi tuần 7 ngày
  for (const w of weeks) {
    assert.equal(w.days.length, 7);
  }

  // Tuần cuối cùng chứa ngày hiện tại
  const lastWeek = weeks[weeks.length - 1];
  const t2 = lastWeek.days.find((d) => d.dayKey === '2026-09-14');
  const t3 = lastWeek.days.find((d) => d.dayKey === '2026-09-15');
  const t4 = lastWeek.days.find((d) => d.dayKey === '2026-09-16');
  const t5 = lastWeek.days.find((d) => d.dayKey === '2026-09-17');

  assert.equal(t2?.level, 4);
  assert.equal(t3?.level, 3);
  assert.equal(t4?.level, 2);
  assert.equal(t5?.level, 1);
});

test('pickActiveLesson: bài nhỏ nhất đang học dở, rồi bài đầu chưa xong', () => {
  const summaries = [1, 2, 3, 4].map((number) => ({ number, vocabCount: 10 }));
  assert.equal(pickActiveLesson(summaries, new Map()), 1);
  assert.equal(pickActiveLesson(summaries, new Map([[1, 10], [3, 4]])), 3);
  assert.equal(pickActiveLesson(summaries, new Map([[1, 10], [2, 10]])), 3);
  assert.equal(pickActiveLesson(summaries, new Map([[1, 10], [2, 10], [3, 10], [4, 10]])), 4);
});

test('pickActiveLesson: bài đã khai báo không bao giờ là bài đang học', () => {
  const summaries = [1, 2, 3, 4].map((number) => ({ number, vocabCount: 10 }));
  // Nhỏ giọt từ vựng bài 1 không kéo "bài đang học" lùi về bài 1.
  assert.equal(pickActiveLesson(summaries, new Map([[1, 3]]), 2), 3);
});

test('secondsPerQuestion lấy trung bình theo tổng câu, bỏ phiên rỗng', () => {
  assert.equal(secondsPerQuestion([]), null);
  assert.equal(
    secondsPerQuestion([
      { durationSeconds: 100, totalQuestions: 10 },
      { durationSeconds: 200, totalQuestions: 10 },
      { durationSeconds: 50, totalQuestions: 0 },
    ]),
    15,
  );
});

test('Feedback #2: 0 phiên hôm nay -> chưa học, 0 giây, "0 phút"', () => {
  const now = new Date(2026, 8, 17, 12, 0);
  const sessions: PracticeSession[] = [];

  assert.equal(sessionCountOnDay(sessions, now), 0);
  assert.equal(hasStudiedOnDay(sessions, now), false);
  assert.equal(secondsOnDay(sessions, now), 0);
  assert.equal(formatStudyTimeToday(secondsOnDay(sessions, now)), '0 phút');
});

test('Feedback #2: phiên 29 giây hôm nay -> đã học (studied), "Dưới 1 phút"', () => {
  const now = new Date(2026, 8, 17, 12, 0);
  const shortSession = session('2026-09-17T10:00:00', { durationSeconds: 29 });
  const sessions = [shortSession];

  assert.equal(sessionCountOnDay(sessions, now), 1);
  assert.equal(hasStudiedOnDay(sessions, now), true);
  assert.equal(secondsOnDay(sessions, now), 29);
  assert.equal(formatStudyTimeToday(secondsOnDay(sessions, now)), 'Dưới 1 phút');
});

test('Feedback #2: phiên 90 giây hôm nay -> đã học, 2 phút theo Math.round(90/60)', () => {
  const now = new Date(2026, 8, 17, 12, 0);
  const s90 = session('2026-09-17T10:00:00', { durationSeconds: 90 });
  const sessions = [s90];

  assert.equal(sessionCountOnDay(sessions, now), 1);
  assert.equal(hasStudiedOnDay(sessions, now), true);
  assert.equal(secondsOnDay(sessions, now), 90);
  assert.equal(minutesOnDay(sessions, now), 2);
  assert.equal(formatStudyTimeToday(secondsOnDay(sessions, now)), '2 phút');
});

test('Feedback #37: resolveSyncBadgeState khi CHƯA đăng nhập luôn là "Chỉ lưu trên máy"', () => {
  // Có bản ghi chờ đồng bộ nhưng chưa đăng nhập -> không dùng "Chờ đồng bộ (3)"
  const withPending = resolveSyncBadgeState({
    pendingCount: 3,
    isLoggedIn: false,
    engineState: 'offline',
  });
  assert.equal(withPending.state, 'offline');
  assert.equal(withPending.label, 'Chỉ lưu trên máy');

  // Không có bản ghi chờ, chưa đăng nhập
  const empty = resolveSyncBadgeState({
    pendingCount: 0,
    isLoggedIn: false,
    engineState: 'offline',
  });
  assert.equal(empty.state, 'offline');
  assert.equal(empty.label, 'Chỉ lưu trên máy');
});

test('Feedback #37: resolveSyncBadgeState khi ĐÃ đăng nhập giữ nguyên ngữ nghĩa', () => {
  // Có bản ghi chờ đồng bộ
  const pending = resolveSyncBadgeState({
    pendingCount: 5,
    isLoggedIn: true,
    engineState: 'offline',
  });
  assert.equal(pending.state, 'pending');
  assert.equal(pending.label, 'Chờ đồng bộ (5)');

  // Đang đồng bộ
  const syncing = resolveSyncBadgeState({
    pendingCount: 2,
    isLoggedIn: true,
    engineState: 'syncing',
  });
  assert.equal(syncing.state, 'syncing');
  assert.equal(syncing.label, 'Đang đồng bộ…');

  // Đã đồng bộ xong
  const synced = resolveSyncBadgeState({
    pendingCount: 0,
    isLoggedIn: true,
    engineState: 'synced',
  });
  assert.equal(synced.state, 'synced');
  assert.equal(synced.label, 'Đã đồng bộ');

  // Ngoại tuyến
  const offline = resolveSyncBadgeState({
    pendingCount: 0,
    isLoggedIn: true,
    engineState: 'offline',
  });
  assert.equal(offline.state, 'offline');
  assert.equal(offline.label, 'Ngoại tuyến — đã lưu trên máy');
});

