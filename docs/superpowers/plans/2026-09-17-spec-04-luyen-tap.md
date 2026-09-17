# SPEC-04 — Luyện tập: khung phiên & 5 dạng bài — Implementation Plan

> **For agentic workers:** thực hiện tuần tự Task 1 → Task 10. Mỗi task kết thúc bằng một
> commit. Steps dùng checkbox (`- [ ]`).

**Goal:** Dựng trục luyện tập của app — chọn phạm vi → làm câu hỏi → chấm tự động → ghi lịch
FSRS vào Dexie trong một transaction duy nhất.

**Architecture:** Toàn bộ phép tính đặt trong `src/lib/practice.ts` (hàm thuần, có test
`node:test`). Ghi Dexie tách sang `src/lib/practice-write.ts` (không test, chỉ là transaction).
UI là một wrapper `PracticeSession` quản lý con trỏ câu + đồng hồ, và 5 component dạng bài cắm
vào nó qua đúng một hợp đồng `OnAnswer`.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · Dexie 4 · ts-fsrs 5 ·
zustand 5 · wanakana 5 · framer-motion 13 · shadcn `base-nova` trên Base UI · Tailwind v4
(`@theme inline`) · test bằng `node --test`.

**Spec:** `docs/specs/SPEC-04-luyen-tap.md` — đọc toàn bộ trước khi bắt đầu. Bản này chỉ diễn
giải, spec mới là nguồn sự thật.

---

## Global Constraints

Áp dụng cho **mọi** task. Vi phạm bất kỳ dòng nào là task chưa xong.

- Chạy mọi lệnh trong `web/`. Chỉ dùng **pnpm**. `pnpm check` (tsc + eslint) phải exit 0 ở
  cuối mỗi task; `pnpm test` phải xanh ở mọi task có sửa `src/lib/`.
- `pnpm test` chạy `node --test src/lib/*.test.ts` — **test chỉ được nhận nếu nằm trong
  `src/lib/` và tên kết thúc `.test.ts`**. Test đặt chỗ khác sẽ không bao giờ chạy.
- Import trong file dưới `src/lib/` dùng đuôi `.ts` tường minh với đường dẫn tương đối
  (`./filter.ts`, `../types/index.ts`) — đó là điều kiện để `node --test` nạp được. Trong
  `src/app/` và `src/components/` dùng alias `@/...` không đuôi.
- Ôn tập chỉ đi qua `src/lib/fsrs.ts` (`rateAnswer`, `applyReview`, `medianElapsedMs`,
  `pushElapsedSample`). **Không** import `ts-fsrs` ở bất kỳ file nào khác.
- Không hardcode màu. Chỉ dùng token Washi: `bg-card`, `bg-accent`, `border-border`,
  `border-primary`, `bg-success/10`, `border-success`, `bg-destructive/10`,
  `border-destructive`, `text-muted-foreground`. Token `success` đã có trong `globals.css`.
- Mọi nút trong luồng làm bài: `<Button size="quiz">` (48px). `default` 32px và `lg` 36px
  **không đạt** — không dùng.
- Mọi chữ tiếng Nhật bọc trong phần tử có class `jp`.
- Mọi chuyển động bọc trong `motion-safe:` (Tailwind) hoặc
  `@media (prefers-reduced-motion: no-preference)`. Khi tắt chuyển động, **thông tin đúng/sai
  vẫn hiện đầy đủ**.
- Đúng/sai không bao giờ chỉ bằng màu: luôn kèm icon `<Check />` / `<X />` **và** chữ.
- Không gọi mạng, không telemetry trong suốt phiên. Phiên phải chạy được khi offline hoàn toàn.
- Không thêm dependency mới. Mọi thứ cần đã có trong `package.json`.
- Zustand chỉ giữ UI state tạm (bộ lọc, con trỏ câu). **Không** persist dữ liệu học vào
  Zustand. Dexie là nguồn sự thật, đọc qua `useLiveQuery`.
- Không gọi network hay giải nén trong transaction Dexie.

---

## File Structure

| File | Trạng thái | Trách nhiệm |
|---|---|---|
| `src/lib/practice.ts` | Tạo | Toàn bộ phép tính thuần: dựng bể câu, chấm, ánh xạ kết quả → `ReviewItem`, tổng kết phiên. **Không import `db.ts`.** |
| `src/lib/practice.test.ts` | Tạo | Test cho `practice.ts` |
| `src/lib/practice-write.ts` | Tạo | Một hàm duy nhất: transaction Dexie ghi `practiceSessions` + `reviewItems` + `pendingSync` |
| `src/lib/use-question-pool.ts` | Tạo | Hook nạp `Lesson[]` + vocab → `generateQuestions` → trả bể câu + cờ `loading` + danh sách bài `unverified` |
| `src/app/globals.css` | Sửa | Thêm 4 lớp bậc chữ Nhật (`jp-quiz`, `jp-example`, `jp-vocab`, `jp-inline`) + keyframe `shake` |
| `src/components/practice/types.ts` | Tạo | Đúng một kiểu: `QuestionProps` — hợp đồng chung của cả 5 dạng bài |
| `src/components/practice/AnswerOption.tsx` | Tạo | Ô đáp án 5 trạng thái — dùng ở dạng 1 và 2 |
| `src/components/practice/JpInput.tsx` | Tạo | Ô nhập tiếng Nhật + `wanakana.bind()` — dùng ở dạng 3 và 5 |
| `src/components/practice/PhraseToken.tsx` | Tạo | Chip khối từ — dạng 4 |
| `src/components/practice/QuestionMc.tsx` | Tạo | Dạng 1 |
| `src/components/practice/QuestionMatching.tsx` | Tạo | Dạng 2 |
| `src/components/practice/QuestionCloze.tsx` | Tạo | Dạng 3 |
| `src/components/practice/QuestionReorder.tsx` | Tạo | Dạng 4 |
| `src/components/practice/QuestionListening.tsx` | Tạo | Dạng 5 |
| `src/components/practice/PracticeRunner.tsx` | Tạo | Wrapper: con trỏ câu, đồng hồ, gom kết quả, phản hồi, ghi cuối phiên |
| `src/components/practice/SessionResult.tsx` | Tạo | Màn kết quả (không phải route riêng) |
| `src/app/luyen-tap/page.tsx` | Tạo | Màn cấu hình phiên |
| `src/app/luyen-tap/phien/page.tsx` | Tạo | Màn làm bài |

Không tạo route cho màn kết quả — nó là một trạng thái của `/luyen-tap/phien`.

---

## Kiến thức nền cần biết trước khi code

Đọc kỹ, đây là những chỗ dễ làm sai nhất.

**`QuestionItem` không có `targetType`.** `ReviewItem` thì có. Suy ra từ tiền tố của
`targetId`: `vocab-01-03` → `vocab`, `grammar-05-02` → `grammar`, `particle-wo` → `particle`.
Câu dạng `listening` dùng chính `grammarTargetId` nên `targetType` của nó là `grammar` — đúng
như spec, đơn vị lên lịch là `targetId` chứ không phải dạng bài.

**Dạng `matching` đọc `question.pairs`, không đọc `question.targetId`.** Mỗi phần tử
`MatchingPair` có `targetId` riêng và là một bản ghi `reviewItems` riêng. Không bao giờ parse
chuỗi `"từ:::nghĩa"` — định dạng đó đã bị bỏ.

**`maxLearnedLesson = Math.max(...config.lessons)`.** Không suy từ `reviewItems`. Bản trước suy
từ đó và tạo ra vòng luẩn quẩn: người mới có `maxLearnedLesson = 0` → `filterExercises` loại
sạch mọi câu → chọn bài 1 ra 0 câu, không có lối thoát. Đây là ca hồi quy bắt buộc.

**`availableAudioKeys` nghĩa là "máy có giọng ja-JP"**, không phải audio đĩa CD (SPEC-01 §5).
Truyền `new Set(hasVoice ? ['tts'] : [])`. `filterExercises` đã tự mặc định `audioKey ?? 'tts'`.

**Câu bị loại vì thiếu audio không được coi là đã ôn.** `dueAt` giữ nguyên. Không bao giờ ghi
review cho câu chưa từng hiển thị.

**Chỉ ghi mẫu `recentElapsedMs` khi trả lời ĐÚNG.** Thời gian của một câu sai không nói gì về
độ thành thạo.

**Cùng một `targetId` xuất hiện nhiều lần trong một phiên** thì `applyReview` phải chạy lần
lượt theo đúng thứ tự trả lời, không gộp.

---

## Task 1: Lõi tính toán thuần — `src/lib/practice.ts`

**Files:**
- Create: `web/src/lib/practice.ts`
- Test: `web/src/lib/practice.test.ts`

**Interfaces:**
- Consumes: `filterExercises` (`./filter.ts`), `rateAnswer` / `applyReview` /
  `medianElapsedMs` / `pushElapsedSample` (`./fsrs.ts`), `normalizeJapaneseInput`
  (`./japanese.ts`), các kiểu trong `../types/index.ts`.
- Produces:
  ```ts
  export function targetTypeFromId(targetId: string): TargetType;
  export function shuffle<T>(items: T[], rng?: () => number): T[];
  export function buildSession(
    allQuestions: QuestionItem[],
    config: PracticeConfig,
    availableAudioKeys: Set<string>,
    dueTargetIds?: Set<string>,
    rng?: () => number,
  ): { questions: QuestionItem[]; excludedAudioCount: number; eligibleCount: number };
  export function checkTextAnswer(input: string, question: QuestionItem): boolean;
  export function checkOptionAnswer(chosen: string, question: QuestionItem): boolean;
  export function checkReorderAnswer(chosen: string[], question: QuestionItem): boolean;
  export function applyResults(
    existing: ReviewItem[],
    results: AnswerResult[],
    lessonByTargetId: Map<string, number>,
    now?: Date,
  ): ReviewItem[];
  export function summarizeSession(
    config: PracticeConfig,
    results: AnswerResult[],
    totalQuestions: number,
    durationSeconds: number,
    now?: Date,
  ): PracticeSession;
  ```

- [ ] **Step 1: Viết test trước — `web/src/lib/practice.test.ts`**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  targetTypeFromId,
  shuffle,
  buildSession,
  checkTextAnswer,
  checkOptionAnswer,
  checkReorderAnswer,
  applyResults,
  summarizeSession,
} from './practice.ts';
import { ELAPSED_SAMPLE_SIZE } from './fsrs.ts';
import type {
  AnswerResult,
  PracticeConfig,
  QuestionItem,
  ReviewItem,
} from '../types/index.ts';

const q = (over: Partial<QuestionItem>): QuestionItem => ({
  id: 'q',
  type: 'mc',
  lesson: 1,
  auxiliaryLessons: [1],
  targetId: 'vocab-01-01',
  prompt: '私',
  answer: 'わたし',
  ...over,
});

const config = (over: Partial<PracticeConfig> = {}): PracticeConfig => ({
  mode: 'lesson',
  lessons: [1],
  maxLearnedLesson: 1,
  selectedTypes: ['mc', 'matching', 'cloze', 'reorder', 'listening'],
  questionCount: 10,
  ...over,
});

// rng tất định: luôn trả 0 -> shuffle giữ nguyên thứ tự đảo ngược xác định được
const zeroRng = () => 0;

test('targetTypeFromId đọc tiền tố của targetId', () => {
  assert.equal(targetTypeFromId('vocab-01-03'), 'vocab');
  assert.equal(targetTypeFromId('grammar-05-02'), 'grammar');
  assert.equal(targetTypeFromId('particle-wo'), 'particle');
  assert.equal(targetTypeFromId('kanji-042'), 'kanji');
  // Không khớp tiền tố nào thì về 'vocab' thay vì ném lỗi giữa phiên làm bài
  assert.equal(targetTypeFromId('gì-đó-lạ'), 'vocab');
});

test('shuffle không làm mất hay nhân bản phần tử', () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffle(input, zeroRng);
  assert.equal(out.length, 5);
  assert.deepEqual([...out].sort((a, b) => a - b), input);
  assert.deepEqual(input, [1, 2, 3, 4, 5], 'không được sửa mảng gốc');
});

test('buildSession cắt đúng questionCount và báo số câu bị loại vì thiếu audio', () => {
  const all: QuestionItem[] = [
    q({ id: 'a', targetId: 'vocab-01-01' }),
    q({ id: 'b', targetId: 'vocab-01-02' }),
    q({ id: 'c', targetId: 'vocab-01-03' }),
    q({ id: 'd', type: 'listening', targetId: 'grammar-01-01' }),
  ];
  const r = buildSession(all, config({ questionCount: 2 }), new Set(), undefined, zeroRng);
  assert.equal(r.questions.length, 2);
  assert.equal(r.eligibleCount, 3);
  assert.equal(r.excludedAudioCount, 1);
});

test('buildSession: người dùng mới chọn bài 1 vẫn ra câu hỏi (ca hồi quy)', () => {
  // maxLearnedLesson phải bằng max(lessons) = 1, không phải 0.
  const all = [q({ auxiliaryLessons: [1] })];
  const r = buildSession(all, config({ lessons: [1], maxLearnedLesson: 1 }), new Set(['tts']));
  assert.equal(r.questions.length, 1);
});

test('checkTextAnswer chấp nhận biến thể và bỏ qua khác biệt được phép', () => {
  const item = q({ type: 'cloze', answer: 'を', acceptedVariants: ['を', 'ヲ'] });
  assert.equal(checkTextAnswer('を', item), true);
  assert.equal(checkTextAnswer('wo', item), true, 'romaji tự chuyển sang hiragana');
  assert.equal(checkTextAnswer(' を ', item), true, 'bỏ khoảng trắng thừa');
  assert.equal(checkTextAnswer('は', item), false, 'sai nghĩa vẫn phải là sai');
});

test('checkTextAnswer chấm được câu kana của dạng nghe', () => {
  const item = q({ type: 'listening', answer: 'わたしは がくせいです' });
  assert.equal(checkTextAnswer('わたしはがくせいです', item), true);
  assert.equal(checkTextAnswer('わたしは がくせいです。', item), true);
  assert.equal(checkTextAnswer('あなたは がくせいです', item), false);
});

test('checkOptionAnswer so khớp phương án đã chọn', () => {
  const item = q({ options: ['わたし', 'あなた'], answer: 'わたし' });
  assert.equal(checkOptionAnswer('わたし', item), true);
  assert.equal(checkOptionAnswer('あなた', item), false);
});

test('checkReorderAnswer so khớp thứ tự toàn câu', () => {
  const item = q({ type: 'reorder', answer: ['わたしは', 'がくせい', 'です'] });
  assert.equal(checkReorderAnswer(['わたしは', 'がくせい', 'です'], item), true);
  assert.equal(checkReorderAnswer(['がくせい', 'わたしは', 'です'], item), false);
  assert.equal(checkReorderAnswer(['わたしは', 'がくせい'], item), false);
});

test('applyResults tạo bản ghi mới với createdAt và đếm đúng', () => {
  const now = new Date('2026-09-17T10:00:00Z');
  const out = applyResults(
    [],
    [{ targetId: 'vocab-01-01', targetType: 'vocab', isCorrect: true, elapsedMs: 3000, usedHint: false }],
    new Map([['vocab-01-01', 1]]),
    now,
  );
  assert.equal(out.length, 1);
  const item = out[0]!;
  assert.equal(item.targetId, 'vocab-01-01');
  assert.equal(item.lesson, 1);
  assert.equal(item.createdAt, now.toISOString());
  assert.equal(item.correctCount, 1);
  assert.equal(item.incorrectCount, 0);
  assert.deepEqual(item.recentElapsedMs, [3000]);
  assert.ok(item.dueAt instanceof Date);
});

test('applyResults chỉ ghi mẫu thời gian khi trả lời ĐÚNG', () => {
  const now = new Date('2026-09-17T10:00:00Z');
  const out = applyResults(
    [],
    [{ targetId: 'vocab-01-01', targetType: 'vocab', isCorrect: false, elapsedMs: 9000, usedHint: false }],
    new Map([['vocab-01-01', 1]]),
    now,
  );
  assert.deepEqual(out[0]!.recentElapsedMs, []);
  assert.equal(out[0]!.incorrectCount, 1);
  assert.equal(out[0]!.lastFailedAt, now.toISOString());
});

test('applyResults giữ đúng 5 mẫu gần nhất sau 6 lần đúng', () => {
  const now = new Date('2026-09-17T10:00:00Z');
  const results: AnswerResult[] = Array.from({ length: 6 }, (_, i) => ({
    targetId: 'vocab-01-01',
    targetType: 'vocab' as const,
    isCorrect: true,
    elapsedMs: (i + 1) * 1000,
    usedHint: false,
  }));
  const out = applyResults([], results, new Map([['vocab-01-01', 1]]), now);
  assert.equal(out.length, 1, 'cùng targetId chỉ ra một bản ghi');
  assert.equal(out[0]!.recentElapsedMs.length, ELAPSED_SAMPLE_SIZE);
  assert.deepEqual(out[0]!.recentElapsedMs, [2000, 3000, 4000, 5000, 6000]);
  assert.equal(out[0]!.correctCount, 6);
});

test('applyResults giữ nguyên createdAt của bản ghi đã có', () => {
  const now = new Date('2026-09-17T10:00:00Z');
  const existing: ReviewItem = {
    targetId: 'vocab-01-01',
    targetType: 'vocab',
    lesson: 1,
    incorrectCount: 2,
    correctCount: 4,
    dueAt: new Date('2026-09-10T00:00:00Z'),
    fsrsCard: undefined as never,
    updatedAt: '2026-09-10T00:00:00.000Z',
    createdAt: '2026-09-01T00:00:00.000Z',
    recentElapsedMs: [1000, 2000],
  };
  const out = applyResults(
    [existing],
    [{ targetId: 'vocab-01-01', targetType: 'vocab', isCorrect: true, elapsedMs: 1500, usedHint: false }],
    new Map([['vocab-01-01', 1]]),
    now,
  );
  assert.equal(out[0]!.createdAt, '2026-09-01T00:00:00.000Z');
  assert.equal(out[0]!.correctCount, 5);
  assert.equal(out[0]!.updatedAt, now.toISOString());
});

test('trả lời sai cho dueAt gần hơn hẳn so với trả lời đúng', () => {
  const now = new Date('2026-09-17T10:00:00Z');
  const lessons = new Map([['vocab-01-01', 1]]);
  const base = { targetId: 'vocab-01-01', targetType: 'vocab' as const, elapsedMs: 3000, usedHint: false };
  const wrong = applyResults([], [{ ...base, isCorrect: false }], lessons, now)[0]!;
  const right = applyResults([], [{ ...base, isCorrect: true }], lessons, now)[0]!;
  assert.ok(
    wrong.dueAt.getTime() < right.dueAt.getTime(),
    'Again phải lên lịch sớm hơn Good',
  );
});

test('applyResults xử lý nhiều targetId của một lượt matching', () => {
  const now = new Date('2026-09-17T10:00:00Z');
  const results: AnswerResult[] = [
    { targetId: 'vocab-01-01', targetType: 'vocab', isCorrect: true, elapsedMs: 1000, usedHint: false },
    { targetId: 'vocab-01-02', targetType: 'vocab', isCorrect: false, elapsedMs: 4000, usedHint: false },
    { targetId: 'vocab-01-03', targetType: 'vocab', isCorrect: true, elapsedMs: 1200, usedHint: false },
  ];
  const lessons = new Map(results.map((r) => [r.targetId, 1]));
  const out = applyResults([], results, lessons, now);
  assert.equal(out.length, 3);
  const wrong = out.find((i) => i.targetId === 'vocab-01-02')!;
  assert.equal(wrong.incorrectCount, 1, 'chỉ cặp sai mới tăng incorrectCount');
  assert.equal(out.find((i) => i.targetId === 'vocab-01-01')!.incorrectCount, 0);
});

test('summarizeSession tính đúng tỷ lệ theo tổng câu', () => {
  const now = new Date('2026-09-17T10:00:00Z');
  const results: AnswerResult[] = [
    { targetId: 'a', targetType: 'vocab', isCorrect: true, elapsedMs: 1000, usedHint: false },
    { targetId: 'b', targetType: 'vocab', isCorrect: false, elapsedMs: 1000, usedHint: false },
  ];
  const s = summarizeSession(config({ lessons: [1, 2] }), results, 2, 42, now);
  assert.equal(s.totalQuestions, 2);
  assert.equal(s.correctCount, 1);
  assert.equal(s.accuracyRate, 0.5);
  assert.equal(s.durationSeconds, 42);
  assert.deepEqual(s.selectedLessons, [1, 2]);
  assert.equal(s.createdAt, now.toISOString());
  assert.ok(s.id.length > 0);
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó hỏng**

```bash
cd web && pnpm test
```

Kỳ vọng: FAIL — `Cannot find module './practice.ts'`.

- [ ] **Step 3: Viết `web/src/lib/practice.ts`**

```ts
import type {
  AnswerResult,
  PracticeConfig,
  PracticeSession,
  QuestionItem,
  ReviewItem,
  TargetType,
} from '../types/index.ts';
import { filterExercises } from './filter.ts';
import {
  applyReview,
  medianElapsedMs,
  pushElapsedSample,
  rateAnswer,
} from './fsrs.ts';
import { normalizeJapaneseInput } from './japanese.ts';

const TARGET_TYPES: readonly TargetType[] = ['vocab', 'grammar', 'kanji', 'particle', 'listening'];

/**
 * targetId dạng `vocab-01-03`, `grammar-05-02`, `particle-wo`. QuestionItem không mang
 * targetType nên suy từ tiền tố. Không khớp thì về 'vocab' — giữa phiên làm bài, ném lỗi
 * tệ hơn nhiều so với xếp nhầm nhóm.
 */
export function targetTypeFromId(targetId: string): TargetType {
  const prefix = targetId.split('-')[0] as TargetType;
  return TARGET_TYPES.includes(prefix) ? prefix : 'vocab';
}

/** Fisher-Yates. `rng` là tham số để test tất định được. */
export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function buildSession(
  allQuestions: QuestionItem[],
  config: PracticeConfig,
  availableAudioKeys: Set<string>,
  dueTargetIds?: Set<string>,
  rng: () => number = Math.random,
): { questions: QuestionItem[]; excludedAudioCount: number; eligibleCount: number } {
  const { eligibleQuestions, excludedAudioCount } = filterExercises(
    allQuestions,
    config,
    availableAudioKeys,
    dueTargetIds,
  );
  return {
    questions: shuffle(eligibleQuestions, rng).slice(0, config.questionCount),
    excludedAudioCount,
    eligibleCount: eligibleQuestions.length,
  };
}

const answerStrings = (question: QuestionItem): string[] =>
  Array.isArray(question.answer) ? question.answer : [question.answer];

/**
 * Chấm ô nhập (dạng 3 và 5). Chỉ chuẩn hóa những khác biệt được phép — romaji↔kana,
 * full-width↔half-width, khoảng trắng, dấu câu. Không có luật nào biến đáp án sai nghĩa
 * thành đúng.
 */
export function checkTextAnswer(input: string, question: QuestionItem): boolean {
  const normalized = normalizeJapaneseInput(input);
  if (normalized.length === 0) return false;
  const accepted = [...answerStrings(question), ...(question.acceptedVariants ?? [])];
  return accepted.some((a) => normalizeJapaneseInput(a) === normalized);
}

export function checkOptionAnswer(chosen: string, question: QuestionItem): boolean {
  return answerStrings(question).includes(chosen);
}

export function checkReorderAnswer(chosen: string[], question: QuestionItem): boolean {
  const expected = answerStrings(question);
  return (
    chosen.length === expected.length && chosen.every((token, i) => token === expected[i])
  );
}

/**
 * Áp một loạt kết quả lên lịch ôn. Đơn vị là targetId: cùng một targetId xuất hiện nhiều lần
 * trong phiên thì applyReview chạy lần lượt theo đúng thứ tự trả lời, không gộp.
 * Trả về mảng ReviewItem để bulkPut — hàm thuần, không chạm Dexie.
 */
export function applyResults(
  existing: ReviewItem[],
  results: AnswerResult[],
  lessonByTargetId: Map<string, number>,
  now: Date = new Date(),
): ReviewItem[] {
  const iso = now.toISOString();
  const draft = new Map<string, ReviewItem>(existing.map((item) => [item.targetId, item]));

  for (const result of results) {
    const previous = draft.get(result.targetId);
    const rating = rateAnswer(
      result.isCorrect,
      result.elapsedMs,
      medianElapsedMs(previous?.recentElapsedMs ?? []),
      result.usedHint,
    );
    const { card, dueAt } = applyReview(previous?.fsrsCard, rating, now);

    draft.set(result.targetId, {
      targetId: result.targetId,
      targetType: previous?.targetType ?? result.targetType,
      lesson: previous?.lesson ?? lessonByTargetId.get(result.targetId) ?? 0,
      correctCount: (previous?.correctCount ?? 0) + (result.isCorrect ? 1 : 0),
      incorrectCount: (previous?.incorrectCount ?? 0) + (result.isCorrect ? 0 : 1),
      lastFailedAt: result.isCorrect ? previous?.lastFailedAt : iso,
      dueAt,
      fsrsCard: card,
      updatedAt: iso,
      createdAt: previous?.createdAt ?? iso,
      // Thời gian của một câu trả sai không nói gì về độ thành thạo.
      recentElapsedMs: result.isCorrect
        ? pushElapsedSample(previous?.recentElapsedMs ?? [], result.elapsedMs)
        : (previous?.recentElapsedMs ?? []),
    });
  }

  return [...draft.values()];
}

export function summarizeSession(
  config: PracticeConfig,
  results: AnswerResult[],
  totalQuestions: number,
  durationSeconds: number,
  now: Date = new Date(),
): PracticeSession {
  const correctCount = results.filter((r) => r.isCorrect).length;
  return {
    id: `session-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    selectedLessons: [...config.lessons],
    exerciseTypes: [...config.selectedTypes],
    totalQuestions,
    correctCount,
    accuracyRate: results.length === 0 ? 0 : correctCount / results.length,
    durationSeconds,
    createdAt: now.toISOString(),
  };
}
```

- [ ] **Step 4: Chạy test cho tới khi xanh**

```bash
cd web && pnpm test && pnpm check
```

Kỳ vọng: mọi test PASS, `pnpm check` exit 0.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/practice.ts web/src/lib/practice.test.ts
git commit -m "feat(luyen-tap): add pure practice core per SPEC-04 §2"
```

---

## Task 2: Ghi Dexie một transaction — `src/lib/practice-write.ts`

**Files:**
- Create: `web/src/lib/practice-write.ts`

**Interfaces:**
- Consumes: `db` (`@/lib/db`), `applyResults` + `summarizeSession` (`@/lib/practice`).
- Produces:
  ```ts
  export async function savePracticeSession(args: {
    config: PracticeConfig;
    results: AnswerResult[];
    lessonByTargetId: Map<string, number>;
    totalQuestions: number;
    durationSeconds: number;
  }): Promise<PracticeSession>;
  ```

File này **không có test**: nội dung của nó chỉ là một transaction Dexie, mọi phép tính đã
được test ở Task 1. Không import nó từ `practice.ts` (sẽ kéo Dexie vào `node --test`).

- [ ] **Step 1: Viết `web/src/lib/practice-write.ts`**

```ts
import { db } from '@/lib/db';
import { applyResults, summarizeSession } from '@/lib/practice';
import type { AnswerResult, PracticeConfig, PracticeSession } from '@/types';

/**
 * Ghi kết quả cuối phiên. Ba bảng, MỘT transaction (SPEC-04 §2): phiên, lịch ôn, và hàng đợi
 * đồng bộ phải cùng thành công hoặc cùng thất bại — nửa vời nghĩa là tiến độ học sai lệch.
 * Mọi thứ cần tính đã tính xong trước khi mở transaction; trong transaction không có await
 * nào ra ngoài Dexie.
 */
export async function savePracticeSession({
  config,
  results,
  lessonByTargetId,
  totalQuestions,
  durationSeconds,
}: {
  config: PracticeConfig;
  results: AnswerResult[];
  lessonByTargetId: Map<string, number>;
  totalQuestions: number;
  durationSeconds: number;
}): Promise<PracticeSession> {
  const now = new Date();
  const targetIds = [...new Set(results.map((r) => r.targetId))];
  const session = summarizeSession(config, results, totalQuestions, durationSeconds, now);

  await db.transaction('rw', db.practiceSessions, db.reviewItems, db.pendingSync, async () => {
    const existing = (await db.reviewItems.bulkGet(targetIds)).filter(
      (item): item is NonNullable<typeof item> => item != null,
    );
    const updated = applyResults(existing, results, lessonByTargetId, now);

    await db.practiceSessions.add(session);
    await db.reviewItems.bulkPut(updated);
    // F08 chưa có bên đọc — bảng này chỉ tích lũy cho tới khi SPEC-08 lên.
    await db.pendingSync.add({
      id: `sync-${session.id}`,
      payload: { kind: 'practice', session, reviewItems: updated },
      createdAt: now.getTime(),
    });
  });

  return session;
}
```

- [ ] **Step 2: Kiểm tra biên dịch**

```bash
cd web && pnpm check
```

Kỳ vọng: exit 0.

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/practice-write.ts
git commit -m "feat(luyen-tap): write session results in a single Dexie transaction"
```

---

## Task 3: Bậc chữ Nhật, rung báo sai, và `AnswerOption`

**Files:**
- Modify: `web/src/app/globals.css` (thêm vào cuối, sau khối "Furigana hover zoom")
- Create: `web/src/components/practice/AnswerOption.tsx`

**Interfaces:**
- Produces:
  ```ts
  export type AnswerOptionState = 'idle' | 'selected' | 'correct' | 'incorrect';
  export function AnswerOption(props: {
    children: React.ReactNode;
    state: AnswerOptionState;
    index?: number;          // 1..4 — hiện số thứ tự trên desktop, ẩn mobile
    disabled?: boolean;
    onClick: () => void;
  }): React.ReactElement;
  ```

`jp-quiz`, `jp-example`, `jp-vocab`, `jp-inline` là bậc chữ trong `DESIGN.md` mà `globals.css`
**chưa** thi hành — mới chỉ có `.jp`. Task này thi hành chúng.

- [ ] **Step 1: Thêm CSS vào `web/src/app/globals.css`**

```css
/* Bậc chữ Nhật (DESIGN.md §Japanese scale). Luôn đi kèm class `jp`. */
.jp-quiz {
  font-size: 1.5rem;
  font-weight: 500;
}

.jp-example {
  font-size: 1.25rem;
  font-weight: 400;
}

.jp-vocab {
  font-size: 1.125rem;
  font-weight: 400;
}

.jp-inline {
  font-size: 1rem;
  font-weight: 500;
}

/* Rung báo sai: 300ms, biên độ 4px, 3 nhịp (SPEC-04 §6). */
@keyframes jp-shake {
  0%, 100% { transform: translateX(0); }
  16%, 50%, 83% { transform: translateX(-4px); }
  33%, 66% { transform: translateX(4px); }
}

@media (prefers-reduced-motion: no-preference) {
  .jp-shake {
    animation: jp-shake 300ms ease-in-out;
  }
}
```

- [ ] **Step 2: Viết `web/src/components/practice/AnswerOption.tsx`**

Ràng buộc bắt buộc, kiểm lại từng dòng trước khi commit:

- Là `<button type="button">` thật, **không** phải `div` gắn `onClick`.
- `min-h-12` (48px), `rounded-xl`, `p-4`, chữ Nhật `jp jp-vocab`.
- Năm trạng thái theo đúng SPEC-04 §5: Rảnh `bg-card border` · Hover `hover:bg-accent`
  (bọc `@media (hover: hover)` — dùng biến thể Tailwind `[@media(hover:hover)]:hover:bg-accent`)
  · Đã chọn `bg-accent border-2 border-primary` · Đúng `bg-success/10 border-2 border-success`
  + `<Check />` · Sai `bg-destructive/10 border-2 border-destructive` + `<X />` + `jp-shake`.
- Viền luôn `border-2` ở mọi trạng thái để **bố cục không nhảy 1px** khi đổi trạng thái; trạng
  thái Rảnh và Hover dùng `border-transparent` chồng lên `bg-card` với một `ring-1 ring-border`,
  hoặc giữ `border-2 border-border`. Chọn cách nào cũng được, miễn chiều cao không đổi.
- Số thứ tự `index` hiện ở góc trái, `hidden md:flex` — desktop thấy, mobile ẩn.
- `focus-visible:ring-3` giữ nguyên, không bao giờ tắt.
- Icon Đúng/Sai nằm bên phải, kèm `<span className="sr-only">` ghi "Đúng" / "Sai" để màu không
  mang nghĩa một mình.

```tsx
'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AnswerOptionState = 'idle' | 'selected' | 'correct' | 'incorrect';

const STATE_CLASS: Record<AnswerOptionState, string> = {
  idle: 'bg-card border-border [@media(hover:hover)]:hover:bg-accent',
  selected: 'bg-accent border-primary',
  correct: 'bg-success/10 border-success',
  incorrect: 'bg-destructive/10 border-destructive motion-safe:jp-shake',
};

export function AnswerOption({
  children,
  state,
  index,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  state: AnswerOptionState;
  index?: number;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={state === 'selected'}
      className={cn(
        'flex min-h-12 w-full items-center gap-3 rounded-xl border-2 p-4 text-left',
        'transition-colors duration-150 ease-out',
        'outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        'active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
        STATE_CLASS[state],
      )}
    >
      {index !== undefined && (
        <span className="text-muted-foreground hidden size-6 shrink-0 items-center justify-center rounded-md border text-xs md:flex">
          {index}
        </span>
      )}
      <span className="jp jp-vocab flex-1">{children}</span>
      {state === 'correct' && (
        <>
          <Check className="text-success size-5 shrink-0" />
          <span className="sr-only">Đúng</span>
        </>
      )}
      {state === 'incorrect' && (
        <>
          <X className="text-destructive size-5 shrink-0" />
          <span className="sr-only">Sai</span>
        </>
      )}
    </button>
  );
}
```

- [ ] **Step 3: Kiểm tra biên dịch**

```bash
cd web && pnpm check
```

- [ ] **Step 4: Commit**

```bash
git add web/src/app/globals.css web/src/components/practice/AnswerOption.tsx
git commit -m "feat(luyen-tap): add Japanese type scale, shake keyframe and AnswerOption"
```

---

## Task 4: Hook nạp bể câu hỏi + màn cấu hình `/luyen-tap`

**Files:**
- Create: `web/src/lib/use-question-pool.ts`
- Create: `web/src/app/luyen-tap/page.tsx`

**Interfaces:**
- Consumes: `loadLessons` / `loadVocabMap` / `AVAILABLE_N5_LESSONS` (`@/lib/lessons`),
  `generateQuestions` (`@/lib/questions`), `hasJapaneseVoice` (`@/lib/tts`),
  `buildSession` (`@/lib/practice`), `useUIStore` (`@/lib/store`).
- Produces:
  ```ts
  export function useQuestionPool(lessons: number[]): {
    questions: QuestionItem[];
    unverifiedLessons: number[];
    loading: boolean;
  };
  export function useJapaneseVoice(): boolean | null;  // null = đang dò
  ```

- [ ] **Step 1: Viết `web/src/lib/use-question-pool.ts`**

```ts
'use client';

import { useEffect, useState } from 'react';
import { loadLessons, loadVocabMap } from '@/lib/lessons';
import { generateQuestions } from '@/lib/questions';
import { hasJapaneseVoice } from '@/lib/tts';
import type { QuestionItem } from '@/types';

/**
 * Nạp dữ liệu bài đã chọn rồi sinh bể câu hỏi. generateQuestions đã memoize theo tập bài nên
 * đổi qua lại giữa các lựa chọn không sinh lại từ đầu.
 */
export function useQuestionPool(lessons: number[]): {
  questions: QuestionItem[];
  unverifiedLessons: number[];
  loading: boolean;
} {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [unverifiedLessons, setUnverifiedLessons] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const key = [...lessons].sort((a, b) => a - b).join(',');

  useEffect(() => {
    let alive = true;
    const nums = key.length === 0 ? [] : key.split(',').map(Number);
    if (nums.length === 0) {
      setQuestions([]);
      setUnverifiedLessons([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([loadLessons(nums), loadVocabMap(nums)])
      .then(([lessonData, vocabMap]) => {
        if (!alive) return;
        setQuestions(generateQuestions(lessonData, vocabMap));
        setUnverifiedLessons(
          lessonData.filter((l) => (l.verification ?? 'unverified') === 'unverified').map((l) => l.number),
        );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [key]);

  return { questions, unverifiedLessons, loading };
}

/** null = đang dò giọng. `availableAudioKeys` của SPEC-01 §5 nghĩa là "máy có giọng ja-JP". */
export function useJapaneseVoice(): boolean | null {
  const [hasVoice, setHasVoice] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    hasJapaneseVoice().then((ok) => {
      if (alive) setHasVoice(ok);
    });
    return () => {
      alive = false;
    };
  }, []);
  return hasVoice;
}
```

- [ ] **Step 2: Viết `web/src/app/luyen-tap/page.tsx`**

Yêu cầu bắt buộc:

- `'use client'`. Bề rộng `max-w-xl`, `mx-auto px-4 py-6 space-y-6`.
- H1 "Luyện tập" (`font-heading text-xl font-medium`, khớp `/hoc`).
- **Chọn bài**: chip số 1…25 từ `AVAILABLE_N5_LESSONS`, đa chọn, cộng nút "Chọn tất cả" /
  "Bỏ chọn tất cả". Mỗi chip là `<button type="button">` ≥ 44×44px, cách nhau ≥ 8px
  (`gap-2`), có `aria-pressed`.
- **Chọn dạng bài**: 5 chip `Trắc nghiệm · Ghép cặp · Điền từ · Sắp xếp · Nghe` ánh xạ sang
  `ExerciseType` `mc · matching · cloze · reorder · listening`. Đa chọn, `aria-pressed`.
- **Số câu**: 10 / 15 / 20 / 30.
- Đọc/ghi qua `useUIStore`: `selectedLessons`, `selectedTypes`, `questionCount`.
- **Dòng tóm tắt** tính bằng `buildSession(questions, config, audioKeys)`:
  `"Sẵn {eligibleCount} câu"`, và khi `excludedAudioCount > 0` nối thêm
  `" · {n} câu nghe bị loại (máy không có giọng tiếng Nhật)"`.
  `config.maxLearnedLesson = Math.max(...selectedLessons)`, `mode: 'lesson'`.
  `audioKeys = new Set(hasVoice ? ['tts'] : [])`.
- **Nhắc nội dung chưa đối chiếu**: khi `unverifiedLessons.length > 0`, một dòng
  `text-muted-foreground text-sm`: "Nội dung các bài này chưa được đối chiếu với bản in."
  Nhắc **một lần** ở đây, không chèn vào từng câu.
- **Trạng thái rỗng / chặn**: nút "Bắt đầu" `disabled` và nêu rõ lý do bằng chữ ngay trên nút:
  - `selectedLessons.length === 0` → "Chưa chọn bài nào."
  - `selectedTypes.length === 0` → "Chưa chọn dạng bài nào."
  - `loading` → hiện `<Skeleton />`, nút disabled.
  - `eligibleCount === 0` mà đã chọn đủ → "Không có câu nào hợp lệ với lựa chọn hiện tại.
    Thử chọn thêm bài hoặc thêm dạng bài."
- Nút "Bắt đầu": `<Button size="quiz" className="w-full">`, `onClick` → `router.push('/luyen-tap/phien')`.

- [ ] **Step 3: Kiểm tra trình duyệt**

```bash
cd web && pnpm dev
```

Mở `http://localhost:3000/luyen-tap`. Kiểm:
- Chọn **chỉ bài 1** → dòng tóm tắt hiện số câu **lớn hơn 0**. Đây là ca hồi quy quan trọng
  nhất của spec; nếu ra 0 thì `maxLearnedLesson` đang bị suy sai.
- Chọn bài 3 → không câu nào chứa từ của bài 4 trở lên (kiểm bằng cách vào phiên ở Task 5).
- Ở bề rộng 390px: chip không tràn, mọi chip ≥ 44px.

- [ ] **Step 4: `pnpm check` và commit**

```bash
cd web && pnpm check
git add web/src/lib/use-question-pool.ts web/src/app/luyen-tap/page.tsx
git commit -m "feat(luyen-tap): add session config screen per SPEC-04 §3.1"
```

---

## Task 5: Wrapper phiên + dạng 1 (`mc`) + màn kết quả — chạy end-to-end

Đây là task chứng minh toàn bộ trục dữ liệu → câu hỏi → chấm → ghi Dexie. Bốn dạng còn lại chỉ
là component cắm thêm.

**Files:**
- Create: `web/src/components/practice/types.ts`
- Create: `web/src/components/practice/QuestionMc.tsx`
- Create: `web/src/components/practice/PracticeRunner.tsx`
- Create: `web/src/components/practice/SessionResult.tsx`
- Create: `web/src/app/luyen-tap/phien/page.tsx`

**Interfaces:**
- Produces:
  ```ts
  // src/components/practice/types.ts
  // Hợp đồng dùng chung cho CẢ NĂM dạng bài. Không dạng nào được lệch khỏi đây.
  export interface QuestionProps {
    question: QuestionItem;
    /** Đã trả lời xong; component chuyển sang trạng thái chỉ đọc, hiện đúng/sai. */
    answered: boolean;
    onAnswer: (results: AnswerResult[]) => void;
  }
  ```

**Luật đồng hồ — chốt ở đây, cả 5 dạng tuân theo:**

Đồng hồ do **wrapper** giữ, không phải component dạng bài. Component luôn gửi
`elapsedMs: 0`; `PracticeRunner` ghi đè bằng số đo thật (`performance.now()` khi câu hiện lên →
khi `onAnswer` chạy). **Ngoại lệ duy nhất là `matching`**: mảng kết quả có nhiều hơn một phần
tử thì wrapper **giữ nguyên** `elapsedMs` mà component gửi lên, vì dạng đó tự đo riêng từng cặp
(§B.2). Điều kiện ghi đè vì thế là `results.length === 1`.

- [ ] **Step 1: Viết `types.ts` rồi `QuestionMc.tsx`**

```ts
// web/src/components/practice/types.ts
import type { AnswerResult, QuestionItem } from '@/types';

/** Hợp đồng chung của cả 5 dạng bài. Wrapper không cần biết dạng nào đang chạy. */
export interface QuestionProps {
  question: QuestionItem;
  answered: boolean;
  onAnswer: (results: AnswerResult[]) => void;
}
```

```tsx
// web/src/components/practice/QuestionMc.tsx
'use client';

import { useState } from 'react';
import { AnswerOption, type AnswerOptionState } from './AnswerOption';
import type { QuestionProps } from './types';
import { checkOptionAnswer, targetTypeFromId } from '@/lib/practice';

export function QuestionMc({ question, answered, onAnswer }: QuestionProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const options = question.options ?? [];

  const pick = (option: string) => {
    if (answered) return;
    setChosen(option);
    // elapsedMs: 0 là cố ý — PracticeRunner giữ đồng hồ và ghi đè giá trị này.
    onAnswer([
      {
        targetId: question.targetId,
        targetType: targetTypeFromId(question.targetId),
        isCorrect: checkOptionAnswer(option, question),
        elapsedMs: 0,
        usedHint: false,
      },
    ]);
  };

  const stateOf = (option: string): AnswerOptionState => {
    if (!answered) return chosen === option ? 'selected' : 'idle';
    if (checkOptionAnswer(option, question)) return 'correct';
    return chosen === option ? 'incorrect' : 'idle';
  };

  return (
    <div className="flex flex-col gap-3" role="group">
      {options.map((option, i) => (
        <AnswerOption
          key={option}
          index={i + 1}
          state={stateOf(option)}
          disabled={answered}
          onClick={() => pick(option)}
        >
          {option}
        </AnswerOption>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Viết `PracticeRunner.tsx`**

Trách nhiệm, không được để rò rỉ sang component dạng bài:

1. Giữ `index` câu hiện tại (đọc/ghi `useUIStore.currentQuestionIndex`).
2. Đồng hồ mỗi câu theo đúng "Luật đồng hồ" ở trên:
   ```ts
   const elapsedMs = Math.round(performance.now() - startedAtRef.current);
   const measured = results.length === 1 ? [{ ...results[0]!, elapsedMs }] : results;
   ```
3. Đồng hồ tổng phiên (hiện `mm:ss` ở thanh trên).
4. Gom `AnswerResult[]` của cả phiên vào một mảng.
5. Vùng phản hồi sau khi trả lời: đúng/sai + đáp án đúng + câu gốc đầy đủ + bản dịch
   (`question.explanationVi`) + nút "Tiếp tục" `size="quiz"`. Bọc trong `aria-live="polite"`.
6. Hết câu → gọi `savePracticeSession(...)` rồi chuyển sang `<SessionResult />`.
7. Nút thoát `<X />` (`variant="ghost"`, `size="quiz"`) và phím `Esc` → `AlertDialog` xác nhận.
   Đồng ý → `router.push('/luyen-tap')`, **không ghi gì cả**.
8. Phím tắt desktop: `1`–`4` chọn phương án · `Space` sang câu tiếp · `Enter` xác nhận ô nhập ·
   `Esc` thoát. Đăng ký bằng một `useEffect` với `window.addEventListener('keydown', ...)`, gỡ
   trong cleanup. **Không** chặn phím khi focus đang nằm trong `<input>` (trừ `Enter`/`Esc`).
9. `lessonByTargetId`: dựng từ các câu đã trả lời — với `matching` lấy từ `question.lesson` cho
   **mọi** `pair.targetId`.
10. Lỗi ghi Dexie: `try/catch`, giữ người dùng ở màn kết quả và hiện thông báo lỗi kèm nút
    "Thử lại". **Không nuốt lỗi im lặng.**

Bố cục bắt buộc (SPEC-04 §3.2) — **không cuộn trang trong lúc làm bài**:

```tsx
<main className="mx-auto flex h-[100dvh] w-full max-w-xl flex-col overflow-hidden px-4">
  <header className="flex h-14 shrink-0 items-center justify-between">…</header>
  {/* Vùng câu hỏi co được: min-h-0 + overflow-y-auto để NÓ thu nhỏ, không đẩy vùng trả lời */}
  <section className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto py-4">…</section>
  {/* Vùng trả lời luôn ở nửa dưới */}
  <section className="shrink-0 pb-4">…</section>
</main>
```

`h-[100dvh]` + `overflow-hidden` ở khung ngoài là thứ thực thi ràng buộc "không cuộn". Vùng câu
hỏi mang `min-h-0 flex-1 overflow-y-auto` để khi nội dung tràn thì **chính nó** thu lại.

- [ ] **Step 3: Viết `SessionResult.tsx`**

`max-w-xl`. Hiện: số câu đúng / tổng · phần trăm · thời lượng `mm:ss` · danh sách câu sai kèm
đáp án đúng · hai nút `size="quiz"`: "Luyện tiếp" (`/luyen-tap`) và "Về trang chủ" (`/`).

- [ ] **Step 4: Viết `web/src/app/luyen-tap/phien/page.tsx`**

`'use client'`. Đọc config từ `useUIStore`, gọi `useQuestionPool` + `useJapaneseVoice`, dựng
`PracticeConfig` (`maxLearnedLesson = Math.max(...selectedLessons)`), gọi `buildSession`, rồi
render `<PracticeRunner questions={...} config={...} />`.

Trường hợp biên: `selectedLessons` rỗng (vào thẳng URL hoặc tải lại trang mất store) →
`router.replace('/luyen-tap')`. Đang `loading` → `<Skeleton />`.

- [ ] **Step 5: Kiểm tra trình duyệt — nghiệm thu end-to-end**

```bash
cd web && pnpm dev
```

- Chọn bài 1, chỉ dạng "Trắc nghiệm", 5 câu → làm hết phiên.
- DevTools › Application › IndexedDB › `JapaneseLearningDB` › `reviewItems`: có bản ghi với
  `dueAt`, `fsrsCard`, `createdAt` đúng ngày hôm nay, `recentElapsedMs` có mẫu cho câu đúng và
  **không có mẫu** cho câu sai.
- `practiceSessions` có đúng 1 bản ghi; `pendingSync` có đúng 1 bản ghi.
- Trả lời sai một mục tiêu → `dueAt` gần hơn rõ rệt so với trả lời đúng cùng mục tiêu.
- Ở 390px: **không cuộn được trang** trong suốt phiên; vùng trả lời luôn ở nửa dưới.
- Mở lại tab giữa phiên → không có `reviewItems` nào cho câu chưa trả lời.
- DevTools › Network › Offline, làm thêm một phiên → chạy y hệt.
- Chọn bài 3 → mở từng câu, không câu nào chứa từ bài 4 trở lên.

- [ ] **Step 6: `pnpm check` và commit**

```bash
cd web && pnpm check
git add web/src/components/practice web/src/app/luyen-tap
git commit -m "feat(luyen-tap): add session runner, multiple choice and result screen"
```

---

## Task 6: Dạng 3 — Điền từ (`cloze`) + `JpInput`

**Files:**
- Create: `web/src/components/practice/JpInput.tsx`
- Create: `web/src/components/practice/QuestionCloze.tsx`
- Modify: `web/src/components/practice/PracticeRunner.tsx` (thêm nhánh `cloze`)

**Interfaces:**
- Consumes: `QuestionProps` (`./types`), `checkTextAnswer`, `targetTypeFromId` (`@/lib/practice`), `wanakana`
  (`@/lib/japanese` re-export — **không** import `wanakana` trực tiếp).
- Produces: `JpInput` (dùng lại nguyên ở Task 7), `QuestionCloze` theo `QuestionProps`.

- [ ] **Step 1: Viết `JpInput.tsx`**

Ràng buộc:
- `<label>` liên kết thật qua `htmlFor` / `id`, **không** chỉ có placeholder. Nhãn có thể
  `sr-only` nhưng phải tồn tại.
- Ô nhập: `h-12 rounded-lg border text-center jp` + `text-[1.25rem]`.
- Caption dưới ô, **luôn có**: "Gõ romaji, chữ tự chuyển sang hiragana"
  (`text-muted-foreground text-sm`), nối với ô qua `aria-describedby`.
- Gắn `wanakana.bind(el)` trong `useEffect`, **`wanakana.unbind(el)` trong cleanup** — không
  unbind thì đổi câu sẽ chồng nhiều binding lên cùng một node.
- `Enter` xác nhận. `autoComplete="off"`, `autoCapitalize="off"`, `spellCheck={false}`.

```tsx
'use client';

import { useEffect, useId, useRef } from 'react';
import { wanakana } from '@/lib/japanese';
import { cn } from '@/lib/utils';

export function JpInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  label,
  state = 'idle',
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  label: string;
  state?: 'idle' | 'correct' | 'incorrect';
}) {
  const id = useId();
  const captionId = `${id}-caption`;
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    wanakana.bind(el);
    return () => wanakana.unbind(el);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        aria-describedby={captionId}
        value={value}
        disabled={disabled}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit();
          }
        }}
        className={cn(
          'jp h-12 w-full rounded-lg border-2 bg-card px-4 text-center text-[1.25rem]',
          'transition-colors duration-150 ease-out',
          'outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
          'disabled:opacity-50',
          state === 'idle' && 'border-border',
          state === 'correct' && 'border-success bg-success/10',
          state === 'incorrect' && 'border-destructive bg-destructive/10 motion-safe:jp-shake',
        )}
      />
      <p id={captionId} className="text-muted-foreground text-sm">
        Gõ romaji, chữ tự chuyển sang hiragana
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Viết `QuestionCloze.tsx`**

Câu hỏi hiện `question.prompt` (chứa `＿＿＿`) ở bậc `jp jp-quiz`. Ô nhập + nút "Kiểm tra"
`size="quiz"`. Chấm bằng `checkTextAnswer(value, question)`. Trả về đúng một `AnswerResult`.

- [ ] **Step 3: Nối vào `PracticeRunner`** — thêm `case 'cloze'` vào chỗ chọn component.

- [ ] **Step 4: Kiểm tra trình duyệt**

- Gõ `wo` → hiện `を`.
- Gõ full-width (bật IME hoặc dán `Ｗｏ`) vẫn chấm đúng.
- Gõ sai nghĩa (`は` khi đáp án là `を`) → chấm **sai**.
- Đổi sang câu tiếp theo rồi gõ lại → wanakana vẫn chuyển đúng một lần, không nhân đôi ký tự.

- [ ] **Step 5: `pnpm check` và commit**

```bash
cd web && pnpm check
git commit -am "feat(luyen-tap): add cloze question type with wanakana input"
```

---

## Task 7: Dạng 5 — Nghe và nhập (`listening`)

**Files:**
- Create: `web/src/components/practice/QuestionListening.tsx`
- Modify: `web/src/components/practice/PracticeRunner.tsx`

**Interfaces:**
- Consumes: `speak` (`@/lib/tts`), `JpInput` (Task 6), `checkTextAnswer`.

- [ ] **Step 1: Viết `QuestionListening.tsx`**

- **Không hiện chữ câu hỏi.** Vùng câu hỏi chỉ có nút phát và chip tốc độ.
- Nút phát: tròn 56px (`size-14 rounded-full`), `variant="default"`, icon `<Volume2 />`,
  `aria-label="Phát lại"`. Không dùng `size="quiz"` cho nút này vì nó là nút tròn 56px riêng —
  vẫn vượt ngưỡng 48px.
- Hai chip tốc độ **0.8×** và **1.0×**, mỗi chip 44px (`h-11 min-w-11`), `aria-pressed`.
- Phát qua `speak(question.prompt, rate)`. `question.prompt` của dạng này đã là **kana**
  (SPEC-01 §4.5) — không gọi lại `toKanaSentence`.
- Ô nhập: `<JpInput />` y hệt dạng 3, cùng caption.
- Chấm bằng `checkTextAnswer`.
- **Tự phát một lần khi câu hiện lên**, rồi để người dùng bấm phát lại. `Space` = phát lại.

> Không cần kiểm tra giọng ở đây: `filterExercises` đã loại sạch câu `listening` khi máy không
> có giọng `ja-JP`, ngay từ màn cấu hình. Câu đã vào tới đây là câu phát được.

- [ ] **Step 2: Nối vào `PracticeRunner`** — thêm `case 'listening'`.

- [ ] **Step 3: Kiểm tra trình duyệt**

- Gõ đúng kana của câu → chấm **đúng** (ca hồi quy cho SPEC-01 §4.5).
- Trên máy/profile **không có giọng ja-JP**: ở màn cấu hình thấy dòng "n câu nghe bị loại", và
  trong phiên **không có câu nghe nào**. Kiểm `reviewItems`: `dueAt` của mục tiêu bị loại
  **không đổi**.
- Chip 0.8× phát chậm hơn thật.

- [ ] **Step 4: `pnpm check` và commit**

```bash
cd web && pnpm check
git commit -am "feat(luyen-tap): add listening question type over speechSynthesis"
```

---

## Task 8: Dạng 4 — Sắp xếp câu (`reorder`)

**Files:**
- Create: `web/src/components/practice/PhraseToken.tsx`
- Create: `web/src/components/practice/QuestionReorder.tsx`
- Modify: `web/src/components/practice/PracticeRunner.tsx`

- [ ] **Step 1: Viết `PhraseToken.tsx`**

Chip `rounded-xl px-4 h-12`, nền `bg-secondary text-secondary-foreground`, chữ
`jp jp-vocab`. Là `<button type="button">`. Khi đã dùng: `opacity-40` + `disabled` + `aria-hidden`
cho nội dung trùng lặp, **vẫn giữ nguyên chỗ trong luồng** — không `display:none`, không gỡ khỏi
DOM. Đây là ràng buộc bố cục cứng của spec: gỡ ra thì các khối còn lại nhảy vị trí và người học
mất dấu.

- [ ] **Step 2: Viết `QuestionReorder.tsx`**

- **Thanh trả lời**: `border-dashed border-2 rounded-xl min-h-16` (64px). Khi rỗng hiện chữ mờ
  "Chạm vào từ bên dưới" (`text-muted-foreground`).
- **Kho khối**: các `PhraseToken` xếp `flex flex-wrap gap-2`.
- 1-chạm là **đường chính**: chạm khối trong kho → thêm vào cuối thanh trả lời; chạm khối trong
  thanh trả lời → trả về kho. Phải làm được hoàn toàn bằng bàn phím (Tab + Enter/Space).
- Kéo thả bằng `framer-motion` (lò xo `stiffness: 400, damping: 30`) là **tùy chọn thay thế**,
  không phải cách duy nhất. Nếu thời gian eo hẹp, **bỏ kéo thả** — 1-chạm đã đủ nghiệm thu.
  Ghi một dòng `// ponytail: chỉ 1-chạm; thêm kéo thả framer-motion khi có nhu cầu thật.`
- Nút "Kiểm tra" `size="quiz"`, disabled khi thanh trả lời chưa đủ số khối.
- Chấm bằng `checkReorderAnswer(chosen, question)`.

- [ ] **Step 3: Nối vào `PracticeRunner`** — thêm `case 'reorder'`.

- [ ] **Step 4: Kiểm tra trình duyệt**

- Chọn một khối → các khối còn lại **không nhảy vị trí**.
- Tab tới từng khối, Enter chọn được — hoàn toàn bằng bàn phím.
- Ở 390px với câu 6 khối: vẫn không cuộn trang.

- [ ] **Step 5: `pnpm check` và commit**

```bash
cd web && pnpm check
git commit -am "feat(luyen-tap): add sentence reorder question type"
```

---

## Task 9: Dạng 2 — Ghép cặp (`matching`)

Dạng khó nhất: nó là dạng duy nhất trả **nhiều** `AnswerResult` và đo `elapsedMs` **riêng cho
từng cặp**.

**Files:**
- Create: `web/src/components/practice/QuestionMatching.tsx`
- Modify: `web/src/components/practice/PracticeRunner.tsx`

- [ ] **Step 1: Viết `QuestionMatching.tsx`**

- Đọc `question.pairs` (`MatchingPair[]`). **Không** parse chuỗi `"từ:::nghĩa"` — định dạng đó
  đã bị bỏ khỏi SPEC-01. Nếu `pairs` vắng mặt, render một dòng lỗi và gọi `onAnswer([])` — không
  đoán.
- Hai cột `AnswerOption`: cột trái `pair.jp` (`jp jp-vocab`), cột phải `pair.vi`. **Xáo trộn
  riêng từng cột** bằng `shuffle` của `@/lib/practice`.
- Chạm ô trái rồi ô phải (hoặc ngược lại) để chốt một cặp.
- Đúng → hai ô sang `correct` rồi mờ đi (`opacity-40`, giữ chỗ). Sai → cả hai `incorrect`
  (rung 3 nhịp 300ms) rồi **trở về `idle`** sau khi animation xong.
- **Đo `elapsedMs` riêng từng cặp**: giữ một `useRef<number>` là mốc thời gian; khởi tạo bằng
  `performance.now()` khi component mount, và **đặt lại sau mỗi lần chốt cặp**. `elapsedMs` của
  cặp = `now - mốc trước đó`.
- Gom `AnswerResult[]` nội bộ, **chỉ gọi `onAnswer(results)` MỘT LẦN** khi đã chốt hết các cặp.
  Mỗi phần tử có `targetId = pair.targetId`, `targetType = targetTypeFromId(pair.targetId)`.
- Bàn phím: Tab tới ô, Enter/Space để chọn — bắt buộc (§7).

- [ ] **Step 2: Sửa `PracticeRunner`**

Thêm `case 'matching'`, và đảm bảo wrapper **không ghi đè `elapsedMs`** khi mảng kết quả có
nhiều hơn một phần tử — dạng này tự đo. Với `lessonByTargetId`, map **mọi** `pair.targetId` sang
`question.lesson`.

- [ ] **Step 3: Kiểm tra trình duyệt — nghiệm thu**

- Làm một câu `matching` 5 cặp, cố tình ghép sai 1 cặp.
- DevTools › IndexedDB › `reviewItems`: đúng **5** bản ghi được tạo/cập nhật, mỗi cặp một
  `targetId`. Cặp ghép sai có `incorrectCount` tăng **ở chính nó**, bốn cặp kia không tăng.
- `recentElapsedMs` của các cặp đúng có mẫu **khác nhau** — chứng tỏ đo riêng, không dùng chung
  một con số.

- [ ] **Step 4: `pnpm check` và commit**

```bash
cd web && pnpm check
git commit -am "feat(luyen-tap): add matching question type with per-pair scheduling"
```

---

## Task 10: Rà soát nghiệm thu & hoàn thiện

**Files:** sửa nơi nào cần để đạt checklist. Không thêm file mới trừ khi buộc phải.

- [ ] **Step 1: Chạy toàn bộ kiểm tra**

```bash
cd web && pnpm check && pnpm test && pnpm build
```

Cả ba phải exit 0.

- [ ] **Step 2: Đi hết checklist nghiệm thu của SPEC-04 §9**

Đánh dấu từng dòng, ghi lại kết quả thật (kể cả dòng **không** đạt):

- [ ] Người dùng mới hoàn toàn: `/luyen-tap` → chọn bài 1 → Bắt đầu → có câu hỏi thật
- [ ] Chọn bài 3 → không câu nào chứa từ của bài 4 trở lên
- [ ] Phiên `mc` 5 câu → `reviewItems` có `dueAt` và `fsrsCard` đúng
- [ ] Một câu `matching` 5 cặp → 5 bản ghi `reviewItems`, cặp sai tăng `incorrectCount` ở chính nó
- [ ] Câu `listening`: gõ đúng kana → chấm đúng
- [ ] Đúng cùng một mục tiêu 6 lần → `recentElapsedMs` giữ đúng 5 mẫu gần nhất
- [ ] Trả lời sai → **không** thêm mẫu vào `recentElapsedMs`
- [ ] Mục tiêu lần đầu có `createdAt` đúng ngày hôm đó
- [ ] Trả lời sai → `dueAt` gần hơn rõ rệt so với trả lời đúng
- [ ] Tắt mạng hoàn toàn (DevTools › Network › Offline) → phiên chạy y hệt
- [ ] Ở 390px, trong suốt phiên không cuộn được trang; vùng trả lời luôn ở nửa dưới
- [ ] Dạng 4: chọn khối → các khối còn lại không nhảy vị trí
- [ ] Dạng 3: gõ `wo` ra `を`; gõ full-width vẫn chấm đúng
- [ ] Dạng 5 trên máy không có giọng `ja-JP`: câu bị loại, `dueAt` mục tiêu đó không đổi
- [ ] Bật "giảm chuyển động" của hệ điều hành (DevTools › Rendering ›
      `prefers-reduced-motion: reduce`): hết rung và trượt, **kết quả đúng/sai vẫn hiện đủ**
- [ ] Mọi nút trong luồng làm bài cao ≥ 48px (đo bằng DevTools)
- [ ] Đóng tab giữa phiên rồi mở lại: không có `reviewItems` nào cho câu chưa trả lời

- [ ] **Step 3: Rà a11y (SPEC-04 §7)**

- [ ] `answer-option` là `<button>` thật ở cả 5 dạng
- [ ] Đúng/sai luôn kèm icon **và** chữ, không bao giờ chỉ bằng màu
- [ ] Kết quả mỗi câu nằm trong vùng `aria-live="polite"`
- [ ] Dạng 2 thao tác được hoàn toàn bằng bàn phím
- [ ] Dạng 4 làm được hoàn toàn bằng 1-chạm
- [ ] `jp-input` có `<label>` liên kết
- [ ] Mọi vùng chạm ≥ 48×48px, cách nhau ≥ 8px
- [ ] Focus ring 3px không bị tắt ở bất kỳ đâu trong phiên

- [ ] **Step 4: Commit phần sửa và tổng kết**

```bash
cd web && pnpm check && pnpm test
git commit -am "fix(luyen-tap): address SPEC-04 acceptance checklist"
```

Báo cáo lại: dòng nào trong checklist **không** đạt và tại sao. Không đánh dấu đạt cho thứ
chưa thật sự kiểm.

---

## Những chỗ tuyệt đối không được làm

- Không import `ts-fsrs` ngoài `src/lib/fsrs.ts`.
- Không tự viết bảng ánh xạ romaji↔kana. `wanakana` lo toàn bộ.
- Không suy `maxLearnedLesson` từ `reviewItems`.
- Không parse chuỗi `"từ:::nghĩa"` cho dạng matching.
- Không ghi `reviewItems` cho câu chưa từng hiển thị (thoát giữa chừng, câu bị loại vì audio).
- Không persist dữ liệu học vào Zustand.
- Không thêm dependency mới, không thêm SWR, không đổi design system.
- Không sửa `web/src/data/**` — task này không chạm dữ liệu bài học.
- Không commit/push lên remote. Chỉ commit local.
