import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSearchText,
  buildSearchIndex,
  executeSearch,
  type SearchEntry,
} from './search.ts';

test('normalizeSearchText chuẩn hóa chữ thường, khoảng trắng, bỏ dấu và thay đ/Đ thành d', () => {
  assert.equal(normalizeSearchText('  Học   Sinh  '), 'hoc sinh');
  assert.equal(normalizeSearchText('Thời gian'), 'thoi gian');
  assert.equal(normalizeSearchText('động từ'), 'dong tu');
  assert.equal(normalizeSearchText('Đồ ăn'), 'do an');
  assert.equal(normalizeSearchText('学生[がくせい]'), '学生');
  assert.equal(normalizeSearchText('私[わたし]は 学生[がくせい]です'), '私は 学生です');
});

test('buildSearchIndex nạp đủ 6 nhóm dữ liệu tĩnh với href chính xác', async () => {
  const index = await buildSearchIndex();
  assert.ok(index.length >= 1400, `Chỉ mục phải có ít nhất 1400 mục, thực tế: ${index.length}`);

  const kinds = new Set(index.map((e) => e.kind));
  assert.ok(kinds.has('vocab'));
  assert.ok(kinds.has('grammar'));
  assert.ok(kinds.has('kanji'));
  assert.ok(kinds.has('verb'));
  assert.ok(kinds.has('table'));
  assert.ok(kinds.has('lesson'));

  // Kiểm tra neo href
  const gakusei = index.find((e) => e.id === 'vocab-01-gakusei');
  assert.ok(gakusei);
  assert.equal(gakusei.href, '/hoc/1#vocab-gakusei');
  assert.equal(gakusei.lesson, 1);

  const verbAu = index.find((e) => e.id === 'verb-g1-01');
  assert.ok(verbAu);
  assert.equal(verbAu.href, '/hoc/tra-cuu/dong-tu?q=%E3%81%82%E3%81%84%E3%81%BE%E3%81%99');

  const kanjiHito = index.find((e) => e.id === 'kanji-人');
  assert.ok(kanjiHito);
  assert.equal(kanjiHito.href, '/hoc/tra-cuu/kanji/%E4%BA%BA');

  const tableDemo = index.find((e) => e.id === 'table-demonstratives');
  assert.ok(tableDemo);
  assert.equal(tableDemo.href, '/hoc/tra-cuu/bang/demonstratives');

  const lesson1 = index.find((e) => e.id === 'lesson-1');
  assert.ok(lesson1);
  assert.equal(lesson1.href, '/hoc/1');
});

test('executeSearch tìm thấy kết quả qua cả romaji, hiragana, kanji và tiếng Việt không dấu', async () => {
  const index = await buildSearchIndex();

  // 1. Gõ romaji gakusei
  const resRomaji = executeSearch(index, 'gakusei');
  assert.ok(resRomaji.results.some((r) => r.id === 'vocab-01-gakusei'));

  // 2. Gõ hiragana がくせい
  const resHiragana = executeSearch(index, 'がくせい');
  assert.ok(resHiragana.results.some((r) => r.id === 'vocab-01-gakusei'));

  // 3. Gõ kanji 学生
  const resKanji = executeSearch(index, '学生');
  assert.ok(resKanji.results.some((r) => r.id === 'vocab-01-gakusei'));

  // 4. Gõ tiếng Việt không dấu hoc sinh
  const resNoAccents = executeSearch(index, 'hoc sinh');
  assert.ok(resNoAccents.results.some((r) => r.id === 'vocab-01-gakusei'));

  // 5. Gõ tiếng Việt có dấu học sinh -> kết quả tương tự
  const resWithAccents = executeSearch(index, 'học sinh');
  assert.ok(resWithAccents.results.some((r) => r.id === 'vocab-01-gakusei'));
});

test('executeSearch xử lý ca kiểm thử đ -> d: dong tu và do an', async () => {
  const index = await buildSearchIndex();

  const resDongTu = executeSearch(index, 'dong tu');
  assert.ok(resDongTu.results.some((r) => r.kind === 'verb' || r.sublabel.includes('động từ') || r.label.includes('Động từ')));

  const resDoAn = executeSearch(index, 'do an');
  assert.ok(resDoAn.results.some((r) => r.sublabel.includes('đồ ăn') || r.keys.some((k) => k.includes('do an'))));
});

test('executeSearch ưu tiên xếp hạng chính xác > đầu chuỗi > chứa trong', () => {
  const mockEntries: SearchEntry[] = [
    {
      id: '1',
      kind: 'vocab',
      label: '学生[がくせい]たち',
      sublabel: 'các học sinh',
      keys: ['がくせいたち', 'gakuseitachi', 'cac hoc sinh'],
      href: '/hoc/1#vocab-1',
    },
    {
      id: '2',
      kind: 'vocab',
      label: '学生[がくせい]',
      sublabel: 'học sinh',
      keys: ['学生', 'がくせい', 'gakusei', 'hoc sinh'],
      href: '/hoc/1#vocab-2',
    },
    {
      id: '3',
      kind: 'vocab',
      label: '留学生[りゅうがくせい]',
      sublabel: 'du học sinh',
      keys: ['留学生', 'りゅうがくせい', 'ryuugakusei', 'du hoc sinh'],
      href: '/hoc/1#vocab-3',
    },
  ];

  const searchRes = executeSearch(mockEntries, 'gakusei');
  // id 2 khớp chính xác -> phải đứng đầu tiên!
  assert.equal(searchRes.results[0]?.id, '2');
  // id 1 khớp đầu chuỗi -> đứng thứ hai
  assert.equal(searchRes.results[1]?.id, '1');
  // id 3 khớp chứa trong -> đứng thứ ba
  assert.equal(searchRes.results[2]?.id, '3');
});

test('executeSearch tuân thủ thứ tự nhóm cố định và giới hạn 5 mục/nhóm, tối đa 20 mục', async () => {
  const index = await buildSearchIndex();

  // Tìm một từ phổ biến xuất hiện trong nhiều nhóm
  const res = executeSearch(index, 'a');
  assert.ok(res.results.length <= 20);

  // Kiểm tra thứ tự nhóm trong kết quả xuất hiện đúng:
  // vocab -> grammar -> kanji -> verb -> table -> lesson
  const kindOrder = ['vocab', 'grammar', 'kanji', 'verb', 'table', 'lesson'];
  let lastKindIndex = -1;

  for (const item of res.results) {
    const currentKindIndex = kindOrder.indexOf(item.kind);
    assert.ok(currentKindIndex >= lastKindIndex, 'Thứ tự nhóm không được đảo ngược');
    lastKindIndex = currentKindIndex;
  }

  // Kiểm tra không nhóm nào vượt quá 5 mục
  const countsByKind: Record<string, number> = {};
  for (const item of res.results) {
    countsByKind[item.kind] = (countsByKind[item.kind] ?? 0) + 1;
    assert.ok(countsByKind[item.kind]! <= 5, `Nhóm ${item.kind} vượt quá 5 mục`);
  }
});
