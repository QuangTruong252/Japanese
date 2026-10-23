/** Giá trị số nguyên của bộ đếm sau `elapsedMs`: ease-out cubic từ 0 tới `target`, kẹp trong [0, target]. */
export function countUpValue(target: number, elapsedMs: number, durationMs: number): number {
  if (elapsedMs >= durationMs || durationMs <= 0) return target;
  if (elapsedMs <= 0) return 0;
  const t = elapsedMs / durationMs;
  const eased = 1 - (1 - t) ** 3;
  return Math.min(target, Math.max(0, Math.round(target * eased)));
}
