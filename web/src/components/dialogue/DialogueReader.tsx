'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Square, Volume2 } from 'lucide-react';
import { Illustration } from '@/components/Illustration';
import { DialogueBubble, lineText } from '@/components/dialogue/DialogueBubble';
import { buttonVariants } from '@/components/ui/button';
import { playLines } from '@/lib/dialogue-player';
import { dialogueAnchorId, readingRightRoleId, rolePitch } from '@/lib/kaiwa';
import { hasJapaneseVoice, speak } from '@/lib/tts';
import { cn } from '@/lib/utils';
import type { Dialogue } from '@/types';

// Chừa chỗ cho thanh tab dính (~68 px) để câu được nhảy tới không bị che.
const LINE_TARGET = 'scroll-mt-24';

/** Một tình huống: ảnh + tiêu đề + nút nghe cả đoạn, các câu dạng bong bóng, nút sang màn nhập vai. */
export function DialogueReader({
  dialogue,
  lessonNum,
  active,
}: {
  dialogue: Dialogue;
  lessonNum: number;
  /** Tab Hội thoại đang hiện; rời tab thì dừng đọc (panel vẫn mounted). */
  active: boolean;
}) {
  const [hasVoice, setHasVoice] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const rightRole = readingRightRoleId(dialogue);

  useEffect(() => {
    let alive = true;
    hasJapaneseVoice().then((ok) => {
      if (alive) setHasVoice(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  const stop = () => {
    if (!stopRef.current) return;
    stopRef.current();
    stopRef.current = null;
    window.speechSynthesis?.cancel();
  };

  useEffect(() => {
    if (!active) stop();
  }, [active]);
  // Rời trang: dừng chuỗi đang đọc.
  useEffect(() => stop, []);

  const togglePlay = () => {
    if (stopRef.current) return stop();
    stopRef.current = playLines(
      dialogue.lines.length,
      (i) => {
        const line = dialogue.lines[i]!;
        return speak(lineText(line), 1, undefined, rolePitch(dialogue.roles, line.speaker));
      },
      (i) => {
        setPlaying(i);
        if (i === null) stopRef.current = null;
      },
    );
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      {dialogue.illustration && (
        <Illustration
          asset={dialogue.illustration}
          sizes="(min-width: 768px) 768px, 100vw"
          className="h-36 w-full object-cover sm:h-48"
        />
      )}
      <div className="flex items-center justify-between gap-3 p-4">
        <h3 className="text-lg font-semibold text-foreground">{dialogue.title.vi}</h3>
        {hasVoice && (
          <button
            type="button"
            aria-pressed={playing !== null}
            onClick={togglePlay}
            className={cn(buttonVariants({ variant: 'outline' }), 'h-11 shrink-0 gap-1.5 rounded-xl px-3 text-sm')}
          >
            {playing !== null ? <Square className="size-4" /> : <Volume2 className="size-4" />}
            {playing !== null ? 'Dừng' : 'Nghe cả đoạn'}
          </button>
        )}
      </div>

      <div className="space-y-3 px-4 pb-4">
        {dialogue.lines.map((line, i) => {
          const role = dialogue.roles.find((r) => r.id === line.speaker);
          if (!role) return null;
          return (
            <DialogueBubble
              key={i}
              id={dialogueAnchorId(dialogue.id, i)}
              role={role}
              line={line}
              side={line.speaker === rightRole ? 'right' : 'left'}
              pitch={rolePitch(dialogue.roles, line.speaker)}
              active={playing === i}
              className={LINE_TARGET}
            />
          );
        })}
      </div>

      <div className="px-4 pb-4">
        <Link
          href={`/hoc/${lessonNum}/hoi-thoai/${dialogue.id}`}
          className={cn(buttonVariants({ variant: 'outline' }), 'h-12 w-full rounded-xl text-base font-medium')}
        >
          Nhập vai →
        </Link>
      </div>
    </section>
  );
}
