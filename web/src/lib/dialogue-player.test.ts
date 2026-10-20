import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playLines } from './dialogue-player.ts';

test('đọc tuần tự rồi báo xong; dừng giữa chừng thì không đọc câu sau', () => {
  const utterances: EventTarget[] = [];
  const active: (number | null)[] = [];
  const speakAt = () => {
    const u = new EventTarget();
    utterances.push(u);
    return u;
  };

  // Chạy hết 3 câu
  playLines(3, speakAt, (i) => active.push(i));
  for (let k = 0; k < 3; k++) utterances[k]!.dispatchEvent(new Event('end'));
  assert.deepEqual(active, [0, 1, 2, null]);

  // Dừng sau câu đầu: câu 'end' muộn của câu 0 không kéo câu 1 lên
  utterances.length = 0;
  active.length = 0;
  const stop = playLines(3, speakAt, (i) => active.push(i));
  stop();
  utterances[0]!.dispatchEvent(new Event('end'));
  assert.deepEqual(active, [0, null]);
  assert.equal(utterances.length, 1);

  // Lỗi (bị cancel chen vào) dừng chuỗi
  utterances.length = 0;
  active.length = 0;
  playLines(3, speakAt, (i) => active.push(i));
  utterances[0]!.dispatchEvent(new Event('error'));
  utterances[0]!.dispatchEvent(new Event('end'));
  assert.deepEqual(active, [0, null]);
  assert.equal(utterances.length, 1);
});

test('phát tình huống B thì A dừng hẳn, sự kiện muộn của A không phát câu kế', () => {
  const spoken: string[] = [];
  const utterances: Record<string, EventTarget[]> = { A: [], B: [] };
  const make = (name: string) => (i: number) => {
    const u = new EventTarget();
    utterances[name]!.push(u);
    spoken.push(`${name}${i}`);
    return u;
  };
  const activeA: (number | null)[] = [];
  const activeB: (number | null)[] = [];

  playLines(3, make('A'), (i) => activeA.push(i));
  playLines(3, make('B'), (i) => activeB.push(i));
  // speechSynthesis.cancel() của B làm A báo lỗi, rồi 'end' tới muộn
  utterances.A![0]!.dispatchEvent(new Event('error'));
  utterances.A![0]!.dispatchEvent(new Event('end'));
  assert.deepEqual(spoken, ['A0', 'B0']);
  assert.deepEqual(activeA, [0, null]);

  utterances.B![0]!.dispatchEvent(new Event('end'));
  assert.deepEqual(spoken, ['A0', 'B0', 'B1']);
  assert.deepEqual(activeB, [0, 1]);
});

test('stop (đổi tab/unmount) tắt trạng thái đang đọc và không phát tiếp', () => {
  const us: EventTarget[] = [];
  const active: (number | null)[] = [];
  const stop = playLines(
    2,
    () => {
      const u = new EventTarget();
      us.push(u);
      return u;
    },
    (i) => active.push(i),
  );
  stop();
  us[0]!.dispatchEvent(new Event('end'));
  assert.deepEqual(active, [0, null]);
  assert.equal(us.length, 1);
});
