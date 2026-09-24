import { test } from 'node:test';
import assert from 'node:assert/strict';
import { navDirection } from './nav-direction.ts';

test('navDirection: vào sâu là tiến, ra ngoài là lùi', () => {
  assert.equal(navDirection('/hoc', '/hoc/3'), 1);
  assert.equal(navDirection('/hoc/3', '/hoc/3/tu-vung'), 1);
  assert.equal(navDirection('/hoc/3/tu-vung', '/hoc/3'), -1);
  assert.equal(navDirection('/hoc/tra-cuu/kanji/日', '/hoc/tra-cuu/kanji'), -1);
});

test('navDirection: đổi tab theo thứ tự nav', () => {
  assert.equal(navDirection('/', '/hoc'), 1);
  assert.equal(navDirection('/thong-ke', '/luyen-tap'), -1);
  assert.equal(navDirection('/on-tap/diem-yeu', '/cai-dat'), 1);
  assert.equal(navDirection('/hoc', '/'), -1);
});

test('navDirection: anh em cùng cấp hoặc trùng trang chỉ mờ dần', () => {
  assert.equal(navDirection('/hoc/1', '/hoc/2'), 0);
  assert.equal(navDirection('/hoc', '/hoc'), 0);
});
