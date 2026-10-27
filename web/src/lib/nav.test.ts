import test from 'node:test';
import assert from 'node:assert/strict';
import { formatNavBadgeCount, isNavActive, legacyPracticeConfigHref, shouldHideAppChrome, trackPath, writingBackHref } from './nav.ts';

test('link cấu hình cũ giữ tham số và đi thẳng vào Bài tập, hub không bị chuyển tiếp', () => {
  assert.equal(legacyPracticeConfigHref({}), null);
  assert.equal(legacyPracticeConfigHref({ q: 'nghe' }), null);
  const target = legacyPracticeConfigHref({ lessons: ['1,2', '3'], type: 'listening', q: 'a&b', empty: '' });
  assert.ok(target);
  const url = new URL(target, 'https://maipace.test');
  assert.equal(url.pathname, '/luyen-tap/bai-tap');
  assert.deepEqual(url.searchParams.getAll('lessons'), ['1,2', '3']);
  assert.equal(url.searchParams.get('type'), 'listening');
  assert.equal(url.searchParams.get('q'), 'a&b');
  assert.equal(url.searchParams.get('empty'), '');
  assert.equal(legacyPracticeConfigHref({ lessons: '' }), '/luyen-tap/bai-tap?lessons=');
});

test('hub và cấu hình cùng active Luyện tập, cấu hình vẫn có app chrome', () => {
  assert.equal(isNavActive('/luyen-tap', '/luyen-tap/bai-tap'), true);
  assert.equal(isNavActive('/luyen-tap', '/luyen-tap/hoi-thoai'), true);
  assert.equal(shouldHideAppChrome('/luyen-tap/bai-tap'), false);
  assert.equal(shouldHideAppChrome('/luyen-tap/hoi-thoai'), false);
});

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

test('isNavActive: "/luyen-tap" cũng active ở /luyen-viet và trang con', () => {
  assert.equal(isNavActive('/luyen-tap', '/luyen-viet'), true);
  assert.equal(isNavActive('/luyen-tap', '/luyen-viet/hiragana'), true);
  assert.equal(isNavActive('/luyen-tap', '/luyen-vietnam'), false);
  assert.equal(isNavActive('/on-tap', '/luyen-viet'), false);
  assert.equal(isNavActive('/', '/luyen-viet'), false);
});

test('shouldHideAppChrome: ẩn chrome (header/dock/sidebar) trong các phiên toàn màn hình', () => {
  assert.equal(isNavActive('/luyen-tap', '/nghe-moi-ngay'), true);
  assert.equal(isNavActive('/luyen-tap', '/nghe-moi-ngay/phien'), true);
  assert.equal(isNavActive('/luyen-tap', '/nghe-moi-ngay-khac'), false);
  assert.equal(shouldHideAppChrome('/nghe-moi-ngay/phien'), true);
  assert.equal(shouldHideAppChrome('/nghe-moi-ngay'), false);
  assert.equal(isNavActive('/luyen-tap', '/luyen-tap/dich-cau'), true);
  assert.equal(isNavActive('/luyen-tap', '/luyen-tap/dich-cau/phien'), true);
  assert.equal(shouldHideAppChrome('/luyen-tap/dich-cau/phien'), true);
  assert.equal(shouldHideAppChrome('/luyen-tap/dich-cau/phien/'), true);
  assert.equal(shouldHideAppChrome('/luyen-tap/dich-cau'), false);
  // Ca đúng (phải ẩn):
  assert.equal(shouldHideAppChrome('/luyen-tap/phien'), true);
  assert.equal(shouldHideAppChrome('/luyen-tap/phien/'), true);
  assert.equal(shouldHideAppChrome('/luyen-tap/phien/ket-qua'), true);
  assert.equal(shouldHideAppChrome('/on-tap/phien'), true);
  assert.equal(shouldHideAppChrome('/on-tap/phien/'), true);
  assert.equal(shouldHideAppChrome('/luyen-viet/phien'), true);
  assert.equal(shouldHideAppChrome('/hoc/1/tu-vung'), true);
  assert.equal(shouldHideAppChrome('/hoc/25/tu-vung'), true);
  assert.equal(shouldHideAppChrome('/hoc/1/tu-vung/'), true);
  assert.equal(shouldHideAppChrome('/hoc/1/hoi-thoai/l01-dong-nghiep-moi'), true);
  assert.equal(shouldHideAppChrome('/hoc/25/hoi-thoai/example/'), true);
  assert.equal(shouldHideAppChrome('/hoc/1/hoi-thoai'), false);
  assert.equal(shouldHideAppChrome('/hoc/1/hoi-thoai/'), false);
  assert.equal(shouldHideAppChrome('/hoc/1/hoi-thoai/id/extra'), false);

  // Ca sai (không ẩn, vẫn hiển thị chrome):
  assert.equal(shouldHideAppChrome('/'), false);
  assert.equal(shouldHideAppChrome('/hoc'), false);
  assert.equal(shouldHideAppChrome('/hoc/1'), false);
  assert.equal(shouldHideAppChrome('/hoc/25'), false);
  assert.equal(shouldHideAppChrome('/luyen-tap'), false);
  assert.equal(shouldHideAppChrome('/on-tap'), false);
  assert.equal(shouldHideAppChrome('/luyen-viet'), false);
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

test('writingBackHref: về trang đã mở luyện viết, bỏ qua các bước trong /luyen-viet', () => {
  assert.equal(writingBackHref(), '/');
  trackPath('/hoc/tra-cuu/kana');
  trackPath('/luyen-viet');
  trackPath('/luyen-viet/phien');
  trackPath('/luyen-viet');
  assert.equal(writingBackHref(), '/hoc/tra-cuu/kana');
  trackPath('/');
  trackPath('/luyen-viet/phien');
  assert.equal(writingBackHref(), '/');
});
