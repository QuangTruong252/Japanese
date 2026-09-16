# BẢN PHÂN TÍCH DỰ ÁN & PROJECT BRIEF: NOKEN
> **Mục đích:** Đánh giá kiến trúc, dữ liệu, tính năng của repository tham chiếu `repo-reference/noken` làm nền tảng để xây dựng website học tiếng Nhật cá nhân.  
> **Ngày lập:** 16/09/2026  
> **Người lập:** Antigravity AI Assistant  
> **Trạng thái:** Sẵn sàng tham chiếu & kế thừa (Reference Ready)

---

## 1. TỔNG QUAN DỰ ÁN (EXECUTIVE SUMMARY)

- **Tên dự án tham chiếu:** **Noken**
- **Định hướng cốt lõi:** Website học tiếng Nhật theo chuẩn JLPT và giáo trình **Minna no Nihongo** (hiện tại đã hoàn thiện trọn vẹn cấp độ **N5** gồm 25 bài học).
- **Mô hình kiến trúc:** **Static-First / Jamstack** (Zero-backend, 100% Static HTML + React Islands cho các tính năng tương tác).
- **Lưu trữ dữ liệu:** 
  - Nội dung học tập (Content): Lưu trữ dưới dạng JSON có định kiểu chặt chẽ bằng Zod Schema (Astro Content Collections).
  - Trạng thái người dùng (User Progress & Stats): Lưu trữ cục bộ hoàn toàn trên `localStorage` (không cần tài khoản, không cần server/database).
- **Ngôn ngữ hỗ trợ sẵn:** Tiếng Tây Ban Nha (gốc) và Tiếng Anh (`/en`). Kiến trúc i18n sẵn sàng để mở rộng thêm Tiếng Việt (`vi`).

---

## 2. TECH STACK & CÔNG NGHỆ SỬ DỤNG

| Hạng mục | Công nghệ | Phiên bản | Vai trò & Đánh giá |
| :--- | :--- | :--- | :--- |
| **Framework chính** | **Astro** | `^7.1.3` | Tạo trang tĩnh (SSG), tốc độ tải trang gần như tức thì, zero-JS mặc định trừ các tương tác cần thiết. |
| **Giao diện tương tác** | **React** | `^19.2.8` | Sử dụng theo mô hình **Astro Island** (`client:load`) cho các quiz, flashcard, drill, thanh tìm kiếm và menu cài đặt. |
| **Ngôn ngữ** | **TypeScript** | `^6.0.3` | Kiểu dữ liệu tĩnh nghiêm ngặt (`strict: true`), an toàn tuyệt đối khi parse JSON và render. |
| **Styling** | **Tailwind CSS** | `^4.3.3` | Thế hệ mới (Vite plugin, CSS-first config), kết hợp `tw-animate-css`. |
| **Design Tokens & UI** | **Radix UI** + **Lucide Icons** | `radix-ui: ^1.6.5`, `lucide-react` | Các headless component chuẩn accessibility (Popover, Switch, Toggle Group) và bộ icon hiện đại. |
| **Màu sắc & Giao diện** | **OKLCH Color Space** | Native CSS | Bảng màu hiện đại (gam màu Terracotta chủ đạo, Dark/Light mode tối ưu độ tương phản, phân biệt 3 nhóm động từ). |
| **Typography** | **Inter** + **Noto Sans JP** | Fontsource Variable | Tối ưu hiển thị chữ Hán (Kanji) và chữ Latinh đồng nhất, hỗ trợ Ruby/Furigana căn chỉnh chuẩn xác. |
| **Xác thực dữ liệu** | **Zod** | Tích hợp Astro | Định nghĩa schema cho toàn bộ bài học, từ vựng, kanji, ngữ pháp, bảng tham chiếu. |
| **Testing** | **Vitest** | `^4.1.10` | Unit test cho các thuật toán: Furigana parser, Romaji search, Distractor generation, Numbers, Stats. |
| **Package Manager** | **pnpm** | - | Quản lý package nhanh, tiết kiệm dung lượng đĩa. |

---

## 3. CẤU TRÚC DỰ ÁN & MÔ HÌNH DỮ LIỆU

### 3.1. Sơ đồ thư mục nguồn (`src/`)

```
src/
├── content.config.ts        # Định nghĩa 5 collections và Zod Schema xác thực JSON
├── data/
│   └── n5/                  # Toàn bộ dữ liệu N5 (25 bài Minna no Nihongo)
│       ├── lessons/         # 25 file JSON (Ngữ pháp, mẫu câu, ví dụ furigana)
│       ├── vocab/           # 25 file JSON (Danh sách từ vựng theo bài)
│       ├── kanji/           # 169 file JSON (Mỗi file là 1 chữ Kanji N5)
│       ├── verbs/           # verbs.json (Bảng chia 5 thể của tất cả động từ N5)
│       └── reference/       # 10 file JSON (Bảng tra cứu: trợ từ, số đếm, thời gian, lịch...)
├── components/              # Component UI hiển thị nội dung
│   ├── practice/            # Các Island tương tác: Flashcards, McQuiz, Drills
│   ├── FuriganaText.tsx     # Bộ render Furigana dạng React
│   ├── SearchDialog.tsx     # Hộp thoại tìm kiếm Command (Ctrl+K)
│   └── SettingsMenu.tsx     # Popover cấu hình giao diện
├── ui/                      # Base Astro Primitives (Badge, Card, Container, Furigana, Icon)
│   └── react/               # Shadcn/Radix UI wrappers (Button, Popover, Switch, Toggle)
├── constants/               # Bảng chữ cái Kana, cấp độ JLPT, loại từ, storage keys
├── i18n/                    # Cấu hình đa ngôn ngữ (config, routing, từ điển UI en/es)
├── layouts/                 # BaseLayout (khởi tạo theme/settings trước khi FOUC), SiteLayout
├── pages/                   # File-based routing Astro
│   ├── [...lang]/           # Dynamic route theo ngôn ngữ (mặc định root là es, /en/ cho tiếng Anh)
│   └── search-index.json.ts # Endpoint build tĩnh sinh file index tìm kiếm
├── styles/                  # global.css (Design tokens, OKLCH, typography, Ruby zoom)
└── utils/                   # Thuật toán cốt lõi: Furigana, Romaji, Distractor, Spaced Repetition
```

### 3.2. Cấu trúc dữ liệu chi tiết (Content Collections)

1. **Lessons (`src/data/n5/lessons/lesson-XX.json`)**:
   - `level`: `"n5"`
   - `number`: `1` - `25`
   - `title`: `{ "es": "...", "en": "..." }`
   - `grammar`: Mảng các điểm ngữ pháp:
     - `id`: Định danh ngữ pháp (anchor link).
     - `title`: Tên ngữ pháp.
     - `pattern`: Cấu trúc mẫu câu (ví dụ: `N1 は N2 です`).
     - `explanation`: Giải thích cách dùng.
     - `examples`: Mảng câu ví dụ gồm tiếng Nhật có Furigana (`jp`), bản dịch (`translation`), ghi chú (`note`).
   - `references`: Liên kết tới các chủ đề tham khảo liên quan (trợ từ, số đếm...).

2. **Vocabulary (`src/data/n5/vocab/lesson-XX.json`)**:
   - Mỗi từ gồm: `id`, `word` (ký hiệu furigana: `私[わたし]`), `kana` (`わたし`), `meaning` (dịch nghĩa), `type` (noun, verb, i-adjective, na-adjective, adverb...), `notes`.

3. **Kanji (`src/data/n5/kanji/<chữ_hán>.json`) - 169 ký tự**:
   - `character`: Ký tự chữ Hán (ví dụ: `学`).
   - `level`: `"n5"`, `lesson`: Bài xuất hiện tương ứng.
   - `strokes`: Số nét vẽ.
   - `onyomi` (Âm On) & `kunyomi` (Âm Kun).
   - `meanings`: Danh sách ý nghĩa.
   - `examples`: Các từ ghép mẫu kèm furigana và nghĩa.
   - `similar`: Các chữ Hán dễ nhầm lẫn (phục vụ sinh câu hỏi bẫy trong quiz).

4. **Verbs Table (`src/data/n5/verbs/verbs.json`)**:
   - Tổng hợp toàn bộ động từ Minna no Nihongo I.
   - `group`: Nhóm `1`, `2`, hoặc `3`.
   - Các thể chia: `masu` (ます), `te` (て), `dictionary` (nguyên mẫu/từ điển), `nai` (phủ định ない), `ta` (quá khứ た).

5. **References (`src/data/n5/reference/*.json`)**:
   - 10 chủ đề: `particles` (trợ từ), `counters` (lượng từ đếm), `time` (giờ phút), `calendar` (ngày tháng, thứ), `numbers` (số đếm, tiền tệ), `demonstratives` (kore/sore/are), `family` (xưng hô gia đình), `adjectives` (tính từ), `greetings` (chào hỏi), `question-words` (từ để hỏi).

---

## 4. CÁC TÍNH NĂNG VÀ THUẬT TOÁN ĐẶC SẮC

### 4.1. Bộ xử lý Furigana (Furigana Engine)
- **Ký hiệu lưu trữ:** Dùng cú pháp đóng mở ngoặc vuông đơn giản: `食[た]べます` hoặc `私[わたし]は 学生[がくせい]です`.
- **Regex thông minh:** `([一-鿿㐀-䶿々〆〇ヶ]+)\[([^\]]+)\]` chỉ bắt đúng chuỗi chữ Hán liền trước dấu ngoặc, giữ nguyên phần okurigana (đuôi kana) bên ngoài.
- **Render chuẩn HTML5:** Sinh ra thẻ `<ruby>食<rt>た</rt></ruby>べます`.
- **Furigana Zoom Effect:** Khi hover chuột vào từ vựng trên Desktop, từ đó sẽ phóng to `1.6x` (`transform: scale(1.6)`) với đổ bóng nổi bật, giúp người học nhìn rõ các nét kanji phức tạp.
- **Cấu hình người dùng:** Cho phép Bật/Tắt Furigana toàn trang hoặc chỉnh cỡ chữ Furigana to hơn (`furigana-large`).

### 4.2. Chế độ học tập chủ động (Study Mode - Active Recall)
- Trong phần Cài đặt có tùy chọn **"Hide translations"**.
- Khi bật chế độ này, toàn bộ bản dịch tiếng nước ngoài sẽ bị làm mờ (`filter: blur(5px)`). 
- Người học buộc phải tự đọc và dịch tiếng Nhật trong đầu; chỉ khi rê chuột hoặc chạm tay vào bản dịch thì chữ mới hiện rõ. Đây là phương pháp kích thích não bộ (Active Recall) rất tốt.

### 4.3. Hệ thống Luyện tập & Thuật toán sinh câu hỏi (Practice & Drills)
Điểm sáng tạo nhất của Noken là **toàn bộ câu hỏi bài tập được trích xuất tự động tại thời điểm build (Build-time Generation) từ dữ liệu bài học**, không cần tạo một bộ dữ liệu bài tập riêng biệt:

1. **Kanji Reading Quiz (Trắc nghiệm đọc Kanji):**
   - Thuật toán `pickDistractors`: Khi tạo đáp án sai, hệ thống không lấy ngẫu nhiên mà tìm các từ có **cùng loại từ** (cùng là động từ/danh từ) và **cùng đuôi Okurigana** (`okuriganaTail`). Nhờ đó, người học không thể dùng mẹo nhìn đuôi chữ để loại trừ đáp án.
2. **Particle Cloze Quiz (Điền trợ từ vào câu):**
   - Regex tự động phát hiện vị trí trợ từ trong các câu ví dụ Minna no Nihongo sau ranh giới từ hợp lệ (`]`), thay trợ từ bằng `＿＿＿`.
   - Đáp án sai được bốc từ một "bể gây nhiễu" (Confusion Pool: ví dụ với `は` thì đáp án nhiễu là `が`, `も`, `に`...).
3. **Kanji Confusion Quiz:**
   - Trắc nghiệm 2 chiều (Ý nghĩa → Kanji, hoặc Kanji → Ý nghĩa). Đáp án sai được lấy ưu tiên từ danh sách chữ dễ nhầm lẫn (`similar`) hoặc chữ có số nét vẽ tương đương.
4. **Conjugation & Numbers Drill:**
   - Luyện tập chia thể động từ và số đếm/giờ giấc/tiền tệ theo cơ chế "Nghĩ trong đầu → Bấm Hiện kết quả → Tự đánh giá đúng/sai" (Think-then-reveal).
   - Tích hợp phím tắt: Phím số `1`, `2`, `3`, `4` để chọn đáp án; `Space` để lật thẻ/tiếp tục.

### 4.4. Flashcard Spaced Repetition (Hệ thống Leitner)
- Thuật toán hộp Leitner 3 ngăn với chu kỳ ôn tập ngắt quãng:
  - Hộp 1: Ôn lại sau **1 ngày**
  - Hộp 2: Ôn lại sau **3 ngày**
  - Hộp 3: Ôn lại sau **7 ngày**
- **Virtual Difficult Deck (Bộ thẻ từ khó):** Nếu người học trả lời sai bất kỳ từ nào ở BẤT KỲ chế độ luyện tập nào (từ Quiz đọc, Quiz trợ từ đến Quiz Kanji), từ đó sẽ tự động được ghi nhận vào danh sách "Từ khó" (`noken-difficult`) và tạo thành một bộ Flashcard riêng để tập trung ôn luyện.

### 4.5. Phân tích điểm yếu người học (Adaptive Weakness Ranking)
- Hệ thống ghi nhận tỷ lệ đúng/sai theo từng bài học vào `noken-practice-stats`.
- Tại trang chủ Luyện tập, hàm `weakestLessons` sẽ tính toán độ chính xác gộp và xếp hạng các bài học người dùng yếu nhất, đồng thời hiển thị nút link thẳng vào chế độ luyện tập mà người dùng làm sai nhiều nhất của bài đó.

### 4.6. Tìm kiếm thông minh (Romaji Fuzzy Search)
- Nhấn `Ctrl + K` (hoặc `/` khi đang đọc bài) để mở hộp tìm kiếm toàn bộ Từ vựng, Hán tự, Ngữ pháp, Bảng tra cứu.
- Thuật toán chuyển đổi Romaji (`toRomaji` & `romajiKey`):
  - Chuẩn hóa cả chuẩn Hepburn lẫn Kunrei: `shinbun` = `sinbun`, `tsukue` = `tukue`, `jisho` = `zisyo`.
  - Chuẩn hóa nguyên âm dài: `toukyou` = `tokyo` = `tōkyō`.
  - Chuẩn hóa biến âm: `shimbun` = `shinbun`.
  - Giúp người học dù gõ bàn phím kiểu gì cũng tìm đúng từ tiếng Nhật mong muốn.

---

## 5. ĐÁNH GIÁ ĐIỂM MẠNH & HẠN CHẾ

### 5.1. Điểm mạnh vượt trội (Nên kế thừa 100%)
1. **Dữ liệu N5 cực kỳ chuẩn xác và hoàn thiện:** 25 bài Minna no Nihongo đầy đủ ngữ pháp, từ vựng, kanji, ví dụ kèm furigana. Tiết kiệm hàng trăm giờ nhập liệu.
2. **Kiến trúc Static tối ưu chi phí:** Có thể host miễn phí trọn đời trên Cloudflare Pages, Vercel hoặc GitHub Pages. Tốc độ tải < 0.5s, không lo chết server hay bảo trì database.
3. **UX học tiếng Nhật đỉnh cao:** Furigana zoom, phím tắt số/space, chế độ làm mờ bản dịch (Active Recall), dark mode OKLCH sang trọng.
4. **Không phụ thuộc Backend:** Mọi tiến độ, streak, flashcard lưu trên trình duyệt của người học. Riêng tư, bảo mật, không cần đăng ký tài khoản.

### 5.2. Các điểm hạn chế & Cơ hội cải tiến cho dự án cá nhân
1. **Chưa có Tiếng Việt:** Toàn bộ bản dịch hiện tại là tiếng Tây Ban Nha (`es`) và tiếng Anh (`en`).
2. **Chưa có âm thanh (Audio / Text-To-Speech):** Rất quan trọng khi tự học tiếng Nhật (cần nghe phát âm từ vựng, phát âm câu ví dụ, luyện phản xạ nghe).
3. **Mới dừng lại ở N5:** Chưa có dữ liệu N4 (tập 2 Minna no Nihongo - bài 26 đến 50) và N3, N2, N1.
4. **Chưa đồng bộ đa thiết bị (Cross-device Sync):** Do chỉ lưu `localStorage`, nếu học trên điện thoại thì tiến độ không tự sang máy tính (cần có tính năng Export/Import file JSON hoặc tùy chọn sync qua Cloudflare KV/Supabase cá nhân).
5. **Chưa có vẽ nét Kanji (Stroke Order):** Chưa có animation thứ tự nét vẽ chữ Hán.

---

## 6. ĐỀ XUẤT LỘ TRÌNH TRIỂN KHAI CHO BẠN (ROADMAP)

Dựa trên dự án Noken, bạn có thể xây dựng web học tiếng Nhật riêng theo 4 giai đoạn tinh gọn:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Giai đoạn 1: Khởi tạo & Việt hóa (Localization & Custom Branding)       │
│ • Fork/Clone repository, setup môi trường Node/pnpm                     │
│ • Thêm locale 'vi' vào src/i18n, dịch từ điển UI sang Tiếng Việt        │
│ • Bổ sung bản dịch tiếng Việt cho 25 bài N5 (từ vựng, ngữ pháp, nghĩa) │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Giai đoạn 2: Tích hợp Âm thanh & Phát âm (Audio & TTS)                  │
│ • Tích hợp Web Speech API (miễn phí, có sẵn trong trình duyệt)          │
│ • Nút bấm nghe phát âm từng từ vựng, câu ví dụ, bảng chữ cái Kana      │
│ • Tùy chọn giọng đọc Nhật tự nhiên                                      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Giai đoạn 3: Tính năng cá nhân hóa nâng cao (Personalization & Sync)     │
│ • Chức năng Lưu / Bookmark từ vựng & ngữ pháp yêu thích                 │
│ • Chức năng Ghi chú cá nhân (Personal Notes) dưới mỗi điểm ngữ pháp     │
│ • Export / Import toàn bộ tiến độ học ra file JSON (để sync sang ĐT)    │
│ • Tích hợp Stroke Order (SVG nét vẽ Kanji từ KanjiVG)                   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Giai đoạn 4: Mở rộng nội dung (N4, N3 & Shadowing)                      │
│ • Bổ sung bài 26 - 50 Minna no Nihongo (Trọn vẹn N4)                    │
│ • Chế độ Shadowing (nghe câu lặp lại theo nhịp để luyện nói)            │
│ • Deploy lên Cloudflare Pages / Vercel với tên miền riêng               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. KẾT LUẬN & KHUYẾN NGHỊ

Dự án **Noken** là một nguồn tài nguyên tham khảo **chất lượng cao hiếm có** về cả kiến trúc kỹ thuật (Astro 7 + Tailwind 4 + TypeScript), tư duy sư phạm (Minna no Nihongo chuẩn, distractor generation, Leitner spaced repetition) và thiết kế giao diện (tinh tế, chuẩn typography tiếng Nhật).

**Khuyến nghị:**
Bạn hoàn toàn nên tận dụng codebase và dữ liệu mẫu của Noken làm gốc, tinh chỉnh và phát triển thêm giao diện Tiếng Việt, âm thanh phát âm và tính năng lưu ghi chú cá nhân để tạo thành công cụ tự học tiếng Nhật mạnh mẽ và hoàn toàn miễn phí cho bản thân.

---
*Tài liệu này được lưu tại:* `d:\Projects\Lab\Japanese\docs\project-brief-noken.md`
