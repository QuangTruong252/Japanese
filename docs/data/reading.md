# Bài Luyện đọc

Kho `web/src/data/n5/reading.json` (`{ version, passages }`) gồm hai dạng bài: `dialogue` (lấy nguyên văn từ
`Lesson.dialogues`) và `passage` (đoạn văn biên soạn). Không sửa `reading.json` tay: soạn draft, kiểm, rồi phát hành bằng script.

## Soạn draft

Nhân vật trong hội thoại và đoạn văn phải khớp `characters.json` (canon, cách xưng hô); thêm nhân vật mới theo [`characters.md`](characters.md).

Mỗi bài một file JSON. Trường chính (kiểu đầy đủ do code app định nghĩa):

| Trường | Ghi chú |
|---|---|
| `id`, `kind`, `titleVi`, `sentences` | 4–10 câu `{ id, jp, vi }`. Hội thoại thêm `roles` và `speaker` mỗi câu; đoạn văn cấm `speaker`. |
| `source` | Hội thoại Minna: `{ kind: 'minna-dialogue', lesson, dialogueId }`; `jp`, `vi`, `roles`, `illustration` phải giống nguyên văn nguồn. |
| `vocabUsed` | Mỗi loại từ một mục. Từ có trong `vocab/lesson-LL.json`: `id = ref = "<lesson>:<wordId>"`, `lesson`. Từ ngoài dữ liệu: `id = "unknown:<slug>"`, `lesson: null`, không `ref`. |
| `grammarUsed` | `"<lesson>:<grammarId>"` (từ `lessons/*.json grammar`) hoặc `"external:<slug>"` (luôn tính là mới). |
| `coverage` | Do script tính; chép kết quả `computeCoverage` vào draft, không nhập tay. |
| `glossary` | Một mục cho mỗi loại từ/mẫu và mỗi tên riêng (xem dưới). |
| `questions` | Đúng 3 câu hỏi tiếng Việt × 3 lựa chọn, một đáp án; `explanationVi`, `evidenceSentenceIds` bắt buộc. |
| `questions[].optionEvidence` | Hồ sơ biên tập, không vào app: `{ [optionId]: sentenceId[] }`. Luật "mọi lựa chọn có trong bài": cả 3 lựa chọn là chi tiết có thật trong bài, cùng loại, chỉ một đúng với vai câu hỏi hỏi (thường thức không được loại được lựa chọn nào). Mục của đáp án đúng phải khớp `evidenceSentenceIds`. `check` chỉ cảnh báo (lựa chọn thiếu mục, câu không tồn tại, đáp án lệch, tổng số câu thiếu) để bài cũ vẫn chạy; `release` bỏ trường này. |
| `properNames` | Đầu vào của script, không vào app: tên riêng ngoài `translation.json` và ngoài tên vai (vd 森 trong câu). |
| `review` | `method: 'ai-multilayer'`, `layers`, `models`, `date`, `nativeReviewed`, và hồ sơ biên tập `signalDecisions`, `needsReview`. |

**ID.** Bài hội thoại `reading-<dialogueId>`, câu `<dialogueId>-<n>` (n từ 1). ID glossary: từ `w:<id>`, mẫu ngữ pháp `g:<id>`,
tên riêng `n:<tên>` (ID từ vựng và ngữ pháp có thể trùng nhau, ví dụ `8:donna`).

**Glossary.** `{ id, kind: 'word'|'grammar'|'name', labelJp, reading?, meaningsVi[], exampleJp?, exampleVi?, vocabRef?, illustration?, anchors[] }`.
- Từ trong vocab: copy nghĩa (`meaningsVi: [meaning.vi]`), ví dụ, `illustration` và `vocabRef { lesson, wordId }`; script so với dữ liệu nguồn.
  Nghĩa theo ngữ cảnh khác nguồn (vd 出ました = tiền ra khỏi máy) hoặc từ/mẫu ngoài dữ liệu: tự soạn nghĩa ngắn và đặt `needsReview: true`.
- Mẫu ngữ pháp: `meaningsVi: [title.vi]`.
- Tên riêng (`kind: 'name'`): nghĩa ngắn ("Mai — tên người"), có anchor ở mọi lần xuất hiện trong câu, **không** thuộc `vocabUsed`/`grammarUsed`,
  không tính coverage, không `ref`/`vocabRef` (không có nút thêm ôn tập). `check` báo tên có trong câu mà thiếu glossary này; tên chỉ nằm ở nhãn vai thì không cần.

**Anchor.** `{ sentenceId, start, end, text }` trên văn bản hiển thị của câu (`jp` sau khi bỏ furigana, ngoặc tùy chọn đổi thành `()`),
chỉ số UTF-16, nửa mở; `text` phải bằng slice. Anchor đi theo **đơn vị từ vựng** (tokenizer đề xuất, người soạn khai báo), không theo token:
- cụm lịch sự/cố định của vocab neo trọn cụm (お願いします, お探しですか, いっしょに, どうぞ よろしく お願いします), không neo riêng 願い rồi gắn する nghĩa "làm";
- số + lượng từ neo trọn cụm (三人, 何人, 七時ごろ, 一万二千円), mỗi thành phần có sẵn trong vocab (人, 時, ごろ, 万, 千, 円…) là một mục glossary cùng anchor;
- động từ/tính từ neo trọn thân + đuôi (行きました, 待っていて, 押してください, 確認して, 寒かった), không neo riêng thân (行き);
- không cắt giữa cụm chữ Hán có furigana; `check` báo anchor từ/tên cắt giữa một đơn vị (anchor ngữ pháp được phép neo một phần).

Mọi đơn vị từ nội dung phải nằm trong ít nhất một anchor; trợ từ, dấu câu, số đứng riêng, tiền/hậu tố và động từ/tính từ phụ được bỏ qua.
**Từ chức năng nằm trong mẫu ngữ pháp đã khai báo** (こと trong Vことができます, の thay danh từ, ほう, ありません sau じゃ) được phủ bằng anchor của mẫu đó và
**không** khai thêm như từ vựng (khai thì đếm là từ mới của bài sau; `check` báo lỗi). Từ đồng âm chọn theo cách đọc (人 = ひと là `5:hito`, không phải `1:jin`).

**Tín hiệu ngữ pháp.** Detector hình thái gắn cờ mẫu có thể có trong câu. Mỗi tín hiệu cần được giải quyết: hoặc `grammarUsed` có mẫu cùng bài với tín hiệu,
hoặc ghi quyết định biên tập trong `review.signalDecisions`: `{ rule, grammarId }` hoặc `{ rule, exception: { sentenceId, reason } }`
(ví dụ cụm cố định học sớm). Không miễn trừ toàn văn bản. "Cùng bài" chỉ là điều kiện tối thiểu của máy: người duyệt vẫn phải đối chiếu từng mẫu với câu.

**Duyệt.** `review.layers` = các lớp đã ghi `{ layer: 1..5, status: 'passed'|'not-applicable', note? }`; draft được thiếu lớp chưa chạy (vd lớp 4),
`release` mới đòi đủ 5. `not-applicable` chỉ dành cho lớp 2 và 5 của hội thoại Minna (nguyên văn giáo trình) và cần `note`. `models` liệt kê đúng model/công cụ đã dùng.

## Chạy

Ở root repo:

```
node scripts/build-reading.mjs check <draft.json...>
node scripts/build-reading.mjs release <draft.json...> [--out <file>]
node --test scripts/build-reading.test.mjs
```

`check` (lớp 1 của quy trình duyệt) kiểm schema, ID, bằng chứng, đơn vị từ/anchor, tên riêng, glossary khớp dữ liệu nguồn, tính lại `coverage`, tín hiệu ngữ pháp chưa giải quyết,
cấu trúc `review`, và in thống kê vị trí/độ dài đáp án để người duyệt lớp 4 xem; thoát mã ≠ 0 khi có lỗi. Thống kê không tự kết luận chất lượng câu hỏi.

`release` chạy lại `check`, chỉ ghi khi mọi draft có `review.layers` đủ lớp 1–5 với `status: 'passed'` (hoặc `not-applicable` hợp lệ). Bài được ghép
vào `reading.json` (thay bản cùng `id`, sắp xếp theo `id`) ở **dạng phát hành**: bỏ `properNames`, `review.signalDecisions`, `review.needsReview`, `needsReview` của glossary và
các trường thừa của lớp duyệt; ghi chú biên tập giữ ở README của bộ nội dung, không vào app. Test app có thể gọi `computeCoverage` (export từ script) để so dữ liệu đã commit
với bản tính lại.

**Tín hiệu chưa khai báo.** Ngoài lỗi "cùng bài", `check` in cảnh báo `mẫu có tín hiệu "<rule>" nhưng chưa khai báo (<id | id>)` khi một tín hiệu (kể cả trợ từ/từ vựng phổ biến: を, で, が nối câu, ね/よ, どんな, 数+人…) chưa có mẫu nào trong `SIGNAL_IDS[rule]` ở `grammarUsed` và chưa có `signalDecisions`.
Đây là danh sách để người soạn đối chiếu (khai báo mẫu hoặc ghi quyết định), không chặn `check`/`release`; `grammarUsed` luôn chỉ là cận dưới của ngữ pháp thật trong bài. `pnpm test` (trong `web/`) cũng chạy `scripts/build-reading.test.mjs`, gồm test khóa `coverage` của `reading.json`.
