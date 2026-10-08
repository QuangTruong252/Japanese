import test from 'node:test';
import assert from 'node:assert/strict';
import { formatNavBadgeCount, isNavActive, shouldHideAppChrome } from './nav.ts';

test('isNavActive: trang chủ "/" chỉ active khi đúng pathname "/"', () => {
  assert.equal(isNavActive('/', '/'), true);
  assert.equal(isNavActive('/', '/hoc'), false);
  assert.equal(isNavActive('/', '/luyen-tap'), false);
  assert.equal(isNavActive('/', '/ca-nhan'), false);
});

test('isNavActive: "/hoc/tra-cuu" active tại hub và toàn bộ route con', () => {
  assert.equal(isNavActive('/hoc/tra-cuu', '/hoc/tra-cuu'), true);
  assert.equal(isNavActive('/hoc/tra-cuu', '/hoc/tra-cuu/kanji'), true);
  assert.equal(isNavActive('/hoc/tra-cuu', '/hoc/tra-cuu/dong-tu'), true);
  assert.equal(isNavActive('/hoc/tra-cuu', '/hoc/tra-cuu/bang'), true);
  assert.equal(isNavActive('/hoc/tra-cuu', '/hoc/tra-cuu/kana'), true);
  assert.equal(isNavActive('/hoc/tra-cuu', '/hoc'), false);
  assert.equal(isNavActive('/hoc/tra-cuu', '/hoc/1'), false);
});

test('isNavActive: "/hoc" active tại danh sách bài và chi tiết bài, KHÔNG active tại tra cứu', () => {
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

test('shouldHideAppChrome: ẩn chrome (header/dock/sidebar) trong các phiên toàn màn hình', () => {
  // Ca đúng (phải ẩn):
  assert.equal(shouldHideAppChrome('/luyen-tap/phien'), true);
  assert.equal(shouldHideAppChrome('/luyen-tap/phien/'), true);
  assert.equal(shouldHideAppChrome('/luyen-tap/phien/ket-qua'), true);
  assert.equal(shouldHideAppChrome('/on-tap/phien'), true);
  assert.equal(shouldHideAppChrome('/on-tap/phien/'), true);
  assert.equal(shouldHideAppChrome('/hoc/1/tu-vung'), true);
  assert.equal(shouldHideAppChrome('/hoc/25/tu-vung'), true);
  assert.equal(shouldHideAppChrome('/hoc/1/tu-vung/'), true);

  // Ca sai (không ẩn, vẫn hiển thị chrome):
  assert.equal(shouldHideAppChrome('/'), false);
  assert.equal(shouldHideAppChrome('/hoc'), false);
  assert.equal(shouldHideAppChrome('/hoc/1'), false);
  assert.equal(shouldHideAppChrome('/hoc/25'), false);
  assert.equal(shouldHideAppChrome('/luyen-tap'), false);
  assert.equal(shouldHideAppChrome('/on-tap'), false);
  assert.equal(shouldHideAppChrome('/on-tap/diem-yeu'), false);
  assert.equal(shouldHideAppChrome('/hoc/tra-cuu'), false);
  assert.equal(shouldHideAppChrome('/hoc/tra-cuu/kanji'), false);
  assert.equal(shouldHideAppChrome('/ca-nhan'), false);
  assert.equal(shouldHideAppChrome('/ca-nhan/thong-ke'), false);
  assert.equal(shouldHideAppChrome('/cai-dat'), false);
});

test('formatNavBadgeCount: định dạng số badge điều hướng', () => {
  // Ca không hiển thị (trả về null):
  assert.equal(formatNavBadgeCount(0), null);
  assert.equal(formatNavBadgeCount(-1), null);
  assert.equal(formatNavBadgeCount(-10), null);
  assert.equal(formatNavBadgeCount(NaN), null);
  assert.equal(formatNavBadgeCount(Infinity), null);

  // Ca hiển thị số nguyên bình thường:
  assert.equal(formatNavBadgeCount(1), '1');
  assert.equal(formatNavBadgeCount(7), '7');
  assert.equal(formatNavBadgeCount(25), '25');
  assert.equal(formatNavBadgeCount(99), '99');

  // Ca cắt 99+ khi lớn hơn 99:
  assert.equal(formatNavBadgeCount(100), '99+');
  assert.equal(formatNavBadgeCount(150), '99+');
  assert.equal(formatNavBadgeCount(999), '99+');
});
