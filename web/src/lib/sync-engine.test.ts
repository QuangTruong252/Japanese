import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { wipeAllLocalData } from './backup.ts';
import { db } from './db.ts';
import {
  LAST_PULLED_STORAGE_KEY,
  OWNER_STORAGE_KEY,
  initSyncEngine,
  setSyncClientFactoryForTest,
  signOut,
  triggerSync,
} from './sync.ts';

// Engine chạy với Dexie và Supabase giả: node không có IndexedDB, và cần điều khiển thứ tự các Promise.

type Row = Record<string, unknown>;

async function withEngine(fn: (ctx: ReturnType<typeof setup>) => Promise<void>) {
  const ctx = setup();
  try {
    await fn(ctx);
  } finally {
    ctx.restore();
  }
}

function setup() {
  const g = globalThis as Record<string, unknown>;
  const store = new Map<string, string>();
  g.window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  g.document = { visibilityState: 'hidden', addEventListener: () => {}, removeEventListener: () => {} };
  const navDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true });
  const env = { ...process.env };
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'key';

  const reviewItems = new Map<string, Row>();
  const sessions = new Map<string, Row>();
  const pending = new Map<string, Row>();
  const creatingHooks = new Set<() => void>();
  const fake: Record<string, unknown> = {
    reviewItems: {
      get: async (k: string) => reviewItems.get(k),
      put: async (r: Row) => void reviewItems.set(r.targetId as string, r),
      clear: async () => reviewItems.clear(),
    },
    practiceSessions: {
      bulkPut: async (rows: Row[]) => rows.forEach((r) => sessions.set(r.id as string, r)),
      clear: async () => sessions.clear(),
    },
    pendingSync: {
      clear: async () => pending.clear(),
      count: async () => pending.size,
      delete: async (id: string) => void pending.delete(id),
      orderBy: () => ({ toArray: async () => [...pending.values()] }),
      add: async (r: Row) => {
        pending.set(r.id as string, r);
        creatingHooks.forEach((f) => f());
      },
      hook: (_name: string, fn?: () => void) => {
        if (fn) {
          creatingHooks.add(fn);
          return undefined;
        }
        return { unsubscribe: (f: () => void) => creatingHooks.delete(f) };
      },
    },
    // Giới hạn: không mô phỏng khóa/thứ tự commit của Dexie, nên test không chứng minh được tuần tự hóa transaction thật.
    transaction: async (_mode: string, ...rest: unknown[]) => (rest[rest.length - 1] as () => Promise<void>)(),
  };
  const originals = new Map<string, PropertyDescriptor | undefined>();
  for (const [k, v] of Object.entries(fake)) {
    originals.set(k, Object.getOwnPropertyDescriptor(db, k));
    Object.defineProperty(db, k, { value: v, configurable: true, writable: true });
  }

  return {
    store,
    reviewItems,
    sessions,
    pending,
    creatingHooks,
    addPending: (r: Row) => (fake.pendingSync as { add: (r: Row) => Promise<void> }).add(r),
    restore() {
      setSyncClientFactoryForTest(null);
      for (const [k, d] of originals) {
        if (d) Object.defineProperty(db, k, d);
        else delete (db as unknown as Record<string, unknown>)[k];
      }
      delete g.window;
      delete g.document;
      if (navDesc) Object.defineProperty(globalThis, 'navigator', navDesc);
      process.env = env;
    },
  };
}

const flush = () => new Promise<void>((r) => setImmediate(r));

// Truy vấn giả: select/order/limit/gt trả về chính nó, await ra kết quả của `rows`.
function fakeClient(opts: {
  rows?: () => Promise<Row[]>;
  rpc?: (payload: unknown) => Promise<{ data: unknown; error: null }>;
  onSignOut?: (arg: unknown) => void;
  signOutError?: string;
  hasSession?: boolean;
  sessions?: () => Promise<Row[]>;
}) {
  const query = (rows: () => Promise<Row[]>) => {
    const q: Record<string, unknown> = {};
    for (const m of ['select', 'order', 'limit', 'gt', 'gte']) q[m] = () => q;
    q.then = (ok: (v: unknown) => unknown, bad: (e: unknown) => unknown) =>
      rows().then((data) => ({ data, error: null })).then(ok, bad);
    return q;
  };
  setSyncClientFactoryForTest(
    () =>
      ({
        auth: {
          getUser: async () => ({ data: { user: { id: 'u1' } } }),
          signOut: async (arg: unknown) => {
            opts.onSignOut?.(arg);
            return { error: opts.signOutError ? { message: opts.signOutError } : null };
          },
          getSession: async () => ({ data: { session: opts.hasSession ? { access_token: 't' } : null }, error: null }),
        },
        from: (table: string) =>
          query(
            table === 'review_items'
              ? (opts.rows ?? (async () => []))
              : table === 'practice_sessions'
                ? (opts.sessions ?? (async () => []))
                : async () => [],
          ),
        rpc: (_name: string, args: { payload: unknown }) =>
          (opts.rpc ?? (async () => ({ data: { status: 'ok' }, error: null })))(args.payload),
      }) as never,
  );
}

const reviewRow = {
  target_id: 't1',
  target_type: 'vocab',
  lesson: 1,
  due_at: '2026-10-01T00:00:00.000Z',
  fsrs_card: { due: '2026-10-01T00:00:00.000Z' },
  updated_at: '2026-10-02T00:00:00.000Z',
};
const sessionRow = { id: 's1', type: 'vocab', lesson: 1, completed_at: '2026-10-02T00:00:00.000Z', updated_at: '2026-10-02T00:00:00.000Z' };

// Hai ca: phản hồi trễ của review, rồi của sessions; mỗi ca chạy chuỗi gỡ liên kết → đăng xuất → wipe thật.
for (const late of ['review_items', 'practice_sessions'] as const) {
  test(`xóa dữ liệu lúc pull ${late} đang bay: kết quả trễ không ghi lại bảng, hàng đợi, owner hay con trỏ`, async () => {
    await withEngine(async (ctx) => {
      let release!: (rows: Row[]) => void;
      const gate = new Promise<Row[]>((r) => (release = r));
      fakeClient({
        rows: late === 'review_items' ? () => gate : undefined,
        sessions: late === 'practice_sessions' ? () => gate : undefined,
      });

      const running = triggerSync();
      await flush();
      assert.equal(ctx.store.get(OWNER_STORAGE_KEY), 'u1'); // lượt sync đã gắn owner và đang chờ pull
      ctx.reviewItems.set('old', { targetId: 'old' });
      ctx.sessions.set('old', { id: 'old' });
      ctx.pending.set('p', { id: 'p' });
      ctx.store.set(LAST_PULLED_STORAGE_KEY, '2026-10-01T00:00:00.000Z');

      await wipeAllLocalData(); // người dùng xóa dữ liệu trong lúc đó
      release(late === 'review_items' ? [reviewRow] : [sessionRow]);
      await running;
      await flush();

      assert.equal(ctx.reviewItems.size, 0);
      assert.equal(ctx.sessions.size, 0);
      assert.equal(ctx.pending.size, 0);
      assert.equal(ctx.store.has(OWNER_STORAGE_KEY), false);
      assert.equal(ctx.store.has(LAST_PULLED_STORAGE_KEY), false);
    });
  });
}

test('pendingSync mới tự được đẩy sau debounce và chỉ xóa sau ACK ok', async () => {
  await withEngine(async (ctx) => {
    const sent: unknown[] = [];
    let status = 'error';
    fakeClient({
      rpc: async (p) => {
        sent.push(p);
        return { data: { status }, error: null };
      },
    });
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
      const stop = initSyncEngine();
      await flush(); // lượt khởi tạo xong, hàng đợi rỗng
      assert.equal(sent.length, 0);

      await ctx.addPending({ id: 'a', payload: { v: 1 } });
      await ctx.addPending({ id: 'b', payload: { v: 2 } }); // gộp vào cùng một nhịp
      mock.timers.tick(300);
      await flush();
      assert.equal(sent.length, 2); // một lượt gửi cả a và b; chưa ACK ok nên vẫn nằm lại
      assert.equal(ctx.pending.has('a'), true);

      status = 'ok';
      await ctx.addPending({ id: 'c', payload: { v: 3 } });
      mock.timers.tick(300);
      await flush();
      assert.equal(ctx.pending.size, 0);

      stop();
      assert.equal(ctx.creatingHooks.size, 0); // cleanup gỡ hook
    } finally {
      mock.timers.reset();
    }
  });
});

test('pendingSync thêm giữa lượt đang chạy thì chạy thêm một lượt sau khi lượt đó xong', async () => {
  await withEngine(async (ctx) => {
    const sent: string[] = [];
    let unblock!: () => void;
    const gate = new Promise<void>((r) => (unblock = r));
    fakeClient({
      rpc: async (p) => {
        sent.push((p as { id: string }).id);
        if (sent.length === 1) await gate;
        return { data: { status: 'ok' }, error: null };
      },
    });
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
      const stop = initSyncEngine();
      await flush();
      await ctx.addPending({ id: 'p1', payload: { id: 'p1' } });
      mock.timers.tick(300);
      await flush(); // lượt 1 kẹt ở RPC của p1
      await ctx.addPending({ id: 'p2', payload: { id: 'p2' } });
      mock.timers.tick(300); // đến hạn khi lượt 1 còn chạy: chỉ đánh dấu chạy lại
      await flush();
      assert.deepEqual(sent, ['p1']);

      unblock();
      await flush();
      await flush();
      assert.deepEqual(sent, ['p1', 'p2']);
      assert.equal(ctx.pending.size, 0);
      stop();
    } finally {
      mock.timers.reset();
    }
  });
});

test('signOut({ local: true }) dùng phạm vi cục bộ; mặc định giữ phạm vi toàn cục', async () => {
  await withEngine(async () => {
    const args: unknown[] = [];
    fakeClient({ onSignOut: (a) => args.push(a) });
    await signOut({ local: true });
    await signOut();
    assert.deepEqual(args, [{ scope: 'local' }, undefined]);
  });
});

function seedLocalData(ctx: ReturnType<typeof setup>) {
  ctx.reviewItems.set('r', { targetId: 'r' });
  ctx.sessions.set('s', { id: 's' });
  ctx.pending.set('p', { id: 'p' });
  ctx.store.set(OWNER_STORAGE_KEY, 'u1');
  ctx.store.set(LAST_PULLED_STORAGE_KEY, '2026-10-01T00:00:00.000Z');
}

test('xóa dữ liệu offline: signOut lỗi mạng nhưng không còn phiên → vẫn xóa hết', async () => {
  await withEngine(async (ctx) => {
    fakeClient({ signOutError: 'offline', hasSession: false });
    seedLocalData(ctx);
    await wipeAllLocalData();
    assert.equal(ctx.reviewItems.size + ctx.sessions.size + ctx.pending.size, 0);
    assert.equal(ctx.store.has(OWNER_STORAGE_KEY), false);
    assert.equal(ctx.store.has(LAST_PULLED_STORAGE_KEY), false);
  });
});

test('xóa dữ liệu: signOut lỗi và còn phiên → chặn, không xóa dữ liệu học', async () => {
  await withEngine(async (ctx) => {
    fakeClient({ signOutError: 'offline', hasSession: true });
    seedLocalData(ctx);
    await assert.rejects(wipeAllLocalData());
    assert.equal(ctx.reviewItems.size, 1);
    assert.equal(ctx.sessions.size, 1);
    assert.equal(ctx.pending.size, 1);
  });
});
