export interface KanjiExample {
  word: string;
  meaning: {
    en: string;
    vi: string;
  };
}

export interface KanjiData {
  character: string;
  level: 'n5' | 'n4';
  lesson?: number;
  meanings: {
    en: string[];
    vi: string[];
  };
  onyomi: string[];
  kunyomi: string[];
  strokes: number;
  examples: KanjiExample[];
  similar?: string[];
}

export interface VerbItem {
  id: string;
  group: 1 | 2 | 3;
  verb: string;
  masu: string;
  te: string;
  dictionary: string;
  nai?: string;
  ta: string;
  meaning: {
    en: string;
    vi: string;
  };
  lesson: number;
}

export type TableCell = string | { en?: string; vi?: string };

export interface ReferenceSectionTable {
  headers: Array<{ en?: string; vi: string }>;
  rows: TableCell[][];
}

export interface ReferenceSection {
  id: string;
  title: {
    en?: string;
    vi: string;
  };
  tables: ReferenceSectionTable[];
  note?: {
    en?: string;
    vi: string;
  };
}

export interface ReferenceDocument {
  level: 'n5' | 'n4';
  slug: string;
  title: {
    en?: string;
    vi: string;
  };
  description: {
    en?: string;
    vi: string;
  };
  order: number;
  sections: ReferenceSection[];
}

export interface VocabRef {
  id: string;
  targetId: string;
  lesson: number;
  word: string;
  kana: string;
  meaning: {
    vi: string;
    en?: string;
  };
}
