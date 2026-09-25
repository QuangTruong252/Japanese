'use client';

import { useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { navDirection } from '@/lib/nav-direction';

// Chuyển trang (DESIGN.md §Motion): trang mới trượt/mờ vào ngay trên DOM thật, không chụp ảnh
// như View Transitions (Safari iOS chụp @3x rồi đóng băng trang nên thấy khựng). Key theo pathname
// để mỗi lần đổi trang gắn lại DOM và chạy lại animation; đổi query không kích hoạt. Wrapper là
// `display: contents` nên không đổi layout; animation đặt lên phần tử gốc của trang (CSS
// `.page-enter > *`) để màn `fixed inset-0` không bị transform của wrapper kéo lệch.
// Hướng trượt đặt vào --nav-dir trong layout effect, trước khi trình duyệt vẽ khung đầu.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prev = useRef(pathname);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--nav-dir', String(navDirection(prev.current, pathname)));
    prev.current = pathname;
  }, [pathname]);

  return (
    <div key={pathname} className="page-enter contents">
      {children}
    </div>
  );
}
