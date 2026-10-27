'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Info, RotateCcw, X } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { loadLesson, loadVocab } from '@/lib/lessons';
import { keywordChecks, type TranslationDirection } from '@/lib/translation';
import type { TranslationSentence } from '@/lib/translation-data';
import type { TranslationAnswer } from '@/lib/translation-session';
import { cn } from '@/lib/utils';

type Explained = { kind: 'grammar'; text: string } | { kind: 'vocab'; word: string; meaning: string };

/** Giải thích lấy nguyên văn từ dữ liệu bài: điểm ngữ pháp của câu ví dụ, hoặc nghĩa của từ nguồn. */
function useExplanation(sentence: TranslationSentence): Explained | null {
  const [loaded, setLoaded] = useState<{ id: string; data: Explained | null } | null>(null);
  useEffect(() => {
    let active = true;
    const { source } = sentence;
    const load: Promise<Explained | null> = source.kind === 'grammar'
      ? loadLesson(source.lesson).then((lesson) => {
          const point = lesson.grammar.find((p) => p.id === source.grammarId);
          return point ? { kind: 'grammar', text: point.explanation.vi } : null;
        })
      : loadVocab(source.lesson).then((words) => {
          const word = words.find((w) => w.id === source.wordId);
          return word ? { kind: 'vocab', word: word.word, meaning: word.meaning.vi } : null;
        });
    load.catch(() => null).then((data) => { if (active) setLoaded({ id: sentence.id, data }); });
    return () => { active = false; };
  }, [sentence]);
  return loaded?.id === sentence.id ? loaded.data : null;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-muted-foreground">{label}</h2>
      {children}
    </section>
  );
}

const box = 'rounded-xl border border-border bg-card px-4 py-3 text-lg';

/** Đối chiếu bài làm với đáp án mẫu; câu tự động đúng chỉ hiện dòng trạng thái. */
export function TranslationReview({ sentence, direction, answer }: {
  sentence: TranslationSentence;
  direction: TranslationDirection;
  answer: TranslationAnswer;
}) {
  const explanation = useExplanation(sentence);
  const automatic = answer.source === 'automatic';
  const checks = answer.value ? keywordChecks(answer.value, sentence, direction) : [];
  const lessonLink = sentence.source.kind === 'grammar'
    ? { href: `/hoc/${sentence.source.lesson}#ngu-phap`, label: `Xem ngữ pháp bài ${sentence.source.lesson}` }
    : { href: `/hoc/${sentence.source.lesson}#tu-vung`, label: `Xem từ vựng bài ${sentence.source.lesson}` };
  const status = answer.status === 'reviewing'
    ? { icon: <Info aria-hidden="true" />, text: 'Chưa khớp mẫu', tone: 'text-foreground' }
    : automatic ? { icon: <Check aria-hidden="true" />, text: 'Khớp mẫu', tone: 'text-success' }
    : answer.correct ? { icon: <Check aria-hidden="true" />, text: 'Đúng ý', tone: 'text-success' }
    // Cần ôn là việc để làm tiếp, không phải lỗi: dùng giọng trung tính và icon của Ôn tập.
    : { icon: <RotateCcw aria-hidden="true" />, text: answer.value ? 'Đã thêm vào Câu cần ôn' : 'Bỏ qua · đã thêm vào Câu cần ôn', tone: 'text-muted-foreground' };
  const written = <p className={cn(box, direction === 'vi-jp' && 'jp')}>{answer.value}</p>;

  return (
    <div className="flex flex-col gap-5">
      <p role="status" aria-live="polite" className={cn('flex items-center gap-2 text-base font-semibold [&_svg]:size-5', status.tone)}>
        {status.icon}{status.text}
      </p>
      {!automatic && (
        <>
          {answer.value && <Field label="Bạn viết">{written}</Field>}
          <Field label="Đáp án mẫu">
            {direction === 'jp-vi'
              ? <p className={box}>{sentence.vi}</p>
              : <div className={box}><Furigana text={sentence.jp} className="jp-display text-xl font-bold" /></div>}
          </Field>
          {checks.length > 0 && (
            <Field label="Ý chính">
              <ul className="flex flex-wrap gap-2">
                {checks.map(({ text, hit }, i) => (
                  <li key={`${i}:${text}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 text-base">
                    {hit
                      ? <Check className="size-5 text-success" aria-hidden="true" />
                      : <X className="size-5 text-muted-foreground" aria-hidden="true" />}
                    <span className="sr-only">{hit ? 'Có: ' : 'Thiếu: '}</span>
                    {direction === 'jp-vi' ? text : <Furigana text={text} zoomable={false} className="jp" />}
                  </li>
                ))}
              </ul>
            </Field>
          )}
          <Field label="Giải thích">
            {explanation?.kind === 'grammar' && <p className="leading-relaxed">{explanation.text}</p>}
            {explanation?.kind === 'vocab' && (
              <p className="leading-relaxed"><Furigana text={explanation.word} zoomable={false} className="jp font-semibold" /> — {explanation.meaning}</p>
            )}
            <Link href={lessonLink.href} className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-semibold text-primary underline-offset-4 hover:underline">
              {lessonLink.label}<ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </Field>
        </>
      )}
    </div>
  );
}
