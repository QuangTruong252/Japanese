# SPEC-16 — Điều hướng chính, Profile và tiến độ

Ngày: 27/09/2026. Trạng thái: **hoàn tất triển khai (Mốc 1 UX)**. Đã cập nhật có chủ đích `DESIGN.md` §Navigation và SPEC-02/07/08 trong cùng thay đổi; nghiệm thu và bằng chứng tại `docs/handoff/SPEC-16.md`.

## 1. Mục tiêu & phạm vi

- Năm đích điều hướng: Bảng tin, Học, Luyện, Ôn, Tra cứu. Profile chứa tiến độ/thống kê, đăng nhập và lối Cài đặt ở khu vực riêng ngoài dock.
- Một người chưa đăng nhập vẫn học và xem toàn bộ thống kê lưu trên máy. Đăng nhập bằng Google giải thích lợi ích đồng bộ, không là cổng vào nội dung.
- Phạm vi là shell, Profile, route thống kê và lối auth; không đổi thuật toán thống kê/sync hoặc cấu trúc dữ liệu.

## 2. Dữ liệu

- Tiến độ, phiên và mục ôn: Dexie qua `useLiveQuery`; số liệu qua `web/src/lib/stats.ts`, tiến độ bài qua helper hiện có. Không đọc Supabase trong render path hoặc persist bản sao vào Zustand.
- Auth dùng Supabase session hiện có; sync dùng `SyncBadge`/trạng thái trong `sync.ts`. Khi chưa cấu hình Supabase, Profile nói rõ “Đồng bộ chưa khả dụng trên bản này” và không có nút Google giả.
- Giữ `jp:ownerUserId`, quy trình tài khoản khác, pending sync và đăng xuất theo SPEC-08. Không tự nhập/gộp dữ liệu giữa user.

## 3. Màn hình & bố cục

**05/10/2026 — Phố giấy:** mobile dùng thanh điều hướng sát mép dưới, nền opaque/viền trên, không pill hay bóng; năm mục và badge giữ nguyên, active có gạch chân. Desktop sidebar nền giấy, logo/chữ lớn và active gạch chân. Header vẫn giữ tìm kiếm/theme/cài đặt/tài khoản, dùng kích thước nút utility 44px và account 48px để không tràn ở 360px với font gốc 20px. Shell chừa padding và scroll-padding phía dưới để cuộn/focus không nằm dưới thanh. Hide chrome trong các phiên giữ nguyên. Kiểm chứng theo phạm vi ở handoff SPEC-21.

| Bề mặt | Bố cục/hành động |
| --- | --- |
| Dock `< lg` | Năm mục có icon + nhãn, thứ tự `Bảng tin · Học · Luyện · Ôn · Tra cứu`; thứ năm trỏ `/hoc/tra-cuu`. Route Tra cứu và con của nó active Tra cứu, không active Học. Badge mục đến hạn ở Ôn. |
| Header năm màn chính | Một nút có icon người và chữ “Tài khoản” ở góc phải; sau đăng nhập có thể thay icon bằng avatar, giữ chữ và vị trí. Bỏ các nút utility trùng lặp khỏi cùng hàng nếu gây chật ở 390px; tìm kiếm vẫn vào được từ Tra cứu và ngữ cảnh bài. |
| Sidebar `>= lg` | Năm mục cùng thứ tự; khối cuối sidebar dẫn `/ca-nhan`, có trạng thái sync bằng chữ. |
| `/ca-nhan` | Tab URL **Tiến độ**. Khách: “Tiến độ trên máy này”, bài đang học, số nội dung đã học, ôn đến hạn; CTA Google nếu cấu hình hợp lệ. Đã đăng nhập: tài khoản, sync, cùng dữ liệu tiến độ cục bộ. Lối “Cài đặt & dữ liệu”. |
| `/ca-nhan/thong-ke` | Tab URL **Thống kê**, tái dùng nội dung/helper SPEC-07: KPI, lịch nhiệt và biểu đồ. Khách xem được; loading/empty hiện copy thực. |
| `/thong-ke` | Chuyển hướng sang `/ca-nhan/thong-ke`; query/fragment hợp lệ cần được cân nhắc để không mất link nội bộ/bookmark. |

Không thêm account header trong phiên luyện, ôn hoặc flashcard toàn màn. Lối thoát/lưu nháp hiện có đưa về màn chính.

## 4. Component dùng lại

`AppNav`, `SyncBadge`, `DashboardContent`, `stats.ts`, trang Thống kê, auth trong `/cai-dat`, shadcn Base UI Tabs/Link/Button nếu phù hợp. Trích component thống kê dùng chung khi cần để không render hai cây logic khác nhau. Cập nhật mapping pattern trong `DESIGN.md` nếu thêm component chung.

## 5. Trạng thái

| Trạng thái | Điều người học thấy |
| --- | --- |
| Guest, chưa học | Tiến độ bằng 0, CTA “Bắt đầu Bài 1”; Thống kê có empty state thật; có thể chuyển tab. |
| Guest, đã học | Tiến độ/thống kê trên máy vẫn đầy đủ; CTA sync thứ cấp. |
| Đang xác định session | Placeholder/skeleton có kích thước ổn định; không chớp nút đăng nhập sai trạng thái. |
| Logged in, synced/pending/offline | Tên/avatar nếu có, nhãn trạng thái chữ, đường xử lý pending hoặc vào Cài đặt khi cần. |
| Supabase không cấu hình hoặc lỗi auth | Nêu tình trạng và bước tiếp theo; dữ liệu cục bộ vẫn xem được. |
| Đổi tài khoản/đăng xuất | Hộp thoại và cảnh báo pending đúng SPEC-08; không xóa âm thầm. |

## 6. Tương tác & chuyển động

- Nút Tài khoản và mỗi tab dùng link thật; URL/Back/Forward mở đúng tab và focus hợp lý.
- Sau login quay về Profile hoặc ngữ cảnh trước OAuth nếu luồng hiện có hỗ trợ, không tự khởi động phiên học khác.
- Không dùng chuyển động kéo dài để nhấn mạnh sync; tôn trọng reduced motion. Chạm đồng bộ chỉ khi trạng thái hiện có cho phép.

## 7. Accessibility

- Dock/Account ≥48px vùng chạm ở mobile; icon có tên truy cập, `aria-current` chỉ trên mục thật. Năm nhãn không bị cắt ở 320–390px/zoom 200%.
- Tab có tên, trạng thái chọn và thứ tự focus rõ; biểu đồ/bảng số liệu giữ bản đọc chữ hiện có. Status không chỉ dựa vào màu. Safe area và khoảng chừa dock không che hành động cuối trang.

## 8. Bảo mật & dữ liệu

Không đưa secret/token vào UI hoặc log. Profile hiển thị dữ liệu của Dexie hiện tại theo quy tắc sở hữu SPEC-08; tài khoản khác phải qua guard trước khi sync. Logout không xóa Dexie. Không đổi RLS, RPC hay semantics của `pendingSync` trong mốc này.

## 9. Tiêu chí nghiệm thu

- [ ] Profile/Thống kê mở từ cả năm màn chính ở 390px trong một chạm; desktop từ chân sidebar. Guest không bị chặn.
- [ ] Dữ liệu Thống kê trước/sau chuyển route khớp; `/thong-ke` cũ đến tab đúng; Back/Forward giữ tab.
- [ ] Sau khi Profile đã hoạt động mới thay mục dock thứ năm; Tra cứu active ở hub và mọi route con, Học active ở bài học.
- [ ] Kiểm guest rỗng/có dữ liệu, logged in, Supabase unconfigured, pending/offline, đổi tài khoản và logout theo SPEC-08.
- [x] Đã chạy unit tests; kiểm tra logic điều hướng mới (nav.test.ts); nghiệm thu browser và full check/build bàn giao cho giám sát viên.

## 10. Khối lệnh bàn giao thiết kế

Thiết kế mobile 390px trước, desktop 1280px sau. Dùng `PRODUCT.md`, `DESIGN.md` **sau khi sửa hợp đồng Navigation**, token từ `globals.css`; Washi và nội dung tiếng Việt thật. Trình bày ba trạng thái Profile (khách có dữ liệu, đã đăng nhập pending sync, khách rỗng), hai tab URL và nút Tài khoản nhất quán trên năm màn. Không lấy các số giả trên ảnh concept làm dữ liệu sản phẩm.
