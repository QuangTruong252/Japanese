# Báo cáo Đánh giá Thị giác Độc lập 46 Minh họa (Bài 2, 3, 4, 8)

- **Ngày đánh giá**: 06/10/2026
- **Worker Terminal**: `term_b703953c-31ba-4957-846c-e46b20a9ef7f` (Antigravity worker, quy trình Độc lập QA - READ-ONLY)
- **Coordinator Terminal**: `term_a40d0aa2-c008-4e10-ae6b-d547f28a957e`
- **Task ID**: `task_0178eb778af9` | **Dispatch ID**: `ctx_1b2037f4d37a`
- **Phạm vi thẩm định**: 46 tài sản minh họa mới tạo ngày 06/10/2026, bao gồm:
  - **42 Vocab Cutouts**: Trích xuất từ 6 manifest atlas (`lesson-02-03-objects-v1.json`, `lesson-03-rooms-v1.json`, `lesson-03-buildings-v1.json`, `lesson-04-places-v1.json`, `lesson-04-daily-v1.json`, `lesson-08-adjectives-2-v1.json`).
  - **4 Opaque Scenes**: 3 cảnh bìa bài học (`everyday-things-v1`, `department-store-v1`, `daily-routine-v1`) và 1 cảnh ngữ pháp (`koko-soko-asoko-v1`).
  - **Dữ liệu tham chiếu**: Tích hợp trong `web/src/data/n5/vocab/lesson-02/03/04/08.json` và `web/src/data/n5/lessons/lesson-02/03/04.json` (bao gồm việc tái sử dụng `kutsu -> black-shoes-v1` và `kaigi -> meeting-room-v1`).

---

## 1. Kết quả kiểm định kỹ thuật (Technical Check Results)

Toàn bộ 46 tệp ảnh WebP thành phẩm trong `web/public/assets/illustrations/`, 46 tệp master PNG và sidecar JSON trong `artwork/illustrations/`, cùng 86 điểm tham chiếu dữ liệu học tập đã được phân tích bằng công cụ xử lý ảnh tự động (thư viện Sharp của Next.js qua Node.js) và kiểm tra thị giác trực tiếp trên từng tệp:

| Hạng mục kiểm tra | Tiêu chuẩn kỹ thuật | Kết quả đạt / Tổng số | Tỷ lệ | Trạng thái |
| :--- | :--- | :---: | :---: | :---: |
| **Kích thước Vocab WebP** | Khung chuẩn 512 × 512 px (contain 448 px + padding 32 px) | 42 / 42 | 100% | **PASS** |
| **Kích thước Scene WebP** | Khung chuẩn 800 × 600 px (tỷ lệ 4:3) | 4 / 4 | 100% | **PASS** |
| **Định dạng & Giải mã** | Định dạng WebP, giải mã Sharp không lỗi | 46 / 46 | 100% | **PASS** |
| **Kênh Alpha Vocab** | `hasAlpha: true`, native alpha channel nguyên vẹn | 42 / 42 | 100% | **PASS** |
| **Tính chất Scene Opaque** | Đục hoàn toàn (opaque), không rỗng nền theo SPEC-21 §4 | 4 / 4 | 100% | **PASS** |
| **Đối chiếu Sidecar JSON** | Khớp 100% dung lượng byte và chuỗi SHA-256 với `outputVerification` | 46 / 46 | 100% | **PASS** |
| **Kích thước tham chiếu dữ liệu** | Chiều rộng & cao trong JSON bài học/từ vựng khớp tệp thực tế | 86 / 86 | 100% | **PASS** |
| **Đường biên ngoài Vocab** | Alpha = 0 tuyệt đối ở 4 cạnh biên 512×512 (không chạm viền) | 42 / 42 | 100% | **PASS** |
| **Ghép nền Ivory (#F7F2E8)** | Không viền tối lem, hòa trộn tự nhiên trên nền sáng UI Washi | 46 / 46 | 100% | **PASS** |
| **Ghép nền Dark (#201E1C)** | Không viền halo trắng giả, không bụi màu lem ở vùng trong suốt | 46 / 46 | 100% | **PASS** |
| **Quy tắc không chữ/số/logo** | Tuyệt đối không chữ Latin, kana/kanji, chữ số, logo trên mặt ảnh | 46 / 46 | 100% | **PASS** |
| **Nhất quán phong cách Phố giấy** | Màu nước/gouache, viền chì mềm, tone ấm, nhân vật chuẩn mẫu | 46 / 46 | 100% | **PASS** |

- **Tổng số tài sản ĐẠT (PASS)**: **45 / 46** (97.8%)
- **Tổng số tài sản CẢNH BÁO (WARN)**: **1 / 46** (`energetic-person-v1`)
- **Tổng số tài sản HỎNG (FAIL)**: **0 / 46** (0%)

---

## 2. Bảng Đánh giá Chi tiết Toàn bộ 46 Tài sản Minh họa

| STT | Tên Asset Stem | Vocab ID / Điểm tham chiếu | Từ vựng Kanji/Kana | Nghĩa tiếng Việt | Kích thước Master PNG | WebP (Bytes / SHA-256) | Đánh giá | Nhận xét Thị giác & Ngữ nghĩa |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| 1 | **dictionary-v1** | `jisho` | 辞書[じしょ] | từ điển | 411×378 | 34.266 B<br>`3ff77ada...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 2 | **newspaper-v1** | `shinbun` | 新聞[しんぶん] | báo, tờ báo | 467×329 | 32.246 B<br>`3ded7e30...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 3 | **business-card-v1** | `meishi` | 名刺[めいし] | danh thiếp | 403×313 | 23.860 B<br>`5c21713b...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 4 | **plastic-card-v1** | `kaado` | カード | thẻ, cạc | 377×289 | 25.076 B<br>`1aa9089d...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 5 | **souvenir-box-v1** | `omiyage` | [お]土産[みやげ] | quà lưu niệm, quà đặc sản | 370×427 | 35.370 B<br>`829372a1...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 6 | **necktie-v1** | `nekutai` | ネクタイ | cà vạt | 340×411 | 23.634 B<br>`b8767ce8...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 7 | **wine-bottle-v1** | `wain` | ワイン | rượu vang | 275×438 | 29.302 B<br>`2679b320...` | **PASS** | Chai vang nhãn trắng trơn và ly vang đỏ; độ trong suốt của ly và nước vang tách nền sạch, không halo trên nền tối. |
| 8 | **telephone-v1** | `denwa` | 電話[でんわ] | điện thoại, cuộc gọi | 434×334 | 28.160 B<br>`da6f8331...` | **PASS** | Điện thoại bàn màu kem, phím bấm và màn hình để trống không số, dây xoắn gọn gàng. |
| 9 | **classroom-v1** | `kyoushitsu` | 教室[きょうしつ] | lớp học, phòng học | 368×359 | 56.142 B<br>`d0ceb71c...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 10 | **cafeteria-v1** | `shokudou` | 食堂[しょくどう] | nhà ăn, căn tin | 420×285 | 42.858 B<br>`bccfd444...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 11 | **office-v1** | `jimusho` | 事務所[じむしょ] | văn phòng làm việc | 424×426 | 43.738 B<br>`2c55d98c...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 12 | **meeting-room-v1** | `kaigishitsu` | 会議室[かいぎしつ] | phòng họp | 431×389 | 54.892 B<br>`8c4414e8...` | **PASS** | Hai người họp bên bàn tròn, bảng trắng trơn, nhân vật chuẩn mẫu; dùng tốt cho cả kaigishitsu (Bài 3) và kaigi (Bài 4). |
| 13 | **reception-desk-v1** | `uketsuke` | 受付[うけつけ] | quầy lễ tân, bàn tiếp đón | 399×334 | 35.520 B<br>`51e65f59...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 14 | **lobby-v1** | `robii` | ロビー | đại sảnh, phòng chờ | 423×341 | 42.576 B<br>`aac0f4cd...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 15 | **room-v1** | `heya` | 部屋[へや] | căn phòng | 404×388 | 42.064 B<br>`df6b4288...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 16 | **toilet-v1** | `toire` | トイレ（お 手洗[てあら]い） | nhà vệ sinh | 371×394 | 35.730 B<br>`a81fb261...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 17 | **stairs-v1** | `kaidan` | 階段[かいだん] | cầu thang bộ | 343×402 | 33.558 B<br>`e5610809...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 18 | **elevator-v1** | `erebeetaa` | エレベーター | thang máy | 355×382 | 31.854 B<br>`abc7abee...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 19 | **escalator-v1** | `esukareetaa` | エスカレーター | thang cuốn | 384×377 | 36.606 B<br>`bd4d0762...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 20 | **vending-machine-v1** | `jidouhanbaiki` | 自動販売機[じどうはんばいき] | máy bán hàng tự động | 282×402 | 30.668 B<br>`b16681a0...` | **PASS** | Máy bán nước đỏ đặc trưng Nhật, các chai nước hình khối màu trơn không nhãn/logo, phím và khe tiền không số. |
| 21 | **company-building-v1** | `kaisha` | 会社[かいしゃ] | công ty | 437×412 | 51.878 B<br>`0a09f3d9...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 22 | **house-v1** | `uchi` | うち | nhà, tổ ấm | 438×371 | 55.630 B<br>`10c72519...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 23 | **sales-counter-v1** | `uriba` | 売[う]り 場[ば] | quầy bán hàng, nơi bán | 415×415 | 49.400 B<br>`36f68304...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 24 | **department-store-v1** | `depaato` | デパート | trung tâm bách hóa, thương mại | 443×410 | 53.374 B<br>`ecf24822...` | **PASS** | Cảnh 800×600 chuẩn phong cách Phố giấy, nhân vật đúng nhận diện, không chữ/logo, bố cục sâu và ấm áp. |
| 25 | **bank-v1** | `ginkou` | 銀行[ぎんこう] | ngân hàng | 437×365 | 47.204 B<br>`7df516cd...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 26 | **post-office-v1** | `yuubinkyoku` | 郵便局[ゆうびんきょく] | bưu điện | 435×329 | 43.422 B<br>`eea53581...` | **PASS** | Bưu điện gỗ truyền thống và hòm thư đỏ tròn đặc trưng Nhật (không ký hiệu chữ/〒), rất dễ nhận diện. |
| 27 | **library-v1** | `toshokan` | 図書館[としょかん] | thư viện | 448×357 | 49.904 B<br>`73bf5b82...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 28 | **art-museum-v1** | `bijutsukan` | 美術館[びじゅつかん] | bảo tàng mỹ thuật | 426×319 | 42.764 B<br>`2c0d49cd...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 29 | **exam-v1** | `shiken` | 試験[しけん] | kỳ thi, bài kiểm tra | 444×374 | 31.162 B<br>`d767e160...` | **PASS** | Bài thi ô trắc nghiệm trống, bút chì và tẩy trắng-xanh; biểu tượng kỳ thi kinh điển, không lộ đáp án học tập. |
| 30 | **movie-v1** | `eiga` | 映画[えいが] | phim, điện ảnh | 423×361 | 43.638 B<br>`b4901411...` | **PASS** | Cuộn phim kim loại, clapperboard sọc đen trắng thân trơn không chữ và cốc bỏng ngô sọc; biểu tượng điện ảnh rõ ràng. |
| 31 | **wake-up-v1** | `okimasu` | 起[お]きる | thức dậy, dậy | 439×391 | 53.270 B<br>`6117f4b0...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 32 | **sleep-v1** | `nemasu` | 寝[ね]る | đi ngủ, ngủ | 409×385 | 40.588 B<br>`895c3bb7...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 33 | **work-v1** | `hatarakimasu` | 働[はたら]く | làm việc | 443×380 | 45.230 B<br>`9cb3c902...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 34 | **rest-v1** | `yasumimasu` | 休[やす]む | nghỉ ngơi, nghỉ phép | 429×368 | 47.422 B<br>`4c9317a9...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 35 | **study-v1** | `benkyou-shimasu` | 勉強[べんきょう]する | học, học tập | 443×363 | 48.094 B<br>`03453ab8...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 36 | **morning-v1** | `asa` | 朝[あさ] | buổi sáng | 441×382 | 48.774 B<br>`6f88cbeb...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 37 | **noon-v1** | `hiru` | 昼[ひる] | buổi trưa, ban ngày | 436×387 | 58.296 B<br>`910d3203...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 38 | **night-v1** | `ban` | 晩[ばん]（夜[よる]） | buổi tối, đêm | 431×398 | 38.674 B<br>`eff247e5...` | **PASS** | Nội dung khớp từ vựng & alt; không chữ/số/logo; nét gouache ấm, viền alpha sạch trên cả nền ngà #F7F2E8 và tối #201E1C. |
| 39 | **handsome-man-v1** | `hansamu` | ハンサム[な] | đẹp trai | 347×436 | 42.776 B<br>`bcda2e0d...` | **PASS** | Chân dung bán thân ngang hông (bust crop), giải phẫu tự nhiên, không chữ/logo, phong thái tuấn tú. |
| 40 | **energetic-person-v1** | `genki` | 元気[げんき][な] | khỏe mạnh | 389×426 | 67.428 B<br>`885ae3f4...` | **WARN** | Chân trước bị cắt ngang dưới bắp chân (thiếu bàn chân), vạch mặt đất bị cắt phẳng ở cạnh đáy do chạm biên ô atlas gốc. |
| 41 | **tall-tower-v1** | `takai` | 高[たか]い | đắt, cao | 370×439 | 51.936 B<br>`5655a0f7...` | **PASS** | Tháp cao đối chứng nhà nhỏ làm nổi bật tính từ "cao" (takai); mây trắng nền tối hòa quyện tự nhiên, đỉnh tháp nguyên vẹn. |
| 42 | **low-stool-v1** | `hikui` | 低[ひく]い | thấp | 404×346 | 53.360 B<br>`d2b2ef22...` | **PASS** | Ghế đẩu thấp đối chứng ghế tựa làm rõ tính từ "thấp" (hikui); tương phản chiều cao rõ, không gây nhầm với ghế đơn. |
| 43 | **everyday-things-v1** | `cover (Bìa Bài 2)` | - | Đồ vật thường ngày (Bìa Bài 2) | 1200×896 | 64.458 B<br>`f988c28a...` | **PASS** | Cảnh 800×600 chuẩn phong cách Phố giấy, nhân vật đúng nhận diện, không chữ/logo, bố cục sâu và ấm áp. |
| 44 | **department-store-v1** | `cover (Bìa Bài 3)` | - | Trung tâm bách hóa (Bìa Bài 3) | 1200×896 | 74.052 B<br>`e5cfc239...` | **PASS** | Cảnh 800×600 chuẩn phong cách Phố giấy, nhân vật đúng nhận diện, không chữ/logo, bố cục sâu và ấm áp. |
| 45 | **daily-routine-v1** | `cover (Bìa Bài 4)` | - | Sinh hoạt hàng ngày (Bìa Bài 4) | 1200×896 | 102.782 B<br>`f86a8e1e...` | **PASS** | Cảnh phố sáng 800×600, đồng hồ treo tường có kim nhưng mặt trống không số, biển hiệu trơn không chữ, nhân vật chuẩn mẫu. |
| 46 | **koko-soko-asoko-v1** | `ngữ pháp koko-soko-asoko` | - | Chỉ định vị trí Đây - Đó - Kia (Ngữ pháp Bài 3) | 1200×896 | 74.014 B<br>`4bcb1df7...` | **PASS** | Bố cục 3 khoảng cách xuất sắc (koko: chỉ chân; soko: bạn nam cạnh sofa; asoko: thang máy xa); không chữ trong raster. |

---

## 3. Danh sách Chi tiết Cảnh báo (WARN) & Đề xuất Khắc phục

### 3.1. Cảnh báo (WARN): `energetic-person-v1` (Bài 8 - `genki`)

- **Vị trí**: `web/public/assets/illustrations/vocab/energetic-person-v1.webp` (trích từ `artwork/illustrations/atlases/lesson-08-adjectives-2-v1.png`, hàng 0, cột 3).
- **Từ vựng**: `genki` (元気[げんき][な] - khỏe mạnh).
- **Hiện trạng khuyết tật**:
  1. **Chân trước bị cụt mất bàn chân**: Nhân vật nam đang trong tư thế chạy bộ; chân sau (chân trái) nhấc cao mang giày thể thao hoàn chỉnh, nhưng chân trước (chân phải) chúc xuống bị **cắt ngang cụt ở đoạn cẳng chân dưới đầu gối**, hoàn toàn không có bàn chân hay giày trước.
  2. **Vết cắt phẳng ở mặt đường**: Đoạn đường chạy có đường biên đáy bị cắt phẳng lì theo đường ngang (`straight horizontal cut`).
- **Nguyên nhân kỹ thuật (Root Cause)**:
  - Trong ảnh atlas nguồn do ChatGPT web sinh ra, hình vẽ nhân vật chạy bộ nằm quá sát mép đáy của ô grid.
  - Khi coordinator tính toán khung cắt (crop box), do phải đảm bảo quy tắc rãnh alpha rỗng (`alpha === 0`) ngăn cách với hàng dưới (ô `low-stool-v1` ở ngay bên dưới), khung cắt buộc phải dừng lại ở cao độ `top + height = 443`. Điều này vô tình xén ngang cẳng chân trước và mặt đường.
- **Mức độ ảnh hưởng**:
  - Người học vẫn hiểu được ý nghĩa "khỏe mạnh" nhờ thần thái tươi tắn và dáng chạy thể thao của nhân vật.
  - Tuy nhiên, hình vẽ bị khuyết chi dưới là điểm trừ về tính hoàn thiện thị giác so với chuẩn mực cao của hệ thống minh họa Washi / Phố giấy.
- **Đề xuất khắc phục cụ thể (Actionable Fix)**:
  - Trong lượt tạo ảnh tiếp theo, tạo một tệp cutout độc lập (single-call generation) cho từ `genki` với prompt bổ sung: `"full-body running figure, leave generous empty margin around feet, both shoes fully visible with ground shadow fading softly"`.
  - Thay thế bằng `energetic-person-v2.webp` và cập nhật tham chiếu trong `web/src/data/n5/vocab/lesson-08.json`.

---

## 4. Phân tích Ngữ nghĩa Sư phạm & Tái sử dụng Tài sản

1. **Hiệu quả thể hiện Tính từ trừu tượng Bài 8**:
   - **`tall-tower-v1` (`takai` - cao, đắt)**: Từ `takai` có 2 nghĩa phổ biến trong N5. Hình ảnh tháp truyền hình vươn cao chọc trời đặt cạnh ngôi nhà mái ngói tí hon thể hiện trực quan vượt trội cho nghĩa **"cao"** (độ cao). Việc đặt vật đối chứng tỉ lệ giúp người học không bị nhầm lẫn sang các khái niệm khác.
   - **`low-stool-v1` (`hikui` - thấp)**: Minh họa khéo léo đặt một chiếc ghế đẩu thấp cạnh một chiếc ghế tựa cao thông thường. Sự tương phản độ cao này giúp thể hiện tính từ **"thấp"** rõ ràng mà không bị nhầm lẫn thành danh từ chiếc ghế thông thường (đã có `chair-v1` ở Bài 2).
   - **`handsome-man-v1` (`hansamu` - đẹp trai)**: Bố cục bán thân (bust portrait) ngang thắt lưng tập trung vào thần thái tuấn tú, mái tóc lãng tử và trang phục lịch thiệp. Dù có đường cắt ngang hông nhưng đây là quy chuẩn mỹ thuật chân dung thông thường, biểu cảm và giải phẫu đạt chất lượng cao.

2. **Thể hiện Ngữ pháp Không gian & Cảnh bài học**:
   - **`koko-soko-asoko-v1` (Ngữ pháp Bài 3)**: Đạt chuẩn mực cao nhất về sư phạm trực quan. Bằng cách sắp đặt 3 cự ly không gian (cô gái chỉ sàn ngay chân cho *koko*, chàng trai đứng trung cảnh gần sofa cho *soko*, thang máy ở viễn cảnh cuối sảnh cho *asoko*), hình ảnh diễn giải trọn vẹn ngữ pháp chỉ định vị trí mà không cần bất kỳ chữ viết hay mũi tên thô cứng nào trong ảnh raster.
   - **`daily-routine-v1` (Bìa Bài 4)**: Đồng hồ treo tường đường phố thể hiện vạch chia và kim chỉ giờ nhưng **hoàn toàn để trống không vẽ chữ số**. Biển hiệu cửa hàng để trơn. Đây là sự tuân thủ nghiêm ngặt và tinh tế đối với quy định không đưa ký tự/chữ số vào raster.

3. **Hiệu quả Tái sử dụng Tài sản (Asset Reuse)**:
   - **`black-shoes-v1`** (vốn tạo ở Bài 8 cho `kuroi`) được tái sử dụng hoàn hảo cho từ `kutsu` (giày) ở Bài 3 mà không cần vẽ thêm ảnh mới.
   - **`meeting-room-v1`** (tạo cho `kaigishitsu` - phòng họp ở Bài 3) được tái sử dụng chính xác cho từ `kaigi` (cuộc họp) ở Bài 4. Cả hai trường hợp đều phản ánh đúng bản chất ngữ nghĩa và tối ưu tài nguyên sản phẩm.

4. **Kiểm tra Viền Alpha & Ghép nền Tương phản**:
   - Thử nghiệm ghép toàn bộ 42 cutout trên cả nền ngà ấm (`#F7F2E8`) và nền tối than (`#201E1C`) cho thấy các chi tiết trong suốt khó như ly rượu vang đỏ (`wine-bottle-v1`), thành kính thang cuốn (`escalator-v1`), đám mây bồng bềnh (`tall-tower-v1`, `morning-v1`, `noon-v1`, `night-v1`) đều đạt độ mềm mại lý tưởng, không tồn tại viền halo trắng giả do khử phông cẩu thả.

---

## 5. Phần Chưa Kiểm Chứng (Giới hạn Nghiệm thu)

Theo đúng giới hạn nhiệm vụ được giao (nhân sự QA độc lập chỉ đọc, cấm chỉnh sửa mã nguồn hoặc khởi chạy máy chủ web/build):
1. **Hiển thị trên Trình duyệt Thực tế**: Chưa kiểm tra trực tiếp qua trình duyệt web ở các kích thước responsive (390px mobile, 1440px desktop) hoặc dark mode UI lúc runtime (do không chạy `pnpm dev` / `next start`).
2. **Đo đạc Băng thông & Hiệu năng Tải mạng**: Chưa đo lường thời gian tải mạng thực tế và chỉ số LCP trên thiết bị di động thật.
3. **Các chế độ hiển thị đặc biệt khác**: Chưa kiểm nghiệm độ tương thích với các chế độ tương phản cao đặc thù ngoài 2 nền Washi chuẩn (`#F7F2E8` và `#201E1C`).
