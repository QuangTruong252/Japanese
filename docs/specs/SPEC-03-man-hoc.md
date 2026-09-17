# SPEC-03 — Màn Học (danh sách bài & chi tiết bài)

> **Mã:** SPEC-JPN-F03 · **Trạng thái:** Draft · **Ngày:** 16/09/2026
> **Đối tượng đọc:** Google Stitch / Claude Design (mục 3–6), lập trình viên (toàn bộ).
> **Phụ thuộc:** SPEC-01 (dữ liệu bài học), SPEC-02 (khung nav).

## 1. Mục tiêu & phạm vi

Khu vực đọc của app: duyệt 25 bài N5 và đọc trọn một bài — từ vựng, ngữ pháp, câu ví dụ,
tất cả có furigana và bản dịch tiếng Việt. Đây là màn hình **dùng được ngay cả khi chưa có
một bài tập nào**, nên nó được dựng trước phần luyện tập.

**Trong phạm vi**

- `/hoc` — lưới 25 bài
- `/hoc/[so]` — chi tiết một bài
- Phát âm TTS cạnh mỗi từ vựng và câu ví dụ
- Study Mode (làm mờ bản dịch) — affordance để người dùng biết chạm được
- Thanh tiến độ mỗi bài

**Ngoài phạm vi**

- Mọi bài tập, mọi thứ ghi vào `reviewItems` — thuộc SPEC-04, SPEC-05
- Tra cứu kanji / bảng chia động từ / 10 bảng tham chiếu — đợt sau, chưa có dữ liệu `vi`
- Ghi chú cá nhân, bookmark — không có trong spec gốc, chưa đưa vào
- Hộp tìm kiếm `Ctrl+K` — đợt spec 2
- Bài 26–50 (N4) — chưa có nguồn dữ liệu

## 2. Dữ liệu

| Nguồn | Chiều | Dùng cho |
|---|---|---|
| `src/data/n5/lessons/lesson-XX.json` | Đọc, `import()` động | Ngữ pháp, mẫu câu, câu ví dụ |
| `src/data/n5/vocab/lesson-XX.json` | Đọc, `import()` động | `{ level, lesson, words }` — **object bọc, không phải mảng trần** |
| `db.reviewItems` | Đọc, `useLiveQuery` | Thanh tiến độ, xem §2.1 |
| `useUIStore` | Đọc | `furigana`, `hideTranslations` (tên theo SPEC-02 §2.1) |

Kiểu: `Lesson`, `GrammarPoint`, `ExampleSentence`, `VocabWord` trong `src/types/index.ts`.
Tên file là `lesson-01.json … lesson-25.json` ở **cả hai** thư mục (SPEC-01 §2), số bài có
đệm 0.

### 2.1. "Đã học" và "đã thuộc" là hai chuyện khác nhau

Thanh tiến độ mỗi bài đếm **mục đã vào lịch ôn**: số `targetId` khớp `vocab-<XX>-` có bản ghi
trong `reviewItems`, chia cho tổng số từ của bài. Nhãn đúng là **"Đã học 12/34"** — nghĩa là đã
gặp trong một phiên làm bài, không phải đã nhớ.

**Không** dùng từ "đã thuộc" ở đây. Mức thành thạo là chuyện của FSRS (`fsrsCard.stability`),
và nếu sau này muốn hiện nó thì đó là một chỉ số thứ hai với ngưỡng riêng — không phải cách
đọc khác của cùng con số.

Đọc bài ở `/hoc/[so]` **không** tạo `reviewItems`, nên thanh tiến độ của một bài mới đọc xong
vẫn là 0. Đó là đúng: tiến độ ở đây đo việc luyện, không đo việc mở trang.

**Nạp theo bài, không nạp cả 25.** `/hoc` chỉ cần số bài + tiêu đề — dùng một file chỉ mục
nhẹ hoặc `import()` song song lấy `title`/`jpTitle`. Chi tiết bài nạp đúng hai file JSON của
bài đó. Không kéo 500KB dữ liệu vào trang danh sách.

## 3. Màn hình & bố cục

### 3.1. `/hoc` — Danh sách bài

Khuôn mẫu: `design-system.md` §10.2. Bề rộng `max-w-5xl`.

Lưới thẻ: **1 cột mobile, 2 cột từ `md`**. Mỗi thẻ:

```
┌──────────────────────────────┐
│ Bài 5          [12/34 từ]    │
│ Đi đâu, về đâu               │  ← title.vi, H3
│ どこへ 行きますか              │  ← jpTitle, class jp, jp-inline
│ ▔▔▔▔▔▔░░░░░░░░░░░░░░░       │  ← thanh tiến độ mảnh 4px
└──────────────────────────────┘
```

### 3.2. `/hoc/[so]` — Chi tiết bài

Khuôn mẫu: `design-system.md` §10.3. Bề rộng **`max-w-2xl` (672px)** — giữ độ dài dòng dễ đọc.

Thứ tự khối **cố định**, không đảo: **Từ vựng → Ngữ pháp → Câu ví dụ → Audio**.

```
[Header: "Bài 5" + title.vi + jpTitle + thanh tiến độ]

[TỪ VỰNG]
  Bảng: từ (jp-vocab 18px, có furigana) │ nghĩa vi │ [🔊] │ [nhãn nhóm động từ]

[NGỮ PHÁP]  — mỗi điểm là một khối:
  H2 title.vi
  [mẫu câu — grammar-pattern-block, nền muted, rounded-lg, p-4]
  explanation.vi
  [danh sách câu ví dụ: jp (jp-example 20px) / translation.vi / [🔊]]
  Small muted-foreground: nguồn sách (sourceRef)

[Nút dưới cùng: "Luyện tập bài này" → /luyen-tap?lessons=5]
```

Chữ Nhật trong bảng từ vựng dùng bậc `jp-vocab` (18px); câu ví dụ dùng `jp-example` (20px);
cả hai luôn `line-height: 2`.

## 4. Component dùng lại

| Vai trò | Token component |
|---|---|
| Thẻ bài trong lưới | `card` |
| Khối mẫu câu | `grammar-pattern-block` |
| Nhãn nhóm động từ | `verb-badge-group-1` / `-2` / `-3` |
| Nút phát âm | `button-ghost` cỡ `icon-*`, icon `<Volume2 />` |
| "Luyện tập bài này" | `button-primary` cỡ `quiz` — nút `default` duy nhất của trang |
| Quay lại danh sách | `button-ghost`, icon `<ChevronLeft />` |

Render furigana: component `Furigana` đã có (`web/src/components/Furigana.tsx`) — sinh
`<ruby>/<rt>` gốc từ notation `漢字[かんじ]`. **Không dựng overlay CSS, không đo chiều rộng
bằng JS.** Trình duyệt đã lo căn giữa, ngắt dòng và giãn dòng — đúng ba thứ khó nhất.

Nhóm động từ lấy từ `VocabWord.type`: `verb-1` → Nhóm 1 (ngũ đoạn), `verb-2` → Nhóm 2
(nhất đoạn), `verb-3` → Nhóm 3 (bất quy tắc). Màu **luôn kèm nhãn chữ "Nhóm 1/2/3"**.

## 5. Trạng thái

| Tình huống | Hiển thị |
|---|---|
| Bài chưa có bản dịch `vi` | Thẻ ở `/hoc` mờ `opacity-50`, nhãn "Chưa có bản dịch", không bấm được. Sẽ gặp thường xuyên trong lúc dịch dần bài 6–25 |
| Bài `verification: 'unverified'` (SPEC-01 §3.1) | Vẫn mở và học bình thường. Cuối trang chi tiết: một dòng `muted` "Nội dung bài này chưa được đối chiếu với bản in" |
| Bài không có `sourceRef` | **Không hiện dòng nguồn sách**, không bịa số trang. `design-system.md` §10.3 mô tả dòng nguồn là *khi có* |
| Bài chưa học (0 mục trong `reviewItems`) | Thanh tiến độ rỗng, chữ "Chưa học" thay cho "0/34" |
| Đang nạp JSON bài | Skeleton đúng kích thước khối thật |
| Nạp bài lỗi / số bài không tồn tại | Thông báo + nút về `/hoc`. Không để màn hình trắng |
| Trình duyệt không có giọng `ja-JP` | Ẩn hẳn nút 🔊, không hiện nút bấm không ăn thua |
| Đang phát âm | Icon đổi `<Volume2 />` → `<Loader2 />` xoay, giữ nguyên bề rộng nút |

Study Mode bật: bản dịch làm mờ `blur(5px)`, rõ khi hover / focus / chạm. **CSS đã có sẵn**
trong `globals.css` dòng 183–194 qua class `.translation` và `html.hide-translations`.
Việc của spec này là gắn class `translation` vào đúng phần tử và cho người dùng thấy nó
chạm được (con trỏ `cursor: pointer`, đã có trong CSS).

Mọi phần tử bấm được đủ sáu trạng thái theo `design-system.md` §8.

## 6. Tương tác & chuyển động

- Bỏ mờ bản dịch ở Study Mode: 150ms `ease-out` (đã có trong CSS).
- Furigana phóng to khi hover: chỉ trong `(hover: hover) and (pointer: fine)`, đã có sẵn
  trong `globals.css` qua class `.ruby-word`. Không dựng lại.
- Không animate chuyển trang giữa `/hoc` và `/hoc/[so]`.
- Toàn bộ hoạt ảnh bọc `@media (prefers-reduced-motion: no-preference)`.

Không có phím tắt riêng cho màn này ngoài `Ctrl+K` toàn cục ở SPEC-02.

## 7. Accessibility

- Furigana dùng `<ruby>/<rt>` gốc → screen reader đọc đúng, bôi đen copy ra text sạch.
- Tắt furigana bằng `rt { visibility: hidden }` — **không** gỡ khỏi cây DOM, để nội dung
  vẫn còn cho screen reader.
- Bảng từ vựng là `<table>` thật với `<th scope="col">`, không phải lưới div.
- Nút phát âm có `aria-label` gồm cả từ: "Phát âm 行きます".
- Nhãn nhóm động từ có chữ, không chỉ có màu.
- Bản dịch bị làm mờ ở Study Mode vẫn đọc được bằng screen reader — `filter: blur()` là hiệu
  ứng thị giác, không phải `aria-hidden`.
- Thanh tiến độ là `<progress>` hoặc có `role="progressbar"` kèm `aria-valuenow`/`aria-valuetext`
  ("12 trên 34 từ").
- Vùng chạm nút phát âm ≥ 48×48px kể cả khi icon nhỏ hơn.

## 8. Bảo mật & dữ liệu

Dữ liệu bài học là nội dung tĩnh trong bundle. Màn hình này **chỉ đọc** Dexie (để tính tiến độ),
không ghi. Không gọi mạng, không telemetry.

`speechSynthesis` chỉ đọc câu ví dụ và từ vựng trong giáo trình — không bao giờ truyền dữ liệu
người dùng. Một số trình duyệt tổng hợp giọng trên máy chủ; nội dung gửi đi là câu sách giáo
khoa công khai, không phát sinh rủi ro.

## 9. Tiêu chí nghiệm thu

- [ ] `/hoc` hiện 25 thẻ, 1 cột ở 390px và 2 cột từ 768px
- [ ] Bài chưa có bản dịch `vi` hiện rõ trạng thái đó, không vỡ bố cục, không bấm được
- [ ] `/hoc/5` giữ đúng thứ tự Từ vựng → Ngữ pháp → Câu ví dụ, bề rộng `max-w-2xl`
- [ ] Tắt furigana trong Cài đặt → `rt` ẩn, **chiều cao dòng không nhảy**
- [ ] Bật Study Mode → bản dịch mờ, chạm/hover thì rõ
- [ ] Nút 🔊 đọc đúng tiếng Nhật; máy không có giọng `ja-JP` thì nút biến mất hẳn
- [ ] Nhóm động từ hiện cả màu lẫn chữ "Nhóm 1/2/3"
- [ ] Bôi đen một câu ví dụ rồi copy → ra text sạch, không lẫn furigana
- [ ] Đúng **một** nút `default` trên trang chi tiết ("Luyện tập bài này")
- [ ] Xem ở 390px và 1280px, cả chế độ sáng lẫn tối

## 10. Khối lệnh bàn giao thiết kế

Dán nguyên khối dưới đây kèm `web/DESIGN.md` vào Stitch / Claude Design.

---

Nạp `DESIGN.md` làm hợp đồng token. Ba ràng buộc bắt buộc:

1. Chỉ dùng token màu theo tên (`bg-primary`, `text-muted-foreground`), **tuyệt đối không
   hardcode mã hex**.
2. Mobile-first: dựng bố cục 390px trước, rồi mới mở rộng lên 1024px.
3. Mọi chữ tiếng Nhật phải bọc trong phần tử có class `jp`.

Dựng hai màn hình cho một app học tiếng Nhật theo giáo trình Minna no Nihongo.

**A. Danh sách bài học**, bề rộng tối đa `max-w-5xl`. Lưới thẻ `card`: 1 cột ở 390px, 2 cột
từ 768px. Mỗi thẻ chứa số bài, tiêu đề tiếng Việt (bậc H3), tiêu đề tiếng Nhật (class `jp`,
bậc `jp-inline`), một thanh tiến độ mảnh 4px, và số từ vựng đã thuộc dạng "12/34 từ". Thẻ
của bài chưa có bản dịch hiển thị ở trạng thái vô hiệu: `opacity-50`, nhãn "Chưa có bản dịch",
không bấm được.

**B. Chi tiết bài học**, bề rộng tối đa `max-w-2xl` (672px) để giữ độ dài dòng dễ đọc.
Thứ tự khối cố định, không được đảo: Từ vựng → Ngữ pháp → Câu ví dụ.

- Header: "Bài 5", tiêu đề tiếng Việt, tiêu đề tiếng Nhật, thanh tiến độ.
- Từ vựng: bảng thật (`<table>`), cột từ tiếng Nhật ở bậc `jp-vocab` 18px có furigana, cột
  nghĩa tiếng Việt, một nút icon loa để phát âm, và với động từ thì thêm nhãn nhóm
  (`verb-badge-group-1/2/3`) — nhãn **phải có cả màu lẫn chữ "Nhóm 1/2/3"**.
- Ngữ pháp: mỗi điểm là một khối gồm tiêu đề H2 tiếng Việt, khối mẫu câu
  (`grammar-pattern-block`: nền `muted`, `rounded-lg`, `p-4`), đoạn giải thích tiếng Việt,
  danh sách câu ví dụ (tiếng Nhật ở bậc `jp-example` 20px kèm bản dịch tiếng Việt và nút loa),
  và cuối khối là dòng nguồn sách ở bậc Small màu `muted-foreground`.
- Cuối trang: một nút chính duy nhất "Luyện tập bài này", cỡ `quiz` (cao 48px).

Chữ tiếng Nhật luôn `line-height: 2`. Furigana render bằng thẻ `<ruby>`/`<rt>` gốc của HTML,
**không dùng overlay CSS hay định vị tuyệt đối**. Bản dịch tiếng Việt bọc trong phần tử có
class `translation` để chế độ học chủ động có thể làm mờ nó.

Mọi phần tử bấm được cần đủ sáu trạng thái: Mặc định, Hover (chỉ khi `(hover: hover)`), Focus
(ring 3px, không bao giờ tắt), Active (dịch xuống 1px), Disabled (`opacity-50`), Loading.
Nút icon loa vẫn phải có vùng chạm tối thiểu 48×48px.

Trang chừa `pb-24` cho thanh nav đáy. Hoạt ảnh bọc trong `@media (prefers-reduced-motion:
no-preference)`.

Cần cả chế độ sáng và tối.

---

> **Không** dùng file Stitch export để ghi đè `web/src/app/globals.css`. Bản export đổi màu
> về hex, bỏ toàn bộ chế độ tối, và mất lớp `@theme inline` — chính là thứ cho phép class
> `.dark` ghi đè token lúc chạy (`design-system.md` §12).
