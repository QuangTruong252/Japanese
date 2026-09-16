# N5 Vietnamese Dataset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển đổi và tạo toàn bộ 230 file dữ liệu N5 từ `repo-reference/noken/src/data/n5/` sang `web/src/data/n5/` với bản dịch tiếng Việt tự nhiên chuẩn Minna no Nihongo, bảo lưu `en`, xử lý 96 trường thiếu `en`, kèm test suite `node:test` và tài liệu manifest.

**Architecture:** Sử dụng pipeline script Node để đọc 230 file từ nguồn tham chiếu, ánh xạ qua từ điển đối chiếu chuẩn hóa theo 5 nhóm bài học, sinh ra các file JSON theo đúng cấu trúc 5 thư mục (`vocab`, `lessons`, `kanji`, `verbs`, `reference`), và thẩm định nghiêm ngặt bằng test suite `node:test`.

**Tech Stack:** Node.js v26.3.0 (`node:test`, `node:assert/strict`, `fs`, `path`), TypeScript / Next.js 16.

## Global Constraints

- Không sửa đổi bất kỳ file nào trong `repo-reference/noken/`.
- Thay khóa `es` bằng `vi`, loại bỏ 100% khóa `es`.
- Giữ nguyên vẹn 100% giá trị `en` gốc có sẵn; với 96 trường thiếu `en`, tạo `vi` chuẩn xác, không dùng tiếng Tây Ban Nha fallback.
- 8 ô layout bảng trong `reference` giữ `{ "vi": "" }`; tất cả các trường khác bắt buộc có `vi` là chuỗi không rỗng.
- Bảo toàn 100% ID, cấu trúc, câu Nhật, furigana `漢字[かんじ]`, kana, chia thể động từ và liên kết chéo.
- Không thêm dependency mới; sử dụng `node:test` có sẵn.
- Không sửa đổi UI, Dexie, Sync, Audio. Không commit/push trừ khi người dùng yêu cầu.

---

### Task 1: Thiết lập Test Suite Xác thực Dữ liệu Tự động (`node:test`)

**Files:**
- Create: `web/scripts/validate-n5-data.mjs`

**Interfaces:**
- Input: Các file trong `web/src/data/n5/` và so sánh với `repo-reference/noken/src/data/n5/`.
- Output: Exit code 0 khi tất cả kiểm tra pass; exit code 1 khi có lỗi kèm log chi tiết.

- [ ] **Step 1: Viết test script kiểm tra tính hợp lệ dữ liệu**
  - Kiểm tra số lượng 230 file và 5 thư mục con.
  - Quét đệ quy không còn khóa `es`.
  - Kiểm tra 100% trường có khóa `vi` hợp lệ (ngoại trừ 8 ô layout bảng rỗng).
  - So khớp 1:1 với nguồn về số lượng mục, ID, câu Nhật, Furigana, thể động từ và trường `en`.
  - Quét phát hiện từ vựng tiếng Tây Ban Nha hoặc placeholder.

- [ ] **Step 2: Chạy thử test khi chưa có dữ liệu để xác nhận FAIL (Red test)**
  - Chạy: `node --test web/scripts/validate-n5-data.mjs`
  - Kỳ vọng: Báo lỗi do thư mục `web/src/data/n5/` chưa có file nào.

---

### Task 2: Xây dựng Từ điển & Pipeline Xử lý Từ vựng (991 từ) và Bài học (141 Ngữ pháp, 187 Ví dụ) theo 5 Nhóm Bài

**Files:**
- Create: `web/scripts/data-dicts/n5-vocab-dict.mjs`
- Create: `web/scripts/data-dicts/n5-lessons-dict.mjs`
- Create: `web/scripts/build-n5-data.mjs`

**Interfaces:**
- Consumes: JSON files từ `repo-reference/noken/src/data/n5/vocab/` và `lessons/`.
- Produces: 25 file `web/src/data/n5/vocab/lesson-XX.json` và 25 file `web/src/data/n5/lessons/lesson-XX.json`.

- [ ] **Step 1: Xây dựng từ điển dữ liệu Bài 1–5 (Nhập môn, danh từ, đại từ, trợ từ は, も, の, địa điểm, thời gian)**
- [ ] **Step 2: Xây dựng từ điển dữ liệu Bài 6–10 (Động từ hành động, trợ từ を, で, へ, tính từ đuôi い/な, tồn tại います/あります)**
- [ ] **Step 3: Xây dựng từ điển dữ liệu Bài 11–15 (Số đếm/lượng từ, so sánh, mong muốn たい, thể て, cấm chỉ/cho phép てはいけません/てもいいです)**
- [ ] **Step 4: Xây dựng từ điển dữ liệu Bài 16–20 (Nối hành động, thể ない, thể từ điển, kinh nghiệm たことがある, văn nói thông thường)**
- [ ] **Step 5: Xây dựng từ điển dữ liệu Bài 21–25 (Ý kiến/dự đoán と思います, bổ nghĩa mệnh đề, khi/nếu とき/たら/ても, cho/nhận あげます/もらいます/くれます)**
- [ ] **Step 6: Xử lý triệt để 88 trường `pattern` thiếu `en` trong `lessons`**

---

### Task 3: Xây dựng Dữ liệu Kanji (169 chữ), Bảng Động từ (156 verbs) và Bảng Tham chiếu (10 tables)

**Files:**
- Create: `web/scripts/data-dicts/n5-kanji-dict.mjs`
- Create: `web/scripts/data-dicts/n5-verbs-dict.mjs`
- Create: `web/scripts/data-dicts/n5-reference-dict.mjs`
- Modify: `web/scripts/build-n5-data.mjs`

**Interfaces:**
- Consumes: JSON files từ `kanji/`, `verbs/`, `reference/` của Noken.
- Produces: 169 file `kanji/*.json`, 1 file `verbs/verbs.json`, 10 file `reference/*.json`.

- [ ] **Step 1: Xây dựng từ điển 169 chữ Hán với âm Hán Việt chuẩn và giải nghĩa tiếng Việt**
- [ ] **Step 2: Xây dựng từ điển 156 động từ với nghĩa tiếng Việt súc tích**
- [ ] **Step 3: Xây dựng từ điển 10 bảng tra cứu reference và xử lý 8 ô layout bảng rỗng**

---

### Task 4: Chạy Pipeline Sinh Dữ liệu Toàn bộ 230 File và Xác minh với Test Suite

**Files:**
- Output: 230 files trong `web/src/data/n5/`

- [ ] **Step 1: Chạy pipeline sinh toàn bộ dữ liệu**
  - Lệnh: `node web/scripts/build-n5-data.mjs`
  - Kiểm tra 230 file xuất hiện tại `web/src/data/n5/`.

- [ ] **Step 2: Chạy test suite `node:test` xác thực dữ liệu (Green test)**
  - Lệnh: `node --test web/scripts/validate-n5-data.mjs`
  - Kỳ vọng: PASS 100% các tiêu chí.

- [ ] **Step 3: Sửa đổi và tinh chỉnh bất kỳ lỗi parity hoặc tiếng Tây Ban Nha phát hiện được**

---

### Task 5: Tạo Tài liệu Hướng dẫn Biên soạn và Manifest Kiểm chứng

**Files:**
- Create: `docs/n5-data-editorial-guide.md`
- Create: `docs/n5-manifest.md`
- Create: `web/src/data/n5/manifest.json`

- [ ] **Step 1: Viết `docs/n5-data-editorial-guide.md`** (Bộ quy chuẩn thuật ngữ, quy tắc biên dịch, quy trình nâng cấp trạng thái xác minh).
- [ ] **Step 2: Viết `docs/n5-manifest.md` và `web/src/data/n5/manifest.json`** (Thống kê số lượng thực thể, bảng theo dõi kiểm chứng, danh mục điểm mở cần đối chiếu).

---

### Task 6: Kiểm tra Hoàn tất Toàn diện & Nghiệm thu

- [ ] **Step 1: Chạy test xác thực dữ liệu:** `node --test web/scripts/validate-n5-data.mjs`
- [ ] **Step 2: Chạy kiểm tra TypeScript và ESLint:** `pnpm check` trong `web/`
- [ ] **Step 3: Chạy toàn bộ test dự án:** `pnpm test` trong `web/`
- [ ] **Step 4: Tổng kết báo cáo nghiệm thu và danh sách mục chưa xác minh bàn giao cho người dùng.**
