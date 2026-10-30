'use client';

import { Furigana } from '@/components/Furigana';
import { cn } from '@/lib/utils';
import type { ReadingGlossaryEntry } from '@/types/reading';
import { readingWords } from './reading-text';

/**
 * Một câu Nhật; mọi đoạn thuộc mục glossary là nút bấm được (gạch chấm), còn lại là chữ thường. Cụm giữa hai dấu
 * cách không ngắt dòng. Không có `onPick` thì chỉ hiển thị.
 */
export function ReadingText({
  sentenceId,
  jp,
  glossary,
  className,
  lookup = false,
  activeEntryId,
  onPick,
}: {
  sentenceId: string;
  jp: string;
  glossary: readonly ReadingGlossaryEntry[];
  className: string;
  /** Bật "Tra từ": tô nền nhẹ mọi từ bấm được. */
  lookup?: boolean;
  activeEntryId?: string | null;
  /** Một đoạn có thể thuộc nhiều mục; nhiều mục thì nơi gọi cho người học chọn. */
  onPick?: (entryIds: string[], element: HTMLElement) => void;
}) {
  const words = readingWords(sentenceId, jp, glossary);
  const active = (ids: string[]) => !!activeEntryId && ids.includes(activeEntryId);
  return (
    // Đoạn không co (shrink-0): Furigana có overflow-wrap:anywhere nên co sẽ về 1 ký tự và chữ vỡ thành nhiều hàng; cụm quá dài thì xuống dòng giữa các đoạn nhờ flex-wrap.
    // Khung ngoài là inline thường để câu nối tiếp câu trước trên cùng dòng trong đoạn văn; chỉ từng cụm không ngắt.
    <span>
      {words.map((word, w) => (
        <span key={w} className="mr-[0.3em] inline-flex max-w-full flex-wrap items-baseline last:mr-0">
          {word.map((run, r) =>
            run.entryIds.length > 0 && onPick ? (
              <button
                key={r}
                type="button"
                data-reading-word=""
                aria-haspopup="dialog"
                aria-expanded={active(run.entryIds)}
                onClick={(e) => onPick(run.entryIds, e.currentTarget)}
                className={cn(
                  // Không padding ngang: hai đoạn liền nhau trong cùng một từ (押し|ます) phải dính như chữ thường.
                  // Gạch dưới bằng border vì text-decoration không lan vào khối inline-flex của Furigana.
                  'shrink-0 rounded-sm border-b-2 border-dotted border-primary/60 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
                  active(run.entryIds) ? 'bg-accent text-primary' : lookup && 'bg-accent/50',
                )}
              >
                <Furigana text={run.text} className={className} />
              </button>
            ) : (
              <Furigana key={r} text={run.text} className={cn('shrink-0', className)} />
            ),
          )}
        </span>
      ))}
    </span>
  );
}
