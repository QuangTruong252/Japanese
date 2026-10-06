# Đặc tả theo feature

Bộ spec chi tiết từng feature, tách từ `docs/project-design-spec.md` (SPEC-JPN-01) để bàn
giao được cho Google Stitch / Claude Design.

## Trạng thái hiện tại — đối chiếu code 24/09/2026

**Đặc tả ≠ code ≠ nghiệm thu.** Bảng này là điểm bắt đầu, không phải chứng nhận
toàn app. Code/lockfile xác định hiện trạng; spec xác định yêu cầu. Báo cáo cũ
chỉ chứng minh phạm vi ở ngày ghi nhận. Khi tiếp tục, kiểm tra Git/code liên quan.

| Phần | Đặc tả | Code quan sát được | Bằng chứng / phần chưa kiểm chứng |
| --- | --- | --- | --- |
| SPEC-01: dữ liệu/câu hỏi | Có | Có generator, filter, notation, FSRS | Ghi nhận static gates 17/09 ở mục bên dưới; [nội dung N5](../n5-manifest.md) chưa xác minh sách |
| SPEC-02: shell/Bảng tin | Có | [AppNav](../../web/src/components/AppNav.tsx), [Bảng tin](../../web/src/app/page.tsx), [DashboardContent](../../web/src/components/DashboardContent.tsx) | [Handoff 23/09](../handoff/SPEC-02.md) — code đã cập nhật theo hợp đồng UX 22/09/2026 (dock 5 mục mobile, sidebar desktop, Bảng tin 1 hành động chính P0, hợp nhất bài đang học, bỏ 4 ô KPI cũ). **24/09:** bỏ streak, ôn theo lô, khai báo "đã học đến bài", trạng thái "Đã ôn xong" (kèm SPEC-05 §2.1a), đã xem trình duyệt với dữ liệu giả lập |
| SPEC-03: học | Có | [Danh sách](../../web/src/app/hoc/page.tsx), [chi tiết](../../web/src/app/hoc/[so]/page.tsx) | Có code; chưa có handoff nghiệm thu toàn feature |
| SPEC-04: luyện tập | Có | [PracticeRunner](../../web/src/components/practice/PracticeRunner.tsx) và các dạng bài | [Handoff 17/09](../handoff/SPEC-04.md), có nghiệm thu và giới hạn; chưa tái nghiệm thu toàn bộ hôm nay |
| SPEC-05: ôn/điểm yếu | Có | [Ôn](../../web/src/app/on-tap/page.tsx), [phiên](../../web/src/app/on-tap/phien/page.tsx), [điểm yếu](../../web/src/app/on-tap/diem-yeu/page.tsx) | [Handoff 22/09](../handoff/SPEC-05.md) — đã nghiệm thu trình duyệt (empty state, hàng đợi, phiên FSRS, bảng điểm yếu, responsive 390px/1280px) |
| SPEC-06: cài đặt/import/export | Có | [Cài đặt](../../web/src/app/cai-dat/page.tsx), [backup.ts](../../web/src/lib/backup.ts) | [Handoff 22/09](../handoff/SPEC-06.md) — đã nghiệm thu trình duyệt (hiển thị, preview, export/import JSON, danger zone wipe, responsive) |
| SPEC-07: thống kê | Có | [stats.ts](../../web/src/lib/stats.ts), [ca-nhan/thong-ke/page.tsx](../../web/src/app/ca-nhan/thong-ke/page.tsx) | [Handoff 22/09](../handoff/SPEC-07.md) — đã nghiệm thu trình duyệt (4 ô KPI, lịch nhiệt 12 tuần cuộn ngang mobile, biểu đồ cột 14d, biểu đồ đường 30d ngắt quãng, thanh phân bố, responsive) |
| SPEC-08: auth/sync | Có | [supabase/migrations/0001_init.sql](../../supabase/migrations/0001_init.sql), [sync.ts](../../web/src/lib/sync.ts), [resolveSyncBadgeState](../../web/src/lib/stats.ts), [cai-dat/page.tsx](../../web/src/app/cai-dat/page.tsx) | [Handoff 22/09](../handoff/SPEC-08.md) — đã nghiệm thu trình duyệt (SyncBadge hàng đợi, card trạng thái Supabase, responsive, push-pull RPC, RLS) |
| SPEC-09: audio ZIP | Có | [audio-zip.ts](../../web/src/lib/audio-zip.ts), [audio-import.worker.ts](../../web/src/workers/audio-import.worker.ts), [use-audio-import.ts](../../web/src/hooks/use-audio-import.ts), [cai-dat/audio](../../web/src/app/cai-dat/audio/page.tsx) | [Handoff 23/09](../handoff/SPEC-09.md) — code, worker, hook, UI 25 bài theo mockup 20-audio-zip.png, static gates & tests PASS 100% |
| SPEC-10: Shadowing player | Có | [ShadowingPlayer.tsx](../../web/src/components/audio/ShadowingPlayer.tsx), [shadowing.ts](../../web/src/lib/shadowing.ts), [hoc/[so]](../../web/src/app/hoc/[so]/page.tsx) | [Handoff 23/09](../handoff/SPEC-10.md) — code, lặp A-B, tốc độ, phím tắt, UI theo mockup 21-shadowing.png, static gates & tests PASS 100% |
| SPEC-12: tra cứu (Kanji, động từ, 10 bảng) | Có | [lookup.ts](../../web/src/lib/lookup.ts), [tra-cuu](../../web/src/app/hoc/tra-cuu/page.tsx), [kanji](../../web/src/app/hoc/tra-cuu/kanji/page.tsx), [dong-tu](../../web/src/app/hoc/tra-cuu/dong-tu/page.tsx), [bang](../../web/src/app/hoc/tra-cuu/bang/page.tsx) | [Handoff 23/09](../handoff/SPEC-12.md) — code, 169 chữ Kanji, 156 động từ 5 thể, 10 bảng tham chiếu, chỉ mục tra ngược, static gates & tests PASS 100% |
| SPEC-13: tìm kiếm toàn cục | Có | [search.ts](../../web/src/lib/search.ts), [SearchDialog.tsx](../../web/src/components/search/SearchDialog.tsx), [SearchTrigger.tsx](../../web/src/components/search/SearchTrigger.tsx) | [Handoff 23/09](../handoff/SPEC-13.md) — code, ARIA combobox/listbox, xếp hạng 3 tầng, chuẩn hóa đ->d, phím tắt Ctrl+K, kiểm thử trình duyệt PASS 100% |
| SPEC-14: PWA cài đặt & standalone | Có (thu hẹp 24/09) | [manifest.ts](../../web/src/app/manifest.ts), [InstallAppCard.tsx](../../web/src/components/InstallAppCard.tsx) | [Handoff 24/09](../handoff/SPEC-14.md) — installability Chrome không lỗi trên bản build; chưa thử iOS/Android thật và OAuth standalone. Không service worker |
| SPEC-15: học từ vựng chủ động theo bài | Có | [Luồng học và theo dõi](../../web/src/components/vocab/VocabLearningFlow.tsx), [route](../../web/src/app/hoc/[so]/tu-vung/page.tsx) | [Handoff 24/09](../handoff/SPEC-15.md), [Handoff 25/09](../handoff/SPEC-VOCAB-VERB-FORMS.md) — lật 3D; 157 động từ N5 đã chuẩn hóa sang thể từ điển làm từ vựng chính, bổ sung khối 4 thể chia (Masu, Te, Nai, Ta) + badge nhóm động từ, đối chiếu Minna qua dòng masu phụ; kiểm thử trình duyệt PASS 100% |
| F11: N4 | Chưa có spec biên tập | Chưa có dữ liệu N4 | Cần nguồn và biên tập trước khi xây UI |

**25/09 — user feedback v1 (38 điểm):** sửa dữ liệu nghĩa động từ/kanji, lưu và học tiếp phiên
luyện tập/flashcard, hoàn tác chấm, UX mobile các màn Học, Luyện tập, Tra cứu, Thống kê, Cài đặt,
bảng Kana. Chi tiết, kiểm chứng và giới hạn: [Handoff FEEDBACK-V1](../handoff/FEEDBACK-V1.md).

Bước tiếp theo của các feature hiện có: kiểm tra sync với Supabase thật (SPEC-08), nghiệm thu SPEC-03 và phần còn lại của SPEC-15. Nhánh `feedback-v1` đã merge vào `master` tại `d2b7170` (kiểm tra Git ngày 27/09).
Phạm vi brand/agent riêng theo [handoff MaiPace](../handoff/MAIPACE.md).
Khi làm xong một phần, cập nhật hàng tương ứng và handoff với ngày, kiểm tra
đã chạy, giới hạn và bước tiếp theo. Không đổi trạng thái phần chưa được kiểm tra.

## Kế hoạch UX 27/09/2026 — đã merge `master`, nghiệm thu browser 28/09

Kế hoạch tổng dựa trên quan sát luồng và ảnh minh họa. Branch `ux-redesign` đã merge vào `master` ngày 28/09/2026; 6 lỗi của đợt nghiệm thu đầu đã sửa và kiểm browser. Kết quả từng mục và phần chưa kiểm chứng: [bộ nghiệm thu](../handoff/UX-REDESIGN-ACCEPTANCE.md) §6. _(đã gỡ khỏi repo ngày 06/10/2026; bản cũ ở tag `pre-cleanup`)_

| Mốc | Spec | Trạng thái 28/09/2026 |
| --- | --- | --- |
| 1 | [SPEC-16 — Điều hướng và Profile](SPEC-16-dieu-huong-profile.md) | Browser PASS trừ đăng nhập/đăng xuất thật (không có Supabase) |
| 2 | [SPEC-17 — Tra cứu và tìm kiếm](SPEC-17-tra-cuu-tim-kiem.md) | Browser PASS; lỗi cũ: notation thô ở mô tả kết quả ngữ pháp |
| 3 | [SPEC-18 — Bảng tin và Học](SPEC-18-bang-tin-va-hoc.md) | Browser PASS sau sửa thứ tự nháp; chưa thử bài thiếu audio. **01/10:** nháp lên CTA/ngay dưới CTA, vào thẳng thẻ dở, số ôn khớp dock (Playwright 360px, [handoff](../handoff/SPEC-18.md)) |
| 4 | [SPEC-19 — Luyện tập nhanh](SPEC-19-luyen-tap-nhanh.md) | Browser PASS; chưa chạy riêng từng dạng trong 5 dạng |
| 5 | [SPEC-20 — Ôn tập](SPEC-20-on-tap-tiep-noi.md) | Browser PASS sau sửa nhãn số đến hạn; chưa thử hạn mức, không giọng, Điểm yếu. **01/10:** sửa lỗi phiên Ôn không hiện đề (có từ 28/09) và câu sai gom theo câu ([handoff](../handoff/SPEC-20.md)) |

[Handoff kế hoạch](../handoff/UX-REDESIGN-PLAN.md) ghi rõ phần chưa kiểm chứng. Khi triển khai từng mốc, cập nhật spec hiện hành tương ứng và tạo handoff nghiệm thu riêng, không dùng bản kế hoạch thay cho kết quả kiểm thử.

## Minh họa Phố giấy 05/10/2026 — đã tích hợp pilot

**Cập nhật theo phản hồi UI chưa giống `new-ui`:** đã dựng lại panorama, bố cục Bảng tin hai cột, hub bài, chữ Nhật, nền giấy và navigation sát mép/gạch chân; củng cố hiện hai mục lịch sử thật. Shell có scroll-padding và xử lý hash tới nội dung stream để navigation không che mục/nút. Trình bày luyện/flashcard/kết quả dùng cùng hướng; logic CTA/FSRS/sync giữ nguyên. Xem phần **Redesign theo concept** trong handoff SPEC-21 để biết kiểm tra và ảnh mới, không dùng ảnh concept làm bằng chứng runtime.

[SPEC-21 — asset minh họa](SPEC-21-illustration-assets.md) chốt tên file có phiên bản,
thư mục production `web/public/assets/illustrations/`, nguồn ngoài `public` và cách JSON
tham chiếu URL. Đã tạo mẫu phong cách và xuất **9 WebP pilot: banner, scene, 5 từ vựng Bài 2,
grammar これ／それ／あれ và trạng thái đã ôn xong**. Đã bổ sung types/tham chiếu JSON,
renderer `next/image`, fallback và cache có version; kiểm browser mobile/desktop,
dark/furigana/reduced motion và chấm thẻ khi ảnh lỗi/mất mạng trong tab đang mở.
[Handoff SPEC-21](../handoff/SPEC-21.md) ghi kiểm tra thực chạy, giới hạn (gồm lỗi header cũ khi stress font) và bước tiếp theo; chưa nghiệm thu deployment thật hoặc toàn bộ luồng học.

**Mở rộng assets trong cùng ngày 05/10:** thêm **18 ảnh từ vựng Phố giấy** cho Bài 1–2,
nâng kho lên **27 WebP** và **25 tham chiếu nội dung**. Nguồn PNG/JSON ngoài `public`,
WebP 512 × 512 có alpha thật; giữ nguyên 9 pilot và ID/nội dung học cũ.
`pnpm check`, `pnpm test` (274/274), `pnpm build` đạt; đã kiểm browser mobile/desktop,
sáng/tối/furigana lớn/reduced motion và chấm thẻ khi ảnh lỗi offline trong tab đang mở.
Chi tiết và giới hạn ở mục **Mở rộng từ vựng Bài 1–2** trong handoff SPEC-21.

**Bài 8, 05/10/2026:** đã thêm 16 minh họa từ vựng + cover theo Phố giấy; tổng kho **44 WebP / 42 tham chiếu nội dung**. Giữ nguyên 53 mục từ Bài 8 và hash 27 ảnh cũ. Check, 274 test, build và browser mobile/desktop đã đạt trong phạm vi mục **Assets Bài 8** ở [handoff SPEC-21](../handoff/SPEC-21.md); chưa nghiệm thu toàn feature hoặc thiết bị/host thật.

**Bài 2/3/4/8, 06/10/2026:** thêm 42 cutout từ vựng (atlas tạo thủ công trên ChatGPT web, có alpha thật), cover Bài 2/3/4 và grammar `koko-soko-asoko` (Antigravity, nền đục); tổng kho **90 WebP / 90 tham chiếu nội dung**. Bỏ trường ảnh thì 191 mục từ và lesson JSON giữ nguyên. Check, 274 test và build đạt; browser 390/1440px tải đủ 87 ảnh của 4 bài; chi tiết ở mục **Bài 2/3/4/8** trong [handoff SPEC-21](../handoff/SPEC-21.md). Còn 6 cutout cần tạo lại riêng và review độc lập chưa hoàn tất; chưa nghiệm thu thiết bị/host thật.

**Workflow batch + Bài 5, 06/10/2026:** `batch.mjs` (prompts/check/export/sheet/link) và test suy từ sidecar; batch Bài 5 thêm 16 từ + cover, tổng kho **107 WebP / 107 tham chiếu**. Check, 274 test và browser `/hoc/5` 390/1440px (17/17 ảnh) đạt; chưa chạy build, chưa kiểm flashcard/offline Bài 5. Chi tiết ở mục **Workflow batch giai đoạn 1** trong [handoff SPEC-21](../handoff/SPEC-21.md).

**Bài 6–10, 06/10/2026:** 5 batch + 6 cutout lỗi cũ của Bài 8; 121 WebP mới, kho **228 WebP / 233 tham chiếu**. Check, 274 test, build; browser `/hoc/6`–`/hoc/10` ở 390px tải đủ 137/137 ảnh, flashcard Bài 6 chỉ tải ảnh sau khi lật. Chi tiết ở mục **Batch Bài 6–10** trong [handoff SPEC-21](../handoff/SPEC-21.md).

**Bài 10 ngữ pháp + Bài 11–15, 06/10/2026:** 113 WebP mới đã link. Check và 261 test đạt. Browser `/hoc/10`–`/hoc/15` ở 390px tải đủ 140/140 ảnh. Chưa chạy build, chưa kiểm desktop/flashcard. Bài 16–25 đang làm dở. Bài 19/20/22/24/25 đã link 55 tham chiếu, browser đủ 55/55 ảnh. Phần còn lại chờ quota ảnh Codex. Chi tiết ở mục **Batch Bài 10 (ngữ pháp) + Bài 11–15** trong [handoff SPEC-21](../handoff/SPEC-21.md).

## Vòng rà soát 17/09/2026 — hợp đồng dữ liệu & offline/sync

Toàn bộ spec đã được sửa theo một vòng đối chiếu với code thật. Những thay đổi **bắt buộc đọc
lại** trước khi triển khai tiếp:

| Chỗ sửa | Nội dung |
|---|---|
| SPEC-01 §4.2 | `matching` thêm `pairs[]`, mỗi cặp một `targetId`; bỏ chuỗi `"từ:::nghĩa"`; loại dạng này khỏi `mode: 'due'` |
| SPEC-01 §4.5 | `listening` trả **kana**, thêm `toKanaSentence()`; loại câu còn kanji; `normalizeJapaneseInput` bỏ dấu câu |
| SPEC-01 §3.1 | `sourceRef` thành optional, thêm `verification`; 25/25 bài hiện `unverified` |
| SPEC-02 §2.1–2.3 | Tên settings theo SPEC-06; badge đến hạn cập nhật theo **thời gian**; dashboard dùng `stats.ts` |
| SPEC-02 §6 | **Bỏ** `Ctrl+K` khỏi phase này — đăng ký mà không mở gì là chặn mất phím tắt của trình duyệt |
| SPEC-02 §2.2–2.3 | **Đã cài**: `stats.ts` + `use-due-clock.ts`; dashboard bỏ streak hardcode, bỏ ngày UTC, bỏ `.limit(10)`; màu ô số liệu về token `chart-1..3` |
| SPEC-02 §3.1 | Viết lại theo **dock nổi 6 mục** đã cài trong `AppNav.tsx`: thêm mục "Bảng tin", nhãn chữ **luôn hiện ở mobile**, tooltip chỉ dành cho desktop, `pb-32`/`pb-40` |
| SPEC-04 §2.1–2.2, §3.1 | `AnswerResult[]`; `ReviewItem` thêm `recentElapsedMs` + `createdAt`; `maxLearnedLesson = max(lessons đã chọn)` |
| SPEC-05 §2.1 | Đếm mục mới bằng `createdAt`, không bằng `reps === 0`; hạn mức chỉ chặn `/on-tap` |
| SPEC-06 §2.4, §3.3 | Import mang cả `sessions`; hai phạm vi xóa; xóa luôn kèm dọn `pendingSync` |
| SPEC-07 §2.1–2.2 | Tỷ lệ đúng theo tổng câu; phiên thuộc ngày `createdAt`; streak hiện `90+` khi bị cắt |
| SPEC-08 §2.3–2.6 | **Phân trang keyset** (Supabase chặn 1.000 dòng); chu trình đẩy-rồi-kéo; `jp:ownerUserId`; ngữ nghĩa `wipe` |
| SPEC-09 §2.1a–2.1b | Hash chỉ chứng minh toàn vẹn nội bộ; TOFU cho lần nạp sau; giới hạn kích thước/entry/tỉ lệ nén |
| SPEC-10 §2.4 | Câu ví dụ **chưa phải** transcript của track — đổi nhãn, không tô sáng theo thời gian |
| SPEC-12 §3.2, §3.4 | "Đã học" suy từ từ vựng chứa chữ; bảng động từ nhận `?q=` |
| SPEC-13 §2.2, §6 | Chuẩn hóa thêm `đ → d`; `Tab` không đóng hộp (mâu thuẫn với bẫy focus) |
| SPEC-14 §2.1a–2.1c (đã loại 24/09) | **Cache RSC** trong `jp-rsc-<BUILD_ID>`; truyền BUILD_ID qua `?v=`; precache thêm `/hoc`, `/luyen-tap`, `/on-tap` |

**Phần đã cài vào code trong cùng vòng này** (`pnpm check` + `pnpm test` + `pnpm build` xanh):
`types/index.ts` (`MatchingPair`, `AnswerResult`, `ReviewItem.createdAt`/`recentElapsedMs`,
`sourceRef` optional, `verification`) · `japanese.ts` (`toKanaSentence`, `containsKanji`, bỏ dấu
câu khi chấm) · `questions.ts` (matching `pairs`, listening kana) · `filter.ts` (loại matching ở
`mode: 'due'`) · `db.ts` (migration v2) · `fsrs.ts` (`medianElapsedMs`, `pushElapsedSample`) ·
`store.ts` (đổi tên settings) · xóa `ShortcutListener.tsx`. Còn lại là việc của từng phase.

Hai chỗ lệch với tài liệu gốc, đã ghi rõ ngay tại spec: SPEC-08 §2.2 (RPC thay endpoint),
SPEC-08 §2.3 (spec gốc §6.2 nói "không cần phân trang" — sai với giới hạn của PostgREST).

Một ngoại lệ có chủ đích với `AGENTS.md`: SPEC-09 §2.3 nạp audio theo lô, **không** atomic.
Lý do và phạm vi áp dụng ghi tại chỗ; dữ liệu học vẫn atomic tuyệt đối.

## Đợt 1 — đã viết

| Spec | Feature | Bàn giao thiết kế |
|---|---|---|
| [SPEC-01](SPEC-01-du-lieu-va-sinh-cau-hoi.md) | Dữ liệu bài học & sinh câu hỏi | Không — hợp đồng dữ liệu |
| [SPEC-02](SPEC-02-shell-dieu-huong.md) | Shell điều hướng & trạng thái toàn cục | Có |
| [SPEC-03](SPEC-03-man-hoc.md) | Màn Học (danh sách + chi tiết bài) | Có |
| [SPEC-04](SPEC-04-luyen-tap.md) | Luyện tập: khung phiên + 5 dạng bài | Có |
| [SPEC-05](SPEC-05-on-tap.md) | Ôn tập hôm nay, kết quả & điểm yếu | Có |

Thứ tự phụ thuộc: SPEC-01 → SPEC-02 + SPEC-03 → SPEC-04 → SPEC-05.
SPEC-04 đã nghiệm thu trong trình duyệt; ghi chú bàn giao ở `docs/handoff/SPEC-04.md`.

## Đợt 2 — đã viết

| Spec | Feature | Bàn giao thiết kế |
|---|---|---|
| [SPEC-06](SPEC-06-cai-dat-va-du-lieu.md) | Cài đặt, Export & Import dữ liệu | Có |
| [SPEC-08](SPEC-08-dong-bo-supabase.md) | Đăng nhập & đồng bộ Supabase | Có |
| [SPEC-07](SPEC-07-thong-ke.md) | Thống kê & biểu đồ | Có |

Thứ tự build: **SPEC-06 → SPEC-08 → SPEC-07**. SPEC-06 đi trước vì SPEC-02 và SPEC-05 đang
đọc những cài đặt chưa có nơi nào sửa được; SPEC-08 đi trước SPEC-07 vì `pendingSync` chỉ
phình ra cho tới khi có bên đọc.

Ba spec này sửa lại một số chỗ đã chốt ở đợt 1 — sửa luôn file gốc khi cài đặt:

- SPEC-06 §2.1: tên cài đặt và khóa `jp:settings` — **đã cài xong** trong
  `web/src/lib/settings.ts` và `store.ts` (vòng rà soát 17/09).
- SPEC-08 §3.2: bỏ ghi chú "huy hiệu luôn là trạng thái thứ ba" trong SPEC-02 §5.
- SPEC-08 §2.2: **sai khác với `project-design-spec.md` §6.1** — dùng hàm Postgres
  `sync_practice()` thay cho endpoint `/api/sync/practice`. Cần duyệt trước khi cài.
- SPEC-07 §2.3: ô số liệu dashboard của SPEC-02 chuyển sang gọi `src/lib/stats.ts`.

## Đợt 3 — đã viết

| Spec | Feature | Bàn giao thiết kế |
|---|---|---|
| [SPEC-09](SPEC-09-audio-zip.md) | Nạp audio đĩa CD từ file ZIP | Có |
| [SPEC-10](SPEC-10-shadowing-player.md) | Trình phát Shadowing (A-B repeat) | Có |
| [SPEC-12](SPEC-12-tra-cuu.md) | Tra cứu: kanji, động từ, 10 bảng tham chiếu | Có |
| [SPEC-13](SPEC-13-tim-kiem.md) | Hộp tìm kiếm `Ctrl+K` | Có |
| [SPEC-14](SPEC-14-pwa-cai-dat.md) | PWA cài đặt & chế độ standalone (không service worker) | Có |

Hai chuỗi phụ thuộc, chạy song song được: **SPEC-09 → SPEC-10** và **SPEC-12 → SPEC-13**.
SPEC-14 thu hẹp còn phần cài đặt/standalone (24/09/2026); offline reload toàn app không làm.

Những chỗ các spec này chạm vào đợt trước:

- SPEC-09 §2.4: **giữ nguyên** `availableAudioKeys` nghĩa "máy có giọng `ja-JP`" của SPEC-01
  §5. Track CD không có mốc thời gian từng câu nên không dùng cho dạng bài `listening`.
- SPEC-10 §3.1: lấp khối Audio ở cuối `/hoc/[so]` của SPEC-03; không thêm route mới.
- SPEC-12 §2.1: **431/907 ví dụ ghép của kanji vẫn là tiếng Anh** trong trường `vi` — phải
  dịch và đối chiếu xong trước khi màn tra cứu lên.
- SPEC-12 §2.3: `/hoc/[so]` phải `notFound()` khi `so` không phải số, nếu không mọi đường dẫn
  con lạ sẽ rơi vào trang chi tiết bài.
- SPEC-13 §2.4: `/hoc/[so]` của SPEC-03 phải có `id` neo cho từng từ vựng và từng khối ngữ
  pháp, nếu không kết quả tìm kiếm chỉ dẫn tới đầu trang.

## Đợt 4 — chưa viết

F11 Nội dung N4 (bài 26–50).

> Không phải phase code. Không tồn tại nguồn dữ liệu N4 trong repo — đó là việc soạn nội dung
> từ đầu, khối lượng tương đương toàn bộ dữ liệu N5, và cần một tài liệu biên tập riêng tương
> đương `docs/n5-data-editorial-guide.md` trước khi bắt đầu.

## Khuôn chung

Mọi spec có giao diện theo đúng 10 mục; mục 3–6 là phần công cụ thiết kế đọc:

1. Mục tiêu & phạm vi (mục "Ngoài phạm vi" là **bắt buộc**)
2. Dữ liệu · 3. Màn hình & bố cục · 4. Component dùng lại · 5. Trạng thái
6. Tương tác & chuyển động · 7. Accessibility · 8. Bảo mật & dữ liệu
9. Tiêu chí nghiệm thu · 10. Khối lệnh bàn giao thiết kế

SPEC-01 là ngoại lệ — không có màn hình nên không có mục 3–7 và mục 10.

## Nguồn tham chiếu

| Tệp | Vai trò |
|---|---|
| `DESIGN.md` tại root | Hợp đồng UX + thị giác toàn cục — **nạp file này vào công cụ AI** |
| `web/src/app/globals.css` | Giá trị token lúc chạy (OKLCH, chế độ tối, `@theme inline`) |
| `docs/design-system.md` | Hướng dẫn đọc bằng tiếng Việt + checklist — không phải nguồn token |
| `docs/project-design-spec.md` | Đặc tả hệ thống gốc |

**Không** dùng file Stitch export để ghi đè `globals.css` — bản export đổi màu về hex, bỏ
chế độ tối, mất lớp `@theme inline`.
