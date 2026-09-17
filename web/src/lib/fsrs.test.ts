import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyReview,
  medianElapsedMs,
  pushElapsedSample,
  Rating,
  rateAnswer,
} from './fsrs.ts';

test('rateAnswer suy ra grade từ đúng/sai + tốc độ', () => {
  assert.equal(rateAnswer(false, 100, 1000), Rating.Again);
  assert.equal(rateAnswer(true, 100, null), Rating.Good); // chưa có median
  assert.equal(rateAnswer(true, 3000, 1000), Rating.Hard); // chậm hơn 2x
  assert.equal(rateAnswer(true, 400, 1000), Rating.Easy); // nhanh hơn 2x
  assert.equal(rateAnswer(true, 400, 1000, true), Rating.Good); // dùng hint thì không Easy
  assert.equal(rateAnswer(true, 1000, 1000), Rating.Good);
});

test('applyReview tạo card mới và dời dueAt về tương lai', () => {
  const now = new Date('2026-01-01T00:00:00Z');
  const first = applyReview(null, Rating.Good, now);
  assert.ok(first.dueAt > now);

  // Again phải cho lịch ôn sớm hơn Good trên cùng một card
  const again = applyReview(first.card, Rating.Again, now);
  const good = applyReview(first.card, Rating.Good, now);
  assert.ok(again.dueAt < good.dueAt);
});

test('medianElapsedMs: mảng rỗng trả null, lẻ lấy giữa, chẵn lấy trung bình hai giữa', () => {
  assert.equal(medianElapsedMs([]), null);
  assert.equal(medianElapsedMs([3000, 1000, 2000]), 2000);
  assert.equal(medianElapsedMs([1000, 2000, 3000, 5000]), 2500);
});

test('pushElapsedSample: giữ đúng 5 mẫu gần nhất', () => {
  let samples: number[] = [];
  for (const ms of [1000, 2000, 3000, 4000, 5000, 6000]) {
    samples = pushElapsedSample(samples, ms);
  }
  assert.deepEqual(samples, [2000, 3000, 4000, 5000, 6000]);
});
