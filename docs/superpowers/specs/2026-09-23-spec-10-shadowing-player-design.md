# Thiết kế SPEC-10 — Trình phát Shadowing (A-B repeat)

Ngày: 23/09/2026  
Mã: SPEC-JPN-F10  
Trạng thái: Approved design doc  
Nguồn tham chiếu: [SPEC-10](file:///d:/Projects/Lab/Japanese/docs/specs/SPEC-10-shadowing-player.md), [DESIGN.md](file:///d:/Projects/Lab/Japanese/DESIGN.md), [mock/21-shadowing.png](file:///d:/Projects/Lab/Japanese/mock/21-shadowing.png).

---

## 1. Mục tiêu & Phạm vi

### Trong phạm vi
- Component `ShadowingPlayer` đặt ở khối Audio cuối trang chi tiết bài học `/hoc/[so]`.
- Chọn phát 1 trong 4 track của bài đang học: Từ vựng (`vocab`), Mẫu câu (`sentence_patterns`), Câu ví dụ (`examples`), Hội thoại (`conversation`).
- Phát trực tiếp từ Blob audio trong IndexedDB (`db.audioFiles`).
- Lặp đoạn A-B: đặt mốc A, đặt mốc B, tự động hoán đổi nếu B < A, ràng buộc `B > A + 0.5s`, xóa mốc khi đổi track.
- Điều chỉnh tốc độ phát: `0.75×`, `0.85×`, `1.0×`, `1.2×` (giữ nguyên cao độ giọng).
- Tua lùi/tiến 10 giây (`⟲ 10` và `10 ⟳`).
- Phím tắt bàn phím: `Space` (Play/Pause), `[` (Đặt A), `]` (Đặt B), `R` (Lặp), `T` (Ẩn/hiện transcript), `←` `→` (±10s).
- Khối "Câu ví dụ tham khảo": hiển thị danh sách câu ví dụ của bài (kèm furigana, bản dịch, và ghi chú trung thực: *"Không phải bản chép lời của track. Chưa đối chiếu với nội dung track"*).

### Ngoài phạm vi
- Nạp audio đĩa CD (đã hoàn thành trong SPEC-09).
- Vẽ dạng sóng âm (waveform) từ dữ liệu PCM (tốn RAM không cần thiết).
- Ghi âm giọng người học, chấm điểm phát âm AI.
- Mini-player bám đáy màn hình hoặc phát nền khi chuyển trang khác.
- Tự động dò mốc câu theo thời gian trong track (đĩa CD không có dữ liệu mốc câu).

---

## 2. Kiến trúc & Quản lý Bộ nhớ

### 2.1. Quản lý URL Blob và Bộ nhớ (SPEC-10 §2.1)
- Lấy `AudioFileRecord` từ `db.audioFiles.where('lesson').equals(lessonNum)`.
- Tạo URL phát: `const url = URL.createObjectURL(record.blob);`
- **Bắt buộc:** Luôn gọi `URL.revokeObjectURL(prevUrl)` mỗi khi:
  1. Người dùng chuyển sang track khác.
  2. Component `ShadowingPlayer` unmount.
  -> Ngăn chặn tuyệt đối việc rò rỉ bộ nhớ (memory leak) trên thiết bị di động.

### 2.2. Thuật toán Lặp A-B (`src/lib/shadowing.ts`)
- Hàm `normalizeLoopPoints(a: number | null, b: number | null, duration: number)`:
  - Nếu cả A và B đều có giá trị:
    - Nếu B < A: tự động hoán đổi `[A, B] = [B, A]`.
    - Ràng buộc: `B = Math.max(B, A + 0.5)`.
    - Giới hạn: `A = Math.max(0, Math.min(A, duration))`, `B = Math.max(0, Math.min(B, duration))`.
- Trong sự kiện `timeupdate` của `<audio>`:
  - Nếu `isLooping` và `loopA !== null` và `loopB !== null`:
  - Khi `currentTime >= loopB`: gán trực tiếp `audio.currentTime = loopA` (không gọi `pause()` rồi `play()` để tránh giật/ngắt tiếng).

### 2.3. Tốc độ Phát
- `audio.playbackRate = rate`: Gán trực tiếp vào phần tử `<audio>` gốc. Trình duyệt hiện đại mặc định bật `preservesPitch` giúp giữ nguyên tông giọng người đọc.

### 2.4. Lưu trữ Trạng thái
- Sử dụng các trường trạng thái đã có sẵn trong `useUIStore` (`web/src/lib/store.ts`):
  - `isPlaying: boolean`
  - `playbackRate: number` (mặc định `1.0`)
  - `loopA: number | null`
  - `loopB: number | null`
  - `showTranscript: boolean` (mặc định `true`)

---

## 3. Giao diện & Trải nghiệm (Dựa trên `mock/21-shadowing.png`)

### 3.1. Hàng Chọn Track
- 4 tab tương ứng 4 track: `Từ vựng` (`vocab`), `Mẫu câu` (`sentence_patterns`), `Câu ví dụ` (`examples`), `Hội thoại` (`conversation`).
- Tab active có đường gạch chân màu đỏ thương hiệu Washi (`border-b-2 border-primary text-foreground font-semibold`).
- Nếu bài chưa có track nào nạp: Card thông báo mời nạp *"Chưa nạp audio cho bài này"* + nút dẫn sang `/cai-dat/audio`.

### 3.2. Khối Trình phát Chính (Player Card)
- Card bo tròn `rounded-2xl border border-border/80 bg-card p-5 space-y-5 shadow-xs`:
  1. **Thanh Scrubber / Tiến trình:**
     - Thanh trượt hiển thị vị trí hiện tại (màu `bg-primary`), nền `bg-muted`.
     - Hai mốc đánh dấu `A` và `B` xuất hiện ngay trên vạch tiến trình kèm badge thời gian trực quan.
     - Khi chế độ Lặp đang bật, dải phân đoạn giữa A và B được tô nhẹ `bg-primary/15`.
     - Dòng hiển thị thời gian: `00:42 / 03:15`.
  2. **Bộ Điều khiển Trung tâm:**
     - Nút Play / Pause tròn lớn 56px ở chính giữa (`bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20`).
     - Hai nút tua nhanh ±10 giây (`⟲ 10` và `10 ⟳`) kích thước 44px hai bên.
  3. **Hàng Nút Điều chỉnh Tốc độ:**
     - Chip tốc độ: `0.75×`, `0.85×`, `1.0×`, `1.2×`. Chip đang chọn mang màu `bg-primary text-primary-foreground`, các chip khác nền `bg-muted text-foreground`.
  4. **Hàng Nút Thao tác Mốc Lặp & Chức năng:**
     - Nút `Đặt A`: Kèm huy hiệu tròn nhỏ chữ `A` màu đỏ.
     - Nút `Đặt B`: Kèm huy hiệu tròn nhỏ chữ `B` màu đỏ.
     - Nút `Lặp`: Icon `Repeat`, trạng thái bật mang `aria-pressed="true"` và đổi viền/nền nổi bật. Nếu chưa đặt đủ mốc A và B, nút `Lặp` bị `disabled`.
     - Nút `Câu ví dụ`: Bật/tắt hiển thị danh sách câu ví dụ tham khảo. (Chỉ khả dụng khi chọn track `examples`; với các track khác sẽ hiển thị `disabled` kèm tooltip giải thích).

### 3.3. Khối Câu ví dụ Tham khảo
- Tiêu đề: `Câu ví dụ tham khảo`.
- Dòng chú thích trung thực: `Không phải bản chép lời của track. Chưa đối chiếu với nội dung track.`
- Danh sách câu ví dụ ngữ pháp của bài:
  - Thẻ hiển thị câu tiếng Nhật có Furigana (`<Furigana />`), font `font-jp text-lg`.
  - Bản dịch tiếng Việt (`text-muted-foreground text-sm`).
  - Nút phát TTS minh họa (`<SpeakButton />`).

### 3.4. Phím tắt Bàn phím
- `Space`: Play / Pause (chặn cuộn trang).
- `[`: Đặt mốc A tại thời điểm hiện tại.
- `]`: Đặt mốc B tại thời điểm hiện tại.
- `R`: Bật / tắt Lặp A-B.
- `T`: Bật / tắt hiển thị Câu ví dụ tham khảo.
- `ArrowLeft` / `ArrowRight`: Lùi / tiến 10 giây.
- **Quy tắc an toàn:** Không kích hoạt phím tắt khi người dùng đang nhập liệu trong thẻ `input`, `textarea` hoặc phần tử có `contenteditable`.

---

## 4. Kế hoạch Kiểm thử & Tiêu chí Nghiệm thu

### 4.1. Unit Tests (`web/src/lib/shadowing.test.ts`)
- `formatTime`: kiểm tra định dạng giây sang `mm:ss` (vd: 0 -> `00:00`, 42 -> `00:42`, 195 -> `03:15`).
- `normalizeLoopPoints`:
  - Ràng buộc `B > A + 0.5s`.
  - Tự động hoán đổi vị trí khi B < A.
  - Xử lý khi A hoặc B vượt quá độ dài `duration`.
- Xử lý phím tắt an toàn: chặn phím tắt khi focus vào input.

### 4.2. Static Gates & Build
- `pnpm check`: 0 lỗi TypeScript, 0 cảnh báo ESLint.
- `pnpm test`: Toàn bộ unit tests chạy xanh.
- `pnpm build`: Next.js 16 App Router build thành công cho các trang `/hoc/[so]`.
