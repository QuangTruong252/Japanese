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

  const [lesson, words] = await Promise.all([loadLesson(lessonNumber), loadVocab(lessonNumber)]);

  return (
    <VocabLearningFlow
      key={lessonNumber}
      lessonNumber={lessonNumber}
      lessonTitle={lesson.title.vi}
      verified={lesson.verification === 'verified'}
      words={words}
      examples={lesson.grammar.flatMap((point) => point.examples)}
    />
  );
}
