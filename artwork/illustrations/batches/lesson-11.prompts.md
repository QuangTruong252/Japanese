# Prompt — batch `lesson-11`

Sinh từ `artwork/illustrations/batches/lesson-11.json` bằng `batch.mjs prompts`; sửa batch rồi chạy lại, không sửa file này.
Mỗi mục: một lần gọi tạo ảnh. Đính kèm ảnh tham chiếu khi có. Lưu đúng đường dẫn, giữ nguyên bytes, không ghi đè file có sẵn.

## `artwork/illustrations/atlases/lesson-11-food-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 image that is a sprite atlas of 4 separate illustrations arranged in a precise grid of 2 columns x 2 rows, for a Japanese-learning app's vocabulary cards.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

CELLS (row-major):
1. (row 1, column 1) a single shiny red apple with a leaf on the stem
2. (row 1, column 2) two small mandarin oranges, one partly peeled
3. (row 2, column 1) a triangle sandwich cut in half showing egg, lettuce and ham
4. (row 2, column 2) a vanilla ice cream cone with two scoops

LAYOUT RULES: each illustration is a standalone cutout centered in its own cell and fits inside the central 60% of the cell, with wide EMPTY transparent margins on all four sides; nothing touches another cell or the canvas edge. No grid lines, no cell backgrounds, no frames.
```

## `artwork/illustrations/vocab/curry-rice-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: a plate of Japanese curry rice with a spoon beside it
```

## `artwork/illustrations/atlases/lesson-11-mail-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 image that is a sprite atlas of 4 separate illustrations arranged in a precise grid of 2 columns x 2 rows, for a Japanese-learning app's vocabulary cards.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

CELLS (row-major):
1. (row 1, column 1) a small sheet of four postage stamps with simple flower pictures and no numbers or text
2. (row 1, column 2) a picture postcard showing a small landscape on the front, back side blank
3. (row 2, column 1) a closed plain cream paper envelope with no writing
4. (row 2, column 2) an airmail envelope with a red-and-blue striped border and a small passenger airplane flying above it, no text

LAYOUT RULES: each illustration is a standalone cutout centered in its own cell and fits inside the central 60% of the cell, with wide EMPTY transparent margins on all four sides; nothing touches another cell or the canvas edge. No grid lines, no cell backgrounds, no frames.
```

## `artwork/illustrations/vocab/sea-mail-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: a small cargo ship sailing on gentle waves with cardboard parcels stacked on its deck, no text or labels
```

## `artwork/illustrations/vocab/parents-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: a middle-aged father and mother standing side by side, smiling warmly
```

## `artwork/illustrations/vocab/siblings-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: three siblings of different ages standing in a row from tallest to smallest: a teenage boy, a girl and a little boy
```

## `artwork/illustrations/vocab/international-student-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: a young international student with a backpack pulling a suitcase, holding a blank folded map
```

## `artwork/illustrations/vocab/school-class-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: a small class of students seen from behind sitting at desks, facing a teacher at a blank blackboard
```

## `artwork/illustrations/vocab/day-off-work-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: the young woman in casual clothes relaxing at home on a weekday morning, her office bag and folded work jacket hung by the door, holding a cup of tea
```

## `artwork/illustrations/scenes/post-office-counter-v1.jpg`

Không có ảnh tham chiếu (nền đục).

```text
Editorial watercolor and gouache illustration, hand-painted Japanese book-illustration feel: delicate dark pencil contours, soft organic painted washes, subtle paper texture, warm ivory paper tones. Palette: cream, warm sand, charcoal gray, muted sage green, warm timber wood, muted brick-red accents. Landscape 4:3 composition, FULL-BLEED: the painting fills the whole canvas edge to edge, with NO frame, NO border line, NO mat and NO paper margin around it.
Characters, when present: young male student = slightly messy short dark hair, cream long-sleeved shirt, charcoal trousers, black backpack; young woman = chin-length dark bob with bangs, cream cardigan over muted brick-red top, charcoal skirt, small brown shoulder bag.

Subject: inside a small neighborhood post office, the woman stands at the counter handing a cardboard parcel with a blank label to a smiling clerk who places it on a scale; a sheet of stamps, three envelopes and two postcards lie on the counter; the man waits behind her holding a paper bag of mandarin oranges. All signs and posters are blank.
Keep the main subject in the central area so the image survives cropping to a thumbnail.

STRICT REQUIREMENTS:
- Absolutely NO text, letters, kanji, kana, numbers or words anywhere: signs, boards, labels and screens stay completely blank.
- Clock faces have NO digits and NO Roman numerals.
- Hand-painted watercolor gouache look, NOT 3D, NOT CGI, NOT glossy vector, NOT photo.
```
