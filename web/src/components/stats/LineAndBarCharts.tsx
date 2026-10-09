import type { DayValue } from '@/lib/stats';

// Hộp vẽ hẹp để chữ trục không bị thu nhỏ quá mức ở 360 px; SVG co theo chiều rộng khung.
const VIEW_W = 340;
const LEFT = 34;
const RIGHT = 336;
const TOP = 20;
const BASE = 130;

const FRAME = 'w-full max-w-xl overflow-visible';

/** Biểu đồ cột phút học; cột cao nhất có nhãn `{n}p`. Nhãn trục X thưa dần để không chồng. */
export function MinutesBarChart({ data }: { data: DayValue[] }) {
  const maxMinutes = Math.max(...data.map((d) => d.value), 30);
  const highest = data.reduce((prev, curr) => (curr.value > prev.value ? curr : prev));
  const slot = (RIGHT - LEFT) / data.length;
  const barW = slot * 0.68;
  const last = data.length - 1;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} 160`}
      className={FRAME}
      role="img"
      aria-label={`Biểu đồ cột thời lượng học 14 ngày qua. Ngày cao nhất là ${highest.label} với ${highest.value} phút.`}
    >
      <line x1={LEFT} y1={TOP} x2={RIGHT} y2={TOP} className="stroke-border" strokeDasharray="3 3" />
      <line x1={LEFT} y1={(TOP + BASE) / 2} x2={RIGHT} y2={(TOP + BASE) / 2} className="stroke-border" strokeDasharray="3 3" />
      <line x1={LEFT} y1={BASE} x2={RIGHT} y2={BASE} className="stroke-border" />

      <text x={LEFT - 6} y={TOP + 4} textAnchor="end" className="fill-muted-foreground text-xs">
        {maxMinutes}p
      </text>
      <text x={LEFT - 6} y={(TOP + BASE) / 2 + 4} textAnchor="end" className="fill-muted-foreground text-xs">
        {Math.round(maxMinutes / 2)}p
      </text>
      <text x={LEFT - 6} y={BASE + 4} textAnchor="end" className="fill-muted-foreground text-xs">
        0
      </text>

      {data.map((item, i) => {
        const x = LEFT + i * slot + (slot - barW) / 2;
        const barH = item.value > 0 ? Math.max(3, Math.round((item.value / maxMinutes) * (BASE - TOP))) : 0;
        const isHighest = item === highest && item.value > 0;
        const showLabel = i === last || (i % 4 === 0 && last - i >= 3);

        return (
          <g key={item.dayKey}>
            <title>{`${item.label}: ${item.value} phút`}</title>
            {barH > 0 && <rect x={x} y={BASE - barH} width={barW} height={barH} rx="2" className="fill-primary" />}
            {isHighest && (
              <text x={x + barW / 2} y={BASE - barH - 4} textAnchor="middle" className="fill-foreground text-xs font-bold">
                {item.value}p
              </text>
            )}
            {showLabel && (
              <text x={x + barW / 2} y={BASE + 18} textAnchor="middle" className="fill-muted-foreground text-xs">
                {item.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Đường tỷ lệ đúng 30 ngày: ngày không học để khoảng trống, mỗi ngày có dữ liệu một chấm tròn. */
export function AccuracyLineChart({ data }: { data: DayValue[] }) {
  const step = (RIGHT - LEFT - 6) / (data.length - 1);
  const xAt = (idx: number) => LEFT + 4 + idx * step;
  const yAt = (value: number) => BASE - (value / 100) * (BASE - TOP);

  // Gộp các ngày có dữ liệu liền nhau thành một đoạn để đường đứt ở ngày nghỉ.
  const segments: { idx: number; item: DayValue }[][] = [];
  let current: { idx: number; item: DayValue }[] = [];
  data.forEach((item, idx) => {
    if (item.hasData) {
      current.push({ idx, item });
    } else if (current.length > 0) {
      segments.push(current);
      current = [];
    }
  });
  if (current.length > 0) segments.push(current);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} 160`}
      className={FRAME}
      role="img"
      aria-label="Biểu đồ đường tỷ lệ trả lời đúng trong 30 ngày qua. Ngày không có bài học được để khoảng trống."
    >
      <line x1={LEFT} y1={TOP} x2={RIGHT} y2={TOP} className="stroke-border" strokeDasharray="3 3" />
      <line x1={LEFT} y1={(TOP + BASE) / 2} x2={RIGHT} y2={(TOP + BASE) / 2} className="stroke-border" strokeDasharray="3 3" />
      <line x1={LEFT} y1={BASE} x2={RIGHT} y2={BASE} className="stroke-border" />

      <text x={LEFT - 6} y={TOP + 4} textAnchor="end" className="fill-muted-foreground text-xs">
        100%
      </text>
      <text x={LEFT - 6} y={(TOP + BASE) / 2 + 4} textAnchor="end" className="fill-muted-foreground text-xs">
        50%
      </text>
      <text x={LEFT - 6} y={BASE + 4} textAnchor="end" className="fill-muted-foreground text-xs">
        0%
      </text>

      {segments.map((segment, sIdx) =>
        segment.length > 1 ? (
          <polyline
            key={sIdx}
            fill="none"
            className="stroke-primary"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={segment.map(({ idx, item }) => `${xAt(idx)},${yAt(item.value)}`).join(' ')}
          />
        ) : null,
      )}

      {data.map((item, idx) =>
        item.hasData ? (
          <g key={item.dayKey}>
            <title>{`${item.label}: ${item.value}% đúng (${item.correctCount}/${item.totalQuestions} câu)`}</title>
            <circle cx={xAt(idx)} cy={yAt(item.value)} r="4" className="fill-primary stroke-background" strokeWidth="1.5" />
          </g>
        ) : null,
      )}

      {data.map((item, idx) =>
        idx % 5 === 0 || idx === data.length - 1 ? (
          <text key={item.dayKey} x={xAt(idx)} y={BASE + 18} textAnchor="middle" className="fill-muted-foreground text-xs">
            {item.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}
