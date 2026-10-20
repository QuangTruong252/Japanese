'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Square, Volume2 } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { Illustration } from '@/components/Illustration';
import { SpeakButton } from '@/components/SpeakButton';
import { RoleAvatar } from '@/components/dialogue/RoleAvatar';
import { SPEAK_CLASS } from '@/components/dialogue/reader-styles';
import { buttonVariants } from '@/components/ui/button';
import { playLines } from '@/lib/dialogue-player';
import { formatOptionalBrackets, stripFurigana } from '@/lib/japanese';
import { dialogueAnchorId, readingRightRoleId, rolePitch } from '@/lib/kaiwa';
import { hasJapaneseVoice, speak } from '@/lib/tts';
import { cn } from '@/lib/utils';
import type { Dialogue, DialogueLine } from '@/types';

// Chừa chỗ cho thanh tab dính (~68 px) để câu được nhảy tới không bị che.
const LINE_TARGET = 'scroll-mt-24';

const lineText = (line: DialogueLine) => line.kana ?? stripFurigana(formatOptionalBrackets(line.jp));

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
          const right = line.speaker === rightRole;
          return (
            <div
              key={i}
              id={dialogueAnchorId(dialogue.id, i)}
              className={cn('flex flex-col gap-1', right ? 'items-end' : 'items-start', LINE_TARGET)}
            >
              {role && (
                <div className={cn('flex items-center gap-2', right && 'flex-row-reverse')}>
                  <RoleAvatar role={role} size={32} />
                  <Furigana text={role.name} className="text-sm font-medium text-muted-foreground" />
                </div>
              )}
              <div
                className={cn(
                  'flex min-w-0 max-w-[85%] items-center gap-2 rounded-2xl border border-transparent py-2 transition-colors',
                  right ? 'flex-row-reverse rounded-tr-md bg-accent pl-2 pr-4' : 'rounded-tl-md bg-secondary pl-4 pr-2',
                  playing === i && 'border-primary',
                )}
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="jp jp-example font-medium leading-loose text-foreground [overflow-wrap:anywhere]">
                    <Furigana text={line.jp} />
                  </div>
                  <p className="translation text-sm leading-relaxed text-muted-foreground">
                    {line.translation.vi}
                  </p>
                </div>
                {/* ponytail: SpeakButton chưa nhận pitch nên nghe lẻ từng câu dùng cao độ chuẩn */}
                <SpeakButton
                  text={lineText(line)}
                  label={stripFurigana(formatOptionalBrackets(line.jp))}
                  className={SPEAK_CLASS}
                />
              </div>
            </div>
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
