export interface AppSettings {
  furigana: boolean;
  furiganaSize: 'normal' | 'large';
  hideTranslations: boolean;
  theme: 'light' | 'dark' | 'system';
  soundVolume: number;
  dailyNewLimit: number;
}

export const SETTINGS_STORAGE_KEY = 'jp:settings';

export const DEFAULT_SETTINGS: AppSettings = {
  furigana: true,
  furiganaSize: 'normal',
  hideTranslations: false,
  theme: 'system',
  soundVolume: 1.0,
  dailyNewLimit: 20,
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
