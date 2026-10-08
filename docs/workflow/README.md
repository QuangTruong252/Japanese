# Quy trình làm việc nhiều agent

Vai trò gắn với **trách nhiệm**, không gắn với model hay công cụ. Bất kỳ agent nào (Claude, Gemini,
GPT…, qua CLI nào) cũng có thể nhận bất kỳ vai trò nào; Điều phối chọn theo năng lực và chi phí
của từng task và ghi lựa chọn vào brief.

## Vai trò

| Vai trò | Làm gì | Không làm |
|---|---|---|
| **Người dùng** | Chốt hướng, duyệt mockup (cổng G1) và kết quả cuối (cổng G2). | — |
| **Điều phối** | Trao đổi với người dùng; khảo sát code; chia task; viết brief; chọn agent cho từng vai; duyệt kết quả từng bước; chạy QA trình duyệt; commit; cập nhật `AGENTS.md`/`DESIGN.md`. | Đưa kết quả cho người dùng khi chưa tự QA. |
| **Thiết kế** | Mockup dạng ảnh cho màn chưa có thiết kế; ảnh minh họa; icon. Cần khả năng tạo ảnh. | Sửa code app. |
| **Triển khai** | Code đúng brief, chỉ trong các file được giao; chạy `pnpm check` (và `pnpm test` khi đổi logic). | Chạy dev server/build, commit, sửa ngoài phạm vi. |
| **Review** | Đọc diff đối chiếu brief, `DESIGN.md`, `AGENTS.md`; trả danh sách lỗi có mức độ. | Sửa code, commit. |

Ràng buộc khi chọn agent:
- Review phải là agent khác (hoặc model khác) với agent Triển khai của cùng task.
- Thiết kế cần công cụ tạo ảnh; mockup để người dùng duyệt là **ảnh** (HTML chỉ khi người dùng yêu cầu).
- Task nhỏ có thể gộp vai, trừ Review độc lập và QA của Điều phối.

## Quy trình một màn (redesign v3)

| Bước | Ai | Đầu ra |
|---|---|---|
| 0. Khảo sát | Điều phối | Hành vi, trạng thái, dữ liệu thật của màn (đọc từ code). Hành vi giữ nguyên, chỉ đổi giao diện trừ khi người dùng quyết khác. |
| 1. Mockup | Thiết kế | Ảnh 390 px (sáng; tối khi cần) theo `briefs/mockup.md`. |
| **G1** | Người dùng | Duyệt (có thể nhiều vòng). Bản duyệt lưu `design/<màn>/mockup-vN.png`. |
| 2. Triển khai | Triển khai | Code theo `briefs/implement.md`. |
| 3. Review | Review | Danh sách lỗi theo `briefs/review.md`. |
| 4. Sửa | Triển khai hoặc Điều phối | Sửa lỗi Chặn và Nên sửa (Gợi ý: Điều phối quyết). |
| 5. QA | Điều phối | `pnpm check`, `pnpm test`, `pnpm build`; ảnh chụp app cạnh mockup; danh sách điểm lệch đã xử lý. |
| **G2** | Người dùng | Review kết quả. |
| 6. Đóng | Điều phối | Commit; lưu `design/<màn>/as-built-{light,dark}.png`; cập nhật "Trạng thái màn" trong `DESIGN.md`; xóa code legacy không còn ai dùng. |

Task nhỏ (sửa lỗi, chỉnh theo góp ý): bỏ bước 1 và G1; các bước còn lại giữ, đặc biệt QA trước G2.

## Brief và trao đổi

- Mẫu: `briefs/implement.md`, `briefs/review.md`, `briefs/mockup.md`, `briefs/asset.md`.
- Mỗi task một thư mục làm việc `.work/<YYYYMMDD-slug>/` (git bỏ qua): `brief.md`, `report.md`,
  `review.md`, ảnh nháp. Chỉ thứ đã duyệt mới vào repo (`design/`, code, asset).
- Brief phải tự đủ: agent nhận việc không thấy lịch sử chat. Ghi rõ file được sửa, hành vi phải giữ,
  dữ liệu tiếng Nhật thật lấy từ đâu, tiêu chí nghiệm thu đo được, việc cấm.
- Báo cáo ngắn: file đã đổi, lệnh đã chạy và kết quả, chỗ lệch so với brief và lý do, việc chưa chắc.

## Git

- Làm trên nhánh feature. Chỉ Điều phối commit, mỗi task một commit (message nói vì sao), sau khi QA.
- Không push, merge hay force khi người dùng chưa yêu cầu. Không commit `.work/`, `.ui-qa/`.

## Kiểm tra UI

Dev server do người dùng hoặc Điều phối chạy (`pnpm dev`, cổng 3000); agent khác không bật/tắt nó.

```sh
# Chụp màn hình theo trạng thái dữ liệu, theme, độ rộng (ảnh vào .ui-qa/, git bỏ qua)
node scripts/ui-qa/shoot.mjs --states normal,many --themes light,dark --widths 390,1280      # Bảng tin
node scripts/ui-qa/shoot.mjs --route hoc/tra-cuu --states normal                            # route khác: không có "/" đầu
# Ghép mockup và ảnh chụp cạnh nhau để so
node scripts/ui-qa/compare.mjs design/home/mockup-v3.png .ui-qa/home/normal-light-390.png
```

- Trạng thái dữ liệu (`scripts/ui-qa/seed.js`): `new`, `normal`, `many`, `done`. Seed ghi vào
  profile trình duyệt của công cụ chụp, không đụng dữ liệu thật của người dùng.
- So từng phần với mockup: nhãn, icon, viền, hình ô, ảnh, đậm/nghiêng chữ, khoảng cách. Mỗi điểm lệch
  phải được sửa hoặc ghi lý do giữ trước khi đưa người dùng (G2).
- Checklist đầy đủ: `DESIGN.md` §12.

## Ghi chú vận hành

Ghi chú theo công cụ, không phải luật vai trò.

- **Điều phối nhiều agent:** Orca (`orca skills get orchestration` để xem hướng dẫn đúng phiên bản).
  Worker chạy trong cùng checkout; brief truyền qua `.work/`.
- **CLI chạy không tương tác:** đóng stdin (`< /dev/null`), nếu không một số CLI (vd. `codex exec`)
  sẽ treo chờ input. Chỉ dùng chế độ bỏ qua sandbox/approval khi người dùng đã cho phép.
- **Tạo ảnh:** đính kèm ảnh tham chiếu bằng đường dẫn file; chép ảnh kết quả (đúng bytes) vào `.work/`.
- **Trình duyệt:** `agent-browser`. Trang cuộn trong `#app-scroll-container`, nên để chụp hết trang
  hãy đặt viewport cao bằng nội dung thay vì `--full` (`shoot.mjs` đã làm). Gỡ lớp phủ dev của Next (`nextjs-portal`) trước khi chụp.
- **Next:** không chạy `pnpm build` khi `pnpm dev` đang chạy trong cùng `web/` (dùng chung `.next`).
- **Windows:** tên file Unicode trong git cần `git -c core.quotepath=false`; đường dẫn có `[so]`
  phải đặt trong ngoặc kép.
