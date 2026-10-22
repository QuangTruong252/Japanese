import type { Dialogue, DialogueLine, GrammarMark, Lesson } from '../types/index.ts';
import { parseFurigana, type FuriganaSegment } from './japanese.ts';

export interface PatternSegment {
  text: string;
  /** Vị trí ô trong `slots`; bỏ trống = phần cố định */
  slotIndex?: number;
}

export interface MarkSegment {
  text: string;
  kind: 'plain' | 'fixed' | 'slot';
  slotIndex?: number;
}

/** Một mảnh chữ (có hoặc không furigana) kèm loại tô của đoạn chứa nó. */
export interface MarkedPiece extends FuriganaSegment {
  kind: MarkSegment['kind'];
  slotIndex?: number;
  /** Số thứ tự của đoạn (trong `segments` đưa vào) chứa mảnh này, để ghép lại mảnh cùng đoạn */
  segment: number;
}

/**
 * Tách mẫu câu theo các ô biến. Tại mỗi vị trí khớp ô dài nhất trước, để `A-な` thắng `A-`.
 */
export function patternSegments(pattern: string, slots: string[] = []): PatternSegment[] {
  const segments: PatternSegment[] = [];
  let fixed = '';
  const flush = () => {
    if (fixed) segments.push({ text: fixed });
    fixed = '';
  };
  for (let i = 0; i < pattern.length; ) {
    let best = -1;
    slots.forEach((slot, index) => {
      if (slot && pattern.startsWith(slot, i) && (best === -1 || slot.length > slots[best]!.length)) best = index;
    });
    if (best === -1) {
      fixed += pattern[i];
      i += 1;
    } else {
      flush();
      segments.push({ text: slots[best]!, slotIndex: best });
      i += slots[best]!.length;
    }
  }
  flush();
  return segments;
}

/**
 * Phủ toàn bộ câu bằng các đoạn plain / fixed / slot. Mỗi mark được tìm từ cuối mark trước.
 */
export function markSegments(jp: string, marks: GrammarMark[] = [], slots: string[] = []): MarkSegment[] {
  const segments: MarkSegment[] = [];
  let cursor = 0;
  for (const mark of marks) {
    const start = jp.indexOf(mark.text, cursor);
    if (!mark.text || start === -1) continue;
    if (start > cursor) segments.push({ text: jp.slice(cursor, start), kind: 'plain' });
    const slotIndex = mark.slot === undefined ? -1 : slots.indexOf(mark.slot);
    segments.push(
      slotIndex === -1
        ? { text: mark.text, kind: 'fixed' }
        : { text: mark.text, kind: 'slot', slotIndex },
    );
    cursor = start + mark.text.length;
  }
  if (cursor < jp.length) segments.push({ text: jp.slice(cursor), kind: 'plain' });
  return segments.length ? segments : [{ text: jp, kind: 'plain' }];
}

/**
 * Gom các đoạn đã tô thành cụm theo dấu cách của dữ liệu (như `groupFuriganaWords`), mỗi mảnh giữ loại tô,
 * nên câu có mark vẫn chỉ xuống dòng giữa các cụm.
 */
export function groupMarkedWords(segments: MarkSegment[]): MarkedPiece[][] {
  const words: MarkedPiece[][] = [[]];
  for (const [segment, { text, kind, slotIndex }] of segments.entries()) {
    for (const piece of parseFurigana(text)) {
      if (piece.ruby) {
        words[words.length - 1]!.push({ ...piece, kind, slotIndex, segment });
        continue;
      }
      piece.base.split(/[ 　]+/).forEach((part, i) => {
        if (i > 0) words.push([]);
        if (part) words[words.length - 1]!.push({ base: part, kind, slotIndex, segment });
      });
    }
  }
  return words.filter((word) => word.length > 0);
}

/** Nghĩa ngắn của điểm: phần sau " — " của tiêu đề, bỏ «» bao ngoài. */
export function grammarMeaning(title: string): string {
  const at = title.indexOf(' — ');
  const meaning = (at === -1 ? title : title.slice(at + 3)).trim();
  return meaning.startsWith('«') && meaning.endsWith('»') ? meaning.slice(1, -1).trim() : meaning;
}

export interface GrammarDialogueLine {
  dialogue: Dialogue;
  lineIndex: number;
  line: DialogueLine;
}

/** Các dòng hội thoại của bài dùng điểm này, theo thứ tự xuất hiện. */
export function grammarDialogueLines(lesson: Lesson, pointId: string): GrammarDialogueLine[] {
  const found: GrammarDialogueLine[] = [];
  for (const dialogue of lesson.dialogues ?? []) {
    dialogue.lines.forEach((line, lineIndex) => {
      if (line.grammarIds?.includes(pointId)) found.push({ dialogue, lineIndex, line });
    });
  }
  return found;
}

const SLOT_CHART = [1, 3, 4, 5] as const;

/** Biến CSS màu của ô: chàm, rêu, mận, ochre rồi lặp lại. */
export function slotColor(slotIndex: number): string {
  return `var(--chart-${SLOT_CHART[slotIndex % SLOT_CHART.length]})`;
}

/** Mẫu câu dưới dạng đoạn tô: ô là `slot`, phần còn lại là `fixed`. */
export function patternMarks(pattern: string, slots?: string[]): MarkSegment[] {
  return patternSegments(pattern, slots).map((s) =>
    s.slotIndex === undefined ? { text: s.text, kind: 'fixed' } : { text: s.text, kind: 'slot', slotIndex: s.slotIndex },
  );
}
