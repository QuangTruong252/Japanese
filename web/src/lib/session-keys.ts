import { isTypingTarget } from './shadowing.ts';

export interface SessionKeyEvent {
  key: string;
  target: EventTarget | null;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

export type CardKeyAction = { type: 'flip' } | { type: 'rate'; grade: 1 | 2 | 3 | 4 };

// Nút/liên kết đã tự kích hoạt bằng Space/Enter; bắt thêm ở đây sẽ lật hai lần.
const ACTIVATABLE_TAGS = new Set(['BUTTON', 'A', 'SUMMARY']);

/**
 * Phím trên thẻ từ: Space/Enter lật, 1–4 chấm điểm (chỉ khi đã lật). Trả null khi phím thuộc về
 * ô nhập, nút đang focus, tổ hợp có modifier, hoặc dialog khác đang mở.
 */
export function cardKeyAction(e: SessionKeyEvent, revealed: boolean, dialogOpen: boolean): CardKeyAction | null {
  if (dialogOpen || e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return null;
  if (e.key === ' ' || e.key === 'Enter') {
    const tag = (e.target as { tagName?: string } | null)?.tagName?.toUpperCase();
    return tag && ACTIVATABLE_TAGS.has(tag) ? null : { type: 'flip' };
  }
  if (revealed && e.key >= '1' && e.key <= '4' && e.key.length === 1) {
    return { type: 'rate', grade: Number(e.key) as 1 | 2 | 3 | 4 };
  }
  return null;
}

/** Phím 1–n chọn đáp án thứ n; trả chỉ số từ 0 hoặc null. */
export function optionKeyIndex(e: SessionKeyEvent, count: number): number | null {
  if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return null;
  const n = /^[1-9]$/.test(e.key) ? Number(e.key) : 0;
  return n >= 1 && n <= count ? n - 1 : null;
}
