# Ảnh thiết kế và sau triển khai

G2 của đợt v3 "Sách sống" đã được người dùng duyệt ngày 2026-10-09. Các ảnh
`as-built-light.png` / `as-built-dark.png` ghi lại app sau triển khai tại commit
`ae005cc` trên nhánh `feat/ui-v3-rollout`. Mockup đã duyệt vẫn được giữ để đối chiếu.

Ảnh chụp từ app chạy tại `http://localhost:3000`, rộng 390 px, hai theme sáng/tối.
Các trang có thanh điều hướng được chụp hết nội dung bằng cách tăng chiều cao viewport
theo vùng cuộn; màn phiên và học từ vựng dùng viewport 390 × 900 px. Lớp phủ dev
`nextjs-portal` được gỡ trước khi chụp. Không chỉnh sửa nội dung hay giao diện ảnh chụp.

## Màn được lưu

Mỗi thư mục trong bảng có một cặp `as-built-{light,dark}.png`.

| Thư mục | Route / trạng thái |
|---|---|
| `home/` | `/` — bình thường |
| `hoc/` | `/hoc` — đang học Bài 1 |
| `bai/` | `/hoc/1` — nội dung Bài 1 |
| `tu-vung/` | `/hoc/1/tu-vung` — chọn 10 từ |
| `tu-vung/mat-truoc/` | Thẻ đầu của phiên học từ, trước khi lật |
| `tu-vung/mat-sau/` | Cùng thẻ sau khi lật, chưa chấm khả năng nhớ |
| `luyen-tap/` | `/luyen-tap` — Bài 1, 15 câu |
| `on-tap/` | `/on-tap` — có mục đến hạn |
| `on-tap/diem-yeu/` | `/on-tap/diem-yeu` — chưa có mục bị quên |
| `phien/` | `/luyen-tap/phien` — phiên mới từ nút Bắt đầu, câu đầu chưa trả lời |
| `phien/on-tap/` | `/on-tap/phien` — câu đầu của phiên ôn |
| `tra-cuu/` | `/hoc/tra-cuu` — hub |
| `tra-cuu/kana/` | `/hoc/tra-cuu/kana` — Hiragana |
| `tra-cuu/kanji/` | `/hoc/tra-cuu/kanji` — tất cả chữ, không lọc |
| `tra-cuu/kanji-chi-tiet/` | `/hoc/tra-cuu/kanji/人` |
| `tra-cuu/dong-tu/` | `/hoc/tra-cuu/dong-tu` |
| `tra-cuu/bang/` | `/hoc/tra-cuu/bang` |
| `tra-cuu/bang-chi-tiet/` | `/hoc/tra-cuu/bang/demonstratives` |
| `ca-nhan/` | `/ca-nhan` — tiến độ Bài 1 |
| `ca-nhan/thong-ke/` | `/ca-nhan/thong-ke` — chưa có phiên luyện |
| `cai-dat/` | `/cai-dat` — chưa liên kết tài khoản |
| `cai-dat/audio/` | `/cai-dat/audio` — chưa nạp gói audio |

## Dữ liệu và giới hạn

Các trang dùng trạng thái `normal` từ `scripts/ui-qa/seed.js` trong profile QA riêng:
38 mục đã học, 10 mục đến hạn, không có lần quên và chưa có phiên luyện.
Vì vậy Điểm yếu và Thống kê thể hiện trạng thái trống. Câu hỏi trong phiên được app
chọn từ dữ liệu thật; hai ảnh theme của phiên ôn có thể là câu khác nhau.
Hai theme của phiên luyện và thẻ từ được chụp tại cùng trạng thái, chỉ đổi lớp theme.

Chụp lại các trang thường bằng `node scripts/ui-qa/shoot.mjs --route <route>`
(route không có `/` đầu). Với phiên luyện: mở hub, chọn bài rồi bấm Bắt đầu;
đi thẳng vào URL có thể quay về hub khi không có bản nháp. Với thẻ từ: chọn từ,
bấm Học rồi lật thẻ. Ảnh nháp và báo cáo vẫn ở `.ui-qa/`, `.work/` và không vào git.

Bộ ảnh này lưu hình thức sau G2 tại 390 px; không thay thế toàn bộ QA ở các kích thước
và trạng thái khác. Bước Đóng chạy lại `pnpm check`; không đổi logic, không chạy lại
test hoặc build. Những kiểm tra còn thiếu từ đợt QA trước: sync với Supabase thật,
nạp ZIP audio thật, và màn lỗi tải câu hỏi bằng cách chặn chunk.
