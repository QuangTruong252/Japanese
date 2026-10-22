import { AUDIO_IMPORT_ENABLED } from './features.ts';

export type LessonTab = 'tu-vung' | 'ngu-phap' | 'hoi-thoai' | 'nghe';

export type HashTarget = { tab: LessonTab; targetId: string | null } | { redirect: string };

/**
 * Hash của trang bài → tab + phần tử đích (null = đầu thanh tab), hoặc trang để chuyển tới (link cũ
 * `#grammar-<id>` nay là trang riêng của điểm). Hash lạ → null.
 */
export function parseLessonHash(
  hash: string,
  hasDialogues: boolean,
  lessonNum: number,
  grammarIds: string[],
): HashTarget | null {
  let id: string;
  try {
    id = decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return null;
  }
  if (id === 'tu-vung' || id === 'ngu-phap') return { tab: id, targetId: null };
  // Bài không có hội thoại thì tab không tồn tại: về Từ vựng thay vì để panel trống.
  if (id === 'hoi-thoai' || id.startsWith('dialogue-')) {
    if (!hasDialogues) return { tab: 'tu-vung', targetId: null };
    return { tab: 'hoi-thoai', targetId: id === 'hoi-thoai' ? null : id };
  }
  // Link cũ `#nghe` không gãy khi tab Nghe đang ẩn: về đầu thanh tab của Từ vựng.
  if (id === 'nghe') return { tab: AUDIO_IMPORT_ENABLED ? 'nghe' : 'tu-vung', targetId: null };
  if (id.startsWith('vocab-')) return { tab: 'tu-vung', targetId: id };
  if (id.startsWith('grammar-')) {
    const pointId = id.slice('grammar-'.length);
    return grammarIds.includes(pointId)
      ? { redirect: `/hoc/${lessonNum}/ngu-phap/${pointId}` }
      : { tab: 'ngu-phap', targetId: null };
  }
  return null;
}

/** Đích "Xem bài" của một mục ôn: từ vựng nhảy tới neo trong bài, điểm ngữ pháp mở thẳng trang riêng của điểm. */
export function studyHref(targetId: string, lessonNum: number, map: Map<string, string>): string {
  if (lessonNum <= 0) return '/hoc';
  const mapped = map.get(targetId);
  if (mapped) return mapped;
  const directVocab = /^vocab-([a-zA-Z_-]+)$/.exec(targetId);
  if (directVocab) return `/hoc/${lessonNum}#vocab-${directVocab[1]}`;
  const directGrammar = /^grammar-([a-zA-Z_-]+)$/.exec(targetId);
  if (directGrammar) return `/hoc/${lessonNum}/ngu-phap/${directGrammar[1]}`;
  return `/hoc/${lessonNum}`;
}
