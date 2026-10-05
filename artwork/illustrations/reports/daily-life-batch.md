# Báo cáo: Đợt minh họa Đời sống hàng ngày (Daily Life Batch)

- **Ngày**: 05/10/2026
- **Worker Terminal**: `term_83ae8ecb-47a1-430a-a01a-9b4f9ca2464d`
- **Coordinator Terminal**: `term_94f6a4b7-3970-4f4b-9a73-54bb3720a2a8`
- **Task ID**: `task_1c80680b8aed`
- **Dispatch ID**: `ctx_4cc00b70c763`
- **Môi trường**: Antigravity (Gemini 3.8 Flash)
- **Tài liệu tham chiếu**: [SPEC-21](../../../docs/specs/SPEC-21-illustration-assets.md), [STYLE.md](../STYLE.md), [book-v1.json](../vocab/book-v1.json), [paper-town-style-v1.png](../reference/paper-town-style-v1.png)

---

## 1. Mục tiêu và phạm vi được giao

Tạo 4 tài sản minh họa cutout từ vựng Bài 2 theo hợp đồng Washi / Phố giấy (SPEC-21 & STYLE.md):
1. `camera-v1` (`kamera`): một máy ảnh compact retro charcoal và bạc, lens rõ, không brand.
2. `desk-v1` (`tsukue`): một bàn học gỗ sáng với ngăn kéo, trống không ghế/sách.
3. `chair-v1` (`isu`): một ghế gỗ tựa lưng sage, đủ bốn chân, không bàn.
4. `coffee-v1` (`koohii`): một tách sứ ngà có quai và cà phê nâu nhìn rõ bên trong, không spoon/snack/nhãn, có thể một đĩa lót cùng tách.

### Yêu cầu kỹ thuật bắt buộc
- Bắt buộc dùng `artwork/illustrations/reference/paper-town-style-v1.png` trực tiếp làm style reference; `book-v1.png` làm cutout finish reference phụ.
- Nét watercolor/gouache, chì tối mảnh, grain nhẹ trong nét vẽ, bảng màu ivory/sand/charcoal/sage/brick-red. Tuyệt đối không chữ, logo, UI, số, kana/kanji, watermark.
- Một đối tượng hoàn chỉnh mỗi ảnh, **true native alpha transparent**, square 1:1, centered, khoảng trống an toàn đều, không cắt/méo.
- Xuất 512×512 WebP bằng Sharp có sẵn trong Next (`createRequire(require.resolve('next/package.json'))('sharp')`), `contain` 448×448 thêm 32px alpha mỗi cạnh, quality 82, alphaQuality 100, effort 6.
- Lưu master PNG + JSON sidecar trong `artwork/illustrations/vocab/`; WebP trong `web/public/assets/illustrations/vocab/`.
- **Ràng buộc tiêu cực nghiêm ngặt**:
  - Không vẽ SVG/code thay thế, không tải ảnh stock.
  - Không tạo placeholder giả lập.
  - "Nếu tool ảnh không có hoặc không dùng reference/alpha được thì báo sớm bằng escalation/ask, không tạo placeholder."
  - Chỉ đạo từ Coordinator (`msg_bc901e8b6fe8`): "Native alpha bắt buộc, không chroma-key/flood-fill. Nếu không tạo alpha được báo sớm coordinator."

---

## 2. Kết quả kiểm tra công cụ thực tế (Environment & Tool Audit)

### 2.1. Tool native của Antigravity Agent
- Antigravity phiên bản này chỉ cung cấp các tool thao tác tệp, quản lý tiến trình và duyệt web: `run_command`, `manage_task`, `schedule`, `view_file`, `replace_file_content`, `write_to_file`, `read_url_content`, `search_web`, `ask_question`, `call_mcp_tool`, `list_resources`, `read_resource`, `define_subagent`, `manage_subagents`, `invoke_subagent`, `send_message`.
- **Không có tool `generate_image` hay `image_gen` ở cấp root agent**.

### 2.2. Kiểm thử helper `image-generator` theo hướng dẫn của Coordinator
Sau khi nhận chỉ đạo của Coordinator (`msg_bc901e8b6fe8` cho phép dùng helper `image-generator` built-in), worker đã kích hoạt subagent `image-generator` để tạo thử nghiệm `camera-v1`.
Kết quả thực nghiệm bằng Sharp và `view_file`:
1. **Định dạng file đầu ra**: Tool `generate_image` bên trong helper xuất ra định dạng `JPEG` (`image/jpeg`, 1024×1024, 3 channels RGB).
   ```json
   {
     "format": "jpeg",
     "width": 1024,
     "height": 1024,
     "space": "srgb",
     "channels": 3,
     "hasAlpha": false
   }
   ```
2. **Kênh Alpha**: Hoàn toàn **không có alpha** (`hasAlpha: false`).
3. **Hiện tượng vẽ giả**: Khi prompt yêu cầu transparent background, mô hình vẽ giả lập một mảng ô vuông bàn cờ xám-trắng (fake checkerboard raster pattern) trực tiếp vào các pixel màu RGB của ảnh JPEG. Điều này vi phạm trực tiếp quy ước tại [STYLE.md](../STYLE.md) §12 ("Không vẽ nền checkerboard giả alpha") và yêu cầu "Native alpha bắt buộc, không chroma-key/flood-fill" của Coordinator.
4. **Không hỗ trợ Image Reference**: Tool `generate_image` của helper chỉ nhận chuỗi text `Prompt` và `AspectRatio`, không có tham số nạp file ảnh tham chiếu đa phương thức (`paper-town-style-v1.png` và `book-v1.png`).

---

## 3. Các hành động đã thực hiện

1. **Heartbeat & Escalation**:
   - Đã gửi heartbeat định kỳ (`phase: investigating`, `alive`) tới coordinator (`msg_ed73d24e5b96`).
   - Gửi escalation `msg_ea1ebbe51961` báo cáo về việc thiếu tool native generate_image.
   - Nhận chỉ đạo `msg_bc901e8b6fe8` từ Coordinator: cho phép dùng `image-generator` và nhấn mạnh "Native alpha bắt buộc, không chroma-key/flood-fill. Nếu không tạo alpha được báo sớm coordinator."
   - Đã gửi heartbeat `phase: implementing` (`msg_43b2c0d2921c`).
2. **Thực nghiệm helper `image-generator`**:
   - Tạo subagent `50f7a06b-fa17-46f5-844a-94be46fdf9f6` yêu cầu vẽ `camera-v1`.
   - Kiểm tra ảnh tạo ra `camera_v1_1791187594583.jpg` bằng Sharp và trực quan qua `view_file`: phát hiện định dạng JPEG, thiếu kênh alpha, vẽ nền checkerboard giả.
   - Hủy subagent sạch sẽ sau kiểm chứng.
3. **Thẩm định Sharp Pipeline**:
   - Xác nhận thư viện Sharp tích hợp trong Next.js hoạt động hoàn hảo:
     ```js
     const { createRequire } = require('module');
     const sharp = createRequire(require.resolve('next/package.json', { paths: [process.cwd()] }))('sharp');
     ```
   - Chạy thử nghiệm resize `contain` 448×448 + padding 32px + export WebP quality 82, alphaQuality 100, effort 6 trên `book-v1.png`.
   - Kết quả xuất ra đạt chính xác **31.808 bytes** và SHA-256 `4a5a0d9a1824b818480f55e28b5c3889dbe83b1ccd8db789d84170d00e70c33f`, khớp 100% từng byte và từng pixel alpha với file pilot production đã nghiệm thu.
4. **Tuân thủ quy ước dữ liệu**:
   - Tuyệt đối không tạo file SVG/placeholder giả lập làm bẩn kho dữ liệu.
   - Không sửa các file dirty, learning data JSON, test, spec, README hay 9 pilot assets.

---

## 4. Kết luận và đề xuất chuyển giao

- **Kết luận**: Môi trường Antigravity hiện tại không thể tạo ra ảnh raster với native RGBA alpha và style reference đa phương thức qua helper `image-generator`.
- **Đề xuất**: Coordinator dispatch batch đời sống hàng ngày (`camera-v1`, `desk-v1`, `chair-v1`, `coffee-v1`) sang worker chạy Claude Code (môi trường sở hữu tool `image_gen` chuyên dụng có khả năng nạp reference images và xuất PNG có native alpha như các asset pilot, `student-v1.png`, và `doctor-v1.png`).
