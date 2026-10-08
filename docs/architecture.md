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
| `/` | Bảng tin | `DashboardContent` |
| `/hoc` | Danh sách bài | `LessonGrid` |
| `/hoc/[so]` | Chi tiết bài | `page.tsx` + `_parts.tsx`, `ShadowingPlayer` |
| `/hoc/[so]/tu-vung` | Học từ vựng | `VocabLearningFlow` |
| `/luyen-tap`, `/luyen-tap/phien` | Luyện tập | `PracticeRunner` |
| `/on-tap`, `/on-tap/phien`, `/on-tap/diem-yeu` | Ôn tập | `ReviewRunner`, `DashboardReinforcement` |
| `/hoc/tra-cuu` (+ `kana`, `kanji`, `kanji/[chu]`, `dong-tu`, `bang`, `bang/[slug]`) | Tra cứu | `KanjiGrid`, `VerbTable` |
| `/ca-nhan`, `/ca-nhan/thong-ke` | Cá nhân, thống kê | `StatisticsContent` |
| `/cai-dat`, `/cai-dat/audio` | Cài đặt, nạp audio | `InstallAppCard` |

`AppNav` (thanh dưới trên mobile, thanh bên từ `lg`) và hộp tìm kiếm `Ctrl+K` (`components/search/`)
dùng chung cho mọi màn. Màn nào đã sang v3: `DESIGN.md` §11.

## Dữ liệu và trạng thái

| Nơi lưu | Nội dung | Truy cập |
|---|---|---|
| Dữ liệu tĩnh `web/src/data/n5/` | Bài học, từ vựng, kanji, động từ, bảng tham chiếu | `lib/lessons.ts`, `lib/lookup.ts`, `lib/search.ts` |
| IndexedDB `JapaneseLearningDB` (Dexie, `lib/db.ts`) | `reviewItems` (thẻ ôn FSRS), `practiceSessions`, `audioFiles`, `pendingSync` | `useLiveQuery`; hàng đợi ôn qua `lib/use-due-queue.ts`, `lib/review-queue.ts` |
| `localStorage` | Cài đặt `jp:settings` (`lib/settings.ts`); nháp phiên `jp:practice-draft`, `jp:vocab-draft:<bài>` | `lib/settings.ts`, `lib/practice-draft.ts`, `lib/vocab-draft.ts`, `lib/active-drafts.ts` |
| Zustand (`lib/store.ts`) | Chỉ trạng thái UI tạm (mở hộp tìm kiếm…) | — |
| Supabase (tùy chọn) | Auth và đồng bộ từ `pendingSync` | `lib/sync.ts`, `lib/supabase/` |

Luồng chính:
- **Ôn tập:** trả lời → `lib/fsrs.ts` (`rateAnswer`, `applyReview`) → ghi `reviewItems` (+ `pendingSync`
  khi đăng nhập) → hàng đợi đến hạn tính lại.
- **Luyện tập:** câu hỏi sinh từ dữ liệu bài (`lib/questions.ts`, `lib/practice.ts`), nháp lưu
  `localStorage` để học tiếp.
- **Audio:** người học nạp ZIP (`lib/audio-zip.ts`, `hooks/use-audio-import.ts`) → `audioFiles` →
  `ShadowingPlayer`. Audio nguồn không nằm trong repo.
