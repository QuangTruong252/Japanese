# SPEC-05 — Ôn tập hôm nay, kết quả & điểm yếu

> **Mã:** SPEC-JPN-F05 · **Trạng thái:** Draft · **Ngày:** 16/09/2026
> **Đối tượng đọc:** Google Stitch / Claude Design (mục 3–6), lập trình viên (toàn bộ).
> **Phụ thuộc:** SPEC-01 (câu hỏi), SPEC-02 (khung nav), SPEC-04 (wrapper phiên — dùng lại nguyên).

## 1. Mục tiêu & phạm vi

Đây là phase biến app từ bộ sưu tập màn hình thành công cụ học: lịch ôn FSRS được nối vào
thật, và mỗi ngày người học có một danh sách cụ thể để làm.

**Trong phạm vi**

- `/on-tap` — hàng đợi mục đến hạn hôm nay
- Chế độ `mode: 'due'` của `filterExercises` — lối vào phiên ôn
- Nạp mục tiêu mới, chặn bởi `dailyNewLimit`
- `/on-tap/diem-yeu` — "Điểm yếu của tôi"
- Ghi kết quả phiên ôn (dùng lại nguyên transaction của SPEC-04)

**Ngoài phạm vi**

- Wrapper phiên và 5 dạng bài — **dùng lại SPEC-04 không sửa**. Phiên ôn khác phiên luyện
  đúng một chỗ: `PracticeConfig.mode = 'due'`
- Biểu đồ, heatmap streak — thuộc F07, đợt spec 2
- Đẩy `pendingSync` lên Supabase — F08 hoãn
- Chỉnh `dailyNewLimit` — màn Cài đặt thuộc F06. Spec này đọc giá trị, mặc định 20

## 2. Dữ liệu

| Nguồn | Chiều | Dùng cho |
|---|---|---|
| `db.reviewItems` | Đọc `useLiveQuery`, ghi cuối phiên | Hàng đợi đến hạn, bảng điểm yếu |
| `src/lib/questions.ts` | Đọc | Lấy câu hỏi cho các `targetId` đến hạn |
| `src/lib/filter.ts` | Gọi với `mode: 'due'` | Lọc theo `dueTargetIds` |
| `src/lib/fsrs.ts` | Gọi | `rateAnswer` + `applyReview`. **Đã có, không viết lại** |
| `db.practiceSessions`, `db.pendingSync` | Ghi | Như SPEC-04 |

**Truy vấn đến hạn** — index `dueAt` đã có sẵn trong schema Dexie:

```ts
useLiveQuery(
  () => db.reviewItems.where('dueAt').belowOrEqual(new Date()).sortBy('dueAt'),
  []
)
```

Sắp xếp `dueAt` tăng dần: **mục quá hạn lâu nhất được ôn trước**.

**Truy vấn điểm yếu** — index tổ hợp `[targetType+incorrectCount]` đã có sẵn, dùng nó thay
vì lọc trong JS.

### 2.1. Nạp mục tiêu mới

Ngoài các mục đã đến hạn, bổ sung mục tiêu **chưa có bản ghi `reviewItems`** từ các bài đã học,
**giới hạn bởi `settings.dailyNewLimit` (mặc định 20)**.

> **Vì sao phải có giới hạn này.** Không có nó, người học mở ba bài mới trong một buổi sẽ bị
> dồn hàng trăm mục đến hạn vào hai ngày sau, thấy con số đó, và bỏ cuộc. Đây là ràng buộc
> giữ chân người dùng, không phải tối ưu kỹ thuật — đừng bỏ đi vì thấy "code thừa".

**Không giới hạn số lượt ôn lại trong ngày.** Lượng mục đến hạn tự nó đã bị chặn từ đầu vào
bởi `dailyNewLimit`; chặn thêm lần nữa ở đầu ra chỉ làm lịch ôn sai.

Đếm mục mới đã nạp trong ngày: đếm `reviewItems` có `fsrsCard.reps === 0` hoặc dựa vào ngày
tạo bản ghi. Chốt cách đếm khi cài đặt, miễn là ổn định qua các lần tải lại trang.

## 3. Màn hình & bố cục

### 3.1. `/on-tap` — Ôn tập hôm nay

Bề rộng `max-w-2xl` (672px).

```
[H1 "Ôn tập hôm nay"]
[Thẻ lớn: "18 mục đến hạn · 5 mục mới"  → nút default "Bắt đầu ôn" cỡ quiz]
[Dòng phân rã: 12 từ vựng · 4 ngữ pháp · 2 trợ từ]
[Danh sách xem trước — thẻ mục tiêu ôn tập, mục quá hạn lên đầu]
[Link: "Điểm yếu của tôi →"]
```

Danh sách xem trước chỉ để người học biết sắp ôn gì — **không bấm vào từng mục để ôn lẻ**.
Thứ tự do FSRS quyết định, cho chọn tay là phá chính cơ chế.

### 3.2. Phiên ôn

**Dùng lại nguyên màn làm bài của SPEC-04 §3.2.** Khác đúng hai chỗ:

- Thanh trên ghi "Ôn tập" thay vì "Luyện tập"
- Không có màn cấu hình — vào thẳng phiên từ nút "Bắt đầu ôn"

### 3.3. Màn kết quả phiên ôn

Như SPEC-04 §3.3, thêm một dòng: **"Lần ôn kế tiếp: 3 mục vào ngày mai, 12 mục trong 4 ngày"**
— cho người học thấy lịch đang vận hành, không phải hộp đen.

### 3.4. `/on-tap/diem-yeu` — Điểm yếu của tôi

Bề rộng `max-w-2xl`. Bảng xếp theo `incorrectCount` giảm dần, lọc được theo `targetType`
(tất cả / từ vựng / ngữ pháp / kanji / trợ từ / nghe).

Mỗi dòng: nội dung mục tiêu · nhãn loại · số lần sai / tổng số lần · lần sai gần nhất · hạn ôn kế.

## 4. Component dùng lại

| Vai trò | Token component |
|---|---|
| Thẻ mục tiêu ôn tập | `design-system.md` §9.8 — nội dung + nhãn `targetType` + hạn ôn |
| Mục quá hạn | `badge-overdue` + icon `<AlarmClock />` + số ngày trễ |
| Thẻ lớn, thẻ danh sách | `card` |
| "Bắt đầu ôn" | `button-primary` cỡ `quiz` — nút `default` duy nhất của trang |
| Chip lọc loại mục tiêu | `button-secondary` / `button-ghost` |
| Toàn bộ màn làm bài | SPEC-04 §4, không sửa |

Màu nhãn `targetType` dùng đúng ánh xạ cố định của luật biểu đồ (`design-system.md` §11.3):
`vocab → chart-1`, `grammar → chart-2`, `kanji → chart-3`, `particle → chart-4`,
`listening → chart-5`. **Màu gắn với thực thể, không gắn với thứ hạng** — đổi bộ lọc không
được đổi màu của các mục còn lại. Nhãn luôn có chữ kèm màu.

## 5. Trạng thái

| Tình huống | Hiển thị |
|---|---|
| **Không có mục nào đến hạn** | Trạng thái người dùng gặp thường xuyên nhất. Không để trống trơn: xác nhận đã ôn xong, nêu số mục sẽ đến hạn ngày mai, và gợi ý nút "Học bài mới" → `/hoc` |
| Chưa học gì bao giờ | "Chưa có gì để ôn — hãy bắt đầu từ bài 1" + nút về `/hoc/1` |
| Đã chạm `dailyNewLimit` | Nêu rõ: "Đã đủ 20 mục mới hôm nay". Không im lặng cắt bớt |
| Có mục đến hạn nhưng lọc ra 0 câu hỏi | Xảy ra khi mục tiêu chỉ có câu dạng `listening` mà máy không có giọng `ja-JP`. Nêu đúng lý do. **`dueAt` giữ nguyên** |
| Đang tải Dexie | Skeleton đúng kích thước thẻ thật |
| Bảng điểm yếu rỗng | "Chưa có điểm yếu nào được ghi nhận" — đây là tin tốt, viết như tin tốt |

Mọi phần tử bấm được đủ sáu trạng thái theo `design-system.md` §8.

## 6. Tương tác & chuyển động

Kế thừa toàn bộ bảng chuyển động của SPEC-04 §6 (màn làm bài dùng chung).

Riêng màn `/on-tap`: 150ms `ease-out` cho hover/focus. Không animate danh sách xem trước.
Bọc trong `@media (prefers-reduced-motion: no-preference)`.

Phím tắt: `Space` bắt đầu phiên khi đang ở `/on-tap`. Trong phiên dùng phím tắt của SPEC-04.

## 7. Accessibility

- Số mục đến hạn đọc thành câu đầy đủ: "18 mục đến hạn ôn tập", không đọc trần số.
- Mục quá hạn không chỉ đổi màu `warning` — có icon `<AlarmClock />` **và** chữ "trễ 3 ngày".
- Bảng điểm yếu là `<table>` thật với `<th scope="col">`; chip lọc là nhóm
  `role="group"` có `aria-label`.
- Nhãn `targetType` luôn có chữ, màu chỉ là phụ trợ — bắt buộc vì `chart-3/4/5` có tương phản
  dưới 3:1 trên nền card trắng.
- Trạng thái rỗng phải là nội dung đọc được, không phải chỉ một hình minh họa.
- Focus ring 3px giữ nguyên; vùng chạm ≥ 48×48px.

## 8. Bảo mật & dữ liệu

Lịch ôn FSRS tính **hoàn toàn trên máy** — `ts-fsrs` là thư viện TypeScript thuần, không có
bước nào cần server. Hệ quả: lịch ôn vẫn chính xác khi mất mạng hoàn toàn.

Dữ liệu ôn tập nằm trong IndexedDB. `pendingSync` tích lũy chờ F08, chưa gửi đi đâu.
Không telemetry, không analytics.

Người dùng xóa dữ liệu site của trình duyệt là mất toàn bộ lịch ôn. Export JSON (F06) là
đường thoát duy nhất trước khi Supabase có mặt — nêu rõ ở màn Cài đặt.

## 9. Tiêu chí nghiệm thu

- [ ] Làm một phiên luyện tập → hôm sau (hoặc chỉnh giờ hệ thống) `/on-tap` hiện đúng các mục
      vừa học, mục quá hạn lâu nhất xếp trước
- [ ] Mục quá hạn hiện `badge-overdue` + icon + số ngày trễ
- [ ] Học liên tiếp nhiều bài mới → số mục mới nạp trong ngày **dừng ở 20**, có thông báo
- [ ] Không có mục đến hạn → màn hình có nội dung và lối đi tiếp, **không trống trơn**
- [ ] Mục tiêu chỉ có câu `listening` trên máy thiếu giọng `ja-JP`: bị loại khỏi phiên và
      `dueAt` **không đổi** — kiểm tra trực tiếp trong DevTools › IndexedDB
- [ ] **Tắt mạng hoàn toàn**: cả phiên ôn chạy y hệt, `dueAt` tính đúng
- [ ] Bảng điểm yếu xếp đúng theo `incorrectCount` giảm dần, lọc theo loại chạy đúng
- [ ] Nhãn loại mục tiêu giữ nguyên màu khi đổi bộ lọc
- [ ] Đúng **một** nút `default` trên `/on-tap`
- [ ] `pnpm check` exit 0, `pnpm test` xanh

## 10. Khối lệnh bàn giao thiết kế

Dán nguyên khối dưới đây kèm `web/DESIGN.md` vào Stitch / Claude Design.

---

Nạp `DESIGN.md` làm hợp đồng token. Ba ràng buộc bắt buộc:

1. Chỉ dùng token màu theo tên (`bg-primary`, `text-muted-foreground`), **tuyệt đối không
   hardcode mã hex**.
2. Mobile-first: dựng bố cục 390px trước, rồi mới mở rộng lên 1024px.
3. Mọi chữ tiếng Nhật phải bọc trong phần tử có class `jp`.

Dựng hai màn hình cho khu vực ôn tập ngắt quãng của một app học tiếng Nhật, bề rộng tối đa
`max-w-2xl` (672px).

**A. Ôn tập hôm nay.** Theo thứ tự: tiêu đề H1 · một thẻ lớn ghi "18 mục đến hạn · 5 mục mới"
chứa nút chính duy nhất của trang "Bắt đầu ôn" (cỡ `quiz`, cao 48px) · một dòng phân rã theo
loại ("12 từ vựng · 4 ngữ pháp · 2 trợ từ") · danh sách xem trước các mục sắp ôn · một link
"Điểm yếu của tôi".

Mỗi mục trong danh sách xem trước là một thẻ hiện nội dung tiếng Nhật, một nhãn loại mục tiêu,
và hạn ôn. Mục quá hạn hiện thêm huy hiệu cảnh báo gồm **cả icon đồng hồ báo thức lẫn chữ**
"trễ 3 ngày" — màu không bao giờ đứng một mình.

Cần thiết kế cả **trạng thái rỗng**: khi không còn mục nào đến hạn, màn hình phải xác nhận đã
ôn xong, cho biết bao nhiêu mục sẽ đến hạn ngày mai, và có nút "Học bài mới". Đây là trạng
thái người dùng gặp thường xuyên nhất — không được để trống trơn.

**B. Điểm yếu của tôi.** Một hàng chip lọc theo loại (tất cả / từ vựng / ngữ pháp / kanji /
trợ từ / nghe) và một bảng thật xếp theo số lần sai giảm dần. Mỗi dòng: nội dung mục tiêu,
nhãn loại, số lần sai trên tổng số lần, lần sai gần nhất, hạn ôn kế tiếp.

Nhãn loại mục tiêu dùng màu cố định theo loại — từ vựng `chart-1`, ngữ pháp `chart-2`, kanji
`chart-3`, trợ từ `chart-4`, nghe `chart-5` — và **màu gắn với loại chứ không gắn với thứ
hạng**: đổi bộ lọc không được đổi màu của các mục còn lại. Mọi nhãn phải có chữ kèm màu.

Mọi phần tử bấm được cần đủ sáu trạng thái: Mặc định, Hover (chỉ khi `(hover: hover)`), Focus
(ring 3px, không bao giờ tắt), Active (dịch xuống 1px), Disabled (`opacity-50`), Loading.
Vùng chạm tối thiểu 48×48px.

Trang chừa `pb-24` cho thanh nav đáy. Hoạt ảnh bọc trong `@media (prefers-reduced-motion:
no-preference)`, 150ms `ease-out`.

Cần cả chế độ sáng và tối.

---

> **Không** dùng file Stitch export để ghi đè `web/src/app/globals.css`. Bản export đổi màu
> về hex, bỏ toàn bộ chế độ tối, và mất lớp `@theme inline` — chính là thứ cho phép class
> `.dark` ghi đè token lúc chạy (`design-system.md` §12).
