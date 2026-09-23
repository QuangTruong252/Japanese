# Washi — hướng dẫn đọc hệ thiết kế

> **Mã tài liệu:** DS-JPN-01 · **Cập nhật:** 22/09/2026
> **Đây không phải nguồn sự thật thiết kế.** Hợp đồng thiết kế toàn cục nằm ở
> [`DESIGN.md`](../DESIGN.md); giá trị token lúc chạy nằm ở
> [`web/src/app/globals.css`](../web/src/app/globals.css).
> Trang này chỉ giúp người Việt đọc và dùng hai file đó cho đúng.

Trước 22/09/2026 file này chép lại toàn bộ bảng màu, thang chữ, khoảng cách, bo góc,
breakpoint và hợp đồng component. Bản sao đó đã được gỡ vì nó lệch khỏi `DESIGN.md` và
khiến agent dựng sai giao diện. Không khôi phục các bảng đó ở đây.

## Nguồn sự thật

| Cần gì | Đọc ở đâu |
|---|---|
| Mục tiêu sản phẩm, người dùng, phạm vi | [`PRODUCT.md`](../PRODUCT.md) |
| Hợp đồng UX + thị giác toàn cục | [`DESIGN.md`](../DESIGN.md) |
| Giá trị token lúc chạy (màu, radius, font, `.jp-*`) | [`web/src/app/globals.css`](../web/src/app/globals.css) |
| Yêu cầu từng màn hình, bố cục chi tiết, prompt Stitch | [`docs/specs/SPEC-xx.md`](specs/README.md) |
| Bằng chứng nghiệm thu, có ngày | [`docs/handoff/SPEC-xx.md`](handoff/) |
| Quy ước làm việc của agent, lệnh kiểm tra | [`AGENTS.md`](../AGENTS.md) |

Hai luật phân định:

1. **Giá trị thô ở `globals.css`, ý nghĩa sử dụng ở `DESIGN.md`.** Cần biết `primary` là mã
   màu gì thì đọc stylesheet; cần biết khi nào được dùng `primary` thì đọc `DESIGN.md`.
2. **Luật toàn cục ở `DESIGN.md`, quyết định từng màn ở SPEC.** SPEC được nói rõ hơn cho màn
   của nó, nhưng không được âm thầm nói ngược `DESIGN.md`.

## Trong `DESIGN.md` có gì

| Mục | Trả lời câu hỏi |
|---|---|
| Principles | Năm nguyên tắc dùng để phân xử khi tranh cãi |
| Color | Token nào mang nghĩa gì, luật màu trạng thái, luật biểu đồ, cấm màu bảng Tailwind |
| Typography | Bậc chữ Latin, bậc chữ Nhật `.jp-*`, luật furigana |
| Spacing and touch targets | Bước khoảng cách, ngưỡng vùng chạm 48px |
| Layout and containers | Ba khuôn bề rộng `content-narrow` / `content-default` / `content-wide` |
| Responsive | Trách nhiệm của từng tầng base · `sm` · `md` · `lg`, và luật ưu tiên CSS |
| Navigation | Năm khu vực chính, Cài đặt là mục phụ, vỏ desktop đổi từ `lg` |
| Surfaces and elevation | Bốn loại bề mặt: thẻ thường, nổi, lớp phủ, nav nổi |
| Motion · Interaction states | Thời lượng chuyển động, sáu trạng thái bắt buộc |
| Components | Hợp đồng từng pattern **và bảng ánh xạ sang file code** |
| Stitch and AI visual tools | Công cụ AI được phép và không được phép quyết định gì |

Phần YAML đầu `DESIGN.md` là **bản máy đọc được** cho Stitch, không phải nguồn token độc
lập. Khi nó lệch với `globals.css` thì stylesheet đúng, và phần YAML là chỗ cần sửa.

## Quy trình một màn hình mới

```
PRODUCT.md
  → viết UX vào SPEC §1–§9          → bạn duyệt
  → viết prompt vào SPEC §10        → Stitch dựng phương án
  → bạn duyệt phương án
  → agent ghi quyết định về SPEC (và về DESIGN.md nếu luật toàn cục đổi)
  → coding agent triển khai         → review → docs/handoff/SPEC-xx.md
```

Stitch chỉ khám phá hình. Kết quả Stitch **không** phải quyết định cho tới khi bạn duyệt và
agent ghi ngược về SPEC. Ba ràng buộc bắt buộc khi nhờ công cụ AI dựng màn hình nằm ở
`DESIGN.md` §Stitch and AI visual tools. **Không** dùng file export của Stitch để ghi đè
`globals.css`: bản export đổi màu về hex, bỏ chế độ tối, và mất lớp `@theme inline`.

## Checklist trước khi ghép một màn hình mới

- [ ] Mọi màu lấy từ token ngữ nghĩa; không có mã hex và không có màu bảng Tailwind trong component.
- [ ] Chữ tiếng Nhật đã bọc class `jp` và dùng đúng bậc `.jp-*`.
- [ ] Nút trong luồng làm bài dùng `size="quiz"` và đạt tối thiểu 48px.
- [ ] Mỗi phần tử bấm được có đủ sáu trạng thái; vòng focus còn nguyên.
- [ ] Màu trạng thái luôn đi kèm icon Lucide và nhãn chữ.
- [ ] Đúng một nút nền `primary` trên mỗi màn hình.
- [ ] Bề mặt chọn đúng một trong bốn loại; thẻ thường không đổ bóng, không blur.
- [ ] Bề rộng khớp một trong ba khuôn `content-*`, và SPEC có ghi lựa chọn đó.
- [ ] Trang nằm dưới nav nổi đã chừa khoảng trống đáy theo vỏ ứng dụng, không tự đặt thêm.
- [ ] Hoạt ảnh nằm trong `prefers-reduced-motion`; không có hiệu ứng lặp vô hạn để gây chú ý.
- [ ] Đã xem ở 390px và 1280px, ở cả chế độ sáng và tối.
- [ ] Component tái sử dụng lấy từ bảng ánh xạ trong `DESIGN.md` §Components; component mới
      đã được thêm vào bảng đó trong cùng thay đổi.
