import { stripFurigana } from './japanese.ts';

/**
 * Chuẩn hóa chuỗi tìm kiếm:
 * 1. Chữ thường, gộp khoảng trắng
 * 2. Bỏ dấu tiếng Việt NFD
 * 3. Bắt buộc thay đ/Đ thành d (ca kiểm thử: dong tu -> động từ, do an -> đồ ăn)
 * 4. Xóa notation Furigana nếu có
 */
export function normalizeSearchText(text: string): string {
  if (!text) return '';
  const stripped = stripFurigana(text);
  return stripped
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    .replace(/[đĐ]/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}
