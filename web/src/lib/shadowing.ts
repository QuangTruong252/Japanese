/**
 * SPEC-10: Các hàm thuần túy hỗ trợ trình phát Shadowing
 */

/**
 * Định dạng số giây thành chuỗi mm:ss (ví dụ: 42 -> 00:42, 195 -> 03:15)
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '00:00';
  }

  const totalSec = Math.floor(seconds);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;

  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');

  return `${mm}:${ss}`;
}

export interface LoopPoints {
  loopA: number;
  loopB: number;
}

/**
 * Chuẩn hóa các mốc lặp A-B (SPEC-10 §2.2):
 * - Tự động hoán đổi nếu B < A
 * - Ràng buộc B > A + 0.5s
 * - Giới hạn trong khoảng [0, duration]
 */
export function normalizeLoopPoints(
  a: number | null,
  b: number | null,
  duration: number
): LoopPoints | null {
  if (a === null || b === null) {
    return null;
  }
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return null;
  }

  const maxDuration = Math.max(0, duration);

  let start = Math.max(0, Math.min(a, maxDuration));
  let end = Math.max(0, Math.min(b, maxDuration));

  // Hoán đổi nếu đặt B trước A
  if (end < start) {
    const temp = start;
    start = end;
    end = temp;
  }

  // Ràng buộc khoảng cách tối thiểu 0.5s
  if (end < start + 0.5) {
    end = Math.min(maxDuration, start + 0.5);
  }

  return {
    loopA: Math.round(start * 100) / 100,
    loopB: Math.round(end * 100) / 100,
  };
}

/**
 * Kiểm tra xem sự kiện bàn phím có bắt nguồn từ ô nhập liệu hay không
 * để tránh cướp phím của người dùng (SPEC-10 §6)
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') {
    return false;
  }

  const el = target as {
    tagName?: string;
    isContentEditable?: boolean;
  };

  if (el.isContentEditable) {
    return true;
  }

  const tag = el.tagName?.toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}
