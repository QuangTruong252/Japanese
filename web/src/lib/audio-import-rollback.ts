import type { AudioFileRecord } from '@/types';

/**
 * Nạp ghi đè track cũ cùng id, nên hủy giữa chừng phải trả từng id về trạng thái trước lần nạp:
 * id đã có bản cũ thì ghi lại bản cũ, id mới hoàn toàn thì xóa.
 */
export function planRollback(previous: Map<string, AudioFileRecord | undefined>): {
  restore: AudioFileRecord[];
  remove: string[];
} {
  const restore: AudioFileRecord[] = [];
  const remove: string[] = [];
  for (const [id, record] of previous) {
    if (record) restore.push(record);
    else remove.push(id);
  }
  return { restore, remove };
}
