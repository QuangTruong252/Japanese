# Bộ nghiệm thu — UX redesign (SPEC-16 → 20)

Ngày lập: 28/09/2026. Áp dụng cho [kế hoạch UX](../plans/2026-09-27-ux-redesign.md).
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
