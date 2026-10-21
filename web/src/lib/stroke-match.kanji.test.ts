import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchStroke } from './stroke-match.ts';
import { loadStrokes, measure, samplePath } from './stroke-match.test-helpers.ts';

test('SVG sampler: cubic, relative coordinates, reflected smooth controls and repeated groups', () => {
  const absolute = samplePath('M0 0C0 0 10 0 10 0S20 0 20 0');
  const relative = samplePath('M0 0c0 0 10 0 10 0s10 0 10 0');
  assert.deepEqual(relative, absolute);
  absolute.forEach((p, i) => assert.ok(Math.abs(p.x - 20 * i / 31) < 1e-10 && p.y === 0));
  assert.deepEqual(samplePath('M0 0c0 0 10 0 10 0 0 0 10 0 10 0'), absolute);
  const smooth = samplePath('M0 0C0 10 10 10 10 0S20 -10 20 0');
  assert.deepEqual(smooth, samplePath('M0 0C0 10 10 10 10 0C10 -10 20 -10 20 0'));
  assert.throws(() => samplePath('M0 0L1 1'), /Unsupported SVG command/);
});

test('mọi nét thật kana và kanji tự khớp khi xét cả các nét chưa viết', () => {
  let count = 0;
  for (const kind of ['kana', 'kanji'] as const) {
    const { commands, chars } = loadStrokes(kind);
    assert.deepEqual(commands, kind === 'kana' ? ['M', 'c'] : ['C', 'M', 'S', 'c', 's']);
    for (const { char, strokes } of chars) {
      strokes.forEach((stroke, i) => {
        assert.ok(matchStroke(stroke, stroke, strokes.slice(i + 1)).ok, `${char} nét ${i + 1}`);
        count++;
      });
    }
  }
  assert.equal(count, 1592);
});

test('kanji: chặn bỏ nét, cho phép lệch ngón tay và bỏ qua nét đã viết', () => {
  const strokes = loadStrokes('kanji').chars.find(({ char }) => char === '事')!.strokes;
  assert.ok(matchStroke(strokes[3], strokes[2]).ok);
  assert.deepEqual(matchStroke(strokes[3], strokes[2], strokes.slice(3)), { ok: false, reason: 'shape' });
  const shifted = strokes[2].map((p) => ({ x: p.x + 6, y: p.y - 6 }));
  assert.ok(matchStroke(shifted, strokes[2], strokes.slice(3)).ok);
  assert.ok(matchStroke(strokes[2], strokes[3], strokes.slice(4)).ok);
  assert.ok(matchStroke(strokes[2], strokes[2], [[]]).ok);
});

for (const kind of ['kana', 'kanji'] as const) {
  test(`${kind}: nhận nhầm nét kế tiếp và từ chối oan trong giới hạn`, () => {
    const result = measure(kind, matchStroke);
    assert.equal(result.next.total, kind === 'kana' ? 277 : 1004);
    assert.equal(result.noisy.total, kind === 'kana' ? 16760 : 46920);
    // Đo được A=0% cả hai; dư 1 cặp để chịu sai số lấy mẫu mà vẫn bắt mất kiểm tra thứ tự.
    assert.ok(result.next.accepted <= 1, JSON.stringify(result.next));
    // B đo được kana=0,060%, kanji=0%; trần 0,1%/0,02% chừa dư nhỏ cho sai số số học.
    assert.ok(result.noisy.rejected / result.noisy.total <= (kind === 'kana' ? 0.001 : 0.0002), JSON.stringify(result.noisy));
  });
}
