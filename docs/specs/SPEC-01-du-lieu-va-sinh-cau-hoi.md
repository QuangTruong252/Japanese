# SPEC-01 — Dữ liệu bài học & sinh câu hỏi

> **Mã:** SPEC-JPN-F01 · **Trạng thái:** Complete (100%) · **Ngày:** 17/09/2026
> **Đối tượng đọc:** lập trình viên. **Không bàn giao thiết kế** — spec này không có màn hình.
> **Đã hoàn thành:** Đã mở khóa cho SPEC-02, SPEC-03, SPEC-04, SPEC-05.

## 1. Mục tiêu & phạm vi

Biến kho dữ liệu N5 của `repo-reference/noken` thành nguồn dữ liệu tiếng Việt của app, và
sinh ra toàn bộ `QuestionItem[]` cho 5 dạng bài **từ chính dữ liệu bài học** — không soạn
một bộ đề riêng.

**Trong phạm vi**

- Thư mục `web/src/data/n5/` và quy tắc chuyển đổi từ noken sang đó
- Module sinh câu hỏi cho cả 5 dạng
- Port `pickDistractors` + `okuriganaTail` + `shuffle` từ noken
- `filterExercises()` theo spec gốc §4.2
- Helper TTS (`speechSynthesis`) — vì nó là điều kiện lọc của dạng `listening`

**Ngoài phạm vi**

- Mọi giao diện. Không có màn hình nào trong spec này
- Ghi Dexie / FSRS — thuộc SPEC-04 và SPEC-05
- Dữ liệu N4 (bài 26–50). Không tồn tại nguồn, là việc soạn nội dung riêng
- Kanji / verbs / reference — dịch ở đợt sau, khi có dạng bài dùng tới
- Đồng bộ Supabase

## 2. Bố cục dữ liệu

```
web/src/data/n5/
├── lessons/lesson-01.json … lesson-25.json   ← Lesson (ngữ pháp + câu ví dụ)
├── vocab/lesson-01.json … lesson-25.json     ← { level, lesson, words: VocabWord[] }
├── kanji/<chữ>.json                          ← SPEC-12
├── verbs/verbs.json                          ← SPEC-12
├── reference/*.json                          ← SPEC-12
└── manifest.json                             ← thống kê bộ dữ liệu
```

Tên file là `lesson-XX.json` ở **cả hai** thư mục, và file vocab là một object bọc
`{ level, lesson, words }` chứ không phải mảng trần. Mọi spec khác trích dẫn theo đúng hai
điều này.

JSON tĩnh, nạp bằng `import()` động để tách khỏi bundle trang chủ. Dữ liệu bài học đi theo
bundle nên **đã offline sẵn** — không cần bảng cache nào.

> **`cached_lessons` cố ý bỏ.** Bảng này xuất hiện trong sơ đồ kiến trúc `project-design-spec.md`
> §2.1 nhưng không có trong schema Dexie §5.1.2, và không cần tồn tại: JSON nằm trong bundle
> thì đã là bản cache rồi. Ghi ra đây để không ai dựng lại nó về sau.

Kiểu dữ liệu: dùng nguyên `Lesson`, `GrammarPoint`, `ExampleSentence`, `VocabWord`,
`QuestionItem`, `PracticeConfig` trong `web/src/types/index.ts`. Không định nghĩa lại.

## 3. Quy tắc chuyển đổi từ noken

| Trường nguồn | Xử lý |
|---|---|
| `jp` | **Giữ nguyên từng ký tự.** Notation furigana `私[わたし]` và dấu cách phân tách bunsetsu đều mang thông tin, xóa là mất |
| `kana`, `id`, `type`, `number`, `lesson` | Giữ nguyên |
| `title`, `description`, `explanation`, `pattern`, `meaning`, `translation`, `note` | Thêm khóa `vi`. **Giữ lại `en`** để đối chiếu khi review bản dịch |
| `es` | Bỏ |
| `sourceRef` | `{ book, pages }` — **chỉ ghi khi đã đối chiếu sách thật**, xem §3.1 |

### 3.1. Trạng thái kiểm chứng — chưa xong, và phải nhìn thấy được

Dữ liệu hiện tại: **25/25 file bài học không có `sourceRef`**, và `docs/n5-manifest.md` §1 ghi
rõ toàn bộ bộ dữ liệu đang `verification_status: unverified` — đã biên tập, **chưa** đối chiếu
từng dòng với ấn bản sách.

Hai hệ quả bắt buộc:

1. **`Lesson.sourceRef` chuyển thành optional** trong `types/index.ts`. Kiểu hiện khai nó là
   bắt buộc trong khi không file nào có — kiểu đang nói dối về dữ liệu. Sửa kiểu cho khớp sự
   thật, **không** điền số trang bịa để thỏa schema.
2. Mỗi `Lesson` mang thêm `verification: 'verified' | 'unverified'` (mặc định `unverified`).
   Chỉ chuyển sang `verified` khi có người đối chiếu bản in và ghi được `sourceRef` thật.

SPEC-03 hiển thị trạng thái này (SPEC-03 §5), SPEC-04 nhắc một lần ở màn cấu hình phiên
(SPEC-04 §5). Nội dung chưa kiểm chứng **vẫn dùng được để học** — nó chỉ không được trưng ra
như thể đã đối chiếu.

**Ba ràng buộc cứng khi dịch:**

1. `LocalizedText.vi` là bắt buộc trong `types/index.ts`. **Không ghi file vào `src/data/`
   khi chưa có `vi`.** Không dùng chuỗi rỗng hay `"TODO"` để lách kiểu — kiểu dữ liệu đã nói
   trường này phải có nghĩa.
2. Thuật ngữ ngữ pháp dùng từ vựng giáo trình Minna bản tiếng Việt: *thể ます*, *thể て*,
   *trợ từ*, *động từ nhóm 1/2/3*, *tính từ đuôi い / đuôi な*. Không tự đặt từ mới.
3. Không dịch phần tiếng Nhật nằm trong `pattern` (`N1 は N2 です` giữ nguyên), chỉ dịch
   phần diễn giải quanh nó.

**`VocabWord['type']` phải thêm `'pronoun'`.** `types/index.ts` hiện liệt kê 9 giá trị;
`noken/src/data/n5/vocab/lesson-01.json` dùng `"type": "pronoun"` ngay ở từ đầu tiên (`私`).
Thêm vào union, không ánh xạ sang `'noun'` — đại từ và danh từ khác nhau khi sinh distractor.

Thứ tự dịch: **bài 1–5 trước**, dựng xong toàn bộ trục sinh câu hỏi rồi mới dịch bài 6–25
theo lô. Dịch cả 25 bài trước khi biết chúng chạy được hay không là đặt cược sai chỗ.

## 4. Sinh câu hỏi

`web/src/lib/questions.ts` — hàm thuần, nhận dữ liệu bài học trả về `QuestionItem[]`, memo hóa
theo tập bài. **Không có build script, không sinh file artifact**: một tệp câu hỏi sinh sẵn là
một thứ nữa có thể lệch pha với dữ liệu nguồn.

### 4.1. `mc` — Trắc nghiệm

Hai biến thể, đều từ `vocab/*.json`:

- **Đọc:** hiện `stripFurigana(word)` → chọn `kana` đúng trong 4 phương án
- **Nghĩa:** hiện `word` (có furigana) → chọn `meaning.vi` đúng trong 4 phương án

Distractor: **port nguyên** `noken/src/utils/distractors.ts` sang `web/src/lib/distractors.ts`.
Thang điểm giữ y hệt — cùng loại từ `+3`, cùng đuôi okurigana `+3`, chênh lệch độ dài
`0/1/≥2 → 2/1/0`, cộng `random()` làm tie-break. Kèm `okuriganaTail()`.

> Lý do giữ nguyên thang điểm: nó tồn tại để một phương án **không thể bị loại bằng hình thái**.
> Distractor ngẫu nhiên biến câu hỏi đọc thành câu hỏi nhận dạng, và người học sẽ có điểm cao
> mà vẫn không biết cách đọc.

Bể lấy distractor: toàn bộ từ vựng của các bài `≤ maxLearnedLesson`, không chỉ bài đang hỏi.

### 4.2. `matching` — Ghép cặp

Bốc 4–5 từ cùng một bài, tạo cặp `word ↔ meaning.vi`. Không cần distractor — các từ trong
cùng lượt đã là nhiễu của nhau.

**Mỗi cặp là một mục tiêu ôn tập riêng.** SPEC-04 §B.2 chấm theo từng cặp, nên một câu
`matching` không thể chỉ mang một `targetId` — bản cài hiện tại gán `targetId` của từ đầu tiên
cho cả nhóm 5 từ, tức là bốn từ còn lại **không bao giờ được lên lịch ôn**, còn từ đầu nhận
kết quả của cả bốn từ kia.

Sửa hợp đồng, thêm một trường vào `QuestionItem`:

```ts
export interface MatchingPair {
  targetId: string;   // vocab-05-12 — lịch ôn riêng của từng từ
  jp: string;         // notation furigana, giữ nguyên
  vi: string;
}

// QuestionItem
pairs?: MatchingPair[];   // bắt buộc khi type === 'matching', không dùng ở 4 dạng còn lại
```

`targetId` của câu matching giữ nguyên là `pairs[0].targetId` để không phá kiểu; **mọi phép
chấm và mọi lần ghi `reviewItems` đọc `pairs`**, không đọc `targetId`.

`answer` bỏ hẳn quy ước chuỗi `"từ:::nghĩa"`. Nối hai nửa bằng dấu phân cách trong một chuỗi là
tự tạo ra một định dạng phải parse lại ở đầu bên kia.

**Ở `mode: 'due'` không dùng dạng matching.** Hàng đợi ôn lên lịch theo từng mục tiêu; gom năm
mục vào một lượt là ghép những mục có hạn ôn khác nhau vào cùng một lần chấm. `filterExercises`
loại `matching` khi `mode === 'due'` — các mục đó vẫn được ôn qua bốn dạng còn lại.

### 4.3. `cloze` — Điền trợ từ

Port từ `noken/src/pages/[...lang]/[level]/practice/particles.astro`. Hai phần giữ nguyên:

**Bể gây nhiễu** (11 trợ từ, mỗi trợ từ ≥5 lựa chọn — *nhiều hơn* 3 phương án một câu cần):

```
は: [が, も, を, に, で]       が: [は, を, に, も, で]
を: [が, に, で, は, へ]       に: [で, へ, を, が, と]
で: [に, を, へ, は, と]       へ: [に, で, まで, を, から]
と: [や, に, も, で, は]       も: [は, と, が, を, に]
から: [まで, に, で, へ, と]   まで: [から, に, へ, で, を]
や: [と, も, の, に, で]
```

> Bể phải lớn hơn số phương án cần. Với bộ ba cố định, riêng tập phương án đã đủ chỉ ra
> đáp án — người học khớp mẫu mà không cần đọc câu.

**Regex nhận diện trợ từ** — chỉ bắt trợ từ đứng sau ranh giới từ tin được (`]` đóng ngoặc
furigana, hoặc katakana) và trước đầu từ kế tiếp (dấu cách, chữ số, kanji, katakana, `「`):

```
(?<=\]|[ァ-ヴー])(は|が|を|に|で|へ|と|も|から|まで|や)(?=[ 　0-9０-９一-龯々ァ-ヴ「])
```

Thay trợ từ khớp bằng `＿＿＿`. **Cố ý bỏ qua** trợ từ đứng sau từ viết toàn kana — ưu tiên
độ chính xác hơn độ phủ, một câu hỏi sai đáp án tệ hơn mười câu hỏi thiếu.

Chấm: `normalizeJapaneseInput()` (đã có trong `src/lib/japanese.ts`) + `acceptedVariants`.

### 4.4. `reorder` — Sắp xếp câu

**Tách câu bằng dấu cách có sẵn trong dữ liệu.** Dữ liệu Minna đã đánh dấu ranh giới bunsetsu
bằng space: `私[わたし]は 会社員[かいしゃいん]です。` → `["私[わたし]は", "会社員[かいしゃいん]です。"]`.

Không cần morphological analyzer, không cần kuromoji. Chỉ nhận câu tách được **4–6 khối**;
câu ra 2–3 khối quá dễ, hơn 6 khối quá dài cho màn hình 390px — loại khỏi bể câu hỏi.

### 4.5. `listening` — Nghe và nhập

Câu ví dụ đọc bằng `speechSynthesis`, đáp án là chuỗi kana của câu. Tốc độ 0.8× / 1.0× qua
`utterance.rate`.

**Đáp án phải là kana, không phải kanji.** Bản cài hiện tại trả `stripFurigana(example.jp)`,
tức là `私は 会社員です` — trong khi người học nghe xong sẽ gõ `わたしはかいしゃいんです`.
`normalizeJapaneseInput` chỉ bỏ khoảng trắng và chuyển romaji sang hiragana, nó **không** đọc
được kanji, nên mọi câu nghe đúng đều bị chấm sai.

Thêm một helper vào `japanese.ts`, cùng họ với `stripFurigana`:

```ts
// 私[わたし]は 会社員[かいしゃいん]です。 → わたしはかいしゃいんです。
export function toKanaSentence(text: string): string;
```

Cách làm: thay mỗi cụm `漢字[かな]` bằng chính phần `かな`, giữ nguyên phần còn lại. Không cần
bộ phân tích hình thái.

**Điều kiện đưa câu vào bể `listening`:** sau khi chuyển, chuỗi kết quả **không được còn ký tự
Hán nào**. Còn kanji nghĩa là câu có chữ chưa ghi cách đọc — loại câu đó khỏi bể, không đoán
cách đọc. Đây cũng là một tiêu chí nghiệm thu, không phải lời khuyên.

Hợp đồng đáp án:

| Trường | Giá trị |
|---|---|
| `answer` | `toKanaSentence(example.jp)` — dạng kana |
| `acceptedVariants` | `[toKanaSentence(jp), stripFurigana(jp)]` — chấp nhận cả người gõ kanji bằng IME |

**`normalizeJapaneseInput` phải bỏ dấu câu** ở cả hai vế trước khi so: `。` `、` `！` `？`
`「` `」` `・`. Người nghe chép chính tả gõ dấu chấm cuối câu hay không là chuyện tùy tay, không
phải chuyện đúng sai tiếng Nhật. Không nới thêm gì khác — sai kana vẫn là sai.

`web/src/lib/tts.ts` — tối đa ~20 dòng: chọn voice `ja-JP`, `speak(text, rate)`, và
`hasJapaneseVoice()` cho bước tiền kiểm tra.

> `speechSynthesis.getVoices()` trả mảng rỗng ở lần gọi đầu trên Chrome cho tới khi sự kiện
> `voiceschanged` bắn. `hasJapaneseVoice()` phải xử lý chỗ này, nếu không mọi câu `listening`
> sẽ bị loại oan ở lần tải trang đầu tiên.

### 4.6. `targetId` và `auxiliaryLessons`

**`targetId`** — khóa nối sang `reviewItems`. Quy ước:

| Loại | Dạng | Ví dụ |
|---|---|---|
| Từ vựng | `vocab-<bài 2 số>-<thứ tự 2 số>` | `vocab-05-12` |
| Ngữ pháp | `grammar-<bài>-<thứ tự>` | `grammar-03-02` |
| Trợ từ | `particle-<romaji>` | `particle-ni` |
| Kanji | `kanji-<chữ>` | `kanji-学` |

Nhiều câu hỏi khác dạng trỏ về **cùng một** `targetId` → cùng một lịch ôn. Đây là cả mục đích
của thiết kế: một từ xuất hiện dưới 5 dạng bài không được biến thành 5 lịch ôn riêng.

**`auxiliaryLessons`** — phần fiddly nhất của spec. Dựng index tra ngược
`Map<surfaceForm, lesson>` từ toàn bộ `vocab/*.json`, khóa là `stripFurigana(word)`.
Với mỗi câu hỏi: `stripFurigana` câu nguồn, quét tìm các surface form có trong index, gom số
bài của chúng. Quét khớp **dài trước ngắn** để `会社員` không bị khớp thành `会社`.

Đây là thứ giữ cho `filterExercises` không đưa câu bài 3 chứa từ bài 17 vào phiên của người mới học.

## 5. `filterExercises()`

`web/src/lib/filter.ts` — copy nguyên từ `project-design-spec.md` §4.2. **Đúng một sửa đổi:**

`availableAudioKeys: Set<string>` đổi nghĩa từ "blob có trong IndexedDB" thành kết quả
`hasJapaneseVoice()` — với TTS không còn khóa audio riêng lẻ, hoặc phát được cả hoặc không
phát được gì.

Luật giữ nguyên và quan trọng hơn trước: câu bị loại vì thiếu audio thì mục tiêu đó
**không bị coi là đã ôn** — `dueAt` giữ nguyên, nó quay lại ở phiên sau. Không bao giờ ghi
review cho câu hỏi chưa từng hiển thị.

## 6. Bảo mật & dữ liệu

Toàn bộ dữ liệu bài học là nội dung tĩnh trong bundle, không chứa thông tin cá nhân, không
rời máy. Module này **không đọc và không ghi** Dexie, không gọi mạng, không gửi telemetry.
`speechSynthesis` xử lý cục bộ trên hầu hết nền tảng nhưng vài trình duyệt dùng giọng đám mây
— spec này chỉ đọc câu ví dụ trong giáo trình, không đọc dữ liệu người dùng, nên không phát
sinh rủi ro rò rỉ.

Nguồn `repo-reference/noken` là **chỉ đọc và không track trong git**. Không sửa file trong đó.

## 7. Tiêu chí nghiệm thu

- [x] `web/src/data/n5/{lessons,vocab}/lesson-01..05.json` tồn tại, mọi `LocalizedText` có
      `vi` thật (thực tế toàn bộ 25 bài đã có đầy đủ `vi`)
- [x] `Lesson.sourceRef` là optional trong `types/index.ts`; **không file nào có `pages` bịa**
- [x] Mọi `Lesson` có trường `verification`; bài chưa đối chiếu sách mang `unverified` (25/25 bài)
- [x] `types/index.ts` đã thêm `'pronoun'`; `pnpm check` exit 0
- [x] `pickDistractors` không bao giờ trả về đáp án đúng, và ưu tiên cùng đuôi okurigana
- [x] Cloze trợ từ không sinh câu nào có `＿＿＿` ở vị trí không phải trợ từ
- [x] `reorder` chỉ trả về câu tách được 4–6 khối
- [x] `filterExercises` chặn câu có `auxiliaryLessons` vượt `maxLearnedLesson`; chế độ `due`
      chỉ lấy đúng `dueTargetIds`
- [x] Sinh câu hỏi cho bài 1–5 dưới 100ms (~24ms), không chạm DOM, không chạm Dexie
- [x] Mỗi module logic kèm đúng một file `*.test.ts` chạy được bằng `node --test` (8 modules + 1 integration test)
- [x] Lớp nạp dữ liệu động `web/src/lib/lessons.ts` (`loadLesson`, `loadVocab`, `loadLessonSummaries`...) có memoize in-memory

**Kiểm tra tích hợp trên dữ liệu thật** — bắt buộc trước khi SPEC-04 dựng wrapper. Bốn tiêu
chí dưới đây **đã cài xong** trong `src/lib/questions.integration.test.ts` và đang xanh; giữ chúng chạy trong `pnpm test`, không xóa khi sửa generator:

- [x] Chạy `generateQuestions` trên **toàn bộ 25 bài**, rồi với mỗi câu `listening`: nạp
      `answer` qua `normalizeJapaneseInput` và so với `normalizeJapaneseInput` của chính chuỗi
      kana người học sẽ gõ → **khớp 100%** (ca hồi quy `わたしはかいしゃいんです` vs
      `私は 会社員です` nằm trong `japanese.test.ts`)
- [x] Không câu `listening` nào có `answer` còn chứa ký tự Hán
- [x] Mọi câu `matching` có `pairs.length === options.length`, và **tập `targetId` trong
      `pairs` không trùng nhau, không sót từ nào của nhóm**
- [x] Mỗi `targetId` sinh ra từ dữ liệu 25 bài đều xuất hiện trong ít nhất một câu hỏi thuộc
      dạng **không phải** `matching` — nếu không, mục đó không ôn được ở `mode: 'due'`

### 7.1. Đã nghiệm thu ngày 17/09/2026

`pnpm check` exit 0 · `pnpm test` 50/50 xanh · `pnpm build` thành công.

Còn lại **không phải việc của spec này**: toàn bộ 25 bài mang `verification: 'unverified'` —
đối chiếu với bản in là việc biên tập nội dung, theo dõi ở `docs/n5-manifest.md` §5.

## 8. Kiểm chứng

```bash
cd web
pnpm check    # tsc --noEmit && eslint
pnpm test     # node --test src/lib/*.test.ts
```

Test phải phủ: `pickDistractors` (không trùng đáp án, ưu tiên cùng đuôi) · cloze trợ từ
(regex không bắt nhầm kana) · `reorder` (đếm khối) · `filterExercises` (chặn phụ trợ, lọc
theo `dueTargetIds`, loại `matching` khi `mode: 'due'`) · `toKanaSentence` (câu còn kanji thì
bị loại) · `normalizeJapaneseInput` (bỏ dấu câu, **không** nới lỏng sai kana).

Bốn kiểm tra tích hợp ở mục 7 chạy trên dữ liệu thật trong `src/data/n5/`, không dùng dữ liệu
giả — đây là loại lỗi chỉ lộ ra khi gặp câu thật.
