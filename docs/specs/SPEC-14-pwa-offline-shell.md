# SPEC-14 — PWA & vỏ ứng dụng ngoại tuyến

> **Mã:** SPEC-JPN-F14 · **Trạng thái:** Draft · **Ngày:** 17/09/2026
> **Đối tượng đọc:** Google Stitch / Claude Design (mục 3–6), lập trình viên (toàn bộ).
> **Phụ thuộc:** SPEC-02 (khung nav, chỗ đặt dải báo ngoại tuyến), SPEC-06 (màn Cài đặt —
> nơi đặt hướng dẫn cài app). Độc lập với F08/F09, cài lúc nào cũng được.

## 1. Mục tiêu & phạm vi

Toàn bộ dự án dựa trên lời hứa offline-first, và lời hứa đó hiện **chỉ đúng với dữ liệu**.
Dexie giữ tiến độ học rất tốt, nhưng mở app khi mất mạng thì trình duyệt vẫn hiện trang khủng
long. Spec này làm cho chính ứng dụng mở được khi không có mạng, và cài được lên màn hình chính.

**Trong phạm vi**

- `web/src/app/manifest.ts` + bộ icon trong `web/public/`
- `web/public/sw.js` — service worker viết tay, precache vỏ ứng dụng
- Đăng ký service worker và luồng cập nhật khi có bản mới
- Trang `/offline` và dải báo trạng thái mạng
- Khối "Cài lên màn hình chính" trong `/cai-dat`
- Headers cho `/sw.js` trong `next.config.ts`

**Ngoài phạm vi**

- Thông báo đẩy (push notification), nhắc ôn tập hàng ngày. Cần server gửi và quyền thông báo —
  một tính năng riêng, không phải phần của việc chạy offline
- Background sync API. F08 đã đồng bộ khi có sự kiện `online`, thế là đủ
- Cache audio blob. Audio nằm trong IndexedDB (F09), service worker không đụng tới
- Static export. App có Route Handler và middleware của F08
- Thư viện `serwist` hay `next-pwa` — xem §2.3

## 2. Dữ liệu

Spec này **không có dữ liệu người dùng**. Nó chỉ quản lý cache của tài nguyên tĩnh.

| Nguồn | Chiều | Dùng cho |
|---|---|---|
| Cache Storage (`caches`) | Đọc/ghi trong service worker | Vỏ ứng dụng và asset tĩnh |
| `navigator.onLine` + sự kiện `online`/`offline` | Đọc | Dải báo trạng thái mạng |
| `navigator.serviceWorker` | Đọc | Phát hiện bản mới |

### 2.1. Chiến lược cache

| Loại request | Chiến lược | Lý do |
|---|---|---|
| `/_next/static/*` | **Cache-first**, không hết hạn | Tên file có hash; nội dung không bao giờ đổi dưới cùng một tên |
| Điều hướng trang (HTML) | **Network-first**, lỗi thì lấy cache, cuối cùng là `/offline` | Trang mới luôn ưu tiên; mất mạng vẫn mở được |
| Icon, ảnh trong `public/` | Cache-first | Tĩnh, nhỏ |
| **Payload RSC** (`?_rsc=`, header `RSC`) | **Network-first, có cache**, trong cache riêng `jp-rsc-<BUILD_ID>` | Xem §2.1a — không cache là **không có điều hướng offline** |
| Mọi request khác origin (Supabase, F08) | **Không đụng tới** | Đồng bộ có logic retry riêng; xen vào giữa chỉ sinh lỗi khó lần |
| `POST`, `PUT`, mọi method khác `GET` | Không đụng tới | Cache API chỉ dành cho `GET` |

### 2.1a. Điều hướng offline: phải cache RSC, không được né

App Router sinh **Server Component Payload** cho mọi lần điều hướng, kể cả điều hướng
client-side (`web/node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`
§"How navigation works"). Dữ liệu học nằm trong Dexie không thay đổi điều đó: bấm từ `/hoc`
sang `/hoc/3` vẫn là một request RSC.

Bản trước bỏ qua nhóm request này vì sợ payload cũ sống sót qua một lần deploy. Nỗi lo đó đã
được **tên cache giải quyết sẵn**: cache mang `BUILD_ID`, và `activate` xóa mọi cache tên khác.
Payload của bản build cũ không thể sống sót, vì chính cái cache chứa nó bị xóa.

Quy tắc: network-first (bản mới luôn ưu tiên khi có mạng), lỗi mạng thì lấy trong
`jp-rsc-<BUILD_ID>`, không có nữa thì để Next tự xử lý — điều hướng thất bại và người dùng ở
lại trang hiện tại, thay vì thấy trang trắng.

**Chỉ cache response RSC của `GET`** và chỉ khi status 200.

### 2.1b. `BUILD_ID` vào service worker bằng đường nào

`public/sw.js` là file tĩnh, không qua bundler, nên không đọc được biến môi trường của Next.

```ts
// next.config.ts
env: { NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA ?? String(Date.now()) }
```

```ts
// client: đăng ký kèm phiên bản
navigator.serviceWorker.register(`/sw.js?v=${process.env.NEXT_PUBLIC_BUILD_ID}`);
// sw.js: đọc lại từ chính URL của mình
const BUILD_ID = new URL(self.location.href).searchParams.get('v') ?? 'dev';
```

Đổi query string khiến trình duyệt coi đó là một service worker **khác byte** và chạy vòng đời
cập nhật — đúng thứ ta cần sau mỗi lần deploy. Không cần build step, không cần sinh file.

### 2.1c. Danh sách precache

`/`, `/offline`, `/hoc`, `/luyen-tap`, `/on-tap`, icon, manifest.

Ba route học thêm vào vì trang `/offline` mời người dùng bấm sang chúng — hứa một đích "chắc
chắn có trong cache" mà không precache nó là hứa suông. `/hoc/[so]`, `/cai-dat`, `/thong-ke`
vẫn vào cache khi người dùng ghé lần đầu.

**Dữ liệu bài học nằm trong chunk JS, nhưng chunk chỉ vào cache khi đã được tải ít nhất một
lần.** 25 bài là `import()` động, nên chunk của bài chưa mở **không** có trên máy. Câu "dữ liệu
bài học được cache miễn phí" chỉ đúng với những bài người dùng đã ghé — nói đúng như vậy trên
giao diện, đừng hứa cả 25 bài đều đọc được offline.

### 2.2. Vòng đời và phiên bản

- Hai cache, cùng mang số bản build: `jp-shell-<BUILD_ID>` và `jp-rsc-<BUILD_ID>`.
- `install`: precache theo §2.1c. Không precache 25 trang bài học; chúng vào cache khi người
  dùng ghé lần đầu.
- `activate`: xóa mọi cache có tên khác tên hiện tại, rồi `clients.claim()`.
- **Không `skipWaiting()` tự động.** Người học đang làm dở một phiên mà app tự nạp lại là mất
  bài. Bản mới chờ ở trạng thái `waiting` cho tới khi người dùng bấm "Tải lại" ở §3.3.

### 2.3. Vì sao viết tay thay vì dùng thư viện

Toàn bộ service worker ở đây là bốn quy tắc trong bảng §2.1 — chừng 60 dòng JavaScript, không
build step, không plugin webpack, không cấu hình phải khớp với phiên bản Next.

`serwist` và `next-pwa` giải quyết những bài toán mà app này không có: precache manifest sinh
lúc build, nhiều chiến lược theo từng route, background sync, phân mảnh cache theo plugin.

> `ponytail: sw.js viết tay ~60 dòng; chuyển sang serwist nếu cần precache manifest sinh tự
> động hoặc background sync`

### 2.4. Vì sao không bật `experimental.useOffline`

Next 16 có `experimental.useOffline` giữ lại và thử lại các request RSC / Server Action khi mất
mạng. App này **không fetch server trong render path** — dữ liệu học đọc thẳng từ Dexie qua
`useLiveQuery`. Bật cờ đó sẽ kéo theo `cacheComponents` và `partialPrefetching`, tức là đổi
kiến trúc render để giải một bài toán mình không có.

Trạng thái mạng ở §3.2 dùng `navigator.onLine` và hai sự kiện gốc của trình duyệt.

## 3. Màn hình & bố cục

### 3.1. `/offline`

Trang duy nhất được thêm. Bề rộng `max-w-xl`, nội dung căn giữa theo chiều dọc.

```
[Icon đám mây gạch chéo]
[H1 "Trang này chưa được tải về máy"]
Những phần bạn đã mở trước đó vẫn dùng được bình thường.
[Về trang chủ]   [Ôn tập hôm nay]
```

Giọng bình tĩnh, không phải giọng báo lỗi. Hai nút dẫn tới chỗ **chắc chắn** có trong cache.

### 3.2. Dải báo ngoại tuyến

Dải mảnh cao 32px, nền `muted`, ngay dưới nav ở desktop và ngay trên nav đáy ở mobile:

```
⚪  Đang ngoại tuyến — tiến độ vẫn được lưu trên máy
```

Chỉ hiện khi thật sự mất mạng. **Không** đẩy nội dung nhảy chỗ: chừa sẵn chiều cao bằng cách
dùng `position: sticky` chồng lên vùng đệm, hoặc chấp nhận một lần dịch chuyển duy nhất lúc
xuất hiện — không được nhấp nháy theo mỗi lần mạng chập chờn (chờ ổn định 2 giây rồi mới hiện).

Dải này **khác** huy hiệu đồng bộ của F08: huy hiệu nói về hàng đợi dữ liệu, dải này nói về
mạng. Khi cả hai cùng có mặt, dải nói "Đang ngoại tuyến", huy hiệu nói "Chờ đồng bộ (n)" —
không lặp lại cùng một câu ở hai chỗ.

### 3.3. Thông báo có bản mới

`card` nổi ở góc dưới (mobile: trên nav đáy, chừa `env(safe-area-inset-bottom)`):

```
Đã có bản cập nhật
[Tải lại]   [Để sau]
```

Bấm "Để sau" thì im cho tới lần mở app kế tiếp. **Không tự nạp lại**, không đếm ngược, không
hiện lại sau 30 giây.

### 3.4. Khối "Cài lên màn hình chính" trong `/cai-dat`

```
[Tiêu đề "Cài lên màn hình chính"]
Cài app để mở nhanh hơn và dùng được khi không có mạng.
  • iPhone/iPad: Safari → nút Chia sẻ → "Thêm vào MH chính"
  • Android: Chrome → menu ⋮ → "Cài đặt ứng dụng"
  • Máy tính: biểu tượng cài đặt ở thanh địa chỉ
```

**Không dựng nút "Cài đặt" tự chế** bằng `beforeinstallprompt`: sự kiện này không có trên
Safari iOS, nên nút sẽ biến mất đúng ở nền tảng cần hướng dẫn nhất. Tài liệu Next.js khuyến
nghị đúng điều này. Khi app đã được cài, ẩn cả khối (kiểm tra
`matchMedia('(display-mode: standalone)')`).

## 4. Component dùng lại

| Vai trò | Token component |
|---|---|
| Trang `/offline` | `card` + `button-secondary` |
| Dải báo ngoại tuyến | nền `muted`, chữ `muted-foreground`, icon `<CloudOff />` |
| Thông báo bản mới | `card` với `shadow-md` |
| Khối hướng dẫn cài đặt | `card` |

Icon Lucide: `CloudOff` · `RefreshCw` · `Smartphone`.

Không thêm component mới, không thêm dependency. Toàn bộ spec dùng API gốc của trình duyệt.

**Bộ icon cần có** trong `web/public/`: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`
(có vùng lề an toàn cho Android), `apple-touch-icon.png` 180×180. Nền dùng màu giấy Washi,
hình dùng dấu ấn chữ Nhật của app — dựng từ cùng nguồn với favicon hiện có.

`manifest.ts`: `display: 'standalone'`, `start_url: '/'`, `background_color` màu nền Washi sáng,
`theme_color` màu `primary` đỏ Torii, `lang: 'vi'`, `orientation: 'portrait'`.

## 5. Trạng thái

| Tình huống | Hiển thị |
|---|---|
| Online, bản mới nhất | Không hiện gì cả. Trạng thái bình thường phải im lặng |
| Mất mạng | Dải §3.2 sau 2 giây ổn định |
| Mạng chập chờn | Không nhấp nháy dải — chỉ đổi khi trạng thái giữ nguyên ≥ 2 giây |
| Mất mạng, mở trang chưa từng ghé | `/offline` với hai lối đi tiếp |
| Có bản mới đang chờ | Thông báo §3.3, **không** tự nạp lại |
| Trình duyệt không hỗ trợ service worker | App chạy bình thường, chỉ không có cache vỏ. Không hiện cảnh báo gì |
| Đang chạy ở chế độ đã cài (standalone) | Ẩn khối hướng dẫn cài đặt |
| Đăng ký service worker thất bại | Ghi log ở dev, **im lặng với người dùng**. Đây không phải lỗi họ sửa được |

Mọi phần tử bấm được đủ sáu trạng thái theo `design-system.md` §8.

## 6. Tương tác & chuyển động

- Dải ngoại tuyến xuất hiện: mờ dần 150ms `ease-out`. Không trượt, không nảy.
- Thông báo bản mới: mờ dần, không rung, không phát tiếng.
- Bấm "Tải lại": gửi `SKIP_WAITING` cho service worker đang chờ, đợi `controllerchange` rồi
  `location.reload()`. Nút chuyển sang trạng thái Loading trong lúc chờ.
- Toàn bộ hoạt ảnh bọc trong `@media (prefers-reduced-motion: no-preference)`.
- Không có hoạt ảnh splash tự dựng. Màn hình khởi động do hệ điều hành sinh từ manifest.

## 7. Accessibility

- Dải ngoại tuyến là `role="status"` với `aria-live="polite"` — thông báo một lần khi đổi
  trạng thái, không lặp lại.
- Thông báo bản mới không được cướp focus. Nó là `role="status"`, không phải `role="alert"` —
  bản cập nhật không khẩn cấp.
- Trạng thái ngoại tuyến có **icon và chữ**, không chỉ đổi màu nền.
- Trang `/offline` có `<h1>` thật và hai link thật, điều hướng được bằng bàn phím.
- Dải và thông báo không che nội dung hay nav đáy; nav đáy vẫn chạm được đủ 48px.
- `theme_color` trong manifest phải đủ tương phản với icon trên màn hình khởi động.

## 8. Bảo mật & dữ liệu

Service worker chỉ cache **tài nguyên tĩnh của chính origin này**. Không cache response của
Supabase, không cache bất kỳ request nào mang dữ liệu người dùng, không đụng vào request khác
origin.

`/sw.js` phải được phục vụ với `Cache-Control: no-cache, no-store, must-revalidate` (headers
trong `next.config.ts`) — nếu chính service worker bị cache, người dùng sẽ kẹt ở một bản cũ và
**không có cách nào đẩy bản sửa lỗi tới họ**.

Cache Storage dùng chung quota với IndexedDB. Vỏ ứng dụng phải nhỏ: chỉ precache `/`,
`/offline`, icon và manifest. Chiếm chỗ bằng cache vỏ là lấy mất chỗ của audio (F09), và audio
nặng hơn nhiều bậc.

Service worker chỉ chạy trên HTTPS (và `localhost`). Không có gì phải cấu hình thêm, nhưng
đừng trông đợi nó hoạt động khi test qua IP nội bộ dùng HTTP.

Tiến độ học **không bao giờ** nằm trong Cache Storage — nó nằm trong IndexedDB, và
`/offline` không được đọc dữ liệu học để hiển thị.

## 9. Tiêu chí nghiệm thu

- [ ] `pnpm build && pnpm start` → DevTools › Application › Manifest: không lỗi, app **cài
      được** (icon, `start_url`, `display: standalone` đầy đủ)
- [ ] Mở app, tắt mạng, **tải lại trang** → app mở bình thường, không hiện trang khủng long
- [ ] Tắt mạng rồi mở một trang chưa từng ghé → `/offline` với hai lối đi tiếp
- [ ] **Chạy toàn bộ mục này trên `pnpm build && pnpm start`**, không phải `pnpm dev` — service
      worker và chunk hashed chỉ đúng ở bản production
- [ ] Offline: `/hoc`, `/hoc/1`, `/luyen-tap`, `/on-tap` đã ghé trước đó vẫn mở được và làm
      bài được
- [ ] **Offline, điều hướng client-side**: đang ở `/hoc` bấm sang `/hoc/1` rồi sang `/on-tap`
      → cả ba chuyển trang chạy được, không trang trắng, không kẹt spinner
- [ ] Offline, mở một bài **chưa từng ghé** → thông báo đúng lý do (chunk chưa tải), không
      phải màn hình trắng
- [ ] Cài app xong, **tắt mạng rồi mở app lần đầu từ icon** → vào thẳng dashboard
- [ ] Offline: audio đã nạp (F09) **vẫn phát được** — service worker không đụng IndexedDB
- [ ] Deploy một bản mới khi tab đang mở → hiện thông báo bản mới, **không tự nạp lại**; bấm
      "Tải lại" mới nạp, và nạp ra đúng bản mới
- [ ] Sau khi cập nhật, cache của bản cũ **bị xóa** (DevTools › Cache Storage chỉ còn một mục)
- [ ] Điều hướng client-side sau khi deploy bản mới **không** vỡ vì payload RSC cũ trong cache
- [ ] Request tới Supabase (F08) **không** xuất hiện trong Cache Storage
- [ ] `curl -I /sw.js` trả `Cache-Control: no-cache, no-store, must-revalidate`
- [ ] Bật/tắt mạng liên tục 5 lần trong 3 giây → dải ngoại tuyến **không nhấp nháy**
- [ ] Cài lên màn hình chính (Android + iOS) → mở ở chế độ standalone, khối hướng dẫn cài đặt
      tự ẩn
- [ ] Trình duyệt không hỗ trợ service worker → app vẫn chạy đủ, không cảnh báo
- [ ] `pnpm check` exit 0, `pnpm build` thành công

## 10. Khối lệnh bàn giao thiết kế

Dán nguyên khối dưới đây kèm `web/DESIGN.md` vào Stitch / Claude Design.

---

Nạp `DESIGN.md` làm hợp đồng token. Ba ràng buộc bắt buộc:

1. Chỉ dùng token màu theo tên (`bg-primary`, `text-muted-foreground`), **tuyệt đối không
   hardcode mã hex**.
2. Mobile-first: dựng bố cục 390px trước, rồi mới mở rộng lên 1024px.
3. Mọi chữ tiếng Nhật phải bọc trong phần tử có class `jp`.

Dựng bốn phần nhỏ cho chế độ ngoại tuyến của một app học tiếng Nhật.

**A. Trang "chưa tải về máy"** (`max-w-xl`, nội dung căn giữa theo chiều dọc): một icon đám mây
gạch chéo cỡ lớn màu `muted-foreground`, tiêu đề "Trang này chưa được tải về máy", một dòng
trấn an "Những phần bạn đã mở trước đó vẫn dùng được bình thường", và hai nút phụ cạnh nhau
"Về trang chủ" và "Ôn tập hôm nay". **Giọng bình tĩnh, không phải trang báo lỗi** — không màu
đỏ, không dấu chấm than.

**B. Dải báo ngoại tuyến**: một dải mảnh cao 32px, nền `muted`, chứa icon đám mây gạch chéo và
dòng chữ "Đang ngoại tuyến — tiến độ vẫn được lưu trên máy". Ở desktop dải nằm ngay dưới thanh
nav đầu trang; ở mobile nằm ngay **trên** thanh nav đáy và không che nav. Icon và chữ luôn đi
cùng nhau.

**C. Thông báo có bản cập nhật**: một thẻ nhỏ nổi ở góc dưới (mobile: phía trên nav đáy, chừa
vùng safe-area), có `shadow-md`, gồm dòng chữ "Đã có bản cập nhật" và hai nút: "Tải lại" (nút
chính) và "Để sau" (nút ghost). Thẻ này **không** khẩn cấp — không dùng màu cảnh báo.

**D. Khối "Cài lên màn hình chính"** trong trang Cài đặt (`max-w-2xl`): tiêu đề, một câu giải
thích lợi ích, và ba dòng hướng dẫn theo nền tảng (iPhone/iPad, Android, Máy tính), mỗi dòng
có icon nhỏ dẫn đầu. **Không có nút "Cài đặt ngay"** — đây là khối hướng dẫn bằng chữ.

Mọi phần tử bấm được cần đủ sáu trạng thái: Mặc định, Hover (chỉ khi `(hover: hover)`), Focus
(ring 3px, không bao giờ tắt), Active (dịch xuống 1px), Disabled (`opacity-50`), Loading
(spinner thay icon, giữ nguyên bề rộng).

Hoạt ảnh duy nhất là mờ dần 150ms `ease-out` khi dải và thẻ thông báo xuất hiện, bọc trong
`@media (prefers-reduced-motion: no-preference)`.

Cần cả chế độ sáng và tối.

---

> **Không** dùng file Stitch export để ghi đè `web/src/app/globals.css`. Bản export đổi màu
> về hex, bỏ toàn bộ chế độ tối, và mất lớp `@theme inline` — chính là thứ cho phép class
> `.dark` ghi đè token lúc chạy (`design-system.md` §12).
