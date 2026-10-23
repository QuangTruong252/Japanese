import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyVocab, filterVocab, groupVocab, vocabTargetId } from './vocab-filter.ts';

test('vocabTargetId đệm số 0 và đếm từ 1', () => {
  assert.equal(vocabTargetId(1, 0), 'vocab-01-01');
  assert.equal(vocabTargetId(12, 9), 'vocab-12-10');
});

test('classifyVocab: chưa học, đang ôn, từ khó', () => {
  assert.deepEqual(classifyVocab(undefined), ['new']);
  assert.deepEqual(classifyVocab(0), ['reviewing']);
  assert.deepEqual(classifyVocab(1), ['reviewing', 'hard']);
});

test('groupVocab đếm đủ ba nhóm, từ khó nằm trong đang ôn', () => {
  const reviews = new Map([
    ['vocab-03-01', 0],
    ['vocab-03-02', 2],
  ]);
  const { counts, indices } = groupVocab(3, 4, reviews);
  assert.deepEqual(counts, { all: 4, new: 2, reviewing: 2, hard: 1 });
  assert.deepEqual(indices.new, [2, 3]);
  assert.deepEqual(indices.hard, [1]);
});

test('groupVocab: bài không có từ', () => {
  const { counts } = groupVocab(1, 0, new Map());
  assert.deepEqual(counts, { all: 0, new: 0, reviewing: 0, hard: 0 });
});

test('filterVocab giữ thứ tự bài', () => {
  assert.deepEqual(filterVocab(['a', 'b', 'c'], [0, 2]), ['a', 'c']);
  assert.deepEqual(filterVocab(['a'], []), []);
});
