import { db } from './db.ts';
import { saveSettings } from './settings.ts';
import { isSupabaseConfigured, createClient } from './supabase/client.ts';
import type { Card } from 'ts-fsrs';
import type { ExerciseType, PracticeSession, ReviewItem, TargetType } from '../types/index.ts';

interface SupabaseReviewRow {
  target_id: string;
  target_type: string;
  lesson: number;
  incorrect_count?: number;
  correct_count?: number;
  last_failed_at?: string;
  due_at: string;
  fsrs_card: Record<string, unknown> & {
    due: string;
    last_review?: string;
  };
  updated_at: string;
}

interface SupabaseSessionRow {
  id: string;
  selected_lessons?: number[];
  exercise_types?: string[];
  total_questions: number;
  correct_count: number;
  accuracy_rate: string;
  duration_seconds: number;
  created_at: string;
}

export type SyncState = 'synced' | 'pending' | 'syncing' | 'offline' | 'unconfigured';

export interface SyncEngineStatus {
  state: SyncState;
  pendingCount: number;
  lastSyncedAt: Date | null;
  errorMessage?: string;
}

type SyncListener = (status: SyncEngineStatus) => void;
const listeners = new Set<SyncListener>();

let currentStatus: SyncEngineStatus = {
  state: 'offline',
  pendingCount: 0,
  lastSyncedAt: null,
};

function notifyListeners() {
  listeners.forEach((listener) => listener({ ...currentStatus }));
}

export function subscribeSyncStatus(listener: SyncListener): () => void {
  listeners.add(listener);
  listener({ ...currentStatus });
  return () => {
    listeners.delete(listener);
  };
}

export function getSyncStatusSnapshot(): SyncEngineStatus {
  return currentStatus;
}

export function updateSyncStatus(patch: Partial<SyncEngineStatus>) {
  currentStatus = { ...currentStatus, ...patch };
  notifyListeners();
}

export const OWNER_STORAGE_KEY = 'jp:ownerUserId';
export const LAST_PULLED_STORAGE_KEY = 'jp:lastPulledAt';

export function getOwnerUserId(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage.getItem(OWNER_STORAGE_KEY);
}

export function setOwnerUserId(userId: string | null): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (userId) {
    window.localStorage.setItem(OWNER_STORAGE_KEY, userId);
  } else {
    window.localStorage.removeItem(OWNER_STORAGE_KEY);
  }
}

export function getLastPulledAt(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage.getItem(LAST_PULLED_STORAGE_KEY);
}

export function setLastPulledAt(isoString: string | null): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (isoString) {
    window.localStorage.setItem(LAST_PULLED_STORAGE_KEY, isoString);
  } else {
    window.localStorage.removeItem(LAST_PULLED_STORAGE_KEY);
  }
}

let isSyncRunning = false;

/**
 * Đẩy hàng đợi pendingSync lên Supabase RPC sync_practice (SPEC-08 §2.1–2.2).
 */
async function pushPendingQueue(
  supabase: ReturnType<typeof createClient>,
): Promise<{ success: boolean; pushedCount: number }> {
  const pendingRecords = await db.pendingSync.orderBy('createdAt').toArray();
  if (pendingRecords.length === 0) {
    return { success: true, pushedCount: 0 };
  }

  let pushed = 0;
  for (const record of pendingRecords) {
    try {
      const { data, error } = await supabase.rpc('sync_practice', {
        payload: record.payload as Record<string, unknown>,
      });

      if (error) {
        // Lỗi 4xx (client error) -> không retry vô hạn (SPEC-08 §2.7)
        if (error.code?.startsWith('4') || error.message.includes('Not authenticated')) {
          updateSyncStatus({
            errorMessage: 'Một số bản ghi không đồng bộ được. Vui lòng xuất file JSON dự phòng.',
          });
          return { success: false, pushedCount: pushed };
        }
        return { success: false, pushedCount: pushed };
      }

      if (data && (data as { status?: string }).status === 'ok') {
        await db.pendingSync.delete(record.id);
        pushed++;
      }
    } catch {
      return { success: false, pushedCount: pushed };
    }
  }

  return { success: true, pushedCount: pushed };
}

/**
 * Kéo delta từ Supabase về Dexie với phân trang keyset bắt buộc (SPEC-08 §2.3).
 */
async function pullRemoteChanges(
  supabase: ReturnType<typeof createClient>,
  currentUserId: string,
): Promise<{ maxUpdatedAt: string | null }> {
  const lastPulledAt = getLastPulledAt();
  let newestTimestamp = lastPulledAt;

  // 1. Phân trang keyset kéo review_items
  const PAGE_SIZE = 500;
  let cursor = lastPulledAt;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('review_items')
      .select('*')
      .order('updated_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(PAGE_SIZE);

    if (cursor) {
      query = query.gt('updated_at', cursor);
    }

    const { data: rows, error } = await query;
    if (error || !rows) {
      break;
    }

    if (rows.length === 0) {
      break;
    }

    // Convert snake_case sang ReviewItem
    const incomingReviews: ReviewItem[] = (rows as unknown as SupabaseReviewRow[]).map((r) => ({
      targetId: r.target_id,
      targetType: r.target_type as TargetType,
      lesson: r.lesson,
      incorrectCount: r.incorrect_count ?? 0,
      correctCount: r.correct_count ?? 0,
      lastFailedAt: r.last_failed_at,
      dueAt: new Date(r.due_at),
      fsrsCard: {
        ...(r.fsrs_card as unknown as Card),
        due: new Date(r.fsrs_card.due),
        last_review: r.fsrs_card.last_review ? new Date(r.fsrs_card.last_review) : undefined,
      },
      updatedAt: r.updated_at,
      createdAt: r.updated_at, // fallback
      recentElapsedMs: [],
    }));

    // Hợp nhất vào Dexie theo nguyên tắc LWW (updatedAt mới hơn thắng)
    await db.transaction('rw', db.reviewItems, async () => {
      for (const item of incomingReviews) {
        const existing = await db.reviewItems.get(item.targetId);
        if (!existing || new Date(item.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
          await db.reviewItems.put(item);
        }
      }
    });

    const lastRow = rows[rows.length - 1];
    cursor = lastRow.updated_at;
    newestTimestamp = cursor;

    if (rows.length < PAGE_SIZE) {
      hasMore = false;
    }
  }

  // 2. Kéo practice_sessions (90 ngày gần nhất nếu chưa kéo bao giờ)
  let sessionsQuery = supabase
    .from('practice_sessions')
    .select('*')
    .order('created_at', { ascending: true });

  if (lastPulledAt) {
    sessionsQuery = sessionsQuery.gt('created_at', lastPulledAt);
  } else {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
    sessionsQuery = sessionsQuery.gte('created_at', ninetyDaysAgo);
  }

  const { data: sessionRows } = await sessionsQuery;
  if (sessionRows && sessionRows.length > 0) {
    const incomingSessions: PracticeSession[] = (sessionRows as unknown as SupabaseSessionRow[]).map((s) => ({
      id: s.id,
      selectedLessons: s.selected_lessons ?? [],
      exerciseTypes: (s.exercise_types ?? []) as ExerciseType[],
      totalQuestions: s.total_questions,
      correctCount: s.correct_count,
      accuracyRate: Number.parseFloat(s.accuracy_rate) || 0,
      durationSeconds: s.duration_seconds,
      createdAt: s.created_at,
    }));

    await db.transaction('rw', db.practiceSessions, async () => {
      await db.practiceSessions.bulkPut(incomingSessions);
    });
  }

  // 3. Kéo profiles settings
  const { data: profile } = await supabase
    .from('profiles')
    .select('settings')
    .eq('id', currentUserId)
    .single();

  if (profile?.settings) {
    saveSettings(profile.settings);
  }

  return { maxUpdatedAt: newestTimestamp };
}

/**
 * Chu trình đồng bộ hai chiều hoàn chỉnh: Đẩy trước, Kéo sau (SPEC-08 §2.4).
 */
export async function triggerSync(): Promise<boolean> {
  if (isSyncRunning) return false;
  if (!isSupabaseConfigured()) {
    const pendingCount = await db.pendingSync.count();
    updateSyncStatus({
      state: 'unconfigured',
      pendingCount,
    });
    return false;
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const pendingCount = await db.pendingSync.count();
    updateSyncStatus({
      state: 'offline',
      pendingCount,
    });
    return false;
  }

  let supabase: ReturnType<typeof createClient>;
  try {
    supabase = createClient();
  } catch {
    updateSyncStatus({ state: 'unconfigured' });
    return false;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pendingCount = await db.pendingSync.count();

  if (!user) {
    updateSyncStatus({
      state: 'offline', // Đã lưu trên máy
      pendingCount,
    });
    return false;
  }

  // Kiểm tra tài khoản sở hữu
  const owner = getOwnerUserId();
  if (!owner) {
    setOwnerUserId(user.id);
  } else if (owner !== user.id) {
    // Tài khoản không khớp -> chặn để tránh trộn dữ liệu (SPEC-08 §2.5)
    updateSyncStatus({
      state: 'pending',
      pendingCount,
      errorMessage: 'Tài khoản đăng nhập khác với tài khoản sở hữu dữ liệu trên máy.',
    });
    return false;
  }

  isSyncRunning = true;
  updateSyncStatus({ state: 'syncing', errorMessage: undefined });

  try {
    // 1. Đẩy trước (Push)
    await pushPendingQueue(supabase);

    // 2. Kéo sau (Pull)
    const { maxUpdatedAt } = await pullRemoteChanges(supabase, user.id);
    if (maxUpdatedAt) {
      setLastPulledAt(maxUpdatedAt);
    }

    const remainingPending = await db.pendingSync.count();
    updateSyncStatus({
      state: remainingPending > 0 ? 'pending' : 'synced',
      pendingCount: remainingPending,
      lastSyncedAt: new Date(),
      errorMessage: undefined,
    });
    return true;
  } catch (err: unknown) {
    const remainingPending = await db.pendingSync.count();
    updateSyncStatus({
      state: remainingPending > 0 ? 'pending' : 'offline',
      pendingCount: remainingPending,
      errorMessage: err instanceof Error ? err.message : 'Quá trình đồng bộ gặp lỗi.',
    });
    return false;
  } finally {
    isSyncRunning = false;
  }
}

/**
 * Khởi tạo các listener tự động kích hoạt đồng bộ (SPEC-08 §2.7).
 */
export function initSyncEngine(): () => void {
  if (typeof window === 'undefined') return () => {};

  const onOnline = () => {
    triggerSync();
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      triggerSync();
    }
  };

  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Kích hoạt đồng bộ ban đầu
  triggerSync();

  return () => {
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}

export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return {
      error: new Error(
        'Chưa cấu hình Supabase. Vui lòng thiết lập NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      ),
    };
  }

  try {
    const supabase = createClient();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
    return { error: error ? new Error(error.message) : null };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
}

export async function signOut(): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured()) return { error: null };
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    updateSyncStatus({
      state: 'offline',
    });
    return { error: error ? new Error(error.message) : null };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
}
