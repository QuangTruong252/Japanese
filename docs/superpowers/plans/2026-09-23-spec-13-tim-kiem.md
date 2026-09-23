# Kế hoạch triển khai SPEC-13 — Hộp tìm kiếm toàn cục `Ctrl+K`

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hộp tìm kiếm toàn cục siêu tốc mở bằng phím tắt `Ctrl+K` / `Cmd+K` và nút kính lúp giao diện, cho phép tìm kiếm trên ~1.500 mục nội dung tĩnh (từ vựng, ngữ pháp, kanji, động từ, bảng tham chiếu, bài học) bằng chữ Hán, kana, romaji và tiếng Việt không dấu (đặc thù `đ` → `d`), tuân thủ chuẩn ARIA combobox/listbox theo đặc tả SPEC-13 và mockup `mock/27-tim-kiem.png`.

**Architecture:**
- Mô-đun dữ liệu thuần `src/lib/search.ts` kiểm thử 100% bằng unit tests: thuật toán chuẩn hóa tiếng Việt bỏ dấu + chuyển đổi Romaji/Kana (`wanakana`), xây dựng chỉ mục ~1.500 mục tĩnh, giải thuật xếp hạng 3 tầng (chính xác → đầu chuỗi → chứa trong chuỗi).
- Quản lý trạng thái hộp thoại thông qua Zustand `useUIStore`: `isSearchOpen`, `openSearch`, `closeSearch`, `toggleSearch`.
- Component `SearchDialog.tsx`: Xây dựng bằng `dialog` modal theo chuẩn ARIA, điều hướng bàn phím `↑`/`↓`/`Enter`/`Esc`, bẫy focus, hỗ trợ cả giao diện nổi desktop và toàn màn hình mobile.
- Tích hợp toàn diện: Gắn `SearchDialog` vào `layout.tsx`, thêm nút tìm kiếm trên sidebar desktop `AppNav.tsx` và header các trang `/hoc`, `/hoc/tra-cuu`.

---

## Global Constraints

- **Chuẩn hóa tiếng Việt (SPEC-13 §2.2):** Bỏ dấu NFD và **bắt buộc thay `đ` → `d`, `Đ` → `D`** để gõ `dong tu` ra `động từ`, `do an` ra `đồ ăn`.
- **Hỗ trợ Romaji (SPEC-13 §2.2):** Tự động chuyển đổi romaji sang kana bằng `wanakana.toKana()` (gõ `gakusei` ra `学生`).
- **Thứ tự nhóm cố định (SPEC-13 §2.3):** TỪ VỰNG → NGỮ PHÁP → KANJI → ĐỘNG TỪ → BẢNG THAM CHIẾU → BÀI HỌC (tối đa 5 mục/nhóm, tối đa 20 mục tổng cộng).
- **Không dùng thư viện tìm kiếm cồng kềnh (SPEC-13 §2.1 & §4):** Không thêm `cmdk`, Fuse.js; sử dụng thuật toán JavaScript tối ưu duyệt 1.500 mục < 1ms.
- **Tương tác bàn phím (SPEC-13 §6 & §7):** `Tab` không đóng hộp; chỉ `Esc` và bấm nền mới đóng; focus luôn nằm ở ô nhập liệu.

---

### Task 1: Thư viện thuần `src/lib/search.ts` và Unit Tests

**Files:**
- Create: `web/src/lib/search.ts`
- Create: `web/src/lib/search.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type SearchKind = 'vocab' | 'grammar' | 'kanji' | 'verb' | 'table' | 'lesson';
  export interface SearchEntry {
    id: string;
    kind: SearchKind;
    label: string;
    sublabel: string;
    keys: string[];
    lesson?: number;
    badge?: string;
    href: string;
  }
  export function normalizeSearchText(text: string): string;
  export function buildSearchIndex(): Promise<SearchEntry[]>;
  export function executeSearch(
    entries: SearchEntry[],
    query: string
  ): { results: SearchEntry[]; totalMatches: number };
  ```

- [ ] **Step 1: Viết unit tests `web/src/lib/search.test.ts`**
1. Kiểm tra `normalizeSearchText`:
   - Bỏ dấu tiếng Việt thông thường: `"học sinh"` → `"hoc sinh"`.
   - Chuyển `đ` / `Đ` thành `d`: `"động từ"` → `"dong tu"`, `"Đồ ăn"` → `"do an"`.
   - Xóa bỏ ký hiệu Furigana notation: `"学生[がくせい]"` → `"学生"`.
   - Chữ thường và gộp khoảng trắng thừa.
2. Kiểm tra `executeSearch` với các từ khóa:
   - Gõ `gakusei` → kết quả chứa `学生`.
   - Gõ `がくせい` → kết quả chứa `学生`.
   - Gõ `学生` → kết quả chứa `学生`.
   - Gõ `hoc sinh` → kết quả chứa `学生`.
   - Gõ `học sinh` (có dấu) → cho cùng kết quả với `hoc sinh`.
   - Gõ `dong tu` → ra `động từ`.
   - Gõ `do an` → ra `đồ ăn`.
3. Kiểm tra xếp hạng: Khớp chính xác xếp trước khớp đầu chuỗi, khớp đầu chuỗi xếp trước khớp chứa trong chuỗi.
4. Kiểm tra giới hạn: Tối đa 5 mục/nhóm, tối đa 20 mục tổng cộng, thứ tự nhóm cố định.

- [ ] **Step 2: Chạy unit test để xác nhận FAIL ban đầu**
Run: `cd web && node --test src/lib/search.test.ts`

- [ ] **Step 3: Cài đặt mã nguồn `web/src/lib/search.ts`**
Cài đặt `normalizeSearchText`, `buildSearchIndex` (tổng hợp từ 25 vocab, 25 lessons, 169 kanji, 156 verbs, 10 reference tables), `executeSearch`.

- [ ] **Step 4: Chạy lại unit test để xác nhận PASS 100%**
Run: `cd web && node --test src/lib/search.test.ts`

- [ ] **Step 5: Kiểm tra static types**
Run: `cd web && pnpm check`

---

### Task 2: Cập nhật Trạng thái Store `src/lib/store.ts`

**Files:**
- Modify: `web/src/lib/store.ts`

**Interfaces:**
- Thêm `isSearchOpen: boolean`, `openSearch: () => void`, `closeSearch: () => void`, `toggleSearch: () => void`.

- [ ] **Step 1: Bổ sung các action tìm kiếm vào `useUIStore`**
- [ ] **Step 2: Kiểm tra typecheck**
Run: `cd web && pnpm check`

---

### Task 3: Component `SearchDialog.tsx`

**Files:**
- Create: `web/src/components/search/SearchDialog.tsx`

**Interfaces:**
- Consumes: `useUIStore`, `buildSearchIndex`, `executeSearch`, `SearchEntry`, `Furigana` từ `@/components/Furigana`, `Search`, `X`, `CornerDownLeft` từ `lucide-react`.

- [ ] **Step 1: Xây dựng `SearchDialog.tsx` (Client Component)**
1. Quản lý trạng thái:
   - `query`: chuỗi tìm kiếm hiện tại.
   - `selectedIndex`: vị trí mục đang được highlight bằng bàn phím.
   - `searchIndex`: danh sách entries (nạp lazy lần đầu khi mở hộp).
   - `isLoadingIndex`: cờ đang nạp chỉ mục ban đầu.
2. Xử lý bàn phím:
   - Toàn cục: lắng nghe `keydown` phím `Ctrl+K` và `Cmd+K` để gọi `openSearch()` kèm `e.preventDefault()`.
   - Trong hộp thoại:
     - `ArrowDown`: `setSelectedIndex((prev) => (prev + 1) % totalResults)`.
     - `ArrowUp`: `setSelectedIndex((prev) => (prev - 1 + totalResults) % totalResults)`.
     - `Enter`: điều hướng tới `results[selectedIndex].href` và gọi `closeSearch()`.
     - `Escape`: gọi `closeSearch()`.
     - `Tab`: không đóng hộp thoại, bẫy focus trong dialog.
3. Cuộn mượt:
   - Mục `selectedIndex` tự động cuộn vào tầm nhìn (`scrollIntoView({ block: 'nearest' })`).
4. Giao diện:
   - Desktop: modal nổi cách đỉnh 15%, `max-w-xl`, thanh chân phím tắt `↑↓ di chuyển · ↵ mở · esc đóng`.
   - Mobile (390px): chiếm toàn màn hình, nút "Hủy" màu đỏ, ẩn thanh chân phím tắt.
   - Mục đang chọn mang nền `bg-muted` và viền trái `border-l-2 border-l-primary`.
   - Trạng thái chưa gõ: Khối gợi ý với 4 chip bấm được: `学生`, `がくせい`, `gakusei`, `hoc sinh`.
   - Trạng thái không kết quả: "Không tìm thấy 〈truy vấn〉".
   - Trạng thái nạp: 3 skeleton rows.

- [ ] **Step 2: Kiểm tra static types**
Run: `cd web && pnpm check`

---

### Task 4: Tích hợp Giao diện & Nút bấm Kích hoạt

**Files:**
- Modify: `web/src/app/layout.tsx`
- Modify: `web/src/components/AppNav.tsx`
- Modify: `web/src/app/hoc/page.tsx`
- Modify: `web/src/app/hoc/tra-cuu/page.tsx`

- [ ] **Step 1: Nhúng `SearchDialog` vào `layout.tsx`**
Đặt `<SearchDialog />` ở tầng gốc để luôn sẵn sàng phản hồi `Ctrl+K` từ mọi trang.

- [ ] **Step 2: Thêm nút kích hoạt tìm kiếm trong Sidebar Desktop `AppNav.tsx`**
Nút tìm kiếm có icon kính lúp, nhãn "Tìm kiếm...", phím tắt `⌘K` / `Ctrl+K`.

- [ ] **Step 3: Thêm nút kính lúp mobile trên header `/hoc` và `/hoc/tra-cuu`**
Nút kích hoạt vùng chạm 48×48px theo đúng mockup `mock/22-tra-cuu.png`.

- [ ] **Step 4: Kiểm tra static types**
Run: `cd web && pnpm check`

---

### Task 5: Kiểm chứng Toàn diện & Handoff

**Files:**
- Create: `docs/handoff/SPEC-13.md`
- Modify: `docs/specs/README.md`

- [ ] **Step 1: Chạy kiểm thử toàn bộ unit tests**
Run: `cd web && pnpm test` (bao phủ `search.test.ts`).

- [ ] **Step 2: Chạy static checks**
Run: `cd web && pnpm check` (TypeScript + ESLint).

- [ ] **Step 3: Chạy build sản phẩm**
Run: `cd web && pnpm build` (xác nhận bundle trang chủ không bị phình to).

- [ ] **Step 4: Lập tài liệu Handoff `docs/handoff/SPEC-13.md` & Cập nhật `docs/specs/README.md`**
Ghi lại ngày hoàn thành, kiến trúc tìm kiếm, chuẩn hóa bỏ dấu tiếng Việt, xếp hạng 3 tầng và bằng chứng kiểm thử đạt chuẩn.
