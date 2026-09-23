import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTime,
  normalizeLoopPoints,
  isTypingTarget,
} from './shadowing.ts';

test('formatTime: định dạng giây thành mm:ss chính xác', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(9), '00:09');
  assert.equal(formatTime(42), '00:42');
  assert.equal(formatTime(60), '01:00');
  assert.equal(formatTime(75), '01:15');
  assert.equal(formatTime(195), '03:15');
  assert.equal(formatTime(3605), '60:05');

  // Trường hợp không hợp lệ
  assert.equal(formatTime(-5), '00:00');
  assert.equal(formatTime(NaN), '00:00');
  assert.equal(formatTime(Infinity), '00:00');
});

test('normalizeLoopPoints: trả về null khi thiếu mốc A hoặc B', () => {
  assert.equal(normalizeLoopPoints(null, null, 100), null);
  assert.equal(normalizeLoopPoints(10, null, 100), null);
  assert.equal(normalizeLoopPoints(null, 20, 100), null);
});

test('normalizeLoopPoints: xử lý mốc chuẩn hợp lệ', () => {
  const result = normalizeLoopPoints(10, 20, 100);
  assert.deepEqual(result, { loopA: 10, loopB: 20 });
});

test('normalizeLoopPoints: tự động hoán đổi khi đặt B trước A (SPEC-10 §2.2)', () => {
  const result = normalizeLoopPoints(30, 10, 100);
  assert.deepEqual(result, { loopA: 10, loopB: 30 });
});

test('normalizeLoopPoints: ràng buộc khoảng cách tối thiểu B > A + 0.5s', () => {
  const result = normalizeLoopPoints(10, 10.2, 100);
  assert.deepEqual(result, { loopA: 10, loopB: 10.5 });
});

test('normalizeLoopPoints: giới hạn trong khoảng thời lượng [0, duration]', () => {
  const result = normalizeLoopPoints(-5, 120, 100);
  assert.deepEqual(result, { loopA: 0, loopB: 100 });
});

test('isTypingTarget: phát hiện khi focus vào ô nhập liệu', () => {
  assert.equal(isTypingTarget(null), false);
  assert.equal(isTypingTarget({ tagName: 'DIV' } as unknown as EventTarget), false);
  assert.equal(isTypingTarget({ tagName: 'BUTTON' } as unknown as EventTarget), false);
  assert.equal(isTypingTarget({ tagName: 'INPUT' } as unknown as EventTarget), true);
  assert.equal(isTypingTarget({ tagName: 'TEXTAREA' } as unknown as EventTarget), true);
  assert.equal(isTypingTarget({ tagName: 'SELECT' } as unknown as EventTarget), true);
  assert.equal(
    isTypingTarget({ tagName: 'DIV', isContentEditable: true } as unknown as EventTarget),
    true
  );
});
