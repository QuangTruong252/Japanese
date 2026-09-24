'use client';

import { ViewTransition, useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { navDirection } from '@/lib/nav-direction';

// Chuyển trang bằng View Transitions (DESIGN.md §Motion). Key theo pathname để trang cũ/mới
// thành cặp exit/enter. Hướng trượt đặt vào --nav-dir trong layout effect: chạy trong lúc
// React cập nhật DOM, trước khi trình duyệt dựng pseudo-element nên CSS đọc được giá trị mới.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prev = useRef(pathname);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--nav-dir', String(navDirection(prev.current, pathname)));
    prev.current = pathname;
  }, [pathname]);

  return (
    <ViewTransition key={pathname} enter="page" exit="page" default="none">
      {children}
    </ViewTransition>
  );
}
