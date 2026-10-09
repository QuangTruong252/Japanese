import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runBatchLoop, type BatchEntry, type BatchTrack } from './audio-import-batching.ts';

const entry = (path: string, body: string): BatchEntry => ({
  relativePath: path,
  entryName: path,
  read: async () => new TextEncoder().encode(body).buffer as ArrayBuffer,
});

// Hash giả: chính nội dung, đủ để phân biệt đúng/sai
const sha256 = async (b: ArrayBuffer) => new TextDecoder().decode(b);

function run(entries: BatchEntry[], manifest: Record<string, string>, cancelAfter = Infinity) {
  const batches: BatchTrack[][] = [];
  let progress = 0;
  const result = runBatchLoop({
    entries,
    manifest,
    existingHashes: {},
    maxFileSize: 1000,
    batchSize: 20,
    parsePath: () => ({ lesson: 1, type: 'vocab' }),
    sha256,
    onProgress: () => void progress++,
    onBatch: (t) => void batches.push(t),
    isCancelled: () => progress >= cancelAfter,
  });
  return { result, batches };
}

test('track tốt rồi track cuối sai hash: lô dư vẫn được gửi', async () => {
  const { result, batches } = run([entry('L01/a.mp3', 'a'), entry('L01/b.mp3', 'b')], {
    'L01/a.mp3': 'a',
    'L01/b.mp3': 'khác',
  });
  const r = await result;
  assert.equal(batches.length, 1);
  assert.deepEqual(batches[0]!.map((t) => t.id), ['L01/a.mp3']);
  assert.deepEqual(r?.corruptedFiles, ['L01/b.mp3']);
  assert.equal(r?.totalImported, 1);
});

test('Hủy trước file cuối: không flush lô dư, trả null', async () => {
  const { result, batches } = run([entry('L01/a.mp3', 'a'), entry('L01/b.mp3', 'b')], { 'L01/a.mp3': 'a', 'L01/b.mp3': 'b' }, 2);
  assert.equal(await result, null);
  assert.equal(batches.length, 0);
});
