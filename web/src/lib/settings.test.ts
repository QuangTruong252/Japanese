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
  assert.equal(settings.reviewBatchSize, 20);
  assert.equal(settings.learnedThroughLesson, 0);
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


test('loadSettings kẹp reviewBatchSize và learnedThroughLesson về khoảng hợp lệ', () => {
  const store = new Map<string, string>();
  const g = globalThis as unknown as { window?: unknown };
  g.window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
    },
  };
  try {
    store.set('jp:settings', JSON.stringify({ reviewBatchSize: 1000, learnedThroughLesson: -3 }));
    let s = loadSettings();
    assert.equal(s.reviewBatchSize, 100);
    assert.equal(s.learnedThroughLesson, 0);
    store.set('jp:settings', JSON.stringify({ reviewBatchSize: 'x', learnedThroughLesson: 9.6 }));
    s = loadSettings();
    assert.equal(s.reviewBatchSize, 20);
    assert.equal(s.learnedThroughLesson, 10);
  } finally {
    delete g.window;
  }
});

test('loadSettings tương thích ngược khi localStorage thiếu practicePreset', () => {
  const store = new Map<string, string>();
  const g = globalThis as unknown as { window?: unknown };
  g.window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
    },
  };
  try {
    store.set(
      'jp:settings',
      JSON.stringify({
        furigana: false,
        theme: 'dark',
      }),
    );
    const s = loadSettings();
    assert.equal(s.furigana, false);
    assert.equal(s.theme, 'dark');
    assert.deepEqual(s.practicePreset, {
      lessons: [1],
      types: ['mc', 'matching', 'cloze', 'reorder', 'listening'],
      questionCount: 15,
    });
  } finally {
    delete g.window;
  }
});

test('loadSettings nạp và validate practicePreset hợp lệ', () => {
  const store = new Map<string, string>();
  const g = globalThis as unknown as { window?: unknown };
  g.window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
    },
  };
  try {
    store.set(
      'jp:settings',
      JSON.stringify({
        practicePreset: {
          lessons: [3, 2, 5],
          types: ['matching', 'cloze'],
          questionCount: 10,
        },
      }),
    );
    const s = loadSettings();
    assert.deepEqual(s.practicePreset, {
      lessons: [2, 3, 5],
      types: ['matching', 'cloze'],
      questionCount: 10,
    });
  } finally {
    delete g.window;
  }
});

test('loadSettings loại bỏ bài/type/count không hợp lệ trong practicePreset', () => {
  const store = new Map<string, string>();
  const g = globalThis as unknown as { window?: unknown };
  g.window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
    },
  };
  try {
    // Giá trị hoàn toàn sai -> về mặc định
    store.set(
      'jp:settings',
      JSON.stringify({
        practicePreset: {
          lessons: [0, 26, -5, 'abc', 3.5],
          types: ['unknown_type', 123],
          questionCount: 99,
        },
      }),
    );
    let s = loadSettings();
    assert.deepEqual(s.practicePreset.lessons, [1]);
    assert.deepEqual(s.practicePreset.types, ['mc', 'matching', 'cloze', 'reorder', 'listening']);
    assert.equal(s.practicePreset.questionCount, 15);

    // Một phần hợp lệ -> lọc phần hợp lệ và giữ count mặc định
    store.set(
      'jp:settings',
      JSON.stringify({
        practicePreset: {
          lessons: [4, 4, 0, 2, 99],
          types: ['mc', 'bogus', 'mc'],
          questionCount: 20,
        },
      }),
    );
    s = loadSettings();
    assert.deepEqual(s.practicePreset.lessons, [2, 4]);
    assert.deepEqual(s.practicePreset.types, ['mc']);
    assert.equal(s.practicePreset.questionCount, 20);
  } finally {
    delete g.window;
  }
});
