# Brief triển khai — <task-id>

Vai trò: **Triển khai** · Agent: <agent/model> · Thư mục làm việc: `.work/<task-id>/`

## Mục tiêu
<1–3 câu: thay đổi gì, vì sao.>

## Đọc trước
- `AGENTS.md`; `DESIGN.md` §<mục liên quan>.
- Mockup đã duyệt: `design/<màn>/mockup-vN.png` (nếu có).
- Code mẫu: `web/src/components/DashboardContent.tsx`, `PaperKit.tsx` <hoặc file khác>.

## Phạm vi file
- Được sửa: <danh sách đường dẫn>
- Được tạo: <danh sách hoặc "không">
- Mọi file khác: không đụng.

## Hành vi phải giữ
<Từ bước khảo sát: link, trạng thái (mới/bình thường/nhiều việc/xong/đang tải/lỗi), dữ liệu hiển thị,
hook đang dùng. Giữ nguyên trừ khi mục Yêu cầu nói khác.>

## Yêu cầu
1. <yêu cầu cụ thể, kiểm được>
2. <…>

## Dữ liệu tiếng Nhật
<Đường dẫn file trong `web/src/data/n5/` và câu/từ được dùng.> Không tự viết tiếng Nhật.

## Cấm
- Chạy `pnpm dev`, `pnpm build`; `git commit`/`push`.
- Sửa ngoài phạm vi file; thêm dependency <trừ khi ghi ở đây>.
- Comment trỏ tới tài liệu (`SPEC-xx`, `docs/...`).

## Nghiệm thu
- [ ] `pnpm check` pass.
- [ ] `pnpm test` pass (khi đổi logic; thêm test hồi quy cho logic mới).
- [ ] <tiêu chí riêng của task>

## Báo cáo → `.work/<task-id>/report.md`
File đã đổi · lệnh đã chạy và kết quả · chỗ lệch so với brief và lý do · việc chưa làm hoặc chưa chắc.
