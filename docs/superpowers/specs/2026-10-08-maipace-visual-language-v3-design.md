# MaiPace · Ngôn ngữ thị giác v3 "Sách sống" — thiết kế

Ngày: 08/10/2026 · Trạng thái: **đã duyệt hướng, chờ duyệt spec** · Phạm vi đợt 1: nền tảng + Home.

## 1. Bối cảnh và quyết định

- Ngôn ngữ v3 **thay luật Stage + PaperSlip**. Hướng thị giác lấy từ ảnh GPT trong
  `maipace-local-ui-kit-v2/repo-overlay/references/ui/` (Living Textbook, Home, Practice).
- Root `AGENTS.md`, `DESIGN.md`, `PRODUCT.md` đang để rỗng **có chủ đích** để agent không bám luật cũ.
  `DESIGN.md` sẽ được **viết lại từ kết quả đã triển khai** sau khi Home v3 xong (không viết trước).
  `AGENTS.md` nên được viết lại phần kỹ thuật (pnpm, Dexie, FSRS, furigana, kiểm tra) — việc riêng.
- Ràng buộc kỹ thuật trong code vẫn giữ: Dexie là nguồn dữ liệu, ôn tập qua `lib/fsrs.ts`,
  notation `私[わたし]`, dữ liệu bài học trong `web/src/data/n5/`.
- Tham chiếu thị giác đã duyệt: `design-lab/home-v3.html` — **bố cục C2** (khung "Bố cục C2"),
  dùng `design-lab/lab-v3.css`. Mockup là tĩnh, không phải component spec pixel.

Lựa chọn đã chốt (đánh số theo `design-lab/language.html`):

| # | Hạng mục | Chọn |
|---|---|---|
| 1 | Chữ | **B** — serif cho chữ hiển thị + Mincho cho tiếng Nhật, sans cho giao diện |
| 2 | Tiêu đề mục | **B** — sans + nút viên thuốc "Xem tất cả ›" |
| 3 | Nút chính | **B** — `rounded-xl`, đỏ son, mũi tên |
| 4 | Thẻ "Hôm nay" | **A** — mảnh giấy washi mép xé |
| 5 | Phần bài học | **B** — hàng ngang đánh số + ảnh nhỏ |
| 6 | Dòng danh sách | **A** — dòng giấy: icon, tiêu đề, mô tả, chevron |
| 7 | Tra cứu | **B** — một ô tìm + một nút "Bảng tra" |
| 8 | Tranh | **Tranh chữ nhật mờ mép** + **mây giấy** sau chữ đặt trên tranh; bố cục **C2** (dải trên) |

C1 (tranh lệch phải, chữ đè trái) **hoãn** đến khi có tranh hero cận nhân vật — xem §8.

## 2. Nền tảng

### 2.1 Màu
Giữ nguyên token "Phố giấy" trong `web/src/app/globals.css` (`:root`, `.dark`). Không thêm màu mới.
Mọi màu trong component đi qua token; mask dùng `black`/`transparent` là kênh alpha, không phải màu.

### 2.2 Chữ
| Vai trò | Font | Token |
|---|---|---|
| Chữ hiển thị (lời chào, tiêu đề lớn) | Noto Serif | `--font-serif` (dùng lại utility `font-serif` đã có ở nhiều màn) |
| Câu tiếng Nhật hiển thị lớn | Shippori Mincho | `--font-jp-display` (mới) |
| Giao diện, thân bài, nhãn, nút | Be Vietnam Pro | `--font-sans` (thay Inter) |
| Tiếng Nhật cỡ nhỏ (bảng tra, thẻ, danh sách) | giữ Hiragino/Noto Sans JP | `--font-jp` (giữ) |

- Tự host qua `@fontsource` (cùng cách Inter/Noto Sans JP hiện tại); **không** gọi Google Fonts —
  app offline-first. Kiểm tra gói/phụ đề tiếng Việt và kích thước tải trước khi chốt trọng số.
- Không tham chiếu vòng `--font-sans` trong `@theme inline`.

### 2.3 Ngắt dòng tiếng Nhật (luật toàn app)
Câu tiếng Nhật **chỉ xuống dòng tại dấu cách có trong dữ liệu**; mỗi cụm giữa hai dấu cách là
một khối không ngắt. Ví dụ `電車[でんしゃ]で 会社[かいしゃ]へ 行[い]きます。` được phép thành
`電車で 会社へ / 行きます。`, **không bao giờ** `… 行き / ます。`.
Sửa **một chỗ**: `web/src/components/Furigana.tsx` gom các segment của `parseFurigana` theo dấu
cách thành khối `white-space: nowrap`. Có test hồi quy (ví dụ đúng và sai).

### 2.4 Chữ dài (luật toàn app)
- Hàng gồm nhãn + chữ dài phải **xếp chồng** khi không đủ chỗ (flex-wrap/1 cột): nhãn một dòng,
  chữ dài xuống dưới, **căn trái**, rộng hết. Không căn phải chữ nhiều dòng.
- Không cắt/`line-clamp` nội dung học. Nút/icon giữ kích thước; chevron/icon bám dòng đầu.
- Furigana phóng to (`--furigana-scale` 1.5) không làm vỡ bố cục.

### 2.5 Chữ giao diện tối giản (luật toàn app)
Màn hình ít chữ nhất có thể; nội dung học (tiếng Nhật + nghĩa) là phần chữ chính.
- **Lời chào:** một dòng ngắn theo giờ ("Chào buổi sáng"), không câu phụ, không câu động viên.
- **Không đoạn giải thích** dưới tiêu đề/lời chào. Hướng dẫn chỉ hiện khi người học yêu cầu.
- **Nhãn ≤ 4 từ**, mô tả phụ tối đa **một dòng ngắn** và chỉ khi mang dữ liệu (số lượng, tiến độ):
  "12 mục đến hạn", "Câu 3/10" — không "Từ vựng · Mẫu câu · Hội thoại", không câu mô tả nội dung.
- `PartRow`: tiêu đề + số liệu (vd. "Từ vựng · 18 từ"), không câu mô tả.
- Trạng thái xong: một tiêu đề ngắn ("Đã xong phần ôn hôm nay"), không đoạn văn.
- Nghĩa tiếng Việt của câu tiếng Nhật **giữ** (là nội dung học, không phải chữ giải thích).
- Nếu bỏ một dòng chữ mà người học vẫn biết làm gì tiếp → bỏ.

### 2.6 Bản tối
- Tranh màu nước giảm sáng nhẹ (`brightness ~0.88`) để không thành mảng sáng chói trên nền tối.
- Logo thuộc `AppNav` (dùng `maipace-mark.svg`), Home không có header riêng; đợt này không đổi `AppNav`.
- Mây giấy dùng `var(--background)` nên tự đổi theo theme.

## 3. Thành phần

Đã có ở `web/src/components/PaperKit.tsx` (CSS `.soft-scene`, `.paper-cloud`, `.torn-card*` trong
`globals.css`), **song song** `PaperStage.tsx`; 7 màn đang dùng `Stage/PaperSlip/LinkRow` giữ nguyên cho
đến đợt chuyển của từng màn.

| Thành phần | Mô tả | Tham chiếu mockup |
|---|---|---|
| `SoftScene` | Bọc `Illustration`; giữ **khung chữ nhật**, mờ một dải hẹp ở mỗi mép bằng 2 `linear-gradient` mask giao nhau (`mask-composite: intersect`). Mặc định: trái/phải ~1.75rem, trên ~1.25rem, dưới ~2.5rem (biến CSS điều chỉnh được). Ảnh lỗi → chỉ còn nội dung con. | `.soft-scene` trong `lab-v3.css` |
| `PaperCloud` | Lớp nền màu giấy mờ viền phía sau khối chữ đặt trên tranh; lõi gần đục dưới chữ, chỉ mép tan. Thân ≥ 4.5:1, tiêu đề ≥ 3:1, sáng và tối. | `.paper-cloud` |
| `TornCard` | Thẻ giấy washi mép xé (`clip-path`, bóng ở lớp bọc), viền mảnh + quầng accent góc trên phải; chứa hành động chính của màn. Nhãn nhỏ trong thẻ dạng serif đỏ `/ Hôm nay /`. | thẻ "Hôm nay" C1 |
| `SectionHeader` | Tiêu đề sans + nút viên thuốc "Xem tất cả ›" (tùy chọn). | |
| `ListRow` | Dòng giấy: ô icon 36px (icon 24px), tiêu đề, mô tả, chevron; cả dòng là link. Kế thừa hành vi `LinkRow`. | |
| `PartRow` | Hàng ngang: ô icon 40px (`FeatureIcon` 24px), tiêu đề + số liệu **cùng hàng** (số liệu `text-sm` mờ `muted-foreground/80`), ảnh nhỏ 48px trong khung `bg-secondary`. Không có số thứ tự. | |
| Nút chính | `Button` hiện có, bo `rounded-xl`; không tạo button mới. | |
| Nút đọc | `SpeakButton` nhận `className`: tròn 44px, nền `secondary`, viền, icon `primary`. | |
| Tra cứu | `SearchTrigger variant="bar"` với nút "Bảng tra" (icon bảng) **nằm trong** ô tìm, mép phải → `/hoc/tra-cuu`. | |

### 3.1 Icon (`web/src/components/FeatureIcon.tsx`)
- `<FeatureIcon name="…" className="size-6 text-primary" />`: path SVG đổ `currentColor`; màu theo class chữ,
  cỡ theo `size-*`. Dùng từ 24px. Có `title` khi icon mang nghĩa một mình.
- **Hai bộ, không dùng lẫn**:
  - Icon thẻ (thành phần học): `vocab`, `grammar`, `listening`, `reading`, `kanji`, `kana`, `verbs`, `lesson`,
    `review`, `practice`, `lookup`, `weak-points`, `home`.
  - Icon thanh điều hướng: `nav-home`, `nav-lesson`, `nav-practice`, `nav-review`, `nav-lookup` — cùng khung,
    nhìn thẳng, 2–3 nét, không nét kép/chéo.
- Chuẩn nét: đo trên khung 240, Lucide 2px = 20; icon MaiPace 21–24. Icon đặt cạnh Lucide phải cùng độ đậm và
  cùng cỡ thị giác. Icon chức năng chung (đồng hồ, chevron, loa, tìm kiếm trên thanh đầu…) vẫn dùng Lucide.
- Nguồn, prompt và cách build lại: `artwork/icons/README.md` (`node build.js`). Không sửa tay path.
- Thêm icon: vẽ atlas mới cùng quy tắc (lưới 24px/nét 2px, khe ≥ 1,5× nét, 3–4 nét), build, so cạnh Lucide
  ở 24px trong ô accent sáng/tối trước khi dùng.

### 3.2 Ảnh nhỏ cho hàng phần bài
- Ưu tiên ảnh thật của bài (`LessonSummary.vocabThumb`/`grammarThumb`). Ảnh đầu tiên là hình người đứng hẹp
  thì chọn ảnh khác qua bảng `VOCAB_THUMB` trong `lib/lessons.ts`.
- Không có ảnh phù hợp → ảnh chung `ui/sections/{vocabulary,grammar,listening}-v1.webp`
  (batch `artwork/illustrations/batches/home-sections.json`).

## 4. Home (màn áp dụng đầu tiên)

Thứ tự từ trên xuống (C2; logo/điều hướng do `AppNav` lo): `SoftScene` dải trên (tranh bìa bài đang học
`activeSummary.cover`) → lời chào một dòng (§2.5) trong `PaperCloud` (phần dưới dải tranh) → `TornCard`
(nhãn `/ Hôm nay /`, meta bài có icon sách, câu `pickTodaySentence` + `SpeakButton`, nghĩa in nghiêng,
nút chính) → các dòng phụ (`ListRow`) → `SectionHeader` "Các phần trong bài" + "Xem tất cả" (`/hoc/N`) với
3 `PartRow` → tra cứu. (Đã bỏ `SectionHeader` "Hôm nay" phía trên thẻ theo góp ý người dùng 08/10.)

### 4.1 Đổi luật nút chính (quyết định của người dùng)
Nút đỏ chính **luôn là hành động bài học**:
- người mới → "Bắt đầu Bài 1" (`/hoc/1`);
- còn lại → "Tiếp tục Bài N" (`/hoc/N`).

Mục đến hạn và phiên dở **không còn chiếm nút chính**; chúng là `ListRow` dưới thẻ:
phiên dở ("Phiên luyện tập dở · Bài 4", giữ `clearNewSessionRequest`) đứng trước, rồi
"Ôn tập đến hạn" (giữ đường `/on-tap` khi có nháp Luyện/Ôn để hộp xác nhận bảo vệ nháp).
Sửa `web/src/lib/dashboard-cta.ts` + `dashboard-cta.test.ts`: test cũ "ôn thắng" đổi thành
"bài học luôn là CTA; ôn/nháp là hàng phụ", thêm ca biên (batchCount âm/NaN, người mới có nháp).

### 4.2 Trạng thái (dữ liệu thật, không bịa số)
| Trạng thái | Điều kiện (hook hiện có) | Nội dung phụ |
|---|---|---|
| Mới | `isNewUser` | Không có mục ôn (một dòng nhẹ hoặc ẩn); tra cứu |
| Bình thường | có bài đang học | 3 `PartRow` (Từ vựng / Ngữ pháp / Luyện nghe — link tới các khối có sẵn của `/hoc/N`) + 1 dòng ôn |
| Nhiều việc | có nháp và/hoặc `totalDueCount` lớn | từng dòng nháp (`useActiveDrafts`) + **một** dòng ôn dùng chuỗi hiện có "N mục đến hạn · M mục mới" (`useDueQueue` không tách theo loại; không thêm API cho đợt này) |
| Xong hôm nay | không còn mục đến hạn, đã có lịch sử ôn | ảnh `ui/states/review-complete-v1.webp`, "Đã xong phần ôn hôm nay", một gợi ý "Luyện tập tự chọn" (`/luyen-tap`); tra cứu đã có sẵn ở mục Tra cứu |

Không đưa tính năng chưa có: chuông thông báo, viết tay/camera/giọng nói/quét, "Ôn nhanh 5 phút",
phần "Hội thoại".

## 5. Lỗi và trường hợp biên
- Ảnh tranh lỗi/mất mạng trong tab đang mở: `Illustration` fallback, chữ vẫn đọc được trên giấy.
- Không có câu hôm nay: dùng `jpTitle` như hiện tại.
- Dữ liệu Dexie đang tải: skeleton giữ chiều cao, không nhảy bố cục.
- Reduced motion: không có chuyển động trang trí mới.

## 6. Kiểm tra
- `pnpm check`, `pnpm test` (gồm test `Furigana` ngắt cụm và `dashboard-cta` mới), `pnpm build`.
- Browser (dev server riêng port, kiểm `<title>` là MaiPace): 360/390/1280 px · sáng/tối ·
  4 trạng thái (seed IndexedDB) · khung chữ dài (tên bài dài, furigana 1.5×) · bàn phím/focus ·
  reduced motion. Đặt ảnh chụp cạnh `design-lab/home-v3.html` (C2) để so hierarchy.
- **Tự QA trước khi đưa người dùng review** (bắt buộc): chụp app và mockup cạnh nhau ở 390 px sáng + tối,
  liệt kê mọi điểm lệch (nhãn, icon, viền, hình ô, ảnh nhỏ, đậm/nghiêng chữ), sửa hoặc ghi lý do giữ.
- Đo tương phản chữ trên `PaperCloud` ở cả hai theme.

## 7. Triển khai
Plan → Antigravity (Orca, `gemini-3.8-flash-high`) làm theo phần việc có danh sách file sở hữu;
coordinator review toàn bộ diff và tự kiểm browser. Làm trên feature branch; không merge/push khi
chưa được yêu cầu. Workers không chạy dev server/build.

## 8. Ngoài phạm vi (đợt sau)
- 7 màn còn lại chuyển sang v3 (mỗi màn một spec/đợt): danh sách bài, chi tiết bài, phiên luyện,
  kết quả, ôn tập, luyện tập, tra cứu.
- **Tranh hero cận nhân vật** (pipeline minh họa riêng) → khi có, nâng Home lên bố cục C1.
- Viết lại `DESIGN.md` từ Home đã triển khai; viết lại phần kỹ thuật của `AGENTS.md`.
- Concept Kinetic (kéo thả trợ từ) là tính năng mới, không thuộc đợt này.
