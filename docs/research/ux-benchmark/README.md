# Benchmark UI/UX: Duolingo, LingoDeer, Renshuu → MaiPace

> Tài liệu **nghiên cứu để thảo luận**, ngày 24/09/2026. Không phải spec, không phải nghiệm thu.
> Đề xuất nào được chốt phải chuyển vào `DESIGN.md` (luật toàn cục) hoặc SPEC tương ứng.
> Báo cáo nguồn: [Duolingo](duolingo.md) · [LingoDeer](lingodeer.md) · [Renshuu/WaniKani/Bunpro](renshuu-wanikani-bunpro.md).

## Mỗi app dạy được điều gì

| App | Làm tốt nhất | MaiPace không nên theo |
|---|---|---|
| Duolingo | Một việc tiếp theo trên lộ trình; nhịp Check → sheet phản hồi → Tiếp tục; ôn tập nằm trên path; "slack" (nới lỏng) giữ động lực | Hearts/Energy, streak loss-aversion, leaderboard, không furigana |
| LingoDeer | Ngữ pháp đọc trước + Knowledge Card; chế độ hiển thị chữ; nút tự đánh giá hiện khoảng ôn; câu sai quay lại cuối lượt; audio 0.8x | Trắc nghiệm áp đảo, Test Out khóa bài |
| Renshuu | Theo giáo trình; "ôn trước, học mới sau"; Mark as wrong; furigana ẩn theo mục đã biết | UI dày đặc, mastery nhân theo hướng hỏi → dồn bài |
| WaniKani/Bunpro | Dự báo lượt ôn; luyện lỗi không tính SRS; shake cho lỗi gõ được phép; gợi ý nhiều tầng | Vacation mode đóng băng; undo tính là đúng |

Điểm chung: app được khen là app **giải thích rõ và cho biết khối lượng trước**; app bị chê là app **gây áp lực** (Duolingo) hoặc **gây ngợp** (Renshuu). Hướng của MaiPace ("theo nhịp của bạn") đã đúng, còn thiếu vài cơ chế cụ thể.

## Đối chiếu với code hiện tại (24/09/2026)

Đã có, giữ nguyên: một hành động chính P0 ở Bảng tin (`DashboardContent.tsx`); bật/tắt furigana bằng CSS và `hideTranslations` (`settings.ts`); `dailyNewLimit`; màn điểm yếu; phản hồi có icon + chữ, `aria-live`; nút `size="quiz"`; không hearts, không leaderboard.

Khoảng trống quan sát được:

| # | Khoảng trống | Nguồn cảm hứng | Chỗ chạm trong code |
|---|---|---|---|
| G1 | Câu sai không quay lại trong phiên; phiên kết thúc với danh sách lỗi | LingoDeer, Bunpro Ghost | `PracticeRunner.tsx` (`handleNext`) |
| G2 | Không có progress bar trong phiên, chỉ có `3/10` và đồng hồ đếm giây (đồng hồ tạo áp lực ngầm) | Duolingo | header `PracticeRunner.tsx` |
| G3 | Phản hồi nằm dưới vùng trả lời, không phải sheet cố định đáy; nút Tiếp tục vị trí thay đổi theo độ dài giải thích | Duolingo | `PracticeRunner.tsx` |
| G4 | Không có dự báo lượt ôn; người học không biết ngày mai bao nhiêu | WaniKani Forecast | `stats.ts`, `thong-ke`, `on-tap` |
| G5 | Rating FSRS suy hoàn toàn từ đúng/sai + thời gian; người học không sửa được "đoán may" | Renshuu Mark as wrong, LingoDeer tự đánh giá | `rateAnswer` trong `fsrs.ts` (cần test hồi quy) |
| G6 | Lỗi gõ được phép (や/ゃ, hiragana↔katakana) bị chấm ngay; chưa có "gõ lại" mềm | WaniKani shake | `JpInput.tsx`, `japanese.ts` |
| G7 | Trang bài học là cuộn dài Từ vựng → Ngữ pháp → Audio → nút Luyện; không có "bước tiếp theo trong bài" | Duolingo path, LingoDeer Learning Tips | `app/hoc/[so]/page.tsx`, `LessonGrid.tsx` |
| G8 | Streak dùng icon ngọn lửa và màu `amber-*` thô — vừa lệch `DESIGN.md` (palette discipline) vừa gợi hình ảnh loss-aversion | Bài học ngược từ Duolingo | `DashboardContent.tsx` |
| G9 | Không có luật "ôn trước, học mới sau" hiển thị trên UI (dashboard đã ưu tiên ôn, nhưng không nói khối lượng hôm nay xong khi nào) | Renshuu, Duolingo exit point | `DashboardContent.tsx`, `SessionResult.tsx` |
| G10 | Kết quả phiên liệt kê câu sai nhưng không có "Luyện lại X câu sai" một chạm | LingoDeer Practice makes perfect | `SessionResult.tsx` |

## Đề xuất theo mức ưu tiên

**P0 — nhỏ, rủi ro thấp, cải thiện cảm nhận rõ:**

1. **G1 + G10**: câu sai được chèn lại cuối phiên (tối đa 1 lần, không ghi FSRS lần hai); màn kết quả có nút "Luyện lại N câu sai".
2. **G2**: thay `3/10` bằng progress bar mảnh + số; ẩn đồng hồ mặc định (vẫn đo `elapsedMs` cho FSRS).
3. **G3**: sheet phản hồi cố định đáy, nút "Tiếp tục" luôn ở cùng vị trí; phím Enter/Space.
4. **G8**: đổi streak sang token Washi và câu trung tính ("Đã học 5 ngày gần đây"), bỏ ngọn lửa.

**P1 — cần quyết định sản phẩm:**

5. **G4**: dự báo 7 ngày (một cột, `chart-1`) ở Ôn tập/Thống kê.
6. **G6**: "gõ lại" mềm cho khác biệt được phép, kèm test đúng/sai theo `AGENTS.md`.
7. **G9**: dòng "Hôm nay: ôn X · học mới tối đa Y" và màn "Xong cho hôm nay" khi hết mục đến hạn.
8. **G5**: nút "Tôi đoán" (Mark as wrong) trên phản hồi đúng → rating `Again`/`Hard`. Đổi rating cần test hồi quy.

**P2 — thay đổi cấu trúc, cần spec riêng:**

9. **G7**: trang bài học thành các bước có trạng thái (Từ vựng → Ngữ pháp → Luyện tập → Shadowing) với "bước tiếp theo" nổi bật; ngữ pháp dạng thẻ tra lại được (Knowledge Card).
10. Furigana ẩn dần theo kanji đã thuộc (Renshuu/Bunpro), bổ sung cho công tắc toàn cục hiện có.

## Không làm (đã cân nhắc)

Hearts/Energy, leaderboard, XP, mascot/garden, vacation mode đóng băng thời gian, undo tính là đúng, study vector nhân thẻ, ghi âm không phản hồi, romaji.

## Câu hỏi cần người dùng chốt

- Streak: giữ ở dạng trung tính hay bỏ khỏi Bảng tin?
- Đồng hồ trong phiên: ẩn mặc định, hay bỏ hẳn?
- G5 "Tôi đoán": có muốn người học can thiệp vào rating FSRS không?
- G7: có đi tới "lộ trình trong bài" không, hay giữ trang cuộn dài?
