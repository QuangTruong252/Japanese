# Pilot đo chi phí/chất lượng — Bài 5 (06/10/2026)

Mục tiêu: so sánh atlas 4×2, atlas 2×2 và ảnh đơn trên Codex `image_gen` (gói Plus) về hạn mức, thời gian, độ phân giải ô và lỗi rãnh alpha; thử Antigravity cho cover nền đục. Kết quả ở `reports/pilot-2026-10-06.md`.

Ảnh mẫu bắt buộc (Codex): `artwork/illustrations/reference/paper-town-style-v1.png`, vai trò STYLE REFERENCE.

## Khối phong cách dùng chung (STYLE)

```text
STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.
```

## 1. Atlas 4×2 → `artwork/illustrations/atlases/lesson-05-vehicles-v1.png`

```text
Create ONE wide 2:1 image (landscape) that is a sprite atlas of 8 separate illustrations arranged in a precise grid of 4 columns x 2 rows, for a Japanese-learning app's vocabulary cards.

<STYLE block>

CELLS (row-major):
1. (row 1, column 1) a passenger aeroplane in flight, side three-quarter view, plain livery
2. (row 1, column 2) a small white passenger ferry boat on a little patch of painted water
3. (row 1, column 3) a commuter electric train car (sage stripe) on a short piece of track with overhead pantograph
4. (row 1, column 4) a subway train emerging from a tunnel mouth with steps down to an underground entrance
5. (row 2, column 1) a white Shinkansen bullet train with long pointed nose, blue stripe, on a short track
6. (row 2, column 2) a city bus, ivory and sage, side three-quarter view, blank destination board
7. (row 2, column 3) a taxi sedan with a small blank roof lamp, charcoal and cream
8. (row 2, column 4) a city bicycle with front basket

LAYOUT RULES: each illustration is a standalone cutout centered in its own cell and fits inside the central 60% of the cell, with wide EMPTY transparent margins on all four sides; nothing touches another cell or the canvas edge. No grid lines, no cell backgrounds, no frames.
```

## 2. Atlas 2×2 → `artwork/illustrations/atlases/lesson-05-places-v1.png`

```text
Create ONE square 1:1 image that is a sprite atlas of 4 separate illustrations arranged in a precise grid of 2 columns x 2 rows, for a Japanese-learning app's vocabulary cards.

<STYLE block>

CELLS (row-major):
1. (row 1, column 1) a small Japanese school building with a clock tower whose face is blank (no numbers), a gate and a cherry tree
2. (row 1, column 2) a neighborhood supermarket storefront with glass doors, shopping carts and fruit crates, blank sign
3. (row 2, column 1) a small train station building with a platform roof and a blank station sign
4. (row 2, column 2) a birthday cake with lit candles and a small wrapped gift box

LAYOUT RULES: each illustration is a standalone cutout centered in its own cell and fits inside the central 60% of the cell, with wide EMPTY transparent margins on all four sides; nothing touches another cell or the canvas edge. No grid lines, no cell backgrounds, no frames.
```

## 3. Ảnh đơn → `artwork/illustrations/vocab/<stem>.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

<STYLE block>

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides; nothing touches the canvas edge.
SUBJECT: <subject>
```

| Stem | Từ | Subject |
| --- | --- | --- |
| `walking-v1` | aruite | the reference male student walking on foot along a short stretch of pavement, mid-stride, relaxed |
| `going-home-v1` | kaerimasu | the reference woman arriving at the front door of a small house in the evening, opening the door, warm light inside |
| `friends-v1` | tomodachi | the reference male student and woman standing side by side laughing together as friends, one waving |
| `family-v1` | kazoku | a small family of four (parents, a child and a grandmother) standing together, smiling, everyday clothes |

## 4. Cover nền đục (Antigravity) → `artwork/illustrations/scenes/station-platform-v1.jpg`

Antigravity `generate_image` không nhận ảnh mẫu và không có alpha; chỉ dùng cho cảnh nền đục 4:3.

```text
Editorial watercolor and gouache illustration, hand-painted Japanese book-illustration feel: delicate dark pencil contours, soft organic painted washes, subtle paper texture, warm ivory paper background. Palette: cream, warm sand, charcoal gray, muted sage green, warm timber wood, muted brick-red accents. Landscape 4:3 composition.

Subject: two young people waiting on a small Japanese train station platform on a calm morning, a sage-and-ivory local train arriving.
- Young male student: slightly messy short dark hair, cream long-sleeved shirt, charcoal trousers, black backpack.
- Young woman: chin-length dark bob with bangs, cream cardigan over muted brick-red top, charcoal skirt, small brown shoulder bag.
Setting: platform roof with timber posts, a bench, potted plants, low town roofs and a bicycle parked beyond the fence; a hanging round clock with a completely blank face.
Keep the two people and the train front in the central area so the image survives cropping to a thumbnail.

STRICT REQUIREMENTS:
- Absolutely NO text, letters, kanji, kana, numbers or words anywhere: station signs, destination boards and platform numbers must be completely blank.
- The clock face has NO digits and NO Roman numerals.
- Hand-painted watercolor gouache look, NOT 3D, NOT CGI, NOT glossy vector, NOT photo.
```
