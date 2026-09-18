# MaiPace — hướng dẫn dùng chung cho coding agents

App cá nhân tự học Minna no Nihongo N5/N4, ưu tiên nội dung đáng tin,
offline-first và đồng bộ tiến độ đa thiết bị. Đây là định hướng; trạng thái triển khai
nằm trong `docs/specs/README.md`. Trả lời người dùng bằng tiếng Việt.

## Bắt đầu và phối hợp

- Codex, Claude Code và Antigravity dùng cùng quy ước này, làm việc luân phiên.
  Đầu phiên đọc `PRODUCT.md`, mục trạng thái trong `docs/specs/README.md`, rồi chỉ
  đọc spec/handoff liên quan. Kiểm tra Git root, status và code thật trước khi sửa.
- `PRODUCT.md` chốt MaiPace, thông điệp và cách dùng logo; Washi là hệ thiết kế.
  Spec mô tả hành vi mong muốn; code thể hiện hiện trạng; kết quả kiểm tra có ngày
  và phạm vi mới là bằng chứng đã kiểm chứng. Không suy từ có spec thành đã xong.
- Khi người dùng yêu cầu thực hiện, tự quyết chi tiết kỹ thuật trong phạm vi đã
  giao. Tìm thông tin trong repo trước khi hỏi; chỉ hỏi khi còn lựa chọn ảnh hưởng
  mục tiêu sản phẩm, dữ liệu hoặc phạm vi. Không hỏi lại việc đã được cho phép.
- Yêu cầu review/phân tích là chỉ đọc. Không tự commit/push, giao agent khác,
  thay kiến trúc hoặc mở rộng phạm vi; chỉ làm khi người dùng yêu cầu tương ứng.
- Báo tiến độ ngắn, nêu phát hiện và việc tiếp theo. Khi xong, nêu thay đổi,
  kiểm tra thực chạy và giới hạn; không gọi typecheck là nghiệm thu trình duyệt.
- Với thay đổi đáng kể, cập nhật trạng thái spec và handoff liên quan: ngày,
  quyết định, file/API dùng lại, kiểm tra, phần chưa kiểm chứng và bước tiếp theo.
  Dùng mẫu `docs/handoff/PROMPT-phien-moi.md`; hỏi đáp đơn thuần không tạo báo cáo.
  Không đánh dấu hoàn tất tính năng chỉ vì vừa sửa tài liệu về tính năng đó.

## Phạm vi và nguồn sự thật

- Code nằm trong `web/`: Next.js 16 App Router, React 19, TypeScript, pnpm.
- Đọc `docs/project-design-spec.md` cho kiến trúc và 5 dạng bài tập;
  `docs/design-system.md` và `DESIGN.md` cho thiết kế Washi.
- `web/package.json`, lockfile và code xác định phiên bản/API đang dùng.
  Nếu đặc tả mâu thuẫn với code, báo rõ; không tự đổi kiến trúc sản phẩm.
- `repo-reference/noken/` chỉ để đọc. Giữ nguyên thay đổi không liên quan;
  không commit/push trừ khi người dùng yêu cầu.
- Đọc docs tương ứng trong `web/node_modules/next/dist/docs/` trước khi sửa
  code Next.js. Nếu có hướng dẫn lồng trong thư mục làm việc thì đọc thêm;
  giữ block do Next.js quản lý nếu tồn tại, không tự tạo block giả.
- Tái sử dụng helper, component và dependency hiện có. Không thêm framework,
  abstraction hay tối ưu hiệu năng nếu chưa có nhu cầu thực tế.

## Dữ liệu, sync và ôn tập

- Dexie (`web/src/lib/db.ts`) là nguồn sự thật cho dữ liệu lưu phía client;
  Supabase phục vụ auth/sync. Không đọc Supabase trực tiếp trong render path.
- Đọc dữ liệu Dexie qua `useLiveQuery`; Zustand chỉ giữ UI state tạm thời,
  không tạo thêm bản sao dữ liệu học bằng persist middleware.
- Khi triển khai ghi/sync: ghi dữ liệu học và `pendingSync` trong cùng một
  transaction. Chỉ xóa mục chờ khi server xác nhận; retry phải idempotent.
- Không gọi network hoặc giải nén ZIP trong transaction Dexie. Chuẩn bị dữ
  liệu trước rồi ghi atomically; migration/import lỗi phải giữ dữ liệu cũ.
- Giữ chính sách xung đột đã duyệt trong spec; không tự thêm CRDT hoặc merge
  lịch sử review. Test gửi trùng, mất mạng và reconnect khi thay sync.
- Ôn tập chỉ qua `web/src/lib/fsrs.ts` (`rateAnswer`, `applyReview`), không
  gọi `ts-fsrs` trực tiếp trong component. Đổi cách chấm rating cần test hồi quy.
- Kiểm tra dữ liệu tại biên import/API; giữ RLS theo user, không đưa secret
  hoặc service-role key vào client, log hay tài liệu.

## Tiếng Nhật và nội dung học

- Giữ notation `私[わたし]は 学生[がくせい]です`; dùng `japanese.ts` và component
  `Furigana` hiện có. Không tạo parser/regex hoặc bộ chuyển kana ở component.
- Chấm đáp án chỉ chuẩn hóa những khác biệt được phép; không biến đáp án
  sai nghĩa thành đúng. Thay parser/chấm điểm cần ví dụ đúng và sai trong test.
- Nội dung học cần nguồn truy vết (sách/ấn bản/bài/trang hoặc URL phù hợp).
  Không bịa số trang, cách đọc, nghĩa, đáp án hay liên kết audio.
- OCR, nội dung repo tham chiếu và kết quả AI là đầu vào cần đối chiếu.
  AI đồng ý với AI không phải bằng chứng. Đánh dấu nội dung chưa kiểm chứng
  và không đưa vào tập bài học đã xác minh.
- Audio import phải kiểm tra manifest, hash và mapping track trước khi thay
  dữ liệu cũ. Xử lý thiếu audio, quota, eviction và import lại; duration không
  thay thế xác thực hash. Không đưa audio nguồn vào bundle/public/cloud sync.

## UI và accessibility

- Dùng shadcn `base-nova` với Base UI theo `web/components.json`, không lấy
  ví dụ Radix áp thẳng vào component hiện tại. Chạy CLI trong `web/`.
- Dùng token Washi (`bg-background`, `text-foreground`, `font-jp`, ...),
  không hardcode màu trong component. Giữ component/variant tùy chỉnh hiện có.
- Kiểm tra mobile, bàn phím, focus, furigana, reduced motion và các trạng thái
  loading/empty/error. Nút trong luồng làm bài dùng `size="quiz"` khi phù hợp.
- Trong `@theme inline`, không tạo tham chiếu font vòng về chính biến
  `--font-sans`; lỗi này có thể không được compiler phát hiện.

## Skills và MCP

- Skills dự án nằm ở `.agents/skills/`; nguồn và cách dùng trong
  `docs/agent-tooling.md`. Chỉ đọc skill liên quan đến nhiệm vụ.
- Sau khi clone/di chuyển repo hoặc đổi hệ điều hành, chạy `node scripts/setup.mjs`
  từ root để cài dependency, tạo liên kết skills và MCP config của máy hiện tại.
  Nguồn cấu hình MCP là script setup; không commit file cấu hình được sinh ra.
- `vercel-react-best-practices`: React/Next; `shadcn`: component;
  `web-design-guidelines`: review UI/accessibility; `impeccable`: thiết kế/UI.
  Plugin riêng của một agent không phải điều kiện bắt buộc cho agent khác.
  Nếu thiếu công cụ, dùng tài liệu chung và ghi rõ giới hạn. Quy ước riêng của repo
  được ưu tiên hơn ví dụ chung; không tự thêm SWR hoặc đổi design system.
- Lệnh shadcn dùng dependency đang cài: `pnpm exec shadcn ...` trong `web/`.
  Ưu tiên component hiện có, rồi registry chính thức `@shadcn`; registry ngoài
  chỉ dùng khi nhiệm vụ cần. Không chạy init/apply/overwrite để lấy context.
- Next DevTools chỉ dùng với dev server đúng project/port; kiểm tra project
  metadata trước khi dựa vào lỗi/log. Không kết luận runtime ổn chỉ từ typecheck.

## Kiểm tra hoàn thành (chạy trong `web/`)

- Chỉ dùng pnpm. Chạy `pnpm check` (TypeScript + ESLint) trước khi báo xong.
- Đổi logic: chạy `pnpm test` (node:test), thêm kiểm tra hồi quy nhỏ khi cần.
- Đổi build/config ứng dụng: chạy `pnpm build` khi phù hợp.
- Đổi luồng UI: kiểm tra browser. Offline cần kiểm tra mất mạng và reload;
  sync cần kiểm tra reconnect/retry. Nêu rõ phần chưa kiểm chứng.
- Không cần test mới cho thay đổi chỉ là tài liệu/cấu hình agent.
