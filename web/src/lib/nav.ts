export function legacyPracticeConfigHref(params: Record<string, string | string[] | undefined>): string | null {
  // Link cấu hình cũ vẫn đi thẳng vào bài tập, giữ cả tham số lặp và giá trị rỗng để bộ kiểm tra hiện có xử lý.
  if (params.lessons === undefined && params.type === undefined) return null;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.append(key, value);
  }
  return `/luyen-tap/bai-tap?${query}`;
}

/**
 * Logic xác định trạng thái active của mục điều hướng chính.
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
  const matches = (base: string) => pathname === base || pathname.startsWith(`${base}/`);
  // Luyện viết là một nhánh của Luyện tập
  if (itemHref === '/luyen-tap' && (matches('/luyen-viet') || matches('/nghe-moi-ngay'))) return true;
  return matches(itemHref);
}

/**
 * Kiểm tra xem một route có phải là phiên toàn màn hình (fullscreen session)
 * cần ẩn toàn bộ chrome điều hướng (header mobile, dock, sidebar desktop) hay không.
 *
 * Áp dụng cho:
 * - /luyen-tap/phien (phiên luyện tập)
 * - /on-tap/phien (phiên ôn tập FSRS)
 * - /luyen-viet/phien (phiên viết chữ: dock che mất vùng vẽ)
 * - /hoc/[so]/tu-vung (phiên flashcard từ vựng theo bài)
 * - /hoc/[so]/hoi-thoai/[id] (phiên nhập vai)
 */
export function shouldHideAppChrome(pathname: string): boolean {
  if (pathname === '/nghe-moi-ngay/phien' || pathname.startsWith('/nghe-moi-ngay/phien/')) return true;
  if (pathname === '/luyen-tap/dich-cau/phien' || pathname.startsWith('/luyen-tap/dich-cau/phien/')) return true;
  if (pathname === '/luyen-tap/phien' || pathname.startsWith('/luyen-tap/phien/')) {
    return true;
  }
  if (pathname === '/on-tap/phien' || pathname.startsWith('/on-tap/phien/')) {
    return true;
  }
  if (pathname === '/luyen-viet/phien' || pathname.startsWith('/luyen-viet/phien/')) {
    return true;
  }
  if (/^\/hoc\/[^/]+\/tu-vung(\/.*)?$/.test(pathname)) {
    return true;
  }
  if (/^\/hoc\/[^/]+\/hoi-thoai\/[^/]+\/?$/.test(pathname)) {
    return true;
  }
  return false;
}

/**
 * Định dạng số hiển thị trên badge điều hướng.
 * Trả về null nếu count <= 0 hoặc không hợp lệ (không hiển thị badge).
 * Cắt '99+' nếu count > 99.
 */
export function formatNavBadgeCount(count: number): string | null {
  if (!Number.isFinite(count) || count <= 0) {
    return null;
  }
  if (count > 99) {
    return '99+';
  }
  return String(Math.floor(count));
}

// Luyện viết có nhiều lối vào (Bảng tin, trang Kana, tìm kiếm) nên nút quay lại trở về trang đã mở nó,
// bỏ qua các bước trong /luyen-viet/*. Biến module sống suốt phiên SPA; tải lại trang thì về Bảng tin.
let currentPath: string | null = null;
let writingOrigin: string | null = null;

const isWriting = (path: string) => path === '/luyen-viet' || path.startsWith('/luyen-viet/');

export function trackPath(path: string): void {
  if (path === currentPath) return;
  if (isWriting(path) && currentPath && !isWriting(currentPath)) writingOrigin = currentPath;
  currentPath = path;
}

export const writingBackHref = (): string => writingOrigin ?? '/';
