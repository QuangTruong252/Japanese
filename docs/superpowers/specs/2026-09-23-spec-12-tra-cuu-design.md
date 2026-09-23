# Thiết kế SPEC-12 — Tra cứu: Kanji, Động từ & 10 Bảng tham chiếu

Ngày: 23/09/2026  
Mã: SPEC-JPN-F12  
Trạng thái: Approved design doc  
Nguồn tham chiếu: [SPEC-12](file:///d:/Projects/Lab/Japanese/docs/specs/SPEC-12-tra-cuu.md), [DESIGN.md](file:///d:/Projects/Lab/Japanese/DESIGN.md), [mock/22-tra-cuu.png](file:///d:/Projects/Lab/Japanese/mock/22-tra-cuu.png) đến [mock/26-bang-tham-chieu.png](file:///d:/Projects/Lab/Japanese/mock/26-bang-tham-chieu.png).

---

## 1. Mục tiêu & Phạm vi

### Trong phạm vi
- **`/hoc/tra-cuu` (Hub tra cứu):**
  - Trang trung tâm điều hướng tới 3 khu vực: Kanji (169 chữ N5), Động từ (156 động từ, 5 thể), Bảng tham chiếu (10 bảng).
  - Khung giao diện chuẩn Washi (`max-w-2xl`), icon theo spec (`Languages`, `Repeat2`, `Table2`).
- **`/hoc/tra-cuu/kanji` (Lưới 169 chữ Kanji):**
  - Bố cục lưới responsive (`max-w-5xl`): 4 cột ở mobile 390px, 6-8 cột ở màn hình lớn, mỗi ô tối thiểu 48×48px.
  - Bộ lọc: theo bài (Tất cả, bài 1–25), theo số nét, và switch "Chỉ chữ đã học".
  - Sắp xếp: theo bài (mặc định) hoặc theo số nét.
  - Trạng thái rỗng: thông báo "Không có chữ nào khớp bộ lọc" kèm nút "Xóa bộ lọc".
- **`/hoc/tra-cuu/kanji/[chu]` (Chi tiết một chữ Kanji):**
  - Chữ Hán cỡ lớn trong khung ô vuông (`font-jp`, `lang="ja"`), badge số bài (`Bài X`), số nét (`Y nét`).
  - Nghĩa tiếng Việt, các âm On và Kun kèm nút phát âm `SpeakButton`.
  - Danh sách từ ghép (`examples`): từ có Furigana, nghĩa tiếng Việt, nút phát âm. Với 431/907 ví dụ chưa dịch (`vi === en`), hiển thị nhãn `[Chưa xác minh]` và không hiển thị tiếng Anh giả làm tiếng Việt.
  - Danh sách "Từ vựng trong giáo trình có chứa chữ này": quét từ chỉ mục tra ngược runtime, hiển thị kèm số bài và phát âm.
  - Hàng "Chữ dễ nhầm" (`similar`): các chữ Hán liên quan có thể bấm để chuyển sang trang chi tiết chữ đó.
- **`/hoc/tra-cuu/dong-tu` (Bảng 156 Động từ 5 thể):**
  - Bảng HTML semantic `<table>` 7 cột: Động từ (gốc + furigana), ます, て, từ điển, ない, た, Nghĩa, Bài.
  - Cột đầu "Động từ" ghim cố định (`sticky left-0 bg-card z-10`), khung cuộn ngang có `tabindex="0"` và `aria-label`.
  - Bộ lọc nhóm (Tất cả, Nhóm 1, Nhóm 2, Nhóm 3) dùng màu `--verb-1`, `--verb-2`, `--verb-3` luôn kèm chữ "Nhóm 1/2/3".
  - Bộ lọc theo bài (Tất cả, 1–25).
  - Tìm kiếm `?q=`: tìm trên dạng ます, thể từ điển và nghĩa tiếng Việt; cuộn tới dòng khớp đầu tiên và highlight `bg-accent`.
- **`/hoc/tra-cuu/bang` & `/hoc/tra-cuu/bang/[slug]` (10 Bảng tham chiếu):**
  - Trang danh mục `/hoc/tra-cuu/bang` liệt kê 10 bảng chuyên đề kèm mô tả.
  - Trang chi tiết `/hoc/tra-cuu/bang/[slug]` render semantic theo cấu trúc section/tables/note của từng file.
  - Giữ nguyên đúng 8 ô header rỗng có chủ đích (`vi: ""`), không lấp bằng ký tự giả.
- **Chỉ mục tra ngược Kanji ↔ Từ vựng:**
  - Quét 25 file từ vựng bằng `stripFurigana(word)` và regex Kanji, dựng `Map<string, VocabWordRef[]>` tại runtime.
  - Tính năng "Chữ đã học": Kanji được tính là đã học nếu có ít nhất một từ vựng chứa chữ đó nằm trong `db.reviewItems`.

### Ngoài phạm vi
- Hộp tìm kiếm phím tắt `Ctrl+K` (thuộc SPEC-13).
- Sinh câu hỏi ôn tập Kanji từ màn tra cứu (màn tra cứu là khu vực **chỉ đọc**).
- Ghi dữ liệu hoặc thêm tab thứ 6 vào thanh navigation đáy.

---

## 2. Kiến trúc Dữ liệu & Module `src/lib/lookup.ts`

### 2.1. Quản lý Dữ liệu Tĩnh
- 169 chữ Kanji: tổng hợp chỉ mục từ các file `src/data/n5/kanji/*.json` (khoảng 170KB tổng kích thước).
- 156 động từ: import từ `src/data/n5/verbs/verbs.json`.
- 10 bảng tham chiếu: import từ `src/data/n5/reference/*.json`.
- 25 bài từ vựng: tái sử dụng `VOCAB_LOADERS` từ `src/lib/lessons.ts` để dựng chỉ mục tra ngược.

### 2.2. Xây dựng Chỉ mục Tra ngược Runtime
```ts
export interface VocabRef {
  id: string;
  targetId: string;
  lesson: number;
  word: string;
  kana: string;
  meaning: { vi: string; en?: string };
}

// Map từ ký tự Kanji (vd '人') sang danh sách từ vựng trong 25 bài chứa chữ đó
export function buildKanjiVocabIndex(vocabFiles: Array<{ lesson: number; words: VocabWord[] }>): Map<string, VocabRef[]>;
```

### 2.3. Quy tắc Xác thực & Trung thực Dữ liệu (SPEC-12 §2.1 & §5)
- Hàm `isExampleVerified(example: KanjiExample): boolean`:
  - Trả về `false` nếu `example.meaning.vi.trim().toLowerCase() === example.meaning.en.trim().toLowerCase()`.
  - Khi không được xác minh: giao diện hiển thị badge `Chưa xác minh`, không hiển thị chuỗi tiếng Anh như thể là tiếng Việt.

---

## 3. Giao diện & Trải nghiệm Người dùng

### 3.1. Hub Tra cứu (`/hoc/tra-cuu`)
- Bề rộng `max-w-2xl`, nút quay lại `< Học bài` (`/hoc`).
- Tiêu đề `Tra cứu`, mô tả `Chọn nội dung bạn muốn xem lại.`
- 3 Card lớn với icon minh họa riêng và chevron mũi tên:
  1. Kanji — 169 chữ N5 (`Languages` icon)
  2. Động từ — 156 động từ · 5 thể (`Repeat2` icon)
  3. Bảng tham chiếu — 10 bảng (`Table2` icon)

### 3.2. Lưới Kanji (`/hoc/tra-cuu/kanji`)
- Bề rộng `max-w-5xl`, breadcrumb `< Tra cứu`.
- Thanh lọc:
  - Dropdown `Bài` (Tất cả, Bài 1..25).
  - Dropdown `Số nét` (Tất cả, 1..n).
  - Switch `Chỉ chữ đã học` (Disabled nếu chưa học chữ nào).
- Lưới ô vuông:
  - Chữ Hán lớn `font-jp text-3xl font-medium`.
  - Cách đọc On/Kun chính bên dưới (`text-xs text-muted-foreground`).
  - Badge nhỏ số bài (`Bài X`).
  - Chữ đã học: chấm tròn đỏ `bg-primary` ở góc kèm `aria-label="Đã học"`.

### 3.3. Chi tiết Kanji (`/hoc/tra-cuu/kanji/[chu]`)
- Bề rộng `max-w-2xl`, breadcrumb `< Tra cứu kanji`.
- Hero card:
  - Khung vuông lớn hiển thị chữ Hán (`text-5xl font-jp`).
  - Tên Hán Việt / nghĩa tiếng Việt in đậm (`text-2xl font-bold`).
  - Badges: `Bài X`, `Y nét`.
- Card Cách đọc:
  - Âm On: chữ Katakana kèm `SpeakButton`.
  - Âm Kun: chữ Hiragana kèm `SpeakButton`.
- Card Từ ghép (`Từ ghép`):
  - Mỗi dòng: Furigana, nghĩa tiếng Việt (hoặc badge `Chưa xác minh`), `SpeakButton`.
- Card Từ vựng trong bài học:
  - Danh sách từ vựng thực tế trong giáo trình Minna có chứa chữ Hán này, hiển thị badge bài học tương ứng.
- Card Chữ dễ nhầm:
  - Danh sách các chữ tương tự bấm được dẫn sang trang chi tiết chữ tương ứng.

### 3.4. Bảng Động từ (`/hoc/tra-cuu/dong-tu`)
- Bề rộng `max-w-5xl`, breadcrumb `< Tra cứu`.
- Ô tìm kiếm tự do `?q=` (lọc tức thời theo từ điển, ます và nghĩa tiếng Việt).
- Hàng chip lọc nhóm: `Tất cả`, `Nhóm 1` (màu `--verb-1`), `Nhóm 2` (màu `--verb-2`), `Nhóm 3` (màu `--verb-3`).
- Dropdown lọc theo bài (1..25).
- Bảng HTML:
  - Cột đầu tiên "Động từ" (`sticky left-0 bg-card z-10 font-bold`).
  - Các cột: `ます`, `て`, `Từ điển`, `ない`, `た`, `Nghĩa`, `Bài`.
  - Khung cuộn ngang có thanh cuộn mượt, hiển thị ghi chú "Vuốt ngang để xem các thể khác" trên mobile.

### 3.5. Bảng Tham chiếu (`/hoc/tra-cuu/bang` & `/hoc/tra-cuu/bang/[slug]`)
- Bề rộng `max-w-3xl`.
- Bảng chi tiết render đúng theo cấu trúc `sections[].tables[].headers` và `rows`.
- Xử lý các ô trống header đúng nguyên bản (`vi: ""`), không lấp ký tự giả.
- Khối `note` hiển thị thông tin hướng dẫn ở cuối bảng.

---

## 4. Accessibility & Trạng thái

- Vùng chạm tối thiểu 48×48px.
- Các bảng sử dụng thẻ `<table>`, `<th>` với `scope="col"` / `scope="row"`, `<caption>`.
- Bảng cuộn ngang có `tabindex="0"` và `aria-label` để người dùng bàn phím điều hướng được.
- Đổi bộ lọc trên URL cập nhật query string (`?bai=...&net=...`), không gây giật chuyển động lưới.
- Offline-first: dữ liệu hoàn toàn tĩnh, không phụ thuộc network.
