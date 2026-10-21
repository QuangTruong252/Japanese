import Dexie, { type Table } from 'dexie';
import type { AudioFileRecord, PracticeSession, ReviewItem, PendingSyncRecord, WritingCard } from '@/types';

export class AppDatabase extends Dexie {
  writingCards!: Table<WritingCard, string>;
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

    // v2: ReviewItem thêm createdAt (đếm mục mới trong ngày) và recentElapsedMs (suy median).
    // Index không đổi, chỉ điền dữ liệu cho bản ghi cũ.
    this.version(2).upgrade(async (tx) => {
      await tx
        .table('reviewItems')
        .toCollection()
        .modify((item: Partial<ReviewItem>) => {
          item.recentElapsedMs ??= [];
          item.createdAt ??= item.updatedAt ?? new Date().toISOString();
        });
    });

    // Lịch viết tách riêng để không trộn vào ôn tập và đồng bộ tài khoản.
    this.version(3).stores({ writingCards: 'char, dueAt' });
  }
}

export const db = new AppDatabase();
