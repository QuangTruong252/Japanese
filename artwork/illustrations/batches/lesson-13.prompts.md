# Prompt — batch `lesson-13`

Sinh từ `artwork/illustrations/batches/lesson-13.json` bằng `batch.mjs prompts`; sửa batch rồi chạy lại, không sửa file này.
Mỗi mục: một lần gọi tạo ảnh. Đính kèm ảnh tham chiếu khi có. Lưu đúng đường dẫn, giữ nguyên bytes, không ghi đè file có sẵn.

## `artwork/illustrations/atlases/lesson-13-places-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 image that is a sprite atlas of 4 separate illustrations arranged in a precise grid of 2 columns x 2 rows, for a Japanese-learning app's vocabulary cards.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

CELLS (row-major):
1. (row 1, column 1) an outdoor swimming pool with clear blue water, lane ropes and a small ladder
2. (row 1, column 2) a gentle river winding between grassy banks with a few stones
3. (row 2, column 1) a large airy living room with lots of open floor space, a small sofa and a big window
4. (row 2, column 2) a tiny cramped room crowded with a bed, a desk and stacked boxes leaving almost no floor space

LAYOUT RULES: each illustration is a standalone cutout centered in its own cell and fits inside the central 60% of the cell, with wide EMPTY transparent margins on all four sides; nothing touches another cell or the canvas edge. No grid lines, no cell backgrounds, no frames.
```

## `artwork/illustrations/atlases/lesson-13-meals-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 image that is a sprite atlas of 4 separate illustrations arranged in a precise grid of 2 columns x 2 rows, for a Japanese-learning app's vocabulary cards.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

CELLS (row-major):
1. (row 1, column 1) a Japanese set meal on a tray: a bowl of rice, miso soup, grilled fish and small side dishes
2. (row 1, column 2) a bowl of gyudon: rice topped with thin simmered beef and onions
3. (row 2, column 1) a lacquered tiered box of Japanese New Year osechi food beside a small kagami mochi topped with a mandarin
4. (row 2, column 2) a bamboo fishing rod with a freshly caught fish hanging from the line

LAYOUT RULES: each illustration is a standalone cutout centered in its own cell and fits inside the central 60% of the cell, with wide EMPTY transparent margins on all four sides; nothing touches another cell or the canvas edge. No grid lines, no cell backgrounds, no frames.
```

## `artwork/illustrations/vocab/playing-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: two children happily playing catch with a ball on a grassy lawn
```

## `artwork/illustrations/vocab/swimming-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: a person swimming front crawl in blue water, splashing lightly
```

## `artwork/illustrations/vocab/picking-up-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: at an airport arrivals gate, the reference woman waves to welcome the reference male student, who is arriving pulling a suitcase
```

## `artwork/illustrations/vocab/tired-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: the reference male student slumped exhausted over a desk piled with papers, eyes half closed
```

## `artwork/illustrations/vocab/wedding-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: a happy bride in a white dress and a groom in a dark suit holding hands with a small bouquet
```

## `artwork/illustrations/vocab/shopping-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: the reference woman walking cheerfully carrying several shopping bags in both hands
```

## `artwork/illustrations/vocab/strolling-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: the reference woman taking a leisurely stroll along a tree-lined park path
```

## `artwork/illustrations/vocab/skiing-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: a skier in a winter jacket and goggles gliding down a snowy slope with poles
```

## `artwork/illustrations/vocab/thirsty-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: the reference male student sweating under a hot sun, reaching eagerly for a bottle of water
```

## `artwork/illustrations/vocab/hungry-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: the reference male student holding his stomach and looking longingly at an empty bowl
```

## `artwork/illustrations/vocab/having-a-meal-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: the two recurring characters sitting at a small table having a meal together: rice bowls, miso soup and a side dish, both holding chopsticks
```

## `artwork/illustrations/vocab/fine-arts-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: fine arts still life: an artist palette with brushes, a small marble bust sculpture and a framed landscape painting leaning together
```

## `artwork/illustrations/scenes/lunch-diner-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Editorial watercolor and gouache illustration, hand-painted Japanese book-illustration feel: delicate dark pencil contours, soft organic painted washes, subtle paper texture, warm ivory paper tones. Palette: cream, warm sand, charcoal gray, muted sage green, warm timber wood, muted brick-red accents. Landscape 4:3 composition, FULL-BLEED: the painting fills the whole canvas edge to edge, with NO frame, NO border line, NO mat and NO paper margin around it.
Characters, when present: young male student = slightly messy short dark hair, cream long-sleeved shirt, charcoal trousers, black backpack; young woman = chin-length dark bob with bangs, cream cardigan over muted brick-red top, charcoal skirt, small brown shoulder bag.

Subject: a cozy lunchtime Japanese set-meal diner; the male student and the woman sit side by side at the wooden counter looking hungry and eager while a waitress in an apron brings a set-meal tray and a bowl of gyudon; blank menu boards on the wall and a plain noren curtain at the entrance.
Keep the main subject in the central area so the image survives cropping to a thumbnail.

STRICT REQUIREMENTS:
- Absolutely NO text, letters, kanji, kana, numbers or words anywhere: signs, boards, labels and screens stay completely blank.
- Clock faces have NO digits and NO Roman numerals.
- Hand-painted watercolor gouache look, NOT 3D, NOT CGI, NOT glossy vector, NOT photo.
```
