// From repo root: node artwork/illustrations/tools/batch.mjs <command> <batch.json> [stem ...]
//   prompts  write <batch>.prompts.md for whoever generates the images (agent or ChatGPT web)
//   collect  copy missing sources from Codex image_gen output, matched by prompt subject
//   check    dry run: crops, quality gates and encoded size, writes nothing
//   export   master PNG + sidecar in artwork/, WebP in web/public; never overwrites published bytes
//   sheet    review sheet (reference + exported WebPs on ivory and dark) in reports/
//   link     add exported assets to the learning JSON and mark their sidecars
// One batch file is the source of truth for a set of assets (SPEC-21). Optional stems limit the run.
import { readFile, writeFile, access, readdir, stat, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import { detectCrops } from './detect-crops.mjs';
import { validateIllustrationAsset } from '../../../web/src/lib/illustrations.ts';

const root = new URL('../../../', import.meta.url);
const abs = rel => fileURLToPath(new URL(rel, root));
const exists = rel => access(abs(rel)).then(() => true, () => false);
const sharp = createRequire(createRequire(new URL('web/package.json', root)).resolve('next/package.json'))('sharp');
const sha256 = buf => createHash('sha256').update(buf).digest('hex');

// Export profiles per SPEC-21 §4. Cutouts: subject bbox (alpha >= 8) fitted to INNER, centred in SIZE,
// so every subject has the same visual size whatever the source margin was.
const GROUPS = {
  vocab: { kind: 'cutout', role: 'vocabulary-cutout' },
  'ui/states': { kind: 'cutout', role: 'state-cutout' },
  'ui/sections': { kind: 'cutout', role: 'section-cutout' },
  scenes: { kind: 'opaque', role: 'scene', width: 800, height: 600, shape: 'Landscape 4:3' },
  grammar: { kind: 'opaque', role: 'grammar-scene', width: 800, height: 600, shape: 'Landscape 4:3' },
  'ui/banners': { kind: 'opaque', role: 'banner', width: 1200, height: 400, shape: 'Wide 3:1 banner' },
};
const SIZE = 512, INNER = 416, PAD = (SIZE - INNER) / 2, SUBJECT = 8, MAX_UPSCALE = 1.3;
const BUDGET = { cutout: 50_000, opaque: 150_000 };
const WEBP = { quality: 82, alphaQuality: 100, effort: 6 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };
const STEM = /^[a-z0-9]+(?:-[a-z0-9]+)*-v[1-9][0-9]*$/;

// ---------- prompts (single source for every generator) ----------
const STYLE = `STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; palette of warm ivory/sand, sage/olive green, charcoal, restrained brick red (use true colors where the subject requires). Friendly everyday feeling, not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag. Keep faces and proportions like the reference.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no paper rectangle, no fake checkerboard, no soft background wash, no floor shadow spreading outward, no stray paint specks.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, brand marks, signs with writing, route numbers, labels, captions, watermark or UI anywhere. Signs, screens and destination boards stay blank.`;
const ATLAS_LAYOUT = 'LAYOUT RULES: each illustration is a standalone cutout centered in its own cell and fits inside the central 60% of the cell, with wide EMPTY transparent margins on all four sides; nothing touches another cell or the canvas edge. No grid lines, no cell backgrounds, no frames.';
const SINGLE_LAYOUT = 'LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY transparent margins on all four sides. Show every person and object completely (full figures including feet); nothing is cropped by or touches the canvas edge.';
const OPAQUE_STYLE = shape => `Editorial watercolor and gouache illustration, hand-painted Japanese book-illustration feel: delicate dark pencil contours, soft organic painted washes, subtle paper texture, warm ivory paper tones. Palette: cream, warm sand, charcoal gray, muted sage green, warm timber wood, muted brick-red accents. ${shape} composition, FULL-BLEED: the painting fills the whole canvas edge to edge, with NO frame, NO border line, NO mat and NO paper margin around it.
Characters, when present: young male student = slightly messy short dark hair, cream long-sleeved shirt, charcoal trousers, black backpack; young woman = chin-length dark bob with bangs, cream cardigan over muted brick-red top, charcoal skirt, small brown shoulder bag.`;
const OPAQUE_RULES = `STRICT REQUIREMENTS:
- Absolutely NO text, letters, kanji, kana, numbers or words anywhere: signs, boards, labels and screens stay completely blank.
- Clock faces have NO digits and NO Roman numerals.
- Hand-painted watercolor gouache look, NOT 3D, NOT CGI, NOT glossy vector, NOT photo.`;

function atlasPrompt(job) {
  const shape = job.columns === job.rows ? 'square 1:1 image' : job.columns === 2 * job.rows ? 'wide 2:1 image (landscape)' : `${job.columns}:${job.rows} image`;
  const cells = job.cells.map((c, i) => `${i + 1}. (row ${Math.floor(i / job.columns) + 1}, column ${i % job.columns + 1}) ${c.subject}`);
  return [`Create ONE ${shape} that is a sprite atlas of ${job.cells.length} separate illustrations arranged in a precise grid of ${job.columns} columns x ${job.rows} rows, for a Japanese-learning app's vocabulary cards.`,
    STYLE, `CELLS (row-major):\n${cells.join('\n')}`, ATLAS_LAYOUT].join('\n\n');
}
function singlePrompt(job) {
  const profile = GROUPS[job.group];
  if (profile.kind === 'opaque') return `${OPAQUE_STYLE(profile.shape)}\n\nSubject: ${job.subject}\nKeep the main subject in the central area so the image survives cropping to a thumbnail.\n\n${OPAQUE_RULES}`;
  return [`Create ONE square 1:1 illustration for a Japanese-learning app's ${job.group === 'vocab' ? 'vocabulary card' : 'empty/finished state'}.`, STYLE, SINGLE_LAYOUT, `SUBJECT: ${job.subject}`].join('\n\n');
}

// ---------- batch model ----------
function load(batch) {
  const assets = [];
  for (const job of batch.jobs) {
    // { "reuse": "vocab/laptop-v1", target, alt }: link an existing asset to one more entry.
    if (job.reuse) {
      const parts = job.reuse.split('/');
      assets.push({ ...job, group: parts.slice(0, -1).join('/'), stem: parts.at(-1), reused: true });
      continue;
    }
    job.group ??= 'vocab';
    if (!GROUPS[job.group]) throw new Error(`Unknown group ${job.group}`);
    if (job.cells && GROUPS[job.group].kind !== 'cutout') throw new Error('Atlases are for alpha cutouts only');
    job.prompt ??= job.cells ? atlasPrompt(job) : singlePrompt(job);
    job.referenceImages ??= batch.referenceImages ?? [];
    const common = { group: job.group, source: job.source, generation: job.generation, prompt: job.prompt, referenceImages: job.referenceImages };
    if (job.cells) job.cells.forEach((cell, index) => { if (!cell.skip) assets.push({ ...common, ...cell, atlas: job, index }); });
    else assets.push({ ...common, ...job });
  }
  const seen = new Set();
  for (const a of assets) {
    if (!GROUPS[a.group] || !STEM.test(a.stem ?? '')) throw new Error(`Invalid group/versioned stem: ${a.group}/${a.stem}`);
    if (a.target && typeof a.alt?.vi !== 'string') throw new Error(`${a.stem}: target needs alt.vi`);
    if (a.reused) { if (!a.target) throw new Error(`reuse ${a.stem} needs a target`); continue; }
    if (seen.has(a.stem)) throw new Error(`Duplicate stem: ${a.stem}`);
    seen.add(a.stem);
  }
  return assets;
}
function paths(a) {
  const base = `artwork/illustrations/${a.group}/${a.stem}`;
  return { master: `${base}.png`, sidecar: `${base}.json`, file: a.atlas ? a.atlas.master : a.file ?? `${base}.png`,
    output: `web/public/assets/illustrations/${a.group}/${a.stem}.webp`, src: `/assets/illustrations/${a.group}/${a.stem}.webp` };
}

function alphaBox(data, { width: W, height: H }) {
  let minX = W, maxX = -1, minY = H, maxY = -1, edge = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] < SUBJECT) continue;
    if (x === 0 || y === 0 || x === W - 1 || y === H - 1) edge++;
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return maxX < 0 ? null : { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1, edge };
}

// Builds everything in memory; returns problems instead of throwing so `check` can list them all.
async function prepare(a, crops) {
  const p = paths(a), profile = GROUPS[a.group], problems = [], warnings = [];
  if (await exists(p.output)) {
    const sidecar = await exists(p.sidecar) && JSON.parse(await readFile(abs(p.sidecar), 'utf8'));
    const same = sidecar && sidecar.outputVerification?.sha256 === sha256(await readFile(abs(p.output)));
    return { a, p, status: same ? 'exported' : 'conflict', problems: same ? [] : [`${p.output} exists without a matching sidecar`], warnings };
  }
  if (await exists(p.sidecar)) problems.push(`${p.sidecar} exists without its WebP`);
  if (!await exists(p.file)) return { a, p, status: 'missing', problems: [...problems, `source not found: ${p.file}`], warnings };

  let source, crop;
  if (a.atlas) {
    crops[p.file] ??= detectCrops(abs(p.file), a.atlas.columns, a.atlas.rows);
    const cell = (await crops[p.file]).cells[a.index];
    if (!cell.ok) return { a, p, status: 'fail', problems: [...problems, `atlas cell r${cell.row}c${cell.column}: ${cell.reason}`], warnings };
    crop = cell.crop;
    source = await sharp(abs(p.file)).extract(crop).png().toBuffer();
  } else source = await readFile(abs(p.file));
  const meta = await sharp(source).metadata();
  // The master PNG is written unless the source already is that file.
  const masterBuf = p.file === p.master ? null : meta.format === 'png' ? source : await sharp(source).png().toBuffer();
  if (masterBuf && await exists(p.master)) problems.push(`${p.master} already exists`);

  let webp, normalize;
  if (profile.kind === 'cutout') {
    if (meta.format !== 'png' || !meta.hasAlpha) return { a, p, status: 'fail', problems: [...problems, 'cutout source must be a PNG with native alpha'], warnings };
    const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const box = alphaBox(data, info);
    if (!box) return { a, p, status: 'fail', problems: [...problems, 'no painted pixels'], warnings };
    if (box.edge) problems.push(`${box.edge} subject px touch the canvas edge (subject is cut)`);
    const upscale = INNER / Math.max(box.width, box.height);
    if (upscale > MAX_UPSCALE) problems.push(`subject ${box.width}x${box.height} needs ${upscale.toFixed(2)}x upscale (max ${MAX_UPSCALE})`);
    else if (upscale > 1) warnings.push(`upscale ${upscale.toFixed(2)}x`);
    const { edge, ...subjectBox } = box;
    normalize = { subjectBox, subjectThreshold: SUBJECT, inner: INNER, padding: PAD, scale: +upscale.toFixed(3) };
    webp = await sharp(source).extract(subjectBox).resize(INNER, INNER, { fit: 'contain', background: CLEAR })
      .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: CLEAR }).webp(WEBP).toBuffer();
  } else {
    const c = a.crop ?? { left: 0, top: 0, width: meta.width, height: meta.height };
    const ratio = c.width / c.height / (profile.width / profile.height);
    if (Math.abs(ratio - 1) > 0.02) problems.push(`region ${c.width}x${c.height} is not ${profile.width}:${profile.height} within 2%; set "crop"`);
    if (c.width < profile.width || c.height < profile.height) problems.push(`region ${c.width}x${c.height} is smaller than ${profile.width}x${profile.height}`);
    crop = a.crop;
    normalize = { fit: 'cover', width: profile.width, height: profile.height };
    webp = await sharp(source).extract(c).resize(profile.width, profile.height, { fit: 'cover' }).removeAlpha().webp(WEBP).toBuffer();
  }

  const { data, info } = await sharp(webp).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alphaPixels = { transparent: 0, partial: 0, opaque: 0 };
  for (let i = 3; i < data.length; i += 4) alphaPixels[data[i] === 0 ? 'transparent' : data[i] === 255 ? 'opaque' : 'partial']++;
  const [w, h] = profile.kind === 'cutout' ? [SIZE, SIZE] : [profile.width, profile.height];
  if (info.width !== w || info.height !== h) problems.push(`encoded ${info.width}x${info.height}, expected ${w}x${h}`);
  if (profile.kind === 'cutout' && (!alphaPixels.transparent || alphaPixels.transparent === data.length / 4)) problems.push('encoded cutout lost its alpha or its subject');
  if (webp.length > BUDGET[profile.kind]) warnings.push(`${webp.length} bytes > ${BUDGET[profile.kind]} budget`);
  return { a, p, status: problems.length ? 'fail' : 'ready', problems, warnings, source, meta, crop, masterBuf, webp, normalize, alphaPixels, width: w, height: h };
}

async function run(batchRel, stems, fn) {
  const batch = JSON.parse(await readFile(abs(batchRel), 'utf8'));
  let assets = load(batch);
  if (stems.length) {
    const unknown = stems.filter(s => !assets.some(a => a.stem === s));
    if (unknown.length) throw new Error(`Not in batch: ${unknown.join(', ')}`);
    assets = assets.filter(a => stems.includes(a.stem));
  }
  // Reused assets already exist; only `link` acts on them.
  return fn(batch, fn === commands.link ? assets : assets.filter(a => !a.reused));
}

// ---------- commands ----------
async function prompts(batchRel, batch, assets) {
  const jobs = batch.jobs.filter(j => j.cells ? assets.some(a => a.atlas === j) : assets.some(a => a.stem === j.stem));
  const out = [`# Prompt — batch \`${batch.name}\``, '', `Sinh từ \`${batchRel}\` bằng \`batch.mjs prompts\`; sửa batch rồi chạy lại, không sửa file này.`,
    'Mỗi mục: một lần gọi tạo ảnh. Đính kèm ảnh tham chiếu khi có. Lưu đúng đường dẫn, giữ nguyên bytes, không ghi đè file có sẵn.', ''];
  for (const job of jobs) {
    const target = job.cells ? job.master : paths(job).file;
    if (await exists(target)) continue;
    out.push(`## \`${target}\``, '', job.referenceImages.length ? `Tham chiếu: ${job.referenceImages.map(r => `\`${r}\``).join(', ')}` : 'Không có ảnh tham chiếu (nền đục).', '', '```text', job.prompt, '```', '');
  }
  const file = batchRel.replace(/\.json$/, '.prompts.md');
  await writeFile(abs(file), out.join('\n'));
  console.log(`Wrote ${file}`);
}

// Codex built-in image_gen keeps every image as ~/.codex/generated_images/<thread>/<item id>.png and
// logs the prompt in the session rollout, so the coordinator copies sources instead of the worker.
async function collect(batch, assets) {
  const codex = path.join(os.homedir(), '.codex');
  const norm = s => s.replace(/\s+/g, ' ').trim();
  const images = [];
  const walk = async dir => {
    for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(p);
      else if (entry.name.endsWith('.jsonl') && (await stat(p)).mtimeMs > Date.now() - 2 * 86400e3) {
        for (const line of (await readFile(p, 'utf8')).split('\n')) {
          if (!line.includes('"image_gen.generation"')) continue;
          const { timestamp, payload } = JSON.parse(line);
          if (payload?.item?.status !== 'completed') continue;
          images.push({ timestamp, prompt: norm(payload.item.revisedPrompt ?? ''), file: path.join(codex, 'generated_images', payload.thread_id, `${payload.item.id}.png`) });
        }
      }
    }
  };
  await walk(path.join(codex, 'sessions'));
  images.sort((x, y) => y.timestamp.localeCompare(x.timestamp));
  for (const job of batch.jobs.filter(j => !j.reuse && (j.cells ? assets.some(a => a.atlas === j) : assets.some(a => a.stem === j.stem)))) {
    const target = job.cells ? job.master : paths(job).file;
    if (await exists(target)) continue;
    // The subject lines identify a prompt even if the generator reflowed whitespace.
    const subjects = (job.cells ?? [job]).map(c => norm(c.subject));
    const hits = images.filter(i => subjects.every(s => i.prompt.includes(s)));
    let copied = false;
    for (const hit of hits) {
      if (!await access(hit.file).then(() => true, () => false)) continue;
      await writeFile(abs(target), await readFile(hit.file), { flag: 'wx' });
      console.log(`collected ${target} <- ${hit.file}`);
      copied = true;
      break;
    }
    if (!copied) console.log(`not generated yet: ${target}`);
  }
}

async function check(batch, assets) {
  const crops = {};
  const results = [];
  for (const a of assets) {
    const r = await prepare(a, crops);
    results.push(r);
    const size = r.webp ? ` ${r.webp.length} B` : '';
    console.log(`${r.status.padEnd(8)} ${a.stem}${size}${r.normalize?.scale ? ` scale ${r.normalize.scale}` : ''}${[...r.problems, ...r.warnings].map(m => `\n         - ${m}`).join('')}`);
  }
  return results;
}

async function exportAssets(batchRel, batch, assets) {
  const results = await check(batch, assets);
  const bad = results.filter(r => !['ready', 'exported'].includes(r.status));
  if (bad.length) throw new Error(`${bad.length} asset(s) not exportable; nothing written`);
  const embed = process.platform === 'win32' ? abs('.agents/skills/impeccable/scripts/bin/windows-x64/impeccable.exe') : abs('.agents/skills/impeccable/scripts/impeccable');
  for (const r of results.filter(x => x.status === 'ready')) {
    const { a, p } = r;
    if (r.masterBuf) await writeFile(abs(p.master), r.masterBuf, { flag: 'wx' });
    const promptFile = path.join(os.tmpdir(), `maipace-prompt-${a.stem}.txt`);
    await writeFile(promptFile, a.prompt, 'utf8');
    execFileSync(embed, ['embed-prompt', abs(p.master), '--prompt-file', promptFile], { encoding: 'utf8' });
    const master = await sharp(abs(p.master)).metadata();
    const sidecar = {
      createdAt: new Date().toISOString(), source: a.source, ...(a.generation && { generation: a.generation }), batch: batchRel,
      prompt: a.prompt, referenceImages: a.referenceImages, output: p.output, width: r.width, height: r.height,
      role: GROUPS[a.group].role, suggestedAlt: a.alt,
      ...(a.target && { intendedContent: { ...a.target, referenceStatus: 'awaiting-learning-data' } }),
      master: { path: p.master, width: master.width, height: master.height, format: master.format, hasAlpha: master.hasAlpha,
        ...(p.file !== p.master && { sourceImage: p.file }), ...(r.crop && { crop: r.crop }) },
      export: { converter: 'sharp', version: sharp.versions.sharp, ...r.normalize, ...WEBP },
      outputVerification: { format: 'webp', bytes: r.webp.length, sha256: sha256(r.webp), hasAlpha: GROUPS[a.group].kind === 'cutout', decoded: true, alphaPixels: r.alphaPixels },
    };
    await writeFile(abs(p.output), r.webp, { flag: 'wx' });
    await writeFile(abs(p.sidecar), JSON.stringify(sidecar, null, 2) + '\n', { flag: 'wx' });
    console.log(`exported ${p.output}`);
  }
}

async function sheet(batch, assets) {
  const tile = 256, cols = 6;
  const files = ['artwork/illustrations/reference/paper-town-style-v1.png'];
  for (const a of assets) if (await exists(paths(a).output)) files.push(paths(a).output);
  const rows = Math.ceil(files.length / cols);
  const tiles = await Promise.all(files.map(f => sharp(abs(f)).resize(tile - 16, tile - 16, { fit: 'contain', background: CLEAR }).png().toBuffer()));
  const panel = background => sharp({ create: { width: cols * tile, height: rows * tile, channels: 4, background } })
    .composite(tiles.map((input, i) => ({ input, left: (i % cols) * tile + 8, top: Math.floor(i / cols) * tile + 8 }))).png().toBuffer();
  // Review-only artefact: ivory and near-black stand in for the app's light/dark surfaces.
  const [light, dark] = await Promise.all([panel({ r: 245, g: 239, b: 226, alpha: 1 }), panel({ r: 32, g: 30, b: 28, alpha: 1 })]);
  const file = `artwork/illustrations/reports/${batch.name}-sheet.png`;
  await mkdir(path.dirname(abs(file)), { recursive: true });
  await sharp({ create: { width: cols * tile, height: rows * tile * 2, channels: 4, background: CLEAR } })
    .composite([{ input: light, left: 0, top: 0 }, { input: dark, left: 0, top: rows * tile }]).png().toFile(abs(file));
  console.log(`Wrote ${file} (${files.length - 1} assets + reference, first tile)`);
}

async function link(batch, assets) {
  const files = new Map();
  const pending = [];
  for (const a of assets.filter(x => x.target)) {
    const p = paths(a);
    if (!await exists(p.sidecar) || !await exists(p.output)) throw new Error(`${a.stem}: export it first`);
    const sidecar = JSON.parse(await readFile(abs(p.sidecar), 'utf8'));
    if (sidecar.outputVerification.sha256 !== sha256(await readFile(abs(p.output)))) throw new Error(`${a.stem}: WebP differs from its sidecar`);
    const ref = { src: p.src, width: sidecar.width, height: sidecar.height, alt: a.alt };
    validateIllustrationAsset(ref);
    const { dataFile } = a.target;
    if (!files.has(dataFile)) {
      const text = await readFile(abs(dataFile), 'utf8');
      const crlf = text.includes('\r\n'), data = JSON.parse(text);
      // Refuse to reformat a file whose layout JSON.stringify would not reproduce.
      if (JSON.stringify(data, null, 2) + '\n' !== text.replace(/\r\n/g, '\n')) throw new Error(`${dataFile} is not 2-space JSON; refusing to rewrite it`);
      files.set(dataFile, { data, crlf, changed: false });
    }
    const f = files.get(dataFile);
    const [node, key] = a.target.field === 'cover' ? [f.data, 'cover']
      : dataFile.includes('/lessons/') ? [f.data.grammar?.find(g => g.id === a.target.id), 'illustration']
      : [f.data.words?.find(w => w.id === a.target.id), 'illustration'];
    if (!node) throw new Error(`${a.stem}: ${a.target.id ?? a.target.field} not found in ${dataFile}`);
    if (node[key] && !isDeepStrictEqual(node[key], ref)) throw new Error(`${a.stem}: ${dataFile} already has ${node[key].src}; add a new version deliberately`);
    if (!node[key]) { node[key] = ref; f.changed = true; }
    if (a.target.caption && !isDeepStrictEqual(node.illustrationCaption, a.target.caption)) { node.illustrationCaption = a.target.caption; f.changed = true; }
    if (!a.reused) pending.push({ p, sidecar });
  }
  for (const [file, f] of files) {
    if (!f.changed) continue;
    const text = JSON.stringify(f.data, null, 2) + '\n';
    await writeFile(abs(file), f.crlf ? text.replace(/\n/g, '\r\n') : text);
    console.log(`updated ${file}`);
  }
  for (const { p, sidecar } of pending) {
    if (sidecar.intendedContent.referenceStatus === 'added-to-learning-data') continue;
    sidecar.intendedContent.referenceStatus = 'added-to-learning-data';
    await writeFile(abs(p.sidecar), JSON.stringify(sidecar, null, 2) + '\n');
  }
  console.log(`linked ${assets.filter(a => a.target).length} reference(s)`);
}

const [command, batchRel, ...stems] = process.argv.slice(2);
const commands = {
  prompts: (b, a) => prompts(batchRel, b, a),
  collect,
  check: async (b, a) => { if ((await check(b, a)).some(r => !['ready', 'exported'].includes(r.status))) process.exitCode = 1; },
  export: (b, a) => exportAssets(batchRel, b, a),
  sheet,
  link,
};
if (!commands[command] || !batchRel) {
  console.error('Usage: node artwork/illustrations/tools/batch.mjs <prompts|collect|check|export|sheet|link> <batch.json> [stem ...]');
  process.exit(2);
}
await run(batchRel.replace(/\\/g, '/'), stems, commands[command]);
