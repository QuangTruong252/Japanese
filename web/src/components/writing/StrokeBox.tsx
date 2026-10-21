'use client';

import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { matchStroke, type Point } from '@/lib/stroke-match';
import { cn } from '@/lib/utils';

export type StrokeBoxMode = 'watch' | 'trace' | 'guided' | 'recall';
export interface StrokeBoxResult {
  misses: number;
  hintUsed: boolean;
}
export interface StrokeBoxHandle {
  replay(): void;
  clear(): void;
  reveal(): void;
}
export interface StrokeBoxProps {
  /** Path `d` từng nét theo thứ tự, hệ 109×109. */
  strokes: string[];
  /** Vị trí số thứ tự nét. */
  numbers: [number, number][];
  mode: StrokeBoxMode;
  /** aria-label của ô, vd. "Ô viết chữ a". */
  label: string;
  onComplete: (result: StrokeBoxResult) => void;
  ref?: React.Ref<StrokeBoxHandle>;
  className?: string;
}

const BOX = 109;
const HINT_AFTER_MISSES = 3;
const SAMPLE_POINTS = 32;
const HINT_MS = 1200;
const STROKE_GAP_MS = 150;
const REDUCED_REPLAY_MS = 2000;
const SHAKE_CLASS = 'motion-safe:animate-jp-shake';

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const subscribeReducedMotion = (cb: () => void) => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const getReducedMotionServer = () => false;

// Một cú chạm vẫn phải ra chấm: thêm đoạn gần như bằng 0 để nét tròn có cái để vẽ.
const inkPath = (pts: Point[]) =>
  pts.length === 0
    ? ''
    : `M${pts[0].x} ${pts[0].y}` + (pts.length === 1 ? 'l0.01 0' : pts.slice(1).map((p) => `L${p.x} ${p.y}`).join(''));

/**
 * Đổi `strokes` hoặc `mode` giữa chừng thì tiến độ cũ vô nghĩa: key buộc dựng lại ô từ đầu,
 * thay vì để mực, số lỗi và điểm mẫu của chữ cũ chấm nhầm vào chữ mới.
 */
export function StrokeBox(props: StrokeBoxProps) {
  return <StrokeBoxInner key={`${props.mode}\n${props.strokes.join('\n')}`} {...props} />;
}

function StrokeBoxInner({ strokes, numbers, mode, label, onComplete, ref, className }: StrokeBoxProps) {
  const total = strokes.length;
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionServer);

  const [done, setDone] = useState(0);
  const [ink, setInk] = useState<Point[]>([]);
  const [hintStroke, setHintStroke] = useState<number | null>(null);
  const [samples, setSamples] = useState<Point[][]>([]);
  const [playing, setPlaying] = useState(mode === 'watch');
  const [playId, setPlayId] = useState(mode === 'watch' ? 1 : 0);
  const [status, setStatus] = useState('');

  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const sampleRefs = useRef<(SVGPathElement | null)[]>([]);
  const animRefs = useRef<(SVGPathElement | null)[]>([]);
  const pointerId = useRef<number | null>(null);
  const points = useRef<Point[]>([]);
  const doneRef = useRef(0);
  const misses = useRef(0);
  const missesOnStroke = useRef(0);
  const hintUsed = useRef(false);
  const completed = useRef(false);
  const afterPlay = useRef<(() => void) | null>(null);
  // Ref song song với `playing`: handler con trỏ cần giá trị tức thời, không đợi render.
  const playingRef = useRef(mode === 'watch');

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const complete = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    setStatus('Đã xong');
    onCompleteRef.current({ misses: misses.current, hintUsed: hintUsed.current });
  }, []);

  // Điểm mẫu của từng nét: đo một lần trên path mẫu đang render (ẩn).
  useLayoutEffect(() => {
    setSamples(
      sampleRefs.current.slice(0, total).map((el) => {
        if (!el) return [];
        const len = el.getTotalLength();
        return Array.from({ length: SAMPLE_POINTS }, (_, i) => {
          const p = el.getPointAtLength((len * i) / (SAMPLE_POINTS - 1));
          return { x: p.x, y: p.y };
        });
      }),
    );
  }, [total]);

  // Hoạt ảnh thứ tự nét: tạo hết animation một lượt với delay cộng dồn, nên không khung hình nào
  // thấy nét chưa tới lượt, và hủy là hủy sạch.
  useLayoutEffect(() => {
    if (playId === 0 || !playing) return;
    let cancelled = false;
    const finish = () => {
      if (cancelled) return;
      if (mode === 'watch') complete();
      else {
        playingRef.current = false;
        setPlaying(false);
      }
      const cb = afterPlay.current;
      afterPlay.current = null;
      cb?.();
    };

    if (reduced) {
      // Không chuyển động: hiện tĩnh kèm số thứ tự; `watch` xong ngay, chế độ khác tự ẩn sau một lúc.
      if (mode === 'watch') {
        finish();
        return () => {
          cancelled = true;
        };
      }
      const t = setTimeout(finish, REDUCED_REPLAY_MS);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }

    const anims: Animation[] = [];
    let delay = 0;
    for (const el of animRefs.current.slice(0, total)) {
      if (!el) continue;
      const len = el.getTotalLength();
      const duration = Math.min(900, Math.max(250, len * 12));
      el.style.strokeDasharray = `${len} ${len}`;
      anims.push(
        el.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
          duration,
          delay,
          easing: 'ease-in-out',
          fill: 'both',
        }),
      );
      delay += duration + STROKE_GAP_MS;
    }
    Promise.all(anims.map((a) => a.finished)).then(finish, () => {});
    return () => {
      cancelled = true;
      anims.forEach((a) => a.cancel());
    };
  }, [playId, playing, reduced, mode, total, complete]);

  useEffect(() => {
    if (hintStroke === null) return;
    const t = setTimeout(() => setHintStroke(null), HINT_MS);
    return () => clearTimeout(t);
  }, [hintStroke]);

  // Bỏ nét đang viết dở và trả con trỏ đang bị giữ.
  const abortStroke = useCallback(() => {
    const id = pointerId.current;
    if (id !== null && svgRef.current?.hasPointerCapture(id)) svgRef.current.releasePointerCapture(id);
    pointerId.current = null;
    points.current = [];
    setInk([]);
  }, []);

  const play = useCallback(() => {
    abortStroke();
    playingRef.current = true;
    setPlaying(true);
    setPlayId((n) => n + 1);
  }, [abortStroke]);

  useImperativeHandle(
    ref,
    () => ({
      replay: play,
      clear() {
        if (mode === 'watch') return;
        // Hủy lượt phát đang chạy: `playing` về false làm effect dọn animation/timer.
        afterPlay.current = null;
        playingRef.current = false;
        setPlaying(false);
        abortStroke();
        doneRef.current = 0;
        missesOnStroke.current = 0;
        setDone(0);
        setHintStroke(null);
      },
      reveal() {
        if (mode !== 'watch' && !completed.current) {
          hintUsed.current = true;
          afterPlay.current = () => {
            doneRef.current = total;
            setDone(total);
            setInk([]);
            complete();
          };
        }
        play();
      },
    }),
    [play, abortStroke, mode, total, complete],
  );

  const toBox = (e: React.PointerEvent<SVGSVGElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) * BOX) / rect.width, y: ((e.clientY - rect.top) * BOX) / rect.height };
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const canDraw = mode !== 'watch' && !playingRef.current && doneRef.current < total && !completed.current;
    // Chỉ theo con trỏ đầu tiên: ngón thứ hai đặt xuống trong lúc đang viết bị bỏ qua.
    if (pointerId.current !== null || !canDraw || samples.length === 0) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    points.current = [toBox(e)];
    setInk(points.current);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (playingRef.current || e.pointerId !== pointerId.current) return;
    points.current = [...points.current, toBox(e)];
    setInk(points.current);
  };

  // Hệ điều hành cướp con trỏ (cuộn, cử chỉ hệ thống): bỏ nét dở, không tính lỗi vì người học chưa nộp nét.
  const onPointerCancel = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerId !== pointerId.current) return;
    pointerId.current = null;
    points.current = [];
    setInk([]);
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (playingRef.current || e.pointerId !== pointerId.current) return;
    pointerId.current = null;
    const drawn = [...points.current, toBox(e)];
    points.current = [];
    setInk([]);

    const index = doneRef.current;
    if (matchStroke(drawn, samples[index] ?? []).ok) {
      doneRef.current = index + 1;
      missesOnStroke.current = 0;
      setDone(index + 1);
      setHintStroke(null);
      if (index + 1 >= total) complete();
      else setStatus(`Nét ${index + 1}/${total}`);
      return;
    }

    misses.current += 1;
    missesOnStroke.current += 1;
    // Nội dung khác nhau giữa các lần trượt liên tiếp để vùng live luôn có thay đổi để đọc.
    setStatus(`Chưa đúng nét ${index + 1}` + (missesOnStroke.current > 1 ? `, lần ${missesOnStroke.current}` : ''));
    // Gỡ rồi gắn lại class để rung chạy lại cả khi lần trượt trước chưa rung xong.
    const box = boxRef.current;
    if (box) {
      box.classList.remove(SHAKE_CLASS);
      void box.offsetWidth;
      box.classList.add(SHAKE_CLASS);
    }
    if (missesOnStroke.current >= HINT_AFTER_MISSES) {
      hintUsed.current = true;
      setHintStroke(index);
    }
  };

  const nextStart = mode === 'guided' && done < total ? samples[done]?.[0] : undefined;

  return (
    <div
      ref={boxRef}
      className={cn('relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-card', className)}
    >
      <span aria-hidden="true" className="absolute inset-y-2 left-1/2 border-l border-dashed border-border" />
      <span aria-hidden="true" className="absolute inset-x-2 top-1/2 border-t border-dashed border-border" />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${BOX} ${BOX}`}
        role="img"
        aria-label={label}
        className="absolute inset-0 size-full touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <g aria-hidden="true" className="invisible">
          {strokes.map((d, i) => (
            <path
              key={i}
              d={d}
              ref={(el) => {
                sampleRefs.current[i] = el;
              }}
            />
          ))}
        </g>

        {mode === 'trace' && (
          <g aria-hidden="true" className="text-muted-foreground opacity-25">
            {strokes.map((d, i) => (
              <path key={i} d={d} {...strokeProps} />
            ))}
          </g>
        )}

        <g className="text-foreground">
          {strokes.slice(0, done).map((d, i) => (
            <path key={i} d={d} {...strokeProps} />
          ))}
        </g>

        {hintStroke !== null && (
          <path d={strokes[hintStroke]} {...strokeProps} className="text-primary motion-safe:animate-pulse" />
        )}

        {nextStart && <circle cx={nextStart.x} cy={nextStart.y} r={3.5} fill="currentColor" className="text-primary" />}

        {ink.length > 0 && <path d={inkPath(ink)} {...strokeProps} className="text-foreground" />}

        {playing && (
          <g className="text-foreground">
            {strokes.map((d, i) => (
              <path
                key={i}
                d={d}
                {...strokeProps}
                ref={(el) => {
                  animRefs.current[i] = el;
                }}
              />
            ))}
            {reduced &&
              numbers.slice(0, total).map(([x, y], i) => (
                <text key={i} x={x} y={y} fontSize={6} className="fill-muted-foreground">
                  {i + 1}
                </text>
              ))}
          </g>
        )}
      </svg>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {status}
      </span>
    </div>
  );
}
