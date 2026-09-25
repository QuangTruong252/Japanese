import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSyncBadgeState } from '../lib/stats.ts';

test('resolveSyncBadgeState phản ánh đúng trạng thái offline-first trung thực', () => {
  // Khi chưa đăng nhập: luôn là "Chỉ lưu trên máy", không nói "Chờ đồng bộ (3)"
  const notLoggedInWithPending = resolveSyncBadgeState({
    pendingCount: 3,
    isLoggedIn: false,
  });
  assert.equal(notLoggedInWithPending.state, 'offline');
  assert.equal(notLoggedInWithPending.label, 'Chỉ lưu trên máy');

  const notLoggedInEmpty = resolveSyncBadgeState({
    pendingCount: 0,
    isLoggedIn: false,
  });
  assert.equal(notLoggedInEmpty.state, 'offline');
  assert.equal(notLoggedInEmpty.label, 'Chỉ lưu trên máy');

  // Khi đã đăng nhập: phản ánh đúng trạng thái đồng bộ
  const loggedInPending = resolveSyncBadgeState({
    pendingCount: 3,
    isLoggedIn: true,
  });
  assert.equal(loggedInPending.state, 'pending');
  assert.equal(loggedInPending.label, 'Chờ đồng bộ (3)');

  const loggedInSynced = resolveSyncBadgeState({
    pendingCount: 0,
    isLoggedIn: true,
    engineState: 'synced',
  });
  assert.equal(loggedInSynced.state, 'synced');
  assert.equal(loggedInSynced.label, 'Đã đồng bộ');
});

