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
| `success`, `warning`, `info`, `destructive` | Phản hồi; **luôn kèm icon và chữ**, màu không tự mang nghĩa |
| `verb-1..3`, `chart-1..5` | Nhóm động từ, biểu đồ |

Bản tối có bộ giá trị riêng trong `.dark` (không đảo màu tự động).

## 3. Chữ

| Vai trò | Font | Cách dùng |
|---|---|---|
| Hiển thị (lời chào, tiêu đề lớn) | Noto Serif | `font-serif`, `text-2xl sm:text-3xl font-semibold` |
| Câu tiếng Nhật hiển thị lớn | Shippori Mincho | `Furigana` + class `jp-display`, `text-2xl sm:text-3xl font-bold` |
| Giao diện, nhãn, nút, thân | Be Vietnam Pro | mặc định (`font-sans`) |
| Tiếng Nhật cỡ nhỏ (bảng, thẻ, danh sách) | Hiragino / Noto Sans JP | class `jp` (`font-jp`, line-height 2) |

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
- Thanh điều hướng dưới trên mobile, thanh bên từ `lg` (do `AppNav` và layout lo; trang cuộn trong `#app-scroll-container`).
- Từ `xl`: hai cột `[minmax(0,1.2fr)_minmax(21rem,0.8fr)]` — nội dung chính và cột phụ (tra cứu…).
- Khoảng cách: giữa các mục `space-y-8`; giữa các dòng `space-y-2`; trong thẻ `p-5 sm:p-6`.
- Vùng chạm tối thiểu 44 px. Không lồng thẻ trong thẻ.

## 6. Thành phần (`PaperKit.tsx`)

| Thành phần | Dùng khi | Ghi chú |
|---|---|---|
| `SoftScene` | Tranh đầu màn | Khung chữ nhật, mờ dải hẹp ở mép (`.soft-scene`). Tràn mép trên mobile: `-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full`. Chiều cao và `object-position` theo màn để không cắt mặt nhân vật. |
| `PaperCloud` | Chữ đặt trên/sát tranh | Nền giấy mờ viền sau khối chữ; tự đổi theo theme. |
| `TornCard` | **Một** hành động chính của màn | Mép xé, viền mảnh, quầng accent góc trên phải. Nhãn nhỏ trong thẻ: serif đỏ dạng `/ Hôm nay /`. |
| `SectionHeader` | Đầu mỗi mục | Tiêu đề sans + nút viên thuốc tùy chọn ("Xem tất cả ›"). |
| `ListRow` | Việc phụ, danh sách điều hướng | Ô icon 36 px (icon 24 px), tiêu đề, chữ phụ, chevron; cả dòng là link. |
| `PartRow` | Các phần của bài | Ô icon 40 px, tiêu đề + số liệu cùng hàng (số liệu `text-sm text-muted-foreground/80`), ảnh nhỏ 48 px trong khung `bg-secondary`. |

Thành phần dùng chung khác:
- Nút chính: `buttonVariants({ size: 'quiz' })` (cao 48 px, `rounded-xl`, đỏ son), chữ + `ArrowRight`.
  Nút phụ: `outline` hoặc `ghost`. Không tạo button mới.
- `SpeakButton`: tròn 44 px, nền `secondary`, viền, icon `primary` (truyền qua `className`).
- `SearchTrigger variant="bar"`: ô tìm; nút "Bảng tra" nằm trong ô, mép phải.
- `Illustration` cho mọi ảnh; `Skeleton` giữ chiều cao khi đang tải, không nhảy bố cục.

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
- Bản tối: tranh giảm sáng `brightness(0.88)` (đã có trong `.soft-scene`).
- Ảnh mới tạo qua pipeline `artwork/illustrations/`, không đặt file tay vào `public/`.

## 9. Chuyển động

Tối thiểu, chỉ để phản hồi: chuyển trang có sẵn (`PageTransition`), rung báo sai `animate-jp-shake`,
easing `ease-smooth-out`. Không thêm animation trang trí. Mọi chuyển động tôn trọng `prefers-reduced-motion`.

## 10. Accessibility

- Tương phản: chữ thân ≥ 4.5:1, chữ lớn ≥ 3:1, kể cả chữ trên `PaperCloud`, ở cả hai theme.
- Focus thấy được: `focus-visible:ring-3 focus-visible:ring-ring`. Mọi thao tác dùng được bằng bàn phím.
- Nút chỉ có icon phải có `aria-label`. Icon trang trí `aria-hidden`.

## 11. Trạng thái màn

| Màn | Trạng thái |
|---|---|
| Bảng tin `/` | **v3** — tham chiếu chuẩn |
| Hub Tra cứu `/hoc/tra-cuu` | Cũ, đã dùng `FeatureIcon` |
| `/hoc`, `/hoc/[so]`, `/hoc/[so]/tu-vung` | Cũ |
| `/luyen-tap`, `/on-tap` và các phiên | Cũ |
| Trang con tra cứu, `/ca-nhan`, `/cai-dat` | Cũ |

Thanh điều hướng (`AppNav`) đã dùng bộ icon `nav-*`. Cập nhật bảng này khi một màn chuyển xong.

**Legacy — không dùng cho việc mới:** `PaperStage.tsx` (`Stage`, `PaperSlip`, `LinkRow`), `LessonProgress`,
`DashboardReinforcement`, CSS `.paper-scene`. Chúng chỉ còn phục vụ màn cũ và bị xóa khi màn cuối cùng
dùng chúng chuyển xong. Màn mới tham chiếu Home (`DashboardContent.tsx`) và `PaperKit.tsx`.

## 12. Kiểm tra giao diện (trước khi người dùng review)

- 360, 390, 768, 1280 px; sáng và tối; mọi trạng thái dữ liệu (mới, bình thường, nhiều việc, xong,
  đang tải, lỗi); chữ dài; furigana 1.5×; bàn phím và focus; reduced motion.
- Đặt ảnh chụp cạnh mockup đã duyệt (`design/<màn>/`), liệt kê mọi điểm lệch, sửa hoặc ghi lý do giữ.
- Công cụ và quy trình: `docs/workflow/README.md` mục Kiểm tra UI.
