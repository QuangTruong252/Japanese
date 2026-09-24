# Renshuu (kèm WaniKani, Bunpro) — nghiên cứu UI/UX (2023–2026)

> Nghiên cứu web ngày 24/09/2026, do agent tổng hợp từ nguồn công khai; chưa dùng app trực tiếp.
> Reddit và Coto Academy (403) không đọc được. Tổng hợp cho MaiPace: [README](README.md).

## Tóm tắt

- **Renshuu**: nội dung rất sâu, bản free rộng; điểm yếu lặp lại là UI dày đặc, "giống trang web hơn app".
- Cơ chế xoay quanh **schedule** (pace, số mục mới/ngày, mục tiêu ôn) và **study vector** — mỗi hướng hỏi có mastery riêng → nguyên nhân chính của dồn bài.
- **WaniKani**: ít cài đặt, lộ trình cố định; mạnh ở dự báo lượt ôn, Wrap Up, Extra Study (lỗi không tính); cố ý không có undo.
- **Bunpro**: Paths theo giáo trình, gợi ý nhiều tầng, furigana theo mức biết, Ghost reviews; undo gây tranh cãi vì làm lệch SRS.
- **Cho MaiPace**: lấy cơ chế của Renshuu (theo bài Minna, furigana ẩn dần, "Mark as wrong") với mật độ/mặc định kiểu WaniKani; hàng đợi ôn chống dồn từ thiết kế.

## 1. Schedule và dashboard

- Chọn mục đích JLPT / giáo trình (Genki, Tobira...) / tự học → tạo mastery schedule. [Google Play](https://play.google.com/store/apps/details?id=com.renshuu.renshuu_org&hl=en_US). Có Minna no Nihongo [forum 9047](https://www.renshuu.org/forums/topics/9047/Minna+no+nihongo+textbook) (mức bám từng bài chưa xác minh).
- Mỗi mục mới kèm quiz; từ vựng ~6 mục/lượt. [languagefinds](https://languagefinds.com/renshuu-review/). Ngữ pháp và từ vựng chung hàng đợi.
- Dashboard: mỗi schedule một khối, 3 kiểu hiển thị simple/compact/very compact. Người dùng thiện cảm vẫn thấy schedule khó hiểu, tính năng "hidden a little too well". [languagefinds](https://languagefinds.com/renshuu-review/)
- Bunpro Paths theo giáo trình; dashboard: bài chờ ôn, dự báo, streak. [Tofugu](https://www.tofugu.com/reviews/bunpro/)

## 2. Quiz và ôn

- Dạng: trắc nghiệm, gõ, viết tay, kéo thả, nghe; Pro có câu và pitch accent.
- **Study vector**: Kanji→Kana, Kana→Kanji, →Definition... bật/tắt từng hướng; mastery nhân theo vector → số câu hỏi tăng mạnh. [forum 6611](https://www.renshuu.org/forums/topics/6611/Split++kanji+&lt;-&gt;+meaning+vector+), [forum 14964](https://www.renshuu.org/forums/topics/14964/I_have_too_many_terms_to_review_each_day!_How_do_I_lower_that)
- **Mark as correct**: trả mục về mức trước câu hỏi rồi hỏi lại cuối quiz; lần hỏi lại quyết định. [forum 565](https://www.renshuu.org/forums/topics/565/Mark+as+correct). **Mark as wrong** khi đoán may.
- **Ẩn lựa chọn trắc nghiệm** cho tới khi tự nhớ; nếu đáp án nghĩ ra không có thì "I don't know". [forum 10071](https://jp.renshuu.org/forums/topics/10071/Tip_for_multiple_choice_users/platest)
- Ngữ pháp 800+ mẫu, nhóm theo chức năng (Time, Cause/Effect) chứ không chỉ JLPT; chạm từ trong câu xem đọc/chia. [languagefinds](https://languagefinds.com/renshuu-review/)
- **WaniKani shake**: gõ kana lớn/nhỏ sai (や/ゃ), sai on/kun → ô nhập rung, gợi ý, cho gõ lại, không tính sai. [WaniKani](https://knowledge.wanikani.com/wanikani/common-mistakes/)
- **Bunpro gợi ý nhiều tầng**: lần 1 nghĩa ngắn, lần 2 dịch cả câu. [Tofugu](https://www.tofugu.com/reviews/bunpro/)

## 3. SRS trên UI và dồn bài

- **Renshuu**: max new terms (5–10), study goal (20–40); giảm dồn bằng pace/chỉ ôn, bỏ vector, đặt trần/ngày; checkbox **"Don't learn new terms until daily review is finished"** [forum 14198](https://jp.renshuu.org/forums/topics/14198/Stop_learning_from_a_schedule_but_keep_reviewing/platest); freeze được thêm sau khi người dùng bỏ app vì quá tải [forum 5366](https://www.renshuu.org/forums/topics/5366/Is+it+possible+to+stop/pause+the+mastery+level+schedule+daily+addition+of+terms).
- **WaniKani** [App Settings](https://knowledge.wanikani.com/wanikani/app-settings/): lesson batch 3–10 (mặc định 5); thứ tự ôn Shuffled / Apprentice First / Lower SRS First / Lower Levels First. **Review Forecast** 5 ngày/24 giờ, cột lũy kế. [Forecast](https://knowledge.wanikani.com/getting-started/widgets/review-forecast/). Dashboard widget 10/2025 bị chê phí chỗ, animation bỏ qua reduced-motion. [announcement](https://community.wanikani.com/t/the-new-dashboard-is-here/71904)
- Khi dồn: cộng đồng khuyên **không** dùng vacation mode; dừng bài mới, ôn theo lô, Wrap Up. [forum](https://community.wanikani.com/t/using-vacation-mode-when-overwhelmed/55924)
- **Extra Study / Recent Mistakes**: lỗi 24h, khó nhất trước, không tính vào SRS. [Extra Study](https://knowledge.wanikani.com/widgets/extra-study/)
- Không undo chính thức (~23% dùng script Double Check). [forum](https://community.wanikani.com/t/double-check-as-a-main-feature-for-wanikani/61542)
- **Bunpro**: Ghost reviews (câu sai tự quay lại); undo khiến sai-rồi-sửa thành đúng → bị coi là lỗi thiết kế [forum](https://community.bunpro.jp/t/bunpro-shouldnt-let-you-correct/76092); người dùng xin FSRS [forum](https://community.bunpro.jp/t/fsrs/129842); vacation mode từng làm mất bài ôn [forum](https://community.bunpro.jp/t/turned-off-vacation-mode-51-reviews-disappeared/74381).

## 4. Tra cứu và furigana

- Từ điển gắn tiến độ, lọc JLPT, biết mức hiểu của bạn với từng từ/kanji. [renshuu.org](https://www.renshuu.org/)
- **Furigana theo trạng thái "biết"**: kanji đã biết không có furigana (đã học / suy ra / tự đánh dấu bóng đèn). [forum 9101](https://jp.renshuu.org/forums/topics/9101&post_id=51453)
- Text Analyzer biến đoạn văn thành danh sách học. Bunpro ẩn furigana theo tài khoản WaniKani.

## 5. Gamification

- Kao-chan, xu, Kao Garden, pets, mini-game (Shiritori Cat 3 mạng...). Mang tính thu thập, không phạt khi nghỉ; áp lực thật đến từ hàng đợi SRS. Có người thích Garden hơn cả việc học. [forum 13254](https://www.renshuu.org/forums/topics/13254/MOST_INTERESTING_FEATURE_OF_RENSHUU_APP)

## 6. Mật độ và phản hồi

- Khen: độ sâu, free, "replaces Bunpro, WaniKani, HelloTalk", dev phản hồi nhanh.
- Chê: "overwhelming and unattractive UI", "too much like a webpage", menu lồng nhau, cài đặt nâng cao dồn vào Pro. [App Store](https://apps.apple.com/us/app/renshuu-japanese-learning/id1542730063), [JustUseApp](https://justuseapp.com/en/app/1542730063/renshuu/reviews)

## 7. Thị giác

- Icon vẽ tay dùng hình + màu cho trạng thái; tô màu phần ngữ pháp mục tiêu trong câu; ~17.000 minh họa tông cute; nhiều khối/nút hơn app tối giản.

## Nên học / Nên tránh

**Nên học:** lối vào theo bài Minna; ôn trước, học mới sau; trần mục mới/ngày và tạm dừng mục mới; dự báo lượt ôn 7 ngày; luyện mục yếu không tính FSRS; shake cho khác biệt được phép; "Mark as wrong" và sửa đáp án kiểu hỏi lại cuối phiên; ẩn lựa chọn cho tới khi tự nhớ (tùy chọn); furigana ẩn dần theo mục đã biết; gợi ý nhiều tầng.

**Nên tránh:** nhân mastery theo hướng hỏi; cài đặt rải rác; vacation mode đóng băng thời gian; undo tính là đúng; gamification trang trí; widget phí chỗ, animation bỏ qua reduced-motion; đổi font hằng ngày.
