import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lessonProgress, n5Progress } from './n5-progress.ts';

test('lessonProgress: dở dang, xong, khai báo, bài rỗng', () => {
  assert.deepEqual(lessonProgress(1, 10, 40), { number: 1, learned: 10, total: 40, ratio: 0.25, done: false });
  assert.equal(lessonProgress(1, 40, 40).done, true);
  assert.equal(lessonProgress(1, 50, 40).ratio, 1);
  assert.equal(lessonProgress(2, 0, 30, 2).done, true);
  assert.equal(lessonProgress(3, 0, 30, 2).done, false);
  assert.equal(lessonProgress(4, 0, 0).done, false);
});

test('n5Progress: sắp theo số bài, thiếu thì 0', () => {
  const out = n5Progress(new Map([[2, 5]]), new Map([[2, 10], [1, 4]]));
  assert.deepEqual(out.map((p) => [p.number, p.ratio]), [[1, 0], [2, 0.5]]);
});
