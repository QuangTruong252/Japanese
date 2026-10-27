'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, Check, Lightbulb, X } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { JpInput } from '@/components/practice/JpInput';
import { PauseLayer, SessionHeader, SessionShell } from '@/components/practice/SessionFrame';
import { CONFIG_HREF } from '@/components/translation/TranslationPrompt';
import { TranslationPrompt } from '@/components/translation/TranslationPrompt';
import { TranslationResults } from '@/components/translation/TranslationResults';
import { TranslationReview } from '@/components/translation/TranslationReview';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/db';
import { canSubmitJapanese } from '@/lib/jp-input';
import { translationHint, translationSentence } from '@/lib/translation';
import { createTranslationSaver, type TranslationAction, type TranslationSession } from '@/lib/translation-session';
import { updateTranslation } from '@/lib/translation-store';
import { cn } from '@/lib/utils';

export function TranslationRunner({ id }: { id: string }) {
  const result = useLiveQuery(async () => {
    try { return { id, session: await db.translationSessions.get(id), error: '' }; }
    catch { return { id, session: undefined, error: 'Không đọc được phiên dịch. Hãy tải lại trang.' }; }
  }, [id]);
  return (
    <SessionShell>
      {!result || result.id !== id ? <Skeleton className="mt-16 h-80 w-full rounded-xl" /> : !result.session ? (
        <div className="my-auto flex flex-col gap-6 text-center">
          <p role="alert">{result.error || 'Không tìm thấy phiên dịch'}</p>
          <Link href={CONFIG_HREF} className={buttonVariants({ size: 'quiz' })}>Về Dịch phản xạ</Link>
        </div>
      ) : result.session.completedAt ? <TranslationResults session={result.session} /> : <TranslationSessionView key={id} session={result.session} />}
    </SessionShell>
  );
}

/** Đếm lên từng giây; dừng khi tạm dừng, ẩn tab hoặc khi `running` tắt. */
function useClock(initial: number, running: boolean) {
  const [seconds, setSeconds] = useState(initial);
  const latest = useRef(initial);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const sync = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);
  useEffect(() => {
    if (!running || !visible) return;
    const timer = setInterval(() => { latest.current += 1; setSeconds(latest.current); }, 1000);
    return () => clearInterval(timer);
  }, [running, visible]);
  return { seconds, latest };
}

const CHECKPOINT_MS = 15_000;

function TranslationSessionView({ session }: { session: TranslationSession }) {
  const router = useRouter();
  const answer = session.answers[session.index];
  const [paused, setPaused] = useState(false);
  const clock = useClock(session.elapsedSec, !paused && answer?.status !== 'graded');
  const [failed, setFailed] = useState<TranslationAction | null>(null);
  const [busy, setBusy] = useState(false);

  // Đồng hồ chỉ nằm trong bộ nhớ: ghi định kỳ, và khi tạm dừng, ẩn tab, xong câu hay thoát, để reload không mất thời gian đã trôi.
  const timed = !paused && answer?.status !== 'graded';
  useEffect(() => {
    if (!timed) return;
    const checkpoint = () => { void updateTranslation(session.id, session.index, { type: 'tick' }, clock.latest.current).catch(() => {}); };
    const onHide = () => { if (document.hidden) checkpoint(); };
    const timer = setInterval(checkpoint, CHECKPOINT_MS);
    document.addEventListener('visibilitychange', onHide);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onHide); checkpoint(); };
  }, [timed, session.id, session.index, clock.latest]);
  const saver = useMemo(
    () => createTranslationSaver((action) => updateTranslation(session.id, session.index, action, clock.latest.current)),
    [session.id, session.index, clock.latest],
  );
  const save = useCallback(async (action: TranslationAction) => {
    try {
      await saver.save(action);
      if (!saver.dirty) setFailed(null);
    } catch {
      setFailed(action);
      throw new Error('storage');
    }
  }, [saver]);
  const run = useCallback(async (action: TranslationAction) => {
    if (busy) return;
    setBusy(true);
    try { await save(action); } catch { /* Thông báo lỗi và nút thử lại nằm ở màn hình. */ }
    finally { setBusy(false); }
  }, [busy, save]);

  return (
    <>
      <SessionHeader
        regionLabel="Phiên dịch phản xạ"
        exitLabel="Thoát phiên dịch"
        onExit={() => router.push(CONFIG_HREF)}
        index={session.index}
        total={session.items.length}
        progress={session.answers.filter((a) => a.status === 'graded').length / session.items.length}
        duration={clock.seconds}
        isPaused={paused}
        pauseLabel={paused ? 'Tiếp tục làm bài' : 'Tạm dừng phiên'}
        onTogglePause={() => setPaused((value) => !value)}
      />
      <div className="relative flex min-h-0 flex-1 flex-col">
        {paused && <PauseLayer title="Phiên đang tạm dừng" resumeLabel="Tiếp tục làm bài" onResume={() => setPaused(false)} />}
        <TranslationQuestion key={`${session.id}:${session.index}`} session={session} paused={paused} busy={busy} run={run} save={save} />
      </div>
      {failed && (
        <div role="alert" className="flex shrink-0 flex-col gap-2 pb-3 text-sm text-destructive">
          <p className="flex items-center gap-2"><X className="size-4 shrink-0" aria-hidden="true" />Chưa lưu được. Giữ trang này mở và thử lại.</p>
          <Button variant="outline" size="quiz" disabled={busy} onClick={() => void run(saver.retryOf(failed))}>Thử lại</Button>
        </div>
      )}
    </>
  );
}

function TranslationQuestion({ session, paused, busy, run, save }: {
  session: TranslationSession;
  paused: boolean;
  busy: boolean;
  run: (action: TranslationAction) => Promise<void>;
  save: (action: TranslationAction) => Promise<void>;
}) {
  const item = session.items[session.index]!;
  const sentence = translationSentence(item.id)!;
  const direction = item.direction;
  const answer = session.answers[session.index];
  const [input, setInput] = useState(session.input);
  const nextButton = useRef<HTMLButtonElement>(null);
  const hint = translationHint(sentence, direction);
  const last = session.index === session.items.length - 1;
  const composing = useRef(false);

  useEffect(() => {
    if (answer?.status === 'graded') nextButton.current?.focus();
  }, [answer?.status]);

  const change = (value: string) => {
    setInput(value);
    void save({ type: 'input', value }).catch(() => {});
  };
  const submit = () => { if (input.trim()) void run({ type: 'answer', value: input }); };

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-2">
        <div inert={paused} className="mx-auto flex w-full max-w-xl flex-col gap-6 py-2 sm:py-6">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{direction === 'jp-vi' ? 'Nhật → Việt' : 'Việt → Nhật'}</p>
            <TranslationPrompt sentence={sentence} direction={direction} />
          </div>
          {answer ? <TranslationReview sentence={sentence} direction={direction} answer={answer} /> : (
            <>
              {direction === 'vi-jp'
                ? <JpInput label="Câu của bạn" value={input} onChange={change} onSubmit={submit} disabled={busy} />
                : (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="translation-input" className="text-sm font-semibold text-foreground">Bản dịch của bạn</label>
                    <textarea
                      id="translation-input"
                      rows={4}
                      value={input}
                      disabled={busy}
                      spellCheck={false}
                      autoComplete="off"
                      onChange={(e) => change(e.target.value)}
                      onCompositionStart={() => { composing.current = true; }}
                      onCompositionEnd={() => { composing.current = false; }}
                      onKeyDown={(e) => {
                        if (!e.shiftKey && canSubmitJapanese(e.nativeEvent, composing.current)) { e.preventDefault(); submit(); }
                      }}
                      className="w-full resize-y rounded-xl border border-border bg-card px-4 py-3 text-lg outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:opacity-50"
                    />
                    <p className="text-sm text-muted-foreground">Viết có dấu thanh; Enter để kiểm tra, Shift+Enter xuống dòng</p>
                  </div>
                )}
              <HintRow used={!!item.hintUsed} hint={hint} disabled={busy} onUse={() => void run({ type: 'hint' })} />
            </>
          )}
        </div>
      </div>
      <div inert={paused} className="mx-auto flex w-full max-w-xl shrink-0 flex-col gap-2 bg-background pb-3 pt-2">
        {!answer ? (
          <>
            <Button size="quiz" disabled={!input.trim() || busy} onClick={submit}>Kiểm tra<ArrowRight aria-hidden="true" /></Button>
            <Button variant="outline" size="quiz" disabled={busy} onClick={() => void run({ type: 'unknown' })}>Chưa biết</Button>
          </>
        ) : answer.status === 'reviewing' ? (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="quiz" disabled={busy} onClick={() => void run({ type: 'confirm', correct: false })}>Cần ôn</Button>
            <Button size="quiz" disabled={busy} onClick={() => void run({ type: 'confirm', correct: true })}>Đúng ý<Check aria-hidden="true" /></Button>
          </div>
        ) : (
          <Button ref={nextButton} size="quiz" disabled={busy} onClick={() => void run({ type: 'next' })}>
            {last ? 'Xem kết quả' : 'Câu tiếp'}<ArrowRight aria-hidden="true" />
          </Button>
        )}
      </div>
    </>
  );
}

function HintRow({ used, hint, disabled, onUse }: {
  used: boolean;
  hint: ReturnType<typeof translationHint>;
  disabled: boolean;
  onUse: () => void;
}) {
  if (!used) {
    return (
      <Button variant="outline" size="quiz" className="justify-start" disabled={disabled || !hint} onClick={onUse}>
        <Lightbulb aria-hidden="true" />{hint ? 'Gợi ý (một lần)' : 'Không có gợi ý'}
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3">
      <Lightbulb className="size-6 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {hint?.jp && <Furigana text={hint.jp} className="jp text-lg font-semibold" />}
        {hint?.vi && <p className={cn(hint.jp ? 'text-sm text-muted-foreground' : 'text-lg font-semibold')}>{hint.vi}</p>}
      </div>
      <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">Đã dùng gợi ý</span>
    </div>
  );
}
