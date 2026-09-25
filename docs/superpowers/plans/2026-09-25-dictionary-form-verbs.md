# Kế hoạch Thực thi: Bổ sung Động từ Thể từ điển & Ưu tiên Học Thể nguyên mẫu

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển đổi 157 động từ N5 sang thể từ điển làm từ vựng chính, bổ sung đầy đủ bảng thể chia (Từ điển, Masu, Te, Nai, Ta) vào dữ liệu, cập nhật giao diện bảng từ vựng, flashcard 3D, luyện tập trắc nghiệm và tìm kiếm toàn cục, trong khi bảo toàn 100% tiến độ FSRS.

**Architecture:** Mở rộng schema `VocabWord` với `verbForms` và `verbGroup`. Chuẩn hóa tự động 25 file `lesson-XX.json` đối chiếu từ `verbs.json`. Cập nhật giao diện học và thuật toán sinh câu hỏi tận dụng trực tiếp `verbForms`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS, Base UI, node:test.

## Global Constraints
- Nguồn sự thật token và giao diện: `DESIGN.md` và `web/src/app/globals.css`.
- Giữ vững Furigana bracket notation: `切[き]る`, `切[き]ります`.
- Giữ nguyên `id` của từ vựng (ví dụ `"kirimasu"`) để bảo vệ lịch sử ôn tập FSRS trong Dexie DB.
- Chỉ dùng `pnpm` trong thư mục `web/`.
- Chạy `pnpm check` (TypeScript + ESLint) và `pnpm test` (node:test) để nghiệm thu kỹ thuật.

---

### Task 1: Mở rộng Schema `VocabWord` và Interface `VerbForms`

**Files:**
- Modify: `web/src/types/index.ts:29-45`
- Test: `web/src/lib/lessons.test.ts`

**Interfaces:**
- Consumes: `web/src/types/index.ts`
- Produces: `VerbForms`, `VocabWord.verbForms`, `VocabWord.verbGroup`

- [ ] **Step 1: Viết test kiểm tra hợp đồng kiểu dữ liệu cho `verbForms`**

Trong `web/src/lib/lessons.test.ts`, thêm test case:
```typescript
test('VocabWord hỗ trợ cấu trúc verbForms và verbGroup', () => {
  const sampleVerb: VocabWord = {
    id: 'kirimasu',
    lesson: 7,
    word: '切[き]る',
    kana: 'きる',
    meaning: { vi: 'cắt', en: 'to cut' },
    type: 'verb-godan',
    verbGroup: 1,
    verbForms: {
      dictionary: '切[き]る',
      dictionaryKana: 'きる',
      masu: '切[き]ります',
      masuKana: 'きります',
      te: '切[き]って',
      teKana: 'きって',
      nai: '切[き]らない',
      naiKana: 'きらない',
      ta: '切[き]った',
      taKana: 'きった',
    },
  };
  assert.equal(sampleVerb.verbForms?.masu, '切[き]ります');
  assert.equal(sampleVerb.verbGroup, 1);
});
```

- [ ] **Step 2: Chạy test để xác nhận lỗi type/compile**

Chạy:
```bash
cd web && pnpm test
```
Kỳ vọng: Test fail hoặc compile error vì `verbForms` và `verbGroup` chưa tồn tại trong `VocabWord`.

- [ ] **Step 3: Cập nhật `web/src/types/index.ts`**

Bổ sung `VerbForms` và mở rộng `VocabWord`:
```typescript
export interface VerbForms {
  dictionary: string;
  dictionaryKana: string;
  masu: string;
  masuKana: string;
  te?: string;
  teKana?: string;
  nai?: string;
  naiKana?: string;
  ta?: string;
  taKana?: string;
}

export interface VocabWord {
  id: string;
  lesson: number;
  word: string;
  kana: string;
  romaji?: string;
  meaning: LocalizedText;
  example?: ExampleSentence;
  type:
    | 'noun' | 'pronoun' | 'verb-godan' | 'verb-ichidan' | 'verb-irregular'
    | 'adjective-i' | 'adjective-na' | 'adverb' | 'particle' | 'expression'
    | 'interrogative' | 'counter' | 'number' | 'conjunction';
  verbGroup?: 1 | 2 | 3;
  verbForms?: VerbForms;
  kanjiIds?: string[];
  audioKey?: string;
  notes?: LocalizedText;
}
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Chạy:
```bash
cd web && pnpm test
```
Kỳ vọng: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/types/index.ts web/src/lib/lessons.test.ts
git commit -m "feat(types): add VerbForms interface and expand VocabWord"
```

---

### Task 2: Script Chuẩn hóa Dữ liệu 25 Bài học N5 sang Thể Từ điển

**Files:**
- Create: `scripts/enrich-vocab-verbs.mjs`
- Modify: `web/src/data/n5/vocab/lesson-*.json` (25 file)
- Test: `web/src/lib/lessons.test.ts`

**Interfaces:**
- Consumes: `web/src/data/n5/verbs/verbs.json`, `web/src/data/n5/vocab/lesson-*.json`
- Produces: 25 file `lesson-*.json` có `word` thể từ điển, `verbGroup` và `verbForms` đầy đủ.

- [ ] **Step 1: Viết test kiểm tra tính toàn vẹn của 157 động từ trong 25 bài học**

Trong `web/src/lib/lessons.test.ts`:
```typescript
test('toàn bộ động từ N5 có word thể từ điển, verbGroup và verbForms hợp lệ', async () => {
  const allLessons = await loadAllLessonsData();
  let verbCount = 0;

  for (const { vocab } of allLessons) {
    for (const w of vocab) {
      if (w.type.startsWith('verb-')) {
        verbCount++;
        assert.ok(w.verbForms, `Từ ${w.id} thiếu verbForms`);
        assert.ok(w.verbGroup, `Từ ${w.id} thiếu verbGroup`);
        assert.ok(w.verbForms.dictionary, `Từ ${w.id} thiếu dictionary form`);
        assert.ok(w.verbForms.masu, `Từ ${w.id} thiếu masu form`);
        // word phải là thể từ điển, không tận cùng bằng ます trừ từ đặc biệt
        assert.equal(w.word, w.verbForms.dictionary);
        assert.equal(w.kana, w.verbForms.dictionaryKana);
      }
    }
  }

  assert.equal(verbCount, 157, `Kỳ vọng 157 động từ, thực tế có ${verbCount}`);
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Chạy:
```bash
cd web && pnpm test
```
Kỳ vọng: FAIL vì các file `lesson-*.json` hiện tại vẫn đang chứa thể masu và chưa có `verbForms`.

- [ ] **Step 3: Tạo script `scripts/enrich-vocab-verbs.mjs` và chạy cập nhật dữ liệu**

Script đọc `web/src/data/n5/verbs/verbs.json`, xây dựng bản đồ tra cứu động từ theo kana và masu reading. Sau đó duyệt 25 file `web/src/data/n5/vocab/lesson-*.json`:
1. Đối với mỗi từ có `type.startsWith('verb-')`:
   - Xác định `verbGroup`: `verb-godan` -> 1, `verb-ichidan` -> 2, `verb-irregular` -> 3.
   - Ghép với mục tương ứng trong `verbs.json` (bỏ qua chú thích `[ともだちに〜]`, `[かぜを〜]`).
   - Xử lý các suru-verb (ví dụ `勉強[べんきょう]します` -> `勉強[べんきょう]する`, kana: `べんきょうする`, masu: `勉強[べんきょう]します`, te: `勉強[べんきょう]して`, nai: `勉強[べんきょう]しない`, ta: `勉強[べんきょう]した`).
   - Chuyển `word` thành thể từ điển có furigana.
   - Chuyển `kana` thành kana thể từ điển.
   - Thêm `verbForms` với đầy đủ các thể.
   - Giữ nguyên `id` gốc (`kirimasu`, `tabemasu`, ...).
2. Ghi lại file JSON với định dạng UTF-8, thụt lề 2 spaces.

Chạy script:
```bash
node scripts/enrich-vocab-verbs.mjs
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Chạy:
```bash
cd web && pnpm test
```
Kỳ vọng: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/enrich-vocab-verbs.mjs web/src/data/n5/vocab/ web/src/lib/lessons.test.ts
git commit -m "feat(data): enrich all 157 N5 verbs with dictionary forms and verbForms"
```

---

### Task 3: Cập nhật Bảng Từ vựng Bài học (`web/src/app/hoc/[so]/page.tsx`)

**Files:**
- Modify: `web/src/app/hoc/[so]/page.tsx:125-156`

**Interfaces:**
- Consumes: `VocabWord.verbForms`, `VocabWord.word`, `VocabWord.kana`
- Produces: UI bảng từ vựng hiển thị thể từ điển to rõ, badge nhóm, dòng phụ thể masu.

- [ ] **Step 1: Viết test component hoặc test hàm phụ trợ hiển thị**

Trong `web/src/lib/lessons.test.ts`:
Kiểm tra dữ liệu nạp của bài 7 đảm bảo từ đầu tiên là `切[き]る` thay vì `切[き]ります`:
```typescript
test('loadLessonData bài 7 trả về động từ ở thể từ điển kèm verbForms', async () => {
  const { vocab } = await loadLessonData(7);
  const kiru = vocab.find((w) => w.id === 'kirimasu');
  assert.ok(kiru);
  assert.equal(kiru.word, '切[き]る');
  assert.equal(kiru.kana, 'きる');
  assert.equal(kiru.verbForms?.masu, '切[き]ります');
});
```

- [ ] **Step 2: Chạy test xác nhận dữ liệu đã sẵn sàng**

Chạy:
```bash
cd web && pnpm test
```
Kỳ vọng: PASS.

- [ ] **Step 3: Cập nhật `web/src/app/hoc/[so]/page.tsx`**

Cập nhật cột từ vựng trong bảng:
```tsx
<td className="py-3 px-4">
  <div className="flex flex-col items-start gap-1">
    <div className="flex items-center gap-2">
      <Furigana text={w.word} className="text-lg font-medium text-foreground" />
      {group && (
        <Badge className={cn('h-auto text-[10px] px-1.5 py-0.2 rounded', group.className)}>
          {group.label}
        </Badge>
      )}
    </div>
    {w.verbForms && (
      <span className="text-xs text-muted-foreground">
        Thể masu: <Furigana text={w.verbForms.masu} />
      </span>
    )}
  </div>
</td>
```
Và nút phát âm `SpeakButton text={w.kana} label={stripFurigana(w.word)} />` sẽ tự động phát âm thể từ điển `きる`.

- [ ] **Step 4: Chạy `pnpm check` và `pnpm test`**

Chạy:
```bash
cd web && pnpm check && pnpm test
```
Kỳ vọng: PASS không có lỗi.

- [ ] **Step 5: Commit**

```bash
git add web/src/app/hoc/\[so\]/page.tsx web/src/lib/lessons.test.ts
git commit -m "feat(ui): display dictionary form and secondary masu form in lesson detail"
```

---

### Task 4: Cập nhật Flashcard và Khối Chia Thể (`web/src/components/vocab/VocabLearningFlow.tsx`)

**Files:**
- Modify: `web/src/components/vocab/VocabLearningFlow.tsx`

**Interfaces:**
- Consumes: `VocabWord.verbForms`, `VocabWord.verbGroup`
- Produces: Flashcard mặt trước hiện thể từ điển + nhãn nhóm; mặt sau hiện khối tóm tắt 4 thể chia; danh sách chọn hiện thể masu phụ; `findExampleForWord` dò câu ví dụ theo tất cả các thể.

- [ ] **Step 1: Viết test cho `findExampleForWord` nhận diện động từ qua `verbForms`**

Trong `web/src/lib/lessons.test.ts`:
Kiểm tra rằng câu ví dụ sử dụng thể masu (`切ります`) vẫn khớp chính xác với từ vựng đã chuyển sang thể từ điển (`切る`):
```typescript
test('findExampleForWord khớp động từ thể từ điển với câu ví dụ dùng thể masu hoặc thể chia', () => {
  const word: VocabWord = {
    id: 'kirimasu',
    lesson: 7,
    word: '切[き]る',
    kana: 'きる',
    meaning: { vi: 'cắt' },
    type: 'verb-godan',
    verbForms: {
      dictionary: '切[き]る',
      dictionaryKana: 'きる',
      masu: '切[き]ります',
      masuKana: 'きります',
      te: '切[き]って',
      nai: '切[き]らない',
      ta: '切[き]った',
    },
  };
  const examples: ExampleSentence[] = [
    {
      jp: 'はさみで 紙[かみ]を 切[き]ります。',
      kana: 'はさみで かみを きります。',
      translation: { vi: 'Tôi cắt giấy bằng kéo.' },
    },
  ];
  // Hàm findExampleForWord trong VocabLearningFlow phải tìm thấy ví dụ này
  // (Được export hoặc tái sử dụng helper chuẩn)
});
```

- [ ] **Step 2: Cập nhật hàm `findExampleForWord` trong `VocabLearningFlow.tsx`**

Nâng cấp hàm để kiểm tra tất cả các thể trong `word.verbForms`:
```typescript
function findExampleForWord(word: VocabWord, examples: ExampleSentence[]): ExampleSentence | undefined {
  const surface = stripFurigana(word.word).replace(/[\s　]/gu, '').normalize('NFKC');
  const reading = word.kana.normalize('NFKC');
  const surfaceTerms = new Set([surface]);
  const readingTerms = new Set([reading]);

  if (word.verbForms) {
    const { dictionary, masu, te, nai, ta, dictionaryKana, masuKana, teKana, naiKana, taKana } = word.verbForms;
    for (const form of [dictionary, masu, te, nai, ta]) {
      if (form) surfaceTerms.add(stripFurigana(form).replace(/[\s　]/gu, '').normalize('NFKC'));
    }
    for (const k of [dictionaryKana, masuKana, teKana, naiKana, taKana]) {
      if (k) readingTerms.add(k.normalize('NFKC'));
    }
  } else if (word.type.startsWith('verb-') && reading.endsWith('ます')) {
    const readingStem = reading.slice(0, -2);
    const surfaceStem = surface.endsWith('ます') ? surface.slice(0, -2) : '';
    for (const ending of ['ます', 'ました', 'ません', 'ませんでした', 'ましょう']) {
      readingTerms.add(`${readingStem}${ending}`);
      if (surfaceStem) surfaceTerms.add(`${surfaceStem}${ending}`);
    }
  }

  return examples.find((example) => {
    const writtenSentence = stripFurigana(example.jp).normalize('NFKC');
    const spokenSentence = toKanaSentence(example.jp).normalize('NFKC');
    return (
      [...surfaceTerms].some((term) => containsWholeStudyTerm(writtenSentence, term)) ||
      [...readingTerms].some((term) => containsWholeStudyTerm(spokenSentence, term))
    );
  });
}
```

- [ ] **Step 3: Cập nhật Giao diện Flashcard trong `VocabLearningFlow.tsx`**

1. **Mặt trước thẻ**:
   - Hiển thị nhãn loại từ/nhóm phía trên:
     ```tsx
     {activeWord.word.verbGroup && (
       <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground mb-2">
         Động từ Nhóm {activeWord.word.verbGroup}
       </span>
     )}
     ```
   - Chữ chính to ở giữa: `<Furigana text={stripFurigana(activeWord.word.word)} zoomable={false} />` (thể từ điển).
2. **Mặt sau thẻ**:
   - Bổ sung **Khối tóm tắt các thể chia (Quick Conjugation Block)** nếu từ có `verbForms`:
     ```tsx
     {activeWord.word.verbForms && (
       <div className="rounded-xl border border-border/80 bg-muted/40 p-3 mb-4 space-y-2">
         <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
           Các thể chia cơ bản
         </span>
         <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
           <div className="flex flex-col">
             <span className="text-[11px] text-muted-foreground">Masu (Lịch sự)</span>
             <span className="font-medium text-foreground"><Furigana text={activeWord.word.verbForms.masu} /></span>
           </div>
           {activeWord.word.verbForms.te && (
             <div className="flex flex-col">
               <span className="text-[11px] text-muted-foreground">Te (Nối / Đang làm)</span>
               <span className="font-medium text-foreground"><Furigana text={activeWord.word.verbForms.te} /></span>
             </div>
           )}
           {activeWord.word.verbForms.nai && (
             <div className="flex flex-col">
               <span className="text-[11px] text-muted-foreground">Nai (Phủ định)</span>
               <span className="font-medium text-foreground"><Furigana text={activeWord.word.verbForms.nai} /></span>
             </div>
           )}
           {activeWord.word.verbForms.ta && (
             <div className="flex flex-col">
               <span className="text-[11px] text-muted-foreground">Ta (Quá khứ)</span>
               <span className="font-medium text-foreground"><Furigana text={activeWord.word.verbForms.ta} /></span>
             </div>
           )}
         </div>
       </div>
     )}
     ```
3. **Danh sách chọn từ**:
   - Hiển thị thể masu phụ:
     ```tsx
     <span className="jp jp-vocab block font-medium">
       <Furigana text={word.word} />
       {word.verbForms && (
         <span className="ml-2 text-xs font-normal text-muted-foreground">
           (Masu: {stripFurigana(word.verbForms.masu)})
         </span>
       )}
     </span>
     ```

- [ ] **Step 4: Chạy `pnpm check` và `pnpm test`**

Chạy:
```bash
cd web && pnpm check && pnpm test
```
Kỳ vọng: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/vocab/VocabLearningFlow.tsx
git commit -m "feat(vocab): add conjugation block to flashcards and enrich example finder"
```

---

### Task 5: Cập nhật Sinh Câu hỏi Luyện tập & Distractor Pool

**Files:**
- Modify: `web/src/lib/questions.ts`
- Modify: `web/src/lib/distractors.ts`
- Test: `web/src/lib/questions.test.ts`, `web/src/lib/distractors.test.ts`

**Interfaces:**
- Consumes: `VocabWord.word`, `VocabWord.kana`, `VocabWord.type`
- Produces: QuestionItem cho MC và Matching với thể từ điển.

- [ ] **Step 1: Viết test kiểm tra câu hỏi sinh ra từ động từ mang thể từ điển**

Trong `web/src/lib/questions.test.ts`:
```typescript
test('sinh câu hỏi MC Đọc từ động từ sử dụng thể từ điển và đáp án kana từ điển', () => {
  const mockVocab = new Map<number, VocabWord[]>([
    [
      7,
      [
        {
          id: 'kirimasu',
          lesson: 7,
          word: '切[き]る',
          kana: 'きる',
          meaning: { vi: 'cắt' },
          type: 'verb-godan',
          verbForms: {
            dictionary: '切[き]る',
            dictionaryKana: 'きる',
            masu: '切[き]ります',
            masuKana: 'きります',
          },
        },
      ],
    ],
  ]);
  const questions = generateQuestions([mockLesson(7)], mockVocab);
  const readQ = questions.find((q) => q.id === 'mc-read-vocab-07-01');
  assert.ok(readQ);
  assert.equal(readQ.prompt, '切る');
  assert.equal(readQ.answer, 'きる');
});
```

- [ ] **Step 2: Chạy test để kiểm tra**

Chạy:
```bash
cd web && pnpm test
```
Kỳ vọng: PASS.

- [ ] **Step 3: Rà soát và cập nhật `distractors.ts` nếu cần**

Đảm bảo thuật toán `pickDistractors` phân tách tốt đuôi okurigana cho thể từ điển (như `切る` có tail là `る`, `書く` có tail là `く`). Cập nhật test hồi quy trong `distractors.test.ts`.

- [ ] **Step 4: Chạy test toàn bộ `questions` và `distractors`**

Chạy:
```bash
cd web && pnpm test
```
Kỳ vọng: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/questions.ts web/src/lib/distractors.ts web/src/lib/questions.test.ts web/src/lib/distractors.test.ts
git commit -m "feat(questions): generate quiz questions using dictionary form verbs"
```

---

### Task 6: Cập nhật Tìm kiếm Toàn cục `Ctrl+K` (`web/src/lib/search.ts`)

**Files:**
- Modify: `web/src/lib/search.ts:160-175`
- Test: `web/src/lib/search.test.ts`

**Interfaces:**
- Consumes: `VocabWord.word`, `VocabWord.verbForms`
- Produces: `SearchEntry` cho từ vựng chứa cả thể từ điển và thể masu trong `keys`.

- [ ] **Step 1: Viết test cho tìm kiếm từ vựng bằng cả thể từ điển và thể masu**

Trong `web/src/lib/search.test.ts`:
```typescript
test('tìm kiếm từ vựng khớp cả thể từ điển và thể masu', () => {
  // Tìm kiếm "kiru" -> tìm ra 切る
  const resKiru = executeSearch('kiru');
  assert.ok(resKiru.results.some((r) => r.id === 'vocab-kirimasu'));

  // Tìm kiếm "kirimasu" -> vẫn tìm ra 切る (nhờ index thể masu)
  const resMasu = executeSearch('kirimasu');
  assert.ok(resMasu.results.some((r) => r.id === 'vocab-kirimasu'));
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Chạy:
```bash
cd web && pnpm test
```
Kỳ vọng: FAIL vì search index hiện tại chưa index `verbForms.masu` của từ vựng.

- [ ] **Step 3: Cập nhật `buildSearchIndex` trong `web/src/lib/search.ts`**

Khi xử lý từ vựng (`kind === 'vocab'`):
```typescript
const keys = [
  w.word,
  plainWord,
  w.kana,
  w.meaning.vi,
  w.meaning.en ?? '',
];
if (w.verbForms) {
  keys.push(w.verbForms.masu);
  keys.push(stripFurigana(w.verbForms.masu));
  keys.push(w.verbForms.masuKana);
}
```
Và trong `sublabel`:
```typescript
const sublabel = w.verbForms
  ? `${w.meaning.vi} · Masu: ${stripFurigana(w.verbForms.masu)}`
  : w.meaning.vi;
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Chạy:
```bash
cd web && pnpm test
```
Kỳ vọng: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/search.ts web/src/lib/search.test.ts
git commit -m "feat(search): index both dictionary form and masu form for verbs"
```

---

### Task 7: Kiểm tra Hồi quy Toàn diện & Nghiệm thu Giao diện Trình duyệt

**Files:**
- Test all: `web/`

- [ ] **Step 1: Chạy Static Verification (`pnpm check`)**

Chạy trong `web/`:
```bash
pnpm check
```
Kỳ vọng: Không có lỗi TypeScript (`tsc --noEmit`) và không có lỗi ESLint (`next lint`).

- [ ] **Step 2: Chạy Test Suite Toàn Diện (`pnpm test`)**

Chạy trong `web/`:
```bash
pnpm test
```
Kỳ vọng: 100% tests PASS.

- [ ] **Step 3: Kiểm tra Trình duyệt Thực tế qua Browser Subagent**

1. Khởi động dev server: `pnpm dev`.
2. Mở `/hoc/7`: Kiểm tra bảng từ vựng hiển thị `切[き]る`, badge `Nhóm 1`, dòng chú thích `Thể masu: 切ります`.
3. Mở `/hoc/7/tu-vung`: Kiểm tra flashcard mặt trước hiện `切[き]る` + nhãn nhóm; lật thẻ mặt sau kiểm tra bảng 4 thể chia `Masu`, `Te`, `Nai`, `Ta` và câu ví dụ.
4. Nhấn `Ctrl+K`: Gõ `kiru` và `kirimasu`, kiểm tra kết quả tìm kiếm hiển thị chính xác.

- [ ] **Step 4: Cập nhật Spec Status & Handoff**

Cập nhật `docs/specs/README.md` và tạo handoff ghi nhận kết quả nghiệm thu có ngày tháng và bằng chứng.

- [ ] **Step 5: Commit Hoàn tất**

```bash
git add docs/
git commit -m "docs: update spec status and handoff for dictionary form verbs feature"
```
