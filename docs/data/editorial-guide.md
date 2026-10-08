# Hướng dẫn Biên soạn & Bảng thuật ngữ chuẩn — Dữ liệu N5 Tiếng Việt

Tài liệu này quy định các nguyên tắc biên tập, chuẩn hóa ngôn ngữ và bảng thuật ngữ đối chiếu dùng cho bộ dữ liệu tiếng Việt N5 (`web/src/data/n5/`), xây dựng trên nền tảng giáo trình *Minna no Nihongo Sơ cấp I* (Bài 1 đến Bài 25).

---

## 1. Nguyên tắc biên soạn tiếng Việt

1. **Rõ nghĩa và tự nhiên:**
   - Sử dụng tiếng Việt tự nhiên, gãy gọn, không dịch thô kiểu 'word-by-word' làm méo mó ngữ nghĩa tiếng Việt.
   - Với các cấu trúc câu giao tiếp và ngữ cảnh văn hóa Nhật Bản (như `いただきます`, `ごちそうさまでした`, `いってきます`, `いってらっしゃい`), giải thích rõ tình huống sử dụng thay vì chỉ gán nghĩa đen.

2. **Chính xác với cấp độ N5:**
   - Thuật ngữ ngữ pháp và giải thích được thiết kế phù hợp với người mới bắt đầu học tiếng Nhật, tránh dùng các thuật ngữ ngôn ngữ học quá hàn lâm trừ khi có giải thích đi kèm.
   - Phân biệt rõ sự khác nhau giữa các cặp trợ từ hay nhầm lẫn (`は` vs `が`, `に` vs `で`, `から` vs `までに`).

3. **Bảo toàn tính toàn vẹn:**
   - Giữ nguyên cú pháp Furigana của repo: `私[わたし]は 学生[がくせい]です`. Không chuyển đổi tự động làm hỏng thẻ Furigana.
   - Giữ nguyên 100% tiếng Anh (`en`) có sẵn trong nguồn Noken để duy trì chế độ học song ngữ.
   - Không để sót bất kỳ trường nào mang tiếng Tây Ban Nha (`es`) hoặc giá trị rỗng (ngoại trừ 8 ô layout bảng đặc thù đã quy định).

---

## 2. Bảng thuật ngữ ngữ pháp chuẩn (Glossary)

### 2.1. Các thể của động từ (動詞の活用)

| Thuật ngữ Nhật | Thuật ngữ Tiếng Việt | Ký hiệu trong Pattern | Ví dụ minh họa |
| :--- | :--- | :--- | :--- |
| **丁寧形 (ます形)** | Thể lịch sự (thể ます) | `V ます / V ません...` | 食べます、飲みます |
| **辞書形** | Thể từ điển (nguyên thể) | `V (thể từ điển) / V (từ điển)` | 食べる、飲む、書く |
| **て形** | Thể て (Te) | `V て` | 食べて、飲んで、書いて |
| **ない形** | Thể ない (Nai - phủ định ngắn) | `V ない` | 食べない、飲まない、書かない |
| **た形** | Thể た (Ta - quá khứ ngắn) | `V た` | 食べた、飲んだ、書いた |
| **普通形** | Thể thông thường (văn nói thân mật) | `S (thể thông thường)` | 行く、高かった、暇だ |

### 2.2. Tính từ (形容詞)

| Thuật ngữ Nhật | Thuật ngữ Tiếng Việt | Ký hiệu trong Pattern | Quy tắc cơ bản |
| :--- | :--- | :--- | :--- |
| **い形容詞** | Tính từ đuôi い | `A-い` | Khẳng định: `〜いです`, Phủ định: `〜くないです`, Quá khứ: `〜かったです` |
| **な形容詞** | Tính từ đuôi な | `A-な` | Trước danh từ: `〜な N`, Phủ định: `〜じゃありません`, Quá khứ: `〜でした` |

### 2.3. Hệ thống Trợ từ cơ bản (助詞)

| Trợ từ | Chức năng chính tiếng Việt | Ví dụ dịch nghĩa chuẩn |
| :---: | :--- | :--- |
| **は (wa)** | Đánh dấu chủ đề của câu | N1 は N2 です («N1 là N2») |
| **が (ga)** | Đánh dấu chủ ngữ ngữ pháp; hiện tượng tự nhiên; đối tượng của tính từ/sở thích/năng lực | 雨が 降ります (Trời mưa); 猫が好きです (Tôi thích mèo) |
| **を (o)** | Đánh dấu tân ngữ trực tiếp của tha động từ; điểm xuất phát/rời khỏi | ご飯を食べます (Ăn cơm); 電車を降ります (Xuống tàu) |
| **も (mo)** | «Cũng» (thay thế cho は/が/を) | 私も 会社員です (Tôi cũng là nhân viên công ty) |
| **の (no)** | Sở hữu; xuất xứ; nội dung; thay thế cho danh từ | 私の本 (Sách của tôi); 日本の車 (Xe của Nhật) |
| **に (ni)** | Mốc thời gian cụ thể; địa điểm tồn tại; điểm đến; đối tượng tiếp nhận hành động | 6時に起きます (Dậy lúc 6h); 部屋にいます (Ở trong phòng); 友達に会います (Gặp bạn) |
| **で (de)** | Địa điểm diễn ra hành động; phương tiện di chuyển; công cụ; ngôn ngữ; phạm vi | 図書館で勉強します (Học ở thư viện); 電車で行きます (Đi bằng tàu) |
| **へ (e)** | Phương hướng di chuyển (đi kèm với 行きます, 来ます, 帰ります) | 日本へ行きます (Đi đến Nhật Bản) |
| **と (to)** | «Và» (liệt kê toàn bộ danh từ); «cùng với» ai đó | 本とペン (Sách và bút); 友達と行きます (Đi cùng bạn) |
| **や (ya)** | «Và» (liệt kê không đầy đủ các ví dụ tiêu biểu, đi kèm など) | パンや果物を買いました (Mua bánh mì, hoa quả và những thứ khác) |
| **から (kara)** | Điểm bắt đầu (thời gian/địa điểm: «từ»); Chỉ nguyên nhân, lý do («vì... nên») | 9時から (Từ 9 giờ); 暑いですから (Vì trời nóng nên...) |
| **まで (made)** | Điểm kết thúc (thời gian/địa điểm: «đến») | 5時まで (Đến 5 giờ) |
| **までに (made ni)** | Hạn chót, thời hạn phải hoàn thành hành động («trước...») | 5時までに終わります (Hoàn thành trước 5 giờ) |
| **ね (ne)** | Trợ từ cuối câu tìm kiếm sự đồng cảm («nhỉ, nhé») | いい天気ですね (Thời tiết đẹp nhỉ) |
| **よ (yo)** | Trợ từ cuối câu nhấn mạnh thông tin mới («đấy, nhé») | 明日は休みですよ (Ngày mai là ngày nghỉ đấy nhé) |

---

## 3. Quy chuẩn xưng hô Gia đình (Gia đình mình vs Gia đình người khác)

Trong văn hóa tiếng Nhật, phân biệt rõ giữa việc xưng hô khiêm tốn khi nói về người nhà mình với người ngoài (Trong - 内 *Uchi*) và xưng hô tôn kính khi nói về người nhà của người khác (Ngoài - 外 *Soto*):

| Thành viên | Gia đình tôi (Khiêm nhường) | Gia đình người khác (Tôn kính) |
| :--- | :--- | :--- |
| **Ông** | 祖父[そふ] (ông tôi) | お 爺[じい]さん (ông bạn) |
| **Bà** | 祖母[そぼ] (bà tôi) | お 婆[ばあ]さん (bà bạn) |
| **Bố / Cha** | 父[ちち] (bố tôi) | お 父[とう]さん (bác / bố bạn) |
| **Mẹ** | 母[はは] (mẹ tôi) | お 母[かあ]さん (bác / mẹ bạn) |
| **Anh trai** | 兄[あに] (anh tôi) | お 兄[にい]さん (anh bạn) |
| **Chị gái** | 姉[あね] (chị tôi) | お 姉[ねえ]さん (chị bạn) |
| **Em trai** | 弟[おとうと] (em trai tôi) | 弟[おとうと]さん (em trai bạn) |
| **Em gái** | 妹[いもうと] (em gái tôi) | 妹[いもうと]さん (em gái bạn) |
| **Chồng** | 夫[おっと] / 主人[しゅじん] (chồng tôi) | ご 主人[しゅじん] (chồng bạn / anh nhà) |
| **Vợ** | 妻[つま] / 家内[かない] (vợ tôi) | 奥[おく]さん (vợ bạn / chị nhà) |
| **Con cái** | 子[こ]ども (con tôi) | お 子[こ]さん (con của bạn) |
| **Bố mẹ** | 両親[りょうしん] (bố mẹ tôi) | ご 両親[りょうしん] (hai bác / phụ huynh) |
| **Anh chị em** | 兄弟[きょうだい] (anh chị em tôi) | ご 兄弟[きょうだい] (anh chị em của bạn) |
| **Gia đình** | 家族[かぞく] (gia đình tôi) | ご 家族[かぞく] (gia đình bạn) |

---

## 4. Quy tắc số đếm và Lượng từ (Counters)

1. **Đồ vật thông thường (1 đến 10):**
   - Dùng hệ số đếm thuần Nhật: ひとつ (1), ふたつ (2), みっつ (3), よっつ (4), いつつ (5), むっつ (6), ななつ (7), やっつ (8), ここのつ (9), とお (10).
   - Từ 11 trở lên dùng số đếm thường (không dùng đuôi つ).

2. **Người (人):**
   - 1 người: ひとり (一人) [Bất quy tắc].
   - 2 người: ふたり (二人) [Bất quy tắc].
   - Từ 3 người trở lên: Số đếm + にん (三人: さんにん, 四人: よにん [chú ý đọc là よにん, không đọc よんにん hay しにん]).

3. **Vị trí lượng từ trong câu:**
   - Luôn đặt lượng từ liền trước động từ (sau trợ từ `を` hoặc `が`):
     - Đúng: `みかんを よっつ 買いました。` (Tôi mua 4 quả quýt.)
     - Tránh dịch đảo trật tự ảnh hưởng đến việc nắm bắt cấu trúc tiếng Nhật.
