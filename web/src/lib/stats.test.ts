import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  accuracyOverDays,
  currentStreak,
  localDayKey,
  minutesOnDay,
  startOfLocalDay,
  countLearnedByLesson,
} from './stats.ts';
import type { PracticeSession } from '../types/index.ts';

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
