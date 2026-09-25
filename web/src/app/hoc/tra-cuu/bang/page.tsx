import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllReferenceDocs } from '@/lib/lookup';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: '10 Bảng tham chiếu N5 · Tra cứu · MaiPace',
  description: '10 bảng tra cứu nhanh chuyên đề: Tính từ, Lịch, Lượng từ đếm, Đại từ chỉ thị, Gia đình, Chào hỏi, Số đếm, Trợ từ, Từ để hỏi, Giờ giấc.',
};

export default function ReferenceTablesIndexPage() {
  const docs = getAllReferenceDocs();

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 pt-6 sm:pt-10 pb-24">
      {/* 1. Header & Điều hướng quay lại */}
      <header className="space-y-4">
        <Link
          href="/hoc/tra-cuu"
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'min-h-11 px-3 -ml-3 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors'
          )}
        >
          <ChevronLeft className="size-4 mr-1" />
          <span>Tra cứu</span>
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Bảng tham chiếu
          </h1>
          <p className="text-sm text-muted-foreground">
            10 bảng tra cứu nhanh chuyên đề ngữ pháp và từ vựng Minna no Nihongo N5.
          </p>
        </div>
      </header>

      {/* 2. Danh sách 10 bảng tham chiếu */}
      <div className="space-y-3">
        {docs.map((doc, idx) => (
          <Link
            key={doc.slug}
            href={`/hoc/tra-cuu/bang/${doc.slug}`}
            className={cn(
              'group flex items-center justify-between p-4 sm:p-5 rounded-2xl',
              'border border-border/80 bg-card shadow-xs transition duration-150',
              'hover:border-primary/40 hover:shadow-sm hover:translate-y-[-1px]',
              'active:translate-y-[1px]',
              'focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring'
            )}
          >
            <div className="flex items-center gap-4">
              <div className="size-11 rounded-xl bg-muted/60 border border-border/40 flex items-center justify-center shrink-0 font-bold text-sm text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                {idx + 1}
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {doc.title.vi}
                  </h2>
                  {doc.title.en && (
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      ({doc.title.en})
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                  {doc.description.vi}
                </p>
              </div>
            </div>

            <ChevronRight className="size-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition shrink-0 ml-2" />
          </Link>
        ))}
      </div>
    </main>
  );
}
