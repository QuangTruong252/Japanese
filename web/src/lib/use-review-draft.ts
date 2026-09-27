'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  clearPracticeDraft,
  getPracticeDraftSnapshot,
  subscribePracticeDraft,
  type PracticeDraft,
} from '@/lib/practice-draft';

/**
 * Hook theo dõi bản nháp phiên ôn tập (mode: 'due').
 * Tự động cập nhật khi nháp được lưu, sửa hoặc xóa.
 */
export function useReviewDraft(): {
  draft: PracticeDraft | null;
  clearDraft: () => void;
} {
  const snapshot = useSyncExternalStore(
    subscribePracticeDraft,
    getPracticeDraftSnapshot,
    () => null,
  );

  const isDueDraft = snapshot !== null && snapshot.config?.mode === 'due';

  const clear = useCallback(() => {
    clearPracticeDraft();
  }, []);

  return {
    draft: isDueDraft ? snapshot : null,
    clearDraft: clear,
  };
}
