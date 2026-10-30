'use client';

import { Furigana } from '@/components/Furigana';
import { cn } from '@/lib/utils';
import type { ReadingGlossaryEntry } from '@/types/reading';
import { readingWords } from './reading-text';

// Dấu câu đóng không được đứng đầu hàng khi cụm phải xuống dòng, nên dính vào đoạn ngay trước nó.
const CLOSING = /^[、。，．！？!?」』）)…]+$/;

function gluePunctuation<T extends { text: string; entryIds: string[] }>(runs: readonly T[]): T[][] {
  const chunks: T[][] = [];
  for (const run of runs) {
    if (chunks.length > 0 && run.entryIds.length === 0 && CLOSING.test(run.text)) chunks[chunks.length - 1].push(run);
    else chunks.push([run]);
  }
  return chunks;
}

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
  const runNode = (run: (typeof words)[number][number], key: number) =>
    run.entryIds.length > 0 && onPick ? (
      <button
        key={key}
        type="button"
        data-reading-word=""
        aria-haspopup="dialog"
        aria-expanded={active(run.entryIds)}
        onClick={(e) => onPick(run.entryIds, e.currentTarget)}
        className={cn(
          // Không padding ngang: hai đoạn liền nhau trong cùng một từ (押し|ます) phải dính như chữ thường.
          // Gạch dưới bằng border vì text-decoration không lan vào khối inline-flex của Furigana.
          'shrink-0 rounded-sm border-b-2 border-dotted border-primary/60 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
          // Nền theo primary chứ không theo accent: bubble của người nói thứ hai đã là màu accent nên nền accent sẽ chìm mất.
          active(run.entryIds) ? 'bg-primary/25 text-primary' : lookup && 'bg-primary/12',
        )}
      >
        <Furigana text={run.text} className={className} />
      </button>
    ) : (
      <Furigana key={key} text={run.text} className={cn('shrink-0', className)} />
    );
  return (
    // Đoạn không co (shrink-0): Furigana có overflow-wrap:anywhere nên co sẽ về 1 ký tự và chữ vỡ thành nhiều hàng; cụm quá dài thì xuống dòng giữa các đoạn nhờ flex-wrap.
    // Khung ngoài là inline thường để câu nối tiếp câu trước trên cùng dòng trong đoạn văn; chỉ từng cụm không ngắt.
    <span>
      {words.map((word, w) => (
        <span key={w} className="mr-[0.3em] inline-flex max-w-full flex-wrap items-baseline last:mr-0">
          {gluePunctuation(word).map((chunk, c) =>
            chunk.length === 1 ? (
              runNode(chunk[0], c)
            ) : (
              <span key={c} className="inline-flex shrink-0 items-baseline">
                {chunk.map((run, r) => runNode(run, r))}
              </span>
            ),
          )}
        </span>
      ))}
    </span>
  );
}
