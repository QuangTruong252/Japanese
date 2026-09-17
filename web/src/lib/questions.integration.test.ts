/**
 * Kiểm tra tích hợp trên DỮ LIỆU THẬT trong src/data/n5 (SPEC-01 §7).
 * Đây là loại lỗi chỉ lộ ra khi gặp câu thật, không lộ ra với dữ liệu giả.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateQuestions } from './questions.ts';
import { containsKanji, normalizeJapaneseInput, toKanaSentence } from './japanese.ts';
import { AVAILABLE_N5_LESSONS, loadLessons, loadVocabMap } from './lessons.ts';
import type { VocabWord } from '../types/index.ts';

const lessons = await loadLessons([...AVAILABLE_N5_LESSONS]);
const vocabByLesson = await loadVocabMap([...AVAILABLE_N5_LESSONS]);
const questions = generateQuestions(lessons, vocabByLesson);

test('dữ liệu thật: nạp được 25 bài và toàn bộ từ vựng qua lessons.ts', () => {
  assert.equal(lessons.length, 25);
  assert.equal(vocabByLesson.size, 25);
  assert.ok(questions.length > 1000, `chỉ sinh được ${questions.length} câu`);
});

test('dữ liệu thật: 25/25 bài đều có verification: unverified và không có sourceRef bịa', () => {
  for (const lesson of lessons) {
    assert.equal(
      lesson.verification,
      'unverified',
      `Bài ${lesson.number} thiếu verification: 'unverified'`
    );
    assert.equal(
      lesson.sourceRef,
      undefined,
      `Bài ${lesson.number} chứa sourceRef chưa đối chiếu`
    );
  }
});

test('hiệu năng: sinh câu hỏi cho bài 1-5 dưới 100ms (SPEC-01 §7)', async () => {
  const subsetLessons = await loadLessons([1, 2, 3, 4, 5]);
  const subsetVocab = await loadVocabMap([1, 2, 3, 4, 5]);

  const start = performance.now();
  const subsetQuestions = generateQuestions(subsetLessons, subsetVocab);
  const elapsed = performance.now() - start;

  assert.ok(subsetQuestions.length > 0);
  assert.ok(elapsed < 100, `Sinh câu hỏi bài 1-5 mất ${elapsed.toFixed(2)}ms (vượt quá 100ms)`);
});

test('listening: đáp án là kana và khớp đúng chuỗi người học gõ', () => {
  const listening = questions.filter((q) => q.type === 'listening');
  assert.ok(listening.length > 0, 'không sinh được câu nghe nào');

  for (const q of listening) {
    const answer = q.answer as string;
    // Người học nghe xong gõ kana của câu — phải khớp sau chuẩn hóa.
    const typed = normalizeJapaneseInput(toKanaSentence(q.explanationJp ?? q.prompt));
    assert.equal(
      normalizeJapaneseInput(answer),
      typed,
      `câu ${q.id}: đáp án "${answer}" không khớp chuỗi kana người học gõ`
    );
  }
});

test('listening: không câu nào còn sót chữ Hán trong đáp án', () => {
  for (const q of questions.filter((item) => item.type === 'listening')) {
    assert.equal(
      containsKanji(q.answer as string),
      false,
      `câu ${q.id} còn chữ Hán: ${q.answer as string}`
    );
  }
});

test('matching: mỗi cặp một targetId riêng, không trùng, không sót', () => {
  const matching = questions.filter((q) => q.type === 'matching');
  assert.ok(matching.length > 0);

  for (const q of matching) {
    assert.ok(q.pairs, `câu ${q.id} thiếu pairs`);
    assert.equal(q.pairs!.length, q.options!.length, `câu ${q.id}: số cặp lệch số phương án`);
    const ids = new Set(q.pairs!.map((p) => p.targetId));
    assert.equal(ids.size, q.pairs!.length, `câu ${q.id} có targetId trùng nhau`);
    assert.equal(q.targetId, q.pairs![0]!.targetId);
  }
});

test('matching: targetId của cặp trỏ đúng từ vựng tương ứng', () => {
  const byId = new Map<string, VocabWord>();
  for (const [lesson, words] of vocabByLesson.entries()) {
    words.forEach((w, idx) => {
      const id = `vocab-${String(lesson).padStart(2, '0')}-${String(idx + 1).padStart(2, '0')}`;
      byId.set(id, w);
    });
  }

  for (const q of questions.filter((item) => item.type === 'matching')) {
    for (const pair of q.pairs!) {
      const word = byId.get(pair.targetId);
      assert.ok(word, `${pair.targetId} không tồn tại trong dữ liệu từ vựng`);
      assert.equal(pair.jp, word!.word);
      assert.equal(pair.vi, word!.meaning.vi);
    }
  }
});

test('mọi targetId đều ôn được ở mode due (có câu không phải matching)', () => {
  const allTargets = new Set<string>();
  const reviewable = new Set<string>();

  for (const q of questions) {
    if (q.type === 'matching') {
      q.pairs!.forEach((p) => allTargets.add(p.targetId));
      continue;
    }
    allTargets.add(q.targetId);
    reviewable.add(q.targetId);
  }

  const orphans = [...allTargets].filter((id) => !reviewable.has(id));
  assert.deepEqual(orphans, [], `mục tiêu không ôn được ở mode due: ${orphans.slice(0, 5).join(', ')}`);
});
