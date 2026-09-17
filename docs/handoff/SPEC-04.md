# Handoff — SPEC-04 (Luyện tập)

> **Trạng thái:** COMPLETED · **Ngày:** 17/09/2026
> **Plan:** `docs/superpowers/plans/2026-09-17-spec-04-luyen-tap.md`
> Mục 9 của spec đã kiểm hết trong trình duyệt — xem "Đã nghiệm thu" ở cuối.

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
summarizeSession(config, results, durationSeconds, now?): PracticeSession
```

**`buildSession` đã nhận `dueTargetIds`** — SPEC-05 chỉ cần truyền `mode: 'due'` và tập
`targetId` đến hạn, không phải viết thêm gì. `filterExercises` tự loại dạng `matching` ở
`mode: 'due'`.

**`PracticeSession.totalQuestions` đếm MỤC TIÊU ĐÃ CHẤM, không phải số câu hiện ra.** Một lượt
ghép cặp là một câu nhưng chấm 5 mục tiêu; `summarizeSession` tự suy từ `results.length` nên
`correctCount <= totalQuestions` luôn đúng. **SPEC-07 tính tỷ lệ đúng trên hai trường này.**

`applyResults` là chỗ duy nhất biết luật lên lịch: chỉ ghi mẫu `recentElapsedMs` khi đúng,
giữ nguyên `createdAt` của bản ghi cũ, và áp `applyReview` lần lượt khi một `targetId` xuất
hiện nhiều lần trong cùng phiên. **SPEC-05 dùng lại nguyên, không viết luật thứ hai.**

### `src/lib/practice-write.ts`

```ts
savePracticeSession({ config, results, lessonByTargetId, durationSeconds })
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
| `JpInput.tsx` | Chuyển kana bằng `toTypedKana()` trong `onChange`. **Không dùng `wanakana.bind()`** — xem quy ước 4 |
| `PhraseToken.tsx` | Chip khối từ. `used` → `opacity-40` + `pointer-events-none`, **vẫn giữ chỗ** |
| `PracticeRunner.tsx` | Wrapper: con trỏ câu, đồng hồ, phản hồi, ghi cuối phiên, dialog thoát |
| `SessionResult.tsx` | Màn kết quả. Nhận `saveError` + `onRetrySave` |
| `Question{Mc,Matching,Cloze,Reorder,Listening}.tsx` | 5 dạng bài |

**SPEC-05 dùng lại `PracticeRunner` nguyên vẹn.** Nó chỉ nhận `questions` + `config`; không
biết `mode` là `lesson` hay `due`.

## Bốn quy ước dễ vi phạm

**1. Luật đồng hồ.** Component dạng bài luôn gửi `elapsedMs: 0`; `PracticeRunner` ghi đè bằng
số đo thật. Điều kiện ghi đè là `results.length === 1`. Dạng `matching` trả nhiều phần tử nên
giữ nguyên số nó tự đo — mỗi cặp tính từ lúc cặp trước được chốt.

**2. Dữ liệu câu hỏi mang notation furigana thô.** `pairs[].jp`, khối từ của `reorder`, và
`prompt` của `listening` đều là chuỗi dạng `私[わたし]は`. Phải render qua `<Furigana>`, và với
TTS phải đi qua `toKanaSentence()` — đưa thẳng vào `speechSynthesis` thì máy đọc cả chữ Hán lẫn
phần đọc trong ngoặc. Đây là lỗi đã xảy ra một lần ở cả ba chỗ.

**3. `maxLearnedLesson = Math.max(...config.lessons)`.** Không suy từ `reviewItems`. Ở
`mode: 'due'` (SPEC-05) là số bài lớn nhất trong các mục đang đến hạn.

**4. Không dùng `wanakana.bind()` cho ô nhập controlled của React.** `bind` ghi thẳng vào DOM
node, React render lại từ state của nó và ghi đè ngược: gõ "ha" thì màn hình hiện "は" nhưng
state đọng ở "h", và câu gõ ĐÚNG bị chấm SAI. Chuyển kana bằng `toTypedKana()` trong `onChange`.
`normalizeJapaneseInput` và `toTypedKana` đều `normalize('NFKC')` trước — thiếu bước này thì IME
ở chế độ chữ La-tinh đủ-rộng ("ｈａ") không bao giờ ra kana.

## Trạng thái dữ liệu sau SPEC-04

- `reviewItems` giờ **có bên ghi**. `createdAt` được điền đúng lần đầu → SPEC-05 đếm mục mới
  trong ngày bằng trường này, **không** dùng `fsrsCard.reps === 0`.
- `practiceSessions` có bên ghi, **chưa có bên đọc** → SPEC-07.
- `pendingSync` có bên ghi, **chưa có bên đọc** → SPEC-08. Payload hiện tại:
  `{ kind: 'practice', session, reviewItems }`, id `sync-<session.id>`.
- `db.ts` version 2 (thêm `createdAt`, `recentElapsedMs`) đã có từ trước, không đổi trong phase này.

## Đã nghiệm thu (17/09/2026, agent-browser trên dev server)

`pnpm check` exit 0 · `pnpm test` 73/73 · `pnpm build` xanh · hai route prerender static.

| Tiêu chí (SPEC-04 §9) | Đo được |
|---|---|
| Người dùng mới chọn bài 1 ra câu hỏi thật | "Sẵn 100 câu" |
| Phiên `mc` ghi `reviewItems` có `dueAt` + `fsrsCard` | 12 bản ghi / 15 câu, `state` 1, `reps` tăng dần |
| `matching` 5 cặp ra 5 bản ghi riêng | 8 câu × 5 cặp = 40 bản ghi; 11 giá trị `elapsedMs` khác nhau |
| Sai không thêm mẫu `recentElapsedMs` | 22 mục sai đều `[]`; 18 mục đúng có đúng 18 mẫu |
| `createdAt` đúng ngày | toàn bộ bản ghi |
| Sai cho `dueAt` gần hơn | sai +1 phút, đúng +10 phút |
| Offline hoàn toàn | `navigator.onLine === false`, làm hết 15 câu, phiên ghi được |
| Không cuộn ở 390px | `scrollHeight 625 === innerHeight 625` |
| Nút trong luồng ≥ 48px | nút thấp nhất 48px |
| Dạng 3: `wo` → `を` | gõ `ha` → `は` → "Chính xác" |
| Dạng 4 không nhảy vị trí | 5 chip, `movedAfterPick: 0`, chip đã dùng `opacity 0.4` / `pointer-events none` |
| Dạng 5 không có giọng ja-JP | "8 câu nghe bị loại", 0 màn hình nghe trong phiên |
| Dạng 5 đọc kana | `speak("サントスさんは がくせいじゃありません。")`, không có ngoặc |
| `prefers-reduced-motion` | `animationName: none`, chữ + icon + đáp án đúng vẫn đủ |
| Thoát giữa phiên không ghi | giữa phiên `reviewItems: 0`, `sessions: 0` |
| Bộ lọc ra 0 câu | "Bắt đầu" disabled + nêu lý do |

Hai mục kiểm ở mức unit thay vì trình duyệt, vì cần dựng trạng thái rất dài:
`recentElapsedMs` cắt còn 5 mẫu sau 6 lần đúng (`practice.test.ts`), và chọn bài 3 không lọt
từ bài 4+ (`filter.test.ts`).

## Ngoài phạm vi có chủ đích

- `usedHint` luôn `false` — giao diện gợi ý để đợt sau.
- Kéo thả `framer-motion` ở dạng 4 chưa làm, có `ponytail:` comment tại chỗ. 1-chạm là đường
  chính và đã đủ nghiệm thu.
- Ở dev, `speechSynthesis.speak` bị gọi hai lần cho một câu nghe do React StrictMode gọi effect
  đôi. Production chỉ một lần, và `speak()` đã `cancel()` trước mỗi lượt nên không chồng tiếng.
