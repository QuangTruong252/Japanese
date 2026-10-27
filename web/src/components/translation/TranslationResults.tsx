'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronRight, X } from 'lucide-react';
import { formatDuration } from '@/components/practice/SessionFrame';
import { CONFIG_HREF, TranslationPrompt } from '@/components/translation/TranslationPrompt';
import { TranslationReview } from '@/components/translation/TranslationReview';
import { Button, buttonVariants } from '@/components/ui/button';
import { translationSentence } from '@/lib/translation';
import { createRetrySession, translationTally, type TranslationSession } from '@/lib/translation-session';
import { startTranslation } from '@/lib/translation-store';
import { cn } from '@/lib/utils';

const PREVIEW_ROWS = 3;

export function TranslationResults({ session }: { session: TranslationSession }) {
  const router = useRouter();
  const [opened, setOpened] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const total = session.items.length;
  const tally = translationTally(session);
  const right = tally.automatic + tally.self;
  const weak = session.items.map((item, index) => ({ item, index })).filter(({ index }) => !session.answers[index]!.correct);
  const rows = showAll ? weak : weak.slice(0, PREVIEW_ROWS);

  async function retry() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const next = await startTranslation(createRetrySession(session));
      router.push(`${CONFIG_HREF}/phien?id=${encodeURIComponent(next.id)}`);
    } catch {
      setError('Không lưu được phiên mới. Hãy kiểm tra dung lượng và thử lại.');
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-4">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 pb-8">
        <Link href={CONFIG_HREF} aria-label="Đóng kết quả" className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'size-11 rounded-xl')}><X aria-hidden="true" /></Link>
        <div role="status" className="sr-only">Xong lượt dịch. Đúng ý {right} trên {total} câu.</div>
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">Xong lượt dịch</h1>
        <div>
          <p className="text-muted-foreground">Đúng ý</p>
          <p className="font-serif text-muted-foreground"><span className="text-7xl font-semibold text-primary">{right}</span><span className="ml-2 text-2xl font-semibold">/ {total} câu</span></p>
        </div>
        <dl className="divide-y divide-border rounded-xl border border-border bg-card px-5">
          {([['Khớp mẫu', tally.automatic], ['Tự xác nhận', tally.self], ['Cần ôn', tally.review], ['Dùng gợi ý', tally.hinted]] as const).map(([label, value]) => (
            <div key={label} className="flex items-center gap-5 py-3">
              <dd className="order-first w-8 font-serif text-2xl font-semibold tabular-nums">{value}</dd>
              <dt>{label}</dt>
            </div>
          ))}
        </dl>
        <p className="text-sm text-muted-foreground">{formatDuration(session.elapsedSec)} · {Math.round(session.elapsedSec / total)} giây/câu</p>

        {weak.length > 0 && (
          <section aria-labelledby="translation-weak" className="flex flex-col gap-3 border-t border-border pt-6">
            <h2 id="translation-weak" className="font-serif text-2xl font-semibold">Câu cần ôn</h2>
            <ul className="flex flex-col gap-3">
              {rows.map(({ item, index }) => {
                const sentence = translationSentence(item.id)!;
                const open = opened === index;
                return (
                  <li key={item.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 text-lg"><TranslationPrompt sentence={sentence} direction={item.direction} /></div>
                      <button type="button" aria-expanded={open} onClick={() => setOpened(open ? null : index)} className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-primary">
                        {open ? 'Ẩn đối chiếu' : 'Xem đối chiếu'}<ChevronRight className={cn('size-4', open && 'rotate-90')} aria-hidden="true" />
                      </button>
                    </div>
                    {open && <div className="mt-4 border-t border-border pt-4"><TranslationReview sentence={sentence} direction={item.direction} answer={session.answers[index]!} /></div>}
                  </li>
                );
              })}
            </ul>
            {weak.length > PREVIEW_ROWS && (
              <Button variant="ghost" size="quiz" className="self-start" aria-expanded={showAll} onClick={() => setShowAll((value) => !value)}>
                {showAll ? 'Thu gọn' : `+${weak.length - PREVIEW_ROWS} câu nữa`}
              </Button>
            )}
          </section>
        )}

        {error && <p role="alert" className="text-sm text-destructive">✕ {error}</p>}
        <div className="flex flex-col gap-3">
          {weak.length > 0 && (
            <Button size="quiz" disabled={busy} onClick={() => void retry()}>{busy ? 'Đang mở…' : `Luyện ${weak.length} câu cần ôn`}<ArrowRight aria-hidden="true" /></Button>
          )}
          <Link href={CONFIG_HREF} className={buttonVariants({ size: 'quiz', variant: weak.length > 0 ? 'outline' : 'default' })}>Lượt mới</Link>
        </div>
      </div>
    </div>
  );
}
