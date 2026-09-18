# Khởi động và bàn giao phiên coding agent

Dùng cho Codex, Claude Code và Antigravity tại root repository. Mặc định một
agent thực hiện, agent khác có thể tiếp nối phiên sau; không tự giao thêm agent.
Plugin, model và môi trường của mỗi công cụ không phải điều kiện để hiểu dự án.

## Mẫu giao việc

Thay các chỗ trong ngoặc nhọn rồi gửi cho agent:

```text
Làm việc trên MaiPace theo quy ước chung của repo.
Mục tiêu: {kết quả cần đạt hoặc SPEC cần tiếp tục}.
Chế độ: {triển khai | chỉ review/phân tích}.
Phạm vi: {phần được thay đổi và giới hạn nếu có}.
Tiêu chí xong: {hành vi quan sát được và kiểm tra cần đạt}.
Bàn giao trước: {file handoff liên quan, nếu có}.

Đọc AGENTS.md, PRODUCT.md, mục trạng thái trong docs/specs/README.md,
rồi chỉ spec/handoff và code liên quan. Kiểm tra Git status trước khi sửa.
Tự xử lý chi tiết kỹ thuật trong phạm vi. Nếu có mâu thuẫn ảnh hưởng sản phẩm
hoặc dữ liệu thì nêu bằng chứng và hỏi quyết định còn thiếu.
Không tự commit/push, giao agent khác, mở rộng phạm vi hay đổi kiến trúc.
Báo kết quả kiểm tra thực tế, phần chưa kiểm chứng và bước tiếp theo.
```

Việc nhỏ có thể mô tả trực tiếp trong chat, không bắt buộc lập plan nhiều bước.
Việc lớn cần plan vừa đủ thể hiện hành vi, phạm vi, rủi ro và cách nghiệm thu;
không bắt buộc plugin Superpowers, model cụ thể hay code mẫu cho mọi dòng.

## Trình tự làm việc

1. Đọc nguồn chung, kiểm tra code và xác nhận phạm vi bằng một cập nhật ngắn.
2. Triển khai thay đổi nhỏ nhất đủ yêu cầu. Review/phân tích chỉ đọc cho tới khi
   người dùng yêu cầu sửa. Giữ nguyên dirty changes ngoài phạm vi.
3. Chạy kiểm tra theo AGENTS.md; UI phải thử trong browser. Xác nhận đúng project
   và port trước khi dùng server. Không dừng/restart server của người dùng.
4. Với thay đổi đáng kể, cập nhật handoff và hàng trạng thái liên quan. Không
   đánh dấu feature hoàn tất nếu chỉ mới có code hoặc chỉ chạy static gates.

## Mẫu handoff

Lưu `docs/handoff/<SPEC-ID hoặc tên-phạm-vi>.md`; cập nhật file liên quan thay
vì tạo một tầng báo cáo mới cho từng lời nhắn.

```markdown
# Handoff — <phạm vi>
Ngày: <YYYY-MM-DD>. Trạng thái: <đã có code / đã kiểm chứng / còn vướng>.

## Thay đổi và quyết định
- Hành vi trước/sau, quyết định đã chốt, phạm vi không thay đổi.
- File/API dùng lại và liên kết spec liên quan; không chép lại toàn bộ code.

## Kiểm chứng
- Lệnh/kịch bản — PASS / FAIL / CHƯA CHẠY; ngày, môi trường, bằng chứng ngắn.
- Browser: route, viewport, dữ liệu/trạng thái thử và giới hạn.
- Báo cáo cũ: nêu ngày và không trình bày như vừa chạy lại.

## Còn lại và bước tiếp theo
- Việc chưa làm/chưa kiểm chứng, blocker và hành động cụ thể tiếp theo.
```

## Kinh nghiệm kỹ thuật giữ lại từ SPEC-04

Nguồn: [handoff ngày 17/09/2026](SPEC-04.md). Kiểm tra lại code khi áp dụng:

- Suy ra loading từ dữ liệu; tránh setState đồng bộ trong effect chỉ để sao chép state.
- Nút đã chấm dùng `aria-disabled` khi cần giữ focus và màu phản hồi.
- Notation Nhật render qua `Furigana`; câu TTS đi qua `toKanaSentence()`.
- Input React controlled dùng `toTypedKana()`, không dùng `wanakana.bind()`.
- Màn phiên luyện tập cần xét khoảng chừa dock ở layout, không đẩy đáp án ra ngoài viewport.
- Check/test/build xanh không thay thế thao tác trình duyệt; offline reload và
  reconnect cần kịch bản riêng, không suy từ việc ghi Dexie thành công.

Các lệnh orchestration, model và ghi nhận lỗi CLI của phiên cũ không còn là
quy trình mặc định. Chỉ thiết lập giao việc nhiều agent khi người dùng yêu cầu.
