import assert from 'node:assert/strict';
import test from 'node:test';
import { verticalRoleIndex } from './role-navigation.ts';

test('hai vai cùng hàng không di chuyển bằng phím lên/xuống', () => {
  for (const index of [0, 1]) {
    assert.equal(verticalRoleIndex(index, 2, 'ArrowDown'), index);
    assert.equal(verticalRoleIndex(index, 2, 'ArrowUp'), index);
  }
});

test('lưới nhiều hàng giữ nguyên cột và dừng ở mép, kể cả hàng cuối thiếu ô', () => {
  assert.equal(verticalRoleIndex(0, 4, 'ArrowDown'), 2);
  assert.equal(verticalRoleIndex(1, 4, 'ArrowDown'), 3);
  assert.equal(verticalRoleIndex(2, 4, 'ArrowUp'), 0);
  assert.equal(verticalRoleIndex(3, 4, 'ArrowUp'), 1);
  assert.equal(verticalRoleIndex(0, 4, 'ArrowUp'), 0);
  assert.equal(verticalRoleIndex(3, 4, 'ArrowDown'), 3);
  assert.equal(verticalRoleIndex(1, 3, 'ArrowDown'), 1);
  assert.equal(verticalRoleIndex(2, 3, 'ArrowDown'), 2);
});
