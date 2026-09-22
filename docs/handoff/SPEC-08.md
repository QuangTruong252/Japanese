# Handoff — SPEC-08 (Đăng nhập & Đồng bộ Supabase)

Ngày: 22/09/2026. Trạng thái: Đã kiểm chứng (nghiệm thu trình duyệt đạt).

## Thay đổi và quyết định

- **Database Schema & Server-side RPC ([supabase/migrations/0001_init.sql](file:///d:/Projects/Lab/Japanese/supabase/migrations/0001_init.sql)):**
  - Khởi tạo bảng `profiles`, `practice_sessions`, `review_items`.
  - Thiết lập Row Level Security (RLS) nghiêm ngặt cô lập dữ liệu theo từng `auth.uid()`.
  - Trigger `on_auth_user_created` tự động tạo profile khi người dùng đăng ký qua OAuth Google.
  - RPC `sync_practice(payload jsonb)`:
    - Xử lý xác thực JWT `auth.uid()`.
    - Idempotent: `ON CONFLICT (id) DO NOTHING` với các phiên học tập.
    - Last-Write-Wins (LWW): cập nhật `review_items` chỉ khi `review_items.updated_at < EXCLUDED.updated_at`.
    - Hỗ trợ payload dạng `batch` (nhiều phiên/mục) và `import` (gộp hoặc thay thế toàn bộ).
- **Supabase Client & Auth Route ([web/src/lib/supabase/client.ts](file:///d:/Projects/Lab/Japanese/web/src/lib/supabase/client.ts), [server.ts](file:///d:/Projects/Lab/Japanese/web/src/lib/supabase/server.ts), [route.ts](file:///d:/Projects/Lab/Japanese/web/src/app/auth/callback/route.ts), [middleware.ts](file:///d:/Projects/Lab/Japanese/web/src/middleware.ts)):**
  - Hàm `isSupabaseConfigured()` kiểm tra cấu hình biến môi trường trước khi khởi tạo client.
  - Route `/auth/callback` xử lý trao đổi `code` lấy session và chuyển hướng an toàn về `/cai-dat`.
  - Middleware làm mới auth token tự động trên các route.
- **Client Sync Engine ([web/src/lib/sync.ts](file:///d:/Projects/Lab/Japanese/web/src/lib/sync.ts)):**
  - Luồng 2 chiều: Đẩy trước (Push từ hàng đợi Dexie `pendingSync` lên RPC), Kéo sau (Pull delta về Dexie).
  - Phân trang keyset bắt buộc `gt('updated_at', cursor).order('updated_at').order('id').limit(500)` để vượt qua giới hạn 1.000 dòng mặc định của Supabase PostgREST.
  - Bảo vệ quyền sở hữu dữ liệu cục bộ: lưu `jp:ownerUserId` trong `localStorage`, ngăn chặn trộn nhầm dữ liệu giữa hai tài khoản khác nhau trên cùng một máy.
  - Lắng nghe sự kiện `online` và `visibilitychange` (`document.visibilityState === 'visible'`) để tự động đồng bộ ngầm.
  - Xử lý lỗi client (4xx) không retry vô hạn; cập nhật trạng thái `SyncEngineStatus` chuẩn cho UI.
- **Giao diện & Thành phần Tương tác:**
  - [web/src/components/SyncBadge.tsx](file:///d:/Projects/Lab/Japanese/web/src/components/SyncBadge.tsx): Huy hiệu trên thanh điều hướng phản chiếu thời gian thực trạng thái đồng bộ (`synced`, `pending`, `syncing`, `offline`, `unconfigured`), có tooltip hiển thị số mục chờ và thời gian đồng bộ gần nhất, hỗ trợ bấm để kích hoạt đồng bộ ngay.
  - [web/src/app/cai-dat/page.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/cai-dat/page.tsx): Khối "Tài khoản" hiển thị thẻ trạng thái kết nối Supabase, nút "Đăng nhập bằng Google", avatar/thông tin người dùng khi đã đăng nhập, nút "Đồng bộ ngay", nút "Đăng xuất" và hộp thoại xác nhận đăng xuất (`AlertDialog`).

## Kiểm chứng

- **Kiểm tra tĩnh & Unit tests (22/09/2026):**
  - `pnpm check`: PASS (TypeScript 0 lỗi, ESLint 0 cảnh báo).
  - `pnpm test`: PASS 94/94 tests (`src/lib/*.test.ts`, bao gồm 3 unit tests mới trong `sync.test.ts` kiểm tra đọc/ghi `jp:ownerUserId`, `jp:lastPulledAt` và sự kiện listener `SyncStatus`).
- **Nghiệm thu trình duyệt (Browser subagent, 22/09/2026 trên localhost:3000/cai-dat):**
  - **Huy hiệu SyncBadge:**
    - Hiển thị trên thanh điều hướng với nhãn `Chờ đồng bộ (2)` tương ứng 2 bản ghi trong hàng đợi Dexie.
    - Tooltip và accessibility `aria-label` hiển thị đầy đủ, không gây lỗi giao diện.
  - **Khối Tài khoản:**
    - Hiển thị đúng card thông báo khi chưa gắn biến môi trường Supabase: *"Chưa thiết lập kết nối Supabase - Tiến độ học tập luôn được lưu an toàn trên máy (IndexedDB) và hoạt động ngoại tuyến đầy đủ."*
    - Các thành phần nút bấm tuân thủ token Washi, cỡ chữ và padding hài hòa.
  - **Responsive:**
    - Desktop (1920×1080) và Mobile (390×844): Layout co giãn mượt mà, thanh navigation cố định ở đáy trên mobile hiển thị gọn gàng, không bị vỡ layout hay che mất nội dung.

## Còn lại và bước tiếp theo

- SPEC-08 đã hoàn tất và nghiệm thu toàn bộ.
- Chuyển sang **Bước 4: Triển khai SPEC-07 (Thống kê & Biểu đồ)**:
  - Xây dựng trang `/thong-ke` ([web/src/app/thong-ke/page.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/thong-ke/page.tsx)).
  - 4 thẻ KPI đầu trang: Chuỗi ngày học (Streak), Thời gian học hôm nay (phút), Tỷ lệ đúng 7 ngày (%), Tổng số mục đang theo dõi (FSRS). Tận dụng các hàm tính toán thuần túy từ [web/src/lib/stats.ts](file:///d:/Projects/Lab/Japanese/web/src/lib/stats.ts).
  - Biểu đồ thời lượng học (7 ngày và 30 ngày gần nhất) bằng CSS bar chart / SVG thuần theo phong cách Washi tối giản.
  - Bản đồ nhiệt học tập (Activity Heatmap) dạng lưới ô vuông phong cách GitHub/Washi thể hiện mật độ luyện tập theo ngày.
  - Biểu đồ phân bố mục tiêu theo loại (từ vựng, ngữ pháp, kanji, trợ từ, nghe).
  - Nút chuyển hướng liên kết trực tiếp tới trang điểm yếu `/on-tap/diem-yeu` (tái sử dụng tính năng đã nghiệm thu ở SPEC-05, không duplicate code).
