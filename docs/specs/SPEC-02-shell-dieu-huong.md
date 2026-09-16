# SPEC-02 — Shell điều hướng & trạng thái toàn cục

> **Mã:** SPEC-JPN-F02 · **Trạng thái:** Draft · **Ngày:** 16/09/2026
> **Đối tượng đọc:** Google Stitch / Claude Design (mục 3–6), lập trình viên (toàn bộ).
> **Phụ thuộc:** SPEC-01 (số mục đến hạn lấy từ Dexie, có thể là 0 ở giai đoạn đầu).

## 1. Mục tiêu & phạm vi

Dựng khung bao quanh mọi màn hình: thanh điều hướng 5 khu vực, huy hiệu trạng thái dữ liệu,
và cơ chế áp cài đặt hiển thị lên toàn trang. Thay trang chủ hiện tại bằng dashboard thật.

**Trong phạm vi**

- Thanh nav 5 khu vực: Học · Luyện tập · Ôn tập · Thống kê · Cài đặt
- Huy hiệu trạng thái đồng bộ ở góc phải nav
- Áp `settings` lên `<html>` bằng class, chống FOUC
- Dashboard `/` theo khuôn mẫu `design-system.md` §10.1
- Phím tắt toàn cục `Ctrl+K` (mở hộp tìm kiếm)

**Ngoài phạm vi**

- Nội dung của 5 khu vực — thuộc SPEC-03, SPEC-04, SPEC-05 và đợt spec 2
- Màn hình Cài đặt (chỉ dựng lối vào) — đợt spec 2
- Hộp tìm kiếm sau khi mở `Ctrl+K` — đợt spec 2. Giai đoạn này phím tắt chỉ cần được đăng ký
- Đăng nhập, avatar, mọi thứ liên quan Supabase

## 2. Dữ liệu

| Nguồn | Chiều | Dùng cho |
|---|---|---|
| `db.reviewItems` (Dexie) | Đọc, qua `useLiveQuery` | Số mục đến hạn → badge trên mục "Ôn tập" |
| `db.practiceSessions` | Đọc | Ô số liệu dashboard: phút học hôm nay, % đúng 7 ngày |
| `db.pendingSync` | Đọc, đếm | Trạng thái huy hiệu đồng bộ |
| `useUIStore` (`src/lib/store.ts`) | Đọc/ghi | `furiganaVisible`, `furiganaSize`, `studyMode` |
| `localStorage` | Đọc/ghi | Bền hóa 3 cài đặt hiển thị giữa các lần mở app |

Truy vấn đến hạn — dùng nguyên dạng này, index `dueAt` đã có sẵn trong schema:

```ts
useLiveQuery(() => db.reviewItems.where('dueAt').belowOrEqual(new Date()).count(), [])
```

> **Zustand không bền hóa.** `store.ts` cố ý không dùng persist middleware. Ba cài đặt hiển thị
> đọc/ghi `localStorage` trực tiếp trong script chống FOUC (mục 6), rồi nạp vào store khi app
> khởi động. Dữ liệu học tập thì luôn ở Dexie, không bao giờ ở `localStorage`.

## 3. Màn hình & bố cục

### 3.1. Khung chung (áp cho mọi trang)

Khuôn mẫu: `design-system.md` §6.3.

**Mặc định (< 1024px) — nav cố định đáy**

```
┌─────────────────────────────┐
│                             │
│   Nội dung trang            │  ← pb-24 (nav-clearance 96px)
│   (bề rộng theo từng SPEC)  │
│                             │
├─────────────────────────────┤
│ [Học][Luyện][Ôn•][TK][CĐ]   │  ← cao 64px + env(safe-area-inset-bottom)
└─────────────────────────────┘
```

Nền `card`, viền trên 1px `border`, `shadow-md`. Mỗi mục: icon 24px trên, nhãn Caption dưới.
Mục đang mở tô `primary`, còn lại `muted-foreground`. Mục **Ôn tập** mang badge số đến hạn
khi lớn hơn 0.

Huy hiệu đồng bộ **không** nằm trong nav đáy (không đủ chỗ cho 5 mục + huy hiệu). Đặt ở góc
phải header của từng trang.

**≥ 1024px — nav cố định đầu trang**

Cao 56px. 5 mục xếp ngang bên trái, huy hiệu đồng bộ bên phải. Nội dung căn giữa.
Không có `pb-24`. **Không dùng sidebar dọc** — app chỉ có 5 khu vực, và chiều ngang để dành
cho chữ Nhật.

### 3.2. Dashboard `/`

Khuôn mẫu: `design-system.md` §10.1. Bề rộng `max-w-5xl`.

```
[Header: lời chào + huy hiệu streak + huy hiệu đồng bộ (phải)]
[Thẻ lớn: "Ôn tập hôm nay — n mục đến hạn" → nút default duy nhất của trang]
[Hàng 3 ô số liệu: streak · phút học hôm nay · % đúng 7 ngày]
[Thẻ: bài học đang dở]
[Thẻ: 3 điểm yếu hàng đầu]
```

Mobile xếp dọc `gap-4`; từ `md` hàng số liệu thành 3 cột.

> **Xóa hẳn `web/src/app/page.tsx` hiện tại.** 124 dòng marketing với 6 thẻ "Sẵn sàng…" mô tả
> các tính năng chưa tồn tại. Không sửa, thay.

## 4. Component dùng lại

Lấy từ `DESIGN.md`, không mô tả lại:

| Vai trò | Token component |
|---|---|
| Mục nav đang mở / không mở | `nav-item-active` / `nav-item-inactive` |
| Thanh nav | `nav-bar` |
| Huy hiệu đồng bộ | `sync-badge-synced` / `sync-badge-pending` / `sync-badge-offline` |
| Thẻ "Ôn tập hôm nay", ô số liệu, thẻ điểm yếu | `card` |
| Nút vào phiên ôn | `button-primary` cỡ `quiz` (48px) |
| Thẻ mục tiêu trong "3 điểm yếu" | `design-system.md` §9.8, quá hạn dùng `badge-overdue` |

Icon Lucide cho 5 mục nav: `BookOpen` (Học) · `Dumbbell` (Luyện tập) · `RotateCcw` (Ôn tập) ·
`BarChart3` (Thống kê) · `Settings` (Cài đặt).

## 5. Trạng thái

**Huy hiệu đồng bộ** (`design-system.md` §9.7) — mỗi trạng thái có icon **và** chữ riêng:

| Trạng thái | Màu | Icon | Chữ |
|---|---|---|---|
| Đã đồng bộ | `success` | `<CloudCheck />` | "Đã đồng bộ" |
| Đang chờ | `warning` | `<CloudUpload />` | "Chờ đồng bộ (n)" |
| Ngoại tuyến | `muted-foreground` | `<CloudOff />` | "Ngoại tuyến — đã lưu trên máy" |

> **Ở giai đoạn này huy hiệu luôn là trạng thái thứ ba.** Chưa có Supabase (F08 hoãn), nên
> không tồn tại "đã đồng bộ". Hiển thị `<CloudOff />` + "Đã lưu trên máy". Vẫn dựng đủ ba
> trạng thái trong component để F08 chỉ cần cắm vào, nhưng **không** hiện trạng thái xanh
> lúc chưa có gì được đồng bộ thật — nguyên tắc 5 của design system nói trạng thái dữ liệu
> phải nhìn thấy được, và nhìn thấy sai còn tệ hơn không nhìn thấy.

Trên mobile chỉ hiện icon; chữ hiện khi chạm.

**Mọi phần tử bấm được** đủ sáu trạng thái theo `design-system.md` §8: Mặc định · Hover
(chỉ trong `(hover: hover)`) · Focus (ring 3px `ring-ring/50`, **không bao giờ tắt outline**) ·
Active (`translate-y-px`) · Disabled (`opacity-50`, `pointer-events-none`) · Loading (spinner
thay icon, giữ nguyên bề rộng).

**Trạng thái của dashboard**

| Tình huống | Hiển thị |
|---|---|
| Chưa học buổi nào | Thẻ lớn thành "Bắt đầu bài 1" → `/hoc/1`. Ô số liệu hiện `—`, không hiện `0%` |
| Không có mục đến hạn | "Hôm nay không có gì đến hạn" + gợi ý học bài mới. Không để thẻ trống |
| Đang tải Dexie | Skeleton đúng kích thước thẻ thật, không đẩy bố cục |
| Badge "Ôn tập" = 0 | Ẩn hẳn badge, không hiện số 0 |

## 6. Tương tác & chuyển động

- Đổi mục nav: 150ms `ease-out` cho màu. Không animate chuyển trang.
- `Ctrl+K` (và `Cmd+K` trên macOS): đăng ký listener toàn cục, `preventDefault`. Giai đoạn
  này chỉ cần đăng ký; hộp tìm kiếm thuộc đợt spec 2.
- Toàn bộ hoạt ảnh bọc trong `@media (prefers-reduced-motion: no-preference)`.

**Chống FOUC — bắt buộc.** Ba cài đặt hiển thị áp bằng class trên `<html>`:
`hide-furigana`, `furigana-large`, `hide-translations`.

CSS cho cả ba **đã viết sẵn** trong `web/src/app/globals.css` dòng 174–194. Không viết lại,
chỉ cần bật class. Đọc `localStorage` và gắn class trong một script chạy **trước paint đầu
tiên**, nếu không người dùng bật "ẩn furigana" sẽ thấy furigana nhấp nháy mỗi lần tải trang.

## 7. Accessibility

- Nav là `<nav>` với `aria-label`; mục đang mở mang `aria-current="page"`.
- Vùng chạm mọi mục nav ≥ 48×48px, cách nhau ≥ 8px.
- Huy hiệu đồng bộ: icon có `aria-hidden`, chữ trạng thái là nội dung đọc được. Trên mobile
  khi chữ bị ẩn, dùng `aria-label` mang đúng chuỗi đó.
- Badge số đến hạn đọc thành "Ôn tập, 12 mục đến hạn", không đọc trần số.
- Focus ring 3px giữ nguyên trên mọi mục nav.
- Màu không đứng một mình: mục nav đang mở vừa đổi màu `primary` vừa đậm chữ.

## 8. Bảo mật & dữ liệu

Không có dữ liệu nào rời khỏi máy ở phạm vi spec này. Tiến độ học nằm trong IndexedDB
(`JapaneseLearningDB`), ba cài đặt hiển thị nằm trong `localStorage`. Không telemetry,
không analytics, không gọi mạng.

Xóa dữ liệu: người dùng xóa dữ liệu site của trình duyệt là mất toàn bộ tiến độ. Màn hình
Cài đặt (đợt sau) phải nói rõ điều này và cung cấp Export JSON. Spec này chỉ cần dựng lối vào
mục Cài đặt.

## 9. Tiêu chí nghiệm thu

- [ ] Nav hiển thị đúng ở 390px (đáy) và 1280px (đầu trang), không có sidebar
- [ ] Trang có nav đã chừa `pb-24`; nav đáy không che nội dung cuối trang
- [ ] Bật "ẩn furigana", tải lại trang → furigana **không** nhấp nháy lần nào
- [ ] Badge "Ôn tập" khớp đúng số bản ghi `dueAt <= now` trong Dexie; bằng 0 thì ẩn hẳn
- [ ] Dashboard ở tài khoản trắng không hiện `0%` hay thẻ rỗng
- [ ] `page.tsx` cũ đã bị thay hẳn, không còn thẻ "Sẵn sàng…" nào
- [ ] Đúng **một** nút `default` trên dashboard
- [ ] Đủ sáu trạng thái cho mọi phần tử bấm được, focus ring còn nguyên
- [ ] Xem ở 390px và 1280px, cả chế độ sáng lẫn tối

## 10. Khối lệnh bàn giao thiết kế

Dán nguyên khối dưới đây kèm `web/DESIGN.md` vào Stitch / Claude Design.

---

Nạp `DESIGN.md` làm hợp đồng token. Ba ràng buộc bắt buộc:

1. Chỉ dùng token màu theo tên (`bg-primary`, `text-muted-foreground`), **tuyệt đối không
   hardcode mã hex**.
2. Mobile-first: dựng bố cục 390px trước, rồi mới mở rộng lên 1024px.
3. Mọi chữ tiếng Nhật phải bọc trong phần tử có class `jp`.

Dựng hai thứ:

**A. Thanh điều hướng ứng dụng.** Năm khu vực: Học, Luyện tập, Ôn tập, Thống kê, Cài đặt.
Dưới 1024px: cố định đáy, cao 64px cộng safe-area, nền `card`, viền trên 1px, `shadow-md`,
mỗi mục icon 24px trên và nhãn Caption dưới. Từ 1024px: cố định đầu trang, cao 56px, năm mục
xếp ngang bên trái, huy hiệu trạng thái dữ liệu bên phải. Mục đang mở dùng `nav-item-active`,
còn lại `nav-item-inactive`. Mục "Ôn tập" có badge số đếm khi lớn hơn 0. Không sidebar dọc.

**B. Trang chủ / Dashboard**, bề rộng tối đa `max-w-5xl`, theo thứ tự khối: header lời chào
kèm huy hiệu streak và huy hiệu trạng thái dữ liệu bên phải · một thẻ lớn "Ôn tập hôm nay —
n mục đến hạn" chứa nút chính duy nhất của trang (cỡ `quiz`, cao 48px) · hàng ba ô số liệu
(streak, phút học hôm nay, phần trăm đúng 7 ngày) xếp dọc ở mobile và thành 3 cột từ 768px ·
thẻ bài học đang dở · thẻ ba điểm yếu hàng đầu.

Huy hiệu trạng thái dữ liệu có ba biến thể — `sync-badge-synced`, `sync-badge-pending`,
`sync-badge-offline` — mỗi biến thể **phải có cả icon lẫn nhãn chữ**, màu không bao giờ đứng
một mình. Trên mobile chỉ hiện icon.

Mọi phần tử bấm được cần đủ sáu trạng thái: Mặc định, Hover (chỉ khi `(hover: hover)`), Focus
(ring 3px, không bao giờ tắt), Active (dịch xuống 1px), Disabled (`opacity-50`), Loading
(spinner thay icon, giữ nguyên bề rộng).

Trang phải chừa `pb-24` cho nav đáy. Hoạt ảnh bọc trong `@media (prefers-reduced-motion:
no-preference)`, 150ms `ease-out` cho đổi màu.

Cần cả chế độ sáng và tối.

---

> **Không** dùng file Stitch export để ghi đè `web/src/app/globals.css`. Bản export đổi màu
> về hex, bỏ toàn bộ chế độ tối, và mất lớp `@theme inline` — chính là thứ cho phép class
> `.dark` ghi đè token lúc chạy (`design-system.md` §12).
