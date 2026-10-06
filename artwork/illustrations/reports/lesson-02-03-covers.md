# Báo cáo Minh họa Ảnh Bìa Bài 2 & Bài 3 (Lesson 2 & 3 Covers)

- **Ngày thực hiện**: 05/10/2026
- **Worker Terminal**: `term_c4d29469-e06b-40b6-84b4-5f4b1492430f`
- **Coordinator Terminal**: `term_9f8cc312-8cb8-420b-88ec-0a18cd20b138`
- **Task ID**: `task_b64af86a75aa`
- **Dispatch ID**: `ctx_5abcd96975b3`
- **Mô hình / Công cụ**: Antigravity (`image-generator` helper, Gemini 3.8 Flash High)
- **Tài liệu tham chiếu**: [STYLE.md](../STYLE.md), [SPEC-21](../../docs/specs/SPEC-21-illustration-assets.md), [paper-town-style-v1.png](../reference/paper-town-style-v1.png), [adjective-town-v1.json](../scenes/adjective-town-v1.json), [kore-sore-are-v1.json](../grammar/kore-sore-are-v1.json)
- **Trạng thái**: **Hoàn tất thành công (2/2 scene covers)**

---

## 1. Tóm tắt kết quả thực hiện

1. Đã sinh và xuất thành công **2 ảnh bìa scene tỷ lệ 4:3** cho Bài 2 và Bài 3:
   - `scenes/everyday-things-v1`: Ảnh bìa Bài 2 (*"kore wa nan desu ka"*), hai nhân vật tham chiếu trong góc phòng/tiệm sách nhỏ trao đổi về sách và sổ tay, xung quanh có máy ảnh, ô, từ điển, cặp sách.
   - `scenes/department-store-v1`: Ảnh bìa Bài 3 (*địa điểm/mua sắm*), tầng trung tâm thương mại Nhật Bản thanh lịch có thang cuốn, quầy trưng bày, nhân viên hướng dẫn hai nhân vật tham chiếu.
2. Cả 2 ảnh đều là **cảnh đục (opaque)** trên nền giấy ngà ấm, không cần độ trong suốt alpha (khác với nhóm từ vựng cutout), đúng chuẩn quy định tại SPEC-21 §4 cho Scene (800 × 600).
3. Đã tạo đầy đủ các tệp master PNG và sidecar JSON tại `artwork/illustrations/scenes/`, cùng các tệp WebP thành phẩm tại `web/public/assets/illustrations/scenes/`.
4. Toàn bộ thông số kỹ thuật (bytes, SHA-256, kích thước, định dạng, kênh màu) đã được xác thực tự động bằng Sharp và script Node.js kiểm thử độc lập. Không chạm vào mã nguồn ứng dụng `web/src/**` (chờ Coordinator tích hợp dữ liệu học).

---

## 2. Bảng đối chiếu chi tiết 2 Asset

| Asset Stem | Nhóm / Vai trò | Target Data | Số lần thử | Thời gian sinh | Master PNG | WebP (Bytes / SHA256) | Đánh giá |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **everyday-things-v1** | `scenes`<br>`lesson-cover` | `lesson-02.json`<br>`field: cover` | 1 lượt | 57.000 ms | 1200×896 PNG<br>2.093.396 B | 800×600 WebP<br>64.458 B<br>`f988c28a...` | **PASS** |
| **department-store-v1** | `scenes`<br>`lesson-cover` | `lesson-03.json`<br>`field: cover` | 1 lượt | 79.000 ms | 1200×896 PNG<br>2.137.854 B | 800×600 WebP<br>74.052 B<br>`e5cfc239...` | **PASS** |

### Chi tiết SHA-256 đầy đủ:
- `everyday-things-v1.webp`: `f988c28a23b37bd5de8b44928fe18843177fd0729e0723a461038864db33f78f`
- `department-store-v1.webp`: `e5cfc239e84f5c318bfbea93d5fb37b52716311d6e9212734d0d1c71eebe409e`

---

## 3. Thẩm định thị giác & Tiêu chuẩn Phố giấy

### 3.1. `scenes/everyday-things-v1`
- **Tạo hình nhân vật**:
  - Nam sinh viên: tóc tối ngắn hơi rối, áo dài tay màu ngà, quần than tối, ba lô học sinh trên lưng; tay cầm cuốn sổ xoắn ốc bìa trơn; ngũ quan và 5 ngón tay tự nhiên.
  - Nữ sinh viên: tóc bob ngắn có mái ngang, áo cardigan kem bên ngoài áo đỏ gạch, váy dài màu than; tay cầm cuốn sách mở và ngón trỏ chỉ vào trang sách thể hiện sự tò mò/hỏi han; giải phẫu tay và khuôn mặt tự nhiên.
- **Đồ vật ngữ cảnh N5 Bài 2**:
  - Máy ảnh da có dây đeo đặt trên kệ gỗ bên trái.
  - Chiếc ô gấp màu xanh sage dựng cạnh góc ghế.
  - Cuốn từ điển dày bìa trơn đặt trên ghế gỗ tiền cảnh.
  - Cặp học sinh màu than đặt trên ghế bên phải.
  - Các kệ sách phía sau chứa sách bìa trơn không chữ.
- **Ràng buộc tiêu cực (Hard Negatives)**:
  - Tuyệt đối không có bất kỳ chữ viết, chữ cái Latin, chữ kanji, kana, số hay ký hiệu nào trên trang sách, bìa sách, nhãn mác.
  - Không logo, không watermark, không giao diện UI, không bong bóng thoại.
  - Nền giấy ngà ấm đục hoàn toàn, không có họa tiết ô cờ bàn cờ giả lập.

### 3.2. `scenes/department-store-v1`
- **Bối cảnh & Không gian N5 Bài 3**:
  - Tầng bách hóa Nhật Bản rộng rãi, thanh lịch, sàn gỗ và cột gỗ ấm áp.
  - Thang cuốn (escalator) ở hậu cảnh dẫn lên tầng trên với đường nét kiến trúc gọn gàng, tay vịn kính sạch sẽ, không có biển chỉ dẫn hay mũi tên chữ.
  - Quầy tủ kính trưng bày quần áo gấp, áo sơ mi, và kệ kính bày các chai lọ mỹ phẩm/rượu với nhãn trơn không chữ.
- **Tạo hình nhân vật & Nhân viên**:
  - Hai nhân vật chính (nam và nữ) giữ đúng tạo hình chuẩn Phố giấy như mẫu tham chiếu.
  - Nhân viên bách hóa: Nữ nhân viên mặc đồng phục vest và chân váy sẫm màu lịch sự, áo sơ mi trắng có cổ, bảng tên trắng trơn không chữ, cử chỉ tay mở nhã nhặn hướng dẫn hai vị khách.
- **Ràng buộc tiêu cực (Hard Negatives)**:
  - Hoàn toàn không có biển báo tầng, biển chỉ dẫn, bảng giá, số tầng, chữ kanji/kana hay logo thương hiệu.
  - Không xuất hiện họa tiết ô cờ giả alpha; toàn bộ khung hình phủ màu nước và gouache mịn màng trên nền giấy ngà ấm.

---

## 4. Độ lệch so với mẫu tham chiếu & Giới hạn kỹ thuật

1. **Phương thức nạp mẫu tham chiếu (Multimodal Reference)**:
   - Tool `generate_image` bên trong helper `image-generator` của Antigravity chỉ nhận chuỗi prompt văn bản và tham số tỉ lệ khung hình (AspectRatio), không hỗ trợ tham số nạp tệp nhị phân ảnh trực tiếp (`referenceImages: []`).
   - Khắc phục: Đã chuyển toàn bộ các thuộc tính then chốt của `paper-town-style-v1.png` (bảng màu ivory/sand/charcoal/sage/brick-red, chất liệu màu nước/gouache/chì tối, tạo hình chi tiết của 2 nhân vật, hạt giấy nhẹ trong nét vẽ) thành mô tả prompt tường minh, chi tiết cao. Kết quả đạt được sự thống nhất thị giác xuất sắc với các asset trước đó (`adjective-town-v1`, `kore-sore-are-v1`).
2. **Quy trình xử lý ảnh**:
   - Ảnh tạo từ mô hình có định dạng gốc là JPEG 1200×896 (tỷ lệ xấp xỉ 1.339:1 ~ 4:3).
   - Sharp mã hóa lossless thành Master PNG tại `artwork/illustrations/scenes/`, sau đó resize cover trung tâm về chuẩn 800×600 WebP (quality 82, effort 6) lưu tại `web/public/assets/illustrations/scenes/`. Cờ `wx` bảo đảm không ghi đè bất kỳ file nào sẵn có.
3. **Giới hạn trách nhiệm**:
   - Worker chỉ sở hữu các file PNG/JSON trong `artwork/illustrations/scenes/`, file WebP trong `web/public/assets/illustrations/scenes/`, và báo cáo này.
   - Việc tích hợp trường `cover` vào `web/src/data/n5/lessons/lesson-02.json` và `lesson-03.json` thuộc phạm vi điều phối của Coordinator.
