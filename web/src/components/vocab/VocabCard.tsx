'use client';

import { Info, X } from 'lucide-react';
import { m, type MotionValue, type PanInfo } from 'framer-motion';
import { Furigana } from '@/components/Furigana';
import { VerbGroupBadge } from '@/components/VerbGroupBadge';
import { Illustration } from '@/components/Illustration';
import { SpeakButton } from '@/components/SpeakButton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { stripFurigana, toKanaSentence } from '@/lib/japanese';
import { cn } from '@/lib/utils';
import type { VocabEntry } from './vocab-shared';

const FACE =
  'relative col-start-1 row-start-1 flex min-h-[26rem] min-w-0 flex-col rounded-xl border border-border bg-card [backface-visibility:hidden] [-webkit-backface-visibility:hidden]';
// Lớp phủ bắt chạm/Enter/Space để lật; nội dung bên dưới không bắt chuột, nút con nổi lên trên (z-20).
const FLIP_OVERLAY =
  'absolute inset-0 z-10 cursor-pointer rounded-xl border-0 bg-transparent p-0 outline-none focus-visible:ring-3 focus-visible:ring-ring';

// Cụm dài nhất (giữa hai dấu cách) không được ngắt, nên cỡ chữ phải co theo nó để vừa mặt thẻ ở 360 px
// (còn ~294 px mặt trước, ~286 px mặt sau; chữ Nhật toàn chiều rộng = 1em/ký tự).
function wordSizeClass(surface: string, tiers: readonly (readonly [number, string])[], fallback: string) {
  const longest = Math.max(...surface.split(/\s+/).map((part) => [...part].length));
  return tiers.find(([max]) => longest <= max)?.[1] ?? fallback;
}
const FRONT_TIERS = [
  [5, 'text-5xl sm:text-6xl'],
  [7, 'text-4xl sm:text-5xl'],
  [9, 'text-3xl sm:text-4xl'],
  [12, 'text-2xl sm:text-3xl'],
] as const;
const BACK_TIERS = [
  [9, 'text-3xl'],
  [11, 'text-2xl'],
] as const;

const VERB_FORM_LABELS = [
  ['masu', 'Masu', 'Lịch sự'],
  ['te', 'Te', 'Nối / Đang làm'],
  ['nai', 'Nai', 'Phủ định'],
  ['ta', 'Ta', 'Quá khứ'],
] as const;

function VerbFormsDialog({ forms }: { forms: NonNullable<VocabEntry['word']['verbForms']> }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            aria-label="Các thể chia cơ bản"
            className="absolute left-3 top-3 z-20 size-11 rounded-full bg-secondary text-primary"
          />
        }
      >
        <Info aria-hidden="true" className="size-5" />
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogClose
          render={<Button type="button" variant="ghost" aria-label="Đóng" className="absolute right-1 top-1 size-11" />}
        >
          <X aria-hidden="true" className="size-5" />
        </DialogClose>
        <DialogHeader>
          <DialogTitle>Các thể chia cơ bản</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
          {VERB_FORM_LABELS.map(([key, name, hint]) => {
            const value = forms[key];
            if (!value) return null;
            return (
              <div key={key} className="flex flex-col gap-1 bg-card p-3">
                <span className="text-xs font-medium text-muted-foreground">
                  {name} ({hint})
                </span>
                <span className="jp jp-vocab text-base font-semibold text-foreground">
                  <Furigana text={value} />
                </span>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function VocabCard({
  entry,
  revealed,
  canSwipe,
  dragX,
  dragRotate,
  onFlip,
  onSwipeEnd,
}: {
  entry: VocabEntry;
  revealed: boolean;
  canSwipe: boolean;
  dragX: MotionValue<number>;
  dragRotate: MotionValue<number>;
  onFlip: () => void;
  onSwipeEnd: (event: unknown, info: PanInfo) => void;
}) {
  const { word, example } = entry;
  const surface = stripFurigana(word.word);

  return (
    <m.article
      drag={canSwipe ? 'x' : false}
      dragSnapToOrigin
      dragElastic={0.6}
      onDragEnd={onSwipeEnd}
      style={{ x: dragX, rotate: dragRotate }}
      className="w-full max-w-xl text-left [perspective:1200px] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-250 motion-safe:ease-in-out"
    >
      <div
        className={cn(
          'grid w-full grid-cols-[minmax(0,1fr)] [transform-style:preserve-3d] motion-safe:transition-transform motion-safe:duration-[350ms] motion-safe:ease-smooth-out',
          revealed && '[transform:rotateY(180deg)]',
        )}
      >
        <div aria-hidden={revealed} inert={revealed} className={FACE}>
          <button type="button" aria-label={`Lật thẻ xem đáp án của ${surface}`} onClick={onFlip} className={FLIP_OVERLAY} />
          <div className="absolute right-3 top-3 z-20">
            <SpeakButton text={word.kana} label={surface} className="bg-secondary text-primary" />
          </div>
          <div className="pointer-events-none flex flex-1 flex-col items-center justify-center gap-1 px-4 py-16 text-center sm:px-8">
            {word.verbGroup && <VerbGroupBadge group={Number(word.verbGroup)} prefix="Động từ " />}
            <div className={cn('max-w-full font-bold', wordSizeClass(surface, FRONT_TIERS, 'text-xl'))}>
              <Furigana text={surface} zoomable={false} className="jp-display justify-center" />
            </div>
            <Furigana text={word.kana} zoomable={false} className="jp-example justify-center text-sm text-muted-foreground" />
          </div>
          <p className="pointer-events-none pb-5 text-center text-sm text-muted-foreground">Chạm thẻ để xem đáp án.</p>
        </div>

        <div
          aria-hidden={!revealed}
          inert={!revealed}
          className={cn(FACE, '[transform:rotateY(180deg)]')}
        >
          <button
            type="button"
            aria-label={`Lật thẻ về mặt trước của ${surface}`}
            onClick={onFlip}
            className={FLIP_OVERLAY}
          />
          <div className="absolute right-3 top-3 z-20">
            <SpeakButton text={word.kana} label={surface} className="bg-secondary text-primary" />
          </div>
          {word.verbForms && <VerbFormsDialog forms={word.verbForms} />}
          <div className="pointer-events-none flex flex-1 flex-col px-5 pb-5 pt-16 sm:px-7 sm:pb-7">
            <div className="flex flex-col items-center gap-2 pb-5 text-center">
              {word.illustration && (
                <Illustration
                  asset={word.illustration}
                  sizes="(min-width: 640px) 112px, 96px"
                  className="size-24 object-contain sm:size-28"
                />
              )}
              <div className={cn('max-w-full font-bold', wordSizeClass(surface, BACK_TIERS, 'text-xl'))}>
                <Furigana text={surface} zoomable={false} className="jp-display justify-center" />
              </div>
              <Furigana text={word.kana} zoomable={false} className="jp-example justify-center text-sm text-muted-foreground" />
              {word.verbGroup && <VerbGroupBadge group={Number(word.verbGroup)} prefix="Động từ " />}
              <p className="mt-1 text-2xl font-semibold leading-relaxed text-foreground sm:text-3xl">
                {word.meaning.vi}
              </p>
            </div>

            <section className="space-y-3 border-t border-border pt-5" aria-labelledby="example-title">
              <div className="flex items-center gap-1.5">
                <h2 id="example-title" className="text-sm font-semibold">Câu ví dụ</h2>
                {example && (
                  <span className="pointer-events-auto relative z-20">
                    <SpeakButton
                      text={example.kana ?? toKanaSentence(example.jp)}
                      label="câu ví dụ"
                      iconClassName="size-4"
                      className="bg-secondary text-primary"
                    />
                  </span>
                )}
              </div>
              {example ? (
                <div className="space-y-2">
                  <Furigana
                    text={example.jp}
                    className="jp jp-example block text-base font-medium sm:text-lg"
                    zoomable={false}
                  />
                  {example.kana && example.kana !== stripFurigana(example.jp) && (
                    <Furigana text={example.kana} zoomable={false} className="jp-example text-sm text-muted-foreground" />
                  )}
                  {example.translation.vi.trim() && (
                    <p className="text-sm leading-relaxed text-muted-foreground">{example.translation.vi}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Bài này chưa có câu ví dụ khớp với từ vựng này.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </m.article>
  );
}
