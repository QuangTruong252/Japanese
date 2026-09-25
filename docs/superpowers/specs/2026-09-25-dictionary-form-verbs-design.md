# Thiết kế: Bổ sung Động từ Thể từ điển & Ưu tiên Học Thể nguyên mẫu

Ngày: 25/09/2026  
Mã: SPEC-VOCAB-VERB-FORMS  
Trạng thái: Approved design doc  
Nguồn tham chiếu: [PRODUCT.md](file:///d:/Projects/Lab/Japanese/PRODUCT.md), [DESIGN.md](file:///d:/Projects/Lab/Japanese/DESIGN.md), [SPEC-01](file:///d:/Projects/Lab/Japanese/docs/specs/SPEC-01-du-lieu-va-sinh-cau-hoi.md), [SPEC-12](file:///d:/Projects/Lab/Japanese/docs/specs/SPEC-12-tra-cuu.md), [SPEC-15](file:///d:/Projects/Lab/Japanese/docs/specs/SPEC-15-hoc-tu-vung.md).

---

## 1. Mục tiêu & Phạm vi

### Bối cảnh & Lý do
Trong giáo trình Minna no Nihongo truyền thống, động từ ở các bài đầu (Bài 4–13) được giới thiệu dưới dạng thể lịch sự (thể Masu: `切[き]ります`, `食[た]べます`, `行[い]きます`). Đến bài 14 mới bắt đầu học thể `て`, bài 17 thể `ない`, bài 18 mới học thể từ điển (辞書形 - Thể nguyên mẫu), bài 19 thể `た`.  
Tuy nhiên, trong phương pháp học tiếng Nhật hiện đại và nhu cầu cá nhân của người học:
- **Thể từ điển (nguyên mẫu)** là dạng gốc của từ vựng trong từ điển, giúp người học nắm vững nhóm động từ (Nhóm 1 - Godan, Nhóm 2 - Ichidan, Nhóm 3 - Irregular) và làm chủ bản chất của các quy tắc chia thể/thì sau này.
- Bổ sung thể từ điển làm từ vựng chính yếu, đồng thời tích hợp sẵn các thể chia cơ bản (*Masu, Te, Nai, Ta*) ngay trong dữ liệu từ vựng sẽ giúp người học tạo phản xạ chia thể vững chắc ngay từ đầu.

### Trong phạm vi
1. **Nâng cấp Schema `VocabWord`:** Bổ sung cấu trúc `verbForms` (chứa 5 thể: Từ điển, Masu, Te, Nai, Ta) và `verbGroup` (1, 2, 3).
2. **Chuẩn hóa dữ liệu 25 bài học N5:** Chuyển `word` và `kana` của 157 động từ sang thể từ điển (`切[き]る`, `きる`), bổ sung `verbForms` được đối chiếu tự động từ bảng 156 động từ chuẩn trong [`web/src/data/n5/verbs/verbs.json`](file:///d:/Projects/Lab/Japanese/web/src/data/n5/verbs/verbs.json).
3. **Bảo toàn tiến độ FSRS:** Giữ nguyên `id` gốc của từ vựng (ví dụ `"kirimasu"`, `"tabemasu"`) để không làm mất hoặc mồ côi (orphan) dữ liệu học trong Dexie DB (`reviewItems`).
4. **Cập nhật Giao diện:**
   - **Bảng từ vựng bài học (`/hoc/[so]`):** Hiển thị nổi bật thể từ điển, huy hiệu nhóm động từ, dòng phụ chú thích thể masu để đối chiếu Minna, phát âm thể từ điển.
   - **Flashcard từ vựng (`/hoc/[so]/tu-vung`):** Mặt trước thể từ điển to rõ + nhãn nhóm động từ; mặt sau hiển thị nghĩa tiếng Việt + khối bảng tóm tắt 4 thể chia (Masu, Te, Nai, Ta) + câu ví dụ.
   - **Danh sách chọn từ trước khi học:** Hiển thị thể từ điển kèm thể masu phụ.
5. **Cập nhật Câu hỏi & Luyện tập (`questions.ts`):** Trắc nghiệm Đọc, Nghĩa và Matching tự động kiểm tra thể từ điển; thuật toán `distractors.ts` tạo phương án nhiễu tự nhiên theo thể từ điển.
6. **Tìm kiếm toàn cục (`search.ts`):** Index cả thể từ điển và thể masu, gõ kiểu nào cũng tìm thấy từ vựng.
7. **Khớp câu ví dụ thông minh (`findExampleForWord`):** Nhận diện từ vựng xuất hiện trong câu ví dụ qua tất cả các thể trong `verbForms`.

### Ngoài phạm vi
- Thay đổi cấu trúc của các câu ví dụ trong bài học (giữ nguyên câu giao tiếp tự nhiên).
- Thay đổi schema của các loại từ không phải động từ (danh từ, tính từ, phó từ giữ nguyên).
- Xây dựng mini-game chia thể riêng biệt (đây sẽ là tính năng tương lai kế thừa `verbForms` được xây dựng trong đợt này).

---

## 2. Kiến trúc Dữ liệu & Hợp đồng Schema

### 2.1. Định nghĩa Type (`web/src/types/index.ts`)
```typescript
export interface VerbForms {
  dictionary: string;     // Thể từ điển có notation furigana: "切[き]る"
  dictionaryKana: string; // Đọc kana thể từ điển: "きる"
  masu: string;           // Thể masu có notation furigana: "切[き]ります"
  masuKana: string;       // Đọc kana thể masu: "きります"
  te?: string;            // Thể te: "切[き]って"
  teKana?: string;        // Đọc kana thể te: "きって"
  nai?: string;           // Thể nai: "切[き]らない"
  naiKana?: string;       // Đọc kana thể nai: "きらない"
  ta?: string;            // Thể ta: "切[き]った"
  taKana?: string;        // Đọc kana thể ta: "きった"
}

export interface VocabWord {
  id: string;             // GIỮ NGUYÊN (vd: "kirimasu") để bảo toàn FSRS Dexie
  lesson: number;
  word: string;           // Động từ: chuyển sang THỂ TỪ ĐIỂN ("切[き]る")
  kana: string;           // Động từ: chuyển sang KANA TỪ ĐIỂN ("きる")
  romaji?: string;
  meaning: LocalizedText;
  example?: ExampleSentence;
  type:
    | 'noun' | 'pronoun' | 'verb-godan' | 'verb-ichidan' | 'verb-irregular'
    | 'adjective-i' | 'adjective-na' | 'adverb' | 'particle' | 'expression'
    | 'interrogative' | 'counter' | 'number' | 'conjunction';
  verbGroup?: 1 | 2 | 3;  // 1 = Godan, 2 = Ichidan, 3 = Irregular
  verbForms?: VerbForms;  // Bảng đầy đủ các thể chia phục vụ hiển thị & bài tập
  kanjiIds?: string[];
  audioKey?: string;
  notes?: LocalizedText;
}
```

### 2.2. Quy tắc Ánh xạ & Làm giàu Dữ liệu (Enrichment Rules)
- Nguồn tham chiếu gốc: `web/src/data/n5/verbs/verbs.json`.
- Khóa đối chiếu giữa bài học và `verbs.json`:
  1. Trùng khớp qua `masu` reading (ví dụ: `きります` khớp `あいます`, `きります`, ...).
  2. Bỏ qua các hậu tố chú thích ngữ cảnh trong `verbs.json` (như `[ともだちに〜]`, `[かぜを〜]`) khi lấy furigana gốc.
- Đối với động từ ghép hoặc danh động từ (suru-verbs như `勉強[べんきょう]します`):
  - Nhóm: `verb-irregular` (Nhóm 3).
  - Thể từ điển: `勉強[べんきょう]する` (`べんきょうする`).
  - Thể masu: `勉強[べんきょう]します` (`べんきょうします`).
  - Thể te: `勉強[べんきょう]して` (`べんきょうして`).
  - Thể nai: `勉強[べんきょう]しない` (`べんきょうしない`).
  - Thể ta: `勉強[べんきょう]した` (`べんきょうした`).
- Kiểm tra tính toàn vẹn: 100% (157/157) động từ trong 25 bài học N5 phải có `verbForms` hợp lệ và `verbGroup` khớp chính xác với `type`.

---

## 3. Giao diện Người dùng & Trải nghiệm Học tập

### 3.1. Bảng Từ vựng Bài học (`web/src/app/hoc/[so]/page.tsx`)
- Cột **Từ vựng**:
  - Dòng chính: Hiển thị `<Furigana text={w.word} />` (to rõ, thể từ điển).
  - Huy hiệu nhóm: Badge `Nhóm 1` (`bg-verb-1`), `Nhóm 2` (`bg-verb-2`), `Nhóm 3` (`bg-verb-3`).
  - Dòng phụ: Nếu từ có `w.verbForms`, hiển thị bên dưới:
    ```tsx
    <span className="text-xs text-muted-foreground">
      Thể masu: <Furigana text={w.verbForms.masu} />
    </span>
    ```
- Nút phát âm `SpeakButton`: Phát âm `w.kana` (thể từ điển: `きる`).

### 3.2. Màn hình Học Flashcard (`web/src/components/vocab/VocabLearningFlow.tsx`)
- **Mặt trước (Thử thách)**:
  - Giữ nét tối giản, tập trung cao:
    - Nhãn nhỏ phía trên: `Động từ Nhóm 1 (Godan)` hoặc `Từ vựng`.
    - Chữ to ở trung tâm: Thể từ điển `切[き]る` (kèm kana `きる`).
    - Nút phát âm thể từ điển.
- **Mặt sau (Chi tiết & Bảng chia thể)**:
  - Nghĩa tiếng Việt: `cắt` (cỡ chữ lớn, rõ ràng).
  - **Khối chia thể (Quick Conjugation Block)**: Thiết kế dạng thẻ phụ bo góc, nền `bg-muted/40`, border `border-border/60`:
    - Grid 2 cột hoặc 4 ô ngang:
      - **Masu**: `<Furigana text={w.verbForms.masu} />`
      - **Te**: `<Furigana text={w.verbForms.te} />`
      - **Nai**: `<Furigana text={w.verbForms.nai} />`
      - **Ta**: `<Furigana text={w.verbForms.ta} />`
  - **Câu ví dụ**: Giữ nguyên câu ví dụ, furigana, dịch nghĩa và phát âm.

### 3.3. Danh sách Chọn Từ Học (`VocabLearningFlow.tsx`)
- Mỗi hàng từ vựng: Hiển thị thể từ điển `<Furigana text={w.word} />`.
- Với động từ: Kèm chú thích nhỏ `(切ります)` bên cạnh hoặc dưới tên từ để người học dễ nhận biết.

---

## 4. Luyện tập Trắc nghiệm & Sinh Câu hỏi (`web/src/lib/questions.ts`)

1. **MC Reading**:
   - `prompt`: `stripFurigana(word.word)` → `切る`.
   - `answer`: `word.kana` → `きる`.
   - `options`: Các distractor thể từ điển được chấm điểm tương đồng okurigana (cùng đuôi `る`).
2. **MC Meaning**:
   - `prompt`: `word.word` → `切[き]る`.
   - `answer`: `word.meaning.vi` → `cắt`.
3. **Matching**:
   - Cặp ghép: `切[き]る` ↔ `cắt`.
4. **Khớp Câu Ví dụ (`findExampleForWord`)**:
   - Thay vì chỉ cắt đuôi `ます`, hàm sẽ duyệt qua tất cả các thể có trong `word.verbForms` (`dictionary`, `masu`, `te`, `nai`, `ta`) để tìm từ khóa trong câu ví dụ. Đảm bảo tỷ lệ khớp câu ví dụ đạt tối đa.

---

## 5. Tìm kiếm Toàn cục (`web/src/lib/search.ts`)

- Khi tạo index tìm kiếm từ vựng:
  - Thêm `word.word` (thể từ điển: `切る`, `きる`) vào `keys`.
  - Nếu có `word.verbForms?.masu`, thêm `word.verbForms.masu` và `word.verbForms.masuKana` vào `keys`.
  - Phụ đề `sublabel`: Hiển thị nghĩa tiếng Việt kèm chú thích thể masu `cắt · Thể masu: 切ります`.
  - Kết quả: Người học gõ `kiru`, `kirimasu`, `cat`, `きります`, `きる` đều tìm thấy ngay lập tức.

---

## 6. Kế hoạch Kiểm chứng & Tiêu chuẩn Nghiệm thu

### Tiêu chuẩn nghiệm thu (Static & Logic Gates)
1. **Schema & Dữ liệu:**
   - 25 file `web/src/data/n5/vocab/lesson-*.json` được cập nhật đồng bộ.
   - Toàn bộ 157 động từ có `word` thể từ điển, `kana` thể từ điển, `verbGroup` (1, 2, hoặc 3), `verbForms` đầy đủ các thể.
   - Tất cả `id` của từ vựng được bảo toàn nguyên vẹn.
2. **Static check:** `pnpm check` (TypeScript + ESLint) không có lỗi cảnh báo.
3. **Test suites:** `pnpm test` (node:test) chạy đạt 100% tests hiện có, bổ sung test mới kiểm tra tính đầy đủ và hợp lệ của `verbForms`.
4. **Browser Verification:**
   - Kiểm tra trực quan trên `/hoc/7` (bảng từ vựng hiện thể từ điển + thể masu phụ).
   - Kiểm tra trực quan trên `/hoc/7/tu-vung` (thẻ flashcard lật 3D hiện thể từ điển mặt trước, bảng 4 thể chia mặt sau).
   - Kiểm tra hộp tìm kiếm `Ctrl+K` gõ cả thể từ điển và thể masu đều ra kết quả.
