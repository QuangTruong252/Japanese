import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planRollback } from './audio-import-rollback.ts';
import type { AudioFileRecord } from '../types/index.ts';

test('planRollback: id có bản cũ thì khôi phục, id mới thì xóa', () => {
  const old = { id: 'L01/track1.mp3', lesson: 1, type: 'vocab', size: 1, sha256: 'a' } as unknown as AudioFileRecord;
  const plan = planRollback(
    new Map<string, AudioFileRecord | undefined>([
      ['L01/track1.mp3', old],
      ['L02/track1.mp3', undefined],
    ]),
  );
  assert.deepEqual(plan.restore, [old]);
  assert.deepEqual(plan.remove, ['L02/track1.mp3']);
});
