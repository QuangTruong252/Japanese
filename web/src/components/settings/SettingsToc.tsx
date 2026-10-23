'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
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

// Thẻ cài app tự ẩn ở standalone; mục lục theo nội dung thật, kể cả sau hydration.
function subscribeAppSection(onChange: () => void) {
  const section = document.getElementById('sec-app');
  if (!section) return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(section, { childList: true });
  return () => observer.disconnect();
}

function hasAppSection() {
  return !!document.getElementById('sec-app')?.firstElementChild;
}

/** Mục lục các nhóm cài đặt: bấm cuộn tới nhóm, nhóm đang nằm gần đầu khung nhìn có `Ribbon`. */
export function SettingsToc() {
  const [active, setActive] = useState(ITEMS[0].id);
  const showApp = useSyncExternalStore(subscribeAppSection, hasAppSection, () => false);
  const items = useMemo(() => ITEMS.filter((item) => item.id !== 'sec-app' || showApp), [showApp]);
  const selected = items.some((item) => item.id === active) ? active : ITEMS[0].id;

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
        const first = items.find((i) => visible.has(i.id));
        if (first) setActive(first.id);
      },
      { root, rootMargin: '-10% 0px -70% 0px' },
    );
    for (const { id } of items) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [items]);

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
        {items.map(({ id, label, icon: Icon }) => (
          <li key={id} className="relative">
            {selected === id && <Ribbon className="-left-4 top-3" />}
            <a
              href={`#${id}`}
              aria-current={selected === id ? 'true' : undefined}
              onClick={(e) => {
                e.preventDefault();
                go(id);
              }}
              className={cn(
                'flex min-h-12 items-center gap-3 rounded-lg px-3 text-base outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
                selected === id ? 'bg-accent font-medium text-primary' : 'text-foreground hover:bg-muted/60',
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
