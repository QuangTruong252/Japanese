# Minh họa phục vụ web

Quy ước có thẩm quyền: [SPEC-21](../../../../docs/specs/SPEC-21-illustration-assets.md).

Đặt file đã xuất cho web ở các nhóm `ui/banners`, `ui/states`, `ui/decor`, `scenes`, `vocab`, `grammar`. URL bắt đầu bằng `/assets/illustrations/`; không có `web/public` trong dữ liệu.

Đã xuất **9 ảnh pilot** ngày **05/10/2026**:

| File | URL | Kích thước | Bytes |
| --- | --- | --- | --- |
| [Banner](ui/banners/paper-town-v1.webp) | `/assets/illustrations/ui/banners/paper-town-v1.webp` | 1200 × 400 | 133.158 |
| [Giới thiệu bản thân](scenes/self-introduction-v1.webp) | `/assets/illustrations/scenes/self-introduction-v1.webp` | 800 × 600 | 82.502 |
| [Sách](vocab/book-v1.webp) | `/assets/illustrations/vocab/book-v1.webp` | 512 × 512 | 31.808 |
| [Vở](vocab/notebook-v1.webp) | `/assets/illustrations/vocab/notebook-v1.webp` | 512 × 512 | 25.420 |
| [Bút chì](vocab/pencil-v1.webp) | `/assets/illustrations/vocab/pencil-v1.webp` | 512 × 512 | 15.384 |
| [Ô](vocab/umbrella-v1.webp) | `/assets/illustrations/vocab/umbrella-v1.webp` | 512 × 512 | 27.364 |
| [Cặp](vocab/school-bag-v1.webp) | `/assets/illustrations/vocab/school-bag-v1.webp` | 512 × 512 | 32.548 |
| [これ／それ／あれ](grammar/kore-sore-are-v1.webp) | `/assets/illustrations/grammar/kore-sore-are-v1.webp` | 800 × 600 | 110.604 |
| [Đã ôn xong](ui/states/review-complete-v1.webp) | `/assets/illustrations/ui/states/review-complete-v1.webp` | 512 × 512 | 26.470 |

Banner/scene/grammar có nền giấy đục, không alpha; 5 ảnh từ vựng và state có alpha thật, thêm padding trong suốt thống nhất khi xuất. Banner/state trang trí dùng alt rỗng; cảnh học dùng alt theo ngữ cảnh. Tổng 5 ảnh từ vựng là **132.524 bytes**; toàn bộ 9 ảnh là **485.258 bytes**. Đây là số trên đĩa, không phải benchmark mạng; request responsive và cache đã kiểm local trong handoff SPEC-21. Tải theo màn/phiên học, không preload cả bộ.

Đã có schema/tham chiếu JSON và renderer dùng chung `Illustration`/`next/image`; cover Bài 1, vocab/grammar Bài 2 được tham chiếu trực tiếp, banner/state nằm ở UI tương ứng. Lazy mặc định, ưu tiên banner/cover đầu màn; 5 hình nghĩa chỉ mount trên flashcard sau reveal. Cache immutable cho URL `-vN.webp` trong prefix ảnh, đã kiểm server production local; cần giữ nguyên bytes và kiểm host triển khai thật. Bản gốc/prompt và mẫu phong cách lưu tại [artwork](../../../../artwork/illustrations/README.md), ngoài `public`; concept giữ ở `new-ui/`.
