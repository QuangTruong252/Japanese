# Brief minh họa Phố giấy

Ngày: **05/10/2026**. Dùng cùng [ảnh mẫu v1](reference/paper-town-style-v1.png) cho các lần generate tiếp theo. Đây là brief vẽ asset, không thay hợp đồng UI ở [DESIGN.md](../../DESIGN.md) hoặc quy ước file ở [SPEC-21](../../docs/specs/SPEC-21-illustration-assets.md).

## Những đặc điểm giữ ổn định

- Minh họa màu nước/gouache trên giấy sáng ấm; nét chì tối mảnh, hình mảng mềm, hạt giấy nhẹ. Tránh ảnh thật, 3D bóng hoặc đổi sang cartoon hình học.
- Kiến trúc màu cát/kem, nét và mái màu than, cây xanh sage/olive, một ít đỏ gạch. Màu cảnh vật không định nghĩa lại token UI.
- Đời sống thường ngày: tiệm nhỏ, phố, đồ vật, người học. Giữ cảm giác thân thiện với người trẻ; không biến mọi bài thành phong cảnh du lịch.
- Nhân vật nam: tóc tối ngắn hơi rối, áo dài tay màu ngà, quần than, ba lô tối. Nhân vật nữ: tóc bob tối, cardigan kem, áo đỏ gạch, váy than, túi nâu và sổ bìa trống. Khi dùng lại hai người này, giữ khuôn mặt, trang phục và tỷ lệ gần mẫu; tình huống mới có thể đổi tư thế.
- Banner: cảnh rộng, điểm chính ở giữa để chịu crop; giữ người/đồ vật thiết yếu trong vùng an toàn. Scene: chủ thể lớn hơn, nền giản lược để đọc được ở thumbnail. Vocab: một khái niệm rõ. Grammar: tình huống, công thức và nhãn dựng bằng HTML/Furigana.
- Không vẽ chữ, kana/kanji, biển hiệu có chữ, logo, nút, watermark hoặc công thức vào raster. Giữ bìa sổ/awning trống. Không vẽ nền checkerboard giả alpha.

## Brief mỗi ảnh mới

1. Ghi subject/nghĩa, vai trò, tên file và khuôn theo SPEC-21; kiểm tra ảnh dùng lại trước.
2. Đính kèm mẫu v1 với vai trò **STYLE REFERENCE**, thêm vai trò **CHARACTER REFERENCE** khi cần hai nhân vật này. Cùng mẫu cho mọi nhóm; không lấy ảnh mới sinh làm mẫu nối tiếp qua nhiều đời.
3. Yêu cầu một ảnh riêng, mô tả chủ thể/hành động, độ chi tiết nền và khoảng trống. Với banner ghi 3:1; scene/grammar 4:3; vocab/state 1:1. Giữ chữ và điều khiển ngoài ảnh.
4. Kiểm ảnh cạnh mẫu: nét vẽ, bảng màu, nhân vật, tay/chân, nội dung học, chữ ngoài ý muốn và crop. Tham chiếu giúp nhất quán nhưng không bảo đảm kết quả giống tuyệt đối; ảnh lệch cần sửa trước khi xuất.
5. Lưu PNG + JSON prompt đầy đủ, xuất WebP từ PNG theo khuôn bằng script tái sử dụng `artwork/illustrations/tools/export-vocab.mjs` hoặc `artwork/illustrations/tools/export-atlas.mjs`, xem lại bản nén rồi ghi dimensions/bytes/hash. Chỉ tăng version sau khi file production đã được tham chiếu.

## Batching Atlas 4×2 cho đồ vật đơn giản

- Khi tạo số lượng lớn đồ vật từ vựng đơn giản (ví dụ đồ dùng hàng ngày, văn phòng phẩm), cho phép gom vào một atlas 4×2 trong **một lần gọi sinh duy nhất** với true native alpha để giảm số lượt tạo ảnh. Chưa đo chi phí.
- Yêu cầu bắt buộc: các đối tượng phải cách nhau bằng các rãnh trong suốt hoàn toàn (`alpha === 0`), không chạm mép ô, không vẽ lưới phân cách hoặc nền ô cờ giả lập.
- Nguồn atlas và các crop master PNG được lưu giữ bên ngoài `public` (tại `artwork/illustrations/atlases/` và `artwork/illustrations/vocab/`). Không chuyển sang runtime atlas trên web để đảm bảo tính độc lập, modular và tối ưu lazy loading của từng asset.
- Tái sử dụng script `artwork/illustrations/tools/export-atlas.mjs` để kiểm tra độ trong suốt của đường biên rãnh, tự động cắt và xuất WebP 512×512 theo quy chuẩn contain 448 + padding 32px.
- Cơ chế fallback: Nếu một hình trong atlas bị lỗi hoặc cần tinh chỉnh lại, dùng chế độ single-call tạo riêng ảnh đó, không nhất thiết phải vẽ lại toàn bộ atlas.

Prompt thực tế của mẫu và toàn bộ 44 asset ở [bảng nguồn](README.md). Tái sử dụng phần phong cách/ràng buộc, thay brief chủ thể theo vai trò. Nhóm vocab/state có alpha thật, hạt giấy chỉ nằm trong phần được vẽ; xuất WebP tái sử dụng script có sẵn trong `artwork/illustrations/tools/` chạy từ root repo, tự động `contain` vào 448 × 448 rồi thêm 32 px trong suốt mỗi phía khi xuất khuôn 512 × 512 với quality 82, alphaQuality 100, effort 6. Hiện có đủ **9 asset pilot**, **10 asset mở rộng đợt 2**, **8 asset trích xuất từ atlas đợt 3** và **17 asset Bài 8** (tổng cộng 44 asset production) đã tích hợp vào app; phạm vi kiểm chứng ở handoff SPEC-21.

Atlas Bài 8 cần một lượt sửa layout bằng image_gen để thu nhỏ các nhóm và loại nét giấy rải ngoài silhouette; sau đó mới chốt crop ở rãnh alpha. Đối với tính từ, mô tả rõ ngữ cảnh (nóng/lạnh thời tiết, lạnh khi chạm, mới/cũ đồ vật). Không buộc minh họa các từ trừu tượng hoặc lời hội thoại bằng hình mơ hồ. Kiểm ảnh độc lập rồi gắn đúng nghĩa, giữ ảnh ở mặt sau thẻ.
