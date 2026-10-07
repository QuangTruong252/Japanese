# Kế hoạch redesign UI v2 — "Sân khấu và mảnh giấy"

Ngày: **07/10/2026**. Coordinator: Claude Code. Triển khai: Antigravity (Orca). Review UI/UX:
Codex (Orca). Branch tích hợp `ui-redesign-v2` (worktree `../Japanese-ui`), chưa merge `master`.
**07/10: đã làm xong đợt 1–3; kết quả và giới hạn ở [handoff](../handoff/UI-REDESIGN-V2.md).**

## Mục tiêu

Áp hướng thiết kế đã bàn cho 8 màn chính: thân thiện, gọn, hiện đại, có cá tính Phố giấy.
Nguồn thành phần từng màn: [prompts-man-hinh.md](../research/open-design/prompts-man-hinh.md)
(Bảng tin theo SPEC-18 bản 2 do người dùng chốt 06/10; các màn khác lấy từ SPEC hiện hành).
Luật toàn cục: `DESIGN.md` mục **Stage + paper slip** (thêm 07/10).

Ba luật xuyên suốt:

1. **Sân khấu + mảnh giấy.** Cảnh bài học tràn ngang, mờ vào giấy; một mảnh giấy lấn lên mép
   cảnh chứa nút son duy nhất, viết thành câu có số liệu.
2. **Mọi thứ khác là dòng link** có đường mảnh và chevron; không khung thẻ lặp lại.
3. **Chữ Nhật là chữ lớn nhất** trong khối; ≤3 cỡ chữ Latin mỗi màn; tiêu đề ~6 từ, một dòng phụ.

Ngoài phạm vi (YAGNI): ánh sáng theo giờ, biến thể mùa, tư thế nhân vật theo trạng thái
(cần asset mới), màn onboarding, đổi font, đổi token màu, đổi Dexie/FSRS/sync/chấm điểm.

## Nền tảng (coordinator, đã làm trước khi giao)

- `web/src/components/PaperStage.tsx`: `Stage`, `PaperSlip`, `LinkRow`.
- `LessonSummary.cover` (`web/src/lib/lessons.ts`): cảnh của bài cho Bảng tin và lộ trình.
- `DESIGN.md`: luật Stage + paper slip và dòng trong bảng ánh xạ.

## Đợt 1 — sáu worker Antigravity song song

Mỗi worker một worktree con từ `ui-redesign-v2`, sở hữu file riêng (merge không xung đột).

| W | Màn | File được sửa | Prompt |
|---|---|---|---|
| A | Bảng tin `/` | `DashboardContent.tsx`, `lib/dashboard-cta.ts`(+test), file mới `lib/today-sentence.ts`(+test) | §0 |
| B | Học bài `/hoc` lộ trình 25 bài | `LessonGrid.tsx`, `app/hoc/page.tsx` | §1 |
| C | Chi tiết bài `/hoc/[so]` | `app/hoc/[so]/page.tsx` | §2 |
| D | Ôn tập `/on-tap` (+ "Cần củng cố" từ Bảng tin) | `app/on-tap/page.tsx`, `DashboardReinforcement.tsx` | §4 |
| E | Câu hỏi luyện tập + Kết quả phiên | `components/practice/*` | §3, §6 |
| F | Luyện tập `/luyen-tap` + Tra cứu `/hoc/tra-cuu` | `app/luyen-tap/page.tsx`, `app/hoc/tra-cuu/page.tsx` | §5, §7 |

Không ai sửa: `PaperStage.tsx`, `LessonProgress.tsx`, `AppNav.tsx`, `globals.css`, `DESIGN.md`,
`lib/db.ts`, `fsrs.ts`, `sync.ts`, `review-queue.ts`, `ReviewRunner.tsx`, dữ liệu JSON. Cần đổi
file ngoài danh sách thì hỏi coordinator.

Mỗi worker: không chạy dev server/build/curl localhost; chạy `pnpm check` và `pnpm test` trong
`web/`; commit vào branch của mình; không tick ô nghiệm thu browser trong spec.

## Đợt 2 — tích hợp và review

1. Coordinator merge 6 branch vào `ui-redesign-v2`, chạy check/test/build, mở một dev server
   `:3100`, chụp 8 màn ở 390/1280, sáng/tối, các trạng thái chính.
2. Codex review UI/UX (chỉ đọc): diff `master..ui-redesign-v2`, ảnh chụp, prompt từng màn,
   `DESIGN.md`, `web-design-guidelines`. Kết quả: `docs/handoff/UI-REDESIGN-V2-REVIEW.md`
   (P0/P1/P2 theo màn, có file:line và cách sửa).

## Đợt 3 — sửa theo review, đánh giá cuối

- Antigravity sửa P0/P1 theo nhóm file như đợt 1; coordinator đọc toàn bộ diff.
- Coordinator nghiệm thu browser thật (luồng học, luyện, ôn, mất mạng trong tab đã mở,
  bàn phím, furigana, reduced motion), cập nhật SPEC/handoff, rồi bàn giao người dùng.
  Không merge `master`/push khi người dùng chưa đồng ý.
