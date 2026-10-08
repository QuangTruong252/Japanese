import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDashboardCta } from './dashboard-cta.ts';

test('người mới: CTA là Bắt đầu Bài 1', () => {
  const r = resolveDashboardCta({ isNewUser: true, activeLessonNum: 1, activeLessonTitle: 'Giới thiệu bản thân' });
  assert.equal(r.kind, 'start_first_lesson');
  assert.equal(r.href, '/hoc/1');
  assert.equal(r.ctaText, 'Bắt đầu Bài 1');
  assert.equal(r.heading, 'Bắt đầu Bài 1: Giới thiệu bản thân');
});

test('người học quay lại: CTA là Tiếp tục Bài N (v3: ôn đến hạn không còn chiếm CTA)', () => {
  const r = resolveDashboardCta({ isNewUser: false, activeLessonNum: 4, activeLessonTitle: 'Thời gian, ngày tháng' });
  assert.equal(r.kind, 'continue_lesson');
  assert.equal(r.href, '/hoc/4');
  assert.equal(r.ctaText, 'Tiếp tục Bài 4');
  assert.equal(r.heading, 'Bài đang học: Bài 4 — Thời gian, ngày tháng');
  assert.equal('isPrimaryReview' in r, false);
});

test('dòng ôn đi qua /on-tap khi có nháp Luyện/Ôn, ngược lại vào thẳng phiên', () => {
  assert.equal(resolveDashboardCta({ isNewUser: false, activeLessonNum: 2, hasPracticeDraft: true }).reviewHref, '/on-tap');
  assert.equal(resolveDashboardCta({ isNewUser: false, activeLessonNum: 2 }).reviewHref, '/on-tap/phien');
});

test('số bài biên (âm, NaN) kẹp về 1', () => {
  assert.equal(resolveDashboardCta({ isNewUser: false, activeLessonNum: -2 }).href, '/hoc/1');
  assert.equal(resolveDashboardCta({ isNewUser: false, activeLessonNum: Number.NaN }).ctaText, 'Tiếp tục Bài 1');
});
