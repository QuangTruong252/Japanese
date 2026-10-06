# SPEC-20 — Ôn tập theo lịch và tiếp lô rõ ràng

Ngày: 27/09/2026. Trạng thái: **đã có code** (Antigravity worker, 27/09/2026), chờ supervisor nghiệm thu trình duyệt. Mốc 5 của kế hoạch UX; đọc SPEC-05 và hợp đồng FSRS trong repo. Handoff: [SPEC-20](../handoff/SPEC-20.md). _(đã gỡ khỏi repo ngày 06/10/2026; bản cũ ở tag `pre-cleanup`)_

## 1. Mục tiêu & phạm vi

Người học biết còn bao nhiêu mục đến hạn, bắt đầu lô hiện tại, hiểu kết quả và tiếp lô nếu còn. “Điểm yếu của tôi” là đường phụ riêng. Không đổi thuật toán FSRS, lịch đến hạn, hạn mức mục mới hoặc rating.

## 2. Dữ liệu

- `use-due-queue.ts` là nguồn cho preview lô, số còn lại và hạn mục mới; Bảng tin, badge dock, trang Ôn dùng cùng ý nghĩa đếm theo thời gian thực. `fsrs.ts` là cổng duy nhất cho rating/review.
- `reviewItems` và phiên đã hoàn thành đọc qua Dexie/`useLiveQuery`; mọi ghi ôn cùng `pendingSync` trong transaction theo quy tắc hiện có.
- “Điểm yếu” dùng bộ lọc hiện có, không thêm mục chưa đến hạn vào queue FSRS.

## 3. Màn hình & bố cục

**Pilot 05/10/2026:** ảnh trang trí `review-complete-v1.webp` theo [SPEC-21](SPEC-21-illustration-assets.md) trong nhánh không còn mục đến hạn/mới; alt rỗng cạnh thông báo thật. Nhánh đã đạt hạn mức giữ thông báo hạn mức, không đổi thành “Đã ôn xong”. Đã xem nhánh hạn mức với ảnh trong dark mobile; không đổi FSRS/queue.

- `/on-tap`: tiêu đề, số mục đến hạn/mới và preview lô ngắn, một CTA “Bắt đầu ôn”. Giải thích nếu còn các lô sau; link “Điểm yếu của tôi” nằm phụ nhưng thấy được.
- Chưa có lịch: nêu lý do thực (chưa bắt đầu bài, đã ôn xong, đạt hạn mục mới, thiếu câu/giọng Nhật) và một đích phù hợp, không nói sai “đã ôn xong” nếu queue bị chặn.
- `/on-tap/phien`: giữ màn tập trung, rating và tiến độ phiên hiện có. Sau lô, nếu còn mục hợp lệ, “Ôn lô tiếp” là hành động rõ; nếu hết, “Về Bảng tin”. Không tự mở lô tiếp nếu người học muốn dừng.
- `/on-tap/diem-yeu`: giữ mục tiêu xem/luyện điểm yếu riêng, có link về Ôn hôm nay.

## 4. Component dùng lại

`on-tap/page.tsx`, `on-tap/phien/page.tsx`, `on-tap/diem-yeu/page.tsx`, `use-due-queue.ts`, `fsrs.ts`, `TargetTypeBadge`, `DashboardContent`, `AppNav`. Không tạo queue thứ hai để phục vụ UI.

## 5. Trạng thái

Chưa có bài; có mục đến hạn; có mục mới nhưng bị hạn mức; còn nhiều lô; đã ôn hết; câu hỏi/audio không tạo được; phiên đang dở; offline/sync pending. Mỗi trạng thái có copy không hứa sai về lịch ôn.

## 6. Tương tác & chuyển động

Start tạo đúng lô được preview; hoàn thành một lô mới cập nhật số còn lại. Chuyển Ôn ↔ Điểm yếu qua link thật. Dừng/thoát phiên theo cơ chế lưu hiện có; không tự chấm hay tự áp dụng rating. Giữ reduced motion.

## 7. Accessibility

Nút trong phiên ≥48px, rating có nhãn nghĩa và trạng thái focus, số mục có bản đọc chữ; không chỉ dựa vào màu. Kết quả được thông báo rõ cho screen reader mà không gây thông báo liên tục. Dock/safe area không che CTA ở trang ngoài phiên.

## 8. Bảo mật & dữ liệu

Giữ thứ tự ghi FSRS hiện có, pending sync và retry idempotent. Mất mạng sau khi trang đã mở vẫn có thể ôn với dữ liệu sẵn và lưu cục bộ; không hứa reload offline. Không đổi chính sách conflict trong SPEC-08.

## 9. Tiêu chí nghiệm thu

- [ ] Bảng tin, badge, trang Ôn nhất quán về số mục đến hạn; rollover thời gian cập nhật mà không cần sửa Dexie.
- [ ] Có nhiều lô: sau lô đầu còn lối “Ôn lô tiếp”; hết lô có đích về Bảng tin. Điểm yếu không bị trộn vào queue.
- [ ] Empty/limit/no voice/no question nói đúng lý do; rating và ngày hạn không thay vì đổi giao diện.
- [ ] Offline trong tab mở lưu review, reconnect/retry không tạo lịch sử trùng; browser 390/1280, keyboard/focus/reduced motion; `pnpm check`, `pnpm test` khi đổi logic, `pnpm build` nếu phù hợp.

## 10. Khối lệnh bàn giao thiết kế

Minh họa Ôn 390px cho ba trường hợp: lô đến hạn, đã ôn xong, hết lô đầu nhưng còn mục; thêm màn kết quả/Điểm yếu và desktop 1280px. Dùng Washi và số lấy từ queue mẫu có nhãn giả định; không trang trí trạng thái bằng màu đơn độc, không đổi rating FSRS.
