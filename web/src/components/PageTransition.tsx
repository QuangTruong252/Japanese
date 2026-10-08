'use client';

import { useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { navDirection } from '@/lib/nav-direction';

// Chuyển trang: trang mới trượt/mờ vào ngay trên DOM thật, không chụp ảnh
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
    if (prev.current !== pathname) {
      if (typeof window !== 'undefined' && !window.location.hash) {
        document.getElementById('app-scroll-container')?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    }
    prev.current = pathname;

    // Hash từ URL/search có thể đến trước phần bài được stream. Shell cuộn riêng,
    // nên không dựa vào scroll của window; đợi đúng mục rồi cuộn một lần.
    const scrollToHash = () => {
      if (!window.location.hash) return true;
      let id = window.location.hash.slice(1);
      try { id = decodeURIComponent(id); } catch { /* Giữ nguyên hash malformed. */ }
      const target = document.getElementById(id);
      if (!target) return false;
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
      return true;
    };
    const container = document.getElementById('app-scroll-container');
    let observer: MutationObserver | undefined;
    if (window.location.hash && container && !scrollToHash()) {
      observer = new MutationObserver(() => {
        if (scrollToHash()) observer?.disconnect();
      });
      observer.observe(container, { childList: true, subtree: true });
    }
    window.addEventListener('hashchange', scrollToHash);
    return () => {
      observer?.disconnect();
      window.removeEventListener('hashchange', scrollToHash);
    };
  }, [pathname]);

  return (
    <div key={pathname} className="page-enter contents">
      {children}
    </div>
  );
}
