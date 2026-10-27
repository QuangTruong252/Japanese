import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import kuromoji from 'kuromoji';
import type { IpadicFeatures, Tokenizer } from 'kuromoji';
import audit from '../data/n5/dictation.json' with { type: 'json' };
import { DICTATION_SENTENCES, isDictationAnswer, localDay, selectDailyDictation } from './dictation.ts';
import { loadLesson, loadVocab } from './lessons.ts';
import { containsKanji, parseFurigana, stripFurigana, toKanaSentence } from './japanese.ts';

const dicPath = path.join(path.dirname(createRequire(import.meta.url).resolve('kuromoji/package.json')), 'dict');
const tokenizer = await new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
  kuromoji.builder({ dicPath }).build((error, built) => error ? reject(error) : resolve(built));
});
const fingerprint = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const compact = (text: string) => stripFurigana(text).replace(/[\s　]/gu, '');
const lexicalTokens = (text: string) => tokenizer.tokenize(text)
  .filter((token) => !['助詞', '助動詞', '記号', '接頭詞'].includes(token.pos));

test('tập câu đã duyệt khớp chính xác ví dụ và mẫu ngữ pháp nguồn; thay đổi buộc rà lại', async () => {
  assert.equal(new Set(audit.sentences.map((sentence) => sentence.id)).size, audit.sentences.length);
  for (const sentence of audit.sentences) {
    const lesson = await loadLesson(sentence.lesson);
    const grammar = lesson.grammar.find((point) => point.id === sentence.grammarId);
    assert.ok(grammar, sentence.id);
    const example = grammar.examples[sentence.exampleIndex];
    assert.equal(sentence.jp, example.jp, `${sentence.id}: câu nguồn đổi, cần duyệt lại`);
    assert.equal(sentence.vi, example.translation.vi, `${sentence.id}: nghĩa nguồn đổi, cần duyệt lại`);
    assert.equal(sentence.grammarSnapshot, fingerprint({ pattern: grammar.pattern, explanation: grammar.explanation }), `${sentence.id}: ngữ pháp đổi, cần duyệt lại`);
    assert.ok(!containsKanji(toKanaSentence(sentence.jp)), `${sentence.id}: thiếu cách đọc`);
    assert.doesNotMatch(toKanaSentence(sentence.jp), /[\[\]0-9０-９A-Za-z]/u, `${sentence.id}: notation hoặc số chưa kiểm đọc`);
  }
  assert.equal(DICTATION_SENTENCES.length, audit.sentences.length);
});

test('từ vựng có bằng chứng đúng bản nguồn, dùng lần xuất hiện sớm nhất thay vì bài lặp sau', async () => {
  const allWords = (await Promise.all(Array.from({ length: 25 }, async (_, i) =>
    (await loadVocab(i + 1)).map((word) => ({ ...word, lesson: i + 1 })),
  ))).flat();
  for (const [key, reference] of Object.entries(audit.vocabulary)) {
    const word = (await loadVocab(reference.lesson)).find((item) => item.id === reference.id);
    assert.ok(word, key);
    assert.deepEqual({ word: word.word, kana: word.kana, verbForms: word.verbForms ?? null }, {
      word: reference.word, kana: reference.kana, verbForms: 'verbForms' in reference ? reference.verbForms : null,
    }, `${key}: từ hoặc thể nguồn đổi, cần rà lại`);
    const earliest = Math.min(...allWords.filter((item) => item.word === word.word && item.kana === word.kana).map((item) => item.lesson));
    assert.equal(reference.lesson, earliest, `${key}: phải lấy lần xuất hiện sớm nhất`);
  }
  // ある xuất hiện ở cả bài 9 và 10; câu tồn tại bài 10 vẫn tham chiếu từ bài 9.
  const repeated = audit.sentences.find((sentence) => sentence.id === 'l10-arimasu-imasu-0')!;
  assert.ok(repeated.vocabulary.includes('9:arimasu'));
  assert.ok(!repeated.vocabulary.includes('10:arimasu'));
});

test('kiểm lại từng token nội dung theo danh sách từ đã duyệt của câu, cùng thể động từ', () => {
  const vocabulary = audit.vocabulary as Record<string, { word: string; kana: string }>;
  // Hai danh từ chức năng thuộc chính mẫu ngữ pháp, không phải từ nội dung được miễn tùy ý.
  const grammarNouns: Record<string, string[]> = { 'l18-dekimasu-1': ['こと'], 'l23-toki-0': ['とき'] };
  for (const sentence of audit.sentences) {
    const basics = new Set(sentence.vocabulary.flatMap((reference) => {
      const word = vocabulary[reference];
      assert.ok(word, `${sentence.id}: thiếu bằng chứng ${reference}`);
      return lexicalTokens(compact(word.word).replace(/\[[^\]]*\]/gu, '')).map((token) => token.basic_form);
    }));
    for (const noun of grammarNouns[sentence.id] ?? []) basics.add(noun);
    const tokens = tokenizer.tokenize(compact(sentence.jp));
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (['助詞', '助動詞', '記号', '接頭詞'].includes(token.pos) || (token.pos === '動詞' && token.pos_detail_1 === '非自立')) continue;
      // じゃありません là phủ định của です, đã học từ bài 1.
      if (token.basic_form === 'ある' && tokens[i - 1]?.surface_form === 'じゃ') continue;
      assert.ok(basics.has(token.basic_form), `${sentence.id}: ${token.surface_form} (${token.basic_form}) thiếu từ vựng đã duyệt`);
      if (token.pos !== '動詞') continue;
      const next = tokens[i + 1];
      const minimumFormLesson = next?.basic_form === 'ます' ? 4
        : next?.conjugated_type === '特殊・タイ' ? 13
        : next?.surface_form === 'て' || next?.surface_form === 'で' ? 14
        : next?.conjugated_type === '特殊・ナイ' ? 17
        : next?.conjugated_type === '特殊・タ' ? 19
        : token.conjugated_form === '基本形' ? 18 : 1;
      assert.ok(sentence.minimumLesson >= minimumFormLesson, `${sentence.id}: thể của ${token.surface_form} cần bài ${minimumFormLesson}`);
    }
    assert.equal(sentence.minimumLesson, Math.max(sentence.lesson, ...sentence.vocabulary.map((reference) => Number(reference.split(':')[0]))));
  }
});

test('chọn ổn định theo ngày/phạm vi, đủ đa dạng bài và không lặp khi bể nhỏ', () => {
  for (const scope of [1, 5, 10, 25]) {
    const first = selectDailyDictation('2026-10-27', scope);
    assert.deepEqual(first, selectDailyDictation('2026-10-27', scope));
    assert.equal(first.length, scope === 1 ? 2 : 5);
    assert.equal(new Set(first.map((sentence) => sentence.id)).size, first.length);
    assert.ok(first.every((sentence) => sentence.minimumLesson <= scope));
    if (scope >= 5) assert.equal(new Set(first.map((sentence) => sentence.lesson)).size, 5);
  }
  assert.notDeepEqual(selectDailyDictation('2026-10-27', 10), selectDailyDictation('2026-10-28', 10));
  assert.notDeepEqual(selectDailyDictation('2026-10-27', 10), selectDailyDictation('2026-10-27', 25));
  assert.deepEqual([1, 5, 10, 25].map((scope) => DICTATION_SENTENCES.filter((sentence) => sentence.minimumLesson <= scope).length), [2, 13, 26, 44]);
});

test('mốc biên, dữ liệu chưa duyệt và thiếu cách đọc không lọt vào bộ câu', () => {
  const pool = new Set(DICTATION_SENTENCES.map((sentence) => sentence.id));
  // Tên riêng chưa duyệt và ngoặc tùy chọn không được tự suy cách đọc hoặc miễn phạm vi.
  assert.ok(!pool.has('l01-wa-desu-0'));
  assert.ok(!pool.has('l05-doko-mo-0'));
  assert.ok(!pool.has('l10-wa-ni-arimasu-0'));
  for (let scope = 1; scope <= 25; scope++) {
    const selected = selectDailyDictation('2026-10-27', scope);
    assert.ok(selected.every((sentence) => sentence.lesson <= scope && sentence.minimumLesson <= scope));
  }
  for (const scope of [0, 26, 1.5, NaN, Infinity]) assert.deepEqual(selectDailyDictation('2026-10-27', scope), []);
  for (const day of ['', '2026-02-30', '27/10/2026']) assert.deepEqual(selectDailyDictation(day, 10), []);
  assert.equal(localDay(new Date(2026, 9, 27, 0, 1)), '2026-10-27');
  assert.equal(localDay(new Date(2026, 9, 26, 23, 59)), '2026-10-26');
});

test('chấm kana và chữ Nhật; bỏ dấu cách/dấu câu nhưng không bỏ lỗi trợ từ', () => {
  const sentence = DICTATION_SENTENCES.find((item) => item.id === 'l06-o-transitivo-0')!;
  assert.equal(isDictationAnswer(sentence.kana, sentence), true);
  assert.equal(isDictationAnswer(stripFurigana(sentence.jp), sentence), true);
  assert.equal(isDictationAnswer(sentence.kana.replace(/[\s。]/gu, ''), sentence), true);
  assert.equal(isDictationAnswer(sentence.kana.replace('を', 'に'), sentence), false);
  assert.equal(isDictationAnswer('', sentence), false);
  assert.equal(isDictationAnswer(sentence.kana.replace('ます', 'ません'), sentence), false);
});

test('IME được trộn kanji/kana giữa các cụm có cách đọc đã duyệt', () => {
  const sentence = DICTATION_SENTENCES.find((item) => item.id === 'l01-wa-desu-1')!;
  const segments = parseFurigana(sentence.jp);
  assert.equal(segments.filter((segment) => segment.ruby).length, 2);
  const first = segments.findIndex((segment) => segment.ruby);
  const mixed = segments.map((segment, i) => i === first ? segment.ruby : segment.base).join('');
  const inverse = segments.map((segment, i) => i === first ? segment.base : segment.ruby ?? segment.base).join('');
  assert.notEqual(mixed, sentence.kana);
  assert.notEqual(mixed, stripFurigana(sentence.jp));
  for (const answer of [sentence.kana, stripFurigana(sentence.jp), mixed, inverse]) {
    assert.equal(isDictationAnswer(answer, sentence), true);
  }
  assert.equal(isDictationAnswer(mixed.replace('は', 'も'), sentence), false);
  assert.equal(isDictationAnswer(`${mixed}${mixed}`, sentence), false);
  assert.equal(isDictationAnswer(segments.slice(1).map((segment) => segment.base).join(''), sentence), false);
});
