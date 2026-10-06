# Nguồn minh họa MaiPace

Quy ước có thẩm quyền: [SPEC-21](../../docs/specs/SPEC-21-illustration-assets.md).

Nơi lưu bản gốc và prompt/provenance khi tạo asset production. Dùng nhóm và stem tên giống `web/public/assets/illustrations/`; PNG gốc và JSON sidecar ở đây, WebP phục vụ web ở `public`.

Hiện có **228 asset production** (tổng dung lượng **9.775.602 bytes**), gồm 121 asset batch Bài 6–10 và 17 asset batch Bài 5 ngày 06/10 (hai mục cuối), 9 asset pilot lịch sử (**485.258 bytes**), 10 asset mở rộng đơn lẻ (**273.088 bytes**) 8 asset trích xuất từ atlas Bài 2 (**230.636 bytes**), 17 asset Bài 8 (**606.542 bytes**) và 46 asset đợt Bài 2/3/4/8 ngày 06/10 (**2.097.650 bytes**, mục cuối). Toàn bộ asset đều dùng [ảnh mẫu v1](reference/paper-town-style-v1.png) làm style reference (đính kèm trực tiếp, trừ 4 scene Antigravity chỉ mô tả bằng prompt); các nhóm cutout mở rộng ban đầu dùng thêm [book-v1.png](vocab/book-v1.png) chỉ làm finish reference phụ để đồng nhất độ chi tiết, hạt giấy và viền cutout.

## Bộ pilot ban đầu (9 asset, 05/10/2026)

Bộ pilot tạo bằng công cụ `image_gen`: một ảnh mẫu và **9 asset WebP** theo hướng Phố giấy (banner, scene, 5 từ vựng, grammar, state). [Hướng dẫn phong cách](STYLE.md) là brief sản xuất; quy ước lưu/tham chiếu vẫn theo SPEC-21.

| Vai trò | Bản gốc | Prompt/provenance | Bản web |
| --- | --- | --- | --- |
| Mẫu phong cách | [PNG](reference/paper-town-style-v1.png) | [JSON](reference/paper-town-style-v1.json) | Không public |
| Banner Bảng tin | [PNG](ui/banners/paper-town-v1.png) | [JSON](ui/banners/paper-town-v1.json) | [WebP](../../web/public/assets/illustrations/ui/banners/paper-town-v1.webp), 1200 × 400, 133.158 bytes |
| Cảnh giới thiệu bản thân | [PNG](scenes/self-introduction-v1.png) | [JSON](scenes/self-introduction-v1.json) | [WebP](../../web/public/assets/illustrations/scenes/self-introduction-v1.webp), 800 × 600, 82.502 bytes |
| Sách — `hon` | [PNG](vocab/book-v1.png) | [JSON](vocab/book-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/book-v1.webp), 512 × 512, 31.808 bytes |
| Vở — `nooto` | [PNG](vocab/notebook-v1.png) | [JSON](vocab/notebook-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/notebook-v1.webp), 512 × 512, 25.420 bytes |
| Bút chì — `enpitsu` | [PNG](vocab/pencil-v1.png) | [JSON](vocab/pencil-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/pencil-v1.webp), 512 × 512, 15.384 bytes |
| Ô — `kasa` | [PNG](vocab/umbrella-v1.png) | [JSON](vocab/umbrella-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/umbrella-v1.webp), 512 × 512, 27.364 bytes |
| Cặp — `kaban` | [PNG](vocab/school-bag-v1.png) | [JSON](vocab/school-bag-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/school-bag-v1.webp), 512 × 512, 32.548 bytes |
| Gần người nói/nghe, xa cả hai | [PNG](grammar/kore-sore-are-v1.png) | [JSON](grammar/kore-sore-are-v1.json) | [WebP](../../web/public/assets/illustrations/grammar/kore-sore-are-v1.webp), 800 × 600, 110.604 bytes |
| Đã ôn xong | [PNG](ui/states/review-complete-v1.png) | [JSON](ui/states/review-complete-v1.json) | [WebP](../../web/public/assets/illustrations/ui/states/review-complete-v1.webp), 512 × 512, 26.470 bytes |

## Đợt mở rộng thứ hai (10 từ vựng mới, 05/10/2026)

Được tạo đơn lẻ bằng `image_gen` với style reference trực tiếp từ mẫu v1 và book-v1 chỉ làm finish reference, bảo toàn true native alpha:

| Vai trò / Nghĩa | Bản gốc | Prompt/provenance | Bản web |
| --- | --- | --- | --- |
| Sinh viên — `gakusei` | [PNG](vocab/student-v1.png) | [JSON](vocab/student-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/student-v1.webp), 512 × 512, 18.044 bytes |
| Bác sĩ — `isha` | [PNG](vocab/doctor-v1.png) | [JSON](vocab/doctor-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/doctor-v1.webp), 512 × 512, 18.984 bytes |
| Bút bi — `boorupen` | [PNG](vocab/ballpoint-pen-v1.png) | [JSON](vocab/ballpoint-pen-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/ballpoint-pen-v1.webp), 512 × 512, 18.358 bytes |
| Bút chì kim — `shaapupenshiru` | [PNG](vocab/mechanical-pencil-v1.png) | [JSON](vocab/mechanical-pencil-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/mechanical-pencil-v1.webp), 512 × 512, 15.008 bytes |
| Chìa khóa — `kagi` | [PNG](vocab/key-v1.png) | [JSON](vocab/key-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/key-v1.webp), 512 × 512, 27.890 bytes |
| Đồng hồ — `tokei` | [PNG](vocab/wristwatch-v1.png) | [JSON](vocab/wristwatch-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/wristwatch-v1.webp), 512 × 512, 25.322 bytes |
| Máy ảnh — `kamera` | [PNG](vocab/camera-v1.png) | [JSON](vocab/camera-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/camera-v1.webp), 512 × 512, 41.552 bytes |
| Bàn học — `tsukue` | [PNG](vocab/desk-v1.png) | [JSON](vocab/desk-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/desk-v1.webp), 512 × 512, 33.636 bytes |
| Ghế — `isu` | [PNG](vocab/chair-v1.png) | [JSON](vocab/chair-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/chair-v1.webp), 512 × 512, 38.788 bytes |
| Cà phê — `koohii` | [PNG](vocab/coffee-v1.png) | [JSON](vocab/coffee-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/coffee-v1.webp), 512 × 512, 35.506 bytes |

## Đợt mở rộng thứ ba: 8 từ vựng trích xuất từ Atlas (05/10/2026)

Tạo bằng kỹ thuật batching atlas 4×2 (`everyday-objects-v1`, 1774×887) trong một lần gọi `image_gen` duy nhất với native alpha, sau đó trích xuất thành 8 cutout độc lập qua các rãnh trong suốt (transparent gutters):

| Vai trò / Nghĩa | Bản gốc | Prompt/provenance | Bản web |
| --- | --- | --- | --- |
| Đĩa CD — `cd` | [PNG](vocab/compact-disc-v1.png) | [JSON](vocab/compact-disc-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/compact-disc-v1.webp), 512 × 512, 29.288 bytes |
| Ti vi — `terebi` | [PNG](vocab/television-v1.png) | [JSON](vocab/television-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/television-v1.webp), 512 × 512, 26.768 bytes |
| Đài radio — `rajio` | [PNG](vocab/radio-v1.png) | [JSON](vocab/radio-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/radio-v1.webp), 512 × 512, 35.250 bytes |
| Máy tính xách tay — `konpyuutaa` | [PNG](vocab/laptop-v1.png) | [JSON](vocab/laptop-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/laptop-v1.webp), 512 × 512, 27.644 bytes |
| Xe ô tô — `kuruma` | [PNG](vocab/car-v1.png) | [JSON](vocab/car-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/car-v1.webp), 512 × 512, 29.544 bytes |
| Sô-cô-la — `chokoreeto` | [PNG](vocab/chocolate-bar-v1.png) | [JSON](vocab/chocolate-bar-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/chocolate-bar-v1.webp), 512 × 512, 26.352 bytes |
| Sổ tay — `techou` | [PNG](vocab/planner-v1.png) | [JSON](vocab/planner-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/planner-v1.webp), 512 × 512, 28.658 bytes |
| Tạp chí — `zasshi` | [PNG](vocab/magazine-v1.png) | [JSON](vocab/magazine-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/magazine-v1.webp), 512 × 512, 27.132 bytes |

Atlas master nguồn và mô tả bố cục: [PNG](atlases/everyday-objects-v1.png) và [JSON](atlases/everyday-objects-v1.json).

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

## Bài 8 — 16 từ vựng và cảnh bìa (05/10/2026)

Hai atlas [đồ vật/màu](atlases/lesson-08-objects-v1.png) ([manifest](atlases/lesson-08-objects-v1.json)) và [tính từ](atlases/lesson-08-adjectives-v1.png) ([manifest](atlases/lesson-08-adjectives-v1.json)) được chỉnh khoảng trống bằng image_gen trước khi xuất. Nguồn thực 1774 × 887, crop ghi tọa độ thực; nguồn layout trước chỉnh được giữ làm đầu vào sửa và có prompt/provenance. Sidecar từng ảnh giữ prompt gốc, prompt sửa, style references và crop. Không xóa nét bằng chroma-key.

| ID / vai trò | PNG | JSON | WebP | Dung lượng |
| --- | --- | --- | --- | --- |
| `shiroi` | [PNG](vocab/white-shirt-v1.png) | [JSON](vocab/white-shirt-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/white-shirt-v1.webp) | 17.826 bytes |
| `kuroi` | [PNG](vocab/black-shoes-v1.png) | [JSON](vocab/black-shoes-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/black-shoes-v1.webp) | 22.526 bytes |
| `akai` | [PNG](vocab/red-flower-v1.png) | [JSON](vocab/red-flower-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/red-flower-v1.webp) | 24.964 bytes |
| `aoi` | [PNG](vocab/blue-car-v1.png) | [JSON](vocab/blue-car-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/blue-car-v1.webp) | 27.594 bytes |
| `sakura` | [PNG](vocab/cherry-blossom-v1.png) | [JSON](vocab/cherry-blossom-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/cherry-blossom-v1.webp) | 42.580 bytes |
| `yama` | [PNG](vocab/mountain-v1.png) | [JSON](vocab/mountain-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/mountain-v1.webp) | 30.670 bytes |
| `machi` | [PNG](vocab/town-v1.png) | [JSON](vocab/town-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/town-v1.webp) | 41.210 bytes |
| `tabemono` | [PNG](vocab/food-v1.png) | [JSON](vocab/food-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/food-v1.webp) | 29.328 bytes |
| `ookii` | [PNG](vocab/large-bag-v1.png) | [JSON](vocab/large-bag-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/large-bag-v1.webp) | 21.038 bytes |
| `chiisai` | [PNG](vocab/small-bag-v1.png) | [JSON](vocab/small-bag-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/small-bag-v1.webp) | 20.418 bytes |
| `atarashii` | [PNG](vocab/new-laptop-v1.png) | [JSON](vocab/new-laptop-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/new-laptop-v1.webp) | 22.982 bytes |
| `furui` | [PNG](vocab/old-clock-v1.png) | [JSON](vocab/old-clock-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/old-clock-v1.webp) | 19.202 bytes |
| `atsui` | [PNG](vocab/hot-weather-v1.png) | [JSON](vocab/hot-weather-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/hot-weather-v1.webp) | 38.742 bytes |
| `samui` | [PNG](vocab/cold-weather-v1.png) | [JSON](vocab/cold-weather-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/cold-weather-v1.webp) | 41.530 bytes |
| `tsumetai` | [PNG](vocab/cold-water-v1.png) | [JSON](vocab/cold-water-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/cold-water-v1.webp) | 23.786 bytes |
| `oishii` | [PNG](vocab/delicious-food-v1.png) | [JSON](vocab/delicious-food-v1.json) | [WebP](../../web/public/assets/illustrations/vocab/delicious-food-v1.webp) | 35.330 bytes |
| Cover Bài 8 | [PNG](scenes/adjective-town-v1.png) | [JSON](scenes/adjective-town-v1.json) | [WebP](../../web/public/assets/illustrations/scenes/adjective-town-v1.webp) | 146.816 bytes |

16 WebP từ vựng: **459.726 bytes**, 512 × 512 có alpha thật. Cover: 800 × 600, nền giấy đục. Có ảnh cho 16/53 mục từ Bài 8; các mục khác tiếp tục dùng chữ. Ảnh chỉ hỗ trợ nghĩa sau khi lật thẻ. `ookii` dùng vali lớn độc lập; `chiisai` có giày so sánh kích thước, không dùng ảnh thay nội dung nghĩa. Báo cáo [export](reports/lesson-08-export.md), [review](reports/lesson-08-visual-review.md), nghiệm thu trong [handoff SPEC-21](../../docs/handoff/SPEC-21.md).

## Bài 2/3/4/8 — 42 cutout + 4 scene (06/10/2026)

Nguồn và cách tạo khác các đợt trước:

- **Cutout từ vựng**: 6 atlas 4×2 do người dùng tạo thủ công trên ChatGPT web (đính kèm mẫu v1), prompt ở [CHATGPT-PROMPTS-2026-10-05.md](atlases/CHATGPT-PROMPTS-2026-10-05.md). PNG có alpha thật, nguồn thực 1774 × 887; tên file gốc do ChatGPT đặt được ghi ở `generation.originalFilename` trong manifest. Crop tính bằng script từ đường alpha 0 tuyệt đối giữa chủ thể (ngưỡng alpha ≥ 8 chỉ dùng để tìm chủ thể), rồi xuất bằng `export-atlas.mjs`; không sửa pixel. Sidecar ghi `source: chatgpt-web-image`.
- **6 ô không xuất được** vì dải alpha rất mờ (1–7) nối sang ô bên cạnh, không có đường cắt alpha 0: `restaurant`, `dormitory` (atlas places), `quiet-library`, `lively-street`, `busy-worker`, `having-fun` (atlas adjectives-2). Theo fallback STYLE.md, cần tạo lại từng ảnh riêng theo [prompt đơn](vocab/CHATGPT-PROMPTS-SINGLES-2026-10-06.md), đưa vào một batch rồi xuất bằng `batch.mjs`. Các từ `resutoran`, `ryou`, `shizuka`, `nigiyaka`, `isogashii`, `tanoshii` tạm giữ chữ.
- **4 scene nền đục**: Antigravity `generate_image` (Gemini 3.8 Flash High) trả JPEG 1200 × 896; master PNG là bản re-encode lossless, WebP 800 × 600. Công cụ này không nhận ảnh tham chiếu nên phong cách được mô tả bằng prompt; không dùng nó cho cutout vì không có alpha thật (nền caro chỉ là vẽ giả).

| Atlas / nhóm | Stem → ID | WebP |
| --- | --- | --- |
| [lesson-02-03-objects-v1](atlases/lesson-02-03-objects-v1.json) | `dictionary` jisho, `newspaper` shinbun, `business-card` meishi, `plastic-card` kaado, `souvenir-box` omiyage (Bài 2); `necktie` nekutai, `wine-bottle` wain, `telephone` denwa (Bài 3) | 8 ảnh, 231.914 bytes |
| [lesson-03-rooms-v1](atlases/lesson-03-rooms-v1.json) | `classroom` kyoushitsu, `cafeteria` shokudou, `office` jimusho, `meeting-room` kaigishitsu, `reception-desk` uketsuke, `lobby` robii, `room` heya, `toilet` toire | 8 ảnh, 353.520 bytes |
| [lesson-03-buildings-v1](atlases/lesson-03-buildings-v1.json) | `stairs` kaidan, `elevator` erebeetaa, `escalator` esukareetaa, `vending-machine` jidouhanbaiki, `company-building` kaisha, `house` uchi, `sales-counter` uriba (Bài 3); `department-store` depaato (Bài 4) | 8 ảnh, 342.968 bytes |
| [lesson-04-places-v1](atlases/lesson-04-places-v1.json) | `bank` ginkou, `post-office` yuubinkyoku, `library` toshokan, `art-museum` bijutsukan, `exam` shiken, `movie` eiga | 6 ảnh, 258.094 bytes |
| [lesson-04-daily-v1](atlases/lesson-04-daily-v1.json) | `wake-up` okimasu, `sleep` nemasu, `work` hatarakimasu, `rest` yasumimasu, `study` benkyou-shimasu, `morning` asa, `noon` hiru, `night` ban | 8 ảnh, 380.348 bytes |
| [lesson-08-adjectives-2-v1](atlases/lesson-08-adjectives-2-v1.json) | `handsome-man` hansamu, `energetic-person` genki, `tall-tower` takai, `low-stool` hikui | 4 ảnh, 215.500 bytes |
| Scene/grammar ([báo cáo L2–3](reports/lesson-02-03-covers.md), [L4 + grammar](reports/lesson-04-cover-l3-grammar.md)) | cover `scenes/everyday-things-v1` (Bài 2), `scenes/department-store-v1` (Bài 3), `scenes/daily-routine-v1` (Bài 4); `grammar/koko-soko-asoko-v1` (Bài 3, có caption) | 4 ảnh, 315.306 bytes |

Dùng lại có chủ đích, không tạo file mới: `kutsu` (Bài 3) → `black-shoes-v1`, `kaigi` (Bài 4) → `meeting-room-v1`. `takai` minh họa nghĩa "cao", không phải "đắt". Các từ trừu tượng, đại từ chỉ định, số, giờ, ngày/thứ và câu giao tiếp tiếp tục chỉ dùng chữ. Độ phủ ảnh hiện tại: Bài 2 26/45, Bài 3 19/42, Bài 4 16/51, Bài 8 20/53. Nghiệm thu ở [handoff SPEC-21](../../docs/handoff/SPEC-21.md).

## Bài 5 — batch `lesson-05` (06/10/2026)

Đợt đầu tiên chạy theo workflow batch. Nguồn: [batch](batches/lesson-05.json), [prompt](batches/lesson-05.prompts.md), [contact sheet](reports/lesson-05-sheet.png), [pilot](reports/pilot-2026-10-06.md). Codex built-in `image_gen` (`gpt-6-luna` low) tạo 2 atlas và 6 ảnh đơn; Antigravity tạo cover. Tổng **17 WebP, 746.374 bytes**.

| Nguồn | Stem → ID |
| --- | --- |
| [Atlas 4×2 phương tiện](atlases/lesson-05-vehicles-v1.png) | `commuter-train` densha, `subway` chikatetsu, `bullet-train` shinkansen, `bus` basu, `taxi` takushii, `bicycle` jitensha. Ô máy bay và tàu thủy có bbox chồng nhau nên `skip` |
| [Atlas 2×2 địa điểm](atlases/lesson-05-places-v1.png) | `school` gakkou, `supermarket` suupaa, `train-station` eki, `birthday-cake` tanjoubi |
| Ảnh đơn | `walking` aruite, `family` kazoku, `going-home` kaerimasu, `friends` tomodachi, `aeroplane` hikouki, `ferry-boat` fune |
| Cover (nền đục) | `scenes/station-platform-v1`, Bài 5 |

`going-home` và `friends` được tạo lại vì bản đầu có chủ thể chạm mép canvas; bản nháp chưa phát hành được bỏ. Cover đầu tiên có khung viền giấy nên được tạo lại với yêu cầu full-bleed. Độ phủ ảnh Bài 5: 16/59 mục từ; các mục về ngày, tháng, năm, đại từ và câu giao tiếp tiếp tục chỉ dùng chữ.

## Bài 6–10 — 5 batch (06/10/2026)

Batch: [lesson-06](batches/lesson-06.json), [lesson-07](batches/lesson-07.json), [lesson-08](batches/lesson-08.json), [lesson-09](batches/lesson-09.json), [lesson-10](batches/lesson-10.json). Mỗi batch có contact sheet `reports/lesson-NN-sheet.png`. Orca run `run_a5b3de34c2db`: 5 worker Codex (`gpt-6-luna` low) chạy song song, 1 worker Antigravity làm 4 cover, sau đó thêm 3 worker "chỉ generate" để làm bù.

| Bài | Ảnh mới | Bytes | Ghi chú |
| --- | --- | --- | --- |
| 6 | 35 (8 atlas 2×2, 4 ảnh đơn, cover `eating-together`) | 1.697.256 | Ô `shop` và `garden` lẫn sang ô bên cạnh → tạo lại thành ảnh đơn |
| 7 | 28 (6 atlas, 3 ảnh đơn, cover `gift-giving`) | 928.628 | `reuse` 5 mục: `pasokon` → laptop, `hana` → red-flower, `shatsu` → white-shirt, `otousan`/`okaasan` → father/mother |
| 8 | 15 (2 atlas, 7 ảnh đơn) | 719.914 | Gồm 6 cutout lỗi cũ: `resutoran`, `ryou`, `shizuka`, `nigiyaka`, `isogashii`, `tanoshii`. `lively-street` tạo lại vì chạm mép |
| 9 | 17 (4 atlas, 1 ảnh đơn, cover `weekend-hobbies`) | 819.858 | Ô `children` có dải alpha mờ → ảnh đơn |
| 10 | 26 (6 atlas, 1 ảnh đơn, cover `cozy-room`) | 1.170.398 | |

Tổng **121 WebP mới, 5.336.054 bytes**, kho **228 WebP / 233 tham chiếu**. Độ phủ: Bài 6 34/51, Bài 7 32/47, Bài 8 35/53, Bài 9 16/52, Bài 10 25/47 mục từ, cộng cover Bài 6/7/9/10. Từ trừu tượng, thời gian, đại từ, câu giao tiếp và chữ viết (kanji/hiragana…) tiếp tục chỉ dùng chữ.

## Bài 10 ngữ pháp + Bài 11–15 (06/10/2026)

| Bài | Ảnh mới | Bytes | Ghi chú |
| --- | --- | --- | --- |
| 10 | 1 ảnh ngữ pháp `positions-desk-v1` | 85.354 | Gắn vào mẫu `posiciones`, có caption furigana |
| 11 | 16 (cover + từ vựng) | 684.016 | Bỏ atlas anh chị em |
| 12 | 35 | 2.037.220 | Ô đồ ăn Nhật, `rain`, `cloudy`, `crowd`, `weather` tạo lại thành ảnh đơn |
| 13 | 21 | 1.143.704 | Cover `lunch-diner` chuyển sang Codex vì Antigravity hết quota |
| 14 | 27 | 995.180 | `passport`, `entering-cafe`/`leaving-cafe`, `parking-car` tạo lại |
| 15 | 13 | 576.442 | `city-hall`, `high-school` tạo lại |

Tổng **113 WebP mới, 5.521.916 bytes**. Độ phủ từ vựng: Bài 11 15/61, Bài 12 35/51, Bài 13 20/31, Bài 14 26/45, Bài 15 12/22, cộng cover Bài 11–15.

Bài 16–25 đang làm dở. Bài 19/20/22/24/25 đã link 55 tham chiếu (thiếu `moving-house` và reuse `thinking-v1`). Phần còn lại chờ hạn mức tạo ảnh của Codex reset (07/10/2026). Xem handoff SPEC-21.
