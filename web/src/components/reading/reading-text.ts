import type { ReadingGlossaryEntry } from '../../types/reading.ts';
import { parseFurigana } from '../../lib/japanese.ts';

/** Một đoạn liền nhau cùng một tập mục glossary (rỗng nếu không mục nào), ở cú pháp furigana để đưa thẳng cho `Furigana`. */
export interface ReadingRun {
  text: string;
  /** Mọi mục phủ đoạn này, xếp theo ưu tiên: anchor ngắn trước, từ trước ngữ pháp, rồi thứ tự glossary. */
  entryIds: string[];
}

/** Một cụm giữa hai dấu cách của dữ liệu; không được ngắt dòng bên trong. */
export type ReadingWord = ReadingRun[];

const SPACE = /^[ 　]$/;
/** Tiền tố lịch sự mà dữ liệu tách khỏi từ bằng dấu cách (お 祭り, ご 飯); đứng một mình cuối dòng thì đọc sai. */
const HONORIFIC = /^[おご]$/;

/**
 * Cắt một câu thành cụm và đoạn bấm được theo anchor. Offset của anchor tính trên văn bản đã bỏ furigana và đổi
 * ngoặc tùy chọn, tức đúng chuỗi ghép các `base` của `parseFurigana`. Cụm ruby không chia được nên anchor chạm vào
 * cụm ruby thì lấy cả cụm. Chữ thuộc nhiều anchor giữ cả tập mục để người học chọn, không mục nào bị mất.
 */
export function readingWords(sentenceId: string, jp: string, glossary: readonly ReadingGlossaryEntry[]): ReadingWord[] {
  const anchors = glossary.flatMap((entry, order) =>
    entry.anchors.filter((a) => a.sentenceId === sentenceId).map((a) => ({ entry, order, start: a.start, end: a.end })));
  const covering = (start: number, end: number): string[] => {
    const hits = anchors.filter((a) => a.start < end && a.end > start);
    hits.sort((p, q) => (p.end - p.start) - (q.end - q.start) || (p.entry.kind === 'word' ? 0 : 1) - (q.entry.kind === 'word' ? 0 : 1) || p.order - q.order);
    return [...new Set(hits.map((a) => a.entry.id))];
  };

  const words: ReadingWord[] = [[]];
  // Chữ gốc của cụm đang dựng, để nhận ra cụm mới chỉ có tiền tố.
  let base = '';
  let offset = 0;
  const push = (text: string, length: number) => {
    const entryIds = covering(offset, offset + length);
    const word = words[words.length - 1]!;
    const last = word[word.length - 1];
    if (last && last.entryIds.join() === entryIds.join()) last.text += text;
    else word.push({ text, entryIds });
    offset += length;
  };
  const pushBase = (text: string) => { base += text; };
  for (const segment of parseFurigana(jp)) {
    if (segment.ruby) {
      push(`${segment.base}[${segment.ruby}]`, segment.base.length);
      pushBase(segment.base);
      continue;
    }
    for (const ch of segment.base) {
      if (SPACE.test(ch)) {
        // Dấu cách sau tiền tố không ngắt cụm; offset vẫn đếm nó vì anchor tính trên chuỗi gốc.
        if (words[words.length - 1]!.length > 0 && !HONORIFIC.test(base)) { words.push([]); base = ''; }
        offset += ch.length;
      } else { push(ch, ch.length); pushBase(ch); }
    }
  }
  return words.filter((word) => word.length > 0);
}

/** Đoạn văn: câu liền nhau cùng `group` chung một hàng (một vạch ngăn mỗi nhóm); câu không có `group` tự thành hàng. */
export function groupSentences<T extends { group?: number }>(sentences: readonly T[]): T[][] {
  const rows: T[][] = [];
  for (const sentence of sentences) {
    const last = rows[rows.length - 1];
    if (last && sentence.group !== undefined && last[last.length - 1]!.group === sentence.group) last.push(sentence);
    else rows.push([sentence]);
  }
  return rows;
}
