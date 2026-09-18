# Kế hoạch Triển khai Redesign Giao diện Washi theo Stitch (Giai đoạn 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign toàn diện Apple Dock Bar, Bảng tin (`/`), Danh sách bài học (`/hoc`) và Chi tiết bài học (`/hoc/[so]`) theo phong cách Washi Bento của Stitch, bảo toàn 100% logic Dexie và FSRS.

**Architecture:** Áp dụng hệ thống token Washi (OKLCH, border 1px, bo góc `xl`, màu đỏ Torii `primary`). Loại bỏ top header cố định, đưa Logo và thông tin trạng thái học tập vào Apple Dock Bar đa năng mở rộng ở đáy màn hình. Cung cấp đệm đáy an toàn `pb-36 sm:pb-40` để ngăn va chạm vật lý giữa Dock Bar và nội dung.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Dexie.js (`useLiveQuery`), Base UI / Lucide React.

## Global Constraints
- Không dùng hardcoded màu hex; luôn dùng token Washi (`bg-primary`, `bg-card`, `text-foreground`, `border-border`, ...).
- Furigana dùng `<ruby>` và `<rt>`, không tạo parser/regex mới.
- Toàn bộ truy vấn dữ liệu học tập qua `useLiveQuery(db...)`.
- Quy tắc nút động: Tối đa duy nhất một nút `button-primary` (nền đỏ Torii) trên mỗi màn hình.
- Ràng buộc an toàn: Container các trang dùng đệm đáy `pb-36 sm:pb-40` để Dock Bar không che nội dung khi cuộn.
- dock bar tự động ẩn khi ở route `/luyen-tap/phien` và `/on-tap/phien`.

---

### Task 1: Thiết lập Đệm Đáy An Toàn & Redesign Apple Dock Bar (`AppNav.tsx`)

**Files:**
- Modify: `web/src/app/layout.tsx`
- Modify: `web/src/components/AppNav.tsx`

**Interfaces:**
- Consumes: `useDueClock()`, `db.reviewItems`, `accuracyOverDays()`, `currentStreak()`, `minutesOnDay()`, `/brand/logo.png`.
- Produces: Apple Dock Bar 3 vùng (Logo Washi, 6 Icon Điều hướng, Cụm trạng thái Streak/Time/Sync) với responsive desktop/mobile.

- [ ] **Step 1: Cập nhật đệm đáy layout trong `web/src/app/layout.tsx`**
Đảm bảo container trang có class `pb-36 sm:pb-40` để nội dung cuộn lên trên Dock Bar một cách an toàn.

- [ ] **Step 2: Cập nhật component `AppNav.tsx` theo 3 phân vùng**
  - Vùng Trái: Ảnh `/brand/logo.png` (w-8 h-8 rounded-xl), chữ "Washi", chữ Hán "和紙" và tag "N5".
  - Vạch ngăn: `w-[1px] h-6 bg-border`.
  - Vùng Giữa: 6 icon điều hướng (Bảng tin, Học bài, Luyện tập, Ôn tập có badge FSRS, Thống kê, Cài đặt) với tooltip macOS.
  - Vạch ngăn: `w-[1px] h-6 bg-border`.
  - Vùng Phải:
    - Desktop: Chip Streak (`🔥 X ngày`), Chip thời gian (`⏱️ Y/30p`), Chip `SyncBadge`.
    - Mobile: Thu gọn thành icon popup popover.

- [ ] **Step 3: Kiểm tra hiển thị và tương tác ẩn trên route quiz**
Xác nhận dock bar tự động ẩn khi vào `/luyen-tap/phien` và `/on-tap/phien`.

---

### Task 2: Component Widget Kanji Hôm Nay (`web/src/components/DailyKanji.tsx`)

**Files:**
- Create: `web/src/components/DailyKanji.tsx`

**Interfaces:**
- Consumes: Dữ liệu tĩnh các file JSON trong `web/src/data/n5/kanji/*.json`.
- Produces: `<DailyKanji />` component hiển thị chữ Hán N5 của ngày với âm On/Kun và từ ghép ví dụ.

- [ ] **Step 1: Viết helper chọn chữ Hán theo ngày từ kho 169 file kanji**
Dùng thuật toán băm ngày (day-of-year hoặc date string) để cố định 1 chữ Hán mỗi ngày.

- [ ] **Step 2: Tạo component `<DailyKanji />` phong cách Washi Card**
Card bo góc `rounded-2xl`, khung chữ Hán to sắc nét, huy hiệu số nét, âm Hán Việt, âm Onyomi, Kunyomi và 2 từ ghép ví dụ.

---

### Task 3: Redesign Bảng Tin Học Tập (`web/src/app/page.tsx`)

**Files:**
- Modify: `web/src/app/page.tsx`

**Interfaces:**
- Consumes: `useDueClock()`, `db.reviewItems`, `db.practiceSessions`, `stats.ts`, `<DailyKanji />`.
- Produces: Trang Dashboard phong cách Bento Washi hoàn chỉnh.

- [ ] **Step 1: Xây dựng Header chào buổi sáng & Châm ngôn tiếng Nhật**
Lời chào theo thời gian trong ngày (`Chào buổi sáng / chiều / tối`), châm ngôn `「七転び八起き」`, ngày tháng tiếng Việt.

- [ ] **Step 2: Xây dựng Hàng 4 Thẻ Bento Metrics**
4 thẻ thống kê: Chuỗi học tập (🔥), Thời gian học hôm nay (⏱️ kèm mini progress bar), Tỷ lệ nhớ FSRS 7 ngày (🎯), Từ vựng tích lũy N5 (📚).

- [ ] **Step 3: Xây dựng Cặp Thẻ Trọng Tâm & Quy Tắc Nút Động (1A)**
  - Thẻ Bài đang học dở: Tên bài, phụ đề tiếng Nhật, % hoàn thành, số từ/mẫu câu.
  - Thẻ Hàng đợi Ôn tập SRS: Số mục đến hạn, phân loại thẻ từ vựng & ngữ pháp.
  - Phân cấp nút:
    - Nếu `dueCount > 0`: Nút "Bắt đầu phiên ôn (X mục)" là Primary Torii Red, nút "Học tiếp bài Y" là Secondary.
    - Nếu `dueCount === 0`: Nút "Học tiếp bài Y" là Primary Torii Red, thẻ SRS hiển thị trạng thái hoàn thành thư thái.

- [ ] **Step 4: Tích hợp Thẻ DailyKanji & Thẻ Điểm Yếu Cần Củng Cố**
Hiển thị `<DailyKanji />` bên cạnh khối Top 3 điểm yếu (truy vấn từ Dexie với `incorrectCount > 0`). Lược bỏ cụm Mini Drill (2A).

---

### Task 4: Redesign Danh Sách Bài Học (`web/src/app/hoc/page.tsx` & `LessonGrid.tsx`)

**Files:**
- Modify: `web/src/app/hoc/page.tsx`
- Modify: `web/src/components/LessonGrid.tsx`

**Interfaces:**
- Consumes: `loadLessonSummaries()`, `countLearnedByLesson()`, `db.reviewItems`.
- Produces: Banner thống kê Bento N5, bộ lọc trạng thái, ô tìm kiếm và lưới thẻ bài học Washi.

- [ ] **Step 1: Xây dựng Bento Progress Banner đầu trang**
4 thẻ tóm lược: Tiến độ N5 (`X / 25 bài`), Từ vựng đã nắm (`Y / 650 từ`), Ngữ pháp Minna (`Z / 98 mẫu`), Thẻ tiếp tục bài học gần nhất.

- [ ] **Step 2: Thêm Thanh công cụ Lọc & Tìm kiếm trong `LessonGrid.tsx`**
  - State bộ lọc: `filter` ('all' | 'completed' | 'in-progress' | 'not-started').
  - State tìm kiếm: `searchQuery` (lọc tức thì theo tiếng Việt và Kanji/Kana).

- [ ] **Step 3: Nâng cấp Lưới Thẻ Bài Học Washi**
Mỗi thẻ bài học có huy hiệu trạng thái (`Hoàn thành` / `Đang học` / `Chưa học`), phụ đề Nhật `font-jp`, thống kê từ & ngữ pháp, thanh progress bar.

---

### Task 5: Redesign Chi Tiết Bài Học (`web/src/app/hoc/[so]/page.tsx`)

**Files:**
- Modify: `web/src/app/hoc/[so]/page.tsx`

**Interfaces:**
- Consumes: `loadLessonData()`, `Furigana`, `SpeakButton`.
- Produces: Trang chi tiết bài học Washi chuẩn mực.

- [ ] **Step 1: Cập nhật Header bài học & Breadcrumb**
Nút `← Danh sách bài học`, tiêu đề bài học lớn, phụ đề Kanji/Kana, mô tả và thanh tiến độ bài.

- [ ] **Step 2: Nâng cấp Bảng Từ Vựng Chuẩn Washi**
Mỗi từ có Furigana `<ruby>`, nghĩa tiếng Việt, badge phân loại nhóm động từ (`verb-1`, `verb-2`, `verb-3`), và nút nghe phát âm `SpeakButton`.

- [ ] **Step 3: Nâng cấp Khối Mẫu Câu & Ngữ Pháp**
Đưa các mẫu câu vào `grammar-pattern-block` với nền `bg-muted` bo góc `lg`.

- [ ] **Step 4: Thêm Nút CTA Chuyển Sang Luyện Tập**
Nút CTA Torii Red ở cuối bài dẫn tới `/luyen-tap` với bài học hiện tại đã chọn sẵn.

---

### Task 6: Kiểm Tra Đảm Bảo Chất Lượng Toàn Diện

- [ ] **Step 1: Chạy kiểm tra Type & Lint**
Chạy `pnpm check` trong `web/` để đảm bảo không có lỗi biên dịch TypeScript hay ESLint.

- [ ] **Step 2: Chạy kiểm tra Unit Test**
Chạy `pnpm test` trong `web/` để kiểm tra các bài test hiện có (SyncBadge, FSRS, Stats).

- [ ] **Step 3: Kiểm tra Trình duyệt & Responsive**
Kiểm tra thực tế giao diện ở Desktop (1440px) và Mobile (390px), xác nhận Dock Bar không che nội dung khi cuộn.
