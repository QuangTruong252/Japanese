'use client';

import { useEffect, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, X } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { SoftScene, TornCard } from '@/components/PaperKit';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SessionShell } from '@/components/practice/SessionFrame';
import { DialogueBubble } from '@/components/dialogue/DialogueBubble';
import { RoleAvatar } from '@/components/dialogue/RoleAvatar';
import { verticalRoleIndex } from '@/components/dialogue/role-navigation';
import { createRolePlay, rolePlayView, stepRolePlay, type RolePlayAction } from '@/lib/roleplay';
import { rolePitch } from '@/lib/kaiwa';
import { toKanaSentence } from '@/lib/japanese';
import { hasJapaneseVoice, speak } from '@/lib/tts';
import { cn } from '@/lib/utils';
import type { Dialogue } from '@/types';

function cancelSpeech() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function subscribeWideScreen(onChange: () => void) {
  const media = window.matchMedia('(min-width: 768px)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
const getWideScreen = () => window.matchMedia('(min-width: 768px)').matches;
const getWideScreenServer = () => false;

export function RolePlay({ dialogue, lessonNum }: { dialogue: Dialogue; lessonNum: number }) {
  const router = useRouter();
  const wideScreen = useSyncExternalStore(subscribeWideScreen, getWideScreen, getWideScreenServer);
  const [state, dispatch] = useReducer(
    (current: ReturnType<typeof createRolePlay>, action: RolePlayAction) => stepRolePlay(dialogue, current, action),
    dialogue,
    createRolePlay,
  );
  const [hasVoice, setHasVoice] = useState(false);
  const scrollArea = useRef<HTMLDivElement>(null);
  const revealedLine = useRef<number | null>(null);
  const view = rolePlayView(dialogue, state);
  const { speechStart, speechEnd } = view;
  const role = dialogue.roles.find((item) => item.id === state.roleId)!;
  const currentIndex = state.phase === 'session' ? state.index : null;
  const revealed = state.phase === 'session' && state.revealed;

  useEffect(() => {
    let alive = true;
    hasJapaneseVoice().then((available) => {
      if (alive) setHasVoice(available);
    });
    return () => {
      alive = false;
      cancelSpeech();
    };
  }, []);

  useEffect(() => {
    if (!hasVoice || speechStart === speechEnd) return;
    let active = true;
    let index = speechStart;
    const playNext = () => {
      if (!active || index >= speechEnd) return;
      const line = dialogue.lines[index++];
      const utterance = speak(line.kana ?? toKanaSentence(line.jp), 1, undefined, rolePitch(dialogue.roles, line.speaker));
      if (utterance) utterance.onend = playNext;
    };
    playNext();
    return () => {
      active = false;
      cancelSpeech();
    };
  }, [speechStart, speechEnd, hasVoice, dialogue]);

  useEffect(() => {
    const area = scrollArea.current;
    if (!area) return;
    const line = revealedLine.current === null ? null : area.querySelector(`[data-line-index="${revealedLine.current}"]`);
    // Giữ câu vừa mở trong tầm nhìn khi phần đối thoại tiếp theo được thêm vào.
    if (line) area.scrollTop += line.getBoundingClientRect().top - area.getBoundingClientRect().top;
    else area.scrollTop = area.scrollHeight;
    revealedLine.current = null;
  }, [currentIndex, revealed, state.phase]);

  const exit = () => {
    cancelSpeech();
    router.push(`/hoc/${lessonNum}#hoi-thoai`);
  };
  const advance = () => {
    cancelSpeech();
    revealedLine.current = state.phase === 'session' && !state.revealed ? state.index : null;
    dispatch({ type: 'next' });
  };
  const changeRole = () => {
    cancelSpeech();
    dispatch({ type: 'change-role' });
  };

  return (
    <SessionShell className="md:max-w-3xl lg:max-w-5xl">
      <header className="flex shrink-0 flex-col gap-2 py-3">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="quiz" onClick={exit} aria-label="Thoát về bài">
            <X aria-hidden="true" data-icon="inline-start" />
            Thoát
          </Button>
          {state.phase === 'session' && (
            <>
              <div
                role="progressbar"
                aria-label="Tiến độ hội thoại"
                aria-valuemin={0}
                aria-valuemax={view.total}
                aria-valuenow={view.count}
                aria-valuetext={`Câu ${view.count} trên ${view.total}`}
                className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
              >
                <div className="h-full origin-left bg-primary" style={{ transform: `scaleX(${view.count / view.total})` }} />
              </div>
              <span className="text-sm tabular-nums text-muted-foreground">{view.progress}</span>
            </>
          )}
        </div>
        {state.phase === 'session' && (
          <h1 className="text-center text-sm text-muted-foreground">
            {dialogue.title.vi} · vai <Furigana text={role.name} />
          </h1>
        )}
      </header>

      {state.phase === 'pick' && (
        <>
          <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto pb-4">
            <div className="lg:grid lg:grid-cols-[minmax(0,38fr)_minmax(0,62fr)] lg:items-start lg:gap-8">
              <div>
                {dialogue.illustration && (
                  <SoftScene asset={dialogue.illustration} sizes="(min-width: 1024px) 380px, (min-width: 672px) 672px, 100vw" imageClassName="aspect-[16/10] h-auto object-[50%_45%] md:aspect-auto md:h-[30dvh] lg:aspect-[16/10] lg:h-auto" />
                )}
                <h1 className="mt-4 text-center font-serif text-2xl font-semibold sm:text-3xl">{dialogue.title.vi}</h1>
                <p className="mt-2 text-center text-sm text-muted-foreground">Bài {lessonNum} · {view.total} câu</p>
              </div>
              <div>
                <h2 id="roleplay-pick-label" className="mb-3 mt-8 text-lg font-semibold lg:mt-0">Chọn vai</h2>
                <ToggleGroup
                  orientation={wideScreen ? 'horizontal' : 'vertical'}
                  onKeyDownCapture={(event) => {
                    if (!wideScreen || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
                    const buttons = Array.from(event.currentTarget.querySelectorAll('button'));
                    const index = buttons.indexOf(event.target as HTMLButtonElement);
                    if (index < 0) return;
                    event.preventDefault();
                    event.stopPropagation();
                    buttons[verticalRoleIndex(index, buttons.length, event.key)]?.focus();
                  }}
                  variant="outline"
                  spacing={3}
                  value={[state.roleId]}
                  onValueChange={(values) => {
                    if (values[0]) dispatch({ type: 'select', roleId: values[0] });
                  }}
                  aria-labelledby="roleplay-pick-label"
                  className="w-full md:grid md:grid-cols-2"
                >
                  {dialogue.roles.map((item) => (
                    <ToggleGroupItem key={item.id} value={item.id} className={cn('h-auto min-h-20 w-full justify-start gap-3 whitespace-normal rounded-xl p-4 md:relative md:min-h-48 md:flex-col md:justify-center md:gap-4', state.roleId === item.id && 'border-primary')}>
                      <RoleAvatar role={item} size={40} className="md:size-24" />
                      <span className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left md:flex-none md:items-center md:text-center md:text-xl">
                        <Furigana text={item.name} />
                        <span className="text-sm text-muted-foreground">{dialogue.lines.filter((line) => line.speaker === item.id).length} câu</span>
                      </span>
                      {state.roleId === item.id && <Check aria-hidden="true" className="size-5 shrink-0 text-primary md:absolute md:right-3 md:top-3" />}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>
          </div>
          <footer className="shrink-0 py-4 md:mx-auto md:w-full md:max-w-[40rem]">
            <Button type="button" size="quiz" className="w-full" onClick={() => dispatch({ type: 'start' })}>
              Bắt đầu <ArrowRight aria-hidden="true" data-icon="inline-end" />
            </Button>
          </footer>
        </>
      )}

      {state.phase === 'session' && (
        <>
          <div ref={scrollArea} role="region" aria-label="Đoạn hội thoại" tabIndex={0} className="scrollbar-none min-h-0 flex-1 overflow-y-auto rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring md:mx-auto md:w-full md:max-w-[47.5rem]">
            <ol aria-live="polite" aria-relevant="additions text" className="flex flex-col gap-6 py-5 md:gap-8">
              {view.visibleLines.map(({ line, index, isOwn, hidden }) => {
                const speaker = dialogue.roles.find((item) => item.id === line.speaker)!;
                if (hidden) {
                  return (
                    <li key={index} data-line-index={index} className={cn('flex w-[90%] min-w-0 flex-col gap-2', isOwn && 'ml-auto items-end')}>
                      <div className={cn('flex items-center gap-2', isOwn && 'flex-row-reverse')}>
                        <RoleAvatar role={speaker} size={32} />
                        <Furigana text={speaker.name} className="text-sm font-medium" />
                      </div>
                      <div className="w-full min-w-0 rounded-2xl border border-dashed border-primary bg-background p-4 sm:p-5">
                        <p className="mb-3 text-sm font-semibold text-primary">Lượt của bạn</p>
                        <p className="leading-relaxed md:text-lg">{line.translation.vi}</p>
                      </div>
                    </li>
                  );
                }
                return (
                  <li key={index} data-line-index={index} className="min-w-0">
                    <DialogueBubble
                      role={speaker}
                      line={line}
                      side={isOwn ? 'right' : 'left'}
                      pitch={rolePitch(dialogue.roles, line.speaker)}
                    />
                  </li>
                );
              })}
            </ol>
          </div>
          <footer className="shrink-0 py-4 md:mx-auto md:w-full md:max-w-[40rem]">
            <TornCard className="p-3 sm:p-4">
              <Button type="button" size="quiz" className="w-full" onClick={advance}>
                {view.buttonLabel} <ArrowRight aria-hidden="true" data-icon="inline-end" />
              </Button>
            </TornCard>
          </footer>
        </>
      )}

      {state.phase === 'done' && (
        <div className="scrollbar-none flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto py-8 text-center">
          <RoleAvatar role={role} size={48} />
          <h1 className="font-serif text-3xl font-semibold">Xong</h1>
          <p className="text-sm text-muted-foreground">Vai <Furigana text={role.name} /> · {view.total} câu</p>
          <div className="mt-2 flex w-full max-w-sm flex-col gap-3">
            <Button type="button" size="quiz" onClick={changeRole}>Đổi vai</Button>
            <Button type="button" size="quiz" variant="outline" onClick={exit}>Về bài</Button>
          </div>
        </div>
      )}
    </SessionShell>
  );
}
