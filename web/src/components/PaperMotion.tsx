'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { countUpValue } from '@/lib/count-up';

/** Phần chuyển động cần JS của bộ thành phần giấy. Phần còn lại của bộ nằm ở PaperKit (server-safe). */

/**
 * Bề mặt có vệt sáng theo con trỏ (lớp `.spotlight`). Chỉ ghi `--mx/--my` lên phần tử, không setState,
 * nên di chuột không render lại. Cảm ứng cũng ghi nhưng CSS chỉ vẽ vệt sáng khi có chuột.
 */
export function SpotlightSurface({
  as: Tag = 'div',
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={className}
      onPointerMove={(e: React.PointerEvent<HTMLElement>) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </Tag>
  );
}

const COUNT_UP_MS = 600;

/**
 * Số chạy từ 0 tới `value` một lần, khi lần đầu lọt vào màn hình. SSR, không JS, giảm chuyển động hay đổi
 * `value` sau đó đều hiện thẳng giá trị cuối (`tabular-nums` để không nhảy bố cục).
 */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const played = useRef(false);
  const [frame, setFrame] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!el || played.current || value === 0 || reduce.matches) return;

    let raf = 0;
    const stop = () => {
      cancelAnimationFrame(raf);
      setFrame(null);
    };
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      played.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        if (reduce.matches || now - start >= COUNT_UP_MS) return stop();
        setFrame(countUpValue(value, now - start, COUNT_UP_MS));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);

    return () => {
      io.disconnect();
      stop();
    };
  }, [value]);

  return (
    <span ref={ref} className={className ? `tabular-nums ${className}` : 'tabular-nums'}>
      {frame ?? value}
    </span>
  );
}
