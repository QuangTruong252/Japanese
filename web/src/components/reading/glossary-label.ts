import { formatOptionalBrackets, stripFurigana } from '@/lib/japanese';

// Nhãn glossary lưu cú pháp furigana của dữ liệu; tiêu đề popover chỉ hiện chữ, cách đọc đã có chip riêng.
export function glossaryLabel(entry: { labelJp: string }): string {
  return formatOptionalBrackets(stripFurigana(entry.labelJp));
}
