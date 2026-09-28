/**
 * Logic xác định trạng thái active của mục điều hướng chính theo SPEC-16 & DESIGN.md §Navigation.
 *
 * Quy tắc:
 * - '/' chỉ active khi pathname chính xác là '/'.
 * - '/hoc/tra-cuu' active khi ở hub tra cứu và mọi route con (/hoc/tra-cuu/*).
 * - '/hoc' active khi ở /hoc hoặc chi tiết bài học (/hoc/*) NGOẠI TRỪ các route thuộc /hoc/tra-cuu.
 * - Các mục khác active khi khớp chính xác hoặc là tiền tố đường dẫn.
 */
export function isNavActive(itemHref: string, pathname: string): boolean {
  if (itemHref === '/') {
    return pathname === '/';
  }
  if (itemHref === '/hoc/tra-cuu') {
    return pathname === '/hoc/tra-cuu' || pathname.startsWith('/hoc/tra-cuu/');
  }
  if (itemHref === '/hoc') {
    const isTraCuu = pathname === '/hoc/tra-cuu' || pathname.startsWith('/hoc/tra-cuu/');
    return !isTraCuu && (pathname === '/hoc' || pathname.startsWith('/hoc/'));
  }
  return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
}

/**
 * Kiểm tra xem một route có phải là phiên toàn màn hình (fullscreen session)
 * cần ẩn toàn bộ chrome điều hướng (header mobile, dock, sidebar desktop) hay không.
 *
 * Áp dụng cho:
 * - /luyen-tap/phien (phiên luyện tập)
 * - /on-tap/phien (phiên ôn tập FSRS)
 * - /hoc/[so]/tu-vung (phiên flashcard từ vựng theo bài)
 */
export function shouldHideAppChrome(pathname: string): boolean {
  if (pathname === '/luyen-tap/phien' || pathname.startsWith('/luyen-tap/phien/')) {
    return true;
  }
  if (pathname === '/on-tap/phien' || pathname.startsWith('/on-tap/phien/')) {
    return true;
  }
  if (/^\/hoc\/[^/]+\/tu-vung(\/.*)?$/.test(pathname)) {
    return true;
  }
  return false;
}
