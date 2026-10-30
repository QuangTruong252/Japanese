'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, BookOpen, Check, ChevronRight, MessageCircle } from 'lucide-react';
import { Accent, BookSpread, Chip, PageTitle, TornCard } from '@/components/PaperKit';
import { Illustration } from '@/components/Illustration';
import { Furigana } from '@/components/Furigana';
import { CharacterSheet } from '@/components/dialogue/CharacterSheet';
import { RoleAvatar } from '@/components/dialogue/RoleAvatar';
import { getCharacter, MAIN_CHARACTER_IDS } from '@/lib/characters';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { stripFurigana } from '@/lib/japanese';
import { loadSettings } from '@/lib/settings';
import { READING_PASSAGES } from '@/lib/reading-data';
import { DEFAULT_READING_FILTER, listReadingPassages, loadReadingScope, readingStatuses, resolveReadingScope, saveReadingScope, type ReadingListItem, type ReadingScope } from '@/lib/reading';
import { pickResumableSession, readingScore } from '@/lib/reading-session';
import { isReadingSessionValid, listReadingSessions, openReadingSession } from '@/lib/reading-store';
import { cn } from '@/lib/utils';
import type { ReadingSession } from '@/types/reading';

const PHIEN = '/luyen-tap/doc-hieu/phien';
const COVERAGE = [80, 85, 90, 95, 100];
const GRAMMAR = [0, 1, 2];
const chip = 'w-full justify-center rounded-xl';

/** Số câu đã nộp của phiên dở và điểm của lần xong gần nhất, theo bài. */
function progressOf(sessions: ReadingSession[], passageId: string) {
  const open = pickResumableSession(sessions, passageId);
  const done = sessions.find((s) => s.completedAt && s.passage.id === passageId);
  return { answered: open?.answers.length ?? 0, score: done ? readingScore(done) : null };
}

function ProgressRing({ value, total }: { value: number; total: number }) {
  const r = 10;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 28 28" className="size-7 shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="14" cy="14" r={r} fill="none" strokeWidth="3" className="stroke-muted" />
      <circle cx="14" cy="14" r={r} fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-primary" strokeDasharray={c} strokeDashoffset={c * (1 - value / total)} />
    </svg>
  );
}

function ReadingCard({ item, progress, busy, onOpen }: { item: ReadingListItem; progress: ReturnType<typeof progressOf>; busy: boolean; onOpen: () => void }) {
  const { passage, status, newVocab, newGrammar } = item;
  const total = passage.questions.length;
  const dialogue = passage.kind === 'dialogue';
  const fresh = [newVocab > 0 && `${newVocab} từ mới`, newGrammar > 0 && `${newGrammar} mẫu mới`].filter(Boolean).join(' · ');
  const state =
    status === 'in-progress' ? `Đang dở · ${progress.answered}/${total}`
      : status === 'completed' ? `Đã xong · ${progress.score?.correct ?? 0}/${progress.score?.total ?? total}`
        : 'Chưa đọc';
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onOpen}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring disabled:opacity-60"
    >
      {passage.illustration && <Illustration asset={passage.illustration} sizes="(min-width: 1024px) 400px, 100vw" className="h-36 w-full object-cover" />}
      <span className="flex flex-col gap-3 p-4 sm:p-5">
        <span className="font-serif text-xl font-semibold sm:text-2xl">{passage.titleVi}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-primary [&_svg]:size-5">
            {dialogue ? <MessageCircle aria-hidden="true" /> : <BookOpen aria-hidden="true" />}{dialogue ? 'Hội thoại' : 'Đoạn văn'}
          </span>
          {fresh && <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-medium text-muted-foreground [&_svg]:size-5"><BookOpen aria-hidden="true" />{fresh}</span>}
          <span className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            {status === 'in-progress' && <ProgressRing value={progress.answered} total={total} />}
            {status === 'completed' && <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-full bg-success text-background"><Check className="size-4" /></span>}
            {state}
            <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
          </span>
        </span>
      </span>
    </button>
  );
}

export function ReadingList() {
  const router = useRouter();
  // undefined: chưa đọc cấu hình; null: người học phải chọn mốc.
  const [scope, setScope] = useState<ReadingScope | null | undefined>(undefined);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) setScope(resolveReadingScope(loadReadingScope(), loadSettings().learnedThroughLesson));
    });
    return () => { active = false; };
  }, []);

  const data = useLiveQuery(async () => {
    try { return { sessions: (await listReadingSessions()).filter(isReadingSessionValid), error: '' }; }
    catch { return { sessions: [] as ReadingSession[], error: 'Không đọc được phiên đã lưu. Hãy tải lại trang.' }; }
  }, []);

  function update(patch: Partial<ReadingScope>) {
    const next = { ...(scope ?? { lesson: 1, ...DEFAULT_READING_FILTER }), ...patch };
    setScope(next);
    setError(saveReadingScope(next) ? '' : 'Chưa lưu được lựa chọn. Hãy thử lại.');
  }

  async function open(item: ReadingListItem) {
    if (!scope || opening) return;
    setOpening(item.passage.id);
    setError('');
    try {
      const session = await openReadingSession(item.passage, scope);
      router.push(`${PHIEN}?id=${encodeURIComponent(session.id)}`);
    } catch { setError('Không lưu được phiên đọc. Hãy kiểm tra dung lượng và thử lại.'); setOpening(null); }
  }

  const sessions = data?.sessions ?? [];
  const items = scope ? listReadingPassages(READING_PASSAGES, scope, readingStatuses(sessions)) : [];
  const unfinished = sessions.find((s) => !s.completedAt);

  const filters = scope === undefined ? null : (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <label htmlFor="reading-lesson" className="text-lg font-semibold">Đã học đến bài</label>
        <select
          id="reading-lesson"
          value={scope?.lesson ?? ''}
          className="h-12 w-full rounded-xl border border-border bg-card px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring"
          onChange={(e) => update({ lesson: Number(e.target.value) })}
        >
          {!scope && <option value="" disabled>Chọn bài</option>}
          {Array.from({ length: 25 }, (_, i) => <option key={i + 1} value={i + 1}>Bài {i + 1}</option>)}
        </select>
      </section>
      {scope && (
        <>
          <section role="group" aria-labelledby="reading-coverage" className="flex flex-col gap-3">
            <h2 id="reading-coverage" className="text-lg font-semibold">Từ đã biết</h2>
            <div className="grid grid-cols-5 gap-2">
              {COVERAGE.map((n) => <Chip key={n} pressed={scope.minCoverage === n} className={chip} onClick={() => update({ minCoverage: n })}>{n}%</Chip>)}
            </div>
          </section>
          <section role="group" aria-labelledby="reading-grammar" className="flex flex-col gap-3">
            <h2 id="reading-grammar" className="text-lg font-semibold">Mẫu mới tối đa</h2>
            <div className="grid grid-cols-3 gap-2">
              {GRAMMAR.map((n) => <Chip key={n} pressed={scope.maxNewGrammar === n} className={chip} onClick={() => update({ maxNewGrammar: n })}>{n}</Chip>)}
            </div>
          </section>
        </>
      )}
    </div>
  );

  const cast = (
    <section aria-labelledby="reading-cast" className="flex flex-col gap-3">
      <h2 id="reading-cast" className="font-serif text-xl font-semibold">Nhân vật</h2>
      <ul className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {MAIN_CHARACTER_IDS.map((id) => {
          const name = getCharacter(id)!.name;
          return (
            <li key={id} className="shrink-0">
              <button
                type="button"
                aria-label={`Xem giới thiệu ${stripFurigana(name)}`}
                onClick={() => setProfileId(id)}
                className="flex min-h-11 flex-col items-center gap-1 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring"
              >
                <RoleAvatar role={{ id, name }} size={48} sizes="(min-width: 768px) 140px, 110px" className="size-16 md:size-20" />
                <Furigana text={name} className="text-sm font-medium text-muted-foreground" />
              </button>
            </li>
          );
        })}
      </ul>
      <CharacterSheet id={profileId} onClose={() => setProfileId(null)} />
    </section>
  );

  const list = (
    <div className="flex flex-col gap-5">
      {cast}
      {unfinished && (
        <TornCard className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Phiên dở · {unfinished.passage.titleVi} · Câu {Math.min(unfinished.questionIndex + 1, unfinished.passage.questions.length)}/{unfinished.passage.questions.length}</p>
          <Button size="quiz" variant="outline" onClick={() => router.push(`${PHIEN}?id=${encodeURIComponent(unfinished.id)}`)}>Tiếp tục<ArrowRight aria-hidden="true" /></Button>
        </TornCard>
      )}
      {!data || scope === undefined ? <Skeleton className="h-72 w-full rounded-2xl" /> : !scope ? null : items.length === 0 ? (
        <div className="relative flex flex-col gap-2 rounded-2xl border border-border bg-card p-6">
          <Accent kind="petals" className="-right-2 -top-4 block w-24 lg:block" />
          <h2 className="font-serif text-2xl font-semibold">Chưa có bài đọc</h2>
        </div>
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <li key={item.passage.id} className="min-w-0">
              <ReadingCard item={item} progress={progressOf(sessions, item.passage.id)} busy={opening !== null} onOpen={() => void open(item)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-12 pt-3 sm:px-6 lg:px-8">
      <PageTitle title="Luyện đọc" back={{ href: '/luyen-tap', label: 'Luyện tập' }} />
      <Accent kind="sprig-right" className="right-0 top-10 block w-36 sm:right-2 sm:w-44 lg:right-6 lg:w-48" />
      {scope === undefined ? <Skeleton className="h-72 w-full rounded-xl" /> : (
        <BookSpread
          leftWidth="narrow"
          sticky="left"
          stickyTop="4.25rem"
          left={
            <div className="flex flex-col gap-4">
              {/* Chưa chọn mốc thì bộ lọc luôn mở và nhãn "Đã học đến bài" là tiêu đề duy nhất; nút thu gọn chỉ có nghĩa khi đã có mốc. */}
              {scope && (
                <Button type="button" variant="outline" size="quiz" className="justify-between lg:hidden" aria-expanded={filtersOpen} aria-controls="reading-filters" onClick={() => setFiltersOpen((v) => !v)}>
                  <span>{`Đến bài ${scope.lesson} · ${scope.minCoverage}% · ≤${scope.maxNewGrammar} mẫu`}</span>
                  <ChevronRight className={cn('transition-transform', filtersOpen && 'rotate-90')} aria-hidden="true" />
                </Button>
              )}
              <div id="reading-filters" className={cn((filtersOpen || !scope) ? 'block' : 'hidden', 'lg:block')}>{filters}</div>
              {(error || data?.error) && <p role="alert" className="text-sm text-destructive">✕ {error || data?.error}</p>}
            </div>
          }
          right={list}
        />
      )}
    </main>
  );
}
