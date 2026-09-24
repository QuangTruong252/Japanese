# SPEC-02 — Shell điều hướng & trạng thái toàn cục

> **Mã:** SPEC-JPN-F02 · **Ngày:** 16/09/2026 · **Rà soát:** 17/09/2026, 22/09/2026
> **Trạng thái:** 🟠 *Vỏ điều hướng* — UX duyệt 22/09/2026, thị giác chưa duyệt, code chưa theo.
> 🟠 *Bảng tin* — **UX duyệt 22/09/2026**, **thị giác chưa duyệt**, code đã có nhưng lệch.
> Phần lệch của cả hai nằm ở §9; hợp đồng UX Bảng tin ở §3.2; khối lệnh cho công cụ thị giác ở §10.
> **Đối tượng đọc:** Google Stitch / Claude Design (mục 3–6), lập trình viên (toàn bộ).
> **Phụ thuộc:** SPEC-01 (số mục đến hạn lấy từ Dexie, có thể là 0 ở giai đoạn đầu).

## 1. Mục tiêu & phạm vi

Dựng khung bao quanh mọi màn hình: thanh điều hướng 5 khu vực, huy hiệu trạng thái dữ liệu,
và cơ chế áp cài đặt hiển thị lên toàn trang, cùng hợp đồng UX của màn Bảng tin (§3.2).

**Trong phạm vi**

- Vỏ điều hướng 5 khu vực chính: Bảng tin · Học bài · Luyện tập · Ôn tập · Thống kê
- Lối vào thứ cấp (Cài đặt, hồ sơ, trạng thái đồng bộ) — **không** nằm trong nav chính
- Huy hiệu trạng thái đồng bộ, đặt trong lối vào thứ cấp (§3.1)
- Áp `settings` lên `<html>` bằng class, chống FOUC (gồm cả `theme`)
- Bảng tin `/` — hợp đồng UX ở §3.2, khuôn bề rộng `content-wide` (`DESIGN.md` §Layout and containers)
- `src/lib/stats.ts` — ba hàm số liệu dùng chung với SPEC-07

**Ngoài phạm vi**

- Nội dung của 5 khu vực — thuộc SPEC-03, SPEC-04, SPEC-05 và đợt spec 2
- Màn hình Cài đặt (chỉ dựng lối vào) — đợt spec 2
- Phím tắt `Ctrl+K` và hộp tìm kiếm — **cả hai** thuộc SPEC-13, xem mục 6
- Màn hình Thống kê và mọi biểu đồ — SPEC-07. Spec này chỉ dùng ba hàm số liệu
- Đăng nhập và mọi thứ liên quan Supabase — spec này dựng **lối vào** tài khoản, không dựng
  danh tính người dùng. Chừng nào chưa có danh tính thật thì không có tên người dùng trên màn
- Mục tiêu học theo ngày (số phút/ngày, "hôm nay đủ chưa", danh sách việc hôm nay) — chưa có
  định nghĩa sản phẩm lẫn mô hình dữ liệu; xem §3.2
- Widget "Kanji hôm nay" — không còn thuộc hợp đồng Bảng tin; xem §3.2

## 2. Dữ liệu

| Nguồn | Chiều | Dùng cho |
|---|---|---|
| `db.reviewItems` (Dexie) | Đọc, qua `useLiveQuery` | Số mục đến hạn → badge trên mục "Ôn tập" |
| `db.practiceSessions` | Đọc | Nhịp học ở Bảng tin và số liệu `/thong-ke`, **qua `src/lib/stats.ts`** |
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

Cùng cơ chế này áp cho khối hành động chính của Bảng tin — cùng con số thì cùng nguồn.

### 2.3. Số liệu dùng chung `src/lib/stats.ts`

> **Đọc theo ngày.** Mục này ghi lại lý do `stats.ts` được tách ra (17/09/2026). Từ 22/09/2026,
> **Bảng tin không còn ba ô số liệu đó** — xem §3.2. Bảng tin chỉ còn đọc `currentStreak` cho
> tín hiệu nhịp học P2; `minutesOnDay` và `accuracyOverDays` phục vụ `/thong-ke`. Luật "một con
> số thì một nguồn" bên dưới vẫn còn hiệu lực nguyên vẹn.

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

> **Hợp đồng vỏ ứng dụng — chốt 22/09/2026.** Mục này thay bản "dock nổi 6 mục" trước đó và
> khớp với `DESIGN.md` §Navigation. Code hiện tại **chưa** theo bản này; phần lệch ghi ở §9.

**Năm khu vực chính.** Cài đặt ra khỏi nav chính — người học mở nó vài lần, không mở mỗi ngày.
Lỗ hổng mà bản trước phải thêm mục thứ sáu để vá (không có lối về trang chủ) được lấp bằng
cách khác: **Bảng tin là một trong năm khu vực chính**, còn Cài đặt xuống lối vào thứ cấp.

| Thứ tự | Nhãn | Đường dẫn | Icon Lucide |
|---|---|---|---|
| 1 | Bảng tin | `/` | `LayoutDashboard` |
| 2 | Học bài | `/hoc` | `BookOpen` |
| 3 | Luyện tập | `/luyen-tap` | `Dumbbell` |
| 4 | Ôn tập | `/on-tap` | `RotateCcw` |
| 5 | Thống kê | `/thong-ke` | `BarChart3` |

**Hai vỏ, một mốc chuyển — `lg` (1024px).**

**< 1024px — thanh điều hướng đáy**

```
┌──────────────────────────────────┐
│                                  │
│   Nội dung trang                 │  ← chừa chỗ cho thanh nav đáy
│                                  │
│   ╭────────────────────────────╮ │
│   │  ▣    ▤    ▥    ▦•   ▧     │ │  ← icon 24px
│   │ Bảng  Học Luyện  Ôn  Thống │ │  ← nhãn Caption, LUÔN HIỆN ở mọi bề rộng < lg
│   ╰────────────────────────────╯ │
└──────────────────────────────────┘
```

Giữ kiểu **dock nổi** đã duyệt: bo tròn hết cỡ, cách đáy 12px cộng safe-area, nền mờ có
`backdrop-blur`, viền mảnh. Đây là bề mặt "nav nổi" duy nhất được phép blur
(`DESIGN.md` §Surfaces and elevation).

> **Nhãn phải luôn hiện ở mọi bề rộng dưới `lg` — ràng buộc cứng.** Máy tính bảng cũng là thiết
> bị cảm ứng; tooltip là cơ chế của con trỏ chuột, không phải của ngón tay. Không có biến thể
> "chỉ icon" ở 640px nữa. Không thay bằng chạm-giữ: một cử chỉ không có dấu hiệu nào báo là nó
> tồn tại thì không ai dùng.

Mỗi ô tối thiểu 48px chiều cao (`DESIGN.md` §Spacing and touch targets), icon 24px phía trên,
nhãn Caption phía dưới. Năm ô rộng rãi trong 390px.

**≥ 1024px — sidebar trái**

Năm khu vực xếp dọc trong sidebar trái; **không** có thanh đầu trang, và thanh nav đáy biến mất
hoàn toàn. Khu vực tài khoản nằm cuối sidebar. Sidebar là bề mặt thường, phân tách bằng viền
1px — không blur, vì nội dung nằm **cạnh** nó chứ không trôi **dưới** nó.

> **Chi tiết sidebar chưa chốt và không chốt ở đây:** bề rộng, trạng thái thu gọn, vị trí logo,
> bố cục khu vực tài khoản. Đó là câu hỏi thị giác, sẽ khám phá bằng Stitch khi làm màn Bảng
> tin (Golden Screen #1) rồi ghi ngược về mục này.

**Lối vào thứ cấp.** Cài đặt, hồ sơ, trạng thái đồng bộ, chủ đề và đăng xuất nằm sau **một**
lối vào tài khoản:

| Vỏ | Vị trí |
|---|---|
| < `lg` | Nút avatar/hồ sơ ở header trang Bảng tin |
| ≥ `lg` | Khu vực tài khoản cuối sidebar |

**Không** thêm mục "Thêm" vào nav đáy. Khi menu thứ cấp lớn hơn một lối vào thì quay lại sửa
hợp đồng, không tự ứng biến thêm slot.

**Tìm kiếm** (SPEC-13) là mục thứ cấp, không phải khu vực chính; chưa có route thật thì không
hiện lối vào nào.

**Khoảng chừa nội dung** theo ngữ nghĩa vỏ, đặt **một lần** trong app shell, không rải ở từng
trang:

| Vỏ | Chừa đáy |
|---|---|
| < `lg` (nav đáy) | Chừa đủ để phần tử cuối không bị thanh nav che |
| ≥ `lg` (sidebar) | **Không chừa đáy** — không còn gì ở đáy để tránh |

Giá trị pixel của phần chừa mobile chốt cùng lúc với bản thị giác của thanh nav đáy khi duyệt
màn Bảng tin. Không khóa con số ở thời điểm này.

**Huy hiệu đồng bộ không nằm trong nav chính** — nó thuộc lối vào tài khoản ở trên.

### 3.2. Bảng tin `/` — hợp đồng UX

> **Sửa 24/09/2026 — người dùng duyệt**, dựa trên [benchmark UI/UX](../research/ux-benchmark/README.md):
> (1) **bỏ hẳn Nhịp học/streak** khỏi Bảng tin; (2) người mới có lối phụ **"Tôi đã học đến
> bài…"** — từ vựng các bài đó vào lịch ôn **nhỏ giọt** theo `dailyNewLimit`, không nạp hàng
> loạt (SPEC-05 §2.1); (3) thêm trạng thái **"Đã ôn xong"** kèm số mục ngày mai; (4) ôn theo
> **lô** do người học chỉnh (`reviewBatchSize`, SPEC-05 §2.1). Các chỗ bên dưới đã sửa theo.
>
> **Chốt 22/09/2026 — UX đã duyệt, thị giác chưa duyệt.** Mục này thay bản "dashboard bốn ô số
> liệu" trước đó. Code hiện tại **chưa** theo bản này; phần lệch ghi ở §9. Phần thị giác (bố cục
> cụ thể, tỷ lệ, mật độ) chưa chốt — đó là việc của §10.

Khuôn bề rộng: `content-wide` (`DESIGN.md` §Layout and containers) — `max-w-5xl`, đo trong
**vùng nội dung cạnh sidebar** khi ở desktop, không đo theo viewport.

**Mục tiêu của màn.** Giúp người học bắt đầu ngay hành động học phù hợp nhất mà không phải tự
phân tích nên làm gì tiếp theo.

Bảng tin **không phải** trang phân tích, **không phải** danh mục tính năng (nav năm khu vực đã
làm việc đó), và **không phải** hệ thống việc-cần-làm theo ngày.

Hướng đã duyệt là kết hợp hai thứ: *quyết định việc nên làm tiếp theo* và *giữ ngữ cảnh mình
đang học bài nào*.

#### Kiến trúc thông tin

Đây là kiến trúc thông tin, không phải bố cục pixel. Cách sắp xếp thị giác thuộc §10.

```
Bảng tin
├── Header
│   ├── lời chào ngắn
│   └── lối vào tài khoản / avatar     (§3.1 — đường duy nhất tới Cài đặt ở < lg)
├── Việc nên làm tiếp theo             P0
├── Bài đang học                       P0 hoặc P1 — xem luật hợp nhất
└── Cần củng cố                        P1, ẩn khi bằng 0
```

| Mức | Nội dung |
|---|---|
| **P0** | Việc nên làm tiếp theo · số mục của lô ôn khi lớn hơn 0 · lối vào tài khoản · bài đang học **khi nó chính là** việc nên làm tiếp theo |
| **P1** | Bài đang học khi ôn tập đang là hành động chính · lối đi thay thế · tóm tắt "Cần củng cố" · lối phụ "Tôi đã học đến bài…" (chỉ người mới) |

Không có nội dung P2/P3 trên Bảng tin ở phiên bản này.

#### Việc nên làm tiếp theo — P0

Đúng **một** hành động nổi bật trên màn. Quy tắc chọn:

| Điều kiện | Hành động chính | Đích |
|---|---|---|
| Lô ôn hôm nay > 0 (mục đến hạn + mục mới, `useDueQueue`) | Ôn lô hiện tại | `/on-tap` |
| Lô ôn = 0 và có bài đang học | Học tiếp bài đang học | `/hoc/<số>` |
| Lô ôn = 0 và chưa học gì | Bắt đầu bài 1 | `/hoc/1` |

Số trên Bảng tin lấy **cùng hook** `useDueQueue` với `/on-tap`, nên hai màn luôn ra một con số.
Khối ôn ghi khối lượng, không giải thích thuật toán: "20 mục · khoảng 6 phút", thêm "còn 180 mục
đến hạn" khi tồn đọng vượt một lô. Số phút chỉ hiện khi có phiên cũ để suy thời gian mỗi câu
(`durationSeconds / totalQuestions`), không bịa giá trị mặc định.

**Người mới** (chưa có `reviewItems`, chưa khai báo): nút chính "Bắt đầu bài 1", kèm một lối phụ
"Tôi đã học đến bài…" dẫn tới mục khai báo trong Cài đặt. Khai báo xong, bài đang học là bài
đầu tiên sau bài đã khai báo.

**Đã ôn xong** (lô = 0, đã có `reviewItems`): khối hợp nhất ghi "Đã ôn xong các mục đến hạn.
Ngày mai có N mục." (hoặc "Ngày mai chưa có mục nào đến hạn."), nút chính vẫn là học tiếp bài
đang học. Đây là mô tả trạng thái, không phải mục tiêu theo ngày.

Đây là bản mở rộng của quy tắc đã duyệt trước đó (đổi `variant` giữa hai nút ngang hàng) thành
**chọn một hành động**. Nút chính vẫn là nút `default` duy nhất của trang.

Chữ trên nút nói **việc sẽ làm**, theo giọng văn ở `PRODUCT.md`: "Bắt đầu ôn", "Học tiếp bài 7",
"Bắt đầu bài 1". Số liệu đi kèm (`12 mục cần ôn`, `Bài 7 đang học`) nằm ở phần ngữ cảnh của
khối, không nhồi hết vào nhãn nút.

**Luôn phải có một lối đi thay thế.** Khi hành động chính là ôn tập, người học vẫn phải tới
được bài đang học mà không cần đi vòng qua nav — lối đó chính là khối "Bài đang học".

#### Bài đang học — và luật không nhân đôi

**Ràng buộc cứng.** Khi hành động chính *là* "học tiếp bài đang học", thì "Việc nên làm tiếp
theo" và "Bài đang học" phải là **một khối duy nhất**. Không dựng một thẻ lớn "Việc nên làm"
rồi ngay dưới đặt một thẻ lớn thứ hai lặp lại cùng bài, cùng tiến độ, cùng nút.

| Tình huống | Cấu trúc |
|---|---|
| `dueCount > 0` | Khối ôn tập là P0; **Bài đang học** là khối P1 riêng bên dưới |
| `dueCount = 0` | Hai vai trò **hợp nhất**: một khối vừa là ngữ cảnh vừa mang nút chính của trang |

Khối "Bài đang học" trả lời đúng một câu — *tôi đang ở đâu* — và được phép chứa: số bài, tên
bài, tiến độ **thật** trong bài, lối vào học tiếp.

**Không** chứa: số mẫu ngữ pháp viết cứng, tổng số từ ước lượng, hay số liệu phân tích của bài.

##### Dữ liệu "bài đang học" phải đúng

Bản cài hiện tại suy bài đang học bằng `recentSessions[0].selectedLessons[0]`
(`web/src/app/page.tsx`). **Đó không phải hợp đồng đúng**: nó trả về bài *nhỏ nhất trong lần
chọn luyện tập gần nhất*, nên người học đang ở bài 7 mà lần luyện gần nhất chọn [1, 2, 7] thì
Bảng tin nói "bài 1"; người chưa học gì thì rơi về `1` và bị gọi là "đang học dở".

Hợp đồng:

> "Bài đang học" phải phản ánh tiến trình học thật và phải **nhất quán với cách khu vực Học
> xác định bài hiện hành**. Bên triển khai **dùng lại hoặc hợp nhất** logic đã có
> (`countLearnedByLesson` + `vocabCount` thật, như `web/src/components/LessonGrid.tsx` đang
> làm), **không** viết thuật toán riêng cho Bảng tin.

Không refactor trong task tài liệu này; đây là yêu cầu cho phase triển khai (§9).

#### Cần củng cố — P1

Chỉ **số lượng** và **một** lối vào: "n nội dung cần củng cố → Xem và luyện lại" →
`/on-tap/diem-yeu`.

Không liệt kê ba mục tiêu kèm ba nút "Luyện lại" trên Bảng tin — danh sách, bộ lọc theo loại và
thao tác từng mục thuộc `/on-tap/diem-yeu`.

`n = 0` thì **ẩn hẳn khối**, không render thẻ rỗng để giữ bố cục.

#### Nhịp học — đã bỏ 24/09/2026

Bảng tin **không** hiện chuỗi ngày dưới bất kỳ dạng nào. Lý do: streak là cơ chế loss-aversion
bị phê bình nhiều nhất ở Duolingo, trái giọng văn `PRODUCT.md`; bản cài cũ còn dùng màu
`amber-*` thô. Chuỗi ngày vẫn ở `/thong-ke` (SPEC-07).

#### Không thuộc Bảng tin

| Đã bỏ khỏi hợp đồng | Thuộc về |
|---|---|
| Bốn ô số liệu: chuỗi ngày · phút hôm nay · % đúng 7 ngày · từ vựng N5 | `/thong-ke`; tiến độ N5 theo bài ở `/hoc` |
| Phân loại mục đến hạn theo từ vựng/ngữ pháp | `/on-tap` |
| Danh sách xem trước hàng đợi ôn | `/on-tap` |
| Ba dòng điểm yếu kèm nút riêng từng dòng | `/on-tap/diem-yeu` |
| Widget "Kanji hôm nay" | Không thuộc màn nào hiện có; cân nhắc lại ở luồng Học hoặc Tra cứu sau |
| Chuỗi ngày (streak) | `/thong-ke` |
| Mục tiêu phút/ngày, danh sách việc hôm nay | Chưa tồn tại — xem ghi chú dưới. Trạng thái "Đã ôn xong" ở trên chỉ mô tả hàng đợi, không phải mục tiêu |
| Tên người dùng viết cứng, tục ngữ, emoji trang trí | Không phải nội dung bắt buộc của màn |

> **Không phát minh mục tiêu theo ngày.** Con số `30 phút` trong code hiện tại không phải yêu
> cầu sản phẩm: `settings.ts` chỉ có `dailyNewLimit`, không có mục tiêu thời gian nào. Muốn có
> khái niệm "hôm nay đủ chưa" thì cần một quyết định sản phẩm riêng kèm mô hình dữ liệu, không
> phải một mẫu số viết thẳng trong JSX.

Lời chào ở header phải ngắn, không chiếm thứ bậc, không mang tên người viết cứng, và không có
chuyển động trang trí.

#### Responsive

| Bề rộng | Bố cục |
|---|---|
| ~390px | Xếp dọc đúng thứ tự kiến trúc thông tin. Hành động chính phải xuất hiện **rất sớm** — không có hàng số liệu nào chen phía trên. Chừa đáy cho thanh nav nổi (§3.1) |
| `sm` / `md` | Được nới khoảng trắng, cho một vài khối phụ thành hai cột, làm dày thêm ngữ cảnh bài học. **Không** thêm nhóm thông tin mới chỉ vì có thêm bề rộng |
| `lg` trở lên | Có sidebar; nội dung nằm trong `content-wide` **đo trong vùng nội dung**. Được phép chia cột chính / cột phụ. **Không** bịa section mới để lấp chỗ trống |

> **Xóa hẳn `web/src/app/page.tsx` bản 16/09.** 124 dòng marketing với 6 thẻ "Sẵn sàng…" mô tả
> các tính năng chưa tồn tại. Việc này **đã làm xong** ngày 17/09; bản hiện tại là bản khác và
> lệch theo cách khác — xem §9.

## 4. Component dùng lại

Lấy từ `DESIGN.md`, không mô tả lại:

| Vai trò | Token component |
|---|---|
| Mục nav đang mở / không mở | `nav-item-active` / `nav-item-inactive` — nếu token chưa khớp thì **sửa token**, không hardcode màu trong component |
| Vỏ nav đáy (< `lg`) | `nav-bar` + `backdrop-blur`, bo tròn hết cỡ |
| Vỏ sidebar (≥ `lg`) | Bề mặt thường + viền 1px, **không** blur |
| Huy hiệu đồng bộ | `sync-badge-synced` / `sync-badge-pending` / `sync-badge-offline` |
| Khối "Việc nên làm tiếp theo" / "Bài đang học" / "Cần củng cố" | `card` |
| Nút hành động chính của Bảng tin | `button-primary` cỡ `quiz` (48px) |
| Tiến độ trong bài | `ui/progress.tsx` + `LessonProgress.tsx` — **không** dựng thanh thứ ba tại chỗ |
| Khung tải | `ui/skeleton.tsx` |
| Lối vào tài khoản / avatar | **Chưa có implementation** — xem §9 |

Icon Lucide: xem bảng năm khu vực ở §3.1.

**Chỉ dùng token màu theo tên.** Bản cài hiện tại có màu bảng Tailwind viết thẳng — 5 chỗ trong
`page.tsx` (`amber-500`, `blue-500`, `emerald-500`) và 1 chỗ trong `SyncBadge.tsx`. Đổi hết
sang token: ô số liệu dùng `chart-1…5` theo ánh xạ cố định (`DESIGN.md` §Charts), huy hiệu
chờ đồng bộ dùng `warning`. `AGENTS.md` cấm hardcode màu trong component, và bộ màu Washi mất
tác dụng ngay khi có một ô lệch tông.

## 5. Trạng thái

**Huy hiệu đồng bộ** (`DESIGN.md` §Components) — mỗi trạng thái có icon **và** chữ riêng:

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

**Mọi phần tử bấm được** đủ sáu trạng thái theo `DESIGN.md` §Interaction states: Mặc định · Hover
(chỉ trong `(hover: hover)`) · Focus (ring 3px `ring-ring/50`, **không bao giờ tắt outline**) ·
Active (`translate-y-px`) · Disabled (`opacity-50`, `pointer-events-none`) · Loading (spinner
thay icon, giữ nguyên bề rộng).

**Trạng thái của Bảng tin** (hợp đồng §3.2)

| Tình huống | Hiển thị |
|---|---|
| **Đang tải** — truy vấn Dexie chưa trả về | Skeleton đúng kích thước khối thật, không đẩy bố cục. **Không coi `undefined` là `0`**: dựng nhánh "không có gì đến hạn" trong lúc dữ liệu chưa về là hiện một trạng thái thành công sai rồi nhảy sang trạng thái thật ngay sau đó |
| **Người dùng mới** — chưa có phiên, chưa có `reviewItems` | Hành động chính là "Bắt đầu bài 1" → `/hoc/1`. **Không** gọi bài 1 là "đang học dở". Không hiện `0%` hay `0/650`, không có lời nhắc nào về chuỗi ngày bằng 0 |
| **Không có mục đến hạn** | Không render thẻ ôn tập rỗng. Hành động chính chuyển sang bài đang học theo luật hợp nhất ở §3.2 |
| **Không có điểm yếu** | Ẩn hẳn khối "Cần củng cố", không giữ thẻ rỗng để cân bố cục |
| **Dữ liệu thưa** | Hiện `—` cho thứ chưa tính được. Không bịa giá trị mặc định, không vẽ tiến độ trên mẫu số ước lượng |
| Badge "Ôn tập" trên nav = 0 | Ẩn hẳn badge, không hiện số 0 |
| Badge > 99 | Hiện `99+` |
| Mục nav trỏ route chưa dựng | Vẫn hiện trong nav (một số route 404 cho tới khi SPEC-03–07 xong). Lối vào **thứ cấp** thì ngược lại: chưa có route thật thì ẩn, đừng để một nút dẫn tới 404 |

## 6. Tương tác & chuyển động

- Đổi mục nav: 150ms `ease-out` cho màu. Không animate chuyển trang, không animate lúc vỏ
  chuyển giữa nav đáy và sidebar ở `lg`.
- Hover trên mục nav (chỉ `@media (hover: hover)`): icon phóng nhẹ và nhấc lên 2px, 150ms.
  Chạm: `active:scale-95`.
- **Badge số đến hạn không nhấp nháy — bỏ hẳn `animate-pulse`.** `DESIGN.md` §Navigation cấm
  chuyển động lặp vô hạn để gây chú ý; bọc trong `prefers-reduced-motion` cũng không đủ, vì
  người không bật tùy chọn đó vẫn phải nhìn nó suốt buổi học. Con số đỏ đã đủ nổi, và một vật
  thể động thường trực trong tầm mắt là thứ gây mỏi ở một app học 30 phút liền.
- **Không có chuyển động trang trí thường trực trên Bảng tin.** Cùng lý do trên, áp cho mọi
  phần tử của màn — kể cả chấm nhấp nháy cạnh lời chào. Chuyển động chỉ dùng để phản hồi một
  thao tác, không dùng để làm màn hình "sống động".
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

> **Đọc kỹ ngày.** Danh sách "đã kiểm 17/09/2026" nghiệm thu bản **dock nổi 6 mục**, tức hợp
> đồng cũ. Hợp đồng vỏ ứng dụng đổi ngày 22/09/2026 (§3.1) và **code chưa được sửa theo**.
> Những mục đánh dấu ✱ dưới đây là bằng chứng lịch sử, không còn là tiêu chí hiện hành.

**Lệch so với hợp đồng 22/09/2026 — chưa sửa, không sửa trong task tài liệu:**

- [ ] Nav còn 6 mục gồm Cài đặt (`AppNav.tsx`) — hợp đồng chốt 5 khu vực chính
- [ ] Chưa có lối vào tài khoản/avatar; Cài đặt vẫn là một mục nav
- [ ] Vỏ đổi ở 640px bằng `useMediaQuery` JS — hợp đồng chốt mốc `lg` (1024px) và ưu tiên CSS
- [ ] Chưa có sidebar trái ở ≥ 1024px; dock đáy hiện ở mọi bề rộng
- [ ] Từ 640px nav còn biến thể chỉ-icon + tooltip — hợp đồng yêu cầu nhãn luôn hiện dưới `lg`
- [ ] Badge đến hạn còn `motion-safe:animate-pulse` — hợp đồng cấm nhấp nháy thường trực
- [ ] Khoảng chừa đáy còn rải ở từng trang (`pb-36 sm:pb-44` ở shell, `pb-32 sm:pb-16`,
      `pb-28` ở trang) — hợp đồng yêu cầu đặt một lần ở shell và bằng 0 từ `lg`

**Lệch so với hợp đồng UX Bảng tin 22/09/2026** (§3.2) — chưa sửa, không sửa trong task tài
liệu. Bằng chứng ở `web/src/app/page.tsx` trừ khi ghi khác:

- [ ] Còn bốn ô số liệu (chuỗi học tập · thời gian hôm nay · tỷ lệ nhớ 7 ngày · từ vựng N5) —
      hợp đồng bỏ hết khỏi Bảng tin
- [ ] Hai thẻ lớn ngang hàng ("bài đang học dở" và "hàng đợi ôn tập") — hợp đồng chỉ cho **một**
      hành động chính, và bắt hợp nhất hai vai trò khi `dueCount = 0`
- [ ] "Bài đang học" suy từ `recentSessions[0].selectedLessons[0]` — sai theo §3.2; phải nhất
      quán với cách `LessonGrid.tsx` xác định bài hiện hành
- [ ] Mẫu số viết cứng: `estimatedLessonTotal = 35`, `/ 650 từ`, `/ 30 phút`, `4 mẫu câu` —
      `% tiến trình bài` đang tính trên mẫu số ước lượng
- [ ] Tên người dùng viết cứng trong lời chào — chưa có danh tính người dùng nào trong app
- [ ] Chấm `animate-pulse` trang trí cạnh lời chào — §6 cấm chuyển động lặp thường trực
- [ ] Hiện phân loại mục đến hạn theo từ vựng/ngữ pháp — thuộc `/on-tap`
- [ ] Hiện ba dòng điểm yếu kèm ba nút "Luyện lại" — hợp đồng chỉ cho số lượng + một lối vào
- [ ] Vẫn render `DailyKanji` — không còn thuộc hợp đồng Bảng tin
- [ ] Không có lối vào tài khoản/avatar ở header — hợp đồng coi đây là P0
- [ ] Không có skeleton; `useLiveQuery` trả `undefined` bị coi như `dueCount = 0`, nên lần vẽ
      đầu hiện trạng thái "đã hoàn tất hôm nay" rồi mới nhảy sang số thật
- [ ] Khuôn bề rộng là `max-w-6xl`, hợp đồng là `content-wide` = `max-w-5xl`
- [ ] Trang không chừa đáy (`main` không có `pb`), nên thanh nav nổi che khối cuối ở mobile
- [ ] Màu bảng Tailwind quay lại trong `page.tsx` (`amber-500`, `emerald-500/600`,
      `blue-500/600`) và trong `AppNav.tsx` — **hồi quy** so với mục đã nghiệm thu 17/09 bên dưới
- [ ] Thanh tiến độ tự chế viết tại chỗ (hai chỗ trong `page.tsx`) thay vì dùng
      `ui/progress.tsx` / `LessonProgress.tsx`

**Đã kiểm bằng code + `pnpm check` / `pnpm test` / `pnpm build` (17/09/2026):**

- [x] ✱ Mỗi mục dock có nhãn chữ thật ở mobile (`<span className="sm:hidden">`), ô `w-14 h-14`
      = 56×56px đúng §3.1 *(bản 6 mục)*
- [x] ✱ Từ 640px tooltip chỉ render khi `isDesktop` — **không** có phần tử `role="tooltip"` nào
      trong DOM ở mobile
- [x] ✱ Trang chừa `pb-32 sm:pb-40` trong `layout.tsx`
- [x] ✱ Nút tìm kiếm đã gỡ khỏi dock, không còn link nào trỏ `/tim-kiem`
- [x] ✱ Không còn màu bảng Tailwind trong `page.tsx` và `SyncBadge.tsx` (dùng `chart-1..3`,
      `warning`, `success`) — **đúng ở 17/09, đã hồi quy**: xem danh sách lệch bên trên
- [x] ✱ Badge đến hạn dùng `motion-safe:animate-pulse`
- [x] Badge "Ôn tập" đếm `dueAt <= now`, bằng 0 thì ẩn hẳn
- [x] `AppNav` và dashboard cùng lấy mốc thời gian từ `useDueClock` — `visibilitychange`,
      `focus`, và `setTimeout` hẹn tới `dueAt` gần nhất
- [x] `store.ts` không còn `furiganaVisible` / `studyMode`; cài đặt đọc qua `settings.ts`
- [x] ✱ Ba ô số liệu gọi `stats.ts`, không còn phép tính nào viết tại chỗ trong `page.tsx`
      *(hợp đồng 22/09 bỏ hẳn các ô số liệu khỏi Bảng tin — mục này không còn là tiêu chí)*
- [x] Không còn listener `Ctrl+K` nào — phím trả về hành vi mặc định của trình duyệt
- [x] Streak tính từ `practiceSessions`, không phải hằng số
- [x] Phiên lúc 23:30 giờ địa phương tính vào hôm nay (`stats.test.ts`)
- [x] `% đúng 7 ngày` tính trên mọi phiên trong cửa sổ 90 ngày, không giới hạn số phiên
- [x] ✱ Dashboard tài khoản trắng hiện `—` và "Chưa có chuỗi", không hiện `0%` *(nguyên tắc
      còn hiệu lực, nhưng các ô số liệu mang nó đã bị bỏ — xem §3.2)*
- [x] `page.tsx` cũ đã bị thay hẳn, không còn thẻ "Sẵn sàng…" nào
- [x] Đúng một nút `default` hiển thị trên Bảng tin — nguyên tắc này §3.2 giữ nguyên và siết
      thêm: chỉ một **hành động chính**, không phải hai thẻ lớn tranh nhau

**Tiêu chí nghiệm thu Bảng tin cho phase triển khai sau** (hợp đồng §3.2 — chưa mục nào đạt):

- [ ] Hành động chính được chọn đúng theo ba nhánh ở §3.2, và trên màn chỉ có **một** hành động
      mang trọng số chính
- [ ] Khi `dueCount = 0`, "Việc nên làm tiếp theo" và "Bài đang học" là **một khối**, không phải
      hai thẻ lặp nội dung
- [ ] Lúc dữ liệu chưa về: hiện skeleton, **không** chớp qua trạng thái "không có gì đến hạn"
- [ ] Người dùng mới không bị gọi là "đang học dở", không thấy `0%` hay `0/650`
- [ ] Không có tên người dùng viết cứng ở bất kỳ đâu
- [ ] Không còn mẫu số ước lượng: tiến độ bài tính trên số từ thật của bài đó
- [ ] Không còn bốn ô số liệu KPI
- [ ] Không còn phân loại mục đến hạn theo loại trên Bảng tin
- [ ] Không còn ba dòng điểm yếu kèm nút riêng; chỉ còn số lượng + một lối vào
- [ ] Không còn `DailyKanji` trên Bảng tin
- [ ] "Bài đang học" cho cùng kết quả với khu vực Học trên cùng một bộ dữ liệu
- [ ] Có lối vào tài khoản/avatar, và ở `< lg` nó mở được tới Cài đặt
- [ ] Ở 390px không phần tử nào bị thanh nav nổi che, kể cả khối cuối trang
- [ ] Khuôn bề rộng là `content-wide`, đo trong vùng nội dung khi có sidebar
- [ ] Không có chuyển động lặp thường trực nào trên màn

**Chưa kiểm được bằng code — cần mở trình duyệt thật:**

- [ ] Ở 390px: nav 5 mục không tràn, nhãn không bị cắt chữ, không cuộn ngang
- [ ] Ở 768px (máy tính bảng): vẫn là nav đáy, nhãn vẫn hiện, **không** có tooltip nào
- [ ] Ở 1280px: sidebar trái, không còn nav đáy, nội dung không bị chừa thừa ở đáy
- [ ] Lối vào tài khoản mở được Cài đặt · trạng thái đồng bộ · chủ đề, ở cả hai vỏ
- [ ] Bật "ẩn furigana", tải lại trang → furigana **không** nhấp nháy lần nào (thử với CPU
      throttle 4×)
- [ ] Để tab mở qua một mốc `dueAt` (chỉnh `dueAt` về 1 phút sau trong DevTools) → badge tự
      tăng, **không** cần tải lại trang
- [ ] Chuyển tab rồi quay lại sau nửa đêm → badge và khối hành động chính tính theo ngày mới
- [ ] Badge đến hạn không có chuyển động lặp ở bất kỳ chế độ nào, số vẫn hiện
- [ ] Đủ sáu trạng thái cho mọi phần tử bấm được, focus ring còn nguyên
- [ ] Xem ở 390px và 1280px, cả chế độ sáng lẫn tối

> Bốn mục đầu cần dữ liệu thật trong IndexedDB (một phiên luyện tập đã ghi `reviewItems`).
> Hiện `db` còn trống nên chưa dựng được ca kiểm; làm sau khi SPEC-04 chạy được một phiên.

## 10. Khối lệnh bàn giao thiết kế

Dán nguyên khối dưới đây kèm `DESIGN.md` (ở gốc repo) vào Stitch / Claude Design.

> **Hai thứ đã được quyết định trước khi khối này chạy.** Vỏ điều hướng (§3.1 và `DESIGN.md`
> §Navigation) và kiến trúc thông tin của Bảng tin (§3.2). Công cụ thị giác **không** chọn lại
> số khu vực, vị trí Cài đặt, mốc chuyển vỏ, hay các nhóm thông tin của Bảng tin. Nó khám phá
> **bố cục, mật độ và thứ bậc thị giác** — phần được phép quyết định liệt kê ở khối D, phần đã
> khóa liệt kê ở khối E.

---

*Bối cảnh: ứng dụng web học tiếng Nhật N5 cho một người học, theo giáo trình Minna no Nihongo,
giao diện tiếng Việt. Ưu tiên điện thoại; viewport chính là **390px**, mở rộng lên desktop.*

Nạp `DESIGN.md` làm hợp đồng token và hướng thị giác. Ba ràng buộc bắt buộc:

1. Chỉ dùng token màu theo tên (`bg-primary`, `text-muted-foreground`), **tuyệt đối không
   hardcode mã hex**.
2. Mobile-first: dựng bố cục 390px trước, rồi mới mở rộng lên 1024px.
3. Mọi chữ tiếng Nhật phải bọc trong phần tử có class `jp`.

Dựng các phần sau:

**A. Vỏ điều hướng — hai vỏ, một mốc chuyển ở 1024px.**

Năm khu vực, đúng thứ tự: **Bảng tin · Học bài · Luyện tập · Ôn tập · Thống kê**. Cài đặt
**không** nằm trong nav; nó thuộc lối vào tài khoản.

*Dưới 1024px — thanh điều hướng đáy.* Kiểu **nổi, bo tròn hết cỡ**, cách đáy màn hình 12px
cộng safe-area, căn giữa theo chiều ngang, nền mờ có `backdrop-blur`, viền mảnh — không phải
thanh đặc kín chiều rộng. Mỗi mục cao tối thiểu 48px, icon 24px phía trên và **nhãn chữ phía
dưới luôn hiện ở mọi bề rộng dưới 1024px**, kể cả trên máy tính bảng: không giấu nhãn vào
tooltip, vì thiết bị cảm ứng không có trạng thái hover.

*Từ 1024px — sidebar trái.* Năm khu vực xếp dọc; thanh nav đáy biến mất hoàn toàn; không có
thanh đầu trang. Khu vực tài khoản nằm cuối sidebar. Sidebar là bề mặt thường có viền 1px,
**không** blur. Nội dung nằm cạnh sidebar và không cần chừa trống ở đáy.

Mục đang mở: chữ và icon màu `primary` trên nền `primary/15` bo tròn. Mục không mở:
`muted-foreground`. Mục "Ôn tập" mang một badge số đếm nhỏ màu `destructive` ở góc trên phải
icon khi lớn hơn 0, quá 99 thì hiện `99+`. **Badge không nhấp nháy, không có chuyển động lặp.**

*Phần cần khám phá ở đây:* bề rộng sidebar, có trạng thái thu gọn hay không, vị trí logo, và
bố cục khu vực tài khoản (avatar, tên, trạng thái đồng bộ, lối vào Cài đặt). Đưa 2–3 phương án.

**B. Màn Bảng tin (trang chủ `/`).** Bề rộng tối đa `max-w-5xl`, đo trong **vùng nội dung cạnh
sidebar** khi ở desktop, không đo theo viewport.

*Đây là màn gì.* Người học mở app ra và cần biết ngay nên làm gì tiếp theo. Bảng tin quyết định
hộ việc đó, đồng thời cho thấy họ đang học tới bài nào. Nó **không** phải trang phân tích,
**không** phải danh mục tính năng, **không** phải danh sách việc theo ngày.

*Kiến trúc thông tin — cố định, không đổi:*

```
Header          lời chào ngắn  +  lối vào tài khoản/avatar (bên phải)
Việc nên làm tiếp theo                          P0
Bài đang học                                    P0 hoặc P1 (xem dưới)
Cần củng cố     "n nội dung cần củng cố" + 1 lối vào     P1, ẩn khi n = 0
Nhịp học        tín hiệu chuỗi ngày rất nhẹ              P2
```

*Việc nên làm tiếp theo* là khối quan trọng nhất và mang **nút chính duy nhất** của trang (cỡ
`quiz`, cao 48px). Nội dung của nó do dữ liệu quyết định:

- có mục đến hạn → "Bắt đầu ôn", kèm số mục đến hạn;
- không có mục đến hạn nhưng có bài đang học → "Học tiếp bài 7";
- người dùng mới → "Bắt đầu bài 1".

**Luật quan trọng nhất của màn này:** khi hành động chính là "học tiếp bài đang học" thì *Việc
nên làm tiếp theo* và *Bài đang học* phải là **một khối duy nhất**. Tuyệt đối không vẽ một thẻ
lớn "việc nên làm" rồi ngay dưới một thẻ lớn thứ hai lặp lại cùng bài, cùng tiến độ, cùng nút.
Khi có mục đến hạn thì khối ôn tập là chính, còn *Bài đang học* lùi xuống thành một khối phụ
nhỏ hơn ở dưới — nó vẫn phải tới được bằng một cú chạm.

*Bài đang học* chỉ trả lời "tôi đang ở đâu": số bài, tên bài, tiến độ trong bài, lối vào học
tiếp. Không thêm số liệu phân tích nào.

*Cần củng cố* chỉ có **một con số và một lối vào** — ví dụ "3 nội dung cần củng cố → Xem và
luyện lại". Không liệt kê từng mục, không có nút riêng cho từng dòng. Bằng 0 thì khối biến mất
hoàn toàn, không để lại thẻ rỗng.

*Nhịp học* là tín hiệu nhẹ nhất trên màn (chuỗi ngày). Không phải ô số liệu, không phải thẻ KPI,
không có chuyển động, không gây áp lực. Nó có thể là một chip nhỏ, một dòng phụ, hoặc một dòng
tóm tắt ở chân trang — chỗ đặt nó là một trong những thứ cần bạn đề xuất.

**Ba trạng thái phải chứng minh được** (không bắt buộc mỗi trạng thái một màn riêng, nhưng bố
cục phải cho thấy nó xử lý được cả ba):

- **Trạng thái 1 — có mục đến hạn.** Ôn tập là hành động chính; bài đang học là khối phụ.
- **Trạng thái 2 — không có mục đến hạn.** Bài đang học *là* hành động chính, hai vai trò hợp
  nhất thành một khối.
- **Trạng thái 3 — người dùng mới.** Chưa có phiên nào, chưa có gì đến hạn, chưa có điểm yếu. Hành động
  chính là "Bắt đầu bài 1". Không gọi bài 1 là "đang học dở", không hiện `0%` hay `0/650`, không
  có lời nhắc nào về chuỗi ngày bằng 0. Màn này phải trông **bình thường**, không trông hỏng.

**Cấm trong màn Bảng tin:**

- Không có hàng ô số liệu / KPI dashboard (chuỗi ngày, phút học, % chính xác, tổng từ vựng).
  Các số đó thuộc màn Thống kê. Không thêm lại chúng để lấp khoảng trống.
- Không phân loại mục đến hạn theo từ vựng/ngữ pháp, không danh sách xem trước hàng đợi ôn —
  thuộc màn Ôn tập.
- Không bảng điểm yếu chi tiết — thuộc màn Ôn tập → Điểm yếu.
- Không widget "Kanji hôm nay".
- Không mục tiêu theo ngày, không "3 việc hôm nay", không "đã xong hôm nay", không "30 phút/ngày".
- Không lưới nút dẫn tới các khu vực — thanh điều hướng đã làm việc đó.
- Không tên người dùng, không số liệu bịa, không tính năng mới.
- Không tục ngữ/emoji trang trí như một phần bắt buộc, và không chấm nhấp nháy cạnh lời chào.

**Khoảng chừa đáy.** Dưới 1024px trang phải chừa đủ để thanh nav nổi không che phần tử cuối —
và không đặt hành động quan trọng nào nằm sau thanh nav. Từ 1024px **không** chừa đáy. Hãy đề
xuất con số cụ thể cho phần chừa mobile: giá trị hiện có trong máy đọc được của `DESIGN.md` chỉ
là bản tạm, con số thật chốt từ bản thị giác được duyệt.

**Thứ tự ở ~390px:** header → việc nên làm tiếp theo → bài đang học (nếu tách riêng) → cần củng
cố → nhịp học. Hành động chính phải thấy được rất sớm, không có hàng số liệu nào chen phía trên.
Từ `sm`/`md` được nới khoảng trắng và cho vài khối phụ thành hai cột, nhưng **không thêm nhóm
thông tin mới chỉ vì có thêm bề rộng**. Từ 1024px được chia cột chính / cột phụ trong vùng nội
dung — vẫn **không** bịa thêm section để lấp chỗ trống.

**C. Ba phương án thị giác — cùng một kiến trúc thông tin.**

Cả ba phương án dùng **chung** kiến trúc, cùng luật ưu tiên và cùng các điều cấm ở trên. Chỉ
khác nhau ở bố cục, mật độ, thứ bậc thị giác và cách trình bày. Không phương án nào được thêm,
bớt hay đổi chỗ nhóm thông tin.

1. **Calm Learning** — tĩnh, tập trung, nhiều khoảng trắng, hành động chính rất mạnh, mọi thứ
   khác lùi hẳn về sau.
2. **Structured Study** — phân khu rõ ràng hơn, mật độ nhỉnh hơn, ngữ cảnh bài đang học đậm hơn.
3. **Japanese Editorial** — tiết chế, dẫn dắt bằng typography, mang chất tài liệu học tiếng Nhật
   một cách kín đáo.

Cả ba đều lấy màu, kiểu chữ, bo góc, bề mặt và chuyển động từ `DESIGN.md` — không tự đặt hướng
thị giác riêng, không thêm bóng đổ, gradient hay màu ngoài bộ token.

**D. Phần bạn được quyết định.** Bố cục khối "Việc nên làm tiếp theo"; cách hợp nhất nó với "Bài
đang học" khi không có mục đến hạn; cách "Bài đang học" lùi xuống khi có mục đến hạn; cách trình
bày "Cần củng cố"; chỗ đặt "Nhịp học"; nhịp khoảng trắng và thứ bậc; bố cục desktop; cùng các
câu hỏi về sidebar ở khối A.

**E. Phần đã chốt, không đề xuất lại.** Số khu vực điều hướng (5) · vị trí Cài đặt (thứ cấp, sau
lối vào tài khoản) · nav đáy dưới 1024px và sidebar từ 1024px · mốc chuyển vỏ · việc bỏ ô số
liệu KPI khỏi Bảng tin · việc bỏ widget kanji · việc bỏ phân loại mục đến hạn và bảng điểm yếu
khỏi Bảng tin · việc không có mục tiêu theo ngày.

---

**Áp cho cả hai phần.**

Huy hiệu trạng thái dữ liệu có ba biến thể — `sync-badge-synced`, `sync-badge-pending`,
`sync-badge-offline` — mỗi biến thể **phải có cả icon lẫn nhãn chữ**, màu không bao giờ đứng
một mình. Huy hiệu nằm trong lối vào tài khoản, không nằm trong nav chính.

Mọi phần tử bấm được cần đủ sáu trạng thái: Mặc định, Hover (chỉ khi `(hover: hover)`), Focus
(ring 3px, không bao giờ tắt), Active (dịch xuống 1px), Disabled (`opacity-50`), Loading
(spinner thay icon, giữ nguyên bề rộng).

Hoạt ảnh bọc trong `@media (prefers-reduced-motion: no-preference)`, 150ms `ease-out` cho đổi
màu. Không có chuyển động lặp vô hạn ở bất kỳ đâu.

Cần cả chế độ sáng và tối.

---

> **Không** dùng file Stitch export để ghi đè `web/src/app/globals.css`. Bản export đổi màu
> về hex, bỏ toàn bộ chế độ tối, và mất lớp `@theme inline` — chính là thứ cho phép class
> `.dark` ghi đè token lúc chạy (`DESIGN.md` §What this file is).
