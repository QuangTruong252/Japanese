# SPEC-18 — Bảng tin dẫn việc tiếp theo và hub bài học

Ngày: 28/09/2026. Trạng thái: **Đã làm cứng theo phản hồi 28/09/2026; unit tests 219/219 PASS; chờ nghiệm thu trình duyệt từ coordinator**. Mốc 3 của [kế hoạch UX](../plans/2026-09-27-ux-redesign.md); đọc SPEC-02/03/15 và phần Nghe của SPEC-09/10.

## 1. Mục tiêu & phạm vi

- Người mới thấy “Bắt đầu Bài 1”; người quay lại thấy một việc tiếp theo hợp lệ, hiểu sự khác nhau giữa Học, Luyện và Ôn.
- Trang Bài N đưa “Học/tiếp tục từ vựng” lên trước Luyện, song vẫn dễ vào Ngữ pháp, Nghe và nội dung tham khảo.
- Không thay dữ liệu bài N5, thuật toán tiến độ từ vựng, FSRS hay engine audio.

## 2. Dữ liệu

- Trạng thái bài/nháp đọc từ Dexie và helper hiện có (`useActiveDrafts`, `active-drafts.ts`); `DashboardContent` và `LessonGrid` không tạo bộ đếm song song. Số mục đến hạn dùng cùng nguồn `use-due-queue.ts`/badge đã kiểm tra, không tính theo ngày tĩnh.
- Mười từ/lượt là mặc định hiện có trong luồng học từ vựng, không ép khi dữ liệu cuối bài ít hơn. Các nhãn số lượng lấy từ dữ liệu thật.
- Audio sẵn có/thiếu đọc từ kho audio hiện có; không dùng thời lượng track làm bằng chứng hợp lệ.

## 3. Màn hình & bố cục

| Màn | Thứ tự đọc và hành động |
| --- | --- |
| Bảng tin `/` | Lời chào ngắn → một CTA chính: có mục đến hạn thì “Bắt đầu ôn”; không có thì “Tiếp tục học Bài N” hoặc “Bắt đầu Bài 1”. Hàng phụ “Tiếp tục phiên” nếu có nháp, bài đang học, Tra cứu/Kana và “Xem tiến độ” dẫn `/ca-nhan`. Giải thích ngắn Học/Luyện/Ôn cho người mới, không thêm KPI dày ở đây. |
| Học `/hoc` | Bài đang học/tiếp tục ở đầu; danh sách 25 bài lọc được với nhãn “Lọc bài học”; trạng thái bài và học từ là thông tin chính, không kéo mục Tra cứu vào sâu trong đây. |
| Bài `/hoc/[so]` | Header bài và tiến độ → CTA “Học từ vựng”/“Tiếp tục học từ vựng” → lối Ngữ pháp, Nghe, “Xem toàn bộ bài” → Luyện Bài N phụ. Nội dung tham khảo đầy đủ tiếp tục bên dưới, trên cùng URL. |
| Tham khảo trong bài | Giữ các phần Từ vựng, Ngữ pháp, Nghe, audio/shadowing; “Xem toàn bộ bài” cuộn tới phần này. Deep link `#vocab-*`, `#grammar-*`, `#tu-vung`, `#ngu-phap`, `#nghe` tiếp tục tới đúng mục. |

Không thêm màn chặn Kana trước Bài 1. Nếu thiếu audio, mục Nghe giải thích và dẫn trực tiếp `/cai-dat/audio` với ngữ cảnh quay lại bài; không khóa Ngữ pháp/Từ vựng.

## 4. Component dùng lại

`DashboardContent`, `LessonGrid`, `LessonProgress`, `VocabLearningFlow`, `Furigana`, `ShadowingPlayer`, `SearchTrigger`, `use-due-queue.ts`, audio helper và Link/Button hiện có. Chỉ tạo component chung khi cùng một mẫu hành động xuất hiện lặp thực tế.

## 5. Trạng thái

Người mới không có dữ liệu; bài đang học chưa xong; có nháp từ vựng; có nháp Luyện cùng mục Ôn đến hạn; hết mục đến hạn; chưa có audio; nạp bài lỗi; mất mạng trong trang đã mở. CTA không được trỏ đến phiên không thể tạo; nháp luôn nêu rõ “Tiếp tục” và không bị khởi tạo lại.

## 6. Tương tác & chuyển động

- Bảng tin chỉ có một CTA primary. Khi nháp và mục ôn cùng có, Ôn giữ CTA chính, nháp là hàng phụ rõ; đây là giả thuyết cần quan sát ở mốc nghiệm thu toàn hành trình.
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
