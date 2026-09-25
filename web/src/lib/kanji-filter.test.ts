import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { KanjiData } from '../types/lookup.ts';
import { matchKanjiQuery, filterKanjiWithQuery } from './kanji-filter.ts';

const mockKanjiList: KanjiData[] = [
  {
    character: '人',
    level: 'n5',
    onyomi: ['ジン', 'ニン'],
    kunyomi: ['ひと'],
    meanings: {
      vi: ['nhân', 'người'],
      en: ['person'],
    },
    strokes: 2,
    lesson: 1,
    examples: [],
  },
  {
    character: '会',
    level: 'n5',
    onyomi: ['カイ', 'エ'],
    kunyomi: ['あ.う'],
    meanings: {
      vi: ['hội', 'gặp'],
      en: ['meet', 'society'],
    },
    strokes: 6,
    lesson: 4,
    examples: [],
  },
  {
    character: '道',
    level: 'n5',
    onyomi: ['ドウ', 'トウ'],
    kunyomi: ['みち'],
    meanings: {
      vi: ['đạo', 'đường'],
      en: ['road', 'way'],
    },
    strokes: 12,
    lesson: 15,
    examples: [],
  },
];

test('matchKanjiQuery tìm chính xác theo chữ Hán', () => {
  assert.equal(matchKanjiQuery(mockKanjiList[0]!, '人'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[1]!, '人'), false);
  assert.equal(matchKanjiQuery(mockKanjiList[1]!, '会'), true);
});

test('matchKanjiQuery tìm theo âm Kun kana và romaji', () => {
  // 人 có kunyomi là ひと
  assert.equal(matchKanjiQuery(mockKanjiList[0]!, 'ひと'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[0]!, 'hito'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[1]!, 'hito'), false);

  // 会 có kunyomi là あ.う -> tìm 'あう' hoặc 'au' vẫn khớp
  assert.equal(matchKanjiQuery(mockKanjiList[1]!, 'あう'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[1]!, 'au'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[1]!, 'あ.う'), true);
});

test('matchKanjiQuery tìm theo âm On katakana và romaji', () => {
  // 人 có onyomi là ジン, ニン
  assert.equal(matchKanjiQuery(mockKanjiList[0]!, 'ジン'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[0]!, 'じん'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[0]!, 'jin'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[0]!, 'nin'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[1]!, 'jin'), false);
});

test('matchKanjiQuery tìm theo nghĩa Hán Việt và tiếng Việt có dấu/không dấu/đ->d', () => {
  // 人: "nhân", "người"
  assert.equal(matchKanjiQuery(mockKanjiList[0]!, 'nhân'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[0]!, 'nhan'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[0]!, 'người'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[0]!, 'nguoi'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[1]!, 'nhân'), false);

  // 会: "hội", "gặp"
  assert.equal(matchKanjiQuery(mockKanjiList[1]!, 'hội'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[1]!, 'hoi'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[1]!, 'gặp'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[1]!, 'gap'), true);

  // 道: "đạo", "đường" -> kiểm tra chuẩn hóa đ/Đ thành d
  assert.equal(matchKanjiQuery(mockKanjiList[2]!, 'đạo'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[2]!, 'dao'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[2]!, 'đường'), true);
  assert.equal(matchKanjiQuery(mockKanjiList[2]!, 'duong'), true);
});

test('matchKanjiQuery với chuỗi rỗng hoặc chỉ khoảng trắng trả về true', () => {
  assert.equal(matchKanjiQuery(mockKanjiList[0]!, ''), true);
  assert.equal(matchKanjiQuery(mockKanjiList[0]!, '   '), true);
});

test('filterKanjiWithQuery kết hợp tìm kiếm và các bộ lọc khác', () => {
  // Lọc theo query "nhân"
  const res1 = filterKanjiWithQuery(mockKanjiList, { query: 'nhân' });
  assert.equal(res1.length, 1);
  assert.equal(res1[0]!.character, '人');

  // Lọc theo query "hito"
  const res2 = filterKanjiWithQuery(mockKanjiList, { query: 'hito' });
  assert.equal(res2.length, 1);
  assert.equal(res2[0]!.character, '人');

  // Lọc theo query và số nét không khớp
  const res3 = filterKanjiWithQuery(mockKanjiList, { query: '人', strokes: 6 });
  assert.equal(res3.length, 0);

  // Lọc theo bài học
  const res4 = filterKanjiWithQuery(mockKanjiList, { lesson: 4 });
  assert.equal(res4.length, 1);
  assert.equal(res4[0]!.character, '会');

  // Lọc theo onlyLearned
  const learnedSet = new Set(['人']);
  const res5 = filterKanjiWithQuery(mockKanjiList, { onlyLearned: true }, learnedSet);
  assert.equal(res5.length, 1);
  assert.equal(res5[0]!.character, '人');
});

test('Dữ liệu thật: tìm theo âm Hán Việt, khớp đúng âm được xếp đầu', async () => {
  const { ALL_KANJI } = await import('../data/n5/kanji-index.ts');
  assert.ok(ALL_KANJI.every((k) => k.hanviet && k.hanviet.length > 0), 'mọi chữ phải có âm Hán Việt');
  assert.equal(filterKanjiWithQuery(ALL_KANJI, { query: 'nhân' })[0]?.character, '人');
  const noAccent = filterKanjiWithQuery(ALL_KANJI, { query: 'nhan' });
  assert.equal(noAccent[0]?.character, '人');
  assert.ok(noAccent.some((k) => k.character === '早'), 'khớp một phần (nhanh) vẫn còn, chỉ xếp sau');
  assert.equal(filterKanjiWithQuery(ALL_KANJI, { query: 'NHẬT' })[0]?.character, '日');
});
