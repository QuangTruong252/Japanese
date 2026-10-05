# Báo cáo Đánh giá Độc lập Minh họa & Dữ liệu Bài 8 (Lesson 8 Independent QA)

- **Task**: `task_73f2772e7bd3` (hiệu chỉnh từ `task_d8f07cf5adf8`) | **Dispatch**: `ctx_04669b94d64c` | **Worker**: `term_af5faca5-3a53-46d3-ae59-9fb020109bc4`
- **Coordinator**: `term_94f6a4b7-3970-4f4b-9a73-54bb3720a2a8`
- **Phạm vi**: Đánh giá độc lập 16 minh họa từ vựng từ 2 atlas (`lesson-08-objects-v1`, `lesson-08-adjectives-v1`), 1 cover scene (`adjective-town-v1`), và tích hợp dữ liệu học tập `web/src/data/n5/vocab/lesson-08.json`.

> [!NOTE]
> **Ghi chú Hiệu chỉnh Bằng chứng (Evidence Correction)**: Bản báo cáo trước đây nhầm lẫn đặt tiền tố SHA-256 của tệp master PNG vào cột WebP SHA256 (ví dụ: white-shirt `44b9347d...`, black-shoes `2e6ee5aa...`). Báo cáo này đã rà soát và cập nhật chính xác toàn bộ 17 tiền tố SHA-256 thực tế của các tệp `.webp` thành phẩm trong thư mục sản xuất (`web/public/assets/illustrations/`), đối chiếu và xác nhận khớp với trường `outputVerification.sha256` trong từng sidecar JSON.

---

## 1. Tóm tắt kết quả kiểm định

- **16 Vocab Cutouts**: Đạt chuẩn format WebP 512×512, kênh **true native alpha** nguyên vẹn, giải mã Sharp thành công, mã băm SHA-256 và dung lượng byte khớp với metadata sidecar JSON.
- **1 Cover Scene (`adjective-town-v1`)**: Đạt chuẩn WebP 800×600 (nguồn PNG 1448×1086), nền giấy ngà đục theo đúng quy ước SPEC-21 §4 cho scene, thể hiện trực quan các chi tiết ngữ nghĩa của bài tính từ.
- **Bảo toàn dữ liệu học**: File `web/src/data/n5/vocab/lesson-08.json` bảo toàn toàn bộ 53/53 từ vựng gốc, không đổi bất kỳ ID hay nội dung nào; 16 từ được bổ sung trường `illustration` trỏ đúng đường dẫn và alt tiếng Việt tương ứng. Cover bài trong `lesson-08.json` trỏ chính xác cover scene mới.

---

## 2. Bảng Đánh giá Chi tiết 16 Từ vựng & 1 Cover Scene

| Asset Stem | ID Từ vựng | Master PNG | WebP (Bytes / SHA256) | Nhận xét Thị giác & Ngữ nghĩa | Đánh giá |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **white-shirt-v1** | `shiroi` (trắng) | 443×447, Alpha | 17.826 B<br>`e1e83256...` | Áo sơ mi ngắn tay trắng có cổ, bóng màu nước nhẹ, không manocanh. | **PASS** |
| **black-shoes-v1** | `kuroi` (đen) | 444×447, Alpha | 22.526 B<br>`3bae82bb...` | Đôi giày da đen buộc dây màu than đậm, viền chỉ may rõ, không chân người. | **PASS** |
| **red-flower-v1** | `akai` (đỏ) | 443×447, Alpha | 24.964 B<br>`cea5b618...` | Bông hoa đỏ thắm (dạng hoa trà) có nhị vàng và lá xanh sage. | **PASS** |
| **blue-car-v1** | `aoi` (xanh lam) | 444×447, Alpha | 27.594 B<br>`ffc09f9e...` | Ô tô nhỏ màu xanh lam cobalt rõ rệt (khác xe đỏ bài 2), không logo/biển số. | **PASS** |
| **cherry-blossom-v1** | `sakura` (hoa anh đào) | 443×440, Alpha | 42.580 B<br>`d9d0b317...` | Cành hoa anh đào cánh hồng nhạt 5 cánh, có nụ hoa và cuống nâu. | **PASS** |
| **mountain-v1** | `yama` (núi) | 442×440, Alpha | 30.670 B<br>`1b7c7672...` | Ngọn núi Phú Sĩ đỉnh phủ tuyết trắng, chân núi rừng thông và hồ nước. | **PASS** |
| **town-v1** | `machi` (thị trấn) | 445×440, Alpha | 41.210 B<br>`a6202603...` | Góc phố thị trấn Nhật nhỏ, nhà tường cát mái ngói than, đèn đường, cây xanh. | **PASS** |
| **food-v1** | `tabemono` (thức ăn) | 444×440, Alpha | 29.328 B<br>`57ced59f...` | Khay cơm Nhật gồm bát cơm trắng, cá hồi nướng, canh miso, dưa góp, rau. | **PASS** |
| **large-bag-v1** | `ookii` (to, lớn) | 443×445, Alpha | 21.038 B<br>`e2402031...` | Vali du lịch lớn màu đỏ gạch, góc bịt đồng, quai xách chắc chắn. *(Xem mục 3)* | **PASS** |
| **small-bag-v1** | `chiisai` (nhỏ) | 444×445, Alpha | 20.418 B<br>`185a905b...` | Túi xách tay nhỏ màu đỏ đặt cạnh đôi giày đen để biểu thị kích thước nhỏ. | **PASS** |
| **new-laptop-v1** | `atarashii` (mới) | 443×445, Alpha | 22.982 B<br>`54a5ef7f...` | Laptop bạc mới tinh nguyên bề mặt đang mở khỏi hộp carton đóng gói. | **PASS** |
| **old-clock-v1** | `furui` (cũ) | 444×445, Alpha | 19.202 B<br>`f2cc65f4...` | Đồng hồ để bàn bằng gỗ cũ sờn màu, mặt vạch không số, viền kim loại mòn. | **PASS** |
| **hot-weather-v1** | `atsui` (nóng [thời tiết]) | 443×442, Alpha | 38.742 B<br>`de73971f...` | Nam sinh viên quạt tay, lau mồ hôi trán dưới ánh mặt trời mùa hè. | **PASS** |
| **cold-weather-v1** | `samui` (lạnh [thời tiết]) | 444×442, Alpha | 41.530 B<br>`103677d2...` | Nam sinh viên mặc áo khoác dày, quàng khăn đỏ, co ro trong hơi thở lạnh & tuyết. | **PASS** |
| **cold-water-v1** | `tsumetai` (lạnh [cảm giác/đồ]) | 443×442, Alpha | 23.786 B<br>`06233f32...` | Cốc thủy tinh trong suốt đựng nước đá, có đá viên và giọt nước ngưng tụ ngoài thành. | **PASS** |
| **delicious-food-v1** | `oishii` (ngon) | 444×442, Alpha | 35.330 B<br>`056b00e3...` | Nữ sinh viên nhắm mắt mỉm cười mãn nguyện thưởng thức đồ ăn bằng đũa. | **PASS** |
| **adjective-town-v1** | `cover` (ảnh bìa bài 8) | 1448×1086, Opaque | 146.816 B<br>`ecf0fb29...` | Cảnh 2 nhân vật dạo phố mùa xuân có hoa anh đào, núi tuyết xa, áo trắng & xe xanh. | **PASS** |

---

## 3. Phân tích Ngữ nghĩa Sư phạm & Phát hiện Kỹ thuật

1. **Phân biệt `samui` vs `tsumetai`**:
   - `samui` (lạnh do thời tiết/khí hậu) thể hiện bằng nhân vật co ro trong áo ấm mùa đông và bông tuyết.
   - `tsumetai` (lạnh do tiếp xúc/đồ vật) thể hiện bằng cốc nước đá có giọt đọng lạnh buốt.
   - Sự phân biệt này phản ánh rõ ràng sự khác biệt ngữ nghĩa N5 giữa nhiệt độ môi trường và cảm giác tiếp xúc thực tế.
2. **Sắc thái của `ookii` (`large-bag-v1`)**:
   - Trong quá trình hiệu chỉnh rãnh cắt tránh chạm biên, ô `large-bag-v1` không giữ lại đôi giày so sánh tỉ lệ; thay vào đó hình vẽ thể hiện một chiếc rương/vali du lịch lớn độc lập.
   - Đoán định: Tỉ lệ vali vững chắc, quai xách và góc bịt kim loại đủ để người học liên tưởng đến vật to lớn khi kết hợp với alt text ("Một chiếc vali lớn màu đỏ gạch"). Ô `small-bag-v1` đối ứng vẫn giữ đôi giày làm chuẩn tỉ lệ. Hỗ trợ học tập đạt yêu cầu.
3. **Chất lượng Nét vẽ & Alpha**:
   - Toàn bộ 16 cutout đều có viền cắt tự nhiên, không drop shadow, không viền caro giả.
   - Lỗ hở quai vali, gầm xe, khoảng giữa hai cánh tay đều giữ đúng kênh alpha trong suốt.
   - Không xuất hiện chữ, số (kể cả mặt đồng hồ), ký tự kanji hay logo thương hiệu.

---

## 4. Giới hạn Phạm vi Đánh giá

- Toàn bộ 16 master PNG, 1 cover master PNG, và 17 WebP đã được giải mã kỹ thuật và đối chiếu metadata sidecar.
- Phần chưa kiểm chứng: Hiển thị responsive trên thiết bị/trình duyệt thật (theo giới hạn nhiệm vụ read-only QA; root coordinator đã hoàn thành browser validation).
