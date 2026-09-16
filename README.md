# Japanese

Web tự học Minna no Nihongo N5/N4: Next.js, Dexie offline-first, Supabase sync.

## Clone và thiết lập

Cài Git, **Node.js 24+**, **pnpm 11.9.0** và coding agent bạn dùng (Codex/Claude).
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
