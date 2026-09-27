import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLessonCtaText } from './lesson-cta.ts';

test('resolveLessonCtaText: ưu tiên nháp từ vựng đang dở', () => {
  const result = resolveLessonCtaText({
    vocabDraft: { currentWordIndex: 4, totalWords: 10 },
    learnedCount: 5,
    totalVocab: 30,
  });
  assert.equal(result.ctaText, 'Tiếp tục học từ vựng (từ 4/10)');
  assert.equal(result.isResuming, true);
});

test('resolveLessonCtaText: người mới chưa học gì -> Học từ vựng', () => {
  const result = resolveLessonCtaText({
    vocabDraft: null,
    learnedCount: 0,
    totalVocab: 35,
  });
  assert.equal(result.ctaText, 'Học từ vựng');
  assert.equal(result.isResuming, false);
});

test('resolveLessonCtaText: đã học một phần -> Tiếp tục học từ vựng (learned/total)', () => {
  const result = resolveLessonCtaText({
    vocabDraft: null,
    learnedCount: 12,
    totalVocab: 35,
  });
  assert.equal(result.ctaText, 'Tiếp tục học từ vựng (12/35)');
  assert.equal(result.isResuming, true);
});

test('resolveLessonCtaText: đã hoàn tất bài -> Ôn lại từ vựng bài này', () => {
  const result = resolveLessonCtaText({
    vocabDraft: null,
    learnedCount: 35,
    totalVocab: 35,
  });
  assert.equal(result.ctaText, 'Ôn lại từ vựng bài này');
  assert.equal(result.isResuming, false);
});
