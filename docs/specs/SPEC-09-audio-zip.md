# SPEC-09 — Nạp audio đĩa CD từ file ZIP

> **Mã:** SPEC-JPN-F09 · **Trạng thái:** Draft · **Ngày:** 17/09/2026
> **Đối tượng đọc:** Google Stitch / Claude Design (mục 3–6), lập trình viên (toàn bộ).
> **Phụ thuộc:** SPEC-06 (màn Cài đặt — spec này lấp lối vào đã chừa).
> **Chặn:** SPEC-10 (Shadowing Player không có gì để phát nếu chưa có spec này).

## 1. Mục tiêu & phạm vi

Người học tự sở hữu đĩa CD Minna no Nihongo I, tự đóng gói thành ZIP, tự nạp vào máy mình.
Không có file audio nào đi kèm ứng dụng. Spec này dựng đường nạp đó, và dựng nó sao cho một
gói ZIP hỏng không âm thầm thay mất bộ audio đang dùng tốt.

**Trong phạm vi**

- `/cai-dat/audio` — nạp, xem tình trạng, gỡ bộ audio
- `web/src/workers/audio-import.worker.ts` — giải nén + băm SHA-256 trong Web Worker
- Đối chiếu `manifest.json` trong gói, băm **từng file**
- Ghi `db.audioFiles` theo lô, báo tiến độ thật
- Quy ước `audioFiles.id` và ánh xạ track ↔ bài học

**Ngoài phạm vi**

- Trình phát Shadowing A-B — F10. Spec này chỉ đảm bảo blob nằm đúng chỗ
- Đổi dạng bài `listening` sang dùng audio CD — **không làm, xem §2.4**
- Tự tạo file ZIP hộ người dùng, tự tải audio từ bất kỳ nguồn nào trên mạng
- Đồng bộ audio lên Supabase — F08 đã loại trừ dứt khoát
- Cắt track theo từng câu, dò mốc thời gian tự động

## 2. Dữ liệu

| Nguồn | Chiều | Dùng cho |
|---|---|---|
| File ZIP người dùng chọn | Đọc một lần | Đầu vào duy nhất |
| `db.audioFiles` | Đọc `useLiveQuery`, ghi theo lô | Blob audio, nguồn sự thật |
| `navigator.storage.estimate()` | Đọc | Hiện dung lượng còn lại trước khi nạp |

### 2.1. Cấu trúc gói ZIP

Đúng theo `project-design-spec.md` §5.1:

```
minna-audio/
├── L01/
│   ├── 01_vocab.mp3
│   ├── 02_sentence_patterns.mp3
│   ├── 03_examples.mp3
│   └── 04_conversation.mp3
├── L02/ …
└── manifest.json
```

`manifest.json` là map `đường dẫn → sha256 hex`. Đọc và kiểm tra manifest **trước tiên**:
thiếu manifest → từ chối cả gói, không đoán mò theo tên file.

Đường dẫn hợp lệ phải khớp `L(\d{2})/(\d{2})_(vocab|sentence_patterns|examples|conversation)\.mp3`.
Entry ngoài mẫu này bị bỏ qua — kể cả khi manifest có liệt kê. Đây là lớp chặn đường dẫn kiểu
`../` và những thứ không phải audio lọt vào IndexedDB.

### 2.1a. Hash chứng minh được gì, và không chứng minh được gì

`manifest.json` nằm **trong chính gói ZIP**, nên nó chỉ chứng minh **tính toàn vẹn nội bộ**:
các file trong gói đúng bằng những file người tạo gói đã băm. Đổi nội dung audio rồi tính lại
hash thì gói vẫn hợp lệ. Nó **không** chứng minh đúng ấn bản, đúng bài, đúng track.

Ba việc làm được, làm đủ, và nói đúng những gì đã làm:

1. **Kiểm cấu trúc**: đủ 25 thư mục `L01…L25`, mỗi thư mục tối đa 4 track theo đúng tên chuẩn.
   Thiếu thì báo thiếu ở đâu; thừa thì bỏ qua.
2. **Ghi nhớ lần nạp đầu (trust-on-first-use)**: lưu hash của từng track. Lần nạp sau, track
   nào có hash khác hash đã lưu sẽ hiện cảnh báo "track này khác bản đã nạp trước đây" và hỏi
   người dùng có thay không. Đây là thứ phát hiện được gói lẫn lộn giữa các ấn bản.
3. **Nói đúng sự thật trên giao diện**: "Đã kiểm toàn vẹn gói · **chưa xác minh ấn bản**". Không
   dùng chữ "đã xác thực" trống nghĩa.

Không có bảng hash tham chiếu đáng tin nào trong repo, và **không bịa ra một bảng** — hash của
đĩa CD gốc không phải thứ suy đoán được.

### 2.1b. Giới hạn tài nguyên — bắt buộc kiểm trước khi giải nén

Web Worker không treo giao diện, nhưng nó vẫn ăn RAM chung và vẫn làm tab bị hệ điều hành thu
hồi. Bốn hạn mức, kiểm **trước** khi đọc nội dung entry:

| Hạn mức | Giá trị | Vi phạm thì |
|---|---|---|
| Kích thước file ZIP | 2 GB | Từ chối ngay khi chọn file, không mở worker |
| Số entry trong gói | 200 | Từ chối cả gói |
| Tổng dung lượng sau giải nén | 4 GB | Từ chối cả gói (đọc `uncompressedSize` của JSZip, không cần giải nén) |
| Một file | 100 MB | Bỏ qua entry đó, ghi vào danh sách hỏng |

Thêm một chặn **tỉ lệ nén**: entry nào có `uncompressedSize / compressedSize > 100` thì từ chối
cả gói — mp3 đã nén sẵn, tỉ lệ đó chỉ xuất hiện ở gói được dựng để làm nổ bộ nhớ.

Bộ nhớ đang giữ: **tối đa 20 blob cùng lúc**. Ghi xong một lô thì thả tham chiếu trước khi đọc
lô kế; không gom cả 100 track rồi mới ghi.

### 2.2. Bản ghi `audioFiles`

Kiểu `AudioFileRecord` đã có sẵn trong `web/src/types/index.ts`, không sửa:

| Trường | Giá trị |
|---|---|
| `id` | Đường dẫn chuẩn hóa trong gói: `L01/04_conversation.mp3` |
| `lesson` | Số bài lấy từ `L01` → `1` |
| `type` | `vocab` · `sentence_patterns` · `examples` · `conversation` |
| `blob` | `new Blob([buffer], { type: 'audio/mpeg' })` |
| `size`, `sha256` | Kích thước byte và hash đã đối chiếu |

**Audio là của cả bài, không của từng từ.** Đĩa CD gốc là bốn track liền mạch cho mỗi bài,
không có mốc thời gian cho từng câu. Vì vậy không có `audioKey` ở cấp từ vựng hay câu ví dụ —
và hiện dữ liệu trong `web/src/data/n5/` cũng không có trường đó ở đâu cả.

### 2.3. Luồng nạp

```
[Chọn file]
   → main thread: mở File, postMessage sang worker
   → worker: JSZip.loadAsync → đọc manifest → duyệt từng entry
        • băm SHA-256 từng file (crypto.subtle)
        • khớp → đẩy vào lô; lệch → ghi vào danh sách hỏng
        • postMessage tiến độ sau mỗi file
   → main thread: nhận từng lô ~20 blob → db.audioFiles.bulkPut
   → xong: báo cáo "đã nạp n file · bỏ qua m file hỏng"
```

**Giải nén và băm bắt buộc nằm trong Web Worker.** Bộ CD vài trăm MB băm trên main thread sẽ
treo giao diện hàng chục giây và trình duyệt sẽ báo trang không phản hồi.

**Không gọi worker, không giải nén bên trong transaction Dexie.** Blob chuẩn bị xong hết rồi
mới ghi; ghi theo lô ~20 file để không giữ transaction IndexedDB quá lâu.

> **Ngoại lệ có chủ đích với quy tắc "import phải atomic" trong `AGENTS.md`.** Nạp audio ghi
> theo nhiều lô, mỗi lô một transaction, và lỗi ở lô thứ tư **không** cuộn lại ba lô đầu. Lý do:
> (a) một transaction ôm vài trăm MB blob là cách chắc chắn nhất để hỏng nửa chừng; (b) audio
> là tài nguyên **thay thế được** — nạp lại gói ZIP là xong, khác hẳn dữ liệu học không có bản
> thứ hai. Quy tắc atomic vẫn áp **nguyên vẹn** cho `reviewItems` / `practiceSessions`
> (SPEC-04, SPEC-06). Mỗi lô là một checkpoint: giao diện luôn hiện đúng số track thật sự đã có.

**Băm từng file, không băm cả gói.** Hai gói ZIP cùng nội dung vẫn khác hash nếu khác thứ tự
entry hay mức nén; ngược lại một hash tổng không cho biết file nào hỏng
(`project-design-spec.md` §5.1).

**File hỏng bị bỏ qua, phần còn lại vẫn nạp.** Một track lỗi không được chặn 99 track lành.

**Nạp lại lần hai là ghi đè theo `id`.** `bulkPut` trên cùng `id` thay blob cũ — chỉ thay
những file **đã băm khớp**. Bộ audio đang dùng tốt không bao giờ bị xóa trước khi có bản thay
thế hợp lệ; không có bước `clear()` nào trong luồng nạp.

### 2.4. Vì sao dạng bài `listening` vẫn dùng TTS

SPEC-01 §5 đổi `availableAudioKeys` sang nghĩa "máy có giọng `ja-JP`". Spec này **không đổi
lại**. Track CD là audio liền mạch của cả bài, không có mốc thời gian từng câu, nên không cắt
ra được thành câu hỏi nghe chép chính tả. Muốn dùng audio thật cho dạng 5 thì phải có dữ liệu
mốc thời gian từng câu — đó là việc soạn nội dung, không phải việc của spec này.

Audio CD phục vụ hai chỗ: khối Audio ở màn chi tiết bài (SPEC-03 §3) và Shadowing Player (F10).

## 3. Màn hình & bố cục

### 3.1. `/cai-dat/audio`

Bề rộng `max-w-2xl`.

**Chưa nạp gì**

```
[H1 "Audio đĩa CD"]
[Khối giải thích]
  Ứng dụng không kèm file audio. Bạn tự đóng gói audio từ đĩa CD Minna no Nihongo I
  mà bạn sở hữu thành một file ZIP theo cấu trúc dưới đây, rồi nạp vào máy này.
  [Khối cấu trúc thư mục mẫu — nền muted, chữ mono]
  Dòng nhỏ: "File audio nằm lại trên máy bạn, không được tải lên đâu cả."
[Chọn file ZIP]   ← nút secondary cỡ quiz
[Dòng dung lượng: "Còn trống khoảng 4,2 GB"]
```

**Đã nạp**

```
[Thẻ tổng quan: "100 track · 25/25 bài · 412 MB"]
[Lưới 25 ô bài — ô đủ 4 track tô đậm, ô thiếu track hiện số "2/4"]
[Nạp lại từ file ZIP khác]   [Gỡ toàn bộ audio]
```

Lưới 25 ô thay cho danh sách 100 dòng: người dùng chỉ cần biết **bài nào thiếu**, không cần
đọc tên từng file.

### 3.2. Trong lúc nạp

Khối tiến độ chiếm chỗ của nút chọn file, **không** phải hộp thoại đè lên:

```
[progress 47%]
"Đang kiểm tra L12/03_examples.mp3 — 47 / 100 file"
[Hủy]
```

Bấm Hủy: dừng worker, **giữ lại những file đã nạp xong**. Không rollback — người dùng có 47
track dùng được thì tốt hơn là không có gì.

### 3.3. Kết quả

```
[Đã nạp 98 track vào máy]
[Nếu có lỗi: khối warning "2 file không khớp mã kiểm tra và đã bị bỏ qua"]
  L07/02_sentence_patterns.mp3
  L19/04_conversation.mp3
  → "Hãy tạo lại gói ZIP cho hai file này rồi nạp lại."
```

### 3.4. Gỡ toàn bộ audio

`alert-dialog`, nêu rõ dung lượng sẽ giải phóng và rằng Shadowing sẽ ngừng hoạt động cho tới
khi nạp lại. Không cần gõ chữ xác nhận — audio nạp lại được từ đĩa CD, khác với tiến độ học.

## 4. Component dùng lại

| Vai trò | Token component |
|---|---|
| Khối giải thích, thẻ tổng quan | `card` |
| Ô bài trong lưới 25 ô | `card` nhỏ + `badge` số track |
| Thanh tiến độ | `progress` |
| Chọn file | `<input type="file" accept=".zip">` gốc, ẩn sau `button-secondary` cỡ `quiz` |
| Xác nhận gỡ | `alert-dialog` |
| Khối lỗi | `card` viền `warning`, icon `<TriangleAlert />` **và** chữ |

Icon Lucide: `FileArchive` · `CircleCheck` · `TriangleAlert` · `Trash2`.

Không thêm thư viện. `jszip` đã có trong `package.json`; băm dùng `crypto.subtle` gốc của
trình duyệt.

## 5. Trạng thái

| Tình huống | Hiển thị |
|---|---|
| File không phải ZIP | "File này không phải ZIP" — kiểm tra ngay khi chọn, trước khi mở worker |
| ZIP thiếu `manifest.json` | Từ chối cả gói, kèm khối hướng dẫn cấu trúc đúng. Không đoán theo tên file |
| `manifest.json` sai định dạng | Cùng cách xử lý trên |
| Toàn bộ file lệch hash | "Không file nào khớp mã kiểm tra" + gợi ý gói ZIP bị tạo sai. Dữ liệu cũ **giữ nguyên** |
| Một phần lệch hash | Nạp phần khớp, liệt kê phần hỏng theo tên |
| Hết quota IndexedDB giữa chừng | Dừng, giữ những file đã ghi, nêu số MB thiếu và gợi ý nạp từng nửa bộ |
| Trình duyệt tự dọn dữ liệu (eviction) | Lưới 25 ô tự hiện thiếu ở lần mở sau. Nêu rõ: "Trình duyệt đã xóa bớt dữ liệu để lấy chỗ" + nút nạp lại |
| Đang nạp, người dùng rời trang | Cảnh báo `beforeunload`. Rời thật thì giữ phần đã ghi |
| Đang nạp | Khóa nút chọn file, không khóa cả app — người dùng vẫn học được ở tab này |

Mọi phần tử bấm được đủ sáu trạng thái theo `DESIGN.md` §Interaction states.

## 6. Tương tác & chuyển động

- Tiến độ cập nhật theo **từng file thật**, không phải thanh chạy giả. Thanh giả ở một thao
  tác kéo dài vài phút là nói dối người dùng.
- Số phần trăm và tên file đang xử lý luôn đi cùng nhau — chỉ một con số thì không ai biết còn
  bao lâu.
- `progress` là phần tử duy nhất chuyển động trong màn này. Bọc trong
  `@media (prefers-reduced-motion: no-preference)`; khi giảm chuyển động, thanh vẫn cập nhật
  theo bước, chỉ bỏ hiệu ứng trượt.
- Không tự phát thử một track sau khi nạp xong.

## 7. Accessibility

- Nút chọn file là `<button>` thật gắn với `<input type="file">` ẩn, có `<label>` liên kết —
  không phải `div` bắt sự kiện.
- Tiến độ dùng `role="progressbar"` với `aria-valuenow`, và một vùng `aria-live="polite"` báo
  mốc chẵn (25%, 50%, 75%, xong) — **không** báo từng file, sẽ thành tiếng ồn.
- Danh sách file hỏng là danh sách chữ thật, đọc được, không chỉ tô đỏ.
- Lưới 25 ô: mỗi ô có `aria-label` "Bài 7, 4 trên 4 track"; ô thiếu không chỉ khác màu mà có
  chữ "2/4".
- `alert-dialog` bẫy focus, `Esc` đóng, focus trả về nút đã mở.
- Vùng chạm ≥ 48×48px, focus ring 3px không tắt.

## 8. Bảo mật & dữ liệu

**Không file audio nào đi kèm ứng dụng.** Không đưa audio nguồn vào bundle, vào `public/`,
vào cloud storage, vào file export JSON của SPEC-06. Người dùng nạp audio mà mình sở hữu, và
nó nằm lại trên máy mình — đây là điều kiện để dự án không đụng bản quyền.

File ZIP là **đầu vào không tin cậy**: kiểm tra manifest, kiểm tra mẫu đường dẫn, băm từng
file. Entry có đường dẫn lạ (`../`, đường dẫn tuyệt đối, tên ngoài mẫu) bị loại trước khi giải
nén nội dung.

`duration` của file audio **không thay thế được việc đối chiếu hash**. Hai file cùng độ dài
vẫn có thể là hai nội dung khác nhau; chỉ hash mới trả lời được câu hỏi "đúng file không".

Không gọi mạng trong toàn bộ luồng nạp. Worker không `fetch`, không gửi tên file đi đâu.

Ghi đè chỉ xảy ra với file đã băm khớp. Không có `clear()` trong luồng nạp — mọi thao tác xóa
đều phải do người dùng bấm ở §3.4.

## 9. Tiêu chí nghiệm thu

- [ ] Nạp một gói ZIP đúng chuẩn 100 track → `db.audioFiles` có đủ 100 bản ghi với `sha256`
      khớp manifest, kiểm tra trong DevTools › IndexedDB
- [ ] Trong lúc nạp, **giao diện vẫn cuộn và bấm được** (worker chạy đúng, không phải main
      thread)
- [ ] Sửa 1 byte trong một file mp3 rồi đóng gói lại → đúng file đó bị báo hỏng và **bị bỏ
      qua**, 99 file kia vẫn vào
- [ ] Gói ZIP thiếu `manifest.json` → từ chối, `audioFiles` không đổi một bản ghi nào
- [ ] Gói ZIP có entry `../evil.mp3` → entry bị loại, không ghi vào Dexie
- [ ] Gói ZIP 3 GB → **từ chối ngay khi chọn file**, worker không được khởi động
- [ ] Gói ZIP chứa một entry nén tỉ lệ > 100× → từ chối cả gói, bộ nhớ tab không tăng vọt
- [ ] Gói thiếu bài L07 → báo rõ "thiếu bài 7", phần còn lại vẫn nạp
- [ ] Nạp gói thứ hai có một track khác nội dung (hash khác bản đã lưu) → **hỏi trước khi
      thay**, không im lặng ghi đè
- [ ] Giao diện ghi đúng "đã kiểm toàn vẹn gói, chưa xác minh ấn bản" — không dùng chữ "đã
      xác thực" trống nghĩa
- [ ] Nạp 100 track trên máy 4 GB RAM → tab không bị thu hồi; số blob giữ đồng thời ≤ 20
- [ ] Nạp lại gói ZIP khác khi đã có audio → chỉ file khớp hash bị ghi đè, **không mất** những
      bài không có trong gói mới
- [ ] Bấm Hủy giữa chừng → dừng ngay, số track đã nạp giữ nguyên và hiện đúng ở lưới 25 ô
- [ ] Nạp khi **tắt mạng hoàn toàn** → chạy y hệt
- [ ] Gỡ toàn bộ audio → `audioFiles` rỗng, `reviewItems` và `practiceSessions` **không đụng
      tới**
- [ ] File export JSON của SPEC-06 **không** chứa byte audio nào
- [ ] Đúng **một** nút `default` trên trang
- [ ] `pnpm check` exit 0, `pnpm test` xanh (test: khớp mẫu đường dẫn, phân tách track hợp
      lệ/không hợp lệ, ánh xạ `L07/03_examples.mp3` → `lesson: 7`, `type: 'examples'`)

## 10. Khối lệnh bàn giao thiết kế

Dán nguyên khối dưới đây kèm `web/DESIGN.md` vào Stitch / Claude Design.

---

Nạp `DESIGN.md` làm hợp đồng token. Ba ràng buộc bắt buộc:

1. Chỉ dùng token màu theo tên (`bg-primary`, `text-muted-foreground`), **tuyệt đối không
   hardcode mã hex**.
2. Mobile-first: dựng bố cục 390px trước, rồi mới mở rộng lên 1024px.
3. Mọi chữ tiếng Nhật phải bọc trong phần tử có class `jp`.

Dựng màn hình "Audio đĩa CD" của một app học tiếng Nhật, bề rộng tối đa `max-w-2xl` (672px).
Cần bốn trạng thái của cùng màn hình này:

**A. Chưa nạp audio** — một khối giải thích điềm đạm nói rằng ứng dụng không kèm file audio và
người dùng tự nạp bộ audio mình sở hữu; bên trong có một khối cấu trúc thư mục mẫu (nền
`muted`, chữ đều nét, bo góc); một nút phụ cao 48px "Chọn file ZIP" có icon file nén; một dòng
nhỏ màu mờ ghi dung lượng trống còn lại; và một dòng trấn an "File audio nằm lại trên máy bạn,
không được tải lên đâu cả."

**B. Đang nạp** — khối tiến độ **thay chỗ** nút chọn file (không phải hộp thoại đè lên màn
hình): một thanh tiến độ, một dòng chữ ghi **cả phần trăm lẫn tên file đang xử lý** và số thứ
tự dạng "47 / 100 file", cùng một nút "Hủy" kiểu ghost.

**C. Đã nạp xong** — một thẻ tổng quan ghi "100 track · 25/25 bài · 412 MB"; một **lưới 25 ô
vuông** đại diện 25 bài học, ô đủ bốn track tô nền đậm hơn và có dấu tích, ô thiếu track hiện
chữ "2/4" (khác biệt bằng **chữ**, không chỉ bằng màu); dưới cùng là hai nút "Nạp lại từ file
ZIP khác" và "Gỡ toàn bộ audio".

**D. Có file hỏng** — giống C nhưng thêm một khối cảnh báo viền `warning` có **cả icon tam
giác lẫn tiêu đề chữ**, liệt kê tên các file không khớp mã kiểm tra và một câu hướng dẫn tạo
lại gói ZIP cho riêng những file đó. Khối này mang giọng bình tĩnh, không phải giọng báo lỗi
nghiêm trọng — phần còn lại đã nạp thành công.

Mọi phần tử bấm được cần đủ sáu trạng thái: Mặc định, Hover (chỉ khi `(hover: hover)`), Focus
(ring 3px, không bao giờ tắt), Active (dịch xuống 1px), Disabled (`opacity-50`), Loading.
Vùng chạm tối thiểu 48×48px.

Trang chừa `pb-24` cho thanh nav đáy. Hoạt ảnh bọc trong `@media (prefers-reduced-motion:
no-preference)`, 150ms `ease-out`.

Cần cả chế độ sáng và tối.

---

> **Không** dùng file Stitch export để ghi đè `web/src/app/globals.css`. Bản export đổi màu
> về hex, bỏ toàn bộ chế độ tối, và mất lớp `@theme inline` — chính là thứ cho phép class
> `.dark` ghi đè token lúc chạy (`DESIGN.md` §What this file is).
