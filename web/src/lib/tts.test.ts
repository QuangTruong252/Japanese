import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasJapaneseVoice, speak } from './tts.ts';

test('hasJapaneseVoice trả về false trong môi trường không có window/speechSynthesis', async () => {
  // Môi trường Node.js không có window.speechSynthesis
  const available = await hasJapaneseVoice();
  assert.equal(available, false);
});

test('speak không ném lỗi trong môi trường không hỗ trợ speechSynthesis', () => {
  assert.doesNotThrow(() => {
    speak('こんにちは', 1.0);
  });
});
