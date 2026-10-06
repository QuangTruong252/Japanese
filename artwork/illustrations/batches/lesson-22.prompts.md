# Prompt — batch `lesson-22`

Sinh từ `artwork/illustrations/batches/lesson-22.json` bằng `batch.mjs prompts`; sửa batch rồi chạy lại, không sửa file này.
Mỗi mục: một lần gọi tạo ảnh. Đính kèm ảnh tham chiếu khi có. Lưu đúng đường dẫn, giữ nguyên bytes, không ghi đè file có sẵn.

## `artwork/illustrations/atlases/lesson-22-wearables-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 image that is a sprite atlas of 4 separate illustrations arranged in a precise grid of 2 columns x 2 rows, for a Japanese-learning app's vocabulary cards.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

CELLS (row-major):
1. (row 1, column 1) a compact long winter overcoat in camel brown hanging on a wooden hanger, buttons closed
2. (row 1, column 2) a compact neatly folded knitted wool sweater in sage green with a visible cable-knit pattern
3. (row 2, column 1) a compact dark charcoal business suit, jacket and trousers together on one hanger, over a white shirt
4. (row 2, column 2) a compact black felt hat with a round brim and a plain band, no logo

LAYOUT RULES: each illustration is a standalone cutout centered in its own cell and fits inside the central 60% of the cell, with wide EMPTY transparent margins on all four sides; nothing touches another cell or the canvas edge. No grid lines, no cell backgrounds, no frames.
```

## `artwork/illustrations/atlases/lesson-22-things-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 image that is a sprite atlas of 4 separate illustrations arranged in a precise grid of 2 columns x 2 rows, for a Japanese-learning app's vocabulary cards.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

CELLS (row-major):
1. (row 1, column 1) a compact pair of folded eyeglasses with round dark frames, seen at a slight angle
2. (row 1, column 2) a compact homemade round strawberry shortcake with white cream and fresh strawberries on top, on a small plate
3. (row 2, column 1) a compact friendly small toy robot with a boxy silver body, round eyes and jointed arms, standing upright
4. (row 2, column 2) a compact stack of a neatly folded Japanese futon mattress and quilt with a small pillow on top

LAYOUT RULES: each illustration is a standalone cutout centered in its own cell and fits inside the central 60% of the cell, with wide EMPTY transparent margins on all four sides; nothing touches another cell or the canvas edge. No grid lines, no cell backgrounds, no frames.
```

## `artwork/illustrations/vocab/putting-on-jacket-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: the reference male student in the middle of putting on a jacket: one arm already through a sleeve, pulling the jacket over his shoulder
```

## `artwork/illustrations/vocab/putting-on-shoes-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: the reference woman sitting on a step at a home entrance, pulling a sneaker onto her foot, the other shoe already on
```

## `artwork/illustrations/vocab/putting-on-hat-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: the reference woman lifting a wide-brim straw hat with both hands and placing it onto her head
```

## `artwork/illustrations/vocab/putting-on-glasses-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: an older man with gray hair holding eyeglasses by both temples and sliding them onto his face
```

## `artwork/illustrations/vocab/tying-necktie-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: a young man in a white dress shirt tying a dark red necktie around his collar, hands at the knot
```

## `artwork/illustrations/vocab/newborn-baby-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: a tiny newborn baby sleeping peacefully, swaddled in a soft cream blanket and cradled in a mother's arms
```

## `artwork/illustrations/vocab/japanese-style-room-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: a traditional Japanese-style room with tatami mats, sliding paper shoji screens, a low wooden table and floor cushions
```

## `artwork/illustrations/vocab/dining-kitchen-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: a small bright open dining kitchen: a kitchen counter with sink and stove beside a dining table with two chairs in the same room
```

## `artwork/illustrations/vocab/oshiire-closet-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.

STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.

LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.

SUBJECT: a built-in Japanese oshiire closet with its sliding fusuma doors open, an upper shelf holding folded bedding and a lower shelf with storage boxes
```

## `artwork/illustrations/scenes/apartment-hunting-v1.png`

Tham chiếu: `artwork/illustrations/reference/paper-town-style-v1.png`

```text
Editorial watercolor and gouache illustration, hand-painted Japanese book-illustration feel: delicate dark pencil contours, soft organic painted washes, subtle paper texture, warm ivory paper tones. Palette: cream, warm sand, charcoal gray, muted sage green, warm timber wood, muted brick-red accents. Landscape 4:3 composition, FULL-BLEED: the painting fills the whole canvas edge to edge, with NO frame, NO border line, NO mat and NO paper margin around it.
Characters, when present: young male student = slightly messy short dark hair, cream long-sleeved shirt, charcoal trousers, black backpack; young woman = chin-length dark bob with bangs, cream cardigan over muted brick-red top, charcoal skirt, small brown shoulder bag.

Subject: a small cozy real estate office; the male student and the woman sit at a desk looking at a blank apartment floor plan, while a friendly agent wearing glasses and a necktie points at it; on the wall, blank photo cards of rooms (a tatami room, a dining kitchen); a hat and coat hang on a stand by the door.
Keep the main subject in the central area so the image survives cropping to a thumbnail.

STRICT REQUIREMENTS:
- Absolutely NO text, letters, kanji, kana, numbers or words anywhere: signs, boards, labels and screens stay completely blank.
- Clock faces have NO digits and NO Roman numerals.
- Hand-painted watercolor gouache look, NOT 3D, NOT CGI, NOT glossy vector, NOT photo.
```
