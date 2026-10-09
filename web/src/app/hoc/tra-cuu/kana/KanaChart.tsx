'use client';

import { useState } from 'react';
import { speak } from '@/lib/tts';
import {
  type KanaType,
  type KanaCell,
  getKanaGroups,
} from '@/data/kana';
import { SectionHeader } from '@/components/PaperKit';
import { cn } from '@/lib/utils';

const TABS: { type: KanaType; sample: string; label: string }[] = [
  { type: 'hiragana', sample: 'あ', label: 'Hiragana' },
  { type: 'katakana', sample: 'ア', label: 'Katakana' },
];

export function KanaChart() {
  const [activeTab, setActiveTab] = useState<KanaType>('hiragana');
  const [speakingKana, setSpeakingKana] = useState<string | null>(null);

  const groups = getKanaGroups(activeTab);

  const handleSpeak = (cell: KanaCell) => {
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

  return (
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
            onClick={() => setActiveTab(tab.type)}
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
                          className="min-h-14 select-none rounded-xl border border-dashed border-border/40 bg-muted/10 opacity-30"
                          aria-hidden="true"
                        />
                      );
                    }

                    const isSpeaking = speakingKana === cell.kana;

                    return (
                      <button
                        key={cell.kana}
                        type="button"
                        onClick={() => handleSpeak(cell)}
                        aria-label={`Phát âm chữ ${cell.kana}, đọc là ${cell.romaji}${cell.altRomaji ? ` hoặc ${cell.altRomaji}` : ''}`}
                        className={cn(
                          'flex min-h-14 select-none flex-col items-center justify-center rounded-xl border p-1 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
                          isSpeaking
                            ? 'border-primary bg-accent'
                            : 'border-border bg-card hover:bg-muted/60',
                        )}
                      >
                        <span className="jp text-xl font-bold leading-none text-foreground sm:text-2xl" lang="ja">
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
  );
}
