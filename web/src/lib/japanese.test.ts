import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFurigana, stripFurigana, normalizeJapaneseInput } from './japanese.ts';

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
