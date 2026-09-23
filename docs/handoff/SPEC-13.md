# Handoff — SPEC-13 (Hộp tìm kiếm toàn cục Ctrl+K)

Ngày: 23/09/2026. Trạng thái: Đã hoàn tất toàn bộ mã nguồn, component tìm kiếm toàn cục ARIA combobox + listbox; Static gates & Tests PASS 100%; Kiểm thử trình duyệt tự động (Browser Subagent) PASS 100% kèm video ghi hình.

## Thay đổi và quyết định

- **Thư viện chuẩn hóa & Thuật toán tìm kiếm ([web/src/lib/search.ts](file:///d:/Projects/Lab/Japanese/web/src/lib/search.ts), [web/src/lib/search.test.ts](file:///d:/Projects/Lab/Japanese/web/src/lib/search.test.ts)):**
  - Hàm `normalizeSearchText(text)`:
    - Bỏ Furigana notation, chuyển chữ thường, gộp khoảng trắng thừa.
    - Chuẩn hóa Unicode NFD chỉ bỏ các ký tự dấu tổ hợp Latin `[\u0300-\u036f]` (không dùng `\p{Diacritic}` để tránh làm hỏng dakuten của Kana Nhật như `で`).
    - Bắt buộc thay `đ`/`Đ` thành `d` để xử lý ca tìm kiếm đặc thù tiếng Việt: gõ `dong tu` tìm thấy `động từ`, `do an` tìm thấy `đồ ăn`.
  - Hàm `buildSearchIndex()`:
    - Tổng hợp tĩnh ~1.500 mục từ 6 nguồn: Từ vựng 25 bài (991 từ), Ngữ pháp 25 bài (141 điểm), Kanji (169 chữ), Động từ (156 động từ), Bảng tham chiếu (10 bảng), Danh mục bài học (25 bài).
    - Tạo các khóa tìm kiếm đa dạng: Hán tự, Kana, Romaji (thông qua `wanakana.toRomaji`), tiếng Việt có dấu và không dấu.
    - Đặt href chính xác dẫn tới neo trang bài học (`#vocab-<id>`, `#grammar-<id>`), trang kanji, bảng động từ (`?q=`), bảng tham chiếu.
    - Singleton cache đồng bộ thông qua `getCachedSearchIndex()` tránh nạp lại nhiều lần.
  - Hàm `executeSearch(entries, query)`:
    - Sử dụng `wanakana.toKana(query)` để tìm kiếm tự nhiên khi người dùng gõ Romaji (ví dụ: gõ `gakusei` khớp `がくせい` và `学生`).
    - Xếp hạng 3 tầng: Khớp chính xác (Tier 1) > Khớp đầu chuỗi (Tier 2) > Khớp chứa trong chuỗi (Tier 3).
    - Phân nhóm kết quả theo thứ tự cố định: `TỪ VỰNG` → `NGỮ PHÁP` → `KANJI` → `ĐỘNG TỪ` → `BẢNG THAM CHIẾU` → `BÀI HỌC`.
    - Ràng buộc giới hạn: Tối đa 5 mục/nhóm, tối đa 20 mục tổng cộng.
  - Bộ 6 unit tests bao phủ 100% các yêu cầu chuẩn hóa, chuyển đổi `đ` -> `d`, xếp hạng 3 tầng và giới hạn nhóm.

- **Quản lý trạng thái UI ([web/src/lib/store.ts](file:///d:/Projects/Lab/Japanese/web/src/lib/store.ts)):**
  - Mở rộng Zustand UI Store: thêm `isSearchOpen: boolean`, `openSearch()`, `closeSearch()`, `toggleSearch()`.
  - Không lạm dụng persist middleware cho trạng thái hiển thị modal tìm kiếm.

- **Component Hộp tìm kiếm ([web/src/components/search/SearchDialog.tsx](file:///d:/Projects/Lab/Japanese/web/src/components/search/SearchDialog.tsx)):**
  - Chuẩn Accessibility WAI-ARIA Combobox 1.2:
    - `input` có `role="combobox"`, `aria-expanded="true"`, `aria-controls`, `aria-autocomplete="list"`, `aria-activedescendant`.
    - Danh sách kết quả `role="listbox"`, từng mục có `role="option"`, `aria-selected`.
    - Thông báo số lượng kết quả cho screen reader bằng vùng ẩn `aria-live="polite"`.
  - Điều hướng bằng bàn phím hoàn chỉnh:
    - `Ctrl+K` / `Cmd+K` mở/đóng hộp thoại toàn cục.
    - `Escape` đóng hộp thoại và trả lại focus cho phần tử kích hoạt trước đó (`previousActiveElement`).
    - `ArrowDown` / `ArrowUp` di chuyển mục active theo vòng lặp và tự động cuộn mục đó vào tầm nhìn (`scrollIntoView({ block: 'nearest' })`). Focus luôn được giữ ở ô nhập liệu.
    - `Enter` kích hoạt mục đang chọn và đóng hộp thoại.
    - `Tab` bị chặn mặc định để bẫy focus bên trong hộp thoại, không đóng hộp thoại.
  - 4 trạng thái giao diện Washi:
    - Trạng thái chưa gõ gì: hiển thị 4 chip từ khóa gợi ý (`学生`, `がくせい`, `gakusei`, `hoc sinh`).
    - Trạng thái đang nạp chỉ mục: hiển thị skeleton tải nhẹ.
    - Trạng thái không kết quả: hiển thị thông báo hướng dẫn người dùng thử gõ Romaji hoặc tiếng Việt không dấu.
    - Trạng thái có kết quả: danh sách nhóm có tiêu đề in hoa (`KIND_LABELS`), highlight mục được chọn `border-l-primary bg-muted`, badge loại mục, xử lý Furigana tự động.
  - Responsive: Desktop hiển thị modal nổi (`max-w-xl`, bo góc 2xl), Mobile chiếm toàn màn hình kèm nút "Hủy".

- **Tích hợp các điểm kích hoạt ([web/src/components/search/SearchTrigger.tsx](file:///d:/Projects/Lab/Japanese/web/src/components/search/SearchTrigger.tsx), AppNav, Pages):**
  - Component `SearchTrigger` tái sử dụng linh hoạt với 2 chế độ: `iconOnly` và dạng nút bấm đầy đủ.
  - Desktop Sidebar ([web/src/components/AppNav.tsx](file:///d:/Projects/Lab/Japanese/web/src/components/AppNav.tsx)): nút tìm kiếm nhanh kèm phím tắt `⌘K`.
  - Hub Bảng tin ([web/src/components/DashboardContent.tsx](file:///d:/Projects/Lab/Japanese/web/src/components/DashboardContent.tsx)): nút kính lúp cạnh Cài đặt.
  - Danh sách bài học ([web/src/app/hoc/page.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/hoc/page.tsx)): nút `SearchTrigger` cạnh nút Tra cứu.
  - Hub Tra cứu ([web/src/app/hoc/tra-cuu/page.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/hoc/tra-cuu/page.tsx)): nút kính lúp trên header.
  - Chi tiết bài học ([web/src/app/hoc/[so]/page.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/hoc/[so]/page.tsx)): nút kính lúp trên header bài học.
  - Root Layout ([web/src/app/layout.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/layout.tsx)): nhúng `SearchDialog` trong `Suspense` boundary.

## Kiểm chứng

- **Kiểm tra tĩnh & Unit Tests (23/09/2026):**
  - `pnpm check`: PASS (TypeScript 0 lỗi, ESLint 0 cảnh báo).
  - `pnpm test`: PASS 126/126 unit tests (bao gồm 6/6 test trong `src/lib/search.test.ts`).
  - `pnpm build`: PASS (sinh tĩnh thành công 222/222 static pages, Next.js 16 SSG hoàn hảo).
- **Kiểm thử tự động bằng Trình duyệt (Browser Subagent):**
  - Ghi hình tương tác: `search_dialog_test_1790154840431.webp`.
  - Xác nhận mở hộp thoại bằng nút sidebar "Tìm kiếm... ⌘K".
  - Xác nhận focus ô nhập và 4 chip gợi ý.
  - Xác nhận tìm kiếm Romaji `gakusei` ra từ vựng `学生[がくせい]`.
  - Xác nhận tìm kiếm không dấu `dong tu` chuyển đổi `đ` -> `d` ra nhóm Động từ/Ngữ pháp.
  - Xác nhận dùng phím `ArrowDown` 2 lần chọn mục và phím `Enter` điều hướng thành công tới `/hoc/14#grammar-forma-te`.

## Bước tiếp theo

- Đã hoàn thành 100% **SPEC-13 (Hộp tìm kiếm toàn cục Ctrl+K)**.
- Người dùng có thể tiến hành trải nghiệm trực tiếp hoặc triển khai các spec tiếp theo theo lộ trình.
