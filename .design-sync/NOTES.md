# design-sync notes — Japanese (web/)

Repo-specific gotchas for future syncs. Read this before re-running the driver.

## Shape

- Not a published DS library: `web/` is a private Next.js app. Shape is `package`,
  with **no `dist/` JS entry** — the bundle is synthesized from `src/components/`
  (`[NO_DIST] synthesizing from 16 src files` is expected, not a failure).
- 16 source files export **74 components** (shadcn flat subparts: `Card` +
  `CardHeader` + `CardTitle` + …). All 74 are kept deliberately so the design
  agent gets a real `.d.ts` contract for every importable part.
  Confirmed with the user 2026-09-16.
- `groupBy` has no config lever here: `ui` and `components` are both in the
  converter's `GENERIC_DIR`, so every component lands in group `general`.
  Changing that needs per-component docs with `category` frontmatter — declined
  as an enumeration that rots.

## Build prerequisites

**`node .design-sync/prepare.mjs`** (from the repo root, after staging
`.ds-sync/` and installing its deps) does all of it and is idempotent. It:

1. Writes `web/.ds-tailwind-src.css` and compiles it to `web/.ds-tailwind.css`
   (= `cfg.cssEntry`) with the repo's own `@tailwindcss/postcss`, resolved out
   of the pnpm store so nothing is added to `web/package.json`. Tailwind v4
   ships no compiled CSS, so without this every preview renders unstyled.
   It also strips `@font-face` — the inlined `@fontsource` urls resolve to
   broken relative paths; fonts ship via `cfg.extraFonts` instead.
   **Tailwind only emits classes it has scanned**, so the entry carries
   `@source inline(...)` safelists for every semantic token family
   (`bg-info`, `text-chart-3`, `text-verb-2`, …). Without them the conventions
   header would name classes the stylesheet does not contain.
   **Re-run prepare after editing previews** — they introduce new classes.
2. Writes `web/.ds-tsconfig.json`, emits `web/dist/**/*.d.ts`, and writes the
   `web/dist/index.d.ts` + `web/index.d.ts` barrels.
3. Creates the `web/node_modules/web` junction (the converter resolves
   `PKG_DIR` as `<node-modules>/<pkg>`, which npm/pnpm never self-install).
4. Re-applies the staged-script patches described in the next section.

Step 2 exists to keep the ts-morph types root **small**. Without a `dist/`
holding `.d.ts`, `findTypesRoot` falls back to `web/` itself and ts-morph globs
the whole pnpm store → **OOM at 4 GB** (`Ineffective mark-compacts near heap
limit`). If that crash reappears, check that `web/dist/index.d.ts` exists —
`findTypesRoot`'s `dist` branch requires a `.d.ts` directly in `dist/`, not
only in subdirectories.

## Staged-script patches (re-apply after `cp -r` on re-sync)

The re-sync ritual re-copies `.ds-sync/` from the skill, wiping both — this is
why `prepare.mjs` re-applies them on every run:

- `.ds-sync/storybook/http-serve.mjs` — MIME map needs `; charset=utf-8`
  (on `.html`, `.js`, `.mjs`, `.css`, `.json`, and the `/` handler).
- `.ds-sync/package-validate.mjs` — the `[BUNDLE_EXPORT]` smoke check's
  `page.setContent(...)` needs `<meta charset="utf-8">`.

**Why:** the bundle contains a raw kanji character class from
`src/lib/japanese.ts` (`/([一-鿿㐀-䶿々〆〇ヶ]+)\[([^\]]+)\]/g` — esbuild never
escapes regex literals). Served without a charset, chromium decodes it as
windows-1252, the regex becomes `Range out of order in character class`, and
the whole bundle throws at load → `window.JapaneseDS` undefined →
`[BUNDLE_EXPORT] 74/74 not a component`.

**This is a local-harness bug only.** The uploaded preview cards carry
`<meta charset="utf-8">` themselves; verified by loading a real
`Button.html` through the local server — 78 exports, zero page errors.
Do not "fix" `src/lib/japanese.ts` for this.

## Known render warns (expected — a warn NOT in this list is new)

- `[TOKENS_MISSING] --available-height, --anchor-width, --transform-origin, --tw`
  — the first three are Base UI positioning vars set at runtime via inline
  style; `--tw` is a Tailwind v4 internal. Nothing to define.
- `[FONT_MISSING] "Cascadia Code"` — a fallback entry inside
  `--font-mono: ui-monospace, 'SFMono-Regular', 'Cascadia Code', monospace`.
  Not a brand font; `ui-monospace` resolves first. Accepted as a substitute.
- `[RENDER_THIN] Dialog` (height 1px) — Base UI portals the popup to `<body>`,
  so the card root measures 1px while the screenshot is perfect. Verified from
  `_screenshots/general__Dialog.png`. Benign; `cfg.overrides.Dialog` already
  pins `cardMode: single`.
- `[GRID_OVERFLOW] Progress` (`escape`, all cells) — each `Progress.Root`
  emits a **1x1px `position: fixed` `<span>`** (Base UI's accessibility
  live-region). The detector classifies any showing fixed descendant as
  `escape`; nothing actually leaves the cell. Verified by enumerating every
  `position: fixed` node in each cell. Do NOT apply the suggested
  `{cardMode: single, primaryStory: ...}` — it would drop 2 of 3 good cells
  for a false positive.
- Leaf Base UI parts (`AlertDialogContent`, `DialogTitle`, `TabsTrigger`, …)
  log `Base UI: <X>RootContext is missing` on their floor cards. Correct —
  they only render inside their parent. Compose them inside the parent's
  authored preview rather than giving them standalone previews.

## Re-sync risks

- `cfg.cssEntry` points at a **generated** file (`web/.ds-tailwind.css`), and
  `web/dist/` + `web/index.d.ts` are generated too. All are gitignored, so a
  fresh clone has none of them — steps 1–4 above are mandatory, not optional.
- Tailwind only emits utilities it scanned. If a preview's classes go missing
  after an edit, the CSS compile step was skipped.
- The font payload is large: 131 `@font-face`, ~5.6 MB (124 Noto Sans JP subset
  woff2 + 7 Inter). Chunk uploads of `fonts/` well under the 256-file cap.
- Playwright: chromium build 1234 is already in the user's
  `%LOCALAPPDATA%/ms-playwright` cache; it is pinned by **playwright 1.62.1**.
  Installing any other version re-downloads ~200 MB.
- Everything the build needs that is NOT committed is regenerated by
  `prepare.mjs`. Never hand-recreate those files; fix `prepare.mjs` instead,
  since it is the only copy that survives a clone.
- `.design-sync/previews/` currently covers only the 8 user-scoped components.
  The other 66 ship the floor card and can be authored on any later re-sync.
