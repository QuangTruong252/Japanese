import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import kuromoji from 'kuromoji';
import type { IpadicFeatures, Tokenizer } from 'kuromoji';
import audit from '../data/n5/translation.json' with { type: 'json' };
import { TRANSLATION_SENTENCES } from './translation-data.ts';
import { loadLesson, loadVocab } from './lessons.ts';
import { containsKanji, stripFurigana, toKanaSentence } from './japanese.ts';

const dicPath = path.join(path.dirname(createRequire(import.meta.url).resolve('kuromoji/package.json')), 'dict');
const tokenizer = await new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
  kuromoji.builder({ dicPath }).build((error, built) => error ? reject(error) : resolve(built));
});
const fingerprint = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const compact = (text: string) => stripFurigana(text).replace(/[\s　]/gu, '');
const hira = (text: string) => text.replace(/[ァ-ヶ]/gu, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
const SKIPPED_POS = ['助詞', '助動詞', '記号', '接頭詞'];

const lessons = await Promise.all(Array.from({ length: 25 }, (_, i) => loadLesson(i + 1)));
const vocab = await Promise.all(Array.from({ length: 25 }, (_, i) => loadVocab(i + 1)));
// Chuỗi tra cứu mỗi bài: mọi cách viết và cách đọc của từ vựng, bỏ furigana, ghi chú tùy chọn và dấu 〜.
const haystackUpTo = (limit: number) => vocab.slice(0, limit).flat()
  .flatMap((word) => [word.word, word.kana])
  .map((text) => stripFurigana(text).replace(/\[[^\]]*\]/gu, '').replace(/[〜～…\s　]/gu, ''))
  .join('|');

test('id duy nhất, câu/nghĩa nguyên văn nguồn, snapshot đổi thì buộc duyệt lại', () => {
  assert.equal(new Set(audit.sentences.map((sentence) => sentence.id)).size, audit.sentences.length);
  assert.equal(TRANSLATION_SENTENCES.length, audit.sentences.length);
  for (const sentence of TRANSLATION_SENTENCES) {
    if (sentence.source.kind === 'grammar') {
      const { lesson, grammarId, exampleIndex } = sentence.source;
      assert.equal(sentence.id, `g-l${String(lesson).padStart(2, '0')}-${grammarId}-${exampleIndex}`);
      const grammar = lessons[lesson - 1].grammar.find((point) => point.id === grammarId);
      assert.ok(grammar, sentence.id);
      const example = grammar.examples[exampleIndex];
      assert.equal(sentence.jp, example.jp, `${sentence.id}: câu nguồn đổi, cần duyệt lại`);
      assert.equal(sentence.vi, example.translation.vi, `${sentence.id}: nghĩa nguồn đổi, cần duyệt lại`);
      assert.equal(sentence.snapshot, fingerprint({ jp: example.jp, vi: example.translation.vi, pattern: grammar.pattern, explanation: grammar.explanation }), `${sentence.id}: ngữ pháp đổi, cần duyệt lại`);
    } else {
      const { lesson, wordId } = sentence.source;
      assert.equal(sentence.id, `v-l${String(lesson).padStart(2, '0')}-${wordId}`);
      const word = vocab[lesson - 1].find((item) => item.id === wordId);
      assert.ok(word?.example, sentence.id);
      assert.equal(sentence.jp, word.example.jp, `${sentence.id}: câu nguồn đổi, cần duyệt lại`);
      assert.equal(sentence.vi, word.example.translation.vi, `${sentence.id}: nghĩa nguồn đổi, cần duyệt lại`);
      assert.equal(sentence.snapshot, fingerprint({ jp: word.example.jp, vi: word.example.translation.vi }), `${sentence.id}: ví dụ đổi, cần duyệt lại`);
    }
    assert.ok(!containsKanji(toKanaSentence(sentence.jp)), `${sentence.id}: thiếu cách đọc`);
    assert.doesNotMatch(toKanaSentence(sentence.jp), /[[\]]/u, `${sentence.id}: ngoặc tùy chọn chưa xử lý`);
  }
});

test('không trùng câu sau chuẩn hóa; ví dụ từ vựng không lặp ví dụ ngữ pháp nào', () => {
  const keys = TRANSLATION_SENTENCES.map((sentence) => compact(sentence.jp));
  assert.equal(new Set(keys).size, keys.length);
  const grammarKeys = new Set(lessons.flatMap((lesson) => lesson.grammar.flatMap((point) => point.examples.map((example) => compact(example.jp)))));
  for (const sentence of TRANSLATION_SENTENCES) {
    if (sentence.source.kind === 'vocab') assert.ok(!grammarKeys.has(compact(sentence.jp)), `${sentence.id}: trùng ví dụ ngữ pháp`);
  }
  assert.equal(TRANSLATION_SENTENCES.filter((sentence) => sentence.source.kind === 'grammar').length, 165);
  assert.equal(TRANSLATION_SENTENCES.filter((sentence) => sentence.source.kind === 'vocab').length, 887);
});

test('từ khóa nằm trong câu, nghĩa Việt là chuỗi con nguyên văn, ref trỏ đúng từ đã học tới mốc', () => {
  for (const sentence of TRANSLATION_SENTENCES) {
    assert.ok(sentence.keywords.length <= 4, sentence.id);
    let cursor = 0;
    for (const keyword of sentence.keywords) {
      const at = sentence.jp.indexOf(keyword.jp, cursor);
      assert.ok(at >= 0, `${sentence.id}: "${keyword.jp}" không có trong câu hoặc không theo thứ tự`);
      cursor = at + 1;
      if (keyword.vi !== undefined) assert.ok(sentence.vi.includes(keyword.vi), `${sentence.id}: "${keyword.vi}" không có trong nghĩa Việt`);
      const [lesson, id] = keyword.ref.split(':');
      const word = vocab[Number(lesson) - 1]?.find((item) => item.id === id);
      assert.ok(word, `${sentence.id}: ref ${keyword.ref} không có trong vocab`);
      assert.ok(Number(lesson) <= sentence.minimumLesson, `${sentence.id}: ${keyword.ref} học sau mốc câu`);
    }
  }
});

test('thán từ あれ không bị gắn với động từ ある', () => {
  const sentence = TRANSLATION_SENTENCES.find((item) => item.id === 'v-l14-are-sorpresa')!;
  assert.ok(sentence.keywords.every((keyword) => keyword.ref !== '10:arimasu'));
});

test('kiểm lại từng token nội dung bằng kuromoji: thuộc từ đã học tới mốc, cùng thể động từ', () => {
  // Ngoại lệ có lý do, cùng bộ với bản sinh: tên riêng đã duyệt tay, các danh từ chức năng do mẫu ngữ pháp dạy
  // (の bài 2, こと bài 18, とき bài 23), ない là phủ định của ある (bài 17).
  const grammarNouns: Record<string, number> = { の: 2, こと: 18, とき: 23 };
  const names = new Set<string>(audit.properNames);
  for (const sentence of TRANSLATION_SENTENCES) {
    const haystack = haystackUpTo(sentence.minimumLesson);
    const tokens = tokenizer.tokenize(compact(sentence.jp));
    tokens.forEach((token, i) => {
      // Token nằm trong cụm từ vựng đã chọn làm từ khóa (な trong ひらがな) không phải ngữ pháp.
      const inKeyword = sentence.keywords.some((keyword) => compact(keyword.jp).length > token.surface_form.length && compact(keyword.jp).includes(token.surface_form));
      if (SKIPPED_POS.includes(token.pos) || (token.pos === '動詞' && token.pos_detail_1 === '非自立')) return;
      if (token.pos === '名詞' && token.pos_detail_1 === '数') return;
      if (names.has(token.surface_form)) return;
      if (token.pos === '名詞' && grammarNouns[token.surface_form] && !inKeyword) {
        assert.ok(sentence.minimumLesson >= grammarNouns[token.surface_form], `${sentence.id}: ${token.surface_form} cần bài ${grammarNouns[token.surface_form]}`);
        return;
      }
      if (token.pos === '形容詞' && token.basic_form === 'ない' && !inKeyword) { assert.ok(sentence.minimumLesson >= 17, sentence.id); return; }
      if (token.basic_form === 'ある' && tokens[i - 1]?.surface_form === 'じゃ') return;
      // Câu viết chữ Hán còn vocab dạy bằng kana (今日/きょう): so cả cách đọc; hợp từ/cụm có token con không đứng riêng trong vocab.
      const candidates = [token.surface_form, token.basic_form, hira(token.reading ?? '')].filter((text) => text && text !== '*');
      assert.ok(candidates.some((text) => haystack.includes(text)), `${sentence.id}: ${token.surface_form} (${token.basic_form}) thiếu từ vựng đã học tới bài ${sentence.minimumLesson}`);
      if (token.pos !== '動詞') return;
      const next = tokens[i + 1];
      const formLesson = next?.basic_form === 'ます' ? 4
        : next?.conjugated_type === '特殊・タイ' ? 13
        : next?.surface_form === 'て' || next?.surface_form === 'で' ? 14
        : next?.conjugated_type === '特殊・ナイ' ? 17
        : next?.conjugated_type === '特殊・タ' ? 19
        : token.conjugated_form === '基本形' ? 18 : 1;
      assert.ok(sentence.minimumLesson >= formLesson, `${sentence.id}: thể của ${token.surface_form} cần bài ${formLesson}`);
    });
    const vocabLessons = sentence.keywords.map((keyword) => Number(keyword.ref.split(':')[0]));
    assert.ok(sentence.minimumLesson >= Math.max(sentence.source.lesson, ...vocabLessons), sentence.id);
  }
});

test('dữ liệu đã commit khớp bản sinh lại từ nguồn (đổi vocab/ngữ pháp thì chạy lại scripts/build-translation.mjs)', async () => {
  const scriptUrl = pathToFileURL(path.resolve(import.meta.dirname, '../../../scripts/build-translation.mjs')).href;
  const { buildTranslation } = await import(scriptUrl) as { buildTranslation: () => { output: typeof audit } };
  assert.deepEqual(JSON.parse(JSON.stringify(buildTranslation().output)), JSON.parse(JSON.stringify(audit)));
});

test('số câu theo mốc bài', () => {
  const counts = [1, 5, 10, 15, 25].map((scope) => TRANSLATION_SENTENCES.filter((sentence) => sentence.minimumLesson <= scope).length);
  console.log('translation: số câu theo mốc 1/5/10/15/25 =', counts.join(' / '));
  assert.deepEqual(counts, [31, 241, 499, 729, 1052]);
  assert.ok(TRANSLATION_SENTENCES.every((sentence) => sentence.minimumLesson >= 1 && sentence.minimumLesson <= 25));
});
