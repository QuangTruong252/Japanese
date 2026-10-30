import test from 'node:test';
import assert from 'node:assert/strict';
import { glossaryWidth, GLOSSARY_MIN_WIDTH } from './reading-glossary-width.ts';

test('mục ngắn ra bề rộng tối thiểu', () => {
  assert.equal(glossaryWidth([{ labelJp: '本', meaningsVi: ['sách'] }], 416), GLOSSARY_MIN_WIDTH);
});

test('mục có ví dụ hoặc ảnh lấy bề rộng tối đa', () => {
  assert.equal(glossaryWidth([{ labelJp: '～ます', meaningsVi: ['x'], exampleJp: '行[い]きます' }], 416), 416);
  assert.equal(glossaryWidth([{ labelJp: '本', meaningsVi: ['x'], illustration: {} }], 416), 416);
});

test('nghĩa dài nở rộng nhưng không vượt max', () => {
  const mid = glossaryWidth([{ labelJp: '本', meaningsVi: ['a'.repeat(40)] }], 416);
  assert.ok(mid > GLOSSARY_MIN_WIDTH && mid < 416);
  assert.equal(glossaryWidth([{ labelJp: '本', meaningsVi: ['a'.repeat(200)] }], 416), 416);
  assert.equal(glossaryWidth([{ labelJp: '本', meaningsVi: ['a'.repeat(200)] }], 300), 300);
});
