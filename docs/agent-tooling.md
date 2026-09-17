# Công cụ coding agent cho Japanese

Thiết lập ở phạm vi repository. Không thay cấu hình global.

## Setup sau khi clone

Cần Git, Node.js 24+, pnpm 11.9.0 trong PATH và mạng để tải dependency.
Chạy từ root trên Windows, macOS hoặc Linux:

```sh
node scripts/setup.mjs
```

Script cài dependency trong `web/` bằng `pnpm install --frozen-lockfile`, tạo
liên kết skills và sinh `.codex/config.toml` / `.mcp.json` cho máy hiện tại.
Các file sinh ra bị Git ignore; mã nguồn cấu hình nằm trong `scripts/setup.mjs`.
Chạy lại sau khi chuyển đường dẫn checkout, đổi hệ điều hành hoặc phiên bản tooling.
Nếu thiếu pnpm, cài đúng phiên bản trước rồi chạy lại; script không cài tool global.

Script chỉ thay block Next DevTools nó quản lý trong TOML và entry `next-devtools`
trong JSON, giữ cấu hình khác. Block TOML tùy chỉnh cùng tên nhưng không có marker
sẽ làm setup dừng để tránh ghi đè. Không thêm chỉnh sửa cá nhân vào block managed.
Thư mục thật trong `.claude/skills/` cũng được giữ nguyên và báo xung đột.

## Rules và skills

- `AGENTS.md`: quy ước chung cho Codex và Claude; `CLAUDE.md` import file này.
- `web/AGENTS.md`: giữ nguyên block hướng dẫn do Next.js quản lý.
- `.agents/skills/`: bản nguồn skills cho Codex, được lưu cùng repo.
- `.claude/skills/`: junction trên Windows, symlink tương đối trên macOS/Linux;
  bootstrap tạo từ cùng nguồn skills, không lưu liên kết vào Git.

| Tên skill | Thư mục | Nguồn và commit |
| --- | --- | --- |
| `vercel-react-best-practices` | `react-best-practices` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/react-best-practices) — `063bee94c3f4df8453406c830b0a7df0f2860278` |
| `web-design-guidelines` | `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/web-design-guidelines) — cùng commit trên |
| `shadcn` | `shadcn` | [shadcn-ui/ui](https://github.com/shadcn-ui/ui/tree/2b3e6d4f8d9161fe5c19340dc383aade392012dd/skills/shadcn) — `2b3e6d4f8d9161fe5c19340dc383aade392012dd` |

Điều chỉnh duy nhất trong nội dung skills upstream: phần Current Project Context
của shadcn dùng `pnpm exec shadcn info --json` trong `web/`, thay lệnh tự chạy
`npx shadcn@latest` ở cwd không xác định. Giữ điều chỉnh này khi cập nhật skill.
Web Design Guidelines vẫn tải bản guidelines mới khi review theo thiết kế upstream.
License shadcn được lưu trong `.agents/skills/LICENSE.shadcn`. Repo Vercel ở commit
trên không có file LICENSE riêng; giữ nguyên metadata/license trong skills upstream.

`superpowers` không nằm trong `.agents/skills/`: đây là plugin Claude Code, bật ở
phạm vi project qua `.claude/settings.json` (`superpowers@claude-plugins-official`,
v6.3.0, [obra/superpowers](https://github.com/obra/superpowers), MIT). Claude Code tự
tải sau khi clone; không cần `scripts/setup.mjs` và Codex không dùng plugin này. Gỡ
bằng `claude plugin uninstall superpowers@claude-plugins-official --scope project`.

Ví dụ sử dụng:

- “Dùng vercel-react-best-practices review component bài học vừa sửa.”
- “Dùng shadcn thêm dialog dựa trên Base UI và token Washi hiện tại.”
- “Dùng web-design-guidelines review màn hình luyện tập trên mobile và bàn phím.”

## Next.js DevTools MCP

- Codex: `.codex/config.toml` (project cần được Codex trust).
- Claude: `.mcp.json`; mở Claude tại root và chấp nhận workspace/server khi
  ứng dụng yêu cầu. Bootstrap không thay trust, approval hoặc đăng nhập.
- Windows chạy `cmd.exe /d /c pnpm dlx next-devtools-mcp@0.4.0`;
  macOS/Linux chạy trực tiếp `pnpm dlx next-devtools-mcp@0.4.0`.
  Phiên bản được ghim; pnpm tải/cache package khi MCP khởi động lần đầu.
- Không cần API key. Reload MCP hoặc mở phiên agent mới để nhận cấu hình.
- Chạy `pnpm dev` trong `web/`; MCP cần dev server đang chạy để lấy runtime.
  Chọn đúng port và xác nhận project path trước khi đọc lỗi/log.
- Ví dụ: “Dùng Next DevTools kiểm tra project metadata và lỗi của app Japanese.”

Kiểm tra cấu hình từ root: `codex mcp get next-devtools` hoặc
`claude mcp get next-devtools`. Cấu hình được đọc không đồng nghĩa đã kiểm tra UI.

Kiểm tra bootstrap bằng `node --test scripts/setup.test.mjs`: liên kết skills,
chạy lặp lại, giữ cấu hình khác và lựa chọn lệnh theo hệ điều hành. Kiểm tra
runtime MCP vẫn cần agent và dev server trên từng máy; test chọn lệnh không
thay thế việc chạy thật trên macOS/Linux.

Tham khảo: [OpenAI MCP](https://learn.chatgpt.com/docs/extend/mcp),
[Next.js MCP](https://nextjs.org/docs/app/guides/mcp),
[Claude skills](https://code.claude.com/docs/en/skills).

## Khi mở rộng

Thêm Supabase skills/MCP khi triển khai auth/sync; bắt đầu bằng một project được
chỉ định và chế độ read-only cho chẩn đoán. Context7, shadcn MCP và Playwright CLI
chỉ thêm khi công cụ/docs hiện có không đáp ứng nhiệm vụ. Chưa cần skill nội dung
tự viết; quy tắc xác minh tiếng Nhật đã có trong `AGENTS.md`.
