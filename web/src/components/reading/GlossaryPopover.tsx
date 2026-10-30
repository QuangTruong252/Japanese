'use client';

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, ChevronRight, Copy, Plus } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { Illustration } from '@/components/Illustration';
import { SpeakButton } from '@/components/SpeakButton';
import { SPEAK_CLASS } from '@/components/dialogue/reader-styles';
import { buttonVariants, Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { stripFurigana } from '@/lib/japanese';
import { glossaryLabel } from './glossary-label';
import { addReadingWordToReview, readingReviewTargetId } from '@/lib/reading-review';
import { cn } from '@/lib/utils';
import type { ReadingGlossaryEntry } from '@/types/reading';
import { scrollBehavior } from './scroll';

/** Chỗ neo tính sẵn lúc bấm: tọa độ trong khung `relative` của vùng đọc, nên cuộn không làm lệch. */
export interface PopoverAnchor {
  trigger: HTMLElement;
  /** Popover nằm dưới hay trên chữ; đặt theo `top` (dưới) hoặc `bottom` (trên, tính từ đáy khung). */
  side: 'below' | 'above';
  offset: number;
  left: number;
  width: number;
  arrowX: number;
  maxHeight: number;
}

export const MAX_WIDTH = 416;
const EDGE = 8;
const GAP = 10;
const PREFERRED_HEIGHT = 320;
const MIN_HEIGHT = 200;

/**
 * Đo chỗ neo từ chữ được bấm; `container` là khung `relative` chứa popover. Mặc định đặt dưới chữ; chỗ dưới chật
 * mà phía trên (trong khung, nơi popover không bị cắt) rộng hơn thì lật lên. Chiều cao giới hạn theo phía đã chọn.
 */
export function measureAnchor(trigger: HTMLElement, container: HTMLElement, wanted: number): PopoverAnchor {
  const box = trigger.getBoundingClientRect();
  const frame = container.getBoundingClientRect();
  const width = Math.min(container.clientWidth - EDGE * 2, wanted);
  const center = box.left - frame.left + box.width / 2;
  const left = Math.min(Math.max(center - width / 2, EDGE), container.clientWidth - width - EDGE);
  // Vùng nhìn thấy là vùng cuộn của phiên đọc (giữa header và đáy), không phải cả cửa sổ.
  const view = container.closest('[data-reading-scroll]')?.getBoundingClientRect();
  const below = (view?.bottom ?? window.innerHeight) - box.bottom - GAP - EDGE;
  const above = Math.min(box.top - (view?.top ?? 0), box.top - frame.top) - GAP - EDGE;
  const side = below < PREFERRED_HEIGHT && above > below ? 'above' : 'below';
  const room = side === 'above' ? above : below;
  return {
    trigger,
    side,
    offset: side === 'above' ? frame.bottom - box.top + GAP : box.bottom - frame.top + GAP,
    left,
    width,
    arrowX: Math.min(Math.max(center - left, 20), width - 20),
    maxHeight: Math.max(MIN_HEIGHT, Math.min(room, 480)),
  };
}

function detailHref(entry: ReadingGlossaryEntry): string | null {
  if (entry.vocabRef) return `/hoc/${entry.vocabRef.lesson}#tu-vung`;
  const grammar = entry.kind === 'grammar' ? /^(\d+):(.+)$/.exec(entry.ref ?? '') : null;
  return grammar ? `/hoc/${grammar[1]}/ngu-phap/${grammar[2]}` : null;
}

/** Lấy focus khi mở, cuộn vào tầm nhìn, đóng bằng Escape (trả focus về chữ) hoặc chạm ra ngoài. */
export function usePopoverDismiss(box: RefObject<HTMLElement | null>, trigger: HTMLElement, onClose: () => void) {
  useEffect(() => {
    const element = box.current;
    element?.focus({ preventScroll: true });
    element?.scrollIntoView({ block: 'nearest', behavior: scrollBehavior() });
    const close = (restore: boolean) => { onClose(); if (restore) trigger.focus(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(true); };
    const outside = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (target && !element?.contains(target) && !target.closest('[data-reading-word]')) close(false);
    };
    document.addEventListener('keydown', key);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('pointerdown', outside); };
  }, [box, trigger, onClose]);
}

/** Nội dung chi tiết một mục; popover (tablet/PC) và bottom sheet (mobile) cùng dùng. */
function GlossaryEntryBody({ entry, style }: { entry: ReadingGlossaryEntry; style?: CSSProperties }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const href = detailHref(entry);

  // null: không thêm được vào ôn tập (không có ref N5); undefined: đang đọc.
  const added = useLiveQuery(async () => {
    const id = await readingReviewTargetId(entry);
    return id ? !!(await db.reviewItems.get(id)) : null;
  }, [entry.id]);

  async function add() {
    if (busy) return;
    setBusy(true);
    setError('');
    try { await addReadingWordToReview(entry); } catch { setError('Chưa lưu được. Hãy thử lại.'); }
    finally { setBusy(false); }
  }

  const label = glossaryLabel(entry);

  async function copy() {
    try { await navigator.clipboard.writeText(label); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* Không có quyền clipboard: bỏ qua. */ }
  }

  const speakText = entry.kind === 'grammar' && entry.exampleJp ? glossaryLabel({ labelJp: entry.exampleJp }) : entry.reading ?? label;

  return (
      <div style={style} className="flex flex-col gap-3 overflow-y-auto rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="jp jp-display break-words text-3xl font-semibold leading-snug">{label}</p>
          {entry.reading && entry.reading !== label && (
            <p className="jp mt-1 inline-block rounded-full bg-accent px-3 text-base font-medium text-primary">{entry.reading}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {added !== null && added !== undefined && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 rounded-xl"
              disabled={busy}
              aria-disabled={added}
              aria-label={added ? 'Đã thêm vào ôn tập' : 'Thêm vào ôn tập'}
              onClick={() => { if (!added) void add(); }}
            >
              {added ? <Check className="size-5 text-success" aria-hidden="true" /> : <Plus className="size-5" aria-hidden="true" />}
            </Button>
          )}
          <SpeakButton text={speakText} label={label} className={SPEAK_CLASS} />
          <Button type="button" variant="outline" size="icon" className="size-11 rounded-xl" aria-label={copied ? 'Đã sao chép' : 'Sao chép'} onClick={() => void copy()}>
            {copied ? <Check className="size-5 text-success" aria-hidden="true" /> : <Copy className="size-5" aria-hidden="true" />}
          </Button>
        </div>
      </div>
      <ol className="flex flex-col gap-1 text-base">
        {entry.meaningsVi.map((meaning, i) => (
          <li key={i} className="flex gap-2">
            {entry.meaningsVi.length > 1 && <span className="w-5 shrink-0 text-muted-foreground">{i + 1}.</span>}
            {/* Nghĩa mẫu ngữ pháp có chép lại mẫu kèm furigana (行[い]きます); chỉ bỏ ngoặc sau chữ Hán, giữ "[món đồ]". */}
            <span>{stripFurigana(meaning)}</span>
          </li>
        ))}
      </ol>
      {(entry.exampleJp || entry.illustration) && (
        <div className="flex items-center gap-3 border-t border-border pt-3">
          {entry.illustration && (
            <span className="size-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
              <Illustration asset={entry.illustration} sizes="80px" className="size-full object-cover" />
            </span>
          )}
          {entry.exampleJp && (
            <div className="min-w-0 flex-1">
              <Furigana text={entry.exampleJp} className="jp-display text-lg" />
              {entry.exampleVi && <p className="text-sm text-muted-foreground">{entry.exampleVi}</p>}
            </div>
          )}
        </div>
      )}
      {error && <p role="alert" className="text-sm text-destructive">✕ {error}</p>}
      {href && (
        <Link href={href} className={cn(buttonVariants({ variant: 'outline', size: 'quiz' }), 'self-end bg-secondary')}>
          Chi tiết<ChevronRight aria-hidden="true" />
        </Link>
      )}
      </div>
  );
}

/** Tên accessible của hộp thoại một mục. */
export const entryDialogLabel = (entry: ReadingGlossaryEntry) => `Nghĩa của ${glossaryLabel(entry)}`;

export { GlossaryEntryBody };

export function GlossaryPopover({ entry, anchor, onClose }: { entry: ReadingGlossaryEntry; anchor: PopoverAnchor; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  usePopoverDismiss(box, anchor.trigger, onClose);
  return (
    <div
      ref={box}
      role="dialog"
      aria-label={entryDialogLabel(entry)}
      tabIndex={-1}
      style={{ [anchor.side === 'above' ? 'bottom' : 'top']: anchor.offset, left: anchor.left, width: anchor.width }}
      className="absolute z-30 rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg outline-none motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150"
    >
      <span
        aria-hidden="true"
        style={{ left: anchor.arrowX }}
        className={cn('absolute size-3 -translate-x-1/2 rotate-45 border-border bg-popover', anchor.side === 'above' ? '-bottom-1.5 border-b border-r' : '-top-1.5 border-l border-t')}
      />
      <GlossaryEntryBody entry={entry} style={{ maxHeight: anchor.maxHeight }} />
    </div>
  );
}
