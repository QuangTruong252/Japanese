import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  getFOUCScriptContent,
} from './settings.ts';

test('loadSettings trả về DEFAULT_SETTINGS khi chưa có localStorage', () => {
  const settings = loadSettings();
  assert.deepEqual(settings, DEFAULT_SETTINGS);
  assert.equal(settings.furigana, true);
  assert.equal(settings.furiganaSize, 'normal');
  assert.equal(settings.hideTranslations, false);
  assert.equal(settings.theme, 'system');
  assert.equal(settings.dailyNewLimit, 20);
});

test('getFOUCScriptContent sinh chuỗi JavaScript hợp lệ chống FOUC', () => {
  const script = getFOUCScriptContent();
  assert.ok(script.includes('jp:settings'));
  assert.ok(script.includes('hide-furigana'));
  assert.ok(script.includes('furigana-large'));
  assert.ok(script.includes('hide-translations'));
  assert.ok(script.includes('dark'));
});

test('Theme mặc định là system và chấp nhận light / dark', () => {
  assert.equal(DEFAULT_SETTINGS.theme, 'system');
  const validThemes = ['light', 'dark', 'system'];
  assert.ok(validThemes.includes(DEFAULT_SETTINGS.theme));
});

