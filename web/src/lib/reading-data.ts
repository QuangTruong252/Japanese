import source from '../data/n5/reading.json' with { type: 'json' };
import type { ReadingCoverageBucket, ReadingPassage } from '../types/reading.ts';
import { formatOptionalBrackets, parseFurigana, stripFurigana } from './japanese.ts';

export const READING_DATA_VERSION: number = source.version;

// Chỉ tập bài đã duyệt được đóng gói; coverage và glossary đã tính sẵn khi build dữ liệu, không dò chuỗi lúc chạy.
export const READING_PASSAGES: ReadingPassage[] = source.passages as unknown as ReadingPassage[];

const PASSAGE_BY_ID = new Map(READING_PASSAGES.map((passage) => [passage.id, passage]));

export const readingPassage = (id: string): ReadingPassage | undefined => PASSAGE_BY_ID.get(id);

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const isLesson = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 25;
const isTimestamp = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v));

/** Câu sau chuẩn hóa mà anchor trỏ vào, cùng các khoảng chữ gốc của ruby (không được cắt giữa). */
function anchorSpace(jp: string): { text: string; rubyRanges: [number, number][] } {
  const rubyRanges: [number, number][] = [];
  let offset = 0;
  for (const { base, ruby } of parseFurigana(jp)) {
    if (ruby) rubyRanges.push([offset, offset + base.length]);
    offset += base.length;
  }
  return { text: formatOptionalBrackets(stripFurigana(jp)), rubyRanges };
}

const splitsSurrogate = (text: string, index: number) => {
  const before = text.charCodeAt(index - 1);
  const at = text.charCodeAt(index);
  return before >= 0xd800 && before <= 0xdbff && at >= 0xdc00 && at <= 0xdfff;
};

function validIllustration(v: unknown): boolean {
  return isObject(v) && isText(v.src) && v.src.startsWith('/') &&
    Number.isInteger(v.width) && (v.width as number) > 0 && Number.isInteger(v.height) && (v.height as number) > 0 &&
    isObject(v.alt) && isText(v.alt.vi);
}

/** `<bài>:<id>` → bài; `external:*` hoặc dạng lạ → null (luôn tính là mới). */
export function grammarLesson(id: string): number | null {
  const match = /^(\d{1,2}):.+$/u.exec(id);
  const lesson = match ? Number(match[1]) : null;
  return lesson !== null && isLesson(lesson) ? lesson : null;
}

/** Tính lại coverage từ các loại đã duyệt: dùng chung cho script build và kiểm tra. */
export function computeReadingCoverage(passage: Pick<ReadingPassage, 'vocabUsed' | 'grammarUsed'>) {
  const bucket = (lessons: (number | null)[]): ReadingCoverageBucket => {
    const byLesson: Record<string, number> = {};
    let unknownTypes = 0;
    for (const lesson of lessons) {
      if (lesson === null) unknownTypes++;
      else byLesson[lesson] = (byLesson[lesson] ?? 0) + 1;
    }
    return { totalTypes: lessons.length, byLesson, unknownTypes };
  };
  return {
    version: 2 as const,
    vocab: bucket(passage.vocabUsed.map((use) => use.lesson)),
    grammar: bucket(passage.grammarUsed.map((use) => grammarLesson(use.id))),
  };
}

const sameBucket = (a: unknown, b: ReadingCoverageBucket) => {
  if (!isObject(a) || a.totalTypes !== b.totalTypes || a.unknownTypes !== b.unknownTypes || !isObject(a.byLesson)) return false;
  const actual = Object.entries(a.byLesson).filter(([, n]) => n !== 0).sort(([x], [y]) => x.localeCompare(y));
  const expected = Object.entries(b.byLesson).sort(([x], [y]) => x.localeCompare(y));
  return actual.length === expected.length && actual.every(([k, n], i) => k === expected[i]![0] && n === expected[i]![1]);
};

export interface ReadingValidationContext {
  /** `lesson:wordId` của mọi từ vựng N5; có thì `ref`/`vocabRef` phải nằm trong tập. */
  vocabIds?: ReadonlySet<string>;
}

/** Trả danh sách lỗi (rỗng = hợp lệ). Không ném lỗi nên dùng được cho test, build và kiểm tra sao lưu. */
export function validateReadingPassage(raw: unknown, context: ReadingValidationContext = {}): string[] {
  if (!isObject(raw)) return ['bài không phải object'];
  const errors: string[] = [];
  const p = raw as unknown as ReadingPassage;
  const fail = (message: string) => errors.push(`${isText(p.id) ? p.id : '?'}: ${message}`);

  if (!isText(p.id)) fail('thiếu id');
  if (!isText(p.titleVi)) fail('thiếu titleVi');
  if (p.kind !== 'dialogue' && p.kind !== 'passage') fail('kind phải là dialogue hoặc passage');
  if (p.illustration !== undefined && !validIllustration(p.illustration)) fail('illustration không hợp lệ');

  const sentences = Array.isArray(p.sentences) ? p.sentences : [];
  if (sentences.length < 4 || sentences.length > 10) fail('sentences phải có 4–10 mục');
  const sentenceById = new Map<string, (typeof sentences)[number]>();
  for (const s of sentences) {
    if (!isObject(s) || !isText(s.id) || !isText(s.jp) || !isText(s.vi)) { fail('câu thiếu id/jp/vi'); continue; }
    if (sentenceById.has(s.id)) fail(`trùng id câu ${s.id}`);
    sentenceById.set(s.id, s);
  }

  if (p.kind === 'dialogue') {
    const roles = Array.isArray(p.roles) ? p.roles : [];
    if (roles.length < 2 || !roles.every((r) => isObject(r) && isText(r.id) && isText(r.name))) fail('hội thoại cần ít nhất 2 vai hợp lệ');
    const roleIds = new Set(roles.map((r) => r?.id));
    if (roleIds.size !== roles.length) fail('trùng id vai');
    for (const s of sentenceById.values()) {
      if (!isText(s.speaker) || !roleIds.has(s.speaker)) fail(`câu ${s.id} thiếu hoặc sai speaker`);
      if (s.group !== undefined) fail(`hội thoại cấm group (câu ${s.id})`);
    }
    if (p.source?.kind === 'minna-dialogue') {
      const prefix = `${p.source.dialogueId}-`;
      sentences.forEach((s, i) => { if (s?.id !== `${prefix}${i + 1}`) fail(`id câu ${i + 1} phải là ${prefix}${i + 1}`); });
    }
  } else if (p.kind === 'passage') {
    if (p.roles !== undefined) fail('đoạn văn không có roles');
    for (const s of sentenceById.values()) {
      if (s.speaker !== undefined) fail(`đoạn văn cấm speaker (câu ${s.id})`);
      if (s.group !== undefined && (!Number.isInteger(s.group) || s.group < 1)) fail(`group câu ${s.id} không hợp lệ`);
    }
  }

  const questions = Array.isArray(p.questions) ? p.questions : [];
  if (questions.length !== 3) fail('cần đúng 3 câu hỏi');
  const questionIds = new Set<string>();
  for (const q of questions) {
    if (!isObject(q) || !isText(q.id) || !isText(q.promptVi) || !isText(q.explanationVi)) { fail('câu hỏi thiếu id/promptVi/explanationVi'); continue; }
    if (questionIds.has(q.id)) fail(`trùng id câu hỏi ${q.id}`);
    questionIds.add(q.id);
    const options = Array.isArray(q.options) ? q.options : [];
    if (options.length !== 3 || !options.every((o) => isObject(o) && isText(o.id) && isText(o.textVi))) fail(`${q.id}: cần đúng 3 lựa chọn hợp lệ`);
    else if (new Set(options.map((o) => o.id)).size !== 3) fail(`${q.id}: trùng id lựa chọn`);
    else if (options.filter((o) => o.id === q.correctOptionId).length !== 1) fail(`${q.id}: correctOptionId phải trỏ đúng một lựa chọn`);
    const evidence = Array.isArray(q.evidenceSentenceIds) ? q.evidenceSentenceIds : [];
    if (!evidence.length) fail(`${q.id}: evidenceSentenceIds rỗng`);
    if (new Set(evidence).size !== evidence.length) fail(`${q.id}: evidence trùng`);
    for (const sid of evidence) if (!sentenceById.has(sid)) fail(`${q.id}: evidence trỏ câu không có ${sid}`);
  }

  const glossary = Array.isArray(p.glossary) ? p.glossary : [];
  const glossaryIds = new Set<string>();
  const nameIds = new Set<string>();
  for (const g of glossary) {
    if (!isObject(g) || !isText(g.id) || !isText(g.labelJp) || (g.kind !== 'word' && g.kind !== 'grammar' && g.kind !== 'name')) { fail('glossary thiếu id/labelJp/kind'); continue; }
    if (glossaryIds.has(g.id)) fail(`trùng id glossary ${g.id}`);
    glossaryIds.add(g.id);
    if (g.kind === 'name') nameIds.add(g.id);
    for (const field of ['ref', 'reading', 'exampleJp', 'exampleVi'] as const) {
      if (g[field] !== undefined && !isText(g[field])) fail(`glossary ${g.id}: ${field} phải là chuỗi`);
    }
    if (g.kind === 'name' && g.ref !== undefined) fail(`glossary ${g.id}: tên riêng không có ref`);
    if (!Array.isArray(g.meaningsVi) || !g.meaningsVi.length || !g.meaningsVi.every(isText)) fail(`glossary ${g.id}: meaningsVi rỗng`);
    if (g.illustration !== undefined && !validIllustration(g.illustration)) fail(`glossary ${g.id}: illustration không hợp lệ`);
    if (g.vocabRef !== undefined) {
      const ref = g.vocabRef;
      // Tên riêng và ngữ pháp không vào lịch ôn nên không có vocabRef.
      if (g.kind !== 'word' || !isObject(ref) || !isLesson(ref.lesson) || !isText(ref.wordId)) fail(`glossary ${g.id}: vocabRef không hợp lệ`);
      else if (context.vocabIds && !context.vocabIds.has(`${ref.lesson}:${ref.wordId}`)) fail(`glossary ${g.id}: vocabRef không có trong từ vựng`);
    }
    if (!Array.isArray(g.anchors) || !g.anchors.length) { fail(`glossary ${g.id}: cần ít nhất một anchor`); continue; }
    for (const a of g.anchors) {
      const s = isObject(a) ? sentenceById.get(a.sentenceId) : undefined;
      if (!s || !Number.isInteger(a.start) || !Number.isInteger(a.end) || a.start < 0 || a.start >= a.end || !isText(a.text)) { fail(`glossary ${g.id}: anchor không hợp lệ`); continue; }
      const { text, rubyRanges } = anchorSpace(s.jp);
      if (a.end > text.length || text.slice(a.start, a.end) !== a.text) fail(`glossary ${g.id}: anchor ${s.id}[${a.start},${a.end}) không khớp text`);
      else if (splitsSurrogate(text, a.start) || splitsSurrogate(text, a.end)) fail(`glossary ${g.id}: anchor cắt surrogate`);
      else if (rubyRanges.some(([from, to]) => [a.start, a.end].some((cut) => cut > from && cut < to))) fail(`glossary ${g.id}: anchor cắt giữa cụm ruby`);
    }
  }

  const vocabUsed = Array.isArray(p.vocabUsed) ? p.vocabUsed : [];
  const grammarUsed = Array.isArray(p.grammarUsed) ? p.grammarUsed : [];
  if (!vocabUsed.length) fail('vocabUsed rỗng (totalTypes = 0 là bài không hợp lệ)');
  const seen = new Set<string>();
  for (const use of vocabUsed) {
    if (!isObject(use) || !isText(use.id) || !isText(use.glossaryId) || !(use.lesson === null || isLesson(use.lesson))) { fail('vocabUsed có mục không hợp lệ'); continue; }
    if (seen.has(use.id)) fail(`trùng vocabUsed ${use.id}`);
    seen.add(use.id);
    if ((use.lesson === null) !== use.id.startsWith('unknown:')) fail(`vocabUsed ${use.id}: lesson null khi và chỉ khi id là unknown:*`);
    if (!glossaryIds.has(use.glossaryId)) fail(`vocabUsed ${use.id}: glossaryId không có`);
    else if (nameIds.has(use.glossaryId)) fail(`vocabUsed ${use.id}: glossaryId là tên riêng, không tính coverage`);
    if (use.ref !== undefined && (!isText(use.ref) || (context.vocabIds && !context.vocabIds.has(use.ref)))) fail(`vocabUsed ${use.id}: ref không tồn tại`);
  }
  const seenGrammar = new Set<string>();
  for (const use of grammarUsed) {
    if (!isObject(use) || !isText(use.id) || !isText(use.glossaryId) || (grammarLesson(use.id) === null && !/^external:.+/u.test(use.id))) { fail('grammarUsed có mục không hợp lệ'); continue; }
    if (seenGrammar.has(use.id)) fail(`trùng grammarUsed ${use.id}`);
    seenGrammar.add(use.id);
    if (!glossaryIds.has(use.glossaryId)) fail(`grammarUsed ${use.id}: glossaryId không có`);
    else if (nameIds.has(use.glossaryId)) fail(`grammarUsed ${use.id}: glossaryId là tên riêng, không tính coverage`);
  }
  // Mỗi loại đã duyệt có glossary (kiểm ở trên) và mỗi mục glossary (trừ tên riêng) thuộc một loại đã duyệt.
  const used = new Set([...vocabUsed, ...grammarUsed].map((u) => (isObject(u) ? u.glossaryId : undefined)));
  for (const gid of glossaryIds) if (!nameIds.has(gid) && !used.has(gid)) fail(`glossary ${gid} không thuộc vocabUsed/grammarUsed`);

  const wellFormedUses = vocabUsed.every((u) => isObject(u) && (u.lesson === null || isLesson(u.lesson))) && grammarUsed.every((u) => isObject(u) && isText(u.id));
  if (wellFormedUses) {
    const expected = computeReadingCoverage({ vocabUsed, grammarUsed });
    const c = p.coverage as unknown;
    if (!isObject(c) || c.version !== 2 || !sameBucket(c.vocab, expected.vocab) || !sameBucket(c.grammar, expected.grammar)) fail('coverage không khớp tính lại từ vocabUsed/grammarUsed');
  }

  const src = p.source as unknown;
  if (!isObject(src)) fail('thiếu source');
  else if (src.kind === 'external') {
    if (![src.author, src.title, src.url, src.license, src.notes].every(isText) || !isTimestamp(src.checkedAt)) fail('source external thiếu trường');
    if (src.licenseUrl !== undefined && !isText(src.licenseUrl)) fail('source external: licenseUrl phải là chuỗi');
  } else if (src.kind === 'original') {
    if (!Array.isArray(src.materialIds) || !src.materialIds.every(isText)) fail('source original cần materialIds');
  } else if (src.kind === 'minna-dialogue') {
    if (!isLesson(src.lesson) || !isText(src.dialogueId)) fail('source minna-dialogue cần lesson và dialogueId');
    if (p.kind !== 'dialogue') fail('minna-dialogue chỉ dùng cho kind dialogue');
  } else fail('source.kind không hợp lệ');

  const review = p.review as unknown;
  const layers: unknown[] = isObject(review) && Array.isArray(review.layers) ? review.layers : [];
  const layerNumbers = layers.map((l) => (isObject(l) ? l.layer : undefined));
  if (!isObject(review) || review.method !== 'ai-multilayer' || !isTimestamp(review.date) || typeof review.nativeReviewed !== 'boolean' ||
      !Array.isArray(review.models) || !review.models.length || !review.models.every(isText) ||
      layers.length !== 5 || !layers.every((l) => isObject(l) && (l.status === 'passed' || l.status === 'not-applicable')) ||
      ![1, 2, 3, 4, 5].every((n) => layerNumbers.filter((x) => x === n).length === 1)) {
    fail('review phải ghi đúng một kết quả cho mỗi lớp 1–5 (passed/not-applicable), models không rỗng, date, nativeReviewed');
  } else {
    // Hội thoại Minna đã có người biên soạn nên chỉ lớp 2 và 5 được bỏ; mọi bài khác phải qua đủ năm lớp.
    const fromMinna = isObject(src) && src.kind === 'minna-dialogue';
    for (const l of layers as { layer: number; status: string; note?: unknown }[]) {
      if (l.status !== 'not-applicable') continue;
      if (!fromMinna || (l.layer !== 2 && l.layer !== 5)) fail(`lớp ${l.layer} phải passed`);
      else if (!isText(l.note)) fail(`lớp ${l.layer} not-applicable cần note`);
    }
  }

  return errors;
}

/** Kiểm cả kho: từng bài và ID bài duy nhất. */
export function validateReadingCatalog(raw: unknown, context: ReadingValidationContext = {}): string[] {
  if (!isObject(raw) || !Number.isInteger(raw.version) || !Array.isArray(raw.passages)) return ['kho phải có dạng { version, passages }'];
  const errors = raw.passages.flatMap((passage) => validateReadingPassage(passage, context));
  const ids = raw.passages.map((p) => (isObject(p) ? p.id : undefined));
  if (new Set(ids).size !== ids.length) errors.push('trùng id bài trong kho');
  return errors;
}
