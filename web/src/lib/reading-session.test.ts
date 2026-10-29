import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ReadingPassage, ReadingSession } from '../types/reading.ts';
import {
  applyReadingAction,
  createReadingSession,
  isReadingAnswerCorrect,
  isReadingAwaitingNext,
  isReadingSessionOutdated,
  mergeReadingSessions,
  pickResumableSession,
  readingResults,
  readingScore,
  restartReadingSession,
  validateReadingSession,
  type ReadingAction,
} from './reading-session.ts';
import { makeDialogueFixture } from './reading.test-helpers.ts';

const fixture = await makeDialogueFixture();
const scope = { lesson: 10, minCoverage: 85, maxNewGrammar: 2 };
const t0 = new Date('2026-10-29T01:00:00.000Z');
const at = (min: number) => new Date(t0.getTime() + min * 60_000);

const fresh = () => createReadingSession(fixture, scope, t0);
/** Áp một action từ đúng trạng thái màn hình đang thấy. */
function act(s: ReadingSession, action: ReadingAction, min = 1) {
  return applyReadingAction(s, action, { revision: s.revision, questionIndex: s.questionIndex }, at(min));
}
const applied = (s: ReadingSession, action: ReadingAction, min = 1) => {
  const r = act(s, action, min);
  assert.equal(r.status, 'applied', JSON.stringify(action));
  return r.session;
};
/** Làm đủ ba câu; `picks` là ID lựa chọn từng câu. */
function finish(picks: string[]): ReadingSession {
  let s = fresh();
  picks.forEach((optionId, i) => {
    s = applied(s, { type: 'select', optionId });
    s = applied(s, { type: 'submit' });
    if (i < picks.length - 1) s = applied(s, { type: 'next' });
  });
  return s;
}

test('tạo phiên: snapshot độc lập với catalog, scope/filter lưu theo lúc bắt đầu', () => {
  const s = fresh();
  assert.equal(s.scope, 10);
  assert.deepEqual(s.filter, { minCoverage: 85, maxNewGrammar: 2 });
  assert.deepEqual([s.questionIndex, s.selectedOptionId, s.answers, s.revision, s.completedAt], [0, null, [], 0, undefined]);
  assert.notEqual(s.passage, fixture);
  fixture.titleVi = 'đổi sau';
  assert.notEqual(s.passage.titleVi, 'đổi sau');
  fixture.titleVi = 'Tìm điện thoại';
  assert.deepEqual(validateReadingSession(s), s);
});

test('bài không hợp lệ không tạo được phiên', () => {
  const broken = structuredClone(fixture);
  broken.questions.pop();
  assert.throws(() => createReadingSession(broken, scope), /không hợp lệ/);
});

test('luồng chọn → nộp → tiếp theo → hoàn tất, revision tăng sau mỗi mutation', () => {
  let s = fresh();
  s = applied(s, { type: 'select', optionId: 'b' });
  assert.deepEqual([s.selectedOptionId, s.revision], ['b', 1]);
  s = applied(s, { type: 'select', optionId: 'a' }); // đổi lựa chọn trước khi nộp
  assert.equal(s.selectedOptionId, 'a');
  s = applied(s, { type: 'submit' });
  assert.deepEqual([s.answers, s.selectedOptionId, s.questionIndex, s.completedAt], [[{ questionId: 'q1', selectedOptionId: 'a' }], null, 0, undefined]);
  assert.equal(isReadingAwaitingNext(s), true);
  s = applied(s, { type: 'next' });
  assert.deepEqual([s.questionIndex, s.revision, isReadingAwaitingNext(s)], [1, 4, false]);
  s = applied(applied(applied(s, { type: 'select', optionId: 'b' }), { type: 'submit' }), { type: 'next' });
  s = applied(applied(s, { type: 'select', optionId: 'b' }), { type: 'submit' });
  assert.equal(s.completedAt, at(1).toISOString());
  assert.equal(s.answers.length, 3);
  assert.deepEqual(validateReadingSession(s), s);
});

test('chưa chọn thì không nộp; "Tiếp theo" không bỏ qua câu chưa nộp', () => {
  const s = fresh();
  assert.equal(act(s, { type: 'submit' }).status, 'noop');
  assert.equal(act(s, { type: 'next' }).status, 'noop');
  const chosen = applied(s, { type: 'select', optionId: 'a' });
  assert.equal(act(chosen, { type: 'next' }).status, 'noop');
});

test('chọn ID không thuộc câu hiện tại hoặc chọn lại cùng đáp án là no-op', () => {
  const s = fresh();
  assert.equal(act(s, { type: 'select', optionId: 'khong-co' }).status, 'noop');
  const chosen = applied(s, { type: 'select', optionId: 'a' });
  assert.equal(act(chosen, { type: 'select', optionId: 'a' }).status, 'noop');
});

test('nộp lặp không thay đáp án đầu; sau khi nộp khóa lựa chọn', () => {
  let s = applied(applied(fresh(), { type: 'select', optionId: 'a' }), { type: 'submit' });
  const before = s;
  // Bấm đúp: lần hai mang revision cũ nhưng vẫn là no-op, không phải stale.
  const dup = applyReadingAction(s, { type: 'submit' }, { revision: before.revision - 1, questionIndex: 0 }, at(5));
  assert.equal(dup.status, 'noop');
  assert.equal(dup.session, before);
  assert.equal(act(s, { type: 'select', optionId: 'b' }).status, 'noop');
  assert.deepEqual(s.answers, [{ questionId: 'q1', selectedOptionId: 'a' }]);
  s = applied(s, { type: 'next' });
  assert.equal(s.questionIndex, 1);
});

test('tab cũ: revision hoặc câu hiện tại lệch thì bị bỏ qua, không ghi đè', () => {
  const s = applied(fresh(), { type: 'select', optionId: 'a' });
  const staleRev = applyReadingAction(s, { type: 'select', optionId: 'c' }, { revision: 0, questionIndex: 0 }, at(2));
  assert.deepEqual([staleRev.status, staleRev.session], ['stale', s]);
  const staleQ = applyReadingAction(s, { type: 'submit' }, { revision: s.revision, questionIndex: 1 }, at(2));
  assert.equal(staleQ.status, 'stale');
  const next = applied(applied(s, { type: 'submit' }), { type: 'next' });
  assert.equal(applyReadingAction(next, { type: 'next' }, { revision: 3, questionIndex: 0 }, at(3)).status, 'stale');
});

test('phiên đã hoàn tất không nhận thêm action', () => {
  const s = finish(['a', 'b', 'b']);
  for (const action of [{ type: 'select', optionId: 'a' }, { type: 'submit' }, { type: 'next' }] as ReadingAction[]) {
    assert.equal(act(s, action).status, 'noop');
  }
});

test('chấm theo ID: đúng, sai và điểm tính từ đáp án', () => {
  const s = finish(['a', 'a', 'b']);
  assert.equal(isReadingAnswerCorrect(s.passage.questions[0]!, 'a'), true);
  assert.equal(isReadingAnswerCorrect(s.passage.questions[0]!, 'b'), false);
  assert.deepEqual(readingResults(s).map((r) => r.correct), [true, false, true]);
  assert.deepEqual(readingScore(s), { correct: 2, total: 3 });
  assert.deepEqual(readingScore(fresh()), { correct: 0, total: 3 });
});

test('làm lại: bài đã bị xóa khỏi catalog thì null, kết quả cũ vẫn đọc được', () => {
  const old = finish(['a', 'b', 'b']);
  assert.equal(restartReadingSession(old), null);
  assert.equal(restartReadingSession(old, t0, () => undefined), null);
  assert.equal(readingScore(old).correct, 3);
  assert.equal(isReadingSessionOutdated(old), false);
  assert.equal(isReadingSessionOutdated({ ...old, dataVersion: old.dataVersion + 1 }), true);
});

test('làm lại: ID mới, đáp án reset, snapshot lấy từ catalog hiện tại, giữ scope/filter, phiên cũ nguyên vẹn', () => {
  const old = finish(['a', 'b', 'b']);
  const oldCopy = structuredClone(old);
  const updated: ReadingPassage = { ...structuredClone(fixture), titleVi: 'Bản đã sửa' };
  const restarted = restartReadingSession(old, at(30), (id) => (id === fixture.id ? updated : undefined))!;
  assert.notEqual(restarted.id, old.id);
  assert.equal(restarted.passage.titleVi, 'Bản đã sửa');
  assert.notEqual(restarted.passage, updated, 'snapshot là bản sao, không dùng chung tham chiếu catalog');
  assert.deepEqual([restarted.answers, restarted.questionIndex, restarted.selectedOptionId, restarted.revision, restarted.completedAt], [[], 0, null, 0, undefined]);
  assert.deepEqual([restarted.scope, restarted.filter], [old.scope, old.filter]);
  assert.equal(restarted.startedAt, at(30).toISOString());
  assert.deepEqual(old, oldCopy);
});

test('làm lại: catalog hiện tại không còn hợp lệ thì ném lỗi thay vì chụp bản hỏng', () => {
  const broken = { ...structuredClone(fixture), questions: fixture.questions.slice(0, 2) };
  assert.throws(() => restartReadingSession(finish(['a', 'b', 'b']), t0, () => broken), /không hợp lệ/);
});

test('validate: bản ghi sai trạng thái bị từ chối, bản hợp lệ giữ nguyên', () => {
  const mid = applied(applied(fresh(), { type: 'select', optionId: 'a' }), { type: 'submit' });
  assert.deepEqual(validateReadingSession(mid), mid);
  const done = finish(['a', 'b', 'b']);
  const bad: Record<string, ReadingSession> = {
    'questionIndex ngoài 0–2': { ...mid, questionIndex: 3 },
    'đáp án trỏ lựa chọn không có': { ...mid, answers: [{ questionId: 'q1', selectedOptionId: 'z' }] },
    'đáp án sai thứ tự câu': { ...mid, answers: [{ questionId: 'q2', selectedOptionId: 'a' }] },
    'đã nộp nhưng còn selectedOptionId': { ...mid, selectedOptionId: 'a' },
    'tiến quá một câu so với đáp án': { ...mid, questionIndex: 2 },
    'hoàn tất thiếu đáp án': { ...done, answers: done.answers.slice(0, 2) },
    'đủ đáp án mà thiếu completedAt': { ...done, completedAt: undefined },
    'revision âm': { ...mid, revision: -1 },
    'filter ngoài biên': { ...mid, filter: { minCoverage: 70, maxNewGrammar: 1 } },
    'snapshot hỏng': { ...mid, passage: { ...mid.passage, questions: mid.passage.questions.slice(0, 2) } },
    'selected không thuộc câu': { ...fresh(), selectedOptionId: 'z' },
    'glossary sai kiểu chuỗi': { ...mid, passage: { ...mid.passage, glossary: [{ ...mid.passage.glossary[0]!, reading: { bad: true } as unknown as string }, ...mid.passage.glossary.slice(1)] } },
    'review bỏ lớp 4': { ...mid, passage: { ...mid.passage, review: { ...mid.passage.review, layers: mid.passage.review.layers.map((l) => (l.layer === 4 ? { layer: 4 as const, status: 'not-applicable' as const, note: 'bỏ' } : l)) } } },
  };
  for (const [name, record] of Object.entries(bad)) assert.equal(validateReadingSession(record), null, name);
  assert.equal(validateReadingSession(null), null);
  assert.equal(validateReadingSession('x'), null);
});

test('nhiều phiên dở cùng bài: cập nhật gần nhất thắng, bằng nhau thì ID tăng dần; bỏ qua phiên đã xong', () => {
  const make = (id: string, min: number, done = false): ReadingSession => ({ ...fresh(), id, updatedAt: at(min).toISOString(), ...(done ? { completedAt: at(min).toISOString() } : {}) });
  const other = { ...make('z', 99), passage: { ...fixture, id: 'bai-khac' } as ReadingPassage };
  const sessions = [make('b', 5), make('a', 5), make('c', 3), make('d', 50, true), other];
  assert.equal(pickResumableSession(sessions, fixture.id)!.id, 'a');
  assert.equal(pickResumableSession(sessions, 'bai-khac')!.id, 'z');
  assert.equal(pickResumableSession([make('d', 1, true)], fixture.id), undefined);
});

test('merge backup: ID mới thêm, trùng ID giữ local dù snapshot khác và đếm trùng', () => {
  const local = fresh();
  const sameIdOtherSnapshot: ReadingSession = { ...local, passage: { ...local.passage, titleVi: 'khác' }, revision: 99 };
  const brandNew = { ...fresh(), id: 'moi' };
  const { added, duplicates } = mergeReadingSessions([local], [sameIdOtherSnapshot, brandNew, brandNew]);
  assert.deepEqual(added.map((s) => s.id), ['moi']);
  assert.equal(duplicates, 2);
});
