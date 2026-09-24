# SPEC-14 — PWA cài đặt & chế độ standalone

> **Mã:** SPEC-JPN-F14 · **Trạng thái:** Đã có code (24/09/2026), chờ thử máy thật · **Ngày:** 24/09/2026
> **Thay thế:** SPEC-14 "PWA & vỏ ứng dụng ngoại tuyến" (17/09/2026, đã xóa ở commit
> `718013b`, còn trong lịch sử Git). Bản này **chỉ giữ phần cài đặt**; service worker và
> offline reload vẫn nằm ngoài lộ trình.
> **Phụ thuộc:** SPEC-02 (shell, nav đáy, safe-area), SPEC-06 (màn Cài đặt), SPEC-08 (sync).
> Liên quan: [plan hoạt ảnh](../plans/motion-mobile.md) giai đoạn G2b.

## 1. Mục tiêu & phạm vi

Trên điện thoại, MaiPace đang chạy trong trình duyệt với thanh địa chỉ và thanh công cụ. Spec
này cho phép **cài lên màn hình chính** và mở ở chế độ standalone để có cảm giác như một app,
mà không thêm service worker.

Tài liệu Next xác nhận cài đặt không cần offline:
`web/node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md` ("you can trigger
install prompts without needing offline support"; iOS 16.4+ cho app trên màn hình chính).

**Trong phạm vi**

- `web/src/app/manifest.ts` (quy ước metadata của Next) và bộ icon trong `web/public/`
- `metadata.appleWebApp` trong `web/src/app/layout.tsx` và `viewportFit: 'cover'`
- Xử lý chế độ standalone: nút quay lại trong app, overscroll, safe-area
- Khối "Cài lên màn hình chính" trong `/cai-dat`

**Ngoài phạm vi**

- Service worker, Cache Storage, trang `/offline`, thông báo có bản mới, mở lại app khi mất
  mạng. Luồng học vẫn chạy tiếp khi mất mạng **trong trang đã mở** như hiện nay.
- Push notification, background sync.
- Nút "Cài đặt" dựng bằng `beforeinstallprompt` (xem §3.2).
- Thư viện `next-pwa`, `serwist`.

## 2. Dữ liệu

Không có dữ liệu mới. Chỉ đọc `matchMedia('(display-mode: standalone)')` và
`navigator.standalone` (iOS) để biết app đang chạy dạng đã cài.

**Lưu ý lưu trữ trên iOS:** app trên màn hình chính có IndexedDB **tách biệt** với Safari.
Tiến độ học trong Safari không tự xuất hiện trong app vừa cài; chỉ đi qua được bằng sync
(SPEC-08). Ngược lại, app đã cài không bị Safari xóa dữ liệu theo chính sách giới hạn lưu trữ
cho trang ít dùng, nên Dexie và audio đã nạp (SPEC-09) an toàn hơn.

## 3. Màn hình & bố cục

### 3.1. Manifest và icon

`manifest.ts`: `name: 'MaiPace — Tự học tiếng Nhật'`, `short_name: 'MaiPace'`,
`start_url: '/'`, `display: 'standalone'`, `orientation: 'portrait'`, `lang: 'vi'`,
`background_color` và `theme_color` khớp `themeColor` đang khai báo trong `layout.tsx`.
Không chép giá trị token sang tài liệu khác; lấy trong `globals.css`/`layout.tsx`.

Bộ icon trong `web/public/`, dựng từ `web/public/brand/maipace-app-icon.svg` (xem
`PRODUCT.md` về cách dùng logo): `icon-192.png`, `icon-512.png`,
`icon-maskable-512.png` (có lề an toàn cho Android); icon Apple 180×180 là
`web/src/app/apple-icon.png` (quy ước file của Next tự sinh `apple-touch-icon`).

`layout.tsx`: `metadata.appleWebApp = { capable: true, title: 'MaiPace', statusBarStyle: 'default' }`,
`viewport.viewportFit = 'cover'`.

### 3.2. Khối "Cài lên màn hình chính" trong `/cai-dat`

```
[Tiêu đề "Cài lên màn hình chính"]
Mở MaiPace như một app, không có thanh trình duyệt.
  • iPhone/iPad: Safari → nút Chia sẻ → "Thêm vào MH chính"
  • Android: Chrome → menu ⋮ → "Cài đặt ứng dụng"
  • Máy tính: biểu tượng cài đặt ở thanh địa chỉ
Trên iPhone, app đã cài có dữ liệu riêng với Safari — đăng nhập đồng bộ để mang tiến độ sang.
```

Không hứa dùng được khi không có mạng. Không dựng nút "Cài đặt" bằng `beforeinstallprompt`:
sự kiện này không có trên Safari iOS. Ẩn cả khối khi đang chạy standalone. Dòng lưu ý iOS chỉ
hiện trên iOS (đơn giản hóa: không kiểm trạng thái đăng nhập).

### 3.3. Chế độ standalone

- **Quay lại:** standalone không có nút Back của trình duyệt; iOS còn mất cử chỉ vuốt lùi.
  Mọi màn không nằm trên nav đáy phải có nút quay lại trong app. Rà tối thiểu:
  `/hoc/[so]`, `/hoc/[so]/tu-vung`, `/hoc/tra-cuu/**`, `/luyen-tap/phien`, `/on-tap/phien`,
  `/on-tap/diem-yeu`, `/cai-dat/audio`. Màn phiên luyện tập/ôn dùng nút thoát phiên hiện có
  nếu đã có, không thêm nút thứ hai.
- **Overscroll:** `overscroll-behavior-y: none` trên `html`/`body`, chỉ trong
  `@media (display-mode: standalone)` (trình duyệt thường giữ kéo-để-tải-lại), để không lộ nền khi kéo quá
  và không kích hoạt kéo-để-tải-lại giữa phiên học; vùng cuộn riêng giữ `overscroll-contain`.
- **Safe-area:** nav đáy và các thanh cố định dùng `env(safe-area-inset-*)` (đã có trong code,
  chỉ có hiệu lực sau khi bật `viewportFit: 'cover'`). Kiểm tra cả tai thỏ và thanh home.
- **Liên kết ngoài** (nếu có) mở bằng `target="_blank"` để không kéo người dùng ra khỏi app.

## 4. Component dùng lại

Khối cài đặt dùng `card` hiện có trong `/cai-dat`; icon Lucide `Smartphone`. Nút quay lại dùng
`button-ghost` với `ArrowLeft`/`ChevronLeft` theo mẫu đang có ở các trang tra cứu. Không thêm
component hay dependency.

## 5. Trạng thái

| Tình huống | Hiển thị |
|---|---|
| Chạy trong trình duyệt | Khối hướng dẫn cài đặt hiện trong `/cai-dat` |
| Chạy standalone | Ẩn khối hướng dẫn |
| iOS | Hiện dòng lưu ý dữ liệu tách biệt |
| Trình duyệt không hỗ trợ manifest | App chạy bình thường, không cảnh báo |
| Mất mạng khi đang mở app đã cài | Như trình duyệt: trang đang mở chạy tiếp; mở app lúc không mạng **không** được hỗ trợ |

## 6. Chuyển động

Không có splash tự dựng; màn khởi động do hệ điều hành sinh từ manifest. Chuyển trang theo
plan hoạt ảnh G2: hướng trượt tự tính từ đường dẫn (`lib/nav-direction.ts`), không cần
`transitionTypes` trên từng nút quay lại.

## 7. Accessibility

- Nút quay lại có nhãn "Quay lại" (`aria-label`) và vùng chạm ≥ 44px.
- Khối cài đặt là nội dung chữ thường, không phải hộp thoại bật lên.
- Màu `theme_color` đủ tương phản với icon trên màn hình khởi động.

## 8. Bảo mật

Không có service worker nên không có rủi ro cache dữ liệu người dùng hay kẹt bản cũ.
Manifest chỉ chứa thông tin công khai.

## 9. Tiêu chí nghiệm thu

- [x] `pnpm build && pnpm start` → manifest không lỗi, Chrome báo cài được (CDP
      `Page.getInstallabilityErrors` rỗng, 24/09/2026)
- [ ] Android Chrome: cài được, mở standalone, không thanh địa chỉ, icon maskable không bị cắt
- [ ] iOS Safari: "Thêm vào MH chính" → mở standalone, status bar và safe-area đúng, nav đáy
      không bị thanh home che
- [x] Mọi route ở §3.3 quay lại được mà không cần nút Back của trình duyệt (rà code 24/09)
- [ ] Kéo quá đầu/cuối trang không lộ nền, không tải lại trang giữa phiên học
- [ ] **Đăng nhập Google OAuth (SPEC-08) trong app standalone trên iOS và Android** hoàn tất và
      quay về app đã đăng nhập (rủi ro chính, phải thử máy thật)
- [ ] Khối hướng dẫn cài đặt ẩn khi standalone; dòng lưu ý iOS hiện đúng điều kiện
- [ ] Luồng học chạy tiếp khi mất mạng trong trang đã mở của app đã cài
- [x] `pnpm check` exit 0, `pnpm build` thành công (24/09/2026)
