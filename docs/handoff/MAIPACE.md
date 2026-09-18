# Handoff — MaiPace và ngữ cảnh coding agents

Ngày: 18/09/2026. Phạm vi: thương hiệu, hướng dẫn agent và tích hợp dashboard.
Trạng thái: đã cập nhật code/tài liệu, đang kiểm chứng.

## Thay đổi và quyết định

- MaiPace là sản phẩm, Washi là hệ thiết kế. Thông điệp đã chốt:
  “Học tiếng Nhật theo nhịp của bạn.” Quy chuẩn ở [PRODUCT.md](../../PRODUCT.md).
- [AGENTS.md](../../AGENTS.md) là nguồn chung. Claude import qua CLAUDE.md;
  Antigravity dùng rule luôn bật. Agent làm việc luân phiên, không tự commit
  hay điều phối agent khác. Xem [tooling](../agent-tooling.md).
- [Chỉ mục spec](../specs/README.md) phân biệt đặc tả/code/nghiệm thu và dẫn
  bằng chứng. Không nghiệm thu lại SPEC-01..05 trong đợt thương hiệu này.
- Dashboard thêm biểu tượng SVG + tên, tagline; metadata dùng MaiPace.
  Bỏ favicon mặc định và giới hạn zoom; giữ icon SVG từ bộ logo đã có.
- Không đổi route/API, tên repository, khóa lưu trữ, thuật toán hay dữ liệu học.
  Không sửa bộ SVG nguồn và các file public đã bị xóa từ trước. Không commit/push.

## Kiểm chứng

- Check/build, kiểm tra liên kết và browser: đang chạy, chưa kết luận.
- Phiên mới Codex: chưa kiểm chứng.
- Phiên mới Claude Code: chưa kiểm chứng.
- Phiên mới Antigravity: chưa kiểm chứng.

## Bước tiếp theo

Hoàn tất kiểm tra đợt thương hiệu. Khi tiếp tục feature, đối chiếu/nghiệm thu
SPEC-05, rồi SPEC-06 → SPEC-08 → SPEC-07 theo chỉ mục nếu người dùng không giao
ưu tiên khác. Những tài liệu lịch sử chỉ là bằng chứng của ngày ghi nhận.
