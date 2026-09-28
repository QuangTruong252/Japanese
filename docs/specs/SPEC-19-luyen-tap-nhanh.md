# SPEC-19 — Luyện tập nhanh với cấu hình mở rộng

Ngày: 28/09/2026. Trạng thái: **đã có code, chờ nghiệm thu browser**. Mốc 4 của [kế hoạch UX](../plans/2026-09-27-ux-redesign.md); đọc SPEC-04 và handoff phiên nháp.

## 1. Mục tiêu & phạm vi

Từ dock Luyện, người học nhìn thấy cấu hình hợp lệ và nút “Bắt đầu N câu” trên màn đầu, không phải cuộn qua 25 bài. Người muốn chỉnh vẫn có toàn bộ chọn bài/dạng/số câu. Nháp hiện có không bị ghi đè. Giữ 5 dạng bài và logic chấm/sinh câu.

## 2. Dữ liệu

- Bài mặc định: nếu đến từ Bài N, `?lessons=N` thắng; nếu mở dock, dùng preset hợp lệ gần nhất; nếu chưa có preset hữu ích, dùng bài đang học cục bộ; người hoàn toàn mới dùng Bài 1. Không suy ra “đã học” từ bài được chọn.
- `practicePreset` trong `settings.ts` tiếp tục là nguồn cấu hình lưu; Zustand chỉ giữ UI tạm. `buildSession`/`filterExercises` tính số câu thực và dạng có câu; không in số mặc định khi chỉ tạo được ít hơn.
- Nháp từ helper hiện có (`PracticeDraftBanner`/`practice-draft.ts`) có quyền ưu tiên; không tạo phiên mới khi chỉ mở trang cấu hình.

## 3. Màn hình & bố cục

- Đầu `/luyen-tap`: nếu có nháp, banner “Tiếp tục phiên” và lựa chọn tạo mới có giải thích hậu quả. Sau đó card tóm tắt “Sẵn sàng luyện Bài N / N câu / dạng đang chọn” và CTA chính “Bắt đầu N câu”.
- “Tùy chỉnh” mở phần chọn 25 bài, dạng, số câu hiện có, theo các nhóm dễ quét; đóng lại không xóa lựa chọn. Nếu chưa có câu hợp lệ, CTA disabled có lời giải và hướng chọn khác. Không auto-bỏ lựa chọn người học mà không có phản hồi rõ.
- Từ bài học, đường `?lessons=N` hiển thị đúng bài trước khi khởi tạo phiên. Trang kết quả nêu lối “Làm lại câu sai” nếu có dữ liệu/phương thức hỗ trợ; nếu chưa hỗ trợ, không hiện CTA giả. “Về bài” và “Luyện tiếp” là lối rõ.

## 4. Component dùng lại

`luyen-tap/page.tsx`, `PracticeDraftBanner`, `buildSession`, `filterExercises`, `useQuestionPool`, `settings.ts`, `PracticeRunner`, shadcn Button/Collapsible nếu đã có. Không thêm thư viện state/form.

## 5. Trạng thái

Chưa tải câu; bài mới; preset cũ có bài/dạng không hợp lệ; không có giọng Nhật cho listening; 0 câu; ít câu hơn mức chọn; có nháp; đã hoàn thành; mạng mất trong phiên; reconnect. Mỗi trạng thái có số/copy thật và hành động tiếp theo; không thay bằng skeleton vĩnh viễn.

## 6. Tương tác & chuyển động

- Bấm Start chỉ tạo phiên khi preview hợp lệ. Có nháp thì Resume là hành động ưu tiên; tạo mới phải xác nhận hoặc chỉ rõ nháp sẽ thay thế theo quy trình hiện có.
- Mở/đóng Tùy chỉnh giữ focus, lựa chọn và khả năng keyboard. Sau chỉnh số câu/nội dung, tóm tắt và CTA cập nhật cùng dữ liệu.
- Trong phiên giữ màn tập trung, dock ẩn, thoát/lưu nháp rõ. Không đổi đánh giá câu trả lời. Chuyển động giảm khi `prefers-reduced-motion`.

## 7. Accessibility

Nút trong luồng ≥48px (`size="quiz"` khi phù hợp); nhãn dạng/bài đầy đủ, trạng thái chọn bằng `aria-pressed`, disabled có lý do đọc được, focus không mất khi Collapsible đóng. Kiểm bàn phím, screen reader tên câu và viewport mobile khi keyboard mở.

## 8. Bảo mật & dữ liệu

Ghi nháp/kết quả qua luồng Dexie hiện có cùng `pendingSync` khi áp dụng. Không thay rating FSRS trong phiên luyện; không ghi đè nháp bằng preview. Không lưu dữ liệu học mới trong Zustand persist.

## 9. Tiêu chí nghiệm thu

- [ ] Từ dock, khi có dữ liệu hợp lệ, người học bắt đầu bằng một hành động ở màn đầu; từ Bài N, cấu hình đúng N. Số N câu bằng số câu thực có thể tạo.
- [ ] Cả 5 dạng, chọn bài đa lựa chọn, count và TTS/no voice hoạt động; 0 câu/ít câu có giải thích. Preset/nháp vẫn đúng sau rời trang/quay lại.
- [ ] Không ghi đè nháp âm thầm; offline trong tab đã mở làm hết phiên và lưu kết quả; reconnect không gửi trùng.
- [ ] Browser 390/1280, keyboard, focus, reduced motion; `pnpm check`, `pnpm test` cho chọn preset/preview/nháp nếu đổi logic; `pnpm build` nếu phù hợp.

## 10. Khối lệnh bàn giao thiết kế

Minh họa màn Luyện 390px với card bắt đầu nhanh, banner nháp, phần Tùy chỉnh mở và trạng thái 0 câu; bản desktop 1280px. Giữ Washi và cùng năm dạng hiện có, không tạo dạng bài giả. CTA diễn đạt số câu thực; kiểm nút 48px và chỗ dock/safe area.
