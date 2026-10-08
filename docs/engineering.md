# Quy ước code

## Lệnh

Node 24+, **chỉ dùng pnpm** (11.9.0). Chạy trong `web/`:

| Lệnh | Khi nào |
|---|---|
| `pnpm check` | TypeScript + ESLint. Bắt buộc trước khi báo xong. |
| `pnpm test` | `node:test` cho `src/lib/*.test.ts`. Khi đổi logic. |
| `pnpm build` | Khi đổi cấu hình, build hoặc phụ thuộc. Không chạy khi `pnpm dev` đang chạy cùng thư mục. |
| `pnpm dev` | Chỉ vai trò Điều phối/QA (`docs/workflow/README.md`). |

Máy mới: `node scripts/setup.mjs` ở root (test: `node --test scripts/setup.test.mjs`).

## Next.js và UI

- Next.js 16 khác nhiều so với bản cũ: tra API trong `web/node_modules/next/dist/docs/` trước khi
  viết code Next.
- shadcn là base-nova trên Base UI (`web/components.json`): không chép ví dụ Radix; chạy CLI shadcn
  trong `web/`. Không tạo button mới, dùng `buttonVariants`.
- Màu và font qua token (`globals.css`); không hardcode. Trong `@theme inline` không tham chiếu vòng
  `--font-sans` (hỏng ngầm, không báo lỗi).
- Chuẩn giao diện: `DESIGN.md`.

## Dữ liệu, sync, ôn tập

- Dexie (`lib/db.ts`) là nguồn sự thật phía client; đọc qua `useLiveQuery`. Zustand chỉ giữ UI state
  tạm, không persist bản sao dữ liệu học.
- Ghi dữ liệu học và `pendingSync` trong cùng một transaction; chỉ xóa mục chờ khi server xác nhận;
  retry phải idempotent. Không gọi mạng hay giải nén ZIP trong transaction Dexie; chuẩn bị dữ liệu
  trước rồi ghi một lần, lỗi thì giữ dữ liệu cũ.
- Supabase chỉ cho auth và sync, không đọc trực tiếp trong render. Không đưa secret hay service-role
  key vào client, log hoặc tài liệu. Giữ RLS theo user.
- Ôn tập chỉ qua `lib/fsrs.ts` (`rateAnswer`, `applyReview`), không gọi `ts-fsrs` trong component.
- Đổi schema Dexie: thêm `version(n)` mới kèm `upgrade`, không sửa version cũ.

## Test

- `node:test`, file `src/lib/<module>.test.ts` cạnh module. Logic mới hoặc sửa lỗi logic: thêm ít
  nhất một test hồi quy (có ví dụ đúng và sai khi là parser hoặc chấm điểm).
- Đổi cách chấm ôn tập, parser furigana, chấm đáp án: bắt buộc có test.
- Thay đổi chỉ là tài liệu hoặc cấu hình agent: không cần test mới.

## Viết code

- Sửa lỗi ở gốc: tìm mọi nơi gọi hàm trước khi sửa, sửa một lần ở chỗ dùng chung.
- Dùng lại thứ đã có trong repo trước khi viết mới; không thêm dependency khi brief không cho phép.
- Comment giải thích *vì sao*, tự đủ nghĩa; không trỏ `SPEC-xx` hay đường dẫn trong `docs/`.
- Không để code chết: component, export, CSS không còn ai dùng thì xóa trong cùng thay đổi.
