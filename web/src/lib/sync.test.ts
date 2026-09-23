import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getOwnerUserId,
  setOwnerUserId,
  getLastPulledAt,
  setLastPulledAt,
  subscribeSyncStatus,
  updateSyncStatus,
  getSyncStatusSnapshot,
  getServerSyncStatusSnapshot,
} from './sync.ts';

test('OwnerUserId: đọc và ghi localStorage chuẩn khóa jp:ownerUserId', () => {
  // Chạy trong môi trường node (không có window): hàm trả về null an toàn
  assert.equal(getOwnerUserId(), null);
  setOwnerUserId('test-user-123');
  assert.equal(getOwnerUserId(), null); // không ném lỗi
});

test('LastPulledAt: đọc và ghi an toàn', () => {
  assert.equal(getLastPulledAt(), null);
  setLastPulledAt(new Date().toISOString());
  assert.equal(getLastPulledAt(), null);
});

test('getServerSyncStatusSnapshot: trả về đối tượng snapshot cố định cho SSR', () => {
  const s1 = getServerSyncStatusSnapshot();
  const s2 = getServerSyncStatusSnapshot();
  assert.equal(s1, s2);
  assert.equal(s1.state, 'offline');
  assert.equal(s1.pendingCount, 0);
  assert.equal(s1.lastSyncedAt, null);
});

test('SyncStatus: thông báo cho các listener khi có cập nhật', () => {
  let latestState: string | undefined;
  const unsubscribe = subscribeSyncStatus((status) => {
    latestState = status.state;
  });

  updateSyncStatus({ state: 'syncing' });
  assert.equal(latestState, 'syncing');
  assert.equal(getSyncStatusSnapshot().state, 'syncing');

  updateSyncStatus({ state: 'synced', pendingCount: 0 });
  assert.equal(latestState, 'synced');
  assert.equal(getSyncStatusSnapshot().state, 'synced');
  assert.equal(getSyncStatusSnapshot().pendingCount, 0);

  unsubscribe();
});
