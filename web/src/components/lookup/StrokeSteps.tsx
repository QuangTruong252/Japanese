/** Thứ tự nét từng bước: ô thứ i vẽ nét 1..i, nét mới nhất màu đỏ, phần chưa viết mờ phía sau. */
export function StrokeSteps({ strokes, label }: { strokes: string[]; label: string }) {
  return (
    <ol aria-label={label} className="grid grid-cols-4 gap-3">
      {strokes.map((_, i) => (
        <li key={i} className="relative rounded-xl border border-border bg-card p-1.5">
          <span className="absolute left-2 top-1 font-serif text-sm font-semibold text-primary">{i + 1}</span>
          <svg
            viewBox="0 0 109 109"
            aria-hidden="true"
            className="aspect-square w-full"
            fill="none"
            stroke="currentColor"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <g className="text-muted-foreground opacity-25">
              {strokes.map((d, j) => (
                <path key={j} d={d} />
              ))}
            </g>
            {strokes.slice(0, i + 1).map((d, j) => (
              <path key={j} d={d} className={j === i ? 'text-primary' : 'text-foreground'} />
            ))}
          </svg>
        </li>
      ))}
    </ol>
  );
}
