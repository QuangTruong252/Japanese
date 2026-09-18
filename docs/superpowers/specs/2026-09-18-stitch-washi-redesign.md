# Đặc tả Thiết kế: Redesign Giao diện Washi theo Stitch Design (Giai đoạn 1)

- **Ngày tạo**: 2026-09-18
- **Trạng thái**: Bản thảo thiết kế đã thống nhất (Design Spec Approved)
- **Tài liệu liên quan**: `PRODUCT.md`, `DESIGN.md`, `docs/design-system.md`, `docs/project-design-spec.md`
- **Nguồn cảm hứng thiết kế**: Dự án Stitch `projects/11644821036613348689`, Màn hình `81e796dcc39b4910b86616c5866b6482` (Bento Dashboard Apple Dock PC)

---

## 1. Bối cảnh & Mục tiêu

Ứng dụng tự học tiếng Nhật Washi (Minna no Nihongo N5/N4) đang hướng tới trải nghiệm học tập chuẩn mực: đậm chất giấy Washi Nhật Bản, tối giản, thông minh và thẩm mỹ cao cấp.

Đợt redesign Giai đoạn 1 tập trung vào việc hiện đại hóa toàn diện bộ ba trang cốt lõi và hệ thống điều hướng:
1. **Apple Dock Bar (`web/src/components/AppNav.tsx`)**: Chuyển đổi thành thanh điều hướng đa năng cố định ở đáy màn hình, tích hợp Logo mới, 6 tab điều hướng chuẩn macOS và cụm trạng thái học tập (Streak, Thời gian học, Trạng thái đồng bộ).
2. **Bảng tin học tập (`web/src/app/page.tsx`)**: Bố cục Bento Grid ấm áp, giải phóng đỉnh trang, xử lý phân cấp hành động thông minh (nút động theo trạng thái FSRS) và loại bỏ các khối rườm rà gây quá tải nhận thức.
3. **Danh sách bài học (`web/src/app/hoc/page.tsx`)**: Thêm banner thống kê Bento N5, bộ lọc trạng thái bài học (Tất cả / Hoàn thành / Đang học / Chưa học), ô tìm kiếm bài học tức thì và nâng cấp lưới thẻ bài học Washi.
4. **Chi tiết bài học (`web/src/app/hoc/[so]/page.tsx`)**: Nâng tầm bảng từ vựng với Furigana `<ruby>`, badge phân loại nhóm động từ (`verb-1`, `verb-2`, `verb-3`), khối ngữ pháp Washi và lối tắt sang luyện tập.

---

## 2. Đặc tả Chi tiết Kiến trúc Giao diện

### 2.1. Apple Dock Bar Đa Năng (`web/src/components/AppNav.tsx`)

#### Vị trí & Styling
* **Vị trí**: Nổi cố định ở giữa đáy màn hình `fixed bottom-6 inset-x-0 mx-auto w-fit z-50`.
* **Hiệu ứng**:
  - Nền kính mờ Washi: `bg-background/90 dark:bg-card/90 backdrop-blur-2xl`.
  - Viền mỏng cao cấp: `border border-border/80 dark:border-white/10`.
  - Đổ bóng mềm: `shadow-2xl ring-1 ring-black/5 dark:ring-white/5`.
  - Bo góc tròn dạng viên thuốc: `rounded-full px-4 py-2 sm:py-2.5`.

#### Ba phân vùng chức năng (Three-Zone Architecture)
1. **Khu vực Trái (Nhận diện thương hiệu)**:
   - Logo thương hiệu: Ảnh `/brand/logo.png` trong khung bo mềm mại (`w-8 h-8 rounded-xl object-contain`).
   - Tên thương hiệu: **Washi** (SemiBold) và chữ Hán **和紙** (`font-jp text-xs text-primary font-semibold`), kèm tag nhỏ `N5`.
   - Ẩn nhãn chữ trên mobile, chỉ giữ lại icon logo thu gọn.
2. **Vạch ngăn dọc (Divider 1)**: `w-[1px] h-6 bg-border mx-1 self-center`.
3. **Khu vực Giữa (Hệ thống điều hướng 6 Tab)**:
   - 6 tab:
     - **Bảng tin** (`/`): icon `LayoutDashboard`
     - **Học bài** (`/hoc`): icon `BookOpen`
     - **Luyện tập** (`/luyen-tap`): icon `Dumbbell`
     - **Ôn tập** (`/on-tap`): icon `RotateCcw`, kèm huy hiệu đếm số mục quá hạn FSRS (`dueCount > 0` thì hiển thị badge đỏ `bg-destructive text-destructive-foreground font-bold`)
     - **Thống kê** (`/thong-ke`): icon `BarChart3`
     - **Cài đặt** (`/cai-dat`): icon `Settings`
   - **Tương tác**:
     - Hover phóng to nhẹ chuẩn macOS Dock (`hover:scale-115 -translate-y-0.5 transition-all duration-150`).
     - Tooltip đen macOS hiển thị phía trên (`pointer-events-none -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-foreground text-background text-[11px] rounded-md shadow-xl`).
     - Tab Active: `text-primary bg-primary/15 shadow-inner` kèm chấm tròn định vị.
4. **Vạch ngăn dọc (Divider 2)**: `w-[1px] h-6 bg-border mx-1 self-center`.
5. **Khu vực Phải (Trạng thái học tập & Tài khoản)**:
   - **Trên Desktop (>= 1024px / lg)**:
     - Chip Streak: `🔥 X ngày` (nền `bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-semibold`).
     - Chip Thời gian học hôm nay: `⏱️ Y/30p` (nền `bg-muted text-foreground border border-border px-2.5 py-1 rounded-full text-xs font-medium`).
     - Chip Đồng bộ: Sử dụng component `SyncBadge` hiện có (`Đã đồng bộ` / `Chờ đồng bộ` / `Ngoại tuyến`).
     - Avatar người dùng thu nhỏ: Khung tròn `HN`.
   - **Trên Mobile (< 640px)**:
     - Thu gọn thành một icon trạng thái tổng hợp (ví dụ icon ngọn lửa 🔥 hoặc đám mây).
     - Khi chạm vào sẽ mở một popover nhỏ gọn hiển thị đầy đủ: Streak, thời gian học hôm nay và trạng thái đồng bộ.

#### Ràng buộc an toàn
- Toàn bộ các trang có hiển thị Dock Bar bắt buộc phải có khoảng đệm đáy an toàn: `pb-36 sm:pb-40` trong layout.
- Tự động ẩn Dock Bar trên các trang làm bài: `pathname.startsWith('/luyen-tap/phien') || pathname.startsWith('/on-tap/phien')`.

---

### 2.2. Bảng tin học tập (`web/src/app/page.tsx`)

#### Không gian & Đỉnh trang
- Không tạo thanh header dính (sticky top bar).
- Đầu trang bắt đầu thoáng đãng:
  - Lời chào cá nhân hóa theo buổi: *"Chào buổi sáng / chiều / tối, ... 🎌"*.
  - Châm ngôn tiếng Nhật truyền cảm hứng: *「七転び八起き」 (Ngã bảy lần, đứng dậy tám lần)*.
  - Ngày tháng tiếng Việt: *Thứ ..., ngày ... tháng ... năm ...*.

#### Hàng 4 Thẻ Bento Metrics
1. **Chuỗi học tập**: Số ngày streak liên tục, icon ngọn lửa 🔥, gợi ý duy trì phong độ.
2. **Thời gian học hôm nay**: `X / 30 phút mục tiêu`, kèm thanh tiến độ mini.
3. **Tỷ lệ nhớ FSRS**: Phần trăm độ chính xác 7 ngày qua (từ `accuracyOverDays`), nhãn "Thuật toán ghi nhớ dài hạn".
4. **Từ vựng N5 tích lũy**: `X / 650 từ`, phần trăm vốn từ N5 đã mở khóa.

#### Cặp thẻ hành động học tập cốt lõi
* **Thẻ Bài đang học dở (Bên trái)**:
  - Tên bài: *Bài X — [Tiêu đề tiếng Việt]*.
  - Phụ đề tiếng Nhật: Kanji/Kana `font-jp`.
  - Tiến trình bài: `% hoàn thành` (tính theo số từ vựng đã thuộc trên tổng từ vựng bài đó).
  - Tóm tắt: Số từ vựng đã nắm, số mẫu ngữ pháp.
  - Nút CTA: `Học tiếp bài X →`.
* **Thẻ Hàng đợi Ôn tập SRS (Bên phải)**:
  - Huy hiệu trạng thái: `X mục đến hạn` hoặc `Đã hoàn thành mục tiêu ngày`.
  - Tóm tắt phân loại thẻ: Số từ vựng cần ôn, số mẫu ngữ pháp cần củng cố.
  - Nút CTA: `Ôn tập ngay →`.
* **Quy tắc phân cấp nút động (Quyết định 1A)**:
  - Nếu `dueCount > 0`: Nút **Ôn tập ngay** mang kiểu dáng **Primary Torii Red** (`bg-primary text-primary-foreground`), nút **Học tiếp bài X** là **Secondary Outline**.
  - Nếu `dueCount === 0`: Nút **Học tiếp bài X** trở thành **Primary Torii Red**, thẻ Ôn tập hiển thị trạng thái hoàn tất thư giãn.

#### Khối thứ hai: Chữ Hán & Điểm yếu
* **Thẻ Kanji hôm nay**:
  - Hiển thị chữ Hán N5 chọn lọc theo ngày (từ 169 file dữ liệu `web/src/data/n5/kanji`).
  - Chữ Hán to trang nhã, âm Hán Việt, âm Onyomi, Kunyomi và các từ ghép thực tế phổ biến.
* **Thẻ Điểm yếu cần củng cố**:
  - Truy vấn Top 3 mục có `incorrectCount > 0` cao nhất trong Dexie.
  - Hiển thị rõ chữ Hán/mẫu câu, nhãn loại (Từ vựng/Ngữ pháp/Trợ từ), số lần làm sai và nút "Luyện lại".
* **Loại bỏ**: Khối "Luyện tập cấp tốc (Mini Drill)" được lược bỏ hoàn toàn theo Quyết định 2A để tránh trùng lặp với route `/luyen-tap`.

---

### 2.3. Danh sách bài học (`web/src/app/hoc/page.tsx` & `LessonGrid.tsx`)

#### Banner Thống kê Bento N5
Bổ sung 4 thẻ tóm lược đầu trang:
1. **Tiến độ N5**: `X / 25 bài` (số bài đã học/hoàn thành trên tổng số 25 bài N5).
2. **Từ vựng đã nắm**: `Y / 650 từ` kèm progress bar.
3. **Ngữ pháp Minna**: `Z / 98 mẫu` kèm progress bar.
4. **Thẻ tiếp tục học ngay**: Bài học gần nhất chưa xong kèm nút bấm trực tiếp.

#### Thanh công cụ Lọc & Tìm kiếm
- **Tab phân loại**:
  - `Tất cả (25)`
  - `Đã hoàn thành` (bài có 100% từ vựng đã học)
  - `Đang học` (bài có >0% nhưng <100% từ vựng)
  - `Chưa học` (0% từ vựng)
- **Ô tìm kiếm nhanh**:
  - Placeholder: *"Tìm bài học, chủ đề tiếng Nhật..."*
  - Tìm kiếm real-time theo tiêu đề bài tiếng Việt hoặc Kanji/Kana phụ đề tiếng Nhật.

#### Lưới thẻ bài học Washi nâng cấp
- Card bo góc `rounded-2xl`, viền mảnh `border-border/80`, hiệu ứng hover êm ái.
- Huy hiệu trạng thái trên mỗi card:
  - `Hoàn thành`: Badge xanh ngọc (`bg-emerald-50 text-emerald-700 border-emerald-200`).
  - `Đang học`: Badge cam/đỏ Torii nhạt.
  - `Chưa học`: Badge xám trung tính.
- Cấu trúc card: Số bài + Tiêu đề tiếng Việt, phụ đề tiếng Nhật `font-jp`, tóm tắt số từ & ngữ pháp, thanh progress bar mượt mà.

---

### 2.4. Chi tiết bài học (`web/src/app/hoc/[so]/page.tsx`)

- **Điều hướng**: Nút quay lại danh sách bài học `← Danh sách bài`.
- **Header bài**: Tiêu đề bài lớn, phụ đề Kanji/Kana, mô tả bài học và thanh tiến độ bài.
- **Bảng từ vựng chuẩn Washi**:
  - Cột chữ Nhật: Furigana chuẩn `<ruby>` và `<rt>`, kèm `SpeakButton` phát âm.
  - Cột nghĩa tiếng Việt.
  - Badge phân loại nhóm động từ chuẩn Washi:
    - Nhóm 1: `bg-verb-1 text-primary-foreground`
    - Nhóm 2: `bg-verb-2 text-primary-foreground`
    - Nhóm 3: `bg-verb-3 text-primary-foreground`
- **Khối Ngữ pháp**:
  - Cấu trúc mẫu câu trong `grammar-pattern-block` (nền `bg-muted` bo góc `lg`).
  - Giải thích ngắn gọn và các câu ví dụ song ngữ.
- **CTA Chuyển giao**: Nút nổi bật chuyển sang "Luyện tập bài này" dẫn thẳng vào cấu hình `/luyen-tap` với bài đã chọn.

---

## 3. Kế hoạch Kiểm thử & Đảm bảo Chất lượng

1. **Kiểm tra va chạm giao diện & Responsive**:
   - Đảm bảo khoảng đệm đáy `pb-36` đến `pb-40` hoạt động hoàn hảo trên mọi kích thước màn hình (Desktop 1440px, Laptop 1024px, Tablet 768px, Mobile 390px).
   - Dock Bar không bao giờ đè lên nội dung bài học khi cuộn trang xuống dưới cùng.
2. **Kiểm tra tính năng động của Dock Bar**:
   - Badge số mục đến hạn trên tab Ôn tập cập nhật chính xác theo Dexie.
   - Ẩn Dock Bar khi truy cập `/luyen-tap/phien` và `/on-tap/phien`.
   - Tooltip macOS xuất hiện chính xác khi hover trên Desktop và không bị vỡ trên Mobile.
3. **Kiểm tra phân cấp nút động (Primary CTA Rule)**:
   - Khi có bài đến hạn: Nút Ôn tập là Primary duy nhất.
   - Khi không có bài đến hạn: Nút Học bài là Primary duy nhất.
4. **Kiểm tra Type & Lint**:
   - Chạy `pnpm check` (TypeScript + ESLint) trong `web/` không có lỗi.
