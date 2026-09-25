# Handoff — Xử lý user feedback v1 (38 điểm)
Ngày: 2026-09-25. Trạng thái: đã có code trên nhánh `feedback-v1`, đã kiểm chứng
static gates + trình duyệt 390px (dev và production build); chưa merge `master`.

Nguồn feedback: `user-feedback/fb_v1.md` (không commit). Thực hiện bằng Orca
orchestration: 8 worker Antigravity (Gemini 3.8 Flash High) chạy song song trên
worktree riêng, Claude Code review/kiểm chứng và tích hợp; W5 do coordinator làm
vì worker không khởi động được (lỗi readiness của Orca, 3 lần).

## Thay đổi theo feedback

| # | Trạng thái | Thay đổi chính | File |
|---|---|---|---|
| 1 | Đã sửa, kiểm chứng | `vi` của 119/156 động từ bị lệch hàng từ dict build; sinh lại từ vocab (156/156), sửa 15 ví dụ kanji; test đối chiếu verbs↔vocab | `scripts/data-dicts/n5-verbs-dict.mjs`, `verbs.json`, `data/n5/kanji/*.json`, `lookup.test.ts` |
| 2 | Đã sửa, kiểm chứng | "Hôm nay" theo số phiên; 0<giây<60 hiện "Dưới 1 phút" | `lib/stats.ts`, `thong-ke/page.tsx` |
| 3, 22 (nháp) | Đã sửa, kiểm chứng | Nháp phiên luyện tập `jp:practice-draft`; thoát có "Lưu và học tiếp sau"; banner học tiếp ở /luyen-tap; reload /phien khôi phục nháp thay vì tạo phiên mới | `lib/practice-draft.ts`, `PracticeRunner.tsx`, `PracticeDraftBanner.tsx`, `luyen-tap/phien/page.tsx` |
| 4, 16–20 | Đã sửa, kiểm chứng | Flashcard: chọn nhanh 5/10/tất cả (mặc định 10 từ mới), nháp vị trí `jp:vocab-draft:<bài>`, hoàn tác lần chấm (transaction Dexie + pendingSync, thắng LWW), hàng là checkbox, mô tả 4 mức + khoảng ôn, bỏ chữ FSRS | `VocabLearningFlow.tsx`, `lib/vocab-learning.ts`, `lib/vocab-draft.ts` |
| 5, 30 | Đã sửa, kiểm chứng | Kết quả: "Câu sai (n)" kèm câu bạn trả lời; "Làm lại câu sai" (chạy được khi offline); bỏ nhóm "đúng nhưng chậm" vì câu mới không có median thời gian | `SessionResult.tsx`, `QuestionMc.tsx` |
| 6 | Đã sửa, kiểm chứng | Bảng điểm yếu có nút Luyện / Xem bài (anchor) | `on-tap/diem-yeu/page.tsx` |
| 7–9, 11–15 | Đã sửa, kiểm chứng | /hoc: danh sách lên màn đầu, thống kê 1 dải (bỏ thanh 40% giả), filter 2×2 không cuộn ngang, furigana cho `jpTitle`/grammar; chi tiết bài: thanh nhảy nhanh sticky, nút luyện tập ở đầu, bảng từ vựng mobile; nhãn "Đã vào lịch ôn" | `LessonGrid.tsx`, `hoc/[so]/page.tsx`, `LessonProgress.tsx`, `japanese.ts` (`formatOptionalBrackets`) |
| 10 | Đã sửa, kiểm chứng | Control chính ≥44px ở mọi màn đã sửa, kể cả `SearchTrigger`/`ThemeToggle` (các nơi gọi từng ép 36–40px) | `SearchTrigger.tsx`, `hoc/page.tsx`, `DashboardContent.tsx` |
| 21–24 | Đã sửa, kiểm chứng | Chọn bài kèm tên; preset luyện tập lưu trong `settings.ts`; "Bắt đầu N câu"; số câu từng dạng, dạng 0 câu bị tắt kèm lý do | `luyen-tap/page.tsx`, `lib/settings.ts`, `lib/store.ts` |
| 25–27 | Đã sửa, kiểm chứng | Gợi ý trợ từ は/へ/を (không đổi chấm điểm), nút "Chưa biết", tạm dừng đồng hồ + overlay | `practice-draft.ts` (`particleHint`), `QuestionCloze.tsx`, `QuestionListening.tsx`, `PracticeRunner.tsx` |
| 28, 29 | Đã sửa, kiểm chứng | Đề và đáp án thành một cụm; ghép cặp dạng lưới theo hàng | `PracticeRunner.tsx`, `QuestionMatching.tsx` |
| 31–33 | Đã sửa (33 một phần) | Động từ mobile dạng thẻ (nghĩa hiện ngay); tìm Kanji theo chữ/âm Hán Việt/kana/romaji/nghĩa (`?q=`), khớp đúng xếp đầu ("nhân" → 人); âm Hán Việt trên lưới, trang chi tiết, tìm kiếm toàn cục; nút nghe từ ghép. Chưa có phần giải thích khi nào dùng cách đọc nào | `VerbTable.tsx`, `KanjiGrid.tsx`, `lib/kanji-filter.ts`, `kanji/[chu]/page.tsx`, `data/n5/kanji/*.json` (`hanviet`), `lib/search.ts` |
| 34 | Tối thiểu | Mẫu `manifest.json` (có test với validator) + nút sao chép + các bước tạo gói; không có công cụ tạo gói | `cai-dat/audio/page.tsx`, `lib/audio-manifest-sample.ts` |
| 35, 36 | Đã sửa, kiểm chứng | Trang `/hoc/tra-cuu/kana` (46+46, âm đục, âm ghép, nghe); Bảng tin người mới có lối vào Kana + khối Học/Luyện/Ôn; Ôn tập giải thích vì sao có mục mới | `tra-cuu/kana/*`, `data/kana.ts`, `DashboardContent.tsx`, `on-tap/page.tsx` |
| 37, 38 | Đã sửa, kiểm chứng | Chưa đăng nhập: badge "Chỉ lưu trên máy", không còn "Chờ đồng bộ (n)"; SyncBadge chỉ đọc session cục bộ; copy cài đặt bỏ "/on-tap", "TTS", "Xuất file JSON"; khối tài khoản lên đầu | `SyncBadge.tsx`, `cai-dat/page.tsx` |

Quyết định chung: app shell dùng `overflow-x-clip` (thay `hidden`) để `sticky`
hoạt động. `formatOptionalBrackets` là nơi duy nhất đổi ngoặc tùy chọn như
`どこ[へ]も`. `build-n5-data.mjs` bắt buộc chỉ định phần build (`verbs|kanji|reference|all`);
`vocab`/`lessons` cần `--force` vì sẽ xóa verbForms đã làm giàu. Offline:
`experimental.useOffline` + `staleTimes.static` 1 ngày + prefetch route phiên học/thoát.

## Kiểm chứng (2026-09-25, Windows, Chrome headless qua agent-browser)
- `pnpm check` PASS; `pnpm test` 187/187 PASS; `pnpm build` PASS trên `feedback-v1`.
- Browser 390px trên dev server:
  - flashcard: nháp và học tiếp, hoàn tác (từ mới và từ đã có, đã đối chiếu Dexie);
  - phiên luyện tập: lưu, thoát, resume token, reload giữa phiên, lưu ở câu cuối, làm lại câu sai, tạm dừng;
  - thiết lập: preset được nhớ, dạng 0 câu bị tắt;
  - các trang còn lại: bảng điểm yếu, thống kê "Dưới 1 phút", cài đặt/badge, /hoc, /hoc/5 (sticky, `どこ(へ)も`), tra cứu động từ/kanji, Kana, Bảng tin người mới, ghép cặp;
  - `scrollWidth` = 390 ở mọi route đã thử.
- Production build (`pnpm start`): mất mạng giữa phiên vẫn làm tiếp và ghi Dexie (1 session + 1 pendingSync); "Làm lại câu sai" khi offline chạy được.
- CHƯA CHẠY: iOS/Android thật, sync Supabase thật sau khi hoàn tác flashcard, desktop 1280px cho toàn bộ màn, trình đọc màn hình.

## Vòng xử lý giới hạn (2026-09-25, sau review đầu)
- Offline: trên production, đang offline vẫn bấm "Bắt đầu", thoát và lưu, "Học tiếp" từ banner, "Bắt đầu ôn", mở flashcard từ trang bài, và chuyển trang bằng dock (Thống kê, Học, Bảng tin) — PASS. Tải lại toàn trang khi offline vẫn không được (không có service worker, SPEC-14).
- Hoàn tác từ mới sau khi đã đồng bộ: đặt lại về thẻ chưa ôn (0/0, reps=0) kèm pendingSync mới để thắng LWW (server chỉ upsert). Đã giả lập bằng cách xóa dòng pendingSync — PASS.
- /hoc ở 390px còn 4.539px (ban đầu ~8.000px): mô tả thẻ ẩn trên mobile, không còn control nào dưới 44px.
- Âm Hán Việt: 169/169 chữ có `hanviet`, test dữ liệu thật ("nhân"/"nhan" → 人 đầu, "NHẬT" → 日).
- Script build: không đối số thì in hướng dẫn và thoát 1; `vocab` không kèm `--force` bị từ chối.

## Còn lại và bước tiếp theo
- Người dùng duyệt nhánh `feedback-v1` rồi merge vào `master`.
- Chưa chạy: iOS/Android thật, Supabase thật (đặc biệt reset thẻ sau hoàn tác), desktop 1280px toàn bộ màn.
- `experimental.useOffline` và `staleTimes` là tính năng thử nghiệm của Next 16; nếu nâng Next thì kiểm tra lại.
- #33: giải thích khi nào dùng âm On/Kun cần biên soạn nội dung, chưa làm.
