# SPEC-15 — Học từ vựng chủ động theo bài

> **Mã:** SPEC-JPN-F15 · **Trạng thái:** Đã có code; chờ nghiệm thu toàn luồng · **Ngày:** 24/09/2026
> **Phụ thuộc:** SPEC-01 (từ vựng), SPEC-03 (màn bài học), SPEC-05 (FSRS và hàng đợi ôn)

## 1. Mục tiêu & phạm vi

Giúp người học chủ động gọi nghĩa của từng từ trong một bài, tự đánh giá mức độ nhớ,
đưa kết quả vào lịch FSRS và xem từ nào thường nhớ tốt hoặc cần củng cố.

**Trong phạm vi**

- `/hoc/[so]/tu-vung` — dùng dữ liệu có sẵn trong repo.
- Thẻ nhớ chủ động: hiện từ tiếng Nhật trước, chỉ hiện nghĩa sau khi người học chạm thẻ.
- Flashcard hai mặt: mặt trước nghe từ; mặt sau có nghĩa, ưu tiên ví dụ gắn với từ rồi mới dò
  ví dụ ngữ pháp trong bài, cùng nút nghe từ và nút nghe câu riêng biệt.
- Bốn mức tự đánh giá: Quên mất / Khó nhớ / Nhớ được / Dễ nhớ.
- Ghi tiến độ từng từ vào `reviewItems` và `pendingSync` trong cùng transaction Dexie.
- Xếp hạng từ nhớ ổn định và từ cần củng cố từ lịch sử kết quả và trường FSRS sẵn có.

**Ngoài phạm vi**

- Nội dung N4 và audio mới.
- Ghi thời lượng hoặc lượt thẻ này vào `practiceSessions`; dashboard thống kê lượt luyện hiện tại vẫn dựa trên phiên luyện.
- Loại trừ vĩnh viễn các từ chưa được chọn khỏi hàng đợi ôn chung của bài.

## 2. Dữ liệu

| Nguồn | Chiều | Dùng cho |
|---|---|---|
| `loadVocab(lesson)` | Đọc | Nạp riêng từ vựng của bài; vị trí từ xác định `targetId` `vocab-XX-YY` giống bộ sinh câu hỏi |
| `VocabWord.example` | Đọc | Ví dụ gắn trực tiếp với từ và `kana` của câu khi có; ưu tiên trước ví dụ ngữ pháp |
| `db.reviewItems` | Đọc/ghi | Lịch FSRS, số lần nhớ/quên, hạn ôn, thống kê từng từ |
| `db.pendingSync` | Ghi | Đẩy bản cập nhật `reviewItems` qua RPC sync hiện có |
| `applyReview` từ `fsrs.ts` | Gọi | Chấm trực tiếp bằng các mức Rating FSRS; không tạo scheduler thứ hai |
| `lesson.grammar[].examples` | Đọc | Dự phòng khi từ chưa có ví dụ riêng; tìm câu có chứa dạng viết/cách đọc của từ |

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
  mục, chọn tất cả hoặc bỏ chọn. Mỗi hàng chỉ hiện từ tiếng Nhật và tiến độ nhớ; không hiện
  nghĩa tiếng Việt trước khi bắt đầu.
  Nút bắt đầu luôn cố định ở cuối màn hình, trong tầm tay khi cuộn danh sách; nội dung có
  khoảng đệm cuối và safe area để không bị nút che.
- **Tự kiểm tra:** nhìn từ Nhật lớn và cách đọc hiragana nhỏ bên dưới, tự nhớ nghĩa rồi chạm
  toàn bộ thẻ để lật. Mặt sau đặt nghĩa lớn ở giữa, câu ví dụ bên dưới và hai icon audio riêng:
  phát âm từ ở góc trên bên phải thẻ, phát âm câu nhỏ hơn ngay sau tiêu đề “Câu ví dụ”.
  Sau khi lật, hiện bốn nút icon FSRS theo một hàng; nhãn nằm bên dưới, khoảng ôn dự kiến
  nằm trong tên truy cập của từng nút.
- Nếu bài chưa có câu ví dụ khớp, mặt sau nói rõ điều đó; không gắn một câu bất kỳ vào thẻ.
- Với ví dụ có `kana` trong data, hiện cách đọc nhỏ dưới câu và dùng cách đọc đó cho icon phát âm câu.
- Bốn mức đánh giá là nút icon chạm tối thiểu 48px, chỉ xuất hiện ở mặt sau; mỗi nút có nhãn
  bên dưới và khoảng ôn dự kiến trong tên truy cập, dùng màu trạng thái nhẹ theo Washi.
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
- Chưa có lịch: ghi rõ “Chưa có lượt luyện hoặc ôn”.

## 6. Tương tác & chuyển động

- Hàng từ là nút toggle có `aria-pressed`; “Chọn tất cả” và “Bỏ chọn” hỗ trợ chọn nhanh.
- Bắt đầu → nhớ nghĩa → chạm thẻ để hiện nghĩa → tự đánh giá bằng một trong bốn icon → lưu ngay → chuyển thẻ.
- Thẻ xoay 3D khi lật trong 250ms theo `DESIGN.md`; người dùng giảm chuyển động thấy ngay mặt sau, không có chuyển động.
- Thoát giữa lượt không xóa kết quả các thẻ đã đánh giá; thẻ hiện tại chưa được ghi nếu chưa chấm.
- Không dùng phím tắt bắt buộc; mọi hành động đều có nút chạm và focus bàn phím.

## 7. Accessibility

- Chữ Nhật dùng `<ruby>/<rt>` qua `Furigana`; nút lật có tên truy cập nhưng không đọc nghĩa
  trước khi người học chủ động lật thẻ.
- Nút lựa chọn và bốn nút FSRS có nhãn truy cập, focus hiển thị, kích thước chạm ít nhất 48px.
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
- [x] Mọi bài mở luồng học với dữ liệu hiện có.
- [x] Xem thẻ tiếng Nhật trước; nghĩa chỉ xuất hiện sau khi chạm thẻ.
- [x] Bốn icon FSRS chỉ xuất hiện sau khi lật; nhãn hiển thị bên dưới và dự đoán hạn ôn có trong tên truy cập.
- [x] Lối vào từ trang chi tiết bài; route được prerender cho 25 bài N5.
- [x] Kiểm tra mặt trước/mặt sau ở 390×844; không tràn ngang.
- [ ] Nút bắt đầu luôn nằm trong tầm tay khi cuộn danh sách; nội dung cuối không bị footer che.
- [x] Chạm thẻ xoay 3D để hiện đáp án; mặt trước có cách đọc nhỏ bên dưới; mặt sau có nghĩa lớn
      ở giữa, ví dụ và cách đọc câu bên dưới, hai icon audio riêng không có nhãn nút hiển thị.
- [x] 25 bài có ví dụ và kana cho 991/991 từ (24/09/2026), tự biên soạn và đã duyệt lại.
- [ ] Kiểm tra trực quan chế độ giảm chuyển động; code bỏ transition khi người dùng bật chế độ này.
- [ ] Bốn mức tự đánh giá dễ phân biệt, có focus và vùng chạm đủ lớn ở mobile.
- [ ] Đánh giá thực tế một từ, xác minh `reviewItems` và `pendingSync` được ghi atomic; chưa
      thực hiện trên hồ sơ trình duyệt dùng chung để tránh thêm dữ liệu học thử.
- [ ] Kiểm tra lưu offline rồi đồng bộ reconnect và xác nhận thứ hạng nhớ/quên sau reload.

## 10. Khối lệnh bàn giao thiết kế

Mở rộng hệ Washi hiện có. Ở 390px, làm màn chọn từ dạng danh sách chạm được nhưng không hiện
nghĩa trước khi bắt đầu. Trong thẻ toàn màn hình, chạm mặt trước để lật; cách đọc hiragana nhỏ
nằm dưới từ, mặt sau đặt nghĩa lớn giữa thẻ và câu ví dụ phía dưới. Dùng icon audio riêng cho từ
và câu, không kèm nhãn hiển thị. Bốn icon FSRS chỉ xuất hiện sau khi lật, có nhãn bên dưới
và hạn ôn trong tên truy cập. Thẻ xoay 3D trong 250ms, bỏ chuyển động khi người dùng yêu cầu
giảm chuyển động. Ưu tiên ví dụ và kana gắn trong data từ vựng. Dùng dữ liệu hiện có. Dùng token Washi, furigana
ngữ nghĩa, focus rõ, safe area và vùng chạm tối thiểu 48px; không thêm màu hoặc token mới.
