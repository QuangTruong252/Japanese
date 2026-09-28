'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  clearPracticeDraft,
  deserializePracticeDraft,
  getPracticeDraftSnapshot,
  serializePracticeDraft,
  subscribePracticeDraft,
  validatePracticeDraft,
  type PracticeDraft,
} from './practice-draft.ts';

/**
 * Kiểm tra xem một bản nháp có phải là nháp ôn tập (mode: 'due') hợp lệ hay không.
 */
export function isReviewDraft(draft: unknown): draft is PracticeDraft {
  const validated = validatePracticeDraft(draft);
  return validated !== null && validated.config?.mode === 'due';
}

/**
 * Validate và chuẩn hóa bản nháp phiên ôn tập.
 * Trả về PracticeDraft nếu hợp lệ và mang config.mode === 'due', ngược lại trả về null.
 */
export function validateReviewDraft(data: unknown): PracticeDraft | null {
  const draft = validatePracticeDraft(data);
  if (!draft || draft.config?.mode !== 'due') {
    return null;
  }
  return draft;
}

/**
 * Serialize bản nháp ôn tập thành chuỗi JSON.
 */
export function serializeReviewDraft(draft: PracticeDraft): string {
  const validated = validateReviewDraft(draft);
  if (!validated) {
    throw new Error('Dữ liệu nháp ôn tập không hợp lệ hoặc không phải chế độ ôn tập (mode: due)');
  }
  return serializePracticeDraft(validated);
}

/**
 * Deserialize chuỗi JSON thành PracticeDraft cho phiên ôn tập (mode: 'due').
 */
export function deserializeReviewDraft(raw: string): PracticeDraft | null {
  const draft = deserializePracticeDraft(raw);
  return validateReviewDraft(draft);
}

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
