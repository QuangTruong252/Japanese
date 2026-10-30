'use client';

import { useState } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { RoleAvatar } from '@/components/dialogue/RoleAvatar';
import { getCharacter } from '@/lib/characters';
import { stripFurigana } from '@/lib/japanese';
import { cn } from '@/lib/utils';
import type { DialogueRole } from '@/types';

/** Hồ sơ nhân vật chính. `id` null thì đóng; giữ nhân vật cuối để nội dung không mất giữa lúc trượt xuống. */
export function CharacterSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [shown, setShown] = useState(id);
  if (id && id !== shown) setShown(id);
  const character = shown ? getCharacter(shown) : undefined;
  if (!shown || !character) return null;

  return (
    <DialogPrimitive.Root open={id !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/30 motion-safe:duration-150 motion-safe:data-open:animate-in motion-safe:data-open:fade-in-0 motion-safe:data-closed:animate-out motion-safe:data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] w-full max-w-[760px] flex-col items-center gap-4 overflow-y-auto rounded-t-3xl bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none motion-safe:duration-250 motion-safe:data-open:animate-in motion-safe:data-open:slide-in-from-bottom motion-safe:data-closed:animate-out motion-safe:data-closed:slide-out-to-bottom sm:p-6">
          <span aria-hidden="true" className="-mt-2 h-1.5 w-12 rounded-full bg-muted" />
          <DialogPrimitive.Close
            aria-label="Đóng"
            className="sticky top-0 z-10 -mb-11 flex size-11 self-end items-center justify-center rounded-full border border-border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring"
          >
            <X className="size-5" aria-hidden="true" />
          </DialogPrimitive.Close>
          <RoleAvatar role={{ id: shown, name: character.name }} size={48} sizes="(min-width: 768px) 330px, 275px" className="mt-2 size-40 md:size-48" />
          <DialogPrimitive.Title className="text-center" aria-label={stripFurigana(character.name)}>
            <Furigana text={character.name} className="jp-display text-4xl font-semibold" />
          </DialogPrimitive.Title>
          <p className="-mt-2 text-center font-serif text-lg text-muted-foreground">{character.roleVi}</p>
          <span aria-hidden="true" className="h-1 w-10 rounded-full bg-primary/30" />
          <p className="max-w-prose text-base leading-relaxed text-foreground md:text-lg">{character.bioVi}</p>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Avatar vai: nhân vật chính bấm được để mở hồ sơ; vai phụ giữ nguyên như RoleAvatar. Sheet là anh em của nút để sự kiện trong sheet không nổi lên nút. */
export function ProfileAvatar({ role, size, className }: { role: DialogueRole; size?: 32 | 40 | 48; className?: string }) {
  const [open, setOpen] = useState(false);
  if (getCharacter(role.id)?.kind !== 'main') return <RoleAvatar role={role} size={size} className={className} />;
  return (
    <>
      <button
        type="button"
        aria-label={`Xem giới thiệu ${stripFurigana(role.name)}`}
        onClick={() => setOpen(true)}
        // Vùng chạm nới ra quanh avatar nhỏ (32 px trong bong bóng hội thoại) mà không đổi bố cục.
        className={cn('relative shrink-0 self-start rounded-full outline-none before:absolute before:-inset-1.5 focus-visible:ring-3 focus-visible:ring-ring', className)}
      >
        <RoleAvatar role={role} size={size} />
      </button>
      <CharacterSheet id={open ? role.id : null} onClose={() => setOpen(false)} />
    </>
  );
}
