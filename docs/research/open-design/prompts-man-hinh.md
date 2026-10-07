# Prompt Open Design cho các màn sau Bảng tin

Ngày: **07/10/2026**. Đây là **đề xuất để thử trong Open Design**, chưa phải spec. Thành phần
từng màn lấy từ SPEC hiện có: Học bài theo SPEC-18, bài theo SPEC-03, luyện theo SPEC-04 và
SPEC-19, ôn theo SPEC-05 và SPEC-20, tra cứu theo SPEC-17. Riêng Bảng tin do người dùng
chốt; các màn còn lại chưa ai duyệt. Hãy sửa danh sách thành phần trước khi generate.

Prompt dùng lại hai nguyên tắc rút ra khi làm Bảng tin (báo cáo
`docs/research/reports/UI UX app học tiếng Nhật.md`):

- **Sân khấu và mảnh giấy:** cảnh minh họa cộng chữ Nhật là sân khấu. Một mảnh giấy đè lên
  mép cảnh chứa nút son duy nhất. Mọi thứ khác là dòng chữ có chevron, không đóng khung.
- **Ít lệnh cấm, nhiều hướng dẫn cụ thể:** mỗi prompt nói rõ nên làm gì, chỉ cấm vài điều
  quan trọng.

## Thứ tự làm

| # | Màn | Lý do |
|---|---|---|
| 1 | Học bài `/hoc`: lộ trình 25 bài | Đã chốt trong SPEC-18, nối thẳng từ Bảng tin |
| 2 | Chi tiết bài `/hoc/[so]` | Màn đọc chính |
| 3 | Câu hỏi luyện tập (mobile) | Dùng nhiều nhất, khó nhất: không cuộn, ngón cái |
| 4 | Ôn tập `/on-tap` | Nhận khối "Củng cố" chuyển từ Bảng tin |
| 5 | Luyện tập `/luyen-tap` | Màn cấu hình |
| 6 | Kết quả phiên | Dùng chung cho Luyện và Ôn |
| 7 | Tra cứu `/hoc/tra-cuu` | Hub đơn giản, làm sau cùng |

Tải lên thêm ở bước này:

- `artwork/illustrations/scenes/department-store-v1.png`: mẫu cảnh Bài 3.
- `artwork/illustrations/scenes/self-introduction-v1.png`: Bài 1.
- `artwork/illustrations/ui/states/review-complete-v1.png`: trạng thái ôn xong.

## Đoạn mở đầu chung

Dán đoạn này khi mở cuộc trò chuyện mới. Nếu vẫn tiếp tục cuộc trò chuyện của Bảng tin thì
không cần.

```text
Continue the MaiPace redesign with the same system as Home. Shared rules:
- Primary is son #bf412c: at most ONE filled son button per screen. Ink #29231d on paper
  #fbf6ec; cards #fefbf7 with 1px #e2d8c8 hairline, radius 14px; buttons radius 10px.
- "Stage + paper slip": illustration scenes are full-bleed, fade into the paper, never
  boxed. The single main action sits on a paper slip overlapping the scene's bottom edge.
- Secondary items are plain rows separated by hairlines; the whole row is the link,
  chevron right, no extra buttons.
- Exactly 3 text sizes per screen besides Japanese. Japanese (Noto Sans JP, furigana as
  ruby) is always the largest text in its block. Copy is Vietnamese and short: titles about
  6 words, one supporting line, numbers inside sentences ("12/30 từ").
- Status always icon + label + color. Bottom nav (Bảng tin, Học bài, Luyện tập, Ôn tập,
  Tra cứu) below 1024px; left sidebar at 1280px. Show 390px first, then 1280px.
```

## 0. Bảng tin (tạo lại từ đầu)

Prompt này dùng riêng được, không cần đoạn mở đầu chung. Thành phần theo SPEC-18 bản 2, do
người dùng chốt ngày 06/10/2026.

```text
Design MaiPace Home "Bảng tin" (/) — a glanceable summary: in 5 seconds the learner knows
where they are and what is waiting. Each block has exactly one link. Show 390px first,
then 1280px; light, then dark.

System: paper #fbf6ec, ink #29231d, cards #fefbf7 with 1px #e2d8c8 hairline, radius 14px,
buttons radius 10px. Son #bf412c is the primary: exactly ONE filled son button on the
screen. Inter for Vietnamese, Noto Sans JP for Japanese with furigana as ruby. Exactly 3
text sizes besides Japanese. Bottom nav below 1024px: Bảng tin (active, son), Học bài,
Luyện tập, Ôn tập (badge 12), Tra cứu; left sidebar at 1280px.

Layout "stage + paper slip":
1. Greeting, one small line on the paper: "Chào buổi chiều".
2. Stage: the department-store scene of the current lesson, full-bleed, fading into the
   paper at its bottom, never boxed. A character "says" the sentence of the day in an HTML
   speech bubble (tail pointing to the character): ここは 会議室[かいぎしつ]です。 as the
   LARGEST text on the screen, "Đây là phòng họp." small below, speaker button inside the
   bubble. Cap scene height so the slip below is fully visible in the first viewport.
3. Paper slip: a card overlapping the scene's bottom edge by ~32px holding only the most
   urgent block, as a sentence with numbers: "12 mục đến hạn · khoảng 3 phút" + son button
   "Bắt đầu ôn".
4. Other blocks as plain rows separated by hairlines, whole row is the link, chevron right,
   no buttons, no card frames:
   "Phiên dở · Luyện tập Bài 2 · câu 6/15 ›"
   "Bài 3 · Nơi chốn và giá cả · 12/42 từ" with a thin progress bar ›
5. 1280px: stage on the left 7/12, slip + rows on the right 5/12, max width 1024px.

Frames to show (urgency order: due reviews → draft → current lesson):
- Reviews due (above).
- No reviews, has draft: the draft becomes the slip ("Tiếp tục"); a quiet row
  "Hôm nay đã ôn xong · lượt tiếp theo ngày mai".
- No reviews, no draft: the lesson becomes the slip ("Tiếp tục Bài 3").
- New learner: stage of Bài 1 (self-introduction scene) + slip "Bắt đầu Bài 1" only.
- Loading skeleton and an error line "Không tải được dữ liệu · Thử lại".

Not on this screen: streaks, charts, weekly rhythm, the 25-lesson route, Kana shortcuts,
tips or paragraphs. Titles about 6 words, one supporting line per block.
```

## 1. Học bài: lộ trình 25 bài

**Thành phần:** tiêu đề; sân khấu bài đang học; tuyến 25 bài chia ba trạng thái; ô "Lọc bài
học". Bài nào cũng mở được, không khóa.

```text
Design "Học bài" (/hoc) as a stepped route of 25 Minna no Nihongo N5 lessons, like stations
on one quiet train line drawn in ink.
- Top: h1 "Học bài" + one line "25 bài · đã học 2". Small "Lọc bài học" text field at right.
- Current lesson as the stage: its scene full-bleed (use department-store for Bài 3), then a
  paper slip overlapping the bottom edge: "Bài 3 · Nơi chốn và giá cả", Japanese title
  これを ください as the largest text, "12/42 từ" with a thin progress bar, and the only son
  button "Tiếp tục Bài 3".
- Below: a vertical line on the left with one node per lesson; each row on the right shows a
  small scene thumbnail (64px, rounded 10px), "Bài N", Vietnamese title, Japanese title,
  and status. Learned: moss check icon + "Đã học", thumbnail in full color. Current: son
  ring node. Not started: hollow node, thumbnail desaturated (grayscale 80%, opacity 60%),
  "Chưa học". Every row is a link; no locks.
- Group stations by five ("Bài 1–5", "Bài 6–10"…) with tiny section labels so the 25 rows
  scan easily.
- 1280px: stage sticky in the left 5/12 column; the route scrolls in the right 7/12.
- States: new learner (stage is Bài 1 "Bắt đầu Bài 1", all others not started), all lessons
  learned (stage becomes the last lesson, button "Ôn lại Bài 25" stays secondary, no son).
```

## 2. Chi tiết bài

**Thành phần:**

1. Sân khấu (cảnh của bài) với tên bài.
2. Mảnh giấy "Học từ vựng" / "Tiếp tục học từ vựng".
3. Ba dòng lối tắt: Ngữ pháp, Luyện nghe, Xem toàn bộ bài.
4. Phần tham khảo: Từ vựng, Ngữ pháp, Nghe.
5. Dòng phụ "Luyện tập bài này".

```text
Design lesson detail "/hoc/3", reading width 672px.
- Stage: department-store scene full-bleed with back arrow "Học bài". Under it "Bài 3",
  Japanese title これを ください (largest text), Vietnamese "Nơi chốn và giá cả".
- Paper slip on the scene edge: "Đã học 12/42 từ" + thin bar + the only son button
  "Tiếp tục học từ vựng".
- Three shortcut rows with chevrons: "Ngữ pháp · 6 mẫu", "Luyện nghe", "Xem toàn bộ bài".
- Reference below, anchored sections with small uppercase labels:
  TỪ VỰNG: rows of ここ / chỗ này, ở đây · そこ / chỗ đó · あそこ / chỗ kia, with a speaker
  icon button per row; Japanese 18px, meaning small muted.
  NGỮ PHÁP: block title "ここ／そこ／あそこ — Đại từ chỉ nơi chốn", pattern in a cream (#f4ecde)
  block, two-line explanation, example ここは 会議室[かいぎしつ]です。 / "Đây là phòng họp."
  with speaker. Japanese example 20px with furigana.
  NGHE: compact shadowing player; missing-audio variant says "Chưa có audio bài này" with
  link row "Thêm audio trong Cài đặt".
- End: plain row "Luyện tập bài này ›" (not a son button).
```

## 3. Câu hỏi luyện tập

**Thành phần:**

- Thanh trên: nút đóng, tiến độ, số câu.
- Vùng câu hỏi.
- 4 lựa chọn ở nửa dưới màn.
- Tấm phản hồi trượt lên từ đáy.

Màn này không cuộn. Bài được chấm ngay khi chọn, không có nút "Kiểm tra".

```text
Design the practice question screen at 390×844, three frames side by side: unanswered,
correct, wrong. No page scroll; nav bar hidden during a session.
- Top bar: close (×) left, thin progress bar centered, "7/20" right.
- Question zone (upper half, on paper): small muted instruction "Chọn nghĩa đúng", then
  the prompt あそこ at 64px in Noto Sans JP, a speaker button below it.
- Answer zone (lower half, thumb reach): 4 full-width options, 56px tall, radius 14px,
  card fill + hairline, 8px gap: "chỗ này" · "chỗ đó" · "chỗ kia" · "cái này".
  Tapping grades immediately.
- Correct frame: chosen option turns moss #427138 with check icon; a sheet slides up
  from the bottom: "Đúng rồi", the full sentence あそこは トイレです。 with furigana,
  "Chỗ kia là nhà vệ sinh.", and the only son button "Tiếp tục" (48px tall, full width).
- Wrong frame: chosen option crimson #ba2936 with × icon and label "Chưa đúng", correct
  option outlined moss with "Đáp án đúng"; same sheet content.
- Dark variant of the wrong frame.
```

## 4. Ôn tập

**Thành phần:**

1. Sân khấu: số mục đến hạn và nút "Bắt đầu ôn".
2. Dòng phân rã theo loại.
3. Xem trước lô (chỉ xem, không bấm).
4. "Cần củng cố": 3 mục sai nhiều nhất, chuyển từ Bảng tin sang.
5. Dòng "Điểm yếu của tôi".

```text
Design "Ôn tập" (/on-tap), width 672px, three states.
- Due state: h1 "Ôn tập hôm nay". Paper slip (no scene here, keep it calm): sentence
  "18 mục đến hạn · 5 mục mới" as the largest text, "khoảng 6 phút" below, the only son
  button "Bắt đầu ôn". One line under it: "12 từ vựng · 4 ngữ pháp · 2 trợ từ".
- "Lô này": preview of 5 rows, view-only (no chevrons, not links): Japanese item with
  furigana + small type label; overdue rows carry a wood-ochre "Quá hạn" badge with clock
  icon. Footer line "và 13 mục khác".
- "Cần củng cố": 3 rows of most-missed items (Japanese large, Vietnamese meaning small,
  "sai 4 lần"), then link row "Điểm yếu của tôi ›".
- Done state: review-complete illustration full-bleed fading into paper, sentence
  "Hôm nay đã ôn xong" + "Lượt tiếp theo: 3 mục vào ngày mai". No son button; "Cần củng
  cố" rows stay.
- Quota state: "Đã đạt hạn mức mục mới hôm nay" with info icon; never say "đã ôn xong".
```

## 5. Luyện tập: cấu hình

**Thành phần:**

1. Banner nháp, nếu có.
2. Mảnh giấy tóm tắt cùng nút "Bắt đầu N câu".
3. Phần "Tùy chỉnh" thu gọn được, chứa:
   - chọn bài;
   - chọn dạng câu;
   - chọn số câu;
   - dòng cho biết còn bao nhiêu câu.

```text
Design "Luyện tập" (/luyen-tap), width 576px.
- If a draft exists: a top row "Phiên dở · Trắc nghiệm Bài 3 · 6/15" with "Tiếp tục ›"; the
  son button then belongs to the draft, and the new-session button below becomes secondary.
- Paper slip: "Bài 3 · 15 câu" largest, "Trắc nghiệm, Điền từ, Nghe" small, son button
  "Bắt đầu 15 câu".
- Collapsible "Tùy chỉnh" (closed by default, shown open in a second frame):
  lessons as number chips 1–25 in rows of five, multi-select, selected = sakura #ffe7e1 with
  #7e3124 text and check; "Chọn tất cả" text button. Five type chips: Trắc nghiệm · Ghép
  cặp · Điền từ · Sắp xếp · Nghe. Count as a segmented control 10 / 15 / 20 / 30.
  Availability line: "Sẵn 42 câu · 3 câu nghe bị loại (máy chưa có giọng Nhật)".
- Empty variant: button disabled with the reason and a fix ("Chọn thêm bài hoặc bỏ Nghe").
```

## 6. Kết quả phiên

**Thành phần:**

1. Câu tổng kết có số liệu.
2. Minh họa nhỏ.
3. Danh sách câu sai kèm đáp án.
4. Nút "Luyện tiếp" và dòng "Về Bảng tin".

Bản cho Ôn tập thêm dòng lịch ôn kế tiếp.

```text
Design the session result screen, width 576px, practice and review variants.
- Small scene vignette (eating-together, 160px tall, fading into paper), then
  "16/20 câu đúng" as the largest text and "4 phút · Bài 3" below. No confetti, no score ring.
- "Câu cần xem lại": rows with the Japanese prompt, the learner's answer struck through in
  crimson with × icon, the correct answer in moss with check icon.
- Son button "Luyện tiếp"; plain row "Về Bảng tin ›".
- Review variant: title "Đã ôn 18 mục", extra line "Lần ôn kế tiếp: 3 mục ngày mai, 12 mục
  trong 4 ngày"; if more items are due, son button "Ôn lô tiếp", otherwise only the row.
```

## 7. Tra cứu

**Thành phần:** ô tìm kiếm ở đầu và 4 danh mục. Màn này không có nút son, vì hành động chính
là gõ để tìm.

```text
Design "Tra cứu" (/hoc/tra-cuu), width 672px.
- h1 "Tra cứu", then a large search field "Tìm từ, chữ, ngữ pháp…" (48px, search icon,
  opens the existing search dialog).
- Four category tiles in a 2×2 grid, each led by a big Japanese glyph as its picture
  instead of an icon: あ "Kana · Bảng chữ cái và cách viết", 字 "Kanji · Chữ Hán N5",
  行く "Động từ · Chia theo nhóm", 表 "Bảng tham chiếu · Số đếm, thời gian, trợ từ".
  Glyph 40px in ink, title medium, description small muted. Whole tile is the link.
- 1280px: four tiles in one row.
- No son button on this screen.
```

## Prompt gộp: tạo cả app một lần

Dùng khi muốn có một prototype bấm qua lại được giữa các màn. Prompt càng dài, AI càng dễ
làm qua loa từng màn. Màn nào yếu thì sửa lại bằng prompt riêng của màn đó ở trên.

```text
Build a clickable multi-screen prototype of MaiPace, a Japanese self-study app for
Vietnamese learners (Minna no Nihongo N5). Every screen at 390px, then 1280px; light mode,
plus dark for Home and the wrong-answer frame. Screens link to each other.

SYSTEM (all screens)
- Paper #fbf6ec, ink #29231d, cards #fefbf7 + 1px #e2d8c8 hairline, radius 14px, buttons
  10px. Son #bf412c = primary: at most ONE filled son button per screen. Moss #427138
  correct, crimson #ba2936 wrong, wood #9d621e overdue, sakura #ffe7e1 selected.
- Inter for Vietnamese, Noto Sans JP for Japanese, furigana as ruby. Japanese is the
  largest text in its block. Exactly 3 text sizes besides Japanese. Copy short: titles
  about 6 words, one supporting line, numbers inside sentences.
- "Stage + paper slip": scenes are full-bleed, fading into the paper, never boxed; the one
  main action sits on a paper slip overlapping the scene's bottom edge. Everything else is
  plain hairline rows, whole row is the link, chevron right.
- Status = icon + label + color. Bottom nav below 1024px (Bảng tin, Học bài, Luyện tập,
  Ôn tập, Tra cứu), left sidebar at 1280px; hidden inside practice sessions.
- No streaks, rings, confetti, gradients, glass or tips paragraphs.

SAMPLE DATA: current lesson Bài 3 "Nơi chốn và giá cả", これを ください, 12/42 từ, 6 mẫu
ngữ pháp, scene department-store. Sentence: ここは 会議室[かいぎしつ]です。 "Đây là phòng họp."
Vocab: ここ chỗ này · そこ chỗ đó · あそこ chỗ kia. 12 mục đến hạn, draft "Luyện tập Bài 2 ·
câu 6/15".

1. BẢNG TIN (/): greeting line "Chào buổi chiều"; stage = lesson scene with a speech bubble
   holding the sentence of the day (largest text, meaning small, speaker button); slip
   "12 mục đến hạn · khoảng 3 phút" + son "Bắt đầu ôn"; rows "Phiên dở · Luyện tập Bài 2 ·
   câu 6/15 ›" and "Bài 3 · 12/42 từ" with thin bar ›. 1280px: stage 7/12 left, slip + rows
   right. Extra frame: new learner = stage + slip "Bắt đầu Bài 1" only.
2. HỌC BÀI (/hoc): h1 + "25 bài · đã học 2" + small "Lọc bài học" field. Stage of Bài 3
   with slip (これを ください largest, 12/42 từ bar, son "Tiếp tục Bài 3"). Then a vertical
   ink line with one station per lesson, grouped by five: 64px scene thumbnail, "Bài N",
   titles, status (moss check "Đã học" / son ring current / hollow "Chưa học" with
   desaturated thumbnail). No locks. 1280px: stage sticky left 5/12.
3. CHI TIẾT BÀI (/hoc/3), 672px: back "Học bài"; stage with "Bài 3", これを ください,
   "Nơi chốn và giá cả"; slip "Đã học 12/42 từ" + son "Tiếp tục học từ vựng"; rows
   "Ngữ pháp · 6 mẫu", "Luyện nghe", "Xem toàn bộ bài"; sections TỪ VỰNG (rows with speaker),
   NGỮ PHÁP (pattern in cream #f4ecde block, short explanation, example with furigana +
   speaker), NGHE (compact player); last row "Luyện tập bài này ›".
4. CÂU HỎI (session, 390×844, no scroll): × + thin progress bar + "7/20"; instruction
   "Chọn nghĩa đúng", prompt あそこ at 64px + speaker; 4 options in the lower half, 56px,
   8px gap. Graded on tap, no "Kiểm tra" button. Frames: unanswered; correct (moss + check,
   bottom sheet "Đúng rồi", sentence あそこは トイレです。, meaning, son "Tiếp tục");
   wrong (crimson + × "Chưa đúng", correct option outlined moss "Đáp án đúng"); wrong in
   dark.
5. KẾT QUẢ: small scene vignette, "16/20 câu đúng" largest, "4 phút · Bài 3"; rows of
   missed items (your answer struck in crimson, correct in moss); son "Luyện tiếp",
   row "Về Bảng tin ›".
6. ÔN TẬP (/on-tap), 672px: slip "12 mục đến hạn · 5 mục mới", "khoảng 6 phút", son
   "Bắt đầu ôn", line "8 từ vựng · 3 ngữ pháp · 1 trợ từ"; "Lô này" view-only preview rows
   (overdue badge "Quá hạn"); "Cần củng cố" 3 most-missed items; row "Điểm yếu của tôi ›".
   Extra frame: done = review-complete illustration + "Hôm nay đã ôn xong · lượt tiếp
   theo ngày mai", no son button.
7. LUYỆN TẬP (/luyen-tap), 576px: slip "Bài 3 · 15 câu", types small, son "Bắt đầu 15 câu";
   collapsible "Tùy chỉnh": lesson chips 1–25 in rows of five, 5 type chips (Trắc nghiệm,
   Ghép cặp, Điền từ, Sắp xếp, Nghe), segmented 10/15/20/30, line "Sẵn 42 câu".
8. TRA CỨU (/hoc/tra-cuu): h1, large search field "Tìm từ, chữ, ngữ pháp…", 2×2 tiles led by
   a big Japanese glyph: あ Kana, 字 Kanji, 行く Động từ, 表 Bảng tham chiếu, one-line
   descriptions. No son button.

Flow to wire: Home slip → Câu hỏi (review) → Kết quả → Home; Home lesson row → Chi tiết
bài; nav Học bài → Học bài → station → Chi tiết bài.
```

## Sau khi có bản ưng ý

- Mỗi màn chụp 390px và 1280px, cả sáng và tối.
- Cập nhật thành phần đã chốt vào SPEC tương ứng.
- Không dán export của Open Design đè lên `globals.css` (xem `README.md`).
