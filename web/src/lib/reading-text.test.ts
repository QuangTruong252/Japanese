import assert from 'node:assert/strict';
import test from 'node:test';
import { groupSentences, readingWords } from '../components/reading/reading-text.ts';
import { stripFurigana } from './japanese.ts';
import { makeDialogueFixture } from './reading.test-helpers.ts';

test('readingWords: mọi anchor của câu thành đoạn bấm được, chữ không mất', async () => {
  const passage = await makeDialogueFixture();
  const first = passage.sentences[0]!;
  const words = readingWords(first.id, first.jp, passage.glossary);
  const flat = words.flat();
  assert.equal(flat.map((r) => stripFurigana(r.text)).join(''), stripFurigana(first.jp).replace(/[ 　]/g, ''));
  assert.ok(flat.some((r) => r.entryIds.includes('g-tanaka') && stripFurigana(r.text) === '田中'));
  assert.ok(flat.some((r) => r.entryIds[0] === 'g-arimasu' && r.text === 'あります'));
});

test('readingWords: chồng lấn giữ cả tập mục, từ (anchor ngắn) xếp trước mẫu ngữ pháp', async () => {
  const passage = await makeDialogueFixture();
  const first = passage.sentences[0]!;
  const flat = readingWords(first.id, first.jp, passage.glossary).flat();
  // 'どこに あります' (ngữ pháp) chứa 'あります' (từ): phần chồng mở được cả hai, phần còn lại chỉ ngữ pháp.
  assert.ok(flat.some((r) => r.text === 'どこに' && r.entryIds.join() === 'g-wa-ni'));
  assert.ok(flat.some((r) => r.text === 'あります' && r.entryIds.join() === 'g-arimasu,g-wa-ni'));
});

test('readingWords: anchor trùng hoàn toàn hoặc mẫu bị từ phủ hết vẫn giữ đủ mọi mục', async () => {
  const passage = await makeDialogueFixture();
  const first = passage.sentences[0]!;
  const arimasu = passage.glossary.find((g) => g.id === 'g-arimasu')!;
  const same = passage.glossary.map((g) => (g.id === 'g-wa-ni' ? { ...g, anchors: arimasu.anchors } : g));
  const ids = (glossary: typeof same) => new Set(readingWords(first.id, first.jp, glossary).flat().flatMap((r) => r.entryIds));
  assert.ok(ids(same).has('g-wa-ni') && ids(same).has('g-arimasu'));
  // Hai từ phủ trọn mẫu ngữ pháp: mẫu không còn chữ riêng nhưng vẫn mở được từ cả hai từ.
  const grammar = passage.glossary.find((g) => g.id === 'g-wa-ni')!;
  const [a] = grammar.anchors;
  const halves = [{ ...arimasu, id: 'w1', anchors: [{ ...a!, end: a!.start + 2 }] }, { ...arimasu, id: 'w2', anchors: [{ ...a!, start: a!.start + 2 }] }];
  const covered = readingWords(first.id, first.jp, [...halves, grammar]).flat();
  assert.ok(covered.every((r) => !r.entryIds.length || r.entryIds.includes('g-wa-ni')));
  assert.ok(covered.some((r) => r.entryIds.length === 2 && r.entryIds[1] === 'g-wa-ni'));
});

test('readingWords: cụm ngắt theo dấu cách; câu khác không có anchor thì không có mục', async () => {
  const passage = await makeDialogueFixture();
  const second = passage.sentences[1]!;
  const words = readingWords(second.id, second.jp, passage.glossary);
  assert.equal(words.length, second.jp.split(/[ 　]+/).filter(Boolean).length);
  assert.ok(words.flat().every((r) => r.entryIds.length === 0));
});

test("groupSentences: gom câu liền nhau cùng nhóm, câu không nhóm tự thành hàng", () => {
  const rows = groupSentences([{ id: "a", group: 1 }, { id: "b", group: 1 }, { id: "c" }, { id: "d" }, { id: "e", group: 1 }]);
  assert.deepEqual(rows.map((row) => row.map((s) => s.id)), [["a", "b"], ["c"], ["d"], ["e"]]);
});
