/**
 * CTA chính của Bảng tin (v3, 08/10/2026 — docs/superpowers/specs/2026-10-08-maipace-visual-language-v3-design.md §4.1).
 *
 * Nút chính luôn là hành động bài học: người mới "Bắt đầu Bài 1", còn lại "Tiếp tục Bài N".
 * Mục đến hạn và phiên dở là các dòng phụ dưới thẻ; dòng ôn đi qua /on-tap khi đang có nháp
 * Luyện/Ôn để hộp xác nhận ở đó bảo vệ nháp (hai loại dùng chung khóa).
 */

export type DashboardCtaKind = 'start_first_lesson' | 'continue_lesson';

export interface DashboardCtaInput {
  isNewUser: boolean;
  activeLessonNum: number;
  activeLessonTitle?: string;
  /** Có nháp Luyện/Ôn (chung khóa lưu) — dòng ôn phải qua /on-tap để hộp xác nhận bảo vệ nháp. */
  hasPracticeDraft?: boolean;
}

export interface DashboardCtaDecision {
  kind: DashboardCtaKind;
  href: string;
  ctaText: string;
  heading: string;
  /** Đích của dòng "Ôn tập đến hạn" bên dưới thẻ. */
  reviewHref: '/on-tap' | '/on-tap/phien';
}

export function resolveDashboardCta({
  isNewUser,
  activeLessonNum,
  activeLessonTitle,
  hasPracticeDraft = false,
}: DashboardCtaInput): DashboardCtaDecision {
  const reviewHref = hasPracticeDraft ? '/on-tap' : '/on-tap/phien';

  if (isNewUser) {
    return {
      kind: 'start_first_lesson',
      href: '/hoc/1',
      ctaText: 'Bắt đầu Bài 1',
      heading: `Bắt đầu Bài 1${activeLessonTitle ? `: ${activeLessonTitle}` : ''}`,
      reviewHref,
    };
  }

  const n = Number.isFinite(activeLessonNum) && activeLessonNum > 0 ? Math.floor(activeLessonNum) : 1;
  return {
    kind: 'continue_lesson',
    href: `/hoc/${n}`,
    ctaText: `Tiếp tục Bài ${n}`,
    heading: `Bài đang học: Bài ${n}${activeLessonTitle ? ` — ${activeLessonTitle}` : ''}`,
    reviewHref,
  };
}
