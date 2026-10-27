// Sinh web/src/data/n5/translation.json từ ví dụ ngữ pháp (đợt 1) và ví dụ từ vựng (đợt 2).
// Chạy tay ở root repo: node scripts/build-translation.mjs. Không sửa/dịch câu nào: chỉ lọc, gắn mốc bài và từ khóa.
// Nhật ký lọc ghi ra .work/20261027-translation-reflex/build-log.json để rà thủ công.
// translation-data.test.ts import buildTranslation() để biết dữ liệu đã commit còn khớp bản sinh lại hay không.
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const web = path.join(root, 'web');
const data = path.join(web, 'src/data/n5');
const webRequire = createRequire(path.join(web, 'package.json'));
const kuromoji = webRequire('kuromoji');
const dicPath = path.join(path.dirname(webRequire.resolve('kuromoji/package.json')), 'dict');
const tokenizer = await new Promise((resolve, reject) => {
  kuromoji.builder({ dicPath }).build((error, built) => error ? reject(error) : resolve(built));
});

const KANJI_CHARS = '一-鿿㐀-䶿々〆〇ヶ';
const KANJI = /[一-鿿㐀-䶿々〆ヶ]/u;
const NOT_AFTER_KANJI_BRACKET = new RegExp(`(?<![${KANJI_CHARS}])\\[`, 'u');
const KANJI_RUN_WITH_READING = new RegExp(`([${KANJI_CHARS}]+)\\[([^\\]]+)\\]`, 'gu');
const strip = (text) => text.replace(KANJI_RUN_WITH_READING, '$1');
const kanaOf = (text) => text.replace(KANJI_RUN_WITH_READING, '$2');
const compact = (text) => strip(text).replace(/[\s　]/gu, '');
const hira = (text) => text.replace(/[ァ-ヶ]/gu, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
const readJson = (file) => JSON.parse(readFileSync(path.join(data, file), 'utf8'));
const fingerprint = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const SKIPPED_POS = ['助詞', '助動詞', '記号', '接頭詞'];
const lexical = (token) => !SKIPPED_POS.includes(token.pos) && !(token.pos === '動詞' && token.pos_detail_1 === '非自立');
const ENTRY_POS = { 'verb-ichidan': '動詞', 'verb-godan': '動詞', 'verb-irregular': '動詞', 'adjective-i': '形容詞' };
const conjugating = (token) => token.pos === '動詞' || token.pos === '形容詞';

// Tên riêng đã đọc thủ công trong các ví dụ (kana hoặc chữ Hán có furigana đủ). Không tin nhãn 固有名詞 của kuromoji:
// nó từng gắn nhãn sai 金 (お金) và 夏海 (夏 + 海).
export const PROPER_NAMES = ['マイク', 'ミラー', 'サントス', 'マリア', 'ワット', 'ペキン', 'ハノイ', 'イタリア', 'ディズニーランド',
  'テレサ', 'グプタ', 'カリナ', '東京', '山田', '木村', '田中', '京都', '甲子園', '富士山', '奈良', '千葉', '大阪', '神戸', '梅田', '大学前', '北海道'];
// Danh từ chức năng do chính mẫu ngữ pháp dạy, không nằm trong vocab: の thay danh từ (bài 2), こと (18), とき (23).
export const GRAMMAR_NOUNS = { の: 2, こと: 18, とき: 23 };
// ない (tính từ) là phủ định của ある, cùng thể ない của động từ (bài 17).
export const NAI_LESSON = 17;

export const lessons = Array.from({ length: 25 }, (_, i) => readJson(`lessons/lesson-${String(i + 1).padStart(2, '0')}.json`));
export const vocabByLesson = Array.from({ length: 25 }, (_, i) => readJson(`vocab/lesson-${String(i + 1).padStart(2, '0')}.json`).words);

// Từ vựng chép nhiều ký pháp: ghi chú tùy chọn [〜を], ngoặc （…）, hai cách viết "A／B" hoặc "A・B", chỗ trống 〜.
// Mỗi cách viết đầy đủ là một "dạng" để khớp với câu.
export function wordForms(text) {
  // [お]ふろ = おふろ/ふろ; ghi chú có 〜 ([〜を], [子どもが〜]) chỉ là gloss nên bỏ hẳn.
  const optionals = [...strip(text).matchAll(/\[([^\]]*)\]/gu)].map((match) => match[1]);
  const plains = optionals.reduce((forms, inner) => forms.flatMap((form) => [form.replace(`[${inner}]`, ''), ...(inner.includes('〜') ? [] : [form.replace(`[${inner}]`, inner)])]), [strip(text)]);
  return plains.flatMap(splitForms);
}

function splitForms(plain) {
  const inner = [...plain.matchAll(/[（(]([^）)]*)[）)]/gu)].map((match) => match[1]);
  const outer = plain.replace(/[（(][^）)]*[）)]/gu, '');
  return [outer, ...inner].flatMap((part) => part.split(/[／・]/u))
    .map((form) => form.replace(/[〜～…、。？！\s　]/gu, ''))
    .filter(Boolean);
}

// dạng viết -> các từ vựng (bài sớm nhất trước); dạng đọc (hiragana) -> các từ vựng.
const formMap = new Map();
const readingMap = new Map();
const addTo = (map, key, entry) => map.set(key, [...(map.get(key) ?? []), entry]);
vocabByLesson.forEach((words, i) => {
  for (const word of words) {
    const entry = { lesson: i + 1, id: word.id, word };
    for (const form of wordForms(word.word)) {
      addTo(formMap, form, entry);
      // Danh từ + する (勉強する) cũng xuất hiện dạng danh từ (勉強を する, 勉強します tách thành 勉強 + し + ます).
      if (form.length > 2 && form.endsWith('する')) addTo(formMap, form.slice(0, -2), entry);
    }
    for (const form of wordForms(word.kana)) addTo(readingMap, hira(form), entry);
  }
});

// Mốc của trợ từ: bài sớm nhất có ví dụ ngữ pháp hoặc hội thoại dùng nó.
export const particleFloor = new Map();
for (const lesson of lessons) {
  const texts = [...lesson.grammar.flatMap((point) => point.examples.map((example) => example.jp)),
    ...(lesson.dialogues ?? []).flatMap((dialogue) => dialogue.lines.map((line) => line.jp))];
  for (const text of texts) {
    for (const token of tokenizer.tokenize(compact(text))) {
      if (token.pos === '助詞' && !particleFloor.has(token.basic_form)) particleFloor.set(token.basic_form, lesson.number);
    }
  }
}

export function formLesson(token, next) {
  return next?.basic_form === 'ます' ? 4
    : next?.conjugated_type === '特殊・タイ' ? 13
    : next?.surface_form === 'て' || next?.surface_form === 'で' ? 14
    : next?.conjugated_type === '特殊・ナイ' ? 17
    : next?.conjugated_type === '特殊・タ' ? 19
    : token.conjugated_form === '基本形' ? 18 : 1;
}

// Vị trí trong câu gốc (có furigana) của từng ký tự của compact(jp).
function spanMap(jp) {
  const spans = [];
  for (let i = 0; i < jp.length; i++) {
    const ch = jp[i];
    if (/[\s　]/u.test(ch)) continue;
    if (ch === '[' && spans.length && KANJI.test(jp[spans.at(-1).start])) {
      i = jp.indexOf(']', i);
      spans.at(-1).end = i + 1;
      continue;
    }
    spans.push({ start: i, end: i + 1 });
  }
  return spans;
}

function viVariants(meaning) {
  return meaning.replace(/\([^)]*\)/gu, '').split(/[;,，/]| hoặc /u).map((part) => part.replace(/[〜~]/gu, '').trim()).filter((part) => part.length >= 2)
    .sort((a, b) => b.length - a.length);
}

function matchVi(meaning, vi) {
  for (const variant of viVariants(meaning)) {
    const escaped = variant.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    const hit = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu').exec(vi);
    if (hit) return hit[0];
  }
  return null;
}

const MAX_PHRASE_TOKENS = 8;

// Tìm từ vựng cho token i..j: dạng viết (nối bề mặt, hoặc bề mặt + nguyên dạng của token cuối), rồi cách đọc.
function findVocab(tokens, i, j, readingOf) {
  const surface = tokens.slice(i, j + 1).map((token) => token.surface_form).join('');
  const base = tokens.slice(i, j).map((token) => token.surface_form).join('') + tokens[j].basic_form;
  // Gộp cả hai: 終わり (động từ, bài 4) cũng trùng danh từ 終わり (bài 20); 早く (bài 9) cũng là chia đuôi của 早い (bài 12).
  const plainRun = tokens.slice(i, j + 1).every((token) => !conjugating(token) && !SKIPPED_POS.includes(token.pos));
  // Cách đọc chỉ dùng cho danh từ/trạng từ: động từ và tính từ chia đuôi nên cách đọc không so với dạng từ điển được.
  const reading = readingOf(i, j);
  // Cùng chữ nhưng khác cách đọc là từ khác (日[ひ] không phải 〜日[にち]). Đoạn cắt giữa cụm chữ Hán (外国|人) chưa có cách đọc nên không so được.
  const sameReading = (entry) => plainRun && !KANJI.test(reading) && !/[A-Za-z0-9]/u.test(reading) ? wordForms(entry.word.kana).some((form) => reading.includes(hira(form)) || hira(form).includes(reading)) : true;
  const hit = [...new Set([...(formMap.get(surface) ?? []), ...(formMap.get(base) ?? [])])].filter(sameReading).sort((a, b) => a.lesson - b.lesson);
  if (hit.length) return hit;
  if (!plainRun) return undefined;
  return readingMap.get(reading) ?? (/^[おご]/u.test(reading) ? readingMap.get(reading.slice(1)) : undefined);
}

/** @returns {{ reject: string } | { minimumLesson: number, keywords: object[], names: string[] }} */
export function analyze(jp, vi, sourceLesson) {
  if (NOT_AFTER_KANJI_BRACKET.test(jp)) return { reject: 'ngoặc tùy chọn' };
  if (KANJI.test(kanaOf(jp))) return { reject: 'chữ Hán thiếu furigana' };
  if (!/[。？！」]$/u.test(jp.trim()) || /[→／・（]/u.test(jp.replace(/マイク・ミラー/u, ''))) return { reject: 'câu cụt/không phải câu' };
  const tokens = tokenizer.tokenize(compact(jp));
  const spans = spanMap(jp);
  const spanOf = (i, j) => ({
    start: spans[tokens[i].word_position - 1].start,
    end: spans[tokens[j].word_position - 1 + tokens[j].surface_form.length - 1].end,
  });
  const readingOf = (i, j) => { const { start, end } = spanOf(i, j); return hira(kanaOf(jp.slice(start, end))).replace(/[\s　]/gu, ''); };

  let minimumLesson = sourceLesson;
  const names = [];
  // Token không cần từ vựng riêng: trợ từ (có mốc), danh từ chức năng, tên riêng, số, đuôi chia...
  const floors = new Array(tokens.length).fill(0); // mốc ngữ pháp của token (chỉ tính khi token không nằm trong cụm từ vựng)
  const needs = tokens.map((token, i) => {
    if (token.pos === '助詞') return false;
    if (!lexical(token) || (token.pos === '名詞' && token.pos_detail_1 === '数')) return false;
    if (token.basic_form === 'ある' && tokens[i - 1]?.surface_form === 'じゃ') return false;
    if (token.pos === '名詞' && GRAMMAR_NOUNS[token.surface_form]) { floors[i] = GRAMMAR_NOUNS[token.surface_form]; return false; }
    if (token.basic_form === 'ない' && token.pos === '形容詞') { floors[i] = NAI_LESSON; return false; }
    if (PROPER_NAMES.includes(token.surface_form)) { names.push(token.surface_form); return false; }
    return true;
  });

  // Từ vựng của câu: các đoạn token liền nhau (một token, hợp từ như 会社員, cụm như そろそろ失礼します) khớp một từ vựng.
  // Chọn mốc bài thấp nhất mà các đoạn đã học đủ phủ mọi token cần từ vựng, nên 会社員 (bài 1) thắng 会社 (bài 3) + 員.
  const segments = [];
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i; j < Math.min(tokens.length, i + MAX_PHRASE_TOKENS); j++) {
      if (i === j && !needs[i]) continue;
      const entries = findVocab(tokens, i, j, readingOf);
      if (entries) segments.push({ from: i, to: j, entries, lesson: entries[0].lesson });
    }
  }
  const covers = (limit) => {
    const covered = new Array(tokens.length).fill(false);
    for (const segment of segments) if (segment.lesson <= limit) for (let k = segment.from; k <= segment.to; k++) covered[k] = true;
    return covered;
  };
  const vocabLesson = Array.from({ length: 25 }, (_, k) => k + 1).find((limit) => {
    const covered = covers(limit);
    return tokens.every((_, k) => !needs[k] || covered[k]);
  });
  if (vocabLesson === undefined) {
    const covered = covers(25);
    const missing = tokens.findIndex((_, k) => needs[k] && !covered[k]);
    return { reject: `từ ngoài vocab: ${tokens[missing].surface_form} (${tokens[missing].basic_form})` };
  }
  minimumLesson = Math.max(minimumLesson, vocabLesson);
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].pos === '動詞' && tokens[i].pos_detail_1 !== '非自立') minimumLesson = Math.max(minimumLesson, formLesson(tokens[i], tokens[i + 1]));
  }

  // Từ khóa: đoạn dài trước, không chồng nhau; mỗi từ vựng một lần; động từ/tính từ kéo theo đuôi chia.
  const matches = [];
  for (const segment of segments.filter((item) => item.lesson <= vocabLesson).sort((a, b) => (b.to - b.from) - (a.to - a.from) || a.from - b.from)) {
    if (!matches.some((chosen) => segment.from <= chosen.to && chosen.from <= segment.to)) matches.push(segment);
  }
  matches.sort((a, b) => a.from - b.from);
  // Trợ từ, こと/とき/の, ない nằm trong một cụm từ vựng (ひらがな bị tách thành ひ|ら|が|な) không phải ngữ pháp.
  for (let i = 0; i < tokens.length; i++) {
    if (matches.some((match) => match.from < match.to && match.from <= i && i <= match.to)) continue;
    if (tokens[i].pos === '助詞') {
      if (!particleFloor.has(tokens[i].basic_form)) return { reject: `trợ từ chưa có mốc: ${tokens[i].surface_form}` };
      floors[i] = particleFloor.get(tokens[i].basic_form);
    }
    minimumLesson = Math.max(minimumLesson, floors[i]);
  }
  const keywords = [];
  const seen = new Set();
  for (const match of matches) {
    // Động từ/tính từ trong vocab chỉ khớp token cùng từ loại: あれ (感動詞) không phải dạng chia của ある. Không chắc thì bỏ từ khóa.
    const sameClass = (entry) => { const pos = ENTRY_POS[entry.word.type]; return !pos || tokens[match.to].pos === pos || (pos === '動詞' && tokens[match.to].pos === '名詞' && wordForms(entry.word.word).some((form) => form.endsWith('する'))); };
    const hits = match.entries.filter((entry) => entry.lesson <= vocabLesson && sameClass(entry)).map((entry) => ({ entry, vi: matchVi(entry.word.meaning.vi, vi) }));
    if (!hits.length) continue;
    const { entry, vi: viHit } = hits.find((hit) => hit.vi) ?? hits[0];
    const ref = `${entry.lesson}:${entry.id}`;
    if (seen.has(ref)) continue;
    let last = match.to;
    if (conjugating(tokens[last])) {
      while (tokens[last + 1] && (tokens[last + 1].pos === '助動詞' && !['です', 'だ'].includes(tokens[last + 1].basic_form)
        || (tokens[last + 1].pos === '助詞' && ['て', 'で'].includes(tokens[last + 1].surface_form) && tokens[last].pos === '動詞'))) last++;
    }
    // Động từ trơ trọi ở dạng mệnh lệnh/giả định (あれ ở câu cảm thán) không chắc là dạng chia của động từ đó.
    if (ENTRY_POS[entry.word.type] === '動詞' && tokens[last].pos === '動詞' && last === match.to && /^(命令|仮定)/u.test(tokens[last].conjugated_form)) continue;
    const { start, end } = spanOf(match.from, last);
    // Furigana gắn cho cả cụm chữ Hán (千円[せんえん]); từ khóa cắt giữa cụm không có cách đọc đúng nên bỏ.
    if ((start > 0 && KANJI.test(jp[start]) && KANJI.test(jp[start - 1])) || (end < jp.length && KANJI.test(jp[end - 1]) && KANJI.test(jp[end]))) continue;
    // Từ vựng là cả câu (信号を右へ曲がってください) thì không gợi ý được gì.
    if (compact(jp.slice(start, end)).length >= compact(jp.replace(/[。？！」「]/gu, '')).length) continue;
    const keyword = { ref, jp: jp.slice(start, end) };
    if (viHit) keyword.vi = viHit;
    keywords.push(keyword);
    seen.add(ref);
  }
  // Tối đa 4: ưu tiên từ có cụm Việt tương ứng, giữ thứ tự trong câu.
  const kept = [...keywords.keys()].sort((a, b) => Number('vi' in keywords[b]) - Number('vi' in keywords[a]) || a - b).slice(0, 4).sort((a, b) => a - b);
  return { minimumLesson, keywords: kept.map((index) => keywords[index]), names };
}

export function buildTranslation() {
  const rejected = [];
  const sentences = [];
  const grammarKeys = new Set();
  const seenKeys = new Map();
  const dupes = { grammar: 0, vocab: 0, vocabAgainstGrammar: 0 };
  const id2 = (n) => String(n).padStart(2, '0');

  for (const lesson of lessons) {
    for (const point of lesson.grammar) {
      point.examples.forEach((example, exampleIndex) => {
        const key = compact(example.jp);
        grammarKeys.add(key);
        const id = `g-l${id2(lesson.number)}-${point.id}-${exampleIndex}`;
        if (seenKeys.has(key)) { dupes.grammar++; rejected.push({ id, jp: example.jp, reason: `trùng ${seenKeys.get(key)}` }); return; }
        const result = analyze(example.jp, example.translation.vi, lesson.number);
        if (result.reject) { rejected.push({ id, jp: example.jp, reason: result.reject }); return; }
        seenKeys.set(key, id);
        sentences.push({
          id,
          source: { kind: 'grammar', lesson: lesson.number, grammarId: point.id, exampleIndex },
          jp: example.jp,
          vi: example.translation.vi,
          minimumLesson: result.minimumLesson,
          keywords: result.keywords,
          snapshot: fingerprint({ jp: example.jp, vi: example.translation.vi, pattern: point.pattern, explanation: point.explanation }),
          names: result.names,
        });
      });
    }
  }
  const grammarCount = sentences.length;
  vocabByLesson.forEach((words, i) => {
    for (const word of words) {
      if (!word.example) continue;
      const { jp, translation } = word.example;
      const id = `v-l${id2(i + 1)}-${word.id}`;
      const key = compact(jp);
      if (grammarKeys.has(key)) { dupes.vocabAgainstGrammar++; rejected.push({ id, jp, reason: 'trùng ví dụ ngữ pháp' }); continue; }
      if (seenKeys.has(key)) { dupes.vocab++; rejected.push({ id, jp, reason: `trùng ${seenKeys.get(key)}` }); continue; }
      const result = analyze(jp, translation.vi, i + 1);
      if (result.reject) { rejected.push({ id, jp, reason: result.reject }); continue; }
      seenKeys.set(key, id);
      sentences.push({
        id,
        source: { kind: 'vocab', lesson: i + 1, wordId: word.id },
        jp,
        vi: translation.vi,
        minimumLesson: result.minimumLesson,
        keywords: result.keywords,
        snapshot: fingerprint({ jp, vi: translation.vi }),
        names: result.names,
      });
    }
  });

  const names = sentences.filter((sentence) => sentence.names.length).map((sentence) => ({ id: sentence.id, jp: sentence.jp, names: sentence.names }));
  const properNames = [...new Set(names.flatMap((item) => item.names))].sort();
  for (const sentence of sentences) delete sentence.names;
  return { output: { version: '2026-10-27-v1', properNames, sentences }, log: { grammarCount, total: sentences.length, dupes, names, rejected } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { output, log } = buildTranslation();
  // Mỗi câu một dòng: diff gọn, file nhỏ hơn nhiều so với thụt dòng đầy đủ.
  const lines = output.sentences.map((sentence) => `    ${JSON.stringify(sentence)}`).join(',\n');
  writeFileSync(path.join(data, 'translation.json'), `{\n  "version": ${JSON.stringify(output.version)},\n  "properNames": ${JSON.stringify(output.properNames)},\n  "sentences": [\n${lines}\n  ]\n}\n`);
  writeFileSync(path.join(root, '.work/20261027-translation-reflex/build-log.json'), `${JSON.stringify(log, null, 2)}\n`);
  console.log({ grammarCount: log.grammarCount, vocabCount: log.total - log.grammarCount, dupes: log.dupes, rejected: log.rejected.length, names: log.names.length });
}
