# Duolingo — nghiên cứu UI/UX (2024–2026)

> Nghiên cứu web ngày 24/09/2026, do agent tổng hợp từ nguồn công khai; chưa dùng app trực tiếp.
> Các mục "(chưa xác minh)" chỉ có từ nguồn thứ cấp. Tổng hợp cho MaiPace: [README](README.md).

## Tóm tắt

- **Learning path (2022)** thay tree bằng lộ trình tuyến tính một "việc tiếp theo", xen ôn tập ngay trên path, unit đặt tên theo mục tiêu giao tiếp. Đây là bài học đáng chép nhất; bằng chứng hiệu quả chủ yếu do Duolingo tự công bố.
- **Màn làm bài**: progress bar mảnh trên cùng, nút Check cố định dưới, bottom sheet phản hồi xanh/đỏ kèm đáp án đúng. Nhịp "trả lời → xác nhận → phản hồi → tiếp tục".
- **Retention** (streak, freeze, leaderboard, notification) được tối ưu bằng hàng trăm A/B test, dựa công khai vào loss aversion. Chính phần này bị phê bình là dark pattern, gây lo âu; năm 2025 thêm phản ứng về hệ Energy và memo "AI-first".
- **Tiếng Nhật**: dạy kana khá tốt, nhưng không có furigana (chỉ toggle romaji), kanji xuất hiện thiếu hệ thống, ngữ pháp dạy ngầm.

## 1. Learning path (redesign 2022)

- **Bỏ tree**: người học không biết mình dùng app "đúng cách" chưa. Path biến "hover method" (học đều các skill) thành mặc định; mỗi level trên path ~ một crown cũ; skill xen kẽ; bài trộn nội dung mới với ôn tập spaced repetition. [blog](https://blog.duolingo.com/new-duolingo-home-screen-design)
- **Cấu trúc** Section > Unit > node. Unit có tiêu đề mục tiêu ("get directions" thay vì "City 3"). Practice gắn trên path để ôn "không có cảm giác đi lùi". Tips gom thành **Guidebook theo unit**. (nguồn như trên)
- **Loại node**: lesson, story, speaking, workout, video, audio. [duolingo-101](https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo)
- **"Jump here?"**: nhảy cóc unit/section bằng một test ngắn, không hint, mạng giới hạn. [Fandom](https://duolingo.fandom.com/wiki/Jump_here%3F), [lingoly](https://lingoly.io/duolingo-jump-here/)
- **Phản ứng**: von Ahn nói mục tiêu "decreasing confusion and increasing learning outcomes", engagement "equivalent"; người dùng lâu năm chê "Candy Crush". [NBC News 25/08/2022](https://www.nbcnews.com/tech/tech-news/duolingos-update-redesign-luis-von-ahn-interview-rcna44655). Con số cải thiện đọc/nghe chỉ có ở nguồn thứ cấp [duoplanet](https://duoplanet.com/duolingo-new-learning-path-review/) (chưa xác minh).
- **Metric "Time Spent Learning Well"** = phút trên path + 0,5 × phút bài khác (06/2024), vì số bài hoàn thành dự báo tiến bộ tốt nhất; cân lại XP của Quests/Leaderboard → ~+1,8M phút/ngày. [blog](https://blog.duolingo.com/time-spent-learning-well/)

## 2. Màn làm bài

- **Progress bar** xám mảnh, lấp xanh dần. [UsabilityGeek](https://usabilitygeek.com/ux-case-study-duolingo/). Thông số 300 ms ease-out (progress), 200 ms (sheet trượt) từ phân tích bên thứ ba [blakecrosley](https://blakecrosley.com/guides/design/duolingo) (chưa xác minh).
- **Check → feedback sheet**: chọn, bấm Check, "ding", banner xanh; sai → banner đỏ kèm đáp án đúng; nút đổi thành Continue. [UsabilityGeek](https://usabilitygeek.com/ux-case-study-duolingo/)
- **Explain My Answer**: nút trong feedback, giải thích lỗi của chính người học (AI), nay miễn phí, có cho tiếng Nhật. [blog](https://blog.duolingo.com/explain-my-answer-now-free) (ngày đăng chưa xác minh)
- **Hearts**: 5 mạng, mất 1 khi sai; hồi bằng practice/gems; bị phê bình tạo "climate of fear" với lỗi. [duolingo-101](https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo), [duoplanet](https://duoplanet.com/its-time-for-duolingo-to-ditch-the-heart-system/)
- **Energy (2025, A/B test)**: 25 đơn vị, mỗi câu tốn 1 dù đúng hay sai; giới hạn cứng cả khi làm đúng. [duoplanet](https://duoplanet.com/duolingo-energy-system/)
- **Word bank**: "tap the words to form a sentence". [screensdesign](https://screensdesign.com/showcase/duolingo-language-lessons)
- **Typo**: sai phím liền kề được chấp nhận kèm cảnh báo; so với danh sách bản dịch chấp nhận. Placement chấm partial credit theo mức nặng của lỗi. [substack](https://mvanec.substack.com/p/duolingo-annoyances), [partial-credit](https://blog.duolingo.com/partial-credit-improvements-to-duolingos-placement-test/)
- **Độ khó i+1**: 5–7 từ mới/bài, Stories dùng 90% nội dung đã học, nhãn "WEAK WORD". [blog](https://blog.duolingo.com/right-level-of-difficulty). Birdbrain chọn bài vừa sức. [blog](https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain)

## 3. Kết thúc phiên, XP, streak

- **XP** ~20/bài, combo +5. [duoplanet](https://duoplanet.com/duolingo-xp-guide/). Bộ chỉ số recap chưa có nguồn chính thức (chưa xác minh).
- **Exit point**: báo rõ "xong mục tiêu ngày" để phiên không vô tận. [growth.design](https://growth.design/case-studies/duolingo-user-retention)
- **Số liệu streak chính thức**: streak 7 ngày → khả năng hoàn thành khóa ×3,6; animation streak +1,7% D7; giữ 2 freeze +0,38% DAU; trích nghiên cứu UPenn/UCLA: **"slack" tạo động lực tốt hơn luật cứng**; thừa nhận dựa vào loss aversion. [blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit)
- 600+ thí nghiệm streak; "Commit to my goal" thay "Continue" tăng retention. [Lenny's](https://www.lennysnewsletter.com/p/behind-the-product-duolingo-streaks). Leaderboard +17% thời gian học; nguyên tắc notification "protect the channel". [Lenny's](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)
- **Phê bình**: streak gây lo âu [ludaxis](https://www.ludaxis.io/blog/gamification-in-apps-duolingo-case-study-2026) (chưa xác minh); dark pattern [SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6846283); Energy "cash grab" [Android Authority](https://www.androidauthority.com/quitting-duolingo-energy-system-3599842/); memo AI-first 04/2025 [Fortune](https://fortune.com/2025/08/18/duolingo-ceo-admits-controversial-ai-memo-did-not-give-enough-context-insists-company-never-laid-off-full-time-employees); 148 khóa AI bị chê "AI slop" [c-sharpcorner](https://www.c-sharpcorner.com/news/duolingo-adds-148-ai-courses-faces-user-backlash).

## 4. Khóa tiếng Nhật

- 3 tab Hiragana/Katakana/Kanji; kana học bằng tracing, trắc nghiệm, ghép; chạm kanji thấy các từ đã học chứa chữ đó; romaji qua "Show pronunciation". [blog](https://blog.duolingo.com/learning-to-read-japanese-characters)
- **Không có furigana**; chạm từ chỉ ra nghĩa. [LingoDeer blog](https://blog.lingodeer.com/duolingo-japanese-review/)
- Phê bình: ngữ pháp ngầm, kanji/hiragana thất thường, câu ví dụ kỳ quặc, chỉ ~N5 [Migaku](https://migaku.com/blog/japanese/duolingo-japanese-review); chấm cứng [PeraPera](https://www.perapera.org/duolingo-japanese-review/); văn AI "đúng nhưng như máy" [mikeydoes](https://mikeydoes.com/articles/duolingo-ai-generated-japanese-course-quality/).

## 5. Onboarding và notification

- Chọn ngôn ngữ → lý do → daily goal → mới/placement → **học bài đầu rồi mới đăng ký**. [Appcues](https://goodux.appcues.com/blog/duolingo-user-onboarding). Nhãn goal Casual/Regular/Serious/Intense bị chê đánh đồng thời lượng với cam kết. [UXologist](https://theuxologist.com/case-studies/habit-forming-within-onboarding)
- Notification: bandit "Recovering Difference Softmax" [KDD 2020](https://research.duolingo.com/papers/yancey.kdd20.pdf); sau 7 ngày: "It looks like reminders aren't working. We'll stop sending them for the time being." [GIGAZINE](https://gigazine.net/gsc_news/en/20240618-duolingo-app-streaks/)

## 6. Design system

- Minh họa chỉ từ khối bo góc, tròn, tam giác bo. [design.duolingo.com](https://design.duolingo.com/illustration)
- Feather Bold (headline), DIN Next Rounded (UI). [Fonts In Use](https://fontsinuse.com/uses/59497/duolingo-app)
- Nút 3D "pressable": viền dưới 4px, nhấn thì tụt 4px, bo 16px. [blakecrosley](https://blakecrosley.com/guides/design/duolingo) (chưa xác minh)
- Rive: nhân vật có viseme điều khiển bằng state machine. [blog](https://blog.duolingo.com/world-character-visemes)

## 7. Accessibility

- Có: tắt bài nghe; "Can't listen now"; phát chậm (rùa); toggle riêng sound effects, haptics, animations, motivational messages. [blog](https://blog.duolingo.com/learning-with-hearing-aids/)
- Hạn chế được báo: chữ nhỏ, tương phản thấp, thiếu nhãn VoiceOver, vùng chạm nhỏ. [Medium](https://medium.com/design-bootcamp/duolingos-usability-and-accessibility-3377013df12e), [AppleVis](https://www.applevis.com/forum/ios-ipados/accessibility-duolingo)

## Nên học / Nên tránh

**Nên học:** một việc tiếp theo; ôn tập nằm trên lộ trình; unit đặt tên theo mục tiêu; nhịp Check → sheet → Tiếp tục cố định dưới; chấm có phân loại lỗi (typo nhỏ nhắc nhẹ, lỗi đổi nghĩa là sai); "slack" thay trừng phạt; exit point "xong cho hôm nay"; toggle a11y theo loại; furigana và ngữ pháp rõ ràng là chỗ vượt Duolingo.

**Nên tránh:** hearts/energy; streak loss-aversion và thông báo gây áy náy; leaderboard/XP làm tiền tệ; nhãn goal phán xét; animation "dopamine"; nội dung AI không rà soát; romaji thay furigana.

## Giới hạn

Không mở được Fandom Streak (402), classcentral (403), một bài Medium (403). Thông số pixel/thời gian animation từ phân tích bên thứ ba.
