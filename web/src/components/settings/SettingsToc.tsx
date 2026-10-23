'use client';

import { useEffect, useState } from 'react';
import { GraduationCap, LayoutGrid, Monitor, Database, User } from 'lucide-react';
import { Ribbon } from '@/components/PaperKit';
import { cn } from '@/lib/utils';

const ITEMS = [
  { id: 'heading-account', label: 'Tài khoản & Đồng bộ', icon: User },
  { id: 'sec-display', label: 'Hiển thị', icon: Monitor },
  { id: 'sec-learning', label: 'Học tập', icon: GraduationCap },
  { id: 'sec-data', label: 'Dữ liệu', icon: Database },
  { id: 'sec-app', label: 'Ứng dụng', icon: LayoutGrid },
];

/** Mục lục các nhóm cài đặt: bấm cuộn tới nhóm, nhóm đang nằm gần đầu khung nhìn có `Ribbon`. */
export function SettingsToc() {
  const [active, setActive] = useState(ITEMS[0].id);

  useEffect(() => {
    const root = document.getElementById('app-scroll-container');
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        // Nhóm trên cùng trong dải quan sát là nhóm đang xem.
        const first = ITEMS.find((i) => visible.has(i.id));
        if (first) setActive(first.id);
      },
      { root, rootMargin: '-10% 0px -70% 0px' },
    );
    for (const { id } of ITEMS) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setActive(id);
  };

  return (
    <nav aria-label="Các nhóm cài đặt">
      <ul className="divide-y divide-border">
        {ITEMS.map(({ id, label, icon: Icon }) => (
          <li key={id} className="relative">
            {active === id && <Ribbon className="-left-4 top-3" />}
            <a
              href={`#${id}`}
              aria-current={active === id ? 'true' : undefined}
              onClick={(e) => {
                e.preventDefault();
                go(id);
              }}
              className={cn(
                'flex min-h-12 items-center gap-3 rounded-lg px-3 text-base outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
                active === id ? 'bg-accent font-medium text-primary' : 'text-foreground hover:bg-muted/60',
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
