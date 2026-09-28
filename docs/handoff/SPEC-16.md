# Handoff — SPEC-16: Điều hướng chính, Profile và tiến độ

Ngày: 2026-09-27. Trạng thái: **Đã triển khai đầy đủ code và unit test**. Kiểm chứng toàn diện (browser acceptance, `pnpm check`, `pnpm build`) bàn giao cho Codex giám sát viên theo quy ước không chạy song song giữa 5 worker.

## Thay đổi và quyết định kỹ thuật

1. **Xây dựng Profile và Thống kê trước khi đổi dock**:
   - Khởi tạo route `/ca-nhan` (Tab Tiến độ) và `/ca-nhan/thong-ke` (Tab Thống kê) với shared layout `web/src/app/ca-nhan/layout.tsx`.
   - Trích xuất toàn bộ giao diện và logic Thống kê từ SPEC-07 thành component dùng chung `web/src/components/stats/StatisticsContent.tsx`.
   - Route `/thong-ke` chuyển hướng (307/308 redirect qua Next.js server component) sang `/ca-nhan/thong-ke`, bảo toàn nguyên vẹn `searchParams`.

2. **Cập nhật 5 đích điều hướng chính trong `AppNav.tsx`**:
   - Năm mục chính theo thứ tự: `Bảng tin` (`/`) · `Học bài` (`/hoc`) · `Luyện tập` (`/luyen-tap`) · `Ôn tập` (`/on-tap`, badge mục đến hạn) · `Tra cứu` (`/hoc/tra-cuu`).
   - Tách hàm thuần `isNavActive` tại `web/src/lib/nav.ts` (có unit test `web/src/lib/nav.test.ts`):
     - Route `/hoc/tra-cuu` và toàn bộ route con (`/hoc/tra-cuu/*`) kích hoạt mục Tra cứu, **không** kích hoạt Học bài.
     - Route `/hoc` và các bài học chi tiết (`/hoc/*`) kích hoạt Học bài, **không** kích hoạt Tra cứu.
     - Route `/` chỉ kích hoạt khi đúng trang chủ.

3. **Lối vào thứ cấp Profile & Header một chạm trên mobile**:
   - Desktop (`>= lg`): Chân sidebar chuyển thành khối tài khoản dẫn vào `/ca-nhan`, hiển thị avatar/tên người dùng, trạng thái đồng bộ dạng chữ kèm icon (`CloudCheck` / `CloudUpload` / `CloudOff`), và link phụ vào `Cài đặt & Dữ liệu` (`/cai-dat`).
   - Mobile (`< lg`): Header đầu trang trên 5 màn chính tích hợp nút `AccountButton` (`/ca-nhan`), đáp ứng vùng chạm ≥48px (`min-h-[48px]`), mở Profile trong một chạm từ cả 5 màn chính.
   - Không xuất hiện account header trong các phiên làm bài toàn màn hình (`/luyen-tap/phien`, `/on-tap/phien`, `/hoc/*/tu-vung`).

4. **Trạng thái Profile & Tuân thủ SPEC-08**:
   - Đọc dữ liệu tiến độ Dexie qua `useLiveQuery`: bài đang học (`pickActiveLesson`), tiến độ từ vựng bài, mục đến hạn hôm nay (`useDueClock`), tổng mục trong lịch ôn, số bài đã hoàn thành.
   - Guest chưa có dữ liệu: Hiển thị trạng thái "Tiến độ bằng 0" kèm CTA "Bắt đầu Bài 1" (`/hoc/1`).
   - Supabase chưa cấu hình: Nêu rõ "Đồng bộ chưa khả dụng trên bản này", không hiển thị nút Google giả.
   - Guest có tiến độ: Khối "Tiến độ trên máy này" giải thích lợi ích đồng bộ, nút Google CTA thứ cấp (`signInWithGoogle`).
   - Đã đăng nhập: Thông tin tài khoản, avatar, trạng thái sync (Đã đồng bộ, Chờ đồng bộ, Ngoại tuyến, Đang đồng bộ), nút "Đồng bộ ngay" và "Đăng xuất".
   - Hộp thoại đăng xuất tuân thủ SPEC-08: Nếu có pending sync, cảnh báo mục chưa đồng bộ sẽ chỉ được đẩy lên khi đăng nhập lại đúng tài khoản này; xác nhận đăng xuất giữ nguyên dữ liệu Dexie trên máy.

5. **Đồng bộ hợp đồng tài liệu**:
   - `DESIGN.md`: Cập nhật bảng 5 đích điều hướng Navigation (`Tra cứu` thay `Thống kê`), mô tả secondary surface Profile (`/ca-nhan`), cập nhật mapping table (`AppNav.tsx`, `page.tsx` Profile, `StatisticsContent.tsx`, `AccountButton.tsx` chuyển trạng thái `stable`).
   - `docs/specs/SPEC-02-shell-dieu-huong.md`: Cập nhật bảng 5 khu vực chính và lối thứ cấp Profile.
   - `docs/specs/SPEC-07-thong-ke.md`: Ghi nhận route chuyển vào tab `/ca-nhan/thong-ke` và chuyển hướng `/thong-ke`.
   - `docs/specs/SPEC-08-dong-bo-supabase.md`: Ghi nhận khối tài khoản và đồng bộ trên `/ca-nhan`.
   - `docs/specs/SPEC-16-dieu-huong-profile.md`: Đánh dấu hoàn tất triển khai Mốc 1 UX.

## File và component liên quan

- **Tạo mới**:
  - `web/src/components/stats/StatisticsContent.tsx`: Giao diện và biểu đồ thống kê tái sử dụng.
  - `web/src/components/profile/AccountButton.tsx`: Nút tài khoản dùng chung.
  - `web/src/app/ca-nhan/layout.tsx`: Layout trang Cá nhân với 2 URL tab (Tiến độ & Thống kê).
  - `web/src/app/ca-nhan/page.tsx`: Màn Hồ sơ / Tiến độ.
  - `web/src/app/ca-nhan/thong-ke/page.tsx`: Tab Thống kê.
  - `web/src/lib/nav.ts`: Helper kiểm tra active route cho điều hướng.
  - `web/src/lib/nav.test.ts`: Test kiểm tra logic active route.
- **Sửa đổi**:
  - `web/src/components/AppNav.tsx`: 5 đích điều hướng, sidebar chân trang, header mobile.
  - `web/src/app/thong-ke/page.tsx`: Chuyển hướng sang `/ca-nhan/thong-ke`.
  - `DESIGN.md`: Mục Navigation và Component mapping table.
  - `docs/specs/SPEC-02-shell-dieu-huong.md`, `docs/specs/SPEC-07-thong-ke.md`, `docs/specs/SPEC-08-dong-bo-supabase.md`, `docs/specs/SPEC-16-dieu-huong-profile.md`.

## Bằng chứng kiểm chứng

- **Unit tests**: `pnpm test` trong `web/` chạy với `node --test`:
  - Kết quả: **209/209 tests PASS** (100%).
  - Đã bổ sung 4 test cases trong `nav.test.ts` kiểm chứng toàn bộ phân nhánh active của `/hoc/tra-cuu`, `/hoc`, `/`, `/luyen-tap`, `/on-tap`.
- **Ranh giới sở hữu tuân thủ tuyệt đối**:
  - Không sửa `DashboardContent.tsx`, practice, review, lookup/search, `docs/specs/README.md` hay các kế hoạch UX hiện có.
  - Giữ nguyên mọi dirty changes ngoài phạm vi.

## Giới hạn và phần bàn giao cho giám sát viên

1. **Kiểm tra trình duyệt (Browser acceptance 390px / 1280px)**:
   - Theo chỉ thị của giám sát viên, full `pnpm check`, `pnpm build` và kiểm thử browser tương tác trực tiếp được bàn giao cho Codex giám sát chạy đồng bộ nhằm tránh xung đột process giữa 5 worker.
2. **Môi trường Supabase cloud thật**:
   - Đã kiểm tra qua mock và guard `isSupabaseConfigured()`; kết nối OAuth trực tiếp với Google client ID thật cần môi trường cấu hình `.env.local` của người dùng.

## Đợt 28/09/2026: Làm cứng shell điều hướng và Profile

### Thay đổi và quyết định kỹ thuật
1. **Loại bỏ `getUser()` khỏi `AppNav.tsx` & `AccountButton.tsx`**:
   - `AppNav.tsx` chỉ dùng `onAuthStateChange` (INITIAL_SESSION) đọc session cục bộ, không gọi mạng trên mỗi trang; xóa import thừa `RefreshCw`.
   - `AccountButton.tsx` loại bỏ hoàn toàn `getUser()`, nhận prop `user` từ `AppNav` (hoặc fallback `onAuthStateChange` nếu dùng độc lập).
2. **Lối Tài khoản duy nhất & Ẩn chrome phiên toàn màn**:
   - Header mobile (<lg) dùng duy nhất `AccountButton` từ `AppNav`; desktop ≥lg ở chân sidebar.
   - Thêm hàm thuần `shouldHideAppChrome(pathname)` trong `web/src/lib/nav.ts` (ẩn header mobile, dock và sidebar trên `/luyen-tap/phien`, `/on-tap/phien`, `/hoc/[so]/tu-vung`).
   - Bổ sung test suite trong `web/src/lib/nav.test.ts` kiểm thử đầy đủ các ca đúng (phải ẩn) và ca sai (không ẩn).
3. **Trạng thái active nút Tài khoản**:
   - Khi ở `/ca-nhan/**`, nút header Tài khoản hiển thị trạng thái active (`aria-current="page"`).
4. **Empty state Thống kê (`StatisticsContent.tsx`)**:
   - Bỏ nhắc "chuỗi ngày" (đã bỏ theo hợp đồng sản phẩm 24/09).
   - Khi chưa có bài/phiên nào, CTA chính dẫn `/hoc/1` ("Bắt đầu Bài 1" kèm icon `BookOpen`), không dẫn luyện tập.
5. **Dọn dẹp code & lint**:
   - Xóa import `Clock` không sử dụng trong `web/src/app/ca-nhan/page.tsx`.
   - Cập nhật checklist §9 trong `docs/specs/SPEC-16-dieu-huong-profile.md` về `[ ]` cho các mục cần kiểm thử browser.

### File liên quan
- `web/src/components/AppNav.tsx`
- `web/src/components/profile/AccountButton.tsx`
- `web/src/app/ca-nhan/page.tsx`
- `web/src/components/stats/StatisticsContent.tsx`
- `web/src/lib/nav.ts`
- `web/src/lib/nav.test.ts`
- `docs/specs/SPEC-16-dieu-huong-profile.md`
- `docs/handoff/SPEC-16.md`

### Kết quả kiểm chứng thực chạy
- `pnpm check`: **exit 0** (0 error; 0 warning trong các file thuộc phạm vi task).
- `pnpm test`: **211/211 PASS** (100%, tăng 2 test so với baseline 209).
- Kiểm tra `grep "getUser("`: không còn lệnh gọi `getUser(` trong `AppNav.tsx`, `ca-nhan/**` và `profile/**`.

### Giới hạn
- Chưa nghiệm thu browser — chờ coordinator.

## Đợt 28/09/2026 — sửa lỗi còn mở #3, #5

### Bối cảnh & Mục tiêu
Sửa 2 lỗi còn mở sau đợt tích hợp theo `docs/handoff/UX-REDESIGN-ACCEPTANCE.md` §6:
- Lỗi #3: Sidebar desktop khi Ôn tập active bị biến thành chấm đỏ mất số; dock mobile badge bị nhỏ dạng chấm.
- Lỗi #5: Thống kê rỗng hiện "Bắt đầu Bài 1" dù người học đã có tiến độ từ vựng/khai báo bài đã học.

### Thay đổi và quyết định kỹ thuật
1. **Lỗi #3 — Badge điều hướng luôn hiện số & đúng tương phản Washi**:
   - Tách hàm thuần `formatNavBadgeCount(count)` trong `web/src/lib/nav.ts`: trả về `null` khi `count <= 0` hoặc không hợp lệ; trả chuỗi số `1..99`; cắt `99+` khi `> 99`.
   - Bổ sung unit test trong `web/src/lib/nav.test.ts` với đầy đủ ca đúng/sai/cắt ngưỡng.
   - Sửa `AppNav.tsx`:
     - Chuyển màu badge từ `bg-destructive text-destructive-foreground` sang `bg-primary text-primary-foreground`. (Nguyên nhân mất số: biến CSS `--destructive-foreground` chưa được khai báo trong `:root` và `.dark`, dẫn đến khi active link mang `text-primary`, chữ bên trong badge thừa kế màu đỏ đè lên nền đỏ thành chấm đỏ không còn số).
     - Badge dùng token `bg-primary text-primary-foreground` tương phản cao trên cả nền active (`bg-primary/15`) lẫn inactive (`bg-card`/`bg-muted/60`).
     - Tăng kích thước vùng chứa badge mobile dock (`min-w-5 h-4.5 px-1`) và sidebar desktop (`min-w-5 h-5 px-1.5`) đảm bảo hiển thị rõ ràng cả số đơn và chuỗi `99+`.
     - Giữ `aria-label="Ôn tập, N mục đến hạn"` trên link và gắn `aria-hidden="true"` trên span của badge.

2. **Lỗi #5 — Phân biệt trạng thái rỗng Thống kê (`StatisticsContent.tsx`)**:
   - Tách hàm thuần `resolveStatsEmptyState(input)` trong `web/src/lib/stats.ts`:
     - Khi `sessionCount > 0`: `isEmpty = false`.
     - Chưa có gì (0 phiên, 0 reviewItems, `learnedThroughLesson` = 0): giữ CTA "Bắt đầu Bài 1" → `/hoc/1` (icon `BookOpen`).
     - Đã có reviewItems hoặc `learnedThroughLesson > 0` nhưng 0 phiên: copy giải thích rõ ràng thống kê được tính từ các phiên luyện tập và ôn tập; CTA chính "Ôn tập" (`/on-tap`, icon `RotateCcw`) nếu có mục đến hạn (`dueCount > 0`), ngược lại "Luyện bài N" (`/luyen-tap?lessons=N`, icon `Dumbbell`, N xác định qua `pickActiveLesson`).
   - Bổ sung unit test toàn diện cho `resolveStatsEmptyState` trong `web/src/lib/stats.test.ts`.
   - Cập nhật `StatisticsContent.tsx`: đọc `dueCount` qua `useLiveQuery`, `learnedThroughLesson` qua `useSyncExternalStore(subscribeSettings)`, tải danh sách tóm tắt bài N5 để tính `pickActiveLesson`, và áp dụng `resolveStatsEmptyState`.

### File liên quan
- `web/src/lib/nav.ts`
- `web/src/lib/nav.test.ts`
- `web/src/components/AppNav.tsx`
- `web/src/lib/stats.ts`
- `web/src/lib/stats.test.ts`
- `web/src/components/stats/StatisticsContent.tsx`
- `docs/handoff/SPEC-16.md`

### Kết quả kiểm chứng thực chạy
- `pnpm check`: **exit 0** (0 error, 0 warning toàn repo).
- `pnpm test`: **254/254 PASS** (100%, tăng 2 test so với baseline 252).
- Kiểm tra ranh giới sở hữu: Không sửa bất kỳ file nào ngoài danh sách được giao.

### Giới hạn
- Chưa nghiệm thu browser — chờ coordinator.
