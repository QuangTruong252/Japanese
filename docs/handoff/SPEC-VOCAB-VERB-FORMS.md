# Handoff — Bổ sung Động từ Thể từ điển & Ưu tiên Học Thể nguyên mẫu

Ngày: 25/09/2026. Trạng thái: Đã có code & đã nghiệm thu trình duyệt.  
Tài liệu thiết kế: [2026-09-25-dictionary-form-verbs-design.md](../superpowers/specs/2026-09-25-dictionary-form-verbs-design.md)  
Kế hoạch thực thi: [2026-09-25-dictionary-form-verbs.md](../superpowers/plans/2026-09-25-dictionary-form-verbs.md)

---

## 1. Thay đổi và Quyết định

- **Hợp đồng dữ liệu & Schema:**
  - Mở rộng `VocabWord` trong `web/src/types/index.ts`: bổ sung `verbGroup?: 1 | 2 | 3` và `verbForms?: VerbForms` (gồm 5 thể: `dictionary`, `masu`, `te`, `nai`, `ta` cùng các biến thể kana).
  - Giữ nguyên `id` gốc của từ vựng (ví dụ `"kirimasu"`, `"tabemasu"`) để bảo vệ 100% lịch sử ôn tập FSRS trong Dexie DB (`reviewItems`) không bị mồ côi.
- **Chuẩn hóa dữ liệu:**
  - Chạy `scripts/enrich-vocab-verbs.mjs` chuẩn hóa toàn bộ 157 động từ trong 25 bài học N5 (`web/src/data/n5/vocab/lesson-*.json`): `word` và `kana` chuyển sang thể từ điển làm từ vựng chính, bổ sung `verbForms` và `verbGroup`.
- **Giao diện bài học (`/hoc/[so]`):**
  - Bảng từ vựng hiển thị nổi bật thể từ điển kèm furigana (`切[き]る`), huy hiệu nhóm động từ (`Nhóm 1`, `Nhóm 2`, `Nhóm 3`), dòng phụ thể masu `Thể masu: 切ります`, nút phát âm thể từ điển.
- **Flashcard từ vựng (`/hoc/[so]/tu-vung`):**
  - Mặt trước: Hiển thị thể từ điển to rõ + badge nhận diện nhóm (`Động từ Nhóm 1`).
  - Mặt sau: Hiển thị nghĩa tiếng Việt + **Khối tóm tắt 4 thể chia** (Masu, Te, Nai, Ta) + câu ví dụ khớp chính xác.
  - Danh sách chuẩn bị học: Hiển thị thể từ điển kèm `(Masu: ...)` phụ để đối chiếu bài giảng Minna.
  - Hàm `findExampleForWord`: Dò từ trong câu ví dụ theo tất cả các thể trong `verbForms`, đảm bảo 100% động từ liên kết đúng câu ví dụ.
- **Luyện tập (`questions.ts`, `distractors.ts`):**
  - Câu hỏi MC Reading và MC Meaning tự động hỏi và kiểm tra thể từ điển; distractor pool chấm điểm ưu tiên ứng viên cùng loại từ và okurigana đuôi thể từ điển (đuôi `る`, `く`, `う`...).
- **Tìm kiếm toàn cục (`search.ts`):**
  - Index cả thể từ điển và thể masu. Gõ `kiru`, `kirimasu`, `きります`, `cắt` đều tìm ra từ vựng và neo chính xác tới vị trí trong bài.

---

## 2. Kiểm chứng

1. **Static Verification:**
   - `pnpm check` (TypeScript + ESLint): **PASS** 100% (0 errors, 0 warnings).
2. **Unit & Regression Tests:**
   - `pnpm test` (node:test): **149/149 tests PASS** (thêm test suite kiểm tra toàn bộ 157 động từ N5, test hiển thị bài 7, test sinh câu hỏi trắc nghiệm thể từ điển, test tìm kiếm thể từ điển & masu).
3. **Production Build:**
   - `pnpm build`: **PASS** — Turbopack biên dịch thành công, pre-render 249/249 static pages (bao gồm 25 bài học và 25 màn flashcard từ vựng).
4. **Browser Verification (Browser Subagent — 25/09/2026):**
   - Đã kiểm tra trực quan trên `http://localhost:3000/hoc/7`:
     - Bảng từ vựng: `切[き]る` hiển thị to rõ kèm badge `Nhóm 1` và dòng phụ `Thể masu: 切ります`.
     - Chuyển sang `/hoc/7/tu-vung`: Danh sách chọn từ hiển thị `(Masu: 切ります)`.
     - Vào phiên học Flashcard: Mặt trước hiện `Động từ Nhóm 1` và `切る`. Lật thẻ mặt sau hiển thị nghĩa `cắt`, khối 4 thể chia (Masu: 切ります, Te: 切って, Nai: 切らない, Ta: 切った) và câu ví dụ minh họa `はさみで 紙[かみ]を 切[き]ります。`.
     - Hộp tìm kiếm `Ctrl+K`: Gõ `kiru` ra `切る`; gõ `kirimasu` cũng ra `切る` với sublabel `cắt · Masu: 切ります`.

---

## 3. Còn lại và Bước tiếp theo

- Cấu trúc `verbForms` hiện tại đã sẵn sàng để tái sử dụng trực tiếp khi xây dựng tính năng luyện chia thể (conjugation drills) hoặc các dạng bài tập ngữ pháp chuyên sâu cho thể `て`, thể `ない`, thể `た` trong các phase tiếp theo.
- Tiếp tục lộ trình: nghiệm thu SPEC-03 và kiểm tra đồng bộ Supabase thật (SPEC-08).
