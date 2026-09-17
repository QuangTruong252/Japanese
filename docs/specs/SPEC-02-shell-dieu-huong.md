# SPEC-02 — Shell điều hướng & trạng thái toàn cục

> **Mã:** SPEC-JPN-F02 · **Trạng thái:** 🟡 Đã cài xong, chờ kiểm tra trình duyệt ·
> **Ngày:** 16/09/2026 · **Rà soát:** 17/09/2026
> **Đối tượng đọc:** Google Stitch / Claude Design (mục 3–6), lập trình viên (toàn bộ).
> **Phụ thuộc:** SPEC-01 (số mục đến hạn lấy từ Dexie, có thể là 0 ở giai đoạn đầu).

## 1. Mục tiêu & phạm vi

Dựng khung bao quanh mọi màn hình: thanh điều hướng 5 khu vực, huy hiệu trạng thái dữ liệu,
và cơ chế áp cài đặt hiển thị lên toàn trang. Thay trang chủ hiện tại bằng dashboard thật.

**Trong phạm vi**

- Thanh nav 5 khu vực: Học · Luyện tập · Ôn tập · Thống kê · Cài đặt
- Huy hiệu trạng thái đồng bộ ở góc phải nav
- Áp `settings` lên `<html>` bằng class, chống FOUC (gồm cả `theme`)
- Dashboard `/` theo khuôn mẫu `design-system.md` §10.1
- `src/lib/stats.ts` — ba hàm số liệu dùng chung với SPEC-07

**Ngoài phạm vi**

- Nội dung của 5 khu vực — thuộc SPEC-03, SPEC-04, SPEC-05 và đợt spec 2
- Màn hình Cài đặt (chỉ dựng lối vào) — đợt spec 2
- Phím tắt `Ctrl+K` và hộp tìm kiếm — **cả hai** thuộc SPEC-13, xem mục 6
- Màn hình Thống kê và mọi biểu đồ — SPEC-07. Spec này chỉ dùng ba hàm số liệu
- Đăng nhập, avatar, mọi thứ liên quan Supabase

## 2. Dữ liệu

| Nguồn | Chiều | Dùng cho |
|---|---|---|
| `db.reviewItems` (Dexie) | Đọc, qua `useLiveQuery` | Số mục đến hạn → badge trên mục "Ôn tập" |
| `db.practiceSessions` | Đọc | Ô số liệu dashboard, **qua `src/lib/stats.ts`** |
| `db.pendingSync` | Đọc, đếm | Trạng thái huy hiệu đồng bộ |
| `useUIStore` (`src/lib/store.ts`) | Đọc/ghi | `furigana`, `furiganaSize`, `hideTranslations`, `theme` |
| `src/lib/settings.ts` | Gọi | `loadSettings` / `saveSettings` / `applySettingsToDOM`. **Đã cài** |

### 2.1. Tên cài đặt: dùng ngay tên của SPEC-06

`web/src/lib/settings.ts` đã cài đúng hợp đồng SPEC-06: một khóa `jp:settings`, sáu trường
`furigana` · `furiganaSize` · `hideTranslations` · `theme` · `soundVolume` · `dailyNewLimit`.

**`store.ts` phải đổi tên theo ngay trong phase này**: `furiganaVisible` → `furigana`,
`studyMode` → `hideTranslations`, và **thêm `theme`**. Giữ hai bộ tên song song sẽ đẻ ra một
hàm ánh xạ mà F06 và F08 đều phải đọc lại.

Store là bản sao trong phiên; `localStorage` là nơi bền hóa; **`settings.ts` là nguồn sự thật
duy nhất của cả sáu trường** — component không tự `getItem`/`setItem`.

> **Zustand không bền hóa.** `store.ts` cố ý không dùng persist middleware. Cài đặt đọc/ghi
> qua `settings.ts` (script chống FOUC ở mục 6 đọc thẳng `localStorage`), rồi nạp vào store
> khi app khởi động. Dữ liệu học tập thì luôn ở Dexie, không bao giờ ở `localStorage`.

### 2.2. Số mục đến hạn phải cập nhật theo **thời gian**, không chỉ theo dữ liệu

```ts
useLiveQuery(() => db.reviewItems.where('dueAt').belowOrEqual(new Date()).count(), [])
```

Truy vấn này **không đủ**. `useLiveQuery` chạy lại khi bảng Dexie đổi; thời gian trôi qua
không phải là một thay đổi của bảng. Tab mở từ 8 giờ sáng sẽ hiện badge của 8 giờ sáng cho tới
khi người dùng làm một phiên.

Ba nguồn kích hoạt tính lại, cả ba đều bắt buộc:

1. `useLiveQuery` — khi `reviewItems` đổi (làm bài xong, đồng bộ kéo về).
2. Sự kiện `visibilitychange` (tab hiện lại) và `focus` — rẻ và phủ hầu hết trường hợp thực tế.
3. Một `setTimeout` hẹn tới **mốc `dueAt` nhỏ nhất còn ở tương lai**, tự đặt lại sau mỗi lần
   bắn. Không `setInterval` mỗi phút: 99% số lần chạy sẽ ra cùng một con số.

Kỹ thuật: giữ một state `now` (Date), đưa vào dependency của `useLiveQuery`; ba nguồn trên chỉ
việc cập nhật `now`. **Đã cài** trong `web/src/lib/use-due-clock.ts` — `AppNav` và mọi màn hình
đọc số đến hạn dùng chung hook này, không tự viết bản thứ hai.

Cùng cơ chế này áp cho thẻ "Ôn tập hôm nay" của dashboard — cùng con số thì cùng nguồn.

### 2.3. Ô số liệu dashboard dùng `src/lib/stats.ts`

Ba ô số liệu (streak · phút học hôm nay · % đúng 7 ngày) tính bằng các hàm thuần của SPEC-07
§2.2 — `currentStreak`, `minutesOnDay`, `accuracyOverDays` — **viết ngay trong phase này**,
không chờ F07. F07 chỉ thêm biểu đồ và trang `/thong-ke` lên trên cùng bộ hàm đó.

Ba định nghĩa chốt kèm theo (SPEC-07 §2.1, §2.2):

- Ranh giới ngày là **nửa đêm giờ địa phương**, không phải UTC.
- Tỷ lệ đúng = tổng `correctCount` ÷ tổng `totalQuestions` trong cửa sổ, **không** phải trung
  bình cộng `accuracyRate` của các phiên.
- Hôm nay chưa học thì streak vẫn tính từ hôm qua trở về trước; không reset lúc 00:01.

Không tính ba con số này tại chỗ trong `page.tsx`. Hai màn hình hiện cùng một con số mà tính
bằng hai đoạn code là lỗi chờ ngày xuất hiện.

**Đã cài** `web/src/lib/stats.ts` (`startOfLocalDay`, `localDayKey`, `currentStreak`,
`minutesOnDay`, `accuracyOverDays`) kèm `stats.test.ts`. Dashboard đã chuyển sang dùng nó.
F07 thêm `dailyMinutes`, `dailyAccuracy`, `targetsByType` vào cùng module.

Cửa sổ truy vấn lịch sử: `practiceSessions` trong **90 ngày** gần nhất, lọc bằng index
`createdAt`. **Không giới hạn theo số phiên** — `.limit(10)` của bản trước làm tỷ lệ đúng 7
ngày sai ngay khi người học làm hơn 10 phiên.

## 3. Màn hình & bố cục

### 3.1. Khung chung (áp cho mọi trang)

Thanh điều hướng là một **dock nổi**, không phải thanh nav đặc kín đáy màn hình như
`design-system.md` §6.3 mô tả. Đây là thay đổi có chủ đích, đã cài trong
`web/src/components/AppNav.tsx`; mục này là hợp đồng mới, §6.3 của design system đọc theo đây
cho phần nav.

**Sáu khu vực, không phải năm.** Bản đầu của spec liệt kê 5 mục và để dashboard `/` không có
lối vào nào trong nav — người dùng đang ở `/hoc` không có cách nào quay về trang chủ ngoài
logo hay nút back. Dock thêm mục **Bảng tin** (`/`) đứng đầu, lấp đúng lỗ đó.

| Thứ tự | Nhãn | Đường dẫn | Icon Lucide |
|---|---|---|---|
| 1 | Bảng tin | `/` | `LayoutDashboard` |
| 2 | Học bài | `/hoc` | `BookOpen` |
| 3 | Luyện tập | `/luyen-tap` | `Dumbbell` |
| 4 | Ôn tập | `/on-tap` | `RotateCcw` |
| 5 | Thống kê | `/thong-ke` | `BarChart3` |
| 6 | Cài đặt | `/cai-dat` | `Settings` |

**Mobile (< 640px) — dock có nhãn**

```
┌──────────────────────────────────┐
│                                  │
│   Nội dung trang                 │  ← chừa chỗ cho dock: pb-32
│                                  │
│                                  │
│   ╭────────────────────────────╮ │
│   │ ▣   ▤   ▥   ▦•  ▧   ▨      │ │  ← icon 22px
│   │Bảng Học Luyện Ôn Thống Cài  │ │  ← nhãn Caption 10px, LUÔN HIỆN
│   ╰────────────────────────────╯ │  ← dock nổi, bo tròn, cách đáy 12px + safe-area
└──────────────────────────────────┘
```

Mỗi ô **56×56px**, icon 22px phía trên, nhãn Caption 10px phía dưới. Sáu ô là 336px cộng
padding 12px = **348px**, còn dư hơn 20px mỗi bên ở màn hình 390px.

> **Nhãn phải luôn hiện ở mobile — đây là ràng buộc cứng.** Bản cài hiện tại chỉ có nhãn trong
> tooltip `group-hover`, mà thiết bị cảm ứng không có trạng thái hover: người dùng mobile thấy
> sáu icon câm và phải bấm thử từng cái. Tooltip là cơ chế của con trỏ chuột, không phải của
> ngón tay. Không thay bằng chạm-giữ: một cử chỉ không có dấu hiệu nào báo là nó tồn tại thì
> không ai dùng.

**≥ 640px — dock icon, tooltip khi hover**

Ô 52×52px, chỉ icon 24px. Nhãn hiện trong tooltip phía trên, chỉ trong
`@media (hover: hover)`. Sau sáu mục là một vạch ngăn 1px rồi **nút tìm kiếm** (`Search`) —
nút này thuộc SPEC-13; cho tới khi SPEC-13 có route thật thì **ẩn nó đi**, đừng để một nút dẫn
tới 404.

Dock giữ nguyên vị trí nổi ở đáy trên mọi bề rộng. **Không** đổi sang nav đầu trang ở desktop:
một thanh cố định ở đáy với sáu đích lớn dùng được bằng ngón cái trên mobile và bằng chuột
trên desktop; hai bố cục khác nhau là hai thứ phải bảo trì.

**Vỏ dock:** nền `background/85` (dark: `card/80`) + `backdrop-blur`, viền `border/70`,
`shadow-2xl`, bo tròn hết cỡ. Mục đang mở: chữ `primary` trên nền `primary/15`. Mục không mở:
`muted-foreground`, hover về `foreground` trên nền `muted/60`.

**Khoảng chừa nội dung:** `pb-32` (mobile) / `pb-40` (≥640px) — dock nổi nên cần nhiều chỗ hơn
`pb-24` của nav đặc. Trang cuối cùng không được bị dock che.

**Huy hiệu đồng bộ không nằm trong dock.** Dock đã đủ chật với sáu mục; huy hiệu đặt ở góc phải
header của từng trang (dashboard đã làm đúng).

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
| Mục dock đang mở / không mở | `nav-item-active` / `nav-item-inactive` — nếu token chưa khớp dock thì **sửa token**, không hardcode màu trong component |
| Vỏ dock | `nav-bar` + `backdrop-blur`, bo tròn hết cỡ |
| Huy hiệu đồng bộ | `sync-badge-synced` / `sync-badge-pending` / `sync-badge-offline` |
| Thẻ "Ôn tập hôm nay", ô số liệu, thẻ điểm yếu | `card` |
| Nút vào phiên ôn | `button-primary` cỡ `quiz` (48px) |
| Thẻ mục tiêu trong "3 điểm yếu" | `design-system.md` §9.8, quá hạn dùng `badge-overdue` |

Icon Lucide: xem bảng sáu mục ở §3.1.

**Chỉ dùng token màu theo tên.** Bản cài hiện tại có màu bảng Tailwind viết thẳng — 5 chỗ trong
`page.tsx` (`amber-500`, `blue-500`, `emerald-500`) và 1 chỗ trong `SyncBadge.tsx`. Đổi hết
sang token: ô số liệu dùng `chart-1…5` theo ánh xạ cố định (`design-system.md` §11.3), huy hiệu
chờ đồng bộ dùng `warning`. `AGENTS.md` cấm hardcode màu trong component, và bộ màu Washi mất
tác dụng ngay khi có một ô lệch tông.

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
>
> `SyncBadge.tsx` hiện mới có hai nhánh (`pending` / `offline`). Thêm nhánh `synced` **ngay bây
> giờ** kèm prop điều khiển, để F08 chỉ việc truyền trạng thái vào — nhưng giữ nguyên hành vi:
> chưa đăng nhập thì luôn ra `offline`.

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
| Badge > 99 | Hiện `99+` |
| Mục nav trỏ route chưa dựng | Vẫn hiện trong dock (5/6 route sẽ 404 cho tới khi SPEC-03–07 xong). **Trừ nút tìm kiếm**: ẩn cho tới khi SPEC-13 có route |

## 6. Tương tác & chuyển động

- Đổi mục dock: 150ms `ease-out` cho màu. Không animate chuyển trang.
- Hover trên dock (chỉ `@media (hover: hover)`): icon phóng nhẹ và nhấc lên 2px, 150ms.
  Chạm: `active:scale-95`.
- **Badge số đến hạn không được `animate-pulse` trần.** Bản cài hiện tại nhấp nháy vĩnh viễn
  và không tôn trọng `prefers-reduced-motion`. Bọc trong
  `@media (prefers-reduced-motion: no-preference)`, hoặc bỏ hẳn — con số đỏ trên nền dock đã
  đủ nổi, một vật thể động thường trực trong tầm mắt là thứ gây mỏi ở một app học 30 phút liền.
- **`Ctrl+K`: chưa làm gì thì chưa đăng ký.** Hộp tìm kiếm thuộc SPEC-13. Một listener
  `preventDefault` mà không mở gì chỉ có một tác dụng: chặn mất thao tác sẵn có của trình
  duyệt (Chrome/Edge: nhảy vào thanh địa chỉ ở chế độ tìm kiếm; Firefox: mở thanh tìm kiếm).
  Đó là làm hỏng một phím tắt người dùng đang dùng được để đổi lấy không gì cả.
  **Xóa `web/src/components/ShortcutListener.tsx`**; SPEC-13 tự đăng ký phím cùng lúc với hộp
  tìm kiếm, và chỉ `preventDefault` khi thật sự mở được hộp.
- Toàn bộ hoạt ảnh bọc trong `@media (prefers-reduced-motion: no-preference)`.

**Chống FOUC — bắt buộc.** Bốn class trên `<html>`: `hide-furigana`, `furigana-large`,
`hide-translations` và `dark`.

CSS cho ba class đầu **đã viết sẵn** trong `web/src/app/globals.css` dòng 174–194, `dark` là
cơ chế sẵn có của `@theme inline`. Không viết lại, chỉ cần bật class. Nội dung script đã có ở
`getFOUCScriptContent()` trong `settings.ts` — dùng nó, không viết bản thứ hai. Đọc `localStorage` và gắn class trong một script chạy **trước paint đầu
tiên**, nếu không người dùng bật "ẩn furigana" sẽ thấy furigana nhấp nháy mỗi lần tải trang.

## 7. Accessibility

- Dock là `<nav>` với `aria-label` mô tả **chức năng**, không mô tả hình dáng: "Điều hướng
  chính", không phải "Thanh điều hướng Apple Dock". Người dùng screen reader cần biết nó làm
  gì, không cần biết nó trông giống cái gì. Bỏ `role="navigation"` — thẻ `<nav>` đã mang sẵn
  vai trò đó, khai lại là thừa.
- Mục đang mở mang `aria-current="page"`.
- **Nhãn chữ hiện thật trên mobile** (§3.1). Không dựa vào `aria-label` để thay nhãn nhìn thấy
  được: người sáng mắt dùng cảm ứng cũng cần đọc được tên khu vực.
- Tooltip chỉ dựng trong `@media (hover: hover)`. Không render phần tử `role="tooltip"` ở
  mobile — nó là nội dung ẩn không bao giờ hiện, chỉ làm rối cây trợ năng.
- Vùng chạm mỗi mục ≥ 48×48px (mobile 56, desktop 52), cách nhau ≥ 8px.
- Huy hiệu đồng bộ: icon có `aria-hidden`, chữ trạng thái là nội dung đọc được. Trên mobile
  khi chữ bị ẩn, dùng `aria-label` mang đúng chuỗi đó.
- Badge số đến hạn đọc thành "Ôn tập, 12 mục đến hạn", không đọc trần số.
- Focus ring 3px giữ nguyên trên mọi mục nav.
- Màu không đứng một mình: mục nav đang mở vừa đổi màu `primary` vừa đậm chữ.

## 8. Bảo mật & dữ liệu

Không có dữ liệu nào rời khỏi máy ở phạm vi spec này. Tiến độ học nằm trong IndexedDB
(`JapaneseLearningDB`), sáu cài đặt nằm trong `localStorage` dưới khóa `jp:settings`. Không telemetry,
không analytics, không gọi mạng.

Xóa dữ liệu: người dùng xóa dữ liệu site của trình duyệt là mất toàn bộ tiến độ. Màn hình
Cài đặt (đợt sau) phải nói rõ điều này và cung cấp Export JSON. Spec này chỉ cần dựng lối vào
mục Cài đặt.

## 9. Tiêu chí nghiệm thu

**Đã kiểm bằng code + `pnpm check` / `pnpm test` / `pnpm build` (17/09/2026):**

- [x] Mỗi mục dock có nhãn chữ thật ở mobile (`<span className="sm:hidden">`), ô `w-14 h-14`
      = 56×56px đúng §3.1
- [x] Từ 640px tooltip chỉ render khi `isDesktop` — **không** có phần tử `role="tooltip"` nào
      trong DOM ở mobile
- [x] Trang chừa `pb-32 sm:pb-40` trong `layout.tsx`
- [x] Nút tìm kiếm đã gỡ khỏi dock, không còn link nào trỏ `/tim-kiem`
- [x] Không còn màu bảng Tailwind trong `page.tsx` và `SyncBadge.tsx` (dùng `chart-1..3`,
      `warning`, `success`)
- [x] Badge đến hạn dùng `motion-safe:animate-pulse`
- [x] Badge "Ôn tập" đếm `dueAt <= now`, bằng 0 thì ẩn hẳn
- [x] `AppNav` và dashboard cùng lấy mốc thời gian từ `useDueClock` — `visibilitychange`,
      `focus`, và `setTimeout` hẹn tới `dueAt` gần nhất
- [x] `store.ts` không còn `furiganaVisible` / `studyMode`; cài đặt đọc qua `settings.ts`
- [x] Ba ô số liệu gọi `stats.ts`, không còn phép tính nào viết tại chỗ trong `page.tsx`
- [x] Không còn listener `Ctrl+K` nào — phím trả về hành vi mặc định của trình duyệt
- [x] Streak tính từ `practiceSessions`, không phải hằng số
- [x] Phiên lúc 23:30 giờ địa phương tính vào hôm nay (`stats.test.ts`)
- [x] `% đúng 7 ngày` tính trên mọi phiên trong cửa sổ 90 ngày, không giới hạn số phiên
- [x] Dashboard tài khoản trắng hiện `—` và "Chưa có chuỗi", không hiện `0%`
- [x] `page.tsx` cũ đã bị thay hẳn, không còn thẻ "Sẵn sàng…" nào
- [x] Đúng một nút `default` hiển thị trên dashboard (ba nhánh `size="quiz"` loại trừ nhau)

**Chưa kiểm được bằng code — cần mở trình duyệt thật:**

- [ ] Ở 390px: dock 6 mục không tràn, nhãn không bị cắt chữ, không cuộn ngang
- [ ] Bật "ẩn furigana", tải lại trang → furigana **không** nhấp nháy lần nào (thử với CPU
      throttle 4×)
- [ ] Để tab mở qua một mốc `dueAt` (chỉnh `dueAt` về 1 phút sau trong DevTools) → badge tự
      tăng, **không** cần tải lại trang
- [ ] Chuyển tab rồi quay lại sau nửa đêm → badge và thẻ dashboard tính theo ngày mới
- [ ] Bật "giảm chuyển động" của hệ điều hành → badge ngừng nhấp nháy, số vẫn hiện
- [ ] Đủ sáu trạng thái cho mọi phần tử bấm được, focus ring còn nguyên
- [ ] Xem ở 390px và 1280px, cả chế độ sáng lẫn tối

> Bốn mục đầu cần dữ liệu thật trong IndexedDB (một phiên luyện tập đã ghi `reviewItems`).
> Hiện `db` còn trống nên chưa dựng được ca kiểm; làm sau khi SPEC-04 chạy được một phiên.

## 10. Khối lệnh bàn giao thiết kế

Dán nguyên khối dưới đây kèm `web/DESIGN.md` vào Stitch / Claude Design.

---

Nạp `DESIGN.md` làm hợp đồng token. Ba ràng buộc bắt buộc:

1. Chỉ dùng token màu theo tên (`bg-primary`, `text-muted-foreground`), **tuyệt đối không
   hardcode mã hex**.
2. Mobile-first: dựng bố cục 390px trước, rồi mới mở rộng lên 1024px.
3. Mọi chữ tiếng Nhật phải bọc trong phần tử có class `jp`.

Dựng hai thứ:

**A. Dock điều hướng.** Một thanh **nổi, bo tròn hết cỡ**, cách đáy màn hình 12px cộng
safe-area, căn giữa theo chiều ngang, nền mờ có `backdrop-blur`, viền mảnh và bóng đổ sâu —
không phải thanh nav đặc kín chiều rộng. Sáu khu vực theo đúng thứ tự: Bảng tin, Học bài,
Luyện tập, Ôn tập, Thống kê, Cài đặt.

*Ở 390px:* mỗi mục là một ô **56×56px** gồm icon 22px phía trên và **nhãn chữ 10px phía dưới,
luôn hiện** — không giấu nhãn trong tooltip, vì thiết bị cảm ứng không có trạng thái hover.
Sáu ô vừa khít trong 390px với lề hai bên.

*Từ 640px:* mỗi mục là ô **52×52px chỉ có icon**; nhãn chuyển thành tooltip nổi phía trên, chỉ
xuất hiện khi rê chuột. Sau sáu mục là một vạch ngăn dọc mảnh rồi một nút kính lúp (tìm kiếm).

Mục đang mở: chữ và icon màu `primary` trên nền `primary/15` bo tròn. Mục không mở:
`muted-foreground`. Mục "Ôn tập" mang một badge số đếm nhỏ màu `destructive` ở góc trên phải
icon khi lớn hơn 0, quá 99 thì hiện `99+`. **Badge không nhấp nháy.**

Dock giữ nguyên kiểu nổi ở đáy trên **mọi** bề rộng — không đổi thành thanh đầu trang ở
desktop, không sidebar dọc.

**B. Trang chủ / Dashboard**, bề rộng tối đa `max-w-5xl`, theo thứ tự khối: header lời chào
kèm huy hiệu trạng thái dữ liệu bên phải · một thẻ lớn "Ôn tập hôm nay — n mục đến hạn" chứa
nút chính duy nhất của trang (cỡ `quiz`, cao 48px) · hàng ba ô số liệu (chuỗi ngày, phút học
hôm nay, phần trăm đúng 7 ngày) xếp dọc ở mobile và thành 3 cột từ 768px · thẻ bài học đang
dở · thẻ ba điểm yếu hàng đầu.

Mỗi ô số liệu có một ô icon vuông bo góc bên trái. **Màu của ba ô icon lấy từ bộ màu biểu đồ
`chart-1`, `chart-2`, `chart-3`** — không dùng màu bảng Tailwind như amber, blue, emerald.

Trang phải chừa khoảng trống đáy đủ cho dock nổi (`pb-32`, từ 640px là `pb-40`).

Huy hiệu trạng thái dữ liệu có ba biến thể — `sync-badge-synced`, `sync-badge-pending`,
`sync-badge-offline` — mỗi biến thể **phải có cả icon lẫn nhãn chữ**, màu không bao giờ đứng
một mình. Trên mobile chỉ hiện icon.

Mọi phần tử bấm được cần đủ sáu trạng thái: Mặc định, Hover (chỉ khi `(hover: hover)`), Focus
(ring 3px, không bao giờ tắt), Active (dịch xuống 1px), Disabled (`opacity-50`), Loading
(spinner thay icon, giữ nguyên bề rộng).

Trang phải chừa `pb-32` (từ 640px: `pb-40`) cho dock nổi. Hoạt ảnh bọc trong `@media (prefers-reduced-motion:
no-preference)`, 150ms `ease-out` cho đổi màu.

Cần cả chế độ sáng và tối.

---

> **Không** dùng file Stitch export để ghi đè `web/src/app/globals.css`. Bản export đổi màu
> về hex, bỏ toàn bộ chế độ tối, và mất lớp `@theme inline` — chính là thứ cho phép class
> `.dark` ghi đè token lúc chạy (`design-system.md` §12).
