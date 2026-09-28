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

test('buildSearchIndex nạp đủ 7 nhóm dữ liệu tĩnh với href chính xác', async () => {
  const index = await buildSearchIndex();
  assert.ok(index.length >= 1400, `Chỉ mục phải có ít nhất 1400 mục, thực tế: ${index.length}`);

  const kinds = new Set(index.map((e) => e.kind));
  assert.ok(kinds.has('feature'));
  assert.ok(kinds.has('vocab'));
  assert.ok(kinds.has('grammar'));
  assert.ok(kinds.has('kanji'));
  assert.ok(kinds.has('verb'));
  assert.ok(kinds.has('table'));
  assert.ok(kinds.has('lesson'));

  // Kiểm tra feature href
  const featureTraCuu = index.find((e) => e.id === 'feature-tra-cuu');
  assert.ok(featureTraCuu);
  assert.equal(featureTraCuu.href, '/hoc/tra-cuu');

  const featureKana = index.find((e) => e.id === 'feature-kana');
  assert.ok(featureKana);
  assert.equal(featureKana.href, '/hoc/tra-cuu/kana');

  const featureKanji = index.find((e) => e.id === 'feature-kanji');
  assert.ok(featureKanji);
  assert.equal(featureKanji.href, '/hoc/tra-cuu/kanji');

  const featureDongTu = index.find((e) => e.id === 'feature-dong-tu');
  assert.ok(featureDongTu);
  assert.equal(featureDongTu.href, '/hoc/tra-cuu/dong-tu');

  const featureThongKe = index.find((e) => e.id === 'feature-thong-ke');
  assert.ok(featureThongKe);
  assert.equal(featureThongKe.href, '/ca-nhan/thong-ke');

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
  // feature -> vocab -> grammar -> kanji -> verb -> table -> lesson
  const kindOrder = ['feature', 'vocab', 'grammar', 'kanji', 'verb', 'table', 'lesson'];
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

test('executeSearch tìm động từ qua cả thể từ điển và thể masu', async () => {
  const index = await buildSearchIndex();

  // 1. Tìm bằng thể từ điển: kiru
  const resKiru = executeSearch(index, 'kiru');
  assert.ok(resKiru.results.some((r) => r.id === 'vocab-07-kirimasu'));

  // 2. Tìm bằng thể masu: kirimasu
  const resMasu = executeSearch(index, 'kirimasu');
  assert.ok(resMasu.results.some((r) => r.id === 'vocab-07-kirimasu'));

  // 3. Tìm bằng kana thể masu: きります
  const resKanaMasu = executeSearch(index, 'きります');
  assert.ok(resKanaMasu.results.some((r) => r.id === 'vocab-07-kirimasu'));
});

test('executeSearch trả về đích tính năng phù hợp cho tra cuu, kana, kanji, dong tu, thong ke với đúng href (SPEC-17 §9)', async () => {
  const index = await buildSearchIndex();

  // 1. tra cuu -> trả feature Tra cứu (Tier 1) với href /hoc/tra-cuu
  const resTraCuu = executeSearch(index, 'tra cuu');
  assert.equal(resTraCuu.results[0]?.id, 'feature-tra-cuu');
  assert.equal(resTraCuu.results[0]?.kind, 'feature');
  assert.equal(resTraCuu.results[0]?.href, '/hoc/tra-cuu');

  // 2. kana -> trả feature Bảng chữ Kana với href /hoc/tra-cuu/kana
  const resKana = executeSearch(index, 'kana');
  const featureKana = resKana.results.find((r) => r.id === 'feature-kana');
  assert.ok(featureKana, 'Phải tìm thấy feature-kana');
  assert.equal(featureKana?.kind, 'feature');
  assert.equal(featureKana?.href, '/hoc/tra-cuu/kana');

  // 3. kanji -> trả feature Tra cứu Kanji với href /hoc/tra-cuu/kanji và không làm mất kết quả nội dung
  const resKanji = executeSearch(index, 'kanji');
  const featureKanji = resKanji.results.find((r) => r.id === 'feature-kanji');
  assert.ok(featureKanji, 'Phải tìm thấy feature-kanji');
  assert.equal(featureKanji?.kind, 'feature');
  assert.equal(featureKanji?.href, '/hoc/tra-cuu/kanji');
  assert.ok(
    resKanji.results.some((r) => r.kind === 'vocab' || r.kind === 'kanji' || r.kind === 'grammar'),
    'Không làm mất kết quả nội dung khi tìm kanji'
  );

  // 4. dong tu -> trả feature Tra cứu Động từ với href /hoc/tra-cuu/dong-tu bên cạnh học liệu nội dung
  const resDongTu = executeSearch(index, 'dong tu');
  const featureDongTu = resDongTu.results.find((r) => r.id === 'feature-dong-tu');
  assert.ok(featureDongTu, 'Phải tìm thấy feature-dong-tu');
  assert.equal(featureDongTu?.kind, 'feature');
  assert.equal(featureDongTu?.href, '/hoc/tra-cuu/dong-tu');
  assert.ok(
    resDongTu.results.some((r) => r.kind === 'grammar' || r.kind === 'table' || r.kind === 'verb'),
    'Vẫn trả các nội dung học liệu về động từ'
  );

  // 5. thong ke -> trả feature Thống kê với href /ca-nhan/thong-ke
  const resThongKe = executeSearch(index, 'thong ke');
  assert.equal(resThongKe.results[0]?.id, 'feature-thong-ke');
  assert.equal(resThongKe.results[0]?.kind, 'feature');
  assert.equal(resThongKe.results[0]?.href, '/ca-nhan/thong-ke');
});

test('executeSearch: watashi và tôi vẫn trả nội dung học liệu, nhóm Tính năng không đẩy nội dung khỏi giới hạn 20 (SPEC-17 §9)', async () => {
  const index = await buildSearchIndex();

  // 1. Tìm "watashi" trả về nội dung từ vựng (không phải rỗng)
  const resWatashi = executeSearch(index, 'watashi');
  assert.ok(resWatashi.results.length > 0, 'watashi phải trả kết quả');
  assert.ok(
    resWatashi.results.some((r) => r.kind === 'vocab' && (r.keys.some((k) => k.includes('watashi')) || r.label.includes('私'))),
    'watashi phải trả từ vựng tương ứng (ví dụ: 私)'
  );

  // 2. Tìm "tôi" (tiếng Việt có dấu) trả về từ vựng
  const resToi = executeSearch(index, 'tôi');
  assert.ok(resToi.results.length > 0, 'tôi phải trả kết quả');
  assert.ok(
    resToi.results.some((r) => r.kind === 'vocab' && (r.sublabel.toLowerCase().includes('tôi') || r.keys.some((k) => k.includes('toi')))),
    'tôi phải trả từ vựng có nghĩa tiếng Việt là tôi'
  );

  // 3. Nhóm tính năng không đẩy nội dung khỏi giới hạn 20 kết quả
  // Với từ khóa khớp cả tính năng lẫn nhiều nội dung (như "kanji" hoặc "dong tu")
  const resKanji = executeSearch(index, 'kanji');
  assert.ok(resKanji.results.length <= 20, 'Tổng số kết quả không vượt quá 20');
  const kanjiFeatureCount = resKanji.results.filter((r) => r.kind === 'feature').length;
  assert.ok(kanjiFeatureCount <= 4, 'Số lượng tính năng tối đa 4');
  const kanjiContentCount = resKanji.results.filter((r) => r.kind !== 'feature').length;
  assert.ok(kanjiContentCount > 0, 'Vẫn có chỗ cho các kết quả nội dung học liệu');

  // Với từ khóa thuần nội dung như "watashi", nhóm tính năng = 0, toàn bộ kết quả là nội dung
  const watashiFeatureCount = resWatashi.results.filter((r) => r.kind === 'feature').length;
  assert.equal(watashiFeatureCount, 0, 'watashi không có kết quả tính năng nào');
  assert.ok(resWatashi.results.length <= 20, 'watashi kết quả <= 20');
});

test('executeSearch giới hạn nhóm tính năng tối đa 4 mục, không làm tụt học liệu (SPEC-17)', async () => {
  const index = await buildSearchIndex();

  const resTraCuu = executeSearch(index, 'tra cuu');
  const featureCount = resTraCuu.results.filter((r) => r.kind === 'feature').length;
  assert.ok(featureCount <= 4, `Số lượng tính năng phải <= 4, thực tế: ${featureCount}`);

  // Tìm từ tiếng Nhật gakusei không chứa tính năng nào
  const resGakusei = executeSearch(index, 'gakusei');
  assert.equal(resGakusei.results.filter((r) => r.kind === 'feature').length, 0);
  assert.ok(resGakusei.results.length > 0);
});


