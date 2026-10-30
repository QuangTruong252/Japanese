// Kiểm và phát hành bài Luyện đọc (docs/data/reading.md).
//   node scripts/build-reading.mjs check <draft.json...>    lớp 1: schema, anchor, coverage, tín hiệu ngữ pháp, thống kê đáp án
//   node scripts/build-reading.mjs release <draft.json...>  ghép bài đủ 5 lớp duyệt vào web/src/data/n5/reading.json (--out <file> để ghi nơi khác); bỏ trường chỉ dùng cho biên tập
// Tokenizer chỉ đề xuất; danh sách vocabUsed/grammarUsed và glossary do người soạn khai báo và duyệt.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const web = path.join(root, 'web');
const data = path.join(web, 'src/data/n5');
export const DEFAULT_OUT = path.join(data, 'reading.json');

const KANJI_CHARS = '一-鿿㐀-䶿々〆〇ヶ';
const KANJI_RUN_WITH_READING = new RegExp(`([${KANJI_CHARS}]+)\\[([^\\]]+)\\]`, 'gu');
const NOT_AFTER_KANJI_BRACKET = new RegExp(`(?<![${KANJI_CHARS}])\\[([^\\]]+)\\]`, 'gu');
const KANJI = new RegExp(`[${KANJI_CHARS}]`, 'u');
const hira = (text) => text.replace(/[ァ-ヶ]/gu, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
// Cùng kết quả với stripFurigana + formatOptionalBrackets của lib/japanese.ts (anchor tính trên văn bản này).
export const displayText = (jp) => jp.replace(KANJI_RUN_WITH_READING, '$1').replace(NOT_AFTER_KANJI_BRACKET, '($1)');

/** Các khoảng [start, end) của chữ Hán mang furigana trong displayText(jp): anchor không được cắt vào giữa. */
export function rubyRanges(jp) {
  const ranges = [];
  let removed = 0;
  for (const m of jp.matchAll(KANJI_RUN_WITH_READING)) {
    const start = m.index - removed;
    ranges.push([start, start + m[1].length]);
    removed += m[0].length - m[1].length;
  }
  return ranges;
}

const readJson = (file) => JSON.parse(readFileSync(path.join(data, file), 'utf8'));
const pad = (n) => String(n).padStart(2, '0');

// ---------- coverage ----------

const lessonOf = (id) => {
  const head = String(id).split(':')[0];
  return /^\d+$/u.test(head) ? Number(head) : null;
};

const bucket = (items) => {
  const types = new Map(items.map((item) => [item.id, item]));
  const byLesson = {};
  let unknownTypes = 0;
  for (const item of types.values()) {
    const lesson = item.lesson === undefined ? lessonOf(item.id) : item.lesson;
    if (lesson === null) unknownTypes += 1;
    else byLesson[lesson] = (byLesson[lesson] ?? 0) + 1;
  }
  return { totalTypes: types.size, byLesson, unknownTypes };
};

/** Tính lại coverage từ danh sách đã duyệt; vocabUsed có `lesson`, grammarUsed lấy bài từ tiền tố ID (`external:*` = chưa ánh xạ). */
export const computeCoverage = (passage) => ({
  version: 2,
  vocab: bucket(passage.vocabUsed ?? []),
  grammar: bucket(passage.grammarUsed ?? []),
});

const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------- dữ liệu nguồn ----------

/** Cách viết của từ vựng: [お]ふろ = おふろ/ふろ, "A／B", "A・B", （…）; [〜を] chỉ là ghi chú. */
export function wordForms(text) {
  const optionals = [...text.replace(KANJI_RUN_WITH_READING, '$1').matchAll(/\[([^\]]*)\]/gu)].map((m) => m[1]);
  const plains = optionals.reduce(
    (forms, inner) => forms.flatMap((form) => [form.replace(`[${inner}]`, ''), ...(inner.includes('〜') ? [] : [form.replace(`[${inner}]`, inner)])]),
    [text.replace(KANJI_RUN_WITH_READING, '$1')],
  );
  return plains.flatMap((plain) => {
    const inner = [...plain.matchAll(/[（(]([^）)]*)[）)]/gu)].map((m) => m[1]);
    return [plain.replace(/[（(][^）)]*[）)]/gu, ''), ...inner].flatMap((part) => part.split(/[／・]/u));
  }).map((form) => form.replace(/[〜～…、。？！\s　]/gu, '')).filter(Boolean);
}

let sourceCache;
export function loadSource() {
  if (sourceCache) return sourceCache;
  const lessons = Array.from({ length: 25 }, (_, i) => readJson(`lessons/lesson-${pad(i + 1)}.json`));
  const vocab = Array.from({ length: 25 }, (_, i) => readJson(`vocab/lesson-${pad(i + 1)}.json`).words);
  const grammar = new Map(lessons.flatMap((l) => l.grammar.map((g) => [`${l.number}:${g.id}`, g])));
  const words = new Map(vocab.flatMap((list, i) => list.map((w, index) => [`${i + 1}:${w.id}`, { ...w, lesson: i + 1, index }])));
  // Dạng viết/đọc -> các từ vựng (bài thấp nhất đứng đầu); chỉ để đề xuất, kết quả thật do người soạn khai báo.
  const lexicon = new Map();
  const readings = new Map();
  const phrases = [];
  for (const w of words.values()) {
    const kana = [...wordForms(w.kana).map(hira), ...(w.verbForms?.dictionaryKana ? wordForms(w.verbForms.dictionaryKana) : [])];
    readings.set(w, new Set(kana));
    const forms = [...wordForms(w.word), ...kana,
      ...(w.verbForms ? [w.verbForms.dictionary, w.verbForms.dictionaryKana].filter(Boolean).flatMap(wordForms) : [])];
    for (const form of forms) {
      for (const key of form.length > 2 && form.endsWith('する') ? [form, form.slice(0, -2)] : [form]) {
        const list = lexicon.get(key) ?? [];
        if (!list.includes(w)) list.push(w);
        lexicon.set(key, list);
      }
    }
    // Cụm cố định (expression) và trạng từ gắn に/で (いっしょに, 次に) neo trọn cụm; mẫu có 〜 chỉ là khung nên không dùng.
    const bare = w.word.replace(KANJI_RUN_WITH_READING, '$1').replace(/\[[^\]]*\]/gu, '');
    if ((w.type === 'expression' || w.type === 'adverb') && !bare.includes('〜')) {
      for (const key of new Set(forms)) {
        if ((w.type === 'expression' && key.length >= 3) || (w.type === 'adverb' && key.length >= 2 && /[にで]$/u.test(key))) phrases.push({ key, w });
      }
    }
  }
  phrases.sort((a, b) => b.key.length - a.key.length);
  const properNames = new Set(readJson('translation.json').properNames);
  sourceCache = { lessons, vocab, grammar, words, lexicon, readings, phrases, properNames };
  return sourceCache;
}

let tokenizerCache;
export async function getTokenizer() {
  if (tokenizerCache) return tokenizerCache;
  const webRequire = createRequire(path.join(web, 'package.json'));
  const kuromoji = webRequire('kuromoji');
  const dicPath = path.join(path.dirname(webRequire.resolve('kuromoji/package.json')), 'dict');
  tokenizerCache = await new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath }).build((error, built) => (error ? reject(error) : resolve(built)));
  });
  return tokenizerCache;
}

// ---------- phân tích câu ----------

const BARRIER = new Set(['助詞', '助動詞', '記号']);
// kuromoji đoán nhầm gốc động từ (行った → 行う): sinh thêm ứng viên từ phần thân.
const ENDINGS = { っ: 'うつるく', ん: 'ぬぶむ', い: 'くぐ', し: 'す', き: 'く', ぎ: 'ぐ', み: 'む', び: 'ぶ', り: 'る', ち: 'つ', に: 'ぬ', じ: 'ぶ' };
const verbCandidates = (t) => (t.pos === '動詞' ? [...(ENDINGS[t.surface_form.slice(-1)] ?? '')].map((e) => t.surface_form.slice(0, -1) + e).concat(t.surface_form + 'る') : []);
const isNumber = (t) => /^[0-9０-９]+$/u.test(t.surface_form) || t.pos_detail_1 === '数';
// Tiền tố, hậu tố đứng riêng, động từ/tính từ phụ (ている, てください, ない): thuộc mẫu ngữ pháp, không cần glossary từ.
const isFunctional = (t) => isNumber(t) || t.pos === '接頭詞' || t.pos_detail_1 === '接尾'
  || ((t.pos === '動詞' || t.pos === '形容詞') && t.pos_detail_1 === '非自立');
const COPULA = new Set(['です', 'だ']);
const TE_ENDINGS = new Set(['て', 'で', 'ても', 'でも', 'たり', 'だり']);
const COMPACT_SKIP = /[\s　、。？！「」・]/u;

/** Từ vựng đề xuất cho một token: nhiều từ cùng dạng viết thì chọn từ có cách đọc trùng cách đọc của token (人 → ひと, không phải じん). */
function pickWord(lexicon, readings, keys, reading) {
  for (const key of keys.filter(Boolean)) {
    const list = lexicon.get(key);
    if (list) return (reading && list.find((w) => readings.get(w).has(reading))) || list[0];
  }
  return null;
}

/**
 * Tách displayText của một câu thành các đơn vị từ {start, end, surface, kind, match} (UTF-16, nửa mở); anchor phải phủ trọn đơn vị.
 * - `phrase`: cụm cố định của vocab (お願いします, お探しですか, いっしょに…); `word`: danh từ/tính từ/động từ trọn thân + đuôi
 *   (行きました, 待っていて, 確認して); `number`: số + lượng từ (三人, 七時ごろ, 一万二千円); `name`: tên riêng (names + properNames).
 * - `match` là từ vựng đề xuất (null nếu không thấy). `inherent` = từ chức năng (こと, の, ほう, ありません sau じゃ) nằm trong
 *   một mẫu ngữ pháp đã khai báo (`covered` = các khoảng [start, end) của anchor ngữ pháp): không đếm như từ vựng mới.
 * - `ruby` = rubyRanges(jp): đơn vị chạm vào một cụm ruby được nới để phủ trọn cụm đó.
 */
export function contentUnits(tokenizer, text, { lexicon, readings, phrases, properNames }, extraNames = [], { ruby = [], covered = [] } = {}) {
  let pos = 0;
  const tokens = tokenizer.tokenize(text).map((t) => {
    const start = pos;
    pos += t.surface_form.length;
    return { ...t, start, end: pos };
  }).filter((t) => !/^\s+$/u.test(t.surface_form));
  const starts = new Set(tokens.map((t) => t.start));
  const ends = new Set(tokens.map((t) => t.end));
  const cands = [];
  const add = (c) => cands.push({ basic: '', match: null, ...c });

  for (const name of new Set([...properNames, ...extraNames])) {
    for (let at = text.indexOf(name); at >= 0; at = text.indexOf(name, at + 1)) add({ start: at, end: at + name.length, kind: 'name', rank: 0 });
  }

  const compact = [];
  [...text].forEach((ch, i) => { if (!COMPACT_SKIP.test(ch)) compact.push(i); });
  const compactText = compact.map((i) => text[i]).join('');
  for (const { key, w } of phrases) {
    for (let at = compactText.indexOf(key); at >= 0; at = compactText.indexOf(key, at + 1)) {
      const start = compact[at];
      const end = compact[at + key.length - 1] + 1;
      if (starts.has(start) && ends.has(end)) add({ start, end, kind: 'phrase', match: w, rank: 1 });
    }
  }

  // Mở rộng hết phần biến cách: trợ động từ (ます, た, ない…), て/たり + động từ phụ (ている, てください).
  const chainEnd = (from) => {
    let j = from;
    for (;;) {
      const n = tokens[j + 1];
      if (!n) return j;
      const isTe = n.pos === '助詞' && n.pos_detail_1 === '接続助詞' && TE_ENDINGS.has(n.surface_form);
      const afterTe = tokens[j].pos === '助詞' && TE_ENDINGS.has(tokens[j].surface_form);
      if ((n.pos === '助動詞' && !COPULA.has(n.basic_form)) || isTe || (afterTe && n.pos === '動詞' && n.pos_detail_1 === '非自立')) j += 1;
      else return j;
    }
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const next = tokens[i + 1];
    if (BARRIER.has(t.pos)) continue;
    const plain = t.surface_form === t.basic_form;
    const keys = [t.basic_form, t.surface_form, t.reading && hira(t.reading), ...verbCandidates(t)];
    const word = () => pickWord(lexicon, readings, keys, plain && t.reading ? hira(t.reading) : null);
    if (isNumber(t) || (t.surface_form === '何' && next?.pos_detail_1 === '接尾')) {
      let j = i;
      while (tokens[j + 1] && isNumber(tokens[j + 1])) j += 1;
      while (tokens[j + 1]?.pos_detail_1 === '接尾') j += 1;
      const surface = text.slice(t.start, tokens[j].end);
      add({ start: t.start, end: tokens[j].end, kind: 'number', match: pickWord(lexicon, readings, [surface]), basic: surface, rank: 2 });
      i = j;
    } else if (t.pos === '動詞' && t.pos_detail_1 !== '非自立') {
      const j = chainEnd(i);
      const before = tokens[i - 1]?.surface_form;
      const copulaNeg = t.basic_form === 'ある' && (before === 'じゃ' || (before === 'は' && tokens[i - 2]?.surface_form === 'で'));
      add({ start: t.start, end: tokens[j].end, kind: 'word', match: word(), basic: t.basic_form, rank: 2, ...(copulaNeg ? { tag: 'copula-neg' } : {}) });
      i = j;
    } else if (t.pos === '名詞' && t.pos_detail_1 === 'サ変接続' && next?.pos === '動詞' && next.basic_form === 'する') {
      const j = chainEnd(i + 1);
      add({ start: t.start, end: tokens[j].end, kind: 'word', match: word(), basic: t.basic_form, rank: 2 });
      i = j;
    } else if (t.pos === '形容詞' && t.pos_detail_1 !== '非自立') {
      const j = chainEnd(i);
      add({ start: t.start, end: tokens[j].end, kind: 'word', match: word(), basic: t.basic_form, rank: 2 });
      i = j;
    } else {
      // Ghép tối đa 3 token liền nhau để khớp từ ghép (会社員, 郵便局) trước khi xét từng token.
      let match = null;
      let width = 1;
      for (let n = Math.min(3, tokens.length - i); n >= 1 && !match; n--) {
        if (n === 1 && isFunctional(t)) break;
        const seg = tokens.slice(i, i + n);
        if (seg.some((s) => BARRIER.has(s.pos))) continue;
        const surf = seg.map((s) => s.surface_form).join('');
        const found = n === 1 ? word() : pickWord(lexicon, readings, [surf, seg.slice(0, -1).map((s) => s.surface_form).join('') + seg.at(-1).basic_form]);
        if (found) { match = found; width = n; }
      }
      if (!match && isFunctional(t)) continue;
      const tag = t.pos === '名詞' && t.pos_detail_1 === '非自立' ? { tag: 'function-noun' } : {};
      add({ start: t.start, end: tokens[i + width - 1].end, kind: 'word', match, basic: t.basic_form, rank: 2, ...tag });
      i += width - 1;
    }
  }

  // Chọn đơn vị dài nhất, hòa thì tên > cụm > từ; token nằm trong đơn vị đã chọn bị bỏ.
  const chosen = [];
  for (const c of [...cands].sort((a, b) => (b.end - b.start) - (a.end - a.start) || a.rank - b.rank || a.start - b.start)) {
    if (!chosen.some((u) => c.start < u.end && c.end > u.start)) chosen.push(c);
  }
  chosen.sort((a, b) => a.start - b.start);

  // Đơn vị chạm vào cụm ruby thì phủ trọn cụm ruby; đơn vị chồng nhau sau khi nới được gộp.
  const units = [];
  for (const u of chosen) {
    for (const [rs, re] of ruby) {
      if (u.start < re && u.end > rs) { u.start = Math.min(u.start, rs); u.end = Math.max(u.end, re); }
    }
    const prev = units.at(-1);
    if (prev && u.start < prev.end) prev.end = Math.max(prev.end, u.end);
    else units.push(u);
  }
  return units.map((u) => ({
    ...u, surface: text.slice(u.start, u.end),
    inherent: Boolean(u.tag) && covered.some(([a, b]) => a <= u.start && b >= u.end),
  }));
}

// ---------- tín hiệu ngữ pháp ----------

/**
 * Mẫu (ID `<bài>:<id>` trong lessons) mà một tín hiệu có thể là dấu hiệu của; khai báo một trong số đó là đủ.
 * Chỉ để liệt kê "có tín hiệu nhưng chưa khai báo"; điều kiện lỗi vẫn là "cùng bài" ở checkDraft.
 */
export const SIGNAL_IDS = {
  masu: ['4:verbos-masu'], mashou: ['6:mashou'], 'masen-ka': ['6:masen-ka'], tai: ['13:tai-desu'], 'nai-form': ['17:forma-nai'],
  'nai-to': ['21:nai-to'], 'ta-form': ['19:forma-ta'], 'ta-koto-ga-aru': ['19:ta-koto-ga-arimasu'], tari: ['19:tari-tari'],
  'adj-past': ['12:pasado-adjetivo-i'], 'noun-past': ['12:pasado-nominal'], 'te-form': ['14:forma-te', '14:grupos-verbos'],
  'te-kudasai': ['14:te-kudasai', '14:sumimasen-ga'], 'te-imasu': ['14:te-imasu', '15:te-imasu-estado', '15:te-imasu-habitual'],
  'temo-ii': ['15:temo-ii'], 'tewa-ikemasen': ['15:tewa-ikemasen'], 'te-kara': ['16:te-kara'], 'adj-te': ['16:te-encadenar'],
  'te-encadenar': ['16:te-encadenar'], 'te-agemasu': ['24:te-agemasu'], 'te-moraimasu': ['24:te-moraimasu', '24:te-kuremasu'], 'te-kuremasu': ['24:te-kuremasu', '24:wa-ga-v'],
  temo: ['25:temo'], 'to-omou-iu': ['21:to-omoimasu', '21:to-iimasu'], deshou: ['21:deshou'], 'koto-ga-dekiru': ['18:dekimasu'],
  'mae-ni': ['18:mae-ni'], toki: ['23:toki', '23:toki-aspecto'], 'to-cond': ['23:to-condicional'], 'rentai-modifier': ['22:oracion-modificadora', '22:v-dicc-tiempo'],
  'plain-final': ['20:estilos', '20:uso-estilos', '20:conversacion-informal'], 'kara-reason': ['9:kara-causa'], yori: ['12:yori'], tara: ['25:tara', '25:tara-temporal'],
  naru: ['19:narimasu'], 'ni-iku': ['13:ni-ikimasu'], 'gurai-dake': ['11:gurai-dake'], 'made-ni': ['17:made-ni'], 'nai-nakereba': ['17:nakereba-narimasen', '17:nakutemo-ii', '17:naide-kudasai'],
  'kara-made': ['4:kara-made'], 'ni-time': ['4:ni-tiempo'], 'to-noun': ['4:to', '5:to-persona'], 'e-iku': ['5:e-ikimasu'], 'o-object': ['6:o-transitivo', '6:o-shimasu', '16:o-salir', '23:o-movimiento'],
  'de-particle': ['6:de-lugar', '7:de-instrumento', '5:de-vehiculo', '21:de-lugar-evento'], 'ga-but': ['8:ga-pero'], 'totemo-amari': ['8:totemo-amari'], 'dou-desu-ka': ['8:dou-desu-ka'], donna: ['8:donna', '9:donna-9'],
  'ga-object': ['9:ga-objeto', '10:arimasu-imasu', '14:ga-fenomeno', '16:wa-ga', '23:ga-adjetivo', '13:hoshii', '18:dekimasu'], doushite: ['9:doushite'],
  'ni-lugar': ['10:ni-lugar', '10:wa-ni-arimasu'], 'ya-nado': ['10:ya-nado'], position: ['10:posiciones'], quantifier: ['11:numerales', '11:uso-cuantificador'], 'kai-count': ['11:duracion-kai'],
  hoshii: ['13:hoshii'], 'dokoka-nanika': ['13:dokoka-nanika'], ichiban: ['12:ichiban'], 'dochira-ga': ['12:dochira-ga'], 'ageru-morau-kureru': ['7:agemasu', '7:moraimasu', '24:kuremasu'],
  mou: ['7:mou-mashita'], dekimasu: ['18:dekimasu'], shumi: ['18:shumi'], nakanaka: ['18:nakanaka'], zehi: ['18:zehi'], 'demo-nomimasen-ka': ['21:demo-nomimasen-ka'], moshi: ['25:moshi'],
  'mashou-ka': ['14:mashou-ka', '22:mashou-ka-22'], 'sentence-ne': ['4:ne', '5:sou-desu-ne', '8:sou-desu-ne-8'], 'sentence-yo': ['5:yo'], 'sou-desu': ['2:sou-desu', '2:sou-desu-ka', '5:sou-desu-ne', '8:sou-desu-ne-8'],
  demonstrative: ['2:kore-sore-are', '2:kono-sono-ano', '3:ko-so-a-do', '16:dore-dono'], 'place-demonstrative': ['3:koko-soko-asoko', '3:ko-so-a-do', '3:wa-lugar-desu', '3:doko-dochira'],
  clock: ['4:ima-nanji'], 'no-genitive': ['1:no', '2:no-posesion', '3:no-origen', '2:no-sustituto', '12:no-sustituto-12'], mo: ['1:mo', '5:doko-mo'],
};
/** Tín hiệu từ vựng/trợ từ phổ biến: không bao giờ gây lỗi (không có điều kiện "cùng bài"), chỉ vào danh sách "chưa khai báo". */
const ADVISORY = new Set(['kara-made', 'ni-time', 'to-noun', 'e-iku', 'o-object', 'de-particle', 'ga-but', 'totemo-amari', 'dou-desu-ka', 'donna', 'ga-object', 'doushite', 'ni-lugar', 'ya-nado', 'position', 'quantifier', 'kai-count', 'hoshii', 'dokoka-nanika', 'ichiban', 'dochira-ga', 'ageru-morau-kureru', 'mou', 'dekimasu', 'shumi', 'nakanaka', 'zehi', 'demo-nomimasen-ka', 'moshi', 'mashou-ka', 'sentence-ne', 'sentence-yo', 'sou-desu', 'demonstrative', 'place-demonstrative', 'clock', 'no-genitive', 'mo', 'te-encadenar']);

/** Trả về [{rule, lesson, ids, advisory}] cho các hình thái động từ/tính từ và cấu trúc đặc trưng từng bài; chỉ là dấu hiệu cần đối chiếu. */
export function grammarSignals(tokenizer, text) {
  const T = tokenizer.tokenize(text).filter((t) => !/^\s*$/u.test(t.surface_form));
  const hits = [];
  const hit = (rule, lesson) => hits.push({ rule, lesson });
  const blank = { surface_form: '', basic_form: '', pos: '', pos_detail_1: '' };
  const at = (i) => T[i] ?? blank;
  const verb = (t) => t.pos === '動詞';
  for (let i = 0; i < T.length; i++) {
    const t = T[i], p = at(i - 1), n = at(i + 1), n2 = at(i + 2), sf = t.surface_form;
    // じゃありません/ではありません là dạng cố định của bài 1, không tính thể ます.
    if (t.basic_form === 'ます' && !(p.basic_form === 'ある' && /^(じゃ|は|で)$/u.test(at(i - 2).surface_form))) hit('masu', 4);
    if (sf === 'まし' && n.surface_form === 'ょ') hit('mashou', 6);
    if (t.basic_form === 'ます' && sf === 'ませ' && n.surface_form === 'ん' && n2.surface_form === 'か') hit('masen-ka', 6);
    if (t.pos === '助動詞' && t.basic_form === 'たい' && verb(p)) hit('tai', 13);
    if (sf === 'ない' && t.pos === '助動詞' && verb(p)) { hit('nai-form', 17); if (n.surface_form === 'と' && !n2.surface_form) hit('nai-to', 21); }
    if (t.pos === '助動詞' && sf === 'た' && verb(p)) {
      hit('ta-form', 19);
      if (n.surface_form === 'こと' && n2.surface_form === 'が') hit('ta-koto-ga-aru', 19);
    }
    if (sf === 'たり' && verb(p)) hit('tari', 19);
    if (t.pos === '助動詞' && sf === 'た' && p.pos === '形容詞') hit('adj-past', 12);
    if ((sf === 'でし' || sf === 'でした') && p.pos === '名詞') hit('noun-past', 12);
    if (t.pos === '助詞' && t.pos_detail_1 === '接続助詞' && (sf === 'て' || sf === 'で')) {
      if (verb(p)) {
        hit('te-form', 14);
        if (n.surface_form.startsWith('くださ')) hit('te-kudasai', 14);
        if (n.basic_form === 'いる' || n.basic_form === 'いらっしゃる') hit('te-imasu', 14);
        if (n.surface_form === 'も' && n2.basic_form === 'いい') hit('temo-ii', 15);
        if (n.surface_form === 'は' && n2.basic_form === 'いける') hit('tewa-ikemasen', 15);
        if (n.surface_form === 'から') hit('te-kara', 16);
        if (['あげる', 'もらう', 'くれる'].includes(n.basic_form)) hit(`te-${n.basic_form}`, 24);
      } else if (p.pos === '形容詞') hit('adj-te', 16);
    }
    if (t.pos === '助詞' && sf === 'ても') hit('temo', 25);
    if (sf === 'と' && t.pos === '助詞' && ['思う', '言う'].includes(n.basic_form)) hit('to-omou-iu', 21);
    if (sf === 'でしょ') hit('deshou', 21);
    if (verb(p) && sf === 'こと' && n.surface_form === 'が' && n2.basic_form === 'できる') hit('koto-ga-dekiru', 18);
    if (verb(p) && p.conjugated_form === '基本形' && sf === 'まえ') hit('mae-ni', 18);
    if (t.pos_detail_1 === '非自立' && sf === 'とき') hit('toki', 23);
    if (sf === 'と' && t.pos === '助詞' && t.pos_detail_1 === '接続助詞' && verb(p)) hit('to-cond', 23);
    if (verb(t) && t.conjugated_form === '基本形') {
      if (n.pos === '名詞' && n.pos_detail_1 !== '非自立') hit('rentai-modifier', 22);
      else if (!n.surface_form || n.pos === '記号') hit('plain-final', 20);
    }
    if (sf === 'から' && t.pos === '助詞' && t.pos_detail_1 === '接続助詞') hit('kara-reason', 9);
    if (sf === 'より' && t.pos === '助詞') hit('yori', 12);
    if (sf === 'たら' && (t.pos === '助動詞' || t.pos === '助詞')) hit('tara', 25);
    if ((p.pos === '形容詞' && p.conjugated_form === '連用テ接続' && n.basic_form === 'なる' && sf === 'く') || (sf === 'に' && p.pos === '名詞' && n.basic_form === 'なる')) hit('naru', 19);
    if (sf === 'に' && p.pos === '動詞' && p.conjugated_form === '連用形' && ['行く', '来る', '帰る'].includes(n.basic_form)) hit('ni-iku', 13);
    if (['だけ', 'ぐらい', 'くらい'].includes(sf) && t.pos === '助詞') hit('gurai-dake', 11);
    if (sf === 'まで' && n.surface_form === 'に') hit('made-ni', 17);
    // Tín hiệu từ vựng/trợ từ (advisory): nhắc người soạn khai báo mẫu đi kèm, không phải kết luận.
    const aux = (x) => x.pos === '動詞' && x.pos_detail_1 === '非自立';
    const ahead = (fn, span = 3) => [1, 2, 3].slice(0, span).some((k) => fn(at(i + k)));
    const isTime = p.pos_detail_1 === '副詞可能' || (p.pos_detail_1 === '接尾' && /^(時|分|曜日|月|年|半)$/u.test(p.surface_form)) || (isNumber(p) && n.pos === '動詞');
    if (t.pos === '助詞' && sf === 'から' && T.some((x) => x.pos === '助詞' && x.surface_form === 'まで')) hit('kara-made', 4);
    if (t.pos === '助詞' && sf === 'に' && isTime) hit('ni-time', 4);
    if (t.pos === '助詞' && t.pos_detail_1 === '並立助詞' && sf === 'と') hit('to-noun', 4);
    if (t.pos === '助詞' && t.pos_detail_1 === '格助詞' && sf === 'と' && n.pos === '動詞' && !['思う', '言う'].includes(n.basic_form)) hit('to-noun', 5);
    if (sf === 'へ' && t.pos === '助詞' && ahead((x) => ['行く', '来る', '帰る'].includes(x.basic_form))) hit('e-iku', 5);
    if (sf === 'を' && t.pos === '助詞') hit('o-object', 6);
    if (sf === 'で' && t.pos === '助詞' && t.pos_detail_1 === '格助詞') hit('de-particle', 6);
    if (sf === 'が' && t.pos === '助詞' && t.pos_detail_1 === '接続助詞') hit('ga-but', 8);
    if (['とても', 'あまり'].includes(sf)) hit('totemo-amari', 8);
    if (sf === 'どう' && n.basic_form === 'です') hit('dou-desu-ka', 8);
    if (sf === 'どんな') hit('donna', 8);
    if (sf === 'が' && t.pos_detail_1 === '格助詞' && (['あり', 'い', 'わかり', 'でき'].includes(n.surface_form) || ['好き', '嫌い', '上手', '下手', '大きい', '小さい', '欲しい', 'ほしい'].includes(n.basic_form))) hit('ga-object', 9);
    if (sf === 'どうして') hit('doushite', 9);
    if (sf === 'に' && t.pos === '助詞' && ahead((x) => ['ある', 'いる'].includes(x.basic_form), 2)) hit('ni-lugar', 10);
    if (sf === 'や' && t.pos === '助詞') hit('ya-nado', 10);
    if (sf === 'の' && ['上', '下', '前', '後ろ', '右', '左', '中', '外', '隣', '近く', '間'].includes(n.surface_form)) hit('position', 10);
    if (t.pos_detail_1 === '接尾' && /^(人|台|枚|つ|冊|個|杯|歳)$/u.test(sf)) hit('quantifier', 11);
    if (sf === '回' && t.pos_detail_1 === '接尾') hit('kai-count', 11);
    if (['欲しい', 'ほしい'].includes(t.basic_form)) hit('hoshii', 13);
    if ((sf === 'どこ' || sf === '何') && n.surface_form === 'か') hit('dokoka-nanika', 13);
    if (sf === 'いちばん' || sf === '一番') hit('ichiban', 12);
    if (sf === 'どちら' && n.surface_form === 'が') hit('dochira-ga', 12);
    if (['あげる', 'もらう', 'くれる', '貸す', '借りる', '教える', '習う'].includes(t.basic_form) && !(p.pos === '助詞' && TE_ENDINGS.has(p.surface_form))) hit('ageru-morau-kureru', 7);
    if (sf === 'もう') hit('mou', 7);
    if (t.basic_form === 'できる') hit('dekimasu', 18);
    if (sf === '趣味') hit('shumi', 18);
    if (sf === 'なかなか') hit('nakanaka', 18);
    if (sf === 'ぜひ') hit('zehi', 18);
    if (sf === 'でも' && t.pos === '助詞' && t.pos_detail_1 === '副助詞') hit('demo-nomimasen-ka', 21);
    if (sf === 'もし') hit('moshi', 25);
    if (sf === 'まし' && n.surface_form === 'ょ' && n2.surface_form === 'う' && at(i + 3).surface_form === 'か') hit('mashou-ka', 14);
    if (t.pos === '助詞' && t.pos_detail_1 === '終助詞' && sf === 'ね') hit('sentence-ne', 4);
    if (t.pos === '助詞' && t.pos_detail_1 === '終助詞' && sf === 'よ') hit('sentence-yo', 5);
    if (sf === 'そう' && n.basic_form === 'です') hit('sou-desu', 2);
    if (['これ', 'それ', 'あれ', 'この', 'その', 'あの', 'どれ', 'どの'].includes(sf)) hit('demonstrative', 2);
    if (['ここ', 'そこ', 'あそこ', 'どこ', 'こちら', 'そちら', 'あちら', 'どちら'].includes(sf)) hit('place-demonstrative', 3);
    if (isNumber(t) && ['時', '分'].includes(n.surface_form)) hit('clock', 4);
    if (sf === 'の' && t.pos === '助詞' && t.pos_detail_1 === '連体化') hit('no-genitive', 1);
    if (sf === 'も' && t.pos === '助詞') hit('mo', 1);
    if (verb(p) && sf === 'て' && n.pos === '動詞' && !aux(n) && !n.surface_form.startsWith('くださ')) hit('te-encadenar', 16);
    if (verb(p) && p.conjugated_form === '未然形' && (sf === 'なけれ' || (sf === 'なく' && n.surface_form === 'て') || (sf === 'ない' && n.surface_form === 'で'))) hit('nai-nakereba', 17);
  }
  return [...new Map(hits.map((h) => [h.rule, { ...h, ids: SIGNAL_IDS[h.rule] ?? [], advisory: ADVISORY.has(h.rule) }])).values()];
}

// ---------- kiểm một draft ----------

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim() !== '';
const validLesson = (n) => Number.isInteger(n) && n >= 1 && n <= 25;

/**
 * Kiểm một draft (không đụng file). Trả về {errors, warnings, stats, signals}; không ném lỗi với dữ liệu sai.
 * `ctx` = { tokenizer, source } (lấy bằng getTokenizer()/loadSource()).
 */
export function checkDraft(draft, { tokenizer, source }) {
  const errors = [];
  const warnings = [];
  const err = (msg) => errors.push(msg);
  const stats = { correctPositions: [], optionLengths: [], longestIsCorrect: 0 };
  const signals = [];
  if (!isObj(draft)) return { errors: ['draft không phải object'], warnings, stats, signals };

  const kind = draft.kind;
  if (!isText(draft.id)) err('thiếu id');
  if (kind !== 'dialogue' && kind !== 'passage') err(`kind phải là dialogue hoặc passage (hiện: ${kind})`);
  if (!isText(draft.titleVi)) err('thiếu titleVi');

  // sentences
  const sentences = Array.isArray(draft.sentences) ? draft.sentences : [];
  if (sentences.length < 4 || sentences.length > 10) err(`cần 4–10 sentences (hiện: ${sentences.length})`);
  const sentenceById = new Map();
  const roles = Array.isArray(draft.roles) ? draft.roles : [];
  const roleIds = new Set(roles.map((r) => r?.id));
  if (kind === 'dialogue') {
    if (roles.length === 0 || roles.some((r) => !isText(r?.id) || !isText(r?.name))) err('dialogue cần roles [{id, name}]');
  } else if (draft.roles) err('passage không có roles');
  sentences.forEach((s, i) => {
    if (!isText(s?.id) || !isText(s?.jp) || !isText(s?.vi)) { err(`sentence #${i + 1} thiếu id/jp/vi`); return; }
    if (sentenceById.has(s.id)) err(`sentence trùng id ${s.id}`);
    sentenceById.set(s.id, { ...s, text: displayText(s.jp), ruby: rubyRanges(s.jp) });
    if (kind === 'dialogue' && !roleIds.has(s.speaker)) err(`${s.id}: speaker "${s.speaker}" không thuộc roles`);
    if (kind === 'passage' && s.speaker !== undefined) err(`${s.id}: passage cấm speaker`);
  });

  // source
  const src = draft.source;
  if (!isObj(src)) err('thiếu source');
  else if (src.kind === 'minna-dialogue') {
    const lesson = source.lessons[src.lesson - 1];
    const dialogue = lesson?.dialogues?.find((d) => d.id === src.dialogueId);
    if (!dialogue) err(`source: không có dialogue ${src.lesson}/${src.dialogueId}`);
    else {
      if (draft.id !== `reading-${src.dialogueId}`) err(`id phải là reading-${src.dialogueId}`);
      if (kind !== 'dialogue') err('minna-dialogue phải có kind dialogue');
      if (sentences.length !== dialogue.lines.length) err(`số câu (${sentences.length}) khác dialogue nguồn (${dialogue.lines.length})`);
      if (!sameJson(roles, dialogue.roles)) err('roles khác dialogue nguồn');
      if (!sameJson(draft.illustration, dialogue.illustration)) err('illustration khác dialogue nguồn');
      dialogue.lines.forEach((line, i) => {
        const s = sentences[i];
        if (!s) return;
        if (s.id !== `${src.dialogueId}-${i + 1}`) err(`${s.id}: phải là ${src.dialogueId}-${i + 1}`);
        if (s.jp !== line.jp || s.vi !== line.translation.vi || s.speaker !== line.speaker) err(`${s.id}: jp/vi/speaker không giống nguyên văn nguồn`);
      });
    }
  } else if (!['external', 'original'].includes(src.kind)) err(`source.kind không hợp lệ: ${src.kind}`);

  // questions
  const questions = Array.isArray(draft.questions) ? draft.questions : [];
  if (questions.length !== 3) err(`cần đúng 3 câu hỏi (hiện: ${questions.length})`);
  const qIds = new Set();
  questions.forEach((q, i) => {
    const at = `câu hỏi ${i + 1}`;
    if (!isText(q?.id) || qIds.has(q.id)) err(`${at}: id thiếu hoặc trùng`);
    qIds.add(q?.id);
    if (!isText(q?.promptVi) || !isText(q?.explanationVi)) err(`${at}: thiếu promptVi/explanationVi`);
    const options = Array.isArray(q?.options) ? q.options : [];
    if (options.length !== 3 || options.some((o) => !isText(o?.id) || !isText(o?.textVi))) err(`${at}: cần đúng 3 lựa chọn {id, textVi}`);
    if (new Set(options.map((o) => o?.id)).size !== options.length) err(`${at}: id lựa chọn trùng`);
    const correct = options.findIndex((o) => o?.id === q?.correctOptionId);
    if (correct < 0) err(`${at}: correctOptionId không thuộc options`);
    const ev = q?.evidenceSentenceIds;
    if (!Array.isArray(ev) || ev.length === 0 || ev.some((id) => !sentenceById.has(id))) err(`${at}: evidenceSentenceIds rỗng hoặc trỏ ngoài bài`);
    if (correct >= 0) {
      const lengths = options.map((o) => [...o.textVi].length);
      stats.correctPositions.push(correct + 1);
      stats.optionLengths.push(lengths);
      if (lengths[correct] === Math.max(...lengths) && lengths.filter((l) => l === lengths[correct]).length === 1) stats.longestIsCorrect += 1;
    }
  });

  // glossary + anchors
  const glossary = Array.isArray(draft.glossary) ? draft.glossary : [];
  const glossaryById = new Map();
  const anchored = new Map(); // sentenceId -> [[start, end]]
  for (const g of glossary) {
    if (!isText(g?.id) || glossaryById.has(g.id)) { err(`glossary: id thiếu hoặc trùng (${g?.id})`); continue; }
    glossaryById.set(g.id, g);
    if (!['word', 'grammar', 'name'].includes(g.kind)) err(`${g.id}: kind phải là word, grammar hoặc name`);
    if (g.kind === 'name' && (g.ref !== undefined || g.vocabRef !== undefined)) err(`${g.id}: tên riêng không có ref/vocabRef`);
    if (!isText(g.labelJp)) err(`${g.id}: thiếu labelJp`);
    if (!Array.isArray(g.meaningsVi) || g.meaningsVi.length === 0 || g.meaningsVi.some((m) => !isText(m))) err(`${g.id}: meaningsVi rỗng`);
    if (!Array.isArray(g.anchors) || g.anchors.length === 0) { err(`${g.id}: không có anchor`); continue; }
    for (const a of g.anchors) {
      const s = sentenceById.get(a?.sentenceId);
      if (!s) { err(`${g.id}: anchor trỏ câu không có (${a?.sentenceId})`); continue; }
      if (!Number.isInteger(a.start) || !Number.isInteger(a.end) || a.start < 0 || a.end > s.text.length || a.start >= a.end) { err(`${g.id}: anchor ${a.sentenceId} ngoài phạm vi [${a.start},${a.end})`); continue; }
      if (s.text.slice(a.start, a.end) !== a.text) { err(`${g.id}: anchor ${a.sentenceId} slice "${s.text.slice(a.start, a.end)}" ≠ text "${a.text}"`); continue; }
      const half = (i) => /[\uDC00-\uDFFF]/u.test(s.text[i] ?? '') && /[\uD800-\uDBFF]/u.test(s.text[i - 1] ?? '');
      if (half(a.start) || half(a.end)) err(`${g.id}: anchor ${a.sentenceId} cắt giữa surrogate`);
      if (s.ruby.some(([rs, re]) => (a.start > rs && a.start < re) || (a.end > rs && a.end < re))) err(`${g.id}: anchor ${a.sentenceId} "${a.text}" cắt giữa cụm ruby`);
      anchored.set(a.sentenceId, [...(anchored.get(a.sentenceId) ?? []), [a.start, a.end, g.kind]]);
    }
  }

  // vocabUsed / grammarUsed
  const vocabUsed = Array.isArray(draft.vocabUsed) ? draft.vocabUsed : [];
  const grammarUsed = Array.isArray(draft.grammarUsed) ? draft.grammarUsed : [];
  const seen = new Set();
  const usedGlossary = new Set();
  const refGlossary = (item, kindWanted) => {
    const g = glossaryById.get(item.glossaryId);
    if (!g) err(`${item.id}: glossaryId ${item.glossaryId} không có trong glossary`);
    else if (g.kind !== kindWanted) err(`${item.id}: glossary ${g.id} phải là kind ${kindWanted}`);
    usedGlossary.add(item.glossaryId);
    return g;
  };
  for (const item of vocabUsed) {
    if (!isText(item?.id) || seen.has(`v:${item.id}`)) { err(`vocabUsed: id thiếu hoặc trùng (${item?.id})`); continue; }
    seen.add(`v:${item.id}`);
    const known = !item.id.startsWith('unknown:');
    if (known) {
      const w = source.words.get(item.id);
      if (!w) err(`vocabUsed ${item.id}: không có trong vocab (định dạng <bài>:<wordId>)`);
      if (item.ref !== item.id) err(`vocabUsed ${item.id}: ref phải bằng id`);
      if (!validLesson(item.lesson) || item.lesson !== lessonOf(item.id)) err(`vocabUsed ${item.id}: lesson không khớp ID`);
      const g = refGlossary(item, 'word');
      if (g && w) {
        if (!sameJson(g.vocabRef, { lesson: w.lesson, wordId: w.id })) err(`${g.id}: vocabRef phải là {lesson ${w.lesson}, wordId ${w.id}}`);
        if (!g.needsReview && !sameJson(g.meaningsVi, [w.meaning.vi])) err(`${g.id}: meaningsVi không giống nghĩa trong vocab`);
        if (!sameJson(g.illustration, w.illustration)) err(`${g.id}: illustration không giống vocab`);
      }
    } else {
      if (item.lesson !== null || item.ref !== undefined) err(`vocabUsed ${item.id}: unknown cần lesson null và không có ref`);
      const g = refGlossary(item, 'word');
      if (g && g.vocabRef) err(`${g.id}: từ unknown không có vocabRef`);
    }
  }
  for (const item of grammarUsed) {
    if (!isText(item?.id) || seen.has(`g:${item.id}`)) { err(`grammarUsed: id thiếu hoặc trùng (${item?.id})`); continue; }
    seen.add(`g:${item.id}`);
    const point = source.grammar.get(item.id);
    if (!point && !item.id.startsWith('external:')) err(`grammarUsed ${item.id}: không có trong lessons (định dạng <bài>:<grammarId> hoặc external:<slug>)`);
    const g = refGlossary(item, 'grammar');
    if (g && point && !g.needsReview && !sameJson(g.meaningsVi, [point.title.vi])) err(`${g.id}: meaningsVi không giống title.vi của mẫu ngữ pháp`);
  }
  for (const g of glossary) if (g.kind !== 'name' && !usedGlossary.has(g.id)) warnings.push(`glossary ${g.id} không có trong vocabUsed/grammarUsed`);

  // coverage tính lại
  const coverage = computeCoverage({ vocabUsed, grammarUsed });
  if (coverage.vocab.totalTypes === 0) err('bài không có từ nội dung (totalTypes = 0)');
  if (!sameJson(draft.coverage, coverage)) err(`coverage không khớp bản tính lại: ${JSON.stringify(coverage)}`);

  // mọi đơn vị từ có anchor trọn đơn vị; tên riêng cần glossary kind name
  const names = roles.flatMap((r) => (r?.name ? [displayText(r.name)] : [])).concat(Array.isArray(draft.properNames) ? draft.properNames : []);
  const missing = [];
  const unitsOf = new Map();
  for (const s of sentenceById.values()) {
    const spans = anchored.get(s.id) ?? [];
    const covered = spans.filter(([, , kind]) => kind === 'grammar');
    const units = contentUnits(tokenizer, s.text, source, names, { ruby: s.ruby.map(([a, b]) => [a, b]), covered });
    unitsOf.set(s.id, units);
    for (const u of units) {
      const hits = (kinds) => spans.filter(([a, b, kind]) => kinds.includes(kind) && a <= u.start && b >= u.end);
      if (u.kind === 'name') {
        if (!hits(['name']).length) missing.push(`${s.id} [${u.start},${u.end}) "${u.surface}" → tên riêng cần glossary kind name`);
      } else if (!u.inherent && !hits(['word', 'grammar']).length) {
        missing.push(`${s.id} [${u.start},${u.end}) "${u.surface}"${u.match ? ` → đề xuất ${u.match.lesson}:${u.match.id}` : ' → chưa có trong vocab'}`);
      }
    }
    // Anchor từ/tên phải là hợp của các đơn vị từ: không neo riêng thân động từ hay gắn する vào cụm お願いします.
    for (const [a, b, kind] of spans) {
      if (kind === 'grammar') continue;
      const cut = units.find((u) => (a > u.start && a < u.end) || (b > u.start && b < u.end));
      if (cut) err(`${s.id}: anchor ${kind} "${s.text.slice(a, b)}" cắt giữa đơn vị từ "${cut.surface}" (anchor phải phủ trọn)`);
    }
  }
  if (missing.length) err(`từ nội dung chưa có anchor:\n    ${missing.join('\n    ')}`);
  // Glossary kind name chỉ neo tên riêng đã biết (properNames của draft, tên vai, danh sách nguồn).
  const knownNames = new Set([...names, ...source.properNames]);
  for (const g of glossary) {
    if (g.kind === 'name') for (const a of g.anchors ?? []) if (!knownNames.has(a.text)) err(`${g.id}: "${a.text}" không phải tên riêng đã khai báo (thêm vào properNames của draft)`);
  }
  // Từ chức năng đã nằm trong mẫu ngữ pháp khai báo thì không khai thêm như từ vựng (không đếm là từ mới).
  for (const g of glossary) {
    if (g.kind !== 'word') continue;
    for (const a of g.anchors ?? []) {
      const inherent = (unitsOf.get(a.sentenceId) ?? []).find((u) => u.inherent && u.start === a.start && u.end === a.end);
      if (inherent) err(`${g.id}: "${inherent.surface}" là từ chức năng nằm trong mẫu ngữ pháp đã khai báo, bỏ khỏi vocabUsed/glossary từ`);
    }
  }

  // tín hiệu ngữ pháp
  const declared = new Set(grammarUsed.map((g) => g.id));
  const declaredLessons = new Set(grammarUsed.map((g) => lessonOf(g.id)));
  const decisions = new Map((draft.review?.signalDecisions ?? []).map((d) => [d.rule, d]));
  for (const d of decisions.values()) {
    if (d.grammarId !== undefined && !declared.has(d.grammarId)) err(`signalDecisions ${d.rule}: ${d.grammarId} chưa khai báo trong grammarUsed`);
    if (d.exception !== undefined && (!sentenceById.has(d.exception?.sentenceId) || !isText(d.exception?.reason))) err(`signalDecisions ${d.rule}: ngoại lệ cần sentenceId hợp lệ và reason`);
    if (d.grammarId === undefined && d.exception === undefined) err(`signalDecisions ${d.rule}: cần grammarId hoặc exception`);
  }
  const byRule = new Map();
  for (const s of sentenceById.values()) {
    for (const h of grammarSignals(tokenizer, s.text)) {
      if (!byRule.has(h.rule)) byRule.set(h.rule, { ...h, sentences: [] });
      byRule.get(h.rule).sentences.push(s.id);
    }
  }
  for (const sig of byRule.values()) {
    // Cùng bài với một mẫu đã khai báo = tạm coi là khai báo; khác thì cần quyết định biên tập.
    sig.resolved = decisions.has(sig.rule) ? 'decision' : declaredLessons.has(sig.lesson) ? 'lesson-declared' : null;
    // Chưa khai báo đúng mẫu nào trong `ids` (và chưa có quyết định biên tập) = người soạn cần đối chiếu; chỉ cảnh báo.
    sig.undeclared = !decisions.has(sig.rule) && sig.ids.length > 0 && !sig.ids.some((id) => declared.has(id));
    signals.push(sig);
    if (sig.undeclared) warnings.push(`mẫu có tín hiệu "${sig.rule}" nhưng chưa khai báo (${sig.ids.join(' | ')}) ở ${sig.sentences.join(', ')}`);
    if (!sig.resolved && !sig.advisory) err(`tín hiệu ngữ pháp "${sig.rule}" (bài ${sig.lesson}, ${sig.sentences.join(', ')}) chưa khai báo hoặc có ngoại lệ`);
  }

  // review
  const layers = draft.review?.layers;
  if (draft.review?.method !== 'ai-multilayer') err('review.method phải là ai-multilayer');
  if (!Array.isArray(layers) || !layers.some((l) => l?.layer === 1 && l.status === 'passed')) warnings.push('chưa ghi lớp 1 trong review.layers');
  const review = draft.review ?? {};
  if (!Array.isArray(review.models) || review.models.length === 0 || !review.models.every(isText)) err('review.models phải liệt kê model/công cụ đã dùng');
  if (!isText(review.date) || typeof review.nativeReviewed !== 'boolean') err('review cần date và nativeReviewed (boolean)');
  const fromMinna = src?.kind === 'minna-dialogue';
  const layerNumbers = (Array.isArray(layers) ? layers : []).map((l) => l?.layer);
  if (new Set(layerNumbers).size !== layerNumbers.length) err('review.layers có lớp trùng');
  for (const l of Array.isArray(layers) ? layers : []) {
    if (![1, 2, 3, 4, 5].includes(l?.layer) || !['passed', 'not-applicable'].includes(l?.status)) err(`review.layers: lớp không hợp lệ ${JSON.stringify(l)}`);
    else if (l.status === 'not-applicable' && !(fromMinna && [2, 5].includes(l.layer) && isText(l.note))) err(`review.layers: lớp ${l.layer} chỉ được not-applicable cho lớp 2/5 của hội thoại Minna và phải có note`);
  }
  return { errors, warnings, stats, signals, coverage };
}

/** Một bài đủ 5 lớp duyệt, mỗi lớp {layer: 1..5, status: 'passed' | 'not-applicable'}; not-applicable cần note. */
export function reviewComplete(draft) {
  const layers = draft.review?.layers;
  if (!Array.isArray(layers)) return false;
  return [1, 2, 3, 4, 5].every((n) => {
    const l = layers.find((x) => x?.layer === n);
    return l && (l.status === 'passed' || (l.status === 'not-applicable' && isText(l.note)));
  });
}

// ---------- phát hành ----------

/** Bản phát hành chỉ có trường của app: bỏ đầu vào script (properNames), hồ sơ biên tập (signalDecisions, needsReview) và thông tin thừa của lớp duyệt. */
export function releaseForm(draft) {
  const { properNames, review, glossary, ...rest } = draft;
  void properNames;
  const layers = (review.layers ?? []).map(({ layer, status, note }) => ({ layer, status, ...(note ? { note } : {}) })).sort((a, b) => a.layer - b.layer);
  return {
    ...rest,
    coverage: computeCoverage(draft),
    glossary: glossary.map(({ needsReview, ...entry }) => (void needsReview, entry)),
    review: { method: review.method, layers, models: review.models, date: review.date, nativeReviewed: review.nativeReviewed },
  };
}

export function mergePassages(existing, drafts) {
  const byId = new Map(existing.map((p) => [p.id, p]));
  for (const d of drafts) byId.set(d.id, releaseForm(d));
  return [...byId.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// ---------- CLI ----------

const readDraft = (file) => JSON.parse(readFileSync(file, 'utf8'));

function statsReport(results) {
  const dist = [0, 0, 0, 0];
  let longest = 0;
  let total = 0;
  const ratios = [];
  for (const { stats } of results) {
    stats.correctPositions.forEach((p) => { dist[p] += 1; total += 1; });
    longest += stats.longestIsCorrect;
    ratios.push(...stats.optionLengths.map((l) => Math.max(...l) / Math.min(...l)));
  }
  return `vị trí đáp án đúng (A/B/C) = ${dist.slice(1).join('/')} trên ${total} câu; đáp án đúng là lựa chọn dài nhất duy nhất: ${longest}/${total}; tỉ lệ dài nhất/ngắn nhất tối đa ${ratios.length ? Math.max(...ratios).toFixed(2) : '-'}`;
}

export async function run(argv, out = console.log) {
  const [command, ...rest] = argv;
  const outIndex = rest.indexOf('--out');
  const outFile = outIndex >= 0 ? path.resolve(rest[outIndex + 1]) : DEFAULT_OUT;
  const files = rest.filter((_, i) => outIndex < 0 || (i !== outIndex && i !== outIndex + 1));
  if (!['check', 'release'].includes(command) || files.length === 0) {
    out('Cách dùng: node scripts/build-reading.mjs check|release <draft.json...> [--out <file>]');
    return 2;
  }
  const ctx = { tokenizer: await getTokenizer(), source: loadSource() };
  const drafts = files.map(readDraft);
  const results = drafts.map((d) => checkDraft(d, ctx));
  const ids = drafts.map((d) => d.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  let failed = dupes.length > 0;
  if (dupes.length) out(`LỖI: id trùng giữa các draft: ${[...new Set(dupes)].join(', ')}`);
  results.forEach((r, i) => {
    out(`${r.errors.length ? 'LỖI' : 'OK  '} ${drafts[i].id ?? files[i]}  (từ ${r.coverage?.vocab.totalTypes ?? '-'}, mẫu ${r.coverage?.grammar.totalTypes ?? '-'}, tín hiệu ${r.signals.length})`);
    r.errors.forEach((e) => out(`  - ${e}`));
    r.warnings.forEach((w) => out(`  ! ${w}`));
    if (r.errors.length) failed = true;
  });
  out(statsReport(results));
  if (failed) return 1;
  if (command === 'check') return 0;

  const incomplete = drafts.filter((d) => !reviewComplete(d)).map((d) => d.id);
  if (incomplete.length) {
    out(`Không phát hành: chưa đủ 5 lớp duyệt đạt: ${incomplete.join(', ')}`);
    return 1;
  }
  const current = (() => { try { return JSON.parse(readFileSync(outFile, 'utf8')); } catch { return { version: 1, passages: [] }; } })();
  writeFileSync(outFile, `${JSON.stringify({ version: current.version ?? 1, passages: mergePassages(current.passages ?? [], drafts) }, null, 2)}\n`);
  out(`Đã ghi ${drafts.length} bài vào ${path.relative(root, outFile)}`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await run(process.argv.slice(2));
}
