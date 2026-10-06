# Prompt — batch `lesson-07`

Sinh từ `artwork/illustrations/batches/lesson-07.json` bằng `batch.mjs prompts`; sửa batch rồi chạy lại, không sửa file này.
Mỗi mục: một lần gọi tạo ảnh. Đính kèm ảnh tham chiếu khi có. Lưu đúng đường dẫn, giữ nguyên bytes, không ghi đè file có sẵn.

## `artwork/illustrations/atlases/lesson-07-stationery-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 image that is a sprite atlas of 4 separate illustrations arranged in a precise grid of 2 columns x 2 rows, for a Japanese-learning app's vocabulary cards.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

CELLS (row-major):
1. (row 1, column 1) a pair of scissors with sage handles
2. (row 1, column 2) a two-hole paper punch
3. (row 2, column 1) a stapler
4. (row 2, column 2) a roll of clear adhesive tape in a dispenser

LAYOUT RULES: each illustration is a standalone cutout centered in its own cell and fits inside the central 60% of the cell, with wide EMPTY transparent margins on all four sides; nothing touches another cell or the canvas edge. No grid lines, no cell backgrounds, no frames.
```

## `artwork/illustrations/atlases/lesson-07-items-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 image that is a sprite atlas of 4 separate illustrations arranged in a precise grid of 2 columns x 2 rows, for a Japanese-learning app's vocabulary cards.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

CELLS (row-major):
1. (row 1, column 1) an eraser with a blank paper sleeve
2. (row 1, column 2) a small stack of blank white paper sheets
3. (row 2, column 1) a smartphone with a blank dark screen
4. (row 2, column 2) a New Year greeting postcard decorated with a painted pine branch and a red sun, no writing

LAYOUT RULES: each illustration is a standalone cutout centered in its own cell and fits inside the central 60% of the cell, with wide EMPTY transparent margins on all four sides; nothing touches another cell or the canvas edge. No grid lines, no cell backgrounds, no frames.
```

## `artwork/illustrations/atlases/lesson-07-gifts-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 image that is a sprite atlas of 4 separate illustrations arranged in a precise grid of 2 columns x 2 rows, for a Japanese-learning app's vocabulary cards.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

CELLS (row-major):
1. (row 1, column 1) a gift box wrapped in sage paper with a red ribbon bow
2. (row 1, column 2) a taped cardboard parcel next to a small suitcase
3. (row 2, column 1) a small train ticket with blank printing
4. (row 2, column 2) a few coins and folded banknotes, all blank without numbers or portraits

LAYOUT RULES: each illustration is a standalone cutout centered in its own cell and fits inside the central 60% of the cell, with wide EMPTY transparent margins on all four sides; nothing touches another cell or the canvas edge. No grid lines, no cell backgrounds, no frames.
```

## `artwork/illustrations/atlases/lesson-07-misc-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 image that is a sprite atlas of 4 separate illustrations arranged in a precise grid of 2 columns x 2 rows, for a Japanese-learning app's vocabulary cards.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

CELLS (row-major):
1. (row 1, column 1) a decorated Christmas tree with presents underneath
2. (row 1, column 2) an open human hand, palm facing forward
3. (row 2, column 1) a smartphone whose blank screen shows a simple envelope icon, no text
4. (row 2, column 2) the reference male student making a phone call with a smartphone

LAYOUT RULES: each illustration is a standalone cutout centered in its own cell and fits inside the central 60% of the cell, with wide EMPTY transparent margins on all four sides; nothing touches another cell or the canvas edge. No grid lines, no cell backgrounds, no frames.
```

## `artwork/illustrations/atlases/lesson-07-actions-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 image that is a sprite atlas of 4 separate illustrations arranged in a precise grid of 2 columns x 2 rows, for a Japanese-learning app's vocabulary cards.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

CELLS (row-major):
1. (row 1, column 1) two hands cutting a sheet of paper with scissors
2. (row 1, column 2) the reference woman putting a letter into a red post box
3. (row 2, column 1) a teacher pointing at a blank blackboard while explaining
4. (row 2, column 2) the reference woman learning piano while a teacher beside her shows the keys

LAYOUT RULES: each illustration is a standalone cutout centered in its own cell and fits inside the central 60% of the cell, with wide EMPTY transparent margins on all four sides; nothing touches another cell or the canvas edge. No grid lines, no cell backgrounds, no frames.
```

## `artwork/illustrations/vocab/father-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: a friendly middle-aged father in a cardigan and slacks, smiling
```

## `artwork/illustrations/vocab/mother-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: a friendly middle-aged mother wearing an apron, smiling
```

## `artwork/illustrations/vocab/giving-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: the reference male student giving a wrapped present to the reference woman, who smiles
```

## `artwork/illustrations/scenes/gift-giving-v1.jpg`

Không có ảnh tham chiếu (nền đục).

```text
Editorial watercolor and gouache illustration, hand-painted Japanese book-illustration feel: delicate dark pencil contours, soft organic painted washes, subtle paper texture, warm ivory paper tones. Palette: cream, warm sand, charcoal gray, muted sage green, warm timber wood, muted brick-red accents. Landscape 4:3 composition, FULL-BLEED: the painting fills the whole canvas edge to edge, with NO frame, NO border line, NO mat and NO paper margin around it.
Characters, when present: young male student = slightly messy short dark hair, cream long-sleeved shirt, charcoal trousers, black backpack; young woman = chin-length dark bob with bangs, cream cardigan over muted brick-red top, charcoal skirt, small brown shoulder bag.

Subject: in a cozy home living room, the male student gives a wrapped present to the woman across a low table with tea cups; scissors, wrapping paper and a vase of flowers nearby.
Keep the main subject in the central area so the image survives cropping to a thumbnail.

STRICT REQUIREMENTS:
- Absolutely NO text, letters, kanji, kana, numbers or words anywhere: signs, boards, labels and screens stay completely blank.
- Clock faces have NO digits and NO Roman numerals.
- Hand-painted watercolor gouache look, NOT 3D, NOT CGI, NOT glossy vector, NOT photo.
```
