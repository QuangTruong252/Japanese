# Handoff — SPEC-02 (Vỏ điều hướng & Bảng tin)

Ngày: 23/09/2026. Trạng thái: Đã cập nhật code theo hợp đồng UX 22/09/2026; Static gates PASS; Người dùng tự nghiệm thu trình duyệt.

## Thay đổi và quyết định

- **Vỏ điều hướng 2 chế độ ([web/src/components/AppNav.tsx](file:///d:/Projects/Lab/Japanese/web/src/components/AppNav.tsx)):**
  - **Mốc chuyển đổi duy nhất:** Breakpoint `lg` (1024px).
  - **Mobile & Tablet (< 1024px):**
    - Thanh điều hướng đáy kiểu dock nổi bo tròn hoàn toàn `rounded-full`, cách đáy màn hình 12px + safe-area, nền mờ `backdrop-blur-2xl border border-border/80`.
    - Đúng 5 mục chính theo thứ tự: Bảng tin (`/`), Học bài (`/hoc`), Luyện tập (`/luyen-tap`), Ôn tập (`/on-tap`), Thống kê (`/thong-ke`).
    - Bỏ mục Cài đặt khỏi nav đáy (chuyển sang lối vào thứ cấp ở header Bảng tin).
    - Mỗi ô đạt chiều cao chạm tối thiểu 48px, nhãn chữ Caption bên dưới icon **luôn luôn hiển thị** ở mọi kích thước dưới 1024px.
    - Badge đến hạn FSRS trên mục Ôn tập mang màu `destructive`, tĩnh, không có chuyển động nhấp nháy/pulse.
  - **Desktop (≥ 1024px):**
    - Sidebar cố định bên trái (`w-64 fixed inset-y-0 left-0 bg-card border-r border-border`).
    - Đỉnh: Biểu tượng MaiPace (`/brand/maipace-mark.svg` và tên `MaiPace` theo font hệ thống + nhãn phụ Minna N5).
    - Giữa: 5 tab chính xếp dọc rộng rãi, padding êm, trạng thái active nổi bật với `bg-primary/15 text-primary font-semibold`, badge đến hạn ở mục Ôn tập.
    - Đáy: Khối tài khoản thứ cấp: Trạng thái đồng bộ [SyncBadge.tsx](file:///d:/Projects/Lab/Japanese/web/src/components/SyncBadge.tsx) và nút dẫn tới `/cai-dat`.
- **Khoảng chừa ứng dụng ([web/src/app/layout.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/layout.tsx)):**
  - `< lg`: Dành khoảng chừa đáy `pb-28 sm:pb-32` cho thanh dock nổi.
  - `≥ lg`: Bỏ khoảng chừa đáy (`lg:pb-0`) và thêm lề trái `lg:pl-64` cho sidebar.
- **Bảng tin `/` ([web/src/app/page.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/page.tsx) & [web/src/components/DashboardContent.tsx](file:///d:/Projects/Lab/Japanese/web/src/components/DashboardContent.tsx)):**
  - Khuôn bề rộng: `content-wide` (`max-w-5xl`).
  - **Header:** Lời chào ngắn theo thời gian trong ngày (`Chào buổi sáng`, `Chào buổi tối`...) + nút Cài đặt/Tài khoản ở góc phải (kèm `SyncBadge`) phục vụ mobile.
  - **Việc nên làm tiếp theo (P0) & Bài đang học (P0/P1) — Luật hợp nhất:**
    - Khi `dueCount > 0`: Card P0 "Bắt đầu ôn tập" mang nút chính duy nhất `size="quiz"` (cao 48px, `bg-primary`), hiển thị số thẻ đến hạn. Phía dưới là Card P1 "Bài đang học".
    - Khi `dueCount = 0`: **Hợp nhất thành một thẻ duy nhất** "Bài đang học" mang nút chính duy nhất: **"Học tiếp bài {số}"** (hoặc "Bắt đầu bài 1" nếu chưa học), loại bỏ hoàn toàn việc lặp thẻ.
  - **Đồng bộ logic Bài đang học:** Sử dụng `loadLessonSummaries()` và `countLearnedByLesson()` để xác định chính xác bài hiện tại và tiến độ dựa trên `vocabCount` thật (khớp với `/hoc` và `LessonGrid.tsx`).
  - **Cần củng cố (P1):** Nếu `weakCount > 0`: hiển thị dải thông báo nhẹ: *"{weakCount} nội dung cần củng cố"* + nút duy nhất tới `/on-tap/diem-yeu`. Nếu `weakCount = 0`: ẩn hoàn toàn.
  - **Nhịp học (P2):** Tín hiệu chuỗi ngày nhẹ nhàng (`currentStreak`).
  - **Dọn sạch:** Xóa 4 ô KPI cũ (chuyển sang `/thong-ke`), xóa phân loại mục đến hạn (ở `/on-tap`), xóa danh sách 3 điểm yếu với các nút con (ở `/on-tap/diem-yeu`), xóa `DailyKanji` và con số giả định `30 phút`.

## Kiểm chứng

- **Kiểm tra tĩnh & Build (23/09/2026):**
  - `pnpm check`: PASS (TypeScript 0 lỗi, ESLint 0 cảnh báo).
  - `pnpm test`: PASS 98/98 unit tests (`src/lib/*.test.ts`).
  - `pnpm build`: PASS (tạo production bundle thành công cho 11 route).
- **Trình duyệt:**
  - Người dùng tự kiểm tra theo thỏa thuận.

## Bước tiếp theo

- Sẵn sàng chuyển sang **Đợt 3: Chuỗi Audio & Trình phát (SPEC-09 & SPEC-10)**:
  - SPEC-09: Quản lý nạp Audio qua file ZIP, xác thực SHA-256 nội bộ, lưu trữ IndexedDB, quản lý dung lượng/quota và xóa audio.
  - SPEC-10: Trình phát Shadowing Player, lặp đoạn A-B, điều khiển tốc độ (0.8x-1.2x) tích hợp vào cuối màn `/hoc/[so]`.

---

## Cập nhật 24/09/2026 — Bảng tin theo benchmark UI/UX (kèm SPEC-05 §2.1a)

Quyết định người dùng duyệt ngày 24/09/2026, nguồn: [benchmark](../research/ux-benchmark/README.md).
Hợp đồng đã sửa ở SPEC-02 §3.2 và SPEC-05 §2.1a.

**Thay đổi**

- Bỏ streak khỏi Bảng tin (chip ngọn lửa + màu `amber-*` thô). Streak còn ở `/thong-ke`.
- Bảng tin lấy số từ `useDueQueue` (cùng hook với `/on-tap`): "20 mục · khoảng N phút · còn M mục
  đến hạn cho lô sau". Số phút suy từ `secondsPerQuestion` của 20 phiên gần nhất; chưa có phiên → không hiện.
- Trạng thái "Đã ôn xong các mục đến hạn. Ngày mai có N mục." trong khối hợp nhất.
- Người mới: lối phụ "Tôi đã học đến bài…" → `/cai-dat#hoc-den-bai`.
- Cài đặt mới `reviewBatchSize` (5–100, mặc định 20) và `learnedThroughLesson` (0–25) trong
  `settings.ts`; trang Cài đặt dùng `NumberStepper` chung cho 3 ô số.
- `review-queue.ts`: `planReviewBatch` (lô ôn; mục mới chỉ lấp chỗ trống → tồn đọng ≥ lô thì không
  nạp mới), `withDeclaredLessons`. `useDueQueue`: `dueItems` giờ là mục đến hạn **của lô**, thêm
  `remainingDue`, `reviewBatchSize`. `/on-tap` hiện dòng "Còn N mục cho các lô sau".
- `stats.ts`: `pickActiveLesson` dùng chung cho Bảng tin và `LessonGrid` (bỏ hai bản tính riêng);
  bài ≤ N đã khai báo không bao giờ là bài đang học.
- `fsrs.ts` không đổi.

**Kiểm chứng (24/09/2026)**

- `pnpm check` PASS; `pnpm test` PASS 140/140 (thêm test `planReviewBatch`, `withDeclaredLessons`,
  `pickActiveLesson`, `secondsPerQuestion`, kẹp giá trị settings).
- Trình duyệt (agent-browser, dev server 3000, dữ liệu giả lập, đã xóa sau khi thử):
  - 390px, người mới: "Bắt đầu bài 1" + "Tôi đã học đến bài…", không có streak.
  - Link cuộn tới mục khai báo; nhập 10 → Bảng tin "Ôn tập · 20 mục", bài đang học = bài 11; `/hoc` cũng bài 11.
  - 50 mục quá hạn: `/on-tap` "20 mục đến hạn · 0 mục mới · còn 30 mục"; phiên ôn "1/20"; Bảng tin cùng số.
  - Mọi mục hạn ngày mai + hết hạn mức: "Đã ôn xong… Ngày mai có 50 mục." (390px và 1280px).
  - `get_errors`: không có lỗi.

**Chưa kiểm chứng / giới hạn**

- Chưa làm hết một lô thật đến màn kết quả; màn kết quả vẫn dẫn "Về ôn tập" (chưa có nút "Ôn tiếp lô sau" một chạm).
- `learnedThroughLesson` nằm ở localStorage nên không đồng bộ giữa thiết bị (đã chấp nhận).
- Chưa kiểm tra ước lượng số phút với dữ liệu phiên thật; chưa chạy `pnpm build`.

**Bước tiếp theo:** nhóm P0 còn lại của benchmark (câu sai quay lại trong phiên, thanh tiến độ, khung
phản hồi cố định đáy, nút "Luyện lại câu sai").
