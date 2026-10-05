// From repo root: node artwork/illustrations/tools/export-vocab.mjs student-v1
// Export only unpublished stems; production URLs are immutable once referenced.
import { readFile, writeFile, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = new URL('../../../', import.meta.url);
const require = createRequire(new URL('web/package.json', root));
const sharp = createRequire(require.resolve('next/package.json'))('sharp');
for (const stem of process.argv.slice(2)) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*-v[1-9][0-9]*$/.test(stem)) throw new Error('Invalid versioned stem');
  const masterPath = `artwork/illustrations/vocab/${stem}.png`;
  const sidecarPath = `artwork/illustrations/vocab/${stem}.json`;
  const output = `web/public/assets/illustrations/vocab/${stem}.webp`;
  try { await access(new URL(output, root)); throw new Error(`Output already exists: ${output}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const sidecar = JSON.parse(await readFile(new URL(sidecarPath, root), 'utf8'));
  const master = await sharp(fileURLToPath(new URL(masterPath, root))).metadata();
  if (master.format !== 'png' || !master.hasAlpha) throw new Error('Source must be a native-alpha PNG');
  const bytes = await sharp(fileURLToPath(new URL(masterPath, root)))
    .resize(448, 448, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 32, bottom: 32, left: 32, right: 32, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 82, alphaQuality: 100, effort: 6 }).toBuffer();
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alphaPixels = { transparent: 0, partial: 0, opaque: 0 };
  for (let i = 3; i < data.length; i += 4) {
    alphaPixels[data[i] === 0 ? 'transparent' : data[i] === 255 ? 'opaque' : 'partial']++;
  }
  if (info.width !== 512 || info.height !== 512 || !alphaPixels.transparent || !(alphaPixels.opaque + alphaPixels.partial)) {
    throw new Error('Incorrect dimensions or alpha');
  }
  sidecar.master = { path: masterPath, width: master.width, height: master.height, format: master.format, hasAlpha: master.hasAlpha };
  sidecar.export = { converter: 'sharp', version: sharp.versions.sharp, fit: 'contain', innerSize: { width: 448, height: 448 }, padding: 32, quality: 82, alphaQuality: 100, effort: 6 };
  sidecar.outputVerification = { format: 'webp', bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), hasAlpha: true, decoded: true, alphaPixels };
  await writeFile(new URL(output, root), bytes, { flag: 'wx' });
  await writeFile(new URL(sidecarPath, root), JSON.stringify(sidecar, null, 2) + '\n');
  console.log(`${stem}: 512x512 WebP, ${bytes.length} bytes, native alpha retained`);
}
