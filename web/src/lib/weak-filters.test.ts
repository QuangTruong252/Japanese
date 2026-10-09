import assert from 'node:assert/strict';
import test from 'node:test';
import type { TargetType } from '../types/index.ts';
import { weakFilterTypes } from './weak-filters.ts';

const ORDER: TargetType[] = ['vocab', 'grammar', 'kanji', 'particle', 'listening'];

test('weakFilterTypes: ẩn hàng chip khi ≤ 1 loại', () => {
  assert.deepEqual(weakFilterTypes(new Set(), ORDER), []);
  assert.deepEqual(weakFilterTypes(new Set<TargetType>(['vocab']), ORDER), []);
});

test('weakFilterTypes: chỉ giữ loại có dữ liệu, theo thứ tự order', () => {
  assert.deepEqual(weakFilterTypes(new Set<TargetType>(['particle', 'vocab']), ORDER), [
    'vocab',
    'particle',
  ]);
});
