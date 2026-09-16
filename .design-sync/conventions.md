# Building with this design system

A Japanese (N5/N4) self-study app. shadcn `base-nova` components on Base UI,
styled with Tailwind v4 utilities bound to the "Washi" token set.

## Setup

**No provider wrapper is required.** Tokens are plain CSS custom properties on
`:root`, so any component renders correctly as soon as `styles.css` is loaded.
Two exceptions:

- `Tooltip` must be wrapped in `TooltipProvider`.
- Dark mode is opt-in via a `dark` class on an ancestor (usually `<html>`).
  Every token has a separate dark-mode value — never invert colours by hand.

## Styling idiom: utility classes, never hardcoded colour

Style with the utility families below. **Do not write hex values, `rgb()`, or
`oklch()` literals** — every colour in this system is a token, and hardcoded
colour breaks dark mode silently.

| Family | Values |
|---|---|
| Surfaces | `background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `muted`, `muted-foreground` |
| Actions | `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `accent`, `accent-foreground`, `destructive` |
| Lines | `border`, `input`, `ring` |
| Feedback | `success`, `success-foreground`, `warning`, `warning-foreground`, `info`, `info-foreground` |
| Verb groups | `verb-1`, `verb-2`, `verb-3` (Japanese verb conjugation classes I/II/III) |
| Charts | `chart-1` … `chart-5` |

Each combines with `bg-`, `text-`, `border-`, `ring-`, `fill-`, `stroke-` —
e.g. `bg-card`, `text-muted-foreground`, `border-border`, `text-verb-2`.
Fonts: `font-sans` (Inter), `font-jp` (Noto Sans JP), `font-mono`,
`font-heading`. Radii: `rounded-sm`/`md`/`lg`/`xl`, derived from `--radius`.

**Feedback colour never carries meaning alone.** Any success/warning/info/error
state pairs the colour with an icon *and* a text label — colour-blind users and
screenshots both depend on it. `chart-3`, `chart-4` and `chart-5` fall below 3:1
on light backgrounds, so charts using them require direct labels or a data table.

## Japanese text

- Wrap Japanese content in `font-jp` (or the `jp` class, which also sets the
  looser line-height Japanese needs). Latin UI chrome stays `font-sans`.
- Furigana uses the `Furigana` component and its `漢字[かな]` notation:
  `<Furigana text="私[わたし]は 学生[がくせい]です。" />`. Never hand-roll
  `<ruby>`/`<rt>` markup and never write your own reading parser — reader
  settings (hide furigana, enlarge furigana) are wired to the real component.

## Exercise flows

Every button inside an exercise/quiz flow uses `size="quiz"` — a 48px touch
target. The other sizes top out at 36px and fail the mobile touch requirement.

## Where the truth is

Read `styles.css` and the `_ds_bundle.css` it imports for the full token and
utility vocabulary, and each component's `<Name>.prompt.md` / `<Name>.d.ts`
for its real API. Prefer reading those over guessing a prop name.

## Idiomatic example

```jsx
<Card className="w-full max-w-md">
  <CardHeader>
    <CardTitle>第 5 課 — 電車で行きます</CardTitle>
    <CardDescription>Minna no Nihongo I · trang 40–47</CardDescription>
    <CardAction><Badge variant="secondary">N5</Badge></CardAction>
  </CardHeader>
  <CardContent className="flex flex-col gap-3">
    <p className="font-jp text-lg">
      <Furigana text="毎朝[まいあさ] 六時[ろくじ]に 起[お]きます。" />
    </p>
    <Progress value={62}>
      <ProgressLabel>Tiến độ</ProgressLabel>
      <ProgressValue />
    </Progress>
  </CardContent>
  <CardFooter className="gap-2">
    <Button size="quiz">Học tiếp</Button>
    <Button size="quiz" variant="outline">Để sau</Button>
  </CardFooter>
</Card>
```
