# Handoff — redesign UI v2 "Sân khấu và mảnh giấy"

Ngày: 2026-10-07. Trạng thái: **đã merge `master` (07/10, merge `b010c58`) và push; đã kiểm browser một phần.** Plan:
[2026-10-07-ui-redesign-v2.md](../plans/2026-10-07-ui-redesign-v2.md). Review Codex:
[UI-REDESIGN-V2-REVIEW.md](UI-REDESIGN-V2-REVIEW.md).

## Thay đổi và quyết định

- 8 màn theo luật mới trong `DESIGN.md` (Stage + paper slip): Bảng tin, Học bài (lộ trình
  25 bài), Chi tiết bài, Câu hỏi luyện tập, Kết quả (luyện và ôn), Ôn tập, Luyện tập, Tra cứu.
- Dùng chung: `web/src/components/PaperStage.tsx` (`Stage`, `PaperSlip`, `LinkRow`),
  `LessonSummary.cover`, helper `web/src/lib/today-sentence.ts` (+ test) cho "Câu hôm nay".
- Bảng tin theo SPEC-18 bản 2: chỉ tóm tắt; bỏ Kana, "Xem tiến độ", dữ liệu, giải thích
  Học/Luyện/Ôn, "Cần củng cố" (chuyển sang `/on-tap`).
- Quyết định coordinator: loa câu hỏi chỉ hiện **sau khi chấm** (không có metadata dạng
  câu cách đọc; trước đây lộ đáp án). Bong bóng câu hôm nay nằm dưới cảnh (chưa có dữ liệu
  vị trí nhân vật). Tra cứu giữ lưới 4 ô chữ Nhật (ngoại lệ ghi trong `DESIGN.md`).
- Kết quả Ôn tập (`ReviewRunner`) chuyển sang dùng `SessionResult`; logic lô/FSRS giữ nguyên.
- Bỏ nháp ở Luyện tập và Ôn tập cần xác nhận; chọn số câu dùng radio gốc.
- Không đổi: Dexie, FSRS, sync, chấm điểm, khóa nháp, URL/anchor, token màu, font.

## Kiểm chứng (07/10/2026, branch `ui-redesign-v2`)

- `pnpm check` PASS; `pnpm test` 268/268 PASS; `pnpm build` PASS (trước commit sửa nhỏ
  cuối `3cc72d3`, sau đó check/test chạy lại PASS).
- Browser dev `:3100` (worktree `../Japanese-ui`), dữ liệu seed IndexedDB + thao tác thật;
  390×844 và 1280×800, sáng/tối, cho cả 6 route; ảnh ở `D:/Projects/Lab/ui-v2-shots/`
  (`*-r2.png`, `r2-*.png` là sau sửa).
- Luồng: tiếp tục phiên luyện dở (đúng câu 2/15); xác nhận bỏ nháp (Esc giữ nháp); tạm
  dừng/tiếp tục; MC không có loa trước khi chấm, loa trong phản hồi sau chấm; Enter ở nút
  "Tiếp tục" chỉ sang 1 câu; hết phiên luyện → Kết quả mới; một lô ôn 19 mục → Kết quả ôn
  mới với "Ôn lô tiếp"; mất mạng trong phiên đã mở: 4 câu liên tiếp bằng phím 1/Enter vẫn chạy.
- Codex review lần 1 (6,5/10, 28 findings); các mục P0/P1 đã giao sửa và kiểm như trên.
  **Chưa có review Codex lần 2.**

## Còn lại và bước tiếp theo

- Khung phiên Ôn (`ReviewRunner`, phần câu hỏi) chưa đổi sang top bar/feedback mới; vẫn dùng
  chung `AnswerOption` nên gần giống, nhưng nên đồng bộ ở đợt sau.
- Chưa kiểm: reduced motion lúc chạy, 320px/zoom 200%, đủ năm dạng bằng bàn phím (đã thử MC
  và nghe), trạng thái quota/blocked/error bằng browser, nháp Ôn tập trên `/on-tap`, iOS/Android.
- Sau merge, `master` có đủ cover Bài 1–25; `FALLBACK_SCENE_COVER` trong `LessonGrid.tsx` chỉ còn là dự phòng.
- Sau merge trên `master`: check, 268 test và build đạt (07/10).
