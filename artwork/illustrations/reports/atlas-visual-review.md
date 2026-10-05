# Đánh giá Thị giác Atlas 8 Minh họa Mới (Atlas Visual QA)

- **Task**: `task_569737f03d53` | **Dispatch**: `ctx_1906b29cf025` | **Worker**: `term_af5faca5-3a53-46d3-ae59-9fb020109bc4`
- **Phạm vi**: QA độc lập nguồn atlas `everyday-objects-v1.png` (4×2), script `export-atlas.mjs`, 8 master PNG, 8 WebP xuất và tích hợp Bài 2.

---

## 1. Nguồn Atlas & Viền Rãnh Trong Suốt
- **Atlas**: `everyday-objects-v1.png` (1774 × 887 px, PNG 4 kênh, `hasAlpha: true`). Thời gian sinh: 46.539s.
- **Viền rãnh (Gutters)**: Sharp quét toàn bộ 4 cạnh (Top/Bottom/Left/Right) của cả 8 khung crop trong manifest. Kết quả: 100% pixel viền biên đều có alpha = 0. Không lem mực, không chạm viền.

---

## 2. Kiểm định Thị giác 8 Đối tượng (Per-Asset Findings)
Đã xem trực tiếp qua trình xem ảnh nội bộ 8 master PNG và 8 WebP:
1. **compact-disc-v1 (`cd`)** (443×453 -> 512×512, 29.288 B): Đĩa CD bạc ánh cầu vồng, vòng đồng tâm rõ, lỗ tâm có alpha trong suốt. Không chữ/hộp. (PASS)
2. **television-v1 (`terebi`)** (444×453 -> 512×512, 26.768 B): Ti vi màn phẳng than góc 3/4 trên đế thấp. Màn hình xám nhạt hoàn toàn trống. Không remote/logo. (PASS)
3. **radio-v1 (`rajio`)** (443×453 -> 512×512, 35.250 B): Radio kem/than, quai xách có khe alpha sạch, lưới loa, 2 núm tròn, dải sóng không số, ăng ten nguyên vẹn. (PASS)
4. **laptop-v1 (`konpyuutaa`)** (444×453 -> 512×512, 27.644 B): Laptop mở góc 3/4 màu than/bạc, màn hình ngà trống, phím không ký tự, có bàn rê chuột. Không logo. (PASS)
5. **car-v1 (`kuruma`)** (500×434 -> 512×512, 29.544 B): Ô tô 5 cửa màu đỏ gạch góc 3/4, thấy rõ 2 bánh xe hông, biển số chữ nhật ngà để trống. Không logo. (PASS)
6. **chocolate-bar-v1 (`chokoreeto`)** (400×434 -> 512×512, 26.352 B): Thanh sô-cô-la nâu chia ô nổi, nửa trên bóc giấy bạc nhăn, nửa dưới bọc giấy đỏ trơn không chữ. (PASS)
7. **planner-v1 (`techou`)** (430×434 -> 512×512, 28.658 B): Sổ tay da nâu cát, thun đen cài dọc, ruy băng đỏ thò ra cạnh đáy. Bìa trơn, không gáy xoắn. (PASS)
8. **magazine-v1 (`zasshi`)** (444×434 -> 512×512, 27.132 B): Tạp chí mỏng bìa mềm uốn nhẹ, bìa vẽ nhánh lá sage, không gáy dày, không tiêu đề. (PASS)

---

## 3. Kịch bản Xuất & Dữ liệu Học tập
- **Exporter Defect**: Script ban đầu kiểm tra cứng `width % 4 === 0` và kích thước ô ≥ 512, ném lỗi dừng tiến trình với atlas 1774×887. Đã báo escalation `msg_eece7ea78b74`. Manifest JSON cập nhật crop tọa độ thực tế và script đã xuất chuẩn xác 8 file.
- **Dữ liệu Bài 2 (`lesson-02.json`)**: 45/45 từ vựng bảo toàn 100% ID và nội dung so với baseline; 8 từ mới được gắn trường `illustration` trỏ đúng file WebP, kích thước 512×512 và alt tiếng Việt khớp sidecar.
- **Giới hạn**: Đã xem visual toàn bộ 8 master PNG và 8 WebP; chưa kiểm responsive browser trực tiếp theo giới hạn tác vụ read-only.
