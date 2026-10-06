# Prompt — batch `lesson-10`

Sinh từ `artwork/illustrations/batches/lesson-10.json` bằng `batch.mjs prompts`; sửa batch rồi chạy lại, không sửa file này.
Mỗi mục: một lần gọi tạo ảnh. Đính kèm ảnh tham chiếu khi có. Lưu đúng đường dẫn, giữ nguyên bytes, không ghi đè file có sẵn.

## `artwork/illustrations/atlases/lesson-10-furniture-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 image that is a sprite atlas of 4 separate illustrations arranged in a precise grid of 2 columns x 2 rows, for a Japanese-learning app's vocabulary cards.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

CELLS (row-major):
1. (row 1, column 1) an ivory two-door refrigerator
2. (row 1, column 2) a round dining table with two chairs
3. (row 2, column 1) a single bed with a blanket and pillow
4. (row 2, column 2) a wooden shelf with blank-spined books and small plants

LAYOUT RULES: each illustration is a standalone cutout centered in its own cell and fits inside the central 60% of the cell, with wide EMPTY transparent margins on all four sides; nothing touches another cell or the canvas edge. No grid lines, no cell backgrounds, no frames.
```

## `artwork/illustrations/atlases/lesson-10-house-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 image that is a sprite atlas of 4 separate illustrations arranged in a precise grid of 2 columns x 2 rows, for a Japanese-learning app's vocabulary cards.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

CELLS (row-major):
1. (row 1, column 1) a wooden front door with a round doorknob
2. (row 1, column 2) a window with curtains and a small plant on the sill
3. (row 2, column 1) a wall light switch plate with a finger pressing it
4. (row 2, column 2) a few cylindrical batteries without labels

LAYOUT RULES: each illustration is a standalone cutout centered in its own cell and fits inside the central 60% of the cell, with wide EMPTY transparent margins on all four sides; nothing touches another cell or the canvas edge. No grid lines, no cell backgrounds, no frames.
```

## `artwork/illustrations/atlases/lesson-10-objects-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 image that is a sprite atlas of 4 separate illustrations arranged in a precise grid of 2 columns x 2 rows, for a Japanese-learning app's vocabulary cards.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

CELLS (row-major):
1. (row 1, column 1) an open cardboard box
2. (row 1, column 2) a leafy green tree
3. (row 2, column 1) a red cylindrical Japanese post box with no symbols or text
4. (row 2, column 2) an ATM machine with a blank screen and blank keypad buttons

LAYOUT RULES: each illustration is a standalone cutout centered in its own cell and fits inside the central 60% of the cell, with wide EMPTY transparent margins on all four sides; nothing touches another cell or the canvas edge. No grid lines, no cell backgrounds, no frames.
```

## `artwork/illustrations/atlases/lesson-10-places-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 image that is a sprite atlas of 4 separate illustrations arranged in a precise grid of 2 columns x 2 rows, for a Japanese-learning app's vocabulary cards.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

CELLS (row-major):
1. (row 1, column 1) a tall modern office building with many windows
2. (row 1, column 2) a convenience store front with glass windows and a blank sign stripe
3. (row 2, column 1) a small park with a bench, a tree, a slide and a little fountain
4. (row 2, column 2) a cozy retro coffee shop front with a striped awning and a blank sign

LAYOUT RULES: each illustration is a standalone cutout centered in its own cell and fits inside the central 60% of the cell, with wide EMPTY transparent margins on all four sides; nothing touches another cell or the canvas edge. No grid lines, no cell backgrounds, no frames.
```

## `artwork/illustrations/vocab/bus-stop-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: a bus stop with a small shelter, a bench and a blank sign pole
```

## `artwork/illustrations/scenes/cozy-room-v1.jpg`

Không có ảnh tham chiếu (nền đục).

```text
Editorial watercolor and gouache illustration, hand-painted Japanese book-illustration feel: delicate dark pencil contours, soft organic painted washes, subtle paper texture, warm ivory paper tones. Palette: cream, warm sand, charcoal gray, muted sage green, warm timber wood, muted brick-red accents. Landscape 4:3 composition, FULL-BLEED: the painting fills the whole canvas edge to edge, with NO frame, NO border line, NO mat and NO paper margin around it.
Characters, when present: young male student = slightly messy short dark hair, cream long-sleeved shirt, charcoal trousers, black backpack; young woman = chin-length dark bob with bangs, cream cardigan over muted brick-red top, charcoal skirt, small brown shoulder bag.

Subject: a cozy small apartment room with a bed, a shelf, a window and a table with a box on it; a cat sleeping on the bed and a dog under the table, making on/under/next-to relationships clear; the woman stands by the window.
Keep the main subject in the central area so the image survives cropping to a thumbnail.

STRICT REQUIREMENTS:
- Absolutely NO text, letters, kanji, kana, numbers or words anywhere: signs, boards, labels and screens stay completely blank.
- Clock faces have NO digits and NO Roman numerals.
- Hand-painted watercolor gouache look, NOT 3D, NOT CGI, NOT glossy vector, NOT photo.
```
