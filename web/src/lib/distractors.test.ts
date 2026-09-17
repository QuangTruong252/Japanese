import { test } from 'node:test';
import assert from 'node:assert/strict';
import { okuriganaTail, pickDistractors, type DistractorCandidate } from './distractors.ts';

test('okuriganaTail trích xuất đúng đuôi kana của từ', () => {
  assert.equal(okuriganaTail('食べます'), 'べます');
  assert.equal(okuriganaTail('行きます'), 'きます');
  assert.equal(okuriganaTail('学生'), ''); // danh từ không có đuôi okurigana
  assert.equal(okuriganaTail('高い'), 'い');
});

test('pickDistractors không bao giờ chứa chính đáp án đúng', () => {
  const answer: DistractorCandidate = { kana: 'たべます', type: 'verb-2', stripped: '食べます' };
  const pool: DistractorCandidate[] = [
    answer,
    { kana: 'いきます', type: 'verb-1', stripped: '行きます' },
    { kana: 'のみます', type: 'verb-1', stripped: '飲みます' },
    { kana: 'みせます', type: 'verb-2', stripped: '見せます' },
    { kana: 'がくせい', type: 'noun', stripped: '学生' },
  ];

  const result = pickDistractors(answer, pool, 3, () => 0.5);
  assert.equal(result.length, 3);
  assert.ok(!result.includes('たべます'));
});

test('pickDistractors ưu tiên ứng viên cùng loại từ và cùng đuôi okurigana', () => {
  const answer: DistractorCandidate = { kana: 'たべます', type: 'verb-2', stripped: '食べます' };
  const pool: DistractorCandidate[] = [
    { kana: 'みせます', type: 'verb-2', stripped: '見せます' }, // cùng type verb-2 (+3), cùng đuôi "ます" (+3), diff len (+2) => điểm cao nhất
    { kana: 'がくせい', type: 'noun', stripped: '学生' },        // khác type, khác đuôi => điểm thấp
    { kana: 'いきます', type: 'verb-1', stripped: '行きます' },   // khác type, cùng đuôi "ます" (+3)
  ];

  const result = pickDistractors(answer, pool, 1, () => 0);
  assert.equal(result[0], 'みせます');
});
