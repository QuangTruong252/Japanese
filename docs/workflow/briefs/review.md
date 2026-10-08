# Brief review — <task-id>

Vai trò: **Review** · Agent: <khác agent Triển khai của task này> · Thư mục làm việc: `.work/<task-id>/`

## Đầu vào
- Brief triển khai: `.work/<task-id>/brief.md`; báo cáo: `.work/<task-id>/report.md`.
- Thay đổi: `git diff <base>` <hoặc danh sách file>.
- `AGENTS.md`, `DESIGN.md`; mockup `design/<màn>/mockup-vN.png` (nếu có).

## Kiểm
1. Đúng brief: phạm vi file, từng yêu cầu, hành vi phải giữ.
2. Đúng `DESIGN.md`: token màu, chữ, thành phần `PaperKit`, icon, luật chữ tối giản và chữ dài, accessibility.
3. Đúng `AGENTS.md`: Dexie/FSRS/furigana, không bịa tiếng Nhật, comment không trỏ tài liệu.
4. Lỗi logic, trường hợp biên, hồi quy; test có đủ cho logic mới không.

## Cấm
Sửa code; chạy `pnpm dev`/`pnpm build`; commit.

## Báo cáo → `.work/<task-id>/review.md`
Mỗi lỗi một mục: **mức** (Chặn / Nên sửa / Gợi ý) · `file:dòng` · vấn đề · cách tái hiện hoặc lý do ·
đề xuất sửa. Không có lỗi Chặn thì ghi rõ "Không có lỗi Chặn". Không liệt kê lời khen.
