import assert from 'node:assert/strict';
import test from 'node:test';
import { parseLessonHash, studyHref } from './lesson-links.ts';

const ids = ['wa-desu', 'ka'];

test('parseLessonHash: #grammar-<id> hợp lệ chuyển sang trang điểm', () => {
  assert.deepEqual(parseLessonHash('#grammar-wa-desu', true, 3, ids), { redirect: '/hoc/3/ngu-phap/wa-desu' });
});

test('parseLessonHash: id ngữ pháp lạ về tab Ngữ pháp', () => {
  assert.deepEqual(parseLessonHash('#grammar-khong-co', true, 3, ids), { tab: 'ngu-phap', targetId: null });
});

test('parseLessonHash: hash mã hóa lỗi hoặc lạ → null', () => {
  assert.equal(parseLessonHash('#%E0%A4%A', true, 1, ids), null);
  assert.equal(parseLessonHash('#abc', true, 1, ids), null);
  assert.equal(parseLessonHash('', true, 1, ids), null);
});

test('parseLessonHash: hash mã hóa đúng được giải mã', () => {
  assert.deepEqual(parseLessonHash('#grammar-%77a-desu', true, 1, ids), { redirect: '/hoc/1/ngu-phap/wa-desu' });
});

test('parseLessonHash: tab và neo từ vựng/hội thoại', () => {
  assert.deepEqual(parseLessonHash('#tu-vung', true, 1, ids), { tab: 'tu-vung', targetId: null });
  assert.deepEqual(parseLessonHash('#ngu-phap', true, 1, ids), { tab: 'ngu-phap', targetId: null });
  assert.deepEqual(parseLessonHash('#vocab-x', true, 1, ids), { tab: 'tu-vung', targetId: 'vocab-x' });
  assert.deepEqual(parseLessonHash('#hoi-thoai', true, 1, ids), { tab: 'hoi-thoai', targetId: null });
  assert.deepEqual(parseLessonHash('#dialogue-d1-2', true, 1, ids), { tab: 'hoi-thoai', targetId: 'dialogue-d1-2' });
});

test('parseLessonHash: bài không có hội thoại về Từ vựng', () => {
  assert.deepEqual(parseLessonHash('#hoi-thoai', false, 1, ids), { tab: 'tu-vung', targetId: null });
  assert.deepEqual(parseLessonHash('#dialogue-d1-2', false, 1, ids), { tab: 'tu-vung', targetId: null });
});

test('parseLessonHash: #nghe về Từ vựng khi tab Nghe đang ẩn', () => {
  assert.deepEqual(parseLessonHash('#nghe', true, 1, ids), { tab: 'tu-vung', targetId: null });
});

test('studyHref: ưu tiên map, rồi dạng trực tiếp, rồi trang bài', () => {
  const map = new Map([
    ['grammar-01-01', '/hoc/1/ngu-phap/wa-desu'],
    ['vocab-01-01', '/hoc/1#vocab-watashi'],
  ]);
  assert.equal(studyHref('grammar-01-01', 1, map), '/hoc/1/ngu-phap/wa-desu');
  assert.equal(studyHref('vocab-01-01', 1, map), '/hoc/1#vocab-watashi');
});

test('studyHref: chưa có map thì dựng từ id trực tiếp', () => {
  const empty = new Map<string, string>();
  assert.equal(studyHref('vocab-watashi', 2, empty), '/hoc/2#vocab-watashi');
  assert.equal(studyHref('grammar-wa-desu', 2, empty), '/hoc/2/ngu-phap/wa-desu');
  assert.equal(studyHref('kanji-01', 2, empty), '/hoc/2');
});

test('studyHref: bài không hợp lệ về /hoc', () => {
  assert.equal(studyHref('vocab-watashi', 0, new Map()), '/hoc');
});
