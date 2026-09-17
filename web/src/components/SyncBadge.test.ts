import { test } from 'node:test';
import assert from 'node:assert/strict';

type SyncState = 'synced' | 'pending' | 'offline';

function resolveSyncBadgeProps(pendingCount: number): { state: SyncState; label: string } {
  // Ở giai đoạn này chưa có Supabase cloud sync, luôn là offline hoặc pending
  if (pendingCount > 0) {
    return { state: 'pending', label: `Chờ đồng bộ (${pendingCount})` };
  }
  return { state: 'offline', label: 'Ngoại tuyến — đã lưu trên máy' };
}

test('resolveSyncBadgeProps phản ánh đúng trạng thái offline-first trung thực', () => {
  const offline = resolveSyncBadgeProps(0);
  assert.equal(offline.state, 'offline');
  assert.equal(offline.label, 'Ngoại tuyến — đã lưu trên máy');

  const pending = resolveSyncBadgeProps(3);
  assert.equal(pending.state, 'pending');
  assert.equal(pending.label, 'Chờ đồng bộ (3)');
});
