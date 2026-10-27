import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTranslationAction as act, createRetrySession, createTranslationSaver, createTranslationSession, mergeTranslationSessions, parseTranslationConfig, translationTally, validateTranslationSession, type TranslationSession } from './translation-session.ts';
import { translationSentence } from './translation.ts';

const start = (mode: 'jp-vi' | 'vi-jp' | 'mixed' = 'jp-vi', count = 5) => createTranslationSession(10, mode, count, new Date(), () => 0.42);
const answerOf = (s: TranslationSession, i: number) => {
  const item = s.items[i]!;
  const sentence = translationSentence(item.id)!;
  return item.direction === 'jp-vi' ? sentence.vi : sentence.jp;
};

test('matching answer is graded automatically; first answer cannot be replaced', () => {
  const s = start();
  const graded = act(s, 0, { type: 'answer', value: answerOf(s, 0) });
  assert.deepEqual(graded.answers[0], { value: answerOf(s, 0), status: 'graded', correct: true, source: 'automatic' });
  assert.equal(act(graded, 0, { type: 'answer', value: 'khác' }), graded);
  assert.equal(act(graded, 0, { type: 'unknown' }), graded);
  assert.equal(act(graded, 0, { type: 'confirm', correct: false }), graded);
  const next = act(graded, 0, { type: 'next' });
  assert.equal(next.index, 1);
  assert.equal(act(next, 0, { type: 'next' }), next);
});

test('non-matching answer waits for self confirmation and is not counted wrong; reload keeps the step', () => {
  const s = start();
  const reviewing = act(s, 0, { type: 'answer', value: 'không khớp chút nào' });
  assert.equal(reviewing.answers[0]!.status, 'reviewing');
  assert.deepEqual(translationTally(reviewing), { automatic: 0, self: 0, review: 0, hinted: 0 });
  assert.equal(act(reviewing, 0, { type: 'next' }), reviewing, 'cannot skip the confirmation');
  assert.deepEqual(validateTranslationSession(JSON.parse(JSON.stringify(reviewing))), reviewing);
  assert.equal(act(reviewing, 0, { type: 'answer', value: answerOf(s, 0) }), reviewing, 'first answer stays');
  const confirmed = act(reviewing, 0, { type: 'confirm', correct: true });
  assert.deepEqual(confirmed.answers[0], { value: 'không khớp chút nào', status: 'graded', correct: true, source: 'self' });
  assert.equal(act(confirmed, 0, { type: 'confirm', correct: false }), confirmed);
  assert.deepEqual(translationTally(confirmed), { automatic: 0, self: 1, review: 0, hinted: 0 });
});

test('unknown is graded as review without confirmation; blank answers cannot be submitted', () => {
  const s = start();
  assert.equal(act(s, 0, { type: 'answer', value: '   ' }), s);
  const unknown = act(s, 0, { type: 'unknown' });
  assert.deepEqual(unknown.answers[0], { value: '', status: 'graded', correct: false, source: 'self' });
  assert.equal(act(unknown, 0, { type: 'next' }).index, 1);
  assert.deepEqual(validateTranslationSession(unknown), unknown);
});

test('hint is stored immediately, once per question, and survives reload; not after answering', () => {
  const s = start();
  const hinted = act(s, 0, { type: 'hint' });
  assert.equal(hinted.items[0]!.hintUsed, true);
  assert.equal(act(hinted, 0, { type: 'hint' }), hinted);
  assert.equal(s.items[0]!.hintUsed, undefined);
  const reloaded = validateTranslationSession(JSON.parse(JSON.stringify(hinted)))!;
  assert.equal(reloaded.items[0]!.hintUsed, true);
  assert.equal(act(reloaded, 0, { type: 'hint' }), reloaded);
  const answered = act(act(s, 0, { type: 'unknown' }), 0, { type: 'hint' });
  assert.equal(answered.items[0]!.hintUsed, undefined);
  assert.equal(translationTally(hinted).hinted, 1);
});

test('full run completes, tallies sources, and retry session holds only review items in the same direction', () => {
  let s = start('mixed', 5);
  const plan = ['auto', 'self', 'review', 'unknown', 'auto'] as const;
  const items = s.items.map(({ id, direction }) => ({ id, direction }));
  plan.forEach((kind, i) => {
    if (kind === 'auto') s = act(s, i, { type: 'answer', value: answerOf(s, i) });
    else if (kind === 'self') s = act(act(s, i, { type: 'answer', value: 'ý khác' }), i, { type: 'confirm', correct: true });
    else if (kind === 'review') s = act(act(s, i, { type: 'answer', value: 'ý khác' }), i, { type: 'confirm', correct: false });
    else s = act(s, i, { type: 'unknown' });
    s = act(s, i, { type: 'next' }, 100 + i);
  });
  assert.ok(s.completedAt);
  assert.equal(s.elapsedSec, 104);
  assert.deepEqual(s.items.map(({ id, direction }) => ({ id, direction })), items);
  assert.deepEqual(translationTally(s), { automatic: 2, self: 1, review: 2, hinted: 0 });
  assert.deepEqual(validateTranslationSession(JSON.parse(JSON.stringify(s))), s);
  const retry = createRetrySession(s);
  assert.deepEqual(retry.items, [items[2], items[3]]);
  assert.equal(retry.answers.length, 0);
  assert.notEqual(retry.id, s.id);
});

test('validation rejects forged sources, impossible progress, unknown sentences and out-of-range scope', () => {
  const s = start();
  const reviewing = act(s, 0, { type: 'answer', value: 'ý khác' });
  const confirmed = act(reviewing, 0, { type: 'confirm', correct: true });
  const first = s.items[0]!;
  const bad: unknown[] = [
    null, {}, { ...s, scope: 26 }, { ...s, mode: 'x' }, { ...s, items: [] },
    { ...s, items: [{ id: 'khong-co', direction: 'jp-vi' }] },
    { ...s, items: [first, first] },
    { ...s, items: [{ ...first, direction: 'vi-jp' }, ...s.items.slice(1)] },
    { ...confirmed, answers: [{ ...confirmed.answers[0], source: 'automatic' }] },
    { ...confirmed, answers: [{ ...confirmed.answers[0], source: undefined }] },
    { ...reviewing, answers: [{ ...reviewing.answers[0], correct: true }] },
    { ...reviewing, index: 1 },
    { ...s, completedAt: new Date().toISOString() },
    { ...s, elapsedSec: -1 },
    { ...s, answers: [{ value: answerOf(s, 0), status: 'graded', correct: true, source: 'self' }] },
  ];
  for (const candidate of bad) assert.equal(validateTranslationSession(candidate), null);
  const aboveScope = { ...s, scope: 1, items: [{ id: 'g-l06-o-transitivo-0', direction: 'jp-vi' }] };
  assert.equal(validateTranslationSession(aboveScope), null);
});

test('merge keeps first answers and confirmations, prefers longer progress, adds new sessions', () => {
  const base = start();
  const reviewing = act(base, 0, { type: 'answer', value: 'ý khác' });
  const confirmed = act(reviewing, 0, { type: 'confirm', correct: false });
  const advanced = act(confirmed, 0, { type: 'next' });
  assert.deepEqual(mergeTranslationSessions([reviewing], [confirmed]), [confirmed]);
  assert.deepEqual(mergeTranslationSessions([advanced], [confirmed]), [advanced]);
  assert.deepEqual(mergeTranslationSessions([base], [advanced]), [advanced]);
  const conflicting = act(act(base, 0, { type: 'answer', value: 'ý khác nữa' }), 0, { type: 'confirm', correct: true });
  assert.deepEqual(mergeTranslationSessions([confirmed], [conflicting]), [confirmed]);
  assert.equal(mergeTranslationSessions([base], [start('vi-jp')]).length, 2);
});

test('saved config is validated before use', () => {
  assert.deepEqual(parseTranslationConfig('{"mode":"mixed","scope":12,"count":"all"}'), { mode: 'mixed', scope: 12, count: 'all' });
  for (const raw of [null, '', 'oops', '{"mode":"mixed","scope":0,"count":10}', '{"mode":"x","scope":3,"count":10}', '{"mode":"jp-vi","scope":3,"count":7}', '{"mode":"jp-vi","scope":3.5,"count":5}']) {
    assert.equal(parseTranslationConfig(raw), null);
  }
});

test('tick checkpoint stores only elapsed time, never lowers it, and never overwrites progress', () => {
  let s = act(start(), 0, { type: 'answer', value: 'ý khác' });
  const ticked = act(s, 0, { type: 'tick' }, 120.9);
  assert.equal(ticked.elapsedSec, 120);
  assert.deepEqual({ ...ticked, elapsedSec: 0, updatedAt: s.updatedAt }, { ...s, elapsedSec: 0 });
  assert.equal(act(ticked, 0, { type: 'tick' }, 90), ticked);
  // Tab cũ gửi tick của câu trước sau khi tab khác đã sang câu sau: bỏ qua.
  s = act(act(s, 0, { type: 'confirm', correct: true }), 0, { type: 'next' }, 130);
  assert.equal(act(s, 0, { type: 'tick' }, 500), s);
});

test('a failed input write is retried before the next action, so a successful hint cannot hide it', async () => {
  const written: string[] = [];
  let failInput = false;
  const saver = createTranslationSaver(async (action) => {
    if (action.type === 'input' && failInput) throw new Error('quota');
    written.push(action.type === 'input' ? `input:${action.value}` : action.type);
  });
  await saver.save({ type: 'input', value: 'A' });
  assert.equal(saver.dirty, false);
  failInput = true;
  await assert.rejects(saver.save({ type: 'input', value: 'B' }));
  assert.equal(saver.dirty, true);
  await assert.rejects(saver.save({ type: 'hint' }));
  assert.equal(saver.dirty, true);
  assert.deepEqual(saver.retryOf({ type: 'input', value: 'B' }), { type: 'input', value: 'B' });
  failInput = false;
  await saver.save({ type: 'hint' });
  assert.deepEqual(written, ['input:A', 'input:B', 'hint']);
  assert.equal(saver.dirty, false);
});
