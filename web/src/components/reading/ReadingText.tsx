'use client';

import { Furigana } from '@/components/Furigana';
import { cn } from '@/lib/utils';
import type { ReadingGlossaryEntry } from '@/types/reading';
import { readingWords } from './reading-text';

/**
 * Một câu Nhật; mọi đoạn thuộc mục glossary là nút bấm được (gạch chấm), còn lại là chữ thường. Cụm giữa hai dấu
 * cách không ngắt dòng. Không có `onPick` thì chỉ hiển thị (màn kết quả).
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
    <span className="inline-flex max-w-full flex-wrap items-baseline gap-x-[0.3em]">
      {words.map((word, w) => (
        <span key={w} className="inline-flex max-w-full items-baseline">
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
                  'rounded-md underline decoration-primary/50 decoration-dotted decoration-2 [text-underline-offset:0.2em] outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
                  active(run.entryIds) ? 'bg-accent text-primary' : lookup && 'bg-accent/50',
                )}
              >
                <Furigana text={run.text} className={className} />
              </button>
            ) : (
              <Furigana key={r} text={run.text} className={className} />
            ),
          )}
        </span>
      ))}
    </span>
  );
}
