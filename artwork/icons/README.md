# Bộ icon thành phần MaiPace

Nguồn của `web/src/components/FeatureIcon.tsx` (sinh tự động, không sửa tay path).

- `atlas-v1.png`: 12 icon nét mực đen/trắng, lưới 4×3, Codex built-in image_gen (gpt-6-luna, effort low), 2026-10-08.
- `build.js`: cắt theo lưới → một tỉ lệ chung cho cả bộ (nét đều) → potrace → svgo → ghi `FeatureIcon.tsx` và `out/*.svg|png`.
- Thứ tự ô: vocab, grammar, listening, reading, kanji, kana, verbs, lesson, review, practice, lookup, weak-points.

Build lại: `cd artwork/icons && npm install && node build.js atlas-v1.png`.
Thêm icon: tạo atlas mới cùng prompt (thêm ô), cập nhật `NAMES`/`COLS`/`ROWS` trong `build.js`.

Dùng: `<FeatureIcon name="kanji" className="size-6 text-primary" />` — màu theo `currentColor`, nên dùng từ 24 px.

## Prompt

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
