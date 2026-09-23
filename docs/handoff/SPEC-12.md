# Handoff — SPEC-12 (Tra cứu: Kanji, Động từ & 10 Bảng tham chiếu)

Ngày: 23/09/2026. Trạng thái: Đã hoàn tất toàn bộ mã nguồn, các route tra cứu theo bộ mockup 22-tra-cuu.png đến 26-bang-tham-chieu.png; Static gates & Tests PASS 100%; Sẵn sàng nghiệm thu trình duyệt.

## Thay đổi và quyết định

- **Kiểu dữ liệu & Thư viện thuần ([web/src/types/lookup.ts](file:///d:/Projects/Lab/Japanese/web/src/types/lookup.ts), [web/src/lib/lookup.ts](file:///d:/Projects/Lab/Japanese/web/src/lib/lookup.ts)):**
  - Tích hợp 169 chữ Kanji N5 tĩnh thông qua [web/src/data/n5/kanji-index.ts](file:///d:/Projects/Lab/Japanese/web/src/data/n5/kanji-index.ts), 156 động từ 5 thể từ `verbs.json`, 10 bảng tham chiếu ngữ pháp/từ vựng từ `reference/*.json`.
  - Hàm `buildKanjiVocabIndex` & `getKanjiVocabIndex`: quét 25 bài học từ vựng (991 từ) tại runtime bằng `stripFurigana(word)` và regex ký tự Kanji, dựng `Map<string, VocabRef[]>` (singleton cache). Trích xuất chính xác các từ vựng trong giáo trình chứa từng chữ Kanji kèm số bài học và `targetId`.
  - Quy tắc xác thực trung thực dữ liệu `isExampleVerified`: phát hiện 431/907 ví dụ ghép có `vi === en`. Khi hiển thị, gán badge `[Chưa xác minh] (Đang đối chiếu nguồn)` và tuyệt đối không hiển thị tiếng Anh giả làm tiếng Việt.
  - Hàm `filterKanji` (lọc theo bài, số nét, chỉ chữ đã học) và `filterVerbs` (lọc theo nhóm 1/2/3, theo bài, tìm kiếm `?q=` trên cả dạng ます, từ điển và nghĩa).
  - Bộ unit test ([web/src/lib/lookup.test.ts](file:///d:/Projects/Lab/Japanese/web/src/lib/lookup.test.ts)) bao phủ 9 test suite kiểm thử đơn vị.
- **Hub Tra cứu ([web/src/app/hoc/tra-cuu/page.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/hoc/tra-cuu/page.tsx)):**
  - Giao diện trung tâm theo sát [mock/22-tra-cuu.png](file:///d:/Projects/Lab/Japanese/mock/22-tra-cuu.png): 3 card lớn dẫn tới Kanji (169 chữ N5), Động từ (156 động từ · 5 thể), Bảng tham chiếu (10 bảng).
  - Bổ sung nút bấm điều hướng "Tra cứu (Kanji, Động từ)" trên đầu trang danh sách bài học `/hoc`.
- **Màn Lưới Kanji & Chi tiết Kanji ([web/src/app/hoc/tra-cuu/kanji/page.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/hoc/tra-cuu/kanji/page.tsx), [web/src/app/hoc/tra-cuu/kanji/[chu]/page.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/hoc/tra-cuu/kanji/[chu]/page.tsx)):**
  - Component [web/src/components/lookup/KanjiGrid.tsx](file:///d:/Projects/Lab/Japanese/web/src/components/lookup/KanjiGrid.tsx) theo sát [mock/23-kanji.png](file:///d:/Projects/Lab/Japanese/mock/23-kanji.png):
    - Lưới ô vuông responsive (4 cột ở mobile 390px, 8 cột ở desktop), ô tối thiểu 48×48px.
    - Bộ lọc bài (1–25), số nét, switch "Chỉ chữ đã học" kết nối reactive với `db.reviewItems` qua `useLiveQuery`.
    - Chữ đã học hiển thị badge checkmark ở góc và nhãn "Đã học" trong `aria-label`.
    - Trạng thái rỗng hiển thị thông báo kèm nút "Xóa bộ lọc".
  - Trang chi tiết chữ Hán theo sát [mock/24-chi-tiet-kanji.png](file:///d:/Projects/Lab/Japanese/mock/24-chi-tiet-kanji.png):
    - SSG sinh tĩnh cho 169 chữ Kanji (`generateStaticParams`).
    - Hero card: chữ Hán cỡ lớn 64px (`font-jp`, `lang="ja"`), badge số bài, số nét, nghĩa tiếng Việt in đậm.
    - Khối cách đọc: âm On, âm Kun kèm nút phát âm `SpeakButton`.
    - Khối từ ghép: hiển thị Furigana, nghĩa (hoặc nhãn `Chưa xác minh` với 431 mục chưa đối chiếu), nút phát âm.
    - Khối từ vựng trong bài học: hiển thị các từ trong 25 bài học có chứa chữ Hán này lấy từ chỉ mục tra ngược runtime.
    - Khối chữ dễ nhầm: các chữ tương tự bấm được dẫn sang trang chi tiết chữ đó.
- **Bảng Động từ 5 thể ([web/src/app/hoc/tra-cuu/dong-tu/page.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/hoc/tra-cuu/dong-tu/page.tsx)):**
  - Component [web/src/components/lookup/VerbTable.tsx](file:///d:/Projects/Lab/Japanese/web/src/components/lookup/VerbTable.tsx) theo sát [mock/25-dong-tu.png](file:///d:/Projects/Lab/Japanese/mock/25-dong-tu.png):
    - Ô tìm kiếm tự do `?q=` tìm trên cả thể từ điển, thể ます và nghĩa tiếng Việt, tự động cuộn tới dòng khớp đầu tiên và highlight `bg-primary/10`.
    - Hàng chip lọc nhóm động từ sử dụng token màu `--verb-1`, `--verb-2`, `--verb-3` luôn kèm nhãn chữ "Nhóm 1", "Nhóm 2", "Nhóm 3".
    - Bảng HTML semantic `<table>` 7 cột, cột đầu tiên "Động từ" ghim cố định (`sticky left-0 bg-card z-10`), khung cuộn ngang có `tabIndex={0}` cho bàn phím và chỉ dẫn mobile.
- **10 Bảng Tham Chiếu ([web/src/app/hoc/tra-cuu/bang/page.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/hoc/tra-cuu/bang/page.tsx), [web/src/app/hoc/tra-cuu/bang/[slug]/page.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/hoc/tra-cuu/bang/[slug]/page.tsx)):**
  - Trang danh mục liệt kê 10 bảng chuyên đề.
  - Trang chi tiết render đúng cấu trúc semantic `<table>` cho 10 bảng (Tính từ, Lịch, Lượng từ, Đại từ, Gia đình, Chào hỏi, Số đếm, Trợ từ, Từ để hỏi, Giờ giấc) theo sát [mock/26-bang-tham-chieu.png](file:///d:/Projects/Lab/Japanese/mock/26-bang-tham-chieu.png).
  - Bảo toàn tuyệt đối 8 ô header rỗng có chủ đích (`vi: ""`), không lấp bằng ký tự giả làm méo hình dáng lưới.
  - Khối chú thích `note` hiển thị thông tin bổ trợ ở cuối bảng.

## Kiểm chứng

- **Kiểm tra tĩnh & Unit Tests (23/09/2026):**
  - `pnpm check`: PASS (TypeScript 0 lỗi, ESLint 0 cảnh báo).
  - `pnpm test`: PASS 120/120 unit tests (bao gồm 9 test trong `src/lib/lookup.test.ts`).
  - `pnpm build`: PASS (sinh tĩnh thành công 222/222 static pages, bao gồm 169 trang Kanji và 10 trang Bảng tham chiếu).
- **Trình duyệt:**
  - Sẵn sàng để người dùng nghiệm thu thực tế trên trình duyệt.

## Bước tiếp theo

- Đã hoàn tất **Chuỗi Tra cứu (SPEC-12)**.
- Sẵn sàng chuyển sang **SPEC-13 (Hộp tìm kiếm toàn cục Ctrl+K)** tìm trên các chỉ mục đã dựng ở đây.
