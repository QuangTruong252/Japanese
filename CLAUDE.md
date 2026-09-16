# Japanese — web tự học Minna no Nihongo (N5 & N4)

App cá nhân, 1 người dùng. Offline-first, đồng bộ đa thiết bị.

## Bố cục repo

- `web/` — ứng dụng Next.js 16 (App Router) + React 19. Toàn bộ code nằm ở đây.
- `docs/` — đặc tả nguồn: `project-design-spec.md` (kiến trúc + 5 dạng bài),
  `project-brief-noken.md` (phân tích repo tham chiếu), `design-system.md`.
- `web/DESIGN.md` — design system "Washi" (token màu, typography). Nguồn sự thật về màu.
- `repo-reference/noken/` — repo Astro tham chiếu, **chỉ đọc**, không track trong git.

## Lệnh (chạy trong `web/`)

```bash
pnpm dev      # dev server
pnpm check    # tsc --noEmit && eslint  ← chạy trước khi báo xong việc
pnpm test     # node --test  (logic thuần trong src/lib)
pnpm build
```

Dùng **pnpm**, không dùng npm/yarn. `pnpm check` phải exit 0; đó là vòng phản hồi
duy nhất của dự án, không có CI.

## Quy ước

- **Dữ liệu**: Dexie/IndexedDB (`src/lib/db.ts`) là nguồn sự thật khi offline.
  Supabase chỉ để sync; ghi thay đổi vào bảng `pendingSync` rồi đẩy lên sau.
  Không đọc trực tiếp Supabase trong render path.
- **Furigana**: notation ngoặc vuông `私[わたし]は 学生[がくせい]です` trong mọi
  trường `jp`. Parse/strip qua `src/lib/japanese.ts`, không tự viết regex mới.
- **Ôn tập**: chỉ qua `src/lib/fsrs.ts` (`rateAnswer` + `applyReview`). Không gọi
  thẳng `ts-fsrs` ở tầng component.
- **Màu & font**: chỉ dùng token Tailwind (`bg-background`, `text-foreground`,
  `font-jp`…). Không hardcode hex/oklch trong component.
- **Next 16**: có breaking change so với kiến thức sẵn có. Đọc
  `web/node_modules/next/dist/docs/` trước khi viết API route / server action.

## Lỗi đã gặp (Claude sai 2 lần → ghi vào đây)

- Trong `@theme inline` của `globals.css`, không tham chiếu `var(--font-sans)` từ
  chính khối đó: giá trị được nội tuyến tại điểm dùng nên vòng lặp hỏng ngầm,
  không báo lỗi.
