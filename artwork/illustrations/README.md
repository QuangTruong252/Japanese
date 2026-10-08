# Ảnh minh họa

Nguồn, prompt và pipeline của mọi ảnh minh họa. Phong cách vẽ: [`STYLE.md`](STYLE.md) và ảnh mẫu
[`reference/paper-town-style-v1.png`](reference/paper-town-style-v1.png). Cách dùng ảnh trong giao diện:
`DESIGN.md` §8.

## Hai nơi lưu

```text
web/public/assets/illustrations/<nhóm>/<stem>.webp   # chỉ file đã xuất để phục vụ web
artwork/illustrations/<nhóm>/<stem>.png              # bản gốc
artwork/illustrations/<nhóm>/<stem>.json             # provenance: prompt, nguồn, crop, encode, SHA-256
artwork/illustrations/atlases/                       # ảnh nhiều chủ thể + manifest crop
artwork/illustrations/batches/<tên>.json             # khai báo mỗi đợt (nguồn sự thật của đợt)
```

Không đặt PNG, JSON, prompt hay ảnh thử vào `public/`. Icon không làm ở đây (`artwork/icons/`).

## Quy ước

- Tên: `<subject>[-<variant>]-v<revision>`, ASCII thường, kebab-case, tiếng Anh nói đúng nội dung
  (`station-platform-v1`). Không ngày, không tên model, không kích thước trong tên.
- File `-vN` đã được app tham chiếu là **bất biến**: đổi nội dung, crop, alpha hay cách nén thì xuất
  `-v(N+1)` và cập nhật tham chiếu.
- Thư mục theo vai trò ảnh, không theo bài; một ảnh có thể dùng cho nhiều từ hoặc nhiều bài.

| Nhóm | Khuôn xuất | Nền | Dùng cho |
|---|---|---|---|
| `vocab` | 512 × 512, chủ thể vừa 416 px | alpha thật | Nghĩa một từ |
| `scenes` | 800 × 600 | đục | Cover bài (tranh đầu màn) |
| `grammar` | 800 × 600 | đục | Tình huống ngữ pháp |
| `ui/banners` | 1200 × 400 | đục | Banner |
| `ui/states` | 512 × 512 | alpha thật | Trạng thái xong, trống |
| `ui/sections` | 512 × 512 | alpha thật | Ảnh chung cho hàng phần bài |

WebP quality 82, alphaQuality 100. Ngân sách: cutout ~50 KB, ảnh đục ~150 KB (vượt chỉ là cảnh báo).
Không có chữ, kana/kanji, logo hay nút trong ảnh.

## Quy trình một đợt

Chạy ở root repo (thêm `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON` sau `node` để tắt cảnh báo):

```sh
node artwork/illustrations/tools/batch.mjs prompts artwork/illustrations/batches/<tên>.json   # sinh <tên>.prompts.md từ template chung
node artwork/illustrations/tools/batch.mjs collect artwork/illustrations/batches/<tên>.json   # lấy ảnh đã tạo về đúng đích
node artwork/illustrations/tools/batch.mjs check   artwork/illustrations/batches/<tên>.json   # kiểm, không ghi file
node artwork/illustrations/tools/batch.mjs export  artwork/illustrations/batches/<tên>.json   # PNG gốc + WebP + sidecar
node artwork/illustrations/tools/batch.mjs sheet   artwork/illustrations/batches/<tên>.json   # ảnh review sáng/tối vào reports/ (không commit)
node artwork/illustrations/tools/batch.mjs link    artwork/illustrations/batches/<tên>.json   # gắn tham chiếu vào dữ liệu học
```

1. **Lập đợt** trong `batches/<tên>.json` (ví dụ: `batches/lesson-05.json`): nhóm, stem, chủ thể,
   ảnh tham chiếu, `target` trong dữ liệu học, `alt.vi`. Chỉ minh họa từ có nghĩa cụ thể. Đồ vật gọn
   cùng tỷ lệ: atlas 2×2 hoặc 4×2; người, hành động, vật dài: ảnh đơn; ảnh đã có đúng nghĩa: job
   `{"reuse": "vocab/<stem>", ...}`. Người dùng duyệt danh sách.
2. **Tạo ảnh** (vai trò Thiết kế): dùng prompt trong `<tên>.prompts.md`, không sửa tay; đính kèm ảnh mẫu
   phong cách; mỗi mục một lần gọi. Agent tạo ảnh không tự chép, cắt hay đổi tên file.
3. **`collect` → `check` → `export` → `sheet`** (vai trò Điều phối, script tất định). `check` chặn
   cutout chạm mép hoặc phải phóng quá 1,3×, ảnh đục lệch tỷ lệ khuôn quá 2%. Ô atlas hỏng: đánh dấu
   `skip` kèm lý do rồi thêm job ảnh đơn. `export` không ghi đè; chạy lại sẽ bỏ qua ảnh có hash khớp.
4. **Duyệt sheet** (Điều phối xem trước, rồi người dùng).
5. **`link`**: ghi `illustration` / `cover` / `illustrationCaption` vào JSON học, đặt sidecar thành
   `added-to-learning-data` (`web/src/lib/illustrations.test.ts` kiểm sidecar ↔ tham chiếu).
6. `pnpm check` và `pnpm test` trong `web/`; kiểm trình duyệt nếu đổi màn.

Ghi chú công cụ: `collect` hiện đọc ảnh từ thư mục `generated_images` của Codex CLI, khớp theo dòng
subject trong prompt. Ảnh tạo bằng công cụ khác: chép đúng bytes vào đường dẫn master rồi chạy `check`.
