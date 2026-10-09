import { isTypingTarget } from './shadowing.ts';

interface KeyTarget {
  tagName?: string;
  getAttribute?: (name: string) => string | null;
}

export interface ShadowingKeyEvent {
  key: string;
  target: EventTarget | null;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

// Phần tử đã dùng Space để kích hoạt (nút, liên kết…): bắt Space ở đây sẽ nuốt cú bấm của người dùng
const SPACE_ROLES = new Set(['button', 'link', 'checkbox', 'switch', 'tab', 'menuitem', 'option', 'radio']);
const SPACE_TAGS = new Set(['BUTTON', 'A', 'SUMMARY']);

// Phần tử đã dùng mũi tên để di chuyển giá trị/lựa chọn của chính nó
const ARROW_ROLES = new Set(['slider', 'tab', 'radio', 'menuitem', 'option', 'listbox', 'spinbutton', 'tablist']);

/**
 * Có nên để trình phát Shadowing xử lý phím này không. Phím tắt chỉ có nghĩa khi bài có track đang
 * dùng được; không có track thì phải trả Space/mũi tên lại cho trình duyệt để trang còn cuộn.
 */
export function shouldHandleShadowingKey(e: ShadowingKeyEvent, hasTrack: boolean): boolean {
  if (!hasTrack) return false;
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  if (isTypingTarget(e.target)) return false;

  const el = (e.target ?? {}) as KeyTarget;
  const tag = el.tagName?.toUpperCase();
  const role = el.getAttribute?.('role') ?? '';

  if (e.key === ' ' && ((tag && SPACE_TAGS.has(tag)) || SPACE_ROLES.has(role))) return false;
  if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && ARROW_ROLES.has(role)) return false;
  return true;
}
