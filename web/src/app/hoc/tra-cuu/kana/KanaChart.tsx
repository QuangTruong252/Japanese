'use client';

import { useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { RotateCw } from 'lucide-react';
import { speak } from '@/lib/tts';
import {
  type KanaType,
  type KanaCell,
  getKanaGroups,
} from '@/data/kana';
import { getStrokes } from '@/lib/strokes';
import { BookSpread, SectionHeader } from '@/components/PaperKit';
import { SpeakButton } from '@/components/SpeakButton';
import { StrokeBox, type StrokeBoxHandle } from '@/components/writing/StrokeBox';
import { StrokeSteps } from '@/components/lookup/StrokeSteps';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TABS: { type: KanaType; sample: string; label: string }[] = [
  { type: 'hiragana', sample: 'あ', label: 'Hiragana' },
  { type: 'katakana', sample: 'ア', label: 'Katakana' },
];

/** Chữ cùng vị trí trong bảng của loại kia, để đổi tab mà panel vẫn giữ đúng âm đang xem. */
function counterpart(from: KanaType, to: KanaType, kana: string) {
  const source = getKanaGroups(from);
  const target = getKanaGroups(to);
  for (let g = 0; g < source.length; g++) {
    for (let r = 0; r < source[g].rows.length; r++) {
      const c = source[g].rows[r].cells.findIndex((cell) => cell?.kana === kana);
      if (c >= 0) return target[g].rows[r].cells[c]?.kana ?? kana;
    }
  }
  return kana;
}

function KanaPanel({ cell }: { cell: KanaCell }) {
  const strokes = getStrokes(cell.kana);
  const boxRef = useRef<StrokeBoxHandle>(null);
  const romaji = cell.altRomaji ? `${cell.romaji} / ${cell.altRomaji}` : cell.romaji;

  return (
    <div className="space-y-5">
      <div className="relative mx-auto size-56">
        {strokes ? (
          <>
            <StrokeBox
              ref={boxRef}
              strokes={strokes.d}
              numbers={strokes.n}
              mode="watch"
              label={`Thứ tự nét chữ ${cell.kana}`}
              onComplete={() => {}}
            />
            <button
              type="button"
              aria-label="Xem lại thứ tự nét"
              onClick={() => boxRef.current?.replay()}
              className="absolute -bottom-2 -right-2 flex size-11 items-center justify-center rounded-full border border-border bg-card text-primary shadow-xs outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring"
            >
              <RotateCw className="size-5" aria-hidden="true" />
            </button>
          </>
        ) : (
          <div className="relative flex size-full items-center justify-center rounded-2xl border border-border bg-card">
            <span aria-hidden="true" className="absolute inset-y-2 left-1/2 border-l border-dashed border-border" />
            <span aria-hidden="true" className="absolute inset-x-2 top-1/2 border-t border-dashed border-border" />
            <span lang="ja" className="jp-display relative select-none text-7xl font-semibold leading-none text-foreground">
              {cell.kana}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 border-b border-border pb-4">
        <span lang="ja" className="jp-display text-5xl font-semibold leading-none text-foreground">
          {cell.kana}
        </span>
        <div>
          <p className="font-serif text-2xl font-semibold text-foreground">{romaji}</p>
          {strokes && <p className="text-sm text-muted-foreground">{strokes.d.length} nét</p>}
        </div>
        <SpeakButton
          text={cell.kana}
          label={`Phát âm chữ ${cell.kana}`}
          iconClassName="size-5"
          className="size-11 w-11 rounded-full border border-border bg-secondary text-primary hover:bg-accent"
        />
      </div>

      {strokes && <StrokeSteps strokes={strokes.d} label={`Các bước viết chữ ${cell.kana}`} />}

      {strokes && (
        <Link
          href={`/luyen-viet/phien?c=${encodeURIComponent(cell.kana)}`}
          className={cn(buttonVariants({ variant: 'default', size: 'quiz' }), 'h-auto min-h-12 w-full py-3 font-semibold')}
        >
          Luyện viết chữ này
        </Link>
      )}

    </div>
  );
}

export function KanaChart({ header }: { header: ReactNode }) {
  const [activeTab, setActiveTab] = useState<KanaType>('hiragana');
  const [speakingKana, setSpeakingKana] = useState<string | null>(null);
  const [selectedKana, setSelectedKana] = useState('あ');

  const groups = getKanaGroups(activeTab);
  const selectedCell = groups
    .flatMap((group) => group.rows.flatMap((row) => row.cells))
    .find((cell) => cell?.kana === selectedKana);

  const handleTab = (type: KanaType) => {
    if (type === activeTab) return;
    setSelectedKana(counterpart(activeTab, type, selectedKana));
    setActiveTab(type);
  };

  const handleSpeak = (cell: KanaCell) => {
    setSelectedKana(cell.kana);
    setSpeakingKana(cell.kana);
    const utterance = speak(cell.kana);
    if (!utterance) {
      setTimeout(() => setSpeakingKana(null), 400);
      return;
    }
    const done = () => setSpeakingKana(null);
    utterance.addEventListener('end', done);
    utterance.addEventListener('error', done);
  };

  const left = (
    <div className="space-y-6">
      {header}
      <div className="space-y-8">
      <div
        role="tablist"
        aria-label="Chọn bảng chữ cái"
        className="grid w-full max-w-sm grid-cols-2 gap-1 rounded-xl border border-border bg-secondary p-1"
      >
        {TABS.map((tab) => (
          <button
            key={tab.type}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.type}
            onClick={() => handleTab(tab.type)}
            className={cn(
              'flex min-h-11 select-none items-center justify-center gap-2 rounded-lg text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
              activeTab === tab.type
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span className="jp text-base font-bold text-primary" lang="ja">
              {tab.sample}
            </span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {groups.map((group) => {
        const isThreeCol = group.columns.length === 3;
        const gridClass = cn('grid gap-1.5 sm:gap-2', isThreeCol ? 'mx-auto max-w-sm grid-cols-3' : 'grid-cols-5');

        return (
          <section key={group.id} aria-labelledby={`kana-group-${group.id}`}>
            <SectionHeader id={`kana-group-${group.id}`} title={group.title} />

            <div className="space-y-1.5 sm:space-y-2">
              <div className={cn(gridClass, 'mb-1')} aria-hidden="true">
                {group.columns.map((col) => (
                  <div
                    key={col}
                    className="py-0.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {col}
                  </div>
                ))}
              </div>

              {group.rows.map((row) => (
                <div key={row.name} className={gridClass}>
                  {row.cells.map((cell, idx) => {
                    if (!cell) {
                      return (
                        <div
                          key={`${row.name}-empty-${idx}`}
                          className="min-h-14 select-none rounded-xl border border-dashed border-border/40 bg-muted/10 opacity-30 md:min-h-16"
                          aria-hidden="true"
                        />
                      );
                    }

                    const isSpeaking = speakingKana === cell.kana;
                    const isSelected = selectedKana === cell.kana;

                    return (
                      <button
                        key={cell.kana}
                        type="button"
                        onClick={() => handleSpeak(cell)}
                        aria-label={`Phát âm chữ ${cell.kana}, đọc là ${cell.romaji}${cell.altRomaji ? ` hoặc ${cell.altRomaji}` : ''}`}
                        className={cn(
                          'flex min-h-14 select-none flex-col items-center justify-center rounded-xl border p-1 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring md:min-h-16',
                          isSpeaking
                            ? 'border-primary bg-accent'
                            : 'border-border bg-card hover:bg-muted/60',
                          isSelected && !isSpeaking && 'lg:border-primary/40 lg:bg-accent',
                        )}
                      >
                        <span
                          className={cn(
                            'jp text-xl font-bold leading-none sm:text-2xl md:text-3xl',
                            isSelected ? 'text-foreground lg:text-primary' : 'text-foreground',
                          )}
                          lang="ja"
                        >
                          {cell.kana}
                        </span>
                        <span className="mt-1 text-xs font-medium leading-none text-muted-foreground">
                          {cell.romaji}
                          {cell.altRomaji ? ` (${cell.altRomaji})` : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        );
      })}
      </div>
    </div>
  );

  const right = (
    <aside aria-label="Chi tiết chữ kana" aria-live="polite" className="hidden lg:block">
      {selectedCell && <KanaPanel key={selectedCell.kana} cell={selectedCell} />}
    </aside>
  );

  return (
    <BookSpread
      leftWidth="wide"
      sticky="right"
      stickyTop="4.25rem"
      className="max-lg:space-y-0"
      left={left}
      right={right}
    />
  );
}
