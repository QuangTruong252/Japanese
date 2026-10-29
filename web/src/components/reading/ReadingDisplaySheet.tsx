'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Furigana } from '@/components/Furigana';
import { Button } from '@/components/ui/button';
import { READING_BACKGROUNDS, READING_FONTS, type ReadingDisplay } from '@/lib/reading-display';
import { cn } from '@/lib/utils';
import { jpTextClass, surfaceClass, SWATCH } from './display';

const BACKGROUND_LABEL = { auto: 'Theo giao diện', paper: 'Giấy ngà', white: 'Trắng', dark: 'Tối' } as const;
const FONT_LABEL = { mincho: 'Mincho', gothic: 'Gothic' } as const;

const legend = 'mb-2 text-base font-semibold text-foreground';
const focus = 'has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring';

/** Cài đặt đọc: chỉ áp vào vùng đọc, không đổi theme hay cài đặt chung. Lưu do nơi gọi lo. */
export function ReadingDisplaySheet({ open, onOpenChange, display, onChange, sample }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  display: ReadingDisplay;
  onChange: (display: ReadingDisplay) => void;
  /** Câu Nhật xem trước, lấy từ bài đang đọc. */
  sample: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/30 motion-safe:duration-150 motion-safe:data-open:animate-in motion-safe:data-open:fade-in-0 motion-safe:data-closed:animate-out motion-safe:data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] w-full max-w-[760px] flex-col gap-5 overflow-y-auto rounded-t-3xl bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none motion-safe:duration-250 motion-safe:data-open:animate-in motion-safe:data-open:slide-in-from-bottom motion-safe:data-closed:animate-out motion-safe:data-closed:slide-out-to-bottom sm:p-6">
          <span aria-hidden="true" className="mx-auto -mt-2 h-1.5 w-12 rounded-full bg-muted" />
          <DialogPrimitive.Title className="font-serif text-2xl font-semibold">Cài đặt đọc</DialogPrimitive.Title>

          <div>
            <label htmlFor="reading-font-size" className={legend}>Cỡ chữ</label>
            <input
              id="reading-font-size"
              type="range"
              min={1}
              max={5}
              step={1}
              value={display.fontStep}
              aria-valuetext={`Cỡ ${display.fontStep} trên 5`}
              onChange={(e) => onChange({ ...display, fontStep: Number(e.target.value) as ReadingDisplay['fontStep'] })}
              className="h-11 w-full accent-primary"
            />
            <div className="flex justify-between text-sm text-muted-foreground" aria-hidden="true"><span>A nhỏ</span><span>A lớn</span></div>
          </div>

          <fieldset>
            <legend className={legend}>Màu nền</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-3">
              {READING_BACKGROUNDS.map((value) => (
                <label key={value} className="flex min-h-11 cursor-pointer flex-col items-center gap-1 text-sm">
                  <input type="radio" name="reading-background" className="peer sr-only" checked={display.background === value} onChange={() => onChange({ ...display, background: value })} />
                  <span className={cn('block size-12 rounded-full border-2 border-border peer-checked:border-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring', SWATCH[value])} />
                  <span className="peer-checked:font-semibold">{BACKGROUND_LABEL[value]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className={legend}>Kiểu chữ</legend>
            <div className="flex gap-3">
              {READING_FONTS.map((value) => (
                <label key={value} className={cn('flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-xl border border-border bg-card px-4 text-lg has-[:checked]:border-primary has-[:checked]:bg-accent has-[:checked]:text-primary sm:max-w-48', focus, value === 'mincho' && 'jp-display')}>
                  <input type="radio" name="reading-font" className="sr-only" checked={display.font === value} onChange={() => onChange({ ...display, font: value })} />
                  {FONT_LABEL[value]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className={cn('rounded-xl border border-border p-4 text-center', surfaceClass(display))}>
            <Furigana text={sample} className={jpTextClass(display)} />
          </div>

          <Button size="quiz" className="w-full" onClick={() => onOpenChange(false)}>Xong</Button>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
