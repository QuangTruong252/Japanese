# Đặc tả theo feature

Bộ spec chi tiết từng feature, tách từ `docs/project-design-spec.md` (SPEC-JPN-01) để bàn
giao được cho Google Stitch / Claude Design.

## Trạng thái hiện tại — đối chiếu code 18/09/2026

**Đặc tả ≠ code ≠ nghiệm thu.** Bảng này là điểm bắt đầu, không phải chứng nhận
toàn app. Code/lockfile xác định hiện trạng; spec xác định yêu cầu. Báo cáo cũ
chỉ chứng minh phạm vi ở ngày ghi nhận. Khi tiếp tục, kiểm tra Git/code liên quan.

| Phần | Đặc tả | Code quan sát được | Bằng chứng / phần chưa kiểm chứng |
| --- | --- | --- | --- |
| SPEC-01: dữ liệu/câu hỏi | Có | Có generator, filter, notation, FSRS | Ghi nhận static gates 17/09 ở mục bên dưới; [nội dung N5](../n5-manifest.md) chưa xác minh sách |
| SPEC-02: shell/dashboard | Có | [AppNav](../../web/src/components/AppNav.tsx), [dashboard](../../web/src/app/page.tsx) | Có code; chưa có handoff nghiệm thu toàn feature |
| SPEC-03: học | Có | [Danh sách](../../web/src/app/hoc/page.tsx), [chi tiết](../../web/src/app/hoc/[so]/page.tsx) | Có code; chưa có handoff nghiệm thu toàn feature |
| SPEC-04: luyện tập | Có | [PracticeRunner](../../web/src/components/practice/PracticeRunner.tsx) và các dạng bài | [Handoff 17/09](../handoff/SPEC-04.md), có nghiệm thu và giới hạn; chưa tái nghiệm thu toàn bộ hôm nay |
| SPEC-05: ôn/điểm yếu | Có | [Ôn](../../web/src/app/on-tap/page.tsx), [phiên](../../web/src/app/on-tap/phien/page.tsx), [điểm yếu](../../web/src/app/on-tap/diem-yeu/page.tsx) | [Handoff 22/09](../handoff/SPEC-05.md) — đã nghiệm thu trình duyệt (empty state, hàng đợi, phiên FSRS, bảng điểm yếu, responsive 390px/1280px) |
| SPEC-06: cài đặt/import/export | Có | [Cài đặt](../../web/src/app/cai-dat/page.tsx), [backup.ts](../../web/src/lib/backup.ts) | [Handoff 22/09](../handoff/SPEC-06.md) — đã nghiệm thu trình duyệt (hiển thị, preview, export/import JSON, danger zone wipe, responsive) |
| SPEC-07: thống kê | Có | [stats.ts](../../web/src/lib/stats.ts), [thong-ke/page.tsx](../../web/src/app/thong-ke/page.tsx) | [Handoff 22/09](../handoff/SPEC-07.md) — đã nghiệm thu trình duyệt (4 ô KPI, lịch nhiệt 12 tuần cuộn ngang mobile, biểu đồ cột 14d, biểu đồ đường 30d ngắt quãng, thanh phân bố, responsive) |
| SPEC-08: auth/sync | Có | [supabase/migrations/0001_init.sql](../../supabase/migrations/0001_init.sql), [sync.ts](../../web/src/lib/sync.ts), [SyncBadge.tsx](../../web/src/components/SyncBadge.tsx), [cai-dat/page.tsx](../../web/src/app/cai-dat/page.tsx) | [Handoff 22/09](../handoff/SPEC-08.md) — đã nghiệm thu trình duyệt (SyncBadge hàng đợi, card trạng thái Supabase, responsive, push-pull RPC, RLS) |
| SPEC-09/10: audio ZIP/Shadowing | Có | Chưa có importer/player; [TTS](../../web/src/lib/tts.ts) là chức năng khác | Chưa nghiệm thu |
| SPEC-12/13: tra cứu/tìm kiếm | Có | Chưa có route/màn tương ứng | Chưa nghiệm thu |
| SPEC-14: PWA/offline shell | Có | Chưa có service worker/manifest PWA | Offline một phiên đã nạp không chứng minh offline reload toàn app |
| F11: N4 | Chưa có spec biên tập | Chưa có dữ liệu N4 | Cần nguồn và biên tập trước khi xây UI |

Bước tiếp theo: triển khai Chuỗi Audio & Trình phát (SPEC-09 & SPEC-10) → Chuỗi Tra cứu (SPEC-12 & SPEC-13).
Phạm vi brand/agent riêng theo [handoff MaiPace](../handoff/MAIPACE.md).
Khi làm xong một phần, cập nhật hàng tương ứng và handoff với ngày, kiểm tra
đã chạy, giới hạn và bước tiếp theo. Không đổi trạng thái phần chưa được kiểm tra.

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
| SPEC-14 §2.1a–2.1c | **Cache RSC** trong `jp-rsc-<BUILD_ID>`; truyền BUILD_ID qua `?v=`; precache thêm `/hoc`, `/luyen-tap`, `/on-tap` |

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
| [SPEC-14](SPEC-14-pwa-offline-shell.md) | PWA & vỏ ứng dụng ngoại tuyến | Có |

Hai chuỗi phụ thuộc, chạy song song được: **SPEC-09 → SPEC-10** và **SPEC-12 → SPEC-13**.
SPEC-14 độc lập, cài lúc nào cũng được.

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
| `DESIGN.md` tại root | Hợp đồng token máy đọc được — **nạp file này vào công cụ AI** |
| `docs/design-system.md` | Lý do thiết kế, khuôn mẫu màn hình, luật biểu đồ, checklist |
| `web/src/app/globals.css` | Bản thi hành lúc chạy (OKLCH, chế độ tối, `@theme inline`) |
| `docs/project-design-spec.md` | Đặc tả hệ thống gốc |

**Không** dùng file Stitch export để ghi đè `globals.css` — bản export đổi màu về hex, bỏ
chế độ tối, mất lớp `@theme inline`.
