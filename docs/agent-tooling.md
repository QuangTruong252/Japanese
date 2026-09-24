# Công cụ coding agent cho MaiPace

Thiết lập ở phạm vi repository. Không thay cấu hình global.

## Cùng một nguồn ngữ cảnh

| Agent | Điểm vào | Quy ước chung |
| --- | --- | --- |
| Codex | `AGENTS.md` tại root | Đọc trực tiếp |
| Claude Code | `CLAUDE.md` | Import `@AGENTS.md` |
| Antigravity (CLI/IDE) | `.agents/rules/project.md`, `trigger: always_on` | Import `@../../AGENTS.md`; đường dẫn tính từ file rule |

Mở repo tại root, bắt đầu phiên mới khi đổi rules. `PRODUCT.md` giữ mục tiêu và
thương hiệu; `docs/specs/README.md` giữ trạng thái có bằng chứng. Dùng
[mẫu giao việc và bàn giao](handoff/PROMPT-phien-moi.md) cho cả ba agent.
Không sao chép quy ước thành ba bản; không cần lịch sử chat của agent trước.

Nguồn chính thức: [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md),
[Claude imports](https://code.claude.com/docs/en/memory),
[Antigravity rules](https://antigravity.google/docs/rules-workflows).
Có file cấu hình chưa chứng minh agent đã nạp đúng; xem phép thử ở cuối tài liệu.

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

- `AGENTS.md`: quy ước chung cho cả ba agent; entrypoint theo bảng phía trên.
- Nếu có hướng dẫn lồng trong thư mục làm việc thì đọc thêm. Hiện không có
  `web/AGENTS.md`; không tạo giả block do Next.js quản lý.
- `.agents/skills/`: bản nguồn skills cho Codex, được lưu cùng repo.
- `.claude/skills/`: junction trên Windows, symlink tương đối trên macOS/Linux;
  bootstrap tạo từ cùng nguồn skills, không lưu liên kết vào Git.

| Tên skill | Thư mục | Nguồn và commit |
| --- | --- | --- |
| `vercel-react-best-practices` | `react-best-practices` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/react-best-practices) — `063bee94c3f4df8453406c830b0a7df0f2860278` |
| `web-design-guidelines` | `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/web-design-guidelines) — cùng commit trên |
| `shadcn` | `shadcn` | [shadcn-ui/ui](https://github.com/shadcn-ui/ui/tree/2b3e6d4f8d9161fe5c19340dc383aade392012dd/skills/shadcn) — `2b3e6d4f8d9161fe5c19340dc383aade392012dd` |
| `impeccable` | `impeccable` | Bản đã lưu trong repo; metadata SKILL.md 4.3.1, launcher VERSION 0.1.5; thiết kế và tinh chỉnh UI |

Bootstrap hiện nối **ba** skills đầu sang Claude. Impeccable có thể đọc trực tiếp
từ `.agents/skills/impeccable/SKILL.md` khi nhiệm vụ cần; không giả định alias đã
được cài trong mọi agent. Nếu công cụ không tự tìm thấy skill, mở SKILL.md bằng
đường dẫn trong repo. Không tự cài plugin hoặc sửa cấu hình global để bù.

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
Plugin là tùy chọn riêng của Claude, không bắt Codex/Antigravity phải có nó;
thực hiện cùng các bước đọc phạm vi, sửa, kiểm tra và bàn giao bằng công cụ sẵn có.

Ví dụ sử dụng:

- “Dùng vercel-react-best-practices review component bài học vừa sửa.”
- “Dùng shadcn thêm dialog dựa trên Base UI và token Washi hiện tại.”
- “Dùng web-design-guidelines review màn hình luyện tập trên mobile và bàn phím.”

## Next.js DevTools MCP

- Codex: `.codex/config.toml` (project cần được Codex trust).
- Claude: `.mcp.json`; mở Claude tại root và chấp nhận workspace/server khi
  ứng dụng yêu cầu. Bootstrap không thay trust, approval hoặc đăng nhập.
- Antigravity: bootstrap hiện **không** cấu hình MCP cho agent này. Rules và
  tài liệu dùng được độc lập; không suy rằng `.mcp.json` của Claude tự áp dụng.
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

## Kiểm tra phiên mới

Chạy cùng prompt dưới đây trong một phiên mới của từng agent, tại root repo.
Không resume phiên cũ, không chỉ định trước tên các file cần đọc: phép thử cần
cho thấy entrypoint dẫn agent đến đúng nguồn. Giữ quyền đọc, không bật bỏ qua
permission và không giao thêm agent con.

> Chỉ đọc, không sửa file, không commit, không chạy build/setup và không giao
> agent khác. Hãy giải thích: MaiPace và Washi là gì; thông điệp sản phẩm; nguồn
> dữ liệu client; trạng thái nội dung N5, sync và Shadowing; quyền thay đổi
> của bạn; bước tiếp theo của dự án. Nêu các file hướng dẫn đã được nạp hoặc đã
> đọc và dẫn nguồn file cho kết luận. Phân biệt rõ đã có code với đã kiểm chứng.
> Trả lời ngắn bằng tiếng Việt. Không đọc secret hoặc file cấu hình tài khoản.

Đạt khi trả lời đúng các ý trên, tự tìm tới nguồn chung, không tự sửa/giao việc,
không gọi tính năng dự kiến là hoàn thành. Nếu phải nhắc đường dẫn thủ công thì
ghi rõ đó là kiểm tra đọc tài liệu, chưa xác nhận cơ chế tự nạp.

Ghi ngày, CLI/ứng dụng, kết quả và giới hạn riêng cho từng agent trong handoff
của đợt thay đổi rules. Lỗi đăng nhập/quota/công cụ → **chưa kiểm chứng**, không
suy ra agent sẽ hoạt động từ việc import hợp lệ. Thử lại sau khi điều kiện đổi.
