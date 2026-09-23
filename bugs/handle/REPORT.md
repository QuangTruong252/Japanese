# BÁO CÁO KIỂM THỬ TOÀN DIỆN GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX AUDIT)
**Dự án:** MaiPace — Ứng dụng tự học tiếng Nhật offline-first (Minna no Nihongo N5)  
**Thời gian thực hiện:** 23/09/2026  
**Môi trường kiểm thử:** 
- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Base UI / Shadcn
- Chromium / Edge Headless & Browser Subagent
- Viewports: **Desktop (1280 × 800 px)** & **Mobile (390 × 844 px)**
- Chế độ màu: **Light Mode** & **Dark Mode**  
- Hệ thiết kế đối chiếu: **Washi Design System** (`DESIGN.md`) & `SPEC-01` đến `SPEC-14`

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM THỬ

Toàn bộ các luồng màn hình chính từ Trang chủ (Dashboard), Học bài (Lesson & Shadowing Player), Luyện tập (5 dạng bài quiz), Ôn tập (FSRS & Điểm yếu), Tra cứu (Kanji, Động từ, Bảng tham chiếu), Thống kê, Cài đặt đến Modal Tìm kiếm nhanh đã được kiểm thử trực tiếp trên trình duyệt.

- **Tổng số lỗi phát hiện:** **8 Issues**
  - **P0 (Lỗi chặn luồng / Crash):** 0 lỗi
  - **P1 (Lỗi nghiêm trọng / Vỡ giao diện / A11y):** 2 lỗi
  - **P2 (Lỗi mức độ trung bình / Trùng lặp / Phân tích dữ liệu):** 4 lỗi
  - **P3 (Lỗi nhỏ / Tối ưu hiển thị):** 2 lỗi
- **Bằng chứng hình ảnh:** 36 tệp screenshot kiểm thử được lưu trữ tại `bugs/`

---

## 2. BẢNG TỔNG HỢP CÁC ISSUES PHÁT HIỆN

| Mã Bug | Mức độ | Màn hình / Thành phần | Tệp nguồn | Tóm tắt hiện tượng | Ảnh minh chứng |
|---|---|---|---|---|---|
| **BUG-01** | **P1** | Sidebar Desktop (`AppNav`) | `web/src/components/AppNav.tsx` | Nhãn `"Đồng bộ đám mây"` bị `SyncBadge` chèn ép chiều ngang, chữ bị ngắt dọc thành 4 hàng. | `bugs/01-dashboard-desktop.png` |
| **BUG-02** | **P1** | Mobile Bottom Dock & Toàn cục | `web/src/app/layout.tsx`, `web/src/components/AppNav.tsx` | Thiếu `overflow-x: hidden` và `min-w-0`, nội dung phình ngang > 390px làm Bottom Dock bị dạt sang phải, mất tab "Thống kê". | `bugs/02_hoc_grid_mobile.png`, `bugs/04_diem_yeu_mobile.png`, `bugs/09_tra_cuu_dong_tu_mobile.png` |
| **BUG-03** | **P2** | Header Dashboard & Bài học | `web/src/components/DashboardContent.tsx` | Thiếu `lg:hidden` ở cụm nút header khiến trên Desktop bị trùng lặp nút Tìm kiếm, Cài đặt và SyncBadge. | `bugs/01-dashboard-desktop.png`, `bugs/02_hoc_grid_desktop.png` |
| **BUG-04** | **P2** | Hộp thoại Tìm kiếm (Search Modal) | `web/src/components/search/SearchDialog.tsx` | Ô tìm kiếm xuất hiện cùng lúc **2 nút xóa "✕"** cạnh nhau khi gõ từ khóa do trùng native button của trình duyệt. | `bugs/07_search_results_1790170470138.png` |
| **BUG-05** | **P2** | Dữ liệu Ngữ pháp Bài 24 & Bài 12 | `web/src/data/n5/lessons/lesson-24.json` | Cặp ngoặc vuông lồng nhau `[私[わたし]に]` làm vỡ bộ tách furigana, lộ ký tự ngoặc thô `[` và `]` ra ngoài tiêu đề. | `bugs/07_search_results_1790170470138.png` |
| **BUG-06** | **P2** | Màn hình Ôn tập (`/on-tap`) | `web/src/app/on-tap/page.tsx` | Trang ôn tập bị cô lập: khi hết thẻ Due (0 thẻ) không có đường dẫn hay tab chuyển sang Bảng điểm yếu (`/on-tap/diem-yeu`). | `bugs/04_on_tap_desktop_1790170299980.png` |
| **BUG-07** | **P3** | Header Mobile (Dashboard) | `web/src/components/DashboardContent.tsx` | `SyncBadge` bị ẩn hoàn toàn trên mobile (`hidden sm:block`), người dùng điện thoại không thể biết trạng thái offline hay sync. | `bugs/01-dashboard-mobile-top.png` |
| **BUG-08** | **P3** | Tra cứu Động từ (`/tra-cuu/dong-tu`) | `web/src/components/lookup/VerbTable.tsx` | Dấu ngoặc chú thích trợ từ/tân ngữ `[友達に〜]` dính liền với động từ, bị ngắt dòng lửng lơ trên mobile. | `bugs/09_tra_cuu_dong_tu_mobile.png` |

---

## 3. CHI TIẾT TỪNG ISSUE, NGUYÊN NHÂN & PHƯƠNG ÁN XỬ LÝ

### 📌 BUG-01: Co thắt chữ và vỡ layout thanh Sidebar Desktop
- **Mức độ nghiêm trọng:** `P1 — High Impact`
- **Vị trí tệp:** `web/src/components/AppNav.tsx` (dòng 221–226)
- **Ảnh minh chứng:** `bugs/01-dashboard-desktop.png` (Góc dưới cùng bên trái Sidebar)
- **Hiện tượng:**
  Sidebar desktop có chiều rộng cố định `w-64` (256px), padding xung quanh `p-3` (24px) dẫn tới chiều rộng khả dụng còn 232px.
  Đoạn mã:
  ```tsx
  <div className="px-2 flex items-center justify-between">
    <span className="text-xs text-muted-foreground font-medium">Đồng bộ đám mây</span>
    <SyncBadge />
  </div>
  ```
  `SyncBadge` có độ dài tối thiểu khoảng 175px - 190px (icon cloud + văn bản "Đã lưu trên máy" / "Đã đồng bộ" + padding). Do đó thẻ `<span>` nhãn chỉ còn dư lại khoảng 35px - 40px chiều ngang. Trình duyệt bắt buộc phải ngắt dòng tại mỗi khoảng trắng, biến cụm từ thành 4 dòng chữ dọc:
  ```
  Đồng
  bộ
  đám
  mây
  ```
- **Nguyên nhân gốc rễ:** Ép hai phần tử có độ dài lớn vào chung một hàng ngang trong cột sidebar hẹp.
- **Phương án giải quyết:**
  Chuyển sang cấu trúc phân cấp dọc (vertical stack) theo chuẩn Washi:
  ```tsx
  <div className="px-1 space-y-1.5">
    <div className="px-1 text-[11px] font-medium text-muted-foreground">Đồng bộ dữ liệu</div>
    <SyncBadge className="w-full justify-start px-3 py-1.5 text-xs" />
  </div>
  ```

---

### 📌 BUG-02: Tràn ngang toàn hệ thống trên Mobile & Lệch Bottom Dock
- **Mức độ nghiêm trọng:** `P1 — High Impact`
- **Vị trí tệp:**
  - `web/src/app/layout.tsx` (dòng 32–41)
  - `web/src/components/AppNav.tsx` (dòng 63–74)
  - `web/src/app/on-tap/diem-yeu/page.tsx`
  - `web/src/app/hoc/tra-cuu/dong-tu/page.tsx`
- **Ảnh minh chứng:** 
  - `bugs/02_hoc_grid_mobile.png`
  - `bugs/04_diem_yeu_mobile.png`
  - `bugs/09_tra_cuu_dong_tu_mobile.png`
- **Hiện tượng:**
  Trên thiết bị di động (kích thước chuẩn 390px), trang web xuất hiện thanh cuộn ngang. Nguy hiểm hơn, thanh điều hướng đáy (Bottom Dock) bị dạt hẳn sang bên phải màn hình, làm mất nút thứ 5 ("Thống kê").
- **Nguyên nhân gốc rễ:**
  1. Trong `layout.tsx`, thẻ `body` và `div` bao bọc `children` thiếu `overflow-x-hidden` và `min-w-0 max-w-full`. Theo cơ chế CSS Flexbox, phần tử con có `min-width: auto` sẽ ép khung ngoài nở rộng nếu có bảng dữ liệu (`table`) hoặc phần tử con rộng hơn 390px.
  2. Khi `scrollWidth` của `body` phình ra (đạt ~420-440px), thanh Bottom Dock sử dụng `fixed bottom-... left-1/2 -translate-x-1/2` bị căn tâm theo chiều rộng thân trang phình to thay vì cố định theo khung nhìn viewport 390px.
- **Phương án giải quyết:**
  1. Trong `layout.tsx`: Thêm `overflow-x-hidden` vào `body` và `min-w-0 max-w-full overflow-x-hidden` vào `div` bọc `children`.
  2. Trong `AppNav.tsx`: Neo Bottom Dock an toàn bằng `fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] inset-x-4 mx-auto max-w-md w-auto` kết hợp backdrop blur.

---

### 📌 BUG-03: Trùng lặp nút chức năng trên Header Desktop
- **Mức độ nghiêm trọng:** `P2 — Medium`
- **Vị trí tệp:** `web/src/components/DashboardContent.tsx` (dòng 140–156)
- **Ảnh minh chứng:** `bugs/01-dashboard-desktop.png`, `bugs/02_hoc_grid_desktop.png`
- **Hiện tượng:**
  Trên màn hình máy tính (Desktop), thanh bên trái (`AppNav` Sidebar) đã có sẵn nút Tìm kiếm (Cmd+K), nút Cài đặt và SyncBadge. Tuy nhiên, trên Header của Dashboard vẫn hiển thị cụm nút Tìm kiếm, SyncBadge và Cài đặt. Người dùng nhìn thấy 2 bộ nút giống hệt nhau hiển thị song song.
- **Nguyên nhân gốc rễ:** Khối nút trên header thiếu lớp ẩn đáp ứng `lg:hidden`.
- **Phương án giải quyết:**
  Bổ sung `lg:hidden` vào container chứa cụm nút này trong `DashboardContent.tsx`:
  ```tsx
  <div className="flex items-center gap-2 pt-1 lg:hidden">
    ...
  </div>
  ```

---

### 📌 BUG-04: Nút xóa "✕" bị nhân đôi trong ô tìm kiếm
- **Mức độ nghiêm trọng:** `P2 — Medium`
- **Vị trí tệp:** `web/src/components/search/SearchDialog.tsx` (dòng 178–202)
- **Ảnh minh chứng:** `bugs/07_search_results_1790170470138.png`
- **Hiện tượng:**
  Khi người dùng gõ từ khóa tìm kiếm (ví dụ "watashi"), trong ô input xuất hiện **2 nút xóa ✕** nằm sát nhau (`watashi  ✕  ✕`).
- **Nguyên nhân gốc rễ:**
  Thuộc tính `type="search"` trên các trình duyệt Chromium (Edge, Chrome) và WebKit (Safari) tự động sinh ra pseudo-element `::-webkit-search-cancel-button`. Đồng thời, code React trong `SearchDialog.tsx` cũng render thêm một nút `<X />` khi `query !== ''`.
- **Phương án giải quyết:**
  Thêm lớp tiện ích ẩn nút xóa mặc định của trình duyệt:
  ```tsx
  className="... [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
  ```

---

### 📌 BUG-05: Vỡ cú pháp Furigana do dấu ngoặc đơn lồng trong dữ liệu bài học
- **Mức độ nghiêm trọng:** `P2 — Medium`
- **Vị trí tệp:**
  - `web/src/data/n5/lessons/lesson-24.json` (dòng 87–93)
  - `web/src/data/n5/lessons/lesson-12.json` (dòng 123–130)
- **Ảnh minh chứng:** `bugs/07_search_results_1790170470138.png`
- **Hiện tượng:**
  Mẫu câu ngữ pháp bài 24 hiển thị ra UI bị dính dấu ngoặc vuông thô: `N は [ 私 に] V て くれます`.
- **Nguyên nhân gốc rễ:**
  Tác giả nhập liệu dùng ngoặc vuông ASCII `[私[わたし]に]` để biểu thị thành phần tùy chọn. Biểu thức chính quy `KANJI_RUN_WITH_READING` trong `japanese.ts` chỉ nhận diện cặp ngoặc vuông furigana bên trong, để sót lại `[` và `]` bên ngoài vào văn bản thuần.
- **Phương án giải quyết:**
  Thay thế dấu ngoặc ASCII bằng dấu ngoặc tròn tiếng Nhật toàn chiều rộng theo đúng quy chuẩn `AGENTS.md`:
  `N は（私[わたし]に）V て くれます`.

---

### 📌 BUG-06: Màn hình Ôn tập bị cô lập, thiếu đường dẫn sang "Điểm yếu"
- **Mức độ nghiêm trọng:** `P2 — Medium`
- **Vị trí tệp:** `web/src/app/on-tap/page.tsx`
- **Ảnh minh chứng:** `bugs/04_on_tap_desktop_1790170299980.png`
- **Hiện tượng:**
  Khi người dùng không có thẻ ôn tập đến hạn (`dueCount === 0` hoặc chưa có lịch FSRS), trang `/on-tap` chỉ thông báo "Chưa có gì để ôn" và dẫn người dùng về Bài 1. Hoàn toàn không có liên kết nào dẫn tới tính năng quan trọng: "Điểm yếu của tôi" (`/on-tap/diem-yeu`).
- **Nguyên nhân gốc rễ:** Thiếu thanh điều hướng phụ (Sub-navigation) giữa hai phân hệ của tab Ôn tập.
- **Phương án giải quyết:**
  1. Thêm thanh tab phụ trên đầu màn hình `/on-tap` và `/on-tap/diem-yeu`:
     `[ Hàng đợi hôm nay ] | [ Điểm yếu của tôi ]`
  2. Khi hàng đợi rỗng, hiển thị một thẻ Card gợi ý người dùng luyện tập các mục hay làm sai trong Bảng điểm yếu.

---

### 📌 BUG-07: Trạng thái SyncBadge bị ẩn hoàn toàn trên Mobile
- **Mức độ nghiêm trọng:** `P3 — Low Impact`
- **Vị trí tệp:** `web/src/components/DashboardContent.tsx` (dòng 142)
- **Ảnh minh chứng:** `bugs/01-dashboard-mobile-top.png`
- **Hiện tượng:**
  Trên giao diện điện thoại, `SyncBadge` bị ẩn bởi lớp `hidden sm:block`. Người dùng di động (đối tượng học ngoại tuyến nhiều nhất) không thể nhìn thấy trạng thái đã đồng bộ hay chưa.
- **Phương án giải quyết:**
  Bật hiển thị `SyncBadge` trên mobile ở chế độ thu gọn (chỉ hiển thị icon đám mây kèm trạng thái, ẩn văn bản dài nếu màn hình hẹp), đặt cạnh icon Cài đặt trên Header.

---

### 📌 BUG-08: Dấu ngoặc chú thích động từ bị ngắt dòng lửng lơ trên Mobile
- **Mức độ nghiêm trọng:** `P3 — Low Impact`
- **Vị trí tệp:** `web/src/components/lookup/VerbTable.tsx` (dòng 268–275)
- **Ảnh minh chứng:** `bugs/09_tra_cuu_dong_tu_mobile.png`
- **Hiện tượng:**
  Trong bảng động từ N5, các động từ có cụm đi kèm như `会[あ]います[ともだちに〜]` hiển thị ngoặc vuông thô bị bẻ dòng lộn xộn trong ô cột sticky.
- **Phương án giải quyết:**
  Tách chuỗi chú thích đi kèm thành sub-badge riêng biệt:
  Động từ chính: `会います` (Furigana rõ ràng)
  Nhãn ngữ cảnh: `ともだちに〜` (chữ nhỏ màu `text-muted-foreground` nằm dưới động từ).

---

## 4. KẾ HOẠCH BẢO ĐẢM CHẤT LƯỢNG TIẾP THEO

- Sau khi áp dụng bản vá cho cả 8 lỗi, chạy bộ kiểm thử tự động toàn diện:
  - `pnpm check` (TypeScript kiểm tra kiểu & ESLint quy chuẩn code)
  - `pnpm test` (Toàn bộ 127 bài test logic FSRS, Sync snapshot, Shadowing player)
- Dùng Browser Subagent quét lại các viewport 1280px và 390px, chụp ảnh xác nhận sau khi sửa lỗi để hoàn tất nghiệm thu.
