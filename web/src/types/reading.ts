import type { IllustrationAsset } from './index.ts';

export type ReadingKind = 'dialogue' | 'passage';

export interface ReadingRole {
  id: string;
  /** Cú pháp furigana, copy từ vai của hội thoại nguồn. */
  name: string;
}

export interface ReadingSentence {
  /** Hội thoại: `<dialogueId>-<n>`, n từ 1. */
  id: string;
  jp: string;
  vi: string;
  /** Chỉ hội thoại: `ReadingRole.id`. */
  speaker?: string;
  /** Chỉ đoạn văn: số nhóm đoạn để vẽ vạch ngăn. */
  group?: number;
}

/** Khoảng nửa mở [start, end) tính theo UTF-16 trên câu đã `stripFurigana` + `formatOptionalBrackets`. */
export interface ReadingAnchor {
  sentenceId: string;
  start: number;
  end: number;
  text: string;
}

export interface ReadingGlossaryEntry {
  id: string;
  /** `name` = tên riêng: có anchor nhưng không thuộc `vocabUsed/grammarUsed`, không tính coverage, không có `vocabRef`. */
  kind: 'word' | 'grammar' | 'name';
  ref?: string;
  labelJp: string;
  reading?: string;
  meaningsVi: string[];
  exampleJp?: string;
  exampleVi?: string;
  /** Từ trong `vocab/lesson-LL.json`; chỉ mục có trường này mới thêm được vào ôn tập. */
  vocabRef?: { lesson: number; wordId: string };
  illustration?: IllustrationAsset;
  anchors: ReadingAnchor[];
}

export interface ReadingVocabUse {
  /** `unknown:<slug>` khi chưa ánh xạ tới từ vựng N5. */
  id: string;
  ref?: string;
  /** Bài 1–25 hoặc null khi chưa ánh xạ. */
  lesson: number | null;
  glossaryId: string;
}

export interface ReadingGrammarUse {
  /** `<lesson>:<grammarId>` hoặc `external:<slug>`. */
  id: string;
  glossaryId: string;
}

export interface ReadingCoverageBucket {
  totalTypes: number;
  /** Bài (khóa chuỗi) → số loại riêng biệt. */
  byLesson: Record<string, number>;
  unknownTypes: number;
}

export interface ReadingCoverage {
  version: 2;
  vocab: ReadingCoverageBucket;
  grammar: ReadingCoverageBucket;
}

export interface ReadingOption {
  id: string;
  textVi: string;
}

export interface ReadingQuestion {
  id: string;
  promptVi: string;
  options: ReadingOption[];
  correctOptionId: string;
  explanationVi: string;
  evidenceSentenceIds: string[];
}

export type ReadingSource =
  | { kind: 'external'; author: string; title: string; url: string; license: string; licenseUrl?: string; checkedAt: string; notes: string }
  | { kind: 'original'; materialIds: string[] }
  | { kind: 'minna-dialogue'; lesson: number; dialogueId: string };

export interface ReadingReviewLayer {
  layer: 1 | 2 | 3 | 4 | 5;
  status: 'passed' | 'not-applicable';
  note?: string;
}

export interface ReadingReview {
  method: 'ai-multilayer';
  layers: ReadingReviewLayer[];
  models: string[];
  date: string;
  nativeReviewed: boolean;
}

export interface ReadingPassage {
  id: string;
  kind: ReadingKind;
  titleVi: string;
  roles?: ReadingRole[];
  illustration?: IllustrationAsset;
  vocabUsed: ReadingVocabUse[];
  grammarUsed: ReadingGrammarUse[];
  coverage: ReadingCoverage;
  glossary: ReadingGlossaryEntry[];
  sentences: ReadingSentence[];
  questions: ReadingQuestion[];
  source: ReadingSource;
  review: ReadingReview;
}

export interface ReadingFilter {
  minCoverage: number;
  maxNewGrammar: number;
}

export interface ReadingAnswer {
  questionId: string;
  selectedOptionId: string;
}

export interface ReadingSession {
  id: string;
  /** Mốc N lúc bắt đầu. */
  scope: number;
  filter: ReadingFilter;
  dataVersion: number;
  /** Bản chụp bài lúc bắt đầu, gồm nguồn và đáp án. */
  passage: ReadingPassage;
  questionIndex: number;
  /** Lựa chọn chưa nộp của câu hiện tại. */
  selectedOptionId: string | null;
  answers: ReadingAnswer[];
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  revision: number;
}
