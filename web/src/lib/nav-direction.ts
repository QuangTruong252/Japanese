// Hướng trượt khi chuyển trang: 1 = tiến (vào sâu / tab bên phải), -1 = lùi, 0 = chỉ mờ dần.
// Thứ tự tab khớp NAV_ITEMS trong AppNav, thêm /cai-dat ở cuối như sidebar desktop.
const TAB_ORDER = ['/', '/hoc', '/luyen-tap', '/on-tap', '/thong-ke', '/cai-dat'];

function tabIndex(path: string): number {
  const top = '/' + (path.split('/')[1] ?? '');
  return TAB_ORDER.indexOf(top);
}

export function navDirection(from: string, to: string): -1 | 0 | 1 {
  if (from === to) return 0;
  if (to.startsWith(`${from}/`)) return 1;
  if (from.startsWith(`${to}/`)) return -1;
  const a = tabIndex(from);
  const b = tabIndex(to);
  if (a !== b && a !== -1 && b !== -1) return b > a ? 1 : -1;
  return 0;
}
