import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { VerbGroupBadge } from '@/components/VerbGroupBadge';
import { SpeakButton } from '@/components/SpeakButton';
import { FeatureIcon } from '@/components/FeatureIcon';
import { Illustration } from '@/components/Illustration';
import { ListRow, PaperCloud, PartRow, SectionHeader, SoftScene } from '@/components/PaperKit';
import { ShadowingPlayer } from '@/components/audio/ShadowingPlayer';
import {
  AVAILABLE_N5_LESSONS,
  loadLessonData,
  loadLessonSummary,
  parseLessonNumber,
} from '@/lib/lessons';
import { SECTION_THUMB } from '@/lib/illustrations';
import { formatOptionalBrackets, stripFurigana } from '@/lib/japanese';
import { LessonHeroCard } from './_parts';
import { cn } from '@/lib/utils';

export function generateStaticParams() {
  return AVAILABLE_N5_LESSONS.map((n) => ({ so: String(n) }));
}

const VERB_GROUP: Record<string, number> = { 'verb-godan': 1, 'verb-ichidan': 2, 'verb-irregular': 3 };

const SECTION = 'scroll-mt-20 sm:scroll-mt-24';

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ so: string }>;
}) {
  const { so } = await params;
  const lessonNum = parseLessonNumber(so);
  if (lessonNum === null) notFound();

  const [{ lesson, vocab }, summary] = await Promise.all([
    loadLessonData(lessonNum),
    loadLessonSummary(lessonNum),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-3 sm:px-6 lg:px-8">
      <Link
        href="/hoc"
        className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-0.5 rounded-lg px-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Học bài
      </Link>

      <header>
        {lesson.cover && (
          <SoftScene
            asset={lesson.cover}
            sizes="(min-width: 1024px) 1024px, 100vw"
            eager
            imageClassName="h-48 object-center sm:h-64 sm:object-[center_30%] lg:h-72 lg:object-[center_20%]"
            className="-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full"
          />
        )}
        <PaperCloud className={cn('w-fit max-w-full', lesson.cover && '-mt-7')}>
          <p className="text-sm font-bold tracking-wide text-primary">Bài {lesson.number}</p>
          {lesson.jpTitle && (
            <Furigana
              text={lesson.jpTitle}
              className="jp-display block text-2xl font-bold text-foreground sm:text-3xl"
            />
          )}
          <h1 className="mt-1 font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {lesson.title.vi}
          </h1>
        </PaperCloud>
      </header>

      <div className="mt-6 space-y-8">
        <LessonHeroCard lessonNum={lessonNum} totalVocab={vocab.length} />

        <section aria-labelledby="lesson-parts-heading">
          <SectionHeader id="lesson-parts-heading" title="Các phần trong bài" />
          <div className="space-y-2">
            <PartRow
              href="#tu-vung"
              icon={<FeatureIcon name="vocab" />}
              title="Từ vựng"
              detail={`${vocab.length} từ`}
              image={summary.vocabThumb ?? SECTION_THUMB.vocab}
            />
            <PartRow
              href="#ngu-phap"
              icon={<FeatureIcon name="grammar" />}
              title="Ngữ pháp"
              detail={`${lesson.grammar.length} mẫu`}
              image={summary.grammarThumb ?? SECTION_THUMB.grammar}
            />
            <PartRow
              href="#nghe"
              icon={<FeatureIcon name="listening" />}
              title="Luyện nghe"
              image={SECTION_THUMB.listening}
            />
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <ListRow
              href={`/luyen-tap?lessons=${lessonNum}`}
              icon={<FeatureIcon name="practice" />}
              title={`Luyện tập bài ${lesson.number}`}
              detail="Trắc nghiệm theo bài"
            />
          </div>
        </section>
      </div>

      <div className="mx-auto mt-10 max-w-3xl space-y-10">
        <section id="tu-vung" aria-labelledby="lesson-vocab-heading" className={SECTION}>
          <div className="mb-3 flex items-baseline gap-2">
            <h2 id="lesson-vocab-heading" className="text-lg font-semibold text-foreground">
              Từ vựng
            </h2>
            <span className="text-sm text-muted-foreground/80">{vocab.length} từ</span>
          </div>

          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {vocab.map((w) => {
              const group = VERB_GROUP[w.type];
              return (
                <div
                  key={w.id}
                  id={`vocab-${w.id}`}
                  className={cn('flex items-center gap-3 p-3', SECTION)}
                >
                  {w.illustration && (
                    <Illustration
                      asset={w.illustration}
                      sizes="64px"
                      className="size-16 shrink-0 rounded-lg bg-secondary object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="jp text-lg font-medium text-foreground">
                        <Furigana text={w.word} />
                      </span>
                      {group && <VerbGroupBadge group={group} />}
                    </div>
                    {w.verbForms && (
                      <p className="text-sm text-muted-foreground">
                        Thể masu: <Furigana text={w.verbForms.masu} />
                      </p>
                    )}
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {w.meaning.vi ? (
                        <span className="translation">{w.meaning.vi}</span>
                      ) : (
                        <span className="italic opacity-50">Chưa có bản dịch</span>
                      )}
                    </p>
                  </div>
                  <SpeakButton
                    text={w.kana}
                    label={stripFurigana(formatOptionalBrackets(w.word))}
                    className="size-11 w-11 shrink-0 rounded-full border border-border bg-secondary text-primary hover:bg-accent"
                  />
                </div>
              );
            })}
          </div>
        </section>

        <section id="ngu-phap" aria-labelledby="lesson-grammar-heading" className={SECTION}>
          <div className="mb-3 flex items-baseline gap-2">
            <h2 id="lesson-grammar-heading" className="text-lg font-semibold text-foreground">
              Ngữ pháp
            </h2>
            <span className="text-sm text-muted-foreground/80">{lesson.grammar.length} mẫu</span>
          </div>

          <div className="space-y-3">
            {lesson.grammar.map((point) => (
              <article
                key={point.id}
                id={`grammar-${point.id}`}
                className={cn('space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5', SECTION)}
              >
                <h3 className="text-lg font-semibold text-foreground">
                  <Furigana text={point.title.vi} />
                </h3>

                <div className="grammar-pattern-block rounded-lg bg-secondary p-4">
                  <div className="jp jp-example font-medium leading-loose text-foreground">
                    <Furigana text={point.pattern.vi} />
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-foreground/90">{point.explanation.vi}</p>

                {point.illustration && (
                  <figure className="flex flex-col gap-2">
                    <Illustration
                      asset={point.illustration}
                      sizes="(max-width: 768px) calc(100vw - 32px), 672px"
                      className="mx-auto h-auto w-full max-w-xl rounded-xl"
                    />
                    {point.illustrationCaption && (
                      <figcaption className="text-xs text-muted-foreground">
                        <Furigana text={point.illustrationCaption.vi} />
                      </figcaption>
                    )}
                  </figure>
                )}

                {point.examples.length > 0 && (
                  <div>
                    <p className="inline-block rounded-full bg-accent px-3 py-1 text-sm font-medium text-primary">
                      Ví dụ
                    </p>
                    <div className="mt-1 divide-y divide-border">
                      {point.examples.map((ex, i) => (
                        <div key={i} className="flex items-start gap-3 py-3">
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="jp jp-example font-medium leading-loose text-foreground">
                              <Furigana text={ex.jp} />
                            </div>
                            <p className="translation text-sm leading-relaxed text-muted-foreground">
                              {ex.translation.vi}
                            </p>
                          </div>
                          <SpeakButton
                            text={stripFurigana(formatOptionalBrackets(ex.jp))}
                            label={stripFurigana(formatOptionalBrackets(ex.jp))}
                            className="size-11 w-11 shrink-0 rounded-full border border-border bg-secondary text-primary hover:bg-accent"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {point.sourceRef && (
                  <p className="text-xs text-muted-foreground/80">Nguồn: {point.sourceRef}</p>
                )}
              </article>
            ))}
          </div>
        </section>

        <section id="nghe" aria-labelledby="lesson-listening-heading" className={SECTION}>
          <SectionHeader id="lesson-listening-heading" title="Luyện nghe & Shadowing" />
          <ShadowingPlayer
            lessonNum={lessonNum}
            examples={lesson.grammar.flatMap((g) => g.examples)}
          />
        </section>

        <div className="space-y-2 border-t border-border pt-4">
          {lesson.sourceRef && (
            <p className="text-xs text-muted-foreground">
              Tài liệu tham khảo: Giáo trình Minna no Nihongo {lesson.sourceRef.book}, tr. {lesson.sourceRef.pages}
            </p>
          )}
          {lesson.verification === 'unverified' && (
            <p className="text-xs text-muted-foreground">
              Nội dung bài này chưa được đối chiếu với bản in
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
