import test from 'node:test';
import assert from 'node:assert/strict';
import { forecastDayLabel, reviewForecast } from './review-forecast.ts';

// Thứ Sáu 23/10/2026, giờ địa phương.
const NOW = new Date(2026, 9, 23, 14, 30);
const counts = (dates: Date[]) => reviewForecast(dates, NOW).map((d) => d.count);

test('mảng rỗng cho đúng 7 số 0', () => {
  assert.deepEqual(counts([]), [0, 0, 0, 0, 0, 0, 0]);
});

test('mục quá hạn dồn về hôm nay', () => {
  assert.deepEqual(counts([new Date(2026, 9, 1), new Date(2026, 9, 22, 23, 59), new Date(2026, 9, 23, 8)]), [3, 0, 0, 0, 0, 0, 0]);
});

test('ranh giới 23:59:59.999 và 00:00', () => {
  const endOfToday = new Date(2026, 9, 23, 23, 59, 59, 999);
  const startOfTomorrow = new Date(2026, 9, 24, 0, 0, 0, 0);
  assert.deepEqual(counts([endOfToday, startOfTomorrow]), [1, 1, 0, 0, 0, 0, 0]);
});

test('ngày cuối cùng tính, ngày thứ 8 bỏ qua', () => {
  const lastDay = new Date(2026, 9, 29, 23, 59, 59, 999);
  const dayEight = new Date(2026, 9, 30, 0, 0, 0, 0);
  assert.deepEqual(counts([lastDay, dayEight, new Date(2027, 0, 1)]), [0, 0, 0, 0, 0, 0, 1]);
});

test('nhãn: Hôm nay rồi thứ viết tắt', () => {
  const labels = reviewForecast([], NOW).map(forecastDayLabel);
  assert.deepEqual(labels, ['Hôm nay', 'T7', 'CN', 'T2', 'T3', 'T4', 'T5']);
});
