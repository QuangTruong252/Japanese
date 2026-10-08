// Chụp một route theo trạng thái dữ liệu × theme × độ rộng bằng agent-browser (dev server phải đang chạy).
// node scripts/ui-qa/shoot.mjs [--route hoc/tra-cuu] [--states normal,many] [--themes light,dark] [--widths 390,1280]
//   [--base http://localhost:3000] [--name home] [--scale 1]
// Route viết không có "/" đầu (bỏ trống = Bảng tin), vì Git Bash trên Windows đổi "/" thành đường dẫn ổ đĩa.
// Ảnh: .ui-qa/<name>/<state>-<theme>-<width>.png (git bỏ qua). Seed chỉ ghi vào profile của agent-browser.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values: o } = parseArgs({
  options: {
    route: { type: 'string', default: '' },
    states: { type: 'string', default: 'normal' },
    themes: { type: 'string', default: 'light,dark' },
    widths: { type: 'string', default: '390' },
    base: { type: 'string', default: 'http://localhost:3000' },
    name: { type: 'string' },
    scale: { type: 'string', default: '1' },
  },
});

if (/^[A-Za-z]:/.test(o.route)) throw new Error(`Route bị shell đổi thành đường dẫn (${o.route}); viết không có "/" đầu.`);
const route = '/' + o.route.replace(/^\/+|\/+$/g, '');
const root = path.resolve(import.meta.dirname, '../..');
const name = o.name ?? (route.slice(1).replace(/[/[\]]/g, '-') || 'home');
const outDir = path.join(root, '.ui-qa', name);
mkdirSync(outDir, { recursive: true });
const seed = readFileSync(path.join(import.meta.dirname, 'seed.js'), 'utf8');

// Windows: agent-browser là shim .cmd nên gọi qua cmd.exe. JS luôn đi qua stdin để tránh lỗi quoting.
const ab = (args, input) =>
  (process.platform === 'win32'
    ? execFileSync('cmd.exe', ['/d', '/c', 'agent-browser', ...args], { encoding: 'utf8', input })
    : execFileSync('agent-browser', args, { encoding: 'utf8', input })
  ).trim();
const evalJs = (js) => ab(['eval', '--stdin'], js);

const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
const files = [];
for (const width of list(o.widths)) {
  for (const state of list(o.states)) {
    for (const theme of list(o.themes)) {
      ab(['set', 'viewport', width, '900', o.scale]);
      ab(['open', o.base]);
      ab(['wait', '1500']);
      evalJs(`window.__STATE=${JSON.stringify(state)};window.__THEME=${JSON.stringify(theme)};\n${seed}`);
      ab(['open', o.base + route]);
      ab(['wait', '3500']);
      // Trang cuộn trong #app-scroll-container (layout), nên chụp hết trang bằng cách kéo viewport cao bằng nội dung.
      const height = Number(
        evalJs(`(() => {
          document.querySelectorAll('nextjs-portal').forEach((e) => e.remove());
          const m = document.getElementById('app-scroll-container');
          return Math.ceil(m ? m.getBoundingClientRect().top + m.scrollHeight : document.documentElement.scrollHeight);
        })()`).replace(/"/g, ''),
      );
      ab(['set', 'viewport', width, String(Math.max(height, 640)), o.scale]);
      ab(['wait', '800']);
      evalJs(`document.querySelectorAll('nextjs-portal').forEach((e) => e.remove()); 1`);
      const file = path.join(outDir, `${state}-${theme}-${width}.png`);
      ab(['screenshot', file]);
      files.push(path.relative(root, file));
    }
  }
}
console.log(files.join('\n'));
