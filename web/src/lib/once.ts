/**
 * Chạy một việc ghi tối đa một lần thành công: đang chạy hoặc đã xong thì mọi lời gọi sau nhận lại
 * cùng Promise (không ghi thêm); lỗi thì mở lại để thử lại.
 */
export function createOnce<T>(): (run: () => Promise<T>) => Promise<T> {
  let current: Promise<T> | null = null;
  return (run) => {
    if (current) return current;
    const started: Promise<T> = run();
    current = started;
    started.catch(() => {
      if (current === started) current = null;
    });
    return started;
  };
}
