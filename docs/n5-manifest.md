# Manifest bộ dữ liệu N5 tiếng Việt

## 1. Tổng quan bộ dữ liệu

Bộ dữ liệu tiếng Việt N5 (`web/src/data/n5/`) được khởi tạo và chuyển đổi hoàn chỉnh từ 230 file nguồn Noken (`repo-reference/noken/src/data/n5/`), phục vụ ứng dụng tự học Minna no Nihongo N5/N4.

- **Phiên bản:** `1.0.0`
- **Trạng thái biên tập (editorial_status):** `edited` (Đã hoàn thành biên soạn và dịch nghĩa tiếng Việt tự nhiên)
- **Trạng thái kiểm chứng (verification_status):** `unverified` (Chưa đối chiếu từng dòng với ấn bản sách giáo trình thực tế theo quy định `AGENTS.md`)
- **Ngôn ngữ hỗ trợ:** Song ngữ `vi / en` (Thay thế hoàn toàn tiếng Tây Ban Nha `es`, bảo toàn 100% tiếng Anh `en`, ID, tiếng Nhật, Furigana và liên kết)

---

## 2. Thống kê số lượng thực thể

| Nhóm dữ liệu | Thư mục con | Số file JSON | Số lượng thực thể chi tiết | Ghi chú |
| :--- | :--- | :---: | :--- | :--- |
| **Động từ** | `verbs/` | 1 | 156 động từ | Bao gồm các thể: ます, て, từ điển, ない, た, nhóm động từ và nghĩa tiếng Việt |
| **Chữ Hán** | `kanji/` | 169 | 169 chữ Hán, 907 ví dụ | Đầy đủ âm Hán-Việt, nét viết, âm On/Kun, nghĩa tiếng Việt và các từ ví dụ |
| **Từ vựng** | `vocab/` | 25 | 991 từ vựng | 25 bài học tương ứng Minna no Nihongo I, đầy đủ kanji, kana, từ loại |
| **Bài học ngữ pháp** | `lessons/` | 25 | 141 điểm ngữ pháp, 187 câu ví dụ | Tiêu đề, mô tả bài học, mẫu câu, giải thích chi tiết và câu ví dụ song ngữ vi/en |
| **Bảng tra cứu** | `reference/` | 10 | 358 trường nội dung dịch | 10 bảng chuyên đề: Tính từ, Lịch, Lượng từ đếm, Đại từ chỉ thị, Gia đình, Chào hỏi, Số đếm, Trợ từ, Từ để hỏi, Giờ giấc |
| **Tổng cộng** | | **230** | **991 từ, 141 ngữ pháp, 187 ví dụ, 169 kanji, 156 động từ, 10 bảng** | **Không thiếu sót bất kỳ trường nào** |

---

## 3. Danh mục 10 bảng tra cứu nhanh (`reference/`)

1. `adjectives.json`: Cách chia tính từ đuôi い/な và 14 cặp tính từ trái nghĩa thông dụng (43 trường).
2. `calendar.json`: Các tháng, ngày trong tháng, ngày trong tuần và mốc thời gian (86 trường).
3. `counters.json`: Bảng hậu tố lượng từ đếm và tra cứu nhanh lượng từ (41 trường).
4. `demonstratives.json`: Hệ thống từ chỉ thị こ・そ・あ・ど theo cự ly và chức năng (16 trường).
5. `family.json`: Xưng hô gia đình mình (khiêm nhường) và gia đình người khác (tôn kính) (21 trường).
6. `greetings.json`: Các câu chào hỏi hàng ngày, xã giao lịch sự và trong lớp học (38 trường).
7. `numbers.json`: Số đếm từ 0 đến hàng vạn, trăm triệu, số thập phân và phân số (25 trường).
8. `particles.json`: Danh mục và chức năng ngữ pháp của toàn bộ trợ từ N5 (36 trường).
9. `question-words.json`: Toàn bộ các từ để hỏi N5 kèm ví dụ minh họa ngữ cảnh (32 trường).
10. `time.json`: Cách đọc giờ, phút, thời lượng và các buổi trong ngày (20 trường).

---

## 4. Xử lý 8 ô layout bảng rỗng

Đúng 8 ô layout bảng trong thư mục `reference/` được giữ nguyên giá trị chuỗi rỗng `""` theo quyết định thiết kế đã duyệt để bảo toàn cấu trúc lưới hiển thị:
- `reference/adjectives.json`: Ô góc trên cùng bên trái của bảng chia tính từ (`sections[0].tables[0].headers[0]`).
- `reference/calendar.json`: 3 ô phân tách cột song song của bảng ngày/buổi (`sections[3].tables[0].headers[1, 3, 5]`).
- `reference/calendar.json`: 3 ô phân tách cột song song của bảng tuần/tháng/năm (`sections[4].tables[0].headers[1, 3, 5]`).
- `reference/demonstratives.json`: Ô góc phân loại hàng/cột của đại từ chỉ thị (`sections[0].tables[0].headers[0]`).

Toàn bộ 350 trường nội dung còn lại đều có bản dịch tiếng Việt đầy đủ, rõ nghĩa và không rỗng.

---

## 5. Checklist đối chiếu & kiểm chứng (Verification Checklist)

Theo quy định `AGENTS.md`, các nội dung đã biên tập cần bước đối chiếu xác minh thực tế trước khi đưa vào tập bài học chính thức:

- [ ] **Từ vựng:** Đối chiếu 991 từ vựng với sách *Minna no Nihongo I - Bản dịch và Giải thích Ngữ pháp tiếng Việt* (Nhà xuất bản Trẻ).
- [ ] **Ngữ pháp:** Đối chiếu 141 điểm ngữ pháp và 187 câu ví dụ với các bài tương ứng (Bài 1–25).
- [ ] **Chữ Hán:** Đối chiếu 169 âm Hán-Việt với từ điển Hán-Việt chuẩn mực (Thiều Chửu / Đào Duy Anh) và kiểm tra 907 ví dụ ghép.
- [ ] **Động từ:** Xác nhận cách chia 5 thể của 156 động từ đối với các trường hợp đặc biệt (như 行きます, ある, 帰る...).
- [ ] **Bảng tra cứu:** Kiểm tra đối chiếu các bảng tổng hợp ở cuối sách giáo trình.
