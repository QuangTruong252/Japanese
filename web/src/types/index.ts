import type { Card } from 'ts-fsrs';

export type TargetType = 'vocab' | 'grammar' | 'kanji' | 'particle' | 'listening';

export type ExerciseType = 'mc' | 'matching' | 'cloze' | 'reorder' | 'listening';

export interface LocalizedText {
  vi: string;
  en?: string;
}

export interface IllustrationAsset {
  src: string;
  width: number;
  height: number;
  alt: LocalizedText;
}

/** Một phần của câu ví dụ thuộc mẫu ngữ pháp, để tô màu và gạch chân. */
export interface GrammarMark {
  /** Chuỗi con nguyên văn của `jp` (giữ cả ngoặc furigana) */
  text: string;
  /** Phần tử của `GrammarPoint.slots`; bỏ trống = phần cố định của mẫu */
  slot?: string;
}

export interface ExampleSentence {
  jp: string; // Furigana bracket notation: "私[わたし]は 学生[がくせい]です"
  kana?: string; // Cách đọc câu để phát âm và hiển thị dưới ví dụ
  translation: LocalizedText;
  note?: LocalizedText;
  audioKey?: string;
  marks?: GrammarMark[];
}

export interface GrammarPoint {
  id: string;
  title: LocalizedText;
  pattern: LocalizedText;
  /** Ô biến của `pattern.vi` theo thứ tự xuất hiện, vd ["N1", "N2"] */
  slots?: string[];
  explanation: LocalizedText;
  sourceRef?: string;
  examples: ExampleSentence[];
  illustration?: IllustrationAsset;
  illustrationCaption?: LocalizedText;
}

export interface DialogueRole {
  id: string;
  /** Cú pháp furigana: "マイ", "田中[たなか]" */
  name: string;
}

export interface DialogueLine extends ExampleSentence {
  /** DialogueRole.id */
  speaker: string;
  /** Từ vựng (thường là câu giao tiếp) mà câu này dùng, để trang từ vựng trỏ tới đúng câu. */
  vocabIds?: string[];
  /** Id điểm ngữ pháp cùng bài mà câu này dùng rõ ràng */
  grammarIds?: string[];
}

export interface Dialogue {
  /** `l<số bài 2 chữ số>-<slug>`, ví dụ `l01-hajimemashite` */
  id: string;
  title: LocalizedText;
  /** Từ 2 vai trở lên */
  roles: DialogueRole[];
  lines: DialogueLine[];
  illustration?: IllustrationAsset;
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
  illustration?: IllustrationAsset;
}

export interface Lesson {
  level: 'n5' | 'n4';
  number: number;
  title: LocalizedText;
  jpTitle?: string;
  description: LocalizedText;
  /** Tùy chọn; không điền số trang phỏng đoán. */
  sourceRef?: { book: string; pages: string };
  /** Mặc định 'unverified' khi vắng mặt. */
  verification?: 'verified' | 'unverified';
  grammar: GrammarPoint[];
  dialogues?: Dialogue[];
  references?: string[];
  cover?: IllustrationAsset;
}

/** Một cặp của dạng `matching`. Mỗi cặp có lịch ôn riêng. */
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

/** Kết quả một lượt trả lời. Dạng matching trả nhiều phần tử, bốn dạng còn lại trả một. */
export interface AnswerResult {
  targetId: string;
  targetType: TargetType;
  isCorrect: boolean;
  elapsedMs: number;
  usedHint: boolean;
  /** Chỉ để hiển thị vùng phản hồi/kết quả, không lưu Dexie/sync */
  userAnswer?: string;
  /** Câu sinh ra kết quả; cùng một từ có thể xuất hiện ở nhiều câu trong một phiên. Chỉ để hiển thị. */
  questionId?: string;
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
  /** Lần đầu mục tiêu vào lịch ôn — dùng để đếm mục mới trong ngày. */
  createdAt: string;
  /** Tối đa 5 mẫu thời gian trả lời ĐÚNG gần nhất, để suy median. */
  recentElapsedMs: number[];
}

/** Thẻ viết chữ có lịch FSRS riêng, không nằm trong reviewItems. */
export interface WritingCard {
  char: string;
  fsrsCard: Card;
  dueAt: Date;
  correctCount: number;
  incorrectCount: number;
  lastFailedAt?: string;
  createdAt: string;
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
