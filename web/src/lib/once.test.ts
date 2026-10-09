import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOnce } from './once.ts';

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test('createOnce: lời gọi thứ hai khi đang chạy không ghi thêm', async () => {
  const once = createOnce<number>();
  const d = deferred<number>();
  let writes = 0;
  const first = once(() => (writes++, d.promise));
  const second = once(() => (writes++, d.promise));
  d.resolve(7);
  assert.equal(await first, 7);
  assert.equal(await second, 7);
  assert.equal(writes, 1);
});

test('createOnce: reject thì cho thử lại, resolve thì giữ kết quả', async () => {
  const once = createOnce<number>();
  let writes = 0;
  await assert.rejects(once(() => (writes++, Promise.reject(new Error('lỗi ghi')))));
  assert.equal(await once(() => (writes++, Promise.resolve(1))), 1);
  assert.equal(await once(() => (writes++, Promise.resolve(2))), 1);
  assert.equal(writes, 2);
});
