# SPEC-12 — Tra cứu: Kanji, động từ & 10 bảng tham chiếu

> **Mã:** SPEC-JPN-F12 · **Trạng thái:** Draft · **Ngày:** 17/09/2026
> **Đối tượng đọc:** Google Stitch / Claude Design (mục 3–6), lập trình viên (toàn bộ).
> **Phụ thuộc:** SPEC-01 (quy ước furigana, `targetId`), SPEC-03 (khu vực Học — spec này nằm
> trong đó), SPEC-02 (khung nav, không thêm khu vực thứ sáu).
> **Chặn:** SPEC-13 (hộp tìm kiếm `Ctrl+K` tìm trên chính các chỉ mục dựng ở đây).

## 1. Mục tiêu & phạm vi

Ba nhóm dữ liệu đã nằm trong repo từ đầu mà chưa màn hình nào đọc tới: `kanji/` (169 chữ),
`verbs/` (156 động từ), `reference/` (10 bảng). SPEC-01 và SPEC-03 đều đẩy chúng sang "đợt
sau" vì bản `vi` chưa xong. Spec này làm nốt phần dịch và dựng chỗ đọc.

**Trong phạm vi**

- Hoàn tất bản `vi` cho dữ liệu kanji — **431 / 907 ví dụ ghép hiện vẫn là tiếng Anh**
- `/hoc/tra-cuu` — trang chủ tra cứu
- `/hoc/tra-cuu/kanji` + `/hoc/tra-cuu/kanji/[chu]` — lưới 169 chữ và trang chi tiết
- `/hoc/tra-cuu/dong-tu` — bảng 156 động từ, 5 thể, lọc theo nhóm và theo bài
- `/hoc/tra-cuu/bang/[slug]` — 10 bảng tham chiếu
- Chỉ mục tra ngược "từ vựng nào chứa chữ này", dựng lúc chạy

**Ngoài phạm vi**

- Hộp tìm kiếm `Ctrl+K` — F13
- Sinh câu hỏi từ kanji hay động từ. `targetId` dạng `kanji-学` đã có trong quy ước SPEC-01
  §4.6 nhưng bộ câu hỏi kanji là việc của một spec khác
- Thứ tự nét viết dạng hoạt hình, nhận dạng chữ viết tay
- Ghi `reviewItems` từ màn tra cứu. Đây là khu vực **chỉ đọc**
- Dữ liệu N4 — F11

## 2. Dữ liệu

| Nguồn | Chiều | Dùng cho |
|---|---|---|
| `src/data/n5/kanji/*.json` (169 file) | Đọc | Lưới và chi tiết kanji |
| `src/data/n5/verbs/verbs.json` (156 mục) | Đọc | Bảng động từ |
| `src/data/n5/reference/*.json` (10 file) | Đọc | 10 bảng tham chiếu |
| `src/data/n5/vocab/*.json` | Đọc | Chỉ mục "từ vựng chứa chữ này" |
| `db.reviewItems` | Đọc `useLiveQuery` | Nhãn "đã học" trên chữ đã có lịch ôn |

### 2.1. Việc phải làm trước tiên: dịch nốt bản `vi`

Đếm trên dữ liệu hiện tại trong repo:

| Nhóm | Tình trạng |
|---|---|
| Nghĩa của 169 kanji | Đã có `vi` thật — 0/169 còn nguyên tiếng Anh |
| 907 ví dụ ghép của kanji | **431 mục có `vi` trùng hệt `en`** — chưa dịch |
| 156 động từ | Đã có `vi` thật |
| 10 bảng tham chiếu | Đã có `vi`, còn đúng 8 ô layout rỗng có chủ đích (`docs/n5-manifest.md` §4) |

431 mục đó là **chưa dịch**, không phải "dịch trùng". Trước khi trang kanji lên được, phải
dịch xong và đối chiếu: âm Hán-Việt theo từ điển Hán-Việt chuẩn mực, nghĩa từ ghép theo giáo
trình hoặc từ điển có thể dẫn nguồn (`docs/n5-data-editorial-guide.md`).

**Không chấp nhận**: AI dịch rồi AI khác duyệt, dịch theo trí nhớ, để nguyên tiếng Anh và coi
là tạm ổn. Mục chưa đối chiếu được thì đánh dấu `verification_status: unverified` và **không**
hiển thị như nội dung đã xác minh.

### 2.2. Chỉ mục tra ngược, dựng lúc chạy

`VocabWord.kanjiIds` có trong kiểu dữ liệu nhưng **0/991 từ có giá trị**. Không migration,
không thêm trường vào 25 file vocab: dựng một `Map<string, VocabWord[]>` một lần khi module
nạp, bằng cách quét `stripFurigana(word)` tìm từng chữ Hán.

991 từ × vài ký tự là vài mili-giây. Việc sinh dữ liệu cho một phép quét rẻ như vậy chỉ tạo
thêm một nguồn sự thật thứ hai để lệch nhau.

### 2.3. Định tuyến — một lưu ý bắt buộc

`/hoc/tra-cuu` nằm cùng cấp với `/hoc/[so]` của SPEC-03. Next.js ưu tiên segment tĩnh hơn
segment động nên `tra-cuu` không bị nuốt, nhưng `/hoc/[so]` **phải kiểm tra `so` là số** và
trả `notFound()` nếu không — nếu không, mọi đường dẫn con lạ sẽ rơi vào trang chi tiết bài và
crash ở chỗ đọc dữ liệu.

Tra cứu đặt dưới `/hoc/` để nav vẫn sáng đúng mục "Học". **Không thêm khu vực thứ sáu** vào
thanh nav (`design-system.md` §6.3).

## 3. Màn hình & bố cục

### 3.1. `/hoc/tra-cuu` — trang chủ tra cứu

Bề rộng `max-w-2xl`. Ba thẻ lớn:

```
[H1 "Tra cứu"]
[Thẻ: Kanji — 169 chữ N5]              →
[Thẻ: Động từ — 156 động từ, 5 thể]    →
[Thẻ: Bảng tham chiếu — 10 bảng]       →
```

### 3.2. `/hoc/tra-cuu/kanji` — lưới 169 chữ

Bề rộng `max-w-5xl`. Lưới ô vuông, chữ Hán cỡ lớn, dưới là số bài.

Lọc: theo bài (1–25) · theo số nét · "chỉ chữ đã học". Sắp xếp: theo bài (mặc định) · theo
số nét.

**Bộ lọc "đã học" định nghĩa lại theo thứ có thật.** Không có dạng bài nào sinh `targetId` dạng
`kanji-学` trong phạm vi hiện tại (SPEC-01 chỉ sinh `vocab-*`, `grammar-*`, `particle-*`), nên
`reviewItems` sẽ **không bao giờ** có bản ghi kanji và bộ lọc sẽ luôn rỗng.

Chốt: **"đã học" = có ít nhất một từ vựng chứa chữ này đã vào lịch ôn**, tính từ chỉ mục tra
ngược §2.2. Đó là thông tin đúng và có sẵn ngay.

Chữ đã học mang một chấm nhỏ `primary` **và** chữ "đã học" trong `aria-label` — chấm màu là phụ
trợ, không phải thông tin duy nhất. Khi nào có bộ câu hỏi kanji riêng, bộ lọc mới đổi sang đọc
`reviewItems` trực tiếp.

### 3.3. `/hoc/tra-cuu/kanji/[chu]` — chi tiết một chữ

Bề rộng `max-w-2xl`.

```
[Chữ Hán cỡ rất lớn]   [badge "Bài 1"]  [badge "2 nét"]
[Nghĩa tiếng Việt]
[Âm On: ジン・ニン]  [Âm Kun: ひと]
[Từ ghép — danh sách, mỗi dòng: từ có furigana + nghĩa tiếng Việt + nút phát âm]
[Từ vựng trong giáo trình có chứa chữ này — từ chỉ mục §2.2, kèm số bài]
[Chữ dễ nhầm: 入]   ← link sang chi tiết chữ đó
```

Đường dẫn dùng chính chữ Hán (`/hoc/tra-cuu/kanji/人`), `encodeURIComponent` khi tạo link.

### 3.4. `/hoc/tra-cuu/dong-tu` — bảng động từ

Bề rộng `max-w-5xl`. Bảng thật, các cột: Động từ (có furigana) · ます · て · từ điển · ない ·
た · Nghĩa · Bài.

Lọc theo nhóm (1 / 2 / 3), theo bài, và theo **`?q=`** — tham số tìm kiếm tự do trên dạng ます,
thể từ điển và nghĩa tiếng Việt. Dòng khớp đầu tiên được cuộn vào tầm nhìn và tô nền `accent`.
`?q=` là lối vào của SPEC-13 §2.4; không có nó thì kết quả tìm kiếm động từ chỉ mở ra một bảng
156 dòng và bỏ mặc người dùng tự dò.

Nhãn nhóm dùng token màu nhóm động từ có sẵn:
`--verb-1` cam đất · `--verb-2` xanh Indigo · `--verb-3` xanh tre (`design-system.md` §2.3),
luôn kèm chữ "Nhóm 1 / 2 / 3".

Ở 390px bảng cuộn ngang trong khung riêng, **cột đầu (động từ) ghim lại** — bảng 7 cột bóp vừa
390px là bảng không đọc được.

### 3.5. `/hoc/tra-cuu/bang/[slug]` — 10 bảng tham chiếu

Bề rộng `max-w-2xl`. Mỗi file có `title`, `description`, nhiều `sections`, mỗi section có
`tables` và `note` — render đúng theo cấu trúc đó, **không** làm lại bố cục riêng cho từng
bảng.

Tám ô header rỗng là **có chủ đích** (`docs/n5-manifest.md` §4): giữ nguyên ô trống để lưới
đúng hình, không lấp bằng dấu `—` hay chữ tự nghĩ ra.

## 4. Component dùng lại

| Vai trò | Token component |
|---|---|
| Thẻ ở trang chủ tra cứu, khối chi tiết | `card` |
| Ô kanji trong lưới | `card` nhỏ, chữ Hán dùng `font-jp` |
| Nhãn bài, số nét, nhóm động từ | `badge` |
| Chip lọc | `button-secondary` / `button-ghost` |
| Bảng động từ, bảng tham chiếu | `<table>` thật |
| Câu và từ tiếng Nhật | component `Furigana` **đã có** |
| Nút phát âm | gọi `src/lib/tts.ts` của SPEC-01, không viết lại |

Icon Lucide: `Languages` (kanji) · `Repeat2` (động từ) · `Table2` (bảng tham chiếu).

Không thêm component mới, không thêm thư viện bảng. Sắp xếp và lọc 169 hoặc 156 dòng là vài
dòng `filter`/`sort` — một thư viện data-grid ở đây là 40KB cho việc `Array.prototype` làm
xong.

## 5. Trạng thái

| Tình huống | Hiển thị |
|---|---|
| Lọc ra 0 kết quả | "Không có chữ nào khớp bộ lọc" + nút xóa bộ lọc. Không để lưới trống trơn |
| Chữ trong URL không tồn tại | `notFound()` — trang 404 có link về `/hoc/tra-cuu` |
| `so` trong `/hoc/[so]` không phải số | `notFound()`, **không** crash (xem §2.3) |
| Chưa học chữ nào | Bộ lọc "chỉ chữ đã học" `disabled` kèm chú thích, không hiện lưới rỗng |
| Ví dụ chưa có bản dịch `vi` | Hiện nhãn "chưa kiểm chứng" và **không** hiển thị chuỗi tiếng Anh như thể là tiếng Việt |
| Máy không có giọng `ja-JP` | Ẩn nút phát âm, không hiện nút bấm vào không kêu |
| Ô header rỗng của bảng tham chiếu | Để trống đúng như dữ liệu, giữ lưới |

Mọi phần tử bấm được đủ sáu trạng thái theo `design-system.md` §8.

## 6. Tương tác & chuyển động

- Lọc và sắp xếp áp **ngay**, không có nút "Áp dụng". Trạng thái bộ lọc nằm trên URL
  (`?bai=7&net=8`) để chia sẻ và quay lại được.
- Bấm một ô kanji: điều hướng thường, không mở modal. Chi tiết kanji là nội dung đáng có URL
  riêng.
- Đổi bộ lọc: **không** animate sắp xếp lại lưới. 169 ô nhảy chỗ cùng lúc là nhiễu thị giác.
- Hover/focus: 150ms `ease-out`, bọc trong `@media (prefers-reduced-motion: no-preference)`.
- Phím tắt: không thêm phím nào. `Ctrl+K` thuộc F13.

## 7. Accessibility

- Bảng động từ và bảng tham chiếu là `<table>` thật với `<th scope="col">` / `scope="row"`,
  có `<caption>` mô tả.
- Bảng cuộn ngang: khung cuộn có `tabindex="0"` và `aria-label` để lăn được bằng bàn phím.
- Ô kanji trong lưới là `<a>` thật, `aria-label` đọc thành "人 — người, bài 1", không đọc trần
  một ký tự.
- Nhãn nhóm động từ có chữ kèm màu; `--verb-2` và `--verb-3` không đủ tương phản để đứng một
  mình.
- Chữ Hán cỡ lớn ở trang chi tiết đặt trong phần tử có `lang="ja"` để screen reader chọn đúng
  giọng.
- Nút phát âm có `aria-label` "Phát âm 人", không chỉ có icon loa.
- Chấm "đã học" kèm chữ trong `aria-label`.
- Vùng chạm ≥ 48×48px kể cả ô trong lưới kanji; focus ring 3px không tắt.

## 8. Bảo mật & dữ liệu

Toàn bộ dữ liệu là file tĩnh trong bundle. Khu vực này **chỉ đọc**: không ghi Dexie, không gọi
mạng, không telemetry. Chạy nguyên vẹn khi offline.

169 file kanji + 25 file vocab nạp theo route, không gộp hết vào bundle trang chủ. Chỉ mục tra
ngược §2.2 dựng trong module của khu vực tra cứu, không nằm ở layout gốc.

Nội dung học phải **truy vết được** (`AGENTS.md`): mỗi bảng tham chiếu và mỗi chữ kanji giữ
nguyên nguồn dẫn trong dữ liệu. Không bịa âm Hán-Việt, không bịa nghĩa từ ghép, không bịa số
nét. Mục chưa đối chiếu được đánh dấu rõ và không trộn lẫn với nội dung đã xác minh.

`repo-reference/noken` là **chỉ đọc** — không sửa file trong đó khi bổ sung bản dịch.

## 9. Tiêu chí nghiệm thu

- [ ] `grep` toàn bộ `web/src/data/n5/kanji/` → **không còn mục nào có `vi` trùng hệt `en`**
      (hiện tại: 431/907). Đây là **kiểm tra hỗ trợ**, không phải bằng chứng dịch đúng: một
      bản dịch sai vẫn khác `en`
- [ ] Mỗi lô dịch có người đối chiếu nguồn và ghi nguồn vào `docs/n5-manifest.md`; lô chưa
      đối chiếu giữ `verification_status: unverified` và hiện nhãn tương ứng trên giao diện
- [ ] Rà tay một mẫu ngẫu nhiên 30 mục sau mỗi lô dịch — con số 0/907 không thay thế được
      việc đọc thật
- [ ] `/hoc/tra-cuu/kanji` hiện đủ 169 chữ; lọc theo bài 7 ra đúng số chữ của bài 7
- [ ] `/hoc/tra-cuu/kanji/人` hiện đủ: nghĩa Việt, âm On/Kun, số nét, từ ghép, chữ dễ nhầm
- [ ] Mục "từ vựng có chứa chữ này" của `人` liệt kê đúng các từ trong 25 bài, không sót
      `日本人`, không khớp nhầm
- [ ] `/hoc/tra-cuu/dong-tu` hiện đủ 156 động từ với 5 thể; lọc nhóm 2 ra đúng tập động từ
- [ ] Nhãn nhóm động từ có **chữ** kèm màu
- [ ] 10 bảng tham chiếu render đủ; **8 ô header rỗng vẫn rỗng**, lưới không vỡ
- [ ] `/hoc/abc` (không phải số) → trang 404, **không crash**
- [ ] Bộ lọc nằm trên URL: copy link, mở tab mới ra đúng kết quả đó
- [ ] Mở `/hoc/tra-cuu/dong-tu?q=あいます` → bảng lọc đúng và cuộn tới dòng khớp
- [ ] Ở 390px: bảng động từ cuộn ngang, cột đầu ghim, không bóp chữ
- [ ] Chạy được khi **tắt mạng hoàn toàn**
- [ ] `pnpm check` exit 0, `pnpm test` xanh (test: chỉ mục tra ngược khớp dài trước ngắn, lọc
      theo bài/nhóm, `notFound` cho `so` không phải số)

## 10. Khối lệnh bàn giao thiết kế

Dán nguyên khối dưới đây kèm `web/DESIGN.md` vào Stitch / Claude Design.

---

Nạp `DESIGN.md` làm hợp đồng token. Ba ràng buộc bắt buộc:

1. Chỉ dùng token màu theo tên (`bg-primary`, `text-muted-foreground`), **tuyệt đối không
   hardcode mã hex**.
2. Mobile-first: dựng bố cục 390px trước, rồi mới mở rộng lên 1024px.
3. Mọi chữ tiếng Nhật phải bọc trong phần tử có class `jp`.

Dựng khu vực tra cứu của một app học tiếng Nhật — bốn màn hình.

**A. Trang chủ tra cứu** (`max-w-2xl`): tiêu đề "Tra cứu" và ba thẻ lớn xếp dọc — "Kanji —
169 chữ N5", "Động từ — 156 động từ, 5 thể", "Bảng tham chiếu — 10 bảng". Mỗi thẻ có icon
riêng bên trái và mũi tên bên phải.

**B. Lưới kanji** (`max-w-5xl`): một hàng chip lọc (theo bài, theo số nét, "chỉ chữ đã học") và
một lưới ô vuông — mỗi ô có **chữ Hán cỡ lớn** ở giữa và số bài nhỏ bên dưới. Chữ đã học mang
một chấm nhỏ màu `primary` ở góc. Ô tối thiểu 48×48px. Ở 390px lưới 4 cột, từ 1024px 8 cột.
Cần cả trạng thái "không có chữ nào khớp bộ lọc" kèm nút xóa bộ lọc.

**C. Chi tiết một chữ kanji** (`max-w-2xl`), theo thứ tự: chữ Hán **cỡ rất lớn** cùng hai huy
hiệu nhỏ ("Bài 1", "2 nét"); nghĩa tiếng Việt; hai hàng âm On và âm Kun; danh sách từ ghép —
mỗi dòng gồm từ tiếng Nhật có furigana, nghĩa tiếng Việt và một nút phát âm nhỏ; một khối "Từ
vựng trong giáo trình có chứa chữ này"; và cuối cùng một hàng "Chữ dễ nhầm" chứa các ô chữ Hán
nhỏ bấm được.

**D. Bảng động từ** (`max-w-5xl`): hàng chip lọc theo nhóm (Nhóm 1 / Nhóm 2 / Nhóm 3) và theo
bài, rồi một **bảng thật** bảy cột: Động từ, ます, て, từ điển, ない, た, Nghĩa, Bài. Nhãn nhóm
dùng ba màu nhóm động từ của design system nhưng **luôn kèm chữ "Nhóm 1/2/3"** — màu không bao
giờ đứng một mình. Ở 390px bảng cuộn ngang trong khung riêng với **cột động từ ghim lại**,
tuyệt đối không bóp nhỏ chữ cho vừa màn hình.

Mọi phần tử bấm được cần đủ sáu trạng thái: Mặc định, Hover (chỉ khi `(hover: hover)`), Focus
(ring 3px, không bao giờ tắt), Active (dịch xuống 1px), Disabled (`opacity-50`), Loading.
Vùng chạm tối thiểu 48×48px.

Trang chừa `pb-24` cho thanh nav đáy. Hoạt ảnh bọc trong `@media (prefers-reduced-motion:
no-preference)`, 150ms `ease-out`. Không animate việc sắp xếp lại lưới khi đổi bộ lọc.

Cần cả chế độ sáng và tối.

---

> **Không** dùng file Stitch export để ghi đè `web/src/app/globals.css`. Bản export đổi màu
> về hex, bỏ toàn bộ chế độ tối, và mất lớp `@theme inline` — chính là thứ cho phép class
> `.dark` ghi đè token lúc chạy (`design-system.md` §12).
