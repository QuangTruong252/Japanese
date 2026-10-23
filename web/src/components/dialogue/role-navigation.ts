/** Đi lên/xuống cùng cột trong lưới hai cột; dừng khi không có ô ở hàng kế bên. */
export function verticalRoleIndex(index: number, count: number, key: 'ArrowUp' | 'ArrowDown'): number {
  const next = index + (key === 'ArrowDown' ? 2 : -2);
  return next >= 0 && next < count ? next : index;
}
