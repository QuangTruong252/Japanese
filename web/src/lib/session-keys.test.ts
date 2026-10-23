import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardKeyAction, optionKeyIndex } from './session-keys.ts';

const press = (key: string, tagName = 'BODY', over = {}) => ({
  key,
  target: { tagName } as unknown as EventTarget,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  ...over,
});

test('thẻ từ: Space/Enter lật, 1–4 chỉ chấm khi đã lật', () => {
  assert.deepEqual(cardKeyAction(press(' '), false, false), { type: 'flip' });
  assert.deepEqual(cardKeyAction(press('Enter'), true, false), { type: 'flip' });
  assert.equal(cardKeyAction(press('3'), false, false), null);
  assert.deepEqual(cardKeyAction(press('3'), true, false), { type: 'rate', grade: 3 });
  assert.equal(cardKeyAction(press('5'), true, false), null);
});

test('thẻ từ: bỏ qua ô nhập, nút, modifier và dialog', () => {
  assert.equal(cardKeyAction(press('1', 'INPUT'), true, false), null);
  assert.equal(cardKeyAction(press(' ', 'BUTTON'), false, false), null);
  assert.deepEqual(cardKeyAction(press('1', 'BUTTON'), true, false), { type: 'rate', grade: 1 });
  assert.equal(cardKeyAction(press('1', 'BODY', { ctrlKey: true }), true, false), null);
  assert.equal(cardKeyAction(press(' '), false, true), null);
});

test('đáp án: 1–n chọn thứ n, ngoài khoảng hoặc có modifier thì bỏ', () => {
  assert.equal(optionKeyIndex(press('1'), 4), 0);
  assert.equal(optionKeyIndex(press('4'), 4), 3);
  assert.equal(optionKeyIndex(press('5'), 4), null);
  assert.equal(optionKeyIndex(press('0'), 4), null);
  assert.equal(optionKeyIndex(press('a'), 4), null);
  assert.equal(optionKeyIndex(press('2', 'TEXTAREA'), 4), null);
  assert.equal(optionKeyIndex(press('2', 'BODY', { metaKey: true }), 4), null);
});
