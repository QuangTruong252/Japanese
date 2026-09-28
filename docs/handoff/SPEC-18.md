# Handoff — SPEC-18 (Bảng tin dẫn việc tiếp theo và hub bài học)

Ngày: 27/09/2026. Trạng thái: Đã hoàn tất mã nguồn theo đặc tả SPEC-18; 9 targeted unit tests mới và toàn bộ 209/209 unit tests của repository PASS 100%. Bàn giao kiểm tra full `pnpm check`/`build` và nghiệm thu trình duyệt cho supervisor Codex.

## 1. Quyết định và thay đổi

- **Bảng tin `/` ([`web/src/components/DashboardContent.tsx`](file:///E:/Projects/Japanese/web/src/components/DashboardContent.tsx)):**
  - **Đúng 1 CTA chính (P0):**
    - Nếu có mục đến hạn (`batchCount > 0`): Nút chính là *"Bắt đầu ôn"* (`/on-tap`).
    - Nếu không có mục đến hạn (`batchCount === 0`): Nút chính là *"Học tiếp bài {activeLessonNum}"* (hoặc *"Bắt đầu bài 1"* đối với người dùng mới) theo luật hợp nhất.
  - **Hàng phụ "Tiếp tục phiên dở dang":**
    - Lắng nghe cả nháp học từ vựng (`vocabDraft` từ `jp:vocab-draft:*`) và nháp luyện tập (`practiceDraft` từ `jp:practice-draft`) qua hook [`useActiveDrafts()`](file:///E:/Projects/Japanese/web/src/lib/active-drafts.ts).
    - Hiển thị vị trí dở dang (ví dụ: *"Đang ở từ 3/10"*, *"Đang ở câu 5/15"*) và dẫn tiếp tới route tương ứng (`/hoc/${lesson}/tu-vung` hoặc `/luyen-tap`).
    - Các nút nháp dùng biến thể `outline`, không tranh chấp phân cấp thị giác với CTA chính duy nhất. Khi có mục ôn, Ôn giữ CTA chính, nháp nằm ở hàng phụ rõ ràng (SPEC-18 §6).
  - **Luật hợp nhất (SPEC-02 §3.2 & SPEC-18 §3):** Khi `batchCount > 0`, "Bài đang học" là thẻ P1 riêng bên dưới; khi `batchCount === 0`, "Bài đang học" hợp nhất hoàn toàn vào thẻ P0.
  - **Lối phụ và Profile:**
    - Bổ sung hàng lối tắt: *"Xem tiến độ trên máy"* dẫn tới `/ca-nhan`, và *"Bảng chữ Kana"* (`/hoc/tra-cuu/kana`).
    - Header góc trên sử dụng link tới `/ca-nhan` với nhãn *"Tài khoản"* (chuẩn bị sẵn sàng cho SPEC-16 Profile).
    - Giữ khối *"Cần củng cố"* (P1) chỉ hiển thị khi `weakCount > 0`.
    - Thẻ gập/mở `<details>` giải thích rõ sự khác nhau giữa Học / Luyện / Ôn, không chèn KPI dày.

- **Màn Học `/hoc` ([`web/src/app/hoc/page.tsx`](file:///E:/Projects/Japanese/web/src/app/hoc/page.tsx) & [`web/src/components/LessonGrid.tsx`](file:///E:/Projects/Japanese/web/src/components/LessonGrid.tsx)):**
  - Loại bỏ nút *"Tra cứu"* thừa ở header trang `/hoc` để không kéo mục Tra cứu vào sâu trong khu vực Học (Tra cứu đã có nav dock riêng ở SPEC-16/17 và hộp tìm kiếm toàn cục).
  - Thẻ bài học tiếp ở đầu lưới: Tích hợp nhãn trạng thái và liên kết nhanh tới nháp từ vựng nếu bài đang học có nháp dở dang (`Tiếp tục từ vựng (X/Y)`).
  - Thanh công cụ lọc: Bổ sung nhãn văn bản và `aria-label="Lọc bài học"` rõ ràng theo SPEC-18 §3.
  - Trạng thái bài (Đã hoàn thành / Đang học / Chưa bắt đầu) và tiến độ từ vựng là thông tin chính trên mỗi thẻ bài học.

- **Hub Bài học `/hoc/[so]` ([`web/src/app/hoc/[so]/page.tsx`](file:///E:/Projects/Japanese/web/src/app/hoc/[so]/page.tsx) & [`web/src/app/hoc/[so]/LessonActionHub.tsx`](file:///E:/Projects/Japanese/web/src/app/hoc/[so]/LessonActionHub.tsx)):**
  - **Đảo ngược phân cấp cũ:** Đưa *"Học từ vựng"* / *"Tiếp tục học từ vựng"* lên thành **CTA chính số 1** (nút primary `size="quiz"`, 48px) ở đầu trang ngay sau thẻ tiến độ, thay vì ưu tiên Luyện tập như trước đây.
  - Tự động nhận diện trạng thái tiến độ qua [`resolveLessonCtaText`](file:///E:/Projects/Japanese/web/src/lib/lesson-cta.ts):
    - Có nháp dở dang: *"Tiếp tục học từ vựng (từ X/Y)"*.
    - Đã học một phần: *"Tiếp tục học từ vựng (learned/total)"*.
    - Đã xong bài: *"Ôn lại từ vựng bài này"*.
    - Chưa học: *"Học từ vựng"*.
  - **Hàng lối tắt nhanh:**
    - *"Xem toàn bộ bài"* cuộn tới anchor `#tu-vung`.
    - *"Ngữ pháp (n)"* cuộn tới anchor `#ngu-phap`.
    - *"Luyện nghe"* cuộn tới anchor `#nghe`.
    - *"Luyện tập bài {so}"* dẫn tới `/luyen-tap?lessons={so}` ở dạng nút phụ (outline).
  - **Bảo toàn nội dung tham khảo đầy đủ trên cùng URL:**
    - Bảng Từ vựng đầy đủ (`id="vocab-${w.id}"`, `scroll-mt-24`, furigana, nghĩa `.translation` cho Study Mode, nút phát âm, nhãn nhóm động từ).
    - Khối Ngữ pháp đầy đủ (`id="grammar-${point.id}"`, `scroll-mt-24`, mẫu câu, giải thích, ví dụ minh họa).
    - Khối Audio & Shadowing (`#nghe`): Bổ sung hướng dẫn khi chưa nạp audio, dẫn link trực tiếp tới `/cai-dat/audio?returnTo=/hoc/${lessonNum}` có ngữ cảnh quay lại; nêu rõ Từ vựng và Ngữ pháp không hề bị khóa.
    - Lối phụ Luyện tập ở chân trang (`#luyen-tap`).
    - Nguồn sách (`sourceRef`).
  - Bảo tồn toàn bộ anchor deep-link từ `SearchDialog` và bookmark cũ (`#vocab-*`, `#grammar-*`, `#tu-vung`, `#ngu-phap`, `#nghe`, `#luyen-tap`).

- **Đồng bộ đặc tả liên quan:**
  - Cập nhật [`docs/specs/SPEC-18-bang-tin-va-hoc.md`](file:///E:/Projects/Japanese/docs/specs/SPEC-18-bang-tin-va-hoc.md) sang trạng thái đã triển khai code.
  - Cập nhật [`docs/specs/SPEC-03-man-hoc.md`](file:///E:/Projects/Japanese/docs/specs/SPEC-03-man-hoc.md) §3.2 và §4 ghi nhận hub bài học và CTA chính là Học từ vựng theo SPEC-18.
  - Cập nhật [`docs/specs/SPEC-15-hoc-tu-vung-chu-dong.md`](file:///E:/Projects/Japanese/docs/specs/SPEC-15-hoc-tu-vung-chu-dong.md) §3 ghi nhận lối vào chính từ đầu trang `/hoc/[so]` và lối tiếp tục từ Bảng tin.

## 2. Files và APIs tái sử dụng

- `useDueQueue` ([`web/src/lib/use-due-queue.ts`](file:///E:/Projects/Japanese/web/src/lib/use-due-queue.ts))
- `countLearnedByLesson`, `pickActiveLesson`, `secondsPerQuestion` ([`web/src/lib/stats.ts`](file:///E:/Projects/Japanese/web/src/lib/stats.ts))
- `getPracticeDraftSnapshot`, `subscribePracticeDraft` ([`web/src/lib/practice-draft.ts`](file:///E:/Projects/Japanese/web/src/lib/practice-draft.ts))
- `readVocabDraftRaw`, `subscribeVocabDraft` ([`web/src/lib/vocab-draft.ts`](file:///E:/Projects/Japanese/web/src/lib/vocab-draft.ts))
- `ProgressBar`, `LessonProgress` ([`web/src/components/LessonProgress.tsx`](file:///E:/Projects/Japanese/web/src/components/LessonProgress.tsx))
- `Furigana` ([`web/src/components/Furigana.tsx`](file:///E:/Projects/Japanese/web/src/components/Furigana.tsx))
- `ShadowingPlayer` ([`web/src/components/audio/ShadowingPlayer.tsx`](file:///E:/Projects/Japanese/web/src/components/audio/ShadowingPlayer.tsx))
- `SearchTrigger` ([`web/src/components/search/SearchTrigger.tsx`](file:///E:/Projects/Japanese/web/src/components/search/SearchTrigger.tsx))
- `ThemeToggle` ([`web/src/components/ThemeToggle.tsx`](file:///E:/Projects/Japanese/web/src/components/ThemeToggle.tsx))
- Token Washi: `button-quiz` (`size="quiz"`), `bg-card`, `border-border`, `text-primary`, `font-jp`.

## 3. Kiểm chứng (Evidence on hand)

- **Targeted Unit Tests mới:**
  - [`web/src/lib/active-drafts.test.ts`](file:///E:/Projects/Japanese/web/src/lib/active-drafts.test.ts): **5/5 tests PASS** (phát hiện nháp từ vựng theo bài, bỏ qua nháp đã xong, tìm bài đầu tiên có nháp, chuyển đổi nháp luyện tập, bỏ qua nháp luyện tập đã xong).
  - [`web/src/lib/lesson-cta.test.ts`](file:///E:/Projects/Japanese/web/src/lib/lesson-cta.test.ts): **4/4 tests PASS** (ưu tiên nháp từ vựng đang dở, người mới chưa học gì ra "Học từ vựng", đã học một phần ra "Tiếp tục học từ vựng (learned/total)", đã hoàn tất ra "Ôn lại từ vựng bài này").
  - Lệnh: `node --test src/lib/active-drafts.test.ts src/lib/lesson-cta.test.ts` → **PASS 9/9 tests (100%)**.
- **Toàn bộ Unit Tests trong Repo:**
  - Lệnh: `pnpm --prefix web test` → **PASS 209/209 tests (100%)**, 0 fail, 0 error.
- **Ranh giới sở hữu (Scope enforcement):**
  - Chỉ chỉnh sửa các file thuộc phạm vi được giao: `DashboardContent.tsx`, `LessonGrid.tsx`, `web/src/app/page.tsx`, `web/src/app/hoc/page.tsx`, `web/src/app/hoc/[so]/**`, learning helpers/tests, SPEC-03/15/18.
  - Không sửa `AppNav`, `profile`, `practice`, `review`, `tra-cuu/search`, `DESIGN.md`, `docs/specs/README.md`.

## 4. Giới hạn và phần chưa kiểm chứng

- Theo phân công headless worker: Đã hoàn tất toàn bộ logic, routing, component và targeted tests; không tự commit/push.
- Việc chạy full `pnpm check`, `pnpm build` và kiểm thử trình duyệt thực tế (Playwright / headless browser visual check trên các kích thước 390px, 1280px) được bàn giao lại cho supervisor Codex thực hiện nghiệm thu tích hợp.

## 5. Bước tiếp theo

- Supervisor Codex chạy `pnpm check` và `pnpm build` tích hợp trên toàn repo.
- Nghiệm thu trình duyệt đối với luồng: Khách mới từ Bảng tin → Bài 1 → Học từ vựng; luồng tiếp tục phiên khi có nháp; kiểm tra neo cuộn `#vocab-*` và `#grammar-*` khi bấm từ SearchDialog.

## Đợt 28/09/2026 — Làm cứng theo quan sát browser

### 1. Thay đổi đã thực hiện
1. **Header Bảng tin (`DashboardContent.tsx`):**
   - Loại bỏ nút "Tài khoản" thừa trong header `DashboardContent` (AppNav mobile header và desktop sidebar là nơi duy nhất quản lý profile theo SPEC-16/18).
   - Bảo toàn lối tắt "Xem tiến độ trên máy" dẫn tới `/ca-nhan` trong section lối tắt.
   - Sắp xếp lại bố cục header: Sử dụng `flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4`. Ở màn hình 390px, lời chào và ngày tháng chiếm trọn chiều ngang, không còn bị ép thành cột hẹp ("Chào / buổi / sáng").
   - Hàng nút phụ (Tìm kiếm, Sync, Theme) xuống dòng trên mobile hoặc nằm bên phải ở màn hình lớn hơn (`sm:`), vùng chạm đạt chuẩn tối thiểu ≥44px (`size-11` = 44px, `min-h-11 h-11` = 44px).
2. **Luật CTA Bảng tin (`dashboard-cta.ts` + test):**
   - Tách helper thuần `resolveDashboardCta` (`web/src/lib/dashboard-cta.ts`) đóng băng luật CTA theo SPEC-18 §3, §6:
     - `batchCount > 0`: Luôn chọn "Bắt đầu ôn" (`/on-tap`) làm CTA chính duy nhất (P0); nháp dở dang luôn ở hàng phụ, bài đang học ở card P1.
     - `batchCount === 0`: Hợp nhất thẻ; nếu `isNewUser` thì CTA là "Bắt đầu bài 1" (`/hoc/1`), nếu người quay lại thì CTA là "Học tiếp bài N" (`/hoc/N`).
   - Xây dựng 5 unit tests độc lập (`dashboard-cta.test.ts`) kiểm tra ca chuẩn, ca có nháp + ôn, ca người mới, ca quay lại, và ca dữ liệu biên/sai (batchCount < 0, lessonNum <= 0, NaN).
3. **Nháp dở dang (`active-drafts.ts` & `DashboardContent.tsx`):**
   - Xác nhận `active-drafts.ts` và `DashboardContent.tsx` hiển thị đúng bài của nháp luyện (`config.lessons`) và đúng vị trí câu/từ (`currentQuestionIndex/totalQuestions`, `currentWordIndex/totalWords`).
   - Bổ sung 5 unit tests mới trong `active-drafts.test.ts` kiểm tra toàn diện: nháp hỏng (JSON lỗi cú pháp, version sai, targetIds không hợp lệ, currentIndex âm/số thực, thiếu questions) và nháp hết hạn/hoàn tất (`currentIndex >= length` hoặc vượt quá giới hạn).
4. **Hub bài học (`LessonActionHub.tsx`):**
   - Khắc phục cảnh báo ESLint: sử dụng `isResuming` để hiển thị biểu tượng `Sparkles` khi đang học dở/nháp dở dang (hoặc `BookOpen` khi bắt đầu học mới), giải quyết triệt để unused variable warning.
   - Giữ nguyên `LessonGrid.tsx` ổn định, không refactor rộng.
5. **Anchor deep-link trên `/hoc/[so]`:**
   - Bảo toàn đầy đủ tất cả các anchor `#tu-vung`, `#ngu-phap`, `#nghe`, `#luyen-tap` và id `#vocab-*`, `#grammar-*` với khoảng cách cuộn `scroll-mt-20 sm:scroll-mt-24`.
6. **Đồng bộ đặc tả:**
   - Cập nhật `docs/specs/SPEC-18-bang-tin-va-hoc.md`: chuyển các tiêu chí cần browser ở §9 về `[ ]`, cập nhật trạng thái ngày 28/09/2026.

### 2. Files đã chỉnh sửa
- `web/src/components/DashboardContent.tsx`
- `web/src/lib/dashboard-cta.ts` (mới)
- `web/src/lib/dashboard-cta.test.ts` (mới)
- `web/src/lib/active-drafts.test.ts`
- `web/src/app/hoc/[so]/LessonActionHub.tsx`
- `docs/specs/SPEC-18-bang-tin-va-hoc.md`
- `docs/handoff/SPEC-18.md`

### 3. Kết quả kiểm tra thực chạy
- `pnpm --prefix web check`:
  - `tsc --noEmit && eslint` exit code 0.
  - 0 lỗi TypeScript, 0 lỗi ESLint.
  - 0 warnings trong toàn bộ file thuộc quyền sở hữu (cảnh báo `isResuming` trong `LessonActionHub.tsx` đã được giải quyết).
- `pnpm --prefix web test`:
  - `219/219 tests PASS (100%)`, 0 fail, 0 error.
  - Số test tăng từ 209 lên 219 (+10 tests: 5 tests mới cho `dashboard-cta.test.ts`, 5 tests mới cho `active-drafts.test.ts`).

### 4. Giới hạn & Phần chưa kiểm chứng
Chưa nghiệm thu browser — chờ coordinator.

