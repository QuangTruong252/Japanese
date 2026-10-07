# Nguồn minh họa MaiPace

Quy ước có thẩm quyền: [SPEC-21](../../docs/specs/SPEC-21-illustration-assets.md).

**Dọn dẹp 07/10/2026:** PNG master, atlas, ảnh mẫu, JSON sidecar (prompt/provenance) và ảnh
chụp QA đã xóa khỏi HEAD để repo gọn (~630 MB). App chỉ dùng WebP trong
`web/public/assets/illustrations/`. Lấy lại bản gốc bằng
`git checkout pre-cleanup-2 -- artwork/illustrations/<nhóm>` (cần ảnh mẫu
`reference/paper-town-style-v1.png` trước khi chạy `tools/batch.mjs`). Ở đây chỉ còn
quy trình, `STYLE.md`, `batches/` (prompt) và `tools/`.

## Quy trình xuất và kiểm chứng

Các WebP xuất trực tiếp từ master PNG bằng Sharp có sẵn trong dependency Next.js, quality 82, effort 6. Banner/scene/grammar giữ tỷ lệ nguồn khớp khuôn; toàn bộ 39 cutout từ vựng resize `contain` vào 448 × 448 rồi thêm 32 px trong suốt mỗi phía để cùng khuôn 512 × 512, không cắt/méo chủ thể. Alpha gốc được giữ nguyên, encode alphaQuality 100. Prompt nhúng vào master PNG (chunk `tEXt` `impeccable:prompt`) và lưu đầy đủ trong JSON sidecar, không nhúng vào WebP public. Thư mục `web/public/assets/illustrations/` sạch hoàn toàn, không chứa file PNG hay JSON nào. Sidecar ghi kích thước nguồn/xuất, cấu hình encode và SHA-256.

Đoạn trên mô tả các asset làm trước batch Bài 5. Hai script cũ `export-vocab.mjs` và `export-atlas.mjs` đã được thay bằng workflow batch bên dưới; bản cũ vẫn còn trong lịch sử git. Không xuất lại ảnh cũ vì URL đã dùng là bất biến.

## Workflow tự động theo batch (từ 06/10/2026)

Mỗi đợt ảnh có một file `batches/<tên>.json` làm nguồn sự thật. File ghi nhóm, stem, chủ thể, nguồn tạo ảnh, ảnh tham chiếu, đích trong dữ liệu học (`target`) và `alt.vi`. Ví dụ đầy đủ: [lesson-05.json](batches/lesson-05.json). Chạy từ root repo:

```sh
node artwork/illustrations/tools/batch.mjs prompts artwork/illustrations/batches/<tên>.json   # → <tên>.prompts.md
node artwork/illustrations/tools/batch.mjs collect artwork/illustrations/batches/<tên>.json   # chép ảnh Codex image_gen về đúng đích
node artwork/illustrations/tools/batch.mjs check   artwork/illustrations/batches/<tên>.json [stem ...]
node artwork/illustrations/tools/batch.mjs export  artwork/illustrations/batches/<tên>.json [stem ...]
node artwork/illustrations/tools/batch.mjs sheet   artwork/illustrations/batches/<tên>.json   # → reports/<tên>-sheet.png
node artwork/illustrations/tools/batch.mjs link    artwork/illustrations/batches/<tên>.json [stem ...]
```

Thêm `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON` sau `node` để tắt cảnh báo khi script nạp validator TypeScript của app.

1. **Lập batch.** Chỉ chọn từ có nghĩa cụ thể; bỏ số, ngày, đại từ và câu giao tiếp. Chọn cách tạo:
   - đồ vật và địa điểm: atlas 2×2 (`"columns": 2, "rows": 2`);
   - vật gọn, cùng tỷ lệ: atlas 4×2;
   - người, hành động, vật dài: ảnh đơn;
   - cover, grammar, banner: dùng `group` tương ứng, nền đục;
   - đã có ảnh đúng nghĩa: job `{"reuse": "vocab/laptop-v1", "target": …, "alt": …}`. Không tạo file mới; chỉ `link` xử lý job này.

   **Duyệt lần 1:** người dùng chốt danh sách.
2. **Tạo ảnh.** Chạy `prompts` để sinh file prompt từ template chung trong `batch.mjs` (không sửa tay file đó). Worker Codex **chỉ gọi `image_gen`**, không tự chép file: chép file từ worker từng thất bại (không tìm được đường dẫn, vượt giới hạn command line trên Windows). Sau đó coordinator chạy `collect` để lấy ảnh từ `~/.codex/generated_images/<thread>/<id>.png`, khớp theo các dòng subject trong prompt mà Codex ghi ở rollout.
   - Cutout: Codex `image_gen` có sẵn, dùng `gpt-6-luna` effort low, đính kèm [mẫu v1](reference/paper-town-style-v1.png). Mỗi mục là một lần gọi; mỗi đợt dùng một thread ngắn.
   - Nền đục: Antigravity `generate_image` (không nhận ảnh mẫu).
   - Có thể dán prompt vào ChatGPT web.
   - Lưu đúng đường dẫn và giữ nguyên bytes.
3. **`check`.** Lệnh này không ghi file.
   - Crop atlas tự động bằng [detect-crops.mjs](tools/detect-crops.mjs): biên phải là alpha 0 và không được lẫn chủ thể của ô khác.
   - Cutout bị chặn khi chủ thể chạm mép canvas hoặc phải phóng to quá 1,3 lần.
   - Ảnh nền đục bị chặn khi lệch tỷ lệ khuôn quá 2% (cần đặt `crop`) hoặc nhỏ hơn khuôn.
   - Vượt ngân sách dung lượng chỉ là cảnh báo.
   - Ô atlas hỏng: đánh dấu `skip` kèm lý do, rồi thêm job ảnh đơn.
4. **`export`.** Ghi master PNG (vùng crop của atlas, hoặc bản re-encode lossless của JPEG), nhúng prompt, xuất WebP và sidecar.
   - Sidecar ghi `source`, `generation`, `batch`, crop, thông số chuẩn hóa và SHA-256.
   - Cutout: bbox chủ thể (alpha ≥ 8) được đặt vừa khung 416 px, căn giữa trong 512, lề 48. Mọi ảnh mới vì vậy có cùng kích thước chủ thể; ảnh cũ dao động 265–436 px.
   - Không ghi đè file. Chạy lại sẽ bỏ qua ảnh đã xuất có hash khớp.
5. **`sheet`.** Ghép ảnh mẫu và các WebP trên nền ngà và nền tối. Agent xem bằng vision, sau đó **duyệt lần 2:** người dùng xem sheet.
6. **`link`.** Ghi `illustration`, `cover` hoặc `illustrationCaption` vào JSON học bằng Node.
   - Giữ UTF-8 và CRLF/LF như file gốc. Từ chối file không đúng JSON thụt 2 dấu cách.
   - Từ chối thay một ảnh khác đang được tham chiếu.
   - Đặt sidecar thành `added-to-learning-data`. [illustrations.test.ts](../../web/src/lib/illustrations.test.ts) kiểm mọi sidecar ở trạng thái này vẫn còn tham chiếu, nên không phải sửa test sau mỗi đợt.
7. Chạy `pnpm check` và `pnpm test`. Kiểm browser khi đổi luồng UI.

Worker chỉ làm bước tạo ảnh. Crop, xuất, QA và gắn dữ liệu là script tất định do coordinator chạy. Số đo hạn mức và chất lượng ở [báo cáo pilot](reports/pilot-2026-10-06.md).

## Ánh xạ nội dung học (Content Mapping)

Hiện có tổng cộng **90 content references** trong dữ liệu học (88 file khác nhau vì `kutsu` và `kaigi` dùng lại ảnh có sẵn). Danh sách dưới đây là mapping trước ngày 06/10; phần thêm của Bài 2/3/4/8 xem mục cuối file.
- **Bài 1**: cover tham chiếu scene `self-introduction-v1`, cùng 2 từ vựng `gakusei` (`student-v1`) và `isha` (`doctor-v1`).
- **Bài 2**: 21 từ vựng và 1 grammar:
  - 5 từ vựng pilot: `hon`, `nooto`, `enpitsu`, `kasa`, `kaban`.
  - 1 minh họa ngữ pháp: `kore-sore-are-v1`.
  - 8 từ vựng mở rộng đợt 2: `boorupen`, `shaapupenshiru`, `kagi`, `tokei`, `kamera`, `tsukue`, `isu`, `koohii`.
  - 8 từ vựng mở rộng từ atlas đợt 3: `cd`, `terebi`, `rajio`, `konpyuutaa`, `kuruma`, `chokoreeto`, `techou`, `zasshi`.
- **Bài 8**: cover `adjective-town-v1` và 16 từ `ookii`, `chiisai`, `atarashii`, `furui`, `atsui`, `samui`, `tsumetai`, `oishii`, `shiroi`, `kuroi`, `akai`, `aoi`, `sakura`, `yama`, `machi`, `tabemono`.
- **Trạng thái**: `review-complete-v1` dùng cho state hoàn thành ôn tập `/on-tap`.

Ảnh concept trong `new-ui/` giữ nguyên. Không đưa nguồn/prompt vào `public` hoặc import chúng vào bundle ứng dụng.
