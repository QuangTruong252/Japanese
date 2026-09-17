import type { Card } from 'ts-fsrs';

export type TargetType = 'vocab' | 'grammar' | 'kanji' | 'particle' | 'listening';

export type ExerciseType = 'mc' | 'matching' | 'cloze' | 'reorder' | 'listening';

export interface LocalizedText {
  vi: string;
  en?: string;
}

export interface ExampleSentence {
  jp: string; // Furigana bracket notation: "私[わたし]は 学生[がくせい]です"
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

export interface VocabWord {
  id: string;
  lesson: number;
  word: string;
  kana: string;
  romaji?: string;
  meaning: LocalizedText;
  type: 'noun' | 'pronoun' | 'verb-1' | 'verb-2' | 'verb-3' | 'i-adj' | 'na-adj' | 'adverb' | 'particle' | 'expression';
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
  sourceRef: { book: string; pages: string };
  grammar: GrammarPoint[];
  references?: string[];
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
