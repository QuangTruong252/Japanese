# SPEC-07 — Thống kê & biểu đồ

> **Mã:** SPEC-JPN-F07 · **Trạng thái:** Completed · **Ngày:** 22/09/2026
> **Đối tượng đọc:** Google Stitch / Claude Design (mục 3–6), lập trình viên (toàn bộ).
> **Phụ thuộc:** SPEC-04 (ghi `practiceSessions`), SPEC-05 (bảng điểm yếu — **dùng lại, không
> vẽ lại**), SPEC-02 (ô số liệu dashboard — spec này **thay** phần tính toán của nó).

## 1. Mục tiêu & phạm vi

`practiceSessions` đã được ghi từ SPEC-04 mà chưa ai đọc. Spec này dựng bên đọc, và gom mọi
phép tính số liệu về **một** module dùng chung cho cả dashboard lẫn trang Thống kê.

**Trong phạm vi**

- `/thong-ke` — trang thống kê, khuôn bề rộng `content-wide` (`DESIGN.md` §Layout and containers)
- `src/lib/stats.ts` — toàn bộ phép tính, hàm thuần, có test
- Bốn ô số liệu: streak · phút học hôm nay · % đúng 7 ngày · số mục đang theo dõi
- Ba biểu đồ + một lịch nhiệt, theo luật `DESIGN.md` §Charts
- Nối lại ô số liệu của dashboard (SPEC-02 §3.2) vào `stats.ts`

**Ngoài phạm vi**

- Bảng "Điểm yếu của tôi" — **đã có ở SPEC-05 tại `/on-tap/diem-yeu`**. Trang này chỉ đặt một
  link tới đó. Bản đầu của spec đặt bảng ở cuối trang Thống kê; một bảng ở hai nơi
  là hai chỗ để sai khác nhau
- Dự báo số mục đến hạn những ngày tới — thêm khi thật sự cần, không dựng trước
- Mục tiêu học theo tuần/tháng, huy hiệu thành tích, gamification — trái nguyên tắc 3 của
  `PRODUCT.md`
- Xuất biểu đồ ra ảnh
- Đồng bộ `streak_count` lên `profiles` — F08 đẩy nguyên `AppSettings`, streak luôn tính lại
  từ dữ liệu cục bộ

## 2. Dữ liệu

| Nguồn | Chiều | Dùng cho |
|---|---|---|
| `db.practiceSessions` | Đọc `useLiveQuery` | Streak, phút học, % đúng, lịch nhiệt |
| `db.reviewItems` | Đọc `useLiveQuery` | Số mục đang theo dõi, phân bố theo loại |
| `src/lib/stats.ts` | Gọi | Mọi phép tính. Component **không** tự tính |

**Không thêm bảng, không thêm cột, không thêm bản ghi tổng hợp.** Vài nghìn bản ghi
`practiceSessions` tính lại mỗi lần mở trang trong vài mili-giây. Bảng tổng hợp là thứ phải
migration mỗi lần đổi cách tính, và sẽ lệch với sự thật đúng lúc người dùng nhìn vào.

### 2.1. Ranh giới ngày

Mọi phép tính theo ngày dùng **nửa đêm giờ địa phương của máy**, không phải UTC. Người học ở
UTC+7 làm bài lúc 23:30 phải thấy nó thuộc về hôm nay, không phải hôm qua.

**Một phiên thuộc về ngày của `createdAt`** — thời điểm phiên được **ghi xong**, không phải lúc
bắt đầu. `PracticeSession` chỉ có `createdAt` và `durationSeconds`; suy ngược ra giờ bắt đầu
rồi chia phiên cho hai ngày là thêm một phép tính để sai. Phiên bắt đầu 23:50 và kết thúc 00:05
tính trọn vào ngày mới — lệch tối đa một phiên, mỗi ngày, và không ảnh hưởng streak.

Hàm dùng chung: `startOfLocalDay(date)` trong `stats.ts`. SPEC-05 §2.1 gọi lại chính hàm này để
đếm mục mới trong ngày.

### 2.2. `stats.ts` — các hàm thuần

```ts
function currentStreak(sessions: PracticeSession[], now: Date): number;
function minutesOnDay(sessions: PracticeSession[], day: Date): number;
function accuracyOverDays(sessions: PracticeSession[], days: number, now: Date): number | null;
function dailyMinutes(sessions: PracticeSession[], days: number, now: Date): DayValue[];
function dailyAccuracy(sessions: PracticeSession[], days: number, now: Date): DayValue[];
function targetsByType(items: ReviewItem[]): Record<TargetType, number>;
```

Nhận mảng, trả số — **không đọc Dexie, không đọc `Date.now()` bên trong**. `now` luôn là tham
số, nếu không thì không test được.

**Định nghĩa streak** (chốt ở đây, đừng để mỗi màn hình hiểu một kiểu):

- Streak là số ngày **liên tiếp** tính lùi từ hôm nay, mỗi ngày có ít nhất một phiên.
- Hôm nay **chưa học** thì streak vẫn tính từ hôm qua trở về trước — chuỗi chưa đứt cho tới
  khi hết ngày. Reset streak lúc 00:01 vì người dùng chưa kịp học là hành vi trừng phạt vô lý.
- Không có "ngày bù", không có "đóng băng streak". Một khái niệm, một luật.

**`accuracyOverDays` tính theo tổng câu, không phải trung bình cộng các phiên:**

```ts
sum(correctCount) / sum(totalQuestions)   // ĐÚNG
avg(session.accuracyRate)                 // SAI
```

Trung bình cộng cho một phiên 2 câu cùng trọng số với một phiên 30 câu. Người học làm một phiên
2 câu sai hết sẽ thấy tỷ lệ tuần tụt thẳng đứng — con số nói sai về tuần đó.

`accuracyOverDays` trả `null` khi không có phiên nào trong cửa sổ — để giao diện hiện `—` chứ
không hiện `0%`. Không có dữ liệu khác với làm sai hết.

**Streak trên máy mới bị cắt bởi dữ liệu có sẵn.** SPEC-08 §2.3 chỉ kéo về 90 ngày
`practice_sessions`, nên một chuỗi 150 ngày sẽ hiện thành 90 trên thiết bị vừa đăng nhập. Xử
lý trung thực, không đoán thêm:

- `currentStreak` trả về `{ days, truncated }`; `truncated = true` khi ngày cũ nhất trong dữ
  liệu cũng có phiên (tức chuỗi có thể còn dài hơn).
- Giao diện hiện `90+ ngày` thay vì `90 ngày` khi `truncated`.
- **Không** tin vào `profiles.streak_count` của server để bù: đó là con số thứ hai cho cùng một
  khái niệm, và nó sẽ lệch.

### 2.3. Dashboard dùng chung module này

SPEC-02 §3.2 có ba ô số liệu (streak, phút học hôm nay, % đúng 7 ngày). Chuyển chúng sang gọi
`stats.ts`, xóa mọi phép tính viết tại chỗ. Hai nơi cùng hiện một con số mà tính bằng hai đoạn
code là lỗi chờ xảy ra.

## 3. Màn hình & bố cục

### 3.1. `/thong-ke`

Bề rộng `max-w-5xl` — khuôn `content-wide` (`DESIGN.md` §Layout and containers).

```
[H1 "Thống kê"]

[Hàng 4 ô số liệu]
  Chuỗi ngày: 12    Hôm nay: 18 phút    Đúng 7 ngày: 84%    Đang theo dõi: 1.204 mục

[Lịch nhiệt — 12 tuần gần nhất]        ← một sắc chart-1, 5 mức đậm nhạt

[Biểu đồ cột: Phút học 14 ngày gần nhất]

[Biểu đồ đường: Tỷ lệ đúng 30 ngày gần nhất]

[Thanh ngang: Phân bố mục đang theo dõi theo loại]
  vocab · grammar · kanji · particle · listening — mỗi loại một màu cố định + số ngay cạnh

[Link: "Điểm yếu của tôi →"  → /on-tap/diem-yeu]
```

Mobile xếp dọc `gap-4`; từ `md` hàng ô số liệu thành 4 cột (390px chia 2 cột × 2 hàng).

Lịch nhiệt ở mobile: **cuộn ngang trong khung riêng**, ô vuông giữ nguyên kích thước. Bóp nhỏ
ô cho vừa 390px sẽ cho ra những ô 6px không bấm nổi và không đọc nổi.

### 3.2. Không dùng thư viện biểu đồ

Ba biểu đồ ở đây là: một chuỗi cột, một chuỗi đường, một dãy thanh ngang. Dựng bằng `<svg>`
(`<rect>`, `<polyline>`) và CSS Grid cho lịch nhiệt — tổng cộng chừng vài chục dòng, dùng
thẳng token màu `chart-1…5`.

> `ponytail: vẽ tay bằng SVG cho 3 biểu đồ tĩnh; thêm shadcn chart (recharts) khi cần
> tooltip/zoom/brush hoặc biểu đồ thứ tư có tương tác thật`

## 4. Component dùng lại

| Vai trò | Token component |
|---|---|
| Ô số liệu, khung biểu đồ | `card` |
| Nhãn loại mục tiêu | `badge`, màu theo ánh xạ cố định (`DESIGN.md` §Charts) |
| Link sang bảng điểm yếu | `button-ghost` |
| Đang tải | `skeleton` đúng kích thước biểu đồ thật |

Ánh xạ màu **cố định, không xoay vòng** (`DESIGN.md` §Charts): `vocab → chart-1`,
`grammar → chart-2`, `kanji → chart-3`, `particle → chart-4`, `listening → chart-5`. Đổi bộ
lọc, đổi thứ hạng đều **không** được đổi màu của các mục còn lại.

Luật biểu đồ phải tuân thủ, nhắc lại ba điều dễ vi phạm nhất:

- **Một trục y duy nhất.** Phút học và tỷ lệ đúng khác thang đo → hai biểu đồ riêng, không
  chồng lên nhau.
- **Nhãn số trực tiếp là bắt buộc** — `chart-3/4/5` có tương phản dưới 3:1 trên nền card
  trắng, nên mỗi thanh ngang phải có con số hiện rõ bên cạnh.
- **Chữ mang màu chữ**, không mang màu chuỗi. Chỉ ô màu nhỏ cạnh nhãn mới mang màu chuỗi.

Lịch nhiệt dùng **một sắc `chart-1`** chuyển từ nhạt sang đậm (`DESIGN.md` §Charts, luật 6). Không cầu vồng, không
dùng `success`/`destructive` làm màu chuỗi.

## 5. Trạng thái

| Tình huống | Hiển thị |
|---|---|
| Chưa có phiên nào | Cả trang thành một trạng thái rỗng: "Chưa có dữ liệu thống kê — làm một phiên luyện tập là có ngay" + nút về `/luyen-tap`. **Không** vẽ biểu đồ trống hay `0%` |
| Có dữ liệu nhưng cửa sổ rỗng (nghỉ hơn 30 ngày) | Vẽ biểu đồ với vùng trống rõ ràng + dòng "Không có buổi học nào trong 30 ngày qua" |
| Số liệu chưa tính được | `—`, không bao giờ `0%` |
| Streak = 0 | "Chưa có chuỗi ngày nào" — viết trung tính, không trách móc |
| Hôm nay chưa học, streak > 0 | Vẫn hiện streak, thêm dòng nhỏ "Học hôm nay để giữ chuỗi" |
| Đang tải Dexie | `skeleton` đúng kích thước, bố cục không nhảy |
| Một ngày có phiên nhưng 0 phút (phiên quá ngắn) | Ô lịch nhiệt vẫn tô mức nhạt nhất — có học là có tô |

Mọi phần tử bấm được đủ sáu trạng thái theo `DESIGN.md` §Interaction states.

## 6. Tương tác & chuyển động

- Trang này để **đọc**, không phải để nghịch. Không zoom, không kéo chọn khoảng, không lọc
  theo ngày. Cửa sổ thời gian cố định: 12 tuần · 14 ngày · 30 ngày.
- Chạm/hover một ô lịch nhiệt: `tooltip` ghi "12/09 · 18 phút · 2 phiên". Trên mobile là chạm,
  nên ô phải đủ lớn (≥ 16px cạnh, cách nhau 4px).
- Biểu đồ **không** animate khi vẽ lần đầu. Số liệu nhảy từ 0 lên là hiệu ứng đẹp một lần và
  gây hiểu nhầm mọi lần sau.
- Đổi màu khi hover: 150ms `ease-out`, bọc trong `@media (prefers-reduced-motion:
  no-preference)`.

## 7. Accessibility

- Mỗi biểu đồ `<svg>` có `role="img"` và `aria-label` tóm tắt thành câu: "Phút học 14 ngày gần
  nhất, cao nhất 42 phút ngày 12/09, trung bình 18 phút".
- Dưới mỗi biểu đồ có **bảng số thật** (`<table>`) — có thể thu gọn trong `<details>`. Đây vừa
  là lối đi cho screen reader, vừa là nhãn trực tiếp mà `DESIGN.md` §Charts luật 5 yêu cầu.
- Lịch nhiệt: mỗi ô có `aria-label` ngày và số phút. Không phải là bản đồ màu vô danh.
- Con số lớn trong ô số liệu đi kèm nhãn chữ đọc được, không đọc trần số.
- Mức đậm nhạt của lịch nhiệt **không** là thông tin duy nhất — tooltip và bảng số mang đủ
  thông tin cho người không phân biệt được sắc độ.
- Focus ring 3px giữ nguyên; vùng chạm ≥ 48×48px cho link và nút (ô lịch nhiệt là ngoại lệ có
  chủ đích: nó không phải phần tử điều hướng, và có bảng số thay thế).

## 8. Bảo mật & dữ liệu

Toàn bộ số liệu tính trên máy từ IndexedDB. Không gọi mạng, không telemetry, không analytics
bên thứ ba — kể cả cho chính trang thống kê.

Trang này **chỉ đọc**. Không ghi vào Dexie, không sửa `reviewItems`, không đụng lịch ôn.

Số liệu là dữ liệu cá nhân nhạy cảm ở mức riêng tư (biết được người dùng học lúc mấy giờ, nghỉ
những ngày nào). Không gửi đi đâu, không log ra console ở bản build production.

## 9. Tiêu chí nghiệm thu

- [ ] Tài khoản trắng → trang hiện trạng thái rỗng có lối đi tiếp, **không** có `0%` hay biểu
      đồ trống
- [ ] Làm một phiên → cả bốn ô số liệu và lịch nhiệt cập nhật **không cần tải lại trang**
      (`useLiveQuery`)
- [ ] Số ở dashboard và số ở `/thong-ke` **luôn khớp** — cùng gọi `stats.ts`
- [ ] Học lúc 23:30 giờ địa phương → tính vào **hôm nay**, không phải hôm qua
- [ ] Học 3 ngày liên tiếp rồi nghỉ 1 ngày → streak về 1 sau khi học lại, không cộng dồn
- [ ] Một phiên 2 câu đúng 1 và một phiên 30 câu đúng 30 → tỷ lệ tuần là **31/32**, không phải
      trung bình cộng 75%
- [ ] Máy mới chỉ có 90 ngày lịch sử mà ngày cũ nhất vẫn có phiên → hiện `90+ ngày`
- [ ] Hôm nay chưa học, hôm qua có học → streak **vẫn hiện**, không bị reset về 0
- [ ] Nghỉ 30 ngày → biểu đồ đường vẽ vùng trống có chú thích, không crash, không vẽ đường nối
      thẳng qua khoảng trống như thể có dữ liệu
- [ ] Nhãn loại mục tiêu giữ nguyên màu khi số liệu đổi thứ hạng
- [ ] Mỗi biểu đồ có bảng số đi kèm, đọc được bằng screen reader
- [ ] Ở 390px lịch nhiệt cuộn ngang, ô **không** bị bóp nhỏ
- [ ] Chạy được khi **tắt mạng hoàn toàn**
- [ ] `pnpm check` exit 0, `pnpm test` xanh — test bắt buộc cho `stats.ts`: streak qua ranh
      giới ngày, mảng rỗng trả `null` chứ không phải `0`, phiên lúc 23:59 và 00:01

## 10. Khối lệnh bàn giao thiết kế

Dán nguyên khối dưới đây kèm `web/DESIGN.md` vào Stitch / Claude Design.

---

Nạp `DESIGN.md` làm hợp đồng token. Ba ràng buộc bắt buộc:

1. Chỉ dùng token màu theo tên (`bg-primary`, `text-muted-foreground`), **tuyệt đối không
   hardcode mã hex**.
2. Mobile-first: dựng bố cục 390px trước, rồi mới mở rộng lên 1024px.
3. Mọi chữ tiếng Nhật phải bọc trong phần tử có class `jp`.

Dựng trang Thống kê của một app học tiếng Nhật, bề rộng tối đa `max-w-5xl`, theo thứ tự khối:

**1. Hàng bốn ô số liệu** — Chuỗi ngày (12), Hôm nay (18 phút), Đúng 7 ngày (84%), Đang theo
dõi (1.204 mục). Mỗi ô: con số lớn ở trên, nhãn chữ nhỏ ở dưới. Ở 390px xếp 2 cột × 2 hàng, từ
768px thành 4 cột.

**2. Lịch nhiệt 12 tuần** — lưới ô vuông theo tuần, mỗi ô cạnh tối thiểu 16px cách nhau 4px,
tô bằng **một sắc xanh `chart-1` với 5 mức đậm nhạt** (không cầu vồng, không dùng màu đỏ/xanh
lá trạng thái). Có chú giải "Ít → Nhiều" ở góc phải dưới. Ở màn hình hẹp, lịch nhiệt cuộn
ngang trong khung riêng — **không bóp nhỏ ô**.

**3. Biểu đồ cột "Phút học 14 ngày gần nhất"** — một chuỗi duy nhất nên không cần chú giải,
một trục y duy nhất, đường lưới 1px màu `border`, có nhãn số trên cột cao nhất.

**4. Biểu đồ đường "Tỷ lệ đúng 30 ngày gần nhất"** — đường 2px, điểm đánh dấu ≥ 8px, trục y từ
0 đến 100%. Những ngày không có buổi học phải thể hiện là **khoảng trống**, không nối thẳng
qua như thể có dữ liệu.

**5. Dãy thanh ngang "Phân bố mục đang theo dõi theo loại"** — năm loại: từ vựng, ngữ pháp,
kanji, trợ từ, nghe. Màu cố định theo loại: `chart-1`, `chart-2`, `chart-3`, `chart-4`,
`chart-5` — **màu gắn với loại, không gắn với thứ hạng**. Mỗi thanh có **con số hiện rõ ngay
bên cạnh** (bắt buộc: ba màu cuối có tương phản dưới 3:1 trên nền card trắng). Chữ và số dùng
màu chữ thường, chỉ ô màu nhỏ cạnh nhãn mới mang màu chuỗi.

**6. Một link "Điểm yếu của tôi →"** ở cuối trang.

Thiết kế thêm **trạng thái rỗng của cả trang**: khi chưa có buổi học nào, thay toàn bộ biểu đồ
bằng một khối duy nhất — dòng chữ "Chưa có dữ liệu thống kê — làm một phiên luyện tập là có
ngay" và một nút dẫn tới phần luyện tập. Không vẽ biểu đồ rỗng, không hiện `0%`.

Mỗi biểu đồ kèm một bảng số có thể thu gọn bên dưới. Biểu đồ **không** có hoạt ảnh vẽ dần.

Mọi phần tử bấm được cần đủ sáu trạng thái: Mặc định, Hover (chỉ khi `(hover: hover)`), Focus
(ring 3px, không bao giờ tắt), Active (dịch xuống 1px), Disabled (`opacity-50`), Loading.
Vùng chạm tối thiểu 48×48px cho link và nút.

Trang chừa `pb-24` cho thanh nav đáy. Hoạt ảnh bọc trong `@media (prefers-reduced-motion:
no-preference)`, 150ms `ease-out`.

Cần cả chế độ sáng và tối.

---

> **Không** dùng file Stitch export để ghi đè `web/src/app/globals.css`. Bản export đổi màu
> về hex, bỏ toàn bộ chế độ tối, và mất lớp `@theme inline` — chính là thứ cho phép class
> `.dark` ghi đè token lúc chạy (`DESIGN.md` §What this file is).
