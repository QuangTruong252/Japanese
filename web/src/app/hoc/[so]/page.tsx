import { notFound } from 'next/navigation';
import { Furigana } from '@/components/Furigana';
import { FeatureIcon } from '@/components/FeatureIcon';
import { GrammarIndex } from '@/components/grammar/GrammarIndex';
import { BackLink, BookSpread, ListRow, PaperCloud, SoftScene } from '@/components/PaperKit';
import { ShadowingPlayer } from '@/components/audio/ShadowingPlayer';
import {
  AVAILABLE_N5_LESSONS,
  loadLessonData,
  parseLessonNumber,
} from '@/lib/lessons';
import { AUDIO_IMPORT_ENABLED } from '@/lib/features';
import { vocabDialogueAnchors } from '@/lib/kaiwa';
import { LessonHeroCard } from './_parts';
import { LessonTabs } from './_tabs';
import { cn } from '@/lib/utils';

export function generateStaticParams() {
  return AVAILABLE_N5_LESSONS.map((n) => ({ so: String(n) }));
}

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ so: string }>;
}) {
  const { so } = await params;
  const lessonNum = parseLessonNumber(so);
  if (lessonNum === null) notFound();

  const { lesson, vocab } = await loadLessonData(lessonNum);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-3 sm:px-6 lg:max-w-[1200px] lg:px-8">
      <BackLink href="/hoc" label="Học bài" />

      <BookSpread
        leftWidth="narrow"
        sticky="left"
        stickyTop="4.25rem"
        className="max-lg:space-y-6"
        left={
          <div className="md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-4 lg:block">
          <header className="md:contents lg:block">
            {lesson.cover && (
              <SoftScene
                asset={lesson.cover}
                sizes="(min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw"
                eager
                imageClassName="h-48 object-center sm:h-64 sm:object-[center_30%] md:h-64 lg:h-52 lg:object-[center_20%]"
                className="-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full md:col-start-1 md:row-span-2 md:row-start-1 md:self-start"
              />
            )}
            <PaperCloud className={cn('w-fit max-w-full md:col-start-2 md:row-start-1 md:self-end', lesson.cover && '-mt-1.5 md:mt-0 lg:-mt-1.5')}>
              <p className="text-sm font-bold tracking-wide text-primary">Bài {lesson.number}</p>
              {lesson.jpTitle && (
                <Furigana
                  text={lesson.jpTitle}
                  className="jp-display block text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl xl:text-5xl"
                />
              )}
              <h1 className="mt-1 font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {lesson.title.vi}
              </h1>
            </PaperCloud>
          </header>

          <div className="mt-6 space-y-3 md:col-start-2 md:row-start-2 md:mt-0 lg:mt-6">
            <LessonHeroCard lessonNum={lessonNum} totalVocab={vocab.length} />
            <ListRow
              href={`/luyen-tap/bai-tap?lessons=${lessonNum}`}
              icon={<FeatureIcon name="practice" />}
              title={`Luyện tập bài ${lesson.number}`}
              detail="Trắc nghiệm theo bài"
            />
          </div>
          </div>
        }
        right={
          <div>
          <div>
            <LessonTabs
              vocab={vocab}
              lessonNum={lessonNum}
              dialogues={lesson.dialogues ?? []}
              vocabAnchors={vocabDialogueAnchors(lesson.dialogues ?? [])}
              grammarIds={lesson.grammar.map((g) => g.id)}
              grammar={
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{lesson.grammar.length} mẫu câu</p>
                  <GrammarIndex lessonNum={lessonNum} points={lesson.grammar} />
                </div>
              }
              listening={
                AUDIO_IMPORT_ENABLED && (
                  <ShadowingPlayer
                    lessonNum={lessonNum}
                    examples={lesson.grammar.flatMap((g) => g.examples)}
                  />
                )
              }
            />

            <div className="mx-auto mt-10 max-w-3xl space-y-2 border-t border-border pt-4">
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
          </div>
        }
      />
    </main>
  );
}
