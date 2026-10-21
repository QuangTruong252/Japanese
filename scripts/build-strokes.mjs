// Sinh web/src/data/strokes/kana.json và kanji.json từ KanjiVG (https://kanjivg.tagaini.net, CC BY-SA 3.0).
// Chạy ở root repo: node scripts/build-strokes.mjs <thư-mục-kanji-của-kanjivg>
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const attr = (tag, name) => tag.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1];

// Đọc một file SVG KanjiVG: path nét theo thứ tự nét, vị trí số thứ tự theo số trong <text>.
export function parseKanjiSvg(svg) {
  const paths = [];
  for (const [tag] of svg.matchAll(/<path\b[^>]*>/g)) {
    const m = attr(tag, 'id')?.match(/^kvg:[0-9a-f]+-s(\d+)$/);
    const d = attr(tag, 'd');
    if (m && d) paths.push([Number(m[1]), d]);
  }
  if (!paths.length) throw new Error('không có path nét');
  const nums = [];
  for (const [, tf, label] of svg.matchAll(/<text\b[^>]*transform="([^"]*)"[^>]*>\s*(\d+)\s*<\/text>/g)) {
    const m = tf.match(/matrix\(1 0 0 1 (\S+) (\S+)\)/);
    if (!m) throw new Error(`transform số nét lạ: ${tf}`);
    nums.push([Number(label), [Number(m[1]), Number(m[2])]]);
  }
  if (nums.length !== paths.length) throw new Error(`${paths.length} nét nhưng ${nums.length} số thứ tự`);
  return {
    d: paths.sort((a, b) => a[0] - b[0]).map((p) => p[1]),
    n: nums.sort((a, b) => a[0] - b[0]).map((p) => p[1]),
  };
}

// CLI chỉ chạy khi gọi trực tiếp, để test import được parseKanjiSvg.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const dir = process.argv[2];
  if (!dir) {
    console.error('Dùng: node scripts/build-strokes.mjs <thư-mục-kanji-của-kanjivg>');
    process.exit(1);
  }

  const kana = await import(pathToFileURL(join(root, 'web/src/data/kana.ts')).href);
  const chars = [
    ...new Set(
      [kana.HIRAGANA_BASIC_ROWS, kana.KATAKANA_BASIC_ROWS, kana.HIRAGANA_DAKUON_ROWS, kana.KATAKANA_DAKUON_ROWS]
        .flatMap((rows) => rows.flatMap((r) => r.cells))
        .filter(Boolean)
        .map((c) => c.kana),
    ),
  ];

  // Kanji N5: số nét KanjiVG phải khớp trường strokes của dữ liệu học, lệch là một trong hai bên sai.
  const kanjiDir = join(root, 'web/src/data/n5/kanji');
  const kanji = readdirSync(kanjiDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(kanjiDir, f), 'utf8')));

  const fail = (ch, msg) => {
    console.error(`Lỗi ở chữ ${ch}: ${msg}`);
    process.exit(1);
  };

  const build = (list) => {
    const out = {};
    for (const ch of list) {
      const hex = ch.codePointAt(0).toString(16).padStart(5, '0');
      let svg;
      try {
        svg = readFileSync(join(dir, `${hex}.svg`), 'utf8');
      } catch {
        fail(ch, `thiếu file ${hex}.svg`);
      }
      try {
        out[ch] = parseKanjiSvg(svg);
      } catch (e) {
        fail(ch, e.message);
      }
    }
    return out;
  };

  const kanaOut = build(chars);
  const kanjiOut = build(kanji.map((k) => k.character));
  for (const k of kanji) {
    const got = kanjiOut[k.character].d.length;
    if (got !== k.strokes) fail(k.character, `KanjiVG ${got} nét, dữ liệu học ghi ${k.strokes}`);
  }

  // Ghi sau khi mọi chữ đều hợp lệ, để lỗi không để lại file nửa vời.
  for (const [name, out] of [['kana', kanaOut], ['kanji', kanjiOut]]) {
    const lines = Object.entries(out).map(([ch, v]) => `${JSON.stringify(ch)}:${JSON.stringify(v)}`);
    const file = join(root, `web/src/data/strokes/${name}.json`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `{\n${lines.join(',\n')}\n}\n`, 'utf8');
    console.log(`Đã ghi ${lines.length} chữ vào ${file}`);
  }
}
