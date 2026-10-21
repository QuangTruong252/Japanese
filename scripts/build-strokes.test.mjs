import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseKanjiSvg } from './build-strokes.mjs';

const text = (n, tf = `matrix(1 0 0 1 ${n}0 5)`) => `<text transform="${tf}">${n}</text>`;
const wrap = (body) => `<svg><g id="kvg:03042" kvg:element="あ">${body}</g></svg>`;

test('nét và số thứ tự được sắp theo số nét dù file viết đảo', () => {
  const svg = wrap(
    `<path d="M2" kvg:type="x" id="kvg:03042-s2"/>` +
      `<path kvg:type="㇔" d="M1" id="kvg:03042-s1"/>` +
      text(2) +
      text(1),
  );
  assert.deepEqual(parseKanjiSvg(svg), { d: ['M1', 'M2'], n: [[10, 5], [20, 5]] });
});

test('path không phải nét bị bỏ qua', () => {
  const svg = wrap(`<path d="Mx" id="kvg:03042"/><path d="My"/><path d="M1" id="kvg:03042-s1"/>` + text(1));
  assert.deepEqual(parseKanjiSvg(svg).d, ['M1']);
});

test('ném lỗi rõ khi dữ liệu hỏng', () => {
  assert.throws(() => parseKanjiSvg(wrap(`<path d="Mx" id="kvg:03042"/>`)), /không có path nét/);
  assert.throws(() => parseKanjiSvg(wrap(`<path d="M1" id="kvg:03042-s1"/>`)), /1 nét nhưng 0 số/);
  assert.throws(
    () => parseKanjiSvg(wrap(`<path d="M1" id="kvg:03042-s1"/>` + text(1, 'matrix(2 0 0 2 1 1)'))),
    /transform số nét lạ/,
  );
});
