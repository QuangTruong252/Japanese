import type { ExerciseType } from '../types/index.ts';

export interface PracticePreset {
  lessons: number[];
  types: ExerciseType[];
  questionCount: number;
}

export interface AppSettings {
  furigana: boolean;
  furiganaSize: 'normal' | 'large';
  hideTranslations: boolean;
  theme: 'light' | 'dark' | 'system';
  soundVolume: number;
  dailyNewLimit: number;
  /** Số mục tối đa của một phiên ôn (SPEC-05 §2.1a). */
  reviewBatchSize: number;
  /** "Đã học đến bài N" do người học khai báo; 0 = chưa khai báo (SPEC-05 §2.1a). */
  learnedThroughLesson: number;
  /** Cấu hình mặc định/lưu tạm thời của màn Luyện tập. */
  practicePreset: PracticePreset;
}

export const SETTINGS_STORAGE_KEY = 'jp:settings';

export const VALID_PRACTICE_EXERCISE_TYPES: ExerciseType[] = [
  'mc',
  'matching',
  'cloze',
  'reorder',
  'listening',
];

export const VALID_PRACTICE_QUESTION_COUNTS = [10, 15, 20, 30] as const;

export const DEFAULT_PRACTICE_PRESET: PracticePreset = {
  lessons: [1],
  types: ['mc', 'matching', 'cloze', 'reorder', 'listening'],
  questionCount: 15,
};

export const DEFAULT_SETTINGS: AppSettings = {
  furigana: true,
  furiganaSize: 'normal',
  hideTranslations: false,
  theme: 'system',
  soundVolume: 1.0,
  dailyNewLimit: 20,
  reviewBatchSize: 20,
  learnedThroughLesson: 0,
  practicePreset: DEFAULT_PRACTICE_PRESET,
};

const clampInt = (value: unknown, min: number, max: number, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.max(min, Math.min(max, Math.round(value)))
    : fallback;

export const validatePracticePreset = (raw: unknown): PracticePreset => {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PRACTICE_PRESET, lessons: [...DEFAULT_PRACTICE_PRESET.lessons], types: [...DEFAULT_PRACTICE_PRESET.types] };
  }
  const obj = raw as Record<string, unknown>;

  let lessons: number[] = [...DEFAULT_PRACTICE_PRESET.lessons];
  if (Array.isArray(obj.lessons)) {
    const validLessons = obj.lessons.filter(
      (n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 25,
    );
    const unique = [...new Set(validLessons)].sort((a, b) => a - b);
    if (unique.length > 0) {
      lessons = unique;
    }
  }

  let types: ExerciseType[] = [...DEFAULT_PRACTICE_PRESET.types];
  if (Array.isArray(obj.types)) {
    const validTypes = obj.types.filter((t): t is ExerciseType =>
      typeof t === 'string' && VALID_PRACTICE_EXERCISE_TYPES.includes(t as ExerciseType),
    );
    const unique = [...new Set(validTypes)];
    if (unique.length > 0) {
      types = unique;
    }
  }

  let questionCount: number = DEFAULT_PRACTICE_PRESET.questionCount;
  if (
    typeof obj.questionCount === 'number' &&
    VALID_PRACTICE_QUESTION_COUNTS.includes(obj.questionCount as 10 | 15 | 20 | 30)
  ) {
    questionCount = obj.questionCount;
  }

  return { lessons, types, questionCount };
};

export const loadSettings = (): AppSettings => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      furigana: typeof parsed.furigana === 'boolean' ? parsed.furigana : DEFAULT_SETTINGS.furigana,
      furiganaSize: parsed.furiganaSize === 'large' ? 'large' : 'normal',
      hideTranslations:
        typeof parsed.hideTranslations === 'boolean'
          ? parsed.hideTranslations
          : DEFAULT_SETTINGS.hideTranslations,
      theme: ['light', 'dark', 'system'].includes(parsed.theme)
        ? parsed.theme
        : DEFAULT_SETTINGS.theme,
      soundVolume:
        typeof parsed.soundVolume === 'number'
          ? Math.max(0, Math.min(1, parsed.soundVolume))
          : DEFAULT_SETTINGS.soundVolume,
      dailyNewLimit:
        typeof parsed.dailyNewLimit === 'number'
          ? Math.max(1, Math.min(100, parsed.dailyNewLimit))
          : DEFAULT_SETTINGS.dailyNewLimit,
      reviewBatchSize: clampInt(parsed.reviewBatchSize, 5, 100, DEFAULT_SETTINGS.reviewBatchSize),
      learnedThroughLesson: clampInt(parsed.learnedThroughLesson, 0, 25, 0),
      practicePreset: validatePracticePreset(parsed.practicePreset),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

type SettingsListener = () => void;
const listeners = new Set<SettingsListener>();

export const subscribeSettings = (listener: SettingsListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

let cachedSettings: AppSettings | null = null;
let lastRawSettings: string | null = null;

export const getSettingsSnapshot = (): AppSettings => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_SETTINGS;
  }
  const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (raw === lastRawSettings && cachedSettings !== null) {
    return cachedSettings;
  }
  lastRawSettings = raw;
  cachedSettings = loadSettings();
  return cachedSettings;
};

export const saveSettings = (partial: Partial<AppSettings>): AppSettings => {
  const current = loadSettings();
  const next: AppSettings = { ...current, ...partial };
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      applySettingsToDOM(next);
    } catch {
      // Bỏ qua lỗi quota storage nếu có
    }
  }
  lastRawSettings = typeof window !== 'undefined' ? window.localStorage.getItem(SETTINGS_STORAGE_KEY) : null;
  cachedSettings = next;
  listeners.forEach((fn) => fn());
  return next;
};

export const applySettingsToDOM = (settings: AppSettings): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Furigana visibility
  if (!settings.furigana) {
    root.classList.add('hide-furigana');
  } else {
    root.classList.remove('hide-furigana');
  }

  // Furigana size
  if (settings.furiganaSize === 'large') {
    root.classList.add('furigana-large');
  } else {
    root.classList.remove('furigana-large');
  }

  // Translations visibility (Study mode)
  if (settings.hideTranslations) {
    root.classList.add('hide-translations');
  } else {
    root.classList.remove('hide-translations');
  }

  // Theme
  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const getFOUCScriptContent = (): string => {
  return `(function() {
    try {
      var raw = localStorage.getItem('jp:settings');
      if (!raw) return;
      var s = JSON.parse(raw);
      var cl = document.documentElement.classList;
      if (s.furigana === false) cl.add('hide-furigana');
      if (s.furiganaSize === 'large') cl.add('furigana-large');
      if (s.hideTranslations === true) cl.add('hide-translations');
      if (s.theme === 'dark' || (s.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        cl.add('dark');
      }
    } catch (e) {}
  })();`;
};
