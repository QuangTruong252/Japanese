# Kế hoạch cập nhật luồng UI/UX MaiPace

Ngày: 27/09/2026. Trạng thái: **kế hoạch triển khai, chưa sửa ứng dụng**. Phạm vi: N5 trên web mobile và desktop; giữ Washi, Dexie, FSRS và hợp đồng sync hiện có.

## 1. Căn cứ và kết quả cần đạt

- Nguồn sự thật: [PRODUCT](../../PRODUCT.md) → [DESIGN](../../DESIGN.md) → [token chạy thật](../../web/src/app/globals.css) → SPEC hiện hành → code và handoff có ngày. [Bản đề xuất luồng](../research/ux-redesign/2026-09-27-mobile-learning-flows.md) cùng hai ảnh là minh họa định hướng, chưa phải giao diện đã duyệt theo pixel.
- Quan sát tại `localhost:3000` ngày 27/09 ở 390px và 1280px: Tra cứu nằm dưới Học và tìm “tra cứu” không chỉ đến tính năng; màn Luyện đòi cuộn qua danh sách 25 bài trước nút bắt đầu; bài học ưu tiên Luyện hơn Học từ; Thống kê chiếm mục dock thứ năm, còn đăng nhập/tiến độ không có một lối rõ trên mọi màn chính.
- Kết quả: người mới tới được hoạt động học Bài 1; người quay lại tiếp tục việc hợp lệ; Tra cứu có lối một chạm; Profile chứa tiến độ/thống kê cục bộ cho cả khách và người đăng nhập; đăng nhập phục vụ đồng bộ, không khóa học.

## 2. Kiến trúc thông tin đích

| Khu vực | Đích / hành động | Quy tắc |
| --- | --- | --- |
| Dock/sidebar | `Bảng tin · Học · Luyện · Ôn · Tra cứu` | Năm đích chính; nhãn chữ luôn thấy trên mobile; mục active theo đích thực, kể cả route Tra cứu lồng trong `/hoc` |
| Tài khoản | `/ca-nhan` | Nút “Tài khoản” ở header năm màn chính dưới `lg`; avatar sau đăng nhập nhưng giữ nhãn; desktop ở chân sidebar |
| Profile | `/ca-nhan`, `/ca-nhan/thong-ke` | Hai tab URL: Tiến độ và Thống kê; khách thấy dữ liệu trên máy; `/thong-ke` cũ chuyển hướng vào tab thống kê |
| Tiện ích | `/cai-dat`, `/cai-dat/audio` | Liên kết từ Profile và ngữ cảnh cần audio; không thành mục dock |
| Tra cứu | `/hoc/tra-cuu` và các route con hiện có | Giữ URL để bảo toàn bookmark; dock trỏ thẳng vào hub này |
| Tìm kiếm | Hộp thoại hiện có | Thêm nhóm “Tính năng” cho đích điều hướng; vẫn trả kết quả nội dung |

**Thay đổi hợp đồng có chủ đích:** ở giai đoạn 1 sửa `DESIGN.md` §Navigation, rồi đồng bộ SPEC-02, SPEC-07, SPEC-08: mục thứ năm thành Tra cứu; tài khoản ở header của năm màn chính; Profile sở hữu Tiến độ/Thống kê. Không sửa `DESIGN.md` trong bản kế hoạch này, vì code vẫn đang chạy hợp đồng cũ. Các spec mới dưới đây là delta dự kiến; khi triển khai phải giải quyết mâu thuẫn với spec cũ trong cùng thay đổi.

## 3. Thứ tự triển khai

| Mốc | Spec và phạm vi có thể giao riêng | Phụ thuộc, điểm dừng | Bằng chứng cần có |
| --- | --- | --- | --- |
| 0 | Chuẩn bị: chụp baseline 390/1280, kiểm tra route/link và dữ liệu khách/đăng nhập, xác nhận server đúng project | Chỉ đọc. Ghi các kết quả thực, không dùng ảnh concept làm baseline | Danh sách hành trình hiện tại, trạng thái Git, ảnh/screen recording nếu cần |
| 1 | [SPEC-16: Điều hướng, Profile](../specs/SPEC-16-dieu-huong-profile.md) | Profile và tab Thống kê truy cập được **trước** khi bỏ Thống kê khỏi dock; sau đó chuyển mục 5 sang Tra cứu | Guest/login/unconfigured, deep link `/thong-ke`, active nav, mobile/desktop, back/forward |
| 2 | [SPEC-17: Tra cứu và tìm kiếm](../specs/SPEC-17-tra-cuu-tim-kiem.md) | Dùng nav mới; giữ route và chỉ mục nội dung | Từ dock đến Kanji/Kana, truy vấn “tra cứu”, “kana”, kết quả nội dung, focus/keyboard |
| 3 | [SPEC-18: Bảng tin và Học](../specs/SPEC-18-bang-tin-va-hoc.md) | Profile đã có đích cho “Xem tiến độ”; giữ deep link bài | Người mới, quay lại, nháp từ vựng, bài chưa audio, anchor tìm kiếm |
| 4 | [SPEC-19: Luyện tập nhanh](../specs/SPEC-19-luyen-tap-nhanh.md) | Có khái niệm bài đang học từ mốc 3; độc lập với nâng cấp Ôn | Một hành động để bắt đầu cấu hình hợp lệ, nháp không bị ghi đè, 5 dạng bài |
| 5 | [SPEC-20: Ôn tập](../specs/SPEC-20-on-tap-tiep-noi.md) | Giữ hàng đợi FSRS; có thể chuẩn bị song song nhưng nghiệm thu sau mốc 3–4 để kiểm tra hành trình toàn vòng | Số đến hạn đồng nhất, lô tiếp, điểm yếu tách riêng, offline/reconnect |
| 6 | Nghiệm thu hành trình ngang và cập nhật handoff | Chỉ sau khi từng mốc đạt gate; sửa lỗi liên màn trước khi coi UX mới hoàn tất | 390px/1280px, light/dark, keyboard, reduced motion, dữ liệu rỗng/đầy, auth/sync |

Mỗi mốc là một thay đổi nhỏ có thể xem lại và bàn giao riêng; không cần đợi toàn bộ mốc mới được dùng các cải thiện trước đó. Nếu một gate chưa đạt, giữ route cũ/lối vào cũ cho tới khi phần thay thế hoạt động.

## 4. Quyết định luồng cần giữ xuyên suốt

1. **Thứ tự Bảng tin:** có mục đến hạn thì “Bắt đầu ôn” là CTA chính; nháp Luyện/Học là hàng phụ rõ ràng. Không có mục đến hạn thì CTA là học tiếp hoặc bắt đầu Bài 1. Đây là giả thuyết UX cần thử với người học trong mốc 6; nếu nháp bị bỏ sót, điều chỉnh thứ bậc trong SPEC-18, không đổi FSRS.
2. **Bài học:** `/hoc/[so]` trở thành phần mở đầu dạng hub, cho “Học/tiếp tục từ vựng”, “Ngữ pháp”, “Nghe”, “Xem toàn bộ bài”. Nội dung tham khảo đầy đủ vẫn nằm dưới trên cùng URL ở giai đoạn này; các `#vocab-*`, `#grammar-*`, `#tu-vung`, `#ngu-phap`, `#nghe` vẫn tới nội dung thật. Tránh chuyển route tham khảo làm hỏng kết quả tìm kiếm/bookmark. Chỉ tách route sau nếu kiểm tra sử dụng chứng minh cần thiết.
3. **Luyện:** preset bài/dạng/số câu hiện có vẫn là cấu hình; hiển thị tóm tắt ở đầu trang với số câu có thể tạo thực tế, nháp ưu tiên. “Tùy chỉnh” mở các điều khiển hiện có; không đổi máy sinh/chấm câu.
4. **Ôn:** dùng `use-due-queue.ts` và `fsrs.ts`; không nhập “Điểm yếu” vào lô đến hạn và không thay rating. Dữ liệu offline tiếp tục lưu trong tab đã mở; không hứa reload offline khi không có service worker.
5. **Account:** Profile đọc dữ liệu học cục bộ bằng Dexie/`useLiveQuery`, dùng helper `stats.ts` và trạng thái sync hiện có. Không tạo bản sao tiến độ trong Zustand/Supabase render path. Luồng đổi tài khoản, pending sync và đăng xuất giữ chính sách SPEC-08.

## 5. Bản đồ thay đổi dự kiến

| Mốc | File/đường dẫn trọng tâm | Điều chỉnh tài liệu nguồn |
| --- | --- | --- |
| 1 | `web/src/components/AppNav.tsx`, `DashboardContent.tsx`, header năm màn chính; tạo `/ca-nhan` và `/ca-nhan/thong-ke`; tái sử dụng `thong-ke/page.tsx`, `stats.ts`, `SyncBadge.tsx`, auth trong `cai-dat/page.tsx`; chuyển hướng `/thong-ke` | `DESIGN.md` §Navigation và mapping; SPEC-02/07/08, handoff SPEC-16 |
| 2 | `hoc/tra-cuu/page.tsx`, `search.ts`, `SearchDialog.tsx`, `SearchTrigger.tsx`, điều kiện active trong `AppNav.tsx` | SPEC-12/13, handoff SPEC-17 |
| 3 | `DashboardContent.tsx`, `LessonGrid.tsx`, `hoc/[so]/page.tsx`, `hoc/[so]/tu-vung`, `LessonProgress.tsx`, liên kết audio | SPEC-02/03/15 và phần ngữ cảnh SPEC-09/10, handoff SPEC-18 |
| 4 | `luyen-tap/page.tsx`, `PracticeDraftBanner.tsx`, liên kết từ bài/Bảng tin, `practice.ts`, `filter.ts`, `settings.ts` nếu cần cho preview | SPEC-04, handoff SPEC-19 |
| 5 | `on-tap/page.tsx`, `on-tap/phien/page.tsx`, `on-tap/diem-yeu`, `use-due-queue.ts`, Bảng tin badge | SPEC-05/02, handoff SPEC-20 |

Danh sách là điểm bắt đầu theo code 27/09, không phải lệnh phải sửa tất cả file. Trước mỗi mốc đọc docs Next.js tương ứng trong `web/node_modules/next/dist/docs/`, kiểm tra Git status/code, rồi chọn thay đổi nhỏ nhất.

## 6. Gate nghiệm thu cho từng mốc

- **Tĩnh:** chạy `pnpm check` trong `web/` sau code; nếu đổi logic, chạy `pnpm test` và thêm hồi quy có ý nghĩa; `pnpm build` khi đổi route/build/config. Không gọi gate tĩnh là nghiệm thu UI.
- **Browser:** xác nhận dev server đúng MaiPace trên `localhost:3000`; thử ở 390px và 1280px, mobile dock/safe area, keyboard/focus, light/dark, zoom/reduced motion; kiểm tra trạng thái loading, empty, lỗi. Không dừng hoặc restart server người dùng.
- **Dữ liệu:** với thay đổi ghi/sync, thử lưu cục bộ khi mất mạng trong tab đã mở, reconnect/retry, duplicate và đổi tài khoản theo SPEC-08. Học/Luyện/Ôn phải giữ nháp/tiến độ; không thay đổi RLS, `pendingSync` hay FSRS chỉ vì sửa UI.
- **Hành trình:** người mới `Bảng tin → Bài 1 → Học từ → Luyện → Ôn`; người quay lại `Bảng tin → việc tiếp → Profile`; tra Kanji giữa phiên rồi trở về đúng trạng thái; khách xem Thống kê; người đăng nhập thấy sync; link cũ vẫn dùng được.
- **Handoff:** mỗi mốc cập nhật spec cũ liên quan, hàng trạng thái trong `docs/specs/README.md`, `docs/handoff/SPEC-xx.md` với ngày, route/viewport, kiểm tra thực chạy và phần chưa chứng minh. Chỉ đánh dấu hoàn tất sau nghiệm thu browser tương ứng.

## 7. Rủi ro và giới hạn hiện tại

- `/hoc/tra-cuu` lồng trong `/hoc` khiến kiểm tra active bằng prefix nhận nhầm Học; mốc 1 phải ưu tiên match Tra cứu trước Học ở mọi route con.
- Chuyển trang Thống kê phải bảo toàn URL cũ và nội dung; cần tránh hai bản biểu đồ/logic khác nhau.
- Header tài khoản ở 390px phải cùng vị trí trên năm màn, có nhãn và vùng chạm phù hợp, không chen vào phiên toàn màn. Năm màn chính có thể cần một pattern header chung; chỉ tạo shared component khi lặp thực tế rõ ràng.
- Supabase thật nhiều thiết bị và PWA standalone chưa được kiểm chứng trong baseline. Gate UI có thể kiểm trạng thái cấu hình/khách; không suy ra sync đa thiết bị thành công nếu thiếu môi trường thử.
- Ảnh concept dùng Bài 6 và 12 mục đến hạn giả định; số thực phải suy từ dữ liệu người học, không hardcode vào UI.

## 8. Điểm cần người dùng đánh giá sau nguyên mẫu

Kiểm thử hành trình với người học thực ở mốc 6, đặc biệt khi vừa có nháp Luyện vừa có mục Ôn đến hạn: họ có nhận ra cả hai lối và chọn đúng việc mình muốn không? Nếu không, điều chỉnh thứ bậc Bảng tin theo quan sát. Đây là phép kiểm UX, không phải điều kiện để bắt đầu mốc 1.
