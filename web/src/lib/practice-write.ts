import { db } from '@/lib/db';
import { applyResults, summarizeSession } from '@/lib/practice';
import type { AnswerResult, PracticeConfig, PracticeSession, ReviewItem } from '@/types';

/**
 * Ghi kết quả cuối phiên. Ba bảng, MỘT transaction (SPEC-04 §2): phiên, lịch ôn, và hàng đợi
 * đồng bộ phải cùng thành công hoặc cùng thất bại — nửa vời nghĩa là tiến độ học sai lệch.
 * Mọi thứ cần tính đã tính xong trước khi mở transaction; trong transaction không có await
 * nào ra ngoài Dexie.
 */
export async function savePracticeSession({
  config,
  results,
  lessonByTargetId,
  durationSeconds,
}: {
  config: PracticeConfig;
  results: AnswerResult[];
  lessonByTargetId: Map<string, number>;
  durationSeconds: number;
}): Promise<{ session: PracticeSession; reviewItems: ReviewItem[] }> {
  const now = new Date();
  const targetIds = [...new Set(results.map((r) => r.targetId))];
  const session = summarizeSession(config, results, durationSeconds, now);
  // Lịch ôn mới của đúng các mục tiêu vừa làm — màn kết quả phiên ôn cần nó để nói
  // "Lần ôn kế tiếp" mà không phải đọc Dexie lần nữa (SPEC-05 §3.3).
  let updated: ReviewItem[] = [];

  await db.transaction('rw', db.practiceSessions, db.reviewItems, db.pendingSync, async () => {
    const existing = (await db.reviewItems.bulkGet(targetIds)).filter(
      (item): item is NonNullable<typeof item> => item != null,
    );
    updated = applyResults(existing, results, lessonByTargetId, now);

    await db.practiceSessions.add(session);
    await db.reviewItems.bulkPut(updated);
    // F08 chưa có bên đọc — bảng này chỉ tích lũy cho tới khi SPEC-08 lên.
    await db.pendingSync.add({
      id: `sync-${session.id}`,
      payload: { kind: 'practice', session, reviewItems: updated },
      createdAt: now.getTime(),
    });
  });

  return { session, reviewItems: updated };
}
