import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kanaInfo, parseWritingChars, charStatus, writingCountsText, kanjiWritingInfo } from './writing-ui.ts';
import { getKanjiByChar, isExampleVerified } from './lookup.ts';
import type { KanjiData } from '../types/lookup.ts';
import { newCard } from './fsrs.ts';
import type { WritingCard } from '../types/index.ts';

const now = new Date('2026-10-21T00:00:00Z');
const card = (dueAt: Date, incorrectCount = 0): WritingCard => ({
  char: 'あ',
  fsrsCard: newCard(now),
  dueAt,
  correctCount: 0,
  incorrectCount,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
});

test('kanaInfo: romaji của chữ trong 4 nhóm hàng; chữ lạ không có', () => {
  assert.equal(kanaInfo('あ')?.romaji, 'a');
  assert.equal(kanaInfo('ア')?.romaji, 'a');
  assert.equal(kanaInfo('ぱ')?.romaji, 'pa');
  assert.equal(kanaInfo('x'), undefined);
  assert.equal(kanaInfo('漢'), undefined);
});

test('kanaInfo: giữ altRomaji khi có', () => {
  assert.deepEqual(kanaInfo('ぢ'), { romaji: 'ji', altRomaji: 'di' });
  assert.equal(kanaInfo('あ')?.altRomaji, undefined);
});

test('parseWritingChars: lọc chữ không có nét, bỏ trùng, giữ thứ tự', () => {
  assert.deepEqual(parseWritingChars('ああxア'), ['あ', 'ア']);
  assert.deepEqual(parseWritingChars('ンあン'), ['ン', 'あ']);
  assert.deepEqual(parseWritingChars(null), []);
  assert.deepEqual(parseWritingChars(''), []);
  assert.deepEqual(parseWritingChars('abc漢 '), []);
});

test('charStatus: không thẻ → new; đến hạn ưu tiên hơn khó', () => {
  assert.equal(charStatus(undefined, now), 'new');
  assert.equal(charStatus(card(new Date(now.getTime() - 1)), now), 'due');
  assert.equal(charStatus(card(now), now), 'due');
  assert.equal(charStatus(card(new Date(now.getTime() - 1), 2), now), 'due');
  assert.equal(charStatus(card(new Date(now.getTime() + 1), 2), now), 'hard');
  assert.equal(charStatus(card(new Date(now.getTime() + 1), 0), now), 'known');
});

test('writingCountsText: bỏ phần bằng 0', () => {
  assert.equal(writingCountsText(8, 3), '8 chữ đến hạn · 3 chữ khó');
  assert.equal(writingCountsText(8, 0), '8 chữ đến hạn');
  assert.equal(writingCountsText(0, 3), '3 chữ khó');
  assert.equal(writingCountsText(0, 0), '');
});

const info = (char: string) => kanjiWritingInfo(getKanjiByChar(char)!, isExampleVerified);

test('kanjiWritingInfo: 学 có đủ đề và ví dụ có ô trống', () => {
  assert.deepEqual(info('学'), {
    hanviet: 'HỌC',
    meaning: 'học, học tập',
    on: ['ガク'],
    kun: ['まな.ぶ'],
    example: { blanked: '＿生', reading: 'がくせい', meaning: 'học sinh, sinh viên' },
  });
});

test('kanjiWritingInfo: bỏ ví dụ một ký tự (一 → ví dụ thứ hai), cách đọc lấy cả từ', () => {
  const k = getKanjiByChar('一')!;
  assert.equal(k.examples[0] && [...k.examples[0].word.replace(/\[.*?\]/g, '')].length, 1);
  const ex = info('一').example!;
  assert.ok(ex.blanked.includes('＿') && !ex.blanked.includes('一'));
  assert.equal(ex.reading, ex.reading.normalize('NFC'));
  assert.ok(!/[一-鿿]/.test(ex.reading));
});

test('kanjiWritingInfo: ví dụ đầu chưa dịch bị bỏ qua; mọi ví dụ 1 ký tự → không có example', () => {
  const base: KanjiData = { ...getKanjiByChar('学')!, examples: [] };
  const untranslated = { word: '学校[がっこう]', meaning: { en: 'school', vi: 'school' } };
  const good = { word: '大学[だいがく]', meaning: { en: 'university', vi: 'trường đại học' } };
  const withBoth = kanjiWritingInfo({ ...base, examples: [untranslated, good] }, isExampleVerified);
  assert.deepEqual(withBoth.example, { blanked: '大＿', reading: 'だいがく', meaning: 'trường đại học' });
  assert.equal(kanjiWritingInfo({ ...base, examples: [untranslated] }, isExampleVerified).example, undefined);
  assert.equal(info('魚').example, undefined);
});

test('kanjiWritingInfo: furigana trả đúng cách đọc cả từ', () => {
  const base: KanjiData = { ...getKanjiByChar('学')!, examples: [] };
  const ex = (word: string) => ({ word, meaning: { en: 'a', vi: 'b' } });
  const read = (word: string) => kanjiWritingInfo({ ...base, examples: [ex(word)] }, isExampleVerified).example?.reading;
  assert.equal(read('学[まな]ぶ'), 'まなぶ');
  assert.equal(read('学生[がくせい]'), 'がくせい');
  const nhat = getKanjiByChar('日')!;
  assert.equal(kanjiWritingInfo({ ...nhat, examples: [ex('二日[ふつか]')] }, isExampleVerified).example?.reading, 'ふつか');
});
