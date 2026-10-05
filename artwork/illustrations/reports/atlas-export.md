# Báo cáo: Trích xuất và Tối ưu hóa Atlas Minh họa (Atlas Export Report)

- **Ngày**: 05/10/2026
- **Worker Terminal**: `term_83ae8ecb-47a1-430a-a01a-9b4f9ca2464d`
- **Coordinator Terminal**: `term_94f6a4b7-3970-4f4b-9a73-54bb3720a2a8`
- **Task ID**: `task_33d972a32a5e`
- **Dispatch ID**: `ctx_b1c5d3dd91b2`
- **Tài liệu sở hữu**: `artwork/illustrations/tools/export-atlas.mjs`, `artwork/illustrations/README.md`, `artwork/illustrations/STYLE.md`, `artwork/illustrations/reports/atlas-export.md`

---

## 1. Mục tiêu và phạm vi

Thực hiện kỹ thuật tối ưu hóa hiệu suất bằng batching atlas 4×2: trích xuất 8 tài sản từ vựng Bài 2 từ một tệp atlas nguồn duy nhất (`everyday-objects-v1.png` + `.json`), kiểm chứng rãnh trong suốt, nhúng prompt provenance và xuất 8 tệp WebP 512×512 chuẩn Washi:
1. `compact-disc-v1` (`cd`): 29.288 bytes, sha256 `a2921fe68703e915...`
2. `television-v1` (`terebi`): 26.768 bytes, sha256 `b35b9201ce2354fd...`
3. `radio-v1` (`rajio`): 35.250 bytes, sha256 `955d6cb1da8e4668...`
4. `laptop-v1` (`konpyuutaa`): 27.644 bytes, sha256 `4f9a57e520675413...`
5. `car-v1` (`kuruma`): 29.544 bytes, sha256 `e59eeefefc1eee8c...`
6. `chocolate-bar-v1` (`chokoreeto`): 26.352 bytes, sha256 `3a347d07f13d13fb...`
7. `planner-v1` (`techou`): 28.658 bytes, sha256 `0b41c84eec96e9a2...`
8. `magazine-v1` (`zasshi`): 27.132 bytes, sha256 `55428dfaf76681a1...`

---

## 2. Đo lường hiệu năng thực tế (Measured Performance)

- **Thời gian sinh ảnh (Generation)**: Atlas nguồn 8 đối tượng tạo bằng `image_gen` trong một lần gọi mất **46.539 ms (~46,5s)**. So với 8 lệnh gọi đơn lẻ trước đó (~540s), lượt atlas này dùng ít hơn khoảng 91% thời gian tạo nguồn. Hai nhóm khác chủ thể, timestamp nhóm cũ làm tròn; đây không phải benchmark kiểm soát hoặc tốc độ bảo đảm, không gồm điều phối/review/tích hợp và chưa đo chi phí.
- **Thời gian xuất tệp (Export)**: Script `export-atlas.mjs` (cắt 8 ô, kiểm tra rãnh biên, nhúng prompt qua `impeccable embed-prompt` và nén WebP bằng Sharp) hoàn tất trong **30.980 ms (~31s)**.

---

## 3. Các bước kiểm chứng kỹ thuật (Validation Checks)

1. **Atlas nguồn**: Kích thước 1774×887 px, định dạng PNG có alpha tự nhiên (`hasAlpha: true`, 4 channels).
2. **Kiểm tra rãnh biên**: Cả 8 khung cắt đều có chính xác **0 pixel màu ở cả 4 cạnh biên** (`nonZeroBorder === 0`), rãnh giữa các đối tượng hoàn toàn trong suốt.
3. **Khoảng trống an toàn**: Bounding box của cả 8 đối tượng nằm trọn trong khung hình, 4 góc đều có alpha 0 (không có nền ô cờ giả).
4. **Chuẩn hóa WebP**: 8 tệp WebP xuất ra đạt chuẩn `512×512` (contain `448×448` + `32px` padding), `quality: 82`, `alphaQuality: 100`, `effort: 6`. Tổng dung lượng 8 WebP mới là **230.636 bytes**.
5. **Bảo toàn dữ liệu cũ**: 19 tệp WebP cũ giữ nguyên 100% dung lượng (**758.346 bytes**) và mã băm SHA-256. Tổng 27 asset production đạt **988.982 bytes**.
6. **Công cụ trích xuất**: Hoàn thiện `export-atlas.mjs` với preflight đường dẫn, ghi tệp bằng `wx`, kiểm tra tọa độ nguyên và dừng ngay nếu lỗi nhúng prompt.
7. **Tích hợp dữ liệu**: Coordinator đã tích hợp đủ 8 từ vựng mới vào `web/src/data/n5/vocab/lesson-02.json` (tổng **25 content references**).
8. **Tài liệu nguồn**: Đã cập nhật `README.md` (bảng 8 từ vựng atlas, tổng 27 asset) và `STYLE.md` (hướng dẫn batching atlas 4×2).
