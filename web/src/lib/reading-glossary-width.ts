export const GLOSSARY_MIN_WIDTH = 280;

interface SizedEntry {
  labelJp: string;
  meaningsVi: string[];
  exampleJp?: string;
  illustration?: unknown;
}

/**
 * Bề rộng popover theo nội dung, kẹp trong [GLOSSARY_MIN_WIDTH, max]. Ước lượng theo số ký tự (không đo DOM) để
 * mũi tên và canh lề tính được ngay lúc bấm; mục có ví dụ hoặc ảnh luôn lấy bề rộng tối đa.
 */
export function glossaryWidth(entries: readonly SizedEntry[], max: number): number {
  const wanted = entries.reduce((widest, e) => {
    if (e.exampleJp || e.illustration) return max;
    // Tiêu đề 30px/ký tự cạnh cụm ba nút (~150px); nghĩa 8px/ký tự, mỗi nghĩa nằm trên một dòng.
    const title = e.labelJp.length * 30 + 190;
    const meaning = Math.max(0, ...e.meaningsVi.map((m) => m.length)) * 8 + 32;
    return Math.max(widest, title, meaning);
  }, 0);
  return Math.min(Math.max(wanted, GLOSSARY_MIN_WIDTH), max);
}
