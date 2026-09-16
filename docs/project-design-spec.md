# BẢN ĐẶC TẢ THIẾT KẾ HỆ THỐNG (SYSTEM DESIGN SPECIFICATION)
## DỰ ÁN: WEBSITE TỰ HỌC TIẾNG NHẬT CÁ NHÂN (MINNA NO NIHONGO N5 & N4)

> **Mã tài liệu:** SPEC-JPN-01 (Rev. 2)  
> **Ngày phê duyệt:** 16/09/2026  
> **Trạng thái:** Đã phê duyệt (Approved)  
> **Kiến trúc cốt lõi:** Next.js 15 (App Router) + Supabase (Auth/PostgreSQL) + IndexedDB (Dexie.js) + FSRS (`ts-fsrs`) + Tailwind CSS v4 + shadcn/ui

---

## 1. TỔNG QUAN VÀ MỤC TIÊU HỆ THỐNG

### 1.1. Mục đích sản phẩm
Xây dựng một nền tảng tự học và ôn luyện tiếng Nhật cá nhân toàn diện, kế thừa và nâng cấp từ kho dữ liệu chuẩn hóa của dự án mã nguồn mở `noken` (Minna no Nihongo), tập trung vào:
- Học bài bản theo từng bài học (từ vựng, ngữ pháp kèm giải thích tiếng Việt rõ ràng, câu ví dụ chuẩn nguồn sách).
- Hệ thống luyện tập linh hoạt với **5 dạng bài tập cốt lõi**, chấm điểm khách quan và tự động lọc câu hỏi theo điều kiện máy người dùng.
- Lịch ôn tập **lặp lại ngắt quãng (Spaced Repetition)** theo thuật toán **FSRS**, lên lịch ở cấp độ từng mục tiêu học (từ vựng / ngữ pháp / kanji / trợ từ) và hoạt động đầy đủ khi offline.
- Trình phát âm thanh **Shadowing & Luyện nghe A-B** chuyên sâu, tích hợp cơ chế nạp audio trọn gói qua file ZIP giải nén trực tiếp vào **IndexedDB** (xác thực hash SHA-256, không vi phạm bản quyền và không tốn băng thông CDN).
- Đồng bộ đa thiết bị (PC ↔ Mobile) qua **Google OAuth + Supabase**, hỗ trợ cơ chế **Optimistic Offline-First** minh bạch trạng thái dữ liệu.
- Trải nghiệm giao diện (UI/UX) cao cấp, hiển thị chữ Hán và Furigana chuẩn xác, tối ưu thao tác chạm trên điện thoại và hệ thống phím tắt toàn diện trên máy tính.

---

## 2. KIẾN TRÚC KỸ THUẬT (SYSTEM ARCHITECTURE)

### 2.1. Sơ đồ phân tầng hệ thống (Layered Architecture)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              TẦNG GIAO DIỆN & CLIENT APP                               │
│                                                                                        │
│  ┌───────────────────────┐   ┌───────────────────────────┐   ┌──────────────────────┐  │
│  │   UI & Pages (NextJS) │   │   Zustand (UI state only) │   │ Shadowing Player     │  │
│  │   - Lessons & Vocab   │──▶│   - Bộ lọc & con trỏ câu  │──▶│ - A-B Loop, Speed    │  │
│  │   - 5 Exercise Types  │   │   - Không persist dữ liệu │   │ - Transcript toggle  │  │
│  │   - Ôn tập hôm nay    │   │   - Nguồn thật: Dexie     │   │ - HTML5 Audio + Blob │  │
│  └───────────────────────┘   └─────────────┬─────────────┘   └──────────┬───────────┘  │
│                                            │                            │              │
│                ┌───────────────────────────┴────────────────────────────┤              │
│                ▼                                                        ▼              │
│  ┌───────────────────────────────────────────┐    ┌─────────────────────────────────┐  │
│  │   IndexedDB via Dexie.js — NGUỒN THẬT     │    │   Audio ZIP Unpacker (Worker)   │  │
│  │   - `audio_files`: [id, blob, sha256]     │◀───│   - JSZip giải nén off-thread   │  │
│  │   - `review_items`: FSRS due, stability   │    │   - Hash từng file theo manifest│  │
│  │   - `pending_sync`: hàng đợi đẩy lên cloud│    └─────────────────────────────────┘  │
│  │   - `cached_lessons`: fallback offline    │                                         │
│  └─────────────────────┬─────────────────────┘                                         │
└────────────────────────┼───────────────────────────────────────────────────────────────┘
                         │ (Tự động đồng bộ ngầm khi có mạng)
                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              TẦNG ĐÁM MÂY & BACKEND (SUPABASE)                         │
│                                                                                        │
│  ┌───────────────────────┐   ┌──────────────────────────────────────────────────────┐  │
│  │   Supabase Auth       │   │   Supabase PostgreSQL                                │  │
│  │   - Google OAuth      │──▶│   - `profiles`: user settings, streak, daily goal    │  │
│  │   - JWT Session       │   │   - `practice_sessions`: lịch sử bài tập, điểm số    │  │
│  │                       │   │   - `review_items`: lịch ôn FSRS + tỷ lệ sai         │  │
│  │                       │   │     theo từ/ngữ pháp/kanji/trợ từ                    │  │
│  └───────────────────────┘   └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2. Tech Stack lựa chọn
- **Framework:** Next.js 15 (App Router, React 19, TypeScript strict).
- **Styling & UI Library:** Tailwind CSS v4 + `shadcn/ui` (Radix Primitives) + `framer-motion` (hoạt ảnh kéo thả, thẻ lật) + `lucide-react`.
- **Quản lý trạng thái:** `Zustand` **chỉ cho state UI tạm thời** (bộ lọc đang chọn, con trỏ câu hỏi hiện tại, trạng thái player). Không dùng persist middleware.
- **Lưu trữ cục bộ & Xử lý File:** `Dexie.js` (IndexedDB ORM wrapper) — **nguồn sự thật duy nhất cho mọi dữ liệu cần lưu**, đọc qua `dexie-react-hooks` (`useLiveQuery`) để component tự cập nhật, bỏ hẳn tầng đồng bộ thủ công giữa store và DB. Kèm `jszip` (giải nén trong Web Worker) + Web Crypto API.
- **Lịch ôn tập ngắt quãng:** `ts-fsrs` (FSRS v5) — thuật toán chạy hoàn toàn client-side.
- **Xử lý tiếng Nhật:** `wanakana` (chuyển Romaji ↔ Hiragana/Katakana, chuẩn hóa full-width/half-width) thay vì tự viết bộ chuyển đổi IME.
- **Backend & Cơ sở dữ liệu:** Supabase (PostgreSQL, Auth Google OAuth, Row Level Security - RLS).
- **Typography:** `@fontsource-variable/inter` (Latin) và `@fontsource-variable/noto-sans-jp` (Japanese).

---

## 3. MÔ HÌNH DỮ LIỆU & QUẢN LÝ BÀI HỌC

### 3.1. Cấu trúc Content Collections (Nội dung tĩnh build-time)
Kế thừa và chuẩn hóa từ bộ 25 bài N5 của Noken, mở rộng thêm trường tiếng Việt (`vi`) và nguồn sách (`sourceRef`):

```typescript
// Định nghĩa bài học
export interface Lesson {
  level: 'n5' | 'n4';
  number: number;
  title: { vi: string; en: string };
  jpTitle?: string; // Kèm furigana notation
  description: { vi: string; en: string };
  sourceRef: { book: 'Minna no Nihongo I'; pages: string };
  grammar: GrammarPoint[];
  references?: string[];
}

// Điểm ngữ pháp
export interface GrammarPoint {
  id: string; // vd: "05-01"
  title: { vi: string; en: string };
  pattern: { vi: string; en: string }; // vd: "N (địa điểm) へ 行きます/来ます/帰ります"
  explanation: { vi: string; en: string };
  sourceRef?: string;
  examples: ExampleSentence[];
}

// Câu ví dụ
export interface ExampleSentence {
  jp: string; // vd: "私[わたし]は 明日[あした] 京都[きょうと]へ 行[い]きます。"
  translation: { vi: string; en: string };
  note?: { vi: string; en: string };
  audioKey?: string; // Mã liên kết tới audio file trong IndexedDB
}

// Từ vựng
export interface VocabWord {
  id: string; // vd: "05-01-01"
  lesson: number;
  word: string; // Kèm notation: "行[い]きます"
  kana: string; // "いきます"
  romaji?: string;
  meaning: { vi: string; en: string };
  type: 'noun' | 'verb-1' | 'verb-2' | 'verb-3' | 'i-adj' | 'na-adj' | 'adverb' | 'particle' | 'expression';
  kanjiIds?: string[];
  audioKey?: string;
  notes?: { vi: string; en: string };
}
```

### 3.2. Lược đồ Cơ sở dữ liệu Supabase (PostgreSQL Schema)

```sql
-- 1. Bảng hồ sơ cá nhân và thiết lập học tập
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  streak_count INT DEFAULT 0,
  last_study_date DATE,
  daily_goal_minutes INT DEFAULT 20,
  settings JSONB DEFAULT '{
    "furigana": true,
    "furiganaSize": "normal",
    "hideTranslations": false,
    "theme": "system",
    "soundVolume": 1.0,
    "dailyNewLimit": 20
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng lịch sử các lượt luyện tập (Practice Sessions)
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  selected_lessons INT[] NOT NULL,
  exercise_types TEXT[] NOT NULL,
  -- CHECK bắt buộc: cột generated `accuracy_rate` sẽ lỗi chia-cho-0 nếu total_questions = 0
  total_questions INT NOT NULL CHECK (total_questions > 0),
  correct_count INT NOT NULL CHECK (correct_count >= 0),
  accuracy_rate NUMERIC(5,2) GENERATED ALWAYS AS (ROUND((correct_count::numeric / total_questions) * 100, 2)) STORED,
  duration_seconds INT NOT NULL CHECK (duration_seconds >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT correct_not_exceed_total CHECK (correct_count <= total_questions)
);

-- Postgres KHÔNG tự tạo index cho cột khóa ngoại. Mọi truy vấn đều lọc theo user_id
-- (do RLS + màn hình lịch sử), nên index này là bắt buộc, không phải tối ưu sớm.
CREATE INDEX idx_practice_sessions_user_time ON practice_sessions (user_id, created_at DESC);

-- 3. Bảng mục tiêu ôn tập: thống kê điểm yếu + trạng thái lịch ôn FSRS
-- Đổi tên từ `weak_targets` vì ngữ nghĩa đã khác: bảng này chứa MỌI mục tiêu đã luyện,
-- không chỉ mục tiêu yếu — FSRS phải lên lịch cho cả những mục đã thuộc (interval dài).
CREATE TABLE review_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL, -- vd: "vocab-05-12", "grammar-03-02", "particle-ni"
  target_type TEXT NOT NULL CHECK (target_type IN ('vocab','grammar','kanji','particle','listening')),
  lesson INT NOT NULL,

  -- Thống kê điểm yếu (dùng cho màn hình "Điểm yếu của tôi")
  incorrect_count INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  last_failed_at TIMESTAMPTZ,

  -- Trạng thái lịch ôn FSRS.
  -- Lưu nguyên object Card của ts-fsrs dạng JSONB (stability, difficulty, reps,
  -- lapses, state, last_review...) thay vì tách 9 cột: shape của Card do thư viện
  -- định nghĩa, tách cột đồng nghĩa với việc phải migration mỗi lần thư viện đổi.
  -- Chỉ `due_at` được tách ra cột riêng vì đây là cột duy nhất cần index/truy vấn.
  due_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fsrs_card JSONB NOT NULL,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, target_id)
);

-- Hai truy vấn nóng nhất của ứng dụng
CREATE INDEX idx_review_items_due  ON review_items (user_id, due_at);                          -- "Hôm nay ôn gì?"
CREATE INDEX idx_review_items_weak ON review_items (user_id, target_type, incorrect_count DESC); -- Bảng điểm yếu

-- Kích hoạt Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_items ENABLE ROW LEVEL SECURITY;

-- Lưu ý: với policy `FOR ALL`, nếu không khai báo WITH CHECK thì Postgres dùng luôn
-- biểu thức USING làm WITH CHECK cho INSERT/UPDATE — nên 3 policy dưới đã đủ chặt.
CREATE POLICY "Users can only read/write their own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only read/write their own practice sessions" ON practice_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only read/write their own review items" ON review_items
  FOR ALL USING (auth.uid() = user_id);
```

---

## 4. HỆ THỐNG LUYỆN TẬP 5 DẠNG BÀI & THUẬT TOÁN LỌC THÔNG MINH

### 4.1. Đặc tả 5 dạng bài tập

Mỗi bài tập triển khai theo một component React Island riêng biệt nhưng dùng chung wrapper quản lý trạng thái lượt làm bài:

1. **Dạng 1: Trắc nghiệm (Multiple Choice)**
   - *Đầu vào:* Câu hỏi (chữ Hán, từ vựng, hoặc câu khuyết).
   - *Cơ chế:* 4 phương án. Đáp án nhiễu (distractors) được tạo tự động bằng thuật toán kế thừa từ Noken: cùng loại từ, cùng đuôi okurigana, chiều dài tương đương, nhằm loại bỏ khả năng đoán mò theo hình thái.
   - *Phím tắt:* Bấm `1`, `2`, `3`, `4` để chọn.
2. **Dạng 2: Ghép cặp (Matching Pairs)**
   - *Đầu vào:* 4 - 5 cặp tương ứng (Từ vựng ↔ Tiếng Việt, Chữ Hán ↔ Âm On/Kun, Động từ nguyên mẫu ↔ Thể て/ます).
   - *Tương tác:* Chạm liên tiếp 2 ô cần ghép. Nếu đúng, hai ô đổi màu xanh lá và biến mất nhẹ nhàng. Nếu sai, rung nhẹ màu đỏ.
3. **Dạng 3: Điền từ / Trợ từ (Cloze / Fill-in-the-Blank)**
   - *Đầu vào:* Câu chứa khoảng trống `＿＿＿`.
   - *Chấm điểm linh hoạt:* Chấp nhận `acceptedVariants: string[]` (hỗ trợ cả dạng viết kanji lẫn hiragana, chấp nhận bỏ dấu cách). Việc chuẩn hóa full-width / half-width và Romaji → Kana dùng `wanakana`, không tự viết bảng ánh xạ.
4. **Dạng 4: Sắp xếp câu (Sentence Reordering)**
   - *Đầu vào:* Một câu hoàn chỉnh bị chia thành 4-6 khối cụm từ (phrase tokens).
   - *Tương tác:* Chạm khối từ để đưa vào thanh câu trả lời (hoặc kéo thả mượt mà với `framer-motion`). Có nút "Hoàn tác" (Undo) hoặc bấm vào khối từ đã chọn để trả về vị trí cũ.
5. **Dạng 5: Nghe và Nhập từ/cụm ngắn (Listening Transcription)**
   - *Đầu vào:* Nút phát audio (từ Blob IndexedDB) kèm thanh tốc độ (0.8x, 1.0x).
   - *Tương tác:* Người học nghe và gõ vào ô nhập liệu. Gõ Romaji tự động chuyển thành Hiragana ngay khi gõ, dùng **`wanakana`** (`bind()` trên input, hoặc `toHiragana()` khi so đáp án) — không tự viết bộ chuyển đổi IME. `wanakana` cũng lo luôn việc chuẩn hóa full-width/half-width dùng chung cho Dạng 3.

### 4.2. Thuật toán chọn bài thông minh (Smart Exercise Selector)

```typescript
export interface QuestionItem {
  id: string;
  type: 'mc' | 'matching' | 'cloze' | 'reorder' | 'listening';
  lesson: number;
  auxiliaryLessons: number[];  // Các bài chứa kiến thức phụ trợ xuất hiện trong câu
  audioKey?: string;
  /** Mục tiêu học mà câu hỏi này kiểm tra — khóa nối sang `review_items.target_id`.
   *  Nhiều câu hỏi khác dạng có thể cùng trỏ về một targetId và cùng cập nhật một lịch ôn. */
  targetId: string;
}

export interface PracticeConfig {
  mode: 'lesson' | 'due';   // 'lesson' = tự chọn bài; 'due' = phiên ôn theo lịch FSRS
  lessons: number[];        // vd: [1, 2, 5] — bỏ qua khi mode = 'due'
  maxLearnedLesson: number; // Bài cao nhất người dùng đã tích lũy
  selectedTypes: ('mc' | 'matching' | 'cloze' | 'reorder' | 'listening')[];
  questionCount: number;
}

export function filterExercises(
  allQuestions: QuestionItem[],
  config: PracticeConfig,
  availableAudioKeys: Set<string>,
  dueTargetIds?: Set<string> // Bơm từ review_items khi mode = 'due'
): { eligibleQuestions: QuestionItem[]; excludedAudioCount: number } {
  // 1. Khoanh vùng mục tiêu: theo bài đã chọn, hoặc theo lịch ôn đến hạn
  let pool = config.mode === 'due' && dueTargetIds
    ? allQuestions.filter(q => dueTargetIds.has(q.targetId))
    : allQuestions.filter(q => config.lessons.includes(q.lesson));

  // 2. Rà soát kiến thức phụ trợ: Mọi từ phụ trợ trong câu phải <= maxLearnedLesson
  pool = pool.filter(q => q.auxiliaryLessons.every(l => l <= config.maxLearnedLesson));

  // 3. Lọc dạng bài
  pool = pool.filter(q => config.selectedTypes.includes(q.type));

  // 4. Tiền kiểm tra Audio (Pre-flight Check)
  let excludedAudioCount = 0;
  const eligibleQuestions: QuestionItem[] = [];

  for (const q of pool) {
    if (q.type === 'listening' || q.audioKey) {
      if (q.audioKey && availableAudioKeys.has(q.audioKey)) {
        eligibleQuestions.push(q);
      } else {
        excludedAudioCount++;
      }
    } else {
      eligibleQuestions.push(q);
    }
  }

  return { eligibleQuestions, excludedAudioCount };
}
```

> **Lưu ý về tiền kiểm tra Audio ở chế độ `due`:** một mục tiêu đến hạn ôn nhưng chỉ có
> câu hỏi dạng `listening` mà người dùng chưa nạp audio sẽ bị loại khỏi phiên. Mục tiêu đó
> **không bị coi là đã ôn** — `due_at` giữ nguyên, nó sẽ quay lại ở phiên sau. Không bao giờ
> ghi nhận review cho câu hỏi chưa từng hiển thị.

### 4.3. Hệ thống lặp lại ngắt quãng (Spaced Repetition — FSRS)

#### 4.3.1. Lựa chọn thuật toán
Dùng thư viện **`ts-fsrs`** (FSRS v5), **không tự viết SM-2**. SM-2 nhìn thì chỉ ~30 dòng,
nhưng phần sinh bug thật sự nằm ở learning steps, xử lý lapse, làm tròn interval và fuzz —
đúng những thứ thư viện đã giải quyết. FSRS cho lịch ôn chính xác hơn SM-2 với **~0 dòng
code thuật toán** phía ứng dụng; phần việc còn lại chỉ là ánh xạ kết quả và lưu trữ.

#### 4.3.2. Đơn vị lên lịch
Lịch ôn gắn với **mục tiêu học** (một bản ghi `review_items`), **không gắn với câu hỏi**.
Một từ vựng có thể xuất hiện dưới cả 5 dạng bài; kết quả ở bất kỳ dạng nào cũng cập nhật
cùng một lịch ôn duy nhất. Nhờ vậy người học không phải ôn lại cùng một từ 5 lần chỉ vì
nó có 5 biến thể câu hỏi.

#### 4.3.3. Ánh xạ kết quả tự chấm → `Rating` của FSRS
FSRS cần 4 mức đánh giá, trong khi bài tập ở đây chỉ cho ra **đúng/sai** và không có nút
tự chấm. Ánh xạ bổ sung bằng thời gian phản hồi, so với **median thời gian trả lời của
chính mục tiêu đó** (lưu trong `fsrs_card`, cập nhật dần):

| Kết quả | Điều kiện bổ sung | Rating |
|---|---|---|
| Sai | — | `Rating.Again` |
| Đúng | thời gian > 2× median | `Rating.Hard` |
| Đúng | trong khoảng bình thường | `Rating.Good` |
| Đúng | < ½ median, không dùng gợi ý | `Rating.Easy` |

```typescript
import { fsrs, generatorParameters, Rating, createEmptyCard, type Card } from 'ts-fsrs';

const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

/** Suy ra Rating từ kết quả chấm tự động + tốc độ trả lời. */
export function rateAnswer(
  isCorrect: boolean,
  elapsedMs: number,
  medianMs: number | null,
  usedHint: boolean
): Rating {
  if (!isCorrect) return Rating.Again;
  if (medianMs === null) return Rating.Good;      // Lần đầu: chưa có mốc so sánh
  if (elapsedMs > medianMs * 2) return Rating.Hard;
  if (elapsedMs < medianMs / 2 && !usedHint) return Rating.Easy;
  return Rating.Good;
}

/** Cập nhật lịch ôn cho một mục tiêu. Trả về card mới + hạn ôn kế tiếp. */
export function applyReview(card: Card | null, rating: Rating, now = new Date()) {
  const current = card ?? createEmptyCard(now);
  const next = scheduler.next(current, now, rating).card;
  return { card: next, dueAt: next.due };
}
```

#### 4.3.4. Nơi thực thi & hành vi offline
`ts-fsrs` là thư viện TypeScript thuần, chạy **hoàn toàn ở client**. Luồng ghi:

1. Người học trả lời → `rateAnswer()` → `applyReview()`.
2. Ghi thẳng bản ghi `review_items` vào **Dexie** (nguồn sự thật), cập nhật `due_at`,
   `fsrs_card`, `incorrect_count` / `correct_count`, `updated_at`.
3. Đẩy một mục vào `pending_sync` để đồng bộ ngầm lên Supabase.

Hệ quả: lịch ôn vẫn chính xác khi mất mạng hoàn toàn, vì không có bước nào cần server.

#### 4.3.5. Chế độ "Ôn tập hôm nay"
- Truy vấn Dexie: các `review_items` có `due_at <= now()`, sắp xếp `due_at` tăng dần
  (mục quá hạn lâu nhất được ôn trước).
- Bổ sung mục tiêu mới (chưa có bản ghi `review_items`) từ các bài đã học, **giới hạn bởi
  `settings.dailyNewLimit`** (mặc định 20). Không có giới hạn này, người học mở bài mới
  sẽ bị dồn hàng trăm mục đến hạn vào vài ngày sau và bỏ cuộc.
- Không đặt giới hạn số lượt ôn lại trong ngày: lượng mục đến hạn tự nó đã bị chặn bởi
  `dailyNewLimit` ở đầu vào.

#### 4.3.6. Xung đột khi ôn trên nhiều thiết bị
Hai thiết bị cùng offline và cùng ôn một mục tiêu sẽ tạo hai phiên bản `fsrs_card` khác nhau.
Giải quyết bằng **last-write-wins theo `updated_at`**: bản ghi có `updated_at` mới hơn thắng.

```sql
INSERT INTO review_items (...) VALUES (...)
ON CONFLICT (user_id, target_id) DO UPDATE SET
  due_at          = EXCLUDED.due_at,
  fsrs_card       = EXCLUDED.fsrs_card,
  incorrect_count = EXCLUDED.incorrect_count,
  correct_count   = EXCLUDED.correct_count,
  last_failed_at  = EXCLUDED.last_failed_at,
  updated_at      = EXCLUDED.updated_at
WHERE review_items.updated_at < EXCLUDED.updated_at;
```

Hậu quả xấu nhất của việc mất một lượt review là lệch lịch ôn đúng một chu kỳ — chấp nhận
được với ứng dụng cá nhân, và rẻ hơn nhiều so với việc dựng cơ chế merge CRDT.
<!-- ponytail: last-write-wins theo updated_at; chỉ đổi sang merge theo lịch sử review nếu
     thực tế dùng nhiều thiết bị song song offline thường xuyên -->

---

## 5. KIẾN TRÚC AUDIO & CƠ CHẾ NẠP ZIP QUA INDEXEDDB

### 5.1. Định dạng gói ZIP chuẩn & Xác thực SHA-256
- **Gói audio mục tiêu:** Bộ audio chính thức đĩa CD Minna no Nihongo I (25 bài).
- **Cấu trúc file chuẩn trong ZIP:**
  ```
  minna-audio/
  ├── L01/
  │   ├── 01_vocab.mp3
  │   ├── 02_sentence_patterns.mp3
  │   ├── 03_examples.mp3
  │   └── 04_conversation.mp3
  ├── L02/ ...
  └── manifest.json (chứa danh sách file + SHA-256 đối chiếu)
  ```
- **Xác thực Web Crypto — băm TỪNG FILE, không băm cả gói ZIP:** `manifest.json` liệt kê
  SHA-256 của từng file audio, nên phép đối chiếu phải diễn ra sau khi giải nén từng entry.
  Băm nguyên file ZIP là vô nghĩa ở đây: hai gói ZIP có nội dung giống hệt nhau vẫn cho hash
  khác nhau nếu khác thứ tự entry, mức nén hoặc timestamp — và ngược lại, một hash tổng
  không cho biết file nào trong gói bị hỏng.

  ```typescript
  async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Chạy TRONG Web Worker — xem 5.1.1
  async function verifyAndExtract(zip: JSZip, manifest: Record<string, string>) {
    const ok: { path: string; blob: Blob }[] = [];
    const corrupted: string[] = [];

    for (const [path, expectedHash] of Object.entries(manifest)) {
      const entry = zip.file(path);
      if (!entry) { corrupted.push(path); continue; }

      const buffer = await entry.async('arraybuffer');
      if (await sha256Hex(buffer) !== expectedHash) { corrupted.push(path); continue; }

      ok.push({ path, blob: new Blob([buffer], { type: 'audio/mpeg' }) });
    }
    return { ok, corrupted }; // File hỏng bị bỏ qua, phần còn lại vẫn nạp được
  }
  ```

#### 5.1.1. Giải nén trong Web Worker (bắt buộc)
Bộ audio CD Minna no Nihongo I có thể lên tới vài trăm MB. Giải nén JSZip cộng với băm
SHA-256 toàn bộ entry trên main thread sẽ **treo giao diện hàng chục giây** và có thể bị
trình duyệt cảnh báo trang không phản hồi. Vì vậy:

- Toàn bộ `JSZip.loadAsync` + `verifyAndExtract` chạy trong một **Web Worker** riêng.
- Worker `postMessage` tiến độ về UI theo từng file để hiển thị thanh progress thật.
- Blob được chuyển về main thread (structured clone, không copy tốn kém với Blob) rồi ghi
  vào Dexie theo lô ~20 file bằng `bulkPut` để tránh giữ transaction IndexedDB quá lâu.

#### 5.1.2. Lược đồ IndexedDB (Dexie.js) — nguồn sự thật phía client

```typescript
export class AppDatabase extends Dexie {
  audioFiles!: Table<{ id: string; lesson: number; type: string; blob: Blob; size: number; sha256: string }, string>;
  reviewItems!: Table<ReviewItem, string>;   // Nguồn sự thật cho lịch ôn FSRS
  practiceSessions!: Table<PracticeSession, string>;
  pendingSync!: Table<{ id: string; payload: any; createdAt: number }, string>;

  constructor() {
    super('JapaneseLearningDB');
    this.version(1).stores({
      audioFiles: 'id, lesson, type',
      reviewItems: 'targetId, dueAt, [targetType+incorrectCount]', // dueAt: truy vấn "ôn hôm nay"
      practiceSessions: 'id, createdAt',
      pendingSync: 'id, createdAt'
    });
  }
}
```

Component đọc dữ liệu trực tiếp qua `useLiveQuery` của `dexie-react-hooks` — Dexie tự phát
tín hiệu khi dữ liệu đổi, nên không cần mirror sang Zustand rồi đồng bộ tay hai chiều:

```typescript
const dueToday = useLiveQuery(
  () => db.reviewItems.where('dueAt').belowOrEqual(new Date()).sortBy('dueAt'),
  []
);
```

### 5.2. Trình phát Shadowing (Shadowing Player Interface)
- **Tốc độ:** `0.75x`, `0.85x`, `1.0x`, `1.2x`.
- **A-B Repeat:**
  - Nút `[ Đặt A ]`: Đánh dấu thời gian bắt đầu câu cần lặp.
  - Nút `[ Đặt B ]`: Đánh dấu thời gian kết thúc.
  - Khi Audio chạm mốc B, tự động quay lại mốc A và phát tiếp.
- **Toggle Transcript:** Nút bật/tắt toàn bộ phụ đề để kiểm tra khả năng nghe hiểu thực tế.

---

## 6. ĐỒNG BỘ ĐA THIẾT BỊ & CƠ CHẾ OFFLINE-FIRST

### 6.1. Quy trình Optimistic Sync
1. Khi hoàn thành bài thi: ghi **thẳng vào Dexie** (`practiceSessions` + cập nhật `reviewItems`
   theo FSRS) trong **một transaction duy nhất**, đồng thời đẩy payload vào bảng `pendingSync`.
   Không ghi qua Zustand — UI tự cập nhật nhờ `useLiveQuery`, nên không tồn tại trạng thái
   "store đã đổi nhưng DB chưa ghi" để phải đồng bộ tay.
2. Icon trên thanh trạng thái hiển thị: 🟡 **"Đang chờ đồng bộ (1 bài)"**.
3. Hàm đồng bộ ngầm kích hoạt:
   - Nếu có mạng: Gửi payload lên Supabase endpoint `/api/sync/practice`. Payload gồm
     bản ghi `practice_sessions` **và** danh sách `review_items` đã đổi (kèm `updated_at`).
   - Nếu nhận HTTP 200: Xóa bản ghi trong `pendingSync`, đổi icon thành 🟢 **"Đã đồng bộ lên Cloud"**.
   - Nếu mất mạng hoặc lỗi kết nối: Giữ nguyên trong `pendingSync`, đổi icon thành ⚪ **"Chế độ Offline - Đã lưu an toàn trên máy"**.
4. Lắng nghe sự kiện mạng `window.addEventListener('online', triggerSync)` để tự động đồng bộ ngay khi thiết bị có kết nối trở lại.
5. `review_items` ghi lên server bằng `INSERT ... ON CONFLICT DO UPDATE ... WHERE updated_at <
   EXCLUDED.updated_at` (xem 4.3.6), nên việc gửi lại cùng một payload nhiều lần là **idempotent** —
   an toàn khi retry sau lỗi mạng giữa chừng.

### 6.2. Kéo dữ liệu về khi đăng nhập trên thiết bị mới
Sau khi OAuth thành công, tải toàn bộ `review_items` của người dùng về Dexie (số bản ghi tối đa
cỡ vài nghìn — một lần `select *` là đủ, không cần phân trang). `audio_files` **không đồng bộ**:
Blob audio chỉ tồn tại cục bộ, mỗi thiết bị tự nạp ZIP một lần.

---

## 7. THIẾT KẾ GIAO DIỆN (UI/UX) & RESPONSIVE DESIGN

### 7.1. Bảng màu & Design Tokens (OKLCH)
- **Primary:** Đỏ đất Torii (`oklch(0.55 0.2 25)` / dark: `oklch(0.65 0.19 25)`).
- **Background:** Giấy Washi kem sáng (`oklch(0.99 0.002 90)` / dark: Than chì `oklch(0.17 0.01 285)`).
- **Nhóm động từ trực quan:**
  - Nhóm 1 (Ngũ đoạn): Cam đất (`--verb-1`).
  - Nhóm 2 (Nhất đoạn): Xanh dương Indigo (`--verb-2`).
  - Nhóm 3 (Bất quy tắc): Xanh lá tre Moso (`--verb-3`).

### 7.2. Hiển thị Furigana bằng thẻ `<ruby>` gốc
Notation `漢字[かんじ]` trong dữ liệu được `parseFurigana()` chuyển thành **thẻ `<ruby>` / `<rt>`
gốc của HTML**, không dựng overlay bằng CSS `position: absolute` hay đo chiều rộng bằng JS:

```html
<ruby>私<rt>わたし</rt></ruby>は <ruby>明日<rt>あした</rt></ruby> <ruby>京都<rt>きょうと</rt></ruby>へ…
```

Lý do: trình duyệt đã xử lý sẵn việc căn giữa furigana, ngắt dòng giữa câu và giãn dòng —
đúng ba thứ khó nhất của một overlay tự chế. Ngoài ra `<ruby>` được screen reader đọc đúng,
và người dùng bôi đen copy sẽ ra text sạch.

- Bật/tắt furigana: CSS thuần `rt { visibility: hidden }` — không cần render lại cây DOM.
- `settings.furiganaSize`: điều chỉnh qua biến CSS `--furigana-scale` áp lên `rt`.

### 7.3. Tối ưu Mobile (Mobile First)
- Thanh điều hướng đáy (Bottom Nav) cố định, dễ bấm bằng ngón tay cái.
- Kích thước các nút bấm luyện tập tối thiểu `48px x 48px`.
- Chế độ 1-chạm (1-Tap Selection) thay thế kéo thả khi sắp xếp từ trên màn hình nhỏ.

### 7.4. Phím tắt Desktop
- `1`, `2`, `3`, `4`: Chọn đáp án trắc nghiệm.
- `Space`: Lật thẻ / Tiếp tục câu tiếp theo / Play-Pause Audio.
- `[` / `]`: Đánh dấu mốc lặp A và B trong trình phát.
- `R`: Bật/Tắt Lặp đoạn A-B.
- `T`: Ẩn/Hiện Transcript phụ đề.
- `Ctrl + K`: Mở nhanh hộp tìm kiếm toàn năng.

---

## 8. KẾ HOẠCH BẢO ĐẢM CHẤT LƯỢNG (TESTING & VERIFICATION)

1. **Unit Tests (Vitest):**
   - `parseFurigana`: notation `漢字[かんじ]` → cây `<ruby>/<rt>` đúng, kể cả câu trộn kanji
     và kana, và trường hợp không có furigana.
   - `pickDistractors`: đáp án nhiễu cùng loại từ, cùng đuôi okurigana, không trùng đáp án đúng.
   - `filterExercises`: lọc theo bài, chặn kiến thức phụ trợ vượt `maxLearnedLesson`, loại câu
     thiếu audio, và **chế độ `due` chỉ lấy đúng mục tiêu trong `dueTargetIds`**.
   - `rateAnswer`: 4 nhánh ánh xạ Rating, gồm nhánh `medianMs === null` ở lần ôn đầu tiên.
   - `applyReview`: card `null` tạo thẻ mới; `Rating.Again` phải rút ngắn interval so với `Good`.
   - Chuẩn hóa đáp án nhập tay qua `wanakana` (Romaji → Kana, full-width ↔ half-width, bỏ dấu cách).
2. **Integration Tests:**
   - Giải nén ZIP trong Web Worker: **hash từng file đối chiếu `manifest.json`**, file hỏng bị
     loại riêng còn các file hợp lệ vẫn được nạp; lưu Blob và đọc lại Blob URL từ IndexedDB.
   - Luồng lưu bài nộp vào `pendingSync` khi offline và đẩy lên Supabase khi online.
   - **Idempotency của sync:** gửi lại cùng payload `review_items` hai lần không làm hỏng lịch ôn.
   - **Last-write-wins:** payload có `updated_at` cũ hơn không ghi đè bản ghi mới hơn trên server.
3. **Kiểm tra ràng buộc CSDL:**
   - `INSERT` với `total_questions = 0` phải bị CHECK chặn, không được ném lỗi chia-cho-0.
   - `correct_count > total_questions` bị chặn bởi `correct_not_exceed_total`.
4. **Manual Verification:**
   - Thử nghiệm trên cả Google Chrome PC (phím tắt) và Safari / Chrome iOS/Android (chạm cảm ứng, A-B loop).
   - Nạp gói ZIP audio cỡ thật (≥ 300 MB) và xác nhận giao diện **không đứng hình** trong suốt
     quá trình giải nén — đây là phép thử trực tiếp cho quyết định dùng Web Worker ở 5.1.1.

---
*Tài liệu được lưu trữ tại:* `d:\Projects\Lab\Japanese\docs\project-design-spec.md`
