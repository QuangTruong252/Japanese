/**
 * Quyết định CTA chính cho Bảng tin (Dashboard /) theo SPEC-18 §3, §6 và SPEC-02 §3.2.
 *
 * Luật CTA:
 * 1. Nếu có mục đến hạn (batchCount > 0):
 *    - CTA chính duy nhất (P0) là "Bắt đầu ôn" (/on-tap).
 *    - Bài đang học hiển thị ở card P1 bên dưới với hành động phụ "Vào bài học".
 *    - Nháp dở dang (nếu có) hiển thị ở hàng phụ riêng biệt, không cạnh tranh phân cấp với P0.
 * 2. Nếu không có mục đến hạn (batchCount === 0):
 *    - Hợp nhất thành 1 card P0 duy nhất.
 *    - Nếu là người mới (chưa có reviewItems, chưa học bài nào): CTA là "Bắt đầu bài 1" (/hoc/1).
 *    - Nếu đã học: CTA là "Học tiếp bài {activeLessonNum}" (/hoc/{activeLessonNum}).
 *    - Nháp dở dang (nếu có) vẫn ở hàng phụ "Tiếp tục phiên".
 */

export type DashboardCtaKind = 'review' | 'start_first_lesson' | 'continue_lesson';

export interface DashboardCtaInput {
  batchCount: number;
  isNewUser: boolean;
  activeLessonNum: number;
  activeLessonTitle?: string;
}

export interface DashboardCtaDecision {
  kind: DashboardCtaKind;
  href: string;
  ctaText: string;
  heading: string;
  isPrimaryReview: boolean;
}

export function resolveDashboardCta({
  batchCount,
  isNewUser,
  activeLessonNum,
  activeLessonTitle,
}: DashboardCtaInput): DashboardCtaDecision {
  const normalizedBatchCount = Number.isFinite(batchCount) ? Math.max(0, Math.floor(batchCount)) : 0;
  const safeLessonNum = Number.isFinite(activeLessonNum) && activeLessonNum > 0 ? Math.floor(activeLessonNum) : 1;

  if (normalizedBatchCount > 0) {
    return {
      kind: 'review',
      href: '/on-tap',
      ctaText: 'Bắt đầu ôn',
      heading: 'Ôn tập',
      isPrimaryReview: true,
    };
  }

  if (isNewUser) {
    return {
      kind: 'start_first_lesson',
      href: `/hoc/${safeLessonNum}`,
      ctaText: 'Bắt đầu bài 1',
      heading: 'Bắt đầu bài 1: Giới thiệu bản thân',
      isPrimaryReview: false,
    };
  }

  const titleSuffix = activeLessonTitle ? ` — ${activeLessonTitle}` : '';

  return {
    kind: 'continue_lesson',
    href: `/hoc/${safeLessonNum}`,
    ctaText: `Học tiếp bài ${safeLessonNum}`,
    heading: `Bài đang học: Bài ${safeLessonNum}${titleSuffix}`,
    isPrimaryReview: false,
  };
}
