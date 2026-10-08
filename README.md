# MaiPace

**Học tiếng Nhật theo nhịp của bạn.** App cá nhân cho người Việt tự học tiếng Nhật theo
Minna no Nihongo (N5). Chạy trong trình duyệt, dữ liệu học lưu trên máy; đồng bộ Supabase là tùy chọn.

## Cài đặt

Cần Git, **Node.js 24+** và **pnpm 11.9.0**.

```sh
git clone https://github.com/QuangTruong252/Japanese.git
cd Japanese
node scripts/setup.mjs   # cài dependency, nối skill dùng chung, cấu hình MCP Next DevTools
cd web
pnpm dev
```

## Kiểm tra

```sh
node --test scripts/setup.test.mjs
pnpm --dir web check
pnpm --dir web test
```

## Làm việc với coding agent

Mở agent tại root repo. Mọi agent đọc [`AGENTS.md`](AGENTS.md); chuẩn giao diện ở
[`DESIGN.md`](DESIGN.md); vai trò và quy trình phối hợp ở [`docs/workflow/`](docs/workflow/README.md).
