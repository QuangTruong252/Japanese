# Kho câu Dịch phản xạ

`web/src/data/n5/translation.json` là danh sách câu cho bài dịch Nhật ↔ Việt, sinh ngày 2026-10-27 từ
câu **có sẵn** trong dữ liệu. Không câu nào được tạo, sửa hay dịch lại: `jp` và `vi` là nguyên văn nguồn.

- Đợt 1: ví dụ ngữ pháp `lessons/lesson-XX.json` → `grammar[].examples[]` (id `g-l06-o-transitivo-0`).
- Đợt 2: ví dụ từ vựng `vocab/lesson-XX.json` → `example` (id `v-l06-tabemasu`). Bỏ câu trùng một ví dụ
  ngữ pháp (kể cả ví dụ đã bị loại ở đợt 1) hoặc trùng câu đã có sau khi bỏ furigana và khoảng trắng.
- Không dùng lời thoại; không đụng `dictation.json`.

| Đã học đến | Câu đủ điều kiện |
|---|---:|
| Bài 1 | 31 |
| Bài 5 | 241 |
| Bài 10 | 499 |
| Bài 15 | 729 |
| Bài 25 | 1052 |

Tổng 1052 câu: 165 ví dụ ngữ pháp và 887 ví dụ từ vựng. `web/src/lib/translation-data.ts` chỉ nạp và
xuất danh sách; bộ chọn và hàm chấm thuộc giai đoạn sau.

## Mỗi câu ghi gì

`source` (vị trí nguồn), `jp`, `vi`, `minimumLesson`, `keywords` (tối đa 4, theo thứ tự trong câu) và
`snapshot` (SHA-256 của `{jp, vi}`, thêm `pattern` và `explanation` của mẫu với câu ngữ pháp). Nguồn đổi thì
snapshot lệch và test báo "cần duyệt lại"; không cập nhật snapshot chỉ để test xanh mà bỏ bước rà.

`keywords[].jp` là chuỗi con nguyên văn của `jp` (có furigana). `keywords[].vi` là chuỗi con nguyên văn
của `vi`, lấy từ một cách gọi trong `meaning.vi` của chính từ vựng đó; không tìm được cụm rõ ràng thì bỏ
trường `vi` (không đoán). `ref` là `bài:id` của từ trong `vocab/`. Từ khóa không cắt giữa một cụm chữ Hán
đã gắn furigana, và không lấy cả câu làm từ khóa. Câu không có từ khóa vẫn được giữ.

## Mốc bài tối thiểu

`minimumLesson = max(bài nguồn, bài của từ vựng, thể động từ, trợ từ)`:

- Từ vựng: mốc thấp nhất mà các từ đã học (một từ, hợp từ như 会社員, hoặc cụm như
  そろそろ失礼します) phủ hết token nội dung do kuromoji tách. Ví dụ `会社員` (bài 1) thắng
  `会社` (bài 3) + `員`. Vocab chép nhiều ký pháp (`[お]ふろ`, `トイレ（お手洗い）`, `A／B`, ghi chú `[〜を]`)
  được bung thành các dạng; chữ Hán trong câu còn vocab chỉ dạy bằng kana (今日/きょう) khớp theo cách
  đọc furigana; cùng chữ khác cách đọc (日[ひ] / 〜日[にち]) là từ khác.
- Thể động từ: như `dictation.md` (ます 4, たい 13, て 14, ない 17, 辞書形 18, た 19).
- Trợ từ: bài sớm nhất có ví dụ ngữ pháp hoặc hội thoại dùng trợ từ đó (không có bảng mốc trợ từ riêng
  trong dữ liệu). Trợ từ nằm trong cụm từ vựng bị kuromoji tách (ひらがな → ひ|ら|が|な) không tính.
- Ngoại lệ có lý do: tên riêng đã đọc tay (danh sách `properNames` trong JSON); の thay danh từ (bài 2),
  こと (18), とき (23) vì chính mẫu ngữ pháp dạy; ない (tính từ) là phủ định của ある (bài 17).

Câu bị loại: không xác định được mốc (token không có trong vocab, kể cả kuromoji tách sai), chữ Hán thiếu
furigana, ngoặc tùy chọn `[...]` không sau chữ Hán, câu cụt hoặc không phải câu (bảng chia thể có `→`,
`・`, `（I）`). Chữ số và chữ Latin của từ vựng (CD, ATM) được giữ.

Một số câu là hai lượt thoại (`A？…B。`) hoặc một lời thoại đặt trong 「」, đúng như nguồn.

## Sinh lại và kiểm

```sh
node scripts/build-translation.mjs   # ở root repo; ghi translation.json và .work/…/build-log.json
```

Chạy lại khi đổi `vocab/`, `lessons/` hoặc luật lọc. `translation-data.test.ts` kiểm câu/nghĩa/snapshot
khớp nguồn, không trùng, từ khóa hợp lệ, từng token nội dung bằng kuromoji thuộc từ đã học tới mốc câu
(cùng thể động từ), và bản sinh lại khớp file đã commit. Kuromoji chỉ chạy trong test và script, không vào
ứng dụng. Kiểm token là hàng rào hồi quy cho người duyệt, không chứng minh toàn bộ nghĩa và ngữ pháp của
câu; mốc trợ từ và từ khóa cần người đọc lại khi thêm hoặc sửa câu.
