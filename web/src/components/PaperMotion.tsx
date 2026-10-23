'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
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
 * Số chạy từ 0 tới `value` khi lần đầu lọt vào màn hình. SSR và không JS hiện thẳng giá trị cuối
 * (không nhảy bố cục); giảm chuyển động thì giữ nguyên giá trị cuối. Ghi thẳng vào DOM mỗi khung hình.
 */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    el.textContent = '0';
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        el.textContent = String(countUpValue(value, now - start, COUNT_UP_MS));
        if (now - start < COUNT_UP_MS) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = String(value);
    };
  }, [value]);

  return (
    <span ref={ref} className={className ? `tabular-nums ${className}` : 'tabular-nums'}>
      {value}
    </span>
  );
}
