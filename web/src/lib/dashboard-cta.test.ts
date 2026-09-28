import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDashboardCta } from './dashboard-cta.ts';

test('resolveDashboardCta ưu tiên Ôn tập khi có mục đến hạn (batchCount > 0)', () => {
  const result = resolveDashboardCta({
    batchCount: 5,
    isNewUser: false,
    activeLessonNum: 3,
    activeLessonTitle: 'Đại từ chỉ định',
  });

  assert.equal(result.kind, 'review');
  assert.equal(result.href, '/on-tap');
  assert.equal(result.ctaText, 'Bắt đầu ôn');
  assert.equal(result.heading, 'Ôn tập');
  assert.equal(result.isPrimaryReview, true);
});

test('resolveDashboardCta vẫn ưu tiên Ôn tập khi batchCount > 0 kể cả đánh dấu isNewUser', () => {
  const result = resolveDashboardCta({
    batchCount: 1,
    isNewUser: true,
    activeLessonNum: 1,
  });

  assert.equal(result.kind, 'review');
  assert.equal(result.href, '/on-tap');
  assert.equal(result.ctaText, 'Bắt đầu ôn');
  assert.equal(result.isPrimaryReview, true);
});

test('resolveDashboardCta trả về Bắt đầu bài 1 cho người dùng mới khi không có mục đến hạn', () => {
  const result = resolveDashboardCta({
    batchCount: 0,
    isNewUser: true,
    activeLessonNum: 1,
    activeLessonTitle: 'Giới thiệu bản thân',
  });

  assert.equal(result.kind, 'start_first_lesson');
  assert.equal(result.href, '/hoc/1');
  assert.equal(result.ctaText, 'Bắt đầu bài 1');
  assert.equal(result.heading, 'Bắt đầu bài 1: Giới thiệu bản thân');
  assert.equal(result.isPrimaryReview, false);
});

test('resolveDashboardCta trả về Học tiếp bài N cho người dùng quay lại khi không có mục đến hạn', () => {
  const result = resolveDashboardCta({
    batchCount: 0,
    isNewUser: false,
    activeLessonNum: 4,
    activeLessonTitle: 'Thời gian, ngày tháng',
  });

  assert.equal(result.kind, 'continue_lesson');
  assert.equal(result.href, '/hoc/4');
  assert.equal(result.ctaText, 'Học tiếp bài 4');
  assert.equal(result.heading, 'Bài đang học: Bài 4 — Thời gian, ngày tháng');
  assert.equal(result.isPrimaryReview, false);
});

test('resolveDashboardCta xử lý an toàn dữ liệu biên (batchCount âm hoặc NaN, lessonNum âm)', () => {
  // batchCount âm được kẹp về 0, lessonNum <= 0 kẹp về 1
  const result = resolveDashboardCta({
    batchCount: -10,
    isNewUser: true,
    activeLessonNum: -2,
  });

  assert.equal(result.kind, 'start_first_lesson');
  assert.equal(result.href, '/hoc/1');
  assert.equal(result.ctaText, 'Bắt đầu bài 1');
  assert.equal(result.isPrimaryReview, false);

  // batchCount là NaN
  const resultNaN = resolveDashboardCta({
    batchCount: Number.NaN,
    isNewUser: false,
    activeLessonNum: 5,
  });

  assert.equal(resultNaN.kind, 'continue_lesson');
  assert.equal(resultNaN.href, '/hoc/5');
  assert.equal(resultNaN.ctaText, 'Học tiếp bài 5');
});
