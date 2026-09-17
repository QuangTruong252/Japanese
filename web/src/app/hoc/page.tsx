import { loadLessonSummaries } from '@/lib/lessons';
import { LessonGrid } from '@/components/LessonGrid';

// ponytail: loadLessonSummaries() nạp cả 50 file JSON để đếm số từ mỗi bài, nhưng chạy trên
// server lúc build nên trình duyệt chỉ nhận RSC payload (SPEC-03 §2). Nếu sau này cần nạp
// runtime, thêm vocabCount vào manifest.json thay vì đọc từng file.
export default async function HocPage() {
  const summaries = await loadLessonSummaries();
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
      <h1 className="font-heading text-xl font-medium">Học bài</h1>
      <LessonGrid summaries={summaries} />
    </main>
  );
}
