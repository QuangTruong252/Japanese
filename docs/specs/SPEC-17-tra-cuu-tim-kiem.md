# SPEC-17 — Tra cứu dễ thấy và tìm kiếm đích tính năng

Ngày: 27/09/2026. Trạng thái: **Đã triển khai** (Code và unit tests PASS 100%). Mốc 2 của [kế hoạch UX](../plans/2026-09-27-ux-redesign.md); đọc thêm SPEC-12/13.

## 1. Mục tiêu & phạm vi

- Từ màn chính, mở Tra cứu bằng một chạm ở dock/sidebar; từ hub mở Kana, Kanji, Động từ, Bảng tham chiếu bằng thêm một chạm.
- Tìm “tra cứu”, “kana”, “kanji”, “động từ”, “thống kê” phải thấy đường vào tính năng có nhãn rõ, bên cạnh kết quả học liệu.
- Không đổi bộ dữ liệu Kanji/động từ/bảng hoặc thuật toán chuẩn hóa đáp án bài tập.

## 2. Dữ liệu

- Giữ `lookup.ts` và chỉ mục nội dung `search.ts`. Bổ sung mục điều hướng tĩnh riêng, có id/href/alias rõ; không nhân đôi từng bản ghi học liệu.
- URL chuẩn của hub tiếp tục `/hoc/tra-cuu`, các route con giữ nguyên. Alias “kanji” có thể trả cả đích danh mục lẫn chữ Kanji; nhóm “Tính năng” không làm mất kết quả nội dung.
- Query trực tiếp như `?q=` trên trang động từ vẫn giữ hành vi. Không lưu history tìm kiếm mới nếu chưa có nhu cầu.

## 3. Màn hình & bố cục

- Hub Tra cứu: tên trang rõ, trường “Tìm từ, chữ, ngữ pháp…” ở đầu; bốn danh mục Kana, Kanji, Động từ, Bảng tham chiếu có mô tả ngắn và lối vào đủ lớn. Có thể dùng SearchDialog hiện có từ một trigger mang nhãn, không bắt buộc tạo engine tìm kiếm thứ hai.
- SearchDialog: nhóm “Tính năng” xuất hiện khi query khớp tên/alias; nhóm nội dung giữ từ vựng, ngữ pháp, Kanji, động từ, bảng và bài học. Kết quả có loại và đích rõ; empty state gợi ý tìm theo từ Nhật, cách đọc hoặc tiếng Việt.
- Trên trang bài, giữ trigger tìm kiếm theo ngữ cảnh; danh sách bài có nhãn “Lọc bài học” để phân biệt search toàn cục.

## 4. Component dùng lại

`SearchTrigger`, `SearchDialog`, `search.ts`, `lookup.ts`, các trang `/hoc/tra-cuu/*`, `Furigana`, component shadcn hiện có. `AppNav` phải ưu tiên active Tra cứu trước `/hoc` như SPEC-16.

## 5. Trạng thái

Index chưa nạp, index lỗi, query rỗng, không kết quả, khớp cả tính năng và nội dung, bàn phím trên mobile, quay về từ chi tiết. Index lỗi có thông báo và lối duyệt danh mục vẫn hoạt động.

## 6. Tương tác & chuyển động

- Link kết quả là đích có URL thật; Enter/Arrow/Escape theo hành vi hộp thoại hiện có. Khi đóng dialog trả focus đúng trigger.
- Từ chi tiết có breadcrumb/Back về hub hoặc danh mục; nếu mở từ bài, browser Back trả lại bài/phiên không ghi đè state. Không hứa bảo toàn phiên nếu code phiên hiện tại chưa cho mở tra cứu mà không rời route; kiểm tra rồi thiết kế lối an toàn trước khi thêm liên kết trong câu hỏi.
- Chuyển động ngắn, reduced motion; không tự focus bàn phím ảo trên mobile khi chỉ mở hub.

## 7. Accessibility

Search có label, combobox/listbox đúng role và thứ tự focus; kết quả nhóm được đọc tên. Link danh mục có vùng chạm ≥48px, tên không chỉ bằng icon. Đọc furigana bằng component sẵn có, không parser mới.

## 8. Bảo mật & dữ liệu

Tra cứu chỉ đọc chỉ mục nội dung cục bộ; không gửi truy vấn hay dữ liệu học lên dịch vụ ngoài. Không phụ thuộc login hoặc network sau khi dữ liệu trang đã tải.

## 9. Tiêu chí nghiệm thu

- [x] Từ mỗi màn chính: một chạm đến hub; hai chạm đến Kana/Kanji/Động từ/Bảng. Dock active đúng ở mọi route con.
- [x] `tra cuu`, `kana`, `kanji`, `dong tu`, `thong ke` trả đích tính năng phù hợp; truy vấn Nhật/romaji/Việt vẫn trả nội dung đúng, không tụt khỏi giới hạn 20 kết quả vì mục điều hướng chiếm hết.
- [x] Deep link cũ, `?q=` động từ, anchor bài và Back/Forward vẫn hoạt động. Kiểm index lỗi/empty/keyboard/mobile.
- [x] `pnpm test` cho alias/ranking (9/9 search tests PASS, 201/201 repo tests PASS); bàn giao nghiệm thu trình duyệt và full check/build cho supervisor.

## 10. Khối lệnh bàn giao thiết kế

Dùng Washi và pattern của `DESIGN.md`; minh họa hub 390px/1280px và SearchDialog có đồng thời nhóm Tính năng + nội dung. Dùng tên danh mục thật của SPEC-12, không tạo danh mục mới hoặc số học liệu giả. Thể hiện kết quả rỗng và keyboard focus.
