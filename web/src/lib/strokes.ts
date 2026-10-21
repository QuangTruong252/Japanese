import kanaStrokes from '../data/strokes/kana.json' with { type: 'json' };
import kanjiStrokes from '../data/strokes/kanji.json' with { type: 'json' };

export interface CharStrokes {
  d: string[];
  n: [number, number][];
}

const data = { ...kanaStrokes, ...kanjiStrokes } as unknown as Record<string, CharStrokes>;

export function getStrokes(char: string): CharStrokes | undefined {
  return Object.hasOwn(data, char) ? data[char] : undefined;
}

export function hasStrokes(char: string): boolean {
  return getStrokes(char) !== undefined;
}
