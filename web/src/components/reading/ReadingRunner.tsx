'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { ALargeSmall, ArrowRight, ChevronLeft, X } from 'lucide-react';
import { Illustration } from '@/components/Illustration';
import { SessionShell } from '@/components/practice/SessionFrame';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_READING_DISPLAY, loadReadingDisplay, saveReadingDisplay, type ReadingDisplay } from '@/lib/reading-display';
import { type ReadingAction } from '@/lib/reading-session';
import { getReadingSession, isReadingSessionValid, updateReading } from '@/lib/reading-store';
import { cn } from '@/lib/utils';
import type { ReadingQuestion, ReadingSession } from '@/types/reading';
import { surfaceClass } from './display';
import { GlossaryHost } from './GlossaryHost';
import { ReadingBody, readingSpeakText } from './ReadingBody';
import { ReadingDisplaySheet } from './ReadingDisplaySheet';
import { ReadingResults } from './ReadingResults';
import { ReadingToolbar } from './ReadingToolbar';
import { scrollBehavior } from './scroll';

export const READING_LIST_HREF = '/luyen-tap/doc-hieu';

export function ReadingRunner({ id }: { id: string }) {
  const result = useLiveQuery(async () => {
    try { return { id, session: await getReadingSession(id), error: '' }; }
    catch { return { id, session: undefined, error: 'Không đọc được phiên đọc. Hãy tải lại trang.' }; }
  }, [id]);
  const problem = !result ? '' : result.error || (!result.session ? 'Không tìm thấy phiên đọc' : !isReadingSessionValid(result.session) ? 'Phiên đọc này bị lỗi, không mở được' : '');
  return (
    <SessionShell>
      {!result || result.id !== id ? <Skeleton className="mt-16 h-80 w-full rounded-xl" /> : problem ? (
        <div className="my-auto flex flex-col gap-6 text-center">
          <p role="alert">{problem}</p>
          <Link href={READING_LIST_HREF} className={buttonVariants({ size: 'quiz' })}>Về Luyện đọc</Link>
        </div>
      ) : result.session!.completedAt ? <ReadingResults session={result.session!} /> : <ReadingSessionView key={id} session={result.session!} />}
    </SessionShell>
  );
}

function ReadingSessionView({ session }: { session: ReadingSession }) {
  const router = useRouter();
  const { passage } = session;
  const total = passage.questions.length;
  const [display, setDisplay] = useState<ReadingDisplay>(DEFAULT_READING_DISPLAY);
  const [sheet, setSheet] = useState(false);
  const [showVi, setShowVi] = useState(true);
  const [lookup, setLookup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<ReadingAction | null>(null);
  const [broken, setBroken] = useState('');
  // Bản vừa ghi xong: chặn gửi action kế bằng revision cũ trước khi truy vấn Dexie kịp báo lại.
  const [written, setWritten] = useState<ReadingSession | null>(null);
  const current = written && written.id === session.id && written.revision > session.revision ? written : session;
  const questionCard = useRef<HTMLDivElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const shownIndex = useRef(current.questionIndex);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => { if (active) setDisplay(loadReadingDisplay()); });
    return () => { active = false; };
  }, []);

  const question = passage.questions[current.questionIndex]!;
  const answered = current.answers.length > current.questionIndex;
  const chosen = answered ? current.answers[current.questionIndex]!.selectedOptionId : current.selectedOptionId;

  useEffect(() => {
    if (shownIndex.current === current.questionIndex) return;
    shownIndex.current = current.questionIndex;
    questionCard.current?.scrollIntoView({ block: 'start', behavior: scrollBehavior() });
  }, [current.questionIndex]);
  useEffect(() => { if (answered) nextButton.current?.focus(); }, [answered]);

  const send = useCallback(async (action: ReadingAction) => {
    if (busy) return;
    setBusy(true);
    setFailed(null);
    try {
      const result = await updateReading(current.id, action, { revision: current.revision, questionIndex: current.questionIndex });
      if ('session' in result) setWritten(result.session);
      else setBroken(result.status === 'missing' ? 'Phiên đọc không còn trên máy' : 'Phiên đọc này bị lỗi, không ghi tiếp được');
    } catch { setFailed(action); }
    finally { setBusy(false); }
  }, [busy, current.id, current.revision, current.questionIndex]);

  const changeDisplay = (next: ReadingDisplay) => { setDisplay(next); saveReadingDisplay(next); };
  const dialogue = passage.kind === 'dialogue';

  return (
    <>
      <div className="shrink-0 pb-2 pt-2">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" className="size-11 shrink-0 rounded-full border border-border bg-secondary text-foreground hover:bg-muted" aria-label="Về danh sách" onClick={() => router.push(READING_LIST_HREF)}>
            <ChevronLeft className="size-5" aria-hidden="true" />
          </Button>
          <h1 className="min-w-0 flex-1 font-serif text-lg font-semibold leading-tight sm:text-xl">{passage.titleVi}</h1>
          <Button type="button" variant="ghost" size="icon" className="size-11 shrink-0 rounded-full border border-border bg-secondary text-foreground hover:bg-muted" aria-label="Cài đặt đọc" onClick={() => setSheet(true)}>
            <ALargeSmall className="size-5" aria-hidden="true" />
          </Button>
        </div>
        <div className="mt-1 flex items-center gap-3 pl-14 pr-1">
          <div
            role="progressbar"
            aria-valuenow={current.questionIndex + 1}
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuetext={`Câu ${current.questionIndex + 1} trên ${total}`}
            className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full origin-left bg-primary motion-safe:transition-transform motion-safe:duration-250 ease-smooth-out" style={{ transform: `scaleX(${current.answers.length / total})` }} />
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">{current.questionIndex + 1}/{total}</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-4 pt-1">
        <div className="flex flex-col gap-4">
          <GlossaryHost glossary={passage.glossary}>
            {({ pick, activeEntryId }) => (
              <>
                {passage.illustration && (
                  <div className="overflow-hidden rounded-2xl">
                    <Illustration asset={passage.illustration} sizes="(min-width: 768px) 728px, 100vw" eager className="h-44 w-full object-cover sm:h-56" />
                  </div>
                )}
                <div className={cn('rounded-2xl', surfaceClass(display), dialogue && 'p-3 sm:p-4')}>
                  <ReadingBody passage={passage} display={display} showVi={showVi} lookup={lookup} activeEntryId={activeEntryId} onPick={pick} />
                </div>
              </>
            )}
          </GlossaryHost>

          <ReadingToolbar
            listenText={passage.sentences.map((s) => readingSpeakText(s.jp)).join('\n')}
            lookup={lookup}
            onLookup={() => setLookup((v) => !v)}
            showVi={showVi}
            onShowVi={() => setShowVi((v) => !v)}
          />

          <div ref={questionCard} className="scroll-mt-2">
            <QuestionCard question={question} index={current.questionIndex} total={total} chosen={chosen} locked={answered} busy={busy} onSelect={(optionId) => void send({ type: 'select', optionId })} />
          </div>
        </div>
      </div>

      <div className="shrink-0 bg-background pb-3 pt-2">
        {broken ? (
          <div role="alert" className="flex flex-col gap-3 text-center text-sm">
            <p className="flex items-center justify-center gap-2 text-destructive"><X className="size-4 shrink-0" aria-hidden="true" />{broken}</p>
            <Link href={READING_LIST_HREF} className={buttonVariants({ size: 'quiz' })}>Về Luyện đọc</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {failed && (
              <div role="alert" className="flex flex-col gap-2 text-sm text-destructive">
                <p className="flex items-center gap-2"><X className="size-4 shrink-0" aria-hidden="true" />Chưa lưu được. Giữ trang này mở và thử lại.</p>
                <Button variant="outline" size="quiz" disabled={busy} onClick={() => void send(failed)}>Thử lại</Button>
              </div>
            )}
            {!failed && (answered ? (
              <Button ref={nextButton} size="quiz" disabled={busy} onClick={() => void send({ type: 'next' })}>Tiếp theo<ArrowRight aria-hidden="true" /></Button>
            ) : (
              <Button size="quiz" disabled={!current.selectedOptionId || busy} onClick={() => void send({ type: 'submit' })}>Trả lời<ArrowRight aria-hidden="true" /></Button>
            ))}
          </div>
        )}
      </div>

      <ReadingDisplaySheet open={sheet} onOpenChange={setSheet} display={display} onChange={changeDisplay} sample={readingSpeakText(passage.sentences[0]!.jp)} />
    </>
  );
}

function QuestionCard({ question, index, total, chosen, locked, busy, onSelect }: {
  question: ReadingQuestion;
  index: number;
  total: number;
  chosen: string | null;
  locked: boolean;
  /** Đang lưu lựa chọn trước: khóa radio để không bỏ mất thao tác âm thầm. */
  busy: boolean;
  onSelect: (optionId: string) => void;
}) {
  return (
    <fieldset className="rounded-2xl border border-border bg-card p-4">
      <legend className="sr-only">Câu {index + 1}/{total}: {question.promptVi}</legend>
      <p aria-hidden="true" className="text-sm text-muted-foreground">Câu {index + 1}/{total}</p>
      <p aria-hidden="true" className="mb-3 font-serif text-xl font-semibold">{question.promptVi}</p>
      <div className="flex flex-col gap-2">
        {question.options.map((option, i) => (
          <label
            key={option.id}
            className="group flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-3 py-2 transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent has-[:disabled]:cursor-default has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring"
          >
            <input type="radio" name={`reading-${question.id}`} className="sr-only" checked={chosen === option.id} disabled={locked || busy} onChange={() => onSelect(option.id)} />
            <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground group-has-[:checked]:border-primary">
              <span className="size-3 rounded-full bg-primary opacity-0 group-has-[:checked]:opacity-100" />
            </span>
            <span aria-hidden="true" className="w-4 shrink-0 text-sm text-muted-foreground">{i + 1}</span>
            <span className="min-w-0 flex-1 text-base">{option.textVi}</span>
          </label>
        ))}
      </div>
      {(busy || locked) && <p className="mt-3 text-sm text-muted-foreground">{busy ? 'Đang lưu…' : 'Đã trả lời'}</p>}
    </fieldset>
  );
}
