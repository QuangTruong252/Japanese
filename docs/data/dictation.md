# Tập câu Nghe mỗi ngày

`web/src/data/n5/dictation.json` là danh sách cho phép, được rà từ ví dụ ngữ pháp ngày
2026-10-27. Bản đầu có 44 câu nguyên văn, không có tên riêng, chữ số, ngoặc tùy chọn
hoặc chữ Hán thiếu furigana. Câu ngoài danh sách chưa được dùng cho bài nghe.

| Đã học đến | Câu đủ điều kiện | Câu mỗi ngày |
|---|---:|---:|
| Bài 1 | 2 | 2 |
| Bài 5 | 13 | 5 |
| Bài 10 | 26 | 5 |
| Bài 25 | 44 | 5 |

Bài 1 chỉ dùng `wa-desu`, ví dụ 1, và `desu-ka`, ví dụ 1. Các ví dụ khác có
tên riêng chưa được xác minh theo phạm vi; không thêm câu hoặc lặp để đủ năm.
Mỗi bài 2–25 đều có câu trong tập. Khi có đủ năm bài khác nhau, bộ chọn lấy
mỗi bài một câu trước khi lấy câu thứ hai của cùng bài.

Mỗi câu ghi vị trí nguồn, bản chụp câu Nhật và nghĩa Việt, dấu vân tay SHA-256
của mẫu ngữ pháp và giải thích, cùng các từ vựng đã kiểm. Mốc tối thiểu là
`max(bài nguồn, mốc từ vựng, mốc ngữ pháp/thể)`. Trong tập hiện tại, ngữ pháp/thể
đều nằm trong hoặc trước bài nguồn. Các câu được đọc thủ công theo mẫu ngữ pháp;
không suy mốc bằng dò chuỗi con.

99 tham chiếu từ vựng giữ nguyên `word`, `kana`, `verbForms` của nguồn. Từ lặp
dùng mốc sớm nhất: chẳng hạn `ある` dùng bài 9 thay vì bản lặp ở bài 10.
Tập không miễn tên người, địa danh hoặc từ lạ. Hai danh từ chức năng `こと`
và `とき` có căn cứ ở chính mẫu ngữ pháp bài 18 và 23.

`dictation.test.ts` kiểm câu/ nghĩa và mẫu nguồn còn đúng bản đã duyệt, từ vựng
không đổi, mốc sớm nhất, token nội dung và thể động từ bằng kuromoji. Kuromoji
chỉ chạy trong test, không vào ứng dụng. Kiểm token là hàng rào hồi quy hỗ trợ
người duyệt; nó không chứng minh toàn bộ từ nghĩa và ngữ pháp của câu mới.

Khi thêm hoặc sửa câu: đọc lại cả câu, đối chiếu từ vựng và thể ngữ pháp, cập
nhật bản chụp cùng phiên bản dữ liệu, rồi chạy `pnpm test` và `pnpm check` trong
`web/`. Không cập nhật dấu vân tay chỉ để làm test xanh mà bỏ bước rà phạm vi.
