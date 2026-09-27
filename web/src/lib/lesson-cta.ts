/**
 * Xác định nhãn nút và trạng thái cho CTA chính của màn Bài học (/hoc/[so]) theo SPEC-18 §3.
 */
export function resolveLessonCtaText({
  vocabDraft,
  learnedCount,
  totalVocab,
}: {
  vocabDraft?: { currentWordIndex: number; totalWords: number } | null;
  learnedCount: number;
  totalVocab: number;
}): { ctaText: string; isResuming: boolean } {
  if (vocabDraft) {
    return {
      ctaText: `Tiếp tục học từ vựng (từ ${vocabDraft.currentWordIndex}/${vocabDraft.totalWords})`,
      isResuming: true,
    };
  }
  if (totalVocab > 0 && learnedCount >= totalVocab) {
    return {
      ctaText: 'Ôn lại từ vựng bài này',
      isResuming: false,
    };
  }
  if (learnedCount > 0) {
    return {
      ctaText: `Tiếp tục học từ vựng (${learnedCount}/${totalVocab})`,
      isResuming: true,
    };
  }
  return {
    ctaText: 'Học từ vựng',
    isResuming: false,
  };
}
