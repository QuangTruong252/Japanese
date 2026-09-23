# Kế hoạch triển khai SPEC-09 — Nạp Audio đĩa CD từ file ZIP

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng tính năng nạp gói audio đĩa CD Minna no Nihongo I từ file ZIP vào IndexedDB (`db.audioFiles`) bằng Web Worker, cung cấp giao diện quản lý tình trạng 25 bài học tại `/cai-dat/audio` theo mockup `mock/20-audio-zip.png`.

**Architecture:** Tách biệt 3 tầng: tầng logic thuần túy (`src/lib/audio-zip.ts`) để kiểm thử 100% bằng unit test; tầng Web Worker (`src/workers/audio-import.worker.ts`) xử lý JSZip và băm `crypto.subtle.digest` chuyển buffer zero-copy; tầng React Hook & UI (`use-audio-import.ts`, `/cai-dat/audio/page.tsx`) lưu Dexie theo lô 20 file và hiển thị trạng thái Washi.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, JSZip, Web Crypto API (`crypto.subtle`), Dexie 4 (`dexie-react-hooks`), Lucide React, Base UI / shadcn.

## Global Constraints

- **Không hardcode màu sắc:** Sử dụng token Washi (`bg-card`, `border-border`, `text-muted-foreground`, `text-emerald-600`, `text-amber-500`, ...).
- **Quy tắc Atomic ngoại lệ có chủ đích (SPEC-09 §2.3):** Audio nạp và ghi theo lô ~20 file, mỗi lô một transaction. Lỗi ở lô sau hoặc hủy giữa chừng không rollback các lô trước.
- **Bảo mật và Bản quyền (SPEC-09 §8):** Không nhúng file audio vào bundle, không gọi mạng, audio nằm hoàn toàn trên thiết bị người dùng.
- **Tiêu chuẩn chạm & A11y:** Nút bấm kích thước chuẩn ≥ 48px, vùng `aria-live="polite"` báo mốc tiến độ chẵn, focus ring 3px không tắt.

---

### Task 1: Xây dựng Thư viện thuần `src/lib/audio-zip.ts` và Unit Test

**Files:**
- Create: `web/src/lib/audio-zip.ts`
- Create: `web/src/lib/audio-zip.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface ParsedTrackPath {
    lesson: number;
    trackNumber: number;
    type: 'vocab' | 'sentence_patterns' | 'examples' | 'conversation';
  }
  export function parseAudioTrackPath(path: string): ParsedTrackPath | null;
  export function validateZipLimits(limits: {
    fileSize?: number;
    entryCount?: number;
    uncompressedTotal?: number;
    maxSingleSize?: number;
    compressionRatio?: number;
  }): { valid: boolean; error?: string };
  export function parseAndValidateManifest(rawJson: string): { valid: boolean; manifest?: Record<string, string>; error?: string };
  export function formatStorageSize(bytes: number): string;
  export function detectHashConflicts(existingHashes: Record<string, string>, newManifest: Record<string, string>): string[];
  ```

- [ ] **Step 1: Viết unit tests kiểm thử các hàm logic của `audio-zip`**
Tạo file `web/src/lib/audio-zip.test.ts` kiểm tra:
1. `parseAudioTrackPath`: khớp đường dẫn chuẩn `L01/01_vocab.mp3`, `L25/04_conversation.mp3`; từ chối `../evil.mp3`, `L00/01_vocab.mp3`, `L26/01_vocab.mp3`, `L01/05_unknown.mp3`, file không phải mp3.
2. `validateZipLimits`: kiểm tra ngưỡng file size (> 2GB), entry count (> 200), uncompressed total (> 4GB), single file (> 100MB), ratio (> 100x).
3. `parseAndValidateManifest`: parse JSON hợp lệ dạng key-value sha256 hex 64 ký tự; từ chối JSON hỏng hoặc map rỗng.
4. `formatStorageSize`: định dạng byte sang KB, MB, GB chuẩn xác.
5. `detectHashConflicts`: phát hiện đúng các track đã tồn tại nhưng có hash khác biệt (TOFU).

- [ ] **Step 2: Chạy unit test để xác nhận test FAIL (do chưa có file triển khai)**
Run: `cd web && node --test src/lib/audio-zip.test.ts`
Expected: FAIL với lỗi "Cannot find module '@/lib/audio-zip'" hoặc tương đương.

- [ ] **Step 3: Triển khai mã nguồn `web/src/lib/audio-zip.ts`**
Viết implementation đầy đủ các hằng số giới hạn tài nguyên và các hàm xuất đã định nghĩa.

- [ ] **Step 4: Chạy lại unit test để xác nhận test PASS**
Run: `cd web && node --test src/lib/audio-zip.test.ts`
Expected: PASS toàn bộ các test cases.

- [ ] **Step 5: Kiểm tra lint và typecheck**
Run: `cd web && pnpm check`
Expected: 0 errors.

---

### Task 2: Xây dựng Web Worker `src/workers/audio-import.worker.ts`

**Files:**
- Create: `web/src/workers/audio-import.worker.ts`

**Interfaces:**
- Consumes: `parseAudioTrackPath`, `validateZipLimits`, `parseAndValidateManifest` từ `@/lib/audio-zip`.
- Produces:
  Giao thức tin nhắn Worker xử lý file ZIP bằng JSZip, băm SHA-256 bằng Web Crypto API, chuyển buffer sang main thread qua `postMessage(message, [buffers])`.

- [ ] **Step 1: Định nghĩa các kiểu tin nhắn Worker và triển khai logic giải nén**
Tạo `web/src/workers/audio-import.worker.ts`:
1. Lắng nghe `self.onmessage`:
   - Xử lý `{ type: 'CANCEL' }`: đặt flag `isCancelled = true`.
   - Xử lý `{ type: 'START', file: File, existingHashes: Record<string, string> }`:
2. Đọc file qua `JSZip.loadAsync(file)`.
3. Kiểm tra số lượng entry và tổng dung lượng trước khi giải nén.
4. Tìm và đọc file `manifest.json`. Nếu thiếu hoặc lỗi: `postMessage({ type: 'ERROR', message: 'Thiếu file manifest.json hoặc sai định dạng.' })`.
5. Duyệt qua từng entry hợp lệ theo `parseAudioTrackPath`:
   - Nếu `isCancelled`, thoát ngay.
   - Kiểm tra `entry._data.uncompressedSize` so với `compressedSize` (chống zip-bomb).
   - Gọi `entry.async('arraybuffer')`.
   - Tính SHA-256 bằng `crypto.subtle.digest('SHA-256', buffer)`.
   - Chuyển digest thành hex string và so sánh với manifest.
   - Nếu không khớp: đưa vào `corruptedFiles`.
   - Nếu khớp: đưa vào batch hiện tại, kiểm tra TOFU với `existingHashes`.
   - Gửi tiến độ: `postMessage({ type: 'PROGRESS', current, total, currentFile })`.
   - Khi batch đạt 20 track (hoặc hết track): gửi `postMessage({ type: 'BATCH', tracks }, transferList)` và làm rỗng batch.
6. Khi duyệt xong: gửi `postMessage({ type: 'COMPLETE', totalImported, corruptedFiles, conflicts, skippedFiles })`.

- [ ] **Step 2: Kiểm tra typecheck cho worker**
Run: `cd web && pnpm check`
Expected: TypeScript biên dịch không lỗi.

---

### Task 3: Xây dựng React Hook `src/hooks/use-audio-import.ts`

**Files:**
- Create: `web/src/hooks/use-audio-import.ts`

**Interfaces:**
- Consumes: `db.audioFiles` từ `@/lib/db`, Worker `audio-import.worker.ts`.
- Produces:
  ```ts
  export interface ImportProgress {
    current: number;
    total: number;
    currentFile: string;
    percent: number;
  }
  export function useAudioImport(): {
    isImporting: boolean;
    progress: ImportProgress | null;
    corruptedFiles: string[];
    conflicts: string[];
    error: string | null;
    startImport: (file: File) => Promise<void>;
    cancelImport: () => void;
    clearError: () => void;
  };
  ```

- [ ] **Step 1: Viết hook `useAudioImport`**
Tạo `web/src/hooks/use-audio-import.ts`:
1. Quản lý trạng thái: `isImporting`, `progress`, `corruptedFiles`, `conflicts`, `error`.
2. Hàm `startImport(file: File)`:
   - Kiểm tra `file.size <= 2 * 1024 * 1024 * 1024` (2GB). Nếu vượt quá, set `error = 'File ZIP vượt quá dung lượng tối đa 2GB.'` và return.
   - Lấy toàn bộ hash hiện có từ `db.audioFiles.toArray()`.
   - Tạo instance `new Worker(new URL('@/workers/audio-import.worker.ts', import.meta.url))`.
   - Lắng nghe tin nhắn từ worker:
     - `PROGRESS`: cập nhật state `progress`.
     - `BATCH`: tạo `AudioFileRecord` với `new Blob([track.buffer], { type: 'audio/mpeg' })`, gọi `await db.audioFiles.bulkPut(records)` theo từng lô.
     - `COMPLETE`: lưu danh sách file hỏng / xung đột, tắt cờ `isImporting`, đóng worker.
     - `ERROR`: set `error`, tắt cờ `isImporting`, đóng worker.
3. Hàm `cancelImport()`:
   - Gửi tin nhắn `CANCEL` sang worker và gọi `worker.terminate()`.
   - Không xóa các track đã ghi vào Dexie.
4. Quản lý sự kiện `beforeunload`: khi `isImporting === true`, gắn listener ngăn người dùng vô tình đóng tab.

- [ ] **Step 2: Kiểm tra typecheck và lint**
Run: `cd web && pnpm check`
Expected: 0 errors.

---

### Task 4: Xây dựng Giao diện Trang `/cai-dat/audio`

**Files:**
- Create: `web/src/app/cai-dat/audio/page.tsx`

**Interfaces:**
- Consumes: `useAudioImport`, `db.audioFiles` qua `useLiveQuery`, `mock/20-audio-zip.png`, `AlertDialog`, `Progress`, `Button`, `Card`.

- [ ] **Step 1: Triển khai trang `/cai-dat/audio/page.tsx`**
1. **Header & Điều hướng:**
   - Nút quay lại: `< Cài đặt` liên kết tới `/cai-dat`.
   - H1: `Audio đĩa CD`.
   - Phụ đề: `Nạp gói ZIP audio của bạn để luyện nghe trên máy này.`.
2. **Thống kê dung lượng & Thư viện hiện tại:**
   - Dùng `useLiveQuery(() => db.audioFiles.toArray())` để tính tổng số track, tổng số bài, tổng dung lượng MB.
   - Khi chưa có audio: gọi `navigator.storage.estimate()` hiển thị dung lượng trống còn lại (*"Còn trống khoảng X GB"*).
   - Khi đã có audio: Card Thư viện hiện tại hiển thị *"98 track · 412 MB"* và dòng phụ *"Đã kiểm toàn vẹn gói · chưa xác minh ấn bản"*.
3. **Lưới 25 bài học (5×5 Lesson Coverage Grid):**
   - Khối tiêu đề: `Tình trạng bài học` kèm chú thích:
     - `✔ Đầy đủ` (icon check tròn xanh lục).
     - `◑ Thiếu track` (icon tròn khuyết hổ phách).
   - 25 ô card:
     - Bài đủ 4 track: số bài + icon check tròn xanh lục, `aria-label="Bài {n}, 4 trên 4 track"`.
     - Bài thiếu track (1-3 track): số bài + icon tròn khuyết hổ phách + chữ nhỏ `"Thiếu track"`, `aria-label="Bài {n}, {x} trên 4 track"`.
     - Bài 0 track: hiển thị nhãn mờ `0/4`.
4. **Khối Đang nạp (Khi `isImporting`):**
   - Thay thế nút nạp bằng thanh tiến độ `Progress` theo phần trăm thật.
   - Text: `"Đang kiểm tra {currentFile} — {current} / {total} file"`.
   - Nút "Hủy" kiểu ghost.
   - Vùng `aria-live="polite"` cho screen reader.
5. **Khối Cảnh báo file hỏng (Khi `corruptedFiles.length > 0`):**
   - Card viền cảnh báo màu đỏ/hổ phách nhạt: icon `TriangleAlert`, tiêu đề `X file không khớp mã kiểm tra`, phụ đề `Kiểm tra gói ZIP rồi nạp lại.`, danh sách tên các file bị lỗi.
6. **Thao tác chính:**
   - Nút chọn file ZIP (nút ẩn gắn thẻ `<input type="file" accept=".zip">`).
   - Nút `Nạp lại file ZIP` khi đã có audio.
   - Nút `Gỡ toàn bộ audio` mở `AlertDialog` xác nhận giải phóng dung lượng và `db.audioFiles.clear()`.
   - Ghi chú chân trang: `ℹ Audio chỉ được lưu trên máy này.`.

- [ ] **Step 2: Chạy kiểm tra tĩnh và build**
Run: `cd web && pnpm check`
Expected: 0 errors.

---

### Task 5: Thêm Lối vào "Audio đĩa CD" tại Trang `/cai-dat`

**Files:**
- Modify: `web/src/app/cai-dat/page.tsx`

**Interfaces:**
- Hiển thị Card điều hướng dẫn tới `/cai-dat/audio` trong mục Dữ liệu / Sao lưu.

- [ ] **Step 1: Đọc số lượng audioFiles bằng `useLiveQuery` trong `SettingsPage`**
Thêm truy vấn `const audioCount = useLiveQuery(() => db.audioFiles.count(), []);`.

- [ ] **Step 2: Thêm Card "Audio đĩa CD" vào giao diện Cài đặt**
Đặt card trong khu vực Quản lý dữ liệu:
- Icon `Volume2` hoặc `Headphones` / `FileArchive`.
- Tiêu đề: `Audio đĩa CD`.
- Mô tả: `Quản lý file âm thanh luyện nghe từ đĩa CD.`
- Badge trạng thái: `audioCount ? `${audioCount}/100 track` : 'Chưa nạp'` (màu tương ứng).
- Nút "Quản lý" hoặc "Nạp audio" dẫn tới `/cai-dat/audio`.

- [ ] **Step 3: Chạy kiểm tra tĩnh và tests**
Run: `cd web && pnpm check && pnpm test`
Expected: 0 errors, 100% tests pass.

---

### Task 6: Kiểm chứng Toàn diện & Cập nhật Handoff

**Files:**
- Create: `docs/handoff/SPEC-09.md`
- Modify: `docs/specs/README.md`

- [ ] **Step 1: Chạy toàn bộ static gates & tests**
Run: `cd web && pnpm check && pnpm test && pnpm build`
Expected:
- `pnpm check`: Exit code 0.
- `pnpm test`: Toàn bộ unit tests bao gồm `audio-zip.test.ts` pass 100%.
- `pnpm build`: Next.js export route `/cai-dat/audio` thành công.

- [ ] **Step 2: Tạo tài liệu handoff `docs/handoff/SPEC-09.md`**
Ghi lại ngày triển khai, các quyết định kiến trúc (Worker Transferable, batch 20 files, TOFU, giao diện theo mock), kết quả kiểm tra tự động và các bước tiếp theo (SPEC-10).

- [ ] **Step 3: Cập nhật `docs/specs/README.md`**
Cập nhật trạng thái của SPEC-09 thành "Đã cài đặt code & unit test, sẵn sàng nghiệm thu trình duyệt".
