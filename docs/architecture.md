# Kiến trúc

## Bản đồ repo

| Đường dẫn | Nội dung |
|---|---|
| `web/` | App Next.js 16 (App Router), React 19, TypeScript, Tailwind v4. |
| `web/src/app/` | Routes (bảng dưới), `layout.tsx`, `globals.css` (token, font, CSS dùng chung). |
| `web/src/components/` | UI. `ui/` = shadcn (base-nova, Base UI); `PaperKit.tsx` = thành phần v3; `FeatureIcon.tsx` = bộ icon. |
| `web/src/lib/` | Logic và test `*.test.ts`. |
| `web/src/data/n5/` | Dữ liệu học (JSON): `lessons/`, `vocab/`, `kanji/`, `verbs/`, `reference/`. |
| `web/src/types/` | Kiểu dùng chung (`Lesson`, `VocabWord`, `ReviewItem`, `IllustrationAsset`…). |
| `web/public/assets/illustrations/` | Ảnh WebP đã xuất (tạo qua `artwork/illustrations/`). |
| `artwork/` | Nguồn và pipeline ảnh minh họa, icon. |
| `design/<màn>/` | Mockup đã duyệt, ảnh "as-built". |
| `docs/` | `architecture.md`, `engineering.md`, `data/`, `workflow/`. |
| `scripts/` | `setup.mjs` (thiết lập máy), script dữ liệu (`docs/data/README.md`), `ui-qa/` (seed, chụp, so màn hình), `orca-wait.mjs` (chờ worker). |
| `supabase/migrations/` | Schema đồng bộ. |

## Routes

| Route | Màn | Thành phần chính |
|---|---|---|
| `/` | Hôm nay | `DashboardContent`: việc chính, cách luyện cố định, bài đang học và nháp |
| `/hoc` | Danh sách bài | `LessonGrid` |
| `/hoc/[so]` | Chi tiết bài | `page.tsx` + `_parts.tsx`, `_tabs.tsx` (tab, lưới/danh sách từ) |
| `/hoc/[so]/tu-vung` | Học từ vựng | `VocabLearningFlow` (+ `components/vocab/*`) |
| `/luyen-tap` | Danh mục cách luyện | `PracticeMethods`, `ActiveDraftRows`; link cấu hình cũ có `lessons`/`type` chuyển tiếp phía client để hub vẫn được prerender/tải sẵn |
| `/luyen-tap/bai-tap`, `/luyen-tap/phien` | Cấu hình bài tập, phiên câu hỏi | Giữ preset và bảo vệ nháp; `PracticeRunner`, khung phiên chung `practice/SessionFrame` |
| `/luyen-tap/hoi-thoai` | Chọn bài có hội thoại | Dẫn về tab Hội thoại của bài học, sau đó đọc hoặc đóng vai bằng luồng hiện có |
| `/on-tap`, `/on-tap/phien`, `/on-tap/diem-yeu` | Ôn tập | `ReviewRunner` (dùng `SessionFrame`), `on-tap/ReinforcementSection` |
| `/luyen-viet`, `/luyen-viet/phien` | Luyện viết kana và kanji N5 (vẽ nét) | `WritingPicker`, `WritingSession`, ô viết `components/writing/StrokeBox` |
| `/nghe-moi-ngay`, `/nghe-moi-ngay/phien` | Chép chính tả theo ngày và phạm vi đã học | `DictationRunner`, bộ câu đã rà `lib/dictation.ts` |
| `/luyen-tap/dich-cau`, `/luyen-tap/dich-cau/phien` | Dịch phản xạ Nhật ↔ Việt tự chọn chiều, bài và số câu; chấm offline | `TranslationRunner`, `lib/translation.ts` (chọn câu, chấm, ý chính), kho câu `lib/translation-data.ts` |
| `/luyen-tap/doc-hieu`, `/luyen-tap/doc-hieu/phien?id=<phiên>` | Luyện đọc: danh sách bài theo mốc, phiên hội thoại/đoạn văn + câu hỏi, kết quả | `ReadingList`, `ReadingRunner`, `ReadingResults` (`components/reading/`), logic `lib/reading*.ts` |
| `/hoc/tra-cuu` (+ `kana`, `kanji`, `kanji/[chu]`, `dong-tu`, `bang`, `bang/[slug]`) | Tra cứu | `KanjiGrid`, `VerbTable` |
| `/ca-nhan`, `/ca-nhan/thong-ke` | Cá nhân, thống kê | `StatisticsContent` (+ `components/stats/*`) |
| `/cai-dat`, `/cai-dat/audio` | Cài đặt, nạp audio | `components/settings/*`, `InstallAppCard` |

`AppNav`: mobile có thanh dưới 5 mục Hôm nay, Học bài, Luyện tập, Ôn tập, Tra cứu; tablet có rail;
desktop có sidebar và ba shortcut Bài tập, Nghe mỗi ngày, Luyện viết. Header mobile giữ tìm kiếm
và hồ sơ; hồ sơ mở Tiến độ, Thống kê, Tài khoản, Cài đặt. Tìm kiếm `Ctrl+K` (`components/search/`)
tìm cả ngữ liệu và phương thức luyện. Phiên toàn màn hình tiếp tục ẩn chrome. Màn nào đã sang v3: `DESIGN.md` §11.

## Dữ liệu và trạng thái

| Nơi lưu | Nội dung | Truy cập |
|---|---|---|
| Dữ liệu tĩnh `web/src/data/n5/` | Bài học, từ vựng, kanji, động từ, bảng tham chiếu | `lib/lessons.ts`, `lib/lookup.ts`, `lib/search.ts` |
| Dữ liệu nét `web/src/data/strokes/kana.json`, `kanji.json` (KanjiVG) | Thứ tự và đường nét kana, kanji N5 | `lib/strokes.ts`; chấm nét `lib/stroke-match.ts` |
| IndexedDB `JapaneseLearningDB` (Dexie, `lib/db.ts`) | `reviewItems` (thẻ ôn FSRS), `practiceSessions`, `audioFiles`, `pendingSync`; `writingCards` (lịch FSRS luyện viết, tách khỏi ôn tập, chưa đồng bộ) | `useLiveQuery`; hàng đợi ôn qua `lib/use-due-queue.ts`, `lib/review-queue.ts`; luyện viết qua `lib/writing.ts` |
| `localStorage` | Cài đặt `jp:settings` (`lib/settings.ts`); nháp phiên `jp:practice-draft`, `jp:vocab-draft:<bài>` | `lib/settings.ts`, `lib/practice-draft.ts`, `lib/vocab-draft.ts`, `lib/active-drafts.ts` |
| IndexedDB `dictationSessions` | Nháp và kết quả nghe mỗi ngày; khóa ngày địa phương + phạm vi + phiên bản câu, lưu cả bộ câu để phiên dở không đổi | `lib/dictation-store.ts`; sao lưu/xóa cùng dữ liệu học, chưa đồng bộ tài khoản |
| IndexedDB `translationSessions` | Nháp và kết quả Dịch phản xạ; khóa ngẫu nhiên, lưu id câu + chiều + gợi ý + lần trả lời đầu + nguồn chấm (`automatic`/`self`), không ghi FSRS hay thống kê | `lib/translation-store.ts`, `lib/translation-session.ts`; sao lưu/xóa cùng dữ liệu học, chưa đồng bộ tài khoản |
| `localStorage` `jp:translation-config` | Chiều, bài, số câu lần chọn gần nhất của máy, đã validate khi đọc | `/luyen-tap/dich-cau` |
| `localStorage` `jp:dictation-scope` | Phạm vi bài nghe riêng của máy, không đổi tiến độ học chung | `/nghe-moi-ngay` |
| IndexedDB `readingSessions` (db v6, khóa `id`, chỉ mục `updatedAt`) | Phiên Luyện đọc: khóa ngẫu nhiên, giữ bản chụp cả bài (nguồn, đáp án) để catalog đổi vẫn xem được kết quả cũ; bản ghi hỏng được báo lỗi, không tự sửa. Từ khó thêm vào `reviewItems` qua `lib/reading-review.ts` | `lib/reading-store.ts`, `lib/reading-session.ts`; sao lưu/xóa cùng dữ liệu học (`lib/backup.ts`), chưa đồng bộ tài khoản |
| `localStorage` `jp:reading-scope` | JSON `{version:1, lesson 1–25, minCoverage 80–100, maxNewGrammar 0–2}`; sai trường nào thì bỏ cả bộ. Chưa lưu thì lấy bài đã học xa nhất làm mốc | `lib/reading.ts` (`/luyen-tap/doc-hieu`) |
| `localStorage` `jp:reading-display` | JSON `{version:1, fontStep 1–5 (mặc định 3), background auto/paper/white/dark, font mincho/gothic}`; chỉ đổi vùng đọc, không đổi theme app | `lib/reading-display.ts` |
| Dữ liệu tĩnh `web/src/data/n5/reading.json` | Bài đọc đã duyệt; sinh bằng `scripts/build-reading.mjs` (`check`, `release`), quy trình ở `docs/data/reading.md` | `lib/reading-data.ts` |
| Zustand (`lib/store.ts`) | Chỉ trạng thái UI tạm (mở hộp tìm kiếm…) | — |
| Supabase (tùy chọn) | Auth và đồng bộ từ `pendingSync` (engine khởi động một lần trong `AppNav`, tự đẩy khi có mục chờ mới). Cài đặt là riêng từng máy, không đồng bộ | `lib/sync.ts`, `lib/supabase/` |

Luồng chính:
- **Ôn tập:** trả lời → `lib/fsrs.ts` (`rateAnswer`, `applyReview`) → ghi `reviewItems` (+ `pendingSync`
  khi đăng nhập) → hàng đợi đến hạn tính lại.
- **Luyện tập:** câu hỏi sinh từ dữ liệu bài (`lib/questions.ts`, `lib/practice.ts`), nháp lưu
  `localStorage` để học tiếp.
- **Audio:** đang tạm ẩn mọi lối vào (cờ `AUDIO_IMPORT_ENABLED` trong `lib/features.ts`). Khi bật: người học nạp ZIP (`lib/audio-zip.ts`, `hooks/use-audio-import.ts`) → `audioFiles` →
  `ShadowingPlayer`. Audio nguồn không nằm trong repo.
