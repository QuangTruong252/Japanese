# Design Document: SPEC-02 Vỏ điều hướng & Bảng tin

**Ngày:** 23/09/2026  
**Trạng thái:** Approved  
**Nguồn tham chiếu:** [SPEC-02](../../specs/SPEC-02-shell-dieu-huong.md), [DESIGN.md](../../../DESIGN.md), [PRODUCT.md](../../../PRODUCT.md)

---

## 1. Mục tiêu & Bối cảnh

Đưa **Vỏ điều hướng** ([AppNav.tsx](../../../web/src/components/AppNav.tsx), [layout.tsx](../../../web/src/app/layout.tsx)) và **Bảng tin `/`** ([page.tsx](../../../web/src/app/page.tsx)) về đúng hợp đồng UX đã chốt ngày 22/09/2026 trong [SPEC-02](../../specs/SPEC-02-shell-dieu-huong.md) và hệ thiết kế Washi [DESIGN.md](../../../DESIGN.md).

---

## 2. Kiến trúc Vỏ điều hướng (`AppNav.tsx` & `layout.tsx`)

Hai vỏ, một mốc chuyển đổi duy nhất ở breakpoint `lg` (1024px). Không có top bar ở bất kỳ độ rộng nào.

### 2.1. Mobile & Tablet (< 1024px) — Thanh điều hướng đáy dạng Dock nổi
- **Vị trí & Kiểu dáng:** Nổi cách đáy 12px + safe-area (`fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50`).
- **Hình thức bề mặt:** Bo tròn hoàn toàn (`rounded-full`), nền mờ `bg-background/90 dark:bg-card/90 backdrop-blur-xl`, viền mảnh `border border-border/80`, đổ bóng `shadow-lg`.
- **5 khu vực chính (thứ tự cố định):**
  1. `Bảng tin` (`/`, `LayoutDashboard`)
  2. `Học bài` (`/hoc`, `BookOpen`)
  3. `Luyện tập` (`/luyen-tap`, `Dumbbell`)
  4. `Ôn tập` (`/on-tap`, `RotateCcw`, mang badge số đếm khi `dueCount > 0`)
  5. `Thống kê` (`/thong-ke`, `BarChart3`)
- **Ràng buộc:**
  - Nhãn chữ `Caption` **luôn luôn hiển thị** ở bên dưới icon tại mọi kích thước dưới 1024px (không dùng tooltip ẩn chữ trên mobile/tablet).
  - Chiều cao vùng chạm mỗi mục đạt chuẩn tối thiểu 48px (`h-12`).
  - Badge số đếm trên mục Ôn tập mang màu `destructive`, tĩnh, **không nhấp nháy / animate pulse**.
  - **Cài đặt không nằm trong nav đáy.**

### 2.2. Desktop (≥ 1024px) — Sidebar trái cố định
- **Vị trí & Kiểu dáng:** Cố định bên trái (`fixed inset-y-0 left-0 w-64 z-50`), bề mặt phẳng `bg-card`, viền phải `border-r border-border` (không dùng hiệu ứng blur).
- **Cấu trúc:**
  - **Header:** Biểu tượng MaiPace (`/brand/maipace-mark.svg` và tên `MaiPace` theo font hệ thống + nhãn phụ Minna N5).
  - **Nav Links:** 5 mục chính xếp dọc rộng rãi, padding êm, trạng thái active nổi bật với `bg-primary/10 text-primary font-semibold`, badge đến hạn ở mục Ôn tập.
  - **Footer:** Khối tài khoản thứ cấp: Avatar / Người học, trạng thái đồng bộ [SyncBadge.tsx](../../../web/src/components/SyncBadge.tsx), và nút mở `/cai-dat`.
- **Nav đáy biến mất hoàn toàn** trên màn hình `≥ lg`.

### 2.3. Khoảng chừa bố cục (`layout.tsx`)
- Quản lý tập trung ở app shell wrapper:
  - `< lg`: Dành khoảng chừa đáy (`pb-28 sm:pb-32`) để thanh dock nổi không che khuất phần tử cuối trang.
  - `≥ lg`: Bỏ hoàn toàn khoảng chừa đáy (`lg:pb-0`) và thêm lề trái (`lg:pl-64`) cho vùng nội dung cạnh sidebar.

---

## 3. Kiến trúc Bảng tin `/` (`page.tsx`)

Bề rộng nội dung: `content-wide` (`max-w-5xl`), đo trong vùng nội dung cạnh sidebar khi ở desktop.

### 3.1. Các phần đã loại bỏ
- 4 ô số liệu KPI (đã chuyển về `/thong-ke`).
- Phân loại mục đến hạn theo loại từ vựng/ngữ pháp (đã có ở `/on-tap`).
- Khối 3 điểm yếu với từng nút con (đã có ở `/on-tap/diem-yeu`).
- Widget `DailyKanji` và mục tiêu thời gian giả định `30 phút`.

### 3.2. Cấu trúc thông tin chuẩn
1. **Header:**
   - Lời chào ngắn theo thời gian trong ngày (`Chào buổi sáng`, `Chào buổi tối`...).
   - Lối vào Tài khoản / Cài đặt ở góc trên bên phải (kèm `SyncBadge`), phục vụ người dùng mobile `< lg`.
2. **Việc nên làm tiếp theo (P0) & Bài đang học (P0/P1) — Luật hợp nhất:**
   - **Khi `dueCount > 0`:**
     - Khối P0 nổi bật: Thẻ "Bắt đầu ôn tập" mang nút chính duy nhất `size="quiz"` (`bg-primary`, cao 48px), thể hiện ngữ cảnh `{dueCount} mục đến hạn`.
     - Khối P1 bên dưới: Thẻ "Bài đang học" hiển thị bài hiện tại, tiến độ thực tế, kèm nút phụ "Vào bài học".
   - **Khi `dueCount = 0`:**
     - **Hợp nhất thành một khối duy nhất:** Thẻ "Bài đang học" kiêm luôn vai trò P0 và mang nút chính duy nhất của trang: **"Học tiếp bài {số}"** (hoặc **"Bắt đầu bài 1"** nếu chưa học bài nào).
3. **Logic "Bài đang học" chuẩn xác:**
   - Đồng bộ logic với `/hoc` và [LessonGrid.tsx](../../../web/src/components/LessonGrid.tsx): lấy danh sách tóm tắt bài từ `loadLessonSummaries()`, đếm số từ đã học qua `countLearnedByLesson`, xác định bài học hiện tại (bài đang học dở hoặc bài chưa bắt đầu đầu tiên) dựa trên `vocabCount` thật của bài.
4. **Cần củng cố (P1):**
   - Nếu `weakCount > 0`: Hiển thị dải thông báo nhẹ: *"{weakCount} nội dung cần củng cố"* kèm 1 liên kết tới `/on-tap/diem-yeu`.
   - Nếu `weakCount = 0`: Ẩn hoàn toàn.
5. **Nhịp học (P2):**
   - Tín hiệu chuỗi ngày (`currentStreak`) tinh tế, nhẹ nhàng, không gây áp lực.

---

## 4. Kế hoạch kiểm chứng

- `pnpm check`: TypeScript và ESLint không có lỗi.
- `pnpm test`: Toàn bộ 98 unit tests hiện có tiếp tục vượt qua.
- Trình duyệt: Người dùng sẽ tự kiểm tra trên máy (theo yêu cầu "không cần browser test, tôi sẽ tự làm").
