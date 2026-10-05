# Báo cáo: Rà soát Metadata và Nguồn minh họa (Metadata & Source Review)

- **Ngày**: 05/10/2026
- **Worker Terminal**: `term_83ae8ecb-47a1-430a-a01a-9b4f9ca2464d`
- **Coordinator Terminal**: `term_94f6a4b7-3970-4f4b-9a73-54bb3720a2a8`
- **Task ID**: `task_d520d3ee82a0`
- **Dispatch ID**: `ctx_b253649880f5`
- **Tài liệu sở hữu**: `artwork/illustrations/README.md`, `artwork/illustrations/STYLE.md`, `artwork/illustrations/reports/metadata-source-review.md`

---

## 1. Kết quả kiểm tra thực tế (Actual Checks & Findings)

### 1.1. Giải mã Sharp và xác thực 19 WebP
- **Giải mã**: Sharp decode thành công 100% toàn bộ 19 file WebP trong `web/public/assets/illustrations/`.
- **Khuôn hình & Kích thước**: Banner `1200×400`, Scene và Grammar `800×600`, 15 Vocab cutout và 1 State cutout `512×512` (contain `448×448` + padding `32px` trong suốt).
- **Kênh Alpha**: Banner và Scene giữ nền đục (`hasAlpha: false`); toàn bộ 16 cutout giữ đúng true native alpha (`hasAlpha: true`).
- **Dung lượng & Hash SHA-256**:
  - 9 asset pilot lịch sử: **485.258 bytes**, hash SHA-256 khớp 100% với sidecar cũ.
  - 10 asset từ vựng mới: **273.088 bytes**, hash SHA-256 và số byte khớp từng tệp với sidecar mới.
  - Tổng cộng 19 asset production: **758.346 bytes**.

### 1.2. Kiểm tra Master PNG, Sidecar JSON và Tính sạch của Public
- Toàn bộ master PNG và JSON sidecar tồn tại đầy đủ tại `artwork/illustrations/`.
- Toàn bộ master PNG đều có prompt nhúng qua chunk `tEXt` (`impeccable:prompt`).
- Thư mục `web/public/assets/illustrations/` sạch hoàn toàn, chỉ chứa tệp WebP và `.gitkeep`, không rò rỉ mã nguồn hay file provenance (PNG/JSON).

### 1.3. Đối chiếu dữ liệu học với Baseline
- So sánh `web/src/data/n5/vocab/lesson-01.json` và `lesson-02.json` với baseline tại `C:/Users/QT/AppData/Local/Temp/maipace-assets-20261005-baseline` sau khi loại bỏ 10 trường `illustration` mới:
  - `lesson-01.json`: Khớp 100% về ID, thứ tự và nội dung.
  - `lesson-02.json`: Khớp 100% về ID, thứ tự và nội dung (bảo toàn nguyên vẹn 5 pilot references cũ).
- 17 tham chiếu nội dung hoạt động chuẩn xác: Bài 1 có cover scene + 2 từ vựng (`gakusei`, `isha`); Bài 2 có 5 pilot + 1 grammar + 8 từ vựng mới với ID thật; trang `/on-tap` có state `review-complete-v1`.

### 1.4. Tài liệu nguồn và Hướng dẫn phong cách
- Đã cập nhật `artwork/illustrations/README.md`: Bổ sung bảng 10 từ vựng mới kèm vai trò/nghĩa/bytes, tổng 19 asset, hướng dẫn công cụ xuất `export-vocab.mjs` chạy từ root repo và cơ chế chặn ghi đè URL cũ.
- Đã cập nhật `artwork/illustrations/STYLE.md`: Cập nhật trạng thái 9 pilot + 10 mới (tổng 19 asset) và quy trình xuất tái sử dụng script.

---

## 2. Kết luận
Tất cả metadata, kiểm tra read-only Sharp, hash, dữ liệu học và tài liệu nguồn đều đạt tiêu chuẩn kỹ thuật nghiêm ngặt của SPEC-21 và STYLE.md. Tuân thủ phân công, worker không tự chạy lại test/build/browser đã được coordinator nghiệm thu.
