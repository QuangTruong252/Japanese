// Re-establishes everything design-sync needs that does NOT survive a fresh
// clone or a re-sync's `cp -r` of the staged scripts. Idempotent.
//
//   node .design-sync/prepare.mjs
//
// Run it from the repo root AFTER staging .ds-sync/ and installing its deps,
// and BEFORE package-build.mjs. See .design-sync/NOTES.md for why each piece
// exists.
import { readFileSync, writeFileSync, existsSync, symlinkSync, mkdirSync, readdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = path.resolve(import.meta.dirname, '..')
const WEB = path.join(ROOT, 'web')
const posix = (p) => p.split(path.sep).join('/')

const step = (m) => console.log(`• ${m}`)

// -- 1. Tailwind entry ------------------------------------------------------
// globals.css is Tailwind v4 *source*; the DS needs compiled CSS. The @source
// lines matter: Tailwind only emits classes it has scanned, and the design
// agent composes layout glue from token families no source file happens to use.
step('writing web/.ds-tailwind-src.css')
writeFileSync(path.join(WEB, '.ds-tailwind-src.css'), `@import "./src/app/globals.css";
@source "./src/components/**/*.tsx";
@source "../.design-sync/previews/**/*.tsx";

/* The design agent composes its own layout glue with these families, so they
   must ship even though no scanned source file uses them yet. Tailwind only
   emits classes it has seen. */
@source inline("{bg,text,border,ring,fill,stroke}-{background,foreground,card,card-foreground,popover,popover-foreground,primary,primary-foreground,secondary,secondary-foreground,muted,muted-foreground,accent,accent-foreground,destructive,border,input,ring,success,success-foreground,warning,warning-foreground,info,info-foreground,verb-1,verb-2,verb-3,chart-1,chart-2,chart-3,chart-4,chart-5}");
@source inline("font-{sans,jp,mono,heading}");
@source inline("rounded-{sm,md,lg,xl}");
`)

// -- 2. tsconfig for declaration emit --------------------------------------
// Without a .d.ts tree under web/dist, findTypesRoot falls back to web/ and
// ts-morph globs the whole pnpm store -> 4 GB OOM.
step('writing web/.ds-tsconfig.json')
writeFileSync(path.join(WEB, '.ds-tsconfig.json'), JSON.stringify({
  extends: './tsconfig.json',
  compilerOptions: {
    noEmit: false, declaration: true, emitDeclarationOnly: true,
    outDir: 'dist', rootDir: 'src', incremental: false,
    allowImportingTsExtensions: false, plugins: [],
  },
  include: ['src/components/**/*.tsx', 'src/lib/utils.ts', 'src/lib/japanese.ts'],
}, null, 2) + '\n')

// -- 3. package self-link ---------------------------------------------------
// The converter resolves PKG_DIR as <node-modules>/<pkg>; npm/pnpm never
// self-install a package into its own node_modules.
const selfLink = path.join(WEB, 'node_modules', 'web')
if (existsSync(selfLink)) step('package self-link already present')
else { symlinkSync(WEB, selfLink, 'junction'); step('created web/node_modules/web junction') }

// -- 4. compile Tailwind ----------------------------------------------------
step('compiling web/.ds-tailwind.css')
const twDir = path.join(WEB, 'node_modules/.pnpm')
const twPkg = readdirSync(twDir).find((d) => d.startsWith('@tailwindcss+postcss@'))
if (!twPkg) throw new Error('@tailwindcss/postcss not found — run pnpm install in web/')
const twRoot = path.join(twDir, twPkg, 'node_modules/@tailwindcss/postcss')
const { createRequire } = await import('node:module')
const req = createRequire(path.join(twRoot, 'index.js'))
const postcss = req('postcss')
const tw = req(path.join(twRoot, 'dist/index.js'))
// The inlined @fontsource urls resolve to broken relative paths; fonts ship
// via cfg.extraFonts instead, which copies the woff2 into fonts/.
const stripFontFace = { postcssPlugin: 'strip-font-face', AtRule: { 'font-face': (r) => r.remove() } }
const from = path.join(WEB, '.ds-tailwind-src.css')
const to = path.join(WEB, '.ds-tailwind.css')
const css = await postcss([tw(), stripFontFace]).process(readFileSync(from, 'utf8'), { from, to })
writeFileSync(to, css.css)
step(`  ${css.css.length} bytes`)

// -- 5. emit declarations + barrels ----------------------------------------
step('emitting web/dist/**/*.d.ts')
execSync('pnpm exec tsc -p .ds-tsconfig.json', { cwd: WEB, stdio: 'inherit' })

const dts = []
;(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name.endsWith('.d.ts')) dts.push(p)
  }
})(path.join(WEB, 'dist/components'))
// index.d.ts must sit directly in dist/ — findTypesRoot's `dist` branch only
// accepts the directory when a .d.ts is at its top level.
writeFileSync(path.join(WEB, 'dist/index.d.ts'),
  dts.map((f) => `export * from "./${posix(path.relative(path.join(WEB, 'dist'), f)).replace(/\.d\.ts$/, '')}";`).join('\n') + '\n')
writeFileSync(path.join(WEB, 'index.d.ts'), 'export * from "./dist/index";\n')
step(`  ${dts.length} declaration files, barrels written`)

// -- 6. re-apply staged-script patches -------------------------------------
// The bundle carries a raw kanji character class from src/lib/japanese.ts
// (esbuild never escapes regex literals). Served without a charset, chromium
// decodes it as windows-1252 and the whole bundle throws at load. The real
// preview cards declare <meta charset="utf-8"> themselves — this only affects
// the local harness, which serves and injects without one.
const patches = [
  ['.ds-sync/storybook/http-serve.mjs',
    "const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };",
    "const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png' };"],
  ['.ds-sync/storybook/http-serve.mjs',
    "res.setHeader('Content-Type', 'text/html'); return res.end('<!doctype html>');",
    "res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end('<!doctype html>');"],
  ['.ds-sync/package-validate.mjs',
    `'<!doctype html><script src="/_vendor/react.js"></script>' +`,
    `'<!doctype html><meta charset="utf-8"><script src="/_vendor/react.js"></script>' +`],
]
for (const [rel, from, to] of patches) {
  const p = path.join(ROOT, rel)
  if (!existsSync(p)) { console.warn(`  ! ${rel} missing — stage .ds-sync/ first`); continue }
  const s = readFileSync(p, 'utf8')
  if (s.includes(to)) { step(`${rel} already patched`); continue }
  if (!s.includes(from)) { console.warn(`  ! ${rel}: patch anchor not found — upstream changed, re-check NOTES.md`); continue }
  writeFileSync(p, s.replace(from, to))
  step(`patched ${rel}`)
}

console.log('\nready — now run package-build.mjs')
