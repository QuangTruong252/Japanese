'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Circle, X } from 'lucide-react';
import { Accent } from '@/components/PaperKit';
import { Button, buttonVariants } from '@/components/ui/button';
import { DEFAULT_READING_DISPLAY, loadReadingDisplay, type ReadingDisplay } from '@/lib/reading-display';
import { isReadingSessionOutdated, readingResults, readingScore } from '@/lib/reading-session';
import { readingPassage } from '@/lib/reading-data';
import { restartReading } from '@/lib/reading-store';
import { cn } from '@/lib/utils';
import type { ReadingSession, ReadingSource } from '@/types/reading';
import { surfaceClass } from './display';
import { GlossaryHost } from './GlossaryHost';
import { ReadingBody, sentenceDomId } from './ReadingBody';
import { scrollBehavior } from './scroll';

const LIST_HREF = '/luyen-tap/doc-hieu';

function sourceLine(source: ReadingSource) {
  if (source.kind === 'minna-dialogue') return <p>Minna no Nihongo · Bài {source.lesson}</p>;
  if (source.kind === 'original') return <p>MaiPace</p>;
  return (
    <>
      <p>{source.author} · {/^https?:\/\//.test(source.url)
        ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">{source.title}</a>
        : source.title}</p>
      <p>Giấy phép: {source.license}</p>
      <p>{source.notes}</p>
    </>
  );
}

export function ReadingResults({ session }: { session: ReadingSession }) {
  const router = useRouter();
  const { passage } = session;
  const [display, setDisplay] = useState<ReadingDisplay>(DEFAULT_READING_DISPLAY);
  const [evidence, setEvidence] = useState<{ questionId: string; ids: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const score = readingScore(session);
  const results = readingResults(session);
  const outdated = isReadingSessionOutdated(session);
  const canRestart = !!readingPassage(passage.id);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => { if (active) setDisplay(loadReadingDisplay()); });
    return () => { active = false; };
  }, []);

  function showEvidence(questionId: string, ids: string[]) {
    if (evidence?.questionId === questionId) { setEvidence(null); return; }
    setEvidence({ questionId, ids });
    // Chờ highlight vẽ xong rồi mới đo, để cuộn tới đúng chỗ.
    requestAnimationFrame(() => {
      const target = ids.map((id) => document.getElementById(sentenceDomId(id))).find(Boolean);
      target?.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
    });
  }

  async function restart() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const next = await restartReading(session.id);
      if (next) router.push(`${LIST_HREF}/phien?id=${encodeURIComponent(next.id)}`);
      else { setError('Bài này không còn trong kho nên không làm lại được.'); setBusy(false); }
    } catch { setError('Không lưu được phiên mới. Hãy kiểm tra dung lượng và thử lại.'); setBusy(false); }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-4">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 pb-8">
        <header className="relative pt-4">
          <Accent kind="sprig-right" className="-right-4 -top-2 block w-40" />
          <Accent kind="petals" className="right-24 top-14 block w-20" />
          <div role="status" className="sr-only">Xong bài đọc. Đúng {score.correct} trên {score.total} câu.</div>
          <h1 className="font-serif text-4xl font-semibold">Kết quả</h1>
          <p className="font-serif text-muted-foreground"><span className="text-6xl font-semibold text-primary">{score.correct}</span><span className="text-3xl font-semibold">/{score.total}</span></p>
        </header>

        <GlossaryHost glossary={passage.glossary}>
          {({ pick, activeEntryId }) => (
            <div className={cn('rounded-2xl', surfaceClass(display), passage.kind === 'dialogue' && 'p-3 sm:p-4')}>
              <ReadingBody passage={passage} display={display} showVi evidenceIds={evidence?.ids} activeEntryId={activeEntryId} onPick={pick} />
            </div>
          )}
        </GlossaryHost>

        <section aria-label="Các câu hỏi" className="flex flex-col gap-6">
          {results.map(({ question, selectedOptionId, correct }, i) => (
            <div key={question.id} className="flex flex-col gap-3">
              <h2 className="font-serif text-2xl font-semibold"><span className="sr-only">Câu {i + 1}. {correct ? 'Đúng. ' : 'Chưa đúng. '}</span>{question.promptVi}</h2>
              <ul className="flex flex-col gap-2">
                {question.options.map((option) => {
                  const isCorrect = option.id === question.correctOptionId;
                  const isChosen = option.id === selectedOptionId;
                  return (
                    <li key={option.id} className={cn('flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2', isCorrect ? 'border-success/60 bg-success/10' : 'border-border bg-card')}>
                      <span aria-hidden="true" className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', isCorrect ? 'bg-success text-background' : isChosen ? 'bg-destructive/15 text-destructive' : 'text-muted-foreground')}>
                        {isCorrect ? <Check className="size-5" /> : isChosen ? <X className="size-5" /> : <Circle className="size-5" />}
                      </span>
                      <span className="font-serif text-lg">{option.textVi}</span>
                      <span className="sr-only">{isCorrect ? 'Đáp án đúng' : ''}{isChosen ? ' Bạn đã chọn' : ''}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="text-base">{question.explanationVi}</p>
              <Button variant="outline" size="quiz" className="self-start" aria-pressed={evidence?.questionId === question.id} onClick={() => showEvidence(question.id, question.evidenceSentenceIds)}>
                Xem bằng chứng
              </Button>
            </div>
          ))}
        </section>

        <section aria-labelledby="reading-source" className="flex flex-col gap-1 border-t border-border pt-4 text-sm text-muted-foreground">
          <h2 id="reading-source" className="font-semibold text-foreground">Nguồn</h2>
          {sourceLine(passage.source)}
          {passage.review.method === 'ai-multilayer' && <p>Biên soạn bằng AI, qua kiểm nhiều lớp{passage.review.nativeReviewed ? '' : ', chưa có người bản ngữ duyệt'}.</p>}
        </section>

        {error && <p role="alert" className="text-sm text-destructive">✕ {error}</p>}
        <div className="flex flex-col gap-3">
          {outdated && canRestart && <p className="text-sm text-muted-foreground">Bản đã cập nhật</p>}
          <Button size="quiz" disabled={busy || !canRestart} onClick={() => void restart()}>{busy ? 'Đang mở…' : 'Làm lại bài này'}<ArrowRight aria-hidden="true" /></Button>
          <Link href={LIST_HREF} className={buttonVariants({ size: 'quiz', variant: 'outline' })}>Về danh sách</Link>
        </div>
      </div>
    </div>
  );
}
