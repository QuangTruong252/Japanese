import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getBasicKana,
  getDakuonKana,
  getYoonKana,
  HIRAGANA_BASIC_ROWS,
  KATAKANA_BASIC_ROWS,
  HIRAGANA_DAKUON_ROWS,
  KATAKANA_DAKUON_ROWS,
  HIRAGANA_YOON_ROWS,
  KATAKANA_YOON_ROWS,
} from '../data/kana.ts';

test('Bảng Hiragana cơ bản chứa chính xác 46 âm và không bị trùng lặp', () => {
  const items = getBasicKana('hiragana');
  assert.equal(items.length, 46, 'Bảng Hiragana cơ bản phải có đủ 46 chữ cái');

  const kanaSet = new Set(items.map((i) => i.kana));
  assert.equal(kanaSet.size, 46, 'Tất cả 46 ký tự Hiragana phải độc nhất, không trùng');
});

test('Bảng Katakana cơ bản chứa chính xác 46 âm và không bị trùng lặp', () => {
  const items = getBasicKana('katakana');
  assert.equal(items.length, 46, 'Bảng Katakana cơ bản phải có đủ 46 chữ cái');

  const kanaSet = new Set(items.map((i) => i.kana));
  assert.equal(kanaSet.size, 46, 'Tất cả 46 ký tự Katakana phải độc nhất, không trùng');
});

test('Kiểm tra chính xác các âm nhạy cảm: を=wo, ん=n, ヲ=wo, ン=n', () => {
  const hira = getBasicKana('hiragana');
  const kata = getBasicKana('katakana');

  const hiraWo = hira.find((i) => i.kana === 'を');
  assert.ok(hiraWo, 'Phải có chữ を');
  assert.equal(hiraWo.romaji, 'wo', 'Chữ を phải có romaji là wo');

  const hiraN = hira.find((i) => i.kana === 'ん');
  assert.ok(hiraN, 'Phải có chữ ん');
  assert.equal(hiraN.romaji, 'n', 'Chữ ん phải có romaji là n');

  const kataWo = kata.find((i) => i.kana === 'ヲ');
  assert.ok(kataWo, 'Phải có chữ ヲ');
  assert.equal(kataWo.romaji, 'wo', 'Chữ ヲ phải có romaji là wo');

  const kataN = kata.find((i) => i.kana === 'ン');
  assert.ok(kataN, 'Phải có chữ ン');
  assert.equal(kataN.romaji, 'n', 'Chữ ン phải có romaji là n');
});

test('Kiểm tra âm đục đặc biệt ぢ/づ (ji/zu, kèm alt di/du)', () => {
  const hiraDakuon = getDakuonKana('hiragana');
  const kataDakuon = getDakuonKana('katakana');

  const hiraDi = hiraDakuon.find((i) => i.kana === 'ぢ');
  assert.ok(hiraDi, 'Phải có chữ ぢ');
  assert.equal(hiraDi.romaji, 'ji');
  assert.equal(hiraDi.altRomaji, 'di');

  const hiraDu = hiraDakuon.find((i) => i.kana === 'づ');
  assert.ok(hiraDu, 'Phải có chữ づ');
  assert.equal(hiraDu.romaji, 'zu');
  assert.equal(hiraDu.altRomaji, 'du');

  const kataDi = kataDakuon.find((i) => i.kana === 'ヂ');
  assert.ok(kataDi, 'Phải có chữ ヂ');
  assert.equal(kataDi.romaji, 'ji');
  assert.equal(kataDi.altRomaji, 'di');

  const kataDu = kataDakuon.find((i) => i.kana === 'ヅ');
  assert.ok(kataDu, 'Phải có chữ ヅ');
  assert.equal(kataDu.romaji, 'zu');
  assert.equal(kataDu.altRomaji, 'du');
});

test('Bảng âm đục/bán đục chứa đủ 25 âm và không trùng lặp', () => {
  const hira = getDakuonKana('hiragana');
  const kata = getDakuonKana('katakana');

  assert.equal(hira.length, 25);
  assert.equal(kata.length, 25);

  assert.equal(new Set(hira.map((i) => i.kana)).size, 25);
  assert.equal(new Set(kata.map((i) => i.kana)).size, 25);
});

test('Bảng âm ghép (Yōon) chứa đủ 33 âm và không trùng lặp', () => {
  const hira = getYoonKana('hiragana');
  const kata = getYoonKana('katakana');

  assert.equal(hira.length, 33);
  assert.equal(kata.length, 33);

  assert.equal(new Set(hira.map((i) => i.kana)).size, 33);
  assert.equal(new Set(kata.map((i) => i.kana)).size, 33);
});

test('Cấu trúc các hàng bảo đảm đúng số cột cho lưới hiển thị', () => {
  // Lưới cơ bản 5 cột (a, i, u, e, o)
  for (const row of [...HIRAGANA_BASIC_ROWS, ...KATAKANA_BASIC_ROWS]) {
    assert.equal(row.cells.length, 5, `Hàng ${row.label} phải có đúng 5 ô (kể cả ô trống)`);
  }

  // Lưới âm đục 5 cột (a, i, u, e, o)
  for (const row of [...HIRAGANA_DAKUON_ROWS, ...KATAKANA_DAKUON_ROWS]) {
    assert.equal(row.cells.length, 5, `Hàng ${row.label} phải có đúng 5 ô`);
  }

  // Lưới âm ghép 3 cột (ya, yu, yo)
  for (const row of [...HIRAGANA_YOON_ROWS, ...KATAKANA_YOON_ROWS]) {
    assert.equal(row.cells.length, 3, `Hàng ${row.label} phải có đúng 3 ô`);
  }
});

test('Mọi ô dùng đúng bảng chữ: Hiragana chỉ chứa ぁ-ゖ, Katakana chỉ chứa ァ-ヶ/ー', () => {
  const check = (rows: typeof HIRAGANA_BASIC_ROWS, re: RegExp, name: string) => {
    for (const row of rows) {
      for (const cell of row.cells) {
        if (cell) assert.match(cell.kana, re, `${name}: ô "${cell.kana}" (${cell.romaji}) sai bảng chữ`);
      }
    }
  };
  for (const rows of [HIRAGANA_BASIC_ROWS, HIRAGANA_DAKUON_ROWS, HIRAGANA_YOON_ROWS]) check(rows, /^[ぁ-ゖ]+$/u, 'Hiragana');
  for (const rows of [KATAKANA_BASIC_ROWS, KATAKANA_DAKUON_ROWS, KATAKANA_YOON_ROWS]) check(rows, /^[ァ-ヶー]+$/u, 'Katakana');
});
