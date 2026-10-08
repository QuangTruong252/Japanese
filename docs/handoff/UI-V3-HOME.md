# Handoff — Ngôn ngữ thị giác v3 "Sách sống" + Home
Ngày: 2026-10-08 (cập nhật sau review người dùng cùng ngày). Trạng thái: đã có code, đã kiểm chứng browser trên dev server (chưa thiết bị thật). Nhánh `feat/ui-v3-home`, chưa merge/push.

## Thay đổi và quyết định
- Spec: `docs/superpowers/specs/2026-10-08-maipace-visual-language-v3-design.md`; plan: `docs/superpowers/plans/2026-10-08-visual-language-v3-home.md`.
  Hướng chốt qua 3 vòng mockup trong `design-lab/` (tham chiếu: `home-v3.html`, khung C2; không bundle).
- Font toàn app: giao diện Be Vietnam Pro (thay Inter), `font-serif` = Noto Serif, câu Nhật lớn dùng `.jp-display` (Shippori Mincho); chữ Nhật nhỏ giữ `--font-jp`. Tự host qua `@fontsource`.
- `Furigana` chỉ xuống dòng tại dấu cách của dữ liệu (`groupFuriganaWords` trong `lib/japanese.ts`); áp cho mọi màn.
- **Đổi luật CTA Home** (quyết định người dùng): nút chính luôn "Bắt đầu Bài 1"/"Tiếp tục Bài N"; ôn đến hạn và phiên dở thành dòng phụ. `resolveDashboardCta` bỏ `batchCount`/`resumeDraft`/`isPrimaryReview`, thêm `reviewHref` (`/on-tap` khi có nháp Luyện/Ôn).
- `LessonSummary` thêm `vocabThumb`, `grammarThumb` (ảnh thật đầu tiên của bài).
- `components/PaperKit.tsx` (mới, song song `PaperStage.tsx`): `SoftScene`, `PaperCloud`, `TornCard`, `SectionHeader`, `ListRow`, `PartRow`; CSS `.soft-scene`, `.paper-cloud`, `.torn-card*` trong `globals.css`.
- `DashboardContent.tsx` dựng lại theo C2; bỏ thanh tiến độ, ước tính phút, câu mô tả tra cứu (luật chữ tối giản §2.5).
- Chỉnh theo review người dùng (08/10, sau bản đầu): nhãn `/ Hôm nay /` trong `TornCard` (bỏ tiêu đề mục phía trên),
  viền + quầng accent cho thẻ, `SpeakButton` tròn (thêm prop `className`), nghĩa in nghiêng; `PartRow` dùng icon
  thay số thứ tự, số liệu cùng hàng tiêu đề và mờ hơn, ảnh nhỏ trong khung; "Bảng tra" nằm trong ô tìm.
- Ảnh chung `ui/sections/*` (Codex image_gen, nhóm mới `ui/sections` trong `batch.mjs`) + bảng `VOCAB_THUMB`.
- Bộ icon `FeatureIcon` (spec §3.1; nguồn `artwork/icons/`): icon thẻ cho Home/hub Tra cứu, bộ `nav-*` cho `AppNav`.
- Không đổi: 7 màn khác (vẫn `Stage/PaperSlip`; riêng hub `/hoc/tra-cuu` đã đổi chữ to sang icon), dữ liệu, FSRS, sync.
- Root `AGENTS.md`/`DESIGN.md`/`PRODUCT.md`/`CLAUDE.md` đang rỗng có chủ đích trong working tree; không commit.

## Kiểm chứng (2026-10-08)
- `pnpm check` PASS · `pnpm test` 267/267 PASS · `pnpm build` PASS.
- Browser (`agent-browser`, dev server sẵn có `localhost:3000`, `<title>` MaiPace), dữ liệu seed bằng `design-lab/review/seed.js`:
  - Home 390 px sáng: mới / bình thường / nhiều việc (nháp từ vựng Bài 4 + 30 mục đến hạn) / xong hôm nay; 390 px tối: bình thường, nhiều việc.
  - 360 px + furigana lớn: câu Nhật xuống dòng giữa cụm; nội dung cuối trang không bị thanh điều hướng che.
  - 768 px và 1280 px: sau sửa `15fff77` tranh không cắt mặt nhân vật.
  - 5 màn khác ở 390 px (`/hoc`, `/hoc/5`, `/luyen-tap`, `/on-tap`, `/hoc/tra-cuu`, `/hoc/5` tối): font mới và ngắt dòng ổn.
- Ảnh chụp: `design-lab/review/app-*.png`, `other-sheet.png` (không commit).

## Còn lại và bước tiếp theo
- Chưa kiểm: thiết bị thật, đo số tương phản chữ trên `PaperCloud` (chỉ đánh giá bằng mắt), bàn phím/focus đầy đủ, reduced motion, mất mạng trong tab đang mở (ảnh lỗi).
- Mảnh ghép (`grammar`) và bia (`weak-points`) là hai icon dày nhất bộ thẻ; vẽ lại nếu thấy nặng.
- Mockup ghi "Từ vựng · Đi lại / mô tả"; app chỉ hiện số liệu (chưa có dữ liệu chủ đề từng phần, và luật chữ tối giản).
- Đợt sau: chuyển 7 màn sang PaperKit; tranh hero cận nhân vật → nâng Home lên C1; viết lại `DESIGN.md` từ Home đã làm; viết lại phần kỹ thuật `AGENTS.md`.
