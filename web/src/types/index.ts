import type { Card } from 'ts-fsrs';

export type TargetType = 'vocab' | 'grammar' | 'kanji' | 'particle' | 'listening';

export type ExerciseType = 'mc' | 'matching' | 'cloze' | 'reorder' | 'listening';

export interface LocalizedText {
  vi: string;
  en?: string;
}

export interface ExampleSentence {
  jp: string; // Furigana bracket notation: "私[わたし]は 学生[がくせい]です"
  kana?: string; // Cách đọc câu để phát âm và hiển thị dưới ví dụ
  translation: LocalizedText;
  note?: LocalizedText;
  audioKey?: string;
}

export interface GrammarPoint {
  id: string;
  title: LocalizedText;
  pattern: LocalizedText;
  explanation: LocalizedText;
  sourceRef?: string;
  examples: ExampleSentence[];
}

export interface VerbForms {
  dictionary: string;
  dictionaryKana: string;
  masu: string;
  masuKana: string;
  te?: string;
  teKana?: string;
  nai?: string;
  naiKana?: string;
  ta?: string;
  taKana?: string;
}

export interface VocabWord {
  id: string;
  lesson: number;
  word: string;
  kana: string;
  romaji?: string;
  meaning: LocalizedText;
  example?: ExampleSentence;
  type:
    | 'noun' | 'pronoun' | 'verb-godan' | 'verb-ichidan' | 'verb-irregular'
    | 'adjective-i' | 'adjective-na' | 'adverb' | 'particle' | 'expression'
    | 'interrogative' | 'counter' | 'number' | 'conjunction';
  verbGroup?: 1 | 2 | 3;
  verbForms?: VerbForms;
  kanjiIds?: string[];
  audioKey?: string;
  notes?: LocalizedText;
}

export interface Lesson {
  level: 'n5' | 'n4';
  number: number;
  title: LocalizedText;
  jpTitle?: string;
  description: LocalizedText;
  /** Tùy chọn; không điền số trang phỏng đoán (SPEC-01 §3.1). */
  sourceRef?: { book: string; pages: string };
  /** Mặc định 'unverified' khi vắng mặt. */
  verification?: 'verified' | 'unverified';
  grammar: GrammarPoint[];
  references?: string[];
}

/** Một cặp của dạng `matching`. Mỗi cặp có lịch ôn riêng (SPEC-01 §4.2). */
export interface MatchingPair {
  targetId: string;
  jp: string;
  vi: string;
}

export interface QuestionItem {
  id: string;
  type: ExerciseType;
  lesson: number;
  auxiliaryLessons: number[];
  audioKey?: string;
  targetId: string;
  prompt: string;
  context?: string;
  options?: string[];
  answer: string | string[];
  acceptedVariants?: string[];
  explanationVi?: string;
  explanationJp?: string;
  /** Bắt buộc khi type === 'matching'; chấm và ghi review đọc trường này, không đọc targetId. */
  pairs?: MatchingPair[];
}

/** Kết quả một lượt trả lời. Dạng matching trả nhiều phần tử, bốn dạng còn lại trả một (SPEC-04 §2.1). */
export interface AnswerResult {
  targetId: string;
  targetType: TargetType;
  isCorrect: boolean;
  elapsedMs: number;
  usedHint: boolean;
}

export interface PracticeConfig {
  mode: 'lesson' | 'due';
  lessons: number[];
  maxLearnedLesson: number;
  selectedTypes: ExerciseType[];
  questionCount: number;
}

export interface ReviewItem {
  targetId: string;
  targetType: TargetType;
  lesson: number;
  incorrectCount: number;
  correctCount: number;
  lastFailedAt?: string;
  dueAt: Date;
  fsrsCard: Card;
  updatedAt: string;
  /** Lần đầu mục tiêu vào lịch ôn — dùng để đếm mục mới trong ngày (SPEC-05 §2.1). */
  createdAt: string;
  /** Tối đa 5 mẫu thời gian trả lời ĐÚNG gần nhất, để suy median (SPEC-04 §2.2). */
  recentElapsedMs: number[];
}

export interface PracticeSession {
  id: string;
  selectedLessons: number[];
  exerciseTypes: ExerciseType[];
  totalQuestions: number;
  correctCount: number;
  accuracyRate: number;
  durationSeconds: number;
  createdAt: string;
}

export interface AudioFileRecord {
  id: string;
  lesson: number;
  type: string;
  blob: Blob;
  size: number;
  sha256: string;
}

export interface PendingSyncRecord {
  id: string;
  payload: unknown;
  createdAt: number;
}
