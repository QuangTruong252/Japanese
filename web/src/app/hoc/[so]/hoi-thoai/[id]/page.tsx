import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RolePlay } from '@/components/dialogue/RolePlay';
import { AVAILABLE_N5_LESSONS, loadLessonData, parseLessonNumber } from '@/lib/lessons';

type Params = { so: string; id: string };

export async function generateStaticParams() {
  const lessons = await Promise.all(AVAILABLE_N5_LESSONS.map(loadLessonData));
  return lessons.flatMap(({ lesson }) =>
    (lesson.dialogues ?? []).map((dialogue) => ({ so: String(lesson.number), id: dialogue.id })),
  );
}

async function getDialogue({ so, id }: Params) {
  const lessonNum = parseLessonNumber(so);
  if (lessonNum === null) notFound();
  const { lesson } = await loadLessonData(lessonNum);
  const dialogue = lesson.dialogues?.find((item) => item.id === id);
  if (!dialogue) notFound();
  return { lessonNum, dialogue };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lessonNum, dialogue } = await getDialogue(await params);
  return { title: `${dialogue.title.vi} · Bài ${lessonNum} — MaiPace` };
}

export default async function RolePlayPage({ params }: { params: Promise<Params> }) {
  const { lessonNum, dialogue } = await getDialogue(await params);
  return <RolePlay key={dialogue.id} dialogue={dialogue} lessonNum={lessonNum} />;
}
