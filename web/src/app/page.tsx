import { loadLessonSummaries, loadLessons, AVAILABLE_N5_LESSONS } from '@/lib/lessons';
import { DashboardContent } from '@/components/DashboardContent';
import type { TodaySentenceItem } from '@/lib/today-sentence';

export default async function DashboardPage() {
  const [summaries, lessons] = await Promise.all([
    loadLessonSummaries(),
    loadLessons([...AVAILABLE_N5_LESSONS]),
  ]);

  const lessonExamples: Record<number, TodaySentenceItem[]> = {};
  for (const lesson of lessons) {
    const items: TodaySentenceItem[] = [];
    for (const point of lesson.grammar ?? []) {
      for (const ex of point.examples ?? []) {
        if (ex.jp && ex.translation?.vi) {
          items.push({
            jp: ex.jp,
            vi: ex.translation.vi,
            kana: ex.kana,
          });
        }
      }
    }
    lessonExamples[lesson.number] = items;
  }

  return <DashboardContent summaries={summaries} lessonExamples={lessonExamples} />;
}
