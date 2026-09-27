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
