import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  containsKanji,
  normalizeJapaneseInput,
  parseFurigana,
  stripFurigana,
  toKanaSentence,
} from './japanese.ts';

test('parseFurigana tách kanji + ruby và giữ nguyên phần thuần', () => {
  assert.deepEqual(parseFurigana('私[わたし]は 学生[がくせい]です'), [
    { base: '私', ruby: 'わたし' },
    { base: 'は ' },
    { base: '学生', ruby: 'がくせい' },
    { base: 'です' },
  ]);
  assert.deepEqual(parseFurigana('ひらがなのみ'), [{ base: 'ひらがなのみ' }]);
  assert.deepEqual(parseFurigana(''), []);
});

test('stripFurigana bỏ ruby, giữ kanji', () => {
  assert.equal(stripFurigana('食[た]べます'), '食べます');
  assert.equal(stripFurigana('何[なに]も 食[た]べません'), '何も 食べません');
});

test('normalizeJapaneseInput: romaji + full-width space + trim', () => {
  assert.equal(normalizeJapaneseInput('  watashi  '), 'わたし');
  assert.equal(normalizeJapaneseInput('わたし　は'), 'わたしは');
  assert.equal(normalizeJapaneseInput('カタカナ'), 'かたかな');
  assert.equal(normalizeJapaneseInput(''), '');
});

test('toKanaSentence: chuyển notation furigana thành kana thuần', () => {
  assert.equal(
    toKanaSentence('私[わたし]は 会社員[かいしゃいん]です。'),
    'わたしは かいしゃいんです。'
  );
  // Câu không có kanji giữ nguyên
  assert.equal(toKanaSentence('これは ほんです。'), 'これは ほんです。');
});

test('listening: chuỗi người học gõ khớp đáp án kana, KHÔNG khớp dạng kanji', () => {
  const jp = '私[わたし]は 会社員[かいしゃいん]です。';
  const typed = normalizeJapaneseInput('わたしはかいしゃいんです');

  assert.equal(normalizeJapaneseInput(toKanaSentence(jp)), typed);
  // Hồi quy: đáp án dạng kanji (bản cài cũ) luôn chấm sai câu trả lời đúng
  assert.notEqual(normalizeJapaneseInput(stripFurigana(jp)), typed);
});

test('containsKanji: phát hiện câu còn thiếu cách đọc', () => {
  assert.equal(containsKanji('わたしはがくせいです'), false);
  assert.equal(containsKanji('わたしは学生です'), true);
});

test('normalizeJapaneseInput: bỏ dấu câu ở cả hai vế', () => {
  assert.equal(normalizeJapaneseInput('わたしは、がくせいです。'), 'わたしはがくせいです');
  assert.equal(normalizeJapaneseInput('「はい」'), 'はい');
  // Không nới lỏng sai kana
  assert.notEqual(normalizeJapaneseInput('がくせい'), normalizeJapaneseInput('がくせえ'));
});
