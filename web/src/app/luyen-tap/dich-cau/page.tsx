'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight } from 'lucide-react';
import { Chip, PageTitle, TornCard } from '@/components/PaperKit';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/db';
import { loadSettings } from '@/lib/settings';
import { availableTranslationSentences, TRANSLATION_COUNTS, type TranslationMode } from '@/lib/translation';
import { createTranslationSession, parseTranslationConfig, TRANSLATION_CONFIG_KEY, type TranslationConfig } from '@/lib/translation-session';
import { startTranslation } from '@/lib/translation-store';
import { cn } from '@/lib/utils';

const MODES: { value: TranslationMode; label: string }[] = [
  { value: 'jp-vi', label: 'Nhật → Việt' },
  { value: 'vi-jp', label: 'Việt → Nhật' },
  { value: 'mixed', label: 'Trộn' },
];

const chipClass = 'w-full justify-center rounded-xl';

export default function TranslationConfigPage() {
  const router = useRouter();
  const [config, setConfig] = useState<TranslationConfig | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      let saved: TranslationConfig | null = null;
      try { saved = parseTranslationConfig(window.localStorage.getItem(TRANSLATION_CONFIG_KEY)); } catch { /* Dùng mặc định. */ }
      // Bài mặc định chỉ lấy từ tiến độ học; chọn ở đây không ghi ngược vào cài đặt.
      setConfig(saved ?? { mode: 'jp-vi', scope: loadSettings().learnedThroughLesson || 1, count: 10 });
    });
    return () => { active = false; };
  }, []);

  const unfinished = useLiveQuery(async () => {
    try {
      const sessions = await db.translationSessions.orderBy('updatedAt').reverse().toArray();
      return { session: sessions.find((s) => !s.completedAt), error: '' };
    } catch { return { session: undefined, error: 'Không đọc được phiên đã lưu. Hãy tải lại trang.' }; }
  }, []);

  function update(patch: Partial<TranslationConfig>) {
    if (!config) return;
    const next = { ...config, ...patch };
    setConfig(next);
    try { window.localStorage.setItem(TRANSLATION_CONFIG_KEY, JSON.stringify(next)); setError(''); }
    catch { setError('Chưa lưu được lựa chọn. Hãy thử lại.'); }
  }

  const available = config ? availableTranslationSentences(config.scope).length : 0;
  const count = config ? (config.count === 'all' || config.count > available ? available : config.count) : 0;
  const chosenCount = config && (config.count === 'all' || config.count > available) ? 'all' : config?.count;
  const modeLabel = MODES.find((m) => m.value === config?.mode)?.label;

  async function begin() {
    if (!config || !count || busy) return;
    setBusy(true);
    setError('');
    try {
      const session = await startTranslation(createTranslationSession(config.scope, config.mode, config.count));
      router.push(`/luyen-tap/dich-cau/phien?id=${encodeURIComponent(session.id)}`);
    } catch { setError('Không lưu được phiên dịch. Hãy kiểm tra dung lượng và thử lại.'); setBusy(false); }
  }

  const start = (
    <Button size="quiz" className="w-full" disabled={!count || busy || !unfinished} onClick={() => void begin()}>
      {busy ? 'Đang mở…' : `Bắt đầu ${count} câu`}<ArrowRight aria-hidden="true" />
    </Button>
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-12 pt-3 sm:px-6 lg:px-8">
      <PageTitle title="Dịch phản xạ" back={{ href: '/luyen-tap', label: 'Luyện tập' }} />
      {!config ? <Skeleton className="h-96 w-full rounded-xl" /> : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div className="flex flex-col gap-8">
            {unfinished?.session && (
              <TornCard className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">Phiên dở · Câu {Math.min(unfinished.session.index + 1, unfinished.session.items.length)}/{unfinished.session.items.length}</p>
                <Button size="quiz" variant="outline" onClick={() => router.push(`/luyen-tap/dich-cau/phien?id=${encodeURIComponent(unfinished.session!.id)}`)}>Tiếp tục<ArrowRight aria-hidden="true" /></Button>
              </TornCard>
            )}
            <section aria-labelledby="translation-mode" className="flex flex-col gap-3">
              <h2 id="translation-mode" className="text-lg font-semibold">Chiều dịch</h2>
              <div className="grid grid-cols-3 gap-2">
                {MODES.map(({ value, label }) => (
                  <Chip key={value} pressed={config.mode === value} className={chipClass} onClick={() => update({ mode: value })}>{label}</Chip>
                ))}
              </div>
            </section>
            <section className="flex flex-col gap-3">
              <label htmlFor="translation-scope" className="text-lg font-semibold">Đã học đến</label>
              <select id="translation-scope" value={config.scope} className="h-12 w-full rounded-xl border border-border bg-card px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring" onChange={(e) => update({ scope: Number(e.target.value) })}>
                {Array.from({ length: 25 }, (_, i) => <option key={i + 1} value={i + 1}>Bài {i + 1}</option>)}
              </select>
              <p className="text-sm text-muted-foreground">{available} câu khả dụng</p>
            </section>
            <section aria-labelledby="translation-count" className="flex flex-col gap-3">
              <h2 id="translation-count" className="text-lg font-semibold">Số câu</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TRANSLATION_COUNTS.map((n) => (
                  <Chip key={n} pressed={chosenCount === n} disabled={n > available} className={chipClass} onClick={() => update({ count: n })}>{n}</Chip>
                ))}
                <Chip pressed={chosenCount === 'all'} className={chipClass} onClick={() => update({ count: 'all' })}>Tất cả ({available})</Chip>
              </div>
            </section>
            {(error || unfinished?.error) && <p role="alert" className="text-sm text-destructive">✕ {error || unfinished?.error}</p>}
            <div className={cn('lg:hidden')}>{start}</div>
          </div>
          <TornCard className="hidden flex-col gap-3 lg:flex">
            <p className="font-serif text-xl font-semibold">{modeLabel}</p>
            <p className="font-serif text-3xl font-semibold">Bài 1 – {config.scope}</p>
            <p className="text-muted-foreground">{count} câu</p>
            <div className="max-w-[640px]">{start}</div>
          </TornCard>
        </div>
      )}
    </main>
  );
}
