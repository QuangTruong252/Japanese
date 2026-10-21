'use client';

import { useRef } from 'react';
import { RotateCw } from 'lucide-react';
import { StrokeBox, type StrokeBoxHandle } from './StrokeBox';

/** Ô chữ đầu trang kanji: tự chạy thứ tự nét một lần khi mở, nút tròn để xem lại. */
export function KanjiStrokeView({
  strokes,
  numbers,
  label,
}: {
  strokes: string[];
  numbers: [number, number][];
  label: string;
}) {
  const boxRef = useRef<StrokeBoxHandle>(null);
  return (
    <div className="relative size-32 shrink-0 sm:size-36">
      <StrokeBox ref={boxRef} strokes={strokes} numbers={numbers} mode="watch" label={label} onComplete={() => {}} />
      <button
        type="button"
        aria-label="Xem lại thứ tự nét"
        onClick={() => boxRef.current?.replay()}
        className="absolute -bottom-2 -right-2 flex size-10 items-center justify-center rounded-full border border-border bg-card text-primary shadow-xs outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring"
      >
        <RotateCw className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
