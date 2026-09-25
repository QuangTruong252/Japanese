import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVocabDraft, serializeVocabDraft, vocabDraftKey } from './vocab-draft.ts';

const known = new Set(['vocab-01-01', 'vocab-01-02', 'vocab-01-03']);

test('vocab draft round-trips', () => {
  const raw = serializeVocabDraft({ targetIds: ['vocab-01-01', 'vocab-01-03'], currentIndex: 1 });
  assert.deepEqual(parseVocabDraft(raw, known), { targetIds: ['vocab-01-01', 'vocab-01-03'], currentIndex: 1 });
  assert.equal(vocabDraftKey(1), 'jp:vocab-draft:1');
});

test('vocab draft rejects corrupt or stale data', () => {
  assert.equal(parseVocabDraft(null, known), null);
  assert.equal(parseVocabDraft('{oops', known), null);
  assert.equal(parseVocabDraft(JSON.stringify({ version: 99, targetIds: ['vocab-01-01'], currentIndex: 0 }), known), null);
  assert.equal(parseVocabDraft(serializeVocabDraft({ targetIds: ['vocab-01-09'], currentIndex: 0 }), known), null);
  assert.equal(parseVocabDraft(serializeVocabDraft({ targetIds: ['vocab-01-01'], currentIndex: 1 }), known), null);
  assert.equal(parseVocabDraft(serializeVocabDraft({ targetIds: [], currentIndex: 0 }), known), null);
});
