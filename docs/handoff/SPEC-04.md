# Handoff — SPEC-04 (Luyện tập)

> **Trạng thái:** ĐÃ CÀI, CHƯA NGHIỆM THU TRÌNH DUYỆT · **Ngày:** 17/09/2026
> **Plan:** `docs/superpowers/plans/2026-09-17-spec-04-luyen-tap.md`
> Chưa đặt `COMPLETED` — xem mục "Còn nợ" ở cuối.

## Những gì SPEC sau dùng lại được

### `src/lib/practice.ts` — hàm thuần, có test

```ts
targetTypeFromId(targetId): TargetType          // suy từ tiền tố: vocab- | grammar- | particle-
shuffle<T>(items, rng?): T[]                     // Fisher-Yates, rng tiêm được để test
buildSession(all, config, audioKeys, dueTargetIds?, rng?)
  -> { questions, excludedAudioCount, eligibleCount }
checkTextAnswer(input, question): boolean        // dạng 3 và 5
checkOptionAnswer(chosen, question): boolean     // dạng 1
checkReorderAnswer(chosen[], question): boolean  // dạng 4
applyResults(existing, results, lessonByTargetId, now?): ReviewItem[]
summarizeSession(config, results, totalQuestions, durationSeconds, now?): PracticeSession
```

**`buildSession` đã nhận `dueTargetIds`** — SPEC-05 chỉ cần truyền `mode: 'due'` và tập
`targetId` đến hạn, không phải viết thêm gì. `filterExercises` tự loại dạng `matching` ở
`mode: 'due'`.

`applyResults` là chỗ duy nhất biết luật lên lịch: chỉ ghi mẫu `recentElapsedMs` khi đúng,
giữ nguyên `createdAt` của bản ghi cũ, và áp `applyReview` lần lượt khi một `targetId` xuất
hiện nhiều lần trong cùng phiên. **SPEC-05 dùng lại nguyên, không viết luật thứ hai.**

### `src/lib/practice-write.ts`

```ts
savePracticeSession({ config, results, lessonByTargetId, totalQuestions, durationSeconds })
  -> Promise<PracticeSession>
```

Một transaction Dexie duy nhất trên `practiceSessions` + `reviewItems` + `pendingSync`.
Mọi phép tính chạy xong trước khi mở transaction. **SPEC-05 gọi thẳng hàm này** cho phiên ôn
— không mở transaction thứ hai ở nơi khác.

### `src/lib/use-question-pool.ts`

```ts
useQuestionPool(lessons: number[]) -> { questions, unverifiedLessons, loading }
useJapaneseVoice() -> boolean | null    // null = đang dò
```

`loading` **suy ra** từ `pool.key !== key`, không phải state riêng — gọi `setState` thẳng
trong thân `useEffect` bị `react-hooks/set-state-in-effect` chặn và làm `pnpm check` exit 1.
Giữ nguyên khuôn này khi viết hook nạp dữ liệu khác.

**`useJapaneseVoice()` trả `null` trong lúc dò.** Phải chờ `!== null` rồi mới dựng phiên; dựng
sớm sẽ chốt `audioKeys` rỗng và loại sạch câu nghe trên máy thật ra có giọng ja-JP, mà bể câu
không đổi identity nữa nên không bao giờ dựng lại.

### Component trong `src/components/practice/`

| File | Ghi chú cho người dùng lại |
|---|---|
| `types.ts` | `QuestionProps` — hợp đồng chung của cả 5 dạng: `{ question, answered, onAnswer }` |
| `AnswerOption.tsx` | 5 trạng thái. Dùng `aria-disabled`, **không** `disabled` — ô đã chấm vẫn phải Tab tới được |
| `JpInput.tsx` | `wanakana.bind` + **`unbind` trong cleanup**. Có `<label>` thật và caption gắn `aria-describedby` |
| `PhraseToken.tsx` | Chip khối từ. `used` → `opacity-40` + `pointer-events-none`, **vẫn giữ chỗ** |
| `PracticeRunner.tsx` | Wrapper: con trỏ câu, đồng hồ, phản hồi, ghi cuối phiên, dialog thoát |
| `SessionResult.tsx` | Màn kết quả. Nhận `saveError` + `onRetrySave` |
| `Question{Mc,Matching,Cloze,Reorder,Listening}.tsx` | 5 dạng bài |

**SPEC-05 dùng lại `PracticeRunner` nguyên vẹn.** Nó chỉ nhận `questions` + `config`; không
biết `mode` là `lesson` hay `due`.

## Ba quy ước dễ vi phạm

**1. Luật đồng hồ.** Component dạng bài luôn gửi `elapsedMs: 0`; `PracticeRunner` ghi đè bằng
số đo thật. Điều kiện ghi đè là `results.length === 1`. Dạng `matching` trả nhiều phần tử nên
giữ nguyên số nó tự đo — mỗi cặp tính từ lúc cặp trước được chốt.

**2. Dữ liệu câu hỏi mang notation furigana thô.** `pairs[].jp`, khối từ của `reorder`, và
`prompt` của `listening` đều là chuỗi dạng `私[わたし]は`. Phải render qua `<Furigana>`, và với
TTS phải đi qua `toKanaSentence()` — đưa thẳng vào `speechSynthesis` thì máy đọc cả chữ Hán lẫn
phần đọc trong ngoặc. Đây là lỗi đã xảy ra một lần ở cả ba chỗ.

**3. `maxLearnedLesson = Math.max(...config.lessons)`.** Không suy từ `reviewItems`. Ở
`mode: 'due'` (SPEC-05) là số bài lớn nhất trong các mục đang đến hạn.

## Trạng thái dữ liệu sau SPEC-04

- `reviewItems` giờ **có bên ghi**. `createdAt` được điền đúng lần đầu → SPEC-05 đếm mục mới
  trong ngày bằng trường này, **không** dùng `fsrsCard.reps === 0`.
- `practiceSessions` có bên ghi, **chưa có bên đọc** → SPEC-07.
- `pendingSync` có bên ghi, **chưa có bên đọc** → SPEC-08. Payload hiện tại:
  `{ kind: 'practice', session, reviewItems }`, id `sync-<session.id>`.
- `db.ts` version 2 (thêm `createdAt`, `recentElapsedMs`) đã có từ trước, không đổi trong phase này.

## Còn nợ

**Chưa kiểm chứng trên trình duyệt** (Task 10 của plan). `pnpm check` exit 0, `pnpm test` 70/70,
`pnpm build` xanh, hai route prerender static. Nhưng những mục sau chỉ kiểm được bằng DevTools
và **chưa ai chạy**:

- Nội dung IndexedDB sau một phiên thật (`dueAt`, `fsrsCard`, `recentElapsedMs` giữ 5 mẫu,
  matching 5 cặp ra 5 bản ghi)
- Không cuộn trang ở 390px trong suốt phiên
- Chạy khi offline hoàn toàn
- `prefers-reduced-motion`: hết rung, thông tin đúng/sai vẫn đủ
- Chiều cao thật của mọi nút ≥ 48px
- Dạng 3: gõ `wo` ra `を`, full-width vẫn chấm đúng
- Dạng 5 trên máy không có giọng ja-JP: câu bị loại, `dueAt` không đổi

**Ngoài phạm vi có chủ đích:** `usedHint` luôn `false` (giao diện gợi ý để đợt sau); kéo thả
`framer-motion` ở dạng 4 chưa làm, có `ponytail:` comment tại chỗ — 1-chạm là đường chính và
đã đủ nghiệm thu.
