/**
 * Quyết định CTA chính cho Bảng tin (Dashboard /) theo SPEC-18 §3, §6 và SPEC-02 §3.2.
 *
 * Luật CTA:
 * 1. Nếu có mục đến hạn (batchCount > 0):
 *    - CTA chính duy nhất (P0) là "Bắt đầu ôn": vào thẳng /on-tap/phien; khi đang có nháp
 *      Luyện/Ôn thì qua /on-tap để hộp xác nhận ở đó bảo vệ nháp (hai loại dùng chung khóa).
 *    - Nháp dở dang (nếu có) ở hàng phụ ngay dưới P0, trên card "Bài đang học".
 * 2. Nếu không có mục đến hạn (batchCount === 0):
 *    - Có nháp dở dang: CTA chính là tiếp tục nháp đó (nghiên cứu UX 01/10/2026: người học
 *      quay lại để làm tiếp việc dở, hàng phụ bên dưới dễ bị dock che).
 *    - Người mới (chưa có reviewItems, chưa học bài nào): CTA là "Bắt đầu bài 1" (/hoc/1).
 *    - Đã học: CTA là "Học tiếp bài {activeLessonNum}" (/hoc/{activeLessonNum}).
 */

export type DashboardCtaKind = 'review' | 'resume_draft' | 'start_first_lesson' | 'continue_lesson';

export interface DashboardResumeDraft {
  href: string;
  heading: string;
}

export interface DashboardCtaInput {
  batchCount: number;
  isNewUser: boolean;
  activeLessonNum: number;
  activeLessonTitle?: string;
  /** Nháp sẽ được tiếp tục bằng CTA chính khi không có mục đến hạn. */
  resumeDraft?: DashboardResumeDraft | null;
  /** Có nháp Luyện/Ôn (chung khóa lưu) — "Bắt đầu ôn" phải qua hub để xác nhận. */
  hasPracticeDraft?: boolean;
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
  resumeDraft,
  hasPracticeDraft = false,
}: DashboardCtaInput): DashboardCtaDecision {
  const normalizedBatchCount = Number.isFinite(batchCount) ? Math.max(0, Math.floor(batchCount)) : 0;
  const safeLessonNum = Number.isFinite(activeLessonNum) && activeLessonNum > 0 ? Math.floor(activeLessonNum) : 1;

  if (normalizedBatchCount > 0) {
    return {
      kind: 'review',
      href: hasPracticeDraft ? '/on-tap' : '/on-tap/phien',
      ctaText: 'Bắt đầu ôn',
      heading: 'Ôn tập',
      isPrimaryReview: true,
    };
  }

  if (resumeDraft) {
    return {
      kind: 'resume_draft',
      href: resumeDraft.href,
      ctaText: 'Tiếp tục',
      heading: resumeDraft.heading,
      isPrimaryReview: false,
    };
  }

  if (isNewUser) {
    return {
      kind: 'start_first_lesson',
      href: '/hoc/1',
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
