// Atlas PNG (4x3, black ink on white) -> traced, optimized SVG paths -> web/src/components/FeatureIcon.tsx
// Usage (from artwork/icons): npm install && node build.js atlas-v1.png
const fs = require('fs');
const path = require('path');
const potrace = require('potrace');
const { optimize } = require('svgo');
const sharp = require('sharp');

const NAMES = ['vocab', 'grammar', 'listening', 'reading', 'kanji', 'kana', 'verbs', 'lesson', 'review', 'practice', 'lookup', 'weak-points'];
const COLS = 4, ROWS = 3;
const BOX = 240, INNER = 210; // like Lucide: icon fills ~88% of the viewBox
const OUT_DIR = path.join(__dirname, 'out');
const TSX = path.join(__dirname, '..', '..', 'web', 'src', 'components', 'FeatureIcon.tsx');

const trace = (buf) =>
  new Promise((res, rej) =>
    potrace.trace(buf, { threshold: 128, turdSize: 8, optTolerance: 0.4, color: 'currentColor', background: 'transparent' }, (e, svg) => (e ? rej(e) : res(svg))),
  );

(async () => {
  const atlas = process.argv[2];
  const { data, info } = await sharp(atlas).greyscale().raw().toBuffer({ resolveWithObject: true });
  const cw = Math.floor(info.width / COLS), ch = Math.floor(info.height / ROWS);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const paths = {};
  // Pass 1: ink bbox per cell (ignoring a 2% border so neighbours' strays don't count).
  const boxes = NAMES.map((name, i) => {
    const cx = (i % COLS) * cw, cy = Math.floor(i / COLS) * ch;
    const m = Math.round(Math.min(cw, ch) * 0.02);
    let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
    for (let y = cy + m; y < cy + ch - m; y++)
      for (let x = cx + m; x < cx + cw - m; x++)
        if (data[y * info.width + x] < 128) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    if (x1 < 0) throw new Error(`${name}: empty cell`);
    return { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  });
  // One scale for the whole set keeps stroke weight identical across icons.
  const scale = INNER / Math.max(...boxes.map((b) => Math.max(b.w, b.h)));
  for (let i = 0; i < NAMES.length; i++) {
    const { x0, y0, w, h } = boxes[i];
    const sw = Math.round(w * scale), sh = Math.round(h * scale);
    const left = Math.floor((BOX - sw) / 2), top = Math.floor((BOX - sh) / 2);
    const png = await sharp(atlas)
      .extract({ left: x0, top: y0, width: w, height: h })
      .greyscale()
      .resize(sw, sh, { kernel: 'lanczos3' })
      .extend({ top, bottom: BOX - sh - top, left, right: BOX - sw - left, background: '#fff' })
      .flatten({ background: '#fff' })
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(OUT_DIR, `${NAMES[i]}.png`), png);
    const raw = await trace(png);
    const svg = optimize(raw, {
      multipass: true,
      floatPrecision: 1,
      plugins: ['preset-default', 'removeDimensions', { name: 'removeAttrs', params: { attrs: ['fill', 'stroke'] } }],
    }).data;
    fs.writeFileSync(path.join(OUT_DIR, `${NAMES[i]}.svg`), svg.replace('<svg', '<svg fill="currentColor"'));
    paths[NAMES[i]] = [...svg.matchAll(/ d="([^"]+)"/g)].map((mm) => mm[1]).join('');
    console.log(NAMES[i], `${sw}x${sh}`, `${paths[NAMES[i]].length} chars`);
  }

  const entries = NAMES.map((n) => `  '${n}': '${paths[n]}',`).join('\n');
  fs.writeFileSync(
    TSX,
    `import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * Bộ icon thành phần MaiPace (nét mực vẽ tay). Màu theo \`currentColor\`, cỡ theo class:
 * \`<FeatureIcon name="kanji" className="size-6 text-primary" />\`.
 * Sinh tự động từ design-lab/icons (atlas Codex image_gen → potrace → svgo); sửa ở đó rồi build lại, không sửa tay path.
 */
const PATHS = {
${entries}
} as const;

export type FeatureIconName = keyof typeof PATHS;
export const FEATURE_ICON_NAMES = Object.keys(PATHS) as FeatureIconName[];

export function FeatureIcon({
  name,
  className,
  title,
  ...props
}: { name: FeatureIconName; title?: string } & Omit<SVGProps<SVGSVGElement>, 'children'>) {
  return (
    <svg
      viewBox="0 0 ${BOX} ${BOX}"
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      className={cn('size-6 shrink-0', className)}
      {...props}
    >
      {title && <title>{title}</title>}
      <path fillRule="evenodd" d={PATHS[name]} />
    </svg>
  );
}
`,
  );
  console.log('wrote', TSX);
})();
