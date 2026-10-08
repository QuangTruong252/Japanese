# MaiPace — điểm vào cho mọi agent

App cá nhân giúp người Việt tự học tiếng Nhật theo Minna no Nihongo (N5). Next.js chạy trong trình
duyệt, offline-first (dữ liệu học ở IndexedDB), giao diện tiếng Việt. Đang làm **redesign v3 "Sách sống"**.

## Luật luôn áp dụng

1. Code và test là nguồn sự thật về hành vi; repo không có spec theo tính năng. Mơ hồ thì hỏi người
   giao việc, không đoán.
2. Giao diện theo `DESIGN.md`. Không sao chép pattern từ màn chưa sang v3.
3. Không bịa tiếng Nhật: câu, từ, nghĩa lấy từ `web/src/data/n5/`.
4. Chỉ dùng pnpm, chạy trong `web/`. `pnpm check` phải pass trước khi báo xong.
5. Làm đúng vai trò và phạm vi file trong brief. Chỉ vai trò Điều phối commit; không push hay merge
   khi người dùng chưa yêu cầu.
6. Comment tự giải thích lý do, không trỏ tới tài liệu (tài liệu đổi, code ở lại).

## Cần gì, đọc ở đâu

| Việc | Đọc |
|---|---|
| Cấu trúc repo, routes, luồng dữ liệu | [`docs/architecture.md`](docs/architecture.md) |
| Viết hoặc sửa code: quy ước, lệnh, test | [`docs/engineering.md`](docs/engineering.md) |
| Giao diện | [`DESIGN.md`](DESIGN.md) |
| Dữ liệu học, tiếng Nhật, audio | [`docs/data/README.md`](docs/data/README.md) |
| Ảnh minh họa, icon | [`artwork/illustrations/README.md`](artwork/illustrations/README.md), [`artwork/icons/README.md`](artwork/icons/README.md) |
| Vai trò, quy trình, brief, kiểm tra UI | [`docs/workflow/README.md`](docs/workflow/README.md) |

Chỉ đọc file cần cho task của mình.
