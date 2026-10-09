import { loadLessonSummaries } from '@/lib/lessons';
import { LessonGrid } from '@/components/LessonGrid';

// loadLessonSummaries() nạp cả 50 file JSON để đếm số từ mỗi bài, nhưng chạy trên
// server lúc build nên trình duyệt chỉ nhận RSC payload.
export default async function HocPage() {
  const summaries = await loadLessonSummaries();
  return <LessonGrid summaries={summaries} />;
}
