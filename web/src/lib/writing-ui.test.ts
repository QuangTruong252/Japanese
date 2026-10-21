import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kanaInfo, parseWritingChars, charStatus, writingCountsText } from './writing-ui.ts';
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
