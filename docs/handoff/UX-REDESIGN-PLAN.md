# Handoff — kế hoạch làm lại luồng UI/UX

Ngày: 27/09/2026. Trạng thái: **đã có kế hoạch/spec nháp; chưa sửa hoặc nghiệm thu UI mới**.

## Thay đổi và quyết định

- Đã tạo [kế hoạch tổng](../plans/2026-09-27-ux-redesign.md) và [SPEC-16–20](../specs/README.md#kế-hoạch-ux-27092026--chưa-triển-khai) cho năm mốc độc lập. Căn cứ gồm PRODUCT, DESIGN, code `master` và [đề xuất/ảnh concept](../research/ux-redesign/2026-09-27-mobile-learning-flows.md).
- Quyết định thứ tự: Profile/Thống kê hoạt động trước khi đổi dock; giữ `/hoc/tra-cuu` và route con; `/thong-ke` cũ dẫn sang tab Profile; trang bài giữ deep link nội dung trên URL hiện tại. Bảng tin ưu tiên mục đến hạn khi cùng lúc có nháp, cần thử với người học.
- File/API có thể dùng lại: `AppNav`, `DashboardContent`, `LessonGrid`, `SearchDialog`, `search.ts`, `stats.ts`, `SyncBadge`, `use-due-queue.ts`, `PracticeDraftBanner`, `fsrs.ts`, route và helper hiện có. Không sửa code, `DESIGN.md`, Dexie, sync hay test trong đợt viết plan.
- Chỉ mục `docs/specs/README.md` có mục spec nháp riêng; sửa ghi chú Git cũ bằng merge `d2b7170` đã quan sát ngày 27/09.

## Kiểm chứng

- 27/09/2026: đối chiếu route/component liên quan và Git root/status; `master` có commit merge `d2b7170`. Quan sát UI 390px/1280px từ lượt rà soát trước trong cùng phiên; ảnh concept dùng dữ liệu giả.
- Kiểm liên kết/tên file và định dạng Markdown trong đợt này. `pnpm check`, `pnpm test`, `pnpm build`: **chưa chạy**, vì chỉ thay đổi tài liệu. Browser **chưa nghiệm thu UI mới**, vì chưa triển khai.
- Supabase thật hai thiết bị, PWA standalone và hành trình mất mạng/reconnect: **chưa kiểm chứng** trong kế hoạch này.

## Còn lại và bước tiếp theo

1. Triển khai mốc 1 theo SPEC-16: cập nhật `DESIGN.md`/SPEC-02/07/08 cùng code, giữ Thống kê truy cập được trong suốt chuyển đổi; kiểm browser và ghi handoff SPEC-16.
2. Tiếp tục các mốc 2–5 theo phụ thuộc/gate của kế hoạch; không đánh dấu spec hoàn tất trước khi có kiểm tra thực.
3. Thử hành trình toàn vòng với người học để quyết định cuối cùng thứ bậc nháp Luyện và Ôn trên Bảng tin.
