import Link from 'next/link';
import { Search } from 'lucide-react';
import { loadLessonSummaries } from '@/lib/lessons';
import { LessonGrid } from '@/components/LessonGrid';
import { buttonVariants } from '@/components/ui/button';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { cn } from '@/lib/utils';

// ponytail: loadLessonSummaries() nạp cả 50 file JSON để đếm số từ mỗi bài, nhưng chạy trên
// server lúc build nên trình duyệt chỉ nhận RSC payload (SPEC-03 §2). Nếu sau này cần nạp
// runtime, thêm vocabCount vào manifest.json thay vì đọc từng file.
export default async function HocPage() {
  const summaries = await loadLessonSummaries();
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 pt-6 sm:pt-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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

        <div className="flex items-center gap-2">
          <SearchTrigger className="lg:hidden" />
          <Link
            href="/hoc/tra-cuu"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'default' }),
              'shrink-0 rounded-xl font-semibold gap-2 border-border/80 hover:border-primary/40 hover:bg-primary/5 transition-all'
            )}
          >
            <Search className="size-4 text-primary" />
            <span>Tra cứu</span>
          </Link>
        </div>
      </div>

      <LessonGrid summaries={summaries} />
    </main>
  );
}
