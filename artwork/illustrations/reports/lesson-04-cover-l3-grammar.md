# Báo cáo Tạo Minh họa & Đánh giá Độc lập: Lesson 4 Cover & Lesson 3 Grammar

- **Ngày thực hiện**: 2026-10-05
- **Task ID**: `task_12c5eb44150f` | **Dispatch ID**: `ctx_48eaf4d7c147`
- **Worker Terminal**: `term_667b3d98-cd0c-4ae0-8926-4900414e5314`
- **Coordinator Terminal**: `term_9f8cc312-8cb8-420b-88ec-0a18cd20b138`
- **Công cụ sinh ảnh**: Subagent `image-generator` kế thừa mô hình `Gemini 3.8 Flash (High)` (nguồn metadata: `antigravity-generate_image`).
- **Trạng thái**: **Hoàn tất thành công (2/2 assets đạt chuẩn ngay lần sinh đầu tiên)**

---

## 1. Tóm tắt kết quả

- Đã tạo thành công **2 minh họa cảnh 4:3 (opaque scenes)** mới theo phong cách "Phố giấy":
  1. `scenes/daily-routine-v1`: Ảnh bìa Bài 4 (thời gian & sinh hoạt hàng ngày).
  2. `grammar/koko-soko-asoko-v1`: Minh họa ngữ pháp Bài 3 giải thích 3 khoảng cách chỉ vị trí (*koko* / *soko* / *asoko*).
- Cả 2 asset đều đạt chuẩn format **WebP 800×600** (nguồn 1200×896 ~4:3, resize `cover`, position `centre`, quality 82, effort 6), lưu tại `web/public/assets/illustrations/`.
- Cả 2 master PNG được re-encode lossless từ JPEG gốc bằng `sharp` 0.35.4 và lưu kèm sidecar JSON đầy đủ provenance tại `artwork/illustrations/`.
- Không ghi đè bất kỳ file hiện có nào (sử dụng cờ ghi file độc quyền `wx`). Không chỉnh sửa các file thuộc dữ liệu học tập `web/src/**` (chờ coordinator tích hợp).

---

## 2. Chi tiết 2 tài nguyên sản xuất

| Asset Stem | Nhóm & Vai trò | Target Dữ liệu | Số lượt thử | Thời gian sinh | Master PNG | WebP (Bytes / SHA-256) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: |
| **daily-routine-v1** | `scenes`<br>*(lesson-cover)* | `lesson-04.json`<br>`field: cover` | 1 | ~17.000 ms | 1200×896, Opaque<br>2.345.676 B | 102.782 B<br>`f86a8e1e8fa5d68e4a6480f458e331f5247be3beef647dac3107720f48a66f31` | **PASS** |
| **koko-soko-asoko-v1** | `grammar`<br>*(grammar)* | `lesson-03.json`<br>`id: koko-soko-asoko` | 1 | ~25.000 ms | 1200×896, Opaque<br>2.077.734 B | 74.014 B<br>`4bcb1df7142026db7fccce4924f1cb024c59221190fcf8eabe54ecdbd0c91a10` | **PASS** |

---

## 3. Kiểm định Thị giác & Ngữ nghĩa Sư phạm

### 3.1. `scenes/daily-routine-v1` (Bìa Bài 4 — Thời gian & Sinh hoạt)
- **Bố cục & Ánh sáng**: Khung cảnh góc phố thị trấn Nhật Bản buổi sáng yên ả, ánh nắng ban mai rọi xiên tạo bóng đổ nhẹ nhàng trên mặt đường lát đá.
- **Nhân vật**:
  - Nam sinh viên: tóc ngắn đen hơi rối, áo dài tay màu ngà/kem form rộng, quần than xắn gấu, ba lô tối, giày thể thao đen đế trắng.
  - Nữ sinh viên: tóc bob ngắn ngang cằm có mái, áo khoác cardigan màu kem bên ngoài áo đỏ gạch, váy midi màu than, túi đeo chéo nâu, vớ trắng giày đen.
  - Cả hai bước đi thong thả cùng chiều, biểu cảm tự nhiên, tay chân và khuôn mặt vẽ chuẩn xác.
- **Chi tiết trọng tâm sư phạm**: Chiếc đồng hồ tròn treo tường lớn gắn trên tường mặt tiền bên phải con phố. Mặt đồng hồ thể hiện rõ hai kim giờ và phút chỉ giờ sáng, viền vạch phân chia tinh tế, **hoàn toàn không có chữ số (không chữ số Ả Rập, không số La Mã)**.
- **Tuân thủ Negative**: Biển hiệu cửa hàng hình chữ nhật, rèm noren treo trước quán đều là mảng trơn hoàn toàn; không xuất hiện bất kỳ chữ kana, kanji, chữ Latinh, logo hay watermark nào.

### 3.2. `grammar/koko-soko-asoko-v1` (Ngữ pháp Bài 3 — *koko / soko / asoko*)
- **Bố cục & Staging 3 khoảng cách**:
  - **Koko (đây, gần người nói)**: Ở tiền cảnh bên trái (*foreground left*), nhân vật nữ (người nói) đứng thẳng và cúi nhẹ chỉ tay rõ ràng xuống vị trí sàn đá ngay sát chân mình.
  - **Soko (đó, gần người nghe)**: Ở trung cảnh (*middle ground center*), nam sinh viên (người nghe) đứng lắng nghe cạnh chiếc ghế sô pha dài trong sảnh.
  - **Asoko (kia, xa cả hai)**: Ở hậu cảnh xa (*far background center-right*), cuối hành lang sảnh mở rộng là cửa thang máy đóng kín bằng kim loại màu xám, tạo cảm giác khoảng cách không gian rất xa hai người.
- **Phong cách & Kiến trúc**: Nội thất sảnh tòa nhà mang nét tối giản Nhật Bản với tường màu cát/ngà ấm, ốp viền gỗ tự nhiên, chậu cây cảnh xanh sage ở tiền cảnh và góc tường giúp tạo chiều sâu thị giác.
- **Tuân thủ Negative**: Bảng hiển thị tầng trên cửa thang máy là mảng chữ nhật tối trống trơn (không số tầng); nút bấm gọi thang máy chỉ là hai chấm nhỏ không số/ký hiệu; sàn nhà và tường không có vạch kẻ mũi tên, nhãn chữ hay bong bóng thoại.

---

## 4. Độ lệch so với Mẫu Phong cách (Deviations from Style Reference)

- **Tính nhất quán**: Cả 2 ảnh đều bám sát mẫu `paper-town-style-v1.png` về chất liệu (màu nước/gouache, nét chì đen mảnh mềm mại, hạt giấy mịn xuất hiện bên trong các mảng màu), bảng màu (ngà, cát, than, xanh sage, điểm xuyết đỏ gạch ấm).
- **Độ lệch nhỏ ghi nhận**:
  - Nền sảnh trong `koko-soko-asoko-v1` là không gian nội thất (lobby) thay vì ngoại cảnh đường phố như mẫu gốc, tuy nhiên chất liệu vật liệu (tường vữa ấm, gỗ nâu sáng, chậu cây lá xanh) vẫn giữ trọn vẹn tinh thần Phố giấy.
  - Tỉ lệ khung hình đầu ra từ mô hình là 1200×896 (~1.339), chênh lệch 0.44% so với tỉ lệ 4:3 chuẩn (1.333). Khi chuyển đổi sang WebP 800×600 qua Sharp với `fit: 'cover', position: 'centre'`, việc crop viền biên là không đáng kể và không làm suy suyển bất kỳ chủ thể nào.

---

## 5. Giới hạn & Khuyến nghị Điều phối

- **Giới hạn kỹ thuật**: Mô hình sinh ảnh gốc xuất định dạng JPEG sRGB 1200×896. File master PNG được tạo qua quá trình re-encode không nén (lossless) từ JPEG gốc nhằm phục vụ lưu trữ master đồng bộ theo quy chuẩn repo.
- **Kiểm định file**: Đã đối chiếu kích thước pixels (800×600), định dạng WebP, dung lượng byte và mã băm SHA-256 thực tế với sidecar JSON. Cả 2 file đều giải mã Sharp thành công không lỗi.
- **Bước tiếp theo (Coordinator)**:
  - Tích hợp `cover` vào `web/src/data/n5/lessons/lesson-04.json` trỏ tới `/assets/illustrations/scenes/daily-routine-v1.webp`.
  - Tích hợp `illustration` vào điểm ngữ pháp `koko-soko-asoko` trong `web/src/data/n5/lessons/lesson-03.json` trỏ tới `/assets/illustrations/grammar/koko-soko-asoko-v1.webp`, đồng thời bổ sung `illustrationCaption` tương ứng.
