import test from 'node:test';
import assert from 'node:assert/strict';
import { isNavActive } from './nav.ts';

test('isNavActive: trang chủ "/" chỉ active khi đúng pathname "/"', () => {
  assert.equal(isNavActive('/', '/'), true);
  assert.equal(isNavActive('/', '/hoc'), false);
  assert.equal(isNavActive('/', '/luyen-tap'), false);
  assert.equal(isNavActive('/', '/ca-nhan'), false);
});

test('isNavActive: "/hoc/tra-cuu" active tại hub và toàn bộ route con (SPEC-16 §3)', () => {
  assert.equal(isNavActive('/hoc/tra-cuu', '/hoc/tra-cuu'), true);
  assert.equal(isNavActive('/hoc/tra-cuu', '/hoc/tra-cuu/kanji'), true);
  assert.equal(isNavActive('/hoc/tra-cuu', '/hoc/tra-cuu/dong-tu'), true);
  assert.equal(isNavActive('/hoc/tra-cuu', '/hoc/tra-cuu/bang'), true);
  assert.equal(isNavActive('/hoc/tra-cuu', '/hoc/tra-cuu/kana'), true);
  assert.equal(isNavActive('/hoc/tra-cuu', '/hoc'), false);
  assert.equal(isNavActive('/hoc/tra-cuu', '/hoc/1'), false);
});

test('isNavActive: "/hoc" active tại danh sách bài và chi tiết bài, KHÔNG active tại tra cứu (SPEC-16 §3)', () => {
  assert.equal(isNavActive('/hoc', '/hoc'), true);
  assert.equal(isNavActive('/hoc', '/hoc/1'), true);
  assert.equal(isNavActive('/hoc', '/hoc/25'), true);
  // Quan trọng: Tra cứu và các route con KHÔNG được làm active Học bài
  assert.equal(isNavActive('/hoc', '/hoc/tra-cuu'), false);
  assert.equal(isNavActive('/hoc', '/hoc/tra-cuu/kanji'), false);
  assert.equal(isNavActive('/hoc', '/hoc/tra-cuu/dong-tu'), false);
  assert.equal(isNavActive('/hoc', '/hoc/tra-cuu/bang'), false);
});

test('isNavActive: "/luyen-tap" và "/on-tap" active đúng tiền tố', () => {
  assert.equal(isNavActive('/luyen-tap', '/luyen-tap'), true);
  assert.equal(isNavActive('/luyen-tap', '/luyen-tap/phien'), true);
  assert.equal(isNavActive('/luyen-tap', '/on-tap'), false);

  assert.equal(isNavActive('/on-tap', '/on-tap'), true);
  assert.equal(isNavActive('/on-tap', '/on-tap/diem-yeu'), true);
  assert.equal(isNavActive('/on-tap', '/hoc'), false);
});
