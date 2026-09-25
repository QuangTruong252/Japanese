import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripFurigana, toKanaSentence } from './japanese.ts';
import type { VocabWord } from '../types/index.ts';
import {
  loadLesson,
  loadVocab,
  loadLessonData,
  loadLessons,
  loadVocabMap,
  loadLessonSummary,
  loadLessonSummaries,
  clearLessonCache,
  AVAILABLE_N5_LESSONS,
  parseLessonNumber,
} from './lessons.ts';

test('loadLesson nạp đúng bài học và có trạng thái verification unverified', async () => {
  clearLessonCache();
  const lesson1 = await loadLesson(1);
  assert.equal(lesson1.number, 1);
  assert.equal(lesson1.level, 'n5');
  assert.equal(lesson1.title.vi, 'Giới thiệu bản thân');
  assert.equal(lesson1.verification, 'unverified');
  assert.equal(lesson1.sourceRef, undefined);
  assert.ok(lesson1.grammar.length > 0);

  const lesson25 = await loadLesson(25);
  assert.equal(lesson25.number, 25);
  assert.equal(lesson25.verification, 'unverified');
});

test('loadVocab nạp đúng từ vựng và kiểu dữ liệu', async () => {
  const vocab1 = await loadVocab(1);
  assert.ok(vocab1.length > 0);
  const watashi = vocab1[0]!;
  assert.equal(watashi.word, '私[わたし]');
  assert.equal(watashi.kana, 'わたし');
  assert.equal(watashi.type, 'pronoun');
  assert.equal(watashi.meaning.vi, 'tôi');
});

const IGNORED_IN_READING = /[「」『』\s　]/gu;
// Mỗi cách viết của từ là một nhóm phần phải cùng có mặt: `こちらは〜さんです` → [こちらは, さんです];
// `トイレ（お手洗い）`, `おばあさん／おばあちゃん`, `暑い・熱い` là các cách viết thay thế. Từ đích hiện trong
// câu ở dạng chia (て形, ない形…) nên động từ và tính từ い chỉ so phần gốc ổn định.
function exampleTargets(word: VocabWord): string[][] {
  const forms = [stripFurigana(word.word), word.kana];
  if (word.verbForms) {
    forms.push(stripFurigana(word.verbForms.masu), word.verbForms.masuKana);
  }
  return forms.flatMap((form) =>
    form
      .replace(/\[[^\]]*\]/gu, '')
      .replace(IGNORED_IN_READING, '')
      .split(/[（）()／・]/u)
      .filter(Boolean)
      .map((variant) => {
        const parts = variant.split(/[〜～…]/u).filter(Boolean);
        const last = parts.length - 1;
        if (word.type.startsWith('verb')) {
          const stem = parts[last]!
            .replace(/ます$/u, '')
            .replace(/する$/u, '')
            .replace(/[うくぐすつぬぶむる]$/u, '');
          parts[last] = stem.length > 1 ? stem.slice(0, stem.length - 1) : stem;
        }
        if (word.type === 'adjective-i') parts[last] = parts[last]!.replace(/い$/u, '');
        return parts;
      })
  );
}

test('ví dụ từ vựng khớp furigana, kana và chứa từ đích', async () => {
  for (const lesson of AVAILABLE_N5_LESSONS) {
    for (const word of await loadVocab(lesson)) {
      const example = word.example;
      if (!example) continue;
      const id = `bài ${lesson} ${word.id}`;
      assert.ok(example.jp && example.kana && example.translation.vi.trim(), id);
      const reading = toKanaSentence(example.jp).replace(IGNORED_IN_READING, '');
      assert.doesNotMatch(reading, /[一-鿿㐀-䶿々〆〇ヶ]/u, id);
      // Chữ số nằm ngoài furigana sẽ bị TTS đọc thừa (`６時[ろくじ]` → `６ろくじ`).
      assert.doesNotMatch(example.kana, /[0-9０-９]/u, `${id}: kana còn chữ số`);
      assert.equal(reading, example.kana.replace(IGNORED_IN_READING, ''), id);
      const written = stripFurigana(example.jp).replace(IGNORED_IN_READING, '');
      // Câu chỉ dùng một cách viết: không chép ngoặc, ／ hay cả cụm `A・B` từ trường word.
      assert.doesNotMatch(written, /[（）()／]/u, `${id}: câu chép cách viết thay thế`);
      const writtenWord = stripFurigana(word.word).replace(/\[[^\]]*\]/gu, '');
      if (writtenWord.includes('・')) assert.ok(!written.includes(writtenWord), `${id}: câu chép cả cụm ・`);
      assert.ok(
        exampleTargets(word).some((parts) =>
          parts.every((part) => written.includes(part) || reading.includes(part))
        ),
        `${id}: câu không chứa từ đích`
      );
    }
  }
});

// JSON chỉ được cast sang VocabWord, TypeScript không bắt được tên loại từ lệch với union.
const VOCAB_TYPES = new Set<string>([
  'noun', 'pronoun', 'verb-godan', 'verb-ichidan', 'verb-irregular', 'adjective-i', 'adjective-na',
  'adverb', 'particle', 'expression', 'interrogative', 'counter', 'number', 'conjunction',
] satisfies VocabWord['type'][]);

test('loại từ trong JSON khớp VocabWord.type', async () => {
  for (const lesson of AVAILABLE_N5_LESSONS) {
    for (const word of await loadVocab(lesson)) {
      assert.ok(VOCAB_TYPES.has(word.type), `bài ${lesson} ${word.id}: ${word.type}`);
    }
  }
});

test('mọi từ vựng N5 đều có ví dụ riêng', async () => {
  let total = 0;
  for (const lesson of AVAILABLE_N5_LESSONS) {
    for (const word of await loadVocab(lesson)) {
      assert.ok(word.example, `bài ${lesson} ${word.id}`);
      total++;
    }
  }
  assert.equal(total, 991);
});

test('loadLessonData nạp đồng thời bài học và từ vựng', async () => {
  const data = await loadLessonData(2);
  assert.equal(data.lesson.number, 2);
  assert.ok(data.vocab.length > 0);
  assert.equal(data.lesson.verification, 'unverified');
});

test('loadLessons và loadVocabMap nạp theo danh sách bài', async () => {
  const lessons = await loadLessons([1, 2]);
  assert.equal(lessons.length, 2);
  assert.equal(lessons[0]!.number, 1);
  assert.equal(lessons[1]!.number, 2);

  const vocabMap = await loadVocabMap([1, 2]);
  assert.equal(vocabMap.size, 2);
  assert.ok(vocabMap.get(1)!.length > 0);
  assert.ok(vocabMap.get(2)!.length > 0);
});

test('loadLessonSummary và loadLessonSummaries trả về đúng thông tin tóm tắt cho 25 bài', async () => {
  const summary1 = await loadLessonSummary(1);
  assert.equal(summary1.number, 1);
  assert.equal(summary1.title.vi, 'Giới thiệu bản thân');
  assert.equal(summary1.verification, 'unverified');
  assert.ok(summary1.vocabCount > 0);
  assert.ok(summary1.grammarCount > 0);

  const allSummaries = await loadLessonSummaries();
  assert.equal(allSummaries.length, 25);
  assert.deepEqual(
    allSummaries.map((s) => s.number),
    [...AVAILABLE_N5_LESSONS]
  );
  for (const s of allSummaries) {
    assert.equal(s.verification, 'unverified');
    assert.ok(s.vocabCount > 0);
    assert.ok(s.grammarCount > 0);
  }
});

test('loadLesson & loadVocab ném lỗi khi số bài không hợp lệ', async () => {
  await assert.rejects(() => loadLesson(0), /không tồn tại/);
  await assert.rejects(() => loadLesson(26), /không tồn tại/);
  await assert.rejects(() => loadVocab(99), /không tồn tại/);
});

test('bộ nhớ cache (memoize): gọi lần 2 trả về cùng kết quả mà không cần nạp lại', async () => {
  clearLessonCache();
  const p1 = loadLesson(3);
  const p2 = loadLesson(3);
  assert.equal(p1, p2);
  const [res1, res2] = await Promise.all([p1, p2]);
  assert.equal(res1, res2);

  clearLessonCache();
  const p3 = loadLesson(3);
  assert.notEqual(p1, p3);
});

test('parseLessonNumber nhận số bài hợp lệ', () => {
  assert.equal(parseLessonNumber('1'), 1);
  assert.equal(parseLessonNumber('25'), 25);
});

test('parseLessonNumber từ chối mọi tham số không phải số bài 1..25', () => {
  // SPEC-12 §7: `so` không phải số thì notFound(), KHÔNG crash
  for (const raw of ['tra-cuu', 'abc', '', ' ', '0', '26', '01', '1.5', '1e1', '-1', '+1', '١']) {
    assert.equal(parseLessonNumber(raw), null, `phải từ chối: "${raw}"`);
  }
});

test('VocabWord hỗ trợ cấu trúc verbForms và verbGroup', () => {
  const sampleVerb: VocabWord = {
    id: 'kirimasu',
    lesson: 7,
    word: '切[き]る',
    kana: 'きる',
    meaning: { vi: 'cắt', en: 'to cut' },
    type: 'verb-godan',
    verbGroup: 1,
    verbForms: {
      dictionary: '切[き]る',
      dictionaryKana: 'きる',
      masu: '切[き]ります',
      masuKana: 'きります',
      te: '切[き]って',
      teKana: 'きって',
      nai: '切[き]らない',
      naiKana: 'きらない',
      ta: '切[き]った',
      taKana: 'きった',
    },
  };
  assert.equal(sampleVerb.verbForms?.masu, '切[き]ります');
  assert.equal(sampleVerb.verbGroup, 1);
});

test('toàn bộ động từ N5 có word thể từ điển, verbGroup và verbForms hợp lệ', async () => {
  let verbCount = 0;

  for (const lesson of AVAILABLE_N5_LESSONS) {
    const vocab = await loadVocab(lesson);
    for (const w of vocab) {
      if (w.type.startsWith('verb-')) {
        verbCount++;
        assert.ok(w.verbForms, `Từ ${w.id} (bài ${lesson}) thiếu verbForms`);
        assert.ok(w.verbGroup, `Từ ${w.id} (bài ${lesson}) thiếu verbGroup`);
        assert.ok(w.verbForms.dictionary, `Từ ${w.id} thiếu dictionary form`);
        assert.ok(w.verbForms.masu, `Từ ${w.id} thiếu masu form`);
        assert.equal(w.word, w.verbForms.dictionary, `Từ ${w.id}: w.word phải là dictionary form`);
        assert.equal(w.kana, w.verbForms.dictionaryKana, `Từ ${w.id}: w.kana phải là dictionaryKana`);
      }
    }
  }

  assert.equal(verbCount, 157, `Kỳ vọng 157 động từ, thực tế có ${verbCount}`);
});

test('loadLessonData bài 7 trả về động từ ở thể từ điển kèm verbForms', async () => {
  const { vocab } = await loadLessonData(7);
  const kiru = vocab.find((w) => w.id === 'kirimasu');
  assert.ok(kiru);
  assert.equal(kiru.word, '切[き]る');
  assert.equal(kiru.kana, 'きる');
  assert.equal(kiru.verbForms?.masu, '切[き]ります');
  assert.equal(kiru.verbGroup, 1);
});



