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

## Đợt 28/09/2026 (Rà soát & hoàn thiện)

- **Người thực hiện:** Antigravity worker (Task W4).
- **Phạm vi sở hữu & rà soát:**
  - `web/src/app/on-tap/**`
  - `web/src/components/review/**`
  - `web/src/lib/use-due-queue.ts`
  - `web/src/lib/review-queue.ts` (+ `review-queue.test.ts`)
  - `web/src/lib/use-review-draft.ts` (+ `use-review-draft.test.ts`)
  - `docs/specs/SPEC-20-on-tap-tiep-noi.md`
  - `docs/handoff/SPEC-20.md`

### 1. Kết quả rà soát theo AGENTS.md & Hợp đồng FSRS

| Tiêu chí | File rà soát | Kết quả rà soát & Hành động |
| --- | --- | --- |
| **Rating chỉ qua `fsrs.ts`** (`rateAnswer`, `applyReview`) | `ReviewRunner.tsx`, `on-tap/phien/page.tsx`, `practice.ts` | **Không vi phạm.** Rating được tính toán độc quyền qua `rateAnswer` và `applyReview` trong `fsrs.ts`, thông qua `applyResults`. |
| **Ghi review + `pendingSync` trong cùng transaction Dexie** | `practice-write.ts`, `ReviewRunner.tsx` | **Không vi phạm.** `savePracticeSession` thực hiện ghi nguyên tử trong `db.transaction('rw', db.practiceSessions, db.reviewItems, db.pendingSync, ...)` |
| **Không network trong transaction** | `practice-write.ts` | **Không vi phạm.** Không có bất kỳ lệnh gọi mạng hoặc Supabase nào trong Dexie transaction. |
| **Không gọi `ts-fsrs` trực tiếp** | Toàn bộ các file thuộc phạm vi | **Không vi phạm.** `ts-fsrs` chỉ được import trong `fsrs.ts` và type definitions. |
| **Retry idempotent** | `ReviewRunner.tsx` | **Đã phát hiện và sửa vi phạm:** Nếu `savePracticeSession` đã hoàn tất nhưng khâu tính toán sau đó bị lỗi, nút "Thử lại" trước đó gọi lại toàn bộ hàm và tạo mới `session.id` ghi trùng lặp vào `practiceSessions` và `pendingSync`. **Đã sửa:** bổ sung `savedSessionRef` và `isSavingRef` giúp tái sử dụng phiên đã lưu khi thử lại, chống gọi trùng lặp song song hoặc tạo bản ghi rác. |
| **Số lô tiếp "Ôn lô tiếp (N mục)"** | `ReviewRunner.tsx`, `review-queue.ts` | **Đã phát hiện và sửa vi phạm:** Trước đó `ReviewRunner` tự truy vấn `db.reviewItems.where('dueAt').belowOrEqual(now).count()` và gán `Math.min(reviewBatchSize, remainingCount)`, dẫn đến sai lệch: bỏ qua mục mới nạp theo `dailyNewLimit` khi còn chỗ, và đếm cả những mục không thể sinh câu hỏi (thiếu audio ja-JP). **Đã sửa:** tách hàm thuần `resolveNextBatchPlan` trong `review-queue.ts` kết hợp `planReviewBatch` và `buildSession`, truyền câu hỏi và audio keys từ `on-tap/phien/page.tsx` vào `ReviewRunner` để tính số `N` khớp 100% với phiên kế tiếp. |
| **Bỏ emoji trang trí** | `ReviewRunner.tsx` | **Đã phát hiện và sửa vi phạm:** Vùng gợi ý trợ từ có chứa emoji `💡 Gợi ý:`. **Đã sửa:** xóa emoji, thay thế bằng nhãn chữ chuẩn Semantic theo `DESIGN.md`. |
| **Trạng thái `/on-tap`** | `on-tap/page.tsx` | **Đã hoàn thiện:** Tách biệt rõ ràng trạng thái "Đã ôn xong hôm nay" và "Đã đạt hạn mức mục mới hôm nay" (`dailyNewLimit`); bổ sung cảnh báo khi có câu hỏi nghe bị tạm loại bỏ do thiếu giọng ja-JP; bảo toàn `dueAt` khi bị chặn do thiếu câu hoặc thiếu audio. |
| **Nháp ôn tập (`use-review-draft`)** | `use-review-draft.ts`, `ReviewRunner.tsx` | **Đã hoàn thiện:** Nháp chỉ lưu tại client (`localStorage`), không ghi Dexie hay biến đổi `dueAt` của mục tiêu ôn tập. Bổ sung các hàm thuần serialize/validate và bộ test unit riêng. |
| **Điểm yếu không trộn vào lô đến hạn** | `use-due-queue.ts`, `on-tap/diem-yeu/page.tsx` | **Không vi phạm.** `useDueQueue` chỉ truy vấn mục có `dueAt <= now`, không bao giờ trộn mục điểm yếu (`incorrectCount > 0`) nếu chưa đến hạn. |

### 2. Ghi chú về cách đếm số đến hạn giữa các thành phần

Theo quy định không can thiệp vào các file ngoài quyền sở hữu:
- `AppNav.tsx` (badge dock): Đếm bằng `db.reviewItems.where('dueAt').belowOrEqual(now).count()` (tổng số mục đã đến hạn trong database, không tính mục mới từ bài học và không cắt theo kích thước lô).
- `DashboardContent.tsx` (Bảng tin): Sử dụng `queue.sessionTargetIds.size` từ `useDueQueue()` (số lượng mục tiêu trong lô hiện tại, đã gộp mục đến hạn và mục mới tối đa 1 lô).
- `/on-tap`: Phân tách cụ thể số mục đến hạn (`dueCount`), số mục mới (`newCount`), tổng lô (`totalCount`) và mô tả số lô còn lại (`remainingDue`).
- Đề xuất: Trong tương lai coordinator có thể cân nhắc chuẩn hóa badge `AppNav` theo `totalDueCount` của `useDueQueue` để đồng nhất ngữ nghĩa hiển thị trên toàn ứng dụng.

### 3. Kiểm chứng Gate tĩnh (S) thực chạy

- **`pnpm test` (Node test runner):**
  - Kết quả: **PASS 222/222 tests** (tăng 13 tests so với baseline 209; thời gian chạy ~1.4s).
  - Test mới:
    - `web/src/lib/review-queue.test.ts`: 5 tests mới kiểm thử `resolveNextBatchPlan` (tính đúng N cho lô kế tiếp có cả due và new, chặn khi đạt dailyNewLimit, ca hết mục, ca thiếu audio, ca 1 câu/target).
    - `web/src/lib/use-review-draft.test.ts`: 8 tests mới kiểm thử `validateReviewDraft`, `serializeReviewDraft`, `deserializeReviewDraft` và tính bất biến của `dueAt`.
- **`pnpm check` (tsc --noEmit && eslint):**
  - Kết quả: **PASS (exit code 0)**, 0 lỗi TypeScript, 0 lỗi ESLint toàn repo.
  - Không thêm bất kỳ cảnh báo mới nào trong các file thuộc phạm vi sở hữu (3 cảnh báo còn lại thuộc các file ngoài phạm vi: `ca-nhan/page.tsx`, `LessonActionHub.tsx`, `AppNav.tsx`).
- **Checklist §9 của `docs/specs/SPEC-20-on-tap-tiep-noi.md`:** Giữ nguyên trạng thái `[ ]` theo đúng quy ước dành cho coordinator.

*Chưa nghiệm thu browser — chờ coordinator.*

