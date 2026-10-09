// Atlas PNG (black ink on white) -> traced, optimized SVG paths -> web/src/components/FeatureIcon.tsx
// Usage (from artwork/icons): npm install && node build.js
const fs = require('fs');
const path = require('path');
const potrace = require('potrace');
const { optimize } = require('svgo');
const sharp = require('sharp');

// Mỗi atlas: tên icon theo thứ tự đọc. `keyline` (bộ điều hướng): canh cỡ như Lucide để hình vuông
// và hình tròn trông bằng nhau — vuông/chữ nhật cạnh dài 200/240, tròn 222/240.
const ATLASES = [
  { file: 'atlas-v2.png', names: ['vocab', 'grammar', 'listening', 'reading', 'kanji', 'kana', 'verbs', 'lesson', 'review', 'practice', 'lookup', 'weak-points', 'home'] },
  {
    file: 'atlas-nav-v1.png',
    names: ['nav-home', 'nav-lesson', 'nav-practice', 'nav-review', 'nav-lookup'],
    // Số = cỡ khung riêng (/240). nav-review là hai mũi tên phủ kín vòng tròn nên 222 trông to hơn hẳn
    // các icon có khoảng trống góc; thu nhỏ cho cân thị giác.
    keyline: { 'nav-review': 190, 'nav-lookup': 'circle' },
  },
];
const BOX = 240, INNER = 222; // ~92% of the viewBox, same optical size as Lucide (20/24 + round caps)
const KEYLINE = { square: 200, circle: 222 };
// Nét gốc mảnh và không đều giữa các icon. Làm dày từng icon (blur + ngưỡng cao) tới khi nét đo được
// >= TARGET_STROKE/240. Lucide (2px ở 24px) đo ra 20; để 21 bù cảm giác mảnh của nét vẽ tay.
const TARGET_STROKE = Number(process.env.TARGET_STROKE ?? 21), BOLD_THRESHOLD = 250; // ngưỡng nhị phân hóa

// Độ dày nét ≈ 2 × số lần bào mòn tới khi còn < 10% mực (đã hiệu chỉnh: Lucide clock = 20).
async function strokeOf(png) {
  const { data, info } = await sharp(png).greyscale().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  let a = Uint8Array.from(data, (v) => (v < 128 ? 1 : 0));
  const total = a.reduce((s, v) => s + v, 0);
  let k = 0, left = total;
  while (left > total * 0.1) {
    const b = new Uint8Array(a.length);
    left = 0;
    for (let i = W; i < a.length - W; i++) if (a[i] && a[i - 1] && a[i + 1] && a[i - W] && a[i + W]) { b[i] = 1; left++; }
    a = b;
    k++;
  }
  return 2 * k;
}

// Giãn nét thật (morphological dilation), xen kẽ lân cận 4 và 8 cho mép gần tròn; dừng khi đạt độ dày đích.
async function bolden(png) {
  const { data, info } = await sharp(png).greyscale().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  let a = Uint8Array.from(data, (v) => (v < 128 ? 1 : 0));
  const toPng = (m) => sharp(Buffer.from(m.map((v) => (v ? 0 : 255))), { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
  let out = await toPng(a), steps = 0;
  while ((await strokeOf(out)) < TARGET_STROKE && steps < 12) {
    const b = Uint8Array.from(a), diag = steps % 2 === 1;
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        if (a[i]) continue;
        if (a[i - 1] || a[i + 1] || a[i - W] || a[i + W] || (diag && (a[i - W - 1] || a[i - W + 1] || a[i + W - 1] || a[i + W + 1]))) b[i] = 1;
      }
    a = b;
    steps++;
    out = await toPng(a);
  }
  return { out, sigma: steps };
}
const OUT_DIR = path.join(__dirname, 'out');
const TSX = path.join(__dirname, '..', '..', 'web', 'src', 'components', 'FeatureIcon.tsx');

const trace = (buf) =>
  new Promise((res, rej) =>
    potrace.trace(buf, { threshold: 128, turdSize: 8, optTolerance: 0.4, color: 'currentColor', background: 'transparent' }, (e, svg) => (e ? rej(e) : res(svg))),
  );

async function processAtlas({ file: atlas, names: NAMES, keyline }, paths) {
  const { data, info } = await sharp(atlas).greyscale().raw().toBuffer({ resolveWithObject: true });
  const boldInfo = {};
  // Pass 1: tìm icon theo dải trắng (atlas không chắc chia lưới đều): tách hàng bằng các hàng pixel trống,
  // rồi tách cột trong từng hàng; khe < GAP px coi là khe trong cùng một icon.
  const GAP = Math.round(Math.min(info.width, info.height) * 0.03);
  const ink = (x, y) => data[y * info.width + x] < 128;
  const bands = (n, has) => {
    const out = [];
    let start = -1, lastInk = -Infinity;
    for (let i = 0; i < n; i++) {
      if (!has(i)) continue;
      if (start < 0 || i - lastInk > GAP) { if (start >= 0) out.push([start, lastInk]); start = i; }
      lastInk = i;
    }
    if (start >= 0) out.push([start, lastInk]);
    return out;
  };
  const boxes = [];
  for (const [ry0, ry1] of bands(info.height, (y) => { for (let x = 0; x < info.width; x++) if (ink(x, y)) return true; return false; }))
    for (const [x0, x1] of bands(info.width, (x) => { for (let y = ry0; y <= ry1; y++) if (ink(x, y)) return true; return false; })) {
      let y0 = Infinity, y1 = -1;
      for (let y = ry0; y <= ry1; y++) for (let x = x0; x <= x1; x++) if (ink(x, y)) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      boxes.push({ x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
    }
  if (boxes.length !== NAMES.length) throw new Error(`found ${boxes.length} icons, expected ${NAMES.length}: ${JSON.stringify(boxes)}`);
  // Mỗi icon phóng cho cạnh lớn nhất = INNER (như Lucide). Độ lệch nét gốc do tỉ lệ khác nhau
  // được san bớt vì bước làm dày cộng thêm một lượng cố định sau khi phóng.
  for (let i = 0; i < NAMES.length; i++) {
    const { x0, y0, w, h } = boxes[i];
    const fit = keyline ? (() => { const k = keyline[NAMES[i]] ?? 'square'; return KEYLINE[k] ?? k; })() : INNER;
    const scale = fit / Math.max(w, h);
    const sw = Math.round(w * scale), sh = Math.round(h * scale);
    const left = Math.floor((BOX - sw) / 2), top = Math.floor((BOX - sh) / 2);
    const png = await sharp(atlas)
      .extract({ left: x0, top: y0, width: w, height: h })
      .greyscale()
      .resize(sw, sh, { kernel: 'lanczos3' })
      .extend({ top, bottom: BOX - sh - top, left, right: BOX - sw - left, background: '#fff' })
      .flatten({ background: '#fff' })
      .png()
      .toBuffer()
      .then(bolden)
      .then(({ out, sigma }) => ((boldInfo[NAMES[i]] = sigma), out));
    fs.writeFileSync(path.join(OUT_DIR, `${NAMES[i]}.png`), png);
    const raw = await trace(png);
    const svg = optimize(raw, {
      multipass: true,
      floatPrecision: 1,
      plugins: ['preset-default', 'removeDimensions', { name: 'removeAttrs', params: { attrs: ['fill', 'stroke'] } }],
    }).data;
    fs.writeFileSync(path.join(OUT_DIR, `${NAMES[i]}.svg`), svg.replace('<svg', '<svg fill="currentColor"'));
    paths[NAMES[i]] = [...svg.matchAll(/ d="([^"]+)"/g)].map((mm) => mm[1]).join('');
    console.log(NAMES[i], `${sw}x${sh}`, `dilate ${boldInfo[NAMES[i]]}px`, `stroke ${await strokeOf(png)}`, `${paths[NAMES[i]].length} chars`);
  }
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const paths = {};
  for (const atlas of ATLASES) await processAtlas(atlas, paths);
  const entries = Object.entries(paths).map(([n, d]) => `  '${n}': '${d}',`).join('\n');
  fs.writeFileSync(
    TSX,
    `import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * Bộ icon thành phần MaiPace (nét mực vẽ tay). Màu theo \`currentColor\`, cỡ theo class:
 * \`<FeatureIcon name="kanji" className="size-6 text-primary" />\`.
 * Tên \`nav-*\` là bộ riêng cho thanh điều hướng (cùng khung, cùng độ phức tạp); không dùng lẫn với icon thẻ.
 * Sinh tự động từ artwork/icons (atlas Codex image_gen → potrace → svgo); sửa ở đó rồi build lại, không sửa tay path.
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
