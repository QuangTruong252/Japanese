# MaiPace — ba hướng UI/UX mới

Ngày: **05/10/2026**. Người dùng ưu tiên **vui, giàu minh họa, dễ tạo hứng học**. Bốn ảnh concept tạo bằng **image_gen tích hợp** được giữ nguyên. Sau phản hồi bản tích hợp chỉ thêm ảnh chưa giống concept, đã dựng lại Bảng tin, hub bài, navigation và trình bày câu hỏi theo **Phố giấy**: nền giấy ấm, cảnh mở ra mép trang, ít hộp, chữ Nhật lớn, desktop hai cột. UI dùng component/dữ liệu thật; ghi nhận và ảnh đối chiếu mới ở [handoff SPEC-21](../docs/handoff/SPEC-21.md).

## Xem ảnh

| Hướng | Ảnh | Màn minh họa |
| --- | --- | --- |
| **01 · Phố giấy Nhật** — khuyến nghị | [Mobile](01-pho-giay-mobile.png) · [Desktop](04-pho-giay-desktop.png) | Bảng tin, Bài 1, trắc nghiệm; Bảng tin desktop |
| **02 · Chuyến tàu bài học** | [Mobile](02-chuyen-tau-mobile.png) | Bảng tin, danh sách bài, sắp xếp câu |
| **03 · Bàn học sáng tạo** | [Mobile](03-ban-hoc-mobile.png) | Bảng tin, Bài 1, mặt trước thẻ từ |

Mỗi ảnh mobile đặt ba màn cạnh nhau để so sánh một hướng xuyên suốt luồng học. Số lượng và tiến độ trong ảnh là **dữ liệu minh họa**, không phải dữ liệu người dùng hoặc kết quả kiểm thử. Prompt đầy đủ và lần sửa ảnh nằm trong [prompts.json](prompts.json).

Quy ước lưu ảnh production và cập nhật tham chiếu dữ liệu đã chốt riêng tại
[SPEC-21](../docs/specs/SPEC-21-illustration-assets.md) ngày 05/10/2026. Thư mục này tiếp tục
giữ ảnh concept. Đã tạo [mẫu phong cách và 9 asset pilot](../artwork/illustrations/README.md)
cho Bảng tin/Bài 1/Bài 2 và trạng thái ôn tập. Schema/tham chiếu JSON, renderer, fallback và cache đã có;
[handoff SPEC-21](../docs/handoff/SPEC-21.md) ghi kiểm chứng và giới hạn. Ảnh lần chỉ thêm asset ở `browser/2026-10-05/`; ảnh sau dựng lại bố cục ở [browser redesign](browser/2026-10-05-redesign/README.md).

## Vì sao giao diện đang thiếu cá tính

Đã đọc `PRODUCT.md`, `DESIGN.md`, token trong `web/src/app/globals.css`, trạng thái spec, SPEC-16/18/19 và code `AppNav`, `DashboardContent`, helper quyết định CTA, luồng học từ vựng. Đã xem ảnh hiện trạng trong `docs/research/ux-mobile-2026-10/shots/` và nghiên cứu giả lập ngày 01/10. Đây là đối chiếu code và ảnh có sẵn, chưa phải khảo sát người dùng thật hay kiểm tra browser mới.

Quan sát chính: nhiều khối cùng nền trắng, cùng viền, cùng dạng bo góc và cùng cách đặt tiêu đề. Màn tổng quan truyền đạt thao tác nhưng chưa có một chi tiết thị giác khiến người học nhớ đến MaiPace. Tăng màu cho từng thẻ sẽ khó giải quyết sự đều nhau này. Nên thay nhịp bố cục, bổ sung minh họa có chủ đích và làm nội dung tiếng Nhật nổi bật hơn.

## 01 · Phố giấy Nhật

**Ý tưởng:** mở MaiPace như mở một trang truyện minh họa về đời sống Nhật. Một góc phố nhỏ, con người, cửa tiệm và cây xanh tạo cảm giác ấm áp; phía dưới là việc học hôm nay, được trình bày rõ và ngắn.

**UI:** cảnh minh họa nối vào nền giấy; phần nội dung dùng khoảng trắng và đường phân cách, tránh mọi mục đều thành một hộp lớn. Tên bài và chữ Nhật có trọng lượng khác nhau rõ rệt. Cảnh chào hỏi ở Bài 1 hỗ trợ chủ đề giới thiệu bản thân. Desktop dùng bố cục rộng với hành động chính ở cột lớn và nội dung củng cố ở cột phụ.

**UX:** Bảng tin giữ một việc ưu tiên theo dữ liệu thật. Khi có mục đến hạn, nút là “Bắt đầu ôn”; phiên đang dở hiện ngay dưới nút; bài đang học nằm tiếp theo. Khi hết mục đến hạn, cùng vùng này chuyển sang tiếp tục phiên hoặc học bài theo helper hiện có. Minh họa không trở thành một bản đồ cần khám phá mới vào được bài.

**Chi tiết tạo hứng:** cảnh của từng bài gắn với chủ đề: người chào nhau, đồ dùng, nơi chốn. Khi hoàn thành một lượt, có thể xuất hiện một hình nhỏ và lời “Bạn đã học xong lượt này”; không tạo vật phẩm, streak hoặc hệ thưởng mới. [Asset trạng thái riêng](../web/public/assets/illustrations/ui/states/review-complete-v1.webp) hiện dùng ở trang Ôn khi không còn mục đến hạn/mới; nhánh hạn mức vẫn giữ thông báo thực của nó.

**Rủi ro:** phong cảnh quá cao sẽ đẩy nút và phiên dở xuống dưới. Khi làm bản thật, giới hạn vùng minh họa tổng quan khoảng một phần tư viewport; trong phiên làm bài chỉ giữ một chi tiết nhỏ ở mép. Nên dùng nét vẽ và bảng màu nhất quán, không mỗi bài một phong cách.

## 02 · Chuyến tàu bài học

**Ý tưởng:** 25 bài là một tuyến học, mỗi bài được trình bày như một điểm dừng trong thời khóa biểu. Đây là ẩn dụ giúp quét danh sách bài, không phải tuyến địa lý hoặc màn chơi.

**UI:** số bài lớn, trục dọc liên tục, các hàng có tên bài, nội dung Nhật, tiến độ và lối vào. Thẻ phiên dở mang nét vé tàu nhẹ; minh họa đầu màn có đoàn tàu nhỏ. Màn sắp xếp câu dùng một vùng đáp án rõ ràng và các token dễ chạm.

**UX:** bài đang học ở đầu; bộ lọc “Tất cả / Đang học / Chưa học” vẫn hiển thị. Mọi bài đều mở được. Trục tuyến phải đi kèm danh sách văn bản dùng được bằng bàn phím và screen reader. Chọn bài không đánh dấu đã học. Với 25 bài, dùng danh sách dọc; tránh một đường uốn lượn dài hoặc bắt người học kéo ngang để tìm bài.

**Chi tiết tạo hứng:** minh họa điểm dừng phản ánh chủ đề bài. Có thể chuyển dấu chỉ bài đang xem rất ngắn khi người học mở một bài, không cho tàu chạy liên tục. Trạng thái “đang học” phải đọc được bằng chữ, không chỉ bằng vị trí tàu.

**Rủi ro:** dễ biến thành trò chơi khóa màn hoặc bản đồ rối. Giữ số bài và bộ lọc làm công cụ chính; tuyến là cách tổ chức hình ảnh. Ảnh đã được sửa để bỏ lời hứa tải bài học ngoại tuyến do công cụ tự thêm và giảm cảnh trang trí trong màn làm bài.

## 03 · Bàn học sáng tạo

**Ý tưởng:** một góc học cá nhân với sổ, bút, tách trà và nét vẽ nhỏ. Hợp với người thích giao diện vui nhưng muốn ngồi học lâu trong không gian yên tĩnh.

**UI:** bố cục bất đối xứng nhẹ, nhãn trang, đường kẻ sổ và minh họa đồ vật. Chữ Nhật lớn trở thành tâm điểm. Tạo sự khác nhau giữa vùng lời chào, vùng việc tiếp theo và các hàng tham khảo; tránh biến nút thành đồ vật giả phải đoán cách dùng.

**UX:** bài học đưa “Học từ vựng” lên trước các lối Ngữ pháp, Nghe và toàn bộ bài. Mặt trước thẻ từ giữ nghĩa ẩn, cho phép nghe phát âm rồi bấm “Hiện nghĩa”. Sau khi lật, từ Nhật vẫn hiện cùng nghĩa và ví dụ, rồi mới xuất hiện bốn nút đánh giá theo logic hiện có. Minh họa gợi nghĩa nên để mặt sau; mặt trước ưu tiên nhớ chủ động và chỉ dùng trang trí trung tính.

**Chi tiết tạo hứng:** dấu hoàn thành như một nét đánh dấu nhỏ trên trang; chuyển thẻ ngắn, có thể tắt theo reduced motion. Không ép người học vuốt để thực hiện thao tác: luôn có nút rõ ràng.

**Rủi ro:** nếu lạm dụng nhãn giấy, chữ viết tay hoặc sticker thì nội dung trở nên khó quét. UI tiếp tục dùng Inter và Noto Sans JP/Hiragino như hiện có; nét thủ công chỉ thuộc ảnh minh họa.

## Hướng nên chọn

Tôi khuyến nghị **Phố giấy Nhật** làm ngôn ngữ minh họa chính. Nó phù hợp nhất với lựa chọn vui và giàu minh họa, đồng thời cho phép màn làm bài vẫn tập trung. Có thể lấy cách tổ chức danh sách có số bài rõ của Chuyến tàu và tính tiết chế của Bàn học, nhưng toàn bộ ảnh của app nên dùng cùng một phong cách vẽ.

Phạm vi nguyên mẫu đầu tiên nên là **Bảng tin → Bài 1 → Học từ/Làm bài → Kết quả** trên mobile 390px, sau đó mở rộng desktop. Chưa cần thay tất cả màn cùng lúc. Tra cứu, Cài đặt và Thống kê tiếp tục ưu tiên khả năng đọc và thao tác, chỉ nhận các chi tiết nhận diện chung.

## Những điểm phải giữ khi chuyển thành UI thật

| Tình huống | Cách thể hiện đề xuất |
| --- | --- |
| Người mới | Nút “Bắt đầu Bài 1”, cảnh chào hỏi; Kana là lối phụ, không chặn vào bài; không yêu cầu tài khoản |
| Có mục đến hạn | Một nút “Bắt đầu ôn”; số đến hạn, số mới và thời gian từ nguồn thật; phiên dở ở ngay dưới |
| Không đến hạn, có phiên dở | Nút chính “Tiếp tục” với bài và vị trí đang dở; giữ quy tắc ưu tiên nháp hiện có |
| Đã ôn xong | Lời xác nhận ngắn và hành động học tiếp; không gây áp lực học thêm |
| Chưa có audio | Nhãn rõ và lối “Nạp audio” quay lại đúng bài; từ vựng/ngữ pháp vẫn dùng được |
| Đang tải / lỗi | Placeholder đúng chiều cao; lỗi có lời giải và thử lại; không để minh họa giả thành dữ liệu đã tải |
| Mất mạng trong tab đang mở | Thông báo dữ liệu lưu trên máy; tiếp tục học theo khả năng hiện có; không hứa reload offline |
| Đồng bộ chờ / lỗi | Icon và chữ tương ứng trạng thái thực; không hiển thị “Đã đồng bộ” chỉ vì đã lưu cục bộ |
| Chữ lớn / mobile thấp | Thu gọn hoặc ẩn minh họa trước, giữ nội dung và nút; không cắt đề để ép vừa màn |
| Bàn phím / reduced motion | Focus rõ, thứ tự thao tác chuẩn, nút thay thế gesture; không chuyển động liên tục |

Giữ năm đích điều hướng hiện hành; dock ẩn trong phiên học/luyện/ôn. Nút trong luồng học tối thiểu 48px, chừa safe area và khoảng dock. Furigana phải dùng `Furigana`/native ruby, không đặt chữ đọc bằng overlay. Không đưa chữ hoặc nút trong ảnh vào app như một ảnh giao diện nguyên khối.

## Giới hạn của ảnh và cách bàn giao

Ảnh tạo sinh là **minh họa hướng thiết kế**, không phải hợp đồng token hoặc prototype tương tác. Công cụ có thể thêm màu cảnh vật, bóng nhẹ, icon chưa đúng bộ, avatar giả, kích thước chữ hoặc trạng thái nút lệch Washi. Khi triển khai phải dựng lại chữ, nút, bố cục bằng component thật và dùng logo SVG hiện có; avatar chỉ xuất hiện khi có dữ liệu tài khoản thật.

Ở concept Phố giấy, nút “Học từ vựng” được công cụ vẽ như vùng nhấn có nền nhạt; bản thật cần đưa nó về một CTA primary rõ. Các vạch tiến độ đỏ và icon màu trong ảnh cũng phải đối chiếu lại vai trò token. Ảnh Bàn học có thể gợi nghĩa từ qua hình; khi triển khai thẻ front, giữ hình gợi nghĩa ở mặt sau.

Nếu chọn hướng minh họa nhiều màu ngoài Washi, đó là quyết định cần chốt rõ về phạm vi **ảnh minh họa**; màu UI vẫn lấy từ token. Nếu thay đổi luật toàn cục về type, surface hoặc hành vi thì cập nhật có chủ đích `DESIGN.md` và SPEC liên quan cùng đợt triển khai. Bộ đề xuất này không sửa các nguồn đó và không đánh dấu feature hoàn tất.

Prompt gốc được lưu để tái tạo. Ảnh concept không dùng thay asset production: sau khi chọn hướng, tạo riêng từng cảnh và cutout, kiểm tra tính nhất quán, xuất kích thước phù hợp và đặt text/controls thật phía trên. Không thêm dependency để chạy bộ ảnh này.

## Kiểm chứng trong phiên

- Đã xem trực tiếp bốn ảnh đầu ra. Sửa một lần concept Chuyến tàu để bỏ claim ngoại tuyến sai và giảm minh họa trong phiên làm bài; sửa một lần Bàn học để bỏ nhãn tải bài giả, bỏ icon bookmark/menu giả và bỏ hình gợi nghĩa ở mặt trước thẻ từ.
- Kiểm tra đủ 4 file PNG, kích thước, prompt nhúng trong từng ảnh và các liên kết tài liệu: PASS. Chi tiết file và hash tại [verification.json](verification.json).
- `pnpm check` trong `web/`: PASS ngày 05/10/2026 (TypeScript + ESLint). Không chạy test/build vì không đổi logic hay cấu hình ứng dụng.
- Bộ này không sửa code ứng dụng. Chưa chạy nghiệm thu browser, accessibility thực tế, offline hoặc sync cho UI đề xuất; ảnh không chứng minh các tiêu chí đó.
- Bước tiếp theo: chọn một hướng, dựng prototype với dữ liệu và component hiện có, rồi kiểm 390px/desktop, keyboard, font lớn, furigana, dark mode và reduced motion.
