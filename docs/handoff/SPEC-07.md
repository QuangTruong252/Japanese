# Handoff — SPEC-07 (Thống kê & Biểu đồ)

Ngày: 22/09/2026. Trạng thái: Đã kiểm chứng (nghiệm thu trình duyệt đạt).

## Thay đổi và quyết định

- **Mở rộng hàm tính toán thuần túy ([web/src/lib/stats.ts](file:///d:/Projects/Lab/Japanese/web/src/lib/stats.ts)):**
  - Giữ nguyên hợp đồng hàm thuần nhận mảng trả số, không gọi `Dexie` hay `Date.now()` bên trong để bảo đảm 100% khả năng kiểm thử tự động độc lập thời gian.
  - `dailyMinutes(sessions, days, now)`: tính tổng phút học từng ngày trong cửa sổ `days` ngày gần nhất (tính cả hôm nay).
  - `dailyAccuracy(sessions, days, now)`: tính tỷ lệ % đúng từng ngày; ngày không có dữ liệu đánh dấu `hasData: false, value: 0` (phục vụ biểu đồ ngắt quãng).
  - `targetsByType(items)`: gom số lượng mục theo 5 loại cố định (`vocab`, `grammar`, `kanji`, `particle`, `listening`).
  - `activityHeatmap(sessions, weeksCount, now)`: chia lưới `weeksCount` tuần (mỗi tuần 7 ngày từ Thứ Hai đến Chủ Nhật), phân cấp 5 mức độ đậm nhạt (0: không học, 1: 1-10p hoặc 0 phút có phiên, 2: 11-20p, 3: 21-35p, 4: >35p).
- **Trang Thống kê ([web/src/app/thong-ke/page.tsx](file:///d:/Projects/Lab/Japanese/web/src/app/thong-ke/page.tsx)):**
  - **4 ô KPI đầu trang:** Chuỗi ngày (Streak), Hôm nay (phút), Đúng 7 ngày (%), Đang theo dõi (mục) hiển thị dạng lưới 2x2 trên mobile và 4 cột từ `md`.
  - **Lịch nhiệt 12 tuần gần nhất:** Khung cuộn ngang mượt mà trên mobile, ô giữ nguyên kích thước không bị bóp méo, tô bằng một sắc xanh `chart-1` chuyển 5 mức độ, có tooltip tương tác khi rê chuột/chạm và bảng số liệu `<details>` phục vụ accessibility / screen reader.
  - **Biểu đồ cột SVG (Phút học 14 ngày):** Trục Y và đường lưới nét đứt màu border, nhãn số trên đỉnh cột cao nhất, trục X hiển thị nhãn ngày `DD/MM`.
  - **Biểu đồ đường SVG (Tỷ lệ đúng 30 ngày):** Phân đoạn đường polyline ngắt quãng tại những ngày không có dữ liệu (không vẽ đường nối qua khoảng trống), điểm đánh dấu tròn ≥ 8px có tooltip khi hover, hiển thị thông báo nhẹ khi cửa sổ 30 ngày trống.
  - **Thanh ngang phân bố 5 loại mục tiêu:** Thanh tiến độ phân đoạn theo tỷ lệ %, danh sách 5 loại có ô vuông màu cố định (`chart-1...5`), nhãn chữ và số mang màu văn bản thông thường đảm bảo tương phản.
  - **Trạng thái rỗng (Empty state):** Khi chưa có phiên nào, toàn bộ trang chuyển sang khối thông báo thân thiện với nút "Bắt đầu luyện tập ngay" dẫn tới `/luyen-tap` (không vẽ biểu đồ trống hay `0%`).
  - **Liên kết Điểm yếu:** Đặt nút dẫn tới `/on-tap/diem-yeu` ở cuối trang, tái sử dụng toàn bộ tính năng lọc điểm yếu đã nghiệm thu ở SPEC-05.

## Kiểm chứng

- **Kiểm tra tĩnh & Unit tests (22/09/2026):**
  - `pnpm check`: PASS (TypeScript 0 lỗi, ESLint 0 cảnh báo).
  - `pnpm test`: PASS 98/98 tests (`src/lib/*.test.ts`, bao gồm 4 unit tests mới trong `stats.test.ts` kiểm thử `dailyMinutes`, `dailyAccuracy`, `targetsByType`, `activityHeatmap`).
- **Nghiệm thu trình duyệt (Browser subagent, 22/09/2026 trên localhost:3000/thong-ke):**
  - **Desktop (1280×800):**
    - 4 thẻ KPI hiển thị chuẩn xác, font heading Washi sắc nét.
    - Lịch nhiệt 12 tuần hiển thị các ô màu trực quan; hover vào ô ngày hiển thị tooltip chi tiết (`22/09: 10 phút · 1 phiên`).
    - Nút mở "Bảng số liệu chi tiết theo ngày" mở rộng bảng table đầy đủ thông tin ngày, thời lượng, số phiên.
    - Biểu đồ cột và biểu đồ đường render SVG sắc nét, không bị giật layout.
  - **Mobile (390×844):**
    - 4 thẻ KPI tự động xếp thành lưới 2 cột × 2 hàng cân đối.
    - Lịch nhiệt cho phép cuộn ngang trong khung riêng, kích thước các ô vuông giữ nguyên độ phân giải chuẩn, không bị bóp méo.
    - Khoảng đệm đáy `pb-32` tránh bị che khuất bởi thanh điều hướng `AppNav`.

## Còn lại và bước tiếp theo

- SPEC-07 đã hoàn tất và nghiệm thu toàn bộ.
- Chuyển sang **Đợt 3: Chuỗi Audio & Trình phát (SPEC-09 & SPEC-10)**:
  - SPEC-09: Quản lý nạp Audio qua file ZIP, xác thực mã băm SHA-256 nội bộ, lưu trữ IndexedDB, quản lý dung lượng/quota và xóa audio.
  - SPEC-10: Trình nghe Shadowing Player, điều khiển tốc độ phát (0.8x, 1.0x, 1.2x), lặp đoạn A-B, phát từng câu theo cặp notation.
