import { FeatureIcon } from '@/components/FeatureIcon';
import { ListRow, PageTitle, SectionHeader } from '@/components/PaperKit';
import { loadLessonSummaries } from '@/lib/lessons';

export default async function DialoguePickerPage() {
  const lessons = (await loadLessonSummaries()).filter((lesson) => lesson.dialogueCount > 0);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-12 pt-3 sm:px-6 lg:px-8">
      <PageTitle title="Hội thoại" back={{ href: '/luyen-tap', label: 'Luyện tập' }} />
      <section aria-labelledby="dialogue-lessons-heading">
        <SectionHeader id="dialogue-lessons-heading" title="Chọn bài" />
        <div className="grid gap-2 md:grid-cols-2">
          {lessons.map((lesson) => (
            <ListRow key={lesson.number} href={`/hoc/${lesson.number}#hoi-thoai`} icon={<FeatureIcon name="dialogue" />} title={`Bài ${lesson.number} · ${lesson.title.vi}`} detail={`${lesson.dialogueCount} tình huống`} />
          ))}
        </div>
      </section>
    </main>
  );
}
