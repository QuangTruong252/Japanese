'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { BookOpen, Languages, Volume2 } from 'lucide-react';
import { hasJapaneseVoice, speak } from '@/lib/tts';
import { cn } from '@/lib/utils';

const item =
  'flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 px-2 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring sm:text-base [&_svg]:size-5 [&_svg]:shrink-0';

function Tool({ pressed, onClick, children }: { pressed?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick} className={cn(item, pressed && 'bg-accent text-primary')}>
      {children}
    </button>
  );
}

/** Nghe lại · Tra từ · Ẩn/Hiện dịch; ghim đáy vùng cuộn để luôn dùng được khi bài dài. Không có giọng ja-JP thì ẩn nút nghe (nút chết tệ hơn không có nút). */
export function ReadingToolbar({ listenText, lookup, onLookup, showVi, onShowVi }: {
  listenText: string;
  lookup: boolean;
  onLookup: () => void;
  showVi: boolean;
  onShowVi: () => void;
}) {
  const [voice, setVoice] = useState(false);
  useEffect(() => {
    let alive = true;
    void hasJapaneseVoice().then((ok) => { if (alive) setVoice(ok); });
    return () => { alive = false; };
  }, []);
  return (
    <div role="toolbar" aria-label="Công cụ đọc" className="sticky bottom-0 z-10 flex divide-x divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {voice && <Tool onClick={() => { speak(listenText); }}><Volume2 className="text-primary" aria-hidden="true" />Nghe lại</Tool>}
      <Tool pressed={lookup} onClick={onLookup}><BookOpen aria-hidden="true" />Tra từ</Tool>
      <Tool onClick={onShowVi}><Languages aria-hidden="true" />{showVi ? 'Ẩn dịch' : 'Hiện dịch'}</Tool>
    </div>
  );
}
