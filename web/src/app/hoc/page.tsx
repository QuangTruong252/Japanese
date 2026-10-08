import { loadLessonSummaries } from '@/lib/lessons';
import { LessonGrid } from '@/components/LessonGrid';

// loadLessonSummaries() nạp cả 50 file JSON để đếm số từ mỗi bài, nhưng chạy trên
// server lúc build nên trình duyệt chỉ nhận RSC payload.
export default async function HocPage() {
  const summaries = await loadLessonSummaries();
  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-4 sm:pt-8 pb-16">
      <LessonGrid summaries={summaries} />
    </main>
  );
}
