// artwork/illustrations/tools/export-atlas.mjs
// Run from repo root: node artwork/illustrations/tools/export-atlas.mjs [path-to-atlas-json]
import { readFile, writeFile, access, unlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const root = new URL('../../../', import.meta.url);
const require = createRequire(new URL('web/package.json', root));
const sharp = createRequire(require.resolve('next/package.json'))('sharp');

const atlasJsonRel = process.argv[2] || 'artwork/illustrations/atlases/everyday-objects-v1.json';
const atlasJsonPath = fileURLToPath(new URL(atlasJsonRel, root));

async function main() {
  const startTime = Date.now();
  console.log(`Loading atlas descriptor: ${atlasJsonRel}`);
  const atlas = JSON.parse(await readFile(atlasJsonPath, 'utf8'));

  const atlasPngRel = atlas.master;
  const atlasPngPath = fileURLToPath(new URL(atlasPngRel, root));
  await access(atlasPngPath);

  const atlasBuf = await readFile(atlasPngPath);
  const atlasMeta = await sharp(atlasBuf).metadata();

  console.log(`Atlas image: ${atlasMeta.width}x${atlasMeta.height}, format=${atlasMeta.format}, hasAlpha=${atlasMeta.hasAlpha}`);

  // Validation 1: PNG and True Native Alpha
  if (atlasMeta.format !== 'png') {
    throw new Error(`Atlas format must be png, got ${atlasMeta.format}`);
  }
  if (!atlasMeta.hasAlpha) {
    throw new Error('Atlas must have a native alpha channel (hasAlpha: true)');
  }

  // Preflight all target paths BEFORE any processing/writes to prevent partial writes
  for (const asset of atlas.assets) {
    const { stem } = asset;
    const masterPath = fileURLToPath(new URL(`artwork/illustrations/vocab/${stem}.png`, root));
    const sidecarPath = fileURLToPath(new URL(`artwork/illustrations/vocab/${stem}.json`, root));
    const webpPath = fileURLToPath(new URL(`web/public/assets/illustrations/vocab/${stem}.webp`, root));

    // Check none of the output paths exist already
    for (const [desc, p] of [['WebP', webpPath], ['Master PNG', masterPath], ['Sidecar JSON', sidecarPath]]) {
      try {
        await access(p);
        throw new Error(`${desc} already exists and overwrite is strictly forbidden: ${p}`);
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
    }
  }

  // Impeccable executable path for embedding prompt
  const impeccableBin = process.platform === 'win32'
    ? path.resolve('.agents/skills/impeccable/scripts/bin/windows-x64/impeccable.exe')
    : path.resolve('.agents/skills/impeccable/scripts/impeccable');

  // Temp prompt file outside repo
  const tempPromptFile = path.join(os.tmpdir(), `atlas-prompt-${Date.now()}.txt`);
  await writeFile(tempPromptFile, atlas.prompt, 'utf8');

  // Ensure four channels on raw atlas buffer
  const { data: atlasData, info: atlasInfo } = await sharp(atlasBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const results = [];

  for (const asset of atlas.assets) {
    const { stem, row, column, id, dataFile, suggestedAlt, crop } = asset;
    if (!crop) {
      throw new Error(`Asset ${stem} missing crop definition in atlas JSON`);
    }

    const { left, top, width: cropW, height: cropH } = crop;

    // Validation 2: Crop integers, positive sizes, and canvas bounds
    if (!Number.isInteger(left) || !Number.isInteger(top) || !Number.isInteger(cropW) || !Number.isInteger(cropH)) {
      throw new Error(`Crop coordinates for ${stem} must be integers: left=${left}, top=${top}, width=${cropW}, height=${cropH}`);
    }
    if (cropW <= 0 || cropH <= 0 || left < 0 || top < 0) {
      throw new Error(`Crop coordinates for ${stem} must be positive and non-negative: left=${left}, top=${top}, width=${cropW}, height=${cropH}`);
    }
    if (left + cropW > atlasInfo.width || top + cropH > atlasInfo.height) {
      throw new Error(`Crop frame for ${stem} exceeds atlas boundaries: ${left + cropW} > ${atlasInfo.width} or ${top + cropH} > ${atlasInfo.height}`);
    }

    console.log(`\n--- Processing asset: ${stem} (row ${row}, col ${column}) ---`);
    console.log(`Crop frame: left=${left}, top=${top}, width=${cropW}, height=${cropH}`);

    // Validation 3: Ensure transparent gutters / borders on all 4 edges of crop frame
    let nonZeroBorder = 0;
    // top & bottom edges
    for (let x = left; x < left + cropW; x++) {
      if (atlasData[(top * atlasInfo.width + x) * 4 + 3] > 0) nonZeroBorder++;
      if (atlasData[((top + cropH - 1) * atlasInfo.width + x) * 4 + 3] > 0) nonZeroBorder++;
    }
    // left & right edges
    for (let y = top; y < top + cropH; y++) {
      if (atlasData[(y * atlasInfo.width + left) * 4 + 3] > 0) nonZeroBorder++;
      if (atlasData[(y * atlasInfo.width + (left + cropW - 1)) * 4 + 3] > 0) nonZeroBorder++;
    }

    if (nonZeroBorder > 0) {
      throw new Error(`Crop frame for ${stem} has ${nonZeroBorder} non-zero pixels on border! Not fully transparent gutter.`);
    }

    // Validation 4: Subject bounding box inside crop frame
    let minX = cropW, maxX = -1, minY = cropH, maxY = -1;
    let paintedCount = 0;

    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        const a = atlasData[((top + y) * atlasInfo.width + (left + x)) * 4 + 3];
        if (a > 0) {
          paintedCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // Accept painted content opaque + partial rather than requiring opaque
    if (paintedCount === 0 || maxX === -1 || maxY === -1) {
      throw new Error(`Crop frame for ${stem} has no painted content!`);
    }

    // Subject must not touch any edge
    if (minX <= 0 || maxX >= cropW - 1 || minY <= 0 || maxY >= cropH - 1) {
      throw new Error(`Subject touches border in ${stem}: relX=[${minX}, ${maxX}], relY=[${minY}, ${maxY}]`);
    }

    console.log(`Subject contained: ${paintedCount} pixels, margins [L:${minX}, R:${cropW - 1 - maxX}, T:${minY}, B:${cropH - 1 - maxY}]`);

    // Validation 5: Four corners must be 0 alpha (fail if checkerboard or solid bg)
    const corners = [
      atlasData[(top * atlasInfo.width + left) * 4 + 3],
      atlasData[(top * atlasInfo.width + (left + cropW - 1)) * 4 + 3],
      atlasData[((top + cropH - 1) * atlasInfo.width + left) * 4 + 3],
      atlasData[((top + cropH - 1) * atlasInfo.width + (left + cropW - 1)) * 4 + 3]
    ];
    if (corners.some(a => a !== 0)) {
      throw new Error(`Non-transparent corner in ${stem}: [${corners.join(', ')}]`);
    }

    // Extract crop PNG
    const cropPngBuf = await sharp(atlasBuf)
      .extract({ left, top, width: cropW, height: cropH })
      .png()
      .toBuffer();

    const masterRel = `artwork/illustrations/vocab/${stem}.png`;
    const sidecarRel = `artwork/illustrations/vocab/${stem}.json`;
    const webpRel = `web/public/assets/illustrations/vocab/${stem}.webp`;

    const masterPath = fileURLToPath(new URL(masterRel, root));
    const sidecarPath = fileURLToPath(new URL(sidecarRel, root));
    const webpPath = fileURLToPath(new URL(webpRel, root));

    // Save master crop PNG with wx
    await writeFile(masterPath, cropPngBuf, { flag: 'wx' });

    // Embed prompt using impeccable embed-prompt (stop on error)
    try {
      execFileSync(impeccableBin, ['embed-prompt', masterPath, '--prompt-file', tempPromptFile], { encoding: 'utf8' });
      console.log(`Embedded prompt into ${masterRel}`);
    } catch (e) {
      throw new Error(`Prompt embedding failed for ${masterRel}: ${e.message}`);
    }

    // Export WebP (contain 448x448, extend padding 32, quality 82, alphaQuality 100, effort 6)
    const webpBytes = await sharp(masterPath)
      .resize(448, 448, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({ top: 32, bottom: 32, left: 32, right: 32, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 82, alphaQuality: 100, effort: 6 })
      .toBuffer();

    const { data: webpRaw, info: webpInfo } = await sharp(webpBytes)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const webpAlphaPixels = { transparent: 0, partial: 0, opaque: 0 };
    for (let i = 3; i < webpRaw.length; i += 4) {
      const a = webpRaw[i];
      if (a === 0) webpAlphaPixels.transparent++;
      else if (a === 255) webpAlphaPixels.opaque++;
      else webpAlphaPixels.partial++;
    }

    // Output verification checks
    if (webpInfo.width !== 512 || webpInfo.height !== 512 || !webpAlphaPixels.transparent || (webpAlphaPixels.opaque + webpAlphaPixels.partial === 0)) {
      throw new Error(`Incorrect WebP dimensions or alpha for ${stem}`);
    }

    const webpSha256 = createHash('sha256').update(webpBytes).digest('hex');

    // Write WebP with wx
    await writeFile(webpPath, webpBytes, { flag: 'wx' });

    // Write sidecar JSON with wx
    const sidecarData = {
      createdAt: new Date().toISOString(),
      source: "image_gen",
      sourceAtlas: atlasPngRel,
      sourceImage: atlasPngRel,
      prompt: atlas.prompt,
      referenceImages: atlas.referenceImages,
      output: webpRel,
      width: 512,
      height: 512,
      role: "vocabulary-cutout",
      suggestedAlt: suggestedAlt,
      intendedContent: {
        dataFile: dataFile || "web/src/data/n5/vocab/lesson-02.json",
        id: id,
        referenceStatus: "awaiting-learning-data"
      },
      master: {
        path: masterRel,
        width: cropW,
        height: cropH,
        format: "png",
        hasAlpha: true,
        crop: {
          left,
          top,
          width: cropW,
          height: cropH
        }
      },
      export: {
        converter: "sharp",
        version: sharp.versions.sharp,
        fit: "contain",
        innerSize: { width: 448, height: 448 },
        padding: 32,
        quality: 82,
        alphaQuality: 100,
        effort: 6
      },
      outputVerification: {
        format: "webp",
        bytes: webpBytes.length,
        sha256: webpSha256,
        hasAlpha: true,
        decoded: true,
        alphaPixels: webpAlphaPixels
      }
    };

    await writeFile(sidecarPath, JSON.stringify(sidecarData, null, 2) + '\n', { flag: 'wx', encoding: 'utf8' });
    console.log(`Successfully exported ${stem}: ${webpBytes.length} bytes, sha256=${webpSha256.slice(0, 16)}...`);

    results.push({
      stem,
      id,
      bytes: webpBytes.length,
      sha256: webpSha256,
      alphaPixels: webpAlphaPixels,
      crop
    });
  }

  // Clean up temp file
  try { await unlink(tempPromptFile); } catch {}

  const elapsedMs = Date.now() - startTime;
  console.log(`\n========================================`);
  console.log(`All ${results.length} atlas cutouts exported successfully in ${elapsedMs} ms!`);
  console.log(`Total WebP bytes: ${results.reduce((acc, r) => acc + r.bytes, 0)}`);
  console.log(`========================================`);
  return { results, elapsedMs };
}

main().catch(err => {
  console.error('Atlas export failed:', err);
  process.exit(1);
});
