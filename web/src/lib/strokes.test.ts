import { test } from 'node:test';
import assert from 'node:assert/strict';
import kanaStrokes from '../data/strokes/kana.json' with { type: 'json' };
import {
  HIRAGANA_BASIC_ROWS,
  KATAKANA_BASIC_ROWS,
  HIRAGANA_DAKUON_ROWS,
  KATAKANA_DAKUON_ROWS,
} from '../data/kana.ts';
import type { CharStrokes } from './strokes.ts';
import { getStrokes, hasStrokes } from './strokes.ts';

const data = kanaStrokes as unknown as Record<string, CharStrokes>;
const expected = new Set(
  [HIRAGANA_BASIC_ROWS, KATAKANA_BASIC_ROWS, HIRAGANA_DAKUON_ROWS, KATAKANA_DAKUON_ROWS]
    .flatMap((rows) => rows.flatMap((r) => r.cells))
    .flatMap((c) => (c ? [c.kana] : [])),
);

test('kana.json có đúng tập chữ của bốn nhóm hàng kana', () => {
  assert.deepEqual(new Set(Object.keys(data)), expected);
});

test('mỗi chữ có path hợp lệ và số thứ tự nét nằm trong khung 109', () => {
  for (const [ch, { d, n }] of Object.entries(data)) {
    assert.ok(d.length >= 1, `${ch}: không có nét`);
    assert.equal(n.length, d.length, `${ch}: số nét và số thứ tự lệch nhau`);
    for (const p of d) assert.match(p, /^[Mm]/, `${ch}: path không bắt đầu bằng M/m`);
    for (const [x, y] of n) {
      assert.ok(x >= 0 && x <= 109 && y >= 0 && y <= 109, `${ch}: tọa độ ${x},${y} ngoài khung`);
    }
  }
});

test('chữ có dấu có số nét = chữ gốc + 2 (゛) hoặc + 1 (゜)', () => {
  let checked = 0;
  for (const [ch, { d }] of Object.entries(data)) {
    const nfd = ch.normalize('NFD');
    if (nfd.length !== 2) continue;
    const base = data[nfd[0]];
    assert.ok(base, `${ch}: thiếu chữ gốc ${nfd[0]}`);
    const extra = nfd[1] === '゙' ? 2 : nfd[1] === '゚' ? 1 : NaN;
    assert.equal(d.length, base.d.length + extra, `${ch}: số nét không khớp chữ gốc ${nfd[0]}`);
    checked++;
  }
  assert.ok(checked > 0);
});

test('getStrokes / hasStrokes', () => {
  assert.equal(getStrokes('あ')?.d.length, 3);
  assert.equal(getStrokes('x'), undefined);
  assert.equal(hasStrokes('ア'), true);
});
