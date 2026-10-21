'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Tabs } from '@base-ui/react/tabs';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, CircleCheck, Clock } from 'lucide-react';
import { FeatureIcon } from '@/components/FeatureIcon';
import { ListRow, PageTitle, SectionHeader } from '@/components/PaperKit';
import { Button, buttonVariants } from '@/components/ui/button';
import { getKanaGroups, type KanaType } from '@/data/kana';
import { db } from '@/lib/db';
import { useDueClock } from '@/lib/use-due-clock';
import { dueChars, hardChars } from '@/lib/writing';
import { charStatus, writingCountsText, type CharStatus } from '@/lib/writing-ui';
import { cn } from '@/lib/utils';
import type { WritingCard } from '@/types';

const TABS: { type: KanaType; sample: string; label: string }[] = [
  { type: 'hiragana', sample: 'あ', label: 'Hiragana' },
  { type: 'katakana', sample: 'ア', label: 'Katakana' },
];

// Âm ghép không có ô viết riêng: ghép từ chữ đã có.
const GROUP_IDS = new Set(['basic', 'dakuon']);
const groupsOf = (type: KanaType) => getKanaGroups(type).filter((g) => GROUP_IDS.has(g.id));

// Thứ tự lưới để chuỗi gửi sang phiên không phụ thuộc thứ tự bấm.
const GRID_ORDER = TABS.flatMap((tab) =>
  groupsOf(tab.type).flatMap((g) => g.rows.flatMap((r) => r.cells.flatMap((c) => (c ? [c.kana] : [])))),
);

const STATUS_LABEL: Record<CharStatus, string> = {
  new: 'chưa viết',
  due: 'đến hạn ôn',
  hard: 'chữ khó',
  known: 'đã nhớ',
};

const ROW_GRID = 'grid grid-cols-[2.75rem_repeat(5,minmax(0,1fr))] gap-1.5 sm:gap-2';

function StatusMark({ status }: { status: CharStatus }) {
  if (status === 'new') return null;
  const place = 'absolute right-0.5 top-0.5';
  if (status === 'due') return <Clock className={cn(place, 'size-3.5 text-primary')} aria-hidden="true" />;
  if (status === 'known') {
    return <CircleCheck className={cn(place, 'size-3.5 text-muted-foreground')} aria-hidden="true" />;
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        place,
        'flex size-3.5 items-center justify-center rounded-full bg-warning text-xs font-bold leading-none text-warning-foreground',
      )}
    >
      !
    </span>
  );
}

export function WritingPicker() {
  const now = useDueClock();
  const cards = useLiveQuery(() => db.writingCards.toArray(), []);
  const [tab, setTab] = useState<KanaType>('hiragana');
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const byChar = useMemo(() => new Map((cards ?? []).map((c): [string, WritingCard] => [c.char, c])), [cards]);
  const dueCount = cards ? dueChars(cards, now).length : 0;
  const hardCount = cards ? hardChars(cards).length : 0;

  // Bật cả nhóm chữ, trừ khi đã bật hết thì tắt hết.
  const toggle = (chars: string[]) =>
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = chars.every((c) => next.has(c));
      for (const c of chars) {
        if (allOn) next.delete(c);
        else next.add(c);
      }
      return next;
    });

  const chosen = GRID_ORDER.filter((c) => selected.has(c));

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pt-3 sm:px-6 lg:px-8">
      <PageTitle
        title="Luyện viết"
        meta={writingCountsText(dueCount, hardCount) || undefined}
        back={{ href: '/', label: 'Bảng tin' }}
      />

      {(dueCount > 0 || hardCount > 0) && (
        <div className="space-y-2">
          {dueCount > 0 && (
            <ListRow
              href="/luyen-viet/phien?mode=den-han"
              icon={<FeatureIcon name="review" />}
              title="Ôn chữ đến hạn"
              detail={`${dueCount} chữ`}
            />
          )}
          {hardCount > 0 && (
            <ListRow
              href="/luyen-viet/phien?mode=kho"
              icon={<FeatureIcon name="weak-points" />}
              title="Chữ khó"
              detail={`${hardCount} chữ`}
            />
          )}
        </div>
      )}

      <Tabs.Root value={tab} onValueChange={(v) => setTab(v as KanaType)}>
        {/* Bảng kana dài hơn một màn: thanh tab dính đầu vùng cuộn để đổi Hiragana/Katakana ở bất cứ đâu. */}
        <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <Tabs.List className="grid w-full max-w-sm grid-cols-2 gap-1 rounded-xl border border-border bg-secondary p-1">
            {TABS.map(({ type, sample, label }) => (
              <Tabs.Tab
                key={type}
                value={type}
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-transparent text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring data-[active]:border-border data-[active]:bg-card data-[active]:font-semibold data-[active]:text-primary data-[active]:shadow-xs"
              >
                <span className="jp text-base font-bold text-primary" lang="ja">
                  {sample}
                </span>
                {label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </div>

        {TABS.map(({ type }) => (
          <Tabs.Panel key={type} value={type} className="mt-6 space-y-8 outline-none">
            {groupsOf(type).map((group) => (
              <section key={group.id} aria-labelledby={`write-group-${type}-${group.id}`}>
                <SectionHeader id={`write-group-${type}-${group.id}`} title={group.title} />
                <div className="space-y-1.5 sm:space-y-2">
                  <div className={ROW_GRID} aria-hidden="true">
                    <span />
                    {group.columns.map((col) => (
                      <span
                        key={col}
                        className="py-0.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {col}
                      </span>
                    ))}
                  </div>

                  {group.rows.map((row) => {
                    const chars = row.cells.flatMap((c) => (c ? [c.kana] : []));
                    const rowName = row.name.charAt(0).toUpperCase() + row.name.slice(1);
                    const rowOn = chars.every((c) => selected.has(c));
                    return (
                      <div key={row.name} className={ROW_GRID}>
                        <button
                          type="button"
                          aria-pressed={rowOn}
                          aria-label={`Chọn hàng ${rowName}`}
                          onClick={() => toggle(chars)}
                          className={cn(
                            'min-h-14 rounded-xl border text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
                            rowOn
                              ? 'border-primary bg-accent text-primary'
                              : 'border-border bg-secondary text-muted-foreground hover:bg-muted',
                          )}
                        >
                          {rowName}
                        </button>
                        {row.cells.map((cell, idx) => {
                          if (!cell) {
                            return (
                              <div
                                key={`${row.name}-empty-${idx}`}
                                className="min-h-14 rounded-xl border border-dashed border-border/40 bg-muted/10 opacity-30"
                                aria-hidden="true"
                              />
                            );
                          }
                          const on = selected.has(cell.kana);
                          const status = charStatus(byChar.get(cell.kana), now);
                          return (
                            <button
                              key={cell.kana}
                              type="button"
                              aria-pressed={on}
                              aria-label={`${cell.kana}, ${cell.romaji}, ${STATUS_LABEL[status]}`}
                              onClick={() => toggle([cell.kana])}
                              className={cn(
                                'relative flex min-h-14 flex-col items-center justify-center rounded-xl border p-1 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
                                on ? 'border-primary bg-accent text-primary' : 'border-border bg-card hover:bg-muted/60',
                              )}
                            >
                              <span
                                className={cn('jp text-xl font-bold leading-none sm:text-2xl', !on && 'text-foreground')}
                                lang="ja"
                              >
                                {cell.kana}
                              </span>
                              <span
                                className={cn('mt-1 text-xs font-medium leading-none', !on && 'text-muted-foreground')}
                              >
                                {cell.romaji}
                              </span>
                              <StatusMark status={status} />
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </Tabs.Panel>
        ))}
      </Tabs.Root>

      {/* Vùng cuộn chừa pb-28 (sm: pb-32) cho AppNav cao ~75px + vùng an toàn, và sticky dừng ở mép trong padding đó:
          bù phần dư (37px, sm: 53px) để thanh nằm sát trên nav. Từ lg nav là thanh bên, vùng cuộn không có padding. */}
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)-37px)] z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:bottom-[calc(env(safe-area-inset-bottom,0px)-53px)] sm:px-6 lg:-mx-8 lg:bottom-0 lg:px-8">
        {chosen.length > 0 ? (
          <Link
            href={`/luyen-viet/phien?c=${encodeURIComponent(chosen.join(''))}`}
            className={cn(buttonVariants({ size: 'quiz' }), 'w-full font-semibold')}
          >
            Viết {chosen.length} chữ
            <ArrowRight aria-hidden="true" />
          </Link>
        ) : (
          <Button size="quiz" className="w-full font-semibold" disabled>
            Viết 0 chữ
            <ArrowRight aria-hidden="true" />
          </Button>
        )}
      </div>
    </main>
  );
}
