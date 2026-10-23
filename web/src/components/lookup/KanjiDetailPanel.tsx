import Link from 'next/link';
import type { KanjiData } from '@/types/lookup';
import { getKanjiLesson, isExampleVerified } from '@/lib/lookup';
import { getStrokes } from '@/lib/strokes';
import { stripFurigana, toKanaSentence } from '@/lib/japanese';
import { Furigana } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { KanjiStrokeView } from '@/components/writing/KanjiStrokeView';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const speakClass = 'size-11 w-11 rounded-full border border-border bg-secondary text-primary hover:bg-accent';

/** Chi tiết một chữ ở trang phải của sách mở (PC): xem nét, âm đọc, từ ghép mà không rời danh sách. */
export function KanjiDetailPanel({ kanji }: { kanji: KanjiData }) {
  const lesson = getKanjiLesson(kanji);
  const strokes = getStrokes(kanji.character);
  const facts: [string, string][] = [
    ['Âm On', kanji.onyomi.join(' ・ ') || '—'],
    ['Âm Kun', kanji.kunyomi.join(' ・ ') || '—'],
    ['Số nét', String(kanji.strokes)],
    ['Bài', lesson ? String(lesson) : 'N5'],
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-4 xl:flex-row xl:items-start">
        {strokes ? (
          <KanjiStrokeView
            key={kanji.character}
            strokes={strokes.d}
            numbers={strokes.n}
            label={`Thứ tự nét chữ Hán ${kanji.hanviet ?? kanji.character}`}
          />
        ) : (
          <div className="relative flex size-36 shrink-0 items-center justify-center rounded-2xl border border-border bg-card">
            <span aria-hidden="true" className="absolute inset-y-2 left-1/2 border-l border-dashed border-border" />
            <span aria-hidden="true" className="absolute inset-x-2 top-1/2 border-t border-dashed border-border" />
            <span lang="ja" className="jp-display relative select-none text-7xl font-semibold leading-none text-foreground">
              {kanji.character}
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1 text-center xl:text-left">
          {kanji.hanviet && (
            <p className="font-serif text-2xl font-semibold tracking-wide text-foreground">{kanji.hanviet}</p>
          )}
          <h2 className="font-serif text-xl text-muted-foreground">{kanji.meanings.vi[0] ?? ''}</h2>
          {kanji.meanings.vi.length > 1 && (
            <p className="mt-0.5 text-sm text-muted-foreground">{kanji.meanings.vi.slice(1).join(', ')}</p>
          )}
          <dl className="mt-3 divide-y divide-border border-y border-border text-left">
            {facts.map(([label, value]) => (
              <div key={label} className="flex items-baseline gap-3 py-1.5">
                <dt className="w-16 shrink-0 text-sm text-muted-foreground">{label}</dt>
                <dd lang="ja" className="jp min-w-0 flex-1 font-semibold text-foreground">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {strokes && (
          <Link
            href={`/luyen-viet/phien?c=${encodeURIComponent(kanji.character)}`}
            className={cn(buttonVariants({ variant: 'default', size: 'quiz' }), 'h-auto min-h-12 w-full py-3 font-semibold')}
          >
            Luyện viết chữ này
          </Link>
        )}
        <Link
          href={`/hoc/tra-cuu/kanji/${encodeURIComponent(kanji.character)}`}
          className="inline-flex min-h-11 items-center justify-center rounded-lg text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
        >
          Mở trang đầy đủ của chữ này
        </Link>
      </div>

      <section aria-label="Từ ghép">
        <h3 className="mb-2 font-serif text-lg font-semibold text-foreground">Từ ghép</h3>
        {kanji.examples.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">Chưa có ví dụ từ ghép.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {kanji.examples.map((ex, i) => {
              const kana = toKanaSentence(ex.word);
              return (
                <li key={i} className="flex items-center gap-3 px-3 py-2">
                  <Furigana text={ex.word} className="jp-display shrink-0 text-2xl font-semibold text-foreground" />
                  <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                    {isExampleVerified(ex) ? (
                      ex.meaning.vi
                    ) : (
                      <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
                        Chưa dịch
                      </span>
                    )}
                  </span>
                  <SpeakButton
                    text={kana}
                    label={`${stripFurigana(ex.word)} (${kana})`}
                    iconClassName="size-4"
                    className={speakClass}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
