# Brief ảnh / icon — <task-id>

Vai trò: **Thiết kế** · Agent: <cần công cụ tạo ảnh> · Thư mục làm việc: `.work/<task-id>/`

## Loại
<Ảnh minh họa (`artwork/illustrations/`) | Icon (`artwork/icons/`)>

## Danh sách
| Tên file (`<subject>-vN`) | Nội dung | Nhóm | Dùng ở đâu |
|---|---|---|---|
| <…> | <…> | <vocab / scenes / grammar / ui/...> | <màn, dữ liệu> |

## Quy trình
- Ảnh minh họa: `artwork/illustrations/README.md` (batch JSON → prompt → tạo ảnh → collect → check →
  export → sheet). Phong cách: `artwork/illustrations/STYLE.md` + ảnh mẫu trong `reference/`.
- Icon: `artwork/icons/README.md` (atlas → `node build.js` → so cạnh Lucide 24 px trên nền sáng/tối).

## Ràng buộc
<Khung, alpha, ngân sách dung lượng, không chữ trong ảnh, không sửa bytes của file `-vN` đã dùng.>

## Nghiệm thu
- [ ] `batch.mjs check` pass <hoặc độ đậm icon đo được trong ngưỡng>.
- [ ] Tự xem ảnh xuất (sheet sáng/tối); không chữ, không nền giả, đúng phong cách.

## Báo cáo → `.work/<task-id>/report.md`
File đã tạo · dung lượng · prompt · điểm chưa đạt. Không commit.
