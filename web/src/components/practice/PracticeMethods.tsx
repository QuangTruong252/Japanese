import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { FeatureIcon, type FeatureIconName } from '@/components/FeatureIcon';
import { cn } from '@/lib/utils';

export function PracticeMethods({ compact = false, lesson }: { compact?: boolean; lesson?: number }) {
  const methods: { href: string; title: string; detail: string; icon: FeatureIconName; hubOnly?: boolean }[] = [
    { href: '/luyen-tap/bai-tap', title: 'Bài tập', detail: '5 dạng bài', icon: 'practice' },
    { href: '/nghe-moi-ngay', title: 'Nghe mỗi ngày', detail: 'Chép chính tả', icon: 'listening' },
    { href: '/luyen-tap/dich-cau', title: 'Dịch phản xạ', detail: 'Nhật ↔ Việt', icon: 'reading', hubOnly: true },
    { href: '/luyen-tap/doc-hieu', title: 'Luyện đọc', detail: 'Hội thoại · Đoạn văn', icon: 'lesson', hubOnly: true },
    { href: '/luyen-viet', title: 'Luyện viết', detail: 'Kana · Kanji', icon: 'kana' },
    { href: lesson ? `/hoc/${lesson}#hoi-thoai` : '/luyen-tap/hoi-thoai', title: 'Hội thoại', detail: lesson ? `Bài ${lesson}` : 'Theo bài', icon: 'dialogue' },
  ];

  return (
    <div className={cn('grid grid-cols-2 gap-3', compact ? 'lg:grid-cols-4' : 'lg:gap-5')}>
      {methods.filter((method) => !(compact && method.hubOnly)).map((method) => (
        <Link
          key={method.href}
          href={method.href}
          className={cn(
            'group relative flex min-w-0 rounded-xl border border-border bg-card outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring',
            compact ? 'min-h-20 flex-row items-center gap-2 p-3 lg:p-4' : 'min-h-36 flex-col gap-3 p-4 sm:min-h-40 sm:p-5',
          )}
        >
          <span className={cn('flex shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-6', compact ? 'size-8 lg:size-9' : 'size-9')} aria-hidden="true">
            <FeatureIcon name={method.icon} />
          </span>
          <span className={cn('min-w-0', !compact && 'pr-3')}>
            <span className={cn('block font-semibold text-foreground', compact ? 'text-sm lg:text-base' : 'text-base')}>{method.title}</span>
            <span className={cn('mt-0.5 block text-muted-foreground', compact ? 'text-xs lg:text-sm' : 'text-sm')}>{method.detail}</span>
          </span>
          <ChevronRight className={cn('size-5 shrink-0 text-muted-foreground', compact ? 'ml-auto hidden lg:block' : 'ml-auto mt-auto')} aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}
