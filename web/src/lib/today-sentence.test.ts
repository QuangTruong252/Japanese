import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pickTodaySentence,
  getLocalDateKey,
  hashString,
  type TodaySentenceItem,
} from './today-sentence.ts';

const SAMPLE_EXAMPLES: TodaySentenceItem[] = [
  { jp: '私[わたし]はマイク・ミラーです。', vi: 'Tôi là Mike Miller.' },
  { jp: 'サントスさんは 学生[がくせい]じゃありません。', vi: 'Anh Santos không phải là sinh viên.' },
  { jp: 'あの方[かた]は どなたですか。', vi: 'Vị kia là ai vậy?' },
  { jp: 'ミラーさんも 会社員[かいしゃいん]です。', vi: 'Anh Miller cũng là nhân viên công ty.' },
];

test('pickTodaySentence: trả về null khi mảng ví dụ rỗng, null hoặc undefined', () => {
  assert.equal(pickTodaySentence([]), null);
  assert.equal(pickTodaySentence(null), null);
  assert.equal(pickTodaySentence(undefined), null);
});

test('pickTodaySentence: mảng chỉ có 1 câu thì luôn trả về câu đó bất kể ngày nào', () => {
  const single = [{ jp: 'ここは 教室[きょうしつ]です。', vi: 'Đây là lớp học.' }];
  assert.deepEqual(pickTodaySentence(single, '2026-10-07'), single[0]);
  assert.deepEqual(pickTodaySentence(single, '2026-10-08'), single[0]);
  assert.deepEqual(pickTodaySentence(single, new Date('2026-12-31')), single[0]);
});

test('pickTodaySentence: cùng ngày và cùng bài luôn ra cùng một câu (tất định)', () => {
  const dateKey = '2026-10-07';
  const first = pickTodaySentence(SAMPLE_EXAMPLES, dateKey, 1);
  const second = pickTodaySentence(SAMPLE_EXAMPLES, dateKey, 1);
  const third = pickTodaySentence(SAMPLE_EXAMPLES, new Date('2026-10-07T10:00:00'), 1);

  assert.notEqual(first, null);
  assert.deepEqual(first, second);
  assert.deepEqual(first, third);
});

test('pickTodaySentence: xử lý các bài khác nhau với tập ví dụ riêng', () => {
  const lesson1Examples: TodaySentenceItem[] = [
    { jp: '私[わたし]は 学生[がくせい]です。', vi: 'Tôi là sinh viên.' },
  ];
  const lesson3Examples: TodaySentenceItem[] = [
    { jp: 'ここは 会議室[かいぎしつ]です。', vi: 'Đây là phòng họp.' },
  ];

  const l1 = pickTodaySentence(lesson1Examples, '2026-10-07', 1);
  const l3 = pickTodaySentence(lesson3Examples, '2026-10-07', 3);

  assert.equal(l1?.vi, 'Tôi là sinh viên.');
  assert.equal(l3?.vi, 'Đây là phòng họp.');
});

test('pickTodaySentence: đổi ngày có thể đổi câu khi có nhiều ví dụ', () => {
  const dates = [
    '2026-10-01',
    '2026-10-02',
    '2026-10-03',
    '2026-10-04',
    '2026-10-05',
    '2026-10-06',
    '2026-10-07',
  ];
  const picked = new Set(
    dates.map((d) => pickTodaySentence(SAMPLE_EXAMPLES, d, 1)?.jp)
  );
  // Qua 7 ngày liên tiếp với 4 ví dụ, phải chọn được hơn 1 câu khác nhau
  assert.ok(picked.size > 1, 'Cần chọn được các câu khác nhau qua nhiều ngày');
});

test('getLocalDateKey: định dạng YYYY-MM-DD theo giờ địa phương', () => {
  const d = new Date(2026, 9, 7); // Tháng 10 là index 9
  assert.equal(getLocalDateKey(d), '2026-10-07');
});

test('hashString: tất định và trả về số không âm', () => {
  const h1 = hashString('2026-10-07:lesson-1');
  const h2 = hashString('2026-10-07:lesson-1');
  assert.equal(h1, h2);
  assert.ok(h1 >= 0);
  assert.notEqual(hashString('2026-10-07:lesson-1'), hashString('2026-10-07:lesson-2'));
});
