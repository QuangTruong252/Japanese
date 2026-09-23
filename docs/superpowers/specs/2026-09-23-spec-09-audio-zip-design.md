# Thiết kế SPEC-09 — Nạp Audio đĩa CD từ file ZIP

Ngày: 23/09/2026  
Mã: SPEC-JPN-F09  
Trạng thái: Approved design doc  
Nguồn tham chiếu: [SPEC-09](file:///d:/Projects/Lab/Japanese/docs/specs/SPEC-09-audio-zip.md), [DESIGN.md](file:///d:/Projects/Lab/Japanese/DESIGN.md), [mock/20-audio-zip.png](file:///d:/Projects/Lab/Japanese/mock/20-audio-zip.png).

---

## 1. Mục tiêu & Phạm vi

### Trong phạm vi
- Màn hình `/cai-dat/audio` — nạp file ZIP, hiển thị tình trạng thư viện (lưới 25 bài), hiển thị tiến độ thật, cảnh báo file hỏng, gỡ toàn bộ audio.
- Lối vào tại `/cai-dat` — Card dẫn tới `/cai-dat/audio` với badge số lượng track hiện có.
- Thư viện thuần `web/src/lib/audio-zip.ts` — validation đường dẫn chuẩn, kiểm tra giới hạn tài nguyên trước giải nén, kiểm tra manifest, trích xuất lesson/type, định dạng kích thước, đối chiếu TOFU hash.
- Web Worker `web/src/workers/audio-import.worker.ts` — giải nén JSZip, băm SHA-256 bằng `crypto.subtle`, gửi batch 20 track về main thread qua Transferable Objects (`ArrayBuffer`).
- React hook `web/src/hooks/use-audio-import.ts` — điều phối worker, tạo `Blob`, ghi Dexie `db.audioFiles.bulkPut` theo từng lô độc lập, xử lý hủy ngang và cập nhật tiến độ.
- Bộ kiểm thử unit test `web/src/lib/audio-zip.test.ts` — kiểm tra toàn bộ pure logic đạt 100% coverage theo tiêu chí nghiệm thu SPEC-09 §9.

### Ngoài phạm vi
- Trình phát Shadowing A-B (thuộc SPEC-10).
- Thay thế giọng đọc của bài luyện tập `listening` (SPEC-01 §5 và SPEC-09 §2.4: track CD là cả bài liền mạch, không cắt theo từng câu).
- Tải audio từ internet hoặc đồng bộ audio lên Supabase (audio chỉ lưu trong IndexedDB trên thiết bị người dùng).
- Đưa audio vào bundle/public/export JSON.

---

## 2. Kiến trúc & Hợp đồng Dữ liệu

### 2.1. Cấu trúc gói ZIP và Định dạng Đường dẫn
Đường dẫn chuẩn: `^L(\d{2})/(\d{2})_(vocab|sentence_patterns|examples|conversation)\.mp3$`
- `L01` đến `L25`: 25 bài học N5.
- 4 loại track:
  - `01_vocab.mp3`: `type = 'vocab'`
  - `02_sentence_patterns.mp3`: `type = 'sentence_patterns'`
  - `03_examples.mp3`: `type = 'examples'`
  - `04_conversation.mp3`: `type = 'conversation'`
- Tối đa 100 track cho toàn bộ 25 bài N5.
- Bắt buộc có `manifest.json`: Map dạng `{ [path: string]: string }` chứa mã SHA-256 hex. Nếu thiếu hoặc sai cấu trúc JSON -> từ chối cả gói ngay lập tức.
- Mọi entry có đường dẫn chứa `../`, đường dẫn tuyệt đối hoặc không khớp regex sẽ bị bỏ qua trước khi đọc nội dung.

### 2.2. Giới hạn An toàn Tài nguyên (Resource Gates)
Kiểm tra trước khi giải nén entry:
1. `file.size <= 2 * 1024 * 1024 * 1024` (2 GB): Kiểm tra ở Main thread trước khi gọi Worker.
2. `entryCount <= 200`: Kiểm tra số file trong ZIP.
3. `totalUncompressedSize <= 4 * 1024 * 1024 * 1024` (4 GB): Đọc `uncompressedSize` từ header của JSZip.
4. `singleFileSize <= 100 * 1024 * 1024` (100 MB): Entry vượt quá sẽ bị đánh dấu hỏng và bỏ qua.
5. `uncompressedSize / compressedSize <= 100`: Tránh zip bomb, nếu vi phạm từ chối cả gói.

### 2.3. Hợp đồng Dexie `db.audioFiles`
Bản ghi giữ nguyên interface đã có tại `web/src/types/index.ts`:
```ts
export interface AudioFileRecord {
  id: string;      // "L01/04_conversation.mp3"
  lesson: number;  // 1
  type: string;    // 'conversation'
  blob: Blob;      // new Blob([buffer], { type: 'audio/mpeg' })
  size: number;    // byte length
  sha256: string;  // sha256 hex
}
```

### 2.4. Giao thức Worker (`audio-import.worker.ts`)
*Main -> Worker:*
- `{ type: 'START', file: File, existingHashes: Record<string, string> }`
- `{ type: 'CANCEL' }`

*Worker -> Main:*
- `{ type: 'PROGRESS', current: number, total: number, currentFile: string }`
- `{ type: 'BATCH', tracks: Array<{ id: string; lesson: number; type: string; buffer: ArrayBuffer; size: number; sha256: string }> }` (dùng Transferable Objects `[buffer]`).
- `{ type: 'COMPLETE', totalImported: number, corruptedFiles: string[], skippedFiles: string[], conflicts: string[] }`
- `{ type: 'ERROR', message: string }`

---

## 3. Chi tiết Giao diện & Trải nghiệm (Dựa trên `mock/20-audio-zip.png`)

Bề rộng `max-w-2xl mx-auto px-4 py-6`, khoảng chừa đáy `pb-28 lg:pb-12`.

### 3.1. Header & Điều hướng
- Nút quay lại: `< Cài đặt` trỏ về `/cai-dat`.
- Tiêu đề H1: `Audio đĩa CD`.
- Phụ đề: `Nạp gói ZIP audio của bạn để luyện nghe trên máy này.`.

### 3.2. Trạng thái Thư viện Hiện tại (Thẻ Tổng quan)
- Card nền `card`, viền `border`:
  - Nhãn trên: `Thư viện hiện tại` (text-muted-foreground).
  - Chỉ số: `X track · Y MB` (ví dụ: `98 track · 412 MB` hoặc `100 track · 418 MB`).
  - Khi chưa có audio: hiển thị `Chưa có audio` kèm dung lượng bộ nhớ trống từ `navigator.storage.estimate()` (vd: `Còn trống khoảng 4,2 GB`).
  - Dòng xác nhận trung thực: `"Đã kiểm toàn vẹn gói · chưa xác minh ấn bản"`.

### 3.3. Lưới Tình trạng Bài học (5×5 Lesson Coverage Grid)
- Tiêu đề khối: `Tình trạng bài học` kèm Chú thích (Legend) bên phải:
  - `✔ Đầy đủ` (icon check xanh lục `text-emerald-600 dark:text-emerald-400`).
  - `◑ Thiếu track` (icon tròn khuyết hổ phách `text-amber-500`).
- Lưới 5 cột × 5 hàng (bài 1 đến 25):
  - Mỗi ô là một Card bo góc, căn giữa:
    - Số thứ tự bài (1..25) font đậm.
    - Dưới số bài:
      - Đủ 4 track: icon check tròn xanh lá, aria-label `"Bài {n}, 4 trên 4 track"`.
      - Thiếu track (1-3 track): icon tròn khuyết màu hổ phách kèm dòng chữ nhỏ `"Thiếu track"` (hoặc `"x/4"`), aria-label `"Bài {n}, {x} trên 4 track"`.
      - Chưa có track nào (0/4): hiển thị nhãn mờ `0/4`.

### 3.4. Khối Tiến độ Khi Nạp (Trạng thái Đang nạp)
- Thay thế vị trí nút chọn file:
  - Thanh tiến độ `Progress` cập nhật theo từng file thật (0% đến 100%).
  - Dòng trạng thái: `"Đang kiểm tra {currentFile} — {current} / {total} file"`.
  - Nút "Hủy" kiểu ghost: bấm Hủy sẽ dừng worker ngay lập tức và giữ nguyên các track đã ghi vào Dexie.
  - Vùng `aria-live="polite"` thông báo các mốc chẵn 25%, 50%, 75%, 100%.

### 3.5. Khối Cảnh báo File Hỏng (Trạng thái Có lỗi)
- Card nền và viền cảnh báo (`border-destructive/30 bg-destructive/5` hoặc viền `warning`):
  - Icon tròn đỏ `TriangleAlert` hoặc `AlertCircle`.
  - Tiêu đề: `{n} file không khớp mã kiểm tra` (đậm).
  - Hướng dẫn: `Kiểm tra gói ZIP rồi nạp lại.`.
  - Chi tiết danh sách tên file bị hỏng (collapsible hoặc danh sách text rõ ràng).

### 3.6. Các Nút Thao tác
- Nút chính:
  - Khi chưa có audio: Nút `Chọn file ZIP` (cao 48px, cỡ quiz, icon `FileArchive`, gắn input file ẩn).
  - Khi đã có audio: Nút outline `Nạp lại file ZIP` (cao 48px, icon `RefreshCw` hoặc `FileArchive`).
- Nút thứ cấp:
  - Nút `Gỡ toàn bộ audio` (màu `destructive`, icon `Trash2`).
  - Kích hoạt `AlertDialog` xác nhận:
    - Tiêu đề: `Gỡ toàn bộ audio?`
    - Nội dung: Giải thích rõ dung lượng sẽ giải phóng, tính năng Shadowing sẽ tạm ngưng và dữ liệu học tập (`reviewItems`, `practiceSessions`) hoàn toàn không bị ảnh hưởng.
    - Nút `Hủy` và nút `Gỡ audio` (destructive).
- Dòng chân trang nhỏ: `ℹ Audio chỉ được lưu trên máy này.`

### 3.7. Lối vào tại `/cai-dat` (Settings Page)
- Card "Audio đĩa CD" đặt trong nhóm Lưu trữ / Dữ liệu:
  - Icon `FileArchive` / `Headphones`.
  - Tiêu đề: `Audio đĩa CD`.
  - Mô tả: `Quản lý file âm thanh luyện nghe từ đĩa CD.`
  - Badge trạng thái: `useLiveQuery` đếm `audioFiles`: `Chưa nạp` (muted) hoặc `{count}/100 track` (primary/emerald).
  - Nút chuyển hướng sang `/cai-dat/audio`.

---

## 4. Quản lý Bộ nhớ & Ngoại lệ Atomic

Theo SPEC-09 §2.3:
- Audio ghi theo từng lô ~20 file, mỗi lô một transaction `db.audioFiles.bulkPut(records)`.
- Sử dụng Transferable Objects giữa Worker và Main Thread để tránh nhân đôi bộ nhớ.
- Khi người dùng bấm Hủy hoặc lỗi ở lô sau, các lô trước đã ghi thành công **vẫn được giữ lại** (không rollback).
- Khi ghi đè (re-import): chỉ thay thế những file có mã hash khớp với manifest; các track cũ không bị xóa nếu không có trong gói mới.

---

## 5. Kế hoạch Kiểm thử & Tiêu chí Nghiệm thu

### 5.1. Unit Test (`web/src/lib/audio-zip.test.ts`)
- Khớp đúng mẫu regex `L(\d{2})/...` và loại bỏ đường dẫn bất thường (`../`, file ẩn, sai extension).
- Trích xuất chính xác lesson (1..25) và track type (`vocab`, `sentence_patterns`, `examples`, `conversation`).
- Hàm kiểm tra manifest hợp lệ và không hợp lệ.
- Hàm kiểm tra các ngưỡng an toàn: quá kích thước, quá số entry, tỉ lệ nén bất thường (> 100x).
- Hàm định dạng dung lượng byte (`formatStorageSize`).
- Đối chiếu TOFU phát hiện thay đổi hash track cũ.

### 5.2. Static Gates & Build
- `pnpm check`: 0 lỗi TypeScript, 0 cảnh báo ESLint.
- `pnpm test`: Toàn bộ unit tests chạy xanh.
- `pnpm build`: Route `/cai-dat/audio` build thành công trong production bundle.
