import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadLesson,
  loadVocab,
  loadLessonData,
  loadLessons,
  loadVocabMap,
  loadLessonSummary,
  loadLessonSummaries,
  clearLessonCache,
  AVAILABLE_N5_LESSONS,
  parseLessonNumber,
} from './lessons.ts';

test('loadLesson nạp đúng bài học và có trạng thái verification unverified', async () => {
  clearLessonCache();
  const lesson1 = await loadLesson(1);
  assert.equal(lesson1.number, 1);
  assert.equal(lesson1.level, 'n5');
  assert.equal(lesson1.title.vi, 'Giới thiệu bản thân');
  assert.equal(lesson1.verification, 'unverified');
  assert.equal(lesson1.sourceRef, undefined);
  assert.ok(lesson1.grammar.length > 0);

  const lesson25 = await loadLesson(25);
  assert.equal(lesson25.number, 25);
  assert.equal(lesson25.verification, 'unverified');
});

test('loadVocab nạp đúng từ vựng và kiểu dữ liệu', async () => {
  const vocab1 = await loadVocab(1);
  assert.ok(vocab1.length > 0);
  const watashi = vocab1[0]!;
  assert.equal(watashi.word, '私[わたし]');
  assert.equal(watashi.kana, 'わたし');
  assert.equal(watashi.type, 'pronoun');
  assert.equal(watashi.meaning.vi, 'tôi');
});

test('loadLessonData nạp đồng thời bài học và từ vựng', async () => {
  const data = await loadLessonData(2);
  assert.equal(data.lesson.number, 2);
  assert.ok(data.vocab.length > 0);
  assert.equal(data.lesson.verification, 'unverified');
});

test('loadLessons và loadVocabMap nạp theo danh sách bài', async () => {
  const lessons = await loadLessons([1, 2]);
  assert.equal(lessons.length, 2);
  assert.equal(lessons[0]!.number, 1);
  assert.equal(lessons[1]!.number, 2);

  const vocabMap = await loadVocabMap([1, 2]);
  assert.equal(vocabMap.size, 2);
  assert.ok(vocabMap.get(1)!.length > 0);
  assert.ok(vocabMap.get(2)!.length > 0);
});

test('loadLessonSummary và loadLessonSummaries trả về đúng thông tin tóm tắt cho 25 bài', async () => {
  const summary1 = await loadLessonSummary(1);
  assert.equal(summary1.number, 1);
  assert.equal(summary1.title.vi, 'Giới thiệu bản thân');
  assert.equal(summary1.verification, 'unverified');
  assert.ok(summary1.vocabCount > 0);
  assert.ok(summary1.grammarCount > 0);

  const allSummaries = await loadLessonSummaries();
  assert.equal(allSummaries.length, 25);
  assert.deepEqual(
    allSummaries.map((s) => s.number),
    [...AVAILABLE_N5_LESSONS]
  );
  for (const s of allSummaries) {
    assert.equal(s.verification, 'unverified');
    assert.ok(s.vocabCount > 0);
    assert.ok(s.grammarCount > 0);
  }
});

test('loadLesson & loadVocab ném lỗi khi số bài không hợp lệ', async () => {
  await assert.rejects(() => loadLesson(0), /không tồn tại/);
  await assert.rejects(() => loadLesson(26), /không tồn tại/);
  await assert.rejects(() => loadVocab(99), /không tồn tại/);
});

test('bộ nhớ cache (memoize): gọi lần 2 trả về cùng kết quả mà không cần nạp lại', async () => {
  clearLessonCache();
  const p1 = loadLesson(3);
  const p2 = loadLesson(3);
  assert.equal(p1, p2);
  const [res1, res2] = await Promise.all([p1, p2]);
  assert.equal(res1, res2);

  clearLessonCache();
  const p3 = loadLesson(3);
  assert.notEqual(p1, p3);
});

test('parseLessonNumber nhận số bài hợp lệ', () => {
  assert.equal(parseLessonNumber('1'), 1);
  assert.equal(parseLessonNumber('25'), 25);
});

test('parseLessonNumber từ chối mọi tham số không phải số bài 1..25', () => {
  // SPEC-12 §7: `so` không phải số thì notFound(), KHÔNG crash
  for (const raw of ['tra-cuu', 'abc', '', ' ', '0', '26', '01', '1.5', '1e1', '-1', '+1', '١']) {
    assert.equal(parseLessonNumber(raw), null, `phải từ chối: "${raw}"`);
  }
});
