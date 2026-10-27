import { db } from './db.ts';
import { applyTranslationAction, type TranslationAction, type TranslationSession } from './translation-session.ts';

export async function startTranslation(session: TranslationSession): Promise<TranslationSession> {
  return db.transaction('rw', db.translationSessions, async () => {
    const existing = await db.translationSessions.get(session.id);
    if (existing) return existing;
    await db.translationSessions.add(session);
    return session;
  });
}

/** Đọc bản mới nhất rồi mới áp dụng, nên hai tab không ghi đè lần trả lời đầu của nhau. */
export async function updateTranslation(id: string, index: number, action: TranslationAction, elapsedSec: number): Promise<void> {
  await db.transaction('rw', db.translationSessions, async () => {
    const current = await db.translationSessions.get(id);
    if (!current) return;
    const next = applyTranslationAction(current, index, action, elapsedSec);
    if (next !== current) await db.translationSessions.put(next);
  });
}
