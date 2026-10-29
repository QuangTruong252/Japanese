import type { ReadingDisplay } from '@/lib/reading-display';
import light from './reading-light.module.css';

/** Cỡ chữ Nhật theo 5 nấc; mặc định (nấc 3) bằng cỡ câu hiển thị lớn của DESIGN. */
const FONT_SIZE = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'] as const;

/**
 * Nền vùng đọc: Theo giao diện dùng token của app; Giấy ngà/Trắng luôn dùng token sáng (lớp `light` đặt lại token),
 * Tối đặt lớp `.dark` để token tối áp cho cả vùng.
 */
const SURFACE = {
  auto: 'bg-background text-foreground',
  paper: `${light.light} bg-background text-foreground`,
  white: `${light.light} bg-card text-foreground`,
  dark: 'dark bg-background text-foreground',
} as const;

/** Nền của ô xem trước trong sheet: cùng bộ token với vùng đọc. */
export const SWATCH = {
  auto: 'bg-background',
  paper: `${light.light} bg-background`,
  white: `${light.light} bg-card`,
  dark: 'dark bg-background',
} as const;

export const surfaceClass = (display: ReadingDisplay) => SURFACE[display.background];

/** Truyền vào prop `className` của `Furigana` (không đặt ở thẻ cha). */
export const jpTextClass = (display: ReadingDisplay) =>
  `${display.font === 'mincho' ? 'jp-display ' : ''}${FONT_SIZE[display.fontStep - 1]} font-medium leading-loose`;
