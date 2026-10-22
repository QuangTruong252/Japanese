import assert from 'node:assert/strict';
import test from 'node:test';
import { AVAILABLE_N5_LESSONS, loadLesson } from './lessons.ts';
import {
  grammarDialogueLines,
  grammarMeaning,
  groupMarkedWords,
  markSegments,
  patternMarks,
  patternSegments,
  slotColor,
} from './grammar.ts';
import { stripFurigana } from './japanese.ts';
import type { Lesson } from '../types/index.ts';

test('patternSegments: tách ô, phần còn lại là cố định', () => {
  assert.deepEqual(patternSegments('N1 は N2 です', ['N1', 'N2']), [
    { text: 'N1', slotIndex: 0 },
    { text: ' は ' },
    { text: 'N2', slotIndex: 1 },
    { text: ' です' },
  ]);
});

test('patternSegments: ô dài nhất thắng (A-な trước A-)', () => {
  assert.deepEqual(patternSegments('A-な + N', ['A-', 'A-な', 'N']), [
    { text: 'A-な', slotIndex: 1 },
    { text: ' + ' },
    { text: 'N', slotIndex: 2 },
  ]);
  assert.deepEqual(patternSegments('A-くて', ['A-', 'A-な']), [{ text: 'A-', slotIndex: 0 }, { text: 'くて' }]);
});

test('patternSegments: không có ô thì cả mẫu là phần cố định', () => {
  assert.deepEqual(patternSegments('これ は ペン'), [{ text: 'これ は ペン' }]);
  assert.deepEqual(patternSegments('これ', []), [{ text: 'これ' }]);
});

test('markSegments: phủ câu, ngoặc tùy chọn [へ]も vẫn là một mark', () => {
  const jp = 'どこ[へ]も 行[い]きません。';
  const segments = markSegments(
    jp,
    [{ text: 'どこ', slot: 'N' }, { text: '[へ]も' }, { text: '行[い]きません' }],
    ['N'],
  );
  assert.deepEqual(segments, [
    { text: 'どこ', kind: 'slot', slotIndex: 0 },
    { text: '[へ]も', kind: 'fixed' },
    { text: ' ', kind: 'plain' },
    { text: '行[い]きません', kind: 'fixed' },
    { text: '。', kind: 'plain' },
  ]);
  assert.equal(segments.map((s) => s.text).join(''), jp);
});

test('markSegments: không có marks thì một đoạn plain', () => {
  assert.deepEqual(markSegments('これは ペンです。'), [{ text: 'これは ペンです。', kind: 'plain' }]);
  assert.deepEqual(markSegments('これは', [], ['N']), [{ text: 'これは', kind: 'plain' }]);
});

test('markSegments: mark lặp tìm từ cuối mark trước', () => {
  const segments = markSegments('はははは', [{ text: 'は' }, { text: 'は', slot: 'N' }], ['N']);
  assert.deepEqual(segments, [
    { text: 'は', kind: 'fixed' },
    { text: 'は', kind: 'slot', slotIndex: 0 },
    { text: 'はは', kind: 'plain' },
  ]);
});

test('groupMarkedWords: chỉ ngắt ở dấu cách, mảnh giữ loại tô', () => {
  const words = groupMarkedWords(
    markSegments('私[わたし]は 学生[がくせい]です', [{ text: '学生[がくせい]', slot: 'N' }, { text: 'です' }], ['N']),
  );
  assert.equal(words.length, 2);
  assert.deepEqual(words[0], [
    { base: '私', ruby: 'わたし', kind: 'plain', slotIndex: undefined, segment: 0 },
    { base: 'は', kind: 'plain', slotIndex: undefined, segment: 0 },
  ]);
  assert.deepEqual(
    words[1]!.map((p) => [p.base, p.ruby, p.kind]),
    [['学生', 'がくせい', 'slot'], ['です', undefined, 'fixed']],
  );
});

test('groupMarkedWords: mảnh mang số đoạn để ghép lại theo ranh giới mark', () => {
  const words = groupMarkedWords(markSegments('私はマイク・ミラーです', [{ text: 'マイク・ミラー', slot: 'N' }], ['N']));
  assert.deepEqual(words.map((w) => w.map((p) => [p.base, p.segment])), [[['私は', 0], ['マイク・ミラー', 1], ['です', 2]]]);
});

test('groupMarkedWords: ngoặc tùy chọn hiện như ví dụ đang hiện', () => {
  const words = groupMarkedWords(markSegments('どこ[へ]も', [{ text: 'どこ' }, { text: '[へ]も' }]));
  assert.equal(words.map((w) => w.map((p) => p.base).join('')).join(' '), 'どこ(へ)も');
});

test('grammarMeaning: phần sau " — ", bỏ «» bao ngoài', () => {
  assert.equal(grammarMeaning('địa điểm に N が あります — «Ở địa điểm có N»'), 'Ở địa điểm có N');
  assert.equal(grammarMeaning('N は N です — là'), 'là');
  assert.equal(grammarMeaning('Không có gạch'), 'Không có gạch');
});

test('grammarDialogueLines: theo thứ tự xuất hiện, bỏ dòng không gắn điểm', () => {
  const line = (grammarIds?: string[]) => ({ speaker: 'a', jp: 'あ', translation: { vi: 'a' }, grammarIds });
  const lesson = {
    dialogues: [
      { id: 'd1', lines: [line(['x']), line(), line(['y', 'x'])] },
      { id: 'd2', lines: [line(['x'])] },
    ],
  } as unknown as Lesson;
  assert.deepEqual(
    grammarDialogueLines(lesson, 'x').map((l) => [l.dialogue.id, l.lineIndex]),
    [['d1', 0], ['d1', 2], ['d2', 0]],
  );
  assert.deepEqual(grammarDialogueLines(lesson, 'z'), []);
  assert.deepEqual(grammarDialogueLines({} as Lesson, 'x'), []);
});

test('slotColor: chart-1, 3, 4, 5 rồi lặp', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(slotColor), [
    'var(--chart-1)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
    'var(--chart-1)',
    'var(--chart-3)',
  ]);
});

test('mọi điểm ngữ pháp: mẫu và ví dụ ghép lại đúng chuỗi gốc', async () => {
  let points = 0;
  for (const n of AVAILABLE_N5_LESSONS) {
    for (const point of (await loadLesson(n)).grammar) {
      points += 1;
      const at = `bài ${n} ${point.id}`;
      const pattern = patternSegments(point.pattern.vi, point.slots);
      assert.equal(pattern.map((s) => s.text).join(''), point.pattern.vi, `${at}: mẫu`);
      for (const slot of point.slots ?? []) {
        assert.ok(pattern.some((s) => s.text === slot), `${at}: ô "${slot}" không ra ở mẫu`);
      }
      point.examples.forEach((ex, i) => {
        const segments = markSegments(ex.jp, ex.marks, point.slots);
        assert.equal(segments.map((s) => s.text).join(''), ex.jp, `${at} ví dụ ${i}`);
        const words = groupMarkedWords(segments);
        const flat = words.map((w) => w.map((p) => p.base).join('')).join('');
        assert.equal(flat, stripFurigana(ex.jp).replace(/[ 　]+/g, '').replace(/\[([^\]]+)\]/g, '($1)'), `${at} ví dụ ${i}: cụm`);
      });
    }
  }
  assert.equal(points, 141);
});

test('patternMarks: ô là slot, phần còn lại fixed', () => {
  assert.deepEqual(patternMarks('N1 は N2', ['N1', 'N2']), [
    { text: 'N1', kind: 'slot', slotIndex: 0 },
    { text: ' は ', kind: 'fixed' },
    { text: 'N2', kind: 'slot', slotIndex: 1 },
  ]);
});
