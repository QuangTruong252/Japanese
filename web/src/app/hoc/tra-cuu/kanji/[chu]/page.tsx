import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen, ChevronLeft, ChevronRight, Info, Pencil } from 'lucide-react';
import {
  getAllKanji,
  getKanjiByChar,
  getKanjiLesson,
  getKanjiVocabIndex,
  isExampleVerified,
} from '@/lib/lookup';
import { Furigana } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { SectionHeader } from '@/components/PaperKit';
import { stripFurigana, toKanaSentence } from '@/lib/japanese';

const speakClass = 'size-11 w-11 rounded-full border border-border bg-secondary text-primary hover:bg-accent';
const listClass ='divide-y divide-border overflow-hidden rounded-xl border border-border bg-card';

export function generateStaticParams() {
  return getAllKanji().map((k) => ({ chu: k.character }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chu: string }>;
}): Promise<Metadata> {
  const { chu } = await params;
  const char = decodeURIComponent(chu);
  const kanji = getKanjiByChar(char);
  if (!kanji) {
    return { title: 'Không tìm thấy chữ Hán · MaiPace' };
  }
  return {
    title: `${kanji.character} (${kanji.meanings.vi[0] ?? ''}) · Tra cứu Kanji · MaiPace`,
    description: `Học chữ Hán ${kanji.character} — âm On: ${kanji.onyomi.join(', ')}, âm Kun: ${kanji.kunyomi.join(', ')}, ${kanji.strokes} nét.`,
  };
}

export default async function KanjiDetailPage({
  params,
}: {
  params: Promise<{ chu: string }>;
}) {
  const { chu } = await params;
  const char = decodeURIComponent(chu);
  const kanji = getKanjiByChar(char);

  if (!kanji) {
    notFound();
  }

  const lesson = getKanjiLesson(kanji);
  const vocabIndex = getKanjiVocabIndex();
  const textbookWords = vocabIndex.get(kanji.character) ?? [];
  const hasUnverified = kanji.examples.some((ex) => !isExampleVerified(ex));

  const readings = [
    { label: 'Âm On', kanaList: kanji.onyomi, speakLabel: `${kanji.character} âm On` },
    { label: 'Âm Kun', kanaList: kanji.kunyomi, speakLabel: `${kanji.character} âm Kun` },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-4 pb-24 sm:px-6 lg:px-8 lg:pb-12">
      <header className="pt-2">
        <Link
          href="/hoc/tra-cuu/kanji"
          className="-ml-2 inline-flex min-h-11 items-center gap-0.5 rounded-lg px-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Tra cứu kanji
        </Link>
      </header>

      <section className="flex items-center gap-4 sm:gap-6">
        {/* Đường kẻ chữ thập mờ giống ô luyện viết, để người học nhận ra khung chữ */}
        <div className="relative flex size-28 shrink-0 items-center justify-center rounded-2xl border border-border bg-card sm:size-36">
          <span aria-hidden="true" className="absolute inset-y-2 left-1/2 border-l border-dashed border-border" />
          <span aria-hidden="true" className="absolute inset-x-2 top-1/2 border-t border-dashed border-border" />
          <span lang="ja" className="jp-display relative select-none text-6xl font-semibold leading-none text-foreground sm:text-7xl">
            {kanji.character}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-primary">
              <BookOpen className="size-4" aria-hidden="true" />
              {lesson ? `Bài ${lesson}` : 'N5'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
              <Pencil className="size-4" aria-hidden="true" />
              {kanji.strokes} nét
            </span>
          </div>

          {kanji.hanviet && <p className="text-sm text-muted-foreground">Hán Việt: {kanji.hanviet}</p>}
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {kanji.meanings.vi[0] ?? ''}
          </h1>
          {kanji.meanings.vi.length > 1 && (
            <p className="text-sm text-muted-foreground">{kanji.meanings.vi.slice(1).join(', ')}</p>
          )}
        </div>
      </section>

      <section aria-labelledby="kanji-readings">
        <SectionHeader id="kanji-readings" title="Cách đọc" />
        <div className={listClass}>
          {readings.map((r) => (
            <div key={r.label} className="flex items-center gap-3 px-4 py-3">
              <span className="w-14 shrink-0 text-sm text-muted-foreground">{r.label}</span>
              <span lang="ja" className="jp min-w-0 flex-1 text-lg font-semibold text-foreground">
                {r.kanaList.length > 0 ? r.kanaList.join(' ・ ') : '—'}
              </span>
              {r.kanaList[0] && <SpeakButton text={r.kanaList[0]} label={r.speakLabel} iconClassName="size-4" className={speakClass} />}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="kanji-compounds">
        <SectionHeader id="kanji-compounds" title="Từ ghép" />
        {kanji.examples.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">Chưa có ví dụ từ ghép.</p>
        ) : (
          <div className={listClass}>
            {kanji.examples.map((ex, i) => {
              const verified = isExampleVerified(ex);
              const cleanWord = stripFurigana(ex.word);
              const kana = toKanaSentence(ex.word);

              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <Furigana text={ex.word} className="text-lg font-semibold" />
                    <div className="text-sm">
                      {verified ? (
                        <span className="text-muted-foreground">{ex.meaning.vi}</span>
                      ) : (
                        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
                          Chưa dịch
                        </span>
                      )}
                    </div>
                  </div>
                  <SpeakButton text={kana} label={`${cleanWord} (${kana})`} iconClassName="size-4" className={speakClass} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="kanji-lessons">
        <SectionHeader id="kanji-lessons" title="Trong bài học" />
        <p className="-mt-2 mb-3 text-sm text-muted-foreground">{textbookWords.length} từ trong giáo trình</p>
        {textbookWords.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">
            Không có từ vựng nào trong 25 bài học N5 sử dụng chữ này.
          </p>
        ) : (
          <div className={listClass}>
            {textbookWords.map((w) => {
              const cleanWord = stripFurigana(w.word);
              const kana = w.kana || toKanaSentence(w.word);

              return (
                <div key={w.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <Furigana text={w.word} className="text-lg font-semibold" />
                      <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-primary">
                        Bài {w.lesson}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{w.meaning.vi}</p>
                  </div>
                  <SpeakButton text={kana} label={`${cleanWord} (${kana})`} iconClassName="size-4" className={speakClass} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {kanji.similar && kanji.similar.length > 0 && (
        <section aria-labelledby="kanji-similar">
          <SectionHeader id="kanji-similar" title="Chữ dễ nhầm" />
          <div className="grid gap-2 sm:grid-cols-2">
            {kanji.similar.map((simChar) => {
              const simData = getKanjiByChar(simChar);

              return (
                <Link
                  key={simChar}
                  href={`/hoc/tra-cuu/kanji/${encodeURIComponent(simChar)}`}
                  className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card p-3 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring"
                >
                  <span
                    lang="ja"
                    className="jp-display flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-2xl font-semibold leading-none text-accent-foreground"
                  >
                    {simChar}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span lang="ja" className="jp block text-sm font-semibold text-foreground">
                      {simData?.kunyomi[0] ?? simData?.onyomi[0] ?? ''}
                    </span>
                    <span className="block text-sm text-muted-foreground">{simData?.meanings.vi[0] ?? ''}</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {hasUnverified && (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Một số từ ghép chưa có nghĩa tiếng Việt nên được gắn nhãn Chưa dịch.
        </p>
      )}
    </main>
  );
}
