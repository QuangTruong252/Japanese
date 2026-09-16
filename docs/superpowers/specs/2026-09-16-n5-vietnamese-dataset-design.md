# Thiết kế Chi tiết: Bộ Dữ liệu N5 Tiếng Việt (N5 Vietnamese Dataset Design)

- **Ngày lập:** 16/09/2026
- **Trạng thái:** Đã duyệt thiết kế (Approved Design)
- **Tác giả:** Antigravity AI Assistant & Người dùng
- **Mục tiêu:** Chuẩn bị trọn vẹn bộ dữ liệu `vi/en` cho 230 file N5 từ `repo-reference/noken/` sang `web/src/data/n5/`, đảm bảo chất lượng biên soạn tự nhiên cho người mới học, giữ nguyên schema gốc và toàn vẹn dữ liệu, kèm bộ kiểm thử tự động và manifest theo dõi kiểm chứng.

---

## 1. Bối cảnh & Phạm vi (Context & Scope)

### 1.1. Phạm vi thực hiện
- **Đầu vào:** 230 file JSON tại `repo-reference/noken/src/data/n5/` (tuyệt đối chỉ đọc, không sửa đổi).
- **Đầu ra:** 230 file JSON tại `web/src/data/n5/` phản ánh chuẩn xác 5 nhóm dữ liệu:
  - `vocab/` (25 file): 991 từ vựng N5 (Bài 1 - 25).
  - `lessons/` (25 file): 141 điểm ngữ pháp, 187 câu ví dụ (Bài 1 - 25).
  - `kanji/` (169 file): 169 chữ Hán N5.
  - `verbs/` (1 file): 156 động từ với 5 thể chia.
  - `reference/` (10 file): 10 bảng tra cứu (trợ từ, số đếm, ngày tháng, thời gian, đại từ...).
- **Tài liệu & Test đi kèm:**
  - `docs/n5-data-editorial-guide.md`: Hướng dẫn biên soạn, bộ thuật ngữ chuẩn hóa và quy trình nâng cấp xác minh.
  - `docs/n5-manifest.md` & `web/src/data/n5/manifest.json`: Thống kê mục dữ liệu, trạng thái biên tập (`edited`), trạng thái kiểm chứng (`unverified`) và danh sách điểm mở cần đối chiếu sách.
  - Bộ kiểm thử `node:test` kiểm tra tính toàn vẹn và đối chiếu parity 1:1 với nguồn.
- **Giới hạn phạm vi (Out of Scope):**
  - Chưa tích hợp vào UI, chưa nạp vào Dexie, chưa xử lý sync hay audio.
  - Chưa chuyển đổi kiểu dữ liệu sang schema riêng của app; giữ nguyên định dạng schema gốc của Noken.

---

## 2. Kiến trúc & Cấu trúc Dữ liệu (Architecture & Data Structure)

### 2.1. Cấu trúc thư mục đích
```
web/src/data/n5/
├── kanji/                  # 169 file JSON (chữ Hán)
├── lessons/                # 25 file JSON (bài học & ngữ pháp)
├── reference/              # 10 file JSON (bảng tra cứu)
├── verbs/                  # verbs.json (bảng chia động từ)
├── vocab/                  # 25 file JSON (từ vựng theo bài)
└── manifest.json           # Dữ liệu thống kê & trạng thái kiểm chứng
```

### 2.2. Quy tắc chuyển đổi Schema (`es` → `vi`)
1. **Trường cục bộ hóa đơn lẻ:**
   - Nguồn: `{ "es": string, "en"?: string }`
   - Đích: `{ "vi": string, "en"?: string }`
2. **Trường cục bộ hóa dạng mảng:**
   - Nguồn: `{ "es": string[], "en"?: string[] }`
   - Đích: `{ "vi": string[], "en"?: string[] }`
3. **Bảo tồn toàn vẹn:**
   - Toàn bộ giá trị `en` có sẵn được giữ nguyên vẹn 100% ký tự.
   - Loại bỏ 100% khóa `es`.
   - Giữ nguyên toàn bộ các trường khác: `id`, `number`, `level`, `character`, `strokes`, `onyomi`, `kunyomi`, `similar`, `group`, `masu`, `te`, `dictionary`, `nai`, `ta`, `jp`, `word`, `kana`, `type`, `references`, `slug`, `order`.
4. **Xử lý 96 trường thiếu `en` của nguồn:**
   - **88 trường `pattern` trong `lessons`:**
     - Các mẫu thuần ký hiệu ngữ pháp (ví dụ: `N1 は N2 です`): giữ nguyên ký hiệu chuẩn.
     - Các mẫu có chứa từ vựng tiếng Tây Ban Nha (ví dụ: `lugar`, `tiempo`, `persona`): chuyển ngữ chính xác sang tiếng Việt (`địa điểm`, `thời gian`, `người`, `thể ます`), không dùng tiếng Tây Ban Nha làm fallback.
     - Trường `en` giữ nguyên trạng (không tự ý thêm nếu nguồn không có).
   - **8 ô trống layout bảng trong `reference`:**
     - Các ô góc/layout ban đầu có `{"es": ""}` (như góc bảng `adjectives.json`, cột nghĩa song song `calendar.json`, phân nhóm `demonstratives.json`): chuyển thành `{"vi": ""}` để duy trì đúng cấu trúc hiển thị lưới bảng (layout grid).
     - Mọi trường cục bộ hóa khác bắt buộc có giá trị `vi` là chuỗi văn bản không rỗng.

---

## 3. Quy tắc Biên soạn Tiếng Việt (Vietnamese Editorial Guidelines)

### 3.1. Từ vựng (991 từ)
- Dịch theo ngữ cảnh Nhật Bản của giáo trình *Minna no Nihongo I*, dùng tiếng Anh làm nguồn tham khảo.
- Nghĩa ngắn gọn, súc tích, dễ nhớ cho người mới bắt đầu.
- Phân biệt rõ sắc thái lịch sự (`お名前` tên của bạn/người khác), xưng hô trong gia đình (`父` bố tôi vs `お父さん` bố bạn), văn phong thân mật vs lịch sự.

### 3.2. Ngữ pháp (141 điểm)
- Diễn đạt bằng tiếng Việt phổ thông, dễ hiểu, logic.
- Thống nhất hệ thống thuật ngữ:
  - **Trợ từ:** Trợ từ chủ đề (`は`), trợ từ đối tượng (`を`), trợ từ địa điểm/thời gian (`に`, `で`, `へ`), trợ từ liệt kê (`と`, `や`), trợ từ đích/nguồn (`から`, `まで`), trợ từ phụ trợ (`も`, `の`), trợ từ cuối câu (`ね`, `よ`, `か`).
  - **Chủ đề:** Dùng thuật ngữ "chủ đề câu" cho cấu trúc đi với `は`.
  - **Phân loại động từ:** "Động từ nhóm 1", "Động từ nhóm 2", "Động từ nhóm 3".
  - **Các thể:** "Thể ます" (thể lịch sự), "Thể từ điển" (nguyên mẫu), "Thể て", "Thể ない" (phủ định ngắn), "Thể た" (quá khứ ngắn).
  - **Tính từ:** "Tính từ đuôi い", "Tính từ đuôi な".

### 3.3. Câu ví dụ (187 câu)
- Dịch tự nhiên nhưng giữ nguyên các ràng buộc ngữ pháp cốt lõi:
  - Phủ định / Khẳng định / Nghi vấn.
  - Thì quá khứ / Hiện tại / Tương lai.
  - Số lượng, đơn vị đếm, mối quan hệ người nói - người nghe.

### 3.4. Chữ Hán (169 kanji) & Bảng động từ (156 động từ)
- Kanji: Đầy đủ Âm Hán Việt in hoa chuẩn (NHẤT, NHỊ, TAM, SINH, HỌC...) kèm giải nghĩa tiếng Việt tương ứng.
- Động từ: Nghĩa tiếng Việt ở dạng thể nguyên mẫu, chỉ rõ sắc thái khi là nội/ngoại động từ.

---

## 4. Quản lý Trạng thái & Kiểm chứng Nguồn (Status & Verification)

### 4.1. Phân biệt hai cấp độ trạng thái
1. **Trạng thái Biên tập (`editorial_status: "edited"`):** Đạt 100% cho 230 file (đã dịch tiếng Việt tự nhiên, sạch tiếng Tây Ban Nha, sạch placeholder).
2. **Trạng thái Xác minh (`verification_status: "unverified"`):**
   - Mặc định ghi nhận là `unverified` trong Manifest.
   - Chỉ nâng lên `verified` khi có bằng chứng đối chiếu cụ thể với sách *Minna no Nihongo I - Bản dịch và giải thích ngữ pháp tiếng Việt*.
   - Bàn giao dưới dạng **dữ liệu chuẩn bị (prepared dataset)**.

### 4.2. Manifest (`docs/n5-manifest.md` & `web/src/data/n5/manifest.json`)
- Thống kê chi tiết toàn bộ số lượng thực thể.
- Bảng phân bổ 96 trường thiếu `en` đã xử lý.
- Danh sách kiểm tra (checklist) các điểm ngữ pháp cần đối chiếu thực tế khi học.

---

## 5. Chiến lược Kiểm thử Tự động & Nghiệm thu (Verification & Acceptance)

### 5.1. Kịch bản test tự động (`node:test`)
Tạo test suite `web/src/data/n5/__tests__/n5-data.test.ts` (hoặc script `web/scripts/validate-n5-data.mjs` chạy qua `node --test`):
1. **Test số lượng file & cấu trúc:** Đảm bảo chính xác 230 file, JSON hợp lệ, đúng 5 thư mục.
2. **Test bản địa hóa:**
   - Không tồn tại bất kỳ khóa `es` nào.
   - 100% trường bản địa hóa có khóa `vi`.
   - 100% trường `vi` không rỗng (ngoại trừ 8 ô layout bảng đã thống nhất).
   - 100% trường `en` từ nguồn được bảo toàn chính xác từng ký tự.
3. **Test Parity so khớp 1:1 với nguồn:**
   - Không mất mục, không thay đổi ID (so khớp theo từng bài/collection).
   - Giữ nguyên 100% tiếng Nhật (`jp`, `word`, `character`, `kana`, các thể động từ).
   - Giữ nguyên cấu trúc liên kết chéo (`references`, `similar`).
4. **Test rà soát tiếng Tây Ban Nha & Placeholder:**
   - Quét từ vựng tiếng Tây Ban Nha (như *de, la, el, en, un, una, los, las, para, con, por, sustantivo, lugar, verbo...*).
   - Quét placeholder (`TODO`, `FIXME`, `undefined`, `null`).

### 5.2. Tiêu chí hoàn thành (Definition of Done)
- [ ] Toàn bộ 230 file dữ liệu tiếng Việt được sinh ra tại `web/src/data/n5/`.
- [ ] Test dữ liệu `node:test` chạy đạt 100%.
- [ ] Chạy `pnpm check` (TypeScript + ESLint) trong `web/` không có lỗi.
- [ ] Chạy `pnpm test` trong `web/` đạt 100%.
- [ ] Tài liệu `docs/n5-data-editorial-guide.md`, `docs/n5-manifest.md` và `web/src/data/n5/manifest.json` hoàn chỉnh.
- [ ] Không làm ảnh hưởng đến mã nguồn ứng dụng (UI, Dexie, Sync, Audio).
