import test from 'node:test';
import assert from 'node:assert/strict';
import { answerDictation, advanceDictation, createDictationSession, mergeDictationSessions, validateDictationSession } from './dictation-session.ts';
import { canSubmitJapanese } from './jp-input.ts';

test('dictation preserves first answer and advances only after submission, including two-tab retries', () => {
  const initial = createDictationSession('2026-10-27', 10);
  assert.equal(advanceDictation(initial, 0), initial);
  const answered = answerDictation(initial, 0, initial.sentences[0].kana);
  assert.equal(answered.answers[0].correct, true);
  assert.equal(answerDictation(answered, 0, ''), answered);
  const next = advanceDictation(answered, 0);
  assert.equal(next.index, 1);
  assert.equal(next.input, '');
  assert.equal(advanceDictation(next, 0), next);
  assert.equal(answerDictation(next, 0, ''), next);
  assert.equal(initial.answers.length, 0);
});

test('dictation reload/backup roundtrip and final result are stable across midnight', () => {
  let session = createDictationSession('2026-10-27', 1);
  const snapshot = JSON.stringify(session.sentences);
  for (let i = 0; i < session.sentences.length; i++) {
    session = answerDictation(session, i, i === 0 ? session.sentences[i].kana : '');
    session = advanceDictation(session, i);
  }
  assert.equal(session.day, '2026-10-27');
  assert.equal(JSON.stringify(session.sentences), snapshot);
  assert.ok(session.completedAt);
  assert.equal(session.answers.filter((a) => a.correct).length, 1);
  assert.equal(advanceDictation(session, 0), session);
  assert.deepEqual(validateDictationSession(JSON.parse(JSON.stringify(session))), session);
});

test('dictation validation rejects corrupt scores, ranges, snapshots and inconsistent progress', () => {
  const initial = createDictationSession('2026-10-27', 10);
  const answered = answerDictation(initial, 0, initial.sentences[0].kana);
  assert.deepEqual(validateDictationSession(answered), answered);
  for (const corrupted of [null, {}, { ...initial, scope: 26 }, { ...initial, id: 'other' },
    { ...initial, index: 1 }, { ...initial, completedAt: new Date().toISOString() },
    { ...initial, sentences: [initial.sentences[0], initial.sentences[0]] },
    { ...initial, day: '2026-02-31', id: `2026-02-31:${initial.scope}:${initial.dataVersion}` },
    { ...initial, sentences: initial.sentences.map((s, i) => i ? s : { ...s, kana: initial.sentences[1].kana }) },
    { ...answered, answers: [{ ...answered.answers[0], correct: false }] }]) {
    assert.equal(validateDictationSession(corrupted), null);
  }
});

test('dictation merge keeps local first answers and longer progress; accepts new sessions', () => {
  const base = createDictationSession('2026-10-27', 10);
  const first = answerDictation(base, 0, base.sentences[0].kana);
  const progressed = advanceDictation(first, 0);
  const conflicting = answerDictation(base, 0, '');
  assert.deepEqual(mergeDictationSessions([first], [base, conflicting, progressed]), [progressed]);
  const other = createDictationSession('2026-10-28', 1);
  assert.equal(mergeDictationSessions([first], [other]).length, 2);
  const reordered = { ...progressed, sentences: progressed.sentences.map((q) => Object.fromEntries(Object.entries(q).reverse())) };
  assert.deepEqual(mergeDictationSessions([base], [reordered as typeof progressed]), [reordered]);
});

test('IME confirmation Enter cannot submit; ordinary Enter can', () => {
  const enter = { key: 'Enter', isComposing: false, keyCode: 13 };
  assert.equal(canSubmitJapanese(enter, false), true);
  assert.equal(canSubmitJapanese(enter, true), false);
  assert.equal(canSubmitJapanese({ ...enter, isComposing: true }, false), false);
  assert.equal(canSubmitJapanese({ ...enter, keyCode: 229 }, false), false);
  assert.equal(canSubmitJapanese({ ...enter, key: ' ' }, false), false);
});
