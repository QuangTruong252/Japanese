# DESIGN SYSTEM — WASHI
## Hệ thống thiết kế cho website tự học tiếng Nhật (Minna no Nihongo N5 & N4)

> **Mã tài liệu:** DS-JPN-01
> **Phiên bản:** 1.0 · 16/09/2026
> **Nền tảng:** Tailwind CSS v4 + shadcn/ui (style `base-nova`, Base UI primitives) + Next.js 16
> **Token máy đọc được:** `DESIGN.md` (gốc dự án, chuẩn đặc tả DESIGN.md của Google Stitch)
> **Token lúc chạy:** `web/src/app/globals.css` — tài liệu này mô tả đúng những gì hai file đó định nghĩa.

---

## 0. CÁCH DÙNG TÀI LIỆU NÀY

### 0.1. Với người thiết kế / lập trình
Mọi màn hình mới bắt đầu từ **mục 10 (Khuôn mẫu màn hình)**, lấy component ở **mục 9**,
và chỉ dùng giá trị có trong **mục 2–8**. Không có giá trị nào được đặt tùy ý ngoài tài liệu này.

### 0.2. Với công cụ AI (Claude, Google Stitch, v0…)
Nạp **`DESIGN.md` ở gốc dự án** — đó là bản token máy đọc được, viết theo đúng đặc tả DESIGN.md
của Google Stitch. Xem **mục 12**. Tài liệu này dùng kèm làm ngữ cảnh khi cần lý do thiết kế,
khuôn mẫu màn hình hoặc luật biểu đồ.

**Ba câu lệnh bắt buộc kèm theo khi nhờ AI dựng màn hình:**
1. Chỉ dùng token màu theo tên (`bg-primary`, `text-muted-foreground`), tuyệt đối không hardcode mã hex.
2. Mobile-first: dựng bố cục 390px trước, rồi mới mở rộng lên 1024px.
3. Mọi chữ tiếng Nhật phải bọc trong phần tử có class `jp`.

---

## 1. NGUYÊN TẮC THIẾT KẾ

Năm nguyên tắc dưới đây dùng để **phân xử khi có tranh cãi**, không phải khẩu hiệu.

1. **Nội dung tiếng Nhật là nhân vật chính.** Chữ Hán và furigana luôn là phần tử lớn nhất,
   tương phản cao nhất trên màn hình. Giao diện điều khiển lùi về sau bằng màu `muted`.
2. **Giấy, không phải kính.** Nền washi phẳng, phân tách bằng **đường viền mảnh**, không phải đổ bóng.
   Bóng chỉ dành cho lớp nổi thật sự (dialog, popover, furigana phóng to).
3. **Ngón tay cái trước, bàn phím sau.** Mọi thao tác luyện tập phải với tới được bằng một ngón cái
   ở nửa dưới màn hình. Phím tắt là lớp tăng tốc cho desktop, không phải điều kiện để dùng được.
4. **Màu không bao giờ mang nghĩa một mình.** Đúng/sai, trạng thái đồng bộ, nhóm động từ — tất cả
   đều đi kèm icon hoặc nhãn chữ. Đây là ràng buộc cho người mù màu, không phải tùy chọn.
5. **Trạng thái dữ liệu phải nhìn thấy được.** Người học luôn biết bài của mình đang nằm ở đâu:
   trên máy, đang chờ, hay đã lên cloud.

---

## 2. MÀU SẮC

Toàn bộ màu khai báo bằng **OKLCH** để giữ độ sáng cảm nhận đồng đều giữa các sắc độ.
Không thêm màu mới ngoài bảng này.

### 2.1. Token nền tảng

| Token | Vai trò | Light | Dark |
|---|---|---|---|
| `background` | Nền trang (washi kem) | `oklch(0.99 0.002 90)` | `oklch(0.17 0.01 285)` |
| `foreground` | Chữ chính | `oklch(0.2 0.01 285)` | `oklch(0.93 0.005 90)` |
| `card` | Nền thẻ, bề mặt nổi 1 bậc | `oklch(1 0 0)` | `oklch(0.21 0.01 285)` |
| `card-foreground` | Chữ trên thẻ | `oklch(0.2 0.01 285)` | `oklch(0.93 0.005 90)` |
| `popover` | Nền lớp nổi | `oklch(1 0 0)` | `oklch(0.21 0.01 285)` |
| `primary` | Đỏ đất Torii — hành động chính | `oklch(0.55 0.2 25)` | `oklch(0.65 0.19 25)` |
| `primary-foreground` | Chữ trên nền primary | `oklch(0.98 0.005 90)` | `oklch(0.15 0.01 285)` |
| `secondary` | Nền phụ, chip không nhấn | `oklch(0.96 0.006 90)` | `oklch(0.26 0.01 285)` |
| `muted` | Nền chìm | `oklch(0.96 0.006 90)` | `oklch(0.26 0.01 285)` |
| `muted-foreground` | Chữ phụ, nhãn, furigana | `oklch(0.5 0.012 285)` | `oklch(0.68 0.012 285)` |
| `accent` | Nền nhấn nhẹ sắc đỏ | `oklch(0.95 0.02 25)` | `oklch(0.3 0.04 25)` |
| `border` / `input` | Đường viền mảnh | `oklch(0.91 0.006 90)` | `oklch(0.28 0.01 285)` |
| `ring` | Vòng focus | `oklch(0.55 0.2 25)` | `oklch(0.65 0.19 25)` |

### 2.2. Màu phản hồi ngữ nghĩa

Bốn màu này **chỉ dùng cho trạng thái**, không bao giờ dùng làm màu trang trí hay màu chuỗi biểu đồ.
Mọi giá trị đã được đo tương phản trên nền card và đều **đạt ngưỡng chữ 4.5:1**, nên dùng trực tiếp
làm màu chữ được.

| Token | Nghĩa trong app | Light (đo trên `#ffffff`) | Dark (đo trên `#18181d`) |
|---|---|---|---|
| `success` | Trả lời đúng · đã đồng bộ | `oklch(0.52 0.15 155)` — 5.01:1 | `oklch(0.72 0.15 155)` — 7.62:1 |
| `destructive` | Trả lời sai · lỗi · xóa | `oklch(0.58 0.24 27)` — 4.78:1 | `oklch(0.65 0.2 27)` — 5.00:1 |
| `warning` | Đang chờ đồng bộ · quá hạn ôn | `oklch(0.56 0.14 70)` — 4.78:1 | `oklch(0.8 0.14 75)` — 9.32:1 |
| `info` | Gợi ý · ghi chú ngữ pháp | `oklch(0.52 0.14 250)` — 5.51:1 | `oklch(0.72 0.13 250)` — 7.19:1 |

**Luật bắt buộc:** mỗi lần dùng màu phản hồi phải kèm **icon Lucide + nhãn chữ**.
Ô đáp án đúng không chỉ đổi xanh — nó hiện `<Check />` và viền dày lên 2px.

### 2.3. Màu nhóm động từ

Đây là màu **định danh**, gắn cứng với nhóm từ, không đổi theo ngữ cảnh.

| Token | Nhóm | Light | Dark |
|---|---|---|---|
| `verb-1` | Nhóm 1 · Ngũ đoạn (godan) | `oklch(0.53 0.19 25)` | `oklch(0.72 0.17 25)` |
| `verb-2` | Nhóm 2 · Nhất đoạn (ichidan) | `oklch(0.48 0.15 250)` | `oklch(0.72 0.13 250)` |
| `verb-3` | Nhóm 3 · Bất quy tắc | `oklch(0.48 0.12 155)` | `oklch(0.72 0.12 155)` |

Luôn hiển thị kèm nhãn `Nhóm 1 / 2 / 3`. Người học không được phải nhớ mã màu.

### 2.4. Màu biểu đồ thống kê

Bộ 5 slot dưới đây **đã chạy qua trình kiểm định** trên đúng nền card của app
(light `#ffffff`, dark `#18181d`) và đạt toàn bộ: dải độ sáng, sàn chroma,
phân tách mù màu ΔE 9.1, sàn thị lực thường ΔE 19.6.

| Slot | Sắc | Light | Dark |
|---|---|---|---|
| `chart-1` | blue | `#2a78d6` | `#3987e5` |
| `chart-2` | orange | `#eb6834` | `#d95926` |
| `chart-3` | aqua | `#1baf7a` | `#199e70` |
| `chart-4` | yellow | `#eda100` | `#c98500` |
| `chart-5` | magenta | `#e87ba4` | `#d55181` |

Quy tắc dùng ở **mục 11**.

---

## 3. TYPOGRAPHY

### 3.1. Bộ chữ

| Vai trò | Font | Token |
|---|---|---|
| Giao diện, tiếng Việt, tiếng Anh | **Inter Variable** | `font-sans` |
| Toàn bộ chữ tiếng Nhật | **Noto Sans JP Variable** | `font-jp` |
| Số liệu dạng bảng, mã hash | `ui-monospace` | `font-mono` |

Không dùng font serif hay font display ở bất kỳ đâu, kể cả tiêu đề lớn.

### 3.2. Thang chữ Latin

| Bậc | Kích thước / Line-height | Độ đậm | Dùng ở đâu |
|---|---|---|---|
| Display | `2rem / 2.25rem` | 600 | Số liệu lớn ở dashboard (streak, % đúng) |
| H1 | `1.5rem / 2rem` | 600 | Tiêu đề trang |
| H2 | `1.25rem / 1.75rem` | 600 | Tiêu đề khối (tên điểm ngữ pháp) |
| H3 | `1.125rem / 1.5rem` | 600 | Tiêu đề thẻ |
| Body | `1rem / 1.625` | 400 | Giải thích ngữ pháp, nghĩa tiếng Việt |
| Small | `0.875rem / 1.25rem` | 400 | Nhãn, chú thích, nguồn sách |
| Caption | `0.75rem / 1rem` | 500 | Nhãn nav dưới, badge, mốc thời gian |

### 3.3. Thang chữ tiếng Nhật

Chữ Nhật **luôn lớn hơn chữ Latin cùng cấp một bậc** và cần giãn dòng rộng hơn để chừa chỗ cho furigana.
Mọi phần tử chứa chữ Nhật phải mang class `jp` (đặt `font-family: var(--font-jp)` và `line-height: 2`).

| Ngữ cảnh | Kích thước | Ghi chú |
|---|---|---|
| Câu hỏi trong bài tập | `1.5rem` | Trọng tâm thị giác của màn hình luyện tập |
| Câu ví dụ trong bài học | `1.25rem` | |
| Từ vựng trong danh sách | `1.125rem` | |
| Chữ Nhật trong nút bấm / chip | `1rem` | |
| Furigana (`rt`) | `min(0.62em, 0.95rem)` × `--furigana-scale` | Màu `muted-foreground`, độ đậm 500 |

### 3.4. Quy tắc Furigana

- Luôn dựng bằng thẻ **`<ruby>` / `<rt>` gốc của HTML**. Không dùng overlay CSS hay đo chiều rộng bằng JS.
- Bật/tắt bằng CSS thuần: `html.hide-furigana rt { visibility: hidden }` — không render lại DOM,
  nên chữ Hán **không bị nhảy vị trí** khi người học đóng/mở furigana.
- Cỡ furigana điều chỉnh qua biến `--furigana-scale` (`1` hoặc `1.25`), không sửa từng phần tử.
- Trên thiết bị có chuột, `.ruby-word:hover` phóng to 1.5× để soi mặt chữ. Tắt hoàn toàn trên cảm ứng.

---

## 4. KHOẢNG CÁCH & KÍCH THƯỚC

### 4.1. Thang khoảng cách
Dùng nguyên thang mặc định của Tailwind (đơn vị gốc 4px). **Chỉ dùng các bậc chẵn** dưới đây,
không dùng giá trị lẻ như `p-[13px]`:

`1` (4px) · `2` (8px) · `3` (12px) · `4` (16px) · `5` (20px) · `6` (24px) · `8` (32px) · `12` (48px) · `16` (64px)

| Ngữ cảnh | Giá trị |
|---|---|
| Lề trang, mobile | `px-4` |
| Lề trang, ≥ 768px | `px-6` |
| Padding trong thẻ | `p-5` |
| Khoảng cách giữa các thẻ | `gap-4` |
| Khoảng cách giữa các khối nội dung | `gap-8` |
| Khoảng cách nhãn ↔ trường nhập | `gap-2` |
| Chừa chỗ cho thanh nav dưới | `pb-24` trên mọi trang có nav |

### 4.2. Vùng chạm — ràng buộc cứng

| Loại | Kích thước tối thiểu |
|---|---|
| **Nút trả lời bài tập, ô ghép cặp, khối từ** | **48 × 48px** (`h-12`, `min-w-12`) |
| Nút điều khiển trình phát audio | 44 × 44px |
| Mục trên thanh nav dưới | 48px chiều cao |
| Nút chrome giao diện (icon nhỏ, menu) | 32px — chỉ cho desktop, không đặt trong luồng luyện tập |

> **Lưu ý quan trọng:** kích thước mặc định của shadcn `base-nova` là `h-8` (32px) và `lg` là `h-9` (36px) —
> **đều không đạt ngưỡng 48px**. Chúng chỉ dành cho chrome giao diện. Mọi nút nằm trong luồng làm bài
> phải dùng biến thể `size="quiz"`, hoặc `h-12` nếu component chưa có biến thể đó.

Khoảng cách tối thiểu giữa hai vùng chạm liền nhau: **8px**.

---

## 5. BO GÓC, VIỀN, ĐỔ BÓNG

### 5.1. Bo góc
Gốc `--radius: 0.625rem` (10px), các bậc suy ra từ đó:

| Token | Giá trị | Dùng cho |
|---|---|---|
| `rounded-sm` | 6px | Badge, chip nhỏ |
| `rounded-md` | 8px | Trường nhập, nút nhỏ |
| `rounded-lg` | 10px | Nút tiêu chuẩn |
| `rounded-xl` | 14px | Thẻ, ô đáp án, khối từ |
| `rounded-full` | — | Avatar, nút tròn của trình phát |

### 5.2. Viền và đổ bóng
Phân tách bề mặt bằng **viền 1px màu `border`** là mặc định. Thang đổ bóng chỉ có ba bậc:

| Bậc | Dùng cho |
|---|---|
| Không bóng | Thẻ, ô đáp án, khối nội dung — **mặc định** |
| `shadow-md` | Popover, dropdown, thanh nav dưới |
| `shadow-lg` | Dialog, sheet, furigana phóng to khi hover |

Viền của ô đáp án dày lên **2px** khi được chọn hoặc khi hiện kết quả — độ dày viền là kênh
truyền đạt thứ hai bên cạnh màu.

---

## 6. BỐ CỤC & ĐIỂM GÃY

### 6.1. Điểm gãy
Dùng mặc định Tailwind. Chỉ ba mốc thực sự thay đổi bố cục:

| Mốc | Bề rộng | Thay đổi |
|---|---|---|
| Mặc định | < 768px | Một cột, thanh nav **dưới đáy** |
| `md` | ≥ 768px | Hai cột ở danh sách bài học và thống kê |
| `lg` | ≥ 1024px | Thanh nav **chuyển lên đầu trang**, nội dung căn giữa |

**Không dùng sidebar dọc.** App chỉ có 5 khu vực, một thanh nav đủ dùng ở cả hai đầu màn hình —
sidebar chỉ tốn chiều ngang vốn đã cần cho chữ Nhật.

### 6.2. Bề rộng vùng nội dung

| Loại màn hình | Bề rộng tối đa |
|---|---|
| Đọc bài học, ngữ pháp | `max-w-2xl` (672px) — giữ độ dài dòng dễ đọc |
| Làm bài tập | `max-w-xl` (576px) — tập trung, ít nhiễu |
| Dashboard, thống kê | `max-w-5xl` (1024px) |
| Cài đặt | `max-w-2xl` (672px) |

### 6.3. Thanh điều hướng

**Mobile (< 1024px) — cố định đáy:**
- Chiều cao 64px, cộng `env(safe-area-inset-bottom)`.
- Nền `card`, viền trên 1px, `shadow-md`.
- 5 mục: **Học · Luyện tập · Ôn tập · Thống kê · Cài đặt**.
- Mỗi mục: icon 24px phía trên, nhãn Caption phía dưới. Mục đang mở tô `primary`, còn lại `muted-foreground`.
- Mục **Ôn tập** mang badge số lượng đến hạn khi lớn hơn 0.

**Desktop (≥ 1024px) — cố định đầu trang:**
- Chiều cao 56px, cùng 5 mục xếp ngang bên trái, trạng thái đồng bộ và avatar bên phải.

---

## 7. CHUYỂN ĐỘNG

Chuyển động phục vụ việc hiểu chuyện gì vừa xảy ra, không phải để trang trí.

| Loại | Thời lượng | Đường cong |
|---|---|---|
| Đổi màu, hover, focus | 150ms | `ease-out` |
| Ô đáp án hiện kết quả | 200ms | `ease-out` |
| Thẻ vào/ra, chuyển câu hỏi | 250ms | `ease-in-out` |
| Kéo thả khối từ | lò xo `framer-motion` | `stiffness 400, damping 30` |
| Rung báo sai | 300ms, biên độ 4px, 3 nhịp | `ease-in-out` |

**Bắt buộc:** bọc toàn bộ hoạt ảnh trong `@media (prefers-reduced-motion: no-preference)`.
Khi người dùng tắt hiệu ứng, kết quả đúng/sai vẫn phải hiện đầy đủ — chỉ bỏ phần chuyển động.

---

## 8. TRẠNG THÁI TƯƠNG TÁC

Mọi phần tử bấm được phải định nghĩa đủ **sáu** trạng thái. Thiếu bất kỳ trạng thái nào là lỗi.

| Trạng thái | Biểu hiện |
|---|---|
| Mặc định | Nền và viền theo token của biến thể |
| Hover | Nền đậm thêm một bậc. **Chỉ áp dụng khi `(hover: hover)`** |
| Focus | Vòng `ring` 3px, `ring-ring/50` — không bao giờ tắt outline |
| Active | Dịch xuống 1px (`translate-y-px`) |
| Disabled | `opacity-50`, `pointer-events-none` |
| Loading | Spinner thay icon, giữ nguyên bề rộng nút để bố cục không nhảy |

---

## 9. THƯ VIỆN COMPONENT

### 9.1. Nút (Button)

| Biến thể | Dùng khi |
|---|---|
| `default` | Hành động chính duy nhất trên màn hình (nền `primary`) |
| `secondary` | Hành động phụ |
| `outline` | Hành động ngang hàng trong một nhóm |
| `ghost` | Nút icon, hành động trong danh sách |
| `destructive` | Xóa dữ liệu học tập |
| `link` | Điều hướng nội tuyến |

| Cỡ | Chiều cao | Dùng khi |
|---|---|---|
| `quiz` | 48px | **Mọi nút trong luồng làm bài** |
| `lg` | 36px | Hành động chính ngoài luồng làm bài |
| `default` | 32px | Chrome giao diện |
| `icon-*` | 24–36px | Nút chỉ có icon |

Mỗi màn hình có **đúng một** nút `default`. Nhiều hơn là dấu hiệu màn hình chưa có trọng tâm.

### 9.2. Thẻ (Card)
Nền `card`, viền 1px `border`, `rounded-xl`, `p-5`, không đổ bóng.
Cấu trúc: tiêu đề H3 → nội dung → hàng hành động căn phải.

### 9.3. Ô đáp án (Answer Option) — dùng chung cho Dạng 1 và Dạng 2

Đây là component quan trọng nhất của app. Năm trạng thái:

| Trạng thái | Nền | Viền | Phụ trợ ngoài màu |
|---|---|---|---|
| Rảnh | `card` | 1px `border` | Số thứ tự 1–4 ở góc trái |
| Hover | `accent` | 1px `border` | — |
| Đã chọn | `accent` | **2px** `primary` | — |
| Đúng | `success/10` | **2px** `success` | Icon `<Check />` bên phải |
| Sai | `destructive/10` | **2px** `destructive` | Icon `<X />` + rung 3 nhịp |

Chiều cao tối thiểu 48px, `rounded-xl`, `p-4`, chữ Nhật cỡ `1.125rem`.
Số thứ tự luôn hiển thị trên desktop (khớp phím tắt `1`–`4`), ẩn trên mobile.

### 9.4. Khối từ (Phrase Token) — Dạng 4
Chip `rounded-xl`, `px-4 h-12`, nền `secondary`, chữ Nhật `1.125rem`.
Khối đã dùng chuyển sang `opacity-40` và không bấm được, **vẫn giữ nguyên chỗ** để bố cục không nhảy.
Thanh câu trả lời là vùng `border-dashed` cao tối thiểu 64px, hiện chữ mờ "Chạm vào từ bên dưới" khi rỗng.

### 9.5. Trường nhập tiếng Nhật — Dạng 3 và Dạng 5
Chiều cao 48px, `rounded-lg`, viền 1px, chữ Nhật `1.25rem`, căn giữa.
Gắn `wanakana.bind()` để gõ romaji tự chuyển sang hiragana.
Dưới trường nhập luôn có dòng Caption: "Gõ romaji, chữ tự chuyển sang hiragana".

### 9.6. Trình phát Shadowing
Bố cục dọc, ba tầng:
1. **Waveform / thanh tiến trình** — cao 48px, vùng chạm phủ toàn chiều rộng, mốc A-B là hai vạch `primary` đặc.
2. **Hàng điều khiển chính** — Play/Pause tròn 56px ở giữa, hai bên là lùi/tiến 10 giây (44px).
3. **Hàng điều khiển phụ** — chip tốc độ (`0.75×` `0.85×` `1.0×` `1.2×`), nút `Đặt A`, `Đặt B`, bật/tắt lặp, bật/tắt transcript.

Tốc độ đang chọn tô nền `primary`. Khi lặp A-B đang bật, vùng giữa A và B tô `primary/15`.

### 9.7. Huy hiệu trạng thái đồng bộ
Luôn ở góc phải thanh nav. Ba trạng thái, **mỗi trạng thái có icon và chữ riêng**:

| Trạng thái | Màu | Icon | Chữ |
|---|---|---|---|
| Đã đồng bộ | `success` | `<CloudCheck />` | "Đã đồng bộ" |
| Đang chờ | `warning` | `<CloudUpload />` | "Chờ đồng bộ (n)" |
| Ngoại tuyến | `muted-foreground` | `<CloudOff />` | "Ngoại tuyến — đã lưu trên máy" |

Trên mobile chỉ hiện icon; chữ hiện trong tooltip hoặc khi chạm.

### 9.8. Thẻ mục tiêu ôn tập
Hiện từ/ngữ pháp, nhãn `target_type`, và hạn ôn. Mục quá hạn hiện chữ `warning`
kèm icon `<AlarmClock />` và số ngày trễ.

---

## 10. KHUÔN MẪU MÀN HÌNH

Đây là phần **giữ cho các trang đồng bộ với nhau**. Mọi trang mới phải rơi vào một trong năm khuôn mẫu.

### 10.1. Trang chủ / Dashboard
```
[Header: lời chào + huy hiệu streak]
[Thẻ lớn: "Ôn tập hôm nay — n mục đến hạn"  → nút quiz chính]
[Hàng 3 ô số liệu: streak · phút học hôm nay · % đúng 7 ngày]
[Thẻ: bài học đang dở]
[Thẻ: 3 điểm yếu hàng đầu]
```
Trên mobile các khối xếp dọc `gap-4`; từ `md` trở lên hàng số liệu thành 3 cột.

### 10.2. Danh sách bài học
Lưới thẻ: 1 cột mobile, 2 cột từ `md`. Mỗi thẻ có số bài, tiêu đề tiếng Việt, tiêu đề tiếng Nhật,
thanh tiến độ mảnh 4px và số từ vựng đã thuộc.

### 10.3. Chi tiết bài học
Một cột `max-w-2xl`. Thứ tự cố định: **Từ vựng → Ngữ pháp → Câu ví dụ → Audio**.
Mỗi điểm ngữ pháp là một khối: H2 tiêu đề → mẫu câu (nền `muted`, `rounded-lg`, `p-4`)
→ giải thích tiếng Việt → danh sách câu ví dụ.
Nguồn sách hiện cuối khối bằng chữ Small màu `muted-foreground`.

### 10.4. Màn hình luyện tập
```
[Thanh trên: tiến độ "7/20" + nút thoát + đồng hồ]
[Vùng câu hỏi — chiếm ưu thế thị giác, chữ Nhật 1.5rem]
[Vùng trả lời — nằm ở NỬA DƯỚI màn hình, luôn trong tầm ngón cái]
[Vùng phản hồi — trượt lên từ đáy sau khi trả lời]
```
Ràng buộc: **không cuộn trang trong lúc làm bài**. Nếu nội dung tràn, thu nhỏ vùng câu hỏi
chứ không đẩy vùng trả lời xuống dưới màn hình.

### 10.5. Thống kê
`max-w-5xl`. Trên cùng là hàng ô số liệu, dưới là các biểu đồ theo luật ở mục 11,
cuối cùng là bảng điểm yếu có thể lọc theo loại mục tiêu.

---

## 11. LUẬT BIỂU ĐỒ

Áp dụng cho mọi biểu đồ ở trang Thống kê.

1. **Một trục y duy nhất.** Không bao giờ dùng hai trục y trên cùng một biểu đồ. Hai đại lượng
   khác thang đo thì tách thành hai biểu đồ.
2. **Màu gắn với thực thể, không gắn với thứ hạng.** `vocab` luôn là `chart-1` dù nó đứng thứ mấy
   trong bảng xếp hạng. Đổi bộ lọc không được đổi màu của các mục còn lại.
3. **Gán slot theo thứ tự cố định**, không xoay vòng: `vocab → chart-1`, `grammar → chart-2`,
   `kanji → chart-3`, `particle → chart-4`, `listening → chart-5`.
4. **Nhãn trực tiếp là bắt buộc ở chế độ sáng.** Ba slot `chart-3`, `chart-4`, `chart-5` có tương phản
   dưới 3:1 trên nền card trắng, nên biểu đồ phải có nhãn số hiện rõ hoặc kèm bảng số bên dưới.
5. **Từ 2 chuỗi trở lên luôn có chú giải.** Một chuỗi duy nhất thì không cần — tiêu đề đã gọi tên nó.
6. **Chữ luôn mang màu chữ**, không mang màu chuỗi. Con số, nhãn trục, chú giải dùng `foreground`
   hoặc `muted-foreground`; chỉ ô màu nhỏ cạnh nhãn mới mang màu chuỗi.
7. **Thang liên tục dùng một sắc.** Lịch streak dạng heatmap chuyển từ nhạt sang đậm trên **một sắc xanh**
   (`chart-1`), không dùng cầu vồng.
8. **Không dùng màu phản hồi làm màu chuỗi.** `success` và `destructive` chỉ mang nghĩa trạng thái.
9. Nét mảnh, lưới chìm: đường 2px, điểm đánh dấu ≥ 8px, đường lưới 1px màu `border`.

---

## 12. TỆP DESIGN.md CHO CÔNG CỤ AI

Token máy đọc được nằm ở **`DESIGN.md` tại gốc dự án**, viết theo đặc tả DESIGN.md của
Google Stitch (YAML front matter + các mục markdown theo thứ tự bắt buộc). Đó là tệp cần nạp
vào Stitch, Claude hay công cụ sinh UI bất kỳ — không cần dán lại bảng token bằng tay nữa.

Quan hệ giữa ba tệp:

| Tệp | Vai trò |
|---|---|
| `DESIGN.md` | Hợp đồng token máy đọc được. Nguồn cấp cho công cụ AI. |
| `web/src/app/globals.css` | Bản thi hành lúc chạy: OKLCH, chế độ tối, `@theme inline`. |
| Tài liệu này | Lý do thiết kế, khuôn mẫu màn hình, luật biểu đồ, danh sách kiểm tra. |

Kiểm tra tệp và xem trước khối `@theme` mà nó sinh ra:

```bash
npx @google/design.md lint DESIGN.md --format json
npx @google/design.md export DESIGN.md --format css-tailwind
```

**Không** dùng kết quả export để ghi đè `globals.css`. Bản export đổi màu về hex, bỏ toàn bộ
chế độ tối, và mất lớp `@theme inline` vốn là thứ cho phép class `.dark` ghi đè token lúc chạy.

Ba token `border`, `input`, `ring` luôn bị cảnh báo `orphaned-tokens` vì phiên bản đặc tả này
chưa có thuộc tính `borderColor`, nên màu nét viền không thể tham chiếu từ khối component.
Đây là giới hạn của format, không phải lỗi cần sửa.

---

## 13. DANH SÁCH KIỂM TRA TRƯỚC KHI GHÉP MÀN HÌNH MỚI

- [ ] Mọi màu lấy từ token, không có mã hex nào viết thẳng trong component.
- [ ] Chữ tiếng Nhật đã bọc class `jp` và dùng đúng bậc cỡ chữ.
- [ ] Nút trong luồng làm bài đạt tối thiểu 48px.
- [ ] Mỗi phần tử bấm được có đủ sáu trạng thái, focus ring còn nguyên.
- [ ] Màu phản hồi đi kèm icon và nhãn chữ.
- [ ] Trang có nav đã chừa `pb-24`.
- [ ] Hoạt ảnh nằm trong `prefers-reduced-motion`.
- [ ] Đã xem màn hình ở cả 390px và 1280px, ở cả chế độ sáng và tối.
- [ ] Đúng một nút `default` trên mỗi màn hình.

---
*Tài liệu lưu tại:* `d:\Projects\Lab\Japanese\docs\design-system.md`
*Token thi hành tại:* `web/src/app/globals.css`
