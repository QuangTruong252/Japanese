// Chụp as-built tablet/PC (màn đầu) vào design/<thư mục>/as-built-{pc,tablet}-{light,dark}.png.
// node scripts/ui-qa/as-built.mjs [thư mục,...] [base=http://localhost:3000]; dev server phải đang chạy.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../..');
const sharp = createRequire(createRequire(path.join(root, 'web/package.json')).resolve('next/package.json'))('sharp');
const B = process.argv[3] ?? 'http://localhost:3000';
const PAGES = [
  ['home', ''], ['hoc', 'hoc'], ['bai', 'hoc/1'], ['tu-vung', 'hoc/1/tu-vung'], ['ngu-phap', 'hoc/1/ngu-phap/wa-desu'],
  ['luyen-tap', 'luyen-tap'], ['on-tap', 'on-tap'], ['on-tap/diem-yeu', 'on-tap/diem-yeu'],
  ['luyen-viet', 'luyen-viet'], ['luyen-viet/phien', 'luyen-viet/phien?c=%E3%81%82%E3%81%84'],
  ['hoi-thoai', 'hoc/1/hoi-thoai/l01-hajimemashite'],
  ['tra-cuu', 'hoc/tra-cuu'], ['tra-cuu/kana', 'hoc/tra-cuu/kana'], ['tra-cuu/kanji', 'hoc/tra-cuu/kanji'],
  ['tra-cuu/kanji-chi-tiet', 'hoc/tra-cuu/kanji/%E4%BA%BA'], ['tra-cuu/dong-tu', 'hoc/tra-cuu/dong-tu'],
  ['tra-cuu/bang', 'hoc/tra-cuu/bang'], ['tra-cuu/bang-chi-tiet', 'hoc/tra-cuu/bang/demonstratives'],
  ['ca-nhan', 'ca-nhan'], ['ca-nhan/thong-ke', 'ca-nhan/thong-ke'], ['cai-dat', 'cai-dat'], ['cai-dat/audio', 'cai-dat/audio'],
];
const SIZES = { pc: ['1280', 860], tablet: ['768', 1100] };
const only = process.argv[2]?.split(',').filter(Boolean);
const all = !only?.length;
const save = async (src, dir, name, h) => {
  const out = path.join(root, 'design', dir);
  mkdirSync(out, { recursive: true });
  const meta = await sharp(src).metadata();
  await sharp(src).extract({ left: 0, top: 0, width: meta.width, height: Math.min(h, meta.height) })
    .png({ palette: true, quality: 90, effort: 8 }).toFile(path.join(out, name));
};
for (const [dir, route] of PAGES.filter(([d]) => all || only.includes(d))) {
  for (const [kind, [w, h]] of Object.entries(SIZES)) {
    for (const theme of ['light', 'dark']) {
      const name = `ab-${dir.replace(/\//g, '-')}`;
      try {
        execFileSync('node', ['scripts/ui-qa/shoot.mjs', '--base', B, '--max-height', '2000', ...(route ? ['--route', route] : []), '--states', 'normal',
          '--themes', theme, '--widths', w, '--name', name], { cwd: root, stdio: 'ignore', timeout: 240000 });
        await save(path.join(root, '.ui-qa', name, `normal-${theme}-${w}.png`), dir, `as-built-${kind}-${theme}.png`, h);
        console.log('ok', dir, kind, theme);
      } catch (e) { console.log('FAIL', dir, kind, theme, String(e.message).slice(0, 120)); }
    }
  }
}
