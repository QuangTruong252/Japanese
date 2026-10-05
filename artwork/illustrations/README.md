# Nguồn minh họa MaiPace

Quy ước có thẩm quyền: [SPEC-21](../../docs/specs/SPEC-21-illustration-assets.md).

Nơi lưu bản gốc và prompt/provenance khi tạo asset production. Dùng nhóm và stem tên giống `web/public/assets/illustrations/`; PNG gốc và JSON sidecar ở đây, WebP phục vụ web ở `public`.

Hiện có **44 asset production** (tổng dung lượng **1.595.524 bytes**), gồm 9 asset pilot lịch sử (**485.258 bytes**), 10 asset mở rộng đơn lẻ (**273.088 bytes**) 8 asset trích xuất từ atlas Bài 2 (**230.636 bytes**) và 17 asset Bài 8 (**606.542 bytes**). Toàn bộ asset đều dùng trực tiếp [ảnh mẫu v1](reference/paper-town-style-v1.png) làm style reference; các nhóm cutout mở rộng ban đầu dùng thêm [book-v1.png](vocab/book-v1.png) chỉ làm finish reference phụ để đồng nhất độ chi tiết, hạt giấy và viền cutout.

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

Dự án cung cấp hai công cụ xuất chuyên dụng tại `artwork/illustrations/tools/`:
1. **Xuất đơn lẻ**: `artwork/illustrations/tools/export-vocab.mjs`
   ```sh
   node artwork/illustrations/tools/export-vocab.mjs <stem>
   ```
2. **Xuất từ Atlas**: `artwork/illustrations/tools/export-atlas.mjs`
   ```sh
   node artwork/illustrations/tools/export-atlas.mjs [path-to-atlas-json]
   ```
Cả hai script kiểm alpha, đếm pixels, tính SHA-256 và từ chối ghi đè WebP đã có. Riêng `export-atlas.mjs` kiểm trước toàn bộ đường dẫn master/sidecar/output, tọa độ crop và biên rãnh trong suốt; tách PNG, nhúng prompt rồi xuất. `export-vocab.mjs` nhận PNG đã nhúng prompt và sidecar có sẵn. Với atlas mới, ghi kích thước nguồn thực và crop trong manifest trước khi chạy; không giả định kích thước từ prompt được bảo đảm.

## Ánh xạ nội dung học (Content Mapping)

Hiện có tổng cộng **42 content references** được tích hợp trong dữ liệu học:
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
