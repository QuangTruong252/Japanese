# Handoff — SPEC-15 (Học từ vựng chủ động theo bài)

Ngày: 23/09/2026. Trạng thái: Đã triển khai code; chờ nghiệm thu lưu FSRS/sync trên dữ liệu
thật của người học.

## Thay đổi

- Thêm `/hoc/[so]/tu-vung` cho 25 bài N5, nạp riêng file từ vựng của bài.
- Thêm lối vào cạnh danh sách từ vựng ở trang chi tiết bài.
- Chọn được từng từ hoặc toàn bộ; có trạng thái tiến độ nhớ đúng, số lần quên và hạn ôn.
- Thẻ dùng active recall: hiện chữ Nhật trước, hiện nghĩa theo yêu cầu, rồi tự chấm Again /
  Hard / Good / Easy qua nhãn “Quên mất”, “Khó nhớ”, “Nhớ được”, “Dễ nhớ”. Dự đoán FSRS
  hiển thị trên mỗi nút.
- Lưu từng lần chấm vào `reviewItems` cùng `pendingSync` trong một transaction Dexie; không
  tạo bảng hay cơ chế ôn song song. Giá trị thời gian trả lời thành công được thêm vào
  `recentElapsedMs`.
- Thêm hai bảng xếp hạng theo bài: nhớ ổn định và cần củng cố, dựa trên tỷ lệ đúng/sai cùng
  stability FSRS. Các số lượt và tỷ lệ vẫn hiển thị để người học tự đối chiếu.
- Ẩn dock/sidebar trong route toàn màn hình; focus chuyển vào thẻ và cập nhật theo trạng thái.

## Kiểm chứng đã chạy

- `pnpm check` — PASS (TypeScript + ESLint).
- `pnpm build` — PASS; build prerender 247 trang, gồm 25 route `/hoc/{so}/tu-vung`.
- `impeccable detect --json` trên ba file UI thay đổi — không phát hiện vấn đề.
- Trình duyệt ở 390×844: kiểm tra danh sách 47 từ bài 7, bỏ chọn/chọn lại, bắt đầu một thẻ,
  hiện nghĩa và thấy đủ bốn mức cùng thời gian FSRS. Kiểm tra DOM xác nhận viewport 390px,
  `scrollWidth` 390px; thoát trước khi chấm nên không ghi dữ liệu thử vào Dexie.

## Chưa kiểm chứng

- Chưa bấm mức tự đánh giá trên hồ sơ trình duyệt dùng chung; vì vậy transaction thực tế,
  dữ liệu xếp hạng sau reload và RPC sync chưa được kiểm tra qua UI.
- Không thêm hoặc chạy unit test cho hàm lưu FSRS trong lượt này.
- Build có cảnh báo quy ước `middleware` Next.js đã deprecated; không liên quan đến feature.
- Lượt học thẻ chưa tạo `practiceSessions`, nên không cộng vào thời lượng/lượt phiên của trang
  Thống kê. Tiến độ theo từ vẫn lưu trong `reviewItems` và hiện tại trang học.

## Bước tiếp theo

1. Kiểm tra việc đánh giá một từ trong môi trường dữ liệu test riêng: đúng counter, due date,
   transaction và cập nhật xếp hạng sau reload.
2. Kiểm tra reconnect sync theo SPEC-08.
3. Nghiệm thu màn hình trên thiết bị thật trước khi đánh dấu SPEC-15 hoàn tất toàn feature.
