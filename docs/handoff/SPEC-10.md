# Handoff — SPEC-10 (Trình phát Shadowing A-B repeat)

Ngày: 23/09/2026. Trạng thái: Đã hoàn tất mã nguồn, component ShadowingPlayer theo mockup 21-shadowing.png, tích hợp vào /hoc/[so]; Static gates & Tests PASS 100%; Sẵn sàng nghiệm thu trình duyệt.

## Thay đổi và quyết định

- **Thư viện thuần ([web/src/lib/shadowing.ts](file:///d:/Projects/Lab/Japanese/web/src/lib/shadowing.ts)):**
  - Hàm định dạng thời gian `formatTime(seconds: number): string` chuẩn hóa mm:ss (vd: `00:42 / 03:15`), xử lý an toàn các giá trị âm, NaN.
  - Hàm chuẩn hóa mốc lặp A-B `normalizeLoopPoints(a, b, duration)`: tự động hoán đổi khi đặt B trước A (SPEC-10 §2.2), ràng buộc khoảng cách tối thiểu `B > A + 0.5s`, clamp mốc trong khoảng thời lượng `[0, duration]`.
  - Hàm `isTypingTarget(target)` phát hiện người dùng đang thao tác trong `input`, `textarea`, `select` hoặc `contenteditable` để tránh cướp phím tắt.
  - Bộ unit test ([web/src/lib/shadowing.test.ts](file:///d:/Projects/Lab/Japanese/web/src/lib/shadowing.test.ts)) bao phủ 100%.
- **Component Trình phát Shadowing ([web/src/components/audio/ShadowingPlayer.tsx](file:///d:/Projects/Lab/Japanese/web/src/components/audio/ShadowingPlayer.tsx)):**
  - Thiết kế theo sát [mock/21-shadowing.png](file:///d:/Projects/Lab/Japanese/mock/21-shadowing.png):
    - 4 tab track (`Từ vựng`, `Mẫu câu`, `Câu ví dụ`, `Hội thoại`) với đường gạch chân đỏ thương hiệu Washi (`border-primary`). Chỉ hiển thị những track có thật trong bài học.
    - Thanh scrubber tùy chỉnh: vạch tiến trình màu `primary`, mốc đánh dấu trực quan `A` và `B`, dải lặp tô nhẹ `primary/25`, thời gian hiện tại / tổng thời lượng.
    - Nút Play/Pause tròn 56px (`bg-primary`), hai nút tua nhanh ±10 giây (`⟲ 10` và `10 ⟳`) 44px hai bên.
    - Chip chọn tốc độ: `0.75×`, `0.85×`, `1.0×`, `1.2×` (giữ nguyên cao độ âm thanh nhờ `audio.playbackRate`).
    - Hàng nút hành động: `Đặt A`, `Đặt B`, `Lặp` (đổi trạng thái `aria-pressed`).
    - Khối Câu ví dụ tham khảo: hiển thị các câu ví dụ của bài kèm Furigana, bản dịch và nhãn trung thực *"Không phải bản chép lời của track. Chưa đối chiếu với nội dung track."* (SPEC-10 §2.4).
    - Trạng thái bài chưa có audio: hiển thị card mời nạp dẫn sang `/cai-dat/audio`.
  - Quản lý bộ nhớ nghiêm ngặt: tạo Blob URL và bắt buộc gọi `URL.revokeObjectURL(url)` khi đổi track hoặc unmount, tránh rò rỉ RAM (SPEC-10 §2.1).
  - Lặp A-B mượt mà trong `timeupdate`: gán trực tiếp `audio.currentTime = loopPoints.loopA` mà không gọi `pause()` rồi `play()`, tránh tiếng giật/khục (SPEC-10 §6).
  - Phím tắt bàn phím: `Space` (Play/Pause, chặn cuộn trang), `[` (Đặt A), `]` (Đặt B), `R` (Lặp), `T` (Ẩn/hiện ví dụ), `←` `→` (±10s).
- **Tích hợp vào Màn hình Bài học ([web/src/app/hoc/[so]/page.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/hoc/[so]/page.tsx)):**
  - Nhúng `ShadowingPlayer` vào khối Audio ở cuối trang bài học theo đúng thứ tự SPEC-03 §3.2 (Từ vựng → Ngữ pháp → Audio → Nguồn → CTA Luyện tập).

## Kiểm chứng

- **Kiểm tra tĩnh & Unit Tests (23/09/2026):**
  - `pnpm check`: PASS (TypeScript 0 lỗi, ESLint 0 cảnh báo).
  - `pnpm test`: PASS 111/111 unit tests (bao gồm 7 unit test mới trong `src/lib/shadowing.test.ts`).
  - `pnpm build`: PASS (tạo production bundle thành công cho 12 route, bao gồm 25 trang bài học SSG `/hoc/1`..`/hoc/25`).
- **Trình duyệt:**
  - Sẵn sàng để người dùng nghiệm thu thực tế trên trình duyệt.

## Bước tiếp theo

- Đã hoàn tất toàn bộ **Chuỗi Audio & Trình phát (SPEC-09 & SPEC-10)** của Đợt 3.
- Sẵn sàng chuyển sang **Chuỗi Tra cứu (SPEC-12: Tra cứu kanji, động từ, 10 bảng tham chiếu & SPEC-13: Hộp tìm kiếm Ctrl+K)**.
