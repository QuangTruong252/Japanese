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

test('speak trả về null khi môi trường không hỗ trợ speechSynthesis', () => {
  assert.equal(speak('こんにちは', 1.0), null);
});

test('speak áp âm lượng theo cài đặt, tham số volume ghi đè, tốc độ giữ nguyên', () => {
  const g = globalThis as Record<string, unknown>;
  class Utterance {
    lang = '';
    rate = 1;
    volume = 1;
    voice: unknown = null;
    text: string;
    constructor(text: string) {
      this.text = text;
    }
  }
  g.SpeechSynthesisUtterance = Utterance;
  g.window = {
    speechSynthesis: { cancel() {}, speak() {}, getVoices: () => [] },
    localStorage: {
      getItem: () => JSON.stringify({ soundVolume: 0.3 }),
    },
  };
  try {
    const saved = speak('こんにちは', 1.0)!;
    assert.equal(saved.volume, 0.3);
    assert.equal(saved.rate, 1.0);
    assert.equal(speak('こんにちは', 1.0, 0.8)!.volume, 0.8);
  } finally {
    delete g.window;
    delete g.SpeechSynthesisUtterance;
  }
});
