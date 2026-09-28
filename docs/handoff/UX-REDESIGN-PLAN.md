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

## Đợt 28/09/2026 — triển khai song song và nghiệm thu

- Coordinator (Claude Code) dựng [bộ nghiệm thu](UX-REDESIGN-ACCEPTANCE.md), sửa gate tĩnh đỏ ở `afd6b6f` (Base UI `render` thay `asChild`, `config.lessons` thay `selectedLessons`, Profile bỏ `getUser()` mạng), rồi điều phối qua Orca run `run_18c609313661` 4 worker Antigravity `gemini-3.8-flash-high`, mỗi worker một worktree/branch: W1 SPEC-16/17, W2 SPEC-19, W3 SPEC-18, W4 SPEC-20.
- Review diff tìm ra 1 lỗi hành vi ở W2 (preset mặc định do `saveSettings` ghi toàn bộ settings che bài đang học) → giao W2b sửa kèm test. Coordinator sửa thêm: CTA người mới cố định `/hoc/1`, nhãn “mục đến hạn” ở `/on-tap` dùng `totalDueCount` cho khớp badge, khối nháp Bảng tin xuống dưới thẻ P0.
- Tất cả merge vào branch `ux-redesign` (HEAD `d1a3aff`), **chưa merge `master`, chưa push**. Gate: `pnpm check` exit 0, `pnpm test` 252/252, `pnpm build` exit 0.
- Browser 390/1280 trên dev server MaiPace `:3100` (`:3000` trên máy này là Repowise): kết quả chi tiết, 6 lỗi còn mở và phần chưa chạy ở bộ nghiệm thu §6.
- Chưa kiểm chứng: Supabase thật (đăng nhập, đẩy pendingSync, đổi tài khoản), iOS/Android thật, J3, B20.5, từng dạng trong 5 dạng, hạn mức mục mới và máy không có giọng ja-JP.
- Bước tiếp: người dùng review branch `ux-redesign` rồi quyết định merge; sửa 6 lỗi còn mở; thử với người học theo mục 3 ở trên.

## Đợt 28/09/2026 — sửa lỗi còn mở và merge

- Giao W6/W7/W8 (Antigravity) sửa lỗi #2–#6. W5 (#1) hỏng `agent_readiness` hai lần nên coordinator tự sửa. Coordinator sửa thêm: nháp ôn bị gọi là nháp luyện trên Bảng tin và `/luyen-tap` (hai loại nháp dùng chung một khóa lưu).
- Kiểm browser từng lỗi và cả nhánh “Luyện bài N” của Thống kê rỗng: xem [bộ nghiệm thu](UX-REDESIGN-ACCEPTANCE.md) §6.
- Gate: `pnpm check` exit 0, `pnpm test` 265/265, `pnpm build` exit 0. Merge `ux-redesign` → `master` (không push).
- Vẫn chưa kiểm chứng: Supabase thật, iOS/Android thật, J3, B20.5, từng dạng trong 5 dạng, hạn mức mục mới và máy không có giọng ja-JP. Bước tiếp: thử với người học (mục 3 ở trên).
