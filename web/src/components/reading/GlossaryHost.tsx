'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { glossaryLabel } from './glossary-label';
import type { ReadingGlossaryEntry } from '@/types/reading';
import { GlossaryPopover, measureAnchor, usePopoverDismiss, type PopoverAnchor } from './GlossaryPopover';

const KIND_LABEL = { word: 'Từ', grammar: 'Ngữ pháp', name: 'Tên' } as const;

/** Chữ thuộc nhiều mục: danh sách chọn, mỗi mục một nút riêng (không lồng button trong nút của chữ). */
function GlossaryChooser({ entries, anchor, onChoose, onClose }: { entries: ReadingGlossaryEntry[]; anchor: PopoverAnchor; onChoose: (id: string) => void; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  usePopoverDismiss(box, anchor.trigger, onClose);
  return (
    <div
      ref={box}
      role="dialog"
      aria-label="Chọn mục cần tra"
      tabIndex={-1}
      style={{ [anchor.side === 'above' ? 'bottom' : 'top']: anchor.offset, left: anchor.left, width: anchor.width }}
      className="absolute z-30 rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg outline-none motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150"
    >
      <span
        aria-hidden="true"
        style={{ left: anchor.arrowX }}
        className={cn('absolute size-3 -translate-x-1/2 rotate-45 border-border bg-popover', anchor.side === 'above' ? '-bottom-1.5 border-b border-r' : '-top-1.5 border-l border-t')}
      />
      <ul style={{ maxHeight: anchor.maxHeight }} className="flex flex-col overflow-y-auto rounded-2xl p-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onChoose(entry.id)}
              className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring"
            >
              <span className="jp jp-display min-w-0 break-words text-lg font-semibold">{glossaryLabel(entry)}</span>
              <span className="min-w-0 flex-1 break-words text-sm text-muted-foreground">{entry.meaningsVi[0]}</span>
              <span className="shrink-0 rounded-full bg-accent px-2 text-xs font-medium text-accent-foreground">{KIND_LABEL[entry.kind]}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface GlossaryHostApi {
  pick: (entryIds: string[], element: HTMLElement) => void;
  close: () => void;
  activeEntryId: string | null;
}

/**
 * Khung `relative` quanh vùng đọc: giữ chữ đang tra, danh sách chọn khi nhiều mục và popover nghĩa.
 * Dùng chung cho phiên đọc và màn kết quả.
 */
export function GlossaryHost({ glossary, children }: { glossary: readonly ReadingGlossaryEntry[]; children: (api: GlossaryHostApi) => ReactNode }) {
  const [frame, setFrame] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState<{ ids: string[]; entryId: string | null; anchor: PopoverAnchor } | null>(null);

  useEffect(() => {
    const close = () => setOpen(null);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, []);

  const close = useCallback(() => setOpen(null), []);
  const pick = useCallback((ids: string[], element: HTMLElement) => {
    if (!frame) return;
    setOpen((prev) => (prev && prev.anchor.trigger === element
      ? null
      : { ids, entryId: ids.length === 1 ? ids[0]! : null, anchor: measureAnchor(element, frame) }));
  }, [frame]);

  const entry = open?.entryId ? glossary.find((g) => g.id === open.entryId) : undefined;
  const choices = open && !open.entryId ? glossary.filter((g) => open.ids.includes(g.id)).sort((a, b) => open.ids.indexOf(a.id) - open.ids.indexOf(b.id)) : [];

  return (
    <div ref={setFrame} className="relative flex flex-col gap-4">
      {children({ pick, close, activeEntryId: open ? open.entryId ?? open.ids[0]! : null })}
      {open && entry && <GlossaryPopover key={entry.id} entry={entry} anchor={open.anchor} onClose={close} />}
      {open && !entry && choices.length > 0 && (
        <GlossaryChooser entries={choices} anchor={open.anchor} onClose={close} onChoose={(id) => setOpen({ ...open, entryId: id })} />
      )}
    </div>
  );
}
