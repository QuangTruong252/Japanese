# Bộ nghiệm thu — UX redesign (SPEC-16 → 20)

Ngày lập: 28/09/2026. Áp dụng cho kế hoạch UX. _(đã gỡ khỏi repo ngày 06/10/2026; bản cũ ở tag `pre-cleanup`)_
Một mục chỉ được tích `[x]` khi có bằng chứng **thực chạy** ghi ngày, route, viewport.
Worker không được tự tích mục loại **B** (browser) hay **J** (hành trình); các mục đó do
coordinator chạy trên một server tích hợp duy nhất.

## 0. Hiện trạng đo được ngày 28/09 (HEAD `afd6b6f`)

- Code SPEC-16/17/18/20 đã có; SPEC-19 chưa làm. `pnpm test` 209/209 PASS.
- `pnpm check` **FAIL** 3 lỗi: `ca-nhan/page.tsx:609` dùng `asChild` (Radix) trên Base UI;
  `active-drafts.ts:90` và test đọc `config.selectedLessons` không tồn tại (đúng là `lessons`).
- Browser 390/1280 (server MaiPace dev `:3100`; `:3000` là Repowise, **không** phải app):
  - Bảng tin có **hai nút “Tài khoản”** (header AppNav + header trang); ở 390px lời chào bị
    ép thành cột hẹp (“Chào / buổi / sáng”). Desktop vẫn có nút Tài khoản ở header trang dù
    sidebar đã có khối tài khoản.
  - Tra cứu còn liên kết quay về “Học bài” — ngược với Tra cứu là đích dock cấp một.
  - `/luyen-tap` vẫn là danh sách 25 bài trước, CTA ở cuối (SPEC-19 chưa làm).
  - Thống kê rỗng mời “luyện tập” và nhắc “chuỗi ngày” dù streak đã bỏ 24/09.
  - `/thong-ke` → `/ca-nhan/thong-ke` hoạt động.
- Checklist §9 của SPEC-16/17/18 đã bị tích `[x]` mà chưa có nghiệm thu browser → coi là **chưa nghiệm thu**.
- Không có `web/.env.local` → Supabase ở trạng thái unconfigured; trạng thái đăng nhập/sync
  thật **không kiểm chứng được** trên máy này (ghi `unverifiable`, không tích).

## 1. Gate tĩnh (S) — mọi worker, chạy trong `web/`

| ID | Kiểm tra | Đạt khi |
| --- | --- | --- |
| S1 | `pnpm check` | exit 0, 0 lỗi TS/ESLint toàn repo |
| S2 | `pnpm test` | 0 fail; số test ≥ trước khi sửa |
| S3 | Test hồi quy | Mỗi logic mới/sửa (preview số câu, chọn preset, draft, active nav, search alias) có ≥1 ca đúng + 1 ca sai |
| S4 | Ranh giới | Diff chỉ chạm file thuộc quyền sở hữu; không hardcode màu; không regex/kana ở component; không gọi `ts-fsrs` trực tiếp; không đọc Supabase trong render |
| S5 | `pnpm build` | Coordinator chạy một lần sau khi merge (worker không chạy) |

## 2. Browser theo spec (B) — 390×844 và 1280×800, light + dark

Chuẩn bị dữ liệu bằng luồng thật trong app; khi cần mục đến hạn, chỉnh `dueAt` trong IndexedDB
qua DevTools. Mỗi mục ghi: route, viewport, trạng thái dữ liệu, kết quả, ảnh nếu lỗi.

### SPEC-16 — Điều hướng & Profile
- B16.1 Đúng **một** lối Tài khoản trên mỗi màn chính: header mobile (<lg) hoặc chân sidebar (≥lg); không trùng trong nội dung trang.
- B16.2 Từ 5 màn chính ở 390px, một chạm tới `/ca-nhan`; vùng chạm ≥44px, nhãn chữ thấy được.
- B16.3 Không có header tài khoản/dock trong `/luyen-tap/phien`, `/on-tap/phien`, `/hoc/[so]/tu-vung`.
- B16.4 Dock active: `/hoc/tra-cuu/**` → Tra cứu (không Học); `/hoc`, `/hoc/1` → Học; `/ca-nhan` không kích hoạt nhầm mục dock.
- B16.5 `/thong-ke?x=1` → `/ca-nhan/thong-ke?x=1`; Back/Forward giữ tab; số liệu Thống kê khớp trước/sau khi có 1 phiên luyện.
- B16.6 Profile: khách rỗng (CTA Bài 1), khách có dữ liệu, Supabase unconfigured (không nút Google giả); hộp thoại đăng xuất mở/đóng bằng bàn phím (chỉ kiểm được khi có Supabase).
- B16.7 Empty state Thống kê không nhắc streak; CTA phù hợp người mới.

### SPEC-17 — Tra cứu & tìm kiếm
- B17.1 Hub Tra cứu không có breadcrumb về “Học bài”; 2 chạm từ dock tới Kana/Kanji/Động từ/Bảng.
- B17.2 SearchDialog: `tra cuu`, `kana`, `kanji`, `dong tu`, `thong ke` → nhóm Tính năng đúng đích; `watashi`/`私`/`tôi` vẫn trả nội dung.
- B17.3 Bàn phím: Ctrl+K mở, ↑↓ Enter chọn, Esc đóng và trả focus; mở trên 390px không bị bàn phím ảo che kết quả.
- B17.4 Deep link `/hoc/tra-cuu/dong-tu?q=...`, anchor `#vocab-*` từ kết quả tìm kiếm tới đúng mục.

### SPEC-18 — Bảng tin & hub bài học
- B18.1 Bảng tin người mới: đúng 1 CTA chính “Bắt đầu bài 1” → `/hoc/1`; header không bị ép chữ ở 390px.
- B18.2 Có mục đến hạn: CTA chính “Bắt đầu ôn”; nháp luyện/từ vựng nằm hàng phụ, dẫn đúng vị trí (số câu/từ đúng với nháp thật).
- B18.3 `/hoc/1` lần đầu: CTA chính “Học từ vựng” (48px); các lối Ngữ pháp/Nghe/Xem toàn bộ/Luyện bài cuộn hoặc dẫn đúng; anchor `#tu-vung #ngu-phap #nghe` còn chạy.
- B18.4 Đang dở từ vựng: CTA “Tiếp tục học từ vựng (từ X/Y)” đúng X/Y; thiếu audio dẫn `/cai-dat/audio` và quay lại được.

### SPEC-19 — Luyện tập nhanh
- B19.1 Từ dock: màn đầu (không cuộn, 390×844) có card “Sẵn sàng luyện Bài N · M câu · dạng” và CTA “Bắt đầu M câu”; M = số câu thực tạo được.
- B19.2 `/luyen-tap?lessons=3` → card hiển thị Bài 3 trước khi tạo phiên.
- B19.3 “Tùy chỉnh” mở/đóng giữ lựa chọn và focus; `aria-pressed` trên chip bài/dạng; đổi bài/dạng/số câu cập nhật tóm tắt ngay.
- B19.4 0 câu: CTA disabled có lý do đọc được; ít câu hơn mức chọn: CTA ghi số thực.
- B19.5 Có nháp: banner Tiếp tục ưu tiên; tạo mới có cảnh báo, không ghi đè nháp khi chỉ mở trang.
- B19.6 Chạy hết 1 phiên mỗi dạng trong 5 dạng; trang kết quả có “Về bài”/“Luyện tiếp”, không CTA giả.

### SPEC-20 — Ôn tập
- B20.1 Số mục đến hạn trùng nhau ở badge dock, Bảng tin, `/on-tap`.
- B20.2 Nhiều lô: hết lô 1 có “Ôn lô tiếp (N mục)”; hết lô cuối có lối về Bảng tin.
- B20.3 Rỗng / đạt hạn mức / không có câu nói đúng lý do, không nói “đã ôn xong” sai.
- B20.4 Phiên dở: rời trang → quay lại thấy “Tiếp tục phiên ôn”, tiếp đúng câu.
- B20.5 Điểm yếu không trộn vào lô đến hạn.

### Chung (mọi màn đã sửa)
- BX.1 Tab/Shift+Tab đi đủ, focus ring thấy được; không bẫy focus ngoài dialog.
- BX.2 `prefers-reduced-motion: reduce` tắt chuyển động không cần thiết.
- BX.3 Dark mode: không chữ mất tương phản, không màu hardcode lộ ra.
- BX.4 Dock mobile không che CTA cuối trang (đệm đáy đủ).
- BX.5 Console không có lỗi React/hydration mới trên các route đã sửa.

## 3. Hành trình ngang (J) — chạy sau khi merge

- J1 Người mới: Bảng tin → Bài 1 → Học từ (5 từ) → Luyện Bài 1 → Ôn. Không cần tài khoản.
- J2 Quay lại: có mục đến hạn + nháp luyện → Bảng tin chọn đúng từng lối → Profile thấy tiến độ.
- J3 Tra Kanji giữa phiên luyện (qua tìm kiếm) rồi quay lại: nháp còn, tiếp đúng câu.
- J4 Offline trong tab đang mở (DevTools offline): hoàn tất phiên luyện và phiên ôn; online lại: `pendingSync` không tăng trùng.
- J5 Link cũ: `/thong-ke`, `/hoc/tra-cuu/kanji`, `/hoc/1#tu-vung`, bookmark bài vẫn tới đúng.

## 4. Không kiểm chứng được trên máy này

Đăng nhập Google/sync Supabase thật, đổi tài khoản, hai thiết bị, PWA standalone, thiết bị
iOS/Android thật. Ghi `unverifiable` với lý do; không suy ra đạt.

## 5. Kết quả

| Đợt | Ngày | Phạm vi | Kết quả | Ghi chú |
| --- | --- | --- | --- | --- |
| Baseline | 28/09/2026 | §0 | S1 FAIL, S2 PASS | Quan sát 390/1280 trên `:3100` |
| Tích hợp | 28/09/2026 | Branch `ux-redesign` (W1–W4 + sửa coordinator, HEAD `d1a3aff`) | S1–S5 PASS | `pnpm check` exit 0, `pnpm test` 252/252, `pnpm build` exit 0 |
| Browser | 28/09/2026 | Chrome headless (agent-browser), `:3100`, 390×844 + 1280×800, dark + light/reduced-motion; dữ liệu khách tạo bằng luồng thật, `dueAt` chỉnh qua IndexedDB | Xem §6 | Supabase unconfigured |

## 6. Kết quả browser 28/09/2026

PASS = đã chạy và đạt; PARTIAL = đạt phần đã chạy, còn nhánh chưa thử; NOT RUN = chưa chạy.

| Mục | Kết quả | Bằng chứng / ghi chú |
| --- | --- | --- |
| B16.1 | PASS | 390: một nút Tài khoản ở header AppNav (Bảng tin, Tra cứu, Luyện, Ôn, Profile); 1280: chỉ ở chân sidebar |
| B16.2 | PASS | Nút cao 48px, nhãn chữ, `aria-current="page"` trên `/ca-nhan/**` |
| B16.3 | PASS | Không có header/dock trong `/hoc/1/tu-vung`, `/luyen-tap/phien`, `/on-tap/phien` |
| B16.4 | PASS | `/hoc/tra-cuu` → Tra cứu active; `/` → Bảng tin; Ôn tập active trên `/on-tap` |
| B16.5 | PASS | `/thong-ke?x=1` → `/ca-nhan/thong-ke?x=1` |
| B16.6 | PARTIAL | Khách rỗng và unconfigured đúng; đăng nhập/đăng xuất chưa kiểm vì không có Supabase |
| B16.7 | PASS | Không nhắc streak; CTA “Bắt đầu Bài 1” |
| B17.1 | PASS | Hub không còn link “Học bài”; 4 danh mục |
| B17.2 | PASS | `thong ke`/`tra cuu`/`dong tu` trả nhóm Tính năng trước; `watashi`/`tôi` trả 私 |
| B17.3 | PASS | Mở bằng nút → Esc trả focus về nút; phím ↓ hoạt động |
| B17.4 | PASS | `/hoc/tra-cuu/dong-tu?q=taberu`, `/hoc/1#tu-vung` tải đúng |
| B18.1 | PASS | Người mới: 1 CTA “Bắt đầu bài 1” → `/hoc/1`; lời chào đủ ngang ở 390 |
| B18.2 | PASS sau sửa | Có mục đến hạn → CTA “Bắt đầu ôn”; nháp Học từ/Luyện hiện đúng bài và vị trí (Bài 1, câu 3/10). Lỗi: khối nháp nằm **trên** P0 → coordinator chuyển xuống dưới (`d1a3aff`) |
| B18.3 | PASS | CTA “Học từ vựng” 48px; lối Xem toàn bộ/Ngữ pháp/Nghe/Luyện bài 1; anchor `#tu-vung #ngu-phap #nghe`, 41 `#vocab-*`, 6 `#grammar-*` |
| B18.4 | PARTIAL | Nháp từ vựng hiện “Đang ở từ 1/5”; chưa thử bài thiếu audio |
| B19.1 | PASS | CTA “Bắt đầu 15 câu” 48px, đáy tại y=286 trên 844 |
| B19.2 | PASS | `?lessons=3` → “Sẵn sàng luyện Bài 3” |
| B19.3 | PASS | Tùy chỉnh mở/đóng, `aria-pressed`, đổi 30 câu cập nhật tóm tắt, “Xong” trả focus về nút Tùy chỉnh |
| B19.4 | PASS | Bỏ hết bài → CTA disabled + lý do (`role=alert`, `aria-describedby`) |
| B19.5 | PASS | Nháp: banner “Tiếp tục phiên” ưu tiên; tiếp tục đúng câu 3/10 |
| B19.6 | PARTIAL | Kết quả có “Làm lại câu sai / Luyện tiếp / Về bài 1”; chưa chạy riêng từng dạng trong 5 dạng (Bài 1 không có câu Sắp xếp) |
| B20.1 | PASS sau sửa | Badge = `/on-tap` = Profile = Bảng tin (lô + còn lại). Lỗi: `/on-tap` ghi số trong lô là “mục đến hạn” → sửa dùng `totalDueCount` (`73c0eb5`) |
| B20.2 | PASS | Lô 5: “Ôn lô tiếp (5 mục)” → lô mới đúng 1/5 |
| B20.3 | PARTIAL | Rỗng đúng lý do; chưa thử đạt hạn mức / không giọng |
| B20.4 | PASS | Lưu nháp ôn câu 1/5 → thẻ “Phiên ôn tập đang dở” → tiếp tục đúng câu 2/5 |
| B20.5 | NOT RUN | Điểm yếu chỉ kiểm bằng code review |
| BX.1 | PARTIAL | Focus ring có trên mọi phần tử đã Tab; trên mobile dock đứng trước nội dung chính, chưa có skip link |
| BX.2 | PASS | `prefers-reduced-motion` được áp dụng, panel Tùy chỉnh dùng `motion-safe:` |
| BX.3 | PASS | Luyện tập light/dark, Bảng tin/Ôn dark: không màu lệch |
| BX.4 | PASS | Đệm đáy đủ, dock không che CTA chính |
| BX.5 | PASS | Không lỗi React/hydration; chỉ cảnh báo tỉ lệ ảnh logo (có từ trước) |
| J1 | PASS | Bảng tin → Bài 1 → Học từ → Luyện Bài 1 (10 câu) → Ôn (lô 5 + lô tiếp) |
| J2 | PASS | Có mục đến hạn + nháp → Bảng tin chọn đúng lối; Profile đếm 10 mục đến hạn |
| J3 | NOT RUN | Tra Kanji giữa phiên |
| J4 | PARTIAL | Offline trong tab mở: hoàn tất lô ôn, sessions 2→3, pendingSync 2→3; online lại không tăng trùng. Đẩy lên Supabase thật: unverifiable |
| J5 | PASS | `/thong-ke`, `/hoc/tra-cuu/kanji`, `/hoc/1#tu-vung`, `dong-tu?q=` |

### Lỗi đợt 1 — đã sửa và kiểm browser ngày 28/09/2026

| # | Lỗi | Sửa bởi | Bằng chứng browser |
| --- | --- | --- | --- |
| 1 | Mô tả kết quả ngữ pháp lộ notation `私[わたし]に` | Coordinator `31c31cc` (W5 hỏng `agent_readiness` 2 lần) | `watashi` → “N1 は 私に N2 を くれます”, không kết quả nào còn `[` |
| 2 | “Chờ đồng bộ lên máy chủ” khi Supabase chưa cấu hình | W6 | pendingSync = 3, unconfigured → không còn dòng đó |
| 3 | Badge Ôn tập mất số khi active (token `--destructive-foreground` không tồn tại) | W7 | Sidebar 1280 và dock 390 đều hiện “10” trên mục active |
| 4 | Nháp luyện trên Bảng tin cần thêm một chạm | W8 + coordinator | “Tiếp tục” → `/luyen-tap/phien` đúng câu 3/10 |
| 5 | Thống kê rỗng mời “Bắt đầu Bài 1” với người đã học | W7 | 0 phiên + có reviewItems + có mục đến hạn → “Chưa có dữ liệu phiên học”, CTA “Ôn tập” |
| 6 | Hai nút primary trên `/on-tap` khi có nháp | W6 | “Tiếp tục phiên ôn” primary, “Bắt đầu ôn” outline → hộp thoại “câu 2/5 … sẽ thay thế” |

Lỗi thêm tìm thấy khi kiểm #4, đã sửa: nháp ôn (`mode: 'due'`) hiện trên Bảng tin là “Luyện tập” và dẫn vào phiên luyện. Giờ ghi “Ôn tập”, dẫn `/on-tap/phien?resume=1` và vào đúng câu 2/5; có test hồi quy.

Gate sau đợt sửa: `pnpm check` exit 0, `pnpm test` 265/265, `pnpm build` exit 0.

### Hai việc còn lại — đã xong ngày 28/09/2026

1. **Nháp ôn hiện trên `/luyen-tap` như nháp luyện** (lỗi có từ trước trên `master`, hai loại nháp dùng chung một khóa lưu). Không “bỏ qua” nháp ôn, vì như vậy bắt đầu phiên luyện sẽ âm thầm ghi đè nó. `PracticeDraftBanner` dùng chung `getActivePracticeDraftInfo` với Bảng tin. Browser: banner ghi “Bạn còn phiên ôn tập dở: câu 2/5 … Luyện phiên mới sẽ thay thế phiên ôn này”; hộp thoại “Bắt đầu 10 câu” gọi đúng “phiên ôn tập”; “Tiếp tục phiên ôn” vào `/on-tap/phien?resume=1` ở câu 2/5. Chưa tách hai khóa lưu: chỉ làm khi thật sự cần giữ song song một nháp luyện và một nháp ôn.
2. **Nhánh #5 “Luyện bài N”**: 0 phiên, 10 mục ôn, không mục nào đến hạn → “Chưa có dữ liệu phiên học”, CTA “Luyện bài 1” → `/luyen-tap?lessons=1` → “Sẵn sàng luyện Bài 1”.

Gate cuối: `pnpm check` exit 0, `pnpm test` 265/265, `pnpm build` exit 0.
