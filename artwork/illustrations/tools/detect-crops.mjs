// From repo root: node artwork/illustrations/tools/detect-crops.mjs <atlas.png> <columns> <rows>
// Finds one crop per grid cell (used by batch.mjs). Read-only: prints JSON, never edits pixels.
// Subjects are connected regions of alpha >= 8, assigned to the cell holding their centroid, so a
// tall subject may cross the nominal grid line. A crop is usable only when its whole border is
// alpha 0 and it holds no other cell's subject. Faint alpha 1-7 bridging two cells => ok: false;
// regenerate that subject alone instead of erasing pixels.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const root = new URL('../../../', import.meta.url);
const sharp = createRequire(createRequire(new URL('web/package.json', root)).resolve('next/package.json'))('sharp');
// INNER mirrors batch.mjs: the exported subject's longest side inside the 512 frame.
const MARGIN = 16, REACH = 64, SUBJECT = 8, SPECK = 30, INNER = 416;

export async function detectCrops(file, cols, rows) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const a = (x, y) => data[(y * W + x) * 4 + 3];

  // Label 4-connected subject regions; owner[label] = cell index, or -1 for specks.
  const label = new Int32Array(W * H).fill(-1);
  const owner = [];
  const stack = [];
  for (let start = 0; start < W * H; start++) {
    if (label[start] !== -1 || data[start * 4 + 3] < SUBJECT) continue;
    const id = owner.length;
    let n = 0, sx = 0, sy = 0;
    label[start] = id; stack.push(start);
    while (stack.length) {
      const p = stack.pop(), x = p % W, y = (p - x) / W;
      n++; sx += x; sy += y;
      for (const q of [x > 0 && p - 1, x < W - 1 && p + 1, y > 0 && p - W, y < H - 1 && p + W]) {
        if (q !== false && label[q] === -1 && data[q * 4 + 3] >= SUBJECT) { label[q] = id; stack.push(q); }
      }
    }
    owner.push(n < SPECK ? -1 : Math.min(rows - 1, Math.floor(sy / n / (H / rows))) * cols + Math.min(cols - 1, Math.floor(sx / n / (W / cols))));
  }

  const box = Array.from({ length: cols * rows }, () => ({ minX: W, maxX: -1, minY: H, maxY: -1 }));
  for (let p = 0; p < W * H; p++) {
    const cell = label[p] === -1 ? -1 : owner[label[p]];
    if (cell < 0) continue;
    const b = box[cell], x = p % W, y = (p - x) / W;
    if (x < b.minX) b.minX = x; if (x > b.maxX) b.maxX = x; if (y < b.minY) b.minY = y; if (y > b.maxY) b.maxY = y;
  }

  const cells = box.map(({ minX, maxX, minY, maxY }, index) => {
    const cell = { row: Math.floor(index / cols), column: index % cols };
    if (maxX < 0) return { ...cell, ok: false, reason: 'empty cell' };
    // Inclusive edges start at bbox ± MARGIN, then each dirty edge moves to the nearest alpha-0
    // line between the bbox and bbox ± REACH (cutting only faint alpha or stray specks).
    const e = { l: Math.max(0, minX - MARGIN), r: Math.min(W - 1, maxX + MARGIN), t: Math.max(0, minY - MARGIN), b: Math.min(H - 1, maxY + MARGIN) };
    const range = { l: [Math.max(0, minX - REACH), minX - 1], r: [maxX + 1, Math.min(W - 1, maxX + REACH)],
      t: [Math.max(0, minY - REACH), minY - 1], b: [maxY + 1, Math.min(H - 1, maxY + REACH)] };
    const clean = (side, p) => {
      if (side === 'l' || side === 'r') { for (let y = e.t; y <= e.b; y++) if (a(p, y)) return false; }
      else for (let x = e.l; x <= e.r; x++) if (a(x, p)) return false;
      return true;
    };
    for (let round = 0; round < 4; round++) for (const side of ['l', 'r', 't', 'b']) {
      if (clean(side, e[side])) continue;
      const [lo, hi] = range[side], want = e[side];
      for (let d = 1; d <= hi - lo; d++) {
        const p = [want - d, want + d].find(q => q >= lo && q <= hi && clean(side, q));
        if (p !== undefined) { e[side] = p; break; }
      }
    }
    const crop = { left: e.l, top: e.t, width: e.r - e.l + 1, height: e.b - e.t + 1 };
    let border = 0, maxBorderAlpha = 0, intrusion = 0;
    const edge = (x, y) => { const v = a(x, y); if (v) { border++; maxBorderAlpha = Math.max(maxBorderAlpha, v); } };
    for (let x = e.l; x <= e.r; x++) { edge(x, e.t); edge(x, e.b); }
    for (let y = e.t; y <= e.b; y++) { edge(e.l, y); edge(e.r, y); }
    for (let y = e.t; y <= e.b; y++) for (let x = e.l; x <= e.r; x++) {
      const l = label[y * W + x];
      if (l !== -1 && owner[l] !== -1 && owner[l] !== index) intrusion++;
    }
    const reason = [border && `${border} border px alpha 1-${maxBorderAlpha}`, intrusion && `${intrusion} px of another cell inside crop`].filter(Boolean).join('; ');
    const subject = { width: maxX - minX + 1, height: maxY - minY + 1 };
    return { ...cell, ok: !reason, crop, subject, upscale: +(INNER / Math.max(subject.width, subject.height)).toFixed(2), ...(reason && { reason }) };
  });
  return { file, width: W, height: H, columns: cols, rows, cells };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [file, cols, rows] = [process.argv[2], Number(process.argv[3] ?? 4), Number(process.argv[4] ?? 2)];
  if (!file || !Number.isInteger(cols) || !Number.isInteger(rows)) throw new Error('Usage: detect-crops.mjs <atlas.png> <columns> <rows>');
  console.log(JSON.stringify(await detectCrops(file, cols, rows), null, 2));
}
