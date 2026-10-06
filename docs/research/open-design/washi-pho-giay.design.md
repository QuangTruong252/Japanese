---
version: alpha
name: Washi · Phố giấy
description: >-
  Proposal for redesigning MaiPace, a personal Japanese self-study web app (Minna no Nihongo
  N5/N4, Vietnamese UI, Japanese study content). Colors are sampled from the app's own
  watercolor/gouache "Phố giấy" (paper town) illustrations: warm ivory paper, sand and wood,
  warm sumi ink, olive foliage, a rare brick-vermilion accent, faded indigo and sakura pink.
  Light scheme only; dark scheme is described in prose.
colors:
  background: "#fbf6ec"
  foreground: "#29231d"
  brand: "#bf412c"
  card: "#fefbf7"
  card-foreground: "#29231d"
  popover: "#fefbf7"
  popover-foreground: "#29231d"
  primary: "#bf412c"
  primary-foreground: "#fefbf7"
  secondary: "#f4ecde"
  secondary-foreground: "#29231d"
  muted: "#f4ecde"
  muted-foreground: "#6b6157"
  accent: "#ffe7e1"
  accent-foreground: "#7e3124"
  border: "#e2d8c8"
  input: "#e2d8c8"
  ring: "#bf412c"
  success: "#427138"
  success-foreground: "#fefbf7"
  destructive: "#ba2936"
  destructive-foreground: "#fefbf7"
  warning: "#9d621e"
  warning-foreground: "#fefbf7"
  info: "#326893"
  info-foreground: "#fefbf7"
  verb-1: "#b2422e"
  verb-2: "#2c628d"
  verb-3: "#476933"
  chart-1: "#3275b4"
  chart-2: "#934319"
  chart-3: "#6e9441"
  chart-4: "#8d3d67"
  chart-5: "#ac7d1b"
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
  DEFAULT: 10px
  sm: 6px
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
  answer-option:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.jp-vocab}"
    rounded: "{rounded.xl}"
    height: "{spacing.touch-min}"
    padding: 16px
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
    backgroundColor: "{colors.background}"
    height: "{spacing.nav-height}"
  nav-item-active:
    textColor: "{colors.primary}"
    typography: "{typography.caption}"
    height: "{spacing.touch-min}"
  nav-item-inactive:
    textColor: "{colors.muted-foreground}"
    typography: "{typography.caption}"
    height: "{spacing.touch-min}"
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
---

# Washi · Phố giấy

MaiPace helps Vietnamese learners study Japanese at their own pace: read a lesson, drill five
exercise types, review what is due (FSRS). Interface copy is Vietnamese; study content is
Japanese. Tagline: "Học tiếng Nhật theo nhịp của bạn." Tone: calm, clear, respectful; no
streak guilt, no rankings, no "master it fast" promises.

## Visual world

The interface is the paper the illustrations are painted on. Watercolor/gouache scenes of
small streets, shops, rooms and two recurring students sit full-bleed on warm ivory paper and
fade into the page at their edges, never boxed in a card. UI chrome is quiet ink on paper;
the illustrations carry the color.

- **Paper, not glass.** Flat warm surfaces, 1px hairlines, no glassmorphism, no gradients,
  no glossy 3D. Shadows only for things that truly float (menus, dialogs).
- **Warm ink everywhere.** Text and icons use a warm sumi brown-black, never a cool gray or
  pure black. Neutrals sit on the illustrations' sand hue (~80°).
- **Muted chroma ceiling.** Every sampled illustration color stays at low-to-medium
  saturation. UI colors follow: no neon, no saturated digital blue/green.
- **Red is rare.** Brick vermilion appears in under 0.5% of illustration pixels. In the UI it
  is the single filled action per screen, the active nav item and the selected state. Never a
  large fill or decoration.
- **Japanese is the hero.** Kanji and furigana are the largest, highest-contrast text.
  Furigana is native `<ruby>`; romaji is never shown in place of Japanese.

## Color roles

| Token | Role |
|---|---|
| `background` | Page paper (warm ivory) |
| `card` / `popover` | One step lighter paper for raised content |
| `muted` / `secondary` | Kem (cream) recessed fills, chips, grammar blocks |
| `border` / `input` | Sand hairline |
| `foreground` | Warm sumi ink |
| `muted-foreground` | Faded ink for labels and secondary text (5.6:1 on paper) |
| `brand` / `primary` | Son (vermilion) — the one filled action, active nav, selection |
| `accent` | Sakura wash for hover and selection |
| `success` | Moss green — correct, synced |
| `warning` | Wood ochre — pending, overdue |
| `info` | Ai (faded indigo) — hints, grammar asides |
| `destructive` | Crimson — wrong, delete |
| `verb-1/2/3` | Godan / ichidan / irregular identity; always with label "Nhóm 1/2/3" |
| `chart-1..5` | vocab=ai, grammar=kaki, kanji=moss, particle=plum, listening=ochre |

Every status color ships with an icon and a text label; color never carries meaning alone.
All status, verb and primary colors clear 4.5:1 on `background` and `card`.

### Dark scheme ("phố đêm")

A selected warm night scheme, not an inversion: warm near-black paper, warm off-white ink,
a lighter son red for the primary action with dark ink on it, and lighter moss, wood,
indigo and crimson for status. Illustrations keep their paper colors and sit on a slightly
lighter card so they do not glow.

## Typography

Two families, no serif: Inter Variable for Vietnamese/Latin UI, Noto Sans JP Variable for
all Japanese. Japanese runs one step larger than Latin with line-height 2 for furigana.
Caption (12px) is the floor. Display exceptions for the learning flow: Home action title
24/32/48px (mobile/tablet/desktop), Japanese lesson titles 32–36px, short multiple-choice
prompts 60–72px.

## Layout

Mobile-first at 390px, then 1280px. Below 1024px: bottom navigation with five items (Bảng
tin, Học bài, Luyện tập, Ôn tập, Tra cứu), icon + label always visible. From 1024px: left
sidebar with the same five items; profile and settings at the sidebar foot. Reading width
~max-w-2xl; dashboard ~max-w-5xl. Practice controls sit in the lower half of the screen,
48px minimum touch targets, 8px between targets.

## Surfaces

Default card: `card` fill, 1px `border`, 14px radius, no shadow. Elevated (menu/popover):
adds a soft shadow. Overlay (dialog/sheet): larger shadow plus scrim. Illustrated panoramas
and scenes: full-bleed, no border, no radius, edges fade into `background`.

## Motion

150ms for color/hover/focus, 200ms answer reveal, 250ms content change, ease-out. Animate
only transform and opacity. Nothing loops to attract attention. Respect reduced motion.

## Don'ts

- No hex outside tokens, no raw Tailwind palette colors in components.
- No text, kana, signage or UI controls painted inside illustrations; labels are HTML.
- No more than one primary-filled element per screen.
- No status color used as a chart series or as decoration.
- No cool grays, pure black, neon, gradients, glass blur or glossy 3D.
