import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAllKanji,
  getKanjiByChar,
  getAllVerbs,
  getAllReferenceDocs,
  getReferenceDocBySlug,
  isExampleVerified,
  buildKanjiVocabIndex,
  filterKanji,
  filterVerbs,
  getKanjiVocabIndex,
  getKanjiLesson,
} from './lookup.ts';

test('getAllKanji trả về đủ 169 chữ Kanji N5', () => {
  const kanjiList = getAllKanji();
  assert.equal(kanjiList.length, 169);
  
  for (const k of kanjiList) {
    assert.ok(k.character, 'Phải có character');
    assert.ok(k.strokes > 0, `Strokes > 0: ${k.character}`);
    assert.ok(Array.isArray(k.meanings.vi), `meanings.vi là mảng: ${k.character}`);
    const lesson = getKanjiLesson(k);
    if (lesson !== undefined) {
      assert.ok(lesson >= 1 && lesson <= 25, `Lesson trong khoảng 1-25: ${k.character}`);
    }
  }
});

test('getKanjiByChar tìm đúng chữ Hán hoặc trả về undefined', () => {
  const hito = getKanjiByChar('人');
  assert.ok(hito);
  assert.equal(hito.character, '人');
  assert.equal(hito.lesson, 1);
  assert.equal(hito.strokes, 2);
  assert.deepEqual(hito.meanings.vi, ['người']);
  assert.ok(hito.onyomi.includes('ジン'));
  assert.ok(hito.kunyomi.includes('ひと'));

  const notFound = getKanjiByChar('🚀');
  assert.equal(notFound, undefined);
});

test('getAllVerbs trả về đủ 156 động từ với đầy đủ thể', () => {
  const verbs = getAllVerbs();
  assert.equal(verbs.length, 156);

  const au = verbs.find((v) => v.dictionary === 'あう');
  assert.ok(au);
  assert.equal(au.group, 1);
  assert.equal(au.masu, 'あいます');
  assert.equal(au.te, 'あって');
  assert.equal(au.ta, 'あった');
  assert.equal(au.nai, 'あわない');
  assert.equal(au.meaning.vi, 'gặp [bạn bè]');
});

test('getAllReferenceDocs & getReferenceDocBySlug trả về đủ 10 bảng tham chiếu', () => {
  const docs = getAllReferenceDocs();
  assert.equal(docs.length, 10);

  const demonstratives = getReferenceDocBySlug('demonstratives');
  assert.ok(demonstratives);
  assert.equal(demonstratives.title.vi, 'Đại từ chỉ thị');

  // Kiểm tra bảo toàn 8 ô header rỗng có chủ đích (SPEC-12 §3.5)
  const firstTable = demonstratives.sections[0]?.tables[0];
  assert.ok(firstTable);
  const emptyHeader = firstTable.headers[0];
  assert.equal(emptyHeader?.vi, '');

  assert.equal(getReferenceDocBySlug('non-existent'), undefined);
});

test('isExampleVerified phát hiện chính xác các ví dụ chưa dịch (vi === en)', () => {
  assert.equal(
    isExampleVerified({ word: '日本人[にほんじん]', meaning: { en: 'Japanese (person)', vi: 'Japanese (person)' } }),
    false,
    'Trùng vi và en phải đánh dấu chưa xác minh'
  );

  assert.equal(
    isExampleVerified({ word: '人[ひと]', meaning: { en: 'person', vi: 'người' } }),
    true,
    'Khác vi và en là đã xác minh'
  );

  assert.equal(
    isExampleVerified({ word: '三人[さんにん]', meaning: { en: 'three people', vi: 'ba người' } }),
    true
  );
});

test('buildKanjiVocabIndex trích xuất đúng từ vựng chứa chữ Hán theo bài', () => {
  const mockVocab = [
    {
      lesson: 1,
      words: [
        { id: 'watashi', word: '私[わたし]', kana: 'わたし', meaning: { vi: 'tôi', en: 'I' } },
        { id: 'ano-hito', word: 'あの 人[ひと]', kana: 'あのかた', meaning: { vi: 'người kia', en: 'that person' } },
      ],
    },
    {
      lesson: 2,
      words: [
        { id: 'hon', word: '本[ほん]', kana: 'ほん', meaning: { vi: 'sách', en: 'book' } },
        { id: 'nihonjin', word: '日本人[にほんじん]', kana: 'にほんじん', meaning: { vi: 'người Nhật', en: 'Japanese' } },
      ],
    },
  ];

  const index = buildKanjiVocabIndex(mockVocab);
  const hitoWords = index.get('人') ?? [];
  assert.equal(hitoWords.length, 2);
  assert.ok(hitoWords.some((w) => w.id === 'ano-hito' && w.targetId === 'vocab-01-02' && w.lesson === 1));
  assert.ok(hitoWords.some((w) => w.id === 'nihonjin' && w.targetId === 'vocab-02-02' && w.lesson === 2));

  const honWords = index.get('本') ?? [];
  assert.ok(honWords.some((w) => w.id === 'hon'));
  assert.ok(honWords.some((w) => w.id === 'nihonjin'));
});

test('getKanjiVocabIndex trên 25 bài thật trích xuất đúng từ chứa chữ 人', () => {
  const index = getKanjiVocabIndex();
  const hitoWords = index.get('人') ?? [];
  assert.ok(hitoWords.length > 0);
  assert.ok(hitoWords.some((w) => w.word.includes('人')));
});

test('filterKanji lọc theo bài, số nét và trạng thái đã học', () => {
  const all = getAllKanji();

  const lesson1 = filterKanji(all, { lesson: 1 });
  assert.ok(lesson1.length > 0);
  assert.ok(lesson1.every((k) => getKanjiLesson(k) === 1));

  const strokes2 = filterKanji(all, { strokes: 2 });
  assert.ok(strokes2.length > 0);
  assert.ok(strokes2.every((k) => k.strokes === 2));

  const learnedSet = new Set(['人', '日']);
  const learnedOnly = filterKanji(all, { onlyLearned: true }, learnedSet);
  assert.equal(learnedOnly.length, 2);
  assert.ok(learnedOnly.every((k) => learnedSet.has(k.character)));
});

test('filterVerbs lọc theo nhóm, bài và tìm kiếm q', () => {
  const all = getAllVerbs();

  const g2 = filterVerbs(all, { group: 2 });
  assert.ok(g2.length > 0);
  assert.ok(g2.every((v) => v.group === 2));

  const l18 = filterVerbs(all, { lesson: 18 });
  assert.ok(l18.length > 0);
  assert.ok(l18.every((v) => v.lesson === 18));

  // Tìm kiếm theo từ điển
  const byDict = filterVerbs(all, { query: 'あう' });
  assert.ok(byDict.some((v) => v.dictionary === 'あう'));

  // Tìm kiếm theo masu
  const byMasu = filterVerbs(all, { query: 'あいます' });
  assert.ok(byMasu.some((v) => v.masu === 'あいます'));

  // Tìm kiếm theo nghĩa tiếng Việt
  const byMeaning = filterVerbs(all, { query: 'rửa' });
  assert.ok(byMeaning.some((v) => v.meaning.vi.includes('rửa')));
});

test('mọi ví dụ Kanji đều đã có nghĩa tiếng Việt', () => {
  const untranslated = getAllKanji().flatMap((kanji) =>
    kanji.examples.filter((ex) => !isExampleVerified(ex)).map((ex) => `${kanji.character} ${ex.word}`)
  );
  assert.deepEqual(untranslated, []);
});
