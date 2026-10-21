import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchStroke, resample, type Point } from './stroke-match.ts';

const SAMPLES = 24;
const line: Point[] = Array.from({ length: SAMPLES }, (_, i) => ({ x: 20 + (70 * i) / (SAMPLES - 1), y: 50 }));
const arc: Point[] = Array.from({ length: SAMPLES }, (_, i) => {
  const t = (Math.PI * i) / (SAMPLES - 1);
  return { x: 55 - 35 * Math.cos(t), y: 50 + 35 * Math.sin(t) };
});
const seg = (x1: number, y1: number, x2: number, y2: number): Point[] => [
  { x: x1, y: y1 },
  { x: x2, y: y2 },
];

test('resample chia đều theo độ dài', () => {
  const out = resample(seg(0, 0, 10, 0), 5);
  assert.deepEqual(out.map((p) => p.x), [0, 2.5, 5, 7.5, 10]);
});

test('resample: một điểm và rỗng', () => {
  assert.equal(resample([{ x: 3, y: 4 }], 4).length, 4);
  assert.deepEqual(resample([], 4), []);
});

test('nét chép y nguyên đạt', () => {
  assert.deepEqual(matchStroke(line, line), { ok: true });
  assert.deepEqual(matchStroke(arc, arc), { ok: true });
});

test('nét rung đạt', () => {
  const noisy = line.map((p, i) => ({ x: p.x, y: p.y + 5 * Math.sin(i) }));
  assert.deepEqual(matchStroke(noisy, line), { ok: true });
});

test('ngược chiều', () => {
  assert.deepEqual(matchStroke([...line].reverse(), line), { ok: false, reason: 'direction' });
});

test('lệch đầu và lệch cuối', () => {
  assert.deepEqual(matchStroke(seg(50, 50, 90, 50), line), { ok: false, reason: 'start' });
  assert.deepEqual(matchStroke(seg(20, 50, 60, 50), line), { ok: false, reason: 'end' });
});

test('thẳng thay cho cong', () => {
  assert.deepEqual(matchStroke(seg(20, 50, 90, 50), arc), { ok: false, reason: 'shape' });
});

test('nét ngắn chỉ xét vị trí', () => {
  const dot = seg(70, 20, 74, 26);
  assert.deepEqual(matchStroke([{ x: 72, y: 23 }], dot), { ok: true });
  assert.deepEqual(matchStroke([{ x: 20, y: 90 }], dot), { ok: false, reason: 'shape' });
});

test('nét ngắn: cùng đường hình học, mật độ điểm khác nhau cho cùng kết quả', () => {
  const dot = seg(70, 20, 74, 26);
  const sparse = seg(0, 23, 72, 23);
  const dense = [{ x: 0, y: 23 }, ...Array.from({ length: 100 }, () => ({ x: 72, y: 23 }))];
  assert.deepEqual(matchStroke(sparse, dot), { ok: false, reason: 'shape' });
  assert.deepEqual(matchStroke(dense, dot), matchStroke(sparse, dot));
});
