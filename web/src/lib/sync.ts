import { db } from './db.ts';
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

const DEFAULT_SERVER_SYNC_STATUS: SyncEngineStatus = {
  state: 'offline',
  pendingCount: 0,
  lastSyncedAt: null,
};

export function getServerSyncStatusSnapshot(): SyncEngineStatus {
  return DEFAULT_SERVER_SYNC_STATUS;
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

/**
 * Gỡ liên kết máy với tài khoản: lần đồng bộ sau coi máy như chưa thuộc ai và không kéo lại dữ liệu cũ.
 */
export function clearAccountLink(): void {
  syncGeneration++;
  setOwnerUserId(null);
  setLastPulledAt(null);
}

let isSyncRunning = false;
// Tăng mỗi khi gỡ liên kết tài khoản: lượt sync đã bắt đầu từ trước thấy số đổi thì bỏ mọi thao tác ghi còn lại,
// nếu không phản hồi pull đến trễ sẽ ghi dữ liệu và con trỏ ngược lại sau khi người dùng đã xóa.
let syncGeneration = 0;
// Bản ghi pendingSync đến trong lúc đang đồng bộ: chạy thêm một lượt khi lượt hiện tại xong.
let rerunRequested = false;

const SYNC_DEBOUNCE_MS = 300;

type SyncClient = ReturnType<typeof createClient>;
let makeClient: () => SyncClient = createClient;

/** Chỉ cho test: thay client Supabase bằng bản giả. */
export function setSyncClientFactoryForTest(factory: (() => SyncClient) | null): void {
  makeClient = factory ?? createClient;
}

/**
 * Đẩy hàng đợi pendingSync lên Supabase RPC sync_practice.
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
        // Lỗi 4xx (client error) -> không retry vô hạn
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
 * Kéo delta từ Supabase về Dexie với phân trang keyset bắt buộc.
 */
async function pullRemoteChanges(
  supabase: ReturnType<typeof createClient>,
  isCurrent: () => boolean,
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
    if (!isCurrent() || error || !rows) {
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
      if (!isCurrent()) return;
      for (const item of incomingReviews) {
        const existing = await db.reviewItems.get(item.targetId);
        if (!existing || new Date(item.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
          await db.reviewItems.put(item);
        }
      }
    });

    if (!isCurrent()) break;
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
  if (isCurrent() && sessionRows && sessionRows.length > 0) {
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
      if (!isCurrent()) return;
      await db.practiceSessions.bulkPut(incomingSessions);
    });
  }

  // Cài đặt là riêng từng máy nên không kéo profiles.settings: làm vậy sẽ ghi đè cài đặt máy bằng mặc định của server.

  return { maxUpdatedAt: newestTimestamp };
}

/**
 * Chu trình đồng bộ hai chiều hoàn chỉnh: Đẩy trước, Kéo sau.
 */
export async function triggerSync(): Promise<boolean> {
  if (isSyncRunning) return false;
  const generation = syncGeneration;
  const isCurrent = () => generation === syncGeneration;
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
    supabase = makeClient();
  } catch {
    updateSyncStatus({ state: 'unconfigured' });
    return false;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pendingCount = await db.pendingSync.count();
  if (!isCurrent()) return false;

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
    // Tài khoản không khớp -> chặn để tránh trộn dữ liệu
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
    const { maxUpdatedAt } = await pullRemoteChanges(supabase, isCurrent);
    if (!isCurrent()) return false;
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
    if (!isCurrent()) return false;
    const remainingPending = await db.pendingSync.count();
    updateSyncStatus({
      state: remainingPending > 0 ? 'pending' : 'offline',
      pendingCount: remainingPending,
      errorMessage: err instanceof Error ? err.message : 'Quá trình đồng bộ gặp lỗi.',
    });
    return false;
  } finally {
    isSyncRunning = false;
    if (rerunRequested) {
      rerunRequested = false;
      void triggerSync();
    }
  }
}

/**
 * Khởi tạo các listener tự động kích hoạt đồng bộ.
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

  // Một chỗ chung cho mọi nơi ghi pendingSync (học từ, luyện tập, nhập sao lưu): hẹn đẩy sau một nhịp ngắn
  // để nhiều bản ghi liên tiếp gộp thành một lượt. Hook chạy trước khi transaction commit, còn lượt sync
  // đọc hàng đợi bằng transaction mới nên luôn thấy bản ghi đã commit.
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const onPendingCreated = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      if (isSyncRunning) rerunRequested = true;
      else void triggerSync();
    }, SYNC_DEBOUNCE_MS);
  };
  db.pendingSync.hook('creating', onPendingCreated);

  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Kích hoạt đồng bộ ban đầu
  triggerSync();

  return () => {
    db.pendingSync.hook('creating').unsubscribe(onPendingCreated);
    if (debounceTimer) clearTimeout(debounceTimer);
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

/**
 * `local`: chỉ thu hồi phiên của máy này, nhưng thư viện vẫn gửi một request lên server nên offline sẽ trả lỗi
 * dù phiên cục bộ đã bị bỏ. Vì vậy với `local` ta quyết định theo phiên còn trên máy (đọc lưu trữ, không cần mạng):
 * hết phiên thì coi như đăng xuất xong, còn phiên thì giữ nguyên lỗi.
 */
export async function signOut(options?: { local?: boolean }): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured()) return { error: null };
  try {
    const supabase = makeClient();
    let { error } = await supabase.auth.signOut(options?.local ? { scope: 'local' } : undefined);
    if (error && options?.local) {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!sessionError && !data.session) error = null;
    }
    updateSyncStatus({
      state: 'offline',
    });
    return { error: error ? new Error(error.message) : null };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
}
