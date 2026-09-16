# SPEC-01 — Dữ liệu bài học & sinh câu hỏi

> **Mã:** SPEC-JPN-F01 · **Trạng thái:** Draft · **Ngày:** 16/09/2026
> **Đối tượng đọc:** lập trình viên. **Không bàn giao thiết kế** — spec này không có màn hình.
> **Chặn:** SPEC-02, SPEC-03, SPEC-04, SPEC-05 đều phụ thuộc vào đây.

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
├── lessons/01.json … 25.json     ← Lesson (ngữ pháp + câu ví dụ)
├── vocab/01.json … 25.json       ← VocabWord[]
├── kanji/<chữ>.json              ← đợt sau
├── verbs/verbs.json              ← đợt sau
└── reference/*.json              ← đợt sau
```

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
| `sourceRef` | Thêm mới: `{ book: 'Minna no Nihongo I', pages: '…' }` |

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

- [ ] `web/src/data/n5/{lessons,vocab}/01..05.json` tồn tại, mọi `LocalizedText` có `vi` thật
- [ ] `types/index.ts` đã thêm `'pronoun'`; `pnpm check` exit 0
- [ ] `pickDistractors` không bao giờ trả về đáp án đúng, và ưu tiên cùng đuôi okurigana
- [ ] Cloze trợ từ không sinh câu nào có `＿＿＿` ở vị trí không phải trợ từ
- [ ] `reorder` chỉ trả về câu tách được 4–6 khối
- [ ] `filterExercises` chặn câu có `auxiliaryLessons` vượt `maxLearnedLesson`; chế độ `due`
      chỉ lấy đúng `dueTargetIds`
- [ ] Sinh câu hỏi cho bài 1–5 dưới 100ms, không chạm DOM, không chạm Dexie
- [ ] Mỗi module logic kèm đúng một file `*.test.ts` chạy được bằng `node --test`

## 8. Kiểm chứng

```bash
cd web
pnpm check    # tsc --noEmit && eslint
pnpm test     # node --test src/lib/*.test.ts
```

Test phải phủ: `pickDistractors` (không trùng đáp án, ưu tiên cùng đuôi) · cloze trợ từ
(regex không bắt nhầm kana) · `reorder` (đếm khối) · `filterExercises` (chặn phụ trợ, lọc
theo `dueTargetIds`).
