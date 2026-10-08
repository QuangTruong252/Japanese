# Brief minh họa Phố giấy

Dùng cùng [ảnh mẫu v1](reference/paper-town-style-v1.png) cho mọi lần tạo ảnh. Đây là brief vẽ; quy ước file và quy trình ở [README.md](README.md), cách dùng ảnh trong giao diện ở `DESIGN.md` §8.

## Những đặc điểm giữ ổn định

- Minh họa màu nước/gouache trên giấy sáng ấm; nét chì tối mảnh, hình mảng mềm, hạt giấy nhẹ. Tránh ảnh thật, 3D bóng hoặc đổi sang cartoon hình học.
- Kiến trúc màu cát/kem, nét và mái màu than, cây xanh sage/olive, một ít đỏ gạch. Màu cảnh vật không định nghĩa lại token UI.
- Đời sống thường ngày: tiệm nhỏ, phố, đồ vật, người học. Giữ cảm giác thân thiện với người trẻ; không biến mọi bài thành phong cảnh du lịch.
- Nhân vật nam: tóc tối ngắn hơi rối, áo dài tay màu ngà, quần than, ba lô tối. Nhân vật nữ: tóc bob tối, cardigan kem, áo đỏ gạch, váy than, túi nâu và sổ bìa trống. Khi dùng lại hai người này, giữ khuôn mặt, trang phục và tỷ lệ gần mẫu; tình huống mới có thể đổi tư thế.
- Banner: cảnh rộng, điểm chính ở giữa để chịu crop; giữ người/đồ vật thiết yếu trong vùng an toàn. Scene: chủ thể lớn hơn, nền giản lược để đọc được ở thumbnail. Vocab: một khái niệm rõ. Grammar: tình huống, công thức và nhãn dựng bằng HTML/Furigana.
- Không vẽ chữ, kana/kanji, biển hiệu có chữ, logo, nút, watermark hoặc công thức vào raster. Giữ bìa sổ/awning trống. Không vẽ nền checkerboard giả alpha.

## Brief mỗi ảnh mới

1. Ghi subject/nghĩa, vai trò, tên file và khuôn theo [quy ước](README.md#quy-ước); kiểm tra ảnh dùng lại được trước.
2. Đính kèm mẫu v1 với vai trò **STYLE REFERENCE**, thêm vai trò **CHARACTER REFERENCE** khi cần hai nhân vật này. Cùng mẫu cho mọi nhóm; không lấy ảnh mới sinh làm mẫu nối tiếp qua nhiều đời.
3. Yêu cầu một ảnh riêng, mô tả chủ thể/hành động, độ chi tiết nền và khoảng trống. Với banner ghi 3:1; scene/grammar 4:3; vocab/state 1:1. Giữ chữ và điều khiển ngoài ảnh.
4. Kiểm ảnh cạnh mẫu: nét vẽ, bảng màu, nhân vật, tay/chân, nội dung học, chữ ngoài ý muốn và crop. Tham chiếu giúp nhất quán nhưng không bảo đảm kết quả giống tuyệt đối; ảnh lệch cần sửa trước khi xuất.
5. Ghi ảnh vào một batch rồi chạy `check`, `export`, `sheet`, `link` của [batch.mjs](tools/batch.mjs) theo [quy trình](README.md#quy-trình-một-đợt). Script sinh sidecar (prompt, nguồn, crop, hash) và WebP theo khuôn. Chỉ tăng version sau khi file production đã được tham chiếu.

## Batching atlas cho đồ vật đơn giản

- Khi tạo số lượng lớn đồ vật từ vựng đơn giản (ví dụ đồ dùng hàng ngày, văn phòng phẩm), gom vào một atlas trong **một lần gọi sinh duy nhất** với true native alpha để giảm số lượt tạo ảnh. Mặc định dùng **2×2**: ô khoảng 590 px nên không phải phóng to, và pilot 06/10 có 4/4 ô dùng được. Chỉ dùng 4×2 cho vật gọn, cùng tỷ lệ: ô khoảng 440 px, phải phóng nhẹ, và vật dài như máy bay dễ chồng sang ô bên cạnh.
- Yêu cầu bắt buộc: các đối tượng phải cách nhau bằng các rãnh trong suốt hoàn toàn (`alpha === 0`), không chạm mép ô, không vẽ lưới phân cách hoặc nền ô cờ giả lập.
- Nguồn atlas và các crop master PNG được lưu giữ bên ngoài `public` (tại `artwork/illustrations/atlases/` và `artwork/illustrations/vocab/`). Không chuyển sang runtime atlas trên web để đảm bảo tính độc lập, modular và tối ưu lazy loading của từng asset.
- `batch.mjs` dùng [detect-crops.mjs](tools/detect-crops.mjs) để tự tìm crop có biên alpha 0 và không lẫn chủ thể của ô khác, rồi xuất WebP 512×512 với chủ thể vừa khung 416 px.
- Cơ chế fallback: Nếu một hình trong atlas bị lỗi hoặc cần tinh chỉnh lại, dùng chế độ single-call tạo riêng ảnh đó, không nhất thiết phải vẽ lại toàn bộ atlas.

## Ghi chú công cụ tạo ảnh (06/10/2026)

- **ChatGPT web** (người dùng tạo thủ công, đính kèm mẫu v1) cho ra PNG có alpha thật, dùng được cho atlas cutout. Prompt mẫu: [atlas](atlases/CHATGPT-PROMPTS-2026-10-05.md), [ảnh đơn](vocab/CHATGPT-PROMPTS-SINGLES-2026-10-06.md). Ảnh có thể chứa dải alpha rất mờ (1–7) nối liền các ô; khi đó không có đường cắt alpha 0 và phải tạo lại ô đó riêng, không tẩy pixel. Prompt ảnh đơn yêu cầu chủ thể chiếm khoảng 70% khung, không có nền loang để giảm lỗi này.
- **Codex built-in `image_gen`** (gói Plus, không cần API key) cho ra PNG có alpha thật và nhận ảnh mẫu qua `view_image`. Đã dùng ổn định cho cutout (model `gpt-6-luna`, effort low: phần tốn hạn mức chính là công việc của agent, nên agent tạo ảnh chỉ gọi công cụ tạo ảnh). Agent tạo ảnh không tự chép file; Điều phối chạy `batch.mjs collect`.
- **Antigravity `generate_image`** chỉ trả JPEG và không nhận ảnh tham chiếu. Nền caro trong ảnh là vẽ giả, nên chỉ dùng cho scene/grammar nền đục (master PNG là bản re-encode lossless), không dùng cho cutout.
- Khi sửa script/JSON chứa tiếng Việt trên Windows, không đọc bằng `Get-Content` mặc định rồi ghi lại vì sẽ hỏng UTF-8. Dùng công cụ ghi UTF-8 trực tiếp và kiểm tra không còn chuỗi kiểu `Ã`/`á»`.

Template prompt (khối STYLE, layout atlas/ảnh đơn, nền đục full-bleed) nằm ở một chỗ duy nhất trong [batch.mjs](tools/batch.mjs); batch chỉ ghi chủ thể, sửa template thì sửa ở đó. Asset cũ (trước Bài 5) được xuất bằng `contain` 448 + 32 px trong suốt mỗi phía, nên chủ thể nhỏ hơn asset mới (vừa khung 416 + 48 px); không xuất lại ảnh cũ vì file `-vN` đã dùng là bất biến.

Tính từ cần ngữ cảnh rõ (nóng/lạnh thời tiết, lạnh khi chạm, mới/cũ đồ vật). Không buộc minh họa từ trừu tượng hoặc câu giao tiếp bằng hình mơ hồ. Kiểm ảnh độc lập rồi mới gắn vào đúng nghĩa.
