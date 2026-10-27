import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { GrammarExample } from '@/components/grammar/GrammarExample';
import { GrammarMeaning } from '@/components/grammar/GrammarMeaning';
import { BackLink, BookSpread, PaperCloud, Ribbon, SectionHeader, SoftScene } from '@/components/PaperKit';
import { buttonVariants } from '@/components/ui/button';
import { grammarDialogueLines, patternMarks, type GrammarDialogueLine } from '@/lib/grammar';
import { formatOptionalBrackets, stripFurigana } from '@/lib/japanese';
import { dialogueAnchorId } from '@/lib/kaiwa';
import { AVAILABLE_N5_LESSONS, loadLesson, parseLessonNumber } from '@/lib/lessons';
import { cn } from '@/lib/utils';

/** Số câu hội thoại hiện sẵn; phần còn lại gấp trong «Xem thêm» để trang không dài ra theo số câu. */
const DIALOGUE_PREVIEW = 3;

type Params = { so: string; id: string };

export async function generateStaticParams() {
  const lessons = await Promise.all(AVAILABLE_N5_LESSONS.map((n) => loadLesson(n)));
  return lessons.flatMap((lesson) => lesson.grammar.map((g) => ({ so: String(lesson.number), id: g.id })));
}

async function loadPoint({ so, id }: Params) {
  const lessonNum = parseLessonNumber(so);
  if (lessonNum === null) notFound();
  const lesson = await loadLesson(lessonNum);
  const index = lesson.grammar.findIndex((g) => g.id === id);
  if (index === -1) notFound();
  return { lesson, lessonNum, index, point: lesson.grammar[index]! };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lessonNum, point } = await loadPoint(await params);
  return { title: `${stripFurigana(formatOptionalBrackets(point.pattern.vi))} · Bài ${lessonNum} — MaiPace` };
}

export default async function GrammarPointPage({ params }: { params: Promise<Params> }) {
  const { lesson, lessonNum, index, point } = await loadPoint(await params);
  const total = lesson.grammar.length;
  const prev = lesson.grammar[index - 1];
  const next = lesson.grammar[index + 1];
  const scene = point.illustration ?? lesson.cover;
  const dialogueLines = grammarDialogueLines(lesson, point.id);
  const pointHref = (id: string) => `/hoc/${lessonNum}/ngu-phap/${id}`;

  const dialogueItem = ({ dialogue, lineIndex, line }: GrammarDialogueLine) => (
    <li key={`${dialogue.id}-${lineIndex}`}>
      <Link
        href={`/hoc/${lessonNum}#${dialogueAnchorId(dialogue.id, lineIndex)}`}
        className="flex min-h-14 items-start gap-3 rounded-xl border border-border bg-card p-3 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring"
      >
        <span className="min-w-0 flex-1">
          <span className="mb-2 block text-xs font-medium text-muted-foreground">{dialogue.title.vi}</span>
          <Furigana text={line.jp} className="text-base" />
          <span className="translation block text-sm text-muted-foreground">{line.translation.vi}</span>
        </span>
        <ChevronRight className="mt-7 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  );

  const patternText = (p: (typeof lesson.grammar)[number]) => (
    <Furigana
      text={p.pattern.vi}
      marks={patternMarks(p.pattern.vi, p.slots)}
      markStyle="index"
      className="text-base font-medium"
    />
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-3 sm:px-6 lg:max-w-[1200px] lg:px-8">
      <BackLink href={`/hoc/${lessonNum}#ngu-phap`} label={`Bài ${lessonNum}`} />

      <BookSpread
        leftWidth="narrow"
        sticky="left"
        stickyTop="4.25rem"
        className="max-md:space-y-0 md:max-lg:space-y-4"
        left={
          <div className="hidden md:block">
            <p className="font-serif text-lg font-semibold text-primary">/ Ngữ pháp /</p>

            <nav aria-label={`Mẫu câu bài ${lessonNum}`} className="-mx-4 mt-3 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:hidden">
              <ul className="flex w-max gap-2 pb-1">
                {lesson.grammar.map((g) => (
                  <li key={g.id}>
                    <Link
                      href={pointHref(g.id)}
                      aria-current={g.id === point.id ? 'page' : undefined}
                      className={cn(
                        'inline-flex min-h-11 items-center rounded-full border px-4 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
                        g.id === point.id
                          ? 'border-primary/40 bg-accent text-primary'
                          : 'border-border bg-card text-foreground hover:bg-muted/60',
                      )}
                    >
                      {patternText(g)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="hidden lg:block">
              <p className="mt-1 font-serif text-4xl font-semibold tracking-tight text-foreground">{total} mẫu câu</p>
              <nav aria-label={`Mẫu câu bài ${lessonNum}`} className="mt-5">
                <ol className="border-t border-border">
                  {lesson.grammar.map((g, i) => {
                    const current = g.id === point.id;
                    return (
                      <li key={g.id} className="relative border-b border-border">
                        {current && <Ribbon className="top-3" />}
                        <Link
                          href={pointHref(g.id)}
                          aria-current={current ? 'page' : undefined}
                          className={cn(
                            'flex min-h-14 items-baseline gap-4 rounded-lg px-4 py-3 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
                            current ? 'bg-accent text-primary' : 'text-foreground hover:bg-muted/60',
                          )}
                        >
                          <span className={cn('w-5 shrink-0 font-serif text-2xl', !current && 'text-muted-foreground')}>
                            {i + 1}
                          </span>
                          <span className="min-w-0">{patternText(g)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </div>
          </div>
        }
        right={
        <div className="min-w-0 md:@container/grammar">
        <header className={cn(
          'md:grid md:items-start md:gap-4',
          scene && 'md:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:grid-cols-1 lg:@min-[560px]/grammar:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]',
        )}>
          {scene && (
            <SoftScene
              asset={scene}
              sizes="(min-width: 1024px) 300px, (min-width: 768px) 310px, 100vw"
              eager
              // Tranh 4:3 cắt còn khoảng 2:1 trên điện thoại; mặt người thường ở phần ba trên nên lấy lệch lên.
              imageClassName="h-48 object-[center_30%] sm:h-64 md:aspect-[4/3] md:h-auto"
              className="-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full md:col-start-2 md:row-start-1 lg:col-start-1 lg:row-start-2 lg:w-3/5 lg:@min-[560px]/grammar:col-start-2 lg:@min-[560px]/grammar:row-start-1 lg:@min-[560px]/grammar:w-full"
            />
          )}
          <PaperCloud className={cn('w-fit max-w-full md:col-start-1 md:row-start-1 md:min-w-0', scene && '-mt-1.5 md:mt-0')}>
            <p className="text-sm font-bold tracking-wide text-primary">
              Ngữ pháp {index + 1}/{total}
            </p>
            <h1>
              <Furigana
                text={point.pattern.vi}
                marks={patternMarks(point.pattern.vi, point.slots)}
                markStyle="pill"
                className="jp-display text-2xl font-bold sm:text-3xl lg:text-3xl xl:text-4xl"
              />
            </h1>
            <p className="mt-1 font-serif text-lg text-foreground sm:text-xl">
              <GrammarMeaning title={point.title.vi} />
            </p>
          </PaperCloud>
          {point.illustration && point.illustrationCaption && (
            <p className="mt-3 text-xs text-muted-foreground md:col-span-full md:mt-0">
              <Furigana text={point.illustrationCaption.vi} />
            </p>
          )}
        </header>

        {/* Mở sẵn ngay dưới mẫu câu: người mới học cần hiểu mẫu trước khi đọc ví dụ; ai đã hiểu thì thu lại. */}
        <details open className="group mt-6 rounded-xl border border-border bg-card">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 font-semibold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            Giải thích
            <ChevronRight
              className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </summary>
          <div className="space-y-3 px-4 pb-4">
            <p className="text-base leading-relaxed text-foreground/90">{point.explanation.vi}</p>
            {point.sourceRef && <p className="text-xs text-muted-foreground/80">Nguồn: {point.sourceRef}</p>}
          </div>
        </details>

        {point.examples.length > 0 && (
          <section aria-label="Ví dụ" className="mt-6">
            <ul className="divide-y divide-border">
              {point.examples.map((example, i) => (
                <li key={i}>
                  <GrammarExample example={example} slots={point.slots} lead={i === 0} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {dialogueLines.length > 0 && (
          <section aria-labelledby="gap-trong-hoi-thoai" className="mt-8">
            <SectionHeader id="gap-trong-hoi-thoai" title="Gặp trong hội thoại" />
            <ul className="space-y-2">{dialogueLines.slice(0, DIALOGUE_PREVIEW).map(dialogueItem)}</ul>
            {dialogueLines.length > DIALOGUE_PREVIEW && (
              <details className="group mt-2">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-1 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring group-open:hidden [&::-webkit-details-marker]:hidden">
                  Xem thêm {dialogueLines.length - DIALOGUE_PREVIEW} câu
                </summary>
                <ul className="space-y-2">{dialogueLines.slice(DIALOGUE_PREVIEW).map(dialogueItem)}</ul>
              </details>
            )}
          </section>
        )}

        <div className="mt-8 flex flex-col gap-2 md:max-w-xl">
          <Link
            href={next ? pointHref(next.id) : `/luyen-tap/bai-tap?lessons=${lessonNum}`}
            className={cn(buttonVariants({ size: 'quiz' }), 'w-full')}
          >
            {next ? 'Mẫu tiếp theo' : `Luyện tập bài ${lessonNum}`}
            <ArrowRight aria-hidden="true" />
          </Link>
          {prev && (
            <Link href={pointHref(prev.id)} className={cn(buttonVariants({ variant: 'ghost', size: 'quiz' }), 'w-full')}>
              <ChevronLeft aria-hidden="true" />
              Mẫu trước
            </Link>
          )}
        </div>
        </div>
        }
      />
    </main>
  );
}
