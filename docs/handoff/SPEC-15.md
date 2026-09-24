# Handoff — SPEC-15 (Học từ vựng chủ động theo bài)

Ngày: 24/09/2026. Trạng thái: Lật thẻ 3D và ví dụ riêng cho 991/991 từ N5 đã chạy; lưu FSRS/sync còn chờ.

## Quyết định và thay đổi

- Giữ route toàn màn hình, dùng Washi và ẩn điều hướng ứng dụng.
- Màn chọn từ không hiện nghĩa tiếng Việt. Route nạp dữ liệu có sẵn dù bài chưa đối chiếu;
  trạng thái `unverified` trong manifest vẫn giữ nguyên.
- Mặt trước hiện từ Nhật lớn, cách đọc hiragana nhỏ bên dưới và icon phát âm từ ở góc thẻ.
  Chạm thẻ để xoay 3D trong 250ms; chế độ giảm chuyển động không chạy transition.
- Mặt sau đặt nghĩa ở giữa, câu ví dụ bên dưới và icon phát âm câu nhỏ cạnh tiêu đề.
  Bốn nút icon FSRS cùng nhãn bên dưới chỉ hiện sau khi lật; hạn ôn nằm trong tên truy cập.
- `vocab/lesson-07.json` có ví dụ tiếng Nhật, cách đọc kana và nghĩa Việt cho 47/47 từ.
  Đây là câu minh họa tự biên soạn theo từ và mẫu ngữ pháp bài 7, chưa đối chiếu bản in.
- Thẻ ưu tiên ví dụ gắn với từ; phép dò ví dụ ngữ pháp chỉ còn là dự phòng.
- 24/09/2026: thêm `example` cho 944 từ còn lại (bài 1–6, 8–25). Soạn bởi 4 agent Gemini
  (Antigravity CLI) điều phối qua Orca run `run_491c8fe53362`, mỗi agent một lô file riêng;
  coordinator (Claude) rà mẫu từng lô và tự sửa ~60 câu: câu lách test (chép `（…）`, `／`,
  cả cụm `A・B`, bỏ mất tên người), câu vượt ngữ pháp bài (`甘くて` ở bài 12, `いらっしゃって` ở bài 8),
  từ viết kana bị đổi sang kanji, và 40 câu có chữ số ngoài furigana (`６時[ろくじ]` → `六時[ろくじ]`).
- Duyệt nội dung toàn bộ 991 câu (3 agent Claude đọc từng dòng, coordinator áp dụng): sửa 28 câu
  — ngữ pháp vượt bài (`〜たいです` trước bài 13, `と言います`/`〜前に` ở bài 7), từ kana bị viết
  kanji (かぎ, きのう, あした, けさ, ことば), dịch lệch (部長, もう〜ましたか), câu gượng và khoảng cách.
- Theo quyết định người dùng 24/09/2026: app học cá nhân N5/N4 nên bỏ yêu cầu đối chiếu sách
  (AGENTS.md, PRODUCT.md, SPEC-01 §3.1, SPEC-09, SPEC-15) và bỏ dòng nhắc trên UI (`hoc/[so]/page.tsx`,
  `luyen-tap/page.tsx`, `cai-dat/audio/page.tsx`). Trường `verification` còn trong data/type để tương thích.
  Trang Kanji đổi nhãn "Chưa xác minh" thành "Chưa dịch"; 431 nghĩa từ ghép đã được dịch (xem handoff SPEC-12).
- Đồng bộ loại từ: `VocabWord.type` đổi theo tên trong JSON (`verb-godan`, `adjective-i`, …, thêm
  `interrogative`, `counter`, `number`, `conjunction`). Sửa lỗi nhãn Nhóm 1/2/3 ở trang chi tiết bài
  không bao giờ hiện vì tra theo `verb-1`. Test mới chặn tên loại từ lạ trong JSON.
- Test chung trong `web/src/lib/lessons.test.ts` áp cho mọi bài: `kana` khớp furigana, không còn
  kanji/chữ số trong cách đọc, câu chứa từ đích (hiểu `〜` giữa cụm, cách viết thay thế `（）／・`,
  gốc động từ/tính từ い), không chép cách viết thay thế vào câu, đủ 991/991 từ.
- Giữ `Furigana`, `SpeakButton`, `applyReview`, `saveVocabRecall` và transaction Dexie hiện có.

## Kiểm tra đã chạy

- `pnpm check` — PASS (TypeScript + ESLint).
- `pnpm test` — PASS, 129 tests; kiểm tra 991 ví dụ, furigana, kana và từ đích cho 25 bài.
- `pnpm build` — PASS; prerender 247 trang, gồm 25 route `/hoc/{so}/tu-vung`.
- Browser `pnpm start` 390×844: `/hoc/1`, `/hoc/4`, `/hoc/25/tu-vung` lật thẻ hiện câu, kana, nghĩa
  (vd bài 4 `毎朝 六時に 起きます。` / `まいあさ ろくじに おきます。`); không tràn ngang; không bấm rating.
- Browser tại `/hoc/7/tu-vung`: mặt trước `切ります` / `きります`, không lộ nghĩa hoặc ví dụ;
  mặt sau hiện “cắt”, `はさみで 紙[かみ]を 切[き]ります。`, kana, nghĩa Việt và hai icon audio.
  Transform là xoay 3D với transition 0,25 giây; 390×844 không tràn ngang.
- Mặt chưa lật có `hidden` cho nội dung mặt sau; Tab sau khi lật không đi vào nút ở mặt trước.
- Không có lỗi console trong lượt kiểm tra. Build còn cảnh báo quy ước `middleware` đã deprecated.

## Chưa kiểm chứng

- Chưa nghe kiểm chứng âm thanh TTS, emulation giảm chuyển động, thao tác rating, hoặc ghi
  `reviewItems`/`pendingSync` và reconnect sync.
- Không chọn mức FSRS trong browser dùng chung để tránh ghi dữ liệu luyện tập thử.

## Bước tiếp theo

1. Nếu cần nghiệm thu phần lưu/sync, dùng profile test riêng để rating rồi kiểm tra dữ liệu sau reload/reconnect.
