import { loadLessonSummaries } from '@/lib/lessons';
import { LessonGrid } from '@/components/LessonGrid';

// ponytail: loadLessonSummaries() nạp cả 50 file JSON để đếm số từ mỗi bài, nhưng chạy trên
// server lúc build nên trình duyệt chỉ nhận RSC payload (SPEC-03 §2). Nếu sau này cần nạp
// runtime, thêm vocabCount vào manifest.json thay vì đọc từng file.
export default async function HocPage() {
  const summaries = await loadLessonSummaries();
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 pt-6 sm:pt-10">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
          <span>Giáo trình Minna no Nihongo</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Danh sách bài học N5
        </h1>
        <p className="text-sm text-muted-foreground">
          25 bài học nền tảng từ vựng, mẫu câu và hội thoại giao tiếp tiếng Nhật cơ bản.
        </p>
      </div>
      <LessonGrid summaries={summaries} />
    </main>
  );
}
