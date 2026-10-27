# MaiPace — Ngôn ngữ thị giác v3 "Sách sống"

Chuẩn giao diện **duy nhất** của app. Giá trị token nằm ở `web/src/app/globals.css`; thành phần
ở `web/src/components/PaperKit.tsx` và `FeatureIcon.tsx`. Tham chiếu thị giác đã triển khai:
`design/home/as-built-light.png`, `as-built-dark.png`. Màn cũ khác file này thì file này đúng.

## 1. Tinh thần

Một trang sách giấy có tranh màu nước. Nội dung học (câu tiếng Nhật và nghĩa) là nhân vật chính;
chữ giao diện ít nhất có thể. Mỗi màn có **một** hành động chính rõ ràng; các việc khác là dòng phụ.

## 2. Màu

Dùng token, không hardcode màu trong component (mask `black`/`transparent` là kênh alpha, được phép).
Không thêm màu mới.

| Token | Vai trò |
|---|---|
| `background` / `foreground` | Giấy ngà / mực sumi ấm |
| `card` | Thẻ, dòng giấy |
| `primary` | Đỏ son: nút chính, nhãn nhấn, trạng thái đang chọn |
| `secondary`, `muted` | Kem: nền phụ, khung ảnh nhỏ, nút viên thuốc |
| `muted-foreground` | Chữ phụ, số liệu (đạt ≥ 4.5:1) |
| `accent` / `accent-foreground` | Sakura: ô icon, vùng nhấn nhẹ |
| `border` | Viền mảnh |
| `success`, `warning`, `info`, `destructive` | Phản hồi; **luôn kèm icon** (✓, ✕…), màu không tự mang nghĩa. Ô đáp án chỉ hiện icon; chữ "Đúng"/"Chưa đúng" nằm ở `sr-only` |
| `verb-1..3`, `chart-1..5` | Nhóm động từ, biểu đồ |

Bản tối có bộ giá trị riêng trong `.dark` (không đảo màu tự động).

## 3. Chữ

| Vai trò | Font | Cách dùng |
|---|---|---|
| Hiển thị (lời chào, tiêu đề lớn) | Noto Serif | `font-serif`, `text-2xl sm:text-3xl font-semibold` |
| Câu tiếng Nhật hiển thị lớn | Shippori Mincho | `Furigana` + class `jp-display`, `text-2xl sm:text-3xl font-bold` |
| Giao diện, nhãn, nút, thân | Be Vietnam Pro | mặc định (`font-sans`) |
| Tiếng Nhật cỡ nhỏ (bảng, thẻ, danh sách) | Hiragino / Noto Sans JP | class `jp` (`font-jp`, line-height 2) |

`Furigana` tự gắn `jp` lên phần tử bên trong, nên `jp-display` và cỡ chữ phải truyền **vào prop `className` của `Furigana`**,
không đặt ở thẻ cha (đặt ở thẻ cha thì chữ vẫn ra font sans).

Cỡ thường dùng: tiêu đề mục `text-lg font-semibold`; thân `text-base`; số liệu và chữ phụ
`text-sm text-muted-foreground`. Font tự host qua `@fontsource` (offline-first); không gọi Google Fonts.

## 4. Luật chữ (toàn app)

**Ngắt dòng tiếng Nhật.** Chỉ xuống dòng tại dấu cách có trong dữ liệu; mỗi cụm giữa hai dấu cách
không bị ngắt (`電車で 会社へ / 行きます。`, không bao giờ `行き / ます。`). `Furigana` đã xử lý;
không tự ngắt câu tiếng Nhật ở chỗ khác.

**Chữ dài.** Hàng nhãn + chữ dài xếp chồng khi thiếu chỗ (`flex-wrap`), căn trái, rộng hết. Không cắt
hay `line-clamp` nội dung học. Icon và chevron giữ kích thước, bám dòng đầu. Furigana phóng to
(`--furigana-scale` 1.5) không được làm vỡ bố cục.

**Chữ giao diện tối giản.**
- Lời chào một dòng theo giờ ("Chào buổi sáng"); không câu phụ, không câu động viên.
- Không đoạn giải thích dưới tiêu đề. Hướng dẫn chỉ hiện khi người học yêu cầu.
- Nhãn ≤ 4 từ. Chữ phụ tối đa một dòng ngắn và chỉ khi mang dữ liệu ("12 mục đến hạn", "Câu 3/10").
- Trạng thái xong: một tiêu đề ngắn, không đoạn văn.
- Nghĩa tiếng Việt của câu tiếng Nhật là nội dung học, luôn giữ.
- Bỏ một dòng chữ mà người học vẫn biết làm gì tiếp → bỏ.

## 5. Bố cục

- Mobile trước, kiểm ở 360 và 390 px. Vùng nội dung: `mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8`.
- Khung (`AppNav` + layout lo; trang cuộn trong `#app-scroll-container`, không phải `window`):
  - `< md` (dưới 768): thanh đầu gồm logo, tìm kiếm và hồ sơ; hồ sơ mở Tiến độ, Thống kê, Tài khoản, Cài đặt. Thanh dưới gồm Hôm nay · Học bài · Luyện tập · Ôn tập · Tra cứu.
  - `md` (768–1023): rail trái 80 px (icon trên nhãn; tìm, giao diện, cài đặt, hồ sơ ở đáy).
  - `lg` (≥ 1024): sidebar 240 px (ô tìm `Ctrl K`, mục chọn nền sakura + `Ribbon`, ba shortcut dưới Luyện tập: Bài tập · Nghe mỗi ngày · Luyện viết; Tiến độ và Cài đặt có nhãn ở đáy).
- Ba khuôn màn rộng, chọn theo việc của màn:
  - **Bento** (màn tổng quan: Bảng tin, Ôn tập, Luyện tập, Tra cứu, Cá nhân, Thống kê): `BentoGrid` + `Tile`, 2 cột ở
    `md`, 12 cột ở `lg`. Ở 1280×800 thấy hết việc chính không cần cuộn.
  - **Sách mở** (màn nội dung và tra cứu: Học bài, Chi tiết bài, Ngữ pháp, Kanji, Kana, Động từ, Bảng, Luyện viết,
    Cài đặt): `BookSpread`, danh sách/mục lục một trang, chi tiết trang kia dính khi cuộn; dưới `lg` một trang.
  - **Sân khấu** (màn phiên toàn màn hình): nội dung giữa ≤ 760 px, không điều hướng, không trang trí.
- Mật độ: **thấp** ở màn phiên (một việc một màn); **vừa** ở tổng quan và bài học; **cao** ở tra cứu, danh sách,
  bảng, thống kê, cài đặt (hàng 44–56 px, lưới dày, chi tiết cạnh danh sách trên PC thay vì rời trang).
- Kiểm 768, 1024 (hẹp nhất có sidebar) và 1280. Nút và ô không kéo giãn quá ~640 px.
- Khoảng cách: giữa các mục `space-y-8`; giữa các dòng `space-y-2`; trong thẻ `p-5 sm:p-6`.
- Vùng chạm tối thiểu 44 px. Không lồng thẻ trong thẻ.

Điều hướng học (G1 duyệt 2026-10-27, `design/navigation/`): Home có bốn lối luyện cố định;
Luyện tập là danh mục phương thức, Bài tập là màn cấu hình riêng có quay lại. Không đặt danh mục
phương thức trên các tùy chọn cấu hình mobile. Hội thoại giữ ngữ cảnh bài học, tra cứu và ôn theo lịch
có đích chính riêng. Nhãn phụ “Chép chính tả” dùng để phân biệt Nghe mỗi ngày với Nghe chọn đáp án.

## 6. Thành phần (`PaperKit.tsx`)

| Thành phần | Dùng khi | Ghi chú |
|---|---|---|
| `SoftScene` | Tranh đầu màn | Mép trên và dưới xé giấy có viền xơ sáng (`.paper-tear`); khối chữ ngay dưới chỉ lấn `-mt-1.5`, không che mép xé. Khối giấy đè lên chân tranh dùng `.paper-tear-above` (đặt `--tear-paper` bằng màu khối). Tràn mép trên mobile: `-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full`. Chiều cao và `object-position` theo màn để không cắt mặt nhân vật. |
| `PaperCloud` | Chữ đặt trên/sát tranh | Nền giấy mờ viền sau khối chữ; tự đổi theo theme. |
| `TornCard` | **Một** hành động chính của màn | Mép xé, viền mảnh, quầng accent góc trên phải. Nhãn nhỏ trong thẻ: serif đỏ dạng `/ Hôm nay /`. |
| `SectionHeader` | Đầu mỗi mục | Tiêu đề sans + nút viên thuốc tùy chọn ("Xem tất cả ›"). |
| `ListRow` | Việc phụ, danh sách điều hướng | Ô icon 36 px (icon 24 px), tiêu đề, chữ phụ, chevron; cả dòng là link. |
| `PartRow` | Các phần của bài | Ô icon 40 px, tiêu đề + số liệu cùng hàng (số liệu `text-sm text-muted-foreground/80`), ảnh nhỏ 48 px trong khung `bg-secondary`. |
| `ListRow` (nút) | Việc phải chạy trước khi đi tiếp | Như `ListRow` nhưng không có `href` → render `<button>` (ví dụ ghi nháp rồi mới điều hướng). |
| `PageTitle` | Đầu màn không có tranh | Nút quay lại (`BackLink`) cho trang con, tiêu đề serif, một dòng số liệu. Màn có tranh thì dùng `SoftScene` + `PaperCloud` như Home. |
| `BackLink` | Quay lại từ trang con | Chữ nhỏ xám `‹ …` trên thanh cao 44 px dính đầu vùng cuộn (`sticky top-0`, nền `background/95`), luôn bấm được dù đã cuộn xa. Màn có tranh đặt nó trước `SoftScene`. Thanh dính khác trên cùng trang đặt `top-11` để nằm dưới. |
| `Chip` | Lọc, chọn nhanh | Viên thuốc cao 44 px, `aria-pressed`; chọn = nền sakura chữ đỏ. Hàng chip xuống dòng hoặc cuộn ngang, không co chữ. |
| `BentoGrid` / `Tile` | Lưới thẻ màn tổng quan (`md`+) | `Tile span={4–12}` cột ở `lg`, `full` chiếm 2 cột ở `md`; `bleed` bỏ padding khi nội dung tràn mép; `interactive` thêm vệt sáng theo chuột. Dưới `md` không áp lưới. |
| `BookSpread` | Hai trang sách (`lg`+) | `leftWidth` `narrow` (trang trái tối thiểu 16.5rem) hoặc `wide`; `sticky` giữ một trang khi cuộn, `stickyTop` khi có `BackLink` dính. Dưới `lg` xếp dọc. |
| `Ribbon` | Mục đang chọn trong mục lục, sidebar | Dải đỏ đuôi chữ V ở mép trái; cha `relative`. |
| `Ticket` | Hành động chính dạng "vé" (tạo phiên) | Như `TornCard` + đường đục lỗ và nhãn `/ … /`. Thay cho `TornCard`, không dùng cả hai trên một màn. |
| `Kbd` | Gợi ý phím tắt | Chỉ hiện khi có chuột (`hover:hover`), trừ `always`. |
| `CountUp` (`PaperMotion.tsx`) | Số lớn ở ô số liệu | Chạy một lần khi hiện; giảm chuyển động thì hiện ngay. |
| Segmented tabs (`app/hoc/[so]/_tabs.tsx`) | Chia nội dung một trang dài thành vài phần ngang hàng | Track nền `secondary` viền mảnh, ô bằng nhau cao 44 px, nhãn chỉ chữ (không số, không icon); ô chọn nền `card` chữ đỏ đậm, không nền đỏ đặc. Dính đầu vùng cuộn, dưới `BackLink` (`sticky top-11`, nền `background/95`); thanh phụ của panel (số liệu + nút icon) dính cùng. Panel ẩn vẫn render; hash URL chọn tab. |

Thành phần dùng chung khác:
- Nút chính: `buttonVariants({ size: 'quiz' })` (cao 48 px, `rounded-xl`, đỏ son), chữ + `ArrowRight`.
  Nút phụ: `outline` hoặc `ghost`. Không tạo button mới.
- `VerbGroupBadge`: nhóm động từ = viên thuốc nền `secondary`, chấm màu `verb-N`, chữ màu chữ chính (màu verb-N không đủ tương phản làm chữ).
- `SpeakButton`: tròn 44 px, nền `secondary`, viền, icon `primary` (truyền qua `className`).
- `SearchTrigger variant="bar"`: ô tìm; nút "Bảng tra" nằm trong ô, mép phải.
- `Illustration` cho mọi ảnh; `Skeleton` giữ chiều cao khi đang tải, không nhảy bố cục.
- Mỗi màn chỉ **một** nút đỏ đặc. Hành động lặp theo dòng (Luyện, Xem bài…) dùng `outline`/`ghost`.
- Ô số liệu: nhãn nhỏ + số lớn + đơn vị; không đặt nút hay link bên trong ô.

## 7. Icon

- `FeatureIcon` (`<FeatureIcon name="kanji" className="size-6 text-primary" />`): màu theo `currentColor`,
  cỡ theo `size-*`, dùng từ 24 px. Có `title` khi icon đứng một mình mang nghĩa.
- **Hai bộ, không dùng lẫn:**
  - Icon thẻ (thành phần học): `vocab`, `grammar`, `listening`, `reading`, `kanji`, `kana`, `verbs`,
    `lesson`, `review`, `practice`, `lookup`, `weak-points`, `home`.
  - Thanh điều hướng: `nav-home`, `nav-lesson`, `nav-practice`, `nav-review`, `nav-lookup`.
- Icon chức năng chung (chevron, mũi tên, đồng hồ, loa, kính lúp trên thanh đầu…) dùng Lucide.
- Icon đặt cạnh Lucide phải cùng độ đậm và cùng cỡ thị giác. Thêm icon: `artwork/icons/README.md`.

## 8. Ảnh minh họa

- Phong cách màu nước "phố giấy" (`artwork/illustrations/STYLE.md`). Không có chữ trong ảnh.
- Tranh đầu màn: cover của bài đang học. Ảnh nhỏ cho hàng phần bài: ảnh thật của bài, không có
  thì dùng `ui/sections/*`. Trạng thái (xong, trống): `ui/states/*`.
- Ảnh trang trí: `alt: { vi: '' }`. Không suy URL ảnh từ id/từ/số bài; chỉ dùng tham chiếu có trong dữ liệu.
- Bản tối: tranh giảm sáng `dark:brightness-[0.88]` (đã có trong `SoftScene`).
- Ảnh mới tạo qua pipeline `artwork/illustrations/`, không đặt file tay vào `public/`.

**Tranh phải mang nội dung** (nhất là ở tablet/PC, nơi dễ lấp chỗ trống bằng tranh):
- Chỉ dùng tranh gắn với đúng một bài, từ, mẫu câu, tình huống hội thoại hoặc trạng thái. Không dùng tranh cảnh để
  lấp ô (bàn học, chồng sách, đồng hồ, phố trong từng thẻ).
- Mỗi màn tối đa **một tranh lớn**, chỉ ở màn của một bài (Bảng tin, Học bài, Chi tiết bài, Ngữ pháp, Hội thoại).
  Tranh lặp trong danh sách là ảnh nhỏ 48–64 px (thẻ từ vựng tối đa ~120 px).
- Màn công cụ (tra cứu, kanji, kana, động từ, bảng, luyện viết, thống kê, cài đặt) lấy chữ làm hình: Mincho cỡ lớn,
  số serif, biểu đồ. Không tranh.
- Màn phiên: không tranh ngoài gợi ý của câu hỏi (mặt sau thẻ từ, câu có ảnh trong dữ liệu).

**Điểm nhấn** (trang trí nhẹ cho màn có sức sống, không phải lớp phủ):
- Bộ cố định `ui/decor/*`: cành hoa anh đào (trái, phải), cụm cánh hoa, băng washi.
- Tối đa 1–2 mỗi màn; màn mật độ cao tối đa 1; màn phiên 0 (màn kết quả được 1).
- Đặt ở chỗ trống tự nhiên: cạnh tiêu đề trang, ló sau góc thẻ hành động chính, khoảng trống cuối trang/panel, trạng
  thái rỗng. Không đặt trên lưới, bảng, biểu đồ, danh sách, ô nhập, điều hướng hay sau chữ.
- 64–140 px, hơi trong (~70–85%), dark giảm sáng; `aria-hidden`, `alt=""`, `pointer-events-none`, định vị tuyệt đối
  (không đổi bố cục); chỉ hiện khi đủ chỗ (thường từ `lg`), mobile không thêm. Đứng yên.

## 9. Chuyển động

Chỉ để phản hồi và một chút sức sống "sách sống"; mọi chuyển động tắt khi `prefers-reduced-motion: reduce`, hiệu ứng
hover chỉ cho chuột (`(hover: hover) and (pointer: fine)`), chỉ `transform`/`opacity`, không làm nhảy bố cục.
- Có sẵn: chuyển trang (`PageTransition`), rung báo sai `animate-jp-shake`, lật thẻ flashcard, easing `ease-smooth-out`.
- Màn rộng: vệt sáng theo chuột trên `Tile interactive` (`.spotlight`), nghiêng nhẹ ≤ 4° khi hover bìa (`.tilt-hover`),
  số chạy một lần (`CountUp`), các mục hiện dần (`.stagger-in`, tối đa 8 bậc), hai tờ giấy lệch sau thẻ (`.paper-stack`,
  tĩnh).
- Không dùng: nền WebGL, hiệu ứng con trỏ toàn trang, kính mờ, gooey, animation lặp vô hạn.

## 10. Accessibility

- Tương phản: chữ thân ≥ 4.5:1, chữ lớn ≥ 3:1, kể cả chữ trên `PaperCloud`, ở cả hai theme.
- Focus thấy được: `focus-visible:ring-3 focus-visible:ring-ring`. Mọi thao tác dùng được bằng bàn phím.
- Nút chỉ có icon phải có `aria-label`. Icon trang trí `aria-hidden`.

## 11. Trạng thái màn

| Màn | Trạng thái | Mockup |
|---|---|---|
| Hôm nay `/`, AppNav | **v3** — nav G1 đã duyệt 2026-10-27, chờ review G2 đợt nav | `design/navigation/`, tham chiếu trước: `design/home/` |
| `/hoc` | **v3** — G2 đã duyệt 2026-10-20 (lộ trình thẻ tranh so le, không có mockup ảnh) | `design/hoc/sketch-lo-trinh.png`, `as-built-*` |
| `/hoc/[so]` | **v3** — G2 đã duyệt 2026-10-19 (tab Từ vựng · Ngữ pháp, lưới/danh sách) | `design/bai/mockup-v2-*` |
| `/hoc/[so]/tu-vung` | **v3** — G2 đã duyệt | `design/tu-vung/` |
| Tab Ngữ pháp (mục lục), `/hoc/[so]/ngu-phap/[id]` | **v3** — G2 đã duyệt 2026-10-22 (giải thích mở sẵn dưới mẫu câu, mẫu câu chia ô màu `chart-1/3/4/5`, ví dụ gạch chân cùng màu) | `design/ngu-phap/` |
| `/luyen-tap`, `/luyen-tap/bai-tap`, `/luyen-tap/hoi-thoai` | **v3** — nav và tách màn mobile G1 đã duyệt 2026-10-27, chờ review G2 | `design/navigation/` |
| `/on-tap`, `/on-tap/diem-yeu` | **v3** — G2 đã duyệt | `design/on-tap/` |
| `/luyen-tap/phien`, `/on-tap/phien` | **v3** — G2 đã duyệt | `design/phien/` |
| `/luyen-viet`, `/luyen-viet/phien` | **v3** — kana và kanji: G2 đã duyệt 2026-10-21 | `design/luyen-viet/` |
| `/nghe-moi-ngay`, `/nghe-moi-ngay/phien` | **v3** — đã triển khai, chờ người dùng review G2 | — |
| Tra cứu `/hoc/tra-cuu` và trang con | **v3** — G2 đã duyệt | `design/tra-cuu/` |
| `/ca-nhan`, `/ca-nhan/thong-ke` | **v3** — G2 đã duyệt | `design/ca-nhan/` |
| `/cai-dat`, `/cai-dat/audio` | **v3** — G2 đã duyệt | `design/cai-dat/` |

G2 đợt rollout đã duyệt ngày 2026-10-09. Ảnh sáng/tối sau triển khai nằm trong các thư mục trên;
route, trạng thái dữ liệu và cách chụp ghi tại `design/README.md`.

Tablet và PC (§5): G2 đã duyệt ngày 2026-10-23 cho mọi màn trong bảng. Mỗi thư mục có thêm mockup
`mockup-rwd-{pc,tablet}.webp` và ảnh `as-built-{pc,tablet}-{light,dark}.png` (màn đầu, 1280 và 768 px).

Cập nhật bảng khi màn đổi trạng thái. Không còn thành phần legacy; màn mới tham chiếu Home (`DashboardContent.tsx`) và `PaperKit.tsx`.

## 12. Kiểm tra giao diện (trước khi người dùng review)

- 360, 390, 768, 1280 px; sáng và tối; mọi trạng thái dữ liệu (mới, bình thường, nhiều việc, xong,
  đang tải, lỗi); chữ dài; furigana 1.5×; bàn phím và focus; reduced motion.
- Đặt ảnh chụp cạnh mockup đã duyệt (`design/<màn>/`), liệt kê mọi điểm lệch, sửa hoặc ghi lý do giữ.
- Công cụ và quy trình: `docs/workflow/README.md` mục Kiểm tra UI.
