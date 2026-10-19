import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import kuromoji from 'kuromoji';
import type { IpadicFeatures, Tokenizer } from 'kuromoji';
import { stripFurigana, toKanaSentence } from './japanese.ts';
import { AVAILABLE_N5_LESSONS, loadLesson, loadVocab } from './lessons.ts';
import type { VocabWord } from '../types/index.ts';

// kuromoji chỉ được import ở đây (devDependency): app không import nên không vào bundle.
const dicPath = path.join(path.dirname(createRequire(import.meta.url).resolve('kuromoji/package.json')), 'dict');
const tokenizer = await new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
  kuromoji.builder({ dicPath }).build((err, built) => (err ? reject(err) : resolve(built)));
});

/** Từ ngoài từ vựng được phép dùng trong hội thoại; `from` là bài đầu tiên được dùng. */
const ALLOWED: { token: string; from: number; reason: string }[] = [
  { token: 'ベトナム', from: 1, reason: 'Quê của マイ, nhân vật chính; từ vựng chỉ có các nước trong sách.' },
  {
    token: 'の',
    from: 2,
    reason: 'の thay danh từ (私のです, マイさんのですか) là ngữ pháp bài 2; kuromoji gắn nhãn danh từ phi tự lập nên không rơi vào nhóm trợ từ được miễn.',
  },
  {
    token: '甲子園',
    from: 5,
    reason: 'Ga đích trong câu tựa của bài 5 (この電車は甲子園へ行きますか); từ vựng không liệt kê địa danh này.',
  },
];

/** Câu giao tiếp của bài không có trong hội thoại nào của bài đó, kèm lý do. */
const UNUSED_EXPRESSIONS: Record<number, Record<string, string>> = {
  1: { chan: 'Ba tình huống bài 1 đều giữa người lớn; 〜ちゃん dùng cho trẻ em sẽ gượng.' },
};

const KANJI = /[一-鿿㐀-䶿々〆〇ヶ]/u;
const IGNORED_IN_READING = /[「」『』\s　]/gu;

/**
 * Các cách viết của một từ để tìm trong câu thoại: tách theo 〜 và cách viết thay thế
 * (`こちらは〜さんです` → こちらは, さんです; `トイレ（お手洗い）` → トイレ, お手洗い), ngoặc tùy chọn
 * lấy cả hai bản (`[どうも]ありがとう` → ありがとう, どうもありがとう), có và không có dấu câu.
 */
function wordParts(word: VocabWord): string[] {
  const forms = [word.word, word.kana];
  if (word.verbForms) {
    const f = word.verbForms;
    forms.push(f.dictionary, f.dictionaryKana, f.masu, f.masuKana);
  }
  return forms
    .flatMap((form) => {
      const plain = stripFurigana(form);
      return [plain.replace(/\[[^\]]*\]/gu, ''), plain.replace(/[[\]]/gu, '')];
    })
    .flatMap((variant) => {
      const compact = variant.replace(/[「」『』\s　]/gu, '');
      return [compact, compact.replace(/[。、？！?!…]/gu, '')];
    })
    .flatMap((variant) => variant.split(/[（）()／・〜～]/u))
    .filter(Boolean);
}

interface Scope {
  /** Cách viết được tìm theo vùng trong câu */
  parts: string[];
  /** Dạng gốc (basic_form của kuromoji) được chấp nhận cho token đã chia */
  basics: Set<string>;
}

function buildScope(words: VocabWord[], extra: string[] = []): Scope {
  const parts = new Set(extra);
  const basics = new Set(extra);
  for (const word of words) {
    for (const part of wordParts(word)) {
      parts.add(part);
      basics.add(part);
    }
    // kuromoji tách động từ する ghép (勉強する) thành danh từ 勉強 + động từ する.
    const dictionary = word.verbForms && stripFurigana(word.verbForms.dictionary);
    if (dictionary && dictionary.length > 2 && dictionary.endsWith('する')) {
      basics.add(dictionary.slice(0, -2));
      basics.add('する');
    }
  }
  return { parts: [...parts], basics };
}

async function wordsUpTo(lesson: number): Promise<VocabWord[]> {
  const words: VocabWord[] = [];
  for (let n = 1; n <= lesson; n++) words.push(...(await loadVocab(n)));
  return words;
}

interface Placed {
  token: IpadicFeatures;
  start: number;
  end: number;
}

function place(text: string): Placed[] {
  let pos = 0;
  const placed = tokenizer.tokenize(text).map((token) => {
    const start = pos;
    pos += token.surface_form.length;
    return { token, start, end: pos };
  });
  assert.equal(pos, text.length, `kuromoji không phủ hết câu: ${text}`);
  return placed;
}

function spans(text: string, parts: string[]): [number, number][] {
  const found: [number, number][] = [];
  for (const part of parts) {
    for (let i = text.indexOf(part); i !== -1; i = text.indexOf(part, i + 1)) found.push([i, i + part.length]);
  }
  return found;
}

// Trợ từ, trợ động từ, ký hiệu, tiền tố お/ご và số không phải từ vựng riêng.
const FREE_POS = new Set(['助詞', '助動詞', '記号', '接頭詞']);

/**
 * Token nội dung có ký tự nằm ngoài mọi từ vựng xuất hiện trong câu, và dạng gốc cũng ngoài phạm vi.
 * So theo ký tự vì kuromoji có khi gộp hai từ đã học thành một token (中国人 = 中国 + 〜人).
 */
function outOfScope(text: string, scope: Scope): string[] {
  const covered = Array<boolean>(text.length).fill(false);
  for (const [s, e] of spans(text, scope.parts)) covered.fill(true, s, e);
  return place(text)
    .filter(({ token, start, end }) => {
      if (FREE_POS.has(token.pos) || token.pos_detail_1 === '数') return false;
      if (covered.slice(start, end).every(Boolean)) return false;
      return !scope.basics.has(token.basic_form);
    })
    .map(({ token }) => token.surface_form);
}

/** Bài đầu tiên học mỗi thể; dùng sớm hơn là vượt chương trình. */
const FORM_LESSON = { masu: 4, te: 14, nai: 17, dictionary: 18, ta: 19, plain: 20 } as const;
type VerbForm = keyof typeof FORM_LESSON;

/**
 * Thể động từ trong câu. Token nằm trong một cụm từ vựng dài hơn nó (いらっしゃいませ, 見せてください,
 * 〜から来ました) thuộc cụm học thuộc nên không tính.
 */
function verbForms(text: string, parts: string[]): { form: VerbForm; surface: string }[] {
  const found = spans(text, parts);
  const placed = place(text);
  const forms: { form: VerbForm; surface: string }[] = [];
  placed.forEach(({ token, start, end }, i) => {
    if (found.some(([s, e]) => s <= start && end <= e && e - s > end - start)) return;
    // じゃありません / ではありません là phủ định của です (bài 1), không phải động từ ある. kuromoji tách あり
    // thành động từ ある, có khi còn gắn じゃ là 接続詞 (私のじゃありません), nên bỏ ある đứng sau じゃ hoặc で + は.
    const prev = placed[i - 1]?.token.surface_form;
    if (token.basic_form === 'ある' && (prev === 'じゃ' || (prev === 'は' && placed[i - 2]?.token.surface_form === 'で'))) return;
    const next = placed[i + 1]?.token;
    let form: VerbForm | null = null;
    // だ chỉ tính là thể thường khi đứng cuối câu (だ, だった); な (体言接続) nối tính từ な với danh từ
    // và で (連用形) nối câu là kiến thức bài 8, không phải thể thường của bài 20.
    if (token.pos === '助動詞' && token.conjugated_type === '特殊・ダ') {
      if (token.conjugated_form === '基本形' || token.conjugated_form === '連用タ接続') form = 'plain';
    } else if (token.pos === '形容詞' && token.basic_form === 'ない') form = 'plain';
    else if (token.pos === '動詞' && token.pos_detail_1 === '自立') {
      if (next?.pos === '助動詞' && next.basic_form === 'ます') form = 'masu';
      else if (next?.pos_detail_1 === '接続助詞' && (next.surface_form === 'て' || next.surface_form === 'で')) form = 'te';
      else if (next?.conjugated_type === '特殊・ナイ') form = 'nai';
      else if (next?.conjugated_type === '特殊・タ') form = 'ta';
      else if (token.conjugated_form === '基本形') form = 'dictionary';
    }
    if (form) forms.push({ form, surface: token.surface_form });
  });
  return forms;
}

test('phạm vi từ: từ ghép bị tách và từ đã chia vẫn khớp từ vựng, từ bài sau bị bắt', async () => {
  const lesson1 = buildScope(await wordsUpTo(1), ['田中']);
  assert.deepEqual(outOfScope('田中さんは会社員ですか。', lesson1), []);
  assert.deepEqual(outOfScope('中国人じゃありません。', lesson1), []);
  assert.deepEqual(outOfScope('どうぞよろしくお願いします。', lesson1), []);
  assert.deepEqual(outOfScope('これは本です。', lesson1), ['これ', '本']);
  // Từ vựng viết はじめまして; viết kiểu khác là lệch cách viết đã học.
  assert.deepEqual(outOfScope('初めまして。', lesson1), ['初め', 'まして']);
  assert.deepEqual(outOfScope('毎晩勉強します。', buildScope(await wordsUpTo(4))), []);
  assert.deepEqual(outOfScope('きのう学校へ行きませんでした。', buildScope(await wordsUpTo(5))), []);
});

test('thể động từ đọc từ token, cụm học thuộc không tính', () => {
  const forms = (text: string, parts: string[] = []) => verbForms(text, parts).map((f) => f.form);
  assert.deepEqual(forms('毎朝六時に起きます。'), ['masu']);
  assert.deepEqual(forms('きのう映画を見ませんでした。'), ['masu']);
  assert.deepEqual(forms('ちょっと待ってください。'), ['te']);
  assert.deepEqual(forms('たばこを吸わないでください。'), ['nai']);
  assert.deepEqual(forms('泳ぐことができます。'), ['dictionary', 'masu']);
  assert.deepEqual(forms('富士山に登ったことがあります。'), ['ta', 'masu']);
  assert.deepEqual(forms('本を読んだ。'), ['ta']);
  assert.deepEqual(forms('元気だ。'), ['plain']);
  assert.deepEqual(forms('元気だった。'), ['plain']);
  assert.deepEqual(forms('きれいな花です。'), []);
  assert.deepEqual(forms('静かな町です。'), []);
  assert.deepEqual(forms('学生ではありません。'), []);
  assert.deepEqual(forms('学生ではありませんでした。'), []);
  assert.deepEqual(forms('私のじゃありません。'), []);
  assert.deepEqual(forms('私のじゃありませんでした。'), []);
  assert.deepEqual(forms('本があります。'), ['masu']);
  assert.deepEqual(forms('時間がない。'), ['plain']);
  assert.deepEqual(forms('いらっしゃいませ。'), ['masu']);
  assert.deepEqual(forms('いらっしゃいませ。', ['いらっしゃいませ']), []);
  assert.deepEqual(forms('これを見せてください。', ['見せてください']), []);
});

const ID = /^l(\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*$/u;

test('hội thoại: cấu trúc, cách đọc, phạm vi từ và thể động từ theo bài', async () => {
  const ids = new Set<string>();
  for (const lesson of AVAILABLE_N5_LESSONS) {
    const dialogues = (await loadLesson(lesson)).dialogues ?? [];
    if (dialogues.length === 0) continue;
    assert.ok(dialogues.length >= 2 && dialogues.length <= 3, `bài ${lesson}: cần 2–3 tình huống`);
    const words = await wordsUpTo(lesson);
    const byId = new Map(words.map((w) => [w.id, w]));
    const allowed = ALLOWED.filter((a) => a.from <= lesson).map((a) => a.token);
    const used = new Set<string>();

    for (const d of dialogues) {
      const where = `bài ${lesson} ${d.id}`;
      assert.match(d.id, ID, where);
      assert.equal(Number(ID.exec(d.id)![1]), lesson, `${where}: số bài trong id`);
      assert.ok(!ids.has(d.id), `${where}: id trùng`);
      ids.add(d.id);
      assert.ok(d.title.vi.trim(), `${where}: thiếu tiêu đề`);
      assert.ok(d.roles.length >= 2, `${where}: cần ít nhất 2 vai`);
      const roleIds = new Set(d.roles.map((r) => r.id));
      assert.equal(roleIds.size, d.roles.length, `${where}: id vai trùng`);
      assert.ok(d.lines.length >= 4 && d.lines.length <= 10, `${where}: cần 4–10 câu`);
      for (const role of d.roles) {
        assert.doesNotMatch(stripFurigana(role.name), /[[\]]/u, `${where}: tên vai ${role.id} sai cú pháp furigana`);
        assert.ok(d.lines.some((l) => l.speaker === role.id), `${where}: vai ${role.id} không nói câu nào`);
      }
      const scope = buildScope(words, [...d.roles.map((r) => stripFurigana(r.name)), ...allowed]);

      d.lines.forEach((line, i) => {
        const at = `${where} câu ${i}`;
        assert.ok(roleIds.has(line.speaker), `${at}: người nói không thuộc vai`);
        assert.ok(line.kana && line.translation.vi.trim(), `${at}: thiếu kana hoặc nghĩa`);
        const written = stripFurigana(line.jp);
        assert.doesNotMatch(written, /[[\]]/u, `${at}: ngoặc vuông không phải furigana`);
        assert.doesNotMatch(line.jp + (line.kana ?? ''), /[0-9０-９]/u, `${at}: dùng chữ số (TTS đọc thừa)`);
        const reading = toKanaSentence(line.jp).replace(IGNORED_IN_READING, '');
        assert.doesNotMatch(reading, KANJI, `${at}: chữ Hán thiếu cách đọc`);
        assert.equal(reading, (line.kana ?? '').replace(IGNORED_IN_READING, ''), `${at}: kana lệch furigana`);

        const text = written.replace(/[ 　]/gu, '');
        assert.deepEqual(outOfScope(text, scope), [], `${at}: từ ngoài phạm vi bài 1–${lesson}`);
        for (const { form, surface } of verbForms(text, scope.parts)) {
          assert.ok(FORM_LESSON[form] <= lesson, `${at}: ${surface} dùng thể ${form}, học từ bài ${FORM_LESSON[form]}`);
        }
        for (const id of line.vocabIds ?? []) {
          const word = byId.get(id);
          assert.ok(word, `${at}: vocabIds ${id} không thuộc bài 1–${lesson}`);
          assert.ok(wordParts(word).some((p) => text.includes(p)), `${at}: câu không chứa ${id}`);
          used.add(id);
        }
      });
    }

    const skipped = UNUSED_EXPRESSIONS[lesson] ?? {};
    for (const w of await loadVocab(lesson)) {
      if (w.type !== 'expression' || w.id in skipped) continue;
      assert.ok(used.has(w.id), `bài ${lesson}: câu giao tiếp ${w.id} chưa có trong vocabIds của câu nào`);
    }
  }
});
