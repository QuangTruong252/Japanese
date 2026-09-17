'use client';

import { useEffect } from 'react';

export function ShortcutListener() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Đăng ký Ctrl+K (hoặc Cmd+K trên Mac)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Hộp tìm kiếm toàn năng sẽ kích hoạt ở đợt spec sau
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
}
