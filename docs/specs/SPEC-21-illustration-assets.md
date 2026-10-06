# SPEC-21 — Tên file, thư mục và tham chiếu minh họa

Ngày: **06/10/2026**. Trạng thái: **Đã có 228 WebP (9 pilot + 219 asset mở rộng), 233 tham chiếu nội dung JSON, workflow batch tự động, renderer và cache có version; đã kiểm browser trong phạm vi ghi tại handoff, còn giới hạn nghiệm thu**.

## 1. Phạm vi và nguồn sự thật

MaiPace triển khai thử hướng Phố giấy với bộ minh họa nhỏ dùng lại, rồi mở rộng ảnh hỗ trợ từ vựng/ngữ pháp theo nhu cầu. [Bộ concept](../../new-ui/README.md) là tham khảo bố cục, không phải asset để đưa nguyên màn vào app.

File này sở hữu **tên file, vị trí lưu, phiên bản và hợp đồng tham chiếu ảnh**. `DESIGN.md` tiếp tục sở hữu UX/thị giác toàn cục; `globals.css` sở hữu giá trị token. Không thêm bảng màu ở đây. [SPEC-01](SPEC-01-du-lieu-va-sinh-cau-hoi.md) sở hữu dữ liệu học; các trường ảnh optional ở §5 đã có trong code, không đổi ID hoặc dữ liệu tiến độ.

## 2. Hai nơi lưu, hai mục đích

```text
web/public/assets/illustrations/       # chỉ file đã xuất để phục vụ web
├── ui/
│   ├── banners/                       # cảnh Bảng tin, banner dùng chung
│   ├── states/                        # empty, hoàn thành, hết mục ôn
│   └── decor/                         # chi tiết trang trí nhỏ
├── scenes/                           # cảnh chủ đề dùng lại giữa các bài
├── vocab/                            # hình một khái niệm/nghĩa từ
└── grammar/                          # tình huống hỗ trợ giải thích ngữ pháp

artwork/illustrations/                # bản gốc, prompt; không public
├── README.md
├── STYLE.md                          # brief vẽ, không thay luật UI
├── reference/                        # mẫu phong cách PNG + JSON, không public
├── atlases/                          # nguồn nhiều cutout + crop manifest, không public
└── <cùng nhóm>/<subject>-vN.png       # bản gốc thật
             <subject>-vN.json        # prompt và nguồn của bản gốc
```

`new-ui/` giữ ảnh concept đã tạo. `web/public/brand/` giữ logo hiện có. Không chuyển hoặc nhân bản các tài sản này vào kho minh họa mới. Icon chức năng tiếp tục dùng Lucide/component; không generate thành bitmap.

Thư mục production phân theo **vai trò của ảnh**, không theo từng bài. Một ảnh có thể được nhiều bài hoặc nhiều từ tham chiếu. Ảnh có tình huống riêng vẫn nằm trong nhóm phù hợp với tên đủ rõ; không tạo bản sao theo số bài.

`README.md` và `.gitkeep` giữ hướng dẫn/khung thư mục; đã có 90 WebP ở các nhóm có nhu cầu. Không thêm bản gốc độ phân giải cao, prompt, JSON provenance, ZIP, ảnh thử hoặc contact sheet vào `public`.

## 3. Quy tắc tên file

Mẫu duy nhất:

```text
<subject>[-<variant>]-v<revision>.<extension>
```

- Dùng **ASCII chữ thường, số và dấu gạch ngang** (kebab-case). Tên nội dung bằng tiếng Anh; tên mẫu cấu trúc Nhật có thể dùng romaji đã thống nhất. Không dấu tiếng Việt, kana/kanji, khoảng trắng, underscore hoặc dấu ngoặc.
- `subject` nói nội dung cụ thể: `student`, `self-introduction`, `station-platform`. Không dùng `image-01`, `final`, `new`, ngày tạo, UUID công cụ hoặc tên model.
- Phân biệt nghĩa ngay trong tên khi cần: `glass-cup` và `glass-material`, `bridge` và `chopsticks`. Không dùng một ảnh chỉ vì hai từ có cùng cách đọc.
- `variant` **chỉ thêm khi thật sự có bản khác**: `desktop`, `mobile`, `dark`, `front-view`. Không tạo đủ mọi variant trước. Chọn một bản dùng được cho nhiều viewport trước.
- `revision` là số nguyên dương bắt đầu từ `1`, không zero-pad. Bản đã được app tham chiếu giữ nguyên bytes; thay đổi nội dung, crop, alpha hoặc cách nén làm thay bytes thì xuất `v2`, cập nhật `src` tương ứng.
- Format phục vụ web mặc định là `.webp`. Bản gốc dùng `.png`; SVG chỉ dành cho tài sản vector thật, không nhúng bitmap vào SVG. Không đổi đuôi PNG thành WebP mà không encode lại.
- Không đưa kích thước vào tên file; ghi kích thước thật trong metadata/tham chiếu. `next/image` tạo bản responsive từ nguồn phù hợp, không lưu thủ công các bản `-320`, `-640`, `-1280` khi chưa có nhu cầu.
- Khi ảnh chưa được tham chiếu hoặc phát hành, có thể sửa bản nháp trong `artwork`. Không ghi đè file production đã dùng chỉ để giữ cùng URL.

Các file dưới đây **đã tồn tại**; xem [kho nguồn](../../artwork/illustrations/README.md) cho prompt, mapping nội dung và số đo. `student-v1.webp` ở ví dụ §5 đã được tạo và tham chiếu bởi `gakusei` Bài 1.

| File trên đĩa | Đường dẫn dùng trong dữ liệu/UI |
| --- | --- |
| `web/public/assets/illustrations/ui/banners/paper-town-v1.webp` | `/assets/illustrations/ui/banners/paper-town-v1.webp` |
| `web/public/assets/illustrations/scenes/self-introduction-v1.webp` | `/assets/illustrations/scenes/self-introduction-v1.webp` |
| `web/public/assets/illustrations/vocab/book-v1.webp` | `/assets/illustrations/vocab/book-v1.webp` |
| `web/public/assets/illustrations/vocab/notebook-v1.webp` | `/assets/illustrations/vocab/notebook-v1.webp` |
| `web/public/assets/illustrations/vocab/pencil-v1.webp` | `/assets/illustrations/vocab/pencil-v1.webp` |
| `web/public/assets/illustrations/vocab/umbrella-v1.webp` | `/assets/illustrations/vocab/umbrella-v1.webp` |
| `web/public/assets/illustrations/vocab/school-bag-v1.webp` | `/assets/illustrations/vocab/school-bag-v1.webp` |
| `web/public/assets/illustrations/grammar/kore-sore-are-v1.webp` | `/assets/illustrations/grammar/kore-sore-are-v1.webp` |
| `web/public/assets/illustrations/ui/states/review-complete-v1.webp` | `/assets/illustrations/ui/states/review-complete-v1.webp` |
| `web/public/assets/illustrations/vocab/student-v1.webp` | `/assets/illustrations/vocab/student-v1.webp` |
| `web/public/assets/illustrations/vocab/doctor-v1.webp` | `/assets/illustrations/vocab/doctor-v1.webp` |
| `web/public/assets/illustrations/vocab/ballpoint-pen-v1.webp` | `/assets/illustrations/vocab/ballpoint-pen-v1.webp` |
| `web/public/assets/illustrations/vocab/mechanical-pencil-v1.webp` | `/assets/illustrations/vocab/mechanical-pencil-v1.webp` |
| `web/public/assets/illustrations/vocab/key-v1.webp` | `/assets/illustrations/vocab/key-v1.webp` |
| `web/public/assets/illustrations/vocab/wristwatch-v1.webp` | `/assets/illustrations/vocab/wristwatch-v1.webp` |
| `web/public/assets/illustrations/vocab/camera-v1.webp` | `/assets/illustrations/vocab/camera-v1.webp` |
| `web/public/assets/illustrations/vocab/desk-v1.webp` | `/assets/illustrations/vocab/desk-v1.webp` |
| `web/public/assets/illustrations/vocab/chair-v1.webp` | `/assets/illustrations/vocab/chair-v1.webp` |
| `web/public/assets/illustrations/vocab/coffee-v1.webp` | `/assets/illustrations/vocab/coffee-v1.webp` |
| `web/public/assets/illustrations/vocab/compact-disc-v1.webp` | `/assets/illustrations/vocab/compact-disc-v1.webp` |
| `web/public/assets/illustrations/vocab/television-v1.webp` | `/assets/illustrations/vocab/television-v1.webp` |
| `web/public/assets/illustrations/vocab/radio-v1.webp` | `/assets/illustrations/vocab/radio-v1.webp` |
| `web/public/assets/illustrations/vocab/laptop-v1.webp` | `/assets/illustrations/vocab/laptop-v1.webp` |
| `web/public/assets/illustrations/vocab/car-v1.webp` | `/assets/illustrations/vocab/car-v1.webp` |
| `web/public/assets/illustrations/vocab/chocolate-bar-v1.webp` | `/assets/illustrations/vocab/chocolate-bar-v1.webp` |
| `web/public/assets/illustrations/vocab/planner-v1.webp` | `/assets/illustrations/vocab/planner-v1.webp` |
| `web/public/assets/illustrations/vocab/magazine-v1.webp` | `/assets/illustrations/vocab/magazine-v1.webp` |

Bài 8 bổ sung 16 từ vựng và cover `scenes/adjective-town-v1.webp`; ngày 06/10 thêm 42 cutout Bài 2/3/4/8, cover Bài 2/3/4 và grammar `koko-soko-asoko-v1`. Batch `lesson-05` thêm 16 từ Bài 5 và cover `scenes/station-platform-v1.webp`. Danh sách PNG/JSON/WebP và mapping thật ở [kho nguồn](../../artwork/illustrations/README.md).

## 4. Khuôn xuất ảnh

| Nhóm | Khuôn nguồn xuất ban đầu | Cách hiển thị |
| --- | --- | --- |
| Banner | 1200 × 400, tỷ lệ 3:1 | Có vùng crop an toàn; chữ/nút ở component thật |
| Scene chủ đề | 800 × 600, tỷ lệ 4:3 | Cùng nguồn cho cover bài và thumbnail qua responsive sizing |
| Vocabulary | 512 × 512, tỷ lệ 1:1 | `contain`, không cắt mất đồ vật/hành động quan trọng |
| Grammar | 800 × 600, tỷ lệ 4:3 | `contain`; công thức và nhãn dựng bằng HTML/Furigana |
| State/decor | 512 × 512, tỷ lệ 1:1 | Có alpha thật khi cần đặt lên nhiều bề mặt |

Đây là khuôn sản xuất ban đầu, không phải token giao diện. Khi một tình huống cần kích thước khác, ghi kích thước thật và lý do trong provenance; không kéo méo ảnh. Ảnh trong cùng nhóm giữ cách căn chủ thể và khoảng trống tương tự. Cảnh rộng giữ chi tiết thiết yếu trong vùng giữa, tránh buộc tạo hai ảnh mobile/desktop ngay từ đầu.

Ngân sách mục tiêu: banner mobile khoảng 80–150 KB được truyền, hình từ khoảng 20–50 KB; tổng ảnh trên màn đầu khoảng 200 KB. Đo file thực sau encode và request responsive; đây **không phải số đã benchmark**. Ưu tiên giữ nét vẽ và alpha khi chọn mức nén; không chạy nén lặp lại trên bản WebP đã nén.

## 5. Hợp đồng dữ liệu

Đã bổ sung **một kiểu dùng chung** trong `web/src/types/index.ts`, tái sử dụng `LocalizedText`:

```ts
interface IllustrationAsset {
  src: string;              // URL root-relative /assets/illustrations/...
  width: number;            // kích thước pixels của file nguồn đã xuất
  height: number;
  alt: LocalizedText;       // có vi; dùng { vi: '' } khi chỉ trang trí
}

// Các trường optional đã triển khai:
// Lesson.cover?: IllustrationAsset
// VocabWord.illustration?: IllustrationAsset
// GrammarPoint.illustration?: IllustrationAsset
// GrammarPoint.illustrationCaption?: LocalizedText
```

Các trường optional; không có ảnh thì giữ nguyên trải nghiệm chữ. Không thêm string rỗng hoặc ảnh placeholder để làm đầy dữ liệu. Không tự suy URL từ `word.id`, kana, nghĩa hoặc số bài, và không đổi ID đang dùng cho FSRS/tiến độ để khớp tên ảnh.

Tham chiếu thật hiện tại: cover Bài 1/2/3/4/8; Bài 1: 2 từ (`gakusei`, `isha`); Bài 2: 26 từ + grammar `kore-sore-are`; Bài 3: 19 từ + grammar `koko-soko-asoko`; Bài 4: 16 từ; Bài 5: 16 từ + cover; Bài 6: 34 từ + cover; Bài 7: 32 từ + cover; Bài 8: 35 từ; Bài 9: 16 từ + cover; Bài 10: 25 từ + cover. Tổng 233 tham chiếu, trong đó `kutsu`, `kaigi`, `pasokon`, `hana`, `shatsu`, `otousan`, `okaasan` dùng lại ảnh có sẵn đúng nghĩa. Caption của grammar là nội dung trong JSON, dựng bằng HTML/Furigana; mô tả rõ vai trò người nói/nghe và ba khoảng cách. `lessons.ts` kiểm metadata optional tại biên nạp bằng `validateIllustrationAsset`; test nội dung kiểm tồn tại file/case/dimensions, và kiểm mọi sidecar `added-to-learning-data` vẫn còn được tham chiếu. Nội dung bài lấy từ bundled JSON, Dexie lưu tiến độ/audio nên không cần migration ảnh.

Ví dụ cấu trúc phần ảnh của `gakusei`, nay đã có file và tham chiếu thật:

```json
{
  "illustration": {
    "src": "/assets/illustrations/vocab/student-v1.webp",
    "width": 512,
    "height": 512,
    "alt": { "vi": "Một sinh viên mang sách." }
  }
}
```

Ví dụ `Lesson.cover` trỏ tới `/assets/illustrations/scenes/self-introduction-v1.webp`, kích thước 800 × 600. Một `GrammarPoint.illustration` cũng có thể tham chiếu cùng scene khi scene thật sự diễn đạt đúng tình huống; không cần copy file sang `grammar`.

Giữ đường dẫn bắt đầu bằng `/assets/illustrations/`, dùng `/` dù đang làm trên Windows. **Không** ghi `web/public/...`, `D:\...`, `file://...`, base64, URL tải tạm của công cụ hay UUID vào JSON học. `src` xác định file gốc; không lưu URL `/_next/image?...` do Next sinh ra.

Tham chiếu đặt ngay trong JSON bài/từ hiện có. Không thêm asset registry, resolver, manifest runtime hay bảng Dexie chỉ để quản lý bộ ảnh nhỏ này. Metadata nguồn trong `artwork` không được import vào renderer hoặc dữ liệu học.

## 6. Bản gốc và provenance

Bản gốc theo cùng đường dẫn nhóm và cùng stem tên với file production. Ví dụ:

```text
artwork/illustrations/vocab/student-v1.png
artwork/illustrations/vocab/student-v1.json
web/public/assets/illustrations/vocab/student-v1.webp
```

Sidecar JSON tối thiểu lưu `createdAt`, `source` (ví dụ `image_gen`), `prompt` đầy đủ, `referenceImages` (đường dẫn repo-relative tới mẫu thật đã dùng), `output` (đường dẫn repo-relative file production), `width`, `height`. Với ảnh sửa, giữ prompt gốc và prompt sửa theo thứ tự. Ghi nguồn cho asset có sẵn; không bịa prompt cho ảnh không được generate. Đây là hồ sơ của từng file, không phải bản sao schema dữ liệu học.

Lưu ảnh tham chiếu phong cách được chọn cùng bản gốc và dùng lại khi tạo các nhóm tiếp theo. Không lấy toàn bộ screenshot UI làm ảnh hiển thị trong app; tạo cảnh/cutout riêng. Giữ chữ, logo, icon và nút ngoài raster.

Để tăng tốc các đồ vật đơn giản cùng phong cách, có thể tạo một atlas (mặc định 2 × 2; 4 × 2 cho vật gọn) rồi tách thành các PNG/WebP độc lập. Atlas và manifest chỉ nằm trong `artwork/illustrations/atlases/`; app tiếp tục dùng từng URL như trước. Dùng kích thước nguồn thực, không suy từ kích thước yêu cầu trong prompt. Crop từng chủ thể được tính tự động; cả bốn biên crop phải có alpha 0 trước khi xuất. Không xóa nét, không chroma-key nền giả. Sidecar từng ảnh ghi `sourceImage` và crop để truy nguồn. Xuất theo khuôn §4 bằng [batch.mjs](../../artwork/illustrations/tools/batch.mjs) (quy trình ở [kho nguồn](../../artwork/illustrations/README.md)); kiểm ảnh sau encode trước khi gắn dữ liệu. Cảnh ngữ pháp và nhân vật phức tạp cần kiểm riêng, không mặc định đưa vào atlas.

Mẫu hiện tại: [paper-town-style-v1.png](../../artwork/illustrations/reference/paper-town-style-v1.png); [brief sản xuất](../../artwork/illustrations/STYLE.md) và prompt sidecar ở cùng kho nguồn. Mẫu này lấy phong cách từ concept desktop Phố giấy; banner và scene mới cùng tham chiếu trực tiếp mẫu này.

## 7. Quy trình thêm hoặc thay ảnh

1. Kiểm tra có ảnh dùng lại đúng nghĩa/tình huống chưa. Chọn nhóm và tên subject trước khi generate.
2. Tạo/sửa bản gốc với cùng ảnh mẫu phong cách; lưu provenance ngoài `public`.
3. Xuất WebP theo khuôn bằng `batch.mjs check/export`, kiểm nét/alpha/crop và dung lượng. Đặt file production trước khi thêm tham chiếu.
4. Cùng một thay đổi: bổ sung hoặc cập nhật `cover`/`illustration` trong JSON (`batch.mjs link`) sau khi schema được triển khai; dùng đúng width/height của file, viết alt theo ngữ cảnh. Giữ nguyên ID học tập.
5. Khi đổi ảnh đã dùng: thêm `vN+1`, tìm tất cả tham chiếu `src` cũ trong `web/src` và cập nhật nơi cần thay. Không bắt buộc đổi mọi nơi nếu vẫn cần cả hai phiên bản.
6. Giữ bản cũ khi còn dữ liệu hoặc deployment đang tham chiếu. Chỉ dọn sau khi kiểm tra toàn bộ phạm vi dữ liệu và các deployment cũ cần hỗ trợ; không suy từ search local không có hit thành đã an toàn xóa trên CDN.
7. Chạy kiểm tra theo phạm vi. Khi bắt đầu triển khai schema/renderer, thêm kiểm tra biên dữ liệu: đường dẫn hợp lệ, tồn tại file với đúng hoa/thường, kích thước/format khớp, alt.vi hợp lệ. Bản Windows phải kiểm tra chính xác case để không hỏng trên host Linux.

## 8. Tải ảnh và fallback

- `next/image` với width/height nguồn và `sizes` theo bố cục thực; thumbnail không tải banner nguyên cỡ. Lazy-load phần ngoài viewport; chỉ ưu tiên ảnh đầu màn khi cần cho LCP.
- Lưu file ở `public` phục vụ việc JSON giữ URL trực tiếp. Đây là lựa chọn cho kho tham chiếu dữ liệu; không bắt buộc dùng static import cho mọi ảnh.
- `next.config.ts` đặt `public, max-age=31536000, immutable` cho WebP có hậu tố `-vN.webp` trong prefix minh họa. Đã kiểm trên `next start` local: ảnh khớp có immutable; README/logo ngoài pattern vẫn max-age=0. Còn kiểm headers trên host triển khai thật. Không ghi đè bytes tại URL đã dùng.
- Ảnh ở đây là file phát hành theo app; không thêm vào Supabase sync hoặc Dexie `pendingSync`. Không cache toàn bộ 991 mục từ chỉ vì đang học một bài.
- Flashcard chỉ hiển thị ảnh gợi nghĩa sau khi reveal. Trong câu hỏi chấm nghĩa/đọc, không tự thêm ảnh làm lộ đáp án. Có thể chuẩn bị một ảnh kế tiếp trong phiên; không bắt lưu kết quả chờ ảnh.
- Ảnh lỗi/mất mạng: giữ nội dung, điều khiển và khả năng học/lưu. Cache browser không bảo đảm mọi ảnh dùng được khi mất mạng; không mở rộng thành cam kết offline reload hoặc thêm service worker trong đợt này.
- Ảnh trang trí dùng alt rỗng. Ảnh hỗ trợ nội dung có alt tiếng Việt phù hợp; công thức và chữ Nhật thật vẫn đọc được khi ảnh không tải.

`Illustration.tsx` dùng chung `next/image`, width/height và `sizes` theo từng vị trí; lazy mặc định, eager/high chỉ cho banner/cover đầu màn. `onError` bỏ ảnh lỗi, giữ chữ/điều khiển ở component cha. Ảnh flashcard chỉ mount khi `revealed`; mặt trước không có DOM/request ảnh. Lượt kiểm mobile đã xác nhận điều này và chấm thẻ mất mạng vẫn lưu review + pendingSync. Ảnh đã lỗi không tự retry ngay trong cùng instance; mở lại nội dung sau reconnect tạo instance/request mới.

Vị trí pilot: banner dưới lời chào Bảng tin; cover bên cạnh header bài trên desktop và ảnh nhỏ trong header mobile; 5 thumbnail trong bảng nghĩa tham khảo Bài 2 và mặt sau thẻ; grammar dưới giải thích, có caption; state trong trang Ôn khi hết mục đến hạn/mới (kể cả đã đạt hạn mức). Không đổi CTA/queue/chấm điểm hoặc thêm ảnh vào đề luyện tập chấm nghĩa.

## 9. Trạng thái và nghiệm thu

- [x] Chốt quy ước tên/thư mục/URL/version và hợp đồng tham chiếu dự kiến.
- [x] Tạo khung production và chỗ lưu nguồn; thêm liên kết để các agent tìm được.
- [x] Tạo mẫu phong cách; xuất và xem lại banner 1200 × 400/cảnh giới thiệu bản thân 800 × 600. Bytes/hash trong sidecar; chưa đo mạng hoặc UI.
- [x] Mở rộng pilot: 5 đồ vật Bài 2 (`hon`, `nooto`, `enpitsu`, `kasa`, `kaban`), grammar `kore-sore-are`, state `review-complete`; xem WebP sau encode, kiểm alpha/giải mã/kích thước. Chưa thêm tham chiếu vào dữ liệu học.
- [x] Bổ sung optional fields vào types, cập nhật 7 tham chiếu JSON và kiểm tra case/dimensions/format/alt/path trong test.
- [x] Mở rộng thêm 10 từ Bài 1–2, giữ bytes của 9 pilot; tổng 19 WebP/17 tham chiếu nội dung. Nguồn PNG có alpha thật, cùng mẫu v1 và book chỉ làm tham khảo chất nét; xuất 512 × 512, 15.008–41.552 bytes/ảnh. Check/test/build và browser theo handoff.
- [x] Tăng tốc bằng atlas 8 đồ vật, xuất riêng và tích hợp Bài 2; tổng 27 WebP/25 tham chiếu. Thời gian tạo nguồn đo được 46.539 ms; xuất 8 file 30.980 ms, chưa tính review/tích hợp. Check/test/build và browser theo handoff.
- [x] Tạo và tích hợp 16 minh họa từ vựng + cover Bài 8; tổng 44 WebP/42 tham chiếu. Kiểm alpha/crop/hash, bảo toàn 53 mục từ và 27 ảnh cũ; check/test/build/browser theo handoff.
- [x] 06/10: thêm 42 cutout Bài 2/3/4/8 (atlas ChatGPT web có alpha thật, crop trên đường alpha 0, không sửa pixel), cover Bài 2/3/4 và grammar Bài 3 (Antigravity, nền đục); tổng 90 WebP/90 tham chiếu. Bảo toàn 191 mục từ; check, 274 test và browser 390/1440px theo handoff.
- [x] 06/10: workflow batch (`batch.mjs` prompts/check/export/sheet/link, `detect-crops.mjs`, test suy từ sidecar). Batch Bài 5 thêm 16 từ + cover, tổng 107 WebP/107 tham chiếu; check và 274 test theo handoff. Chưa kiểm browser cho Bài 5.
- [x] 06/10: batch Bài 6–10 và 6 cutout lỗi cũ (Bài 8): 121 WebP mới, tổng 228 WebP/233 tham chiếu. Check, 274 test, build, browser `/hoc/6`–`/hoc/10` ở 390px và flashcard Bài 6 theo handoff.
- [x] ~~Tạo lại riêng 6 cutout lỗi rãnh alpha~~ (đã làm trong batch Bài 8) (`restaurant`, `dormitory`, `quiet-library`, `lively-street`, `busy-worker`, `having-fun`) rồi gắn dữ liệu; chạy lại review độc lập (worker trước bị gián đoạn khi Orca dừng).
- [x] Tích hợp renderer, cache có version và fallback; kiểm response headers production local.
- [x] Browser 390/1440px, keyboard focus, caption Nhật/Việt, dark/furigana lớn/reduced motion và ảnh lỗi/mất mạng khi lật/chấm trong tab đang mở — phạm vi chi tiết ở handoff.
- [ ] Kiểm deployment thật/cache, thiết bị thật và toàn bộ các trường hợp ngoài pilot; stress 360px với font gốc 20px còn lỗi tràn header AppNav có sẵn (không do ảnh).

Không đánh dấu tính năng minh họa hoàn tất từ việc chỉ chốt tài liệu. Bằng chứng của đợt này ở [handoff SPEC-21](../handoff/SPEC-21.md).

## 10. Brief tạo asset

Tạo cảnh/cutout minh họa riêng theo hướng Phố giấy và ảnh mẫu đã chọn; tuân `DESIGN.md` về ngữ nghĩa UI, đọc được và không che hành động chính. Đầu vào mỗi ảnh gồm subject, vai trò, khuôn §4, tên file dự kiến, prompt và ảnh tham chiếu. Không generate logo, UI text, đáp án, công thức ngữ pháp hoặc màn hình hoàn chỉnh làm asset production. Kiểm tính nhất quán với mẫu và tính phù hợp nội dung trước khi xuất. Các concept đã có nằm ở `new-ui/`; prompt sản xuất cụ thể nằm cùng bản gốc khi ảnh được tạo.
