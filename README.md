# MaiPace

**Học tiếng Nhật theo nhịp của bạn.**

Ứng dụng cá nhân cho người Việt tự học tiếng Nhật theo Minna no Nihongo.
Hiện có màn học N5, luyện tập, ôn theo lịch, tra cứu, audio/Shadowing và sync
(chưa kiểm với Supabase thật); N4 là lộ trình. Cài lên màn hình chính (PWA không
service worker) là lộ trình; mở lại app khi mất mạng thì không. Xem [sản phẩm và thương hiệu](PRODUCT.md) và
[trạng thái có bằng chứng](docs/specs/README.md).

## Làm việc với coding agent

Mở repository tại root. Codex, Claude Code và Antigravity cùng dùng
[AGENTS.md](AGENTS.md); bắt đầu với [mẫu giao việc](docs/handoff/PROMPT-phien-moi.md).
Mỗi phiên đọc trạng thái và handoff liên quan trước khi sửa code; không cần kể
lại toàn bộ lịch sử chat. Tên repository/thư mục vẫn là `Japanese`.

## Clone và thiết lập

Cài Git, **Node.js 24+**, **pnpm 11.9.0** và coding agent bạn dùng.
Node và pnpm cần có trong PATH của ứng dụng agent; cần mạng khi tải dependency.

```sh
git clone https://github.com/QuangTruong252/Japanese.git
cd Japanese
node scripts/setup.mjs
```

Lệnh setup dùng trên Windows/macOS/Linux: cài dependency từ lockfile, nối 3 skills
cho Claude và tạo cấu hình Next DevTools MCP phù hợp hệ điều hành. Có thể chạy lại.
Mở agent tại **root repo**, chấp nhận workspace/MCP trust nếu ứng dụng yêu cầu.

```sh
cd web
pnpm dev
```

Rules và skills đi cùng repository. Thiết lập đăng nhập, secrets, dữ liệu học/audio
và approval của agent là riêng từng máy. Xem [công cụ agent](docs/agent-tooling.md).

## Kiểm tra

```sh
node --test scripts/setup.test.mjs
pnpm --dir web check
pnpm --dir web test
```
