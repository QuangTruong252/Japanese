import { test } from 'node:test';
import assert from 'node:assert/strict';
import source from '../data/n5/reading.json' with { type: 'json' };
import type { ReadingPassage } from '../types/reading.ts';
import { READING_PASSAGES, computeReadingCoverage, readingPassage, validateReadingCatalog, validateReadingPassage } from './reading-data.ts';
import { allVocabIds, makeDialogueFixture } from './reading.test-helpers.ts';

const vocabIds = await allVocabIds();
const fixture = await makeDialogueFixture();
const clone = (): ReadingPassage => structuredClone(fixture);
const errorsOf = (mutate: (p: ReadingPassage) => void) => {
  const p = clone();
  mutate(p);
  return validateReadingPassage(p, { vocabIds });
};

test('kho reading.json thật hợp lệ và nạp đúng', () => {
  assert.deepEqual(validateReadingCatalog(source, { vocabIds }), []);
  assert.equal(READING_PASSAGES.length, source.passages.length);
  assert.equal(readingPassage('khong-co'), undefined);
});

test('bài hội thoại từ nguyên văn l10-heya hợp lệ, coverage tính lại đúng', () => {
  assert.deepEqual(validateReadingPassage(fixture, { vocabIds }), []);
  assert.deepEqual(fixture.coverage, {
    version: 2,
    vocab: { totalTypes: 1, byLesson: { 10: 1 }, unknownTypes: 0 },
    grammar: { totalTypes: 1, byLesson: { 10: 1 }, unknownTypes: 0 },
  });
  assert.deepEqual(computeReadingCoverage({ vocabUsed: [], grammarUsed: [{ id: 'external:x', glossaryId: 'g' }] }).grammar, { totalTypes: 1, byLesson: {}, unknownTypes: 1 });
});

test('kho: ID bài trùng và dạng sai bị từ chối', () => {
  assert.match(validateReadingCatalog({ version: 1, passages: [fixture, fixture] }, { vocabIds }).join('\n'), /trùng id bài/);
  assert.equal(validateReadingCatalog({ passages: [] }).length, 1);
});

test('câu hỏi: đúng 3 câu, 3 lựa chọn, đúng một đáp án', () => {
  assert.match(errorsOf((p) => p.questions.pop()).join('\n'), /đúng 3 câu hỏi/);
  assert.match(errorsOf((p) => p.questions[0]!.options.pop()).join('\n'), /3 lựa chọn/);
  assert.match(errorsOf((p) => { p.questions[0]!.options[1]!.id = 'a'; }).join('\n'), /trùng id lựa chọn/);
  assert.match(errorsOf((p) => { p.questions[0]!.correctOptionId = 'z'; }).join('\n'), /correctOptionId/);
  assert.match(errorsOf((p) => { p.questions[1]!.id = 'q1'; }).join('\n'), /trùng id câu hỏi/);
});

test('evidence phải không rỗng và trỏ câu có thật', () => {
  assert.match(errorsOf((p) => { p.questions[0]!.evidenceSentenceIds = []; }).join('\n'), /evidenceSentenceIds rỗng/);
  assert.match(errorsOf((p) => { p.questions[0]!.evidenceSentenceIds = ['l10-heya-99']; }).join('\n'), /không có l10-heya-99/);
});

test('anchor: slice phải khớp text sau stripFurigana, không cắt ruby hay vượt câu', () => {
  assert.match(errorsOf((p) => { p.glossary[1]!.anchors[0]!.text = '田'; }).join('\n'), /không khớp text/);
  // 田中[たなか]: cắt ở giữa "田|中" là cắt cụm ruby, dù text "田" khớp slice.
  assert.match(errorsOf((p) => { p.glossary[1]!.anchors[0] = { sentenceId: 'l10-heya-1', start: 0, end: 1, text: '田' }; }).join('\n'), /cắt giữa cụm ruby/);
  assert.match(errorsOf((p) => { p.glossary[1]!.anchors[0]!.end = 999; }).join('\n'), /không khớp text/);
  assert.match(errorsOf((p) => { p.glossary[1]!.anchors[0]!.sentenceId = 'khong-co'; }).join('\n'), /anchor không hợp lệ/);
  assert.match(errorsOf((p) => { p.glossary[1]!.anchors = []; }).join('\n'), /ít nhất một anchor/);
});

test('anchor không cắt đôi cặp surrogate', () => {
  const p = clone();
  // 𠮷 (U+20BB7) chiếm 2 đơn vị UTF-16; cắt giữa là sai dù text khớp slice.
  p.sentences[0]!.jp = '𠮷田です。';
  p.glossary[1]!.anchors[0] = { sentenceId: 'l10-heya-1', start: 1, end: 2, text: '\udfb7' };
  assert.match(validateReadingPassage(p, { vocabIds }).join('\n'), /cắt surrogate/);
});

test('dialogue cần roles/speaker hợp lệ; đoạn văn cấm speaker và roles', () => {
  assert.match(errorsOf((p) => { p.sentences[0]!.speaker = 'la'; }).join('\n'), /sai speaker/);
  assert.match(errorsOf((p) => { delete p.roles; }).join('\n'), /ít nhất 2 vai/);
  assert.match(errorsOf((p) => { p.sentences[1]!.id = 'l10-heya-7'; }).join('\n'), /phải là l10-heya-2/);
  const asPassage = (mutate?: (p: ReadingPassage) => void) => errorsOf((p) => {
    p.kind = 'passage';
    p.source = { kind: 'original', materialIds: ['x'] };
    delete p.roles;
    p.sentences.forEach((s, i) => { delete s.speaker; s.id = `s${i + 1}`; });
    p.glossary.forEach((g) => g.anchors.forEach((a) => { a.sentenceId = 's1'; }));
    p.questions.forEach((q) => { q.evidenceSentenceIds = ['s1']; });
    p.review.layers.forEach((l) => { l.status = 'passed'; delete l.note; });
    mutate?.(p);
  });
  assert.deepEqual(asPassage(), []);
  assert.match(asPassage((p) => { p.sentences[0]!.speaker = 'mai'; }).join('\n'), /cấm speaker/);
  assert.match(asPassage((p) => { p.roles = []; }).join('\n'), /không có roles/);
});

test('số câu 4–10 và glossary/loại từ khớp nhau', () => {
  assert.match(errorsOf((p) => { p.sentences = p.sentences.slice(0, 3); }).join('\n'), /4–10/);
  assert.match(errorsOf((p) => { p.vocabUsed[0]!.glossaryId = 'khong-co'; }).join('\n'), /glossaryId không có/);
  assert.match(errorsOf((p) => { p.glossary.push({ ...p.glossary[0]!, id: 'mo-coi' }); }).join('\n'), /không thuộc vocabUsed/);
  assert.match(errorsOf((p) => { p.vocabUsed.push({ id: 'unknown:x', lesson: 3, glossaryId: 'g-arimasu' }); }).join('\n'), /unknown/);
  assert.match(errorsOf((p) => { p.vocabUsed[0]!.ref = '10:khong-co'; }).join('\n'), /ref không tồn tại/);
  assert.match(errorsOf((p) => { p.glossary[0]!.vocabRef = { lesson: 10, wordId: 'khong-co' }; }).join('\n'), /vocabRef không có/);
  assert.match(errorsOf((p) => { p.grammarUsed[0]!.id = 'sai'; }).join('\n'), /grammarUsed có mục không hợp lệ/);
});

test('coverage nhập tay lệch bị phát hiện', () => {
  assert.match(errorsOf((p) => { p.coverage.vocab.byLesson = { 3: 1 }; }).join('\n'), /coverage không khớp/);
  assert.match(errorsOf((p) => { p.coverage.grammar.unknownTypes = 1; }).join('\n'), /coverage không khớp/);
  assert.match(errorsOf((p) => { p.vocabUsed = []; }).join('\n'), /vocabUsed rỗng/);
});

test('tên riêng: glossary kind name có anchor, ngoài coverage và vocabUsed/grammarUsed', () => {
  assert.equal(fixture.glossary.find((g) => g.id === 'g-tanaka')!.kind, 'name');
  assert.deepEqual(validateReadingPassage(fixture, { vocabIds }), []);
  assert.match(errorsOf((p) => { p.glossary[1]!.anchors = []; }).join('\n'), /ít nhất một anchor/);
  assert.match(errorsOf((p) => { p.glossary[1]!.anchors[0]!.text = 'x'; }).join('\n'), /không khớp text/);
  assert.match(errorsOf((p) => { p.glossary[1]!.vocabRef = { lesson: 10, wordId: 'arimasu' }; }).join('\n'), /vocabRef không hợp lệ/);
  assert.match(errorsOf((p) => { p.glossary[1]!.ref = '10:arimasu'; }).join('\n'), /tên riêng không có ref/);
  // Đưa tên riêng vào vocabUsed là tính nó vào mẫu số coverage.
  assert.match(errorsOf((p) => { p.vocabUsed.push({ id: 'unknown:tanaka', lesson: null, glossaryId: 'g-tanaka' }); }).join('\n'), /tên riêng/);
});

test('glossary: trường tùy chọn có mặt thì phải là chuỗi', () => {
  for (const field of ['ref', 'reading', 'exampleJp', 'exampleVi'] as const) {
    assert.match(errorsOf((p) => { (p.glossary[0] as unknown as Record<string, unknown>)[field] = { bad: true }; }).join('\n'), new RegExp(`${field} phải là chuỗi`));
  }
});

const external = (extra: object = {}) => ({ kind: 'external', author: 'a', title: 't', url: 'https://x', license: 'CC0', checkedAt: '2026-10-29', notes: 'n', ...extra }) as ReadingPassage['source'];

test('source external: licenseUrl tùy chọn nhưng có thì phải là chuỗi', () => {
  const asExternal = (extra?: object) => errorsOf((p) => { p.kind = 'passage'; delete p.roles; p.sentences.forEach((s) => { delete s.speaker; }); p.source = external(extra); p.review.layers.forEach((l) => { l.status = 'passed'; delete l.note; }); });
  assert.deepEqual(asExternal(), []);
  assert.deepEqual(asExternal({ licenseUrl: 'https://x/license' }), []);
  assert.match(asExternal({ licenseUrl: { bad: true } }).join('\n'), /licenseUrl/);
});

test('review: đúng một kết quả mỗi lớp, models không rỗng', () => {
  assert.match(errorsOf((p) => { p.review.models = []; }).join('\n'), /đúng một kết quả/);
  assert.match(errorsOf((p) => { p.review.layers[4]!.layer = 4; }).join('\n'), /đúng một kết quả/);
  assert.match(errorsOf((p) => { p.review.layers.push({ layer: 1, status: 'passed' }); }).join('\n'), /đúng một kết quả/);
});

test('review: hội thoại Minna chỉ được bỏ lớp 2 và 5, lớp khác phải passed', () => {
  assert.match(errorsOf((p) => { p.review.layers[3] = { layer: 4, status: 'not-applicable', note: 'bỏ' }; }).join('\n'), /lớp 4 phải passed/);
  assert.match(errorsOf((p) => { p.review.layers[0] = { layer: 1, status: 'not-applicable', note: 'bỏ' }; }).join('\n'), /lớp 1 phải passed/);
  assert.match(errorsOf((p) => { p.review.layers.forEach((l) => { l.status = 'not-applicable'; l.note = 'skip'; }); p.review.models = []; }).join('\n'), /đúng một kết quả|phải passed/);
  assert.deepEqual(errorsOf((p) => { p.review.layers[1] = { layer: 2, status: 'passed' }; }), []);
});

test('review: bài ngoài hội thoại Minna phải passed đủ năm lớp', () => {
  const asPassage = (source: ReadingPassage['source'], mutate?: (p: ReadingPassage) => void) => errorsOf((p) => {
    p.kind = 'passage';
    p.source = source;
    delete p.roles;
    p.sentences.forEach((s, i) => { delete s.speaker; s.id = `s${i + 1}`; });
    p.glossary.forEach((g) => g.anchors.forEach((a) => { a.sentenceId = 's1'; }));
    p.questions.forEach((q) => { q.evidenceSentenceIds = ['s1']; });
    p.review.layers.forEach((l) => { l.status = 'passed'; delete l.note; });
    mutate?.(p);
  });
  for (const source of [external(), { kind: 'original', materialIds: ['x'] } as ReadingPassage['source']]) {
    assert.deepEqual(asPassage(source), []);
    assert.match(asPassage(source, (p) => { p.review.layers[3] = { layer: 4, status: 'not-applicable', note: 'bỏ' }; }).join('\n'), /lớp 4 phải passed/);
    assert.match(asPassage(source, (p) => { p.review.layers[1] = { layer: 2, status: 'not-applicable', note: 'bỏ' }; }).join('\n'), /lớp 2 phải passed/);
    assert.match(asPassage(source, (p) => { p.review.layers[4] = { layer: 5, status: 'not-applicable', note: 'bỏ' }; }).join('\n'), /lớp 5 phải passed/);
  }
});

test('source và review: thiếu năm lớp hoặc thiếu ghi chú bị từ chối', () => {
  assert.match(errorsOf((p) => { p.review.layers.pop(); }).join('\n'), /đúng một kết quả/);
  assert.match(errorsOf((p) => { delete p.review.layers[1]!.note; }).join('\n'), /cần note/);
  assert.match(errorsOf((p) => { p.source = { kind: 'external', author: 'a', title: 't', url: '', license: 'l', checkedAt: '2026-10-29', notes: 'n' }; }).join('\n'), /external thiếu trường/);
  assert.match(errorsOf((p) => { (p.source as { kind: string }).kind = 'khac'; }).join('\n'), /source.kind/);
});
