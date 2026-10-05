# Báo cáo Đánh giá Độc lập Chất lượng Minh họa MaiPace (Independent QA Report)

- **Ngày thực hiện**: 05/10/2026
- **Task ID**: `task_afeb0ed86412`
- **Dispatch ID**: `ctx_a930ea373c17`
- **Worker Terminal**: `term_af5faca5-3a53-46d3-ae59-9fb020109bc4`
- **Coordinator Terminal**: `term_94f6a4b7-3970-4f4b-9a73-54bb3720a2a8`
- **Vai trò**: Independent QA (Read-only, Sharp decode, Visual inspection, Data mapping verification)
- **Tài liệu quy chuẩn**: [SPEC-21](../../../docs/specs/SPEC-21-illustration-assets.md), [STYLE.md](../STYLE.md)

---

## 1. Tóm tắt điều hành (Executive Summary)

Đã thực hiện kiểm định độc lập toàn diện bộ 10 tài sản minh họa cutout từ vựng mới (Bài 1 và Bài 2) cùng công cụ xuất WebP `export-vocab.mjs` và ánh xạ dữ liệu bài học. Tất cả 10 ảnh đều đạt chuẩn xuất sắc về mặt kỹ thuật (kích thước, định dạng, độ phân giải, kênh alpha thực sự, SHA256/dung lượng khớp sidecar) và thẩm mỹ Washi / Phố giấy (màu nước/gouache, viền chì tối, không text/logo, an toàn lề). Toàn bộ ID và nội dung học tập gốc trong `lesson-01.json` và `lesson-02.json` được bảo toàn 100% so với baseline.

---

## 2. Các kiểm tra thực tế đã thực hiện (Checks Actually Executed)

1. **Giải mã Sharp & Kiểm định Kỹ thuật (10/10 file)**:
   - Master PNG: 1254 × 1254, format `png`, kênh alpha `hasAlpha: true`, nhúng prompt metadata trong PNG chunks.
   - WebP Export: 512 × 512, format `webp`, kênh alpha `hasAlpha: true`.
   - Đối chiếu SHA-256 và dung lượng bytes giữa file WebP thực tế và trường `outputVerification` trong sidecar JSON: khớp chính xác 100%.
   - Đếm phân bố pixel alpha (`transparent`, `partial`, `opaque`): khớp chính xác 100% với metadata sidecar.
2. **Kiểm tra thị giác trực tiếp bằng `view_file` (10/10 master PNG)**:
   - Quan sát trực tiếp từng file: chủ thể đầy đủ, căn giữa cân đối, an toàn lề ~70-75% canvas.
   - Thẩm mỹ: màu nước/gouache, vân giấy tự nhiên trong nét vẽ, viền chì than mảnh, bảng màu ấm Washi (ivory, sand, sage, charcoal, brick-red).
   - Kiểm tra âm bản (negative constraints): **hoàn toàn không có chữ, số, kanji/kana, logo, watermark, nền caro giả lập, bóng đổ rời ngoài vật thể hay méo viền**.
3. **Đối chiếu Dữ liệu Bài học với Baseline**:
   - So sánh trực tiếp với baseline tại `C:/Users/QT/AppData/Local/Temp/maipace-assets-20261005-baseline/`:
     - `lesson-01.json`: 41/41 từ vựng giữ nguyên ID, cấu trúc và nội dung; chỉ bổ sung `illustration` cho `gakusei` và `isha`.
     - `lesson-02.json`: 45/45 từ vựng giữ nguyên ID, cấu trúc và nội dung; bổ sung `illustration` cho 8 từ mới + 5 pilot.
4. **Phân tích Mã nguồn Công cụ Xuất**: Đọc và kiểm toán chi tiết `artwork/illustrations/tools/export-vocab.mjs`.

---

## 3. Kết quả Kiểm định Chi tiết 10 Tài sản Minh họa

| Stem | ID Từ vựng | Master PNG | WebP (Bytes / SHA256) | Alpha Pixels (T/P/O) | Visual & Subject Check | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **student-v1** | `gakusei` (B1) | 1254×1254, Alpha | 18.044 B<br>`02514514...` | 223.968 / 37.198 / 978 | Nam sinh viên trẻ mang ba lô, ôm sách bìa đỏ; toàn thân, không chữ. | **PASS** |
| **doctor-v1** | `isha` (B1) | 1254×1254, Alpha | 18.984 B<br>`5b7d4fa4...` | 222.334 / 38.836 / 974 | Nữ bác sĩ áo blouse ngà, ống nghe, cầm bảng hồ sơ không chữ; toàn thân. | **PASS** |
| **ballpoint-pen-v1** | `boorupen` (B2) | 1254×1254, Alpha | 18.358 B<br>`890f5451...` | 226.549 / 35.158 / 437 | Bút bi bấm thân xanh sage, clip bạc, đầu bi kim loại rõ; chéo canvas. | **PASS** |
| **mechanical-pencil-v1** | `shaapupenshiru` (B2) | 1254×1254, Alpha | 15.008 B<br>`9db77b3d...` | 231.116 / 30.609 / 419 | Bút chì kim thân than, tay cầm kim loại ren, ngòi chì mảnh chì graphite rõ. | **PASS** |
| **key-v1** | `kagi` (B2) | 1254×1254, Alpha | 27.890 B<br>`a07293a9...` | 196.536 / 64.928 / 680 | Chìa khóa kim loại đầu tròn, rãnh và răng khóa rõ ràng; không tag/chữ. | **PASS** |
| **wristwatch-v1** | `tokei` (B2) | 1254×1254, Alpha | 25.322 B<br>`3528b753...` | 199.117 / 62.463 / 564 | Đồng hồ mặt ngà chỉ vạch tối, 2 kim, dây da nâu chỉ may; **tuyệt đối không số**. | **PASS** |
| **camera-v1** | `kamera` (B2) | 1254×1254, Alpha | 41.552 B<br>`02f0b904...` | 168.106 / 93.307 / 731 | Máy ảnh compact rangefinder than/bạc, ống kính phản chiếu, không logo. | **PASS** |
| **desk-v1** | `tsukue` (B2) | 1254×1254, Alpha | 33.636 B<br>`88047915...` | 179.824 / 81.650 / 670 | Bàn học gỗ sáng 4 chân, 1 ngăn kéo có núm tròn; mặt bàn trống sạch sẽ. | **PASS** |
| **chair-v1** | `isu` (B2) | 1254×1254, Alpha | 38.788 B<br>`e10f6071...` | 171.748 / 89.645 / 751 | Ghế gỗ khung xanh sage, mặt ngồi gỗ sáng tự nhiên, nan tựa lưng. | **PASS** |
| **coffee-v1** | `koohii` (B2) | 1254×1254, Alpha | 35.506 B<br>`a87806f7...` | 176.620 / 84.891 / 633 | Tách sứ màu ngà có quai trên đĩa lót, cà phê đen có vệt crema mịn. | **PASS** |

---

## 4. Đánh giá Công cụ Xuất (`artwork/illustrations/tools/export-vocab.mjs`)

### Điểm mạnh:
- Tái sử dụng Sharp 0.35.4 nội bộ của Next.js qua `createRequire`, không cài thêm thư viện ngoài.
- Thuật toán `resize(448, 448, { fit: 'contain' })` kết hợp `extend(32px)` chuẩn xác, đảm bảo safe margins và kích thước 512×512 chuẩn SPEC-21.
- Bảo toàn native alpha và ghi lại toàn diện metadata kiểm định.

### Các phát hiện thực tế (Findings):
1. **[Mức độ: Trung bình] Điều kiện `!alphaPixels.opaque` khắt khe**:
   - Dòng 30: `if (info.width !== 512 || info.height !== 512 || !alphaPixels.transparent || !alphaPixels.opaque) throw new Error('Incorrect dimensions or alpha');`
   - Nếu ảnh màu nước vẽ hoàn toàn bằng các nét loang mờ bán trong suốt (alpha từ 1 đến 254) mà không có pixel nào đạt giá trị cực đại 255, kịch bản sẽ báo lỗi sai. Khuyến nghị trong tương lai: chỉ cần kiểm tra `!alphaPixels.transparent` (phải có vùng trong suốt) và `(alphaPixels.opaque + alphaPixels.partial > 0)` (phải có pixel vẽ).
2. **[Mức độ: Thấp] Thiếu tính nguyên tử (Atomicity) khi ghi file**:
   - Nếu ghi file WebP thành công nhưng ghi sidecar JSON thất bại, kịch bản ở lần chạy sau sẽ vấp lỗi `Output already exists` ở dòng 16.
3. **[Mức độ: Thông tin] Giả định vị trí file**: Kịch bản phụ thuộc vào vị trí cố định 3 cấp thư mục (`../../../`) để tìm `web/package.json`.

---

## 5. Giới hạn Phạm vi Đánh giá (Visual Parts Not Actually Viewed)

- Toàn bộ 10 master PNG và 10 WebP đã được giải mã, phân tích pixel và xem trực tiếp trong IDE viewer.
- **Phần chưa kiểm chứng**: Chưa kiểm tra hiển thị trực tiếp trên trình duyệt thật (Chromium / Safari) ở các độ phân giải responsive khác nhau (390px mobile, 1440px desktop), chưa đo lường hiệu năng tải trang thực tế hay kiểm tra trên host production/CDN (theo đúng phân công nhiệm vụ QA độc lập: không chạy test/build).
