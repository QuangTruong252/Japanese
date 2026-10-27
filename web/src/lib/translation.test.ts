import test from 'node:test';
import assert from 'node:assert/strict';
import { TRANSLATION_SENTENCES } from './translation-data.ts';
import { availableTranslationSentences, isTranslationMatch, keywordChecks, normalizeVietnamese, selectTranslationItems, translationHint, translationSentence } from './translation.ts';

const bread = translationSentence('g-l06-o-transitivo-0')!; // パンを 食[た]べます。 / Tôi ăn bánh mì.
const santos = translationSentence('g-l01-ja-arimasen-0')!; // サントスさんは 学生[がくせい]じゃありません。 / Anh Santos không phải là sinh viên.
const lcg = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

test('selection stays inside the learned range, never repeats, and clamps to the pool', () => {
  for (const scope of [1, 6, 25]) {
    const pool = availableTranslationSentences(scope);
    assert.ok(pool.every((s) => s.minimumLesson <= scope));
    const items = selectTranslationItems(scope, 'jp-vi', 'all', lcg(scope));
    assert.equal(items.length, pool.length);
    assert.equal(new Set(items.map((i) => i.id)).size, items.length);
  }
  assert.equal(selectTranslationItems(6, 'jp-vi', 10, lcg(1)).length, 10);
  assert.equal(selectTranslationItems(1, 'vi-jp', 20, lcg(1)).length, 20);
  assert.equal(selectTranslationItems(1, 'jp-vi', 20_000, lcg(1)).length, availableTranslationSentences(1).length);
  assert.deepEqual(selectTranslationItems(0, 'jp-vi', 5), []);
  assert.deepEqual(selectTranslationItems(26, 'jp-vi', 5), []);
  assert.ok(selectTranslationItems(1, 'jp-vi', 10, lcg(1)).every((i) => translationSentence(i.id)!.minimumLesson === 1));
});

test('single direction keeps one direction; mixed splits about half and uses each source once', () => {
  assert.ok(selectTranslationItems(10, 'vi-jp', 10, lcg(3)).every((i) => i.direction === 'vi-jp'));
  const mixed = selectTranslationItems(10, 'mixed', 11, lcg(3));
  assert.equal(new Set(mixed.map((i) => i.id)).size, 11);
  const viJp = mixed.filter((i) => i.direction === 'vi-jp').length;
  assert.ok(viJp === 5 || viJp === 6);
  assert.notDeepEqual(selectTranslationItems(10, 'mixed', 10, lcg(3)).map((i) => i.id), selectTranslationItems(10, 'mixed', 10, lcg(4)).map((i) => i.id));
});

test('jp→vi grading ignores NFC form, case, edge punctuation and spacing but keeps tone marks', () => {
  const match = (text: string, sentence = bread) => isTranslationMatch(text, sentence, 'jp-vi');
  assert.ok(match('Tôi ăn bánh mì.'));
  assert.ok(match('tôi ăn bánh mì'));
  assert.ok(match('  TÔI   ĂN BÁNH MÌ!! '));
  assert.ok(match('Tôi ăn bánh mì.'.normalize('NFD')));
  assert.ok(match('"Tôi ăn bánh mì."'));
  assert.equal(match('Toi an banh mi'), false);
  assert.equal(match('Tôi ăn bánh mỳ'), false);
  assert.equal(match('Mình ăn bánh mì.'), false);
  assert.equal(match(''), false);
  assert.ok(match('Anh Santos không phải là sinh viên.', santos));
  assert.equal(match('Anh Santos phải là sinh viên.', santos), false);
  assert.equal(normalizeVietnamese('  Có. '), 'có');
});

test('vi→jp grading reuses dictation rules: kana for kanji matches, other sources do not', () => {
  const match = (text: string, sentence = bread) => isTranslationMatch(text, sentence, 'vi-jp');
  assert.ok(match('パンを 食べます。'));
  assert.ok(match('パンをたべます'));
  assert.equal(match('パンを のみます。'), false);
  assert.equal(match(santos.jp.replace(/\[[^\]]+\]/g, '')), false);
  assert.ok(match('サントスさんは がくせいじゃありません', santos));
  assert.equal(match('', santos), false);
});

test('key ideas: jp→vi matches case-insensitively on whole words, vi→jp accepts kana or source form', () => {
  assert.deepEqual(keywordChecks('Mình ăn bánh mì.', bread, 'jp-vi'), [{ text: 'bánh mì', hit: true }, { text: 'ăn', hit: true }]);
  assert.deepEqual(keywordChecks('Mình năn nỉ.', bread, 'jp-vi'), [{ text: 'bánh mì', hit: false }, { text: 'ăn', hit: false }]);
  assert.deepEqual(keywordChecks('ANH Santos đang học', santos, 'jp-vi'), [{ text: 'Anh', hit: true }, { text: 'sinh viên', hit: false }]);
  assert.deepEqual(keywordChecks('パンを のみます', bread, 'vi-jp'), [{ text: 'パン', hit: true }, { text: '食[た]べます', hit: false }]);
  assert.deepEqual(keywordChecks('パンを たべます', bread, 'vi-jp').map((k) => k.hit), [true, true]);
  assert.deepEqual(keywordChecks('パンを食べます', bread, 'vi-jp').map((k) => k.hit), [true, true]);
  assert.deepEqual(keywordChecks('', bread, 'vi-jp').map((k) => k.hit), [false, false]);
  // て chỉ là đuôi của あるいて, không phải "tay"; viết chữ Hán 手 thì vẫn ✓.
  const hand = translationSentence('v-l07-te')!;
  assert.deepEqual(keywordChecks('えきから あるいて かえります。', hand, 'vi-jp').map((k) => k.hit), hand.keywords.map(() => false));
  assert.equal(keywordChecks('手を あらいます。', hand, 'vi-jp')[0]!.hit, true);
});

test('key ideas skip keywords that lack the direction field; sentences without keywords have no hint', () => {
  const noVi = { ...bread, keywords: [{ ref: 'x', jp: 'パン' }, { ref: 'y', jp: '食[た]べます', vi: 'ăn' }] };
  assert.deepEqual(keywordChecks('ăn', noVi, 'jp-vi'), [{ text: 'ăn', hit: true }]);
  assert.equal(keywordChecks('パン', noVi, 'vi-jp').length, 2);
  assert.deepEqual(translationHint(noVi, 'jp-vi'), { vi: 'ăn' });
  assert.deepEqual(translationHint(noVi, 'vi-jp'), { jp: 'パン' });
  assert.deepEqual(translationHint(bread, 'vi-jp'), { jp: 'パン', vi: 'bánh mì' });
  assert.deepEqual(translationHint(bread, 'jp-vi'), { vi: 'bánh mì' });
  const none = TRANSLATION_SENTENCES.find((s) => !s.keywords.length)!;
  assert.equal(translationHint(none, 'jp-vi'), null);
  assert.equal(translationHint(none, 'vi-jp'), null);
  assert.deepEqual(keywordChecks('x', none, 'jp-vi'), []);
});
