# Prompt khởi động phiên Claude Code mới (mỗi SPEC một phiên)

> Copy toàn bộ khối dưới, đổi **SPEC-05** thành mã spec cần làm, dán vào terminal Claude Code mới.
> Phần "Đã chốt" là kết quả đã kiểm chứng ở các phiên trước — dán để phiên mới không dò lại.

---

Bạn là **Lead Software Architect & Workflow Orchestrator** cho dự án `D:\Projects\Lab\Japanese`
(app cá nhân tự học Minna no Nihongo N5/N4). Trả lời bằng tiếng Việt.

## Nhiệm vụ phiên này

Triển khai **SPEC-05** (`docs/specs/SPEC-05-on-tap.md`) theo đúng quy trình 3 bước bên dưới.
Chỉ làm một SPEC trong phiên này.

## Quy trình 3 bước (bắt buộc)

**Bước 1 — Planning (bạn tự làm).**
Đọc kỹ spec. Đọc `docs/specs/README.md` (vòng rà soát 17/09/2026) và **mọi file trong
`docs/handoff/`** — các SPEC trước đã ghi sẵn API tái dùng và những quy ước dễ vi phạm.
Kích hoạt skill `superpowers:writing-plans`, phân tích kiến trúc + rủi ro, xuất
**Implementation Plan** chi tiết ra `docs/superpowers/plans/YYYY-MM-DD-spec-05-<ten>.md`.
Plan phải đủ để một agent **không có context dự án** code đúng: đường dẫn file chính xác,
chữ ký hàm, code mẫu cho từng bước, lệnh test và kết quả mong đợi, mục "Global Constraints",
mục "Kiến thức nền" và mục "Những chỗ tuyệt đối không được làm".
Commit plan trước khi giao việc.

**Bước 2 — Delegation (AGY code, không phải bạn).**
Toàn bộ code thực tế giao cho **AGY (Antigravity CLI)**, cắt theo từng task trong plan.
Bạn không tự viết code tính năng ở bước này.

**Bước 3 — Verification (bạn tự làm).**
Nhận kết quả AGY rồi review thật: đọc diff, `pnpm check`, `pnpm test`, `pnpm build` (chạy trong
`web/`), và **nghiệm thu trong trình duyệt** bằng `agent-browser` theo đúng mục "Tiêu chí nghiệm
thu" của spec. Lỗi nào sửa được nhanh thì bạn sửa và ghi rõ; lỗi thuộc cấu trúc thì giao AGY làm lại.
Đạt: đổi trạng thái spec thành **Complete** trong header spec + bảng ở `docs/specs/README.md`,
viết `docs/handoff/SPEC-05.md`, commit.

## Ràng buộc

- **Không spawn subagent nội bộ.** Không dùng Task/Agent tool cho việc code. Mọi tác vụ code
  ủy quyền ra AGY. Bạn chỉ plan, review, sửa lỗi nhỏ và nghiệm thu.
- **Handoff bằng file, không bằng context.** Mọi thông tin dùng chung giữa các SPEC phải nằm
  trong `docs/handoff/<spec-id>.md`, không giữ trong context.
- **Commit từng SPEC.** Commit theo từng task AGY hoàn thành + commit sửa lỗi riêng. Không push.
- Tuân thủ `AGENTS.md` ở root (Dexie là nguồn sự thật, ôn tập chỉ qua `fsrs.ts`, token Washi,
  `size="quiz"`, chỉ dùng pnpm...).

## Đã chốt ở phiên trước — đừng dò lại

**Orca orchestration KHÔNG chạy được AGY.** `orca orchestration worker-start --agent agy` trả
`consumer_fenced`, sau `run-create` trả `agent_unconfigured`; Orca 1.4.205 chỉ biết
`claude | codex | cursor`. Đã thử hết, đừng thử lại.

**Cách giao việc cho AGY đang dùng** — chạy trong `D:\Projects\Lab\Japanese`:

```bash
# Cách A: chạy nền, lấy kết quả text (dùng cho task ngắn)
agy -p "<nội dung task>" --dangerously-skip-permissions --mode accept-edits \
    --model gemini-3.8-flash-high --effort high --print-timeout 900000

# Cách B: xem AGY chạy trực tiếp trong terminal Orca (đang dùng)
orca terminal create --name agy-spec05 --cwd D:\Projects\Lab\Japanese
orca terminal send --terminal <id> --text 'agy -i "<nội dung task>" --dangerously-skip-permissions --mode accept-edits --model gemini-3.8-flash-high --effort high'
orca terminal wait --terminal <id> --for tui-idle
orca terminal read --terminal <id>
orca terminal close --terminal <id>          # dọn khi xong
```

Mỗi task: đưa AGY **nguyên văn task đó trong plan** + đường dẫn plan để nó tự đọc lại, đừng tóm tắt.

**Nghiệm thu trình duyệt** — `agent-browser` 0.38.1 đã cài sẵn (`open`, `eval`, `click`,
`keyboard type`, `press`, `set media dark|reduced-motion`, `set offline on|off`, `set viewport`,
`close --all`). Dev server port 3000 do người dùng tự chạy, đừng tự khởi động lại.
Đo bằng `eval` trên DOM/IndexedDB thật, đừng suy đoán. Nhớ `agent-browser close --all` khi xong.

## Bài học từ SPEC-04 (đọc để plan không lặp lại)

Bảy lỗi bắt được, ba lỗi nằm trong plan tôi viết. Những cái dễ tái phạm:

1. `setState` thẳng trong thân `useEffect` bị `react-hooks/set-state-in-effect` chặn → `pnpm check`
   exit 1. Hook nạp dữ liệu phải **suy ra** `loading`, không giữ state riêng.
2. Nút đã chấm dùng `aria-disabled`, **không** `disabled` — `disabled:opacity-50` làm mờ chính ô
   mang phản hồi đúng/sai và đẩy nó khỏi tab order.
3. Dữ liệu câu hỏi mang **notation furigana thô** (`私[わたし]は`) ở `pairs[].jp`, khối từ `reorder`
   và `prompt` của `listening` → phải render qua `<Furigana>`, TTS phải qua `toKanaSentence()`.
4. **Không bao giờ `wanakana.bind()` lên input controlled của React** — gõ "ha" màn hình hiện "は"
   nhưng state đọng "h", câu đúng bị chấm sai. Dùng `toTypedKana()` trong `onChange`.
5. `layout.tsx` bọc children trong `pb-32 sm:pb-40` cho dock SPEC-02 → màn toàn khung phải
   `fixed inset-0 z-40` và ẩn `AppNav`, nếu không trang cuộn.
6. `pnpm check` + `pnpm test` + `pnpm build` xanh **không** chứng minh app chạy đúng. Hai lỗi
   nặng nhất của SPEC-04 chỉ lộ ra khi bấm thật trong trình duyệt.

Bắt đầu bằng Bước 1.
