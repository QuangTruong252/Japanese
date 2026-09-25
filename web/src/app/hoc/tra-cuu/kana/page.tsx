import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, Info } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { KanaChart } from './KanaChart';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Bảng chữ cái Kana · MaiPace',
  description: 'Bảng chữ cái tiếng Nhật Hiragana và Katakana 46 âm cơ bản, âm đục và âm ghép kèm phát âm giọng đọc.',
};

export default function KanaPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 sm:px-6 pt-6 sm:pt-10 pb-24">
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

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Bảng chữ Kana
            </h1>
            <p className="text-sm text-muted-foreground">
              Hiragana & Katakana cho người mới bắt đầu.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle className="size-11 sm:size-12 rounded-xl" />
            <SearchTrigger iconOnly />
          </div>
        </div>
      </header>

      {/* 2. Lời khuyên định hướng cho người mới bắt đầu */}
      <aside
        aria-label="Chỉ dẫn cho người mới học chữ Kana"
        className="rounded-2xl border border-border/80 bg-muted/40 p-4 sm:p-5 space-y-2.5 text-sm"
      >
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Info className="size-4.5 text-primary shrink-0" aria-hidden="true" />
          <span>Chỉ dẫn cho người mới bắt đầu</span>
        </div>

        <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground list-disc list-inside">
          <li>
            Bạn nên học thuộc bảng <strong className="text-foreground">Hiragana</strong> trước vì đây là nền tảng tối cần thiết để bắt đầu bài 1.
          </li>
          <li>
            Furigana (chữ nhỏ phiên âm trên đầu Kanji) trong ứng dụng luôn dùng <strong className="text-foreground">Hiragana</strong> để hiển thị cách đọc.
          </li>
          <li>
            Bảng <strong className="text-foreground">Katakana</strong> chủ yếu dùng để ghi các từ mượn tiếng nước ngoài, tên riêng quốc tế và từ tượng thanh.
          </li>
        </ul>
      </aside>

      {/* 3. Lưới chữ tương tác kèm phát âm */}
      <KanaChart />
    </main>
  );
}
