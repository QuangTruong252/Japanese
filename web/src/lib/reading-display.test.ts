import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_READING_DISPLAY, loadReadingDisplay, parseReadingDisplay, READING_DISPLAY_KEY, saveReadingDisplay } from './reading-display.ts';

const valid = { version: 1, fontStep: 5, background: 'dark', font: 'gothic' };

test('parseReadingDisplay: hợp lệ giữ nguyên, mặc định là {3, paper, mincho}', () => {
  assert.deepEqual(DEFAULT_READING_DISPLAY, { fontStep: 3, background: 'paper', font: 'mincho' });
  assert.deepEqual(parseReadingDisplay(JSON.stringify(valid)), { fontStep: 5, background: 'dark', font: 'gothic' });
  assert.deepEqual(parseReadingDisplay(JSON.stringify({ ...valid, fontStep: 1, background: 'white', font: 'mincho' })), { fontStep: 1, background: 'white', font: 'mincho' });
});

test('parseReadingDisplay: sai một trường thì cả bộ về mặc định', () => {
  for (const bad of [{ ...valid, version: 2 }, { ...valid, fontStep: 0 }, { ...valid, fontStep: 6 }, { ...valid, fontStep: 2.5 }, { ...valid, background: 'xanh' }, { ...valid, font: 'serif' }, { version: 1 }]) {
    assert.deepEqual(parseReadingDisplay(JSON.stringify(bad)), DEFAULT_READING_DISPLAY);
  }
  for (const raw of ['{hỏng', 'null', '[]', null]) assert.deepEqual(parseReadingDisplay(raw), DEFAULT_READING_DISPLAY);
});

/** Thay `window` toàn cục trong một test rồi trả lại như cũ. */
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
function stubWindow(t: TestContext, value: unknown) {
  Object.defineProperty(globalThis, 'window', { value, configurable: true });
  t.after(() => {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else delete (globalThis as { window?: unknown }).window;
  });
}

test('load/save qua localStorage; lỗi localStorage không ném', (t) => {
  const store = new Map<string, string>();
  stubWindow(t, { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) } });
  assert.deepEqual(loadReadingDisplay(), DEFAULT_READING_DISPLAY);
  assert.equal(saveReadingDisplay({ fontStep: 4, background: 'white', font: 'gothic' }), true);
  assert.deepEqual(JSON.parse(store.get(READING_DISPLAY_KEY)!), { version: 1, fontStep: 4, background: 'white', font: 'gothic' });
  assert.deepEqual(loadReadingDisplay(), { fontStep: 4, background: 'white', font: 'gothic' });

  stubWindow(t, { localStorage: { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('quota'); } } });
  assert.deepEqual(loadReadingDisplay(), DEFAULT_READING_DISPLAY);
  assert.equal(saveReadingDisplay(DEFAULT_READING_DISPLAY), false);
});
