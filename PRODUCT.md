# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Người dùng chính:** Cá nhân người Việt tự học tiếng Nhật từ sơ cấp (Minna no Nihongo N5 và N4).
- **Tình huống sử dụng:**
  - Học linh hoạt trên điện thoại thông minh khi di chuyển (xe buýt, tàu điện, máy bay) — yêu cầu hỗ trợ ngoại tuyến mượt mà và thao tác chạm một tay thuận tiện.
  - Học chuyên sâu trên máy tính để bàn/laptop tại bàn học — yêu cầu hệ thống phím tắt nhanh và không gian hiển thị rộng rãi.
- **Nhiệm vụ của người dùng:** Nắm vững từ vựng, ngữ pháp, kanji theo từng bài học; luyện tập củng cố phản xạ qua 5 dạng bài tập; luyện nghe shadowing A-B; và duy trì nhịp ôn tập hàng ngày theo thuật toán lặp lại ngắt quãng (FSRS) mà không bị gián đoạn.

## Product Purpose

- Cung cấp một nền tảng tự học và ôn luyện toàn diện giáo trình Minna no Nihongo N5 & N4, kế thừa dữ liệu chuẩn hóa, bổ sung bản dịch và giải thích ngữ pháp tiếng Việt chi tiết kèm nguồn dẫn sách.
- Định nghĩa thành công: Người học có thể học tập và ôn tập mọi lúc mọi nơi kể cả khi không có kết nối internet; tiến độ học được đồng bộ an toàn đa thiết bị; ghi nhớ kiến thức bền vững qua thuật toán FSRS; và trải nghiệm học tập không ma sát (không quảng cáo, không phân tâm).

## Positioning

- **Offline-First đích thực:** Khác với hầu hết các web app học ngoại ngữ phụ thuộc vào máy chủ, hệ thống coi IndexedDB (Dexie.js) tại trình duyệt là nguồn sự thật (single source of truth). Thuật toán FSRS v5 chạy hoàn toàn phía client, đảm bảo việc tính toán chu kỳ ôn tập hoạt động trơn tru cả khi ngoại tuyến.
- **Tự nạp âm thanh cục bộ (BYOA - Bring Your Own Audio):** Người học tự nhập bộ đĩa CD Minna no Nihongo qua file ZIP, giải nén an toàn qua Web Worker và xác thực hash SHA-256 từng file đối chiếu manifest. Giải pháp này giúp tránh hoàn toàn vấn đề bản quyền âm thanh và chi phí CDN băng thông lớn.
- **5 dạng bài tập cốt lõi chuẩn mực:** Trắc nghiệm, Ghép cặp, Điền từ/trợ từ, Sắp xếp câu, và Nghe chép chính tả; tích hợp chuẩn hóa ký tự tự động bằng `wanakana` và hiển thị chữ Hán kèm furigana bằng thẻ `<ruby>` gốc của trình duyệt.

## Operating Context

- **Thiết bị:** Trình duyệt web hiện đại trên Mobile (iOS Safari, Android Chrome) và Desktop (Chrome, Edge, Firefox, Safari).
- **Quy trình học tập thường ngày:**
  1. *Học bài mới:* Duyệt từ vựng (phân loại nhóm động từ rõ ràng), học điểm ngữ pháp kèm câu ví dụ chuẩn nguồn sách.
  2. *Luyện tập:* Làm bài tập củng cố theo bài hoặc tổ hợp bài, lọc thông minh theo lượng kiến thức đã tích lũy và điều kiện âm thanh sẵn có trên máy.
  3. *Luyện nghe Shadowing:* Nghe bài đàm thoại / câu ví dụ, lặp đoạn A-B, tùy biến tốc độ (0.75x–1.2x), ẩn/hiện transcript.
  4. *Ôn tập hôm nay:* Thực hiện phiên ôn tập theo lịch FSRS cho các mục tiêu (từ vựng, ngữ pháp, kanji, trợ từ) đến hạn; đồng bộ ngầm lên Supabase khi có mạng.

## Capabilities and Constraints

- **Chức năng đã xác nhận:**
  - Dữ liệu 25 bài N5 (từ vựng, ngữ pháp, câu ví dụ) có furigana notation, dịch nghĩa tiếng Việt và tham chiếu sách Minna no Nihongo I.
  - 5 dạng bài tập với cơ chế tạo đáp án nhiễu thông minh và phím tắt đầy đủ (`1`-`4`, `Space`, `[`, `]`, `R`, `T`).
  - Trình phát Shadowing A-B loop phát trực tiếp từ Blob trong IndexedDB.
  - Hệ thống ôn tập FSRS v5 cục bộ, ghi nhận kết quả và cập nhật `due_at` ngay lập tức.
  - Đồng bộ đa thiết bị Optimistic Sync lên Supabase qua Google OAuth, giải quyết xung đột bằng chính sách last-write-wins dựa trên `updated_at`.
- **Ràng buộc kỹ thuật & dữ liệu:**
  - Stack: Next.js 16 (App Router), React 19, TypeScript strict, pnpm, Tailwind CSS v4, shadcn/ui (`base-nova` với Base UI).
  - Dexie.js là nguồn sự thật phía client. Không gọi Supabase trực tiếp trong render path; đọc dữ liệu qua `useLiveQuery`.
  - Không gọi network hoặc giải nén ZIP bên trong Dexie transaction. Giải nén ZIP và tính hash SHA-256 bắt buộc chạy trong Web Worker để tránh treo UI.
  - Hiển thị Furigana bắt buộc dùng thẻ ngữ nghĩa `<ruby>` và `<rt>`, không dùng overlay CSS `position: absolute`.
  - Tuyệt đối không đưa file âm thanh bản quyền vào bundle/public/cloud storage.

## Brand Commitments

- **Hệ thống thiết kế:** **Washi** — cảm hứng từ bề mặt giấy Washi ấm áp của Nhật Bản.
- **Bảng màu:** Nền giấy Washi kem sáng (`oklch(0.99 0.002 90)`), điểm nhấn đỏ đất Torii (`oklch(0.55 0.2 25)`), nền tối Than chì (`oklch(0.17 0.01 285)`), kết hợp màu phân biệt 3 nhóm động từ (Cam đất, Xanh Indigo, Xanh tre Moso).
- **Typography:** Font chữ Latin Inter kết hợp font tiếng Nhật Noto Sans JP.
- **Phong cách & Giọng điệu:** Tĩnh lặng, tao nhã, tập trung, chuẩn mực sư phạm; ngôn ngữ giao diện tiếng Việt rõ ràng, tôn trọng người học.

## Evidence on Hand

- `docs/project-design-spec.md`: Bản đặc tả hệ thống toàn diện đã được phê duyệt.
- `docs/design-system.md` & `DESIGN.md`: Tài liệu đặc tả design system Washi cùng đầy đủ tokens và nguyên tắc thiết kế.
- `AGENTS.md`: Quy chuẩn kỹ thuật, bảo vệ dữ liệu và hướng dẫn vận hành cho AI agents.
- `web/src/data/n5/lessons/`: Tập hợp dữ liệu các bài học N5 đã chuẩn hóa.

## Product Principles

1. **Offline-First là cốt lõi:** Không bao giờ để việc mất mạng làm gián đoạn buổi học hay mất mát dữ liệu ôn tập; máy của người học luôn là nguồn sự thật ưu tiên.
2. **Nội dung chuẩn xác và truy vết được:** Mọi từ vựng, ngữ pháp, câu ví dụ phải đối chiếu chuẩn xác với giáo trình Minna no Nihongo gốc; không sáng tác hay đoán mò kiến thức.
3. **Trải nghiệm học tập tập trung (Distraction-Free):** Loại bỏ mọi yếu tố gây nhiễu, gamification thừa thãi hoặc quảng cáo; giữ nhịp học điềm tĩnh và tôn trọng thời gian của người học.
4. **Tối ưu không ma sát (Frictionless Interaction):** Nút bấm tối thiểu 48px trên di động, phím tắt tức thì trên máy tính, tự động chuyển đổi Romaji sang Hiragana giúp việc nhập liệu nhanh chóng và chính xác.

## Accessibility & Inclusion

- **Furigana ngữ nghĩa:** Sử dụng thẻ `<ruby>` / `<rt>` giúp trình đọc màn hình (screen reader) diễn giải chính xác và cho phép bôi đen copy văn bản sạch.
- **Vùng chạm chuẩn di động:** Mọi phần tử tương tác trong luồng học và làm bài đều có kích thước tối thiểu `48px x 48px` (`size="quiz"`).
- **Độ tương phản và Thị giác:** Tuân thủ tiêu chuẩn tương phản WCAG AA ở cả chế độ Sáng và Tối; hỗ trợ `prefers-reduced-motion` cho mọi hoạt ảnh chuyển động.
- **Điều hướng bàn phím:** Giữ rõ ràng vòng báo focus (`ring`), hỗ trợ thao tác hoàn toàn bằng bàn phím trên desktop.
