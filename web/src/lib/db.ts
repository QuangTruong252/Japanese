import Dexie, { type Table } from 'dexie';
import type { AudioFileRecord, PracticeSession, ReviewItem, PendingSyncRecord } from '@/types';

export class AppDatabase extends Dexie {
  audioFiles!: Table<AudioFileRecord, string>;
  reviewItems!: Table<ReviewItem, string>;
  practiceSessions!: Table<PracticeSession, string>;
  pendingSync!: Table<PendingSyncRecord, string>;

  constructor() {
    super('JapaneseLearningDB');
    this.version(1).stores({
      audioFiles: 'id, lesson, type',
      reviewItems: 'targetId, dueAt, [targetType+incorrectCount]',
      practiceSessions: 'id, createdAt',
      pendingSync: 'id, createdAt',
    });
  }
}

export const db = new AppDatabase();
