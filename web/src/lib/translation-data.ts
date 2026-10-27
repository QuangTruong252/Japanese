import source from '../data/n5/translation.json' with { type: 'json' };

export type TranslationSource =
  | { kind: 'grammar'; lesson: number; grammarId: string; exampleIndex: number }
  | { kind: 'vocab'; lesson: number; wordId: string };

export interface TranslationKeyword {
  /** `bài:id` của từ trong vocab; vi chỉ có khi tìm được cụm Việt tương ứng nguyên văn trong `vi` của câu. */
  ref: string;
  jp: string;
  vi?: string;
}

export interface TranslationSentence {
  id: string;
  source: TranslationSource;
  jp: string;
  vi: string;
  minimumLesson: number;
  keywords: TranslationKeyword[];
  snapshot: string;
}

export const TRANSLATION_DATA_VERSION = source.version;

// Chỉ tập câu đã duyệt được đóng gói; câu và nghĩa là nguyên văn nguồn, không sinh hay dịch lại.
export const TRANSLATION_SENTENCES: TranslationSentence[] = source.sentences as TranslationSentence[];
