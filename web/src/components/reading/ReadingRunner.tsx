'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { ALargeSmall, ArrowRight, ChevronDown, ChevronLeft, ChevronUp, X } from 'lucide-react';
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

export const READING_LIST_HREF = '/luyen-tap/doc-hieu';
const PANEL_ID = 'reading-question-panel';

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
  // Mặc định thu gọn để thấy bài trước; mở rồi thì giữ mở qua các câu.
  const [open, setOpen] = useState(false);
  const [lookup, setLookup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<ReadingAction | null>(null);
  const [broken, setBroken] = useState('');
  // Bản vừa ghi xong: chặn gửi action kế bằng revision cũ trước khi truy vấn Dexie kịp báo lại.
  const [written, setWritten] = useState<ReadingSession | null>(null);
  const current = written && written.id === session.id && written.revision > session.revision ? written : session;
  const panelBody = useRef<HTMLDivElement>(null);
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
    panelBody.current?.firstElementChild?.scrollTo({ top: 0 });
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
  // Lỗi lưu / phiên hỏng nằm trong panel, nên ép mở để không bị giấu khi thu gọn.
  const expanded = open || !!failed || !!broken;
  const chrome = 'size-11 shrink-0 rounded-full border border-border hover:bg-muted';

  const dragStart = useRef<number | null>(null);
  const dragged = useRef(false);
  const onHandleUp = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    const dy = e.clientY - dragStart.current;
    dragStart.current = null;
    if (Math.abs(dy) > 24) { dragged.current = true; setOpen(dy < 0); }
  };
  const onPanelKey = (e: React.KeyboardEvent) => {
    // Popover tra từ đóng trước (nó tự bắt Escape ở document); chỉ thu panel khi không còn popover.
    if (e.key === 'Escape' && open && !document.querySelector('[data-reading-scroll] [role="dialog"]')) setOpen(false);
  };

  return (
    <>
      {/* Không ảnh bìa: header gọn nhường chỗ cho bài đọc; ảnh bìa chỉ còn ở danh sách và kết quả. */}
      <header className="-mx-4 flex shrink-0 items-center gap-3 border-b border-border px-4 py-2 sm:-mx-6 sm:px-6">
        <Button type="button" variant="ghost" size="icon" className={cn(chrome, 'bg-secondary text-foreground')} aria-label="Về danh sách" onClick={() => router.push(READING_LIST_HREF)}>
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-3">
            <h1 className="line-clamp-2 min-w-0 flex-1 font-serif text-lg font-semibold leading-tight sm:text-xl">{passage.titleVi}</h1>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">{current.questionIndex + 1}/{total}</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={current.questionIndex + 1}
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuetext={`Câu ${current.questionIndex + 1} trên ${total}`}
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full origin-left bg-primary ease-smooth-out motion-safe:transition-transform motion-safe:duration-250" style={{ transform: `scaleX(${current.answers.length / total})` }} />
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" className={cn(chrome, 'bg-secondary text-foreground')} aria-label="Cài đặt đọc" onClick={() => setSheet(true)}>
          <ALargeSmall className="size-5" aria-hidden="true" />
        </Button>
      </header>

      <div data-reading-scroll className="scrollbar-none min-h-0 flex-1 overflow-y-auto overflow-x-clip pb-4 pt-3">
        <GlossaryHost glossary={passage.glossary}>
          {({ pick, activeEntryId }) => (
            <div className={cn('rounded-2xl', surfaceClass(display), dialogue && 'p-3 sm:p-4')}>
              <ReadingBody passage={passage} display={display} showVi={showVi} lookup={lookup} activeEntryId={activeEntryId} onPick={pick} />
            </div>
          )}
        </GlossaryHost>
      </div>

      <div className="shrink-0 bg-background">
        <ReadingToolbar
          listenText={passage.sentences.map((s) => readingSpeakText(s.jp)).join('\n')}
          lookup={lookup}
          onLookup={() => setLookup((v) => !v)}
          showVi={showVi}
          onShowVi={() => setShowVi((v) => !v)}
        />
        <section aria-label="Câu hỏi" onKeyDown={onPanelKey} className="-mx-4 mt-2 rounded-t-3xl border-x border-t border-border bg-card shadow-[0_-4px_16px_rgb(0_0_0/0.08)] sm:-mx-6">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={PANEL_ID}
            aria-label={expanded ? 'Thu gọn câu hỏi' : `Mở câu hỏi ${current.questionIndex + 1} trên ${total}`}
            onClick={() => { if (dragged.current) { dragged.current = false; return; } setOpen((v) => !v); }}
            onPointerDown={(e) => { dragStart.current = e.clientY; dragged.current = false; e.currentTarget.setPointerCapture(e.pointerId); }}
            onPointerUp={onHandleUp}
            onPointerCancel={() => { dragStart.current = null; }}
            className="relative flex min-h-14 w-full touch-none items-center justify-center gap-2 rounded-t-3xl px-4 pt-3 text-base font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <span aria-hidden="true" className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-muted-foreground/40" />
            {!expanded && <span aria-hidden="true">Câu hỏi {current.questionIndex + 1}/{total}</span>}
            {expanded
              ? <ChevronDown className="absolute right-5 top-4 size-6 text-muted-foreground" aria-hidden="true" />
              : <ChevronUp className="size-5 text-muted-foreground" aria-hidden="true" />}
          </button>
          <div className={cn('grid motion-safe:transition-[grid-template-rows] motion-safe:duration-250 ease-smooth-out', expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
            <div id={PANEL_ID} inert={!expanded} ref={panelBody} className="min-h-0 overflow-hidden">
              <div className="max-h-[55dvh] overflow-y-auto px-4 pb-3 sm:px-6">
                <QuestionCard question={question} index={current.questionIndex} total={total} chosen={chosen} locked={answered} busy={busy} onSelect={(optionId) => void send({ type: 'select', optionId })} />
                <div className="mt-3">
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
              </div>
            </div>
          </div>
        </section>
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
    <fieldset className="min-w-0">
      <legend className="sr-only">Câu {index + 1}/{total}: {question.promptVi}</legend>
      <p aria-hidden="true" className="text-sm text-muted-foreground">Câu {index + 1}/{total}</p>
      <p aria-hidden="true" className="mb-3 font-serif text-xl font-semibold">{question.promptVi}</p>
      <div className="flex flex-col gap-2">
        {question.options.map((option, i) => (
          <label
            key={option.id}
            className="group relative flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-3 py-2 transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent has-[:disabled]:cursor-default has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring"
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
