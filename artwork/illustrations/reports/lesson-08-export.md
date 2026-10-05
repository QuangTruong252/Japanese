# Báo cáo Export Cutout Minh họa — Lesson 8 (Minna no Nihongo)

Ngày thực hiện: 2026-10-05
Trạng thái: **Hoàn tất thành công (16/16 cutouts)**
Script export: `artwork/illustrations/tools/export-atlas.mjs`

---

## 1. Tóm tắt kết quả

- Đã trích xuất và tối ưu hóa thành công **16 minh họa từ vựng** mới cho Bài 8 từ 2 atlas nguồn (`lesson-08-objects-v1.png` và `lesson-08-adjectives-v1.png`).
- Tất cả **16 file WebP 512×512** đã sẵn sàng tại `web/public/assets/illustrations/vocab/`.
- Toàn bộ **16 master PNG** và **16 file metadata sidecar JSON** được tạo tại `artwork/illustrations/vocab/`.
- Prompt đầy đủ đã được nhúng trực tiếp vào từng master PNG qua công cụ `impeccable embed-prompt`.
- **Tổng dung lượng 16 WebP mới:** 459,726 bytes (~449 KB), trung bình ~28.7 KB/hình, kích thước trên đĩa; chưa benchmark mạng.
- **Bảo toàn tài nguyên cũ:** Toàn bộ 27 tài nguyên sản xuất trước đó (23 vocab + 4 asset khác) được bảo toàn 100%, không bị ghi đè (export từ chối ghi đè; coordinator đã đối chiếu hash baseline).

---

## 2. Chi tiết 16 tài nguyên được xuất

### Nhóm 1: `artwork/illustrations/atlases/lesson-08-objects-v1.png`
- Kích thước atlas gốc: 1774 × 887 (2:1 native RGBA)
- Thời gian xử lý: 29,887 ms
- Tổng dung lượng WebP: 236,698 bytes

| Stem | ID từ vựng | Bounding Crop (X,Y WxH) | Dung lượng (WebP) | SHA256 (WebP) | Trạng thái Alpha |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `white-shirt-v1` | `shiroi` | `0,0 443x447` | 17,826 B | `e1e83256a0bb972daf4de007f7816a8199d6e418febd556be6737f88df325e0f` | Đạt (206k trans / 55k partial) |
| `black-shoes-v1` | `kuroi` | `443,0 444x447` | 22,526 B | `3bae82bb852d2f73ec8ca208f28fe05315e357a6b880f793169210edacad6ddf` | Đạt (213k trans / 48k partial) |
| `red-flower-v1` | `akai` | `887,0 443x447` | 24,964 B | `cea5b6188d23e9495955c83f9fe7a5c8935c56c5aa222fe4f6c1ae6a2a84643b` | Đạt (220k trans / 41k partial) |
| `blue-car-v1` | `aoi` | `1330,0 444x447` | 27,594 B | `ffc09f9e4b56d7905808d94d61469e9e1c2c2083ac41f70adafd101498526d17` | Đạt (200k trans / 60k partial) |
| `cherry-blossom-v1` | `sakura` | `0,447 443x440` | 42,580 B | `d9d0b317c75aad7bba4869b64cd1b0302b76856f4991e3f69cdfa839de73a03f` | Đạt (207k trans / 54k partial) |
| `mountain-v1` | `yama` | `443,447 442x440` | 30,670 B | `1b7c76728bb0b7238645c480bb36e7aba74bf8c7e253834ea3d756308fa1f7d8` | Đạt (195k trans / 67k partial) |
| `town-v1` | `machi` | `885,447 445x440` | 41,210 B | `a620260378d62ecf50dc0408f7daaaefe65dc596d96d49f8425351fd70a522f3` | Đạt (180k trans / 82k partial) |
| `food-v1` | `tabemono` | `1330,447 444x440` | 29,328 B | `57ced59ff4106c478dcc5f07f39940672e69f33a0ad5ab03b9de438f19ecfecc` | Đạt (188k trans / 73k partial) |

---

### Nhóm 2: `artwork/illustrations/atlases/lesson-08-adjectives-v1.png`
- Kích thước atlas gốc: 1774 × 887 (2:1 native RGBA)
- Thời gian xử lý: 30,574 ms
- Tổng dung lượng WebP: 223,028 bytes

| Stem | ID từ vựng | Bounding Crop (X,Y WxH) | Dung lượng (WebP) | SHA256 (WebP) | Trạng thái Alpha |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `large-bag-v1` | `ookii` | `0,0 443x445` | 21,038 B | `e2402031730b808c03a22d54779ab35cd11307929c76c26ff8a923f208872c76` | Đạt (206k trans / 55k partial) |
| `small-bag-v1` | `chiisai` | `443,0 444x445` | 20,418 B | `185a905b12c22411f1e2cea118046d0933abe06ea06042fd8f1e2f36cf3f964b` | Đạt (231k trans / 30k partial) |
| `new-laptop-v1` | `atarashii` | `887,0 443x445` | 22,982 B | `54a5ef7f381e37f42bfacc26db52efe5c9655311c9100edb87bebad9b935e886` | Đạt (195k trans / 66k partial) |
| `old-clock-v1` | `furui` | `1330,0 444x445` | 19,202 B | `f2cc65f44a472558c8bc89be0b5c361a40f8eccf4055d857074e7f9d624e676c` | Đạt (216k trans / 45k partial) |
| `hot-weather-v1` | `atsui` | `0,445 443x442` | 38,742 B | `de73971f2f501a638300be2a661f70410626a6110628543fb4662a67101e4324` | Đạt (175k trans / 86k partial) |
| `cold-weather-v1` | `samui` | `443,445 444x442` | 41,530 B | `103677d292f38d3b19b7159a673ed0364f436f207e51da98b85d3d73eed63b9d` | Đạt (164k trans / 97k partial) |
| `cold-water-v1` | `tsumetai` | `887,445 443x442` | 23,786 B | `06233f32c1ad843c99475e0712ada0e8733c0b32d83e5e353b1d46c9df858f85` | Đạt (209k trans / 53k partial) |
| `delicious-food-v1` | `oishii` | `1330,445 444x442` | 35,330 B | `056b00e3f1e45a17d633e87077553aa843ea59b7a177ac039394665943582bb1` | Đạt (173k trans / 88k partial) |

---

## 3. Kiểm định chất lượng và Gutter ranh giới

- **Gutter & Border check:** 100% cạnh của cả 16 bounding box có `nonZeroBorder === 0`. Không có bất kỳ nét vẽ nào chạm mép khung cắt hoặc bị cắt ngang.
- **Tọa độ & Căn lề:** Các đối tượng nằm gọn trong trung tâm, chừa biên an toàn tối thiểu xung quanh đúng tiêu chuẩn thiết kế Washi.
- **Cấu hình WebP:** Căn `contain` trong khung 448×448, đệm biên đối xứng 32px mỗi cạnh để đạt chuẩn 512×512, chất lượng 82, alphaQuality 100, effort 6.
- **Tính toàn vẹn:** Tất cả file output khớp chính xác độ dài byte và mã băm SHA256 được lưu trong sidecar JSON.
