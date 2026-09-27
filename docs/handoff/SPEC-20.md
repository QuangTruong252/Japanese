# Handoff — SPEC-20 (Ôn tập theo lịch và tiếp lô rõ ràng)

Ngày: 2026-09-27. Trạng thái: Đã có code & targeted test đạt, chờ supervisor nghiệm thu trình duyệt.

## Thay đổi và quyết định

- **Triển khai đầy đủ theo [SPEC-20](../specs/SPEC-20-on-tap-tiep-noi.md) và kế thừa [SPEC-05](../specs/SPEC-05-on-tap.md):**
  - **Tiếp lô rõ ràng & mượt mà (`ReviewRunner`):** Sau khi hoàn thành một lô ôn tập, màn hình kết quả kiểm tra số mục đến hạn còn lại trong Dexie (`db.reviewItems.where('dueAt').belowOrEqual(now)`).
    - Nếu còn mục đến hạn: hiển thị khối thông báo số mục còn lại, CTA chính (cỡ `quiz` ≥48px) "Ôn lô tiếp (N mục)" để tiếp tục ngay lô kế tiếp mà không phải thao tác thủ công, kèm nút thứ cấp "Về Bảng tin" và "Về trang ôn tập". Tuyệt đối không tự động nhảy vào lô mới nếu người học muốn dừng.
    - Nếu đã hết mục đến hạn: hiển thị thông báo chúc mừng "Đã ôn hết các mục đến hạn hôm nay! 🎉", CTA chính là "Về Bảng tin" và "Xem điểm yếu của tôi".
  - **Trạng thái trung thực & lối đi phù hợp (`/on-tap`):**
    - *Chưa có bài nào*: Nêu đúng lý do "Chưa có gì để ôn", dẫn tới `/hoc/1`.
    - *Đã ôn xong hôm nay*: Nêu số mục đến hạn ngày mai (nếu có), thông báo nếu đã chạm hạn mức `dailyNewLimit` (20 mục), dẫn tới `/hoc` ("Học bài mới") hoặc `/` ("Về Bảng tin").
    - *Bị chặn do thiếu câu hỏi / thiếu audio ja-JP*: Không nói sai thành "đã ôn xong", nêu đúng lý do và giữ nguyên `dueAt`, cung cấp nút điều hướng phù hợp ("Cài đặt âm thanh" `/cai-dat/audio` hoặc "Xem danh sách bài học" `/hoc`).
    - *Còn nhiều lô*: Hiển thị rõ số mục và số lô còn lại qua helper `describeRemainingBatches`.
    - *Phiên đang dở*: Phát hiện nháp ôn tập (`useReviewDraft` với `mode: 'due'`), hiển thị thẻ tiếp tục phiên làm dở kèm số câu đã làm và nút "Tiếp tục phiên ôn" (`/on-tap/phien?resume=1`) hoặc "Bỏ phiên dở".
    - *Ngoại tuyến / Sync pending*: Hiển thị banner trạng thái ngoại tuyến ("Dữ liệu ôn tập được lưu trên máy và sẽ đồng bộ khi có mạng") và số lượng bản ghi `pendingSync` đang chờ.
  - **Khôi phục nháp trong phiên (`/on-tap/phien`):**
    - Hỗ trợ resume chính xác từ `useReviewDraft` (câu hỏi, tiến độ câu `initialIndex`, kết quả đã làm, thời lượng đã bấm giờ).
    - Thoát phiên qua AlertDialog với 3 lựa chọn chuẩn: "Tiếp tục làm", "Bỏ phiên", "Lưu và học tiếp sau".
  - **Trang điểm yếu (`/on-tap/diem-yeu`):**
    - Giữ bộ lọc điểm yếu riêng biệt, không trộn mục chưa đến hạn vào hàng đợi ôn FSRS.
    - Bổ sung đệm đáy `pb-28 sm:pb-12` đảm bảo dock điều hướng mobile không che khuất bảng và nút thao tác.
  - **Giữ nguyên hợp đồng cốt lõi:**
    - Thuật toán FSRS, tính toán rating qua `fsrs.ts` (`rateAnswer`, `applyReview`), transaction ghi Dexie atomically kèm `pendingSync` (`savePracticeSession`).
    - Hàng đợi `useDueQueue` cập nhật thời gian thực bằng `useDueClock` (rollover thời gian không làm bẩn Dexie).
    - Bổ sung `totalDueCount` và `pendingSyncCount` vào `DueQueue`.

## Kiểm chứng

- **Unit tests (Node test runner):**
  - `node --test web/src/lib/review-queue.test.ts`: PASS 15/15 tests (bao gồm các test chia lô liên tiếp `planReviewBatch` và mô tả lô `describeRemainingBatches`).
- **Static code check:**
  - `pnpm --filter web exec eslint src/app/on-tap src/components/review src/lib/use-due-queue.ts src/lib/review-queue.ts src/lib/use-review-draft.ts src/lib/review-queue.test.ts`: PASS 0 lỗi, 0 cảnh báo.
  - TypeScript trong phạm vi ôn tập (`src/app/on-tap/**`, `src/components/review/**`, `src/lib/use-due-queue.ts`, `src/lib/review-queue.ts`, `src/lib/use-review-draft.ts`): PASS 0 lỗi type. (Lỗi tsc ở các file ngoài phạm vi thuộc worker khác: `ca-nhan/page.tsx` và `active-drafts.ts`).

## Còn lại và bước tiếp theo

- Bàn giao cho Codex / supervisor chạy full check, build và nghiệm thu trình duyệt (Chrome 390px mobile & 1280px desktop, kiểm tra phím tắt Space/Enter, thử nghiệm ngắt kết nối mạng và tiếp lô nhiều lần).
