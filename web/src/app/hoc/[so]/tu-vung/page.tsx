import { notFound } from 'next/navigation';
import { VocabLearningFlow } from '@/components/vocab/VocabLearningFlow';
import { AVAILABLE_N5_LESSONS, loadLesson, loadVocab, parseLessonNumber } from '@/lib/lessons';

export function generateStaticParams() {
  return AVAILABLE_N5_LESSONS.map((so) => ({ so: String(so) }));
}

export default async function LessonVocabularyPage({
  params,
}: {
  params: Promise<{ so: string }>;
}) {
  const { so } = await params;
  const lessonNumber = parseLessonNumber(so);
  if (lessonNumber === null) notFound();

  const lesson = await loadLesson(lessonNumber);
  const words = await loadVocab(lessonNumber);
  const examples = lesson.grammar.flatMap((point) => point.examples);

  return (
    <VocabLearningFlow
      key={lessonNumber}
      lessonNumber={lessonNumber}
      lessonTitle={lesson.title.vi}
      words={words}
      examples={examples}
    />
  );
}
