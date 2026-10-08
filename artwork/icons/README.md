# Bộ icon thành phần MaiPace

Nguồn của `web/src/components/FeatureIcon.tsx` (sinh tự động, không sửa tay path).

- `atlas-v2.png` (đang dùng): 13 icon theo chuẩn lưới 24px/nét 2px, khe ≥ 1,5× nét, tối đa 3–4 nét/icon; Codex built-in image_gen (gpt-6-luna, effort low), 2026-10-08. Prompt ở mục Prompt v2 bên dưới.
- `atlas-nav-v1.png`: 5 icon riêng cho thanh điều hướng (`nav-home`, `nav-lesson`, `nav-practice`, `nav-review`, `nav-lookup`): cùng khung, nhìn thẳng, 2–3 nét, không nét kép/chéo. Canh cỡ theo keyline Lucide (vuông 200/240, tròn 222/240). Không dùng lẫn icon thẻ trên thanh điều hướng.
- `atlas-v1.png` (bỏ): nhiều chi tiết, bết khi làm nét đậm bằng Lucide.
- `build.js`: tách icon theo dải trắng (không giả định lưới đều) → phóng từng icon vừa 222/240 → giãn nét tới độ dày đích `TARGET_STROKE` (mặc định 21/240; Lucide 2px đo ra 20) → potrace → svgo → ghi `FeatureIcon.tsx` và `out/*.svg|png`.
- Thứ tự đọc: vocab, grammar, listening, reading, kanji, kana, verbs, lesson, review, practice, lookup, weak-points, home.

Build lại: `cd artwork/icons && npm install && node build.js` (danh sách atlas trong `ATLASES`).
Thêm icon: tạo atlas mới cùng prompt (thêm ô), thêm vào `ATLASES` trong `build.js` (tên theo thứ tự đọc).

Dùng: `<FeatureIcon name="kanji" className="size-6 text-primary" />` — màu theo `currentColor`, nên dùng từ 24 px.

## Prompt v1 (lịch sử)

```text
Use case: logo-brand
Asset type: MaiPace icon set atlas for automatic SVG tracing
Input images: Image 1: mood reference only, calm hand-made Japanese stationery; do not copy its painting style, colors, texture, or subject matter.
Scene/backdrop: Pure flat white background. One landscape canvas divided only by the implied spacing of a precise 4-column by 3-row arrangement; no visible grid or boundaries.
Subject: Exactly 12 separate monochrome line icons, one centered in each equal cell, in reading order, each same optical size, each fitting inside a square, with wide empty gutters and at least 15% of each cell clear between icon and cell borders.
Style/medium: Pure flat solid black ink lines only on pure flat white. Clean trace-friendly closed smooth outlines, uniform medium-bold stroke about 1/14 of icon height, rounded caps and joins, subtly organic hand-inked line character. Simple and legible at 20px, maximum about 6 detail strokes per icon.
Composition/framing: Landscape 4 columns x 3 rows; icons centered in individual equal cells; generous whitespace. Absolutely no grid lines, cell borders, labels, captions, or extra marks.
Lighting/mood: Calm, quiet Japanese stationery mood conveyed only by restrained hand-inked line quality; no lighting effects.
Color palette: Black lines and white background only.
Materials/textures: Flat vector-like ink only; no texture, paper grain, gray, shading, hatching, gradients, color, or drop shadows.
Text (verbatim): Only icons 5 and 6 contain one Japanese character each: icon 5 contains 字, icon 6 contains あ. Render these exact characters clearly and correctly.
Constraints: Row 1 left to right: 1 Vocabulary: two overlapping flashcards, front one with a small corner fold. 2 Grammar: three linked blocks / puzzle-piece pair joined together, suggesting sentence structure. 3 Listening: over-ear headphones with two small sound-wave arcs on one side. 4 Reading: open book seen from front, with two short text lines on each page. Row 2 left to right: 5 Kanji: square writing-practice cell (genkō-yōshi box with a faint cross guide drawn as dashed line) containing the kanji 字 written with a brush feel. 6 Kana: bold hiragana あ inside a soft rounded square outline. 7 Verbs: a running figure / motion arrow — a simple arrow curving forward with two speed lines. 8 Lesson: closed book with a bookmark ribbon hanging from the top. Row 3 left to right: 9 Review: circular refresh arrow around a small card. 10 Practice: pencil writing a check mark. 11 Lookup: magnifying glass over a small grid/table. 12 Weak points: target with an arrow slightly off-center.
Avoid: Any extra icons or objects; any written words other than the exact single characters 字 and あ; gray or anti-aliased gray appearance, shading, hatching, texture, paper grain, gradients, color, shadows, grid lines, cell borders, captions, labels, watermark, irregular icon sizes, cropped icons, garbled characters, misspelled characters, or decorative backgrounds.
```

## Prompt v2

```text
Landscape icon atlas, 4 columns x 4 rows. Exactly thirteen simple clean black hand-inked Lucide-like Japanese learning icons in cells 1 through 13: overlapping flashcards with one line; two interlocking puzzle pieces; headphones with one sound arc; open book with one line per page; correctly written bold kanji 字 in rounded square; correctly written bold hiragana あ in matching rounded square; one curved up-forward arrow; upright closed book with bookmark notch; two curved refresh arrows with empty center; diagonal pencil with check; magnifying glass with 2x2 grid; target with exactly two rings and center dot plus one arrow; simple house roof body door. Cells 14–16 entirely empty. Centered icons, 15% clear gutters. Solid pure black strokes on pure white, uniform rounded 2px stroke on 24px basis, minimum 1.5x stroke gaps, no gray, shading, texture, color, shadows, gridlines, labels or decoration. Max 3–4 simple marks each; ample negative space and open holes. Reference attached v1 only for subject identity and hand-inked character. Crisp, consistent.
```

## Prompt nav v1

```text
Generate one landscape image containing exactly five separate mobile bottom-navigation icons in a single horizontal row, equal spacing, wide empty gutters of at least 40% of one icon width between icons. No labels, no grid lines, no extra marks. Pure flat solid black lines on pure flat white background. No gray, shading, texture, color, shadows, or filled areas. Drawn as if each icon sits on a 24x24 grid with a 2px stroke (stroke = 1/12 of icon height), identical everywhere, rounded caps and joins, very slightly hand-inked but clean. Same optical size and same visual weight; every icon fits the same square keyline; front/flat view only; no diagonal compositions; no perspective; no double lines (no book spine thickness, no layered outlines). Exactly 2–3 strokes per icon. Gaps between lines at least 1.5x the stroke width. Left to right: 1) home: simple house, pitched roof and body as one outline, small door (like Lucide "house"); 2) lesson: open book seen straight from the front, exactly two simple page shapes and one center fold line, nothing else; show only the two page outlines and center fold, absolutely no rear edges, outer backing border, spine thickness, shadow contour, or secondary/layered outlines (like Lucide "book-open"); 3) practice: clipboard (rounded rectangle with a small clip tab at top) with one check mark inside; 4) review: two curved arrows forming a circle (refresh), empty center (like Lucide "refresh-cw"); 5) lookup: a single magnifying glass, round lens and short handle to bottom-right, empty lens (like Lucide "search"). Use the attached artwork/icons/atlas-v2.png only as a reference for its hand-inked line character and stroke weight; do not reproduce its icons.
```
