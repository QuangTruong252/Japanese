# Điều hướng MaiPace — 27/10/2026

G1: người dùng duyệt nhóm điều hướng tổng thể và cặp màn mobile tách danh mục/cấu hình. Chưa có G2 cho kết quả triển khai.

| Mockup | Vai trò |
|---|---|
| [Home desktop](mockup-home-pc.png) | Hôm nay, cách luyện cố định, sidebar có shortcut và tiện ích rõ tên. |
| [Home mobile](mockup-home-mobile.png) | Hành động chính, ôn đến hạn, bốn lối luyện. |
| [Danh mục Luyện tập mobile](mockup-practice-hub-mobile.png) | Chỉ phương thức luyện và nháp, không có cấu hình bài tập phía dưới. |
| [Cấu hình Bài tập mobile](mockup-exercise-config-mobile.png) | Quay lại Luyện tập, phạm vi, loại câu hỏi, số câu, Bắt đầu. |
| [Cấu hình desktop](mockup-exercise-config-pc.png) | Tham chiếu bố cục hai cột; danh mục phương thức trên cùng được thay bằng shortcut sidebar trong hướng tách màn. |

Đây là ảnh concept ImageGen đã được duyệt về hướng; triển khai dùng token, font, icon và dữ liệu thật. Các số câu/nháp trong mockup là mẫu, không thay cho logic khả dụng hoặc cơ chế bảo vệ nháp. Các thẻ ôn viết vẫn có lịch riêng.

Routes: `/luyen-tap` là danh mục; `/luyen-tap/bai-tap` là cấu hình. Link cũ có `lessons` hoặc `type` được chuyển phía client, giữ tham số; hub vẫn prerender để có thể tải sẵn khi online. Hội thoại có điểm chọn bài `/luyen-tap/hoi-thoai`, sau đó vào tab và route hội thoại hiện có.

Chi tiết nháp thiết kế, prompt và QA thô ở `.work/20261027-navigation-ia/` và `.ui-qa/navigation-v3/` (git bỏ qua).

## Ảnh triển khai để review G2

Chrome, profile QA riêng, trạng thái normal; mobile390×844, PC1280×800. File là screenshot nguyên bản, không chỉnh ảnh. Tiến độ/số liệu là seed QA.

| Màn | Mobile sáng / tối | PC sáng / tối |
|---|---|---|
| Hôm nay | [Sáng](as-built-home-mobile-light.png) · [Tối](as-built-home-mobile-dark.png) | [Sáng](as-built-home-pc-light.png) · [Tối](as-built-home-pc-dark.png) |
| Danh mục Luyện tập | [Sáng](as-built-practice-hub-mobile-light.png) · [Tối](as-built-practice-hub-mobile-dark.png) | [Sáng](as-built-practice-hub-pc-light.png) · [Tối](as-built-practice-hub-pc-dark.png) |
| Cấu hình Bài tập | [Sáng](as-built-exercise-config-mobile-light.png) · [Tối](as-built-exercise-config-mobile-dark.png) | [Sáng](as-built-exercise-config-pc-light.png) · [Tối](as-built-exercise-config-pc-dark.png) |

Đã kiểm thêm360/768/1024px, nháp, empty, done, keyboard, furigana1.5 và hai bước điều hướng production offline. Không overflow ngang trong30ảnh matrix. CTA cấu hình48px nằm trên dock ở360/390px với mẫu normal; câu dài hoặc nháp có thể cần cuộn dọc. Chưa kiểm trên thiết bị thật hoặc mô phỏng lỗi IndexedDB.
