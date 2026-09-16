# Đặc tả theo feature

Bộ spec chi tiết từng feature, tách từ `docs/project-design-spec.md` (SPEC-JPN-01) để bàn
giao được cho Google Stitch / Claude Design.

## Đợt 1 — đã viết

| Spec | Feature | Bàn giao thiết kế |
|---|---|---|
| [SPEC-01](SPEC-01-du-lieu-va-sinh-cau-hoi.md) | Dữ liệu bài học & sinh câu hỏi | Không — hợp đồng dữ liệu |
| [SPEC-02](SPEC-02-shell-dieu-huong.md) | Shell điều hướng & trạng thái toàn cục | Có |
| [SPEC-03](SPEC-03-man-hoc.md) | Màn Học (danh sách + chi tiết bài) | Có |
| [SPEC-04](SPEC-04-luyen-tap.md) | Luyện tập: khung phiên + 5 dạng bài | Có |
| [SPEC-05](SPEC-05-on-tap.md) | Ôn tập hôm nay, kết quả & điểm yếu | Có |

Thứ tự build: SPEC-01 → SPEC-02 + SPEC-03 → SPEC-04 → SPEC-05.
SPEC-01 chặn cả bốn spec còn lại.

## Đợt 2 — viết khi bắt đầu, không viết trước

F06 Cài đặt + Export/Import JSON · F07 Thống kê & biểu đồ · F08 Đồng bộ Supabase ·
F09 Audio ZIP đĩa CD · F10 Shadowing Player · F11 Nội dung N4 (bài 26–50).

> F11 không phải phase code. Không tồn tại nguồn dữ liệu N4 trong repo — đó là việc soạn
> nội dung từ đầu, khối lượng tương đương toàn bộ dữ liệu N5.

## Khuôn chung

Mọi spec có giao diện theo đúng 10 mục; mục 3–6 là phần công cụ thiết kế đọc:

1. Mục tiêu & phạm vi (mục "Ngoài phạm vi" là **bắt buộc**)
2. Dữ liệu · 3. Màn hình & bố cục · 4. Component dùng lại · 5. Trạng thái
6. Tương tác & chuyển động · 7. Accessibility · 8. Bảo mật & dữ liệu
9. Tiêu chí nghiệm thu · 10. Khối lệnh bàn giao thiết kế

SPEC-01 là ngoại lệ — không có màn hình nên không có mục 3–7 và mục 10.

## Nguồn tham chiếu

| Tệp | Vai trò |
|---|---|
| `web/DESIGN.md` | Hợp đồng token máy đọc được — **nạp file này vào công cụ AI** |
| `docs/design-system.md` | Lý do thiết kế, khuôn mẫu màn hình, luật biểu đồ, checklist |
| `web/src/app/globals.css` | Bản thi hành lúc chạy (OKLCH, chế độ tối, `@theme inline`) |
| `docs/project-design-spec.md` | Đặc tả hệ thống gốc |

**Không** dùng file Stitch export để ghi đè `globals.css` — bản export đổi màu về hex, bỏ
chế độ tối, mất lớp `@theme inline`.
