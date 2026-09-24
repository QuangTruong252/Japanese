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

The global design contract for MaiPace, a personal Japanese self-study app for Minna no
Nihongo N5 and N4. Learners read lessons, drill five exercise types, shadow audio, and follow
an FSRS review schedule. Interface copy is Vietnamese; study content is Japanese.

## What this file is

This file is the **single global design contract**: how the interface should feel, which
semantic token serves which purpose, and which patterns every screen inherits. It is not a
screen catalogue and not a token database.

| Concern | Authoritative source |
|---|---|
| Product scope, users, principles | `PRODUCT.md` |
| Global UX and visual contract | **this file** |
| Runtime token values | `web/src/app/globals.css` |
| Screen requirements, layout detail, Stitch brief | `docs/specs/SPEC-xx.md` |
| Acceptance evidence, dated verification | `docs/handoff/SPEC-xx.md` |
| Agent operating rules, completion checks | `AGENTS.md` |
| Vietnamese reading guide for this file | `docs/design-system.md` |

Two rules resolve every ownership question:

1. **Raw value belongs to `globals.css`. Semantic usage belongs here.** A hue, a radius step or
   a font stack is defined once, in the stylesheet. This file says what it means and when to
   reach for it. Prose here does not restate hex or OKLCH values; if you need the number, read
   the stylesheet.
2. **Global rule belongs here. Screen decision belongs to the SPEC.** A SPEC may specialise a
   pattern for its screen; it may not silently contradict this file. A screen that genuinely
   needs a different global rule gets this file updated deliberately, in the same change.

### The front matter

The YAML block above this heading is the **machine-readable representation** of the contract,
written in Google Stitch's `design.md` format. It exists so an AI visual tool can be handed
one file. It is a hand-maintained mirror, **not** a third source of truth: when it disagrees
with `globals.css`, the stylesheet wins and the front matter is the thing to fix.

It carries the light scheme only, because this format version has no dual-scheme syntax. The
dark scheme lives in the `.dark` block of the stylesheet and is a **selected** scheme, not an
inversion of the light one.

Two known limits of the format, neither of which is a defect to fix:

- `border`, `input` and `ring` lint as orphaned tokens. This version has no `borderColor`
  property, so a stroke color cannot be referenced from a component block. Utilities in the
  stylesheet consume them directly.
- Exporting the front matter back to CSS is a cross-check only:

  ```
  design.md lint DESIGN.md --format json
  design.md export DESIGN.md --format css-tailwind
  ```

  **Never** paste that export over `globals.css`. It flattens OKLCH to hex, drops the entire
  dark scheme, and loses the `@theme inline` indirection that lets `.dark` override every
  token at runtime.

## Principles

Five rules settle every disagreement:

1. **Japanese text is the hero.** Kanji and furigana are the largest, highest-contrast
   elements on a screen. Controls recede into `muted-foreground`.
2. **Paper, not glass.** Flat surfaces separated by hairline rules. Shadows and blur are
   reserved for things that genuinely float above the page.
3. **Thumb first, keyboard second.** Every practice control sits within thumb reach in the
   lower half of the screen. Keyboard shortcuts accelerate desktop use but are never required.
4. **Color never carries meaning alone.** Correct/wrong, sync state and verb groups always
   ship with a Lucide icon and a text label. This is a colorblind-accessibility constraint.
5. **Data state is always visible.** The learner always knows whether work is local, pending
   or synced.

## Color

Every color reaches a component as a **semantic token**, through its Tailwind utility
(`bg-primary`, `text-muted-foreground`, `border-success`). Values are authored in OKLCH in
the stylesheet so perceived lightness stays even across hues; chart slots are the documented
exception and stay in hex.

### Semantic roles

| Token | Use it for | Do not use it for |
|---|---|---|
| `background` | The page plane | Cards or any raised surface |
| `foreground` | Primary ink | Secondary labels, captions |
| `card` / `card-foreground` | Raised surface one step up, and its ink | Page background |
| `popover` / `popover-foreground` | Overlay surface and its ink | Inline content |
| `primary` / `primary-foreground` | The one filled action per screen, active navigation, selected state | Status, decoration, large fills |
| `secondary` / `secondary-foreground` | Supporting actions, unselected chips, phrase tokens | The screen's main action |
| `muted` / `muted-foreground` | Recessed fills; secondary ink, labels, furigana | Body copy that must be read |
| `accent` / `accent-foreground` | Hover and selection wash | Persistent fills or status |
| `border` / `input` | Hairline separation, field outlines | Text |
| `ring` | Focus ring, always 3px at 50% opacity | Decorative outlines |

Exactly one element per screen wears `primary` as a fill. More than one means the screen has
no focal point yet.

### Status

Four reserved tokens. They mean state and nothing else. Each one was measured against the
surface it renders on and clears **4.5:1**, so each is safe as text and not only as a fill.

| Token | Meaning |
|---|---|
| `success` | Answer correct, synced to cloud |
| `destructive` | Answer wrong, error, destructive action |
| `warning` | Sync pending, review overdue |
| `info` | Hint, grammar aside |

The paired ink tokens (`success-foreground` and siblings) are only for when the status color
is a solid fill. **Hard rule:** a status color always ships with a Lucide icon and a text
label. A correct answer does not merely turn green, it shows `<Check />` and its border
thickens to 2px.

### Verb groups

`verb-1`, `verb-2` and `verb-3` are identity colors bound permanently to a grammatical group
(godan, ichidan, irregular). They never shift with context and never stand in for status.
Always render the label `Nhóm 1 / 2 / 3` alongside; no learner should have to memorise a hue.

### Charts

Five categorical slots, validated against this app's real card surfaces in both schemes
(lightness band, chroma floor, colorblind separation, normal-vision separation).

Slots bind to entities in fixed order and never cycle:

```
vocab -> chart-1    grammar -> chart-2    kanji -> chart-3
particle -> chart-4    listening -> chart-5
```

1. **Color follows the entity, never its rank.** A filter that changes the series count must
   not repaint the survivors.
2. **One y-axis per chart.** Two quantities on different scales are two charts.
3. **A legend whenever two or more series are present.** A single series is named by the title.
4. **Text wears ink tokens**, not series colors. Only the swatch beside a label carries the
   series color.
5. **Light mode requires direct labels.** Slots 3 to 5 fall below 3:1 on a white card, so a
   light-mode chart must carry visible value labels or a companion data table.
6. **Continuous scales use one hue** stepped light to dark. The streak heatmap steps
   `chart-1`, never a rainbow.
7. **Status tokens are never a series color**, and series colors are never a status.
8. Thin strokes, recessed grid: 2px lines, markers at 8px or more, 1px `border` gridlines.

### Palette discipline

Semantic intent maps to a semantic token, never to an arbitrary palette entry.

| If you mean | Reach for | Not |
|---|---|---|
| Success, completion, synced | `success` | `emerald-*`, `green-*` |
| Warning, pending, overdue | `warning` | `amber-*`, `yellow-*` |
| Error, wrong, delete | `destructive` | `red-*` |
| Hint, neutral information | `info` | `blue-*`, `sky-*` |
| A data category | `chart-1` to `chart-5` | any raw palette hue |
| Brand emphasis | `primary` | any raw palette hue |

Raw Tailwind palette classes and raw hex in components are outside the system. If something
genuinely needs a color this file does not have, add the token here and in the stylesheet
first.

## Typography

Two families, no serif and no display face anywhere: **Inter Variable** for interface,
Vietnamese and English (`font-sans`); **Noto Sans JP Variable** for all Japanese (`font-jp`);
`ui-monospace` for tabular figures and hashes (`font-mono`).

### Latin roles

| Role | Used for |
|---|---|
| `display` | Dashboard hero figures: streak, accuracy |
| `h1` | Page titles |
| `h2` | Section titles, grammar point names |
| `h3` | Card titles |
| `body` | Grammar explanations, Vietnamese meanings |
| `small` | Labels, notes, book references |
| `caption` | Navigation labels, badges, timestamps |

Sizes and weights for each role are in the front matter. `caption` is the **floor**: nothing
in the interface goes below it, because Vietnamese diacritics and Japanese glyphs are the
first things to stop being legible.

### Japanese scale

Japanese runs one step larger than its Latin counterpart and needs a line height of `2` to
leave room for furigana. Every element containing Japanese carries the `jp` class plus the
matching step, all defined in the stylesheet:

| Class | Used for |
|---|---|
| `jp-quiz` | The question in a practice screen, the visual anchor |
| `jp-example` | Example sentences, grammar patterns |
| `jp-vocab` | Vocabulary rows, answer options, phrase tokens |
| `jp-inline` | Japanese inside buttons and chips |

### Furigana

Furigana is built from **native `<ruby>` and `<rt>` elements**. No CSS overlay, no JavaScript
width measurement, because the browser already handles centering, line breaking and leading,
which are the three hard parts.

- Toggle with pure CSS (`html.hide-furigana rt { visibility: hidden }`). Because nothing
  re-renders, kanji never shift position when a learner hides or shows readings.
- Size scales through the `--furigana-scale` variable, never per element.
- On pointer devices the ruby word zooms for close inspection. Disabled entirely on touch.

## Spacing and touch targets

The base unit is 4px, matching Tailwind's scale. Use its steps, never an arbitrary value like
`p-[13px]`. The named spacing roles in the front matter (`page-x`, `card-padding`, `card-gap`,
`section-gap`, `field-gap`, `nav-clearance`) express the intent behind each step: page gutters
widen from tablet up, cards keep a single interior padding, major blocks are separated by
roughly double the card gap.

Bottom clearance for the navigation belongs to the shell, not to the page, and it exists only
while the bottom shell does — see §Navigation for the rule and for why no pixel value is
settled yet.

Touch targets are a hard accessibility floor, not a suggestion:

| Element | Minimum |
|---|---|
| Practice buttons, answer options, matching cells, phrase tokens | **48 x 48px** |
| Audio player controls | 44 x 44px |
| Primary navigation items | 48px tall |
| Interface chrome: small icon buttons, menus | 32px, desktop only, never inside the practice flow |

Adjacent touch targets keep at least 8px between them.

> shadcn `base-nova` ships a 32px default button and a 36px `lg`. **Neither reaches 48px.**
> Those sizes are chrome. Anything inside the practice flow uses `size="quiz"`.

## Layout and containers

Containers are named by the job they do, not by a width. The semantic name is the contract;
the utility is today's implementation of it.

| Semantic container | Use for | Current implementation |
|---|---|---|
| `content-narrow` | Reading: lesson content, grammar explanation, long-form learning | approx. `max-w-2xl` |
| `content-default` | Ordinary application screens: lists, settings, focused workflow, a practice session | approx. `max-w-xl` to `max-w-2xl` |
| `content-wide` | Dashboard, statistics, dense multi-column overview | approx. `max-w-5xl` |

Pick the container from the screen's job, then state the choice in the SPEC. A screen that
needs a different width than its category says why in its SPEC. That is a local decision and
it does not change this table.

From `lg` these widths measure the **content region beside the sidebar**, not the viewport.
Centering a container against the full viewport while a sidebar occupies part of it puts the
content off-centre.

## Responsive

Design at the smallest viewport first and widen. Every layer below adds to the layer above it;
nothing is patched back down from desktop.

| Layer | Responsibility |
|---|---|
| Base (< 640px) | The mobile foundation. Single column, bottom navigation, full functionality |
| `sm` (>= 640px) | Local enhancement: a component's own spacing, density, label visibility |
| `md` (>= 768px) | Tablet composition: multi-column lists and stat rows |
| `lg` (>= 1024px) | The application-shell transition: bottom navigation becomes the left sidebar (see §Navigation) |

**CSS first.** If the only thing that changes is spacing, layout, grid, alignment, visibility
or how navigation is presented, express it in Tailwind variants. Reach for a JavaScript media
query only when JavaScript behaviour itself must differ: a different event model, a different
data path. Two mechanisms describing one breakpoint is a bug waiting for a hydration mismatch.

Every screen is checked at 390px and 1280px, in both schemes, before it is called finished.

## Navigation

The app has **five primary destinations**: Home, Learn, Practice, Review, Progress. They are
the learner's whole loop, and they are the only things that earn a slot in primary navigation.

**Settings is not a primary destination.** It is reached from a secondary surface such as a
profile, an avatar or an overflow menu, because a learner opens it a handful of times, not
daily. Anything that arrives later (search, lookup, audio import) is secondary by default; a
new primary destination requires this file to change.

| Destination | Route | Vietnamese label |
|---|---|---|
| Home | `/` | Bảng tin |
| Learn | `/hoc` | Học bài |
| Practice | `/luyen-tap` | Luyện tập |
| Review | `/on-tap` | Ôn tập |
| Progress | `/thong-ke` | Thống kê |

### The two shells

| Viewport | Shell |
|---|---|
| **< `lg`** | **Bottom navigation.** Anchored to the bottom of the viewport, within thumb reach, respecting the bottom safe-area inset. Every item pairs a 24px icon with a visible `caption` label at **every** width below `lg` — a tablet is still a touch device, and a tooltip is a pointer mechanism |
| **>= `lg`** | **Left sidebar.** The five destinations run vertically; the account area sits at the bottom of the sidebar |

There is no top bar at any width, and the bottom navigation does not survive into the desktop
shell. Two shells, one transition point, and it is `lg`.

In both shells the open destination wears `primary` and the rest wear `muted-foreground`.

Sidebar composition — width, collapsed state, logo placement, how the account area is laid
out — is **deliberately unspecified here**. It is a visual question, explored in Stitch when
the Home screen is designed, and recorded in that screen's SPEC once approved.

### The secondary surface

Settings, profile, sync state, theme and sign-out live behind one **account entry**, not in
primary navigation:

- Below `lg`: an avatar or profile control in the page header on Home.
- From `lg`: the account area at the bottom of the sidebar.

No "More" item is added to the bottom navigation. If the secondary menu ever outgrows one
entry, that is a decision to revisit here, not a slot to improvise.

### Clearance

Clearance is a property of the shell, expressed semantically and applied once in the app
shell, never page by page:

| Shell | Clearance |
|---|---|
| Bottom navigation (< `lg`) | Content reserves bottom clearance so the last element is never covered |
| Sidebar (>= `lg`) | **No bottom clearance.** There is nothing at the bottom to clear |

The pixel value for the mobile clearance follows the approved bottom-navigation visual; the
`nav-clearance` entry in the front matter is a provisional mirror, not a settled number.

Review carries a due count whenever it exceeds zero. The count is information, not an alarm:

> Motion explains a state change or gives feedback. Motion must not continuously demand
> attention in the absence of a state transition.

So the badge appears, updates and disappears; it does not pulse, blink or breathe while
sitting still. The same rule retires any ambient animation used as decoration.

## Surfaces and elevation

Depth comes from hairlines first, shadow second, blur last. Four surface classes exist, and a
component belongs to exactly one:

| Surface | Purpose | Radius | Border | Shadow | Blur |
|---|---|---|---|---|---|
| **Default card** | The workhorse container: content blocks, answer options, list rows, stat tiles | `xl` | 1px `border` | none | none |
| **Elevated** | Menus, popovers, dropdowns: attached to a trigger, dismissible | `xl` | 1px `border` | `shadow-md` | none |
| **Overlay** | Dialogs, sheets, the hovered furigana zoom: blocking, above everything | `xl` | 1px `border` | `shadow-lg` | scrim only, from `sm` up |
| **Floating navigation** | The persistent shell surface that hovers over scrolling content | `full` or `xl` | 1px `border` | `shadow-md` | none below `lg`; a near-opaque fill instead |

Rules that follow from the table:

- A default card gets **no shadow**. If two surfaces need separating, a 1px rule does it.
- Blur is not a texture, and on phones it is a cost: a `backdrop-filter` on a fixed bar is
  recomputed on every scrolled frame. The bottom navigation therefore uses a near-opaque fill
  (`bg-card/95`) instead of blur; overlay scrims blur only from `sm` up. Never blur a card in
  the page flow. The desktop sidebar is not floating — content sits beside it, not under it, so
  it is an ordinary surface separated by a 1px rule.
- **Radius comes from the scale**: `sm` for badges and small chips, `md` for inputs and small
  buttons, `lg` for standard buttons and quoted blocks, `xl` for cards and answer options,
  `full` for avatars, circular controls and speed chips. A radius outside the approved surface
  system, including Tailwind steps this scale does not define, is not applied on a whim; if a
  surface needs a step the system lacks, add it here and in the stylesheet first.
- Nothing in this system is square-cornered, and nothing is a pill except what the table lists
  as `full`.

Border **thickness** is the second depth channel: an answer option's border goes from 1px to
**2px** when selected or when a result is revealed, so state survives without relying on fill
color.

## Motion

Motion explains what just happened; it does not decorate.

| Case | Duration | Curve |
|---|---|---|
| Color, hover, focus | 150ms | ease-out |
| Answer result reveal | 200ms | ease-out |
| Card entry/exit, question change | 250ms | ease-in-out |
| Dragging a phrase token | spring | stiffness 400, damping 30 |
| Wrong-answer shake | 300ms, 4px, 3 beats | ease-in-out |
| Route change | 250ms in, 150ms out, 8px slide, no blur | smooth-out |
| Overlay open / close (dialog, menu, sheet) | open 250ms, close 150ms | smooth-out |
| Progress fill | 250ms, `scaleX` only | smooth-out |

`smooth-out` is `--ease-smooth-out` in `globals.css` (from the transitions.dev token scale).
Animate only `transform` and `opacity`; never `transition-all`, width/height, or box-shadow
on the hot path. No `backdrop-filter` on fixed bars: the bottom nav repaints its blur every
scrolled frame on phones. Closes are faster than opens and are never delayed.

Wrap all animation in `@media (prefers-reduced-motion: no-preference)`. With motion reduced
the correct/wrong result must still appear in full, only the movement is dropped. Nothing
loops indefinitely (see §Navigation).

## Interaction states

Every clickable element defines all six states. A missing state is a defect.

| State | Treatment |
|---|---|
| Default | The variant's own fill and border |
| Hover | Fill deepens one step, **only under `(hover: hover)`**, or it sticks after a tap |
| Focus | 3px `ring` at 50% opacity. Never removed |
| Active | Shifts down 1px |
| Disabled | 50% opacity, pointer events off |
| Loading | Spinner replaces the icon, width unchanged so layout cannot jump |

Revealed feedback is exempt from dimming: after grading, the option that carries the answer
keeps full contrast even while the rest are inert, and it stays reachable by keyboard so a
screen reader can read the result.

## Components

### Patterns

`button-primary` is the one filled torii-red action per screen; `button-secondary` carries
supporting actions; `button-ghost` handles icon buttons and row-level actions. `button-quiz`
is the mandatory size for **anything inside the practice flow** (48px tall, `xl` radius,
`body` type) because the library's own sizes top out at 36px.

The library's remaining variants keep their conventional jobs: `outline` for peer actions
inside one group, `destructive` for anything that deletes study data, `link` for inline
navigation. Outside the practice flow, `lg` is the main action and `default` is chrome.

`card` is the workhorse container: `card` fill, 1px `border`, `xl` radius, one interior
padding step, no shadow. Structure runs title (`h3`), content, right-aligned action row.
`popover` is the same material one level up.

`grammar-pattern-block` presents a grammar pattern on a `muted` fill at `lg` radius, so it
reads as quoted material rather than something interactive. `hint-callout` uses `info` for
optional hints and grammar asides.

**Answer option** is the most important component in the app, shared by multiple-choice and
matching exercises: at least 48px tall, `xl` radius, `jp-vocab` type. The index number 1 to 4
shows on desktop to match the keyboard shortcuts and hides on mobile.

| State | Component token | Fill | Border | Non-color cue |
|---|---|---|---|---|
| Idle | `answer-option` | `card` | 1px `border` | Index number at left |
| Hover | `answer-option-hover` | `accent` | 1px `border` | — |
| Selected | `answer-option-selected` | `accent` | **2px** `primary` | — |
| Correct | `answer-option-correct` | `success` at 10% | **2px** `success` | `<Check />` at right |
| Wrong | `answer-option-wrong` | `destructive` at 10% | **2px** `destructive` | `<X />` plus a 3-beat shake |

The `answer-option-correct` and `answer-option-wrong` tokens name the full-strength status
color; render the fill at 10% opacity and reserve the solid value for the border and icon.

`phrase-token` is the sentence-reordering chip: `secondary` fill, `xl` radius, 48px tall,
`jp-vocab` type. A used token drops to 40% opacity and stops responding **but keeps its slot**,
so the layout never reflows mid-answer. The answer tray is a dashed region at least 64px tall
showing "Chạm vào từ bên dưới" when empty.

`jp-input` is the typed-answer field for cloze and listening transcription: 48px tall, `lg`
radius, `jp-example` type, centered. It binds `wanakana` so romaji converts to hiragana as the
learner types, and always carries the caption "Gõ romaji, chữ tự chuyển sang hiragana".

**Stat tile** is one default card carrying a label in `caption`, a figure in `display`, and an
optional icon in a square recessed holder. Icon color comes from the chart slots, never from a
raw palette hue. How many tiles a screen shows, and what they measure, is that screen's
decision, not this file's.

**Sync badge** has three states, each with its own icon and wording so color is never doing
the work alone: synced (`<CloudCheck />`, "Đã đồng bộ"), pending (`<CloudUpload />`, "Chờ
đồng bộ (n)"), offline (`<CloudOff />`, "Ngoại tuyến — đã lưu trên máy"). On mobile only the
icon shows; the label appears on tap or in a tooltip.

**Badges.** `verb-badge-group-1/2/3` mark conjugation class with a `caption` label reading
`Nhóm 1`, `Nhóm 2` or `Nhóm 3`. The label is not optional; the color is a memory aid.
`badge-overdue` marks a review item past its due date: solid `warning` fill, an
`<AlarmClock />` icon and the number of days late. A review target row shows the item, its
target-type label in its fixed chart color, and its due date.

**Audio player** (SPEC-10, not yet built) is three stacked rows: a 48px progress track whose
touch area spans the full width, with A and B markers as solid `primary` ticks and the loop
region filled at 15% `primary`; a transport row with a 56px circular play button flanked by
44px skip controls; a secondary row of speed chips, A/B set buttons, loop toggle and transcript
toggle. The active speed chip inverts to `primary`.

**Chart series** tokens (`chart-series-vocab` through `chart-series-listening`) exist so the
entity-to-slot binding is machine-readable rather than a convention someone has to remember.

### Implementation mapping

Reuse what is here before writing anything new. `stable` means the implementation is the
reference for its pattern; `needs review` means it ships today but is known to diverge from
this contract; `missing` means the pattern exists in this file with no shared implementation.

| Pattern | Implementation | Status | Notes |
|---|---|---|---|
| Furigana rendering | `web/src/components/Furigana.tsx` | stable | Native `<ruby>`/`<rt>`; pair with `japanese.ts`, never a new parser |
| Answer option | `web/src/components/practice/AnswerOption.tsx` | stable | Reference for state handling and token discipline |
| Phrase token | `web/src/components/practice/PhraseToken.tsx` | stable | Reorder exercise chip |
| Japanese input | `web/src/components/practice/JpInput.tsx` | stable | Binds `wanakana` |
| Practice session frame | `web/src/components/practice/PracticeRunner.tsx` | stable | Owns progress, timer, exit and grading flow |
| Question types | `web/src/components/practice/Question{Mc,Cloze,Matching,Reorder,Listening}.tsx` | stable | One per exercise type |
| Session result | `web/src/components/practice/SessionResult.tsx` | stable | End-of-session summary |
| Pronunciation button | `web/src/components/SpeakButton.tsx` | stable | Web Speech through `tts.ts` |
| Sync badge | `web/src/components/SyncBadge.tsx` | stable | Three states, icon plus label |
| Review target type badge | `web/src/components/review/TargetTypeBadge.tsx` | stable | Correct chart-token usage (`bg-chart-n`) |
| Button, card, dialog, sheet, tabs, tooltip, input, badge, progress and siblings | `web/src/components/ui/*` | stable | shadcn `base-nova` on Base UI; `size="quiz"` is the 48px practice size |
| Progress indicator | `web/src/components/ui/progress.tsx` plus `web/src/components/LessonProgress.tsx` | needs review | A third, hand-rolled bar exists inline on the dashboard and lesson list |
| Application shell navigation | `web/src/components/AppNav.tsx` | needs review | Ships six destinations including Settings, and recomposes at 640px through a JS media query |
| Lesson list and cards | `web/src/components/LessonGrid.tsx` | needs review | Raw palette colors and surface overrides |
| Daily kanji card | `web/src/components/DailyKanji.tsx` | existing | Not yet audited against this contract |
| Stat tile | — | missing | Implemented inline on three screens; no shared component |
| Audio player / Shadowing | — | missing | SPEC-10, not implemented |

Introducing a new shared component, or a variant of an existing one, means adding it to this
table in the same change.

## Global contract vs screen contract

This file owns patterns. A SPEC owns its screen.

| Belongs here | Belongs in `docs/specs/SPEC-xx.md` |
|---|---|
| What a stat tile is | How many tiles Home shows, and what they measure |
| Container semantics and the reading width | Which container this screen uses, and why |
| Answer-option states | Which exercise types a session mixes |
| Navigation destinations and shell behaviour | The copy and order of items inside a screen |
| Token meaning, surface classes, motion | Block order, empty/error/loading content, acceptance criteria |

If a SPEC and this file disagree, that is a defect in one of them, not a local override.
Resolve it explicitly: either the SPEC changes, or this file changes on purpose and says so.

## Stitch and AI visual tools

Load this file, front matter included, as the design contract. The screen brief lives in that
screen's SPEC §10; there is no separate prompt library.

Three constraints accompany every request:

1. Colors by token name only (`bg-primary`, `text-muted-foreground`). No hex, no raw palette.
2. Mobile-first: compose at 390px, then widen.
3. Every run of Japanese sits in an element carrying the `jp` class.

A visual tool may explore composition, hierarchy, density, spacing, layout alternatives and
presentation. It may **not** redefine product scope, primary navigation, the semantic token
system, the global responsive strategy, approved component behaviour, or a screen requirement
that has already been approved. Output is exploration, not a decision: nothing is authoritative
until a human approves it and an agent writes it back into the SPEC, and into this file if a
global rule changed.

## Workflow

```
PRODUCT.md
  -> SPEC UX (§1 to §9)            -> human approval
  -> SPEC §10 Stitch brief         -> visual exploration
  -> human visual approval
  -> sync back into the SPEC, and into DESIGN.md if a global rule changed
  -> coding agent implements       -> review  -> docs/handoff/SPEC-xx.md
```

`docs/design-system.md` walks through the same loop in Vietnamese.

## Do's and Don'ts

**Do** reference colors by token name. Tailwind v4 exposes every token in the stylesheet as a
`--color-*`, `--text-*` or `--radius-*` custom property, so there is never a reason to write a
hex value in a component.

**Do** wrap every run of Japanese in the `jp` class and pick the matching `jp-*` step.

**Do** give each screen exactly one `primary`-filled action.

**Do** pair every status color with a Lucide icon and a text label.

**Do** reuse a component from the mapping table before writing a new one.

**Do** design at 390px first, then widen to 1280px, and check both schemes before calling a
screen finished.

**Don't** use a shadow where a 1px `border` will separate two surfaces, and don't use blur
on phones or outside an overlay scrim.

**Don't** use `success`, `destructive`, `warning` or `info` as a chart series or as
decoration. They are reserved for state.

**Don't** put a button smaller than 48px into the practice flow, including the library's own
`default` and `lg` sizes.

**Don't** remove a focus ring, and don't apply hover styling outside a `(hover: hover)` query.

**Don't** let the practice screen scroll while a question is open. Shrink the question area
instead.

**Don't** build furigana with absolutely positioned overlays. Use `<ruby>` and `<rt>`.

**Don't** recolor chart series when a filter changes the result count. Color follows the
entity, never its rank.

**Don't** animate anything indefinitely to attract attention.

**Don't** introduce a color, radius or spacing value this system does not have. If something
genuinely needs a new token, add it to `globals.css` and to this file first.
