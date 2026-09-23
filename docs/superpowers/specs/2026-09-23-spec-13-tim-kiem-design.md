# Thiết kế SPEC-13 — Hộp tìm kiếm toàn cục `Ctrl+K`

Ngày: 23/09/2026  
Mã: SPEC-JPN-F13  
Trạng thái: Approved design doc  
Nguồn tham chiếu: [SPEC-13](file:///d:/Projects/Lab/Japanese/docs/specs/SPEC-13-tim-kiem.md), [DESIGN.md](file:///d:/Projects/Lab/Japanese/DESIGN.md), [mock/27-tim-kiem.png](file:///d:/Projects/Lab/Japanese/mock/27-tim-kiem.png).

---

## 1. Mục tiêu & Phạm vi

### Trong phạm vi
- **Hộp thoại tìm kiếm `Ctrl+K` / `Cmd+K`:**
  - Kích hoạt qua phím tắt toàn cục `Ctrl+K` / `Cmd+K` và nút kính lúp trên giao diện (sidebar desktop và header mobile).
  - Quét tức thời trên toàn bộ nội dung tĩnh (~1.500 mục): 991 từ vựng, 141 điểm ngữ pháp, 169 chữ Kanji, 156 động từ, 10 bảng tham chiếu, 25 bài học.
  - Chuẩn hóa đa năng: tiếng Việt không dấu (`đ` → `d`), chữ Hán, Hiragana, Katakana, và Romaji (chuyển đổi qua `wanakana.toKana`).
  - Xếp hạng 3 mức: Khớp chính xác → Khớp đầu chuỗi → Khớp chứa trong chuỗi.
  - Phân nhóm kết quả cố định: TỪ VỰNG → NGỮ PHÁP → KANJI → ĐỘNG TỪ → BẢNG THAM CHIẾU → BÀI HỌC (tối đa 5 mục/nhóm, tối đa 20 mục tổng cộng).
  - Điều hướng bàn phím chuẩn WAI-ARIA Combobox + Listbox: `↑`/`↓` di chuyển mục chọn xuyên nhóm, `Enter` mở đích đến, `Esc` đóng và trả focus, `Tab` không đóng hộp.
  - Điều hướng đích chính xác: neo tới đúng `#vocab-<id>` hoặc `#grammar-<id>` trong bài học, `/hoc/tra-cuu/kanji/<chu>`, `/hoc/tra-cuu/dong-tu?q=<masu>`, `/hoc/tra-cuu/bang/<slug>`.

### Ngoài phạm vi
- Tìm trong dữ liệu tiến độ người dùng (`reviewItems`, `practiceSessions`).
- Tìm kiếm mờ (fuzzy search, Levenshtein).
- Lưu lịch sử tìm kiếm vào `localStorage` hay Dexie.
- Thư viện tìm kiếm bên thứ ba (Fuse.js, cmdk) — giải thuật JavaScript thuần túy duyệt 1.500 mục < 1ms.

---

## 2. Kiến trúc Dữ liệu & Xử lý Tìm kiếm (`src/lib/search.ts`)

### 2.1. Cấu trúc Mục Tìm kiếm (`SearchEntry`)
```ts
export type SearchKind = 'vocab' | 'grammar' | 'kanji' | 'verb' | 'table' | 'lesson';

export interface SearchEntry {
  id: string;
  kind: SearchKind;
  label: string;       // Chuỗi tiếng Nhật notation Furigana hoặc tên bài
  sublabel: string;    // Nghĩa tiếng Việt hoặc cách đọc
  keys: string[];      // Mảng các chuỗi chuẩn hóa phục vụ so khớp
  lesson?: number;
  badge?: string;      // Badge hiển thị: "Bài X", "Y nét", "Nhóm Z"
  href: string;        // Đường dẫn điều hướng chính xác
}
```

### 2.2. Quy trình Chuẩn hóa (`normalizeSearchText`)
1. Chuyển thành chữ thường: `.toLowerCase()`.
2. Gộp khoảng trắng thừa.
3. Bỏ dấu tiếng Việt: `.normalize('NFD').replace(/\p{Diacritic}/gu, '')`.
4. **Thay thế ký tự đặc thù tiếng Việt `đ`/`Đ` thành `d`**: `.replace(/[đĐ]/g, 'd')`. (Ca kiểm thử: `dong tu` khớp `động từ`, `do an` khớp `đồ ăn`).
5. Xóa bỏ Furigana bracket notation bằng `stripFurigana()`.

### 2.3. Quy trình So khớp và Xếp hạng (`executeSearch`)
- Chuẩn hóa từ khóa tìm kiếm:
  - `qNorm = normalizeSearchText(query)`
  - `qKana = wanakana.toKana(query.toLowerCase())` (cho phép gõ `gakusei` khớp `がくせい` và `学生`).
- Đánh giá từng mục theo 3 tầng ưu tiên:
  - **Tầng 1 (Chính xác):** có key trùng hệt `qNorm` hoặc `qKana`.
  - **Tầng 2 (Bắt đầu):** có key bắt đầu bằng `qNorm` hoặc `qKana`.
  - **Tầng 3 (Chứa trong):** có key chứa `qNorm` hoặc `qKana`.
- Phân nhóm và cắt giới hạn:
  - Giữ thứ tự nhóm cố định: `vocab` → `grammar` → `kanji` → `verb` → `table` → `lesson`.
  - Tối đa 5 mục mỗi nhóm.
  - Tổng số kết quả hiển thị tối đa 20 mục. Nếu tổng số kết quả khớp > 20, hiển thị dòng gợi ý: `"Còn n kết quả — gõ thêm để thu hẹp"`.

### 2.4. Nạp Chỉ mục Lazy (Dynamic Import)
Chỉ mục ~1.500 mục được khởi tạo khi hộp tìm kiếm được mở lần đầu (hoặc chạy trong background khi nhàn rỗi), bảo đảm bundle trang chủ không tăng thêm kích thước.

---

## 3. Giao diện & Trải nghiệm Người dùng (`SearchDialog.tsx`)

### 3.1. Desktop Layout
- Modal nổi neo cách đỉnh màn hình 15%, chiều rộng `max-w-xl` (576px), nền tối mờ `bg-black/50 backdrop-blur-xs`.
- Header: Input tìm kiếm tự động focus, icon kính lúp, placeholder `"Tìm từ vựng, ngữ pháp, kanji…"`, nút xóa input `X`.
- Thân: Danh sách cuộn tối đa `max-h-[60vh]`.
  - Tiêu đề nhóm viết hoa nhỏ: `TỪ VỰNG`, `NGỮ PHÁP`, `KANJI`, `ĐỘNG TỪ`, `BẢNG THAM CHIẾU`, `BÀI HỌC`.
  - Mỗi hàng kết quả (cao ≥ 48px): Furigana tiếng Nhật bên trái, nghĩa tiếng Việt ở giữa, badge bài học bên phải.
  - Mục đang chọn (active): Nền `bg-muted` **kèm viền trái đỏ `border-l-2 border-l-primary`**. Tự động cuộn vào tầm nhìn (`scrollIntoView`).
- Chân: Thanh phím tắt mảnh `"↑↓ di chuyển · ↵ mở · esc đóng"` (ẩn trên mobile).

### 3.2. Mobile Layout (390px theo `mock/27-tim-kiem.png`)
- Chiếm toàn màn hình (`fixed inset-0 bg-background`).
- Input tìm kiếm có nút "Hủy" màu đỏ Washi bên phải.
- Nút kích hoạt kính lúp vùng chạm 48×48px đặt tại header trang `/hoc` và `/hoc/tra-cuu`.

### 3.3. Các Trạng thái Giao diện
1. **Chưa gõ gì:** Khối gợi ý hướng dẫn:
   - Dòng mô tả: `"Tìm bằng chữ Hán, kana, romaji hoặc tiếng Việt"`
   - 4 chip bấm được: `学生`, `がくせい`, `gakusei`, `hoc sinh`.
2. **Không có kết quả:** Thông báo `"Không tìm thấy \"〈truy vấn〉\""` kèm gợi ý thử gõ romaji hoặc bỏ dấu.
3. **Đang nạp chỉ mục:** 3 dòng skeleton mờ nhạt, ô input vẫn gõ được ngay lập tức.

---

## 4. Accessibility & Tương tác Bàn phím

- Bẫy focus chuẩn `dialog`: Focus luôn nằm trong input, di chuyển mũi tên cập nhật `aria-activedescendant` mà không dời focus thực tế.
- Input: `role="combobox"`, `aria-expanded`, `aria-controls="search-results-list"`, `aria-activedescendant`.
- Listbox: `<ul id="search-results-list" role="listbox">`.
- Options: `<li role="option" aria-selected={isActive}>`.
- Thông báo số lượng kết quả cho screen reader bằng `aria-live="polite"`.
- `Tab` không đóng hộp; chỉ `Esc` hoặc bấm ra ngoài nền mới đóng. Đóng hộp trả focus về đúng phần tử trước đó.
