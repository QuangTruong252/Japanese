# SPEC-15 — Học từ vựng chủ động theo bài

> **Mã:** SPEC-JPN-F15 · **Trạng thái:** Đã có code; chờ nghiệm thu toàn luồng · **Ngày:** 23/09/2026
> **Phụ thuộc:** SPEC-01 (từ vựng), SPEC-03 (màn bài học), SPEC-05 (FSRS và hàng đợi ôn)

## 1. Mục tiêu & phạm vi

Giúp người học chủ động gọi nghĩa của từng từ trong một bài, tự đánh giá mức độ nhớ,
đưa kết quả vào lịch FSRS và xem từ nào thường nhớ tốt hoặc cần củng cố.

**Trong phạm vi**

- `/hoc/[so]/tu-vung` — chọn một số từ hoặc chọn toàn bộ từ có bản dịch trong bài.
- Thẻ nhớ chủ động: hiện từ tiếng Nhật trước, chỉ hiện nghĩa sau khi người học yêu cầu.
- Flashcard hai mặt: mặt trước nghe từ; mặt sau có nghĩa, câu ví dụ trong bài khi tìm được
  liên hệ từ vựng đáng tin cậy, cùng nút nghe từ và nút nghe câu riêng biệt.
- Bốn mức tự đánh giá: Quên mất / Khó nhớ / Nhớ được / Dễ nhớ.
- Ghi tiến độ từng từ vào `reviewItems` và `pendingSync` trong cùng transaction Dexie.
- Xếp hạng từ nhớ ổn định và từ cần củng cố từ lịch sử kết quả và trường FSRS sẵn có.

**Ngoài phạm vi**

- Nội dung N4, audio mới, và xác minh nội dung từ sách.
- Ghi thời lượng hoặc lượt thẻ này vào `practiceSessions`; dashboard thống kê lượt luyện hiện tại vẫn dựa trên phiên luyện.
- Loại trừ vĩnh viễn các từ chưa được chọn khỏi hàng đợi ôn chung của bài.

## 2. Dữ liệu

| Nguồn | Chiều | Dùng cho |
|---|---|---|
| `loadVocab(lesson)` | Đọc | Nạp riêng từ vựng của bài; vị trí từ xác định `targetId` `vocab-XX-YY` giống bộ sinh câu hỏi |
| `db.reviewItems` | Đọc/ghi | Lịch FSRS, số lần nhớ/quên, hạn ôn, thống kê từng từ |
| `db.pendingSync` | Ghi | Đẩy bản cập nhật `reviewItems` qua RPC sync hiện có |
| `applyReview` từ `fsrs.ts` | Gọi | Chấm trực tiếp bằng các mức Rating FSRS; không tạo scheduler thứ hai |
| `lesson.grammar[].examples` | Đọc | Tìm câu ví dụ có chứa dạng viết/cách đọc của từ; không tạo câu mới hoặc gán câu không liên quan |

Mỗi lượt đánh giá ghi `reviewItems` và `pendingSync` atomically. “Quên mất” tăng
`incorrectCount`; các mức còn lại tăng `correctCount`. Mọi mức cập nhật `fsrsCard` và `dueAt`.
Thời gian trả lời thành công tiếp tục dùng `recentElapsedMs` hiện có.

Không thêm bảng Dexie hoặc trường dữ liệu mới. Kết quả tự đồng bộ như các cập nhật ôn tập
hiện hành. Chọn một phần chỉ giới hạn phiên học này; hàng đợi `/on-tap` vẫn có thể nạp các
mục mới khác trong bài theo chính sách SPEC-05.

## 3. Màn hình & bố cục

Lối vào nằm cạnh tiêu đề từ vựng ở `/hoc/[so]`. Luồng học chiếm màn hình để tránh dock
điều hướng che nút đánh giá, dùng Washi và vùng chạm tối thiểu 48px.

- **Chọn từ:** toàn bộ từ có nghĩa tiếng Việt được chọn sẵn; người học có thể bỏ chọn từng
  mục, chọn tất cả hoặc bỏ chọn. Mỗi hàng cho biết tỷ lệ nhớ đúng, số lần quên và hạn ôn.
  Nút bắt đầu luôn cố định ở cuối màn hình, trong tầm tay khi cuộn danh sách; nội dung có
  khoảng đệm cuối và safe area để không bị nút che.
- **Tự kiểm tra:** nhìn từ Nhật và furigana, tự nhớ nghĩa, bấm “Lật thẻ xem đáp án”, rồi chọn một
  trong bốn mức. Mặt sau hiện nghĩa và câu ví dụ khớp với từ nếu bài có; nút “Nghe từ” và
  “Nghe câu” phát riêng từng nội dung. Nút hiển thị khoảng thời gian FSRS dự kiến tới lượt ôn kế.
- Nếu bài chưa có câu ví dụ khớp, mặt sau nói rõ điều đó; không gắn một câu bất kỳ vào thẻ.
- Bốn mức đánh giá là các nút chạm lớn, có nhãn, gợi ý ngắn, khoảng ôn dự kiến và màu trạng thái
  nhẹ theo Washi; nhãn chữ vẫn là tín hiệu chính.
- **Kết quả & theo dõi:** tổng hợp các mức tự đánh giá trong lượt vừa xong; hai danh sách
  “Nhớ ổn định” (tỷ lệ nhớ đúng cao, sau đó là stability) và “Cần củng cố” (tỷ lệ quên,
  số lần quên, stability thấp) hiển thị tối đa năm mục mỗi nhóm.

## 4. Component dùng lại

- `Furigana`, `SpeakButton` (nhãn nghe tùy chọn), `Button` (`size="quiz"`), `Skeleton`.
- `db`, `applyReview`, `pushElapsedSample`; không dùng Zustand để giữ tiến độ.
- `AppNav` ẩn trong route toàn màn hình; nút quay lại/thoát nằm trong chính luồng học.

## 5. Trạng thái

- Đang nạp tiến độ: skeleton danh sách; chưa cho bắt đầu để không hiển thị trạng thái sai.
- Không có từ được chọn: nút bắt đầu bị khóa.
- Từ thiếu nghĩa tiếng Việt: không thể chọn để tự kiểm tra.
- Lỗi khi lưu: giữ nguyên thẻ hiện tại và cho thử lại; không chuyển sang từ tiếp theo.
- Hoàn tất: hiện số lượt Quên/Khó/Nhớ/Dễ và lựa chọn học thêm hoặc quay lại bài.
- Chưa có lịch: ghi rõ “Chưa có lượt luyện hoặc ôn”. Nội dung chưa xác minh giữ cảnh báo hiện có.

## 6. Tương tác & chuyển động

- Hàng từ là nút toggle có `aria-pressed`; “Chọn tất cả” và “Bỏ chọn” hỗ trợ chọn nhanh.
- Bắt đầu → nhớ nghĩa → hiện nghĩa → tự đánh giá → lưu ngay → chuyển thẻ.
- Thoát giữa lượt không xóa kết quả các thẻ đã đánh giá; thẻ hiện tại chưa được ghi nếu chưa chấm.
- Không dùng phím tắt bắt buộc; mọi hành động đều có nút chạm và focus bàn phím.

## 7. Accessibility

- Chữ Nhật dùng `<ruby>/<rt>` qua `Furigana`; checkbox/toggle có tên truy cập tiếng Nhật sạch
  và nghĩa tiếng Việt.
- Nút lựa chọn có biểu tượng và nhãn chữ, focus hiển thị, kích thước chạm ít nhất 48px.
- Tiến độ là `<progress>` có nhãn truy cập; thay đổi thẻ/đáp án được thông báo qua live region.
- Nội dung trên overlay toàn màn hình không để điều hướng nền tiếp tục xuất hiện trong cây
  accessibility; focus chuyển đến nội dung thẻ khi bắt đầu và khi đổi trạng thái.
- Có safe area trên/dưới; kiểm tra responsive ở 390px và desktop.

## 8. Bảo mật & dữ liệu

- Chỉ lưu lịch học cục bộ trong Dexie và hàng đợi sync hiện có; không gửi nội dung từ vựng
  hoặc dữ liệu mới sang dịch vụ khác.
- Không gọi mạng trong transaction. Nếu lưu một trong hai bảng thất bại thì cả hai rollback.
- FSRS chỉ qua `fsrs.ts`. Các mức nhớ là tự đánh giá của người học, không phải phép đo khách quan.

## 9. Tiêu chí nghiệm thu

- [x] Chọn từng từ, chọn tất cả, bỏ chọn; không bắt đầu với danh sách rỗng.
- [x] Xem thẻ tiếng Nhật trước; nghĩa chỉ xuất hiện sau hành động.
- [x] Có bốn mức FSRS kèm dự đoán hạn ôn.
- [x] Lối vào từ trang chi tiết bài; route được prerender cho 25 bài N5.
- [x] Giao diện và thao tác chọn/hiện đáp án kiểm tra ở 390×844; không tràn ngang.
- [ ] Nút bắt đầu luôn nằm trong tầm tay khi cuộn danh sách; nội dung cuối không bị footer che.
- [ ] Mặt trước/mặt sau hiển thị đúng; nghe từ và nghe câu là hai nút riêng, có nhãn.
- [ ] Bốn mức tự đánh giá dễ phân biệt, có focus và vùng chạm đủ lớn ở mobile.
- [ ] Đánh giá thực tế một từ, xác minh `reviewItems` và `pendingSync` được ghi atomic; chưa
      thực hiện trên hồ sơ trình duyệt dùng chung để tránh thêm dữ liệu học thử.
- [ ] Kiểm tra lưu offline rồi đồng bộ reconnect và xác nhận thứ hạng nhớ/quên sau reload.

## 10. Khối lệnh bàn giao thiết kế

Mở rộng hệ Washi hiện có. Ở 390px, làm màn chọn từ dạng danh sách chạm được, thẻ tự nhớ
toàn màn hình, bốn mức tự đánh giá dễ phân biệt bằng nhãn và icon. Dùng token Washi, furigana
ngữ nghĩa, focus rõ, safe area và nút `size="quiz"`; không thêm bảng token hoặc màu mới.
