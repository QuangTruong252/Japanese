---
version: alpha
name: Washi
description: Design system for a personal Japanese self-study web app (Minna no Nihongo N5 & N4). Warm washi paper surfaces, a single torii-red accent, and Japanese text treated as the primary content. Built on Tailwind CSS v4 + shadcn/ui.
colors:
  background: oklch(0.99 0.002 90)
  foreground: oklch(0.2 0.01 285)
  card: oklch(1 0 0)
  card-foreground: oklch(0.2 0.01 285)
  popover: oklch(1 0 0)
  popover-foreground: oklch(0.2 0.01 285)
  primary: oklch(0.55 0.2 25)
  primary-foreground: oklch(0.98 0.005 90)
  secondary: oklch(0.96 0.006 90)
  secondary-foreground: oklch(0.25 0.01 285)
  muted: oklch(0.96 0.006 90)
  muted-foreground: oklch(0.5 0.012 285)
  accent: oklch(0.95 0.02 25)
  accent-foreground: oklch(0.35 0.1 25)
  border: oklch(0.91 0.006 90)
  input: oklch(0.91 0.006 90)
  ring: oklch(0.55 0.2 25)
  success: oklch(0.52 0.15 155)
  success-foreground: oklch(0.99 0.01 155)
  destructive: oklch(0.58 0.24 27)
  destructive-foreground: oklch(0.99 0.01 27)
  warning: oklch(0.56 0.14 70)
  warning-foreground: oklch(0.99 0.01 70)
  info: oklch(0.52 0.14 250)
  info-foreground: oklch(0.99 0.01 250)
  verb-1: oklch(0.53 0.19 25)
  verb-2: oklch(0.48 0.15 250)
  verb-3: oklch(0.48 0.12 155)
  chart-1: "#2a78d6"
  chart-2: "#eb6834"
  chart-3: "#1baf7a"
  chart-4: "#eda100"
  chart-5: "#e87ba4"
typography:
  display:
    fontFamily: Inter Variable
    fontSize: 32px
    fontWeight: "600"
    lineHeight: 36px
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter Variable
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
    letterSpacing: -0.01em
  h2:
    fontFamily: Inter Variable
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 28px
  h3:
    fontFamily: Inter Variable
    fontSize: 18px
    fontWeight: "600"
    lineHeight: 24px
  body:
    fontFamily: Inter Variable
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 26px
  small:
    fontFamily: Inter Variable
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
  caption:
    fontFamily: Inter Variable
    fontSize: 12px
    fontWeight: "500"
    lineHeight: 16px
  jp-quiz:
    fontFamily: Noto Sans JP Variable
    fontSize: 24px
    fontWeight: "500"
    lineHeight: 2
  jp-example:
    fontFamily: Noto Sans JP Variable
    fontSize: 20px
    fontWeight: "400"
    lineHeight: 2
  jp-vocab:
    fontFamily: Noto Sans JP Variable
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 2
  jp-inline:
    fontFamily: Noto Sans JP Variable
    fontSize: 16px
    fontWeight: "500"
    lineHeight: 2
  furigana:
    fontFamily: Noto Sans JP Variable
    fontSize: 11px
    fontWeight: "500"
    lineHeight: 1
rounded:
  sm: 6px
  DEFAULT: 10px
  md: 8px
  lg: 10px
  xl: 14px
  full: 9999px
spacing:
  unit: 4px
  page-x: 16px
  page-x-wide: 24px
  card-padding: 20px
  card-gap: 16px
  section-gap: 32px
  field-gap: 8px
  nav-height: 64px
  nav-clearance: 96px
  touch-min: 48px
  touch-gap: 8px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.small}"
    rounded: "{rounded.lg}"
    height: 36px
    padding: 0 12px
  button-quiz:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    height: "{spacing.touch-min}"
    padding: 0 16px
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    typography: "{typography.small}"
    rounded: "{rounded.lg}"
    height: 36px
  button-ghost:
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: 32px
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: "{spacing.card-padding}"
  popover:
    backgroundColor: "{colors.popover}"
    textColor: "{colors.popover-foreground}"
    rounded: "{rounded.xl}"
    padding: 12px
  answer-option:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.jp-vocab}"
    rounded: "{rounded.xl}"
    height: "{spacing.touch-min}"
    padding: 16px
  answer-option-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
  answer-option-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
  answer-option-correct:
    backgroundColor: "{colors.success}"
    textColor: "{colors.success-foreground}"
  answer-option-wrong:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive-foreground}"
  phrase-token:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    typography: "{typography.jp-vocab}"
    rounded: "{rounded.xl}"
    height: "{spacing.touch-min}"
    padding: 0 16px
  jp-input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.jp-example}"
    rounded: "{rounded.lg}"
    height: "{spacing.touch-min}"
    padding: 0 16px
  nav-bar:
    backgroundColor: "{colors.card}"
    height: "{spacing.nav-height}"
  nav-item-active:
    textColor: "{colors.primary}"
    typography: "{typography.caption}"
    height: "{spacing.touch-min}"
  nav-item-inactive:
    textColor: "{colors.muted-foreground}"
    typography: "{typography.caption}"
    height: "{spacing.touch-min}"
  player-play-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    size: 56px
  player-speed-chip:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    height: 44px
    padding: 0 12px
  sync-badge-synced:
    textColor: "{colors.success}"
    typography: "{typography.caption}"
  sync-badge-pending:
    textColor: "{colors.warning}"
    typography: "{typography.caption}"
  sync-badge-offline:
    textColor: "{colors.muted-foreground}"
    typography: "{typography.caption}"
  grammar-pattern-block:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    typography: "{typography.jp-example}"
    rounded: "{rounded.lg}"
    padding: 16px
  hint-callout:
    backgroundColor: "{colors.info}"
    textColor: "{colors.info-foreground}"
    rounded: "{rounded.lg}"
    padding: 12px
  verb-badge-group-1:
    backgroundColor: "{colors.verb-1}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: 2px 8px
  verb-badge-group-2:
    backgroundColor: "{colors.verb-2}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: 2px 8px
  verb-badge-group-3:
    backgroundColor: "{colors.verb-3}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: 2px 8px
  badge-overdue:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.warning-foreground}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: 2px 8px
  chart-series-vocab:
    backgroundColor: "{colors.chart-1}"
  chart-series-grammar:
    backgroundColor: "{colors.chart-2}"
  chart-series-kanji:
    backgroundColor: "{colors.chart-3}"
  chart-series-particle:
    backgroundColor: "{colors.chart-4}"
  chart-series-listening:
    backgroundColor: "{colors.chart-5}"
---

# Washi

A personal Japanese self-study app for Minna no Nihongo N5 and N4. Learners read lessons,
drill five exercise types, shadow audio, and follow an FSRS review schedule. Interface copy
is Vietnamese; study content is Japanese.

## Overview

The visual identity is **washi paper**: a warm off-white plane, thin ink-like rules, and a
single torii red used sparingly for the one action that matters on each screen. Nothing
glows, nothing floats. The chrome is deliberately quiet so that Japanese characters are the
loudest thing on any screen.

Five rules settle every disagreement:

1. **Japanese text is the hero.** Kanji and furigana are always the largest, highest-contrast
   elements. Controls recede into `muted-foreground`.
2. **Paper, not glass.** Flat surfaces separated by 1px `border` rules. Shadows are reserved
   for true overlays.
3. **Thumb first, keyboard second.** Every practice control sits in the lower half of the
   screen. Keyboard shortcuts accelerate desktop use but are never required.
4. **Color never carries meaning alone.** Correct/wrong, sync state, and verb groups always
   ship with a Lucide icon and a text label. This is a colorblind-accessibility constraint.
5. **Data state is always visible.** The learner always knows whether work is local, pending,
   or synced.

Dark mode is a **selected** scheme, not an inversion. The front matter above carries the light
scheme only, because this format version has no dual-scheme syntax; the dark steps are listed
in the Colors section below and live in the `.dark` block of `web/src/app/globals.css`.

### How this file relates to the code

This file is the **contract**; `web/src/app/globals.css` is the **runtime implementation**. They
are kept in agreement by hand, and they are not interchangeable:

```
design.md lint DESIGN.md --format json          # check this file
design.md export DESIGN.md --format css-tailwind # preview the @theme block
```

The export is a cross-check, **not** a replacement for `globals.css`. Running it and pasting the
result over the stylesheet would lose three things the app depends on: OKLCH authoring (the
export flattens colors to hex), the entire dark scheme, and the `@theme inline` indirection that
lets the `.dark` class override every token at runtime.

Three tokens — `border`, `input` and `ring` — lint as orphaned because no component references
them. That is expected and should not be "fixed": this format version has no `borderColor`
property, so a stroke color cannot be referenced from a component block. They are consumed
directly by utilities in the stylesheet.

## Colors

All colors are authored in **OKLCH** so perceived lightness stays even across hues. Chart
slots are the one exception and stay in hex, because they are copied verbatim from a
validated palette.

### Foundation

| Token | Role | Light | Dark |
|---|---|---|---|
| `background` | Page plane, washi cream | `oklch(0.99 0.002 90)` | `oklch(0.17 0.01 285)` |
| `foreground` | Primary ink | `oklch(0.2 0.01 285)` | `oklch(0.93 0.005 90)` |
| `card` | Raised surface, one step up | `oklch(1 0 0)` | `oklch(0.21 0.01 285)` |
| `card-foreground` | Ink on cards | `oklch(0.2 0.01 285)` | `oklch(0.93 0.005 90)` |
| `popover` | Overlay surface | `oklch(1 0 0)` | `oklch(0.21 0.01 285)` |
| `popover-foreground` | Ink on overlays | `oklch(0.2 0.01 285)` | `oklch(0.93 0.005 90)` |
| `primary` | Torii red, the only brand accent | `oklch(0.55 0.2 25)` | `oklch(0.65 0.19 25)` |
| `primary-foreground` | Ink on torii red | `oklch(0.98 0.005 90)` | `oklch(0.15 0.01 285)` |
| `secondary` | Quiet fill, unselected chips | `oklch(0.96 0.006 90)` | `oklch(0.26 0.01 285)` |
| `secondary-foreground` | Ink on quiet fill | `oklch(0.25 0.01 285)` | `oklch(0.93 0.005 90)` |
| `muted` | Recessed fill | `oklch(0.96 0.006 90)` | `oklch(0.26 0.01 285)` |
| `muted-foreground` | Secondary ink, labels, furigana | `oklch(0.5 0.012 285)` | `oklch(0.68 0.012 285)` |
| `accent` | Soft red wash for hover and selection | `oklch(0.95 0.02 25)` | `oklch(0.3 0.04 25)` |
| `accent-foreground` | Ink on the red wash | `oklch(0.35 0.1 25)` | `oklch(0.9 0.03 25)` |
| `border` | Hairline rule | `oklch(0.91 0.006 90)` | `oklch(0.28 0.01 285)` |
| `input` | Field outline | `oklch(0.91 0.006 90)` | `oklch(0.28 0.01 285)` |
| `ring` | Focus ring | `oklch(0.55 0.2 25)` | `oklch(0.65 0.19 25)` |

Exactly one element per screen wears `primary` as a fill. More than one means the screen has
no focal point yet.

### Status

Four reserved colors. They mean state and nothing else, and they are never used as chart
series or decoration. Every value was measured against the surface it renders on and clears
**4.5:1**, so each one is safe as text, not just as a fill.

| Token | Meaning | Light on `card` | Dark on `card` |
|---|---|---|---|
| `success` | Answer correct · synced to cloud | `oklch(0.52 0.15 155)` — 5.01:1 | `oklch(0.72 0.15 155)` — 7.62:1 |
| `destructive` | Answer wrong · error · delete | `oklch(0.58 0.24 27)` — 4.78:1 | `oklch(0.65 0.2 27)` — 5.00:1 |
| `warning` | Sync pending · review overdue | `oklch(0.56 0.14 70)` — 4.78:1 | `oklch(0.8 0.14 75)` — 9.32:1 |
| `info` | Hint · grammar note | `oklch(0.52 0.14 250)` — 5.51:1 | `oklch(0.72 0.13 250)` — 7.19:1 |

Their paired ink tokens `success-foreground`, `destructive-foreground`, `warning-foreground`
and `info-foreground` are near-white in light mode and near-black in dark mode; use them only
when the status color is a solid fill.

**Hard rule:** a status color always ships with a Lucide icon and a text label. A correct
answer does not merely turn green — it shows `<Check />` and its border thickens to 2px.

### Verb groups

Identity colors, bound permanently to a grammatical group. They never shift with context and
never stand in for status.

| Token | Group | Light | Dark |
|---|---|---|---|
| `verb-1` | Group 1 · godan | `oklch(0.53 0.19 25)` | `oklch(0.72 0.17 25)` |
| `verb-2` | Group 2 · ichidan | `oklch(0.48 0.15 250)` | `oklch(0.72 0.13 250)` |
| `verb-3` | Group 3 · irregular | `oklch(0.48 0.12 155)` | `oklch(0.72 0.12 155)` |

Always render the label `Nhóm 1 / 2 / 3` alongside. No learner should have to memorize a hue.

### Charts

Five categorical slots for the statistics screen, validated against this app's real card
surfaces (`#ffffff` light, `#18181d` dark). Every gate passes: lightness band, chroma floor,
colorblind separation ΔE 9.1, normal-vision separation ΔE 19.6.

| Token | Hue | Light | Dark |
|---|---|---|---|
| `chart-1` | blue | `#2a78d6` | `#3987e5` |
| `chart-2` | orange | `#eb6834` | `#d95926` |
| `chart-3` | aqua | `#1baf7a` | `#199e70` |
| `chart-4` | yellow | `#eda100` | `#c98500` |
| `chart-5` | magenta | `#e87ba4` | `#d55181` |

Slots bind to entities in fixed order and never cycle: vocab → `chart-1`, grammar → `chart-2`,
kanji → `chart-3`, particle → `chart-4`, listening → `chart-5`. A filter that changes the
series count must not repaint the survivors. Charts carry a single y-axis, a legend whenever
two or more series are present, and text in ink tokens rather than series colors. In light
mode slots 3 through 5 fall below 3:1 on white, so light-mode charts **must** carry direct
value labels or a companion data table. Continuous scales such as the streak heatmap use one
hue stepped light to dark, never a rainbow.

## Typography

Two families, no serif and no display face anywhere.

| Family | Used for | Tailwind token |
|---|---|---|
| **Inter Variable** | Interface, Vietnamese, English | `font-sans` |
| **Noto Sans JP Variable** | All Japanese text | `font-jp` |
| `ui-monospace` | Tabular figures, hashes | `font-mono` |

### Latin scale

| Token | Size / line height | Weight | Used for |
|---|---|---|---|
| `display` | 32 / 36px | 600 | Dashboard hero figures: streak, accuracy |
| `h1` | 24 / 32px | 600 | Page titles |
| `h2` | 20 / 28px | 600 | Section titles, grammar point names |
| `h3` | 18 / 24px | 600 | Card titles |
| `body` | 16 / 26px | 400 | Grammar explanations, Vietnamese meanings |
| `small` | 14 / 20px | 400 | Labels, notes, book references |
| `caption` | 12 / 16px | 500 | Nav labels, badges, timestamps |

### Japanese scale

Japanese runs **one step larger than its Latin counterpart** and needs a line height of `2` to
leave room for furigana. Every element containing Japanese carries the `jp` class.

| Token | Size | Used for |
|---|---|---|
| `jp-quiz` | 24px | The question in a practice screen — the visual anchor |
| `jp-example` | 20px | Example sentences in a lesson, grammar patterns |
| `jp-vocab` | 18px | Vocabulary rows, answer options, phrase tokens |
| `jp-inline` | 16px | Japanese inside buttons and chips |
| `furigana` | 11px | Ruby text, rendered in `muted-foreground` |

### Furigana

Furigana is built from **native `<ruby>` and `<rt>` elements**. No CSS overlay, no JavaScript
width measurement — the browser already handles centering, line breaking and leading, which are
the three hard parts.

- Toggle with pure CSS: `html.hide-furigana rt { visibility: hidden }`. Because nothing
  re-renders, the kanji never shift position when a learner hides or shows readings.
- Size scales through the `--furigana-scale` variable (`1` or `1.25`), never per element.
- The effective size is `min(0.62em, 0.95rem)` times that scale, which is what the `furigana`
  token above approximates at body size.
- On pointer devices `.ruby-word:hover` zooms to 1.5× for close inspection. Disabled entirely
  on touch.

## Layout

### Spacing scale

The base `unit` is 4px, matching Tailwind's default scale. Use only steps 1, 2, 3, 4, 5, 6, 8,
12 and 16 — never an arbitrary value like `p-[13px]`.

| Token | Value | Applies to |
|---|---|---|
| `page-x` | 16px | Horizontal page padding on mobile |
| `page-x-wide` | 24px | Horizontal page padding from 768px up |
| `card-padding` | 20px | Interior padding of a card |
| `card-gap` | 16px | Gap between sibling cards |
| `section-gap` | 32px | Gap between major content blocks |
| `field-gap` | 8px | Gap between a label and its input |
| `nav-height` | 64px | Bottom navigation bar, plus the safe-area inset |
| `nav-clearance` | 96px | Bottom padding on any page that sits under the nav |
| `touch-min` | 48px | Minimum touch target in the practice flow |
| `touch-gap` | 8px | Minimum gap between two adjacent touch targets |

### Touch targets

`touch-min` is a hard accessibility floor, not a suggestion.

| Element | Minimum |
|---|---|
| Practice buttons, answer options, matching cells, phrase tokens | **48 × 48px** |
| Audio player controls | 44 × 44px |
| Bottom navigation items | 48px tall |
| Interface chrome: small icon buttons, menus | 32px — desktop only, never inside the practice flow |

> shadcn `base-nova` ships a 32px default button and a 36px `lg`. **Neither reaches 48px.**
> Those sizes are for chrome. Anything inside the practice flow uses the `quiz` size variant.

### Breakpoints

Tailwind defaults, but only three points actually change the layout.

| Breakpoint | Width | Change |
|---|---|---|
| base | < 768px | Single column, navigation fixed to the bottom |
| `md` | ≥ 768px | Two columns for lesson lists and statistics |
| `lg` | ≥ 1024px | Navigation moves to the top, content centers |

**No vertical sidebar.** The app has five destinations; one bar serves both form factors, and
a sidebar would spend horizontal space that Japanese text needs.

### Content widths

| Screen | Max width |
|---|---|
| Lesson reading, grammar | 672px — keeps line length readable |
| Practice | 576px — focused, low distraction |
| Dashboard, statistics | 1024px |
| Settings | 672px |

### Screen templates

Every new screen falls into one of five shapes.

**Dashboard.** Greeting and streak badge, then a large "Review today — n due" card carrying the
primary action, then a row of three stat tiles (streak, minutes today, 7-day accuracy), then
the lesson in progress, then the top three weak points. Tiles stack on mobile and become three
columns from `md`.

**Lesson list.** A card grid, one column on mobile and two from `md`. Each card shows the lesson
number, Vietnamese title, Japanese title, a 4px progress rule, and a learned-vocabulary count.

**Lesson detail.** One 672px column in a fixed order: vocabulary, grammar, examples, audio. Each
grammar point is a block of H2 title, pattern block, Vietnamese explanation, then examples. The
book reference closes the block in `small` at `muted-foreground`.

**Practice.** A top bar with progress "7/20", an exit control and a timer; a visually dominant
question area; an answer area pinned to the **lower half**; and feedback that slides up from the
bottom. The page **never scrolls during a question** — if content overflows, shrink the question
area rather than pushing the answer area off screen.

**Statistics.** 1024px wide. A stat tile row, then charts following the rules in Colors, then a
weak-point table filterable by target type.

### Motion

Motion explains what just happened; it does not decorate.

| Case | Duration | Curve |
|---|---|---|
| Color, hover, focus | 150ms | ease-out |
| Answer result reveal | 200ms | ease-out |
| Card entry/exit, question change | 250ms | ease-in-out |
| Dragging a phrase token | spring | stiffness 400, damping 30 |
| Wrong-answer shake | 300ms, 4px, 3 beats | ease-in-out |

Wrap all animation in `@media (prefers-reduced-motion: no-preference)`. With motion reduced the
correct/wrong result must still appear in full — only the movement is dropped.

## Elevation & Depth

Depth comes from hairlines, not shadows. The default separator between any two surfaces is a
**1px `border` rule**, and the default card carries no shadow at all.

Only three levels exist:

| Level | Applies to |
|---|---|
| None | Cards, answer options, content blocks — the default |
| `shadow-md` | Popovers, dropdowns, the bottom navigation bar |
| `shadow-lg` | Dialogs, sheets, the hovered furigana zoom |

Border **thickness** is the second depth channel. An answer option's border goes from 1px to
**2px** when selected or when a result is revealed, so state survives without relying on fill
color alone.

## Shapes

Radius derives from a 10px base.

| Token | Value | Applies to |
|---|---|---|
| `sm` | 6px | Badges, small chips |
| `DEFAULT` | 10px | Fallback when no size is specified |
| `md` | 8px | Inputs, small buttons |
| `lg` | 10px | Standard buttons, grammar pattern blocks |
| `xl` | 14px | Cards, answer options, phrase tokens |
| `full` | 9999px | Avatars, the circular play button, speed chips |

Nothing in this system is square-cornered, and nothing is a pill except the tokens listed as
`full`.

## Components

### Buttons

`button-primary` is the one filled torii-red action per screen. `button-secondary` carries
supporting actions, `button-ghost` handles icon buttons and row-level actions.

`button-quiz` is the mandatory size for **anything inside the practice flow**: 48px tall,
`xl` radius, `body` type. It exists because the library's own sizes top out at 36px.

Every clickable element defines all six states. A missing state is a defect.

| State | Treatment |
|---|---|
| Default | Variant's own fill and border |
| Hover | Fill deepens one step — **only under `(hover: hover)`** |
| Focus | 3px `ring` at 50% opacity. Never removed |
| Active | Shifts down 1px |
| Disabled | 50% opacity, pointer events off |
| Loading | Spinner replaces the icon, width unchanged so layout cannot jump |

### Surfaces

`card` is the workhorse container: `card` fill, 1px `border`, `xl` radius, `card-padding`
interior, no shadow. Structure runs title (`h3`) → content → right-aligned action row.
`popover` is the same material one level up, with `shadow-md`.

`grammar-pattern-block` presents a grammar pattern on a `muted` fill at `lg` radius so it reads
as quoted material rather than interactive. `hint-callout` uses the `info` fill for optional
hints and grammar asides.

### Answer option

The most important component in the app. Shared by multiple-choice and matching exercises.
Minimum 48px tall, `xl` radius, 16px padding, `jp-vocab` type. The index number 1–4 shows on
desktop to match the keyboard shortcuts and hides on mobile.

| State | Component token | Fill | Border | Non-color cue |
|---|---|---|---|---|
| Idle | `answer-option` | `card` | 1px `border` | Index number at left |
| Hover | `answer-option-hover` | `accent` | 1px `border` | — |
| Selected | `answer-option-selected` | `accent` | **2px** `primary` | — |
| Correct | `answer-option-correct` | `success` at 10% | **2px** `success` | `<Check />` at right |
| Wrong | `answer-option-wrong` | `destructive` at 10% | **2px** `destructive` | `<X />` plus a 3-beat shake |

The `answer-option-correct` and `answer-option-wrong` tokens name the full-strength status
color; render the fill at 10% opacity and reserve the solid value for the border and icon.

### Exercise inputs

`phrase-token` is the sentence-reordering chip: `secondary` fill, `xl` radius, 48px tall,
`jp-vocab` type. A used token drops to 40% opacity and stops responding **but keeps its slot**,
so the layout never reflows mid-answer. The answer tray is a dashed region at least 64px tall
showing "Chạm vào từ bên dưới" when empty.

`jp-input` is the typed-answer field for cloze and listening transcription: 48px tall, `lg`
radius, `jp-example` type, centered. It binds `wanakana` so romaji converts to hiragana as the
learner types, and always carries the caption "Gõ romaji, chữ tự chuyển sang hiragana".

### Navigation

`nav-bar` is `card` fill at `nav-height`, with a 1px top rule and `shadow-md`, plus the bottom
safe-area inset. It holds five destinations: Học, Luyện tập, Ôn tập, Thống kê, Cài đặt. Each is
a 24px icon above a `caption` label. The open destination uses `nav-item-active`; the rest use
`nav-item-inactive`. Ôn tập carries a due-count badge whenever the count exceeds zero. From
`lg` the same five items move into a 56px top bar, left-aligned, with sync state and avatar on
the right.

### Audio player

Three stacked rows. A 48px progress track whose touch area spans the full width, with A and B
markers drawn as solid `primary` ticks and the loop region filled at 15% `primary`. Then the
transport row: `player-play-button` centered as a 56px circle, flanked by 44px skip controls.
Then the secondary row of `player-speed-chip` options (0.75×, 0.85×, 1.0×, 1.2×), the A and B
set buttons, the loop toggle and the transcript toggle. The active speed chip inverts to
`primary`.

### Sync badge

Anchored to the right of the navigation bar. Three states, each with its own icon and wording
so the color is never doing the work alone.

| State | Component token | Icon | Label |
|---|---|---|---|
| Synced | `sync-badge-synced` | `<CloudCheck />` | "Đã đồng bộ" |
| Pending | `sync-badge-pending` | `<CloudUpload />` | "Chờ đồng bộ (n)" |
| Offline | `sync-badge-offline` | `<CloudOff />` | "Ngoại tuyến — đã lưu trên máy" |

On mobile only the icon shows; the label appears on tap or in a tooltip.

### Badges

`verb-badge-group-1`, `verb-badge-group-2` and `verb-badge-group-3` mark conjugation class in
vocabulary rows and lesson detail. Each is a small `sm`-radius chip in its group color with
`primary-foreground` ink and a `caption` label reading `Nhóm 1`, `Nhóm 2` or `Nhóm 3`. The
label is not optional — the color is a memory aid, not the message.

`badge-overdue` marks a review item past its due date: solid `warning` fill,
`warning-foreground` ink, an `<AlarmClock />` icon and the number of days late.

### Chart series

`chart-series-vocab`, `chart-series-grammar`, `chart-series-kanji`, `chart-series-particle`
and `chart-series-listening` pin each review target type to its slot. These exist so the
binding is machine-readable rather than a convention someone has to remember: the mapping is
fixed and must not be reassigned when a filter changes the number of visible series.

## Do's and Don'ts

**Do** reference colors by token name — `bg-primary`, `text-muted-foreground`. Tailwind v4
exposes every token in this file as a `--color-*`, `--text-*`, `--radius-*` or `--spacing-*`
custom property, so there is never a reason to write a hex value in a component.

**Do** wrap every run of Japanese in the `jp` class and pick the matching `jp-*` type token.

**Do** give each screen exactly one `primary`-filled action.

**Do** pair every status color with a Lucide icon and a text label.

**Do** add `nav-clearance` bottom padding to any page that sits under the navigation bar.

**Do** design at 390px first, then widen to 1280px, and check both schemes before calling a
screen finished.

**Don't** use a shadow where a 1px `border` will separate two surfaces.

**Don't** use `success`, `destructive`, `warning` or `info` as a chart series or as decoration.
They are reserved for state.

**Don't** put a button smaller than 48px into the practice flow, including the library's own
`default` and `lg` sizes.

**Don't** remove a focus ring, and don't apply hover styling outside a `(hover: hover)` query —
on touch devices it sticks after the tap.

**Don't** let the practice screen scroll while a question is open. Shrink the question area
instead.

**Don't** build furigana with absolutely positioned overlays. Use `<ruby>` and `<rt>`.

**Don't** recolor chart series when a filter changes the result count. Color follows the
entity, never its rank.

**Don't** introduce a color, radius, or spacing value that is not in this file. If something
genuinely needs a new token, add it here first.
