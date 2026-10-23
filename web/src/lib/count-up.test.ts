import test from 'node:test';
import assert from 'node:assert/strict';
import { countUpValue } from './count-up.ts';

test('0 ms thì bắt đầu từ 0', () => {
  assert.equal(countUpValue(120, 0, 600), 0);
});

test('hết thời gian thì đúng target', () => {
  assert.equal(countUpValue(120, 600, 600), 120);
  assert.equal(countUpValue(120, 5000, 600), 120);
});

test('không bao giờ vượt target và tăng dần', () => {
  let prev = 0;
  for (let ms = 0; ms <= 700; ms += 25) {
    const v = countUpValue(37, ms, 600);
    assert.ok(Number.isInteger(v));
    assert.ok(v >= prev && v <= 37);
    prev = v;
  }
});

test('target 0 luôn là 0', () => {
  assert.equal(countUpValue(0, 0, 600), 0);
  assert.equal(countUpValue(0, 300, 600), 0);
  assert.equal(countUpValue(0, 600, 600), 0);
});
