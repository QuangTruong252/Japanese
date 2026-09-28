import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLessonsParam,
  resolveInitialPracticeConfig,
  computeActualQuestionCount,
  getPracticeStartButtonText,
  getPracticeBlockedReason,
  formatPracticeSummaryTitle,
} from './practice-preview.ts';

test('parseLessonsParam: phân tích chuỗi hợp lệ, lọc trùng và sắp xếp', () => {
  assert.deepEqual(parseLessonsParam('5'), [5]);
  assert.deepEqual(parseLessonsParam('3, 1, 3, 2'), [1, 2, 3]);
  assert.deepEqual(parseLessonsParam('25, 1'), [1, 25]);
});

test('parseLessonsParam: loại bỏ giá trị không hợp lệ hoặc rỗng', () => {
  assert.deepEqual(parseLessonsParam(null), []);
  assert.deepEqual(parseLessonsParam(''), []);
  assert.deepEqual(parseLessonsParam('abc, 0, 26, -1, 3.5'), []);
  assert.deepEqual(parseLessonsParam('abc, 4, 99, 2'), [2, 4]);
});

test('resolveInitialPracticeConfig: ?lessons=N thắng và bỏ qua preset/activeLesson', () => {
  const result = resolveInitialPracticeConfig({
    lessonsParam: '7',
    savedPreset: { lessons: [2, 3], types: ['mc'], questionCount: 10 },
    activeLessonNum: 5,
  });
  assert.deepEqual(result.lessons, [7]);
  assert.deepEqual(result.types, ['mc']);
  assert.equal(result.questionCount, 10);
});

test('resolveInitialPracticeConfig: dùng preset hợp lệ khi không có param', () => {
  const result = resolveInitialPracticeConfig({
    lessonsParam: null,
    savedPreset: { lessons: [3, 4], types: ['cloze', 'listening'], questionCount: 20 },
    activeLessonNum: 1,
  });
  assert.deepEqual(result.lessons, [3, 4]);
  assert.deepEqual(result.types, ['cloze', 'listening']);
  assert.equal(result.questionCount, 20);
});

test('resolveInitialPracticeConfig: preset chứa bài/dạng/số câu không hợp lệ được lọc và fallback an toàn', () => {
  const result = resolveInitialPracticeConfig({
    lessonsParam: null,
    savedPreset: {
      lessons: [0, 99, 'invalid'],
      types: ['invalid-type', 123],
      questionCount: 45, // Không nằm trong [10, 15, 20, 30]
    },
    activeLessonNum: 6,
  });
  // lessons không hợp lệ -> fallback về activeLessonNum
  assert.deepEqual(result.lessons, [6]);
  // types không hợp lệ -> fallback về đủ 5 dạng bài chuẩn
  assert.deepEqual(result.types, ['mc', 'matching', 'cloze', 'reorder', 'listening']);
  // questionCount không hợp lệ -> fallback về 15
  assert.equal(result.questionCount, 15);
});

test('resolveInitialPracticeConfig: dùng bài đang học cục bộ khi chưa có preset hữu ích', () => {
  const result = resolveInitialPracticeConfig({
    lessonsParam: null,
    savedPreset: null,
    activeLessonNum: 8,
  });
  assert.deepEqual(result.lessons, [8]);
  assert.equal(result.questionCount, 15);
});

test('resolveInitialPracticeConfig: người mới hoàn toàn fallback về Bài 1', () => {
  const result = resolveInitialPracticeConfig({
    lessonsParam: null,
    savedPreset: null,
    activeLessonNum: null,
  });
  assert.deepEqual(result.lessons, [1]);
  assert.deepEqual(result.types, ['mc', 'matching', 'cloze', 'reorder', 'listening']);
  assert.equal(result.questionCount, 15);
});

test('resolveInitialPracticeConfig: typeParam ghi đè loại bài tập từ preset', () => {
  const result = resolveInitialPracticeConfig({
    lessonsParam: '2',
    typeParam: 'reorder',
    savedPreset: { lessons: [1], types: ['mc', 'matching'], questionCount: 10 },
  });
  assert.deepEqual(result.types, ['reorder']);
});

test('computeActualQuestionCount: tính đúng số câu thực tế và giới hạn', () => {
  // Kho có nhiều hơn mức chọn
  assert.equal(computeActualQuestionCount(15, 40), 15);
  // Kho có ít hơn mức chọn -> lấy số thực
  assert.equal(computeActualQuestionCount(15, 8), 8);
  // Kho có 0 câu
  assert.equal(computeActualQuestionCount(15, 0), 0);
  // Giá trị âm hoặc không hợp lệ
  assert.equal(computeActualQuestionCount(0, 10), 0);
  assert.equal(computeActualQuestionCount(10, -5), 0);
});

test('getPracticeStartButtonText: sinh nhãn chính xác theo số câu thực', () => {
  assert.equal(getPracticeStartButtonText(15), 'Bắt đầu 15 câu');
  assert.equal(getPracticeStartButtonText(8), 'Bắt đầu 8 câu');
  // 0 câu -> "Bắt đầu"
  assert.equal(getPracticeStartButtonText(0), 'Bắt đầu');
  // Có lý do bị chặn -> "Bắt đầu"
  assert.equal(getPracticeStartButtonText(10, 'Chưa chọn bài nào'), 'Bắt đầu');
});

test('getPracticeBlockedReason: báo lý do đọc được khi 0 câu hoặc thiếu lựa chọn', () => {
  // Không chọn bài nào
  assert.match(
    getPracticeBlockedReason({
      selectedLessons: [],
      selectedTypes: ['mc'],
      eligibleCount: 0,
    }) ?? '',
    /Chưa chọn bài nào/,
  );

  // Không chọn dạng bài nào
  assert.match(
    getPracticeBlockedReason({
      selectedLessons: [1],
      selectedTypes: [],
      eligibleCount: 0,
    }) ?? '',
    /Chưa chọn dạng bài nào/,
  );

  // 0 câu khi đã tải xong
  assert.match(
    getPracticeBlockedReason({
      selectedLessons: [1],
      selectedTypes: ['listening'],
      eligibleCount: 0,
      loading: false,
    }) ?? '',
    /Không có câu nào hợp lệ/,
  );

  // Đang tải thì chưa chặn lý do 0 câu
  assert.equal(
    getPracticeBlockedReason({
      selectedLessons: [1],
      selectedTypes: ['listening'],
      eligibleCount: 0,
      loading: true,
    }),
    null,
  );

  // Hợp lệ có câu
  assert.equal(
    getPracticeBlockedReason({
      selectedLessons: [1],
      selectedTypes: ['mc'],
      eligibleCount: 20,
      loading: false,
    }),
    null,
  );
});

test('formatPracticeSummaryTitle: định dạng tiêu đề tóm tắt rõ ràng', () => {
  assert.equal(
    formatPracticeSummaryTitle([1], 15, 5),
    'Sẵn sàng luyện Bài 1 · 15 câu · 5 dạng',
  );
  assert.equal(
    formatPracticeSummaryTitle([2, 3], 8, 2),
    'Sẵn sàng luyện Bài 2, 3 · 8 câu · 2 dạng',
  );
  const all25 = Array.from({ length: 25 }, (_, i) => i + 1);
  assert.equal(
    formatPracticeSummaryTitle(all25, 30, 5),
    'Sẵn sàng luyện Tất cả 25 bài · 30 câu · 5 dạng',
  );
  assert.equal(formatPracticeSummaryTitle([], 0, 0), 'Chưa chọn bài học');
});
