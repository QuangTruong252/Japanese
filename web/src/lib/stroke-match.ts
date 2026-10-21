// ponytail: so tọa độ tuyệt đối trong khung 109×109; nếu thực tế chữ viết lệch/nhỏ bị chấm
// trượt nhiều thì thêm chuẩn hóa vị trí và cỡ theo cả chữ.

export interface Point {
  x: number;
  y: number;
}

export type MatchResult = { ok: true } | { ok: false; reason: 'start' | 'end' | 'direction' | 'shape' };

/** Ngưỡng theo đơn vị khung 109×109; nới cho ngón tay, chỉnh sau khi thử trên máy thật. */
// orderMargin/orderRatio: nét chưa viết phải gần hơn cả theo khoảng tuyệt đối lẫn tỉ lệ mới bị coi là vẽ nhầm thứ tự.
export const STROKE_TOLERANCE = { start: 20, end: 22, mean: 15, shortLength: 10, orderMargin: 8, orderRatio: 0.5 };

const SAMPLES = 24;

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

function pathLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += dist(points[i - 1], points[i]);
  return total;
}

/** `n` điểm cách đều theo độ dài đường gấp khúc; điểm đầu và cuối giữ nguyên. */
export function resample(points: Point[], n: number): Point[] {
  if (points.length === 0 || n <= 0) return [];
  const total = pathLength(points);
  if (points.length === 1 || total === 0) return Array.from({ length: n }, () => ({ ...points[0] }));
  if (n === 1) return [{ ...points[0] }];

  const step = total / (n - 1);
  const out: Point[] = [{ ...points[0] }];
  let seg = 1;
  let segStart = 0; // độ dài tích lũy tại points[seg - 1]
  for (let k = 1; k < n - 1; k++) {
    const target = k * step;
    while (seg < points.length - 1 && segStart + dist(points[seg - 1], points[seg]) < target) {
      segStart += dist(points[seg - 1], points[seg]);
      seg++;
    }
    const a = points[seg - 1];
    const b = points[seg];
    const len = dist(a, b);
    const t = len === 0 ? 0 : Math.min(1, Math.max(0, (target - segStart) / len));
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  out.push({ ...points[points.length - 1] });
  return out;
}

function meanPairDistance(a: Point[], b: Point[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += dist(a[i], b[i]);
  return sum / a.length;
}

function centroid(points: Point[]): Point {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

export function matchStroke(drawn: Point[], expected: Point[], remaining: Point[][] = []): MatchResult {
  if (drawn.length === 0 || expected.length === 0) return { ok: false, reason: 'shape' };
  const tol = STROKE_TOLERANCE;

  // Lấy mẫu đều trước: trọng tâm trên điểm thô lệch theo mật độ sự kiện pointermove.
  const d = resample(drawn, SAMPLES);
  const e = resample(expected, SAMPLES);
  const dForward = meanPairDistance(d, e);

  // Chỉ bắt nhầm thứ tự khi nét chưa viết gần hơn rõ rệt; chừa sai số cho ngón tay lệch.
  const closerToLater = remaining.some((stroke) => {
    if (stroke.length === 0) return false;
    const other = meanPairDistance(d, resample(stroke, SAMPLES));
    return other + tol.orderMargin < dForward && other < dForward * tol.orderRatio;
  });
  if (closerToLater) return { ok: false, reason: 'shape' };

  if (pathLength(expected) < tol.shortLength) {
    return dist(centroid(d), centroid(e)) <= tol.start ? { ok: true } : { ok: false, reason: 'shape' };
  }

  const dReverse = meanPairDistance(d, [...e].reverse());
  if (dReverse < dForward && dReverse <= tol.mean) return { ok: false, reason: 'direction' };
  if (dist(d[0], e[0]) > tol.start) return { ok: false, reason: 'start' };
  if (dist(d[SAMPLES - 1], e[SAMPLES - 1]) > tol.end) return { ok: false, reason: 'end' };
  if (dForward > tol.mean) return { ok: false, reason: 'shape' };
  return { ok: true };
}
