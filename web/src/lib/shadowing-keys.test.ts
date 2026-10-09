import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldHandleShadowingKey } from './shadowing-keys.ts';

const el = (tagName: string, role?: string) => ({
  tagName,
  getAttribute: (n: string) => (n === 'role' ? (role ?? null) : null),
});
const press = (key: string, target: unknown, over = {}) => ({
  key,
  target: target as EventTarget,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  ...over,
});

test('không có track: không bắt phím nào, để trang cuộn', () => {
  assert.equal(shouldHandleShadowingKey(press(' ', el('BODY')), false), false);
  assert.equal(shouldHandleShadowingKey(press('ArrowRight', el('BODY')), false), false);
});

test('có track: bắt Space và mũi tên khi focus ở thân trang', () => {
  assert.equal(shouldHandleShadowingKey(press(' ', el('BODY')), true), true);
  assert.equal(shouldHandleShadowingKey(press('ArrowLeft', el('DIV')), true), true);
});

test('Space trên nút/liên kết là bấm nút, không bắt', () => {
  assert.equal(shouldHandleShadowingKey(press(' ', el('BUTTON')), true), false);
  assert.equal(shouldHandleShadowingKey(press(' ', el('DIV', 'button')), true), false);
  assert.equal(shouldHandleShadowingKey(press('r', el('BUTTON')), true), true);
});

test('ô nhập và slider giữ phím của chúng', () => {
  assert.equal(shouldHandleShadowingKey(press(' ', el('INPUT')), true), false);
  assert.equal(shouldHandleShadowingKey(press('ArrowLeft', el('DIV', 'slider')), true), false);
});

test('phím kèm Ctrl/Meta/Alt không bắt', () => {
  assert.equal(shouldHandleShadowingKey(press('r', el('BODY'), { ctrlKey: true }), true), false);
});
