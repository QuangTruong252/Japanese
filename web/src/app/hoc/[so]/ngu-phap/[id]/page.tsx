import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { GrammarExample } from '@/components/grammar/GrammarExample';
import { GrammarIndex } from '@/components/grammar/GrammarIndex';
import { GrammarMeaning } from '@/components/grammar/GrammarMeaning';
import { BackLink, PaperCloud, SectionHeader, SoftScene } from '@/components/PaperKit';
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

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-3 sm:px-6 lg:px-8">
      <BackLink href={`/hoc/${lessonNum}#ngu-phap`} label={`Bài ${lessonNum}`} />

      <div className="xl:grid xl:grid-cols-[minmax(0,1.2fr)_minmax(21rem,0.8fr)] xl:gap-8">
        <div className="min-w-0">
          <header>
            {scene && (
              <SoftScene
                asset={scene}
                sizes="(min-width: 1280px) 600px, (min-width: 1024px) 1024px, 100vw"
                eager
                // Tranh 4:3 cắt còn khoảng 2:1 trên điện thoại; mặt người thường ở phần ba trên nên lấy lệch lên.
                imageClassName="h-48 object-[center_30%] sm:h-64 lg:h-72"
                className="-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full"
              />
            )}
            <PaperCloud className={cn('w-fit max-w-full', scene && '-mt-1.5')}>
              <p className="text-sm font-bold tracking-wide text-primary">
                Ngữ pháp {index + 1}/{total}
              </p>
              <h1>
                <Furigana
                  text={point.pattern.vi}
                  marks={patternMarks(point.pattern.vi, point.slots)}
                  markStyle="pill"
                  className="jp-display text-2xl font-bold sm:text-3xl"
                />
              </h1>
              <p className="mt-1 font-serif text-lg text-foreground sm:text-xl">
                <GrammarMeaning title={point.title.vi} />
              </p>
            </PaperCloud>
            {point.illustration && point.illustrationCaption && (
              <p className="mt-3 text-xs text-muted-foreground">
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

          <div className="mt-8 flex flex-col gap-2">
            <Link
              href={next ? pointHref(next.id) : `/luyen-tap?lessons=${lessonNum}`}
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

        <aside aria-label={`Mẫu câu bài ${lessonNum}`} className="hidden xl:block">
          <div className="sticky top-15 max-h-[calc(100dvh-4.75rem)] overflow-y-auto">
            <GrammarIndex lessonNum={lessonNum} points={lesson.grammar} currentId={point.id} />
          </div>
        </aside>
      </div>
    </main>
  );
}
