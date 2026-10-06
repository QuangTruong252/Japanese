# Handoff — Quy ước và bộ minh họa đầu tiên

Ngày: **05/10/2026**. Trạng thái: **đã tích hợp 44 asset (9 pilot + 35 asset mở rộng, gồm Bài 8) và dựng lại UI theo concept Phố giấy sau phản hồi người dùng; kiểm static/build và browser theo phạm vi dưới đây; chưa kiểm thiết bị/host thật**.

## Thay đổi và quyết định

- [SPEC-21](../specs/SPEC-21-illustration-assets.md) là nguồn cho tên file, phiên bản, thư mục và URL tham chiếu minh họa. `DESIGN.md` tiếp tục sở hữu luật UX/thị giác.
- Chọn `web/public/assets/illustrations/` để dữ liệu có thể giữ URL root-relative trực tiếp; chia UI, scene, vocab và grammar. Tên theo nội dung dùng lại, không theo thứ tự từ hoặc số bài.
- Mẫu `<subject>[-<variant>]-vN.webp`; file đã được tham chiếu không đổi bytes tại cùng URL. Bản gốc và provenance ở `artwork/illustrations/`, concept cũ ở `new-ui/`.
- Tạo [mẫu phong cách](../../artwork/illustrations/reference/paper-town-style-v1.png) từ concept desktop Phố giấy; banner/scene cùng tham chiếu trực tiếp mẫu này. [STYLE.md](../../artwork/illustrations/STYLE.md) ghi brief vẽ để giữ nét giấy, màu nước, nhân vật và tránh chữ trong ảnh. Đây là brief asset, không thay token/hợp đồng UI.
- [Banner](../../web/public/assets/illustrations/ui/banners/paper-town-v1.webp): 1200 × 400, **133.158 bytes**; [cảnh giới thiệu bản thân](../../web/public/assets/illustrations/scenes/self-introduction-v1.webp): 800 × 600, **82.502 bytes**. Hai ảnh có nền giấy đục, không alpha. Master nguồn lần lượt 2172 × 724 và 1448 × 1086, tỷ lệ khớp khuôn nên resize không cắt nội dung.
- Lượt mở rộng pilot: 5 đồ vật thật trong Bài 2 — `hon` → `book`, `nooto` → `notebook`, `enpitsu` → `pencil`, `kasa` → `umbrella`, `kaban` → `school-bag`; grammar `kore-sore-are` và state `review-complete`. Cùng tham chiếu trực tiếp mẫu v1, không dùng ảnh sinh nối tiếp làm mẫu. Tổng 5 vocab **132.524 bytes** (mỗi ảnh 15.384–32.548 bytes); grammar **110.604 bytes**; state **26.470 bytes**.
- Sáu cutout nguồn 1254 × 1254 có alpha thật; resize `contain` vào 448 × 448, thêm 32 px trong suốt mỗi cạnh để thống nhất 512 × 512; alphaQuality 100. Grammar nguồn 1448 × 1086 xuất 800 × 600 giữ nguyên tỷ lệ. Metadata ghi `intendedContent` để tìm đúng file/ID đã đọc, không import sidecar vào app; mapping pilot hiện đã ghi vào JSON học.
- Cảnh grammar: người nói ở trái (miệng mở/tay đang giải thích), sách gần người nói; ô gần người nghe ở phải; cặp trên ghế phía xa. Cần nhãn HTML/Furigana khi tích hợp, không dùng ảnh thay toàn bộ giải thích. State là người ngồi thư giãn với sổ đóng, alt rỗng cạnh thông báo thật, không thêm thưởng/streak.
- Dùng công cụ built-in `image_gen`; PNG + prompt JSON ngoài public, prompt nhúng PNG. Xuất WebP bằng Sharp 0.35.4 có sẵn trong dependency Next.js, quality 82/effort 6; không cài thêm dependency. JSON sidecar ghi reference, prompt đầy đủ, kích thước master/output, cấu hình export, byte count và SHA-256. [Kho nguồn](../../artwork/illustrations/README.md) liên kết từng file.
- Đã thêm `IllustrationAsset`, optional `Lesson.cover`, `VocabWord.illustration`, `GrammarPoint.illustration` và `GrammarPoint.illustrationCaption` trong types. Tham chiếu thật: cover Bài 1, 5 vocab/1 grammar Bài 2. Metadata được kiểm ở `lessons.ts` bằng `illustrations.ts`; không có registry/resolver hoặc bảng Dexie mới. Nội dung từ JSON bundled nên người có tiến độ cũ nhận metadata qua app mới, không cần migration.
- `Illustration.tsx` tái sử dụng `next/image`, có width/height/sizes, lazy mặc định, eager/high cho banner/cover; onError bỏ ảnh, giữ chữ/nút ở cha. `DashboardContent`, trang bài, `VocabLearningFlow` và `/on-tap` render pilot; không đổi CTA/FSRS/queue/sync hoặc dependency. Giữ hash/bytes của 9 WebP cũ. `next.config.ts` chỉ thêm cache cho prefix ảnh WebP có version.

## Kiểm chứng

- Đọc schema/dữ liệu thật và tài liệu Next.js cài trong `web/node_modules/next/dist/docs/`: lựa chọn public URL và kích thước nguồn khớp API hiện có.
- Lượt quy ước trước: kiểm 93 liên kết local trong 8 tài liệu và đủ 6 nhóm thư mục — PASS ngày 05/10/2026; không gọi đó là kiểm ảnh.
- Lượt trước tạo mẫu/banner/scene: kiểm 110 liên kết local trong 6 tài liệu và 3 sidecar — PASS ngày 05/10/2026 trên Windows. Lượt mở rộng: kiểm **143 liên kết local trong 7 tài liệu, 10 sidecar/9 file public, 6 mapping dự kiến khớp ID dữ liệu thật, đường dẫn khớp case, bytes/SHA-256 khớp** — PASS. Không có prompt đầy đủ trong WebP public; hai file production cũ giữ nguyên hash.
- Sharp giải mã toàn bộ pixels và xác minh dimensions/format/alpha của 7 output mới — PASS; hash/bytes trong sidecar. Đếm pixels alpha: mỗi cutout có vùng alpha 0, vùng có nét vẽ và biên bán trong suốt; góc canvas alpha 0. Xem cả 7 WebP sau encode: đúng chủ thể, cùng nét màu nước, không chữ/UI, chủ thể không bị cắt; grammar giữ đúng ba khoảng cách. Hai asset cũ giữ nguyên.
- `impeccable embed-prompt --scan artwork/illustrations` sau mở rộng: **10 rasters, 0 missing** — PASS. Prompt nhúng vào toàn bộ master PNG, không đưa vào WebP public.
- `git diff --check`: PASS; phạm vi tạo ảnh chỉ tài liệu và asset mới, giữ các dirty changes có sẵn ở AGENTS/Claude/Repowise và bộ concept.
- Chạy lại `pnpm check` trong `web/` sau mở rộng pilot: **PASS** (TypeScript + ESLint), exit code 0 ngày 05/10/2026.
- Hai lượt tạo ảnh trước không chạy test/build/browser. Tổng 9 file là **485.258 bytes**, không yêu cầu tải cả bộ vào màn đầu; số trên đĩa không phải benchmark mạng/Next image optimizer.

### Tích hợp UI — 05/10/2026, Windows / Next.js 16.3.5

- `pnpm check`: **PASS**, TypeScript + ESLint, exit 0 sau sửa cuối.
- `pnpm test`: **274/274 PASS**, gồm regression metadata (URL ngoài/traversal/version/case/dimensions/alt), 7 tham chiếu nội dung đúng file/case/kích thước WebP, mapping ID và chữ Nhật/Việt của caption. Không đổi thuật toán chấm.
- `pnpm build`: **PASS**, exit 0 sau sửa caption. Lỗi dấu do shell pipe ghi literal Unicode đã sửa bằng patch UTF-8; test caption chặn tái diễn.
- Dev server đúng project `D:/Projects/Lab/Japanese/web`, `http://localhost:3200`, được xác nhận bằng Next DevTools metadata; `get_errors` cuối trả configErrors/sessionErrors rỗng.
- Browser agent-browser/Chromium session riêng: `/`, `/hoc/1`, `/hoc/2#grammar-kore-sore-are`, `/hoc/2/tu-vung`, `/on-tap`; 390 × 844 và 1440 × 1000, sáng/tối. Caption đúng dấu, hình đúng vai trò, không tràn vùng nội dung. Bảng tin 390px: CTA ôn ở y=424–472, còn trong viewport/dock. Bài 1: CTA học từ vẫn thấy, cover nhỏ trên mobile/bên phải header desktop.
- Flashcard notebook Bài 2: front **0 ảnh / 0 request notebook**. Bật offline trước reveal: ảnh lỗi bị bỏ, nghĩa và các mức chấm còn dùng được. Chọn Dễ nhớ → hoàn thành 1 từ; IndexedDB có `vocab-02-11`, reps=1 và pendingSyncCount=1; bật online lại. Đây là lưu offline trong tab đã mở, không kiểm reload offline hay sync Supabase thật.
- Kiểm keyboard Tab có focus-visible/ring. Dark + furigana lớn + reduced-motion ở 390px không tràn; ảnh không thêm animation. Nhánh hết mục/hạn mức `/on-tap` có state art + alt rỗng, thông báo hạn mức giữ nguyên (fixture session riêng: đã học 1 từ, hạn mức 1).
- Production local `next start --port 3201`: banner trả **200** + `public, max-age=31536000, immutable`; README ảnh/logo ngoài pattern vẫn `max-age=0`. Next optimizer `book` w=128,q=75 trả **200 WebP, 2.752 bytes**, cache `max-age=31536000, must-revalidate`. Đây là request mẫu local, không phải benchmark LCP; còn kiểm host thật.
- Kiểm cuối: **155 liên kết local trong 8 tài liệu, không có link thiếu**; hash/bytes của 9 WebP và ảnh mẫu khớp sidecar. So sánh 3 JSON với HEAD sau khi bỏ các trường ảnh mới: toàn bộ nội dung cũ, ID và thứ tự giữ nguyên. Sáu sidecar nội dung đã cập nhật trạng thái tham chiếu sang `added-to-learning-data`. `git diff --check`: PASS.
- Ảnh chụp UI thật: Bảng tin mobile, desktop, Bài 1 mobile, desktop, thẻ mặt nghĩa, grammar sáng, grammar tối, state tối. Đây là dữ liệu giả lập trong browser riêng, không phải tiến độ người dùng. _(đã gỡ khỏi repo ngày 06/10/2026; bản cũ ở tag `pre-cleanup`)_

## Còn lại và bước tiếp theo

- Lỗi header tràn 22px ở 360px/font gốc 20px của lượt tích hợp ảnh **đã sửa trong lượt redesign**: utility dùng kích thước px cố định, brand co hợp lý. Kiểm đúng trường hợp này đạt; không suy thành toàn app đã đạt mọi mức zoom.
- Chưa kiểm thiết bị thật, host/CDN thật, LCP mạng thật, toàn bộ phiên luyện/ôn hoặc Supabase sync/retry. Không service worker; không cam kết reload offline.
- Ảnh đã lỗi không tự retry trong cùng instance; sau reconnect mở lại nội dung để tạo request mới. Giữ nguyên v1 đã tham chiếu, thay bytes cần v2. Bài chưa có ảnh tiếp tục dùng chữ.

## Redesign theo concept — 05/10/2026

### Thay đổi và quyết định

- Người dùng phản hồi UI còn khác `new-ui`; lượt trước chỉ thêm ảnh vào bố cục cũ. Lượt này lấy **01-pho-giay-mobile / 04-pho-giay-desktop** làm mục tiêu bố cục: panorama mở ra mép trang, nền giấy ấm, giảm thẻ bao ngoài, hierarchy rõ và chữ Nhật lớn. Không sửa ảnh concept hoặc bytes của 9 WebP.
- `DashboardContent.tsx`: bố cục desktop hai cột, CTA trực tiếp trên nền, nháp ngay dưới CTA; bài đang học dùng số bài/chữ Nhật/progress. `DashboardReinforcement.tsx` hiện hai review target thật, dùng `useLiveQuery`, `useQuestionPool` và `buildTargetLabels` như màn Điểm yếu; không tạo số/nhãn giả hoặc persist mới.
- `AppNav.tsx`: sidebar nền giấy với logo lớn, active gạch chân; mobile navigation sát mép dưới, bỏ pill/bóng, năm đích/badge/ẩn chrome giữ nguyên. `layout.tsx` thêm scroll-padding để thao tác tự cuộn tránh thanh dưới. Trong QA nút Xong bị thanh che; đã sửa và click lại được.
- Bài `[so]/page.tsx` và `LessonActionHub.tsx`: tiêu đề/chữ Nhật giữa, scene đủ thấy người, CTA học/tiếp tục, preview từ đầu bài cho lượt mới, progress thật và ba hàng tham khảo. Desktop hub ở bên phải. Anchor và URL giữ nguyên.
- `PracticeRunner`, `AnswerOption`, `VocabLearningFlow`: chữ Nhật lớn ở đề ngắn/front, nền giấy và option muted; câu dài giữ bậc cũ. `SessionResult` dùng state art 128px cạnh thông báo thật. **Giữ chấm ngay khi chọn và màu đúng/sai ngữ nghĩa**, không thêm nút Kiểm tra hoặc bộ thưởng từ ảnh concept. Audio/FSRS/sync/ID và thuật toán CTA không thay.
- `PageTransition.tsx`: QA mở URL `#grammar-kore-sore-are` thấy shell chưa cuộn vì mục đến sau stream. Đã xử lý hash trong shell cuộn hiện có, đợi DOM khi cần bằng MutationObserver và cleanup theo route; hashchange vẫn tới đúng mục. Không thêm router/framework.
- `globals.css` đổi background/card sang giấy ngà ấm, thêm edge fade cho panorama/scene và selection theo token. Sửa có chủ đích hợp đồng Washi trong `DESIGN.md`, bổ sung mapping component và ghi bố cục/ngoại lệ chữ ở SPEC-16/18/04/15.

### Kiểm chứng thực chạy

- `pnpm check`: **PASS**, TypeScript + ESLint sau sửa hash cuối. `pnpm test`: **274/274 PASS**, exit 0 sau sửa cuối; không gọi test logic là nghiệm thu thị giác.
- `pnpm build`: **PASS**, exit 0 sau sửa hash cuối; đã tạo routes/SSG đầy đủ. Log local `maipace-redesign-build-verified.log`; không gọi build là nghiệm thu browser.
- Browser Chromium, **session riêng** `maipace-ui`, `maipace-redesign`, `maipace-guest`; đúng project/port 3200 qua Next DevTools metadata. Guest mới, có 2 mục đến hạn + 2 điểm yếu giả lập, có nháp, và đã có tiến độ. Screenshot không phải dữ liệu người dùng.
- Bảng tin 390×844: CTA ôn y=454–510 còn trên navigation; số đến hạn/badge=2, preview củng cố 学生 và 本 đúng dữ liệu. Desktop 1440×1000 hai cột. 320px/font 16px và 360px/font 20px không tràn header; 390px dark + furigana lớn + reduced motion không tràn.
- Bài 1 390px/1440px: scene/chữ Nhật/CTA học tiếp và ba lối tham khảo hiển thị đúng. Grammar Bài 2 caption giữ dấu/chữ Nhật; reload tại 390px với hash sau sửa cuộn tới mục (top≈172px, đúng scroll margin).
- Trắc nghiệm Bài 1, 10 câu: chọn sai thấy icon/đáp án/phản hồi; mất mạng trong tab đã mở vẫn chấm và chuyển câu. Lưu và học tiếp sau → nháp index=2/results=2; Bảng tin primary Tiếp tục → mở đúng **3/10**, chrome ẩn. Hoàn tất **8/10**, kết quả/câu sai/lối luyện lại xuất hiện, nháp được xóa. Đây là smoke test MC, chưa tái chạy riêng cả 5 dạng.
- Tab có focus-visible/ring; mở Tùy chỉnh và click Xong được sau scroll-padding. `get_errors` Next DevTools trả configErrors/sessionErrors rỗng.
- Flashcard Bài 2 chọn riêng 本: front **0 ảnh**, font tính được **48px**, không tràn; sau lật có hình sách/nghĩa/ví dụ/bốn mức chấm, giữ cơ chế recall. Minh họa completion/result 128px đã xem trong màn kết quả thật.
- Ảnh đối chiếu mới ở thư mục browser redesign; bộ chụp lần chỉ tích hợp ảnh trong `2026-10-05/` giữ nguyên để thấy khác biệt. _(đã gỡ khỏi repo ngày 06/10/2026; bản cũ ở tag `pre-cleanup`)_

### Giới hạn

- Giữ logo SVG, minh họa production và dữ liệu thật nên không chép mọi pixel/chữ/số giả trong concept. Không dùng ảnh UI nguyên khối làm màn hình.
- Chưa kiểm thiết bị thật, zoom 200% toàn app, deployment/CDN/LCP, đăng nhập/sync Supabase hoặc audio import trong lượt này. Những nghiệm thu lịch sử không được nâng thành kết quả mới.

## Mở rộng từ vựng Bài 1–2 — 05/10/2026

- Thêm 10 minh họa: sinh viên, bác sĩ, bút bi, bút chì kim, chìa khóa, đồng hồ, máy ảnh, bàn, ghế và cà phê. PNG/JSON trong `artwork/illustrations/vocab/`; WebP 512 × 512 trong `web/public/assets/illustrations/vocab/`. Dùng trực tiếp mẫu Phố giấy v1; không lấy ảnh sinh nối tiếp làm mẫu phong cách. Nguồn 1254 × 1254 có alpha thật, xuất contain 448 × 448 + padding 32 bằng Sharp có sẵn, quality 82/alphaQuality 100/effort 6.
- Gắn 2 từ Bài 1 và 8 từ Bài 2 vào JSON theo ID hiện có. So với bản chụp trước thay đổi sau khi bỏ các trường ảnh mới: ID, thứ tự, nghĩa và ví dụ giữ nguyên. Tổng giai đoạn này 19 WebP, 17 tham chiếu nội dung; 10 ảnh mới 273.088 bytes, toàn bộ 758.346 bytes. Hash/bytes của 9 pilot giữ nguyên.
- Công cụ xuất [export-vocab.mjs](../../artwork/illustrations/tools/export-vocab.mjs) từ chối ghi đè URL đã tồn tại. Đã thử guard trên `student-v1`, file giữ nguyên. Kiểm pixels alpha, dimensions, hash và sidecar của 19 ảnh đạt. Prompt đầy đủ nhúng trong PNG, không nhúng vào WebP production.
- Hai tab Antigravity CLI, model `gemini-3.8-flash-high`, effort high, full permission được quản lý bằng Orca Run/Task/Dispatch. Image helper của Antigravity thử nghiệm trả JPEG RGB với nền caro giả, không đủ yêu cầu alpha; các ảnh được nhận dùng `image_gen`. Hai worker tiếp tục kiểm ảnh độc lập và nguồn/metadata. Báo cáo: [review ảnh](../../artwork/illustrations/reports/final-assets-review.md), [review metadata](../../artwork/illustrations/reports/metadata-source-review.md). Đã sửa guard alpha để chấp nhận nét màu nước bán trong suốt mà không có pixel hoàn toàn đục.
- Kiểm giai đoạn 19 ảnh: `pnpm check` PASS, `pnpm test` 274/274 PASS, `pnpm build` PASS trên Windows. Browser Chromium session riêng `maipace-assets-1005`, dev server đúng project `web/` tại port 3200: Bài 1–2 ở 390 × 844 và 1440 × 1000 không tràn, ảnh tải đúng; Bài 2 dark + furigana lớn + reduced motion đạt trong phạm vi này.
- Flashcard sinh viên/bác sĩ: mặt trước 0 DOM ảnh/0 request ảnh tương ứng; reveal sinh viên tải được. Bật offline trước reveal bác sĩ: ảnh bị bỏ, nghĩa và nút chấm vẫn dùng được. Chấm hai từ ghi `reviewItems` cho `vocab-01-10`, `vocab-01-14` và 2 `pendingSync` trong IndexedDB session riêng; bật online lại. Đây là lưu trong tab đang mở, chưa kiểm sync Supabase thật hay reload offline.
- Bằng chứng UI: [Bài 1 mobile](../../artwork/illustrations/reports/lesson-01-mobile.png), [desktop](../../artwork/illustrations/reports/lesson-01-desktop.png), [mặt sau sinh viên](../../artwork/illustrations/reports/student-flashcard-mobile.png), [bác sĩ offline](../../artwork/illustrations/reports/doctor-offline-mobile.png), [Bài 2 mobile](../../artwork/illustrations/reports/lesson-02-mobile.png), [desktop](../../artwork/illustrations/reports/lesson-02-desktop.png), [dark](../../artwork/illustrations/reports/lesson-02-dark-mobile.png). Screenshot có metadata nguồn chụp, không coi là ảnh generate.

### Tăng tốc tạo ảnh bằng atlas — cùng ngày 05/10/2026

- Phản hồi hiệu suất từ người dùng dẫn đến tạo 8 đồ vật trong một atlas, cùng mẫu Phố giấy v1: CD, ti vi, radio, laptop, ô tô, sô-cô-la, sổ tay và tạp chí. [Nguồn atlas](../../artwork/illustrations/atlases/everyday-objects-v1.png), [manifest/prompt](../../artwork/illustrations/atlases/everyday-objects-v1.json). Kích thước yêu cầu 2048 × 1024, nguồn thực 1774 × 887; dùng khung crop tường minh theo rãnh alpha, không giả định model trả đúng lưới/kích thước. Cả bốn cạnh của 8 crop có alpha 0; không xóa nét/chroma-key.
- Thời gian gọi tạo nguồn đo được **46.539 ms**, xuất 8 PNG/JSON/WebP + nhúng prompt **30.980 ms**. Nhóm 8 ảnh tạo riêng trước đó khoảng 540 giây theo timestamps làm tròn. Đây là so sánh hai nhóm khác chủ thể trong phiên, chỉ thời gian tạo nguồn; không phải benchmark kiểm soát, không bao gồm thời gian điều phối, sửa script, review, tích hợp hoặc nghiệm thu. Chưa đo chi phí. Không suy thành tốc độ bảo đảm cho mọi loại hình.
- [export-atlas.mjs](../../artwork/illustrations/tools/export-atlas.mjs) dùng Sharp có sẵn, kiểm tọa độ nguyên/nằm trong nguồn, alpha/biên/có nét, nhúng prompt rồi xuất theo khuôn vocab. Chạy lại trên atlas đã xuất bị từ chối trước khi ghi; đã so SHA-256 **24 file PNG/JSON/WebP trước/sau, giữ nguyên**. PNG/crop/provenance ngoài `public`; app tiếp tục tải từng WebP riêng. Nếu một ô lỗi, sửa riêng chủ thể đó thay vì tạo lại cả nhóm. Hướng dẫn tái sử dụng ở [STYLE.md](../../artwork/illustrations/STYLE.md).
- Tích hợp thêm 8 ID Bài 2, sidecar `added-to-learning-data`; tổng **27 WebP / 25 tham chiếu nội dung**. Có 23 ảnh vocab, 1 state và 3 ảnh cảnh/banner/grammar. 8 WebP mới **230.636 bytes**, toàn bộ **988.982 bytes**; các hash/bytes cũ khớp. So với baseline trước lượt mở rộng, bỏ trường ảnh mới thì nội dung/ID/thứ tự Bài 1–2 giữ nguyên.
- Kiểm cuối sau tích hợp atlas: `pnpm check` **PASS**, `pnpm test` **274/274 PASS**, `pnpm build` **PASS**. Sharp giải mã/kiểm dimensions, format, alpha, bytes/hash và dimensions master của **27 ảnh**; 8 crop không cắt nét ở biên. Scan provenance **39 rasters, 0 missing**; **211 liên kết local** trong 5 tài liệu chính tồn tại. `git diff --check` PASS. Giữ cảnh báo Node module type và Next middleware có sẵn; không đổi config ngoài phạm vi.
- Browser Chromium session riêng, `/hoc/2`, 390 × 844 và 1440 × 1000: **21 ảnh vocab tải được**, không tràn ngang. Scroll vào ô sô-cô-la xác nhận lazy image tải; CD/ti vi/radio/laptop/xe hiển thị đúng. [Mobile atlas](../../artwork/illustrations/reports/atlas-lesson-02-mobile.png), [desktop atlas](../../artwork/illustrations/reports/atlas-lesson-02-desktop.png). Kiểm offline/chấm của giai đoạn 10 ảnh ở trên vẫn là phạm vi của renderer dùng lại; không tuyên bố đã chấm riêng toàn bộ 8 từ mới.
- Hai tab Antigravity xử lý xuất file và review độc lập; báo cáo [export](../../artwork/illustrations/reports/atlas-export.md), [review atlas](../../artwork/illustrations/reports/atlas-visual-review.md). Còn giới hạn thiết bị thật, host/CDN, toàn bộ phiên luyện/ôn và Supabase sync như trên. Bước tiếp theo cho nhóm đồ vật đơn giản: tái dùng atlas + mẫu v1, kiểm từng ảnh trước khi gắn dữ liệu; cảnh ngữ pháp/nhân vật cần brief riêng.
- Review độc lập xác nhận **8/8 master crop + WebP PASS** về chủ thể, nét Phố giấy, alpha/crop và không chữ. Cả task export/review đã gửi `worker_done` outcome `succeeded`, coordinator nhận/ack delivery và gọi `worker-release`; terminal ngoài Orca được giữ lại theo `external_terminal`, không còn terminal reclaimable. Các thử nghiệm image-helper thất bại trước đó đã được ghi nhận riêng, không tính thành asset được nhận.

## Assets Bài 8 — 05/10/2026

### Thay đổi và quyết định

- Yêu cầu tiếp tục tạo assets cho Bài 8. Thêm **16 minh họa từ vựng + 1 cover** theo mẫu Phố giấy v1, dùng renderer hiện có; không thay component, CTA, FSRS, sync hay schema Dexie. Có ảnh cho 16/53 mục từ, các mục trừu tượng/hội thoại còn lại giữ chữ; không tuyên bố toàn Bài 8 đã có ảnh.
- ID đã gắn: `ookii`, `chiisai`, `atarashii`, `furui`, `atsui`, `samui`, `tsumetai`, `oishii`, `shiroi`, `kuroi`, `akai`, `aoi`, `sakura`, `yama`, `machi`, `tabemono`. Cover `scenes/adjective-town-v1.webp` gồm thị trấn, hoa anh đào, núi, hai nhân vật theo mẫu. [Bảng nguồn/mapping](../../artwork/illustrations/README.md) liên kết toàn bộ PNG/JSON/WebP.
- Hai atlas [đồ vật/màu](../../artwork/illustrations/atlases/lesson-08-objects-v1.json) và [tính từ](../../artwork/illustrations/atlases/lesson-08-adjectives-v1.json) tạo bằng `image_gen`. Bản đầu có nét giấy rải ở rãnh, không qua điều kiện crop; đã sửa layout bằng công cụ ảnh để thu nhỏ nhóm và bỏ các nét rải ngoài silhouette, rồi mới chọn tọa độ trên rãnh alpha. Nguồn thực **1774 × 887**; không giả định kích thước/lưới từ prompt. Nguồn trước sửa được giữ làm đầu vào có provenance, sidecar giữ prompt gốc/sửa và style references; không chroma-key hoặc tự tẩy pixels trong script.
- `samui` dùng người co ro trong áo ấm; `tsumetai` dùng cốc nước đá có giọt đọng; `furui` dùng đồ vật cũ, không dùng người già. Các màu trắng/đen/đỏ/xanh lam giữ đúng màu dù bảng màu Phố giấy thường dịu. `ookii` dùng vali lớn độc lập, alt đã đổi khớp hình sau lượt sửa làm mất đôi giày chuẩn tỉ lệ; `chiisai` còn giày để so kích thước. Đây là ảnh hỗ trợ cạnh nghĩa chữ, không chấm nghĩa chỉ từ ảnh.
- Vocab WebP **512 × 512**, contain 448 + padding 32, quality 82/alphaQuality 100/effort 6, alpha thật. Cover **800 × 600**, PNG nguồn 1448 × 1086, nền giấy đục. 16 cutout **459.726 bytes**, cover **146.816 bytes**, nhóm Bài 8 **606.542 bytes**. Kho hiện **44 WebP / 42 tham chiếu nội dung**, tổng **1.595.524 bytes**. [Export report](../../artwork/illustrations/reports/lesson-08-export.md): hai lượt xuất mất 29.887 và 30.574 ms, chưa gồm tạo nguồn, sửa layout, điều phối, review và tích hợp.
- Sửa `export-atlas.mjs` để sidecar mới mang `awaiting-learning-data` cho tới khi thực sự gắn JSON. Root sau đó thêm 16 `illustration` và cover, cập nhật trạng thái `added-to-learning-data`; không ghi nhận tích hợp trước khi có dữ liệu thật.

### Kiểm chứng thực chạy

- `pnpm check` **PASS**, `pnpm test` **274/274 PASS**, `pnpm build` **PASS** trong `web/`, Windows, sau tích hợp. Test metadata hiện kiểm **42 tham chiếu** về URL/case/format/kích thước/alt và mapping 16 ID Bài 8 + cover; giữ test của Bài 1–2. Cảnh báo Node module type/Next middleware có sẵn không thuộc lượt này.
- Sharp giải mã/kiểm byte count, SHA-256, dimensions của **44 WebP** và PNG tương ứng. **16/16 crop** có cả bốn biên alpha 0; WebP có nền trong suốt và nét vẽ, padding ngoài trong suốt. Đối chiếu hash snapshot trước lượt này: **27 ảnh cũ giữ nguyên**. Bỏ các trường ảnh mới rồi so baseline: **53/53 mục từ, toàn bộ lesson/grammar cũ giữ nguyên**, kể cả ID/thứ tự/notation/đáp án/ví dụ.
- Browser Chromium session riêng `maipace-lesson8-1005`, dev server đúng project `web/` tại `http://localhost:3200`: `/hoc/8` 390 × 844 và 1440 × 1000, cả **16 ảnh vocab và cover tải được**, không tràn ngang. Dark + furigana scale 1.5 + `prefers-reduced-motion: reduce` ở mobile đạt trong phạm vi này. Cover mobile giữ CTA trong viewport.
- `/hoc/8/tu-vung`: chọn riêng `shiroi`. Mặt trước **0 DOM ảnh / 0 request white-shirt** sau xóa resource timings; reveal tải được hình áo trắng. Tab tới nút lật thẻ có `:focus-visible` và ring 3px. Bật offline sau khi ảnh đã tải rồi chấm Nhớ được: IndexedDB có review `vocab-08-29`, **pendingSync=1**; bật online lại. Đây là lưu trong tab đang mở với ảnh đã tải, không phải kiểm ảnh chưa cache bị lỗi, reload offline hay sync Supabase thật.
- Ảnh chụp: [cover mobile](../../artwork/illustrations/reports/lesson-08-cover-mobile.png), [tính từ desktop](../../artwork/illustrations/reports/lesson-08-adjectives-desktop.png), [dark/furigana lớn mobile](../../artwork/illustrations/reports/lesson-08-adjectives-dark-mobile.png), [flashcard trắng](../../artwork/illustrations/reports/lesson-08-white-flashcard-mobile.png). Có metadata nguồn chụp; không coi screenshot là ảnh generate. Scan nguồn **64 rasters, 0 missing provenance**.
- Hai tab Antigravity đã hoàn thành task export và [review độc lập 17 ảnh](../../artwork/illustrations/reports/lesson-08-visual-review.md). Coordinator phát hiện bảng hash trong báo cáo review ban đầu sai; đã giao lượt sửa báo cáo, kiểm lại **17/17 prefix SHA-256 khớp WebP/sidecar thật**, bỏ quan sát radio ngoài phạm vi. Các lượt export, review và sửa bằng chứng đều gửi `worker_done` outcome `succeeded`; deliveries đã nhận/ack, terminal được release theo cơ chế external-terminal retention.

### Còn lại

- Chưa tạo ảnh cho 37 mục từ còn lại hoặc ảnh grammar riêng Bài 8. Không dùng hình mơ hồ chỉ để phủ đủ mọi từ.
- Chưa nghiệm thu thiết bị/host/CDN thật, toàn bộ phiên luyện/ôn Bài 8, audio import, ảnh chưa cache khi offline hoặc Supabase sync/retry. Giữ giới hạn trước đó; không có service worker/reload offline.
- Nhóm tiếp theo tái sử dụng mẫu v1, PNG/provenance ngoài public, kiểm rãnh trước xuất và tăng version khi thay bytes đã tham chiếu. Không commit/push trong lượt này.

## Bài 2/3/4/8 — 06/10/2026

### Thay đổi và quyết định

- Yêu cầu: hoàn thiện Bài 8, tạo ảnh cho Bài 2/3/4, điều phối agent qua Orca. Run `run_93c71c2537cc`.
- Antigravity (`gemini-3.8-flash-high`) thử lại vẫn trả JPEG nền caro giả, không có alpha (probe trong phiên). Người dùng chọn hướng kết hợp. 6 worker Codex không khởi động được (màn hình duyệt hooks, sau đó Codex hết quota), nên **người dùng tạo 6 atlas trên ChatGPT web** theo prompt có sẵn. Antigravity làm 3 cover và 1 grammar nền đục.
- Orca runtime khởi động lại giữa phiên. 6 worker xử lý atlas mất trước khi có output, 2 worker scene đã ghi xong file/báo cáo nhưng chưa gửi `worker_done`. Coordinator xem lại, đóng 8 task bằng `task-update completed` có ghi lý do, release terminal theo `nextAction`.
- Crop do coordinator tính bằng script: tìm khe có alpha ≥ 8 bằng 0 gần các đường chia 1/4, 1/2, 3/4; bbox chủ thể theo alpha ≥ 8 + lề 16 px; biên crop phải là đường alpha 0 tuyệt đối (đúng điều kiện của `export-atlas.mjs`). Pixel alpha 1–7 nằm ngoài crop bị bỏ theo crop, không sửa pixel nào trong master. **42/48 ô** xuất được. 6 ô dính dải alpha mờ sang ô bên cạnh nên chờ tạo lại riêng ([prompt](../../artwork/illustrations/vocab/CHATGPT-PROMPTS-SINGLES-2026-10-06.md)).
- Gắn 46 tham chiếu mới (42 cutout + 3 cover + 1 grammar có caption ここ/そこ/あそこ). Thêm 2 tham chiếu dùng lại ảnh có sẵn: `kutsu` → `black-shoes-v1`, `kaigi` → `meeting-room-v1`. Tổng **90 WebP / 90 tham chiếu**. Mapping và bytes ở [kho nguồn](../../artwork/illustrations/README.md). Không đổi component, schema, FSRS, sync.
- Sự cố trong phiên: script tạo manifest bị PowerShell ghi lại sai encoding, làm alt tiếng Việt của 18 ảnh (3 atlas) bị mojibake trong manifest, sidecar và dữ liệu. Phát hiện khi kiểm browser. Đã sửa bằng chuyển ngược cp1252→UTF-8 có kiểm tra; grep toàn bộ JSON liên quan không còn chuỗi lỗi, và browser báo 0 alt lỗi.

### Kiểm chứng thực chạy (06/10/2026, Windows)

- `pnpm check` **PASS**; `pnpm test` **274/274 PASS** (sau khi sửa mojibake). Test metadata kiểm **90 tham chiếu** (URL/case/format/kích thước/alt), danh sách ID có ảnh theo đúng thứ tự cho Bài 1/2/3/4/8, cover Bài 2/3/4 và caption ここ/そこ/あそこ.
- So với bản chụp trước tích hợp: bỏ `illustration`/`cover`/`illustrationCaption` thì **7 file** (vocab 2/3/4/8 với 191 mục từ, lessons 2/3/4) giống hệt bản cũ. `git status` không có file tracked nào khác ngoài 7 file dữ liệu và test; ảnh/sidecar cũ không bị đụng.
- `export-atlas.mjs` exit 0 cho 6 atlas (kiểm biên alpha 0, có nét, nhúng prompt). Contact sheet 42 cutout ghép trên nền ngà và nền tối: không viền màu, không chữ/số/logo, đúng nghĩa. 4 scene xem trực tiếp: đạt, đồng hồ trên phố không có số.
- Browser Chromium session `maipace-assets-1006`, dev server đúng project `web/` ở `http://localhost:3100` (title MaiPace). `/hoc/2`, `/3`, `/4`, `/8` ở 390 × 844 và 1440 × 1000: không tràn ngang. Sau khi cuộn đúng container của shell, **87/87 ảnh** (28/21/17/21) tải và decode được; 0 alt mojibake. Lần đo đầu chỉ cuộn `window` nên ảnh lazy cuối trang chưa tải; đó là lỗi của cách đo, không phải lỗi ảnh. Ảnh chụp: [Bài 3 mobile](../../artwork/illustrations/reports/lesson-03-mobile.png), [Bài 4 desktop](../../artwork/illustrations/reports/lesson-04-desktop.png).
- `pnpm build` **PASS** (252 trang static) sau tích hợp.
- Review độc lập: đã giao worker Antigravity (task `task_0178eb778af9`). Worker đã xem ảnh và kiểm kỹ thuật được khoảng 30 phút thì Orca runtime dừng lần thứ hai, trước khi báo cáo được ghi. **Chưa có báo cáo review độc lập**; kiểm tra ở trên là của coordinator. Một cảnh báo chính coordinator ghi nhận: `energetic-person-v1` có chân sau bị khung vignette cắt nhẹ ngay trong atlas gốc, không phải do crop, và vẫn đọc được nghĩa.

### Còn lại

- Chạy lại review độc lập khi Orca ổn định (spec giữ ở task trên).
- Tạo lại 6 cutout (`resutoran`, `ryou`, `shizuka`, `nigiyaka`, `isogashii`, `tanoshii`), xuất bằng `export-vocab.mjs`, gắn dữ liệu, rồi tăng số tham chiếu trong test.
- Chưa kiểm flashcard/offline riêng cho ảnh mới (renderer dùng lại, đã kiểm ở các đợt trước). Chưa nghiệm thu thiết bị/host/CDN thật. Không commit/push.

## Pilot đo workflow tạo ảnh — 06/10/2026

- Mục tiêu: chọn cách tạo ảnh cho workflow tự động. Orca run `run_263f3b04604b`: 1 worker Codex (`gpt-6-luna` low, built-in `image_gen`, gói Plus) và 1 worker Antigravity. Codex qua được màn hình "Hooks need review" sau khi trust 6 hook do người dùng cấu hình (Orca status, impeccable, repowise).
- Kết quả ở [báo cáo pilot](../../artwork/illustrations/reports/pilot-2026-10-06.md): 6 lần gọi tốn khoảng 1% hạn mức 5 giờ (số nguyên, mẫu nhỏ). Atlas 2×2: 4/4 ô dùng được, crop khoảng 590px nên không phải phóng to. Atlas 4×2: 6/8. Ảnh đơn: 4/4 có alpha, 2 ảnh chạm biên. Cover Antigravity có khung viền giấy.
- Thêm [detect-crops.mjs](../../artwork/illustrations/tools/detect-crops.mjs) (chỉ đọc, gán theo thành phần liên thông). Trên 9 atlas cũ cho 66/72 ô đạt, trùng kết quả lịch sử.
- Nguồn mới chưa xuất WebP, chưa gắn dữ liệu, chưa có trong test: 2 atlas Bài 5, 4 ảnh đơn trong `vocab/`, cover `scenes/station-platform-v1.jpg`. Không chạy `pnpm`, vì không đổi code app.
- Tiếp theo: giai đoạn 1 của workflow (batch file, bộ ghép prompt, export có chuẩn hóa kích thước chủ thể và hồ sơ theo nhóm, `source` lấy từ manifest, script gắn dữ liệu, test suy từ sidecar). Làm lại máy bay/tàu thủy, `going-home`, `friends` và cover theo template mới.

## Workflow batch giai đoạn 1 + batch Bài 5 — 06/10/2026

### Thay đổi và quyết định

- [batch.mjs](../../artwork/illustrations/tools/batch.mjs) có các lệnh `prompts`, `check`, `export`, `sheet`, `link`. Batch file trong `artwork/illustrations/batches/` là nguồn sự thật của mỗi đợt; template prompt nằm ở một chỗ trong script. Cách dùng ở [README kho nguồn](../../artwork/illustrations/README.md#workflow-tự-động-theo-batch-từ-06102026).
- [detect-crops.mjs](../../artwork/illustrations/tools/detect-crops.mjs) thành module dùng chung. Xóa `export-atlas.mjs` và `export-vocab.mjs`; bản cũ còn trong git. Không xuất lại asset cũ.
- Chuẩn hóa cutout mới: bbox chủ thể (alpha ≥ 8) vừa khung 416 px trong 512, lề 48. Gate: chặn khi chủ thể chạm mép canvas, phóng to quá 1,3 lần, ảnh nền đục lệch tỷ lệ quá 2% hoặc nhỏ hơn khuôn. Dung lượng chỉ cảnh báo. `source` lấy từ batch; lỗi 42 sidecar ChatGPT web ghi `image_gen` vẫn còn ở các sidecar cũ (chưa sửa).
- `link` ghi JSON học bằng Node, giữ CRLF/LF, từ chối file không đúng định dạng 2 dấu cách và từ chối thay ảnh khác. `illustrations.test.ts` bỏ số 90 và danh sách ID ghi cứng, thay bằng kiểm tra mọi sidecar `added-to-learning-data` vẫn còn tham chiếu.
- Batch [lesson-05](../../artwork/illustrations/batches/lesson-05.json), Orca run `run_263f3b04604b`:
  - Codex `gpt-6-luna` low tạo 4 ảnh đơn thay ảnh hỏng/ô bị skip; Antigravity tạo lại cover full-bleed.
  - Bỏ 3 bản nháp chưa phát hành (`going-home`, `friends` chạm mép; cover có khung).
  - Gắn 16 từ + cover Bài 5. Tổng **107 WebP / 107 tham chiếu**, batch 746.374 bytes.

### Kiểm chứng thực chạy (06/10/2026, Windows)

- `batch.mjs check` cho 17/17 ảnh `ready`. Cảnh báo dung lượng: `bicycle` 69.688 B, `train-station` 56.892 B, `going-home` 63.002 B. Chạy lại `export`/`link` là no-op (trạng thái `exported`, không ghi file).
- `detect-crops` trên 9 atlas cũ cho 66/72 ô đạt, trùng kết quả lịch sử.
- Test hồi quy: bỏ `illustration` của `jisho` thì test fail với "dictionary-v1.json is not linked"; đã khôi phục file và so khớp byte.
- Diff dữ liệu Bài 5 chỉ thêm trường ảnh: vocab +128 dòng, lesson +9/−1, giữ CRLF.
- `pnpm check` **PASS**; `pnpm test` **274/274 PASS**.
- Contact sheet [lesson-05-sheet.png](../../artwork/illustrations/reports/lesson-05-sheet.png) trên nền ngà và nền tối: cùng phong cách và kích thước chủ thể, không chữ/số, không viền sáng; coordinator xem bằng vision.
- Browser `agent-browser`, dev server `web/` ở `localhost:3100` (title MaiPace), `/hoc/5` ở 390 × 844 và 1440 × 1000: **17/17 ảnh** tải và decode được, alt tiếng Việt đúng, không tràn ngang. Ảnh chụp: [mobile](../../artwork/illustrations/reports/lesson-05-mobile.png), [desktop](../../artwork/illustrations/reports/lesson-05-desktop.png).

### Chưa kiểm và bước tiếp theo

- Chưa chạy `pnpm build`, chưa kiểm flashcard Bài 5 (ảnh chỉ hiện sau khi lật thẻ) hoặc chế độ mất mạng; renderer không đổi.
- Người dùng chưa duyệt contact sheet (duyệt lần 2); có thể yêu cầu thay ảnh trước khi commit.
- Ngoài phạm vi: tiêu đề tiếng Nhật dài của Bài 5 xuống dòng giữa 行 và きますか ở desktop/mobile.
- Tiếp theo: đưa 6 cutout lỗi cũ (`restaurant`…`having-fun`) vào một batch; chạy batch cho Bài 6+; cân nhắc sửa `source` của 42 sidecar ChatGPT web.

## Batch Bài 6–10 — 06/10/2026

### Thay đổi và quyết định

- 5 batch [lesson-06](../../artwork/illustrations/batches/lesson-06.json)…[lesson-10](../../artwork/illustrations/batches/lesson-10.json), Orca run `run_a5b3de34c2db`. Kết quả: 121 WebP mới (5.336.054 bytes), cover Bài 6/7/9/10. Batch Bài 8 gồm luôn 6 cutout lỗi cũ (`resutoran`, `ryou`, `shizuka`, `nigiyaka`, `isogashii`, `tanoshii`). Tổng kho **228 WebP / 233 tham chiếu**. Bảng độ phủ ở [README kho nguồn](../../artwork/illustrations/README.md).
- `batch.mjs` thêm hai thứ:
  - Job `reuse`: gắn ảnh có sẵn, dùng cho 5 mục Bài 7.
  - Lệnh `collect`: lấy ảnh Codex từ `~/.codex/generated_images`, khớp theo subject ghi trong rollout.
- Sửa `source` của 42 sidecar ChatGPT web (`image_gen` → `chatgpt-web-image`, thêm `generation` lấy từ manifest atlas). Chỉ đổi JSON trong `artwork`, không đổi bytes ảnh.
- Sự cố khi chạy:
  - 3/5 worker Codex gọi `image_gen` thành công nhưng không tự chép được file: không thấy đường dẫn, hoặc vượt giới hạn command line trên Windows.
  - Worker Bài 10 còn tạo atlas động vật 3 lần.
  - Cách sửa: worker chỉ generate, coordinator chạy `collect`. Ba worker chạy theo spec mới đều đạt. Từ nay dùng spec này.
- Gate đã chặn 4 ảnh, tạo lại thành ảnh đơn cùng stem:
  - `shop`, `garden`: crop lẫn sang ô bên cạnh;
  - `children`: dải alpha mờ;
  - `lively-street`: chạm mép canvas.

  Bản nháp chưa phát hành được chuyển khỏi repo.
- Hạn mức Codex (Plus):
  - Đầu đợt khoảng 28% (5 giờ) / 23% (tuần), cuối đợt 29% / 23%, cho 50 lần gọi `image_gen`. Số nguyên phần trăm, chỉ là ước lượng.
  - Mức 7% → 27% trước đó (02:36–02:47Z) là một phiên Codex riêng của người dùng, không thuộc batch.

### Kiểm chứng thực chạy (06/10/2026, Windows)

- `batch.mjs check`: 121/121 `ready` sau khi tạo lại 4 ảnh. Cảnh báo dung lượng ở một số ảnh cảnh/đồ ăn (tối đa 80.920 B, `garden`).
- Coordinator xem 5 contact sheet [`lesson-06-sheet.png`](../../artwork/illustrations/reports/lesson-06-sheet.png)…`lesson-10-sheet.png` bằng vision trên nền ngà và nền tối: đúng nghĩa, cùng phong cách, không chữ/số, cover tràn viền.
- `pnpm check` **PASS**; `pnpm test` **274/274 PASS**; `pnpm build` **PASS**.
- Browser `agent-browser`, dev server `localhost:3100` (title MaiPace), 390 × 844: `/hoc/6` 35/35, `/hoc/7` 33/33, `/hoc/8` 36/36, `/hoc/9` 17/17, `/hoc/10` 26/26 ảnh tải và decode được; không tràn ngang; 0 alt lỗi font.
- `/hoc/6/tu-vung`, học 10 từ: mặt trước **0 ảnh / 0 request**; lật thẻ `食べる` thì tải `eating-v1` ([ảnh chụp](../../artwork/illustrations/reports/lesson-06-flashcard-mobile.png)).

### Chưa kiểm và bước tiếp theo

- Chưa kiểm desktop cho Bài 6–10, chưa kiểm offline và thiết bị thật. Người dùng chưa duyệt contact sheet. Chưa commit.
- Tiếp theo: Bài 11–25 theo cùng quy trình (lập batch → worker chỉ generate → `collect` → `check` → `export` → `sheet` → duyệt → `link`); grammar illustration cho các mẫu vị trí của Bài 10 (上/下/前/後ろ).

## Batch Bài 10 (ngữ pháp) + Bài 11–15, khởi động Bài 16–25 — 06/10/2026

### Thay đổi và quyết định

- Orca run `run_ee9410ff981b`.
  - Batch [lesson-10-grammar](../../artwork/illustrations/batches/lesson-10-grammar.json): ảnh ngữ pháp vị trí `positions-desk-v1` có caption furigana, gắn vào mẫu `posiciones`.
  - Batch [lesson-11](../../artwork/illustrations/batches/lesson-11.json)…[lesson-15](../../artwork/illustrations/batches/lesson-15.json).
  - Kết quả: **113 WebP mới, 5.521.916 bytes**, đã `link` vào `lessons/lesson-10..15.json` và `vocab/lesson-11..15.json`. Kho hiện có 393 WebP (gồm cả phần Bài 19–25 đã export nhưng chưa link).
- Quyết định của người dùng:
  - Bỏ atlas anh chị em Bài 11.
  - Tạo ảnh mới thay vì dùng lại ảnh gần nghĩa (`yasumimasu` công ty, `omatsuri`, `shokuji-shimasu`, `bijutsu`).
  - Giữ hết động từ Bài 14.
  - Bài 16–25: cắt mục yếu trước khi chạy.
  - Link ngay phần đã đạt.
  - Tạo lại ảnh yếu với subject rõ hơn.
- Ảnh tạo lại thành ảnh đơn cùng stem; subject được viết khác để `collect` không lấy nhầm ảnh cũ:
  - Bài 12, crop lẫn sang ô bên cạnh: các ô atlas đồ ăn Nhật, `rain`, `cloudy`.
  - Bài 12, chạm mép: `crowd`.
  - Bài 12, sai nghĩa: `cloudy` có mưa; `weather` trông như clip-art.
  - Bài 14: `passport`; `entering-cafe`/`leaving-cafe` quá giống nhau (bản mới: một ảnh quay lưng, một ảnh quay mặt); `parking-car`.
  - Bài 15: `city-hall` chạm mép, `high-school`.

  Bản nháp chưa phát hành nằm ở `D:\tmp\illustration-drafts-2026-10-06\`, ngoài repo.
- Antigravity hết quota (429), nên cover `lunch-diner` (Bài 13) và mọi cover Bài 16–25 chuyển sang Codex.
- Bài 16–25:
  - 10 batch đã lập, 128 lượt gọi.
  - Mục đã cắt: `kengaku-shimasu`, `motte-ikimasu`/`motte-kimasu`, ô `kinen`, `kiotsukemasu`, `koshou`, `sawarimasu`, `ganbarimasu`.
  - Mục trùng chuyển sang `reuse`: `naoshimasu` → `repairing-bicycle-v1` (Bài 20), `kangaemasu` → `thinking-v1` (Bài 21). Phải link Bài 20/21 trước Bài 24/25.
  - Đổi subject: `taking-shower` (bị bộ lọc an toàn chặn 2 lần) thành góc tắm không người; `moving-house` (chạm mép) thêm yêu cầu bố cục gọn.
- Công cụ tạo ảnh Codex hết hạn mức riêng: HTTP 429 `usage_limit_reached`, reset **2026-10-07 02:05Z**. Hạn mức chat vẫn còn: 3% (5 giờ) / 24% (tuần).
- Sự cố Orca:
  - Một worker thoát sau 2 lượt gọi.
  - Một worker báo `worker_done` bằng handle của coordinator nên bị từ chối.
  - Một dispatch tái dùng terminal bị kẹt ở bước dán prompt (`[Pasted Content]` chưa submit).
  - Cách xử lý: `worker-abandon`, rồi `worker-start --retry-of` trên terminal mới. Ưu tiên terminal mới hơn tái dùng terminal.

### Kiểm chứng thực chạy (06/10/2026, Windows)

- `batch.mjs check`:
  - Bài 10–15: toàn bộ `ready` sau khi tạo lại.
  - Bài 19/20/22/25: toàn bộ `ready`.
  - Bài 24: 12/13 `ready` (`moving-house` chờ tạo lại).
  - Cảnh báo dung lượng ở một số ảnh, ví dụ `weather` 87.210 B.
- Coordinator xem contact sheet bằng vision: Bài 10-grammar, 11–15 (12/14/15 làm lại sau khi tạo lại ảnh), 19, 20, 22, 24, 25. Đúng nghĩa, cùng phong cách, cover tỉ lệ 4:3.
- `pnpm check` **PASS**; `pnpm test` **261/261 PASS**.
- Browser `agent-browser`, dev server `localhost:3000` (title MaiPace), 390 × 844:
  - `/hoc/10` 27/27, `/hoc/11` 16/16, `/hoc/12` 36/36, `/hoc/13` 21/21, `/hoc/14` 27/27, `/hoc/15` 13/13 ảnh tải được.
  - 0 ảnh thiếu alt, không tràn ngang.
  - Lưu ý: script `scroll` dài làm CDP timeout. Thay bằng đặt `loading=eager` rồi đếm.

### Chưa kiểm và bước tiếp theo

- Chưa kiểm desktop, flashcard và offline cho Bài 11–15. Chưa chạy `pnpm build`. Người dùng chưa duyệt contact sheet Bài 16–25. Chưa commit.
- Bài 19/20/22/24/25: người dùng duyệt, **đã link 55 tham chiếu** (06/10/2026).
  - Còn thiếu `moving-house` (Bài 24) và reuse `kangaemasu` → `thinking-v1` (Bài 25, chờ Bài 21 có ảnh).
  - `pnpm check` PASS, `pnpm test` 261/261.
  - Browser 390 × 844: `/hoc/19` 12/12, `/hoc/20` 6/6, `/hoc/22` 19/19, `/hoc/24` 13/13, `/hoc/25` 5/5; 0 thiếu alt, không tràn ngang.
- Còn phải tạo sau khi quota reset:
  - Bài 16: 14 mục;
  - Bài 17: 13;
  - Bài 18: 9;
  - Bài 21: 5;
  - Bài 23: 7, gồm cover `bridge-v1`;
  - Bài 24: `moving-house`.

  File `.prompts.md` đã sinh lại, chỉ chứa mục còn thiếu. Sau đó làm tiếp: `collect` → `check` → `export` → `sheet` → duyệt → `link`, rồi kiểm tra trình duyệt `/hoc/16`–`/hoc/25`.

## Bàn giao phiên 07/10/2026 — tạo nốt ảnh Bài 16–25

Trạng thái: đã link Bài 10–15, 19, 20, 22, 24, 25. Bài 16, 17, 18, 21, 23 còn thiếu ảnh.

Chờ đến khi hạn mức `image_gen` của Codex reset lúc **2026-10-07 02:05Z (09:05 giờ VN)**.

### Việc còn thiếu

File `.prompts.md` đã sinh lại và chỉ chứa mục chưa có ảnh:

| Batch | Số mục | Ghi chú |
| --- | --- | --- |
| [lesson-16](../../artwork/illustrations/batches/lesson-16.json) | 14 | `taking-shower-v1` đã đổi subject (góc tắm không người) |
| [lesson-17](../../artwork/illustrations/batches/lesson-17.json) | 13 | |
| [lesson-18](../../artwork/illustrations/batches/lesson-18.json) | 9 | |
| [lesson-21](../../artwork/illustrations/batches/lesson-21.json) | 5 | Có `thinking-v1`, nguồn reuse cho `kangaemasu` Bài 25 |
| [lesson-23](../../artwork/illustrations/batches/lesson-23.json) | 7 | Gồm cover `bridge-v1` |
| [lesson-24](../../artwork/illustrations/batches/lesson-24.json) | 1 | `moving-house-v1`, đã thêm yêu cầu bố cục gọn |

Tổng **49 lượt gọi**. Hạn mức ảnh khoảng 100–120 lượt/ngày (Plus), nên chạy hết trong một đợt được.

Ảnh master đã `collect` nhưng chưa export của Bài 16, 17, 18, 21, 23 đã nằm sẵn trong `artwork/illustrations/`. `collect` không ghi đè các file này.

### Prompt giao việc

```text
Làm việc trên MaiPace theo quy ước chung của repo.
Mục tiêu: tạo nốt ảnh SPEC-21 cho Bài 16, 17, 18, 21, 23 và moving-house-v1 (Bài 24), rồi link toàn bộ Bài 16–25.
Chế độ: triển khai.
Phạm vi: artwork/illustrations/, web/public/assets/illustrations/, web/src/data/n5/{lessons,vocab}/lesson-16..25.json, docs SPEC-21. Không sửa code app.
Tiêu chí xong:
- `batch.mjs check` ready cho mọi job không skip của Bài 16–25.
- Contact sheet được xem bằng vision và người dùng duyệt.
- `link` xong. Link Bài 21 trước, rồi link reuse `thinking-v1` của Bài 25 (`link lesson-25.json thinking-v1`).
- `pnpm check` và `pnpm test` PASS.
- Browser localhost:3000 (title MaiPace), 390×844, `/hoc/16`–`/hoc/25`: ảnh tải đủ, 0 thiếu alt, không tràn ngang.
Bàn giao trước: docs/handoff/SPEC-21.md, mục "Batch Bài 10 (ngữ pháp) + Bài 11–15" và mục này.
```

### Quy trình đã kiểm chứng

Chạy từ root với `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON artwork/illustrations/tools/batch.mjs <lệnh> <batch.json> [stem…]`.

1. Codex worker qua Orca (`worker-start --agent codex --model gpt-6-luna --effort low --worktree current`), luôn mở **terminal mới**.
   - Spec ghi rõ: "GENERATE-ONLY, không ghi file". Mỗi section gọi một lần `image_gen`, dùng nguyên văn khối `text`, đính kèm `reference/paper-town-style-v1.png`.
   - Gặp 429 hai lần thì dừng và báo kèm thời điểm reset.
2. `collect` → `check`. Ảnh lỗi gate (lẫn ô, chạm mép) xử lý như sau:
   - Chuyển bản nháp ra `D:\tmp\illustration-drafts-2026-10-06\`.
   - Ảnh atlas lỗi: đánh `skip` ô đó và thêm ảnh đơn cùng stem, subject viết khác đi. Ảnh đơn lỗi: chỉ sửa subject.
   - **Sau đó** mới chạy `prompts`.
3. `export`: truyền danh sách stem khi còn ảnh lỗi. Tiếp theo `sheet` → xem bằng vision → người dùng duyệt → `link`.
4. Cover phải đúng tỉ lệ 4:3. Nếu Codex trả 3:2, thêm `crop`.

### Bẫy đã gặp

- Dispatch tái dùng terminal có thể kẹt ở `[Pasted Content]`. Xem bằng `orca terminal read`, xử lý bằng `worker-abandon` rồi `worker-start --retry-of` trên terminal mới.
- Worker phải gửi `worker_done` bằng handle của chính nó. Gửi bằng handle coordinator sẽ bị từ chối.
- `agent-browser`: không scroll async dài trong `eval` vì CDP sẽ timeout. Đặt `loading=eager`, chờ, rồi mới đếm. Daemon treo thì `taskkill //F //IM agent-browser.exe`.
- Antigravity hết quota. Nếu dùng lại thì chỉ cho cảnh opaque (JPG), không dùng cho cutout.
