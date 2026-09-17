import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function LessonNotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-4 py-12">
      <h1 className="font-heading text-xl font-medium">Không tìm thấy bài học</h1>
      <p className="text-sm text-muted-foreground">
        Hiện chỉ có 25 bài N5 (bài 1 đến bài 25).
      </p>
      <Link href="/hoc" className={buttonVariants({ size: 'quiz' })}>
        Về danh sách bài
      </Link>
    </main>
  );
}
