/** Một bước viết: nét 1..step-1 màu chữ, nét `step` màu đỏ, phần chưa viết mờ. */
export function StrokeStep({
  strokes,
  step,
  strokeWidth,
  className,
}: {
  strokes: string[];
  step: number;
  strokeWidth: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 109 109"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {strokes.map((d, k) => (
        <path
          key={k}
          d={d}
          className={k < step ? 'text-foreground' : k === step ? 'text-primary' : 'text-muted-foreground opacity-25'}
        />
      ))}
    </svg>
  );
}

/** Thứ tự nét từng bước: ô thứ i vẽ nét 1..i, nét mới nhất màu đỏ, phần chưa viết mờ phía sau. */
export function StrokeSteps({ strokes, label }: { strokes: string[]; label: string }) {
  return (
    <ol aria-label={label} className="grid grid-cols-4 gap-3">
      {strokes.map((_, i) => (
        <li key={i} className="relative rounded-xl border border-border bg-card p-1.5">
          <span className="absolute left-2 top-1 font-serif text-sm font-semibold text-primary">{i + 1}</span>
          <StrokeStep strokes={strokes} step={i} strokeWidth={4} className="aspect-square w-full" />
        </li>
      ))}
    </ol>
  );
}
