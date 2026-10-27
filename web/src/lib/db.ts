import Dexie, { type Table } from 'dexie';
import type { AudioFileRecord, PracticeSession, ReviewItem, PendingSyncRecord, WritingCard } from '@/types';
import type { DictationSession } from './dictation-session.ts';
import type { TranslationSession } from './translation-session.ts';

export class AppDatabase extends Dexie {
  dictationSessions!: Table<DictationSession, string>;
  translationSessions!: Table<TranslationSession, string>;
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
    // Một khóa cho mỗi ngày/phạm vi giữ chung nháp và kết quả, tránh ghi lịch sử hai lần.
    this.version(4).stores({ dictationSessions: 'id, scope, updatedAt' }).upgrade(() => {});
    // Lượt dịch tự chọn phạm vi: mỗi phiên một khóa ngẫu nhiên, lưu cả bộ câu và chiều để reload không chọn lại.
    this.version(5).stores({ translationSessions: 'id, updatedAt' });
  }
}

export const db = new AppDatabase();
