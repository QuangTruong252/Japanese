# SPEC-06 — Cài đặt, Export & Import dữ liệu

> **Mã:** SPEC-JPN-F06 · **Trạng thái:** Completed (đã nghiệm thu trình duyệt 22/09/2026) · **Handoff:** [SPEC-06](../handoff/SPEC-06.md)
> **Đối tượng đọc:** Google Stitch / Claude Design (mục 3–6), lập trình viên (toàn bộ).
> **Phụ thuộc:** SPEC-02 (lối vào mục Cài đặt, script chống FOUC — spec này **sửa** script đó).

## 1. Mục tiêu & phạm vi

SPEC-02 áp cài đặt lên `<html>`, SPEC-05 đọc `dailyNewLimit` — nhưng chưa có nơi nào sửa được
chúng. Spec này dựng nơi đó, và dựng đường thoát dữ liệu duy nhất trước khi Supabase có mặt.

**Trong phạm vi**

- `/cai-dat` — màn hình cài đặt
- `src/lib/settings.ts` — kiểu `AppSettings`, giá trị mặc định, đọc/ghi `localStorage`
- Sáu cài đặt: hiện furigana · cỡ furigana · ẩn bản dịch · giao diện sáng/tối · âm lượng TTS ·
  số mục mới mỗi ngày
- Export toàn bộ tiến độ ra một file JSON
- Import lại file JSON đó, hai chế độ: **Gộp** và **Thay thế**
- Vùng nguy hiểm: xóa toàn bộ dữ liệu trên máy

**Ngoài phạm vi**

- Đăng nhập, đồng bộ, avatar — F08. Spec này chỉ chừa một khối trống có tiêu đề "Tài khoản"
- Nạp audio ZIP — F09. Chừa lối vào cùng cách
- Mọi biểu đồ, số liệu thống kê — F07
- Đổi ngôn ngữ giao diện. App chỉ có tiếng Việt, không dựng cơ chế i18n cho một ngôn ngữ

## 2. Dữ liệu

| Nguồn | Chiều | Dùng cho |
|---|---|---|
| `localStorage` khóa `jp:settings` | Đọc/ghi | Toàn bộ `AppSettings`, một object JSON duy nhất |
| `useUIStore` | Đọc/ghi | Bản sao trong phiên của cùng các giá trị đó |
| `db.reviewItems`, `db.practiceSessions` | Đọc (export), ghi (import) | Tiến độ học |
| `db.audioFiles` | **Không đụng tới** | Blob audio không vào file export, không bị import xóa |
| `db.pendingSync` | Ghi khi import/xóa | Để F08 biết dữ liệu cục bộ đã đổi |

### 2.1. `AppSettings`

Tên trường lấy **đúng theo `profiles.settings` JSONB** của `project-design-spec.md` §3.2, để
F08 đẩy nguyên object lên Supabase mà không cần một lớp ánh xạ tên:

```ts
export interface AppSettings {
  furigana: boolean;          // true = hiện
  furiganaSize: 'normal' | 'large';
  hideTranslations: boolean;  // đúng cái SPEC-03 gọi là Study Mode
  theme: 'light' | 'dark' | 'system';
  soundVolume: number;        // 0…1
  dailyNewLimit: number;      // 1…100, mặc định 20
}
```

> **Đổi tên ba trường trong `store.ts`.** Hiện store dùng `furiganaVisible` / `studyMode`.
> Đổi thành `furigana` / `hideTranslations` ngay trong spec này. Giữ hai bộ tên đồng nghĩa là
> tự chuốc một hàm ánh xạ hai chiều mà F08 sẽ phải đọc lại mỗi lần sửa.

### 2.2. Một khóa `localStorage`, không phải sáu

SPEC-02 §6 nói ba cài đặt hiển thị nằm trong `localStorage`. Chốt lại ở đây: **một khóa
`jp:settings` chứa cả sáu**, vì script chống FOUC phải đọc đồng bộ trước paint — đọc một khóa
và `JSON.parse` một lần rẻ hơn sáu lần `getItem`.

Script chống FOUC (SPEC-02 §6) **mở rộng thêm theme**: ngoài `hide-furigana`, `furigana-large`,
`hide-translations`, nó gắn thêm class `dark` khi `theme === 'dark'`, hoặc khi
`theme === 'system'` và `matchMedia('(prefers-color-scheme: dark)')` khớp.

Đọc hỏng (JSON lỗi, thiếu trường, sai kiểu) → **dùng mặc định cho riêng trường đó**, không
vứt cả object. Người dùng mất một cài đặt còn hơn mất cả sáu.

### 2.3. Định dạng file export

```ts
interface ExportFile {
  schemaVersion: 1;
  exportedAt: string;        // ISO 8601
  app: 'minna-n5';
  settings: AppSettings;
  reviewItems: ReviewItem[];
  practiceSessions: PracticeSession[];
}
```

Tên file: `minna-tien-do-YYYY-MM-DD.json`.

**Không có audio trong file export.** Blob đĩa CD là dữ liệu có bản quyền và nặng hàng trăm MB;
mỗi thiết bị tự nạp ZIP một lần (F09). Nêu rõ điều này ngay trên màn hình, kẻo người dùng tưởng
đã sao lưu xong rồi xóa ZIP gốc.

`dueAt` là `Date` trong Dexie nhưng là chuỗi ISO sau khi `JSON.stringify`. Import **phải** dựng
lại thành `Date`, nếu không index `dueAt` sẽ so sánh chuỗi với `Date` và hàng đợi ôn tập hôm
sau sẽ trống trơn mà không báo lỗi gì.

### 2.4. Import

Ba bước, **theo đúng thứ tự này**:

1. Đọc file, `JSON.parse`, kiểm tra `schemaVersion` và từng bản ghi — **toàn bộ ngoài
   transaction Dexie**.
2. Bản ghi không hợp lệ bị **bỏ qua và đếm lại**, không làm hỏng cả lần import. Hiện số bỏ qua
   trong kết quả.
3. Ghi trong **một transaction duy nhất**:

```ts
await db.transaction('rw', db.reviewItems, db.practiceSessions, db.pendingSync, async () => {
  // 'replace': clear() hai bảng trước
  // 'merge'  : bulkPut, mục trùng targetId lấy bản có updatedAt mới hơn
  // pendingSync.add({ payload: { v: 1, kind: 'import', reviewItems, sessions,
  //                              replaced: mode === 'replace' },
  //                   userId, createdAt: Date.now() })
});
```

Payload gửi kèm **cả `sessions`**, không chỉ `reviewItems` (SPEC-08 §2.1). Nhập lại lịch sử
phiên mà không đẩy lên thì thống kê trên máy và trên tài khoản sẽ lệch mãi mãi.

**Chế độ Thay thế khi file có bản ghi hỏng:** validate **toàn bộ** file xong mới quyết định.

- Không còn bản ghi hợp lệ nào → **không xóa gì cả**, báo lỗi và dừng.
- Còn bản ghi hợp lệ → hộp xem trước phải hiện số hỏng **trước** khi người dùng bấm Nhập, và
  câu xác nhận nói rõ: "Xóa 1.204 mục hiện có, thay bằng 1.168 mục từ file (12 bản ghi hỏng bị
  bỏ qua)". Người dùng phải biết mình đang đánh đổi cái gì lấy cái gì.
- `clear()` và `bulkPut` nằm trong **cùng** transaction — không bao giờ có khoảnh khắc dữ liệu
  cũ đã mất mà dữ liệu mới chưa vào.

Chế độ **Gộp** giải xung đột bằng `updatedAt` mới hơn thắng — cùng luật last-write-wins của
`project-design-spec.md` §4.3.6, không nghĩ ra luật thứ hai cho cùng một bài toán.

Transaction lỗi → Dexie tự rollback, dữ liệu cũ còn nguyên. Đây là lý do bước 1 và 2 phải nằm
ngoài: parse trong transaction sẽ giữ transaction mở suốt thời gian đọc file.

## 3. Màn hình & bố cục

### 3.1. `/cai-dat`

Bề rộng `max-w-2xl` (672px). Các nhóm ngăn bằng `separator`, mỗi nhóm một tiêu đề H2.

```
[H1 "Cài đặt"]

[Nhóm "Hiển thị"]
  Hiện furigana                        [toggle]
  Cỡ furigana                          [Thường | Lớn]
  Ẩn bản dịch khi đọc bài              [toggle]
  Giao diện                            [Sáng | Tối | Theo hệ thống]
  [Ô xem trước: một câu tiếng Nhật có furigana + bản dịch]

[Nhóm "Học tập"]
  Số mục mới mỗi ngày        20        [— 20 +]  ← ảnh hưởng /on-tap
  Âm lượng phát âm                     [thanh trượt]

[Nhóm "Dữ liệu"]
  [Xuất file JSON]   "Gồm tiến độ ôn tập và lịch sử luyện tập. Không gồm audio."
  [Nhập từ file]     → mở hộp thoại xem trước
  Dòng trạng thái: "1.204 mục ôn tập · 87 phiên luyện tập trên máy này"

[Nhóm "Tài khoản"]   ← khối chờ F08: một dòng chữ "Đồng bộ đa thiết bị — sắp có"

[Vùng nguy hiểm]
  [Xóa toàn bộ dữ liệu]  viền destructive
```

### 3.2. Hộp thoại xem trước khi nhập

`dialog`, mở sau khi chọn file và parse xong:

```
[Tiêu đề "Nhập từ minna-tien-do-2026-09-10.json"]
[Bảng tóm tắt: 1.180 mục ôn tập · 84 phiên · xuất ngày 10/09/2026]
[Cảnh báo nếu có: "12 bản ghi không đọc được, sẽ bỏ qua"]
[Chọn chế độ — hai ô chọn, mặc định Gộp]
   ( ) Gộp — giữ dữ liệu hiện có, mục trùng lấy bản mới hơn
   ( ) Thay thế — xóa toàn bộ dữ liệu hiện có trước khi nhập
[Hủy]  [Nhập]
```

Chọn **Thay thế** rồi bấm Nhập → thêm một `alert-dialog` xác nhận nữa. Hai bước cho một thao
tác không hoàn tác được là đúng mức, không phải thừa.

### 3.3. Xóa toàn bộ dữ liệu

`alert-dialog`. Liệt kê đúng những gì sẽ mất (mục ôn tập, phiên luyện tập, audio đã nạp) và
gợi ý xuất file trước. Nút xác nhận chỉ bật sau khi người dùng gõ đúng chữ `XÓA`.

**Hai phạm vi xóa, và phải hỏi rõ khi đã đăng nhập** (SPEC-08 §2.6):

```
( ) Chỉ xóa trên máy này
    Dữ liệu trên tài khoản vẫn còn và sẽ được tải lại ở lần đồng bộ kế tiếp.
( ) Xóa cả trên tài khoản
    Xóa trên mọi thiết bị. Không hoàn tác được.
```

Chưa đăng nhập thì không hỏi — chỉ có một phạm vi, và nói rõ dữ liệu chỉ nằm trên máy này.

Hai việc bắt buộc làm kèm, ở **cả hai** phạm vi:

1. **Xóa sạch `pendingSync`.** Giữ lại hàng đợi cũ là giữ lại chính những bản ghi vừa xóa; lần
   kết nối sau chúng sẽ được đẩy lên và dữ liệu "sống lại".
2. **Đặt lại `jp:lastPulledAt`**, để lần kéo delta kế tiếp không bắt đầu từ một mốc đã vô nghĩa.

Xóa dữ liệu học **không** đụng `audioFiles` trừ khi người dùng tick thêm — audio nặng và nạp
lại mất công, đừng gộp vào cùng một nút.

## 4. Component dùng lại

| Vai trò | Token component |
|---|---|
| Khối nhóm cài đặt | `card` |
| Bật/tắt một cài đặt | `toggle` (đã có) với `aria-pressed` |
| Chọn cỡ furigana, giao diện | `toggle-group` (đã có), kiểu `single` |
| Số mục mới mỗi ngày | `input` (đã có), `type="number"`, `min=1 max=100` |
| Âm lượng | `<input type="range">` **gốc của trình duyệt**, không dựng slider riêng |
| Xem trước nhập | `dialog` · xác nhận phá hủy: `alert-dialog` |
| Nút xuất / nhập | `button-secondary` cỡ `quiz` |
| Nút xóa dữ liệu | `button` biến thể `destructive` |

**Không thêm component mới từ registry.** Mười lăm component trong `web/src/components/ui/`
đủ cho màn hình này; `toggle` với `aria-pressed` là một công tắc hợp lệ với screen reader.

Icon Lucide: `Download` (xuất) · `Upload` (nhập) · `Trash2` (xóa) · `TriangleAlert` (vùng nguy
hiểm).

## 5. Trạng thái

| Tình huống | Hiển thị |
|---|---|
| Đổi một cài đặt | Áp **ngay lập tức**, không có nút "Lưu". Ghi `localStorage` cùng lúc |
| File chọn không phải JSON hợp lệ | "File này không phải bản xuất của ứng dụng" — nêu đúng lý do, không hiện stack trace |
| `schemaVersion` lạ (> 1) | "File được tạo bởi phiên bản mới hơn" — **từ chối nhập**, không đoán |
| Một phần bản ghi hỏng | Vẫn nhập phần còn lại, báo số bị bỏ qua ở kết quả |
| Đang nhập file lớn | `progress` + khóa nút. Nhập xong hiện số bản ghi thực sự đã ghi |
| Hết quota IndexedDB | "Trình duyệt hết dung lượng" + gợi ý xóa audio đã nạp. Dữ liệu cũ **còn nguyên** |
| Chưa có dữ liệu để xuất | Nút xuất `disabled`, kèm chữ "Chưa có gì để xuất" |
| Xóa xong | Về `/` với dashboard trạng thái trắng, không để lại màn hình rỗng tại `/cai-dat` |

Mọi phần tử bấm được đủ sáu trạng thái theo `design-system.md` §8.

## 6. Tương tác & chuyển động

- Đổi cài đặt hiển thị: kết quả nhìn thấy ngay trên chính trang Cài đặt — ô xem trước dưới
  nhóm "Hiển thị" đổi theo từng thao tác, không cần rời trang để kiểm chứng.
- Đổi giao diện sáng/tối: 150ms `ease-out` cho màu nền, không animate gì khác.
- `theme: 'system'` phải lắng nghe `matchMedia` thay đổi lúc chạy, không chỉ đọc lúc tải trang.
- Xuất file: tạo Blob → `URL.createObjectURL` → thẻ `<a download>` → `revokeObjectURL`. Không
  thêm thư viện lưu file.
- Nhập file: `<input type="file" accept="application/json">` gốc. Kéo-thả là phần thừa, bỏ.
- Toàn bộ hoạt ảnh bọc trong `@media (prefers-reduced-motion: no-preference)`.

## 7. Accessibility

- Mỗi cài đặt là một `<label>` liên kết thật với phần tử điều khiển, không dùng chữ đặt cạnh.
- Công tắc dùng `aria-pressed`; `toggle-group` dùng `role="radiogroup"` với `aria-label` nhóm.
- Kết quả nhập/xuất thông báo qua `aria-live="polite"`; lỗi qua `aria-live="assertive"`.
- `alert-dialog` bẫy focus, `Esc` đóng, focus trả về đúng nút đã mở nó.
- Thanh trượt âm lượng gốc của trình duyệt đã điều khiển được bằng phím mũi tên — đừng thay.
- Vùng nguy hiểm không chỉ dựa vào màu đỏ: có icon `<TriangleAlert />` **và** tiêu đề chữ.
- Vùng chạm ≥ 48×48px, focus ring 3px không bao giờ tắt.

## 8. Bảo mật & dữ liệu

File export chứa **toàn bộ tiến độ học của người dùng** dưới dạng văn bản thuần. Nói rõ trên
màn hình rằng đây là file cá nhân. Không mã hóa — mật khẩu cho một file sao lưu cá nhân là thứ
người dùng sẽ quên, và mất luôn dữ liệu.

File import là **đầu vào không tin cậy**, kể cả khi người dùng tự tạo ra nó. Kiểm tra ở biên:
`schemaVersion`, kiểu của từng trường, `targetType` nằm trong tập hợp hợp lệ, `dueAt` parse
được thành `Date`, số đếm không âm. Bản ghi sai thì bỏ, không "sửa cho đúng".

Không gọi mạng, không telemetry trong toàn bộ spec này. Việc đọc và ghi file diễn ra hoàn toàn
trong trình duyệt.

Cài đặt vẫn nằm ở `localStorage`; **dữ liệu học không bao giờ được ghi vào `localStorage`** —
nó có giới hạn khoảng 5MB và ghi đồng bộ chặn luồng chính.

## 9. Tiêu chí nghiệm thu

- [ ] Đổi cả sáu cài đặt, tải lại trang → cả sáu giữ nguyên
- [ ] Bật "ẩn furigana" + chế độ tối, tải lại → **không nhấp nháy** lần nào (kiểm tra với
      throttle CPU 4× trong DevTools)
- [ ] `theme: 'system'`, đổi chế độ tối của hệ điều hành khi tab đang mở → giao diện đổi theo
- [ ] Sửa `dailyNewLimit` = 5 → `/on-tap` nạp tối đa 5 mục mới trong ngày
- [ ] Xuất file → xóa toàn bộ dữ liệu → nhập lại file đó → số mục ôn tập và `dueAt` khớp
      **chính xác** bản cũ, kiểm tra trong DevTools › IndexedDB
- [ ] Nhập một file JSON hợp lệ nhưng sửa tay cho hỏng 3 bản ghi → 3 bản ghi bị bỏ qua, phần
      còn lại vào đủ, có báo số
- [ ] Nhập một file không phải của app → từ chối, **dữ liệu cũ còn nguyên**
- [ ] Chế độ Gộp: mục trùng `targetId` giữ bản có `updatedAt` mới hơn
- [ ] Nhập/xuất chạy được khi **tắt mạng hoàn toàn**
- [ ] Nhập không làm mất `audioFiles` đã nạp
- [ ] Nhập chế độ Thay thế với file hỏng hoàn toàn → **không xóa gì**, dữ liệu cũ còn nguyên
- [ ] Nhập chế độ Thay thế với file hỏng một phần → hộp xác nhận nêu đúng số mục sẽ mất và số
      mục sẽ vào
- [ ] Xóa dữ liệu → `pendingSync` rỗng và `jp:lastPulledAt` bị xóa (DevTools › Local Storage)
- [ ] Đã đăng nhập: chọn "Chỉ xóa trên máy này" → đồng bộ lại **tải về đúng dữ liệu cũ** và
      màn hình đã nói trước điều đó
- [ ] Đã đăng nhập: chọn "Xóa cả trên tài khoản" → thiết bị thứ hai cũng trống sau lần đồng bộ
- [ ] Đúng **một** nút `default` trên trang
- [ ] `pnpm check` exit 0, `pnpm test` xanh (có test cho validate + merge theo `updatedAt`)

## 10. Khối lệnh bàn giao thiết kế

Dán nguyên khối dưới đây kèm `web/DESIGN.md` vào Stitch / Claude Design.

---

Nạp `DESIGN.md` làm hợp đồng token. Ba ràng buộc bắt buộc:

1. Chỉ dùng token màu theo tên (`bg-primary`, `text-muted-foreground`), **tuyệt đối không
   hardcode mã hex**.
2. Mobile-first: dựng bố cục 390px trước, rồi mới mở rộng lên 1024px.
3. Mọi chữ tiếng Nhật phải bọc trong phần tử có class `jp`.

Dựng màn hình Cài đặt của một app học tiếng Nhật, bề rộng tối đa `max-w-2xl` (672px), chia
thành năm nhóm ngăn nhau bằng đường kẻ mảnh, mỗi nhóm có tiêu đề riêng.

**Hiển thị** — bốn hàng: công tắc "Hiện furigana"; bộ chọn hai lựa chọn "Cỡ furigana"
(Thường / Lớn); công tắc "Ẩn bản dịch khi đọc bài"; bộ chọn ba lựa chọn "Giao diện"
(Sáng / Tối / Theo hệ thống). Ngay dưới nhóm này là **một ô xem trước** chứa một câu tiếng
Nhật có furigana kèm bản dịch tiếng Việt, để người dùng thấy ngay tác dụng của cài đặt.

**Học tập** — một ô nhập số "Số mục mới mỗi ngày" (mặc định 20, có nút trừ và cộng hai bên),
và một thanh trượt âm lượng phát âm.

**Dữ liệu** — hai nút phụ cao 48px: "Xuất file JSON" (icon mũi tên xuống) và "Nhập từ file"
(icon mũi tên lên), kèm dòng chú thích "Gồm tiến độ ôn tập và lịch sử luyện tập. Không gồm
audio." và một dòng trạng thái ghi số bản ghi đang có trên máy.

**Tài khoản** — nhóm này hiện đang trống, chỉ một dòng chữ mờ "Đồng bộ đa thiết bị — sắp có".
Vẫn phải dựng khung nhóm để bố cục không đổi khi tính năng xuất hiện.

**Vùng nguy hiểm** — đặt cuối trang, viền màu `destructive`, có icon cảnh báo tam giác **và**
tiêu đề chữ "Vùng nguy hiểm" (màu không bao giờ đứng một mình), chứa nút "Xóa toàn bộ dữ liệu".

Thiết kế thêm **một hộp thoại xem trước khi nhập file**: tiêu đề mang tên file, một bảng tóm
tắt số bản ghi và ngày xuất, một dòng cảnh báo màu `warning` khi có bản ghi hỏng, hai ô chọn
chế độ "Gộp" và "Thay thế" (mặc định Gộp, mỗi ô có một dòng giải thích ngắn), và hai nút Hủy /
Nhập ở đáy.

Mọi phần tử bấm được cần đủ sáu trạng thái: Mặc định, Hover (chỉ khi `(hover: hover)`), Focus
(ring 3px, không bao giờ tắt), Active (dịch xuống 1px), Disabled (`opacity-50`), Loading
(spinner thay icon, giữ nguyên bề rộng). Vùng chạm tối thiểu 48×48px.

Trang chừa `pb-24` cho thanh nav đáy. Hoạt ảnh bọc trong `@media (prefers-reduced-motion:
no-preference)`, 150ms `ease-out`.

Cần cả chế độ sáng và tối.

---

> **Không** dùng file Stitch export để ghi đè `web/src/app/globals.css`. Bản export đổi màu
> về hex, bỏ toàn bộ chế độ tối, và mất lớp `@theme inline` — chính là thứ cho phép class
> `.dark` ghi đè token lúc chạy (`design-system.md` §12).
