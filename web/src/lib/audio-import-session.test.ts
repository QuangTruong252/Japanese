import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAudioImportRunner, type ImportDeps } from './audio-import-session.ts';
import type { AudioFileRecord } from '../types/index.ts';
import type { WorkerOutMessage } from '../workers/audio-import.worker.ts';

const rec = (id: string, lesson = 1, sha256 = 'old') =>
  ({ id, lesson, type: 'vocab', size: 1, sha256 }) as unknown as AudioFileRecord;

const batch = (...ids: string[]): WorkerOutMessage => ({
  type: 'BATCH',
  tracks: ids.map((id) => ({
    id,
    lesson: Number(id.slice(1, 3)),
    type: 'vocab',
    buffer: new ArrayBuffer(1),
    size: 1,
    sha256: 'new',
  })),
});
const complete: WorkerOutMessage = {
  type: 'COMPLETE',
  totalImported: 0,
  corruptedFiles: [],
  skippedFiles: [],
  conflicts: [],
};
const FILE = {} as File;
const tick = () => new Promise((r) => setTimeout(r, 0));

// Giữ một bước DB/đọc lại cho tới khi test mở; `entered` báo bước đã thật sự chạy tới
function gate() {
  let enter!: () => void;
  let open!: () => void;
  const entered = new Promise<void>((r) => (enter = r));
  const released = new Promise<void>((r) => (open = r));
  return {
    entered,
    release: open,
    wait: async () => {
      enter();
      await released;
    },
  };
}

type Gate = ReturnType<typeof gate>;

function setup(opts: { failGet?: () => boolean; failPut?: () => boolean; readHashesGate?: Gate; putGate?: Gate; restoreGate?: Gate } = {}) {
  const db = new Map<string, AudioFileRecord>([['L01/a.mp3', rec('L01/a.mp3')]]);
  const log = { workers: 0, stops: 0, errors: [] as string[], successes: [] as number[], ends: 0 };
  let send: (m: WorkerOutMessage) => void = () => {};
  let workerError: () => void = () => {};
  const deps: ImportDeps = {
    readHashes: async () => {
      await opts.readHashesGate?.wait();
      return {};
    },
    startWorker(_f, _h, onMessage, onWorkerError) {
      log.workers++;
      send = onMessage;
      workerError = onWorkerError;
      return () => void log.stops++;
    },
    store: {
      async get(ids) {
        await tick();
        if (opts.failGet?.()) throw new Error('read');
        return ids.map((id) => db.get(id));
      },
      async put(records) {
        await tick();
        await opts.putGate?.wait();
        if (opts.failPut?.()) throw new Error('quota');
        for (const r of records) db.set(r.id, r);
      },
      async restore({ restore, remove }) {
        await opts.restoreGate?.wait();
        remove.forEach((id) => db.delete(id));
        restore.forEach((r) => db.set(r.id, r));
      },
    },
    onProgress() {},
    onSuccess: (r) => void log.successes.push(r.lessons),
    onError: (m) => void log.errors.push(m),
    onEnd: () => void log.ends++,
  };
  const runner = createAudioImportRunner(deps);
  return { runner, db, log, send: (m: WorkerOutMessage) => send(m), workerError: () => workerError() };
}

test('thành công: ghi các lô, báo số bài, giữ dữ liệu mới', async () => {
  const t = setup();
  await t.runner.start(FILE);
  t.send(batch('L01/a.mp3', 'L02/b.mp3'));
  t.send(complete);
  await tick();
  await tick();
  await tick();
  assert.deepEqual(t.log.successes, [2]);
  assert.equal(t.log.ends, 1);
  assert.equal(t.db.get('L01/a.mp3')?.sha256, 'new');
  assert.equal(t.log.errors.length, 0);
});

test('Hủy khi đang đọc hash: không tạo worker, UI kết thúc', async () => {
  const readHashesGate = gate();
  const t = setup({ readHashesGate });
  const started = t.runner.start(FILE);
  await readHashesGate.entered;
  t.runner.cancel();
  readHashesGate.release();
  await started;
  await tick();
  assert.equal(t.log.workers, 0);
  assert.equal(t.log.ends, 1);
});

test('Hủy khi lô đang ghi: dừng worker ngay, onEnd chỉ sau khi hoàn tác xong', async () => {
  const putGate = gate();
  const restoreGate = gate();
  const t = setup({ putGate, restoreGate });
  await t.runner.start(FILE);
  t.send(batch('L01/a.mp3', 'L02/b.mp3'));
  await putGate.entered;
  t.runner.cancel();
  assert.equal(t.log.stops, 1);
  putGate.release();
  await restoreGate.entered; // hoàn tác đã chạy tới, chưa xong
  await tick();
  assert.equal(t.log.ends, 0);
  restoreGate.release();
  await tick();
  await tick();
  assert.equal(t.log.ends, 1);
  assert.equal(t.db.get('L01/a.mp3')?.sha256, 'old');
  assert.equal(t.db.has('L02/b.mp3'), false);
});

test('phiên trước còn hoàn tác: phiên B bị hủy không tạo worker, không dừng worker của C, UI thuộc về C', async () => {
  const putGate = gate();
  const restoreGate = gate();
  const t = setup({ putGate, restoreGate });
  await t.runner.start(FILE); // A
  t.send(batch('L01/a.mp3'));
  await putGate.entered;
  putGate.release();
  t.runner.cancel(); // A: hoàn tác chờ lô ghi xong rồi dừng ở restore
  await restoreGate.entered;
  const b = t.runner.start(FILE);
  t.runner.cancel(); // B
  const c = t.runner.start(FILE);
  restoreGate.release();
  await b;
  await c;
  await tick();
  assert.equal(t.log.workers, 2); // A và C, không có B
  assert.equal(t.log.stops, 1); // chỉ worker của A
  assert.equal(t.log.ends, 0); // phiên C đang chạy, A/B không được kết thúc UI của nó
  assert.equal(t.db.get('L01/a.mp3')?.sha256, 'old');
});

test('lỗi đọc sau một lô thành công: dừng worker, hoàn tác, báo lỗi, COMPLETE không báo thành công, nạp lại được', async () => {
  let reads = 0;
  const t = setup({ failGet: () => ++reads === 2 });
  await t.runner.start(FILE);
  t.send(batch('L01/a.mp3'));
  t.send(batch('L02/b.mp3'));
  t.send(complete);
  for (let i = 0; i < 6; i++) await tick();
  assert.equal(t.log.errors.length, 1);
  assert.equal(t.log.successes.length, 0);
  assert.equal(t.log.stops, 1);
  assert.equal(t.db.get('L01/a.mp3')?.sha256, 'old');
  assert.equal(t.db.has('L02/b.mp3'), false);
  await t.runner.start(FILE);
  assert.equal(t.log.workers, 2);
  t.send(batch('L03/c.mp3'));
  t.send(complete);
  for (let i = 0; i < 6; i++) await tick();
  assert.deepEqual(t.log.successes, [1]);
});

test('lỗi ghi lô sau (hết dung lượng): giữ dữ liệu cũ, báo lỗi, không báo thành công', async () => {
  let puts = 0;
  const t = setup({ failPut: () => ++puts === 2 });
  await t.runner.start(FILE);
  t.send(batch('L01/a.mp3'));
  t.send(batch('L02/b.mp3'));
  t.send(complete);
  for (let i = 0; i < 8; i++) await tick();
  assert.equal(t.log.errors.length, 1);
  assert.equal(t.log.successes.length, 0);
  assert.equal(t.db.get('L01/a.mp3')?.sha256, 'old');
  assert.equal(t.db.has('L02/b.mp3'), false);
  assert.equal(t.log.ends, 1);
});

test('lỗi worker dừng đúng worker và hoàn tác', async () => {
  const t = setup();
  await t.runner.start(FILE);
  t.send(batch('L01/a.mp3'));
  await tick();
  await tick();
  t.workerError();
  for (let i = 0; i < 6; i++) await tick();
  assert.equal(t.log.stops, 1);
  assert.equal(t.db.get('L01/a.mp3')?.sha256, 'old');
  assert.equal(t.log.errors.length, 1);
});
