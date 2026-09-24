# MaiPace — bộ mock mobile

Ngày: 23/09/2026. Tạo bằng built-in image_gen. Đây là concept theo PRODUCT.md, DESIGN.md và SPEC hiện tại; không phải ảnh chụp runtime hay nghiệm thu tính năng. Số liệu và nội dung trong ảnh là minh họa, chưa được xác minh với sách. Các màn audio/tra cứu/tìm kiếm/PWA là thiết kế lộ trình.

Thiết kế mobile 390 × 844 logic; độ phân giải ảnh do công cụ sinh. Nav 5 mục theo hợp đồng mới, khác code cũ 6 mục. Các bảng tham chiếu dùng chung một template đại diện. Mỗi ảnh là một màn hoặc trạng thái quan trọng, không bao gồm mọi tổ hợp loading/error/dark mode.

## Prompt chung

Use case: ui-mockup. Create ONE high-fidelity mobile screen for MaiPace, Vietnamese Japanese-learning app. Portrait 390:844 logical viewport, output about 1024x2216 pixels. Edge-to-edge flat UI screenshot, NO phone frame, no collage, no perspective, no external annotations. Washi design: almost-white warm paper background oklch(0.99 0.002 90), white surfaces, ink text, restrained torii-red primary oklch(0.55 0.2 25), thin warm gray borders, no gradients or decorative illustrations. Inter-like Vietnamese typography, Noto Sans JP-like Japanese, carefully legible diacritics and furigana above kanji. Page gutters 20px, generous whitespace, 24px semibold page title, body16px, Japanese24px. Small radius10-14px, touch targets48px. No global top app bar. For regular pages a floating pill bottom dock with exactly FIVE equal icons and visible labels: Bảng tin, Học bài, Luyện tập, Ôn tập, Thống kê. Active icon/label torii red; others gray. Settings accessible via Home avatar, never a sixth nav item. Do not invent a brand symbol; plain MaiPace wordmark if needed. Safe-area above/below. Mock sample content, no claims of textbook verification. Screen brief: 

## Danh sách và prompt từng ảnh

### 01-bang-tin.png

Home dashboard. Header small MaiPace, greeting 'Chào bạn', profile avatar top-right within page header. ONE primary block: 'Đến giờ ôn rồi', '12 mục cần ôn', short supportive sentence, large red 'Bắt đầu ôn' button. Below separated secondary section 'Bài đang học', 'Bài 5', 'Đi đâu, về đâu', Japanese 'どこへ 行きますか', a subtle progress bar and outlined 'Học tiếp bài 5'. Below simple row '4 nội dung cần củng cố' with 'Xem và luyện lại →'. Quiet footer 'Bạn đã học đều 3 ngày'. No KPI tiles, no daily minute goal, no kanji-of-day. Dock Bảng tin active.

### 02-hoc-bai.png

Học bài, /hoc. Title 'Học bài', subtitle 'Minna no Nihongo · N5', search button. Single-column lesson list Bài 1 Giới thiệu bản thân, Bài 2 Đồ vật quanh ta, Bài 3 Địa điểm, Bài 4 Thời gian, Bài 5 Đi đâu, về đâu. Each Japanese subtitle and thin progress, first 2 complete, next partial. 'Tra cứu →' secondary link. Học bài dock active.

### 03-chi-tiet-bai.png

Lesson detail /hoc/5 at top of scroll. Back 'Học bài', 'Bài 5', 'Đi đâu, về đâu', 'どこへ 行きますか'. Thin progress 12/34 từ. Small 'Nội dung chưa xác minh' note. Từ vựng first: 行きます with い above 行 / đi; 来ます with き above 来 / đến; 帰ります with かえ above 帰 / về. Audio buttons on each. Next section Ngữ pháp: 'Địa điểm へ 行きます', explanation Vietnamese 'Dùng へ để chỉ hướng di chuyển.' One example 学校へ 行きます with furigana and 'Tôi đi đến trường.' Secondary Luyện tập bài này. Học bài active.

### 04-cau-hinh-luyen-tap.png

Practice configuration /luyen-tap. 'Luyện tập', 'Chọn bài đã học', 25 compact number chips 1–25 in five columns, 1–5 selected with red outlines/checks. 'Chọn dạng bài' five chips Trắc nghiệm, Ghép cặp, Điền từ, Sắp xếp, Nghe. 'Số câu' 10 / 15 / 20 / 30, 15 selected. 'Sẵn 42 câu', button 'Bắt đầu 15 câu'. Luyện tập dock active. Compact enough for one viewport.

### 05-trac-nghiem.png

FULLSCREEN quiz NO dock. Top close, 'Luyện tập', 3/15, 01:24, thin red progress. Question 'Chọn nghĩa đúng', large 学生 with がくせい furigana. Lower half four big full-width choices 'Học sinh, sinh viên', 'Giáo viên', 'Bác sĩ', 'Nhân viên công ty'. First choice selected pale red with check, bottom red 'Kiểm tra'. Plenty space above answers.

### 06-ghep-cap.png

FULLSCREEN quiz NO dock. Header close, Luyện tập, 4/15, 01:45. 'Ghép từ với nghĩa', small 'Chọn một từ rồi chọn nghĩa tương ứng.' Lower half 2 columns of four equal48px tiles. Left 学生, 先生, 医者, 会社員 each furigana; right Bác sĩ, Nhân viên công ty, Học sinh, Giáo viên in shuffled order. One matched pair muted green with check icons, others thin borders. Footer '1/4 cặp đã ghép'.

### 07-dien-tu.png

FULLSCREEN quiz NO dock. Close, Luyện tập, 5/15, 02:10. 'Điền trợ từ thích hợp', big '私 __ 学生です。' furigana わたし and がくせい. Translation 'Tôi là sinh viên.' Large focused answer field in lower half with entered は. Hint 'Nhập đáp án bằng tiếng Nhật'. Button Kiểm tra above stylized compact Japanese mobile keyboard occupying bottom quarter, no dock.

### 08-sap-xep.png

FULLSCREEN quiz NO dock. Close, Luyện tập, 6/15, 02:35. 'Sắp xếp thành câu', translation 'Tôi đi đến trường.' Answer area shows two chosen chips 私 は and dotted blank slots. Lower half remaining chips 学校, へ, 行きます with furigana, reset action 'Làm lại', red button 'Kiểm tra'. Exactly one occurrence each of the five phrase tokens, no dock.

### 09-nghe.png

FULLSCREEN quiz NO dock. Close, Luyện tập, 7/15, 03:05. 'Nghe và viết lại', large centered speaker play circle, secondary 'Nghe lại', 'Viết câu bạn nghe được bằng kana.' Lower half Japanese answer field 'がっこうへいきます', clear red 'Kiểm tra', secondary 'Bỏ qua'. Do not show transcript or correct answer elsewhere. No waveform with made-up timing.

### 10-phan-hoi-dap-an.png

FULLSCREEN quiz after correct answer NO dock. Close, Luyện tập, 7/15. 'Chọn trợ từ thích hợp', large '私 は 学生です。' with furigana. Options は selected green check / を / に / で, compact lower-half. Bottom pale success feedback panel 'Chính xác', explanation 'は đánh dấu chủ đề của câu.', 'Tôi là sinh viên.', red 'Tiếp tục'. Show clear status text and check, no confetti.

### 11-ket-qua-luyen-tap.png

FULLSCREEN session result NO dock. 'Kết quả luyện tập', supportive 'Bạn đã hoàn thành phiên học'. '12/15 câu đúng', '80%', 'Thời gian 05:24'. Section 'Câu cần xem lại' with 2 concise Japanese sentence rows with furigana and corrected particle indicated using icon plus text. Footer button Luyện tiếp and secondary Về trang chủ. Calm no trophy, no confetti.

### 12-on-tap.png

/on-tap regular page. 'Ôn tập hôm nay'. '18 mục đến hạn · 5 mục mới', red Bắt đầu ôn. Secondary text '12 từ vựng · 4 ngữ pháp · 2 trợ từ'. Preview non-clickable rows 学生, 行きます, は, each furigana, type and 'Quá hạn 1 ngày' for first. Link Điểm yếu của tôi. Ôn tập dock active.

### 13-phien-on-tap.png

FULLSCREEN review session NO dock. Close 'Ôn tập' 2/18 and timer 00:38. 'Chọn nghĩa đúng', 行きます with い furigana, four lower-half options Đi, Đến, Về, Ăn. First selected pale red. Button Kiểm tra. Same layout as multiple choice practice, no manual difficulty buttons, no setup.

### 14-ket-qua-on-tap.png

FULLSCREEN review result NO dock. 'Kết quả ôn tập', '16/18 câu đúng', '89%', 'Thời gian 06:12'. Calm checked icon. 'Lần ôn kế tiếp' panel with '3 mục vào ngày mai' and '12 mục trong 4 ngày'. Câu cần xem lại two concise rows. Red Về trang chủ, secondary Xem điểm yếu. No ratings, no confetti.

### 15-diem-yeu.png

/on-tap/diem-yeu. Back Ôn tập. 'Điểm yếu của tôi', chips Tất cả, Từ vựng, Ngữ pháp, Kanji, Trợ từ, Nghe wrapping cleanly. Three rows e.g. 行きます / Từ vựng / Sai 3/5 lần / Gần nhất: hôm qua / Ôn tiếp: hôm nay, は / Trợ từ / Sai 2/6 lần, 来ます / Từ vựng / Sai 2/4 lần. Furigana. Button Luyện lại where room. Ôn tập active.

### 16-thong-ke.png

Statistics /thong-ke. 'Thống kê'. Four compact numeric stats in 2x2: Chuỗi ngày 12; Hôm nay 18 phút; Đúng 7 ngày 84%; Đang theo dõi 1.204 mục. A 12-week calendar heatmap labeled 'Nhịp học' monochrome blue with legend, horizontally scrollable frame. Below small blue bars labeled 'Phút học · 14 ngày', numeric axes. Next section 'Tỷ lệ đúng · 30 ngày' a thin blue line chart. Thống kê dock active, no decorative charts.

### 17-cai-dat.png

Settings /cai-dat. Back, 'Cài đặt'. Vertical simple rows separated by hairlines: Hiển thị, Hiện furigana toggle on, Cỡ furigana Thường|Lớn, Ẩn bản dịch toggle off, Giao diện Sáng|Tối|Hệ thống. Example 私は学生です with furigana and Tôi là sinh viên. Học tập: Số mục mới mỗi ngày stepper20, Âm lượng slider. Dữ liệu: Xuất file JSON, Nhập từ file; muted 'Không gồm audio'. Tài khoản link, Audio đĩa CD link. Same five dock labels with no settings sixth item.

### 18-tai-khoan-dong-bo.png

Settings /cai-dat scrolled to Tài khoản, NOT a new login route. Back Cài đặt. Section 'Tài khoản', explanation 'Đăng nhập để đồng bộ tiến độ giữa các thiết bị.' Outlined Google sign-in 'Đăng nhập bằng Google'. Note 'Bạn vẫn có thể học và lưu tiến độ trên máy khi chưa đăng nhập.' Below 'Dữ liệu trên máy' 120 mục ôn tập and 8 phiên luyện tập, Xuất file JSON secondary. Subtle divider, 'Cài lên màn hình chính', iPhone Safari → Chia sẻ → Thêm vào MH chính, Android Chrome → menu → Cài đặt ứng dụng. Normal five dock.

### 19-nhap-du-lieu.png

Settings dimmed background with centered accessible dialog occupying most width. 'Nhập dữ liệu', filename minna-tien-do-2026-09-10.json, summary '1.180 mục ôn tập · 84 phiên', 'Xuất ngày 10/09/2026'. Two radio options Gộp selected / Thay thế unselected. Explain Gộp giữ dữ liệu hiện có; Thay thế xóa dữ liệu hiện có trước khi nhập. Amber icon+text '12 bản ghi không đọc được sẽ được bỏ qua'. Bottom Hủy and Nhập. No keyboard.

### 20-audio-zip.png

/cai-dat/audio planned page. Back Cài đặt, 'Audio đĩa CD', short intro 'Nạp gói ZIP audio của bạn để luyện nghe trên máy này.' Current library '98 track · 412 MB'. 5x5 lesson coverage grid numbered1–25, 7 and19 show 3/4 amber and label 'Thiếu track', remaining check marked. '2 file không khớp mã kiểm tra' with guidance 'Kiểm tra gói ZIP rồi nạp lại'. Outlined Nạp lại file ZIP. Small 'Audio chỉ được lưu trên máy này'. Five dock.

### 21-shadowing.png

/hoc/5 scroll to Audio section planned, not separate route. Back Bài 5. Heading Audio and tabs Từ vựng, Mẫu câu, Câu ví dụ, Hội thoại, latter selected. Large scrubber with A B marks, 00:42 / 03:15. Center red56px play and skip10seconds buttons. Speed0.75×,0.85×,1.0×,1.2×. Next separate row Đặt A, Đặt B, Lặp. 'Câu ví dụ tham khảo' expanded below; note 'Không phải bản chép lời của track'. Japanese 'どこへ 行きますか。' and translation 'Bạn đi đâu?' No timed transcript highlights. Học bài dock.

### 22-tra-cuu.png

Planned /hoc/tra-cuu hub. Back Học bài, heading Tra cứu and search icon. Three large restrained outlined list cards: Kanji / 169 chữ N5 with typographic sample 人; Động từ / 156 động từ · 5 thể with sample 行く; Bảng tham chiếu / 10 bảng with simple table icon. Trailing chevrons. Short helper 'Chọn nội dung bạn muốn xem lại.' Học bài dock active. Spacious, no extra invented categories.

### 23-kanji.png

Planned /hoc/tra-cuu/kanji. Back Tra cứu, heading Kanji, '169 chữ N5'. Filters Bài: Tất cả, Số nét: Tất cả, toggle Chỉ chữ đã học. Four-column grid large kanji 人 日 月 火 水 木 金 土 山 川 田 口 with small lesson labels. A few checked with explicit Đã học labels. Heading controls clean, no stroke animation. Học bài active.

### 24-chi-tiet-kanji.png

Planned /hoc/tra-cuu/kanji/人. Back Kanji. Very large 人, meaning 'Người', chips Bài1,2 nét. Pronunciation lines Âm On ジン・ニン, Âm Kun ひと. Từ ghép rows 日本人 with にほんじん / người Nhật and 三人 さんにん / ba người, audio icons. Next 'Trong bài học' row あの人 with furigana / người kia. 'Chữ dễ nhầm' link 入. Small 'Nội dung minh họa · chưa xác minh'. Học bài active.

### 25-dong-tu.png

Planned /hoc/tra-cuu/dong-tu. Back Tra cứu, title Động từ. Search field 'Tìm động từ', chips Tất cả Nhóm1 Nhóm2 Nhóm3, Bài Tất cả. REAL horizontally scrollable conjugation table with sticky first column. Visible columns Động từ, ます, て and partial next column indicating scroll; not compressed seven columns. Rows 行く/いく, 行きます, 行って; 食べる/たべる, 食べます, 食べて; する, します, して. Group labels Nhóm1 earthy red, Nhóm2 indigo, Nhóm3 green. Footer 'Vuốt ngang để xem các thể khác'. Học bài active.

### 26-bang-tham-chieu.png

Planned reference table /hoc/tra-cuu/bang/ representative reusable template. Back Tra cứu, heading Bảng tham chiếu, subheading Số đếm. Vietnamese short explanation 'Đọc và đối chiếu cách đếm cơ bản.' Simple semantic table columns Số, Cách đọc with rows1 いち,2 に,3 さん,4 よん／し,5 ご,6 ろく,7 なな／しち,8 はち,9 きゅう／く,10 じゅう. A small note 'Cách đọc có thể thay đổi khi đi với từ đếm.' Học bài active. No claims of verification.

### 27-tim-kiem.png

Planned mobile fullscreen search overlay NO dock. Top search field entered 'học sinh', close Hủy. Results under TỪ VỰNG: 学生 with がくせい furigana / học sinh, sinh viên / Bài1. Under KANJI: 学 / học · 8 nét. Large touch rows. Gray helper 'Tìm bằng chữ Hán, kana, romaji hoặc tiếng Việt'. Mobile keyboard in bottom quarter. NO desktop shortcuts.

### 28-ngoai-tuyen.png

**Đã loại khỏi lộ trình 24/09/2026 (SPEC-14), ảnh đã xóa.** Planned /offline. Calm centered cloud-off line icon. 'Trang này chưa được tải về máy'. Explanation 'Những phần bạn đã mở trước đó vẫn dùng được bình thường.' Red Về trang chủ and secondary Ôn tập hôm nay. Thin bottom offline status band 'Đang ngoại tuyến — tiến độ vẫn được lưu trên máy' immediately above five dock. No alarming error styling, no invented retry success.

### 29-dong-bo-lan-dau.png

First login on a new device full-screen blocking progress, NO dock. Plain MaiPace wordmark top. Center small spinner symbol, 'Đang tải tiến độ học của bạn…'. Progress bar at70%, label '840 / 1.204 mục ôn tập'. Subtext 'Vui lòng giữ ứng dụng mở trong giây lát.' No buttons for unrelated navigation. Washi neutral calm.

### 30-xoa-du-lieu.png

Settings dimmed with confirmation dialog. Title 'Xóa dữ liệu học?' Explain 'Mục ôn tập và lịch sử luyện tập sẽ bị xóa. Hãy xuất file trước nếu cần giữ lại.' Radio Chỉ xóa trên máy này selected with description 'Dữ liệu tài khoản có thể được đồng bộ lại'; Xóa cả trên tài khoản unselected. Optional unchecked 'Xóa cả audio đã nạp'. Field 'Gõ XÓA để xác nhận', empty; disabled destructive Xóa dữ liệu button, Hủy enabled. Normal precise modal with no extra warnings.

## Kiểm tra và giới hạn ảnh sinh

Đã xem 30 ảnh và sửa một lượt các lỗi rõ: nền trong suốt ở 05/06, danh sách dư trên Bảng tin, nhãn N4 và lời hứa nhắc lịch ở kết quả ôn. Các PNG dùng để thảo luận hướng thị giác; không phải bản pixel-perfect để lập trình trực tiếp. Công cụ còn tự biến đổi một số chi tiết: nhãn tiến độ ở danh sách bài, lựa chọn nav trên màn thứ cấp, nền sau modal, thiếu nút thoát ở ảnh 13, số cột lưới kanji và một số vị trí furigana. Khi triển khai phải theo spec và nội dung đã đối chiếu, không sao chép những chi tiết này từ ảnh.

## Prompt chỉnh sửa cuối

- 01-bang-tin.png: Remove the entire four-row list inside Cần củng cố (Từ vựng, Ngữ pháp, Nghe hiểu, Đọc hiểu), leaving ONLY the single summary '4 nội dung cần củng cố' and one link 'Xem và luyện lại'. Redistribute whitespace. Keep everything else unchanged.
- 05-trac-nghiem.png: Repair background ONLY: replace every transparent or black canvas region with a FULLY OPAQUE near-white Washi background. The background must be a solid light surface everywhere. Keep ALL black text, Japanese, controls and layout unchanged; no transparency.
- 06-ghep-cap.png: Repair background ONLY: replace every transparent or black canvas region with a FULLY OPAQUE near-white Washi background. The background must be a solid light surface everywhere. Keep ALL black text, Japanese, controls and layout unchanged; no transparency.
- 14-ket-qua-on-tap.png: Remove N4 and N5 badges from Câu cần xem lại and remove the sentence 'MaiPace sẽ nhắc bạn ôn tập đúng lúc.' Keep exact 3 mục vào ngày mai and 12 mục trong 4 ngày. Everything else unchanged. No promises of notifications, no N4 content labels.

