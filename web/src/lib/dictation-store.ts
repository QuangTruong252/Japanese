import { db } from './db.ts';
import { answerDictation, advanceDictation, type DictationSession } from './dictation-session.ts';

export async function startDictation(session: DictationSession): Promise<DictationSession> {
  return db.transaction('rw', db.dictationSessions, async () => {
    const existing = await db.dictationSessions.get(session.id);
    if (existing) return existing;
    await db.dictationSessions.add(session);
    return session;
  });
}

export async function updateDictation(id: string, index: number, action: 'input' | 'answer' | 'next', value = ''): Promise<void> {
  await db.transaction('rw', db.dictationSessions, async () => {
    const current = await db.dictationSessions.get(id);
    if (!current || current.completedAt || current.index !== index) return;
    const next = action === 'answer' ? answerDictation(current, index, value)
      : action === 'next' ? advanceDictation(current, index)
      : current.answers[index] ? current : { ...current, input: value, updatedAt: new Date().toISOString() };
    if (next !== current) await db.dictationSessions.put(next);
  });
}
