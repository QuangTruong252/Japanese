# Handoff — SPEC-05 (Ôn tập hôm nay & Điểm yếu)

Ngày: 22/09/2026. Trạng thái: Đã kiểm chứng (nghiệm thu trình duyệt đạt).

## Thay đổi và quyết định

- Nghiệm thu luồng ôn tập FSRS và điểm yếu theo đúng [SPEC-05](../specs/SPEC-05-on-tap.md):
  - `/on-tap`: Hàng đợi ôn tập hôm nay, hiển thị mục đến hạn và nạp mục mới giới hạn bởi `dailyNewLimit` (mặc định 20 mục).
  - `/on-tap/phien`: Phiên ôn tập FSRS với `mode: 'due'`, tái sử dụng `PracticeRunner` từ SPEC-04, tự động loại bỏ dạng bài `matching` (SPEC-01 §4.2).
  - `/on-tap/diem-yeu`: Bảng điểm yếu lọc từ index `[targetType+incorrectCount]`, sắp xếp theo `incorrectCount` giảm dần, có bộ lọc loại mục tiêu (tất cả / từ vựng / ngữ pháp / kanji / trợ từ / nghe).
- Huy hiệu số mục đến hạn trên Washi Dock (`AppNav`) cập nhật trực tiếp theo thời gian và số lượng trong Dexie.

## Kiểm chứng

- **Kiểm tra tĩnh & Unit tests (22/09/2026):**
  - `pnpm check`: PASS (TypeScript 0 lỗi, ESLint 0 cảnh báo).
  - `pnpm test`: PASS 84/84 tests (`src/lib/*.test.ts`, bao gồm `review-queue.test.ts`, `practice.test.ts`, `questions.test.ts`, `stats.test.ts`).
- **Nghiệm thu trình duyệt (Browser subagent, 22/09/2026 trên localhost:3000):**
  - **Trạng thái rỗng (Empty state):**
    - `/on-tap` khi chưa có dữ liệu: hiển thị "Chưa có gì để ôn", nút "Bắt đầu bài 1" dẫn tới `/hoc/1`.
    - `/on-tap/diem-yeu` khi chưa có lỗi: hiển thị "Chưa có điểm yếu nào được ghi nhận — mọi mục bạn đã làm đều đúng." kèm bộ lọc đầy đủ.
  - **Hiển thị hàng đợi & Huy hiệu:**
    - Nạp dữ liệu vào Dexie: hiển thị chính xác thẻ mục đến hạn + mục mới (ví dụ "2 mục đến hạn · 20 mục mới").
    - Mục quá hạn hiển thị huy hiệu `trễ 3 ngày` kèm biểu tượng đồng hồ báo thức `AlarmClock`.
    - Biểu tượng Ôn tập trên Washi Dock nổi hiển thị badge số lượng đến hạn.
  - **Phiên làm bài `/on-tap/phien`:**
    - Phím tắt `Space` từ `/on-tap` mở phiên ôn `/on-tap/phien`.
    - Hoạt động trơn tru với các dạng bài trắc nghiệm, điền từ (romaji -> hiragana tự động).
    - Phím tắt bàn phím `1`-`4` chọn đáp án, `Space`/`Enter` chuyển câu tiếp theo sau feedback.
    - Màn hình kết quả hiển thị tỷ lệ chính xác, thời gian làm bài, danh sách câu sai cần ôn lại, nút "Về ôn tập" và "Về trang chủ".
  - **Bảng điểm yếu `/on-tap/diem-yeu`:**
    - Cột: Nội dung (kèm Furigana), Loại (`TargetTypeBadge`), Sai/Tổng, Sai gần nhất, Hạn ôn kế.
    - Sắp xếp chuẩn theo số lần sai giảm dần.
    - Bộ lọc chip (*Tất cả, Từ vựng, Ngữ pháp, Kanji, Trợ từ, Nghe*) chuyển đổi dữ liệu tức thì.
  - **Đáp ứng giao diện (Responsive):**
    - Đã kiểm tra ở cả 2 kích thước: Desktop 1280×800 và Mobile 390×844 (iPhone) không bị tràn ngang, vùng chạm nút đạt chuẩn tối thiểu 48px.

## Còn lại và bước tiếp theo

- Đợt 1 (Lõi học tập & Ôn tập) đã hoàn tất và nghiệm thu toàn bộ: SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05.
- Chuyển sang **Bước 2: Triển khai SPEC-06 (Cài đặt, Export & Import dữ liệu)**:
  - Xây dựng màn hình `/cai-dat` cho phép cấu hình 6 cài đặt (`AppSettings`).
  - Triển khai chức năng Export JSON (`minna-tien-do-YYYY-MM-DD.json`) và Import JSON (2 chế độ: Gộp và Thay thế).
  - Vùng nguy hiểm: Xóa toàn bộ dữ liệu trên máy.
