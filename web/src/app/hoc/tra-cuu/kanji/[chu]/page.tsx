import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import {
  getAllKanji,
  getKanjiByChar,
  getKanjiLesson,
  getKanjiVocabIndex,
  isExampleVerified,
} from '@/lib/lookup';
import { Furigana } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { buttonVariants } from '@/components/ui/button';
import { stripFurigana, toKanaSentence } from '@/lib/japanese';
import { cn } from '@/lib/utils';

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

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 sm:px-6 pt-6 sm:pt-10 pb-24">
      {/* 1. Breadcrumb quay lại */}
      <header>
        <Link
          href="/hoc/tra-cuu/kanji"
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'min-h-11 px-3 -ml-3 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors'
          )}
        >
          <ChevronLeft className="size-4 mr-1" />
          <span>Tra cứu kanji</span>
        </Link>
      </header>

      {/* 2. Hero Card: Chữ Hán lớn + Nghĩa + Badge nét & bài */}
      <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex items-center gap-5 sm:gap-6">
        <div className="size-24 sm:size-28 rounded-2xl bg-muted/50 border border-border/60 flex items-center justify-center shrink-0 shadow-inner">
          <span
            lang="ja"
            className="font-jp text-5xl sm:text-6xl font-bold text-foreground select-none"
          >
            {kanji.character}
          </span>
        </div>

        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {lesson ? `Bài ${lesson}` : 'N5'}
            </span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              {kanji.strokes} nét
            </span>
          </div>

          {kanji.hanviet && (
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Hán Việt: {kanji.hanviet}
            </p>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground capitalize">
            {kanji.meanings.vi[0] ?? ''}
          </h1>

          {kanji.meanings.vi.length > 1 && (
            <p className="text-xs sm:text-sm text-muted-foreground">
              {kanji.meanings.vi.slice(1).join(', ')}
            </p>
          )}
        </div>
      </section>

      {/* 3. Cách đọc (Âm On / Kun) */}
      <section
        aria-label="Cách đọc"
        className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs"
      >
        <h2 className="text-base font-bold text-foreground">Cách đọc</h2>

        <div className="divide-y divide-border/60 text-sm">
          {/* Âm On */}
          <div className="flex items-center justify-between py-2.5 first:pt-0">
            <div className="flex items-baseline gap-4">
              <span className="text-xs font-semibold text-muted-foreground w-16 shrink-0">
                Âm On
              </span>
              <span lang="ja" className="font-jp font-bold text-foreground text-base tracking-wide">
                {kanji.onyomi.length > 0 ? kanji.onyomi.join(' ・ ') : '—'}
              </span>
            </div>
            {kanji.onyomi[0] && (
              <SpeakButton text={kanji.onyomi[0]} label={`${kanji.character} âm On`} />
            )}
          </div>

          {/* Âm Kun */}
          <div className="flex items-center justify-between py-2.5 last:pb-0">
            <div className="flex items-baseline gap-4">
              <span className="text-xs font-semibold text-muted-foreground w-16 shrink-0">
                Âm Kun
              </span>
              <span lang="ja" className="font-jp font-bold text-foreground text-base tracking-wide">
                {kanji.kunyomi.length > 0 ? kanji.kunyomi.join(' ・ ') : '—'}
              </span>
            </div>
            {kanji.kunyomi[0] && (
              <SpeakButton text={kanji.kunyomi[0]} label={`${kanji.character} âm Kun`} />
            )}
          </div>
        </div>
      </section>

      {/* 4. Từ ghép */}
      <section
        aria-label="Từ ghép"
        className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs"
      >
        <h2 className="text-base font-bold text-foreground">Từ ghép</h2>

        {kanji.examples.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Chưa có ví dụ từ ghép.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {kanji.examples.map((ex, i) => {
              const verified = isExampleVerified(ex);
              const cleanWord = stripFurigana(ex.word);
              const kana = toKanaSentence(ex.word);

              return (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div>
                      <Furigana text={ex.word} className="text-base sm:text-lg font-bold" />
                    </div>

                    <div className="text-sm">
                      {verified ? (
                        <span className="text-muted-foreground">{ex.meaning.vi}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            Chưa dịch
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <SpeakButton text={kana} label={`${cleanWord} (${kana})`} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Từ vựng trong giáo trình có chứa chữ này */}
      <section
        aria-label="Trong bài học"
        className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Trong bài học</h2>
          <span className="text-xs text-muted-foreground">
            {textbookWords.length} từ trong giáo trình
          </span>
        </div>

        {textbookWords.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Không có từ vựng nào trong 25 bài học N5 sử dụng chữ này.
          </p>
        ) : (
          <div className="divide-y divide-border/60">
            {textbookWords.map((w) => {
              const cleanWord = stripFurigana(w.word);
              const kana = w.kana || toKanaSentence(w.word);

              return (
                <div
                  key={w.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Furigana text={w.word} className="text-base font-bold" />
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-muted text-muted-foreground border border-border">
                        Bài {w.lesson}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{w.meaning.vi}</p>
                  </div>

                  <SpeakButton text={kana} label={`${cleanWord} (${kana})`} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. Chữ dễ nhầm (nếu có) */}
      {kanji.similar && kanji.similar.length > 0 && (
        <section
          aria-label="Chữ dễ nhầm"
          className="rounded-2xl border border-border/80 bg-card p-5 space-y-3.5 shadow-xs"
        >
          <h2 className="text-base font-bold text-foreground">Chữ dễ nhầm</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {kanji.similar.map((simChar) => {
              const simData = getKanjiByChar(simChar);

              return (
                <Link
                  key={simChar}
                  href={`/hoc/tra-cuu/kanji/${encodeURIComponent(simChar)}`}
                  className={cn(
                    'group flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/30',
                    'hover:border-primary/40 hover:bg-card transition',
                    'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      lang="ja"
                      className="size-10 rounded-lg bg-card border border-border flex items-center justify-center font-jp text-xl font-bold text-foreground group-hover:text-primary transition-colors"
                    >
                      {simChar}
                    </span>
                    <div className="space-y-0.5">
                      <span className="font-jp text-xs font-semibold text-foreground block">
                        {simData?.kunyomi[0] ?? simData?.onyomi[0] ?? ''}
                      </span>
                      <span className="text-[11px] text-muted-foreground block line-clamp-1">
                        {simData?.meanings.vi[0] ?? ''}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. Ghi chú trung thực dữ liệu */}
      {hasUnverified && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-muted/50 border border-border/60 text-xs text-muted-foreground">
          <Info className="size-4 shrink-0 text-muted-foreground mt-0.5" />
          <span>
            Một số từ ghép chưa có nghĩa tiếng Việt nên được gắn nhãn Chưa dịch.
          </span>
        </div>
      )}
    </main>
  );
}
