'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, Check, Headphones, Volume2, X } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { SessionShell } from '@/components/practice/SessionFrame';
import { JpInput } from '@/components/practice/JpInput';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { db } from '@/lib/db';
import type { DictationSession } from '@/lib/dictation-session';
import { updateDictation } from '@/lib/dictation-store';
import { particleHint } from '@/lib/practice-draft';
import { hasJapaneseVoice, speak } from '@/lib/tts';
import { loadSettings } from '@/lib/settings';
import { cn } from '@/lib/utils';
import { maxFuriganaWordEm } from '@/lib/japanese';
import type { DictationSentence } from '@/lib/dictation';

export function DictationRunner({ id }: { id: string }) {
  const result = useLiveQuery(async () => {
    try { return { id, session: await db.dictationSessions.get(id), error: '' }; }
    catch { return { id, session: undefined, error: 'Không đọc được bài nghe. Hãy tải lại trang.' }; }
  }, [id]);
  return (
    <SessionShell>
      {!result || result.id !== id ? <Skeleton className="mt-16 h-80 w-full rounded-xl" /> : !result.session ? (
        <div className="my-auto flex flex-col gap-6 text-center">
          <p role="alert">{result.error || 'Không tìm thấy phiên nghe'}</p>
          <Link href="/nghe-moi-ngay" className={buttonVariants({ size: 'quiz' })}>Về bài nghe</Link>
        </div>
      ) : result.session.completedAt ? <DictationResults session={result.session} /> : (
        <DictationQuestion key={`${id}:${result.session.index}`} session={result.session} />
      )}
    </SessionShell>
  );
}

function DictationQuestion({ session }: { session: DictationSession }) {
  const sentence = session.sentences[session.index];
  const answer = session.answers[session.index];
  const [input, setInput] = useState(session.input);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState('');
  const [audioError, setAudioError] = useState('');
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const attempt = useRef(0);
  const speechTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const nextButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (answer) nextButton.current?.focus();
  }, [answer]);
  useEffect(() => () => {
    attempt.current++;
    clearTimeout(speechTimeout.current);
    window.speechSynthesis?.cancel();
  }, []);

  async function play() {
    const token = ++attempt.current;
    clearTimeout(speechTimeout.current);
    setAudioError('');
    setPlaying(true);
    try {
      if (!await hasJapaneseVoice()) throw new Error('Chưa có giọng Nhật. Hãy cài giọng tiếng Nhật trên thiết bị rồi thử lại.');
      if (attempt.current !== token) return;
      if (loadSettings().soundVolume === 0) throw new Error('Âm lượng trong cài đặt đang bằng 0. Hãy tăng âm lượng rồi thử lại.');
      const utterance = speak(sentence.kana, rate);
      if (!utterance) throw new Error('Trình duyệt chưa hỗ trợ phát giọng Nhật.');
      speechTimeout.current = setTimeout(() => {
        if (token !== attempt.current) return;
        attempt.current++;
        window.speechSynthesis.cancel();
        setPlaying(false);
        setAudioError('Không phát được âm thanh. Hãy bấm nghe để thử lại.');
      }, 8000);
      utterance.onstart = () => { if (token === attempt.current) clearTimeout(speechTimeout.current); };
      utterance.onend = () => { if (token === attempt.current) { clearTimeout(speechTimeout.current); setPlaying(false); } };
      utterance.onerror = () => {
        if (token !== attempt.current) return;
        clearTimeout(speechTimeout.current);
        setPlaying(false);
        setAudioError('Không phát được âm thanh. Hãy bấm nghe để thử lại.');
      };
    } catch (err) {
      if (token !== attempt.current) return;
      setPlaying(false);
      setAudioError(err instanceof Error ? err.message : 'Không phát được âm thanh. Hãy thử lại.');
    }
  }

  async function save(action: 'input' | 'answer' | 'next', value = '') {
    try { await updateDictation(session.id, session.index, action, value); setError(''); }
    catch { setError('Chưa lưu được. Giữ trang này mở và thử lại.'); throw new Error('storage'); }
  }
  async function submit(value: string) {
    if (busy || answer) return;
    setBusy(true);
    try { await save('answer', value); } catch { /* Nội dung nhập vẫn ở trên màn hình. */ }
    finally { setBusy(false); }
  }
  const hint = answer && !answer.correct ? particleHint(answer.value, [sentence.kana, sentence.jp]) : null;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-4">
        <Link href="/nghe-moi-ngay" aria-label="Thoát bài nghe" className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'size-11 shrink-0 rounded-full')}><X aria-hidden="true" /></Link>
        <div role="progressbar" aria-label="Tiến độ bài nghe" aria-valuemin={0} aria-valuemax={session.sentences.length} aria-valuenow={session.answers.length} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full origin-left bg-primary" style={{ transform: `scaleX(${session.answers.length / session.sentences.length})` }} />
        </div>
        <span className="text-sm font-semibold tabular-nums text-muted-foreground">{session.index + 1}/{session.sentences.length}</span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6 py-4 sm:py-8">
          <div className="text-center">
            <h1 className="font-serif text-xl font-semibold">Nghe mỗi ngày</h1>
            <p className="mt-2 text-sm text-muted-foreground">Bài 1–{session.scope}</p>
          </div>
          <div className="flex flex-col items-center gap-3 py-2 sm:py-5">
            <Button variant="outline" className="size-20 rounded-full" onClick={() => void play()} aria-label={playing ? 'Phát lại câu' : 'Nghe câu'}><Volume2 className="size-8" aria-hidden="true" /></Button>
            <span aria-live="polite" className="text-sm font-medium">{playing ? 'Đang phát…' : 'Nghe câu'}</span>
            <ToggleGroup value={[String(rate)]} onValueChange={(values) => { if (values.length) setRate(Number(values[0])); }} aria-label="Tốc độ đọc" variant="outline">
              <ToggleGroupItem value="0.8" className="min-h-11 px-5">0.8×</ToggleGroupItem>
              <ToggleGroupItem value="1" className="min-h-11 px-5">1.0×</ToggleGroupItem>
            </ToggleGroup>
          </div>
          {audioError && <p role="alert" className="text-sm text-destructive">✕ {audioError}</p>}
          <JpInput label="Câu bạn nghe" value={answer?.value ?? input} onChange={(value) => {
            setInput(value);
            void save('input', value).catch(() => {});
          }} onSubmit={() => { if (input.trim()) void submit(input); }} disabled={!!answer || busy} state={!answer ? 'idle' : answer.correct ? 'correct' : 'incorrect'} />
          {error && <p role="alert" className="text-sm text-destructive">✕ {error}</p>}
          {answer ? (
            <>
              <section aria-label="Đáp án" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5" aria-live="polite">
                <p className={answer.correct ? 'flex items-center gap-2 text-success' : 'flex items-center gap-2 text-destructive'}>
                  {answer.correct ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}<span>{answer.correct ? 'Đúng' : 'Chưa đúng'}</span>
                </p>
                <Sentence sentence={sentence} />
                <p>{sentence.vi}</p>
                <Link href={`/hoc/${sentence.lesson}#ngu-phap`} className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline underline-offset-4">Bài {sentence.lesson}</Link>
                {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
              </section>
              <div className="sticky bottom-0 -mx-1 bg-background px-1 py-3">
              <Button ref={nextButton} className="w-full" size="quiz" disabled={busy} onClick={async () => {
                setBusy(true);
                try { await save('next'); } catch { /* Có thể thử lại mà không đổi điểm. */ }
                finally { setBusy(false); }
              }}>{session.index === session.sentences.length - 1 ? 'Xem kết quả' : 'Câu tiếp'}<ArrowRight aria-hidden="true" /></Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Button size="quiz" disabled={!input.trim() || busy} onClick={() => void submit(input)}>Kiểm tra<ArrowRight aria-hidden="true" /></Button>
              <Button variant="ghost" size="quiz" disabled={busy} onClick={() => void submit('')}>Chưa biết</Button>
              {error && <Button variant="outline" size="quiz" onClick={() => void save('input', input).catch(() => {})}>Thử lưu lại</Button>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function DictationResults({ session }: { session: DictationSession }) {
  const [showWrong, setShowWrong] = useState(false);
  const correct = session.answers.filter((a) => a.correct).length;
  const wrong = session.sentences.filter((_, i) => !session.answers[i].correct);
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-8">
      <div className="mx-auto my-auto flex w-full max-w-xl flex-col items-center gap-6 py-8 text-center">
        <Headphones className="size-12 text-primary" aria-hidden="true" />
        <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Xong bài nghe</h1>
        <p className="text-sm text-muted-foreground">{session.day.split('-').reverse().join('/')} · Bài 1–{session.scope}</p>
        <p className="font-serif text-6xl font-semibold">{correct}<span className="text-3xl text-muted-foreground">/{session.sentences.length}</span></p>
        <p className="text-sm text-muted-foreground">Đúng lần đầu</p>
        {wrong.length > 0 && <Button variant="outline" size="quiz" className="w-full" aria-expanded={showWrong} onClick={() => setShowWrong(!showWrong)}>{showWrong ? 'Ẩn câu sai' : `Xem câu sai (${wrong.length})`}</Button>}
        {showWrong && <div className="flex w-full flex-col gap-6 text-left">{session.sentences.map((sentence, i) => session.answers[i].correct ? null : (
          <section key={sentence.id} className="flex flex-col gap-3 border-t border-border pt-5">
            <p className="text-sm text-muted-foreground">Câu {i + 1} · Bài {sentence.lesson}</p>
            <p className="jp text-destructive">✕ {session.answers[i].value || 'Chưa biết'}</p>
            <Sentence sentence={sentence} />
            <p>{sentence.vi}</p>
          </section>
        ))}</div>}
        <Link href="/nghe-moi-ngay" className={cn(buttonVariants({ size: 'quiz' }), 'w-full')}>Về bài nghe<ArrowRight aria-hidden="true" /></Link>
      </div>
    </div>
  );
}

function Sentence({ sentence }: { sentence: DictationSentence }) {
  return (
    <div className="[container-type:inline-size]" style={{ '--dictation-word-em': maxFuriganaWordEm(sentence.jp) + 0.3 } as CSSProperties}>
      <Furigana text={sentence.jp} className="jp-display text-[min(1.5rem,calc(100cqi/var(--dictation-word-em)))] font-bold [&>span]:whitespace-nowrap" />
    </div>
  );
}
