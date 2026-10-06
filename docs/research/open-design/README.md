# Chuẩn bị design system Phố giấy cho Open Design

Ngày: **06/10/2026**. Đây là **đề xuất** để khám phá trong Open Design, chưa phải nguồn token.
Nguồn có thẩm quyền vẫn là [DESIGN.md](../../../DESIGN.md) và
[globals.css](../../../web/src/app/globals.css); chỉ đổi hai file đó sau khi người dùng duyệt
kết quả.

## Cách đo

Script dùng `sharp` (đã có trong `web/node_modules`) thu nhỏ 24 ảnh (mẫu
`paper-town-style-v1.png`, toàn bộ `scenes/` và `grammar/`), gom pixel theo họ màu OKLCH và
lấy trung bình theo phân vị độ sáng. Tỉ lệ % là phần pixel của cả bộ ảnh.

| Họ màu | Tỉ lệ | Giá trị đại diện | Nhận xét |
|---|---|---|---|
| Giấy ngà | ~14% | `#faf5e7` · oklch(0.97 0.019 90) | Màu nền chung của tranh |
| Cát / kem (tường) | ~35% | `#f7ebd7` → `#d8cab6`, hue ~80° | Phần lớn diện tích |
| Gỗ / ochre | ~13–30% | `#9e6c41` / `#c89764` / `#e9bd89` | Cửa, khung, sàn |
| Olive / sage (lá) | ~4–5% | `#7e7f49` / `#a9a569` / `#d5cc89` | Xanh ấm, ngả vàng |
| Mực than (nét, mái) | ~5% | `#3b3934` → `#59544a`, hue 65–90° | **Đen ấm**, không phải xám lạnh |
| Đỏ gạch / son | ~0.4% | `#a1533b` / `#bc6951` / `#d97e62`, hue ~37° | Điểm nhấn hiếm |
| Hồng sakura | ~0.1% | `#f2a497` / `#f9b7ab` | Cánh hoa rơi |
| Chàm nhạt (trời, rèm) | ~0.2% | `#7491aa` / `#9bbdd9` | Rất ít |

Đặc điểm quan trọng: **không màu nào trong tranh vượt chroma ~0.12** (OKLCH). Bức tranh
ấm, dịu, nhiều giấy; màu đỏ chỉ là điểm nhấn.

## Ba chỗ UI hiện tại lệch với tranh

1. **Mực lạnh.** `foreground`, `muted-foreground`, `secondary-foreground` và toàn bộ nền tối
   dùng hue 285 (xám tím). Tranh dùng mực than ấm hue 65–90. Đây là lệch lớn nhất, làm chữ
   và icon trông "kỹ thuật số" đặt trên tranh màu nước.
2. **Đỏ quá gắt.** `primary` oklch(0.55 0.2 25) và `destructive` chroma 0.24 rực hơn gần gấp
   đôi màu đỏ gạch trong tranh (chroma ~0.11, hue 37).
3. **Màu trạng thái và biểu đồ kiểu Tailwind.** `chart-*` (`#2a78d6`, `#1baf7a`, ...) và
   `success`/`info` là xanh lá/xanh dương bão hòa, không có trong tranh.

Nền `background` hiện tại đã gần với giấy của tranh, chỉ cần ấm thêm một chút.

## Bảng màu đề xuất

Đã kiểm tra tương phản trên `background` và `card` (tính bằng công thức WCAG).

| Token | Đề xuất | Hex | Tương phản trên nền |
|---|---|---|---|
| background | oklch(0.975 0.014 85) | `#fbf6ec` | — |
| card | oklch(0.99 0.007 85) | `#fefbf7` | — |
| muted / secondary | oklch(0.945 0.02 82) | `#f4ecde` | — |
| border / input | oklch(0.885 0.024 80) | `#e2d8c8` | 1.32 (hairline) |
| foreground — mực sumi | oklch(0.26 0.014 65) | `#29231d` | 14.5 |
| muted-foreground | oklch(0.5 0.02 70) | `#6b6157` | 5.6 |
| primary — son | oklch(0.55 0.165 32) | `#bf412c` | 4.9 (chữ trắng 5.3) |
| accent — sakura | oklch(0.945 0.028 32) | `#ffe7e1` | — |
| accent-foreground | oklch(0.42 0.11 32) | `#7e3124` | 8.3 |
| success — rêu | oklch(0.5 0.1 140) | `#427138` | 5.4 |
| warning — gỗ | oklch(0.55 0.11 65) | `#9d621e` | 4.6 |
| info — chàm | oklch(0.5 0.09 245) | `#326893` | 5.5 |
| destructive — đỏ thắm | oklch(0.52 0.18 22) | `#ba2936` | 5.6 |
| verb-1 / 2 / 3 | son / chàm / rêu | `#b2422e` / `#2c628d` / `#476933` | 5.3 / 6.0 / 5.9 |
| chart-1..5 | chàm / kaki / rêu / mận / ochre | `#3275b4` `#934319` `#6e9441` `#8d3d67` `#ac7d1b` | cả 5 ≥ 3:1; validator dataviz PASS (CVD ΔE 13.3) |

Nền tối "phố đêm" (ấm, hue 65 thay cho 285): background `#18130e`, card `#211c17`,
foreground `#ece7de`, muted-foreground `#aba498` (7.5), primary `#e6715b` (6.0),
success `#85bc79`, warning `#ebb16c`, info `#83b4de`, destructive `#ea6a6a`; biểu đồ
`#5497d9` `#a6552d` `#7aa14e` `#ae5a84` `#b8892d` (validator PASS trên card tối).

Màu tham chiếu của tranh (giấy, kem, gỗ, olive, gạch, sakura, trời, mực) nằm ở bảng đo phía
trên; không đưa vào file dán vì không dùng cho chữ, trạng thái hay nút.

### Cách Open Design đọc file dán (đối chiếu mã nguồn `nexu-io/open-design`, 06/10/2026)

`apps/daemon/src/brands/design-md-input.ts` gom **mọi mã hex** trong front matter rồi trong
phần thân, theo thứ tự xuất hiện, và gán vai trò bằng regex tên khóa:

- màu chính (`colorPrimary`) = khóa đầu tiên khớp `accent|brand|cta|tertiary|interactive|button|link`.
  `primary` **không** khớp; vì vậy file có khóa `brand` đặt trước `accent` (sakura).
- `borderRadius` = giá trị đầu tiên trong `rounded`, nên `DEFAULT: 10px` đứng đầu.
- Hex trong phần văn bản cũng bị gom, nên phần thân không chứa mã hex.

Lần dán đầu (06/10) cho `colorPrimary #2b2520` (màu nền tối trong đoạn văn) và
`borderRadius 6`; đã sửa ba điểm trên.

## Đã chốt

- **06/10/2026:** chọn đỏ son `#bf412c` (gần tranh). Đã áp vào `globals.css` và `DESIGN.md` trên
  nhánh `design/pho-giay-palette`. Logo SVG giữ màu đỏ riêng; chưa đổi.
- Font giữ Inter + Noto Sans JP. Serif Nhật cho tiêu đề là đổi luật toàn cục, chưa đặt ra.

## Dùng trong Open Design

Điền theo từng ô của màn "Design a system, in minutes":

| Ô | Điền gì |
|---|---|
| **GitHub or website** | Để trống. Repo đang chứa token cũ (mực lạnh, đỏ gắt); trích từ repo sẽ kéo lại đúng các màu muốn bỏ. Không dùng "Start from a brand" và "Advanced — repo, local code" ở bước này. |
| **Add files** | 5 file, đều dưới 12 MB (xem danh sách bên dưới). |
| **Describe brand** | Dán khối văn bản ở mục bên dưới. |
| **Paste DESIGN.md** | Bấm **Edit**, xóa ví dụ "Heritage", dán **toàn bộ** [washi-pho-giay.design.md](washi-pho-giay.design.md), gồm cả phần `---` front matter. Không chọn "Copy from existing design system". Bấm **Preview** để kiểm tra bảng màu trước khi bấm "Continue to generation". |

File cần tải lên (đường dẫn tính từ root repo):

1. `artwork/illustrations/reference/paper-town-style-v1.png`: mẫu phong cách chính
2. `artwork/illustrations/scenes/cozy-room-v1.png`: cảnh trong nhà
3. `artwork/illustrations/scenes/station-platform-v1.png`: cảnh ngoài trời
4. `artwork/illustrations/scenes/eating-together-v1.png`: cảnh có người
5. `web/public/brand/maipace-mark.svg`: logo

Chưa đưa `new-ui/01-pho-giay-mobile.png` và `04-pho-giay-desktop.png` vào bước này. Hai
mockup đó dùng đỏ gắt cũ và có chữ vẽ trong ảnh, dễ làm công cụ lấy sai màu. Dùng chúng ở
bước thiết kế màn hình sau, làm tham chiếu bố cục.

Khối dán vào **Describe brand**:

```text
MaiPace — "Học tiếng Nhật theo nhịp của bạn" (Learn Japanese at your own pace).
A personal self-study web app for Vietnamese learners of Japanese (Minna no Nihongo N5/N4).
Interface copy is Vietnamese; study content is Japanese with furigana. Core loop: pick a
lesson → read → practice five exercise types → review what is due (spaced repetition).
Mobile-first (390px) with a desktop layout (1280px), light and warm dark mode.

Visual world "Phố giấy" (paper town): the UI is the warm ivory paper that watercolor/gouache
illustrations of small Japanese streets, shops, rooms and two students are painted on.
Illustrations sit full-bleed and fade into the page, never boxed in cards. UI chrome is
quiet warm sumi ink on paper; the illustrations carry the color.

Take UI colors from the pasted DESIGN.md tokens, not from the images. Images show material,
softness and the muted, low-saturation palette only. Red is rare: one filled primary action
per screen. Warm ink, never cool gray or pure black. No gradients, glass blur, neon or glossy
3D. Japanese text is the largest, highest-contrast content. Status colors always come with
an icon and a text label. Touch targets in practice are at least 48px. The logo keeps its
own fixed colors.

Tone: calm, clear, respectful. No streak guilt, rankings or "master it fast" promises.
```

Sau khi tạo: thử trên 2–3 màn đại diện: Bảng tin, một câu hỏi luyện tập (đúng/sai), danh sách
bài học. Mỗi màn thử ở 390px và 1280px, cả sáng và tối.

## Sau khi duyệt

Không dán file export của Open Design đè lên `globals.css` (sẽ mất OKLCH, `.dark` và
`@theme inline`). Chuyển giá trị đã duyệt thủ công vào `globals.css` (OKLCH) và cập nhật
front matter + văn bản của `DESIGN.md` trong cùng một thay đổi; `LessonGrid.tsx` đang dùng màu
palette thô, nên sửa cùng đợt.
