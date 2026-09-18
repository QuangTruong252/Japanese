# MaiPace

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Người Việt tự học tiếng Nhật sơ cấp theo Minna no Nihongo, học ngắn trên điện
thoại hoặc tập trung ở máy tính. Ưu tiên nhu cầu cá nhân, thao tác rõ ràng và
giải thích tiếng Việt; chưa mở rộng thành nền tảng lớp học hoặc mạng xã hội.

## Product Purpose

**Học tiếng Nhật theo nhịp của bạn.** MaiPace giúp người học đọc bài, luyện tập
và quay lại ôn kiến thức đến hạn. Mục tiêu dài hạn là học N5/N4, lưu trên máy,
học khi mất mạng và đồng bộ tiến độ an toàn giữa thiết bị.

Thành công là người học biết nên làm gì tiếp theo, hiểu phản hồi và tiếp tục
được nhịp học của mình. Không hứa đạt trình độ trong một số ngày cố định.

## Positioning

- Tự học có hướng dẫn bằng tiếng Việt, nội dung tiếng Nhật là trọng tâm.
- Luyện tập theo bài và ôn theo lịch, khuyến khích học đều mà không gây áp lực.
- Ưu tiên lưu dữ liệu phía người học. Offline toàn ứng dụng và đồng bộ đa thiết
  bị là mục tiêu phải nghiệm thu riêng, không suy ra từ việc đã dùng Dexie.
- Minna no Nihongo là giáo trình tham chiếu; không mô tả MaiPace là sản phẩm
  chính thức hoặc được nhà xuất bản bảo chứng.

## Operating Context

Luồng chính: chọn bài → học → luyện tập → ôn mục đến hạn. Thiết kế cho điện thoại
và máy tính, hỗ trợ chạm, bàn phím và furigana. Audio ZIP, Shadowing, tìm kiếm,
PWA và đồng bộ là các phần của lộ trình, không phải lời quảng bá tính năng đã có.

## Capabilities and Constraints

Trạng thái có ngày và bằng chứng nằm tại [chỉ mục spec](docs/specs/README.md).
Đọc code và handoff tương ứng trước khi tiếp tục; không dùng trang này làm báo
cáo nghiệm thu. Tại lần đối chiếu 18/09/2026:

- Có code màn học N5, năm dạng luyện tập, lịch ôn FSRS và màn ôn/điểm yếu.
  SPEC-04 có báo cáo nghiệm thu trước đó; SPEC-05 có code nhưng chưa có handoff
  nghiệm thu toàn bộ. Xem chỉ mục để phân biệt phạm vi đã kiểm tra.
- Dữ liệu 25 bài N5 đang mang trạng thái chưa xác minh; có dữ liệu không đồng
  nghĩa đã đối chiếu sách. Không gọi nội dung là “chuẩn sách đã kiểm chứng”.
- Supabase có client/server helper; chưa có luồng sync hoàn chỉnh. Shadowing,
  import audio và vỏ PWA chưa được triển khai. N4 là mục tiêu biên tập sau.
- Phiên bản lấy từ package/lockfile. Dexie giữ dữ liệu client; Zustand chỉ giữ
  UI tạm thời; FSRS qua helper hiện có. Quy tắc kỹ thuật ở [AGENTS.md](AGENTS.md).
- Audio nguồn không đưa vào bundle/public/cloud sync. Người học tự nạp audio
  là định hướng kỹ thuật, không phải bảo đảm về quyền sử dụng nội dung.

## Brand Commitments

- **Tên sản phẩm:** MaiPace, viết đúng hoa/thường. Không tự sáng tác nguồn gốc tên.
- **Thông điệp:** “Học tiếng Nhật theo nhịp của bạn.”
- **Hệ thiết kế:** Washi. MaiPace dùng Washi, không đổi tên hệ token thành MaiPace.
- **Giọng văn:** rõ ràng, nhẹ nhàng, tôn trọng. Nút nói việc sẽ làm; lỗi nói vấn đề
  và cách tiếp tục. Ví dụ: “Ôn tập ngay”, “Chưa có dữ liệu ôn tập”. Không dùng
  lời trách móc vì mất streak, xếp hạng hay hứa “thành thạo nhanh chóng”.
- **Màu, chữ và component:** theo [DESIGN.md](DESIGN.md),
  [hướng dẫn thiết kế](docs/design-system.md) và token trong stylesheet hiện có.
  Không tạo bảng token thứ hai ở tài liệu thương hiệu.

### Bộ logo

Tài sản nằm trong [web/public/brand/](web/public/brand/):

| Tệp | Cách dùng |
| --- | --- |
| `maipace-lockup.svg` | Logo kèm tên, trên nền sáng |
| `maipace-lockup-reversed.svg` | Logo kèm tên, trên nền tối |
| `maipace-mark.svg` | Biểu tượng đỏ, trên nền sáng; có thể ghép chữ MaiPace bằng font giao diện |
| `maipace-mark-reversed.svg` | Biểu tượng sáng, trên nền tối hoặc nền đỏ |
| `maipace-mark-monochrome.svg` | Bản một màu trên nền sáng |
| `maipace-app-icon.svg` | Biểu tượng trên nền đỏ cho ứng dụng |
| `logo.png` | Bản phác/tham khảo; không dùng làm ảnh giao diện |

Giữ nguyên tỷ lệ, đường nét và màu các SVG. Chừa khoảng trống ngoài hình tối
thiểu bằng 1/4 chiều cao biểu tượng; biểu tượng trong UI tối thiểu 24px cao.
Logo kèm tên tối thiểu 160px rộng; nếu thiếu chỗ, dùng biểu tượng và chữ thật.
Favicon là ngoại lệ 16–32px, kiểm tra độ rõ thực tế trước khi dùng.
Không kéo méo, cắt hình, thêm gradient, bóng hoặc chuyển động. SVG tài sản có
màu cố định là nguồn nhận diện; component dùng token Washi, không chép mã màu.

Logo cạnh chữ MaiPace dùng alt rỗng để tránh đọc tên hai lần. Logo đứng một mình
cần tên truy cập “MaiPace”; nếu là liên kết về đầu trang, tên phải nêu đích đến.

## Evidence on Hand

- [Chỉ mục spec](docs/specs/README.md): trạng thái, thứ tự triển khai, nguồn kiểm tra.
- [Handoff SPEC-04](docs/handoff/SPEC-04.md): bằng chứng nghiệm thu ngày 17/09/2026;
  không thay thế kiểm tra sau những thay đổi mới.
- [Manifest nội dung](docs/n5-manifest.md): nguồn dữ liệu và phần cần đối chiếu.
- [Đặc tả kiến trúc](docs/project-design-spec.md): thiết kế mong muốn; các sai khác
  đã ghi ở spec chi tiết phải được đọc trước khi triển khai phần liên quan.

## Product Principles

1. Nội dung có nguồn truy vết; chưa đối chiếu thì ghi rõ chưa xác minh.
2. Bảo vệ dữ liệu học; không đánh đổi tính toàn vẹn lấy đường triển khai ngắn hơn.
3. Mỗi màn hình giúp người học chọn hành động tiếp theo, không trang trí gây nhiễu.
4. Tái sử dụng code và thiết kế hiện có, chỉ thêm thứ phục vụ nhu cầu đang làm.

## Accessibility & Inclusion

Yêu cầu thiết kế: furigana ngữ nghĩa, vùng chạm trong luyện tập tối thiểu 48px,
focus rõ, bàn phím, zoom, reduced motion và tương phản phù hợp ở sáng/tối.
Đây là tiêu chí kiểm tra theo từng màn hình, không phải chứng nhận toàn app đã
đạt WCAG hay đã được thử với mọi trình đọc màn hình.
