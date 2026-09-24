'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import {
  DEFAULT_SETTINGS,
  getSettingsSnapshot,
  saveSettings,
  subscribeSettings,
} from '@/lib/settings';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    () => DEFAULT_SETTINGS,
  );

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const isDark =
    settings.theme === 'dark' || (settings.theme === 'system' && systemDark);

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    saveSettings({ theme: nextTheme });
    useUIStore.getState().setTheme(nextTheme);
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          'size-9 rounded-xl border border-border/80 bg-card shadow-2xs',
          className,
        )}
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={isDark ? 'Giao diện: Tối (Bấm để chuyển Sáng)' : 'Giao diện: Sáng (Bấm để chuyển Tối)'}
      className={cn(
        'size-9 rounded-xl border border-border/80 bg-card flex items-center justify-center text-muted-foreground',
        'hover:text-foreground hover:border-primary/40 hover:bg-muted/40 transition shadow-2xs cursor-pointer',
        'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring',
        className,
      )}
    >
      {isDark ? (
        <Sun className="size-4 text-amber-500 fill-amber-500/20 transition-transform duration-200 hover:rotate-45 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-50 motion-safe:duration-250 motion-safe:ease-in-out" />
      ) : (
        <Moon className="size-4 text-muted-foreground transition-transform duration-200 hover:-rotate-12 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-50 motion-safe:duration-250 motion-safe:ease-in-out" />
      )}
    </button>
  );
}
