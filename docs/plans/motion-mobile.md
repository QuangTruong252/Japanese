# Plan cải thiện hoạt ảnh — ưu tiên mobile mượt

Ngày lập: 2026-09-24. Trạng thái: **G0–G5 đã làm 24/09/2026** (một số bước bỏ qua có lý do, xem nhật ký).

### Nhật ký

- 24/09/2026 — G0 + G1. Token `--ease-smooth-out`, `--animate-jp-shake` trong `@theme`;
  `DESIGN.md` §Motion thêm dòng chuyển trang/overlay/progress, §Surfaces đổi luật blur (nav đáy
  không blur, scrim chỉ blur từ `sm`). Sửa rung báo sai (`motion-safe:animate-jp-shake`).
  Tap highlight + `touch-action` trong `@layer base`; `viewportFit: 'cover'`. Mọi
  `transition-all` → `transition` (danh sách thuộc tính mặc định của Tailwind v4, không gồm
  width/height). Scrim mobile `bg-black/30` bù cho bỏ blur. VerbTable cột dính bỏ blur.
  **Lệch plan:** G1.4 giữ animate width nhưng giới hạn `transition-[width]` — thanh cao 4–8px,
  cập nhật hiếm, Base UI tự set width cho Indicator; `scaleX` không đáng. G1.5 bỏ qua (chỉ desktop).
  Kiểm tra: `pnpm check` đạt, `pnpm test` 140/140; agent-browser 390px trên `/luyen-tap`:
  nav `backdrop-filter: none`, button `touch-action: manipulation`, tap highlight trong suốt,
  `animate-jp-shake` ra `jp-shake`, reduced-motion ra `none`; không lỗi runtime.
  **Chưa kiểm:** máy iOS/Android thật, đo Performance trước/sau.
- 24/09/2026 — G2 chuyển trang: `components/PageTransition.tsx` bọc `children` trong layout,
  `<ViewTransition key={pathname} enter/exit="page">`. Hướng tự tính bằng `lib/nav-direction.ts`
  (vào sâu/tab phải = tiến, ngược lại = lùi, anh em cùng cấp = chỉ mờ; có test), đặt vào
  `--nav-dir` trong layout effect — không phải gắn `transitionTypes` cho từng Link. Nav có
  `view-transition-name` để đứng yên. Back của trình duyệt: Next không chạy view transition
  (đổi tức thì) — chấp nhận, tránh chồng với vuốt lùi của iOS. Bỏ 2.4 (shared morph), để sau.
  Kiểm: agent-browser 390px, `/` → `/hoc` chạy `vt-page-out`/`vt-page-in`, dir 1; `/hoc` → `/hoc/1` dir 1.
- 24/09/2026 — G2b PWA theo SPEC-14: `app/manifest.ts`, icon 192/512/maskable từ
  `brand/maipace-app-icon.svg`, `app/apple-icon.png`, `appleWebApp`, overscroll chỉ khi
  standalone, `components/InstallAppCard.tsx` trong `/cai-dat`. Kiểm: `pnpm build` + `next start`,
  CDP `Page.getInstallabilityErrors` = [] và manifest không lỗi. Mọi màn có nav đáy, nút back
  hoặc nút thoát phiên — không cần thêm nút.
- 24/09/2026 — G3: câu hỏi vào 250ms ease-in-out, panel phản hồi trồi 200ms, thanh tiến độ phiên
  `scaleX`, nét dấu tích khi đúng (`animate-draw-check`), SessionResult stagger 40ms, thẻ từ vựng
  vào 250ms và thanh tiến độ `scaleX`. 3.6 phần mặt sau thẻ: không cần sửa (backface-visibility
  đã che mặt sau tới 90°). Kiểm: phiên thật — chọn sai ra `jp-shake`, panel `enter`, thanh tăng.
- 24/09/2026 — G3b: khối từ bay giữa kho và thanh trả lời (`layoutId`, spring 400/30,
  `LazyMotion domMax` chỉ trong QuestionReorder). **Không** làm kéo để đổi thứ tự: `Reorder`
  chỉ hỗ trợ một hàng, thanh trả lời xuống dòng. Vuốt thẻ từ vựng đã lật: phải = Nhớ được,
  trái = Quên mất, ngưỡng 100px hoặc 500px/s, lưu lỗi thì thẻ quay lại. Kiểm: vuốt phải chuyển
  thẻ 1→2, vuốt ngắn bật về. **Chưa kiểm trình duyệt:** hiệu ứng bay khối từ.
- 24/09/2026 — G4: dialog/alert-dialog/dropdown mở 250ms, đóng 150ms, smooth-out, scale 0.96 /
  0.97 (đóng 0.99); tooltip bỏ selector Radix, mở 150ms, đóng tức thì. SearchDialog mở 250ms
  (mobile trồi 8px, desktop 0.96), đóng tức thì do gỡ DOM. Bỏ 4.2 sheet: không nơi nào dùng.
- 24/09/2026 — G5: icon sáng/tối có animation vào; chip lọc LessonGrid có nền trượt (`layoutId`).
  Bỏ 5.1: `ui/tabs` không được dùng. Kiểm: transform của nền giảm về `none` trong ~250ms.
  Tổng: `pnpm check` đạt, `pnpm test` 143/143, `pnpm build` đạt.
Skill dùng: `transitions-dev` (công thức), `transitions-polish` (token + luật open/close).
Luật có thẩm quyền vẫn là `DESIGN.md` §Motion; token skill chỉ vào code khi đã sửa
`DESIGN.md` có chủ đích (bước 0.1).

## Hiện trạng (khảo sát code 2026-09-24)

- Không có chuyển trang: không `template.tsx`, `loading.tsx`, `<ViewTransition>`.
  Next 16.3.5 hỗ trợ `import { ViewTransition } from 'react'` **không cần config**
  (`node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`),
  `<Link transitionTypes>` từ 16.2.
- `framer-motion` có trong `package.json` nhưng **không file nào import**.
- **Có thể là lỗi:** `motion-safe:jp-shake` (AnswerOption:12, JpInput:51,
  QuestionReorder:81) — `.jp-shake` là CSS thường, không phải `@utility`, nên Tailwind v4
  không sinh variant → rung báo sai có thể không chạy. Cần xác nhận trên browser.
- `transition-all` rải rác (button, toggle, tabs, badge, progress, AppNav, LessonGrid,
  PhraseToken, SearchDialog/Trigger, KanjiGrid, VerbTable, tra-cuu…).
- Animate thuộc tính đắt: width (`ui/progress.tsx:47`, `ShadowingPlayer.tsx:420`),
  box-shadow hover (LessonGrid:328, KanjiGrid:221).
- `AppNav.tsx:69` thanh dưới cố định dùng `backdrop-blur-2xl` — tốn nhất trên mobile
  (blur lại mỗi frame khi cuộn). Overlay dialog/sheet/search dùng `backdrop-blur-xs`.
- Overlay mở/đóng cùng `duration-100`, không bất đối xứng; tooltip dùng selector
  `data-[state=delayed-open]` sót từ Radix (Base UI không set).
- SearchDialog chỉ có animation vào, không có ra.
- PracticeRunner: câu hỏi remount theo `key` nhưng không có enter; panel phản hồi
  hiện đột ngột; không có thanh tiến độ (chỉ `n/total`).
- VocabLearningFlow: flip 3D 250ms ổn; mặt sau bị `hidden` đến khi lật; `<progress>`
  native không animate.
- Mobile: thiếu `viewportFit: 'cover'` (layout.tsx) nên `env(safe-area-inset-*)` = 0
  trên iOS; không có `-webkit-tap-highlight-color`, `touch-action: manipulation`.
- `hover:` của Tailwind v4 đã bọc `@media (hover: hover)` → `[@media(hover:hover)]:hover:`
  trong AnswerOption:9, QuestionListening:100,113 là thừa.

## Nguyên tắc cho mobile

1. Chỉ animate `transform` và `opacity` (compositor). Không width/height/top/left/
   box-shadow/filter trong đường nóng.
2. Không `backdrop-filter` trên phần tử cố định lớn; không blur snapshot cả trang.
3. Khoảng cách nhỏ (4–8px), thời gian 150–250ms; đóng nhanh hơn mở; không delay khi đóng.
4. Phản hồi chạm tức thì (`:active` ≤ 80ms) — cảm giác "mượt" trên mobile đến từ
   phản hồi nhấn hơn là animation dài.
5. Mọi animation nằm trong `motion-safe:` / `prefers-reduced-motion: no-preference`;
   khi giảm chuyển động, kết quả đúng/sai vẫn hiện đầy đủ.
6. Không thêm thư viện: CSS + `tw-animate-css` + React `<ViewTransition>`; `framer-motion`
   (đã cài) chỉ cho cử chỉ ở G3b.

## Giai đoạn 0 — Nền tảng (nhỏ, làm trước)

0.1 **Token motion.** Thêm vào `@theme` trong `globals.css` một nhóm nhỏ (không chép
    cả `_root.css` 32 transition):
    `--ease-smooth-out: cubic-bezier(0.22,1,0.36,1)`, `--duration-quick: 150ms`,
    `--duration-fast: 250ms`, `--animate-jp-shake: jp-shake 300ms ease-in-out`.
    Cập nhật bảng `DESIGN.md` §Motion: thêm dòng "Chuyển trang 250ms smooth-out",
    "Overlay mở 250ms / đóng 150ms smooth-out", "Nhấn (active) 80ms".
0.2 **Sửa rung báo sai:** đổi 3 chỗ `motion-safe:jp-shake` → `motion-safe:animate-jp-shake`,
    xóa class `.jp-shake` cũ. Kiểm tra: chọn sai → rung 3 nhịp; bật reduce-motion → không rung,
    màu sai vẫn hiện.
0.3 **Mobile cơ bản** trong `@layer base`:
    `button, a, [role=button], label { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }`
    và `viewportFit: 'cover'` trong `layout.tsx` viewport (để safe-area đang dùng có hiệu lực).
0.4 Xóa `[@media(hover:hover)]:` thừa (AnswerOption, QuestionListening).

## Giai đoạn 1 — Vệ sinh hiệu năng (lợi ích mobile lớn nhất)

1.1 `AppNav.tsx:69`: bỏ `backdrop-blur-2xl`, dùng `bg-background/95` (hoặc blur chỉ
    `lg:`). Đo trước/sau bằng DevTools Performance, CPU 4x throttle, cuộn trang bài học.
1.2 Overlay (dialog, alert-dialog, sheet, SearchDialog, VerbTable:234): bỏ
    `supports-backdrop-filter:backdrop-blur-xs` trên mobile (giữ `sm:` nếu muốn).
1.3 Thay `transition-all` bằng thuộc tính cụ thể: `transition-[color,background-color,border-color,opacity,transform]`
    (hoặc `transition-colors` + `transition-transform`). Bắt đầu từ `ui/button.tsx`,
    `ui/toggle.tsx`, `ui/badge.tsx`, `ui/tabs.tsx` vì lan ra toàn app; sau đó AppNav,
    PhraseToken, LessonGrid, KanjiGrid, VerbTable, SearchTrigger, tra-cuu.
1.4 Progress: `ui/progress.tsx:47` và thanh LessonGrid:123,149 → `transform: scaleX()`
    với `origin-left`, duration 250ms smooth-out. ShadowingPlayer:420 (tua audio,
    cập nhật liên tục) → `scaleX` và **bỏ transition** (đang 75ms gây trễ).
1.5 Hover box-shadow (LessonGrid:328, KanjiGrid:221): chỉ desktop nên ưu tiên thấp;
    nếu sửa, dùng pseudo-element shadow + `opacity`.

## Giai đoạn 2 — Chuyển trang (View Transitions)

2.1 Bọc `{children}` trong `app/layout.tsx` bằng `<ViewTransition>` (React). Điều hướng
    App Router là transition nên tự kích hoạt; browser không hỗ trợ thì chuyển trang bình thường.
2.2 CSS trong `globals.css` (chỉ trong `prefers-reduced-motion: no-preference`):
    - mặc định: cross-fade + trượt 8px (`--distance-base`), 250ms `--ease-smooth-out`,
      trang cũ ra nhanh hơn (150ms).
    - **Không blur** (công thức page-slide của transitions.dev có blur 3px — bỏ vì blur
      snapshot toàn màn hình rất tốn trên mobile).
    - `AppNav` đặt `view-transition-name: app-nav` để đứng yên, không bị fade theo trang.
2.3 Hướng trượt: `transitionTypes={['nav-forward']}`/`['nav-back']` trên `<Link>` của
    AppNav theo thứ tự tab, và đi sâu (bài → luyện tập, tra cứu → chi tiết) là forward;
    nút quay lại là back. CSS chọn `:active-view-transition-type(nav-forward)`.
2.4 Tùy chọn sau (chỉ khi 2.1–2.3 ổn): shared element morph thẻ bài học → tiêu đề trang bài
    (`<ViewTransition name={`lesson-${so}`}>`), kanji trong lưới → trang chi tiết kanji.
2.5 Rủi ro: Safari khác Chromium; trang dùng `useLiveQuery` render dữ liệu sau khi
    transition xong → có thể thấy nhảy nội dung. Cân nhắc skeleton reveal (G3.5).

## Giai đoạn 2b — PWA cài đặt & standalone (SPEC-14)

Theo [SPEC-14](../specs/SPEC-14-pwa-cai-dat.md): manifest + icon, `appleWebApp`,
nút quay lại trong app cho các màn sâu (dùng `transitionTypes` hướng back của G2),
`overscroll-behavior-y: none`, khối hướng dẫn cài trong `/cai-dat`. Không service worker.
Làm sau G2 vì nút quay lại dùng chung hướng chuyển trang. Rủi ro chính: OAuth trong
standalone iOS — thử máy thật sớm.

## Giai đoạn 3 — Luồng học (practice/vocab)

3.1 **Đổi câu hỏi** (PracticeRunner, đã remount theo key): thêm vào wrapper câu hỏi
    `motion-safe:animate-in fade-in-0 slide-in-from-right-2 duration-250 ease-in-out`
    (DESIGN: card entry 250ms ease-in-out). Không cần exit (tránh giữ DOM cũ).
3.2 **Panel phản hồi** (PracticeRunner:324): trồi lên 8px + fade, 200ms ease-out
    (DESIGN: answer result reveal). Giữ `aria-live`. Với reduced-motion: hiện ngay.
3.3 **Thanh tiến độ phiên**: thêm thanh mảnh cạnh `n/total`, dùng `scaleX` (G1.4).
3.4 **Đáp đúng**: tùy chọn "success check" (10-success-check.md) cho icon trong panel
    đúng — chỉ stroke-draw icon, không confetti. Làm sau khi 3.1–3.3 được duyệt.
3.5 **Nhấn đáp án**: giữ `active:translate-y-px` theo DESIGN; bảo đảm phản hồi màu
    150ms và chạm không có highlight xám (G0.3).
3.6 **VocabLearningFlow**: đổi mặt sau sang `backface-visibility: hidden` thay vì
    `hidden` để flip thấy cả hai mặt; `<progress>` → thanh `scaleX`; thẻ mới
    (key đổi) vào bằng cùng animation 3.1.
3.7 **SessionResult**: "texts reveal" stagger 40ms cho 2–4 dòng số liệu (tổng < 300ms).

## Giai đoạn 3b — Cử chỉ bằng framer-motion (đã duyệt 24/09/2026)

Chỉ dùng cho cử chỉ; không thay CSS ở chỗ khác. Nạp qua `LazyMotion` + `m.*` và
`domAnimation`/`domMax` chỉ trong route luyện tập/học từ vựng, để không vào bundle chung.

3b.1 **Kéo-thả sắp xếp câu** (QuestionReorder, PhraseToken): `Reorder.Group`/`Reorder.Item`
     hoặc `drag` + layout; spring stiffness 400, damping 30 theo `DESIGN.md`. Giữ cách chạm để
     chọn hiện có làm đường thay thế cho bàn phím/screen reader; chấm điểm không đổi.
3b.2 **Vuốt thẻ từ vựng** (VocabLearningFlow): `drag="x"` với ngưỡng khoảng cách/vận tốc;
     vượt ngưỡng thì bay ra và sang thẻ kế, không vượt thì bật về. Vuốt là lối tắt cho nút sẵn có,
     không thay nút. Chống xung đột với cuộn dọc (`touch-action: pan-y` trên thẻ).
3b.3 Reduced-motion: `MotionConfig reducedMotion="user"`; thao tác vẫn chạy, chỉ bỏ quán tính.
3b.4 Kiểm tra: kéo/vuốt trên máy thật, bàn phím, `pnpm test` cho logic chấm reorder.

## Giai đoạn 4 — Overlay và menu

4.1 dialog/alert-dialog/dropdown-menu: mở 250ms, đóng 150ms, `--ease-smooth-out`;
    scale mở 0.96 (dialog) / 0.97 (dropdown) thay vì `zoom-in-95`. Dùng
    `data-open:duration-250 data-closed:duration-150`.
4.2 Sheet: trên mobile nếu là bottom sheet thì trượt từ dưới 100% (không phải 2.5rem),
    mở 400ms / đóng 350ms (panel), `--ease-smooth-out`.
4.3 Tooltip: bỏ `data-[state=delayed-open]` (Radix), dùng
    `data-starting-style`/`data-ending-style` của Base UI; scale 0.98; đóng ngay.
    Trên mobile tooltip ít giá trị — không đầu tư thêm.
4.4 SearchDialog: thêm animation ra (nếu dựng trên Base UI Dialog thì dùng
    `data-closed`, nếu tự dựng thì cân nhắc chuyển sang `ui/dialog`).

## Giai đoạn 5 — Vi tương tác (ưu tiên thấp)

5.1 Tabs: pill trượt bằng `Tabs.Indicator` của Base UI (biến `--active-tab-left/width`)
    với `transform` 250ms — thay cho đổi nền từng tab.
5.2 ThemeToggle: icon swap (09-icon-swap.md) thay xoay hover.
5.3 LessonGrid filter chips: tabs sliding nếu là lựa chọn loại trừ nhau.
5.4 Bỏ qua: card tilt, like button, matrix loader, streaming text… (không hợp sản phẩm).

## Kiểm tra mỗi giai đoạn

- `pnpm check`; `pnpm test` khi đổi logic; `pnpm build` sau G2.
- Browser: Chrome DevTools mobile emulation + CPU 4x throttle — Performance panel không
  có frame đỏ khi cuộn/chuyển trang/mở overlay; Rendering → Paint flashing.
- Máy thật: Android Chrome và iOS Safari (view transitions, safe-area, tap highlight).
- `prefers-reduced-motion: reduce` (Rendering emulate): không chuyển động, kết quả vẫn hiện.
- Bàn phím/focus: overlay vẫn trả focus; không animation nào chặn tương tác.
- Luồng học chạy tiếp khi mất mạng trong trang đã mở (không đổi, chỉ xác nhận).

## Thứ tự đề xuất và ước lượng

| Bước | Nội dung | Rủi ro | Lợi ích mobile |
|---|---|---|---|
| G0 | token, sửa shake, tap/safe-area | thấp | vừa |
| G1 | bỏ blur, bỏ transition-all, scaleX | thấp | **cao** |
| G2 | chuyển trang | vừa (Safari, dữ liệu async) | **cao** (cảm nhận) |
| G2b | PWA cài đặt, standalone | vừa (OAuth iOS) | **cao** (mất thanh trình duyệt) |
| G3b | kéo-thả, vuốt thẻ (framer-motion) | vừa | **cao** (cảm giác app) |
| G3 | luồng học | thấp–vừa | cao |
| G4 | overlay | thấp | vừa |
| G5 | vi tương tác | thấp | thấp |

Sau khi xong: cập nhật `DESIGN.md` §Motion, `docs/specs/README.md` và handoff SPEC liên quan
(SPEC-02 shell, SPEC-04 luyện tập) với kết quả đo có ngày.

Đã quyết 24/09/2026: giữ `framer-motion`, chỉ dùng cho G3b.
