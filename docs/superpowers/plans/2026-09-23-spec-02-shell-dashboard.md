# SPEC-02 Vỏ điều hướng & Bảng tin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cập nhật Vỏ điều hướng (`AppNav.tsx`, `layout.tsx`) và Bảng tin `/` (`page.tsx`) theo hợp đồng UX đã duyệt ngày 22/09/2026 trong SPEC-02 và hệ thiết kế Washi.

**Architecture:** 
1. Vỏ điều hướng phân nhánh theo mốc `lg` (1024px): dưới 1024px là thanh dock nổi bo tròn 5 mục với nhãn chữ caption luôn hiển thị; từ 1024px trở lên là sidebar cố định bên trái (w-64) với logo ở đỉnh, 5 tab ở giữa và khối tài khoản/cài đặt ở đáy.
2. Vỏ layout quản lý khoảng chừa tập trung: mobile có khoảng chừa đáy (`pb-28 sm:pb-32`), desktop có lề trái (`lg:pl-64 lg:pb-0`).
3. Bảng tin `/` tinh gọn theo kiến trúc thông tin mới: 1 hành động chính P0 duy nhất, hợp nhất khối "Việc nên làm tiếp theo" và "Bài đang học" khi không có mục đến hạn, khối "Cần củng cố" P1 chỉ dẫn link tới `/on-tap/diem-yeu` (ẩn khi = 0), nhịp học P2 nhẹ nhàng, bỏ các ô KPI và widget không thuộc hợp đồng.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, Lucide React, Dexie (`dexie-react-hooks`).

## Global Constraints

- Chỉ dùng token màu theo tên (`bg-primary`, `text-muted-foreground`, `border-border`), không hardcode mã hex.
- Mobile-first: Kiểm tra 390px trước rồi mở rộng lên desktop 1024px/1280px.
- Vùng chạm tối thiểu 48px cho nút làm bài (`size="quiz"`) và các mục điều hướng.
- Không có chuyển động lặp/nhấp nháy ở badge đến hạn hoặc các thành phần trang trí.
- Không tạo dữ liệu/mục tiêu giả định (không hardcode 30 phút/ngày hay 35 từ/bài).

---

### Task 1: Cập nhật App Shell Layout (`web/src/app/layout.tsx`)

**Files:**
- Modify: `web/src/app/layout.tsx`

**Interfaces:**
- Consumes: `AppNav` component từ `@/components/AppNav`.
- Produces: Layout bọc ứng dụng có phân vùng lề cho dock mobile và sidebar desktop.

- [ ] **Step 1: Cập nhật padding vùng nội dung trong `layout.tsx`**

Sửa vùng chứa `children` trong `web/src/app/layout.tsx` để hỗ trợ:
- Mobile (< `lg`): khoảng chừa đáy `pb-28 sm:pb-32` cho dock nổi.
- Desktop (≥ `lg`): `lg:pl-64 lg:pb-0` cho sidebar trái.

```tsx
// web/src/app/layout.tsx
<body
  className="min-h-full flex flex-col bg-background text-foreground font-sans"
  suppressHydrationWarning
>
  <AppNav />
  <div className="flex-1 flex flex-col pb-28 sm:pb-32 lg:pb-0 lg:pl-64">
    {children}
  </div>
</body>
```

- [ ] **Step 2: Chạy kiểm tra cú pháp**

Run: `pnpm --filter web check`  
Expected: PASS

---

### Task 2: Cập nhật Vỏ điều hướng 2 chế độ (`web/src/components/AppNav.tsx`)

**Files:**
- Modify: `web/src/components/AppNav.tsx`

**Interfaces:**
- Consumes: Dexie DB `reviewItems`, `useDueClock()`, Lucide icons (`LayoutDashboard`, `BookOpen`, `Dumbbell`, `RotateCcw`, `BarChart3`, `Settings`, `User`), `SyncBadge`.
- Produces: Thanh dock nổi dưới 1024px (5 mục, nhãn caption luôn hiện) và sidebar cố định từ 1024px (logo, 5 tab, footer tài khoản).

- [ ] **Step 1: Định nghĩa 5 mục điều hướng chính và loại bỏ Cài đặt khỏi nav**

Chỉ giữ đúng 5 mục theo thứ tự:
1. `Bảng tin` (`/`, `LayoutDashboard`)
2. `Học bài` (`/hoc`, `BookOpen`)
3. `Luyện tập` (`/luyen-tap`, `Dumbbell`)
4. `Ôn tập` (`/on-tap`, `RotateCcw`, `isDueTarget: true`)
5. `Thống kê` (`/thong-ke`, `BarChart3`)

- [ ] **Step 2: Dựng Sidebar Desktop (≥ 1024px)**

Hiển thị khi `lg:flex`:
- `fixed inset-y-0 left-0 w-64 border-r border-border bg-card hidden lg:flex flex-col justify-between p-4 z-40`.
- **Top:** Logo MaiPace (SVG icon `/brand/maipace-mark.svg` đỏ + chữ "MaiPace" font giao diện, kèm nhãn phụ "Minna N5").
- **Middle:** Danh sách 5 liên kết xếp dọc (`space-y-1.5`), icon 20px, nhãn chữ rõ ràng, active mang `bg-primary/15 text-primary font-semibold rounded-xl`, badge đến hạn ở Ôn tập (`bg-destructive text-destructive-foreground`).
- **Bottom:** Khối tài khoản thứ cấp: Link dẫn tới `/cai-dat`, hiển thị thông tin người học, nút Cài đặt, và `SyncBadge`.

- [ ] **Step 3: Dựng Dock nổi Mobile (< 1024px)**

Hiển thị khi `lg:hidden`:
- `fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50 lg:hidden`.
- Nền `bg-background/90 dark:bg-card/90 backdrop-blur-xl border border-border/80 rounded-full shadow-lg p-1.5 px-3`.
- 5 ô đều nhau: mỗi ô có icon Lucide 22px ở trên và **nhãn chữ Caption (text-[10px] sm:text-xs) ở dưới luôn luôn hiển thị**.
- Chiều cao chạm mỗi nút `min-h-[48px]`.
- Badge đến hạn FSRS: màu `destructive`, tĩnh, không có class animation nhấp nháy.

- [ ] **Step 4: Chạy kiểm tra tĩnh**

Run: `pnpm --filter web check`  
Expected: PASS

---

### Task 3: Cập nhật Bảng tin `/` (`web/src/app/page.tsx`)

**Files:**
- Modify: `web/src/app/page.tsx`

**Interfaces:**
- Consumes: `loadLessonSummaries()`, `countLearnedByLesson()`, `currentStreak()`, `useDueClock()`, `db.reviewItems`.
- Produces: Trang Bảng tin tinh gọn tuân thủ hợp đồng UX SPEC-02 §3.2.

- [ ] **Step 1: Tải dữ liệu bài học thật và xác định "Bài đang học"**

- Dùng `loadLessonSummaries()` từ `@/lib/lessons` để có danh sách bài học và `vocabCount` thật.
- Lấy `vocabTargetIds` từ Dexie để tính `learnedByLesson` qua `countLearnedByLesson(vocabTargetIds)`.
- Xác định bài hiện hành (`activeLesson`): bài đầu tiên có `learned > 0 && learned < vocabCount` (đang học dở), hoặc nếu không có bài nào dở thì là bài đầu tiên chưa bắt đầu (`learned === 0`), tối đa là bài 25.
- Tính tiến độ chính xác: `Math.round((learnedInLesson / totalVocabInLesson) * 100)`.

- [ ] **Step 2: Dựng Header Bảng tin**

- Lời chào ngắn theo thời gian: "Chào buổi sáng", "Chào buổi chiều", "Chào buổi tối".
- Lối vào Tài khoản / Cài đặt ở góc trên bên phải: Link dẫn tới `/cai-dat` kèm `SyncBadge` nhỏ gọn và biểu tượng `Settings` hoặc avatar người học (phục vụ mobile < `lg`).
- Tín hiệu Nhịp học P2: Dòng phụ hoặc chip nhẹ nhàng hiển thị `streak.days` ngày học liên tục (nếu `streak.days > 0`), không gây áp lực.

- [ ] **Step 3: Dựng Khối P0 Hành động chính & Bài đang học (Luật hợp nhất)**

- **Trường hợp 1 (`dueCount > 0`):**
  - Thẻ P0 "Bắt đầu ôn tập": mang nút chính duy nhất `size="quiz"` (`bg-primary text-primary-foreground h-12 w-full`), ngữ cảnh: *"{dueCount} mục đến hạn ôn tập hôm nay"*.
  - Thẻ P1 bên dưới: "Bài đang học" hiển thị số bài, tên bài, tiến độ thanh ProgressBar, kèm nút phụ "Vào bài học" (`variant="outline"` hoặc `secondary`).
- **Trường hợp 2 (`dueCount = 0`):**
  - **Hợp nhất thành một thẻ duy nhất:** Thẻ "Bài đang học" mang nút chính duy nhất của trang: **"Học tiếp bài {số}"** (hoặc **"Bắt đầu bài 1"** nếu chưa học bài nào), cỡ nút `size="quiz"` (h-12).
  - Không lặp lại 2 thẻ.

- [ ] **Step 4: Dựng Khối P1 Cần củng cố**

- Đếm số mục có `incorrectCount > 0` từ Dexie (`weakCount`).
- Nếu `weakCount > 0`: Hiển thị thanh thông báo nhẹ viền mảnh: *"{weakCount} nội dung cần củng cố"* kèm nút liên kết duy nhất "Xem và luyện lại" dẫn tới `/on-tap/diem-yeu`.
- Nếu `weakCount === 0`: Ẩn hoàn toàn khối này (`return null`).

- [ ] **Step 5: Dọn sạch các phần không thuộc hợp đồng Bảng tin**

- Xóa toàn bộ 4 thẻ KPI cũ (chuỗi ngày, phút hôm nay, % đúng 7 ngày, tổng từ vựng N5).
- Xóa phân loại thẻ đến hạn (vocab, grammar, other).
- Xóa widget `DailyKanji`.
- Xóa danh sách 3 điểm yếu với từng nút con.
- Xóa con số giả định `30 phút`.

- [ ] **Step 6: Chạy kiểm tra tĩnh**

Run: `pnpm --filter web check`  
Expected: PASS

---

### Task 4: Kiểm tra toàn diện & Hoàn tất

**Files:**
- Test verification across the codebase

- [ ] **Step 1: Chạy `pnpm check`**
Run: `pnpm --filter web check`  
Expected: 0 errors, 0 warnings

- [ ] **Step 2: Chạy `pnpm test`**
Run: `pnpm --filter web test`  
Expected: PASS 98/98 unit tests

- [ ] **Step 3: Cập nhật tài liệu handoff và spec status**
Cập nhật `docs/specs/README.md` và tạo `docs/handoff/SPEC-02.md` ghi nhận việc đưa code Vỏ điều hướng và Bảng tin về đúng hợp đồng UX 22/09/2026.
