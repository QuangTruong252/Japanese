'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { LayoutGrid, List } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { Illustration } from '@/components/Illustration';
import { SpeakButton } from '@/components/SpeakButton';
import { VerbGroupBadge } from '@/components/VerbGroupBadge';
import { Button } from '@/components/ui/button';
import { AUDIO_IMPORT_ENABLED } from '@/lib/features';
import { formatOptionalBrackets, maxFuriganaWordEm, stripFurigana } from '@/lib/japanese';
import { DEFAULT_SETTINGS, getSettingsSnapshot, saveSettings, subscribeSettings } from '@/lib/settings';
import { cn } from '@/lib/utils';
import type { VocabWord } from '@/types';

type TabValue = 'tu-vung' | 'ngu-phap' | 'nghe';

const VERB_GROUP: Record<string, number> = { 'verb-godan': 1, 'verb-ichidan': 2, 'verb-irregular': 3 };

const TAB_LABELS: { value: TabValue; label: string }[] = [
  { value: 'tu-vung', label: 'Từ vựng' },
  { value: 'ngu-phap', label: 'Ngữ pháp' },
  ...(AUDIO_IMPORT_ENABLED ? [{ value: 'nghe' as const, label: 'Nghe' }] : []),
];

// Chừa chỗ cho thanh dính (tab ~68 px, thêm dải từ vựng ~44 px) để đích cuộn không bị che.
const VOCAB_TARGET = 'scroll-mt-32';

const SPEAK_CLASS = 'size-11 w-11 shrink-0 rounded-full border border-border bg-secondary text-primary hover:bg-accent';

/** Đích cuộn chờ sau commit: phần tử theo id (null = đầu thanh tab) hoặc đầu panel đang hiện khi thanh dính. */
type PendingScroll = { id: string | null } | 'panel';

/** Hash → tab + phần tử đích (null = đầu thanh tab). Hash lạ → không làm gì. */
function parseHash(hash: string): { tab: TabValue; targetId: string | null } | null {
  let id: string;
  try {
    id = decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return null;
  }
  if (id === 'tu-vung' || id === 'ngu-phap') return { tab: id, targetId: null };
  // Link cũ `#nghe` không gãy khi tab Nghe đang ẩn: về đầu thanh tab của Từ vựng.
  if (id === 'nghe') return { tab: AUDIO_IMPORT_ENABLED ? 'nghe' : 'tu-vung', targetId: null };
  if (id.startsWith('vocab-')) return { tab: 'tu-vung', targetId: id };
  if (id.startsWith('grammar-')) return { tab: 'ngu-phap', targetId: id };
  return null;
}

function VocabItem({ w, view }: { w: VocabWord; view: 'list' | 'grid' }) {
  const group = VERB_GROUP[w.type];
  const speakLabel = stripFurigana(formatOptionalBrackets(w.word));
  const meaning = w.meaning.vi ? (
    <span className="translation">{w.meaning.vi}</span>
  ) : (
    <span className="italic opacity-50">Chưa có bản dịch</span>
  );

  if (view === 'grid') {
    const wordEm = w.illustration ? 0 : maxFuriganaWordEm(w.word);
    // Cụm dài (câu chào, câu hỏi) co trong một cột sẽ nhỏ quá khó đọc, nên cho chiếm hai cột.
    const wide = wordEm > 6;
    return (
      <div
        id={`vocab-${w.id}`}
        className={cn('rounded-xl border border-border bg-card p-2', wide && 'col-span-2', VOCAB_TARGET)}
      >
        <div
          className={cn(
            'relative rounded-lg bg-secondary',
            wide ? 'aspect-[2/1]' : 'aspect-square',
            w.illustration && 'overflow-hidden',
          )}
        >
          {w.illustration ? (
            <Illustration
              asset={w.illustration}
              sizes="(min-width: 1024px) 200px, (min-width: 640px) 30vw, 45vw"
              className="size-full object-cover"
            />
          ) : (
            // Cụm không ngắt được, nên co cỡ chữ theo bề rộng ô thay vì cắt chữ. cqi phải đặt ở phần tử con:
            // trên chính container nó tính theo khung nhìn.
            // pb-12 chừa chỗ cho nút loa ở góc dưới để chữ không bị đè.
            <div className="@container flex size-full items-center justify-center px-2 pb-12 pt-2 text-center text-foreground">
              <span style={{ fontSize: `min(1.5rem, ${(100 / Math.max(1, wordEm)).toFixed(2)}cqi)` }}>
                <Furigana text={w.word} className="jp-display font-bold" />
              </span>
            </div>
          )}
          <SpeakButton
            text={w.kana}
            label={speakLabel}
            className={cn(SPEAK_CLASS, 'absolute bottom-2 right-2')}
          />
        </div>
        <div className="space-y-0.5 px-1 pb-1 pt-2">
          {(w.illustration || group) && (
            <div className="flex flex-wrap items-center gap-2">
              {w.illustration && (
                <span className="jp text-base font-medium text-foreground">
                  <Furigana text={w.word} />
                </span>
              )}
              {group && <VerbGroupBadge group={group} />}
            </div>
          )}
          <p className="text-sm leading-relaxed text-muted-foreground">{meaning}</p>
        </div>
      </div>
    );
  }

  return (
    <div id={`vocab-${w.id}`} className={cn('flex items-center gap-3 p-3', VOCAB_TARGET)}>
      {w.illustration && (
        <Illustration
          asset={w.illustration}
          sizes="64px"
          className="size-16 shrink-0 rounded-lg bg-secondary object-cover"
        />
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="jp text-lg font-medium text-foreground">
            <Furigana text={w.word} />
          </span>
          {group && <VerbGroupBadge group={group} />}
        </div>
        {w.verbForms && (
          <p className="text-sm text-muted-foreground">
            Thể masu: <Furigana text={w.verbForms.masu} />
          </p>
        )}
        <p className="text-sm leading-relaxed text-muted-foreground">{meaning}</p>
      </div>
      <SpeakButton text={w.kana} label={speakLabel} className={SPEAK_CLASS} />
    </div>
  );
}

export function LessonTabs({
  vocab,
  grammar,
  listening,
}: {
  vocab: VocabWord[];
  grammar: ReactNode;
  listening?: ReactNode;
}) {
  const [tab, setTab] = useState<TabValue>('tu-vung');
  // Đích cuộn nằm trong ref (xóa không cần render lại); `request` chỉ để đánh thức effect khi tab không đổi.
  const pending = useRef<PendingScroll | null>(null);
  const [request, setRequest] = useState(0);
  const requestScroll = (target: PendingScroll) => {
    pending.current = target;
    setRequest((n) => n + 1);
  };
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const view = useSyncExternalStore(
    subscribeSettings,
    () => getSettingsSnapshot().vocabView,
    () => DEFAULT_SETTINGS.vocabView,
  );

  useEffect(() => {
    const goToHash = () => {
      const parsed = parseHash(window.location.hash);
      if (!parsed) return;
      setTab(parsed.tab);
      requestScroll({ id: parsed.targetId });
    };
    goToHash();
    // Link cùng trang từ SearchDialog cũng bắn hashchange (pushState tự nó thì không).
    window.addEventListener('hashchange', goToHash);
    return () => window.removeEventListener('hashchange', goToHash);
  }, []);

  // Panel ẩn không cuộn tới được, nên cuộn sau commit khi panel đích đã hiện.
  useEffect(() => {
    // Lưới lưu sẵn chưa áp vào lượt render hydrate đầu: đợi `view` đổi rồi cuộn để vị trí không lệch.
    const target = pending.current;
    if (!target || view !== getSettingsSnapshot().vocabView) return;
    const root = rootRef.current;
    if (target === 'panel') {
      const panel = root?.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])');
      if (panel && barRef.current) {
        panel.style.scrollMarginTop = `${barRef.current.offsetHeight}px`;
        panel.scrollIntoView({ block: 'start' });
      }
    } else {
      (target.id ? document.getElementById(target.id) : root)?.scrollIntoView({ block: 'start' });
    }
    pending.current = null;
  }, [tab, request, view]);

  const onTabChange = (value: TabValue) => {
    const bar = barRef.current;
    // Thanh là con đầu của root nên chỉ tách khỏi mép trên root khi đã dính (đã cuộn qua); so với root thay vì
    // đỉnh khung nhìn vì trên mobile vùng cuộn nằm dưới header. Lúc dính, đổi tab phải kéo đầu panel về dưới thanh.
    const rootTop = rootRef.current?.getBoundingClientRect().top;
    const stuck = !!bar && rootTop !== undefined && bar.getBoundingClientRect().top - rootTop > 1;
    setTab(value);
    window.history.replaceState(null, '', `#${value}`);
    if (stuck) requestScroll('panel');
  };

  return (
    <Tabs.Root ref={rootRef} value={tab} onValueChange={(v) => onTabChange(v as TabValue)}>
      <div
        ref={barRef}
        className="sticky top-0 z-10 -mx-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0"
      >
        <Tabs.List className="grid auto-cols-fr grid-flow-col rounded-xl border border-border bg-secondary p-1">
          {TAB_LABELS.map(({ value, label }) => (
            <Tabs.Tab
              key={value}
              value={value}
              className="min-h-11 rounded-lg border border-transparent text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring data-[active]:border-border data-[active]:bg-card data-[active]:font-semibold data-[active]:text-primary data-[active]:shadow-xs"
            >
              {label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {tab === 'tu-vung' && (
          <div className="mt-1 flex min-h-11 items-center justify-between">
            <span className="text-sm text-muted-foreground">{vocab.length} từ vựng</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label={view === 'list' ? 'Xem dạng lưới' : 'Xem dạng danh sách'}
              onClick={() => saveSettings({ vocabView: view === 'list' ? 'grid' : 'list' })}
            >
              {view === 'list' ? <LayoutGrid className="size-5" /> : <List className="size-5" />}
            </Button>
          </div>
        )}
      </div>

      <Tabs.Panel value="tu-vung" keepMounted className="mt-4 outline-none">
        {view === 'grid' ? (
          <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {vocab.map((w) => (
              <VocabItem key={w.id} w={w} view="grid" />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {vocab.map((w) => (
              <VocabItem key={w.id} w={w} view="list" />
            ))}
          </div>
        )}
      </Tabs.Panel>
      <Tabs.Panel value="ngu-phap" keepMounted className="mx-auto mt-4 max-w-3xl outline-none">
        {grammar}
      </Tabs.Panel>
      {listening && (
        <Tabs.Panel value="nghe" keepMounted className="mx-auto mt-4 max-w-3xl outline-none">
          {listening}
        </Tabs.Panel>
      )}
    </Tabs.Root>
  );
}
