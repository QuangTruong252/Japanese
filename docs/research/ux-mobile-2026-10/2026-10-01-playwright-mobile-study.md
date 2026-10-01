# Nghiên cứu UX mobile-first bằng giả lập Playwright — 01/10/2026

Phạm vi: chạy kịch bản nghiên cứu 7 ngày ở mức **giả lập**: agent đóng vai người học,
dùng Playwright để điều khiển MaiPace và thực hiện các nhiệm vụ. Đây không phải quan sát
người dùng thật. Kết quả dùng để quyết định nên làm nguyên mẫu nào trước; sau đó vẫn cần
thử lại trên điện thoại thật.

## 1. Môi trường và cách làm

| Mục | Giá trị |
| --- | --- |
| Code | `master` @ `e90e5b3`, dev server `next dev -p 3100` |
| Trình duyệt | Playwright 1.63: Chromium mobile (UA Android, `isMobile`, touch, DPR 2) và WebKit (UA iPhone) |
| Viewport | 390×844 (chính), 360×780, 430×932; chữ 150%/200% (đổi `font-size` gốc), reduced motion, hệ thống tối |
| Dữ liệu | Hồ sơ trình duyệt bền vững, tạo **bằng thao tác thật**: học 10 từ Bài 1, làm 15 câu luyện, 1 lô ôn 14 câu. Để giả lập "hôm sau", lùi `dueAt` 24h trong IndexedDB theo cách của bộ nghiệm thu 28/09 |
| Supabase | Không có `web/.env.local` → không kiểm chứng sync thật |
| Script | `D:/tmp/maipace-ux/*.mjs`, ngoài repo; nhật ký thô ở `log.txt`, ảnh ở `shots/` |

Mỗi nhiệm vụ chỉ nêu mục tiêu. "Người học" chọn theo nhãn trên màn hình và ưu tiên nút chính,
không mở thẳng URL, trừ khi mô phỏng việc quay lại app.

## 2. Kết quả theo nhiệm vụ

| # | Nhiệm vụ | Kết quả | Số chạm / ghi nhận | Ảnh |
| --- | --- | --- | --- | --- |
| A-T1 | 5 phút, tiếp tục việc học gần nhất (đang dở thẻ từ vựng 1/10) | Hoàn thành, đi vòng | 3 chạm: Bảng tin vẫn chào **"Bắt đầu bài 1"** như người mới; hàng "Tiếp tục phiên" nằm dưới dock, ngoài màn đầu | `A-T1-dash-vocabdraft`, `A-T1-hoc1-via-primary` |
| A-T2 | Học thêm một nhóm từ | Hoàn thành 10/10 | Nút chấm nằm ở y 556–747/844, dễ chạm bằng ngón cái; vuốt phải cũng chấm được. Mặt sau **mất chữ Nhật**; 3/4 nút cùng ghi "Ôn lại trong vài phút" | `d2-card-back` |
| A-T3 | Chuyển app ~1 phút rồi quay lại | Đúng chỗ khi tab còn sống. Nếu tab bị thu hồi, sau khi tải lại phải bấm "Học tiếp" và vẫn quay đúng thẻ 6/10 | **Màn tổng kết ghi "Đã học xong 10 từ" nhưng các mức chỉ cộng được 5**. IndexedDB có đủ 10 mục | `A-T3-after-discard-reload`, `A-T2-summary` |
| A-T4 | Củng cố bài vừa học bằng vài câu hỏi | Hoàn thành | Dock → Luyện tập → "Bắt đầu 15 câu": 2 chạm, tốt. Lúc này Bảng tin đã đẩy "Ôn tập 10 mục" thành CTA chính | `A-T4-luyen`, `A-T4-dash-after-vocab` |
| A-T5 | Tra một từ giữa phiên rồi quay lại | Hoàn thành | 6 chạm + gõ: phiên không có lối tra cứu → Thoát → "Lưu và học tiếp sau" → Tìm `daigaku` → kết quả → Back → "Tiếp tục phiên" (câu 8/15, đúng chỗ). Tìm kiếm vẫn dùng được khi bàn phím chiếm chỗ, với viewport cao 520 | `A-T5-*` |
| B-T1 | Hôm sau: tiếp tục việc gần nhất (nháp luyện 8/15 + 9 mục đến hạn) | Hoàn thành, 1 chạm | Thứ bậc: **Ôn (CTA đỏ) → Bài đang học → Tiếp tục phiên**; hàng nháp sát mép dock. Bảng tin ghi **19 mục**, dock ghi **9** | `B-T1-dash-draft-and-due` |
| B-T4 | Hoàn thành phiên luyện | Có kết quả | 15 câu nhưng hiện **"10/23"** vì mỗi cặp ghép được tính riêng. Danh sách câu sai **gán "Bạn trả lời" của câu khác** và liệt kê một câu ghép đúng là sai | `B-practice-summary` |
| B-T6 | Hoàn thành một lô ôn rồi chọn việc tiếp | **Bị chặn về nội dung** | **Câu trắc nghiệm trong Ôn không hiện đề**, chỉ còn 4 đáp án. "Bắt đầu ôn" ở Bảng tin chỉ mở hub, phải chạm thêm lần nữa. Kết quả 14% nhưng vẫn ghi "Đã ôn hết… Nhịp học của bạn đang rất tốt" cạnh dòng "13 mục hôm nay". Sau đó Bảng tin lại đặt "Ôn 12 mục" làm CTA chính | `B-T6-review-q1`, `B-T6-review-summary`, `B-T6-dash-after-review` |
| Mạng | Mất mạng từ câu 4–7 của lô ôn rồi kết nối lại | Không gián đoạn | Lô vẫn chạy hết; IndexedDB ghi 23 mục và 2 phiên; `pendingSync` 12 mục. Retry với server chưa kiểm được | `B-T6-offline`, `B-T6-online` |

## 3. Phát hiện

Mẫu: quan sát → ảnh hưởng → bằng chứng → đề xuất nhỏ nhất → cách thử lại.

### Mức 1 — chặn học hoặc gây hiểu sai

**F1. Câu trắc nghiệm trong phiên Ôn không có đề.**
Người học thấy 4 nghĩa hoặc 4 cách đọc nhưng không biết đang được hỏi từ nào. Khi đó Ôn
gần như thành đoán, còn FSRS nhận rating sai. Bằng chứng: 14/14 câu của lô ở 360/390/430
đều thiếu đề (`B-T6-review-q1`, `M-360-review-q`). `ReviewRunner.tsx:760` chỉ gọi
`renderQuestionComponent()`. `QuestionMc` không tự vẽ `prompt`; `PracticeRunner.tsx:502-513`
tự vẽ nên Luyện không bị. `ReviewRunner` được thêm ngày 28/09 (`afd6b6f`), cùng ngày
SPEC-20 được ghi "Browser PASS".
Đề xuất: vẽ `currentQuestion.prompt` bằng `Furigana` trong `ReviewRunner`, giống
`PracticeRunner`.
Thử lại: chạy một lô ôn có đủ các dạng; đạt khi 100% câu có đề ở 360/390/430.

**F2. Kết quả luyện tập gán sai câu trả lời.**
Màn kết quả có thể dạy sai: câu "どうぞよろしく…" (đọc) hiện câu trả lời của câu nghĩa;
một câu ghép đã "Chính xác!" vẫn bị liệt kê sai. Bằng chứng: `B-practice-summary`.
`PracticeRunner.tsx:270-290` gom `incorrectQuestions` và `userAnswers` theo `targetId`, nên
cùng một từ trong hai câu sẽ ghi đè nhau. `SessionResult.tsx:158` đọc
`userAnswers[q.targetId]`. Ngoài ra, "Số câu đúng 10/23" lệch với 15 câu người học vừa làm.
Đề xuất: đánh khóa theo `question.id` cho danh sách câu sai và câu trả lời. FSRS vẫn chấm
theo `targetId`. Hiển thị số **câu**, coi mỗi câu ghép là một câu.
Thử lại: dùng phiên có cùng một từ ở dạng đọc và dạng nghĩa; thêm test hồi quy một ca đúng
và một ca sai.

**F3. Tổng kết từ vựng đếm thiếu sau khi tải lại.**
Người học thấy "10 từ" nhưng các mức chỉ cộng được 5, nên nghi tiến độ không được lưu. Bằng
chứng: `A-T2-summary` và IndexedDB có 10 mục. `ratingCounts` chỉ nằm trong `useState`
(`VocabLearningFlow.tsx:327`), còn nháp chỉ lưu `targetIds/currentIndex`.
Đề xuất: lưu số đếm vào nháp từ vựng, hoặc tính lại từ các mục vừa chấm.
Thử lại: học 5 thẻ → tải lại → học tiếp 5 thẻ; tổng phải bằng 10.

**F4. Kết quả ôn khen trong khi vẫn còn việc.**
Ở lô ôn đúng 14%, màn hình vẫn ghi "Đã ôn hết các mục đến hạn… Nhịp học của bạn đang rất tốt"
dù ngay trên đó là "13 mục hôm nay". Người học khó tin vào trạng thái lịch ôn. Bằng chứng:
`B-T6-review-summary`.
Đề xuất: chỉ hiện câu "đã ôn hết" khi hàng đợi đến hạn thật sự bằng 0; bỏ lời khen không
dựa trên kết quả.

### Mức 2 — cản trở lặp lại

**F5. Bảng tin chưa ưu tiên việc đang dở. Giả thuyết đầu tiên được xác nhận một phần.**
- Có nháp từ vựng nhưng chưa có mục ôn: CTA chính vẫn là "Bắt đầu bài 1" dành cho người mới,
  còn hàng "Tiếp tục phiên" ở y > 734 nên bị dock che (`A-T1-dash-vocabdraft`).
- Có cả nháp luyện và mục ôn: thứ tự là Ôn → Bài đang học → Tiếp tục phiên; nút "Tiếp tục"
  sát mép dock (`B-T1-dash-draft-and-due`).
- Lối "Tiếp tục" của nháp từ vựng mở màn chọn từ, phải bấm "Học tiếp" thêm lần nữa. "Bắt đầu
  ôn" mở hub `/on-tap`, phải bấm "Bắt đầu ôn" lần nữa.

Đề xuất: khi có nháp, đặt hàng "Tiếp tục phiên" ngay dưới CTA Ôn, trên thẻ "Bài đang học";
với người mới có nháp, dùng nháp làm CTA chính. Lối tiếp tục và "Bắt đầu ôn" nên vào thẳng
phiên. Không đổi FSRS.
Thử lại: lặp A-T1 và B-T1 ở 360×780. Đạt khi 3/3 lần tới đúng thẻ hoặc câu dở bằng ≤1 chạm và
hàng tiếp tục nằm trên dock.

**F6. Số mục ôn không thống nhất.**
Bảng tin ghi "19 mục" (9 đến hạn + 10 mới), dock và `/on-tap` ghi 9 đến hạn. Lúc vừa học xong,
Bảng tin ghi 10 còn dock ghi 2 (`A-T4-dash-after-vocab`, `B-on-tap`).
Đề xuất: dùng chung một nhãn, ví dụ "9 đến hạn · 10 mới", hoặc chỉ đếm mục đến hạn ở mọi nơi.

**F7. Ôn chiếm CTA chính ngay sau khi học.**
Vừa chấm 10 thẻ, Bảng tin đã đặt "Ôn tập 10 mục" làm CTA chính. Sau một lô ôn, CTA chính lại
là "Ôn 12 mục". Mức "Quên/Khó/Nhớ" đều hẹn lại sau vài phút. Màn kết quả ôn không gợi ý học
tiếp phần còn lại của bài (đã vào lịch ôn 23/41).
Đề xuất: chỉ hiển thị, không đổi FSRS. Tách mục "ôn lại trong vài phút" khỏi CTA chính, hoặc
thêm "Học tiếp từ 11–20" vào kết quả.
Cần nhật ký thật để đo xem vòng lặp này có làm người học bỏ dở không.

**F8. Thẻ từ vựng.**
Mặt sau chỉ còn nghĩa, mất chữ Nhật và furigana, nên người học không đối chiếu được. 3/4 nút
cùng ghi "Ôn lại trong vài phút"; "Dễ nhớ" dùng sắc đỏ giống "Quên mất" (`d2-card-back`).
Đề xuất: giữ dòng chữ Nhật nhỏ ở mặt sau; dùng màu Dễ nhớ khác Quên.

### Mức 3 — độ chỉn chu

- **F9. Theme hệ thống không áp dụng.** Điện thoại để chế độ tối và chưa từng lưu cài đặt thì
  app vẫn sáng, còn nút lại hiện "Chuyển sang giao diện sáng"; lần chạm đầu không đổi gì. Script
  chống nháy (`settings.ts:265`) `return` sớm khi chưa có `jp:settings`.
- **F10. Chữ 200%:** header bị cắt mất Cài đặt và Tài khoản; nút "Bắt đầu ôn" cắt cả icon lẫn
  chữ (`M-text200-dash`). Ở 150% vẫn ổn.
- **F11. Vùng chạm < 44px ngoài luồng làm bài:** "Ôn tập ngay →" 83×15 ở `/ca-nhan`; "Nạp audio
  đĩa CD" 142×28 và liên kết cao 16px ở `/hoc/1`; tab "Điểm yếu của tôi" 111×30; "Tùy chỉnh bài,
  dạng và số câu" 248×36. Các nút trong phiên Học/Luyện/Ôn đều ≥ 48px.
- **F12.** Trang cuộn trong một `div`, không cuộn document, nên trên iOS Safari thanh địa chỉ có
  thể không thu lại và chạm status bar có thể không lên đầu trang. Cần kiểm trên iPhone thật.
- **F13.** `/hoc/1` dài 10–12 màn. Kết quả tìm kiếm neo tới `#vocab-daigaku` nhưng không làm
  nổi bật dòng đích (`A-T5-lookup-result`).

Phần đạt: không tràn ngang ở 360/430/chữ 200%; nút dính đáy "Học N từ"; Luyện tập bắt đầu
bằng 1 chạm; Back sau tra cứu về đúng nháp; reduced motion tắt animation lật thẻ trên WebKit;
dock và header có xử lý `safe-area`; lô ôn không gián đoạn khi mất mạng.

## 4. Trả lời 5 câu hỏi nghiên cứu (giả lập)

1. **Mở app có thấy đúng việc tiếp theo?** Chưa ổn: Bảng tin ưu tiên Ôn, hoặc chào như người
   mới, hơn việc đang dở (F5, F7).
2. **Phân biệt Học, Luyện, Ôn?** Nhãn dock rõ, nhưng Ôn hiện ngay sau Học và lặp lại sau mỗi
   lô; nếu không đọc hướng dẫn, ranh giới giữa các hoạt động khá mờ (F7).
3. **Làm xong trong 5–10 phút?** Luyện: tốt. Học từ: tốt. Ôn: bị chặn vì thiếu đề (F1).
4. **Gián đoạn rồi tiếp tục đúng chỗ?** Vị trí: đúng ở mọi ca thử. Độ tin cậy: giảm vì màn tổng
   kết và kết quả sai (F2, F3, F4).
5. **Khó đọc hoặc mỏi tay?** Vùng chạm trong phiên tốt. Vấn đề nằm ở chữ phóng lớn, theme tối
   và vài liên kết nhỏ (F9–F11).

## 5. Ba ưu tiên đề xuất làm nguyên mẫu (ngày 6–7)

1. **Ôn hiển thị đề** (F1): sửa một chỗ, chặn học, phải làm trước.
2. **Kết quả trung thực** (F2 + F3 + F4): khóa theo câu, giữ số đếm qua lần tải lại và sửa câu
   chữ ở kết quả ôn. Cả ba cùng ảnh hưởng tới việc người học có tin tiến độ đã lưu hay không.
3. **Bảng tin "tiếp tục đúng chỗ"** (F5 + F6): đưa nháp lên trên, vào thẳng phiên và thống
   nhất số mục ôn. Tiêu chí: 3/3 lần tới đúng chỗ bằng ≤ 1 chạm ở 360×780.

F7 (vòng lặp Ôn) nên đợi nhật ký thật rồi mới quyết định thiết kế.

## 6. Giới hạn

- Agent đóng vai người học. Không có điểm dễ dùng 1–7 thật, không có nhật ký ngày 3–5 và không
  có số lần chạm nhầm của người thật. Các con số ở đây là số bước tối thiểu theo cách giao diện
  dẫn đường.
- Chưa thử: bàn phím IME tiếng Nhật thật (chỉ giả lập bằng viewport thấp); giọng TTS `ja-JP`
  (máy headless không có, nên 8 câu nghe bị loại); cỡ chữ hệ điều hành thật; iOS Safari hoặc
  Android thật; standalone PWA; sync Supabase, reconnect và retry phía server.
- Thời gian "hôm sau" được giả lập bằng cách lùi `dueAt`; `createdAt` giữ nguyên, nên số "mục
  mới" trong ngày có thể lệch so với dùng thật.
- Vòng quan sát (§2–§5) không sửa code; nguyên mẫu ở §7 được làm sau khi người dùng đồng ý.

## 7. Ngày 6–7 — nguyên mẫu và thử lại (01/10/2026)

Thay đổi chi tiết ở [handoff SPEC-18](../../handoff/SPEC-18.md) và [handoff SPEC-20](../../handoff/SPEC-20.md).
Thử lại trên hồ sơ mới, viewport 360×780 (màn hẹp nhất), script `D:/tmp/maipace-ux/retest.mjs`.

| Ưu tiên | Tiêu chí | Trước | Sau | Ảnh |
| --- | --- | --- | --- | --- |
| 1. Ôn có đề | Mọi câu trong lô có đề | 0/14 | 38/38 (2 lô) | `R-4-review-q1` |
| 2. Kết quả trung thực | Câu sai gán đúng câu trả lời của chính câu đó | Sai 3/13 câu | Khớp 8/8, đúng thứ tự | `R-3-practice-summary` |
| 2. | Tổng kết từ vựng sau khi tải lại | 5/10 | 10/10 | `R-2-vocab-summary` |
| 2. | Câu chữ cuối lô ôn | "Đã ôn hết… rất tốt" (14%) | "Đã xong các mục đến hạn lúc này" | `R-5-review-done` |
| 3. Tiếp tục đúng chỗ | Từ Bảng tin tới thẻ/câu dở | 3 chạm, hàng nháp bị dock che | 3/3 ca ≤ 1 chạm, nằm trong màn đầu | `R-1-dash-vocabdraft`, `R-3-dash-practicedraft` |
| 3. | Số mục ôn Bảng tin = dock | 19 / 9 | 23 / 23 | `R-4-dash-due` |
| 3. | Từ Bảng tin vào phiên Ôn (khi không có nháp) | 2 chạm | 1 chạm | — |

Ba ca "tiếp tục": (1) chỉ có nháp từ vựng → CTA "Tiếp tục"; (2) nháp luyện + mục ôn → hàng tiếp tục ngay dưới
"Bắt đầu ôn"; (3) mục ôn, không có nháp → "Bắt đầu ôn" vào thẳng phiên.

Kết luận: **giữ** cả 3 phương án. Bước tiếp theo vẫn cần người thật: dùng 3–5 ngày trên điện thoại kèm nhật ký,
đặc biệt để xem (a) thứ bậc Ôn trước nháp có ổn không, (b) vòng lặp Ôn ngay sau Học (F7). Sau đó mới quyết F7–F13.
