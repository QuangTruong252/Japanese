export const READING_DISPLAY_KEY = 'jp:reading-display';

export const READING_BACKGROUNDS = ['paper', 'white', 'dark'] as const;
export const READING_FONTS = ['mincho', 'gothic'] as const;

export interface ReadingDisplay {
  /** Cỡ chữ 5 nấc, 3 là mặc định. */
  fontStep: 1 | 2 | 3 | 4 | 5;
  background: (typeof READING_BACKGROUNDS)[number];
  font: (typeof READING_FONTS)[number];
}

export const DEFAULT_READING_DISPLAY: ReadingDisplay = { fontStep: 3, background: 'paper', font: 'mincho' };

/** Validate cả object: một trường sai thì dùng mặc định cho cả bộ, không nhặt từng phần. */
export function parseReadingDisplay(raw: string | null): ReadingDisplay {
  try {
    const c = JSON.parse(raw ?? '') as Record<string, unknown> | null;
    if (c && c.version === 1 && Number.isInteger(c.fontStep) && (c.fontStep as number) >= 1 && (c.fontStep as number) <= 5 &&
        READING_BACKGROUNDS.includes(c.background as ReadingDisplay['background']) && READING_FONTS.includes(c.font as ReadingDisplay['font'])) {
      return { fontStep: c.fontStep as ReadingDisplay['fontStep'], background: c.background as ReadingDisplay['background'], font: c.font as ReadingDisplay['font'] };
    }
  } catch {
    // JSON hỏng: dùng mặc định.
  }
  return DEFAULT_READING_DISPLAY;
}

/** Chỉ ảnh hưởng vùng đọc, không đổi theme hay cài đặt chung của app. */
export function loadReadingDisplay(): ReadingDisplay {
  try {
    return parseReadingDisplay(window.localStorage.getItem(READING_DISPLAY_KEY));
  } catch {
    return DEFAULT_READING_DISPLAY;
  }
}

/** Trả false khi localStorage lỗi; cài đặt vẫn áp dụng trong phiên hiện tại. */
export function saveReadingDisplay(display: ReadingDisplay): boolean {
  try {
    window.localStorage.setItem(READING_DISPLAY_KEY, JSON.stringify({ version: 1, ...display }));
    return true;
  } catch {
    return false;
  }
}
