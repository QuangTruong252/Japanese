# Đề xuất luồng học MaiPace trên mobile

Ngày: 27/09/2026. Trạng thái: **bản thiết kế để duyệt**, chưa cập nhật `DESIGN.md`, SPEC hoặc code.

Kế hoạch triển khai chi tiết đã tách thành [kế hoạch tổng](../../plans/2026-09-27-ux-redesign.md) và SPEC-16–20; ảnh bên dưới vẫn chỉ là concept.

Nguồn đối chiếu: `PRODUCT.md`, `DESIGN.md`, `docs/specs/README.md`, code trên `master` và phiên duyệt `localhost:3000` ở 390px/1280px ngày 27/09/2026. [Ảnh luồng học](maipace-mobile-flow-concept.png) và [ảnh Profile khách/đã đăng nhập](maipace-profile-concept.png) dùng dữ liệu giả định (Bài 6, 12 mục đến hạn); hình thể hiện thứ bậc và đường đi, không phải giao diện đã triển khai hay đặc tả pixel.

## Mục tiêu

- Người mới biết bắt đầu học ở đâu; người quay lại thấy đúng việc tiếp theo.
- Tra cứu từ, Kana, Kanji và động từ có tên và lối vào dễ đoán.
- Từ trang Luyện tập, có thể bắt đầu phiên theo bài đang học bằng một hành động; tùy chỉnh vẫn có sẵn.
- Giữ lịch ôn FSRS, dữ liệu Dexie và trạng thái đồng bộ đúng ngữ nghĩa hiện tại.

## Kiến trúc thông tin đề xuất

| Vị trí | Đích | Lý do |
| --- | --- | --- |
| Dock 1 | Bảng tin | Việc nên làm tiếp theo và học tiếp |
| Dock 2 | Học | Bài đang học, danh sách bài, các hoạt động trong bài |
| Dock 3 | Luyện | Phiên nhanh theo bài đang học, sau đó mới tùy chỉnh |
| Dock 4 | Ôn | Mục đến hạn theo lịch; Điểm yếu là lối phụ riêng |
| Dock 5 | Tra cứu | Tìm trực tiếp và duyệt Kana, Kanji, động từ, bảng tham chiếu |

**Profile/tiến độ/thống kê** ở `/ca-nhan`, mở từ một lối tài khoản riêng ngoài dock. “Xem tiến độ” ở Bảng tin và vùng tiến độ ở Học đều dẫn vào đó. **Cài đặt** là lối phụ trong Profile. **Audio import** ở Cài đặt và được dẫn theo ngữ cảnh từ mục Nghe khi chưa có audio. Tìm kiếm nội dung có lối vào ở Tra cứu và các trang bài phù hợp; kết quả còn nhận tên tính năng/đích điều hướng (ví dụ “Tra cứu”, “Bảng Kana”), không chỉ dữ liệu học.

Đề xuất thay mục thứ năm, thêm Profile và đổi đường vào Thống kê **thay đổi hợp đồng** ở `DESIGN.md` §Navigation, SPEC-02, SPEC-07 và SPEC-08; chỉ cập nhật các nguồn đó khi quyết định này được duyệt. Không tạo một mục “Thêm” chứa mọi tính năng.

### Lối vào Profile khi dock đã đủ năm mục

| Ngữ cảnh | Lối vào | Trạng thái hiển thị |
| --- | --- | --- |
| Mobile: năm màn chính | Nút có icon người và nhãn **“Tài khoản”** ở góc phải header trang; sau đăng nhập icon thành avatar nhưng giữ nhãn | Luôn cùng vị trí và cùng tên; bỏ nút đổi giao diện khỏi header để nhường chỗ |
| Desktop | Khối avatar/tài khoản ở cuối sidebar hiện có | Nhấn mở Profile, không thêm mục thứ sáu vào danh sách chính |
| Phiên làm bài hoặc flashcard toàn màn | Không ép thêm header; dùng lối thoát/lưu nháp để trở về màn chính | Tránh chạm nhầm hoặc rời phiên |

`/ca-nhan` là **một địa chỉ với hai trạng thái**, không phải hai bộ tiến độ:

1. **Chưa đăng nhập:** tiêu đề “Tiến độ trên máy này”, thống kê cục bộ đọc từ Dexie, và một khối “Đăng nhập bằng Google để đồng bộ giữa thiết bị”. Người học vẫn xem được tiến độ và biểu đồ; không bị khóa nội dung sau nút đăng nhập. Nếu Supabase chưa được cấu hình, nói rõ đồng bộ chưa khả dụng thay vì hiện CTA đăng nhập không hoạt động.
2. **Đã đăng nhập:** avatar/tên tài khoản, trạng thái đồng bộ có nhãn chữ; phần **Tiến độ** (bài đang học, nội dung đã học, lịch ôn) và phần **Thống kê** (biểu đồ/lịch sử từ SPEC-07) nằm trong Profile. Trên mobile dùng hai tab nội bộ “Tiến độ” và “Thống kê” để tránh một trang dài; tab là URL truy cập được (`/ca-nhan` và `/ca-nhan/thong-ke`).
3. **Cài đặt & dữ liệu** là một hàng liên kết từ Profile tới `/cai-dat`. Đăng xuất nằm trong nhóm tài khoản; sau đăng xuất vẫn giữ tiến độ trên máy theo chính sách hiện có. Đổi sang tài khoản khác vẫn phải đi qua cảnh báo sở hữu dữ liệu ở SPEC-08, không tự gộp.

Đường `/thong-ke` hiện có cần chuyển hướng tới `/ca-nhan/thong-ke` khi triển khai để bookmark và liên kết cũ còn dùng được. Profile chỉ đọc dữ liệu học từ Dexie (`useLiveQuery`/helper thống kê hiện có), không tạo bản sao tiến độ trong auth state hoặc Zustand. Đăng nhập chỉ thêm khả năng đồng bộ, không phải điều kiện để học hay xem thống kê.

## Luồng người học

### 1. Mở app và tiếp tục

1. Có mục đến hạn: Bảng tin hiển thị **Bắt đầu ôn** là hành động chính, số mục và ước lượng thời gian khi có đủ dữ liệu. Bài đang học nằm ở hàng phụ.
2. Không có mục đến hạn: hành động chính là **Tiếp tục học Bài N**, đến đúng hoạt động đang dở; nếu chưa học gì là **Bắt đầu Bài 1**.
3. Có nháp phiên Luyện tập hoặc thẻ từ vựng: hiển thị **Tiếp tục phiên** ở đúng khu vực và không tự ghi đè nháp. Bảng tin có thể dẫn tới nháp nếu đó là việc người học vừa bỏ dở.
4. Người mới chưa biết Kana có lối “Xem bảng Kana” phụ, không cản đường vào Bài 1.

### 2. Học một bài

`Học → Bài N → Học 10 từ / Ngữ pháp / Nghe / Xem toàn bộ bài`

- Bài học là một hub ngắn. Khi chưa có tiến độ, **Học 10 từ** là hành động chính; khi đã có nháp, **Tiếp tục học từ vựng** thay thế. Con số 10 là mặc định hiện có, không khóa lựa chọn của người học.
- Từ vựng, Ngữ pháp và Nghe là ba đường rõ ràng. “Xem toàn bộ bài” giữ trang tham khảo đầy đủ để đọc hoặc tra lại.
- Luyện tập theo bài là hành động phụ sau khi đã thấy lối học; đường dẫn truyền bài được chọn sang Luyện tập.
- Nếu chưa nạp audio, mục Nghe giải thích trạng thái và mở trực tiếp trang nạp audio, sau đó quay lại bài đang xem. Không dùng duration như xác thực gói audio.

### 3. Luyện tập nhanh

`Luyện → [Tiếp tục nháp nếu có] → Sẵn sàng luyện Bài N → Bắt đầu N câu`

- Lần đầu chọn bài đang học, các dạng có câu hợp lệ và số câu mặc định; chỉ hiển thị số câu **thực sự có thể tạo**. Sau này dùng preset đã lưu.
- Nút **Bắt đầu N câu** nằm trong màn đầu. “Tùy chỉnh” mở chọn bài, dạng và số câu; khi mở vẫn giữ các kiểm tra dạng 0 câu, TTS và số câu phù hợp hiện có.
- Nếu người học đi từ Bài N, cấu hình nhận Bài N. Nếu có nháp, **Tiếp tục phiên** được ưu tiên hơn bắt đầu phiên mới; tạo phiên mới cần quyết định rõ về nháp cũ.
- Sau kết quả: “Làm lại câu sai”, “Về bài”, “Luyện tiếp” là các đích rõ; giữ logic chấm hiện có.

### 4. Ôn tập theo lịch

`Ôn → Bắt đầu lô đến hạn → Chấm → Kết quả → Ôn lô tiếp / Về Bảng tin`

- Số mục trên Bảng tin, badge dock và trang Ôn dùng cùng hàng đợi. Giữ giới hạn lô và mục mới hiện có.
- **Điểm yếu của tôi** là lối phụ để xem/luyện thêm. Không tự trộn mục yếu chưa đến hạn vào hàng đợi FSRS và không tự đổi rating.
- Khi chưa có mục, giải thích vì sao và dẫn về bài đang học; khi hoàn tất lô mà còn mục đến hạn, cho hành động một chạm sang lô tiếp.

### 5. Tra cứu trong lúc học

`Tra cứu → nhập từ/Kanji/romaji/tiếng Việt hoặc chọn danh mục → trang chi tiết → Quay về nơi vừa học`

- Dock cho phép vào Tra cứu từ mọi màn chính bằng một chạm. Trang đầu có ô tìm kiếm và bốn danh mục: Kana, Kanji, Động từ, Bảng tham chiếu.
- Tìm kiếm toàn cục trả cả nội dung và đích điều hướng. Nhãn phân biệt “Tìm nội dung tiếng Nhật” với “Lọc bài học” ở danh sách bài.
- Từ ví dụ, câu hỏi hoặc thẻ học có thể mở chi tiết liên quan; quay lại giữ câu hỏi/thẻ và vị trí trước đó.

## Quy tắc xuyên màn

- Dock có icon **và nhãn chữ** ở mọi bề rộng mobile, vùng chạm tối thiểu 48px; ẩn trong phiên cần tập trung, với lối thoát/lưu nháp rõ.
- Một hành động chính trên mỗi màn. Trạng thái mới, có tiến độ, nháp, rỗng, thiếu audio và mất mạng cần copy/hành động riêng.
- Nội dung Dexie tiếp tục đọc theo `useLiveQuery`; ghi học tập và `pendingSync` cùng transaction. Không thay đổi thuật toán ôn hoặc chính sách xung đột trong bản thiết kế này.
- Offline trong trang đã mở: học/ôn/luyện tiếp khi dữ liệu đã sẵn có; không hứa tải lại toàn app khi mất mạng vì SPEC-14 không có service worker.
- Giữ chữ Nhật và furigana theo parser/component hiện có; hỗ trợ bàn phím, focus, zoom, tương phản và reduced motion ở màn thật khi triển khai.

## Kiểm tra khi triển khai

| Tình huống | Kỳ vọng |
| --- | --- |
| Từ Bảng tin tìm Kanji | Tra cứu ở dock một chạm; Kanji ở trang Tra cứu thêm một chạm |
| Từ bất kỳ màn chính mở Profile | Nút tài khoản cùng vị trí ở header; desktop dùng cuối sidebar |
| Người chưa đăng nhập mở Profile | Vẫn xem tiến độ/thống kê trên máy; CTA Google chỉ nói lợi ích đồng bộ |
| Người đã đăng nhập mở Profile | Thấy tài khoản, trạng thái đồng bộ, Tiến độ và Thống kê trong cùng khu vực |
| Mở link `/thong-ke` cũ | Đến đúng tab Thống kê trong Profile |
| Gõ “tra cứu” hoặc “kana” vào tìm kiếm | Có kết quả dẫn đến đúng tính năng bên cạnh kết quả nội dung |
| Mở Luyện với Bài N đang học | Có thể bắt đầu phiên hợp lệ ngay trên màn đầu, không cuộn qua 25 bài |
| Mở Bài N lần đầu | Hành động học trước hành động luyện; trang tham khảo vẫn truy cập được |
| Có nháp học/luyện | Resume giữ vị trí và không âm thầm thay bằng phiên mới |
| Mất mạng giữa phiên đã mở | Vẫn hoàn thành và lưu cục bộ; đồng bộ retry khi reconnect |
| 390px và 1280px | Không che nội dung/nút, nhãn nav rõ, focus và safe area đúng |

## Phần chưa chốt

- Thứ tự ưu tiên giữa nháp Luyện tập và lô Ôn đến hạn trên Bảng tin khi cả hai cùng tồn tại. Đề xuất: mục đến hạn là hành động chính, nháp là hàng phụ nổi bật; cần thử với người học thật.
- Mẫu header tài khoản/tìm kiếm trên trang chi tiết và ở trạng thái cuộn; năm màn chính giữ lối tài khoản cùng vị trí như bảng trên.
- Bản desktop cần giữ cùng năm đích và sidebar tương ứng; ảnh dưới đây chỉ minh họa mobile.

Chưa sửa code, spec hay dữ liệu; chưa có nghiệm thu hành vi của thiết kế mới.
