import type { ReadingPassage, ReadingSession } from '../types/reading.ts';
import { db } from './db.ts';
import type { ReadingScope } from './reading.ts';
import {
  applyReadingAction,
  createReadingSession,
  pickResumableSession,
  restartReadingSession,
  validateReadingSession,
  type ReadingAction,
  type ReadingActionRef,
  type ReadingActionResult,
} from './reading-session.ts';

export async function getReadingSession(id: string): Promise<ReadingSession | undefined> {
  return db.readingSessions.get(id);
}

/** Bản ghi đọc được nhưng sai (nhập backup hỏng, lệch phiên bản) để UI báo lỗi thay vì tự sửa hay xóa. */
export const isReadingSessionValid = (record: unknown): record is ReadingSession => validateReadingSession(record) !== null;

/** Mới cập nhật nhất trước; dùng cho danh sách trạng thái và khu vực phiên dở. */
export async function listReadingSessions(): Promise<ReadingSession[]> {
  return db.readingSessions.orderBy('updatedAt').reverse().toArray();
}

/** Phiên dở của bài: nhiều bản thì bản cập nhật gần nhất, bằng nhau thì ID tăng dần. Các bản khác được giữ. */
export async function findResumableSession(passageId: string): Promise<ReadingSession | undefined> {
  return pickResumableSession(await db.readingSessions.toArray(), passageId);
}

/** Phiên dở cập nhật gần nhất trong mọi bài. */
export async function findLatestUnfinishedSession(): Promise<ReadingSession | undefined> {
  return (await listReadingSessions()).find((s) => !s.completedAt);
}

/** Tiếp tục phiên dở của bài hoặc tạo phiên mới; chỉ trả về sau khi đã lưu thành công. */
export async function openReadingSession(passage: ReadingPassage, scope: ReadingScope): Promise<ReadingSession> {
  return db.transaction('rw', db.readingSessions, async () => {
    const resumable = pickResumableSession(await db.readingSessions.toArray(), passage.id);
    if (resumable) return resumable;
    const session = createReadingSession(passage, scope);
    await db.readingSessions.add(session);
    return session;
  });
}

/** Làm lại từ phiên đã có; null khi bài không còn trong catalog. Phiên cũ không đổi. */
export async function restartReading(sessionId: string): Promise<ReadingSession | null> {
  return db.transaction('rw', db.readingSessions, async () => {
    const previous = await db.readingSessions.get(sessionId);
    const next = previous && validateReadingSession(previous) && restartReadingSession(previous);
    if (next) await db.readingSessions.add(next);
    return next ?? null;
  });
}

/** Đọc lại bản ghi trong transaction rồi mới áp dụng, nên hai tab không ghi đè nhau. `missing`: ID không còn. `invalid`: bản ghi không hợp lệ, giữ nguyên. */
export async function updateReading(id: string, action: ReadingAction, ref: ReadingActionRef): Promise<ReadingActionResult | { status: 'missing' | 'invalid' }> {
  return db.transaction('rw', db.readingSessions, async () => {
    const current = await db.readingSessions.get(id);
    if (!current) return { status: 'missing' as const };
    // Bản ghi hỏng (backup lỗi, lệch bản chụp) không được sửa tiếp: UI báo lỗi và cho quay về danh sách.
    if (!validateReadingSession(current)) return { status: 'invalid' as const };
    const result = applyReadingAction(current, action, ref);
    if (result.status === 'applied') await db.readingSessions.put(result.session);
    return result;
  });
}
