# SPEC-08 — Đăng nhập & đồng bộ Supabase

> **Mã:** SPEC-JPN-F08 · **Trạng thái:** Completed · **Ngày:** 22/09/2026
> **Đối tượng đọc:** Google Stitch / Claude Design (mục 3–6), lập trình viên (toàn bộ).
> **Phụ thuộc:** SPEC-02 (huy hiệu đồng bộ — spec này nối dây), SPEC-04 và SPEC-05 (bên ghi
> vào `pendingSync`), SPEC-06 (màn Cài đặt — nhóm "Tài khoản" trống chờ spec này lấp).

## 1. Mục tiêu & phạm vi

Từ SPEC-04, mỗi phiên làm bài đều đẩy một bản ghi vào `pendingSync`. Cho tới giờ **chưa ai đọc
bảng đó** — nó chỉ phình ra. Spec này dựng bên đọc: đăng nhập Google, đẩy hàng đợi lên
Supabase, kéo dữ liệu về khi mở app trên máy mới.

**Trong phạm vi**

- Đăng nhập / đăng xuất bằng Google OAuth qua Supabase Auth
- `supabase/migrations/0001_init.sql` — lược đồ và RLS theo `project-design-spec.md` §3.2
- Hàm Postgres `sync_practice(payload jsonb)` — upsert last-write-wins
- `src/lib/sync.ts` — máy đồng bộ: rút hàng đợi, retry, lắng nghe `online`
- Kéo toàn bộ `review_items` về Dexie sau khi đăng nhập (§6.2 spec gốc)
- Nối ba trạng thái của huy hiệu đồng bộ (SPEC-02 §5) vào dữ liệu thật
- Khối "Tài khoản" trong `/cai-dat`

**Ngoài phạm vi**

- Đồng bộ `audioFiles`. Blob audio **không bao giờ** rời khỏi máy — bản quyền và dung lượng
- Đồng bộ nội dung bài học. Dữ liệu bài học là file tĩnh trong bundle, giống nhau trên mọi máy
- Đăng nhập bằng email/mật khẩu, nhiều nhà cung cấp OAuth. Một người dùng, một cách đăng nhập
- Chia sẻ tiến độ, bảng xếp hạng, bất kỳ dữ liệu nào của người khác
- Realtime subscription. Đồng bộ chạy khi có sự kiện, không cần kênh thường trực

## 2. Dữ liệu

| Nguồn | Chiều | Dùng cho |
|---|---|---|
| `db.pendingSync` | Đọc, xóa sau xác nhận | Hàng đợi đẩy lên |
| `db.reviewItems`, `db.practiceSessions` | Ghi khi kéo về | Dữ liệu từ thiết bị khác |
| `profiles.settings` (Supabase) | Đọc/ghi | `AppSettings` của SPEC-06, nguyên object |
| `src/lib/supabase/client.ts` | Gọi | Đã có sẵn, **phải sửa** — xem §8 |
| `localStorage` | Không đụng | Cài đặt cục bộ do SPEC-06 quản |

### 2.1. Payload của `pendingSync`

SPEC-04 khai `payload: unknown`. Chốt lại ở đây, có version để sau này đọc được hàng đợi cũ:

```ts
type SyncPayload =
  | { v: 1; kind: 'practice'; session: PracticeSession; reviewItems: ReviewItem[] }
  | { v: 1; kind: 'import'; reviewItems: ReviewItem[]; sessions: PracticeSession[];
      replaced: boolean }                       // SPEC-06 §2.4
  | { v: 1; kind: 'wipe'; scope: 'local' | 'account'; wipedAt: string };  // SPEC-06 §3.3
```

Mọi bản ghi `pendingSync` mang thêm `userId: string` — xem §2.5.

`id` của bản ghi `pendingSync` dùng làm **khóa idempotent**: gửi lại cùng `id` sau lỗi mạng
không được tạo thêm phiên luyện tập thứ hai trên server.

**`kind: 'import'` phải mang cả `sessions`**, không chỉ `reviewItems`: SPEC-06 nhập lại cả lịch
sử phiên, và nếu chỉ đẩy lịch ôn thì thống kê trên máy và trên tài khoản sẽ lệch vĩnh viễn.
`replaced: true` báo cho server biết đây là lần nhập ở chế độ Thay thế.

**`kind: 'wipe'` là ngữ nghĩa xóa**, chi tiết ở §2.6. Không có nó thì "xóa toàn bộ dữ liệu" chỉ
là xóa cục bộ, và lần kéo về kế tiếp sẽ dựng lại đúng thứ người dùng vừa xóa.

### 2.2. Lược đồ và RLS

Chép **nguyên văn** `project-design-spec.md` §3.2 vào `supabase/migrations/0001_init.sql`:
ba bảng, hai index nóng, ba policy `FOR ALL USING (auth.uid() = …)`. Không sửa, không thêm cột.

Thêm đúng một thứ mà spec gốc chưa có — hàm thực thi upsert có điều kiện:

```sql
CREATE FUNCTION sync_practice(payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER AS $$
  -- kind = 'practice' | 'import' | 'wipe', tất cả trong MỘT transaction
  -- 1. INSERT practice_sessions ... ON CONFLICT (id) DO NOTHING   → idempotent
  -- 2. INSERT review_items ... ON CONFLICT (user_id, target_id) DO UPDATE
  --    SET ... WHERE review_items.updated_at < EXCLUDED.updated_at  → §4.3.6
  -- 3. kind='import' & replaced → DELETE dữ liệu của auth.uid() trước bước 1–2
  -- 4. kind='wipe' & scope='account' → DELETE review_items + practice_sessions của auth.uid()
  -- 5. RETURN jsonb_build_object('applied', …, 'skipped', …)
$$;
```

> **Sai khác với spec gốc §6.1 — cần duyệt trước khi cài.** Spec gốc mô tả một endpoint
> `/api/sync/practice`. Route Handler không giúp được gì ở đây: mệnh đề
> `WHERE review_items.updated_at < EXCLUDED.updated_at` không biểu diễn được bằng
> `supabase-js .upsert()`, nên dù đi qua route hay không thì vẫn phải có một hàm Postgres.
> Có hàm rồi thì route chỉ còn là một lớp chuyển tiếp: thêm một chặng mạng, thêm một nơi có
> thể quên kiểm tra quyền. Gọi thẳng `supabase.rpc('sync_practice', …)` từ client, `SECURITY
> INVOKER` giữ nguyên hiệu lực RLS theo `auth.uid()`. Nếu bạn muốn giữ đúng §6.1, nói rõ —
> nhưng khi đó route handler phải tự kiểm tra session, và bề mặt tấn công rộng hơn.

### 2.3. Kéo về — phân trang bắt buộc

> **Sửa so với spec gốc §6.2.** Câu "vài nghìn bản ghi, một lần `select *` là đủ" **sai**:
> PostgREST của Supabase mặc định chặn ở **1.000 dòng mỗi response** (`db-max-rows`). Người
> học N5 đủ 25 bài đã vượt mốc đó, và phần vượt sẽ **im lặng** biến mất — không lỗi, không
> cảnh báo, chỉ là lịch ôn thiếu một nửa.

Phân trang keyset, thứ tự ổn định, lặp tới khi hết:

```ts
// order('updated_at').order('id') — cặp (updated_at, id) là duy nhất nên không sót, không lặp
.select('*')
.gt('updated_at', cursor.updatedAt)      // hoặc .or(...) cho phần bằng nhau, khác id
.order('updated_at', { ascending: true })
.order('id', { ascending: true })
.limit(500)
```

Dừng khi trang trả về ít hơn `limit`. **Kiểm tra đã tải đủ**: so số bản ghi nhận được với
`select('*', { count: 'exact', head: true })` chạy trước vòng lặp; lệch thì báo lỗi và **không**
ghi vào Dexie, thay vì ghi một nửa rồi coi là xong.

Hợp nhất vào Dexie bằng **cùng luật `updatedAt` mới hơn thắng** của SPEC-06 §2.4 — không xóa
sạch Dexie rồi ghi đè, vì người dùng có thể đã học offline trên chính máy này trước khi đăng
nhập.

`practice_sessions` kéo về 90 ngày gần nhất, cũng phân trang như trên. Hệ quả phải nói rõ với
SPEC-07: **streak dài hơn 90 ngày sẽ bị cắt trên máy mới** — xem SPEC-07 §2.2.

### 2.4. Đồng bộ hai chiều — máy B nhận thay đổi của máy A lúc nào

Một chiều đẩy là chưa đủ: máy B đã đăng nhập từ trước sẽ không bao giờ thấy những gì máy A vừa
ôn. **Mỗi lần kích hoạt đồng bộ chạy đủ hai chiều, theo đúng thứ tự: đẩy trước, kéo sau.**

- Đẩy trước để thay đổi cục bộ luôn có `updated_at` mới nhất khi vào cuộc so sánh.
- Kéo sau bằng **delta**: `updated_at > lastPulledAt` (lưu trong `localStorage`, một khóa
  `jp:lastPulledAt`), phân trang như §2.3. Lần đầu sau đăng nhập thì `lastPulledAt` rỗng và nó
  chính là lần kéo đầy đủ.
- `lastPulledAt` chỉ được cập nhật **sau khi** ghi Dexie thành công, và lấy theo `updated_at`
  lớn nhất thực sự nhận được — không lấy giờ máy, vì đồng hồ client lệch là chuyện thường.

Bốn nguồn kích hoạt của §2.4 cũ (kết thúc phiên · `online` · tab hiện lại · bấm huy hiệu) giữ
nguyên, nay mỗi lần đều là một chu trình đẩy-rồi-kéo hoàn chỉnh.

Hàng đợi rỗng **không** có nghĩa là bỏ qua bước kéo: máy B thường không có gì để đẩy.

### 2.5. Dữ liệu cục bộ thuộc về ai

Dexie hiện không ghi nhận dữ liệu thuộc tài khoản nào. Đăng nhập tài khoản B trên máy vừa dùng
tài khoản A sẽ trộn hai tiến độ vào nhau, và hàng đợi cũ của A sẽ bị đẩy lên tài khoản B.

Chốt:

- `localStorage` giữ `jp:ownerUserId` — tài khoản sở hữu dữ liệu Dexie hiện tại. Đăng nhập
  **lần đầu** trên máy trắng thì gán luôn.
- `pendingSync` mang `userId`. Máy đồng bộ **chỉ đẩy** bản ghi có `userId` khớp người đang
  đăng nhập.
- Đăng nhập bằng tài khoản khác `jp:ownerUserId` → chặn lại bằng một hộp thoại, ba lựa chọn:
  **Xuất file JSON rồi xóa dữ liệu máy này** · **Giữ dữ liệu và hủy đăng nhập** · (nếu hàng đợi
  cũ rỗng và Dexie rỗng) **tiếp tục**. Không có lựa chọn "trộn".
- Dữ liệu học **chưa từng đăng nhập** (`jp:ownerUserId` rỗng) thì thuộc về tài khoản đăng nhập
  đầu tiên — đúng kỳ vọng của người dùng offline lâu ngày rồi mới tạo tài khoản.
- Đăng xuất giữ nguyên Dexie **và giữ nguyên `jp:ownerUserId`**, để lần đăng nhập sau còn so
  được.

### 2.6. Xóa và nhập — phối hợp với SPEC-06

| Thao tác ở SPEC-06 | Hàng đợi | Hiệu lực trên tài khoản |
|---|---|---|
| Nhập file, chế độ Gộp | `kind: 'import'`, `replaced: false` | Upsert LWW như thường |
| Nhập file, chế độ Thay thế | `kind: 'import'`, `replaced: true` | Server xóa toàn bộ dữ liệu của user rồi ghi bản mới, trong **một** transaction của RPC |
| Xóa dữ liệu, phạm vi "máy này" | **Xóa sạch `pendingSync`** trước, không đẩy gì | Không đụng server. Nói thẳng với người dùng: lần đồng bộ sau sẽ tải lại từ tài khoản |
| Xóa dữ liệu, phạm vi "cả tài khoản" | `kind: 'wipe'`, `scope: 'account'` | RPC xóa `review_items` + `practice_sessions` của user |

Hai quy tắc bắt buộc, cả hai đều để tránh "dữ liệu vừa xóa tự sống lại":

1. Xóa cục bộ **luôn** kèm xóa sạch `pendingSync`. Giữ lại hàng đợi cũ là giữ lại đúng những
   bản ghi vừa bị xóa, và chúng sẽ được đẩy lên ở lần kết nối kế tiếp.
2. Sau khi xóa (bất kể phạm vi), **đặt lại `jp:lastPulledAt`**. Kéo delta từ một mốc cũ sau khi
   bảng cục bộ đã trống sẽ cho ra một tập dữ liệu nửa vời.

Đẩy nốt `pendingSync` đang tồn đọng **sau** khi kéo về xong ở lần đăng nhập đầu, để tránh hai
chiều chạy chồng.

### 2.7. Máy đồng bộ — `src/lib/sync.ts`

Một hàng đợi tuần tự, chạy từng bản ghi theo thứ tự `createdAt`:

- Kích hoạt khi: kết thúc một phiên · sự kiện `window online` · tab trở lại hiện
  (`visibilitychange`) · người dùng bấm huy hiệu đồng bộ.
- **Không có polling theo chu kỳ.** Bốn sự kiện trên đã phủ mọi lúc dữ liệu thay đổi hoặc mạng
  quay lại; một `setInterval` chỉ làm hao pin và che lỗi.
- Chỉ xóa bản ghi khỏi `pendingSync` **sau khi** RPC trả về thành công. Lỗi thì giữ nguyên.
- Retry giãn dần 2s → 8s → 30s, tối đa 3 lần cho một lần kích hoạt, rồi dừng và chờ sự kiện kế.
- Lỗi 4xx (payload sai, không phải lỗi mạng) → **không retry**, đánh dấu bản ghi là hỏng và
  hiện lối cho người dùng xuất file JSON (SPEC-06) trước khi làm gì tiếp. Retry vô hạn một
  payload sai chỉ làm hỏng hàng đợi phía sau nó.
- Không chạy đồng bộ khi chưa đăng nhập — hàng đợi cứ tích lũy, đúng như hành vi hiện tại.

## 3. Màn hình & bố cục

Spec này gần như không có màn hình mới: nó lấp ba chỗ trống đã dựng sẵn.

### 3.1. Khối "Tài khoản" trong `/cai-dat`

**Chưa đăng nhập**

```
[Tiêu đề "Tài khoản"]
Đăng nhập để đồng bộ tiến độ giữa điện thoại và máy tính.
[Đăng nhập bằng Google]   ← nút secondary, cỡ quiz
Dòng nhỏ: "Dữ liệu học của bạn vẫn nằm trên máy và vẫn dùng được khi không đăng nhập."
```

**Đã đăng nhập**

```
[Avatar] tên hiển thị
         email
[Trạng thái: "Đã đồng bộ · 2 phút trước"  |  "Chờ đồng bộ (3)"  |  "Ngoại tuyến"]
[Đồng bộ ngay]   [Đăng xuất]
```

### 3.2. Huy hiệu đồng bộ trên nav

Đúng component `sync-badge-*` mà SPEC-02 §5 đã dựng — spec này chỉ cấp cho nó dữ liệu thật,
**bỏ ghi chú "luôn là trạng thái thứ ba"** trong SPEC-02. Huy hiệu bấm được: bấm vào thì chạy
đồng bộ ngay; bấm khi chưa đăng nhập thì đưa tới `/cai-dat`.

### 3.3. Màn hình sau khi đăng nhập lần đầu trên máy mới

Toàn màn hình, chặn thao tác, vì dữ liệu đang được ghi vào Dexie:

```
[Spinner]  "Đang tải tiến độ học của bạn…"
[progress] "1.204 / 1.204 mục ôn tập"
```

Kéo xong thì chuyển thẳng về `/`. **Không** hiện màn này khi chỉ đồng bộ ngầm lúc bình thường
— đồng bộ ngầm không được chắn đường người dùng.

### 3.4. Hộp thoại xác nhận đăng xuất

`alert-dialog`. Nói rõ điều người dùng thật sự cần biết:

- Còn `n` mục chưa đồng bộ → cảnh báo và **gợi ý đồng bộ trước khi đăng xuất**.
- Dữ liệu trên máy **giữ nguyên** sau khi đăng xuất, không bị xóa.

## 4. Component dùng lại

| Vai trò | Token component |
|---|---|
| Huy hiệu đồng bộ | `sync-badge-synced` / `sync-badge-pending` / `sync-badge-offline` |
| Khối tài khoản | `card` |
| Nút đăng nhập Google, "Đồng bộ ngay" | `button-secondary` cỡ `quiz` |
| Xác nhận đăng xuất | `alert-dialog` |
| Thanh tiến trình kéo dữ liệu | `progress` |
| Avatar | `<img>` thường, bo tròn 40px, có `alt` là tên hiển thị |

Icon Lucide: `CloudCheck` · `CloudUpload` · `CloudOff` (ba trạng thái, đúng bảng
`design-system.md` §9.7) · `LogOut` · `RefreshCw`.

**Không thêm component mới.** Không dùng thư viện UI đăng nhập của Supabase — nó mang theo
design system riêng và sẽ phá vỡ Washi.

## 5. Trạng thái

| Tình huống | Hiển thị |
|---|---|
| Chưa đăng nhập | Huy hiệu `sync-badge-offline` + "Đã lưu trên máy". **Không** hiện lỗi — đây là trạng thái hợp lệ |
| Đã đăng nhập, hàng đợi rỗng | `sync-badge-synced` + "Đã đồng bộ" + thời điểm gần nhất |
| Hàng đợi có `n` mục | `sync-badge-pending` + "Chờ đồng bộ (n)" |
| Mất mạng | `sync-badge-offline` + "Ngoại tuyến — đã lưu trên máy". Không hiện hộp lỗi đỏ |
| Đang đẩy | Icon `<CloudUpload />` quay nhẹ, giữ nguyên chữ. Không chặn thao tác |
| OAuth bị người dùng hủy | Về `/cai-dat`, không thông báo lỗi — hủy là một lựa chọn |
| OAuth lỗi thật (sai cấu hình, mạng) | Nêu lý do đọc được và nút thử lại. Không in mã lỗi trần |
| Payload bị từ chối (4xx) | Một dòng `warning` ở khối Tài khoản: "1 bài chưa đồng bộ được" + gợi ý xuất JSON |
| Token hết hạn giữa chừng | Làm mới session im lặng; thất bại thì chuyển về trạng thái chưa đăng nhập, **không mất dữ liệu cục bộ** |
| Kéo dữ liệu về lỗi giữa chừng | Transaction Dexie rollback; hiện nút thử lại; dữ liệu cũ còn nguyên |

Mọi phần tử bấm được đủ sáu trạng thái theo `design-system.md` §8.

## 6. Tương tác & chuyển động

- Đăng nhập: `signInWithOAuth({ provider: 'google' })` → callback `/auth/callback` đổi `code`
  lấy session → về đúng trang trước đó.
- Icon `<CloudUpload />` khi đang đẩy: quay 1000ms tuyến tính, lặp. Bọc trong
  `@media (prefers-reduced-motion: no-preference)`; giảm chuyển động thì đổi sang chữ "Đang
  đồng bộ…" — **không được mất thông tin trạng thái**.
- Đổi trạng thái huy hiệu: 150ms `ease-out` cho màu, không animate đổi icon.
- Đồng bộ ngầm **không bao giờ** hiện toast, không chặn UI, không làm nhảy bố cục. Người học
  đang làm bài không cần biết mạng vừa quay lại.

## 7. Accessibility

- Huy hiệu đồng bộ là `<button>` thật (nó bấm được), có `aria-label` mang đúng chuỗi trạng
  thái kể cả khi chữ bị ẩn trên mobile.
- Trạng thái đồng bộ đổi thì thông báo qua `aria-live="polite"`, một lần cho mỗi lần đổi —
  không phát lại mỗi giây.
- Nút "Đăng nhập bằng Google" có chữ thật, không chỉ logo.
- Màn hình kéo dữ liệu dùng `role="status"` và đọc tiến trình thành câu ("đang tải 1.204 mục"),
  không đọc trần số phần trăm.
- `alert-dialog` đăng xuất bẫy focus, `Esc` đóng, focus trả về nút đã mở.
- Ba trạng thái huy hiệu phân biệt bằng icon **và** chữ; `success` với `warning` chỉ khác nhau
  ở sắc màu là không đủ.

## 8. Bảo mật & dữ liệu

**Bỏ giá trị dự phòng trong `supabase/client.ts` và `supabase/server.ts`.** Hai file hiện có
đang lùi về `https://placeholder.supabase.co` khi thiếu biến môi trường — app sẽ chạy, đăng
nhập sẽ thất bại một cách khó hiểu, và người dùng sẽ tưởng tiến độ đã lên cloud. Thiếu
`NEXT_PUBLIC_SUPABASE_URL` hoặc `NEXT_PUBLIC_SUPABASE_ANON_KEY` thì **ném lỗi ngay lúc khởi
tạo**.

`anon key` là khóa công khai, nằm trong bundle là đúng thiết kế — RLS mới là thứ bảo vệ dữ
liệu. **Service-role key không bao giờ xuất hiện** trong client, trong log, hay trong tài liệu.
Toàn bộ quyền truy cập đi qua ba policy `auth.uid() = …`; không có đường nào đọc dữ liệu của
người khác, kể cả khi client bị sửa.

Làm mới session bằng middleware của `@supabase/ssr` (`web/src/middleware.ts`). Không tự viết
cơ chế lưu token; không đặt token vào `localStorage`.

Dữ liệu gửi đi **chỉ gồm tiến độ học**: kết quả phiên, lịch FSRS, cài đặt. Không gửi nội dung
câu trả lời cụ thể, không telemetry, không analytics. Audio và nội dung bài học không rời máy.

Mất mạng là trạng thái bình thường, không phải lỗi: Dexie vẫn là nguồn sự thật, mọi tính năng
vẫn chạy, hàng đợi chờ. Đăng xuất **không xóa** dữ liệu cục bộ.

Xung đột nhiều thiết bị giải bằng last-write-wins theo `updated_at` (§4.3.6). Giữ nguyên chính
sách này — **không thêm CRDT, không merge lịch sử review**.

## 9. Tiêu chí nghiệm thu

- [ ] Chạy migration trên project Supabase trắng → ba bảng, hai index, ba policy RLS đầy đủ
- [ ] Đăng nhập Google trên máy A, làm một phiên → `pendingSync` rỗng sau vài giây, huy hiệu
      chuyển `sync-badge-synced`
- [ ] Đăng nhập cùng tài khoản trên máy B → `/on-tap` hiện đúng các mục đến hạn của máy A
- [ ] **Máy B đã đăng nhập sẵn, đang mở**: máy A làm một phiên → chuyển sang tab máy B → máy B
      nhận thay đổi mà **không cần đăng nhập lại** (chu trình đẩy-rồi-kéo §2.4)
- [ ] Tài khoản có **hơn 1.000** `review_items` → máy mới tải về **đủ**, không dừng ở 1.000
      (đếm bản ghi trong IndexedDB và so với `count` trên server)
- [ ] Cắt mạng giữa lúc phân trang → không ghi nửa vời vào Dexie, có nút thử lại
- [ ] Đăng nhập tài khoản B trên máy đang giữ dữ liệu của tài khoản A → **chặn**, có ba lựa
      chọn của §2.5, **không tự trộn**, và hàng đợi của A **không** bị đẩy lên B
- [ ] Xóa dữ liệu phạm vi "máy này" → `pendingSync` rỗng, và lần đồng bộ sau **không** đẩy lại
      dữ liệu vừa xóa
- [ ] Xóa dữ liệu phạm vi "cả tài khoản" → máy B (đang đăng nhập) cũng trống sau lần đồng bộ kế
- [ ] Nhập file ở chế độ Thay thế khi đã đăng nhập → dữ liệu trên tài khoản khớp đúng file vừa
      nhập, không còn bản ghi cũ sót lại
- [ ] Nhập file → `practice_sessions` trên server cũng được cập nhật, không chỉ `review_items`
- [ ] **Tắt mạng**, làm hai phiên → huy hiệu "Chờ đồng bộ (2)", không hiện lỗi đỏ. Bật mạng →
      tự đẩy hết, **không cần tải lại trang**
- [ ] Gửi lại cùng một bản ghi `pendingSync` hai lần → server **không** tạo hai phiên luyện tập
- [ ] Ôn cùng một mục trên hai máy khi cả hai offline, rồi cho lần lượt online → bản có
      `updated_at` mới hơn thắng, `fsrs_card` của bản cũ **không** ghi đè
- [ ] Đăng nhập trên máy có sẵn dữ liệu offline → dữ liệu cũ **không bị xóa**, hợp nhất theo
      `updatedAt`
- [ ] Dùng tài khoản B cố `select` `review_items` của tài khoản A → trả về rỗng (RLS chặn)
- [ ] Xóa biến môi trường Supabase → app **báo lỗi rõ ràng lúc khởi tạo**, không im lặng trỏ
      về placeholder
- [ ] Đăng xuất → dữ liệu trong IndexedDB còn nguyên, app dùng tiếp được offline
- [ ] Bật "giảm chuyển động": icon không quay, chữ trạng thái vẫn đầy đủ
- [ ] `pnpm check` exit 0, `pnpm test` xanh (test: hợp nhất theo `updatedAt`, xử lý retry, gửi
      trùng)

## 10. Khối lệnh bàn giao thiết kế

Dán nguyên khối dưới đây kèm `web/DESIGN.md` vào Stitch / Claude Design.

---

Nạp `DESIGN.md` làm hợp đồng token. Ba ràng buộc bắt buộc:

1. Chỉ dùng token màu theo tên (`bg-primary`, `text-muted-foreground`), **tuyệt đối không
   hardcode mã hex**.
2. Mobile-first: dựng bố cục 390px trước, rồi mới mở rộng lên 1024px.
3. Mọi chữ tiếng Nhật phải bọc trong phần tử có class `jp`.

Dựng ba thứ cho phần tài khoản và đồng bộ của một app học tiếng Nhật ưu tiên ngoại tuyến.

**A. Khối "Tài khoản" trong trang Cài đặt** (bề rộng `max-w-2xl`), hai trạng thái:

- *Chưa đăng nhập:* một dòng giải thích "Đăng nhập để đồng bộ tiến độ giữa điện thoại và máy
  tính", một nút phụ cao 48px "Đăng nhập bằng Google" có **cả logo lẫn chữ**, và một dòng nhỏ
  màu mờ trấn an rằng dữ liệu vẫn nằm trên máy và vẫn dùng được khi không đăng nhập.
- *Đã đăng nhập:* avatar tròn 40px, tên hiển thị, email màu mờ, một dòng trạng thái đồng bộ,
  và hai nút "Đồng bộ ngay" và "Đăng xuất" đặt cạnh nhau.

**B. Huy hiệu trạng thái đồng bộ** ở góc phải thanh điều hướng, **bấm được** — vẽ như một nút
thật với đủ trạng thái hover và focus. Ba biến thể: "Đã đồng bộ" (màu `success`, icon đám mây
có dấu tích), "Chờ đồng bộ (3)" (màu `warning`, icon đám mây mũi tên lên), "Ngoại tuyến — đã
lưu trên máy" (màu `muted-foreground`, icon đám mây gạch chéo). **Mỗi biến thể phải có cả icon
lẫn chữ**; màu không bao giờ đứng một mình. Trên mobile chỉ hiện icon. Vẽ thêm biến thể "đang
đẩy": cùng icon mũi tên lên nhưng có dấu hiệu đang quay.

**C. Màn hình chờ tải tiến độ lần đầu trên thiết bị mới**: toàn màn hình, nền `background`, một
spinner, dòng chữ "Đang tải tiến độ học của bạn…", một thanh tiến trình và một dòng đếm
"1.204 / 1.204 mục ôn tập". Màn này bình tĩnh, không dùng màu cảnh báo — đây là việc bình
thường, không phải sự cố.

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
