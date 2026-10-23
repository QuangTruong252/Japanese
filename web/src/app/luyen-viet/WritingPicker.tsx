'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@base-ui/react/tabs';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, CircleCheck, Clock } from 'lucide-react';
import { FeatureIcon } from '@/components/FeatureIcon';
import { Accent, BookSpread, ListRow, PageTitle, SectionHeader } from '@/components/PaperKit';
import { Button, buttonVariants } from '@/components/ui/button';
import { getKanaGroups, type KanaType } from '@/data/kana';
import { db } from '@/lib/db';
import { writingBackHref } from '@/lib/nav';
import { useDueClock } from '@/lib/use-due-clock';
import { dueChars, hardChars } from '@/lib/writing';
import { charStatus, writingCountsText, type CharStatus } from '@/lib/writing-ui';
import { cn } from '@/lib/utils';
import type { WritingCard } from '@/types';

type Tab = KanaType | 'kanji';

export interface KanjiGroup {
  id: string;
  title: string;
  cells: { char: string; hanviet: string }[];
}

const TABS: { type: Tab; sample: string; label: string }[] = [
  { type: 'hiragana', sample: 'あ', label: 'Hiragana' },
  { type: 'katakana', sample: 'ア', label: 'Katakana' },
  { type: 'kanji', sample: '漢', label: 'Kanji' },
];
const KANA_TABS = TABS.filter((t): t is { type: KanaType; sample: string; label: string } => t.type !== 'kanji');

// Âm ghép không có ô viết riêng: ghép từ chữ đã có.
const GROUP_IDS = new Set(['basic', 'dakuon']);
const groupsOf = (type: KanaType) => getKanaGroups(type).filter((g) => GROUP_IDS.has(g.id));

// Thứ tự lưới để chuỗi gửi sang phiên không phụ thuộc thứ tự bấm.
const KANA_ORDER = KANA_TABS.flatMap((tab) =>
  groupsOf(tab.type).flatMap((g) => g.rows.flatMap((r) => r.cells.flatMap((c) => (c ? [c.kana] : [])))),
);

const STATUS_LABEL: Record<CharStatus, string> = {
  new: 'chưa viết',
  due: 'đến hạn ôn',
  hard: 'chữ khó',
  known: 'đã nhớ',
};

const LEGEND = Object.entries(STATUS_LABEL) as [CharStatus, string][];

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

function StartButton({ chosen, className }: { chosen: string[]; className?: string }) {
  if (chosen.length === 0) {
    return (
      <Button size="quiz" className={cn('w-full font-semibold', className)} disabled>
        Viết 0 chữ
        <ArrowRight aria-hidden="true" />
      </Button>
    );
  }
  return (
    <Link
      href={`/luyen-viet/phien?c=${encodeURIComponent(chosen.join(''))}`}
      className={cn(buttonVariants({ size: 'quiz' }), 'w-full font-semibold', className)}
    >
      Viết {chosen.length} chữ
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}

/** Ô kẻ chữ thập như giấy tập viết, chữ đã chọn nằm giữa. */
function RuledCell({ char }: { char: string }) {
  return (
    <li className="relative flex aspect-square items-center justify-center rounded-lg border border-border bg-card">
      <span aria-hidden="true" className="absolute inset-y-1 left-1/2 border-l border-dashed border-border" />
      <span aria-hidden="true" className="absolute inset-x-1 top-1/2 border-t border-dashed border-border" />
      <span className="jp relative text-3xl font-bold leading-none text-foreground xl:text-4xl" lang="ja">
        {char}
      </span>
    </li>
  );
}

export function WritingPicker({ kanjiGroups }: { kanjiGroups: KanjiGroup[] }) {
  const router = useRouter();
  const now = useDueClock();
  const cards = useLiveQuery(() => db.writingCards.toArray(), []);
  // Lối vào từ trang Kanji mở thẳng tab Kanji; tham số lạ thì về Hiragana.
  const tabParam = useSearchParams().get('tab');
  const [tab, setTab] = useState<Tab>(tabParam === 'katakana' || tabParam === 'kanji' ? tabParam : 'hiragana');
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

  const gridOrder = useMemo(
    () => [...KANA_ORDER, ...kanjiGroups.flatMap((g) => g.cells.map((c) => c.char))],
    [kanjiGroups],
  );
  const chosen = gridOrder.filter((c) => selected.has(c));

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pt-3 sm:px-6 lg:max-w-[1200px] lg:px-8">
      <PageTitle
        title="Luyện viết"
        meta={writingCountsText(dueCount, hardCount) || undefined}
        back={{
          href: '/',
          label: 'Quay lại',
          // Đọc lúc bấm: AppNav ghi trang trước trong effect, có thể chạy sau lần render đầu của trang này.
          onClick: (e) => {
            e.preventDefault();
            router.push(writingBackHref());
          },
        }}
      />

      <BookSpread
        leftWidth="wide"
        sticky="right"
        stickyTop="4.25rem"
        className="max-lg:space-y-0"
        left={
          <div className="space-y-6">
            {(dueCount > 0 || hardCount > 0) && (
              <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
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

            <Tabs.Root value={tab} onValueChange={(v) => setTab(v as Tab)}>
              {/* Bảng kana dài hơn một màn: thanh tab dính ngay dưới thanh quay lại để đổi Hiragana/Katakana ở bất cứ đâu. */}
              <div className="sticky top-11 z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
                <Tabs.List className="grid w-full max-w-md grid-cols-3 gap-1 rounded-xl border border-border bg-secondary p-1">
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

              {KANA_TABS.map(({ type }) => (
                <Tabs.Panel key={type} value={type} className="mt-6 space-y-8 outline-none">
                  <ul
                    aria-label="Chú giải trạng thái"
                    className="hidden flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground md:flex"
                  >
                    {LEGEND.map(([status, label]) => (
                      <li key={status} className="flex items-center gap-1.5">
                        <span className="relative size-4" aria-hidden="true">
                          <StatusMark status={status} />
                        </span>
                        {label}
                      </li>
                    ))}
                  </ul>
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
                                      on
                                        ? 'border-primary bg-accent text-primary'
                                        : 'border-border bg-card hover:bg-muted/60',
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        'jp text-xl font-bold leading-none sm:text-2xl',
                                        !on && 'text-foreground',
                                      )}
                                      lang="ja"
                                    >
                                      {cell.kana}
                                    </span>
                                    <span
                                      className={cn(
                                        'mt-1 text-xs font-medium leading-none',
                                        !on && 'text-muted-foreground',
                                      )}
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

              <Tabs.Panel value="kanji" className="mt-6 space-y-8 outline-none">
                {kanjiGroups.map((group) => {
                  const chars = group.cells.map((c) => c.char);
                  const allOn = chars.every((c) => selected.has(c));
                  return (
                    <section key={group.id} aria-labelledby={`write-group-kanji-${group.id}`}>
                      {/* SectionHeader không có chỗ cho nút: đặt nút chồng lên mép phải, cao hơn tiêu đề nên nâng lên cho giữa dòng. */}
                      <div className="relative">
                        <SectionHeader id={`write-group-kanji-${group.id}`} title={group.title} />
                        <button
                          type="button"
                          aria-pressed={allOn}
                          aria-label={`Chọn cả ${group.title}`}
                          onClick={() => toggle(chars)}
                          className={cn(
                            'absolute -top-2 right-0 min-h-11 rounded-full border px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
                            allOn
                              ? 'border-primary bg-accent text-primary'
                              : 'border-border bg-secondary text-muted-foreground hover:bg-muted',
                          )}
                        >
                          Chọn cả bài
                        </button>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 md:grid-cols-8 lg:grid-cols-6">
                        {group.cells.map(({ char, hanviet }) => {
                          const on = selected.has(char);
                          const status = charStatus(byChar.get(char), now);
                          return (
                            <button
                              key={char}
                              type="button"
                              aria-pressed={on}
                              aria-label={`${char}, ${hanviet}, ${STATUS_LABEL[status]}`}
                              onClick={() => toggle([char])}
                              className={cn(
                                'relative flex min-h-16 flex-col items-center justify-center rounded-xl border p-1 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
                                on
                                  ? 'border-primary bg-accent text-primary'
                                  : 'border-border bg-card hover:bg-muted/60',
                              )}
                            >
                              <span
                                className={cn(
                                  'jp text-2xl font-bold leading-none sm:text-3xl',
                                  !on && 'text-foreground',
                                )}
                                lang="ja"
                              >
                                {char}
                              </span>
                              <span
                                className={cn(
                                  'mt-1 max-w-full truncate text-xs font-medium uppercase leading-tight',
                                  !on && 'text-muted-foreground',
                                )}
                              >
                                {hanviet}
                              </span>
                              <StatusMark status={status} />
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </Tabs.Panel>
            </Tabs.Root>
          </div>
        }
        right={
          <section
            aria-labelledby="write-panel-title"
            className="relative hidden min-h-[30rem] space-y-4 pb-24 lg:block"
          >
            <h2 id="write-panel-title" className="font-serif text-xl font-semibold text-primary">
              / Phiên viết /
            </h2>
            {chosen.length > 0 ? (
              <ul className="grid grid-cols-5 gap-2">
                {chosen.slice(0, 20).map((c) => (
                  <RuledCell key={c} char={c} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Chọn chữ ở bảng bên trái để bắt đầu.</p>
            )}
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Đã chọn {chosen.length} chữ
              {chosen.length > 20 && ` · hiện 20 chữ đầu`}
            </p>
            <StartButton chosen={chosen} />
            <p className="text-center text-sm text-muted-foreground">Xem · Tô · Gợi ý · Tự viết</p>
            <Accent kind="sprig-right" className="-bottom-2 right-0 w-36" />
          </section>
        }
      />

      {/* Dưới md vùng cuộn chừa pb-28 (sm: pb-32) cho AppNav cao ~75px + vùng an toàn, và sticky dừng ở mép trong padding đó:
          bù phần dư (37px, sm: 53px) để thanh nằm sát trên nav. Từ md nav là rail/thanh bên, vùng cuộn không có padding.
          Từ lg nút nằm ở bảng bên phải nên thanh này ẩn. */}
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)-37px)] z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:bottom-[calc(env(safe-area-inset-bottom,0px)-53px)] sm:px-6 md:bottom-0 md:flex md:items-center md:gap-4 lg:hidden">
        <p className="hidden min-w-0 flex-1 truncate text-sm text-muted-foreground md:block" aria-live="polite">
          Đã chọn {chosen.length} chữ
          {chosen.length > 0 && (
            <span className="jp ml-3 text-lg font-semibold text-foreground" lang="ja">
              {chosen.join(' ')}
            </span>
          )}
        </p>
        <StartButton chosen={chosen} className="md:w-auto md:min-w-56" />
      </div>
    </main>
  );
}
