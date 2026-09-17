# SPEC-04 — Luyện tập: khung phiên & 5 dạng bài

> **Mã:** SPEC-JPN-F04 · **Trạng thái:** Draft · **Ngày:** 16/09/2026
> **Đối tượng đọc:** Google Stitch / Claude Design (mục 3–6 và phần B), lập trình viên (toàn bộ).
> **Phụ thuộc:** SPEC-01 (câu hỏi + `filterExercises` + TTS), SPEC-02 (khung nav).

## 1. Mục tiêu & phạm vi

Trục chính của app: chọn phạm vi luyện → làm một loạt câu hỏi → chấm tự động → ghi kết quả
vào Dexie theo lịch FSRS. Một wrapper quản lý lượt làm bài dùng chung cho **cả 5 dạng**;
mỗi dạng chỉ là một component cắm vào.

**Trong phạm vi**

- `/luyen-tap` — màn cấu hình phiên
- `/luyen-tap/phien` — màn làm bài (wrapper + 5 dạng)
- Màn kết quả cuối phiên
- Đo `elapsedMs` mỗi câu, chấm nhị phân, ánh xạ sang FSRS `Rating`
- Ghi Dexie trong **một transaction duy nhất**

**Ngoài phạm vi**

- Chế độ ôn theo lịch (`mode: 'due'`) và màn "Điểm yếu của tôi" — thuộc SPEC-05.
  Wrapper ở đây phải nhận được `PracticeConfig` cả hai chế độ, nhưng lối vào `due` do SPEC-05 dựng
- Đẩy `pendingSync` lên Supabase — F08 hoãn. Spec này chỉ *ghi vào* bảng `pendingSync`
- Trình phát Shadowing A-B — F10 hoãn
- Audio ZIP đĩa CD — F09 hoãn. Dạng 5 dùng TTS
- Hệ thống gợi ý (`usedHint`) — `rateAnswer` đã nhận tham số này, spec này luôn truyền `false`.
  Giao diện gợi ý để đợt sau

## 2. Dữ liệu

| Nguồn | Chiều | Dùng cho |
|---|---|---|
| `src/lib/questions.ts` (SPEC-01) | Đọc | Sinh `QuestionItem[]` |
| `src/lib/filter.ts` — `filterExercises()` | Đọc | Lọc theo bài, kiến thức phụ trợ, dạng, audio |
| `src/lib/fsrs.ts` — `rateAnswer`, `applyReview` | Gọi | Ánh xạ kết quả → lịch ôn. **Đã có, không viết lại** |
| `src/lib/japanese.ts` — `normalizeJapaneseInput` | Gọi | Chấm dạng 3 và 5 |
| `db.reviewItems` | Đọc + ghi | Lịch ôn theo `targetId` |
| `db.practiceSessions` | Ghi | Lịch sử phiên |
| `db.pendingSync` | Ghi | Hàng đợi đồng bộ |
| `useUIStore` | Đọc/ghi | `selectedLessons`, `selectedTypes`, `questionCount`, `currentQuestionIndex` |

**Ghi cuối phiên — một transaction Dexie duy nhất:**

```ts
await db.transaction('rw', db.practiceSessions, db.reviewItems, db.pendingSync, async () => {
  // 1. practiceSessions.add(session)
  // 2. reviewItems.bulkPut(cập nhật theo từng targetId)
  // 3. pendingSync.add({ payload, createdAt })
});
```

> **Không ghi qua Zustand.** UI cập nhật nhờ `useLiveQuery`, nên không tồn tại trạng thái
> "store đã đổi nhưng DB chưa ghi" để phải đồng bộ tay. Zustand chỉ giữ con trỏ câu hỏi và
> bộ lọc đang chọn — thứ mất đi không sao khi tải lại trang.

### 2.1. Hợp đồng kết quả một lượt trả lời

Một lượt trả lời có thể sinh **nhiều** kết quả: dạng ghép cặp chấm theo từng cặp (§B.2), mỗi
cặp là một mục tiêu riêng (SPEC-01 §4.2). Callback của wrapper vì thế nhận một mảng:

```ts
interface AnswerResult {
  targetId: string;
  targetType: TargetType;
  isCorrect: boolean;
  elapsedMs: number;      // đo riêng cho từng cặp ở dạng matching
  usedHint: boolean;      // luôn false ở phase này
}

type OnAnswer = (results: AnswerResult[]) => void;
```

Bốn dạng còn lại trả mảng đúng một phần tử. Một hợp đồng cho cả năm dạng; wrapper không cần
biết dạng nào đang chạy.

### 2.2. Median thời gian trả lời — cần chỗ lưu thật

`rateAnswer(isCorrect, elapsedMs, medianMs, usedHint)` cần `medianMs` **của chính mục tiêu đó**,
mà `ReviewItem` hiện không có chỗ nào chứa nó, và `fsrsCard` là shape do `ts-fsrs` định nghĩa —
không nhét thêm trường vào đó.

Thêm hai trường vào `ReviewItem` (và migration Dexie version 2):

```ts
recentElapsedMs: number[];   // tối đa 5 mẫu gần nhất, đẩy vào cuối, cắt đầu
createdAt: string;           // ISO — thời điểm mục tiêu được đưa vào lịch ôn lần đầu
```

- `medianMs` = median của `recentElapsedMs`; mảng rỗng → `null` → `rateAnswer` trả `Good`.
- Chỉ giữ 5 mẫu: người học nhanh dần theo thời gian, median toàn lịch sử sẽ luôn tụt hậu.
- **Chỉ ghi mẫu khi trả lời đúng.** Thời gian của một câu trả sai không nói gì về độ thành thạo.
- `createdAt` là thứ SPEC-05 dùng để đếm mục mới trong ngày — `fsrsCard.reps === 0` **không
  dùng được**, vì ngay sau lần trả lời đầu tiên `reps` đã là 1.

Migration Dexie version 2 điền `recentElapsedMs: []` và `createdAt` = `updatedAt` cho bản ghi cũ.

**Ánh xạ kết quả → FSRS `Rating`** (`project-design-spec.md` §4.3.3, đã cài trong `fsrs.ts`):

| Kết quả | Điều kiện | Rating |
|---|---|---|
| Sai | — | `Again` |
| Đúng | `elapsedMs > 2 × median` | `Hard` |
| Đúng | trong khoảng bình thường | `Good` |
| Đúng | `elapsedMs < median / 2`, không gợi ý | `Easy` |
| Đúng | `median === null` (lần đầu) | `Good` |

`median` là median thời gian trả lời **của chính mục tiêu đó**, lưu kèm trong `fsrsCard`,
cập nhật dần.

**Đơn vị lên lịch là `targetId`, không phải câu hỏi.** Một từ xuất hiện dưới cả 5 dạng bài
chỉ có **một** bản ghi `reviewItems`. Nếu trong một phiên cùng `targetId` xuất hiện nhiều lần,
áp `applyReview` lần lượt theo đúng thứ tự trả lời.

## 3. Màn hình & bố cục

### 3.1. `/luyen-tap` — Cấu hình phiên

Bề rộng `max-w-xl` (576px).

```
[H1 "Luyện tập"]
[Chọn bài — chip số bài 1…25, đa chọn, có "Chọn tất cả"]
[Chọn dạng bài — 5 chip: Trắc nghiệm · Ghép cặp · Điền từ · Sắp xếp · Nghe]
[Số câu — 10 / 15 / 20 / 30]
[Dòng tóm tắt: "Sẵn 42 câu · 3 câu nghe bị loại (máy không có giọng tiếng Nhật)"]
[Nút default: "Bắt đầu" — cỡ quiz]
```

**`maxLearnedLesson` = `Math.max(...config.lessons)`** — số bài lớn nhất người dùng vừa chọn
trong chính màn này.

> Bản trước suy con số này từ `reviewItems` và tạo ra một vòng luẩn quẩn: SPEC-03 chỉ đọc, chưa
> bao giờ tạo `reviewItems`, nên người mới có `maxLearnedLesson = 0`, và `filterExercises` loại
> sạch mọi câu (mọi `auxiliaryLessons` đều ≥ 1). Kết quả: chọn bài 1 ra **0 câu**, không có lối
> thoát nào trong app.
>
> Chọn bài chính là lời khai "tôi đã học tới đây" — không cần suy diễn từ đâu khác, không cần
> một ô nhập riêng. Chọn bài 7 thì câu của bài 7 được phép chứa từ bài 1–7, vẫn bị chặn từ bài
> 8 trở lên. Đúng mục đích ban đầu của bộ lọc.

Ở `mode: 'due'` (SPEC-05): `maxLearnedLesson` = số bài lớn nhất trong các mục đang đến hạn.

### 3.2. `/luyen-tap/phien` — Màn làm bài

Khuôn mẫu: `design-system.md` §10.4. Bề rộng `max-w-xl` (576px).

```
┌─────────────────────────────┐
│ [×]     7/20      ⏱ 02:14   │  ← thanh trên
├─────────────────────────────┤
│                             │
│   VÙNG CÂU HỎI              │  ← ưu thế thị giác, chữ Nhật 1.5rem (jp-quiz)
│                             │
├─────────────────────────────┤
│   VÙNG TRẢ LỜI              │  ← NỬA DƯỚI màn hình, trong tầm ngón cái
│                             │
├─────────────────────────────┤
│   VÙNG PHẢN HỒI             │  ← trượt lên từ đáy sau khi trả lời
└─────────────────────────────┘
```

> **Ràng buộc cứng: không cuộn trang trong lúc làm bài.** Nội dung tràn thì **thu nhỏ vùng
> câu hỏi**, không đẩy vùng trả lời xuống dưới màn hình. Nguyên tắc 3 của design system:
> mọi thao tác luyện tập phải với tới được bằng một ngón cái ở nửa dưới.

Vùng phản hồi sau khi trả lời: đúng/sai + đáp án đúng + câu gốc đầy đủ + bản dịch + nút
"Tiếp tục" (cỡ `quiz`).

### 3.3. Màn kết quả

Bề rộng `max-w-xl`. Số câu đúng / tổng, phần trăm, thời lượng, danh sách câu sai kèm đáp án
đúng, nút "Luyện tiếp" và "Về trang chủ".

## 4. Component dùng lại

| Vai trò | Token component |
|---|---|
| Phương án dạng 1 và 2 | `answer-option` + 4 biến thể trạng thái |
| Khối từ dạng 4 | `phrase-token` |
| Ô nhập dạng 3 và 5 | `jp-input` |
| Mọi nút trong luồng làm bài | `button-primary` / `button-secondary` cỡ **`quiz` (48px)** |
| Thoát phiên | `button-ghost`, icon `<X />` |
| Nút phát audio dạng 5 | `player-play-button` (tròn 56px) |
| Chip tốc độ dạng 5 | `player-speed-chip` (44px) |

> shadcn `base-nova` ship nút `default` 32px và `lg` 36px — **cả hai đều không đạt 48px**.
> Mọi nút trong luồng làm bài phải dùng `size="quiz"`, đã có sẵn trong
> `web/src/components/ui/button.tsx`.

## 5. Trạng thái

**`answer-option` — năm trạng thái** (`design-system.md` §9.3, component quan trọng nhất của app):

| Trạng thái | Nền | Viền | Phụ trợ ngoài màu |
|---|---|---|---|
| Rảnh | `card` | 1px `border` | Số thứ tự 1–4 góc trái |
| Hover | `accent` | 1px `border` | — |
| Đã chọn | `accent` | **2px** `primary` | — |
| Đúng | `success/10` | **2px** `success` | Icon `<Check />` bên phải |
| Sai | `destructive/10` | **2px** `destructive` | Icon `<X />` + rung 3 nhịp |

Cao tối thiểu 48px, `rounded-xl`, `p-4`, chữ Nhật `1.125rem`. Số thứ tự hiện trên desktop
(khớp phím `1`–`4`), **ẩn trên mobile**.

**Trạng thái màn hình**

| Tình huống | Hiển thị |
|---|---|
| Bộ lọc ra 0 câu | Không vào phiên. Nêu rõ lý do: chưa chọn bài / chưa chọn dạng / bị chặn kiến thức phụ trợ |
| Có câu bị loại vì thiếu audio | Dòng cảnh báo ở màn cấu hình, ghi rõ số câu và lý do |
| Đang nạp dữ liệu bài | Skeleton, không cho bấm "Bắt đầu" |
| Thoát giữa chừng | Hỏi xác nhận. Đồng ý → **không ghi** `reviewItems` cho câu chưa trả lời |
| Ghi Dexie lỗi | Giữ người dùng ở màn kết quả, nêu lỗi. Không nuốt lỗi im lặng |
| Bể câu hỏi có bài `unverified` (SPEC-01 §3.1) | Một dòng `muted` ở màn cấu hình: "Nội dung các bài này chưa được đối chiếu với bản in". Nhắc **một lần**, không chèn nhãn vào từng câu — đang làm bài thì không phải lúc đọc chú thích biên tập |

Mọi phần tử bấm được đủ sáu trạng thái theo `design-system.md` §8.

## 6. Tương tác & chuyển động

| Loại | Thời lượng | Đường cong |
|---|---|---|
| Đổi màu, hover, focus | 150ms | `ease-out` |
| Ô đáp án hiện kết quả | 200ms | `ease-out` |
| Chuyển câu hỏi | 250ms | `ease-in-out` |
| Kéo thả khối từ | lò xo `framer-motion` | `stiffness 400, damping 30` |
| Rung báo sai | 300ms, biên độ 4px, 3 nhịp | `ease-in-out` |

**Bắt buộc:** bọc toàn bộ trong `@media (prefers-reduced-motion: no-preference)`. Khi người
dùng tắt hiệu ứng, **kết quả đúng/sai vẫn phải hiện đầy đủ** — chỉ bỏ phần chuyển động.

**Phím tắt desktop:** `1` `2` `3` `4` chọn phương án · `Space` sang câu tiếp / phát lại audio ·
`Enter` xác nhận ô nhập · `Esc` thoát phiên (có xác nhận).

Phím tắt là lớp tăng tốc, **không phải điều kiện để dùng được**. Mọi thao tác phải làm được
bằng một ngón cái.

---

# PHẦN A — Khung phiên

Một wrapper duy nhất quản lý: danh sách câu đã lọc, con trỏ câu hiện tại, đồng hồ mỗi câu
(`performance.now()` khi hiện câu → khi trả lời), gom kết quả, và ghi Dexie cuối phiên.

Mỗi dạng bài là một component nhận `QuestionItem` và trả về `{ isCorrect, elapsedMs }`.
Wrapper không cần biết dạng nào đang chạy.

**Thứ tự triển khai:** dựng `mc` chạy end-to-end trước. Nó chứng minh toàn bộ trục
dữ liệu → câu hỏi → chấm → ghi Dexie. Bốn dạng còn lại thêm sau, mỗi dạng là một component
cắm vào wrapper đã có.

---

# PHẦN B — Năm dạng bài

## B.1. Dạng 1 — Trắc nghiệm (`mc`)

- **Câu hỏi:** chữ Hán, từ vựng, hoặc câu khuyết. Chữ Nhật bậc `jp-quiz` (24px).
- **Trả lời:** 4 `answer-option` xếp dọc. Distractor do SPEC-01 sinh.
- **Chấm:** nhị phân, phản hồi ngay.
- **Phím tắt:** `1`–`4`. Số thứ tự hiện desktop, ẩn mobile.

## B.2. Dạng 2 — Ghép cặp (`matching`)

- **Câu hỏi:** 4–5 cặp, đọc từ `question.pairs` (SPEC-01 §4.2) — **không** parse chuỗi
  `"từ:::nghĩa"`. Ở phase này chỉ có biến thể Từ vựng ↔ Tiếng Việt; hai biến thể Chữ Hán ↔ Âm
  On/Kun và Động từ ↔ thể て/ます cần dữ liệu của SPEC-12, để sau.
- **Trả lời:** hai cột `answer-option`. Chạm liên tiếp 2 ô cần ghép.
- **Phản hồi:** đúng → hai ô chuyển `success` rồi tan nhẹ. Sai → **rung 3 nhịp 300ms biên độ
  4px** màu `destructive`, hai ô trở về trạng thái rảnh.
- **Chấm:** theo từng cặp, không phải cả lượt. Mỗi cặp là một `targetId` riêng, và **đo
  `elapsedMs` riêng cho từng cặp** (tính từ lúc cặp trước được chốt). Trả về mảng
  `AnswerResult[]` theo §2.1 — một phần tử cho mỗi cặp.
- **Không dùng dạng này ở `mode: 'due'`** (SPEC-01 §4.2).

## B.3. Dạng 3 — Điền từ / Trợ từ (`cloze`)

- **Câu hỏi:** câu chứa `＿＿＿`, chữ Nhật bậc `jp-quiz`.
- **Trả lời:** `jp-input` — cao 48px, `rounded-lg`, viền 1px, chữ Nhật `1.25rem`, **căn giữa**.
  Gắn `wanakana.bind()` để gõ romaji tự chuyển hiragana.
- **Caption dưới ô nhập, luôn có:** "Gõ romaji, chữ tự chuyển sang hiragana".
- **Chấm linh hoạt:** `normalizeJapaneseInput()` + so với `acceptedVariants`. Chấp nhận cả
  dạng kanji lẫn hiragana, bỏ qua dấu cách, chuẩn hóa full-width ↔ half-width.
  **Toàn bộ do `wanakana` lo — không tự viết bảng ánh xạ.**

## B.4. Dạng 4 — Sắp xếp câu (`reorder`)

- **Câu hỏi:** câu chia thành 4–6 khối (SPEC-01 tách theo dấu cách).
- **Trả lời:** `phrase-token` — chip `rounded-xl px-4 h-12`, nền `secondary`, chữ Nhật
  `1.125rem`. Chạm khối để đưa lên thanh trả lời; chạm khối đã chọn để trả về.
- **Thanh trả lời:** vùng `border-dashed` cao **tối thiểu 64px**, khi rỗng hiện chữ mờ
  "Chạm vào từ bên dưới".
- **Ràng buộc bố cục:** khối đã dùng chuyển `opacity-40` và không bấm được, **vẫn giữ nguyên
  chỗ** — nếu gỡ khỏi luồng, các khối còn lại nhảy vị trí và người học mất dấu.
- **Kéo thả** (`framer-motion`, lò xo 400/30) là **tùy chọn thay thế** cho 1-chạm, không phải
  cách duy nhất. Trên màn hình nhỏ 1-chạm là đường chính.
- **Chấm:** so khớp thứ tự toàn câu.

## B.5. Dạng 5 — Nghe và nhập (`listening`)

- **Câu hỏi:** `player-play-button` tròn 56px + `player-speed-chip` hai mức **0.8×** và
  **1.0×** (qua `utterance.rate`). Không hiện chữ câu hỏi.
- **Trả lời:** `jp-input` như dạng 3, cùng caption.
- **Nguồn âm:** `speechSynthesis` qua `src/lib/tts.ts` (SPEC-01). Audio ZIP đĩa CD là F09, hoãn.
- **Tiền kiểm tra:** máy không có giọng `ja-JP` → **loại câu khỏi phiên** ngay từ
  `filterExercises`, báo số câu bị loại ở màn cấu hình.

> **Luật không được vi phạm:** mục tiêu bị loại vì thiếu audio **không bị coi là đã ôn**.
> `dueAt` giữ nguyên, nó quay lại ở phiên sau. Không bao giờ ghi review cho câu hỏi chưa
> từng hiển thị.

---

## 7. Accessibility

- `answer-option` là `<button>` thật, không phải `div` gắn `onClick`.
- Đúng/sai **không bao giờ chỉ bằng màu**: luôn kèm `<Check />` / `<X />` và chữ.
- Kết quả mỗi câu thông báo qua `aria-live="polite"` để screen reader đọc được.
- Dạng 2 (ghép cặp) phải thao tác được bằng bàn phím: Tab tới ô, Enter/Space để chọn.
- Dạng 4 phải làm được hoàn toàn bằng 1-chạm — kéo thả không được là đường duy nhất.
- `jp-input` có `<label>` liên kết, không chỉ có placeholder.
- Vùng chạm mọi nút ≥ 48×48px, cách nhau ≥ 8px.
- Focus ring 3px giữ nguyên trong suốt phiên.
- `prefers-reduced-motion`: bỏ rung, bỏ trượt — **giữ nguyên toàn bộ thông tin đúng/sai**.

## 8. Bảo mật & dữ liệu

Kết quả luyện tập ghi vào IndexedDB trên máy. Chưa có Supabase, nên `pendingSync` chỉ tích
lũy, không gửi đi đâu — huy hiệu trạng thái hiển thị "Đã lưu trên máy" (SPEC-02 §5).

Không telemetry, không analytics, không gọi mạng trong suốt phiên. Phiên chạy được khi máy
bay hoàn toàn offline — đây là tiêu chí nghiệm thu, không phải mong muốn.

`speechSynthesis` chỉ đọc câu ví dụ trong giáo trình, không đọc dữ liệu người dùng.

## 9. Tiêu chí nghiệm thu

- [ ] **Người dùng mới hoàn toàn**: mở `/luyen-tap`, chọn bài 1, bấm Bắt đầu → có câu hỏi
      thật. (Bản cài hiện tại ra 0 câu — đây là ca hồi quy bắt buộc)
- [ ] Chọn bài 3 → không câu nào chứa từ của bài 4 trở lên
- [ ] Làm hết một phiên `mc` 5 câu → DevTools › Application › IndexedDB › `JapaneseLearningDB` ›
      `reviewItems` có bản ghi với `dueAt` và `fsrsCard` đúng
- [ ] Làm một câu `matching` 5 cặp → **5 bản ghi `reviewItems`** được tạo/cập nhật, mỗi cặp
      một `targetId`, cặp sai có `incorrectCount` tăng đúng ở chính nó
- [ ] Làm một câu `listening`: gõ đúng kana của câu → **chấm đúng** (ca hồi quy cho SPEC-01 §4.5)
- [ ] Trả lời đúng cùng một mục tiêu 6 lần → `recentElapsedMs` giữ đúng 5 mẫu gần nhất
- [ ] Trả lời sai → **không** thêm mẫu vào `recentElapsedMs`
- [ ] Mục tiêu lần đầu vào lịch có `createdAt` đúng ngày hôm đó
- [ ] Trả lời sai một câu → `dueAt` gần hơn rõ rệt so với trả lời đúng cùng mục tiêu
- [ ] **Tắt mạng hoàn toàn**, làm thêm một phiên: chạy y hệt
- [ ] Ở 390px, trong suốt phiên **không cuộn được trang**; vùng trả lời luôn ở nửa dưới
- [ ] Dạng 4: chọn khối → các khối còn lại **không nhảy vị trí**
- [ ] Dạng 3: gõ `wo` ra `を`; gõ full-width vẫn chấm đúng
- [ ] Dạng 5 trên máy không có giọng `ja-JP`: câu bị loại, `dueAt` của mục tiêu đó **không đổi**
- [ ] Bật "giảm chuyển động" của hệ điều hành: hết rung và trượt, kết quả đúng/sai vẫn hiện đủ
- [ ] Mọi nút trong luồng làm bài cao ≥ 48px
- [ ] Đóng tab giữa phiên rồi mở lại: không có bản ghi `reviewItems` nào cho câu chưa trả lời
- [ ] `pnpm check` exit 0, `pnpm test` xanh

## 10. Khối lệnh bàn giao thiết kế

Dán nguyên khối dưới đây kèm `web/DESIGN.md` vào Stitch / Claude Design.

---

Nạp `DESIGN.md` làm hợp đồng token. Ba ràng buộc bắt buộc:

1. Chỉ dùng token màu theo tên (`bg-primary`, `text-muted-foreground`), **tuyệt đối không
   hardcode mã hex**.
2. Mobile-first: dựng bố cục 390px trước, rồi mới mở rộng lên 1024px.
3. Mọi chữ tiếng Nhật phải bọc trong phần tử có class `jp`.

Dựng màn hình luyện tập của một app học tiếng Nhật, bề rộng tối đa `max-w-xl` (576px).

**Bố cục màn làm bài — bốn tầng dọc:**
thanh trên (nút thoát, tiến độ "7/20", đồng hồ) · vùng câu hỏi chiếm ưu thế thị giác với chữ
Nhật 1.5rem · vùng trả lời **nằm ở nửa dưới màn hình, trong tầm ngón cái** · vùng phản hồi
trượt lên từ đáy sau khi trả lời.

**Ràng buộc cứng: không cuộn trang trong lúc làm bài.** Nếu nội dung tràn, thu nhỏ vùng câu
hỏi chứ không đẩy vùng trả lời xuống dưới màn hình.

**Năm biến thể vùng trả lời:**

1. **Trắc nghiệm** — bốn ô đáp án xếp dọc, mỗi ô cao tối thiểu 48px, `rounded-xl`, `p-4`, chữ
   Nhật 1.125rem, có số thứ tự 1–4 ở góc trái (hiện trên desktop, ẩn trên mobile). Năm trạng
   thái: Rảnh (nền `card`, viền 1px `border`) · Hover (nền `accent`) · Đã chọn (nền `accent`,
   viền **2px** `primary`) · Đúng (nền `success/10`, viền 2px `success`, icon `<Check/>` bên
   phải) · Sai (nền `destructive/10`, viền 2px `destructive`, icon `<X/>`).
2. **Ghép cặp** — hai cột dùng chính ô đáp án đó, chạm liên tiếp hai ô để ghép.
3. **Điền từ** — một ô nhập tiếng Nhật cao 48px, `rounded-lg`, viền 1px, chữ Nhật 1.25rem,
   **căn giữa**, kèm dòng caption dưới ô: "Gõ romaji, chữ tự chuyển sang hiragana".
4. **Sắp xếp câu** — một thanh trả lời là vùng `border-dashed` cao tối thiểu 64px (khi rỗng
   hiện chữ mờ "Chạm vào từ bên dưới"), và bên dưới là 4–6 chip khối từ `rounded-xl px-4 h-12`
   nền `secondary`, chữ Nhật 1.125rem. **Chip đã dùng chuyển `opacity-40`, không bấm được,
   nhưng vẫn giữ nguyên chỗ để bố cục không nhảy.**
5. **Nghe và nhập** — nút phát tròn 56px ở giữa, hai chip tốc độ "0.8×" và "1.0×" (44px), và
   ô nhập tiếng Nhật giống biến thể 3. Không hiện chữ câu hỏi.

Kèm theo: **màn cấu hình phiên** (chọn bài dạng chip đa chọn, chọn dạng bài, chọn số câu,
dòng tóm tắt số câu khả dụng, một nút chính "Bắt đầu" cỡ 48px) và **màn kết quả** (số câu
đúng trên tổng, phần trăm, thời lượng, danh sách câu sai).

Mọi nút trong luồng làm bài cao tối thiểu 48px. Mọi phần tử bấm được có đủ sáu trạng thái:
Mặc định, Hover (chỉ khi `(hover: hover)`), Focus (ring 3px, không bao giờ tắt), Active (dịch
xuống 1px), Disabled (`opacity-50`), Loading.

**Màu không bao giờ mang nghĩa một mình** — đúng/sai luôn kèm icon và chữ.

Chuyển động: 150ms `ease-out` cho đổi màu, 200ms cho ô đáp án hiện kết quả, 250ms
`ease-in-out` cho chuyển câu, rung báo sai 300ms biên độ 4px ba nhịp. Tất cả bọc trong
`@media (prefers-reduced-motion: no-preference)`.

Cần cả chế độ sáng và tối.

---

> **Không** dùng file Stitch export để ghi đè `web/src/app/globals.css`. Bản export đổi màu
> về hex, bỏ toàn bộ chế độ tối, và mất lớp `@theme inline` — chính là thứ cho phép class
> `.dark` ghi đè token lúc chạy (`design-system.md` §12).
