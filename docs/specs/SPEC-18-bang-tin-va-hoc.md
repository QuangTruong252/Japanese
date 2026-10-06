# SPEC-18 — Bảng tin dẫn việc tiếp theo và hub bài học

Ngày: 28/09/2026. Trạng thái: **Đã làm cứng theo phản hồi 28/09/2026; unit tests 219/219 PASS; chờ nghiệm thu trình duyệt từ coordinator**. Mốc 3 của kế hoạch UX; đọc SPEC-02/03/15 và phần Nghe của SPEC-09/10. _(đã gỡ khỏi repo ngày 06/10/2026; bản cũ ở tag `pre-cleanup`)_

## 1. Mục tiêu & phạm vi

- Người mới thấy “Bắt đầu Bài 1”; người quay lại thấy một việc tiếp theo hợp lệ, hiểu sự khác nhau giữa Học, Luyện và Ôn.
- Trang Bài N đưa “Học/tiếp tục từ vựng” lên trước Luyện, song vẫn dễ vào Ngữ pháp, Nghe và nội dung tham khảo.
- Không thay dữ liệu bài N5, thuật toán tiến độ từ vựng, FSRS hay engine audio.

## 2. Dữ liệu

- Trạng thái bài/nháp đọc từ Dexie và helper hiện có (`useActiveDrafts`, `active-drafts.ts`); `DashboardContent` và `LessonGrid` không tạo bộ đếm song song. Số mục đến hạn dùng cùng nguồn `use-due-queue.ts`/badge đã kiểm tra, không tính theo ngày tĩnh.
- Mười từ/lượt là mặc định hiện có trong luồng học từ vựng, không ép khi dữ liệu cuối bài ít hơn. Các nhãn số lượng lấy từ dữ liệu thật.
- Audio sẵn có/thiếu đọc từ kho audio hiện có; không dùng thời lượng track làm bằng chứng hợp lệ.

## 3. Màn hình & bố cục

**Redesign Phố giấy 05/10/2026 theo yêu cầu đối chiếu `new-ui`:** thay bố cục một cột nhiều thẻ bằng panorama mở ra mép trang, nội dung/hành động chính trực tiếp trên nền giấy; desktop chia cột việc tiếp theo và cột củng cố/Kana/tiến độ. Củng cố hiện hai mục thật bằng helper nhãn của màn Điểm yếu; ẩn khi không có lịch sử sai. Container Bảng tin tối đa 1440px trong vùng bên cạnh sidebar, vì cảnh và hai cột cần rộng hơn container đọc. Bài 1 dùng tiêu đề giữa, chữ Nhật lớn, cảnh chào hỏi; hub bên dưới ở mobile/bên phải ở desktop, các lối Ngữ pháp/Nghe/tham khảo là hàng có chevron. Preview từ đầu bài chỉ là nội dung học bên cạnh CTA, không ghi tiến độ. Giữ CTA/ưu tiên nháp, tiến độ và anchor; phần vocab/grammar pilot theo [SPEC-21](SPEC-21-illustration-assets.md). Luật nền/navigation/type được cập nhật có chủ đích ở `DESIGN.md`. Bằng chứng ở handoff SPEC-21; không thay nghiệm thu toàn feature.

### Thành phần Bảng tin — người dùng chốt 06/10/2026, **chưa triển khai**

Chốt nội dung trước khi thiết kế lại (khám phá giao diện trong Open Design). Khi khác với
bảng thứ tự bên dưới, mục này thắng; code hiện tại vẫn theo bố cục 05/10 cho tới khi triển khai.

| # | Thành phần | Khi hiện | Nguồn |
| --- | --- | --- | --- |
| 1 | Một CTA chính, ưu tiên: ôn đến hạn → nháp → học tiếp Bài N → Bắt đầu Bài 1 | Luôn | `resolveDashboardCta` |
| 2 | Một dòng ngữ cảnh của CTA (“12 mục đến hạn · khoảng 3 phút”, “Bài 3 · từ 4/10”) | Luôn | dữ liệu hiện có |
| 3 | Lời chào theo buổi, một dòng | Luôn | hiện có |
| 4 | Cảnh minh họa của bài đang học | Luôn | SPEC-21 |
| 5 | **Câu hôm nay**: nhân vật trong cảnh “nói” một câu của bài đang học trong bong bóng HTML (Furigana + nghĩa tiếng Việt + nút nghe) | Luôn khi bài có câu phù hợp | mới — câu lấy từ `grammar[].examples` (có `jp` notation + `translation.vi`) của bài đang học, cố định trong ngày; nghe qua `SpeakButton`; vị trí bong bóng theo sidecar cảnh, thiếu thì đặt dưới cảnh |
| 6 | Hàng “Tiếp tục phiên” (nháp còn lại) ngay dưới CTA | Khi có nháp | hiện có |
| 7 | Một hàng “Bài đang học” (tên + tiến độ) dẫn sang lộ trình `/hoc` | Khi đã bắt đầu | rút gọn từ hiện có |
| 8 | Lối “Tôi đã học đến bài…” | Chỉ người mới | hiện có |

Bỏ khỏi Bảng tin: “Nội dung cần củng cố” (chuyển hẳn sang Ôn tập / Điểm yếu), lối Bảng chữ
Kana và “Xem tiến độ” (đã có qua Tra cứu và Tài khoản), KPI, lộ trình 25 bài, đoạn văn mô tả.
Giải thích Học/Luyện/Ôn cho người mới giữ ở dạng thu gọn một dòng.

Luật chữ: tiêu đề tối đa ~6 từ, mỗi khối tối đa một dòng phụ; không đoạn văn kể chuyện.
Trạng thái phải thiết kế: mới, có mục đến hạn, có nháp, đang học không có mục ôn, đã ôn xong
hôm nay, đang tải, lỗi.

**Học `/hoc`:** danh sách bài chuyển thành **lộ trình dạng bước** 25 bài (đã học / đang học /
chưa học), dùng cảnh của từng bài; bài chưa học hiển thị cảnh làm mất màu bằng CSS, không vẽ
thêm asset nét chì. Thiết kế sau Bảng tin.

| Màn | Thứ tự đọc và hành động |
| --- | --- |
| Bảng tin `/` | Lời chào ngắn → một CTA chính: có mục đến hạn thì “Bắt đầu ôn”; không có mà có nháp thì “Tiếp tục” nháp đó (Luyện/Ôn trước, từ vựng sau); còn lại “Tiếp tục học Bài N” hoặc “Bắt đầu Bài 1”. Hàng phụ “Tiếp tục phiên” (nháp còn lại) đặt ngay dưới CTA chính, trên bài đang học; Tra cứu/Kana và “Xem tiến độ” dẫn `/ca-nhan`. Số ôn ghi “N mục đến hạn · M mục mới” như `/on-tap` để khớp badge dock. Giải thích ngắn Học/Luyện/Ôn cho người mới, không thêm KPI dày ở đây. |
| Học `/hoc` | Bài đang học/tiếp tục ở đầu; danh sách 25 bài lọc được với nhãn “Lọc bài học”; trạng thái bài và học từ là thông tin chính, không kéo mục Tra cứu vào sâu trong đây. |
| Bài `/hoc/[so]` | Header bài và tiến độ → CTA “Học từ vựng”/“Tiếp tục học từ vựng” → lối Ngữ pháp, Nghe, “Xem toàn bộ bài” → Luyện Bài N phụ. Nội dung tham khảo đầy đủ tiếp tục bên dưới, trên cùng URL. |
| Tham khảo trong bài | Giữ các phần Từ vựng, Ngữ pháp, Nghe, audio/shadowing; “Xem toàn bộ bài” cuộn tới phần này. Deep link `#vocab-*`, `#grammar-*`, `#tu-vung`, `#ngu-phap`, `#nghe` tiếp tục tới đúng mục. |

Không thêm màn chặn Kana trước Bài 1. Nếu thiếu audio, mục Nghe giải thích và dẫn trực tiếp `/cai-dat/audio` với ngữ cảnh quay lại bài; không khóa Ngữ pháp/Từ vựng.

## 4. Component dùng lại

`DashboardContent`, `LessonGrid`, `LessonProgress`, `VocabLearningFlow`, `Furigana`, `ShadowingPlayer`, `SearchTrigger`, `use-due-queue.ts`, audio helper và Link/Button hiện có. Chỉ tạo component chung khi cùng một mẫu hành động xuất hiện lặp thực tế.

## 5. Trạng thái

Người mới không có dữ liệu; bài đang học chưa xong; có nháp từ vựng; có nháp Luyện cùng mục Ôn đến hạn; hết mục đến hạn; chưa có audio; nạp bài lỗi; mất mạng trong trang đã mở. CTA không được trỏ đến phiên không thể tạo; nháp luôn nêu rõ “Tiếp tục” và không bị khởi tạo lại.

## 6. Tương tác & chuyển động

- Bảng tin chỉ có một CTA primary. Khi nháp và mục ôn cùng có, Ôn giữ CTA chính, nháp là hàng phụ ngay bên dưới. Nghiên cứu giả lập 01/10/2026 (báo cáo) thấy nháp bị dock che khi nằm sau bài đang học, nên đã chuyển lên; cần xác nhận lại bằng nhật ký trên điện thoại thật. _(đã gỡ khỏi repo ngày 06/10/2026; bản cũ ở tag `pre-cleanup`)_
- Lối tiếp tục vào thẳng nơi dừng: nháp từ vựng dùng `/hoc/[so]/tu-vung?tiep-tuc=1` (mở thẳng thẻ dở). “Bắt đầu ôn” vào thẳng `/on-tap/phien` khi không có nháp Luyện/Ôn; có nháp thì qua `/on-tap` để hộp xác nhận bảo vệ nháp (hai loại dùng chung khóa lưu).
- “Học từ vựng” tới `/hoc/[so]/tu-vung`; Luyện truyền `?lessons=N`; “Xem toàn bộ bài” là link anchor, không route mới.
- Browser Back và search deep link giữ vị trí/anchor. Dùng cuộn chuẩn và scroll margin để header/dock không che mục tiêu. Giữ reduced motion.

## 7. Accessibility

Một `h1`/màn, heading theo thứ bậc, tên nút nói hành động, Nhật/furigana render bằng `Furigana`. CTA và card link có focus rõ, vùng chạm ≥48px trong luồng học. Kiểm 320/390px và zoom 200%, không chồng nhãn/dock.

## 8. Bảo mật & dữ liệu

Đọc/ghi học tập theo Dexie và transaction hiện có; mọi thay đổi tiến độ kèm `pendingSync` đúng quy tắc repo. Không thêm bản sao persist, không đổi dữ liệu học khi chỉ cuộn/xem tham khảo. Audio nguồn ở máy, không đưa vào cloud/bundle.

## 9. Tiêu chí nghiệm thu

- [ ] Guest mới: `Bảng tin → Bài 1 → Học từ` rõ, không cần đi qua Luyện hoặc tạo account (chờ browser nghiệm thu).
- [ ] Có mục đến hạn/không đến hạn/nháp: CTA chính đúng, nháp vẫn tiếp tục đúng vị trí; “Xem tiến độ” tới Profile (`/ca-nhan`) (chờ browser nghiệm thu).
- [ ] Bài N lần đầu ưu tiên Học từ; Ngữ pháp/Nghe/tham khảo/Luyện đều tìm thấy; anchor từ SearchDialog và bookmark cũ còn tới đúng nội dung (chờ browser nghiệm thu).
- [ ] Thiếu audio dẫn đúng trang nạp và quay lại bài; học/lưu được khi tab đã mở rồi mất mạng. Browser 390/1280, keyboard, furigana, dark/reduced motion (chờ browser nghiệm thu).
- [x] `pnpm test` 219 tests PASS (unit tests cho Dashboard CTA, active drafts hỏng/hết hạn); handoff ghi trạng thái SPEC-03 và SPEC-18 chi tiết.

## 10. Khối lệnh bàn giao thiết kế

Thiết kế Bảng tin ba trạng thái (mới, có mục ôn, có nháp) và Bài N hai trạng thái (lần đầu, đang dở) ở 390px/1280px. Dùng Washi, token `globals.css`, nội dung học thật hoặc placeholder được gắn nhãn; tiếng Nhật qua class `jp`/Furigana. Cho thấy lối “Xem toàn bộ bài” giữ nội dung tham khảo trên URL hiện tại.
