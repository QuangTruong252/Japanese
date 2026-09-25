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
| 10 | Phần lớn | Control chính ≥44px ở các màn đã sửa. Còn `SearchTrigger` 38px, `ThemeToggle` 40px (component dùng chung, chưa đổi) | — |
| 21–24 | Đã sửa, kiểm chứng | Chọn bài kèm tên; preset luyện tập lưu trong `settings.ts`; "Bắt đầu N câu"; số câu từng dạng, dạng 0 câu bị tắt kèm lý do | `luyen-tap/page.tsx`, `lib/settings.ts`, `lib/store.ts` |
| 25–27 | Đã sửa, kiểm chứng | Gợi ý trợ từ は/へ/を (không đổi chấm điểm), nút "Chưa biết", tạm dừng đồng hồ + overlay | `practice-draft.ts` (`particleHint`), `QuestionCloze.tsx`, `QuestionListening.tsx`, `PracticeRunner.tsx` |
| 28, 29 | Đã sửa, kiểm chứng | Đề và đáp án thành một cụm; ghép cặp dạng lưới theo hàng | `PracticeRunner.tsx`, `QuestionMatching.tsx` |
| 31–33 | Đã sửa (33 một phần) | Động từ mobile dạng thẻ (nghĩa hiện ngay), tìm Kanji theo chữ/âm/kana/romaji/nghĩa (`?q=`), nút nghe từ ghép. Không có giải thích cách đọc; dữ liệu kanji không có âm Hán Việt | `VerbTable.tsx`, `KanjiGrid.tsx`, `lib/kanji-filter.ts`, `kanji/[chu]/page.tsx` |
| 34 | Tối thiểu | Mẫu `manifest.json` (có test với validator) + nút sao chép + các bước tạo gói; không có công cụ tạo gói | `cai-dat/audio/page.tsx`, `lib/audio-manifest-sample.ts` |
| 35, 36 | Đã sửa, kiểm chứng | Trang `/hoc/tra-cuu/kana` (46+46, âm đục, âm ghép, nghe); Bảng tin người mới có lối vào Kana + khối Học/Luyện/Ôn; Ôn tập giải thích vì sao có mục mới | `tra-cuu/kana/*`, `data/kana.ts`, `DashboardContent.tsx`, `on-tap/page.tsx` |
| 37, 38 | Đã sửa, kiểm chứng | Chưa đăng nhập: badge "Chỉ lưu trên máy", không còn "Chờ đồng bộ (n)"; SyncBadge chỉ đọc session cục bộ; copy cài đặt bỏ "/on-tap", "TTS", "Xuất file JSON"; khối tài khoản lên đầu | `SyncBadge.tsx`, `cai-dat/page.tsx` |

Quyết định chung: app shell dùng `overflow-x-clip` (thay `hidden`) để `sticky`
hoạt động. `formatOptionalBrackets` là nơi duy nhất đổi ngoặc tùy chọn như
`どこ[へ]も`. `build-n5-data.mjs` nhận đối số (`verbs`, `kanji`...) để không ghi
đè vocab đã làm giàu. Chạy toàn bộ build vẫn ghi đè; tránh chạy không đối số.

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

## Còn lại và bước tiếp theo
- Người dùng duyệt nhánh `feedback-v1` rồi merge vào `master`.
- Offline: bấm "Bắt đầu"/banner khi đã mất mạng vẫn cần payload route (không có service worker); ngoài phạm vi.
- #10: nâng `SearchTrigger`/`ThemeToggle` lên 44px nếu muốn đồng bộ.
- #8: /hoc ở 390px còn khoảng 5.500px (trước ~8.000px); có thể thu gọn thêm thẻ bài.
- Hoàn tác flashcard với từ mới chỉ hoạt động khi lượt chấm chưa được đẩy lên server.
- Kanji: bổ sung âm Hán Việt vào dữ liệu nếu muốn tìm "nhân" ra 人.
