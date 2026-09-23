# SPEC-10 — Trình phát Shadowing (A-B repeat)

> **Mã:** SPEC-JPN-F10 · **Trạng thái:** Draft · **Ngày:** 17/09/2026
> **Đối tượng đọc:** Google Stitch / Claude Design (mục 3–6), lập trình viên (toàn bộ).
> **Phụ thuộc:** SPEC-09 (blob audio trong Dexie — không có thì không có gì để phát),
> SPEC-03 (khối Audio ở cuối màn chi tiết bài — spec này lấp chỗ đó).

## 1. Mục tiêu & phạm vi

Nghe đi nghe lại một đoạn ngắn cho tới khi nói theo được. Cả tính năng gói gọn trong ba thứ:
lặp đoạn A-B, chỉnh tốc độ, ẩn/hiện transcript.

**Trong phạm vi**

- `ShadowingPlayer` — component dùng trong khối Audio của `/hoc/[so]`
- Chọn 1 trong 4 track của bài: Từ vựng · Mẫu câu · Câu ví dụ · Hội thoại
- Lặp A-B, tốc độ `0.75×` `0.85×` `1.0×` `1.2×`, bật/tắt transcript
- Phím tắt `Space` `[` `]` `R` `T` và mũi tên trái/phải (±10 giây)
- Phát trực tiếp từ Blob trong IndexedDB

**Ngoài phạm vi**

- Nạp audio — F09
- Waveform vẽ từ dữ liệu sóng thật. Dùng thanh tiến trình thường; giải mã toàn bộ track để vẽ
  sóng là vài chục MB RAM đổi lấy một đường trang trí
- Ghi âm giọng người học, so sánh phát âm, chấm điểm shadowing
- Phát nền khi chuyển trang, mini-player bám màn hình, Media Session trên màn hình khóa
- Nhiều mốc lặp, lưu mốc giữa các lần mở, danh sách phát
- Tự dò mốc câu trong track. Đĩa CD không có dữ liệu mốc thời gian, dò tự động là đoán mò

## 2. Dữ liệu

| Nguồn | Chiều | Dùng cho |
|---|---|---|
| `db.audioFiles` | Đọc `useLiveQuery` theo `lesson` | 4 track của bài đang mở |
| `src/data/n5/lessons/lesson-XX.json` | Đọc | Câu ví dụ làm transcript cho track `examples` |
| `useUIStore` | Đọc/ghi | `isPlaying`, `playbackRate`, `loopA`, `loopB`, `showTranscript` |
| `AppSettings.soundVolume` (SPEC-06) | Đọc | Âm lượng mặc định |

Năm trường trạng thái player **đã có sẵn** trong `web/src/lib/store.ts`. Dùng đúng chúng,
không thêm store mới, không bền hóa — mốc A-B là thứ thuộc về một lần nghe.

### 2.1. Nguồn phát

```ts
const url = URL.createObjectURL(record.blob);   // <audio src={url}>
// bắt buộc: URL.revokeObjectURL(url) khi đổi track hoặc unmount
```

Quên `revokeObjectURL` là rò bộ nhớ vài chục MB mỗi lần người dùng đổi track — trên điện thoại
sẽ thành tab bị hệ điều hành thu hồi giữa buổi học.

Không `fetch`, không dựng URL từ `public/`. Blob nằm sẵn trong IndexedDB.

### 2.2. Lặp A-B

Nghe `timeupdate` của `<audio>`: `currentTime >= B` thì `currentTime = A`.

> `ponytail: timeupdate bắn ~4 lần/giây nên điểm quay lại lệch tối đa ~250ms; đổi sang vòng
> requestAnimationFrame nếu người dùng thật sự thấy vướng`

Ràng buộc: `B > A + 0.5s`. Đặt B trước A thì **hoán đổi hai mốc** thay vì báo lỗi — đó là ý
định rõ ràng của người dùng, không phải sai sót cần dạy dỗ.

Đổi track thì xóa cả hai mốc. Mốc thời gian của track khác là vô nghĩa.

### 2.3. Tốc độ

`audio.playbackRate`. Trình duyệt hiện đại giữ nguyên cao độ (`preservesPitch` mặc định bật) —
không cần thư viện xử lý âm thanh. Tốc độ đang chọn tô nền `primary` (`DESIGN.md` §Components).

### 2.4. Transcript — nói thẳng phần chưa có

| Track | Transcript |
|---|---|
| `examples` (Câu ví dụ) | Có **câu ví dụ của bài**, nhưng chưa có bằng chứng chúng khớp track — xem dưới |
| `vocab`, `sentence_patterns`, `conversation` | **Chưa có nguồn trong repo** |

**Câu ví dụ trong JSON không phải transcript của track.** Dữ liệu `lesson-XX.json` là câu ví dụ
của điểm ngữ pháp; track `03_examples.mp3` của đĩa CD có thể chứa tập câu khác, khác thứ tự,
hoặc nhiều/ít hơn. Chưa ai đối chiếu.

Vì vậy, cho tới khi có người nghe và đối chiếu xong ít nhất một bài:

- Khối nội dung này mang nhãn **"Câu ví dụ của bài"**, không phải "Transcript".
- Có một dòng `muted`: "Chưa đối chiếu với nội dung track."
- Nút `T` đổi tên thành **Câu ví dụ**, giữ nguyên chức năng ẩn/hiện.
- Khi nào một bài được đối chiếu xong (`verification: 'verified'` ở cấp track, thêm vào dữ liệu
  audio sau này), bài đó mới được gọi là transcript.

Không tô sáng theo thời gian, không cuộn theo audio — cả hai đều ngầm khẳng định một sự khớp
chưa được chứng minh.

Với ba track chưa có transcript, nút T bị `disabled` kèm chữ "Chưa có transcript cho track
này". **Không sinh transcript bằng AI, không chép tay theo trí nhớ, không đoán theo audio** —
nội dung học phải truy vết được về sách (`AGENTS.md`). Soạn transcript hội thoại 25 bài là một
việc nội dung riêng, không thuộc spec này.

Transcript hiện dạng danh sách câu; **không** tô sáng theo thời gian — muốn tô sáng thì phải
có mốc thời gian từng câu, thứ chưa tồn tại.

## 3. Màn hình & bố cục

### 3.1. Vị trí

Khối cuối cùng của `/hoc/[so]`, đúng thứ tự cố định của SPEC-03 §3.2:
**Từ vựng → Ngữ pháp → Câu ví dụ → Audio**. Không thêm route mới, không mini-player bám đáy.

Bề rộng theo màn chi tiết bài: `max-w-2xl`.

### 3.2. Bố cục player

Ba tầng, đúng `DESIGN.md` §Components:

```
[Hàng chọn track: Từ vựng | Mẫu câu | Câu ví dụ | Hội thoại]

[Thanh tiến trình cao 48px, vùng chạm phủ hết chiều rộng]
   ├ vạch A và vạch B: hai vạch primary đặc
   └ vùng giữa A–B tô primary/15 khi lặp đang bật
[00:42 ───────────────────── 03:15]

[      ⟲10    ▶ (tròn 56px)    10⟳      ]

[0.75× 0.85× 1.0× 1.2×]  [Đặt A] [Đặt B] [Lặp] [Transcript]

[Transcript — danh sách câu ví dụ, mỗi câu có furigana + bản dịch]
```

Play/Pause tròn 56px ở giữa; lùi/tiến 10 giây 44px hai bên.

### 3.3. Ở mobile (390px)

Hàng điều khiển phụ xuống hai dòng: chip tốc độ một dòng, `Đặt A` / `Đặt B` / `Lặp` /
`Transcript` một dòng. **Không** thu nhỏ nút xuống dưới 48px để nhét vừa một dòng.

## 4. Component dùng lại

| Vai trò | Token component |
|---|---|
| Toàn bộ player | `DESIGN.md` §Components |
| Chọn track | `toggle-group` (đã có), kiểu `single` |
| Chip tốc độ | `toggle-group`, tốc độ đang chọn nền `primary` |
| Đặt A / Đặt B / Lặp / Transcript | `button-secondary`, trạng thái bật dùng `aria-pressed` |
| Play/Pause | `button-primary` bo tròn 56px |
| Khối transcript | `card` nền `muted` |
| Câu tiếng Nhật | component `Furigana` **đã có**, không viết parser mới |

Icon Lucide: `Play` · `Pause` · `RotateCcw` (lùi 10s) · `RotateCw` (tiến 10s) · `Repeat`
(lặp A-B) · `Captions` (transcript).

**Dùng `<audio>` gốc của trình duyệt**, ẩn control mặc định. Không thêm thư viện phát nhạc:
tua, đệm dữ liệu, giải mã, giữ cao độ khi đổi tốc độ — trình duyệt làm sẵn cả bốn.

## 5. Trạng thái

| Tình huống | Hiển thị |
|---|---|
| Bài chưa có track nào | Khối Audio thành lời mời: "Chưa nạp audio cho bài này" + nút sang `/cai-dat/audio`. **Không** ẩn hẳn khối — ẩn đi thì người dùng không biết tính năng tồn tại |
| Bài có 2/4 track | Chỉ hiện track có thật; track thiếu **không** hiện dạng `disabled` gây tưởng là lỗi |
| Đang nạp blob từ Dexie | `skeleton` đúng kích thước player, bố cục không nhảy |
| Blob hỏng, `<audio>` báo lỗi | "Không phát được track này" + gợi ý nạp lại gói ZIP. Các track khác vẫn dùng được |
| Chưa đặt mốc nào | Nút `Lặp` `disabled` + tooltip "Đặt mốc A và B trước" |
| Chỉ mới đặt A | Vạch A hiện, `Lặp` vẫn `disabled` |
| Lặp đang bật | Nút `Lặp` ở trạng thái bật (`aria-pressed="true"`), vùng A–B tô `primary/15` |
| Track không có transcript | Nút `Transcript` `disabled` + chữ lý do, không im lặng |
| Đổi track khi đang phát | Dừng, xóa mốc A-B, giữ nguyên tốc độ đang chọn |

Mọi phần tử bấm được đủ sáu trạng thái theo `DESIGN.md` §Interaction states.

## 6. Tương tác & chuyển động

**Phím tắt** (`project-design-spec.md` §7.4) — chỉ hoạt động khi player đang trong viewport và
focus không nằm trong ô nhập liệu:

| Phím | Hành động |
|---|---|
| `Space` | Play / Pause. `preventDefault` để trang không cuộn |
| `[` | Đặt mốc A tại vị trí hiện tại |
| `]` | Đặt mốc B tại vị trí hiện tại |
| `R` | Bật/tắt lặp A-B |
| `T` | Ẩn/hiện transcript |
| `←` `→` | Lùi / tiến 10 giây |

- Đặt mốc A hoặc B: vạch xuất hiện **tức thì**, kèm nhãn thời gian `01:12`. Không animate.
- Kéo thanh tiến trình: cập nhật vị trí theo ngón tay, phát lại từ chỗ thả.
- Đổi tốc độ: áp ngay, **không** dừng phát.
- Đang lặp mà chạm mốc B: quay lại A **không có tiếng "khục"** — chỉ đặt lại `currentTime`,
  không `pause()` rồi `play()`.
- Hoạt ảnh duy nhất là con trỏ thời gian chạy. Bọc trong `@media (prefers-reduced-motion:
  no-preference)`; khi giảm chuyển động, con trỏ nhảy theo giây thay vì trượt mượt.

## 7. Accessibility

- Mọi nút là `<button>` thật. `Đặt A`, `Đặt B` có nhãn chữ, không chỉ ký hiệu.
- Nút chuyển trạng thái (`Lặp`, `Transcript`) dùng `aria-pressed`, không chỉ đổi màu.
- Thanh tiến trình là `<input type="range">` gốc hoặc phần tử có `role="slider"` với
  `aria-valuenow` / `aria-valuetext` đọc thành "1 phút 12 giây trên 3 phút 15".
- Điều khiển được **hoàn toàn bằng bàn phím**: Tab tới thanh tiến trình rồi mũi tên để tua.
- Trạng thái phát/dừng thông báo qua `aria-live="polite"`, một lần mỗi lần đổi.
- Mốc A-B không chỉ là vạch màu: có nhãn thời gian chữ bên cạnh.
- Transcript là văn bản thật với `<ruby>`, chọn và copy được, screen reader đọc đúng.
- Vùng chạm ≥ 48×48px (Play 56px), cách nhau ≥ 8px. Focus ring 3px không tắt.
- Phím tắt là **lối tắt, không phải lối duy nhất** — mọi thao tác đều có nút bấm được.

## 8. Bảo mật & dữ liệu

Audio phát trực tiếp từ IndexedDB trên máy. Không streaming, không CDN, không `fetch` — player
chạy nguyên vẹn khi máy bay offline.

**Không có nút tải audio về.** Không dựng đường xuất file, không đặt blob URL vào thẻ có
`download`. Audio là tài sản có bản quyền của người dùng, ứng dụng chỉ phát, không phát tán.

`revokeObjectURL` khi đổi track và khi unmount — vừa là chuyện bộ nhớ, vừa để URL blob không
tồn tại lâu hơn mức cần.

Player **chỉ đọc** Dexie. Không ghi `reviewItems`, không tạo `practiceSessions`. Nghe shadowing
không tính là một lượt ôn tập — FSRS lên lịch theo kết quả trả lời, không theo thời gian nghe.

## 9. Tiêu chí nghiệm thu

- [ ] Nạp audio (F09) → mở `/hoc/3` → khối Audio hiện đủ 4 track và phát được
- [ ] Bài chưa có audio → khối Audio hiện lời mời nạp, **không** biến mất
- [ ] Đặt A tại 0:10, B tại 0:20, bật Lặp → audio quay lại 0:10 mỗi lần chạm 0:20, **không
      ngắt tiếng**
- [ ] Đặt B trước A → hai mốc tự hoán đổi, lặp vẫn chạy đúng
- [ ] Đổi tốc độ sang `0.75×` khi đang phát → chậm lại ngay, **cao độ giọng không đổi**, không
      bị dừng
- [ ] Đổi track → mốc A-B bị xóa, tốc độ giữ nguyên
- [ ] Đổi track 20 lần liên tiếp → bộ nhớ tab không tăng tuyến tính (kiểm tra DevTools ›
      Memory: `revokeObjectURL` chạy đúng)
- [ ] Phím `Space` `[` `]` `R` `T` và mũi tên hoạt động đúng; `Space` **không** cuộn trang
- [ ] Gõ vào một ô nhập trên cùng trang → phím tắt **không** cướp phím
- [ ] Track `examples` bật được khối "Câu ví dụ của bài" kèm dòng "chưa đối chiếu với nội dung
      track"; ba track còn lại nút `disabled` kèm lý do bằng chữ
- [ ] Không chỗ nào trong giao diện gọi khối đó là "transcript" khi chưa đối chiếu
- [ ] Toàn bộ thao tác làm được bằng bàn phím, không cần chuột
- [ ] **Tắt mạng hoàn toàn**: phát, tua, lặp đều chạy y hệt
- [ ] Bật "giảm chuyển động": con trỏ thời gian nhảy theo giây, mọi thông tin còn đủ
- [ ] Ở 390px: mọi nút ≥ 48px, hàng điều khiển xuống dòng thay vì bị bóp nhỏ
- [ ] `pnpm check` exit 0, `pnpm test` xanh (test: hoán đổi A/B, ràng buộc `B > A + 0.5s`,
      xóa mốc khi đổi track)

## 10. Khối lệnh bàn giao thiết kế

Dán nguyên khối dưới đây kèm `web/DESIGN.md` vào Stitch / Claude Design.

---

Nạp `DESIGN.md` làm hợp đồng token. Ba ràng buộc bắt buộc:

1. Chỉ dùng token màu theo tên (`bg-primary`, `text-muted-foreground`), **tuyệt đối không
   hardcode mã hex**.
2. Mobile-first: dựng bố cục 390px trước, rồi mới mở rộng lên 1024px.
3. Mọi chữ tiếng Nhật phải bọc trong phần tử có class `jp`.

Dựng trình phát audio luyện nghe shadowing của một app học tiếng Nhật, đặt trong một thẻ ở
cuối trang chi tiết bài học, bề rộng `max-w-2xl` (672px). Bố cục dọc bốn tầng:

**1. Hàng chọn track** — bốn lựa chọn: Từ vựng, Mẫu câu, Câu ví dụ, Hội thoại. Lựa chọn đang
mở tô nền `primary`.

**2. Thanh tiến trình cao 48px**, vùng chạm phủ hết chiều rộng. Trên thanh có **hai vạch đặc
màu `primary` đánh dấu mốc A và mốc B**, mỗi vạch kèm nhãn thời gian dạng `01:12` bằng chữ
(màu không bao giờ đứng một mình). Khi chế độ lặp đang bật, vùng giữa hai mốc tô `primary/15`.
Hai đầu thanh là thời gian hiện tại và tổng thời lượng.

**3. Hàng điều khiển chính** — nút Play/Pause **tròn 56px** ở giữa, hai bên là nút lùi 10 giây
và tiến 10 giây (44px).

**4. Hàng điều khiển phụ** — bốn chip tốc độ `0.75×` `0.85×` `1.0×` `1.2×` (chip đang chọn nền
`primary`), rồi bốn nút có nhãn chữ: "Đặt A", "Đặt B", "Lặp", "Transcript". Hai nút "Lặp" và
"Transcript" là nút bật/tắt, trạng thái bật phải nhìn thấy được **bằng cả hình dạng lẫn màu**.
Ở 390px hàng này xuống hai dòng — **không thu nhỏ nút xuống dưới 48px**.

Dưới player là **khối transcript** (nền `muted`, bo góc) chứa danh sách câu tiếng Nhật có
furigana kèm bản dịch tiếng Việt bên dưới mỗi câu.

Cần thêm ba trạng thái:

- *Chưa nạp audio cho bài này*: thay toàn bộ player bằng một lời mời điềm đạm và một nút dẫn
  sang màn nạp audio. Không phải thông báo lỗi.
- *Track không có transcript*: nút "Transcript" ở trạng thái `disabled` kèm một dòng chữ giải
  thích ngắn ngay cạnh.
- *Chưa đặt mốc*: nút "Lặp" `disabled` kèm gợi ý "Đặt mốc A và B trước".

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
