# SPEC-01 Questions & Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện toàn bộ logic sinh câu hỏi 5 dạng bài tập (`mc`, `matching`, `cloze`, `reorder`, `listening`), thuật toán distractor, helper TTS và hàm lọc thông minh `filterExercises()` theo đặc tả `docs/specs/SPEC-01-du-lieu-va-sinh-cau-hoi.md`.

**Architecture:** Xây dựng các pure functions trong `web/src/lib/` nhận dữ liệu tĩnh từ `web/src/data/n5/`, memo hóa theo danh sách bài học, không sinh tệp artifact trung gian. Chấm điểm nhị phân chuẩn hóa qua `wanakana` và `japanese.ts`. Kiểm thử toàn diện bằng test suite `node:test`.

**Tech Stack:** Next.js 16, TypeScript (strict), Node.js `node:test` & `node:assert/strict`, `wanakana`.

## Global Constraints

- Không sửa đổi bất kỳ file nào trong `repo-reference/noken/`.
- Không gọi network, không chạm Dexie, không chạm DOM trong `distractors.ts`, `questions.ts`, `filter.ts`.
- Giữ nguyên vẹn kiểu dữ liệu đã định nghĩa trong `web/src/types/index.ts`, chỉ bổ sung `'pronoun'` vào `VocabWord['type']`.
- Phải đảm bảo quy tắc `targetId` chuẩn hóa: `vocab-<lesson>-<index>`, `grammar-<lesson>-<index>`, `particle-<romaji>`, `kanji-<char>`.
- Quét `auxiliaryLessons` theo quy tắc dài-trước-ngắn trên `stripFurigana(word)`.
- `reorder` chỉ nhận câu tách được từ 4 đến 6 khối bunsetsu (theo khoảng trắng dữ liệu Minna).
- Cloze trợ từ chỉ bắt trợ từ tin cậy theo regex sau ngoặc `]` hoặc Katakana; bể nhiễu 11 trợ từ với ≥5 lựa chọn mỗi loại.
- Chạy `pnpm check` và `pnpm test` sau mỗi task để bảo đảm không có lỗi type hoặc hồi quy.

---

### Task 1: Bổ sung `'pronoun'` vào `VocabWord['type']`

**Files:**
- Modify: `web/src/types/index.ts:35`
- Test: `web/package.json` (`pnpm check`)

**Interfaces:**
- Consumes: `VocabWord` definition
- Produces: `VocabWord['type']` union chứa `'pronoun'`

- [ ] **Step 1: Viết failing test hoặc kiểm tra type hiện tại**

Kiểm tra gán thử một đối tượng có `"type": "pronoun"`:
```typescript
import type { VocabWord } from '../types/index.ts';
const _sample: VocabWord['type'] = 'pronoun';
```
Kỳ vọng ban đầu khi chưa sửa: `Type '"pronoun"' is not assignable to type 'VocabWord['type']'`.

- [ ] **Step 2: Cập nhật `VocabWord['type']` trong `web/src/types/index.ts`**

Thay thế dòng 35 trong `web/src/types/index.ts`:
```typescript
  type: 'noun' | 'pronoun' | 'verb-1' | 'verb-2' | 'verb-3' | 'i-adj' | 'na-adj' | 'adverb' | 'particle' | 'expression';
```

- [ ] **Step 3: Chạy type check để xác minh**

Chạy: `pnpm check` trong thư mục `web/`
Kỳ vọng: PASS (exit code 0).

- [ ] **Step 4: Commit**

```bash
git add web/src/types/index.ts
git commit -m "feat(types): add pronoun to VocabWord type union"
```

---

### Task 2: Triển khai Module Sinh Đáp án Nhiễu Trắc nghiệm (`distractors.ts`)

**Files:**
- Create: `web/src/lib/distractors.ts`
- Create: `web/src/lib/distractors.test.ts`

**Interfaces:**
- Produces:
  - `export interface DistractorCandidate { kana: string; type: string; stripped: string; }`
  - `export const okuriganaTail: (stripped: string) => string`
  - `export const pickDistractors: (answer: DistractorCandidate, pool: readonly DistractorCandidate[], count: number, random?: () => number) => string[]`

- [ ] **Step 1: Viết test suite `distractors.test.ts`**

Tạo `web/src/lib/distractors.test.ts`:
```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { okuriganaTail, pickDistractors, type DistractorCandidate } from './distractors.ts';

test('okuriganaTail trích xuất đúng đuôi kana của từ', () => {
  assert.equal(okuriganaTail('食べます'), 'べます');
  assert.equal(okuriganaTail('行きます'), 'きます');
  assert.equal(okuriganaTail('学生'), ''); // danh từ không có đuôi okurigana
  assert.equal(okuriganaTail('高い'), 'い');
});

test('pickDistractors không bao giờ chứa chính đáp án đúng', () => {
  const answer: DistractorCandidate = { kana: 'たべます', type: 'verb-2', stripped: '食べます' };
  const pool: DistractorCandidate[] = [
    answer,
    { kana: 'いきます', type: 'verb-1', stripped: '行きます' },
    { kana: 'のみます', type: 'verb-1', stripped: '飲みます' },
    { kana: 'みせます', type: 'verb-2', stripped: '見せます' },
    { kana: 'がくせい', type: 'noun', stripped: '学生' },
  ];

  const result = pickDistractors(answer, pool, 3, () => 0.5);
  assert.equal(result.length, 3);
  assert.ok(!result.includes('たべます'));
});

test('pickDistractors ưu tiên ứng viên cùng loại từ và cùng đuôi okurigana', () => {
  const answer: DistractorCandidate = { kana: 'たべます', type: 'verb-2', stripped: '食べます' };
  const pool: DistractorCandidate[] = [
    { kana: 'みせます', type: 'verb-2', stripped: '見せます' }, // cùng type verb-2 (+3), cùng đuôi "ます" (+3), diff len (+2) => điểm cao nhất
    { kana: 'がくせい', type: 'noun', stripped: '学生' },        // khác type, khác đuôi => điểm thấp
    { kana: 'いきます', type: 'verb-1', stripped: '行きます' },   // khác type, cùng đuôi "ます" (+3)
  ];

  const result = pickDistractors(answer, pool, 1, () => 0);
  assert.equal(result[0], 'みせます');
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Chạy: `pnpm test` trong `web/`
Kỳ vọng: FAIL do `distractors.ts` chưa tồn tại.

- [ ] **Step 3: Triển khai `web/src/lib/distractors.ts`**

Tạo `web/src/lib/distractors.ts`:
```typescript
export interface DistractorCandidate {
  kana: string;
  type: string;
  stripped: string;
}

const KANA = /[ぁ-んァ-ヴー]/;

export const okuriganaTail = (stripped: string): string => {
  let index = stripped.length;
  while (index > 0 && KANA.test(stripped[index - 1]!)) index -= 1;
  return stripped.slice(index);
};

const SAME_TYPE = 3;
const SAME_TAIL = 3;

const lengthScore = (candidate: number, answer: number) => {
  const difference = Math.abs(candidate - answer);
  if (difference === 0) return 2;
  if (difference === 1) return 1;
  return 0;
};

export const pickDistractors = (
  answer: DistractorCandidate,
  pool: readonly DistractorCandidate[],
  count: number,
  random: () => number = Math.random
): string[] => {
  const answerTail = okuriganaTail(answer.stripped);

  const unique = new Map<string, DistractorCandidate>();
  pool.forEach((candidate) => {
    if (candidate.kana !== answer.kana) unique.set(candidate.kana, candidate);
  });

  return [...unique.values()]
    .map((candidate) => ({
      kana: candidate.kana,
      score:
        (candidate.type === answer.type ? SAME_TYPE : 0) +
        (okuriganaTail(candidate.stripped) === answerTail ? SAME_TAIL : 0) +
        lengthScore(candidate.kana.length, answer.kana.length) +
        random(),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ kana }) => kana);
};
```

- [ ] **Step 4: Chạy test để xác nhận PASS**

Chạy: `pnpm test` trong `web/`
Kỳ vọng: PASS toàn bộ các bài test `distractors.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/distractors.ts web/src/lib/distractors.test.ts
git commit -m "feat(practice): implement distractor algorithm with tests"
```

---

### Task 3: Triển khai TTS Helper (`tts.ts`)

**Files:**
- Create: `web/src/lib/tts.ts`
- Create: `web/src/lib/tts.test.ts`

**Interfaces:**
- Produces:
  - `export const speak: (text: string, rate?: number) => void`
  - `export const hasJapaneseVoice: () => Promise<boolean>`

- [ ] **Step 1: Viết test `tts.test.ts`**

Tạo `web/src/lib/tts.test.ts`:
```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasJapaneseVoice, speak } from './tts.ts';

test('hasJapaneseVoice trả về false trong môi trường không có window/speechSynthesis', async () => {
  // Môi trường Node.js không có window.speechSynthesis
  const available = await hasJapaneseVoice();
  assert.equal(available, false);
});

test('speak không ném lỗi trong môi trường không hỗ trợ speechSynthesis', () => {
  assert.doesNotThrow(() => {
    speak('こんにちは', 1.0);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Chạy: `pnpm test` trong `web/`
Kỳ vọng: FAIL do `tts.ts` chưa tồn tại.

- [ ] **Step 3: Triển khai `web/src/lib/tts.ts`**

Tạo `web/src/lib/tts.ts`:
```typescript
export const hasJapaneseVoice = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  const check = (): boolean => {
    const voices = window.speechSynthesis.getVoices();
    return voices.some((v) => v.lang.toLowerCase().startsWith('ja'));
  };

  if (check()) return true;

  return new Promise<boolean>((resolve) => {
    let resolved = false;
    const onVoicesChanged = () => {
      if (!resolved) {
        resolved = true;
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(check());
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(check());
      }
    }, 1000);
  });
};

export const speak = (text: string, rate = 1.0): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = rate;

  const voices = window.speechSynthesis.getVoices();
  const jaVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ja'));
  if (jaVoice) {
    utterance.voice = jaVoice;
  }

  window.speechSynthesis.speak(utterance);
};
```

- [ ] **Step 4: Chạy test để xác minh PASS**

Chạy: `pnpm test` trong `web/`
Kỳ vọng: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/tts.ts web/src/lib/tts.test.ts
git commit -m "feat(audio): implement Web Speech API TTS helper with safe SSR fallback"
```

---

### Task 4: Triển khai Module Sinh Câu hỏi 5 Dạng Bài (`questions.ts`)

**Files:**
- Create: `web/src/lib/questions.ts`
- Create: `web/src/lib/questions.test.ts`

**Interfaces:**
- Consumes:
  - `VocabWord`, `Lesson`, `QuestionItem` từ `web/src/types/index.ts`
  - `stripFurigana` từ `web/src/lib/japanese.ts`
  - `pickDistractors`, `DistractorCandidate` từ `web/src/lib/distractors.ts`
- Produces:
  - `export const buildAuxiliaryIndex: (vocabByLesson: Map<number, VocabWord[]>) => Map<string, number>`
  - `export const extractAuxiliaryLessons: (sentence: string, index: Map<string, number>) => number[]`
  - `export const generateQuestions: (lessons: Lesson[], vocabByLesson: Map<number, VocabWord[]>) => QuestionItem[]`

- [ ] **Step 1: Viết test `questions.test.ts`**

Tạo `web/src/lib/questions.test.ts`:
```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAuxiliaryIndex,
  extractAuxiliaryLessons,
  generateQuestions,
  PARTICLE_PATTERN,
  CONFUSION_PARTICLES
} from './questions.ts';
import type { Lesson, VocabWord } from '../types/index.ts';

test('buildAuxiliaryIndex & extractAuxiliaryLessons: quét từ dài trước ngắn', () => {
  const vocabMap = new Map<number, VocabWord[]>([
    [1, [{ id: '01-01', lesson: 1, word: '会社[かいしゃ]', kana: 'かいしゃ', meaning: { vi: 'công ty' }, type: 'noun' }]],
    [2, [{ id: '02-01', lesson: 2, word: '会社員[かいしゃいん]', kana: 'かいしゃいん', meaning: { vi: 'nhân viên công ty' }, type: 'noun' }]],
  ]);

  const index = buildAuxiliaryIndex(vocabMap);
  const lessons = extractAuxiliaryLessons('私[わたし]は 会社員[かいしゃいん]です。', index);
  // Phải match "会社員" (bài 2), không được match nhầm "会社" (bài 1)
  assert.deepEqual(lessons, [2]);
});

test('PARTICLE_PATTERN regex chỉ khớp trợ từ sau ngoặc ] hoặc katakana', () => {
  const sentence = '私[わたし]は 学生[がくせい]です。';
  const matches = [...sentence.matchAll(PARTICLE_PATTERN)];
  assert.equal(matches.length, 1);
  assert.equal(matches[0]![1], 'は');

  // Câu thuần kana không bị khớp nhầm
  const kanaSentence = 'わたしはがくせいです';
  const kanaMatches = [...kanaSentence.matchAll(PARTICLE_PATTERN)];
  assert.equal(kanaMatches.length, 0);
});

test('generateQuestions sinh đủ 5 dạng bài và tuân thủ các điều kiện lọc', () => {
  const mockLessons: Lesson[] = [
    {
      level: 'n5',
      number: 1,
      title: { vi: 'Bài 1' },
      description: { vi: 'Mô tả bài 1' },
      sourceRef: { book: 'Minna no Nihongo I', pages: '1-10' },
      grammar: [
        {
          id: '01-01',
          title: { vi: 'N1 は N2 です' },
          pattern: { vi: 'N1 は N2 です' },
          explanation: { vi: 'Giải thích' },
          examples: [
            // 4 khối bunsetsu => hợp lệ cho reorder
            { jp: '私[わたし]は 明日[あした] 京都[きょうと]へ 行[い]きます。', translation: { vi: 'Tôi ngày mai đi Kyoto.' } },
            // 2 khối bunsetsu => không hợp lệ cho reorder
            { jp: '学生[がくせい] です。', translation: { vi: 'Là học sinh.' } }
          ]
        }
      ]
    }
  ];

  const mockVocab = new Map<number, VocabWord[]>([
    [
      1,
      [
        { id: '01-01', lesson: 1, word: '私[わたし]', kana: 'わたし', meaning: { vi: 'tôi' }, type: 'pronoun' },
        { id: '01-02', lesson: 1, word: '学生[がくせい]', kana: 'がくせい', meaning: { vi: 'học sinh' }, type: 'noun' },
        { id: '01-03', lesson: 1, word: '先生[せんせい]', kana: 'せんせい', meaning: { vi: 'giáo viên' }, type: 'noun' },
        { id: '01-04', lesson: 1, word: '会社員[かいしゃいん]', kana: 'かいしゃいん', meaning: { vi: 'nhân viên' }, type: 'noun' },
        { id: '01-05', lesson: 1, word: '医者[いしゃ]', kana: 'いしゃ', meaning: { vi: 'bác sĩ' }, type: 'noun' }
      ]
    ]
  ]);

  const questions = generateQuestions(mockLessons, mockVocab);
  const types = new Set(questions.map((q) => q.type));

  assert.ok(types.has('mc'), 'Phải có câu hỏi mc');
  assert.ok(types.has('matching'), 'Phải có câu hỏi matching');
  assert.ok(types.has('cloze'), 'Phải có câu hỏi cloze');
  assert.ok(types.has('reorder'), 'Phải có câu hỏi reorder');
  assert.ok(types.has('listening'), 'Phải có câu hỏi listening');

  // Kiểm tra targetId convention
  const mc = questions.find((q) => q.type === 'mc');
  assert.match(mc!.targetId, /^vocab-01-\d{2}$/);

  const cloze = questions.find((q) => q.type === 'cloze');
  assert.match(cloze!.targetId, /^particle-/);

  const reorder = questions.find((q) => q.type === 'reorder');
  assert.match(reorder!.targetId, /^grammar-01-01$/);
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Chạy: `pnpm test` trong `web/`
Kỳ vọng: FAIL do `questions.ts` chưa tồn tại.

- [ ] **Step 3: Triển khai `web/src/lib/questions.ts`**

Tạo `web/src/lib/questions.ts`:
```typescript
import type { Lesson, VocabWord, QuestionItem } from '../types/index.ts';
import { stripFurigana } from './japanese.ts';
import { pickDistractors, type DistractorCandidate } from './distractors.ts';

export const CONFUSION_PARTICLES: Record<string, string[]> = {
  は: ['が', 'も', 'を', 'に', 'で'],
  が: ['は', 'を', 'に', 'も', 'で'],
  を: ['が', 'に', 'で', 'は', 'へ'],
  に: ['で', 'へ', 'を', 'が', 'と'],
  で: ['に', 'を', 'へ', 'は', 'と'],
  へ: ['に', 'で', 'まで', 'を', 'から'],
  と: ['や', 'に', 'も', 'で', 'は'],
  も: ['は', 'と', 'が', 'を', 'に'],
  から: ['まで', 'に', 'で', 'へ', 'と'],
  まで: ['から', 'に', 'へ', 'で', 'を'],
  や: ['と', 'も', 'の', 'に', 'で'],
};

const PARTICLE_ROMAJI: Record<string, string> = {
  は: 'wa',
  が: 'ga',
  を: 'wo',
  に: 'ni',
  で: 'de',
  へ: 'e',
  と: 'to',
  も: 'mo',
  から: 'kara',
  まで: 'made',
  や: 'ya',
};

export const PARTICLE_PATTERN = new RegExp(
  `(?<=\\]|[\\u30a1-\\u30f3\\u30fc])(${Object.keys(CONFUSION_PARTICLES).join('|')})(?=[ \\u30000-9\\uff10-\\uff19\\u4e00-\\u9fa5\\u3005\\u30a1-\\u30f3「])`,
  'g'
);

const BLANK = '＿＿＿';

export const buildAuxiliaryIndex = (vocabByLesson: Map<number, VocabWord[]>): Map<string, number> => {
  const index = new Map<string, number>();
  for (const [lesson, words] of vocabByLesson.entries()) {
    for (const w of words) {
      const surface = stripFurigana(w.word);
      if (surface) {
        index.set(surface, lesson);
      }
    }
  }
  return index;
};

export const extractAuxiliaryLessons = (sentence: string, index: Map<string, number>): number[] => {
  const stripped = stripFurigana(sentence);
  // Sắp xếp các từ khóa theo độ dài giảm dần (dài trước ngắn)
  const sortedKeys = Array.from(index.keys()).sort((a, b) => b.length - a.length);
  const lessons = new Set<number>();
  let remaining = stripped;

  for (const key of sortedKeys) {
    if (remaining.includes(key)) {
      lessons.add(index.get(key)!);
      // Xóa phần đã khớp để không khớp con lặp
      remaining = remaining.split(key).join(' ');
    }
  }

  return Array.from(lessons).sort((a, b) => a - b);
};

const pad2 = (n: number | string): string => String(n).padStart(2, '0');

export const generateQuestions = (
  lessons: Lesson[],
  vocabByLesson: Map<number, VocabWord[]>
): QuestionItem[] => {
  const questions: QuestionItem[] = [];
  const auxIndex = buildAuxiliaryIndex(vocabByLesson);

  // Chuẩn bị distractor pool cho từ vựng
  const allVocabCandidates: DistractorCandidate[] = [];
  const allMeaningCandidates: { meaning: string; lesson: number }[] = [];

  for (const words of vocabByLesson.values()) {
    for (const w of words) {
      allVocabCandidates.push({
        kana: w.kana,
        type: w.type,
        stripped: stripFurigana(w.word),
      });
      if (w.meaning.vi) {
        allMeaningCandidates.push({ meaning: w.meaning.vi, lesson: w.lesson });
      }
    }
  }

  // 1. Dạng MC (Đọc & Nghĩa) từ Vocab
  for (const [lessonNum, words] of vocabByLesson.entries()) {
    words.forEach((word, idx) => {
      const targetId = `vocab-${pad2(lessonNum)}-${pad2(idx + 1)}`;
      const strippedWord = stripFurigana(word.word);

      // 1.1 MC Reading: prompt = stripped kanji, options = kana
      const readingDistractors = pickDistractors(
        { kana: word.kana, type: word.type, stripped: strippedWord },
        allVocabCandidates,
        3
      );
      questions.push({
        id: `mc-read-${targetId}`,
        type: 'mc',
        lesson: lessonNum,
        auxiliaryLessons: [lessonNum],
        targetId,
        prompt: strippedWord,
        context: 'Chọn cách đọc đúng của từ',
        options: [word.kana, ...readingDistractors].sort(),
        answer: word.kana,
      });

      // 1.2 MC Meaning: prompt = word with furigana, options = meaning.vi
      const otherMeanings = allMeaningCandidates
        .filter((c) => c.meaning !== word.meaning.vi)
        .map((c) => c.meaning);
      const meaningDistractors = otherMeanings
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      questions.push({
        id: `mc-mean-${targetId}`,
        type: 'mc',
        lesson: lessonNum,
        auxiliaryLessons: [lessonNum],
        targetId,
        prompt: word.word,
        context: 'Chọn nghĩa tiếng Việt chính xác',
        options: [word.meaning.vi, ...meaningDistractors].sort(),
        answer: word.meaning.vi,
      });
    });

    // 2. Dạng Matching từ Vocab (chia từng nhóm 4-5 từ cùng bài)
    for (let i = 0; i < words.length; i += 5) {
      const chunk = words.slice(i, i + 5);
      if (chunk.length >= 4) {
        questions.push({
          id: `matching-${pad2(lessonNum)}-${Math.floor(i / 5) + 1}`,
          type: 'matching',
          lesson: lessonNum,
          auxiliaryLessons: [lessonNum],
          targetId: `vocab-${pad2(lessonNum)}-${pad2(i + 1)}`,
          prompt: 'Ghép từ tiếng Nhật với nghĩa tiếng Việt tương ứng',
          options: chunk.map((w) => w.word),
          answer: chunk.map((w) => `${w.word}:::${w.meaning.vi}`),
        });
      }
    }
  }

  // 3. Dạng Cloze, Reorder, Listening từ Lesson Grammar & Examples
  for (const lesson of lessons) {
    const lessonNum = lesson.number;

    lesson.grammar.forEach((point) => {
      point.examples.forEach((example, exIdx) => {
        const auxLessons = extractAuxiliaryLessons(example.jp, auxIndex);
        if (!auxLessons.includes(lessonNum)) {
          auxLessons.push(lessonNum);
          auxLessons.sort((a, b) => a - b);
        }

        // 3.1 Cloze (Điền trợ từ)
        const matches = [...example.jp.matchAll(PARTICLE_PATTERN)];
        matches.forEach((match, matchIdx) => {
          const particle = match[1]!;
          const romaji = PARTICLE_ROMAJI[particle] ?? particle;
          const targetId = `particle-${romaji}`;
          const prompt = `${example.jp.slice(0, match.index)}${BLANK}${example.jp.slice(
            match.index! + particle.length
          )}`;

          const distractors = (CONFUSION_PARTICLES[particle] ?? [])
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

          questions.push({
            id: `cloze-${pad2(lessonNum)}-${point.id}-${exIdx}-${matchIdx}`,
            type: 'cloze',
            lesson: lessonNum,
            auxiliaryLessons: auxLessons,
            targetId,
            prompt,
            context: example.translation.vi,
            options: [particle, ...distractors].sort(),
            answer: particle,
            acceptedVariants: [particle],
            explanationVi: example.translation.vi,
            explanationJp: example.jp,
          });
        });

        // 3.2 Reorder (Sắp xếp câu: chỉ nhận câu có 4-6 khối bunsetsu)
        const blocks = example.jp.trim().split(/[ \u3000]+/);
        if (blocks.length >= 4 && blocks.length <= 6) {
          questions.push({
            id: `reorder-${pad2(lessonNum)}-${point.id}-${exIdx}`,
            type: 'reorder',
            lesson: lessonNum,
            auxiliaryLessons: auxLessons,
            targetId: `grammar-${pad2(lessonNum)}-${point.id}`,
            prompt: example.translation.vi,
            context: 'Sắp xếp các cụm từ thành câu hoàn chỉnh',
            options: [...blocks].sort(() => Math.random() - 0.5),
            answer: blocks,
            explanationVi: example.translation.vi,
            explanationJp: example.jp,
          });
        }

        // 3.3 Listening (Nghe và chép chính tả câu)
        questions.push({
          id: `listening-${pad2(lessonNum)}-${point.id}-${exIdx}`,
          type: 'listening',
          lesson: lessonNum,
          auxiliaryLessons: auxLessons,
          targetId: `grammar-${pad2(lessonNum)}-${point.id}`,
          prompt: example.jp,
          context: 'Nghe audio/phát âm và nhập lại câu chính xác',
          answer: stripFurigana(example.jp),
          acceptedVariants: [stripFurigana(example.jp)],
          explanationVi: example.translation.vi,
          explanationJp: example.jp,
        });
      });
    });
  }

  return questions;
};
```

- [ ] **Step 4: Chạy test để xác nhận PASS**

Chạy: `pnpm test` trong `web/`
Kỳ vọng: PASS toàn bộ `questions.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/questions.ts web/src/lib/questions.test.ts
git commit -m "feat(practice): implement pure question generator for 5 exercise types"
```

---

### Task 5: Triển khai Module Lọc Câu hỏi Thông minh (`filter.ts`)

**Files:**
- Create: `web/src/lib/filter.ts`
- Create: `web/src/lib/filter.test.ts`

**Interfaces:**
- Consumes: `QuestionItem`, `PracticeConfig` từ `web/src/types/index.ts`
- Produces:
  - `export const filterExercises: (allQuestions: QuestionItem[], config: PracticeConfig, availableAudioKeys: Set<string>, dueTargetIds?: Set<string>) => { eligibleQuestions: QuestionItem[]; excludedAudioCount: number }`

- [ ] **Step 1: Viết test `filter.test.ts`**

Tạo `web/src/lib/filter.test.ts`:
```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterExercises } from './filter.ts';
import type { QuestionItem, PracticeConfig } from '../types/index.ts';

const mockQuestions: QuestionItem[] = [
  {
    id: 'q1',
    type: 'mc',
    lesson: 1,
    auxiliaryLessons: [1],
    targetId: 'vocab-01-01',
    prompt: '私',
    answer: 'わたし',
  },
  {
    id: 'q2',
    type: 'reorder',
    lesson: 1,
    auxiliaryLessons: [1, 5], // cần kiến thức bài 5
    targetId: 'grammar-01-01',
    prompt: 'Câu bài 1 dùng từ bài 5',
    answer: ['A', 'B', 'C', 'D'],
  },
  {
    id: 'q3',
    type: 'listening',
    lesson: 1,
    auxiliaryLessons: [1],
    audioKey: 'audio-01',
    targetId: 'grammar-01-02',
    prompt: 'Listening prompt',
    answer: 'nghe',
  },
];

test('filterExercises lọc theo bài và chặn auxiliaryLessons > maxLearnedLesson', () => {
  const config: PracticeConfig = {
    mode: 'lesson',
    lessons: [1],
    maxLearnedLesson: 2, // chỉ học đến bài 2, q2 có aux = 5 phải bị chặn
    selectedTypes: ['mc', 'reorder'],
    questionCount: 10,
  };

  const { eligibleQuestions } = filterExercises(mockQuestions, config, new Set());
  assert.equal(eligibleQuestions.length, 1);
  assert.equal(eligibleQuestions[0]!.id, 'q1');
});

test('filterExercises ở mode due chỉ lấy đúng dueTargetIds', () => {
  const config: PracticeConfig = {
    mode: 'due',
    lessons: [],
    maxLearnedLesson: 10,
    selectedTypes: ['mc', 'reorder'],
    questionCount: 10,
  };

  const dueTargets = new Set(['vocab-01-01']);
  const { eligibleQuestions } = filterExercises(mockQuestions, config, new Set(), dueTargets);
  assert.equal(eligibleQuestions.length, 1);
  assert.equal(eligibleQuestions[0]!.id, 'q1');
});

test('filterExercises loại bỏ câu thiếu audio và tăng excludedAudioCount', () => {
  const config: PracticeConfig = {
    mode: 'lesson',
    lessons: [1],
    maxLearnedLesson: 10,
    selectedTypes: ['listening'],
    questionCount: 10,
  };

  // Không có key "audio-01" trong availableAudioKeys
  const res1 = filterExercises(mockQuestions, config, new Set());
  assert.equal(res1.eligibleQuestions.length, 0);
  assert.equal(res1.excludedAudioCount, 1);

  // Có key "audio-01"
  const res2 = filterExercises(mockQuestions, config, new Set(['audio-01']));
  assert.equal(res2.eligibleQuestions.length, 1);
  assert.equal(res2.excludedAudioCount, 0);
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Chạy: `pnpm test` trong `web/`
Kỳ vọng: FAIL do `filter.ts` chưa tồn tại.

- [ ] **Step 3: Triển khai `web/src/lib/filter.ts`**

Tạo `web/src/lib/filter.ts`:
```typescript
import type { QuestionItem, PracticeConfig } from '../types/index.ts';

export interface FilterResult {
  eligibleQuestions: QuestionItem[];
  excludedAudioCount: number;
}

export const filterExercises = (
  allQuestions: QuestionItem[],
  config: PracticeConfig,
  availableAudioKeys: Set<string>,
  dueTargetIds?: Set<string>
): FilterResult => {
  // 1. Khoanh vùng mục tiêu: theo bài đã chọn hoặc theo lịch ôn đến hạn
  let pool =
    config.mode === 'due' && dueTargetIds
      ? allQuestions.filter((q) => dueTargetIds.has(q.targetId))
      : allQuestions.filter((q) => config.lessons.includes(q.lesson));

  // 2. Rà soát kiến thức phụ trợ: Mọi bài phụ trợ trong câu phải <= maxLearnedLesson
  pool = pool.filter((q) => q.auxiliaryLessons.every((l) => l <= config.maxLearnedLesson));

  // 3. Lọc theo dạng bài đã chọn
  pool = pool.filter((q) => config.selectedTypes.includes(q.type));

  // 4. Tiền kiểm tra Audio (Pre-flight Check)
  let excludedAudioCount = 0;
  const eligibleQuestions: QuestionItem[] = [];

  for (const q of pool) {
    if (q.type === 'listening' || q.audioKey) {
      const audioKey = q.audioKey ?? 'tts';
      if (availableAudioKeys.has(audioKey)) {
        eligibleQuestions.push(q);
      } else {
        excludedAudioCount++;
      }
    } else {
      eligibleQuestions.push(q);
    }
  }

  return { eligibleQuestions, excludedAudioCount };
};
```

- [ ] **Step 4: Chạy test để xác nhận PASS**

Chạy: `pnpm test` trong `web/`
Kỳ vọng: PASS toàn bộ `filter.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/filter.ts web/src/lib/filter.test.ts
git commit -m "feat(practice): implement smart exercise filter according to spec"
```

---

### Task 6: Tích hợp Toàn diện & Kiểm tra Tiêu chí Nghiệm thu SPEC-01

**Files:**
- Test: Tất cả các file test trong `web/src/lib/*.test.ts`
- Verify: `pnpm check` và `pnpm test`

- [ ] **Step 1: Chạy test suite toàn bộ dự án**

Chạy: `pnpm test` trong thư mục `web/`
Kỳ vọng: Toàn bộ các test sau đều PASS:
- `fsrs.test.ts`
- `japanese.test.ts`
- `distractors.test.ts`
- `tts.test.ts`
- `questions.test.ts`
- `filter.test.ts`

- [ ] **Step 2: Chạy kiểm tra TypeScript và ESLint**

Chạy: `pnpm check` trong thư mục `web/`
Kỳ vọng: Exit code 0, không có lỗi type hoặc linting warning nghiêm trọng.

- [ ] **Step 3: Xác minh tiêu chí nghiệm thu SPEC-01**

Kiểm tra đối chiếu checklist mục 7 của `docs/specs/SPEC-01-du-lieu-va-sinh-cau-hoi.md`:
- [x] 230 file N5 trong `web/src/data/n5/` đầy đủ `vi` chuẩn Minna
- [x] `types/index.ts` đã có `'pronoun'`
- [x] `pickDistractors` không trả về đáp án đúng, ưu tiên cùng đuôi okurigana
- [x] Cloze trợ từ không bắt nhầm kana
- [x] `reorder` chỉ nhận câu 4-6 khối
- [x] `filterExercises` chặn phụ trợ, lọc theo `dueTargetIds`
- [x] Không chạm DOM/Dexie trong pure functions logic
- [x] Mỗi module logic kèm 1 file `*.test.ts` chạy bằng `node:test`
