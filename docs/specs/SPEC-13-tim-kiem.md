# SPEC-13 — Hộp tìm kiếm `Ctrl+K`

> **Mã:** SPEC-JPN-F13 · **Trạng thái:** Draft · **Ngày:** 17/09/2026
> **Đối tượng đọc:** Google Stitch / Claude Design (mục 3–6), lập trình viên (toàn bộ).
> **Phụ thuộc:** SPEC-02 (phím tắt `Ctrl+K` đã đăng ký, hiện chưa mở ra gì), SPEC-03 (đích đến
> của kết quả từ vựng/ngữ pháp), SPEC-12 (đích đến của kanji, động từ, bảng tham chiếu).

## 1. Mục tiêu & phạm vi

SPEC-02 đã đăng ký `Ctrl+K` và để nó bấm vào hư không. Spec này là thứ mở ra: gõ một từ bằng
kana, romaji, chữ Hán hay tiếng Việt và tới thẳng chỗ nó nằm trong giáo trình.

**Trong phạm vi**

- Hộp tìm kiếm mở bằng `Ctrl+K` / `Cmd+K` và bằng nút bấm trên mobile
- Chỉ mục tìm kiếm trên toàn bộ nội dung tĩnh: 991 từ vựng · 141 điểm ngữ pháp · 169 kanji ·
  156 động từ · 10 bảng · 25 bài
- Khớp theo chữ Hán, kana, romaji và tiếng Việt **không phân biệt dấu**
- Điều hướng bằng bàn phím theo chuẩn combobox + listbox

**Ngoài phạm vi**

- Tìm trong dữ liệu người dùng (lịch ôn, phiên luyện tập). Đây là tìm **nội dung**, không phải
  tìm tiến độ
- Tìm mờ kiểu fuzzy chịu lỗi chính tả, gợi ý "ý bạn là…"
- Lưu lịch sử tìm kiếm, gợi ý gần đây
- Bộ lọc nâng cao trong hộp tìm kiếm — tra cứu có bộ lọc riêng ở F12
- Tìm kiếm phía server, chỉ mục dựng lúc build

## 2. Dữ liệu

| Nguồn | Chiều | Dùng cho |
|---|---|---|
| `src/data/n5/vocab/*.json` | Đọc | 991 từ vựng |
| `src/data/n5/lessons/*.json` | Đọc | 141 điểm ngữ pháp, 25 bài |
| `src/data/n5/kanji/*.json` | Đọc | 169 chữ |
| `src/data/n5/verbs/verbs.json` | Đọc | 156 động từ |
| `src/data/n5/reference/*.json` | Đọc | 10 bảng |
| `wanakana` | Gọi | Romaji → kana. **Đã cài**, không viết bảng ánh xạ tay |

### 2.1. Chỉ mục — dựng khi mở lần đầu, không khi khởi động app

```ts
interface SearchEntry {
  kind: 'vocab' | 'grammar' | 'kanji' | 'verb' | 'table' | 'lesson';
  label: string;        // chuỗi hiển thị, giữ nguyên notation furigana
  keys: string[];       // chuỗi đã chuẩn hóa để so khớp
  lesson?: number;
  href: string;
}
```

Khoảng 1.500 mục. Dựng bằng `import()` động ngay lần đầu người dùng mở hộp tìm kiếm, giữ lại
trong module cho các lần sau. Nạp lúc khởi động app là bắt cả những người không bao giờ tìm
kiếm phải trả tiền băng thông.

**Không dùng thư viện tìm kiếm.** Quét tuyến tính 1.500 mục mất dưới 1ms — Fuse.js hay MiniSearch
ở đây là 20–50KB để làm chậm đi một việc đang tức thời.

### 2.2. Chuẩn hóa

Cả truy vấn lẫn `keys` đều đi qua cùng một hàm, nếu không thì so khớp sẽ lệch:

1. `toLowerCase()`, gộp khoảng trắng.
2. **Bỏ dấu tiếng Việt**: `.normalize('NFD').replace(/\p{Diacritic}/gu, '')`, **rồi thay
   `đ` → `d` và `Đ` → `D`**. Gốc của JavaScript, không cần thư viện.

   > `đ` không phải chữ `d` mang dấu phụ — nó là một ký tự riêng trong Unicode, nên `NFD` +
   > bỏ dấu **không** động tới nó. Thiếu bước này thì gõ `dong tu` không ra `động từ`, `do an`
   > không ra `đồ ăn`. Đây là lỗi kinh điển khi chuẩn hóa tiếng Việt, và nó chỉ lộ ra ở đúng
   > những từ người học tra nhiều nhất.
3. **Romaji → kana** bằng `wanakana.toKana()` cho phần chữ Latin. Gõ `gakusei` ra `がくせい`.
4. `stripFurigana()` của `japanese.ts` cho chuỗi tiếng Nhật — chỉ mục lưu cả dạng có kanji lẫn
   dạng kana thuần.

Truy vấn được thử theo **cả bản gốc lẫn bản đã chuyển kana**: `ka` vừa có thể là romaji của
`か`, vừa là chữ cái đầu của một nghĩa tiếng Việt.

### 2.3. Xếp hạng

Ba mức, đúng thứ tự, trong mỗi mức giữ nguyên thứ tự theo bài:

1. Khớp **chính xác** một `key`
2. Khớp **đầu chuỗi**
3. Khớp **chứa trong chuỗi**

Nhóm kết quả theo `kind`, mỗi nhóm tối đa 5 mục, tổng tối đa 20. Thứ tự nhóm cố định: Từ vựng →
Ngữ pháp → Kanji → Động từ → Bảng → Bài học. **Thứ tự nhóm không đổi theo truy vấn** — vị trí
ổn định quan trọng hơn vài phần trăm độ liên quan.

Không debounce. Lọc 1.500 mục nhanh hơn một khung hình; debounce chỉ thêm độ trễ nhìn thấy
được.

### 2.4. Đích đến

| Loại | `href` |
|---|---|
| Từ vựng | `/hoc/<bài>#vocab-<id>` |
| Ngữ pháp | `/hoc/<bài>#grammar-<id>` |
| Kanji | `/hoc/tra-cuu/kanji/<chữ>` |
| Động từ | `/hoc/tra-cuu/dong-tu?q=<dạng ます>` — **SPEC-12 §3.4 phải nhận tham số `q`** |
| Bảng tham chiếu | `/hoc/tra-cuu/bang/<slug>` |
| Bài học | `/hoc/<bài>` |

Hai điều kiện phía màn đích, **phải có trước khi spec này chạy được**:

1. Trang chi tiết bài (SPEC-03) có `id` neo trên mỗi mục từ vựng (`vocab-<id>`) và mỗi khối ngữ
   pháp (`grammar-<id>`). Không có neo thì kết quả tìm kiếm chỉ đưa tới đầu một trang dài —
   đúng chỗ mà vô dụng.
2. Bảng động từ (SPEC-12 §3.4) đọc `?q=` từ URL và lọc theo đó, **và** cuộn tới dòng khớp. Bộ
   lọc hiện có của SPEC-12 chỉ có nhóm và bài; `q` là tham số thứ ba, thêm cùng lúc với spec này.

## 3. Màn hình & bố cục

### 3.1. Hộp tìm kiếm

`dialog` neo phía trên, cách đỉnh 15% chiều cao, rộng tối đa `max-w-xl` (576px).

```
┌──────────────────────────────────────────┐
│ 🔍  Tìm từ vựng, ngữ pháp, kanji…        │  ← input, tự focus
├──────────────────────────────────────────┤
│ TỪ VỰNG                                  │
│  学生[がくせい]      học sinh      Bài 1 │  ← mục đang chọn tô muted
│  先生[せんせい]      giáo viên     Bài 1 │
│ KANJI                                    │
│  学   học · 8 nét                        │
├──────────────────────────────────────────┤
│ ↑↓ di chuyển   ↵ mở   esc đóng           │  ← chân, ẩn trên mobile
└──────────────────────────────────────────┘
```

Chiều cao danh sách tối đa 60vh, cuộn trong danh sách. Mục đang chọn luôn tự cuộn vào tầm nhìn.

### 3.2. Ở mobile

Hộp chiếm **toàn màn hình** (bàn phím ảo đã ăn nửa dưới). Không có phím `Ctrl+K`, nên cần một
nút kính lúp: đặt ở header của `/hoc` và `/hoc/tra-cuu`, vùng chạm 48×48px.

Chân hướng dẫn phím tắt ẩn ở mobile — ở đó không có phím nào để hướng dẫn.

### 3.3. Trạng thái rỗng khi chưa gõ gì

Không hiện "lịch sử tìm kiếm" (không lưu), không hiện danh sách ngẫu nhiên. Hiện đúng một khối
gợi ý cách dùng:

```
Gõ chữ Hán, kana, romaji hoặc tiếng Việt.
Ví dụ: 学生 · がくせい · gakusei · hoc sinh
```

Bốn ví dụ này bấm được — đó cũng là cách dạy rằng bốn kiểu gõ đều chạy.

## 4. Component dùng lại

| Vai trò | Token component |
|---|---|
| Khung hộp tìm kiếm | `dialog` (đã có) |
| Ô nhập | `input` (đã có) |
| Tiêu đề nhóm kết quả | chữ Caption, `text-muted-foreground`, viết hoa |
| Nhãn bài, số nét | `badge` |
| Chuỗi tiếng Nhật | component `Furigana` **đã có** |

Icon Lucide: `Search` · `CornerDownLeft` (gợi ý phím Enter).

**Không thêm `command` / `cmdk`.** Danh sách 20 dòng có bàn phím điều khiển dựng được bằng
`dialog` + `input` + `<ul role="listbox">` theo đúng mẫu ARIA ở §7.

> `ponytail: listbox tự dựng cho 6 nhóm kết quả tĩnh; thêm shadcn command (cmdk) nếu về sau
> cần nhóm lồng nhau, tìm mờ, hay danh sách ảo hóa`

## 5. Trạng thái

| Tình huống | Hiển thị |
|---|---|
| Chưa gõ gì | Khối gợi ý cách dùng ở §3.3 |
| Không có kết quả | "Không tìm thấy 〈truy vấn〉" + gợi ý thử romaji hoặc bỏ dấu. **Không** để trống |
| Đang nạp chỉ mục lần đầu | `skeleton` ba dòng trong danh sách; ô nhập **vẫn gõ được ngay** |
| Kết quả nhiều hơn 20 | Hiện 20 mục + dòng "còn n kết quả — gõ thêm để thu hẹp" |
| Gõ một chữ cái | Vẫn tìm bình thường. Không đặt ngưỡng tối thiểu ký tự |
| Nội dung chưa kiểm chứng (F12 §2.1) | Kết quả mang nhãn "chưa kiểm chứng", không lẫn với nội dung đã xác minh |

Mọi phần tử bấm được đủ sáu trạng thái theo `design-system.md` §8.

## 6. Tương tác & chuyển động

| Phím | Hành động |
|---|---|
| `Ctrl+K` / `Cmd+K` | Mở hộp, `preventDefault` (SPEC-02 §6 đã đăng ký) |
| `Esc` | Đóng, trả focus về đúng phần tử trước đó |
| `↑` `↓` | Di chuyển giữa các kết quả, **đi xuyên qua ranh giới nhóm** |
| `Enter` | Mở kết quả đang chọn |
| `Tab` | Di chuyển **trong** hộp (ô nhập → nút đóng → quay lại ô nhập). Không đóng hộp |

- Mở hộp: focus vào ô nhập **ngay**, không chờ hoạt ảnh xong.
- Mở lại lần sau: ô nhập trống. Giữ lại truy vấn cũ là đoán ý người dùng.
- Kết quả cập nhật theo từng ký tự, không animate từng dòng — danh sách nhấp nháy khi gõ là
  thứ gây mỏi mắt nhất.
- Hộp xuất hiện: mờ dần 150ms `ease-out`, không trượt, không nảy. Bọc trong
  `@media (prefers-reduced-motion: no-preference)`.
- Nền sau hộp tối lại `bg-black/50`; bấm ra ngoài thì đóng.

## 7. Accessibility

Mẫu ARIA bắt buộc — làm đúng ngay từ đầu, sửa sau tốn hơn nhiều:

- Ô nhập: `role="combobox"`, `aria-expanded`, `aria-controls` trỏ tới danh sách,
  `aria-activedescendant` trỏ tới `id` của mục đang chọn.
- Danh sách: `<ul role="listbox">`; mỗi kết quả `role="option"` với `aria-selected`.
- **Focus luôn ở ô nhập.** Mũi tên đổi `aria-activedescendant`, không dời focus thật — dời
  focus thì người dùng không gõ tiếp được.
- Tiêu đề nhóm dùng `role="presentation"` để screen reader không đọc chúng như một option.
- Số kết quả thông báo qua `aria-live="polite"`: "12 kết quả" — thông báo khi số ổn định, không
  bắn mỗi ký tự.
- `dialog` bẫy focus, `Esc` đóng, focus trả về **đúng** phần tử đã mở nó (nút kính lúp, hoặc
  phần tử đang focus trước khi bấm `Ctrl+K`).
- **`Tab` không đóng hộp.** Bản trước vừa yêu cầu bẫy focus vừa yêu cầu `Tab` thoát ra — hai
  điều loại trừ nhau, và bẫy focus là thứ chuẩn ARIA cho `dialog` modal. Chỉ `Esc` và bấm ra
  ngoài mới đóng.
- Mục đang chọn không chỉ khác màu nền: có viền trái `primary` 2px.
- Chuỗi tiếng Nhật trong kết quả nằm trong phần tử `lang="ja"`.
- Vùng chạm mỗi dòng kết quả ≥ 48px chiều cao; focus ring 3px không tắt.

## 8. Bảo mật & dữ liệu

Tìm kiếm chạy **hoàn toàn trên máy** trên dữ liệu tĩnh trong bundle. Không gọi mạng, không gửi
truy vấn đi đâu, không log truy vấn, không analytics — kể cả dạng "từ khóa phổ biến".

Không lưu lịch sử tìm kiếm vào `localStorage` hay Dexie. Không có gì để rò rỉ, và cũng không
có gì phải dọn.

Hộp tìm kiếm **chỉ đọc**: không ghi Dexie, không đụng lịch ôn. Tìm một từ không phải là ôn nó.

Chạy nguyên vẹn khi offline — đây là tiêu chí nghiệm thu, không phải hệ quả may mắn.

## 9. Tiêu chí nghiệm thu

- [ ] `Ctrl+K` (Windows/Linux) và `Cmd+K` (macOS) đều mở hộp, trình duyệt **không** mở thanh
      tìm kiếm riêng của nó
- [ ] Gõ `gakusei` → ra 学生; gõ `がくせい` → ra 学生; gõ `学生` → ra 学生; gõ `hoc sinh`
      (không dấu) → ra 学生
- [ ] Gõ `học sinh` (có dấu) cho **cùng kết quả** với `hoc sinh`
- [ ] Gõ `dong tu` ra `động từ`, gõ `do an` ra `đồ ăn` (ca hồi quy cho `đ` → `d`)
- [ ] `Tab` trong hộp **không** đóng hộp; chỉ `Esc` và bấm nền mới đóng
- [ ] Kết quả động từ mở `/hoc/tra-cuu/dong-tu?q=…` và bảng **lọc đúng** theo `q`
- [ ] `↑` `↓` chạy xuyên qua ranh giới nhóm; mục đang chọn tự cuộn vào tầm nhìn
- [ ] `Enter` mở đúng đích; kết quả từ vựng nhảy **tới đúng neo** trong trang bài, không phải
      đầu trang
- [ ] `Esc` đóng và trả focus về đúng phần tử đã mở hộp
- [ ] Trong lúc di chuyển bằng mũi tên, **vẫn gõ tiếp được** (focus không rời ô nhập)
- [ ] Screen reader đọc được số kết quả và mục đang chọn
- [ ] Ở 390px: hộp chiếm toàn màn hình, nút kính lúp ≥ 48×48px, danh sách không bị bàn phím ảo
      che
- [ ] Mở hộp lần đầu → chỉ mục nạp xong dưới 300ms trên mạng chậm mô phỏng; ô nhập gõ được
      ngay từ mili-giây đầu
- [ ] Bundle trang chủ **không** tăng vì chỉ mục tìm kiếm (kiểm tra `pnpm build`)
- [ ] Chạy được khi **tắt mạng hoàn toàn**
- [ ] `pnpm check` exit 0, `pnpm test` xanh (test: chuẩn hóa bỏ dấu, romaji→kana, thứ tự xếp
      hạng chính xác → đầu chuỗi → chứa)

## 10. Khối lệnh bàn giao thiết kế

Dán nguyên khối dưới đây kèm `web/DESIGN.md` vào Stitch / Claude Design.

---

Nạp `DESIGN.md` làm hợp đồng token. Ba ràng buộc bắt buộc:

1. Chỉ dùng token màu theo tên (`bg-primary`, `text-muted-foreground`), **tuyệt đối không
   hardcode mã hex**.
2. Mobile-first: dựng bố cục 390px trước, rồi mới mở rộng lên 1024px.
3. Mọi chữ tiếng Nhật phải bọc trong phần tử có class `jp`.

Dựng hộp tìm kiếm nhanh của một app học tiếng Nhật, mở bằng `Ctrl+K`.

**Trên desktop**: một hộp thoại nổi rộng tối đa `max-w-xl` (576px), neo cách đỉnh màn hình 15%
chiều cao, nền sau tối lại. Ba phần: một ô nhập có icon kính lúp và placeholder "Tìm từ vựng,
ngữ pháp, kanji…"; một danh sách kết quả **chia nhóm** với tiêu đề nhóm nhỏ viết hoa (TỪ VỰNG,
NGỮ PHÁP, KANJI, ĐỘNG TỪ, BẢNG, BÀI HỌC); và một thanh chân mảnh ghi gợi ý phím "↑↓ di chuyển ·
↵ mở · esc đóng".

Mỗi dòng kết quả cao tối thiểu 48px, gồm: chuỗi tiếng Nhật có furigana bên trái, nghĩa tiếng
Việt ở giữa, huy hiệu số bài bên phải. **Dòng đang chọn** phải phân biệt được bằng **cả nền
`muted` lẫn một viền trái `primary` 2px** — màu nền không bao giờ đứng một mình.

**Trên mobile (390px)**: hộp chiếm toàn màn hình, thanh chân gợi ý phím bị ẩn, và cần một nút
kính lúp 48×48px đặt ở header trang.

Cần thêm ba trạng thái:

- *Chưa gõ gì*: một khối gợi ý cách dùng — "Gõ chữ Hán, kana, romaji hoặc tiếng Việt" kèm bốn
  ví dụ bấm được: `学生`, `がくせい`, `gakusei`, `hoc sinh`.
- *Không có kết quả*: câu "Không tìm thấy 〈truy vấn〉" kèm một gợi ý thử cách gõ khác.
- *Đang nạp chỉ mục*: ba dòng skeleton trong danh sách, ô nhập vẫn hoạt động bình thường.

Mọi phần tử bấm được cần đủ sáu trạng thái: Mặc định, Hover (chỉ khi `(hover: hover)`), Focus
(ring 3px, không bao giờ tắt), Active (dịch xuống 1px), Disabled (`opacity-50`), Loading.

Hộp xuất hiện bằng hiệu ứng mờ dần 150ms `ease-out` — không trượt, không nảy — và bọc trong
`@media (prefers-reduced-motion: no-preference)`. Danh sách kết quả **không** có hoạt ảnh khi
đổi theo từng ký tự gõ.

Cần cả chế độ sáng và tối.

---

> **Không** dùng file Stitch export để ghi đè `web/src/app/globals.css`. Bản export đổi màu
> về hex, bỏ toàn bộ chế độ tối, và mất lớp `@theme inline` — chính là thứ cho phép class
> `.dark` ghi đè token lúc chạy (`design-system.md` §12).
