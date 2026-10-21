import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from './db.ts';
import { Rating } from './fsrs.ts';
import { rateWriting, nextWritingCard, recordWriting, dueChars, hardChars, buildWritingSession } from './writing.ts';

const now = new Date('2026-10-21T10:00:00.000Z');
const good = { misses: 0, hintUsed: false };
const hard = { misses: 1, hintUsed: false };
const again = { misses: 0, hintUsed: true };
const makeCard = (char: string) => nextWritingCard(undefined, char, good, now);

test('rateWriting: hints take priority, misses are Hard, never Easy', () => {
  for (const [result, expected] of [
    [good, Rating.Good], [hard, Rating.Hard],
    [{ misses: 3, hintUsed: false }, Rating.Hard],
    [again, Rating.Again], [{ misses: 2, hintUsed: true }, Rating.Again],
  ] as const) assert.equal(rateWriting(result), expected);
});

test('nextWritingCard: new Good schedules a card with one correct recall', () => {
  const card = makeCard('あ');
  assert.equal(card.char, 'あ');
  assert.equal(card.correctCount, 1);
  assert.equal(card.incorrectCount, 0);
  assert.equal(card.createdAt, now.toISOString());
  assert.equal(card.updatedAt, card.createdAt);
  assert.ok(card.dueAt > now);
  assert.equal(card.lastFailedAt, undefined);
});

test('nextWritingCard: Hard and Again count failures; Good preserves prior failure', () => {
  const previous = makeCard('あ');
  const snapshot = structuredClone(previous);
  const later = new Date('2026-10-22T10:00:00.000Z');
  for (const result of [hard, again]) {
    const failed = nextWritingCard(previous, 'あ', result, later);
    assert.equal(failed.incorrectCount, previous.incorrectCount + 1);
    assert.equal(failed.correctCount, previous.correctCount);
    assert.equal(failed.lastFailedAt, later.toISOString());
    assert.equal(failed.createdAt, previous.createdAt);
    assert.equal(failed.updatedAt, later.toISOString());
    const recovered = nextWritingCard(failed, 'あ', good, new Date('2026-10-23T10:00:00.000Z'));
    assert.equal(recovered.lastFailedAt, failed.lastFailedAt);
    assert.equal(recovered.incorrectCount, failed.incorrectCount);
    assert.equal(recovered.correctCount, failed.correctCount + 1);
  }
  assert.deepEqual(previous, snapshot);
  assert.ok(nextWritingCard(previous, 'あ', again, later).dueAt <= nextWritingCard(previous, 'あ', good, later).dueAt);
});

test('dueChars: excludes future, includes equality, sorts date then character without mutation', () => {
  const cards = [
    { ...makeCard('う'), dueAt: now },
    { ...makeCard('い'), dueAt: new Date(now.getTime() + 1) },
    { ...makeCard('あ'), dueAt: now },
    { ...makeCard('え'), dueAt: new Date(now.getTime() - 1) },
  ];
  assert.deepEqual(dueChars(cards, now), ['え', 'あ', 'う']);
  assert.deepEqual(cards.map((c) => c.char), ['う', 'い', 'あ', 'え']);
});

test('hardChars: failures descending, recent failure first, missing last, excludes zero', () => {
  const cards = [
    makeCard('え'),
    { ...makeCard('う'), incorrectCount: 1, lastFailedAt: '2026-10-20T00:00:00.000Z' },
    { ...makeCard('お'), incorrectCount: 1 },
    { ...makeCard('い'), incorrectCount: 1, lastFailedAt: now.toISOString() },
    { ...makeCard('あ'), incorrectCount: 3 },
  ];
  assert.deepEqual(hardChars(cards), ['あ', 'い', 'う', 'お']);
  assert.equal(cards[0].char, 'え');
});

test('buildWritingSession: deduplicates, learns only unknown, recalls all once in shuffled order', () => {
  const chars = ['あ', 'い', 'あ', 'う'];
  const known = new Set(['い']);
  const learn = [{ char: 'あ', phase: 'learn' }, { char: 'う', phase: 'learn' }];
  assert.deepEqual(buildWritingSession(chars, known, (x) => x), [
    ...learn, ...['あ', 'い', 'う'].map((char) => ({ char, phase: 'recall' })),
  ]);
  assert.deepEqual(buildWritingSession(chars, known, (x) => x.reverse()), [
    ...learn, ...['う', 'い', 'あ'].map((char) => ({ char, phase: 'recall' })),
  ]);
  assert.deepEqual(buildWritingSession(chars, new Set(chars), (x) => x),
    ['あ', 'い', 'う'].map((char) => ({ char, phase: 'recall' })));
  assert.deepEqual(buildWritingSession([], known), []);
  const shuffled = buildWritingSession(chars, known);
  assert.deepEqual(shuffled.slice(0, 2), learn);
  assert.deepEqual(shuffled.slice(2).map((step) => step.char).sort(), ['あ', 'い', 'う']);
  assert.ok(shuffled.slice(2).every((step) => step.phase === 'recall'));
  assert.deepEqual(chars, ['あ', 'い', 'あ', 'う']);
  assert.deepEqual([...known], ['い']);
});

test('recordWriting: reads then writes in a transaction containing only writingCards', async (t) => {
  const previous = makeCard('あ');
  const later = new Date('2026-10-22T10:00:00.000Z');
  const events: string[] = [];
  t.mock.method(db, 'transaction', async (mode: unknown, table: unknown, run: () => Promise<unknown>) => {
    assert.equal(mode, 'rw');
    assert.equal(table, db.writingCards);
    events.push('transaction');
    return run();
  });
  t.mock.method(db.writingCards, 'get', async (char: string) => {
    assert.equal(char, 'あ'); events.push('get'); return previous;
  });
  const put = t.mock.method(db.writingCards, 'put', async () => { events.push('put'); return 'あ'; });
  const result = await recordWriting('あ', hard, later);
  assert.deepEqual(result, nextWritingCard(previous, 'あ', hard, later));
  assert.deepEqual(put.mock.calls[0].arguments, [result]);
  assert.deepEqual(events, ['transaction', 'get', 'put']);
});
