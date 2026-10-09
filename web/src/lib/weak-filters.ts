import type { TargetType } from '../types/index.ts';

/**
 * Chip lọc cho trang Điểm yếu: chỉ loại thực sự có mục yếu (theo thứ tự `order`), nếu không
 * chip bấm vào luôn trống. Từ 2 loại trở lên mới cần lọc; còn ≤ 1 loại thì trả [] để ẩn cả hàng chip.
 */
export function weakFilterTypes(
  present: ReadonlySet<TargetType>,
  order: readonly TargetType[],
): TargetType[] {
  const types = order.filter((type) => present.has(type));
  return types.length > 1 ? types : [];
}
