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
