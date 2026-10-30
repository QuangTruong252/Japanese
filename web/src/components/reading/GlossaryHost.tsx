'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { ChevronLeft, X } from 'lucide-react';
import { stripFurigana } from '@/lib/japanese';
import { glossaryWidth } from '@/lib/reading-glossary-width';
import { cn } from '@/lib/utils';
import { glossaryLabel } from './glossary-label';
import type { ReadingGlossaryEntry } from '@/types/reading';
import { entryDialogLabel, GlossaryEntryBody, GlossaryPopover, MAX_WIDTH, measureAnchor, usePopoverDismiss, type PopoverAnchor } from './GlossaryPopover';

const KIND_LABEL = { word: 'Từ', grammar: 'Ngữ pháp', name: 'Tên' } as const;

/** Chữ thuộc nhiều mục: danh sách chọn, mỗi mục một nút riêng (không lồng button trong nút của chữ). */
function ChooserList({ entries, onChoose, style }: { entries: ReadingGlossaryEntry[]; onChoose: (id: string) => void; style?: CSSProperties }) {
  return (
    <ul style={style} className="flex flex-col overflow-y-auto rounded-2xl p-2">
      {entries.map((entry) => (
        <li key={entry.id}>
          <button
            type="button"
            onClick={() => onChoose(entry.id)}
            // Nhãn ngữ pháp có thể rất dài; nghĩa xuống hàng riêng để ba cột không bóp nhau thành chữ dọc.
            className="grid min-h-12 w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-0.5 rounded-xl px-3 py-2 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring"
          >
            <span className="jp jp-display break-words text-lg font-semibold">{glossaryLabel(entry)}</span>
            <span className="mt-1 rounded-full bg-accent px-2 text-xs font-medium text-accent-foreground">{KIND_LABEL[entry.kind]}</span>
            <span className="col-span-2 break-words text-sm text-muted-foreground">{stripFurigana(entry.meaningsVi[0] ?? '')}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

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
      <ChooserList entries={entries} onChoose={onChoose} style={{ maxHeight: anchor.maxHeight }} />
    </div>
  );
}

/**
 * Mobile: cùng nội dung nhưng trượt từ đáy (kiểu ReadingDisplaySheet). Danh sách chọn và chi tiết đổi chỗ ngay trong
 * sheet; `onBack` chỉ có khi chi tiết đến từ danh sách. Kéo vạch để đóng chưa làm: đã có X, backdrop và Escape.
 */
function GlossarySheet({ entry, choices, trigger, onChoose, onBack, onClose }: {
  entry?: ReadingGlossaryEntry;
  choices: ReadingGlossaryEntry[];
  trigger: HTMLElement;
  onChoose: (id: string) => void;
  onBack?: () => void;
  onClose: () => void;
}) {
  return (
    <DialogPrimitive.Root open onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/30 motion-safe:duration-150 motion-safe:data-open:animate-in motion-safe:data-open:fade-in-0" />
        <DialogPrimitive.Popup
          finalFocus={{ current: trigger }}
          aria-label={entry ? entryDialogLabel(entry) : 'Chọn mục cần tra'}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] w-full max-w-[760px] flex-col rounded-t-3xl bg-background pb-[max(0.5rem,env(safe-area-inset-bottom))] text-foreground outline-none motion-safe:duration-250 motion-safe:data-open:animate-in motion-safe:data-open:slide-in-from-bottom"
        >
          <div className="relative flex h-14 shrink-0 items-center justify-center">
            <span aria-hidden="true" className="h-1.5 w-12 rounded-full bg-muted" />
            {onBack && (
              <button type="button" onClick={onBack} aria-label="Về danh sách" className="absolute left-3 flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring">
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
            )}
            <DialogPrimitive.Close aria-label="Đóng" className="absolute right-3 flex size-11 items-center justify-center rounded-full bg-secondary outline-none focus-visible:ring-3 focus-visible:ring-ring">
              <X className="size-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          {entry ? <GlossaryEntryBody key={entry.id} entry={entry} /> : <ChooserList entries={choices} onChoose={onChoose} />}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

const subscribeWide = (onChange: () => void) => {
  const media = window.matchMedia('(min-width: 768px)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};
// Trùng breakpoint `md`. JS chọn nhánh vì sheet và popover khác nhau về DOM (portal, focus trap), không chỉ về style.
const useNarrow = () => useSyncExternalStore(subscribeWide, () => !window.matchMedia('(min-width: 768px)').matches, () => false);

export interface GlossaryHostApi {
  pick: (entryIds: string[], element: HTMLElement) => void;
  close: () => void;
  activeEntryId: string | null;
}

/**
 * Khung `relative` quanh vùng đọc: giữ chữ đang tra, danh sách chọn khi nhiều mục và popover nghĩa (tablet/PC)
 * hoặc bottom sheet (mobile). Dùng chung cho phiên đọc và màn kết quả.
 */
export function GlossaryHost({ glossary, children }: { glossary: readonly ReadingGlossaryEntry[]; children: (api: GlossaryHostApi) => ReactNode }) {
  const [frame, setFrame] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState<{ ids: string[]; entryId: string | null; anchor: PopoverAnchor } | null>(null);
  const narrow = useNarrow();

  // Đổi kích thước cửa sổ làm lệch chỗ neo; đổi qua lại mobile/desktop cũng đi qua đây.
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
      : { ids, entryId: ids.length === 1 ? ids[0]! : null, anchor: measureAnchor(element, frame, glossaryWidth(glossary.filter((g) => ids.includes(g.id)), MAX_WIDTH)) }));
  }, [frame, glossary]);

  const entry = open?.entryId ? glossary.find((g) => g.id === open.entryId) : undefined;
  const choices = open && !open.entryId ? glossary.filter((g) => open.ids.includes(g.id)).sort((a, b) => open.ids.indexOf(a.id) - open.ids.indexOf(b.id)) : [];
  const choose = (id: string) => open && setOpen({ ...open, entryId: id });

  return (
    <div ref={setFrame} className="relative flex flex-col gap-4">
      {children({ pick, close, activeEntryId: open ? open.entryId ?? open.ids[0]! : null })}
      {open && (entry || choices.length > 0) && (narrow ? (
        <GlossarySheet
          entry={entry}
          choices={choices}
          trigger={open.anchor.trigger}
          onChoose={choose}
          onBack={entry && open.ids.length > 1 ? () => setOpen({ ...open, entryId: null }) : undefined}
          onClose={close}
        />
      ) : entry ? (
        <GlossaryPopover key={entry.id} entry={entry} anchor={open.anchor} onClose={close} />
      ) : (
        <GlossaryChooser entries={choices} anchor={open.anchor} onClose={close} onChoose={choose} />
      ))}
    </div>
  );
}
