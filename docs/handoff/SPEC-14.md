# Handoff — SPEC-14 (PWA cài đặt & standalone)

Ngày: 24/09/2026. Trạng thái: đã có code, installability đạt trên Chrome desktop; chưa thử máy thật.

## Quyết định và thay đổi

- Thu hẹp SPEC-14: chỉ cài lên màn hình chính, **không** service worker/offline reload.
- `web/src/app/manifest.ts` (standalone, portrait, `lang: vi`, màu khớp `themeColor` sáng).
- Icon `web/public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` và
  `web/src/app/apple-icon.png` (180px) dựng từ `web/public/brand/maipace-app-icon.svg`
  bằng sharp (có sẵn qua Next). Nền đỏ tràn viền nên dùng chung cho maskable.
- `layout.tsx`: `appleWebApp`, `viewportFit: 'cover'`. `globals.css`: `overscroll-behavior-y: none`
  chỉ trong `@media (display-mode: standalone)`.
- `web/src/components/InstallAppCard.tsx` trong `/cai-dat`, ẩn khi standalone; dòng lưu ý dữ
  liệu tách biệt hiện trên mọi iOS (không kiểm đăng nhập).
- Rà quay lại: mọi màn có nav đáy, nút back trong trang hoặc nút thoát phiên; không thêm nút.

## Kiểm tra đã chạy

- `pnpm check`, `pnpm test` 143/143, `pnpm build` đạt.
- `next start` + CDP: `Page.getInstallabilityErrors` rỗng, `Page.getAppManifest` không lỗi.
- Dev server: `/manifest.webmanifest` trả đúng, `<link rel=manifest>`, `apple-touch-icon`,
  `mobile-web-app-capable` có trong head; khối cài đặt hiện ở `/cai-dat`.

## Chưa kiểm chứng / bước tiếp theo

- Cài thật trên Android Chrome và iOS Safari: standalone, safe-area, icon maskable.
- Đăng nhập Google OAuth (SPEC-08) trong app standalone trên iOS và Android.
- Kéo quá đầu/cuối trang trong standalone.
