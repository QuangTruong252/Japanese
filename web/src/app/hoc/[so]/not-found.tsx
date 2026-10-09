import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { PageTitle } from '@/components/PaperKit';
import { cn } from '@/lib/utils';

export default function LessonNotFound() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-12 pt-3 sm:px-6 lg:px-8">
      <PageTitle
        title="Không tìm thấy bài học"
        meta="Hiện chỉ có 25 bài N5 (bài 1 đến bài 25)."
      />
      <Link href="/hoc" className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11')}>
        Về danh sách bài
      </Link>
    </main>
  );
}
