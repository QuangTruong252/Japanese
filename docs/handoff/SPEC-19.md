# Handoff — SPEC-19: Luyện tập nhanh với cấu hình mở rộng

Ngày: 2026-09-28. Trạng thái: đã có code, chờ nghiệm thu browser.

## Đợt 28/09/2026

### Thay đổi và quyết định
- **Đầu trang `/luyen-tap`**: Khi có phiên nháp, hiển thị `PracticeDraftBanner` với nút "Tiếp tục phiên" (ưu tiên) và "Bỏ nháp". Ngay bên dưới là card tóm tắt nhanh "Sẵn sàng luyện Bài N · M câu · X dạng" cùng nút CTA chính `size="quiz"` "Bắt đầu M câu" (với M là số câu thực tế tạo được), nằm gọn trên màn đầu 390×844 phía trên dock không phải cuộn 1.200px qua 25 bài như trước.
- **Cảnh báo khi bắt đầu phiên mới có nháp**: Khi đang có phiên dở dang, bấm nút "Bắt đầu M câu" sẽ mở `AlertDialog` xác nhận giải thích rõ bắt đầu mới sẽ thay thế và xóa phiên nháp cũ, tránh ghi đè âm thầm. Mở trang không tự tạo phiên và không ghi đè nháp.
- **Bài mặc định và cấu hình**: Phân giải theo thứ tự ưu tiên chuẩn hóa thành hàm thuần `resolveInitialPracticeConfig` (`practice-preview.ts`):
  1. `?lessons=N` thắng;
  2. `practicePreset` hợp lệ lưu trong localStorage (`loadSavedPracticePreset` trong `settings.ts`);
  3. Bài đang học cục bộ (`pickActiveLesson` kết hợp tiến độ từ vựng từ Dexie);
  4. Người mới hoàn toàn fallback về Bài 1.
  Xử lý an toàn khi preset chứa bài (ngoài 1..25), dạng bài không hợp lệ hoặc số câu sai lệch.
- **Số câu thực M & 0 câu**: Tính qua `computeActualQuestionCount`. Khi 0 câu (hoặc chưa chọn bài/dạng), nút CTA bị vô hiệu hóa (`disabled`), liên kết mô tả `aria-describedby="practice-blocked-reason"` hiển thị lý do và hướng dẫn chọn thêm bài hoặc dạng bài. Khi số câu trong kho ít hơn số câu mong muốn (ví dụ kho có 8 câu mà chọn 15), CTA hiển thị đúng số thực "Bắt đầu 8 câu".
- **Khối "Tùy chỉnh"**: Đặt các bộ chọn 25 bài học, 5 dạng bài và 4 mức số câu (10, 15, 20, 30) vào panel collapsible có nút toggle với `aria-expanded`, `aria-controls`. Đóng/mở không làm mất lựa chọn; khi đóng, focus được trả về nút "Tùy chỉnh". Các chip sử dụng `aria-pressed`. Card tóm tắt và CTA ở trên cập nhật tức thì theo thời gian thực khi thay đổi bất kỳ tùy chọn nào. Bỏ logic tự ý deselect dạng bài trong silent effect.
- **Trang kết quả `/luyen-tap/phien`**: Bổ sung nút "Về bài N" (dẫn tới `/hoc/N`) và đổi nút thành "Luyện tiếp" (dẫn tới `/luyen-tap`), giữ nguyên lối "Làm lại câu sai" cho các câu trả lời sai (đã có cơ chế draft resume sẵn có).

### File liên quan
- `web/src/app/luyen-tap/page.tsx`: Tái cấu trúc layout màn đầu, card tóm tắt nhanh, nút Tùy chỉnh, AlertDialog cảnh báo ghi đè nháp.
- `web/src/components/practice/PracticeDraftBanner.tsx`: Chuẩn hóa nhãn nút "Tiếp tục phiên" và "Bỏ nháp".
- `web/src/components/practice/SessionResult.tsx`: Bổ sung nút "Về bài N" (`lessonHref`), đổi nhãn "Luyện tiếp", prefetch tương ứng.
- `web/src/lib/practice-preview.ts`: Helper thuần phân giải cấu hình ban đầu, tính số câu thực, text CTA, lý do blocked, format tiêu đề tóm tắt.
- `web/src/lib/practice-preview.test.ts`: Bộ test node:test toàn diện cho `practice-preview.ts` (10 test cases gồm cả ca đúng và ca sai).
- `web/src/lib/settings.ts`: Bổ sung helper `loadSavedPracticePreset` chỉ đọc preset khi đã lưu thực sự.
- `web/src/lib/settings.test.ts`: Thêm test cho `loadSavedPracticePreset`.
- `docs/specs/SPEC-19-luyen-tap-nhanh.md`: Cập nhật trạng thái "đã có code, chờ nghiệm thu browser", giữ nguyên checklist §9.
- `docs/specs/SPEC-04-luyen-tap.md`: Bổ sung ghi chú UX chuyển tiếp sang SPEC-19 cho §3.1.

### Kiểm chứng thực tế
- `pnpm check` (chạy trong `web/`): **PASS** (exit 0, 0 lỗi TypeScript, 0 lỗi ESLint, không có warning mới trong các file thuộc phạm vi sở hữu).
- `pnpm test` (chạy trong `web/`): **PASS** (222/222 test pass, 0 fail; tăng +13 test so với baseline 209).

Chưa nghiệm thu browser — chờ coordinator.

## Còn lại và bước tiếp theo
- Chờ coordinator nghiệm thu browser cho các tiêu chí B19.1–B19.6 trên viewport 390×844 và 1280×800.
