# Handoff — SPEC-06 (Cài đặt, Export & Import dữ liệu)

Ngày: 22/09/2026. Trạng thái: Đã kiểm chứng (nghiệm thu trình duyệt đạt).

## Thay đổi và quyết định

- Xây dựng module backup [web/src/lib/backup.ts](file:///d:/Projects/Lab/Japanese/web/src/lib/backup.ts):
  - Định dạng file export chuẩn: `schemaVersion: 1`, `app: 'minna-n5'`, `settings`, `reviewItems`, `practiceSessions`.
  - Phục hồi kiểu `Date` cho `dueAt` và `fsrsCard.due` khi import từ JSON string (tránh lỗi index Dexie so sánh chuỗi với Date).
  - Xác thực nghiêm ngặt ở biên ngoài transaction Dexie: bỏ qua và đếm số bản ghi hỏng (`skippedReviewItemsCount`, `skippedSessionsCount`).
  - Hỗ trợ 2 chế độ:
    - **Gộp (Merge):** Giữ dữ liệu hiện có; các mục trùng `targetId` lấy bản có `updatedAt` mới hơn (Last-Write-Wins).
    - **Thay thế (Replace):** Xóa toàn bộ dữ liệu hiện có trên máy trong cùng một Dexie transaction atomically.
  - Ghi vào `pendingSync` với payload `{ v: 1, kind: 'import', reviewItems, sessions, replaced }` phục vụ SPEC-08.
  - Vùng nguy hiểm: `executeWipeAllData()` xóa sạch `reviewItems`, `practiceSessions`, `pendingSync` và xóa khóa `jp:lastPulledAt` trong `localStorage`.
- Xây dựng màn hình Cài đặt [web/src/app/cai-dat/page.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/cai-dat/page.tsx):
  - 5 nhóm: Hiển thị, Học tập, Dữ liệu, Tài khoản (chờ SPEC-08), Vùng nguy hiểm.
  - Ô xem trước trực tiếp: phản chiếu ngay lập tức việc ẩn/hiện Furigana, cỡ Furigana và làm mờ bản dịch (Active recall).
  - Tự động áp dụng theme `system` lắng nghe `matchMedia('(prefers-color-scheme: dark)')` khi đang mở tab.
  - Hộp thoại xem trước khi nhập file (`Dialog`): hiển thị bảng tóm tắt, cảnh báo số bản ghi hỏng, cho phép chọn Gộp hoặc Thay thế.
  - Hộp thoại xác nhận thay thế (`AlertDialog`) nếu chọn chế độ Thay thế.
  - Hộp thoại xác nhận xóa dữ liệu (`AlertDialog`) yêu cầu gõ đúng chữ `XÓA` mới kích hoạt nút xóa.

## Kiểm chứng

- **Kiểm tra tĩnh & Unit tests (22/09/2026):**
  - `pnpm check`: PASS (TypeScript 0 lỗi, ESLint 0 cảnh báo).
  - `pnpm test`: PASS 91/91 tests (`src/lib/*.test.ts`, bao gồm 7 unit tests mới trong `backup.test.ts` kiểm thử format, validation, parse Date, merge LWW và deduplicate).
- **Nghiệm thu trình duyệt (Browser subagent, 22/09/2026 trên localhost:3000/cai-dat):**
  - **Hiển thị:**
    - Bật/tắt "Hiện furigana": ô xem trước ẩn/hiện ruby text tức thì.
    - Đổi cỡ "Thường" / "Lớn": tỉ lệ furigana phóng to 1.25x chuẩn class `.furigana-large`.
    - Bật "Ẩn bản dịch khi đọc bài": nghĩa tiếng Việt bị làm mờ (blur 5px), rê chuột/focus vào thì hiện rõ.
    - Đổi theme "Sáng" / "Tối" / "Hệ thống": class `.dark` được thêm/bớt trên `<html>` mượt mà.
  - **Học tập:**
    - Nút `+` và `-` điều chỉnh `dailyNewLimit` theo bước 5 mục (min 1, max 100).
    - Thanh trượt âm lượng và nút "Nghe thử" phát âm mẫu hoạt động chuẩn.
  - **Dữ liệu:**
    - Nút "Xuất file JSON": tải file `minna-tien-do-YYYY-MM-DD.json` cấu trúc chuẩn.
    - Nút "Nhập từ file": chọn file JSON mở hộp thoại xem trước, kiểm tra thông tin, thực hiện gộp dữ liệu thành công và hiển thị thông báo kết quả.
  - **Vùng nguy hiểm:**
    - Bấm "Xóa toàn bộ dữ liệu" mở alert dialog. Nút "Xóa vĩnh viễn" bị disabled cho tới khi gõ đúng `XÓA`. Nút Hủy đóng dialog an toàn.
  - **Responsive:**
    - Kiểm tra trên Desktop (1280×800) và Mobile (390×844) không bị vỡ layout, vùng chạm tối thiểu 48px.

## Còn lại và bước tiếp theo

- SPEC-06 đã hoàn tất và nghiệm thu toàn bộ.
- Chuyển sang **Bước 3: Triển khai SPEC-08 (Đăng nhập & Đồng bộ Supabase)**:
  - Database schema & RLS: `supabase/migrations/0001_init.sql`.
  - RPC function: `sync_practice(payload jsonb)` xử lý idempotent và last-write-wins.
  - Client sync engine: [web/src/lib/sync.ts](file:///d:/Projects/Lab/Japanese/web/src/lib/sync.ts) xử lý hàng đợi `pendingSync`, retry exponential backoff, lắng nghe online/offline event, phân trang keyset khi pull `review_items`.
  - Hoàn thiện khối "Tài khoản" trong `/cai-dat` và nối huy hiệu đồng bộ trên `AppNav`.
