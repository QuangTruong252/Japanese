'use client';

import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { speak } from '@/lib/tts';
import {
  type KanaType,
  type KanaCell,
  getKanaGroups,
} from '@/data/kana';
import { cn } from '@/lib/utils';

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
    <div className="space-y-6">
      {/* 1. Thanh chuyển đổi Hiragana <-> Katakana (Segmented Control) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div
          role="tablist"
          aria-label="Chọn bảng chữ cái"
          className="grid grid-cols-2 p-1 bg-muted/80 rounded-xl border border-border/60 max-w-sm w-full"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'hiragana'}
            onClick={() => setActiveTab('hiragana')}
            className={cn(
              'min-h-11 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all select-none',
              'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
              activeTab === 'hiragana'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="font-jp text-base font-bold text-primary">あ</span>
            <span>Hiragana</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'katakana'}
            onClick={() => setActiveTab('katakana')}
            className={cn(
              'min-h-11 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all select-none',
              'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
              activeTab === 'katakana'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="font-jp text-base font-bold text-primary">ア</span>
            <span>Katakana</span>
          </button>
        </div>

        {/* Hướng dẫn thao tác chạm nghe */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Volume2 className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>Chạm vào từng ô để nghe phát âm</span>
        </div>
      </div>

      {/* 2. Danh sách các nhóm bảng: Cơ bản (46), Âm đục (25), Âm ghép (33) */}
      <div className="space-y-8">
        {groups.map((group) => {
          const isThreeCol = group.columns.length === 3;

          return (
            <section
              key={group.id}
              className="space-y-3 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs"
            >
              <div className="space-y-0.5">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  {group.title}
                </h2>
                {group.subtitle && (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {group.subtitle}
                  </p>
                )}
              </div>

              {/* Bảng lưới âm */}
              <div className="pt-2">
                {/* Hàng tiêu đề cột nguyên âm (a, i, u, e, o hoặc ya, yu, yo) */}
                <div
                  className={cn(
                    'grid gap-1.5 sm:gap-2 mb-2',
                    isThreeCol ? 'grid-cols-3 max-w-sm mx-auto' : 'grid-cols-5'
                  )}
                  aria-hidden="true"
                >
                  {group.columns.map((col) => (
                    <div
                      key={col}
                      className="text-center text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 py-0.5"
                    >
                      {col}
                    </div>
                  ))}
                </div>

                {/* Các hàng chữ */}
                <div className="space-y-1.5 sm:space-y-2">
                  {group.rows.map((row) => (
                    <div
                      key={row.name}
                      className={cn(
                        'grid gap-1.5 sm:gap-2',
                        isThreeCol ? 'grid-cols-3 max-w-sm mx-auto' : 'grid-cols-5'
                      )}
                    >
                      {row.cells.map((cell, idx) => {
                        if (!cell) {
                          return (
                            <div
                              key={`${row.name}-empty-${idx}`}
                              className="min-h-13 sm:min-h-14 rounded-xl border border-dashed border-border/40 bg-muted/10 opacity-30 select-none"
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
                              'group min-h-13 sm:min-h-14 flex flex-col items-center justify-center p-1 rounded-xl',
                              'border transition-all select-none cursor-pointer',
                              'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring',
                              isSpeaking
                                ? 'border-primary bg-primary/10 text-primary scale-98 shadow-xs'
                                : 'border-border/80 bg-background/50 hover:bg-muted/60 hover:border-primary/40 active:scale-95'
                            )}
                          >
                            <span
                              className={cn(
                                'font-jp text-xl sm:text-2xl font-bold leading-none transition-colors',
                                isSpeaking ? 'text-primary' : 'text-foreground group-hover:text-primary'
                              )}
                            >
                              {cell.kana}
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-1 leading-none">
                              {cell.romaji}
                              {cell.altRomaji ? ` (${cell.altRomaji})` : ''}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
