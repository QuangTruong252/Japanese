# Nhân vật

`web/src/data/n5/characters.json` là danh sách nhân vật duy nhất của app: hội thoại bài học (`Lesson.dialogues`),
bài Luyện đọc và hồ sơ nhân vật hiển thị cho người học đều dựa vào nó. **Đọc file này trước khi soạn hoặc sửa
hội thoại, đoạn văn có nhân vật, hay câu hỏi về nhân vật.**

## Trường

| Trường | Ghi chú |
|---|---|
| khóa (id) | Romaji thường, nối bằng `-` (`mai`, `ten-in`). Trùng `DialogueRole.id` và `speaker`. |
| `name` | Cú pháp furigana, viết y hệt mọi `roles[].name` dùng id này (`田中[たなか]`, `受付[うけつけ]の 人[ひと]`). |
| `kind` | `main`: người có tên, xuất hiện lặp lại, có tính cách và quan hệ. `extra`: vai chức năng (nhân viên, bác sĩ…), mỗi lần có thể là người khác. |
| `roleVi` | Một dòng mô tả vai, hiển thị cạnh tên. |
| `bioVi` | (`main`) 2–3 câu giới thiệu cho người học. Chỉ chứa điều có trong `canon`. |
| `canon` | (`main`) Sự thật đã thiết lập, mỗi mục kèm nguồn (`l08-ryou`, `reading-p-farewell-card`). Gồm cả cách xưng hô. |
| `avatar` | Chân dung, bắt buộc; tạo theo `artwork/illustrations/README.md`. |

`web/src/lib/characters.test.ts` (chạy trong `pnpm test`) và `node scripts/build-reading.mjs check` báo lỗi khi một vai
trong nội dung chưa đăng ký hoặc viết tên khác `name`.

## Khi soạn nội dung

- Không viết gì mâu thuẫn với `canon` (nghề, nơi ở, gia đình, sở thích, món ăn…). Đoạn văn kể ngôi thứ nhất (私) mà
  có tên nhân vật hoặc tiêu đề gắn với nhân vật cũng phải khớp canon của người đó.
- Giữ cách xưng hô: thể lịch sự hay thể thường theo cặp nhân vật và theo bài (Mai và Tanaka chỉ nói thể thường với nhau từ
  bài 20, trước người thứ ba vẫn lịch sự), và đại từ trong bản dịch tiếng Việt như dòng "Xưng hô" của `canon`.
- Chi tiết mới không mâu thuẫn được phép thêm; nếu là sự thật về nhân vật `main` (sở thích mới, sự kiện), ghi vào
  `canon` kèm nguồn trong cùng task. Đổi `bioVi` chỉ khi chi tiết đủ quan trọng để giới thiệu nhân vật.
- Vai chức năng dùng lại `extra` sẵn có (người bán hàng ở bất kỳ cửa hàng nào là `ten-in`), không tạo id mới cho
  từng nơi.

## Thêm nhân vật mới

1. Kiểm tra không trùng: người này có thể là nhân vật sẵn có, hoặc vai `extra` sẵn có không?
2. Chọn `kind`. Người có tên, sẽ quay lại ở bài khác → `main`; xuất hiện một lần vì chức năng → `extra`.
   Người thân hoặc đồng nghiệp của nhân vật `main` ghi quan hệ trong `roleVi` (`Mẹ của anh Tanaka`).
3. Tên tiếng Nhật: tên người Nhật phổ biến, kanji N5 hoặc kana, có furigana; không trùng họ với nhân vật đang có.
   Ghi lý do chọn tên trong brief.
4. Với `main`: viết `canon` từ chính bài đầu tiên nhân vật xuất hiện (nghề, quan hệ với nhân vật sẵn có, cách
   xưng hô), rồi `bioVi`. Thêm dòng xưng hô vào `canon` của nhân vật sẵn có mà người mới nói chuyện cùng.
5. Chân dung: cùng phong cách với chân dung hiện có (brief theo `docs/workflow/briefs/asset.md`), file
   `/assets/illustrations/characters/<id>-portrait-v1.webp`.
6. Chạy `pnpm check` và `pnpm test` trong `web/`.
