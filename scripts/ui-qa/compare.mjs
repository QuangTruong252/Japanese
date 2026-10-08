// Ghép ảnh cạnh nhau (cùng chiều rộng hiển thị) để so mockup với ảnh chụp app.
// node scripts/ui-qa/compare.mjs <ảnh-1> <ảnh-2> [...] [--out .ui-qa/compare.png] [--width 390]
import { createRequire } from 'node:module';
import path from 'node:path';
import { parseArgs } from 'node:util';

const root = path.resolve(import.meta.dirname, '../..');
// sharp đi kèm Next; lấy từ dependency của web để không thêm package.
const sharp = createRequire(createRequire(path.join(root, 'web/package.json')).resolve('next/package.json'))('sharp');

const { values: o, positionals: inputs } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: 'string', default: '.ui-qa/compare.png' },
    width: { type: 'string', default: '390' },
  },
});
if (inputs.length < 2) throw new Error('Cần ít nhất hai ảnh để so.');

const width = Number(o.width), gap = 16;
const tiles = await Promise.all(
  inputs.map((f) => sharp(path.resolve(root, f)).resize({ width }).png().toBuffer({ resolveWithObject: true })),
);
const height = Math.max(...tiles.map((t) => t.info.height));
const out = path.resolve(root, o.out);
await sharp({ create: { width: tiles.length * (width + gap) - gap, height, channels: 3, background: '#808080' } })
  .composite(tiles.map((t, i) => ({ input: t.data, left: i * (width + gap), top: 0 })))
  .png()
  .toFile(out);
console.log(path.relative(root, out));
