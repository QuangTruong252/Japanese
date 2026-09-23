# Handoff — SPEC-09 (Nạp Audio đĩa CD từ file ZIP)

Ngày: 23/09/2026. Trạng thái: Đã hoàn tất mã nguồn, Web Worker, Hook, UI /cai-dat/audio theo mockup 20-audio-zip.png; Static gates & Tests PASS 100%; Sẵn sàng nghiệm thu trình duyệt.

## Thay đổi và quyết định

- **Thư viện thuần ([web/src/lib/audio-zip.ts](file:///d:/Projects/Lab/Japanese/web/src/lib/audio-zip.ts)):**
  - Validation đường dẫn track chuẩn theo mẫu `^L(\d{2})/(\d{2})_(vocab|sentence_patterns|examples|conversation)\.mp3$`, giới hạn bài 1..25, track 1..4. Chặn triệt để path traversal (`../`) và file ngoài mẫu.
  - Bộ kiểm tra giới hạn tài nguyên trước khi giải nén (SPEC-09 §2.1b): file size ≤ 2GB, số entry ≤ 200, uncompressed size ≤ 4GB, single file ≤ 100MB, tỉ lệ nén ≤ 100x (chống zip-bomb).
  - Parser và validator cho `manifest.json` đối chiếu mã SHA-256 hex 64 ký tự.
  - Cơ chế Trust-On-First-Use (`detectHashConflicts`): phát hiện và cảnh báo khi track mới khác mã hash với bản đã nạp trước đây.
  - Hàm định dạng dung lượng byte thân thiện (`formatStorageSize`).
- **Web Worker ([web/src/workers/audio-import.worker.ts](file:///d:/Projects/Lab/Japanese/web/src/workers/audio-import.worker.ts)):**
  - Chạy giải nén `JSZip` và băm `crypto.subtle.digest('SHA-256')` hoàn toàn trong worker riêng biệt, không chặn main thread.
  - Gom lô ~20 file và gửi dữ liệu `ArrayBuffer` dưới dạng Transferable Objects (`postMessage(..., [buffer])`) giúp zero-copy memory, tránh tràn RAM (an toàn trên thiết bị 4GB RAM).
  - Hỗ trợ tin nhắn `CANCEL` dừng tức thì mà không ảnh hưởng tới các lô đã ghi.
- **React Hook ([web/src/hooks/use-audio-import.ts](file:///d:/Projects/Lab/Japanese/web/src/hooks/use-audio-import.ts)):**
  - Điều phối vòng đời Worker, kiểm tra kích thước file ZIP ban đầu (≤ 2GB).
  - Nhận batch `ArrayBuffer` chuyển thành `Blob` (`audio/mpeg`) và lưu vào IndexedDB bằng `db.audioFiles.bulkPut` theo từng transaction độc lập (ngoại lệ atomic có chủ đích của SPEC-09 §2.3).
  - Lắng nghe sự kiện `beforeunload` khi đang nạp để tránh người dùng vô tình đóng tab.
- **Màn hình Cài đặt Audio ([web/src/app/cai-dat/audio/page.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/cai-dat/audio/page.tsx)):**
  - Tuân thủ thiết kế thị giác theo [mock/20-audio-zip.png](file:///d:/Projects/Lab/Japanese/mock/20-audio-zip.png):
    - Header có nút quay lại `< Cài đặt`, H1 `Audio đĩa CD`, phụ đề.
    - Card Thư viện hiện tại: hiển thị tổng số track, dung lượng MB và dòng trạng thái trung thực *"Đã kiểm toàn vẹn gói · chưa xác minh ấn bản"*. Khi chưa có audio, hiển thị dung lượng bộ nhớ trống từ `navigator.storage.estimate()`.
    - Lưới 5×5 bài học (1..25): thể hiện trực quan bằng số bài, icon tròn xanh lá nếu đủ 4 track, icon hổ phách kèm nhãn `"Thiếu track"` (`x/4`) nếu thiếu track, và `"0/4"` nếu chưa có audio.
    - Khối Đang nạp: thanh tiến độ `Progress` cập nhật theo từng file thật, tên file đang băm, kèm nút `Hủy`.
    - Khối Cảnh báo file hỏng: hiển thị khi có file sai hash, liệt kê tên file để người học đóng gói lại.
    - Nút Nạp lại file ZIP và nút Gỡ toàn bộ audio kèm `AlertDialog` xác nhận (không đụng tới dữ liệu học tập `reviewItems`/`practiceSessions`).
    - Ghi chú chân trang: *"Audio chỉ được lưu trên máy này."*
- **Lối vào tại Cài đặt ([web/src/app/cai-dat/page.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/cai-dat/page.tsx)):**
  - Bổ sung Card `Audio đĩa CD` trong nhóm Dữ liệu với badge số lượng track trực tiếp từ `useLiveQuery(() => db.audioFiles.count())`.

## Kiểm chứng

- **Kiểm tra tĩnh & Unit Tests (23/09/2026):**
  - `pnpm check`: PASS (TypeScript 0 lỗi, ESLint 0 cảnh báo).
  - `pnpm test`: PASS 104/104 unit tests (bao gồm 6 unit test mới trong `src/lib/audio-zip.test.ts`).
  - `pnpm build`: PASS (tạo production bundle thành công cho toàn bộ 12 route, bao gồm route tĩnh `○ /cai-dat/audio`).
- **Trình duyệt:**
  - Sẵn sàng để người dùng nghiệm thu trải nghiệm nạp và giao diện.

## Bước tiếp theo

- Triển khai **SPEC-10: Trình phát Shadowing (A-B repeat)**:
  - Tích hợp khối Audio Player vào cuối màn hình chi tiết bài học `/hoc/[so]`.
  - Hỗ trợ 4 tab track (`vocab`, `sentence_patterns`, `examples`, `conversation`) lấy Blob từ `db.audioFiles`.
  - Bộ điều khiển phát, lặp đoạn A-B, điều chỉnh tốc độ đọc (0.75x - 1.2x).
