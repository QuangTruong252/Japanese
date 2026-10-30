// node --test scripts/build-reading.test.mjs
// Câu Nhật trong test lấy từ hội thoại bài 8 (web/src/data/n5/lessons/lesson-08.json), không tự bịa.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkDraft, computeCoverage, contentUnits, displayText, getTokenizer, grammarSignals, loadSource, mergePassages, reviewComplete, rubyRanges, run, SIGNAL_IDS } from './build-reading.mjs';

const ctx = { tokenizer: await getTokenizer(), source: loadSource() };
const lines = ctx.source.lessons[7].dialogues[0].lines.slice(0, 4);

// Draft hợp lệ dựng từ 4 lượt đầu: glossary lấy từ vocab qua chính contentUnits (cùng cách người soạn bắt đầu).
function validDraft() {
  const sentences = lines.map((l, i) => ({ id: `t-${i + 1}`, jp: l.jp, vi: l.translation.vi }));
  const glossary = new Map();
  const vocabUsed = new Map();
  sentences.forEach((s) => {
    const text = displayText(s.jp);
    for (const u of contentUnits(ctx.tokenizer, text, ctx.source, ['マイ'], { ruby: rubyRanges(s.jp) })) {
      if (u.kind === 'name') {
        if (!glossary.has('n:マイ')) glossary.set('n:マイ', { id: 'n:マイ', kind: 'name', labelJp: 'マイ', meaningsVi: ['Mai — tên người'], anchors: [] });
        glossary.get('n:マイ').anchors.push({ sentenceId: s.id, start: u.start, end: u.end, text: u.surface });
        continue;
      }
      assert.ok(u.match, `test cần từ có trong vocab: ${u.surface}`);
      const w = u.match;
      const id = `${w.lesson}:${w.id}`;
      if (!glossary.has(id)) {
        glossary.set(id, { id: `w:${id}`, kind: 'word', labelJp: w.word, reading: w.kana, meaningsVi: [w.meaning.vi], vocabRef: { lesson: w.lesson, wordId: w.id }, illustration: w.illustration, anchors: [] });
        vocabUsed.set(id, { id, ref: id, lesson: w.lesson, glossaryId: `w:${id}` });
      }
      glossary.get(id).anchors.push({ sentenceId: s.id, start: u.start, end: u.end, text: text.slice(u.start, u.end) });
    }
  });
  const point = ctx.source.grammar.get('8:dou-desu-ka');
  const at = displayText(sentences[2].jp).indexOf('どうですか');
  glossary.set('g:8:dou-desu-ka', { id: 'g:8:dou-desu-ka', kind: 'grammar', labelJp: point.pattern.vi, meaningsVi: [point.title.vi],
    anchors: [{ sentenceId: 't-3', start: at, end: at + 5, text: 'どうですか' }] });
  const question = (n, correct) => ({
    id: `q${n}`, promptVi: `Câu hỏi ${n}?`, explanationVi: 'Giải thích.', evidenceSentenceIds: ['t-1'], correctOptionId: `q${n}-${correct}`,
    options: ['a', 'b', 'c'].map((o) => ({ id: `q${n}-${o}`, textVi: `Lựa chọn ${o}` })),
  });
  const draft = {
    id: 'test-1', kind: 'passage', titleVi: 'Bài thử', source: { kind: 'original' }, properNames: ['マイ'], sentences,
    vocabUsed: [...vocabUsed.values()], grammarUsed: [{ id: '8:dou-desu-ka', glossaryId: 'g:8:dou-desu-ka' }],
    glossary: [...glossary.values()], questions: [question(1, 'a'), question(2, 'b'), question(3, 'c')],
    review: { method: 'ai-multilayer', layers: [{ layer: 1, status: 'passed' }], models: ['test'], date: '2026-10-29', nativeReviewed: false },
  };
  draft.coverage = computeCoverage(draft);
  return draft;
}
const errorsOf = (draft) => checkDraft(draft, ctx).errors;

test('computeCoverage đếm loại riêng biệt, unknown và external là mới', () => {
  const coverage = computeCoverage({
    vocabUsed: [{ id: '3:a', lesson: 3 }, { id: '3:a', lesson: 3 }, { id: '5:b', lesson: 5 }, { id: 'unknown:x', lesson: null }],
    grammarUsed: [{ id: '4:verbos-masu' }, { id: '4:verbos-masu' }, { id: 'external:slug' }],
  });
  assert.deepEqual(coverage, {
    version: 2,
    vocab: { totalTypes: 3, byLesson: { 3: 1, 5: 1 }, unknownTypes: 1 },
    grammar: { totalTypes: 2, byLesson: { 4: 1 }, unknownTypes: 1 },
  });
});

test('displayText và rubyRanges dùng độ dài sau khi bỏ furigana', () => {
  const jp = '私[わたし]は 学生[がくせい]です';
  assert.equal(displayText(jp), '私は 学生です');
  assert.deepEqual(rubyRanges(jp), [[0, 1], [3, 5]]);
  assert.equal(displayText('どこ[へ]も'), 'どこ(へ)も');
});

test('draft hợp lệ qua lớp 1 và coverage khớp bản tính lại', () => {
  const draft = validDraft();
  assert.deepEqual(errorsOf(draft), []);
  assert.ok(draft.coverage.vocab.totalTypes > 0);
});

test('bắt lỗi anchor: slice sai, cắt giữa ruby, thiếu anchor', () => {
  const wrongSlice = validDraft();
  wrongSlice.glossary[0].anchors[0].text = 'ZZ';
  assert.match(errorsOf(wrongSlice).join('\n'), /slice/);

  const cutRuby = validDraft();
  const kanji = cutRuby.glossary.find((g) => g.anchors.some((a) => a.text.length >= 2 && rubyRanges(lines[Number(a.sentenceId.slice(2)) - 1].jp).some(([s, e]) => a.start <= s && a.end >= e && e - s >= 2)));
  assert.ok(kanji, 'test cần anchor phủ cụm chữ Hán ≥ 2 ký tự');
  const a = kanji.anchors.find((x) => rubyRanges(lines[Number(x.sentenceId.slice(2)) - 1].jp).some(([s, e]) => x.start <= s && x.end >= e && e - s >= 2));
  const [rs] = rubyRanges(lines[Number(a.sentenceId.slice(2)) - 1].jp).find(([s, e]) => a.start <= s && a.end >= e && e - s >= 2);
  a.start = rs + 1;
  a.text = displayText(lines[Number(a.sentenceId.slice(2)) - 1].jp).slice(a.start, a.end);
  assert.match(errorsOf(cutRuby).join('\n'), /cắt giữa cụm ruby/);

  const noAnchor = validDraft();
  const victim = noAnchor.glossary.find((g) => g.kind === 'word');
  noAnchor.glossary = noAnchor.glossary.filter((g) => g !== victim);
  noAnchor.vocabUsed = noAnchor.vocabUsed.filter((v) => v.glossaryId !== victim.id);
  noAnchor.coverage = computeCoverage(noAnchor);
  assert.match(errorsOf(noAnchor).join('\n'), /chưa có anchor/);
});

test('bắt coverage nhập tay sai và nghĩa không giống vocab', () => {
  const stale = validDraft();
  stale.coverage.vocab.totalTypes += 1;
  assert.match(errorsOf(stale).join('\n'), /coverage không khớp/);

  const reworded = validDraft();
  reworded.glossary.find((g) => g.kind === 'word').meaningsVi = ['nghĩa diễn đạt lại'];
  assert.match(errorsOf(reworded).join('\n'), /không giống nghĩa trong vocab/);
});

test('bắt câu hỏi hỏng: đáp án ngoài options, bằng chứng ngoài bài', () => {
  const badAnswer = validDraft();
  badAnswer.questions[0].correctOptionId = 'khong-co';
  assert.match(errorsOf(badAnswer).join('\n'), /correctOptionId/);

  const badEvidence = validDraft();
  badEvidence.questions[1].evidenceSentenceIds = ['t-99'];
  assert.match(errorsOf(badEvidence).join('\n'), /evidenceSentenceIds/);
});

test('optionEvidence: thiếu/lệch chỉ cảnh báo, không lỗi', () => {
  const warningsOf = (d) => checkDraft(d, ctx).warnings.filter((w) => w.includes('optionEvidence'));
  const legacy = validDraft();
  assert.equal(errorsOf(legacy).length, 0);
  assert.match(warningsOf(legacy).join('\n'), /3\/3 câu hỏi thiếu/);

  const full = validDraft();
  for (const q of full.questions) q.optionEvidence = Object.fromEntries(q.options.map((o) => [o.id, ['t-1']]));
  assert.equal(warningsOf(full).length, 0);

  const bad = validDraft();
  for (const q of bad.questions) q.optionEvidence = Object.fromEntries(q.options.map((o) => [o.id, ['t-1']]));
  delete bad.questions[0].optionEvidence['q1-b'];
  bad.questions[1].optionEvidence['q2-a'] = ['t-99'];
  bad.questions[2].optionEvidence['q3-c'] = ['t-2'];
  const text = warningsOf(bad).join('\n');
  assert.match(text, /q1-b thiếu mục/);
  assert.match(text, /q2-a trỏ ngoài bài/);
  assert.match(text, /không khớp evidenceSentenceIds/);
  assert.match(text, /3\/3 câu hỏi/);
  assert.equal(errorsOf(bad).length, 0);
});

test('tín hiệu ngữ pháp chưa khai báo bị báo, quyết định ngoại lệ gỡ được', () => {
  const draft = validDraft();
  draft.sentences[0].jp = '友達[ともだち]と 食[た]べました。';
  draft.sentences[0].vi = 'Tôi đã ăn cùng bạn.';
  const before = errorsOf(draft).filter((e) => e.includes('tín hiệu ngữ pháp'));
  assert.ok(before.some((e) => e.includes('"masu"')), `cần tín hiệu masu, có: ${before.join('|')}`);
  draft.review.signalDecisions = [{ rule: 'masu', exception: { sentenceId: 't-1', reason: 'câu thử' } }];
  assert.equal(errorsOf(draft).filter((e) => e.includes('"masu"')).length, 0);
});

test('mergePassages sắp xếp ổn định theo id, thay bản cùng id, bỏ trường chỉ dùng cho biên tập', () => {
  const draft = validDraft();
  draft.id = 'b';
  draft.glossary[0].needsReview = true;
  draft.review.signalDecisions = [{ rule: 'masu', exception: { sentenceId: 't-1', reason: 'thử' } }];
  draft.review.needsReview = [draft.glossary[0].id];
  draft.questions[0].optionEvidence = { 'q1-a': ['t-1'], 'q1-b': ['t-1'], 'q1-c': ['t-1'] };
  draft.review.layers = [{ layer: 1, status: 'passed', note: 'ghi chú', name: 'thừa', model: 'thừa' }];
  const merged = mergePassages([{ id: 'b', v: 1 }, { id: 'a', v: 1 }], [draft]);
  assert.deepEqual(merged.map((p) => p.id), ['a', 'b']);
  assert.equal(merged[1].v, undefined);
  assert.equal(merged[1].properNames, undefined);
  assert.equal(merged[1].review.signalDecisions, undefined);
  assert.equal(merged[1].review.needsReview, undefined);
  assert.equal(merged[1].questions[0].optionEvidence, undefined);
  assert.equal(merged[1].questions[0].correctOptionId, 'q1-a');
  assert.equal(merged[1].glossary[0].needsReview, undefined);
  assert.deepEqual(merged[1].review.layers, [{ layer: 1, status: 'passed', note: 'ghi chú' }]);
  assert.ok(merged[1].glossary.some((g) => g.kind === 'name'), 'tên riêng vẫn vào bản phát hành');
});

test('reviewComplete cần đủ 5 lớp; not-applicable phải có ghi chú', () => {
  const layers = (extra) => ({ review: { layers: [1, 2, 3, 4, 5].map((layer) => ({ layer, status: 'passed', ...extra[layer] })) } });
  assert.equal(reviewComplete(layers({})), true);
  assert.equal(reviewComplete(layers({ 2: { status: 'failed' } })), false);
  assert.equal(reviewComplete(layers({ 5: { status: 'not-applicable' } })), false);
  assert.equal(reviewComplete(layers({ 5: { status: 'not-applicable', note: 'nguồn có sẵn' } })), true);
  assert.equal(reviewComplete({ review: { layers: [{ layer: 1, status: 'passed' }] } }), false);
});

test('release từ chối bài thiếu lớp duyệt, ghi bài đủ lớp vào file tạm', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'reading-'));
  const out = path.join(dir, 'reading.json');
  const quiet = () => {};
  const draft = validDraft();
  const file = path.join(dir, 'draft.json');
  writeFileSync(file, JSON.stringify(draft));
  assert.equal(await run(['check', file], quiet), 0);
  assert.equal(await run(['release', file, '--out', out], quiet), 1);
  assert.equal(existsSync(out), false);

  draft.review.layers = [1, 2, 3, 4, 5].map((layer) => ({ layer, status: 'passed' }));
  writeFileSync(file, JSON.stringify(draft));
  assert.equal(await run(['release', file, '--out', out], quiet), 0);
  const written = JSON.parse(readFileSync(out, 'utf8'));
  assert.equal(written.passages.length, 1);
  assert.equal(written.passages[0].id, 'test-1');
  assert.deepEqual(written.passages[0].coverage, computeCoverage(draft));
});

test('đơn vị từ: cụm cố định, số + lượng từ, động từ trọn đuôi, tên riêng, từ chức năng trong mẫu ngữ pháp', () => {
  const units = (jp, names = [], covered = []) => contentUnits(ctx.tokenizer, displayText(jp), ctx.source, names, { ruby: rubyRanges(jp), covered })
    .map((u) => `${u.kind}:${u.surface}${u.inherent ? '*' : ''}`);
  assert.deepEqual(units('七時[しちじ]ごろ お 願[ねが]いします。'), ['number:七時ごろ', 'phrase:お 願いします']);
  assert.deepEqual(units('何人[なんにん]ですか。 三人[さんにん]です。'), ['number:何人', 'number:三人']);
  assert.deepEqual(units('三千五百円[さんぜんごひゃくえん]です。'), ['number:三千五百円']);
  assert.deepEqual(units('金額[きんがく]を 確認[かくにん]して、 ボタンを 押[お]してください。'), ['word:金額', 'word:確認して', 'word:ボタン', 'word:押してください']);
  assert.deepEqual(units('マイさんは 甲子園[こうしえん]へ 行[い]きました。', ['マイ']), ['name:マイ', 'name:甲子園', 'word:行きました']);
  assert.deepEqual(units('わあ、すごい 人[ひと]ですね。'), ['phrase:わあ、すごい 人ですね']);
  assert.deepEqual(units('いっしょに 行[い]きませんか。'), ['phrase:いっしょに', 'word:行きません']);
  // こと nằm trong anchor mẫu ngữ pháp thì không đếm như từ vựng; ngoài mẫu vẫn là từ.
  const jp = '予約[よやく]する ことが できますか。';
  const at = displayText(jp).indexOf('ことが');
  assert.ok(units(jp, [], [[at, at + 12]]).includes('word:こと*'));
  assert.ok(units(jp).includes('word:こと'));
});

test('từ đồng âm chọn theo cách đọc: 人 (ひと) là 5:hito, không phải 1:jin; 何 (なに) là 6:nani', () => {
  const pick = (jp) => contentUnits(ctx.tokenizer, displayText(jp), ctx.source).map((u) => u.match && `${u.match.lesson}:${u.match.id}`);
  assert.ok(pick('会社[かいしゃ]の 人[ひと]').includes('5:hito'));
  assert.ok(pick('何[なに]を しますか。').includes('6:nani'));
});

test('anchor phải phủ trọn đơn vị từ: thân động từ, một phần cụm cố định bị báo', () => {
  const draft = validDraft();
  const word = draft.glossary.find((g) => g.kind === 'word' && g.anchors.some((a) => a.text.length >= 3));
  const a = word.anchors.find((x) => x.text.length >= 3);
  a.end -= 1;
  a.text = a.text.slice(0, -1);
  assert.match(errorsOf(draft).join('\n'), /cắt giữa đơn vị từ|chưa có anchor/);
});

test('tên riêng: thiếu glossary kind name bị báo, name không được vào vocabUsed/coverage hay có vocabRef', () => {
  const noName = validDraft();
  noName.glossary = noName.glossary.filter((g) => g.kind !== 'name');
  assert.match(errorsOf(noName).join('\n'), /tên riêng cần glossary kind name/);

  const counted = validDraft();
  const name = counted.glossary.find((g) => g.kind === 'name');
  counted.vocabUsed.push({ id: 'unknown:mai', lesson: null, glossaryId: name.id });
  counted.coverage = computeCoverage(counted);
  assert.match(errorsOf(counted).join('\n'), /phải là kind word/);

  const withRef = validDraft();
  withRef.glossary.find((g) => g.kind === 'name').vocabRef = { lesson: 1, wordId: 'watashi' };
  assert.match(errorsOf(withRef).join('\n'), /tên riêng không có ref/);
  assert.deepEqual(errorsOf(validDraft()), []);
  assert.deepEqual(checkDraft(validDraft(), ctx).warnings.filter((w) => w.startsWith('glossary ')), [], 'name không bị cảnh báo thiếu trong vocabUsed/grammarUsed');
});

test('review: models/date bắt buộc, lớp not-applicable chỉ cho lớp 2/5 hội thoại Minna và cần note', () => {
  const noModels = validDraft();
  noModels.review.models = [];
  assert.match(errorsOf(noModels).join('\n'), /review\.models/);
  const na = validDraft();
  na.review.layers.push({ layer: 2, status: 'not-applicable', note: 'nguyên văn' });
  assert.match(errorsOf(na).join('\n'), /chỉ được not-applicable/);
});

// Câu bên dưới copy nguyên văn từ hội thoại bài 5, 8, 9 trong lessons/*.json (displayText, không furigana).
const rulesOf = (text) => new Map(grammarSignals(ctx.tokenizer, text).map((s) => [s.rule, s]));

test('detector: trợ từ/từ vựng phổ biến của N5 được gắn cờ, ID gợi ý đều có thật trong lessons', () => {
  const cases = [
    ['友達と デパートへ 行きました。', ['to-noun', 'e-iku']],
    ['難しいですが、 おもしろいです。', ['ga-but']],
    ['日本の 生活は どうですか。', ['dou-desu-ka', 'no-genitive']],
    ['マイさんは どんな お 茶を 飲みますか。', ['donna', 'o-object']],
    ['いいえ、静かな 町です。 あまり 有名じゃ ありません。', ['totemo-amari']],
    ['マイさんは 音楽が 好きですか。', ['ga-object']],
    ['電車で 行きましたか。', ['de-particle']],
    ['はい、来月の 一日に 来ます。', ['no-genitive']],
  ];
  for (const [text, expected] of cases) {
    const found = rulesOf(text);
    for (const rule of expected) assert.ok(found.has(rule), `${text}: thiếu ${rule}, có ${[...found.keys()]}`);
  }
  for (const [rule, ids] of Object.entries(SIGNAL_IDS)) for (const id of ids) assert.ok(ctx.source.grammar.has(id), `SIGNAL_IDS.${rule}: ${id} không có trong lessons`);
});

test('detector: không báo nhầm (số + 時 không phải lượng từ, ください không phải て nối)', () => {
  assert.ok(!rulesOf('十時 十五分です。').has('quantifier'));
  assert.ok(!rulesOf('いいえ。 また いらっしゃって ください。').has('te-encadenar'));
  assert.ok(!rulesOf('ええ、元気ですよ。').has('dou-desu-ka'));
});

test('check: tín hiệu chưa khai báo đúng mẫu thành cảnh báo kèm ID gợi ý, khai báo rồi thì hết, advisory không gây lỗi', () => {
  const draft = validDraft();
  const base = checkDraft(draft, ctx);
  assert.deepEqual(base.errors, []);
  for (const s of base.signals.filter((x) => x.undeclared)) assert.ok(base.warnings.some((w) => w.includes(`"${s.rule}"`)), s.rule);
  const dou = base.signals.find((s) => s.rule === 'dou-desu-ka');
  assert.ok(dou && !dou.undeclared, 'どうですか đã khai báo 8:dou-desu-ka');
  const stripped = structuredClone(draft);
  stripped.grammarUsed = [];
  stripped.glossary = stripped.glossary.filter((g) => g.kind !== 'grammar');
  const after = checkDraft(stripped, ctx);
  assert.ok(after.signals.find((s) => s.rule === 'dou-desu-ka')?.undeclared);
  assert.ok(after.warnings.some((w) => w.includes('"dou-desu-ka"') && w.includes('8:dou-desu-ka')));
  assert.ok(!after.errors.some((e) => e.includes('dou-desu-ka')));
});

test('reading.json đã commit: coverage của mọi bài khớp bản tính lại bằng computeCoverage', () => {
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../web/src/data/n5/reading.json');
  const { passages } = JSON.parse(readFileSync(file, 'utf8'));
  assert.ok(passages.length > 0);
  const stale = passages.filter((p) => JSON.stringify(p.coverage) !== JSON.stringify(computeCoverage(p))).map((p) => p.id);
  assert.deepEqual(stale, [], `coverage lệch bản tính lại ở: ${stale.join(', ')} (chạy lại release cho bài đó)`);
});
