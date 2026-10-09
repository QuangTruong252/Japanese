import { planRollback } from './audio-import-rollback.ts';
import type { AudioFileRecord } from '../types/index.ts';
import type { WorkerOutMessage } from '../workers/audio-import.worker.ts';

type Previous = Map<string, AudioFileRecord | undefined>;

export interface ImportResult {
  lessons: number;
  corruptedFiles: string[];
  conflicts: string[];
}

export interface ImportDeps {
  readHashes(): Promise<Record<string, string>>;
  /** Mở worker, trả hàm dừng đúng worker đó. Tin nhắn/lỗi của worker đi qua hai callback */
  startWorker(
    file: File,
    hashes: Record<string, string>,
    onMessage: (msg: WorkerOutMessage) => void,
    onWorkerError: () => void,
  ): () => void;
  store: {
    get(ids: string[]): Promise<(AudioFileRecord | undefined)[]>;
    put(records: AudioFileRecord[]): Promise<void>;
    restore(plan: { restore: AudioFileRecord[]; remove: string[] }): Promise<void>;
  };
  onProgress(msg: Extract<WorkerOutMessage, { type: 'PROGRESS' }>): void;
  onSuccess(result: ImportResult): void;
  /** Chỉ hiện thông báo lỗi, không đụng trạng thái đang nạp (lỗi hoàn tác có thể đến lúc phiên mới đang chạy) */
  onError(message: string): void;
  /** Phiên hiện tại đã kết thúc (thành công, lỗi hoặc hủy) */
  onEnd(): void;
}

interface Session {
  previous: Previous;
  lessons: Set<number>;
  stop?: () => void;
  // Mọi thao tác DB của phiên nối đuôi nhau; không bao giờ reject
  chain: Promise<void>;
}

const WRITE_ERROR = 'Không ghi được audio vào bộ nhớ trình duyệt (có thể đã hết dung lượng). Dữ liệu cũ được giữ nguyên.';
const ROLLBACK_ERROR = 'Không hoàn tác được lần nạp audio trước. Hãy nạp lại gói ZIP.';

/**
 * Điều phối một lần nạp gói audio. Phiên hiện hành là `current`: token được đặt trước mọi await,
 * Hủy/lỗi bỏ token ngay, và mỗi bước bất đồng bộ kiểm token sau khi chờ xong. Mọi lỗi (worker, đọc, ghi)
 * đi vào đúng một đường: dừng worker của phiên → hoàn tác → báo lỗi.
 */
export function createAudioImportRunner(deps: ImportDeps) {
  let current: Session | null = null;
  // Hoàn tác của các phiên đã bỏ; phiên mới chờ nó xong để không ghi chồng lên dữ liệu đang được trả lại
  let pendingRollback: Promise<void> = Promise.resolve();

  // Trả kết quả hoàn tác (false = hoàn tác lỗi, onError đã báo)
  const abandon = (s: Session): Promise<boolean> => {
    if (current === s) current = null;
    s.stop?.();
    const done = pendingRollback
      .then(() => s.chain)
      .then(async () => {
        const plan = planRollback(s.previous);
        if (plan.restore.length === 0 && plan.remove.length === 0) return true;
        try {
          await deps.store.restore(plan);
          return true;
        } catch (err) {
          console.error('Lỗi khi hoàn tác lần nạp audio:', err);
          deps.onError(ROLLBACK_ERROR);
          return false;
        }
      });
    pendingRollback = done.then(() => {});
    return done;
  };

  // UI vẫn bận cho tới khi hoàn tác xong, để Gỡ/Nạp không chạy chồng lên dữ liệu đang được trả lại.
  // Chỉ phiên bỏ sau cùng được kết thúc UI; nếu đã có phiên mới thì UI thuộc về phiên đó.
  const end = async (rolledBack: Promise<boolean>, message?: string) => {
    if ((await rolledBack) && message) deps.onError(message);
    const latest = pendingRollback;
    await latest;
    if (current === null && latest === pendingRollback) deps.onEnd();
  };

  const fail = (s: Session, message: string) => {
    if (current !== s) return;
    void end(abandon(s), message);
  };

  const writeBatch = async (s: Session, tracks: Extract<WorkerOutMessage, { type: 'BATCH' }>['tracks']) => {
    if (current !== s) return;
    try {
      const records: AudioFileRecord[] = tracks.map((t) => ({
        id: t.id,
        lesson: t.lesson,
        type: t.type,
        blob: new Blob([t.buffer], { type: 'audio/mpeg' }),
        size: t.size,
        sha256: t.sha256,
      }));
      const ids = records.map((r) => r.id);
      const old = await deps.store.get(ids);
      if (current !== s) return;
      ids.forEach((id, i) => {
        if (!s.previous.has(id)) s.previous.set(id, old[i]);
      });
      await deps.store.put(records);
      for (const r of records) s.lessons.add(r.lesson);
    } catch (err) {
      console.error('Lỗi khi ghi lô audio vào IndexedDB:', err);
      fail(s, WRITE_ERROR);
    }
  };

  const handle = (s: Session, msg: WorkerOutMessage) => {
    if (current !== s) return;
    if (msg.type === 'PROGRESS') {
      deps.onProgress(msg);
    } else if (msg.type === 'BATCH') {
      s.chain = s.chain.then(() => writeBatch(s, msg.tracks));
    } else if (msg.type === 'COMPLETE') {
      // Chờ các lô đã xếp hàng; nếu có lô lỗi thì phiên đã bị bỏ và nhánh này không chạy
      s.chain = s.chain.then(() => {
        if (current !== s) return;
        current = null;
        s.stop?.();
        deps.onSuccess({
          lessons: s.lessons.size,
          corruptedFiles: msg.corruptedFiles,
          conflicts: msg.conflicts,
        });
        deps.onEnd();
      });
    } else if (msg.type === 'ERROR') {
      fail(s, msg.message);
    }
  };

  async function start(file: File) {
    if (current) void abandon(current);
    const s: Session = { previous: new Map(), lessons: new Set(), chain: Promise.resolve() };
    current = s;
    try {
      await pendingRollback;
      if (current !== s) return;
      const hashes = await deps.readHashes();
      if (current !== s) return;
      s.stop = deps.startWorker(
        file,
        hashes,
        (msg) => handle(s, msg),
        () => fail(s, 'Đã xảy ra lỗi trong quá trình xử lý Web Worker.'),
      );
    } catch (err) {
      fail(s, err instanceof Error ? err.message : 'Không thể khởi động tiến trình nạp audio.');
    }
  }

  function cancel() {
    const s = current;
    if (!s) return;
    void end(abandon(s));
  }

  return { start, cancel };
}
