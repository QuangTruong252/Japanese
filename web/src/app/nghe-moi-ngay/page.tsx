'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, CalendarDays, Headphones } from 'lucide-react';
import { PageTitle, TornCard } from '@/components/PaperKit';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/db';
import { localDay, selectDailyDictation } from '@/lib/dictation';
import { createDictationSession, DICTATION_SCOPE_KEY } from '@/lib/dictation-session';
import { startDictation } from '@/lib/dictation-store';
import { loadSettings } from '@/lib/settings';

export default function DictationPage() {
  const router = useRouter();
  const [scope, setScope] = useState(0);
  const [day, setDay] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setDay(localDay());
      try {
        const saved = Number(window.localStorage.getItem(DICTATION_SCOPE_KEY));
        setScope(Number.isInteger(saved) && saved >= 1 && saved <= 25 ? saved : loadSettings().learnedThroughLesson);
      } catch { setError('Không đọc được phạm vi đã lưu. Bạn có thể chọn lại.'); }
    });
    const refreshDay = () => setDay(localDay());
    window.addEventListener('focus', refreshDay);
    return () => { active = false; window.removeEventListener('focus', refreshDay); };
  }, []);

  const saved = useLiveQuery(async () => {
    try {
      const sessions = await db.dictationSessions.where('scope').equals(scope).toArray();
      return { scope, sessions: sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), error: '' };
    } catch { return { scope, sessions: [], error: 'Không đọc được bài nghe đã lưu. Hãy tải lại trang.' }; }
  }, [scope]);
  const current = saved?.scope === scope ? saved : undefined;
  const draft = current?.sessions.find((s) => !s.completedAt);
  const today = current?.sessions.find((s) => s.day === day);
  const count = scope && day ? selectDailyDictation(day, scope).length : 0;

  async function begin() {
    if (!scope || busy || !current || current.error) return;
    setBusy(true);
    setError('');
    try {
      window.localStorage.setItem(DICTATION_SCOPE_KEY, String(scope));
      const session = draft ?? await startDictation(createDictationSession(localDay(), scope));
      router.push(`/nghe-moi-ngay/phien?id=${encodeURIComponent(session.id)}`);
    } catch { setError('Không lưu được bài nghe. Hãy kiểm tra dung lượng và thử lại.'); setBusy(false); }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-12 pt-3 sm:px-6 lg:px-8">
      <PageTitle title="Nghe mỗi ngày" back={{ href: '/luyen-tap', label: 'Luyện tập' }} />
      <div className="w-full max-w-xl">
        {!day ? <Skeleton className="h-80 w-full rounded-xl" /> : (
          <TornCard className="flex flex-col gap-6">
            <p className="font-serif text-sm font-semibold text-primary">/ Hôm nay /</p>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><CalendarDays className="size-5" aria-hidden="true" />{new Date(`${day}T12:00:00`).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long' })}</span>
              {scope > 0 && <span className="flex items-center gap-2"><Headphones className="size-5" aria-hidden="true" />{draft?.sentences.length ?? today?.sentences.length ?? count} câu</span>}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="dictation-scope" className="font-medium">Đã học đến</label>
              <select id="dictation-scope" value={scope} disabled={busy} className="h-12 w-full rounded-xl border border-border bg-card px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring" onChange={(e) => {
                const next = Number(e.target.value);
                setScope(next);
                try { window.localStorage.setItem(DICTATION_SCOPE_KEY, String(next)); setError(''); }
                catch { setError('Chưa lưu được phạm vi. Hãy thử lại.'); }
              }}>
                <option value={0} disabled>Chọn bài đã học</option>
                {Array.from({ length: 25 }, (_, i) => <option value={i + 1} key={i + 1}>Bài {i + 1}</option>)}
              </select>
            </div>
            {scope > 0 && <p className="flex items-center justify-between gap-4 text-sm"><span className="text-muted-foreground">Phạm vi</span><span>Bài 1–{scope}</span></p>}
            {draft && <p className="text-sm text-muted-foreground">Phiên dở · {draft.day.split('-').reverse().join('/')} · Câu {draft.index + 1}/{draft.sentences.length}</p>}
            {(error || current?.error) && <p role="alert" className="text-sm text-destructive">✕ {error || current?.error}</p>}
            <Button size="quiz" disabled={!scope || !count || busy || !current || !!current.error} onClick={() => void begin()}>
              {busy ? 'Đang mở…' : draft ? 'Tiếp tục' : today?.completedAt ? 'Xem kết quả' : 'Bắt đầu'}<ArrowRight aria-hidden="true" />
            </Button>
          </TornCard>
        )}
      </div>
    </main>
  );
}
