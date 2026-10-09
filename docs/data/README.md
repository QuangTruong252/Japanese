# Dữ liệu học và tiếng Nhật

Dữ liệu N5 nằm ở `web/src/data/n5/` (JSON, sửa trực tiếp): `lessons/` (bài, ngữ pháp, ví dụ, cover),
`vocab/` (từ vựng theo bài), `kanji/` (mỗi chữ một file), `verbs/`, `reference/` (bảng tham chiếu).
Kiểu dữ liệu: `web/src/types/`. Đây là nội dung tự biên soạn cho mục đích cá nhân: sửa lỗi khi phát
hiện; không bịa số trang hay liên kết audio.

- Quy ước biên soạn và thuật ngữ: [`editorial-guide.md`](editorial-guide.md).
- Thống kê bộ dữ liệu và checklist đối chiếu (tùy chọn): [`manifest.md`](manifest.md).

## Tiếng Nhật

- Cú pháp furigana: `私[わたし]は 学生[がくせい]です`. Đọc/hiển thị qua `lib/japanese.ts` và component
  `Furigana`; không viết parser, regex hay bộ chuyển kana riêng.
- Ngoặc vuông không đứng sau chữ Hán là phần tùy chọn (`どこ[へ]も`, `[どうも]ありがとう`). `Furigana` tự hiện
  thành ngoặc tròn; chữ thường không qua `Furigana` (aria-label, giọng đọc) dùng `formatOptionalBrackets`.
- Dấu cách trong câu là điểm được phép xuống dòng khi hiển thị; giữ nguyên khi sửa dữ liệu.
- Không bịa tiếng Nhật ở UI, mockup, test hay ví dụ: lấy từ các file trên và ghi rõ nguồn trong brief.
- Chấm đáp án chỉ chuẩn hóa những khác biệt được phép; không biến đáp án sai nghĩa thành đúng.

## Ảnh trong dữ liệu

`Lesson.cover`, `VocabWord.illustration`, `GrammarPoint.illustration` (+ `illustrationCaption`) là
`IllustrationAsset` tùy chọn, gắn bằng `batch.mjs link` (`artwork/illustrations/README.md`). Không suy
URL ảnh từ id, từ hay số bài; không thêm ảnh placeholder.

## Audio

Người học tự nạp ZIP audio của giáo trình. Import phải kiểm tra manifest, hash và mapping track trước
khi thay dữ liệu cũ; xử lý thiếu file, hết quota và import lại. Không đưa audio nguồn vào bundle,
`public/` hay cloud sync.

## Script

Chạy ở root repo sau khi đổi dữ liệu tương ứng:

| Script | Khi nào |
|---|---|
| `node scripts/generate-kanji-index.mjs` | Thêm hoặc xóa file trong `kanji/` (sinh lại `kanji-index.ts`). |
| `node scripts/enrich-vocab-verbs.mjs` | Đổi `verbs/verbs.json` hoặc động từ trong `vocab/` (điền thể động từ vào từ vựng). |

Sau đó chạy `pnpm check` và `pnpm test` trong `web/`.
