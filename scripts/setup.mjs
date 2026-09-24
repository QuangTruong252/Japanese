import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const skills = ['react-best-practices', 'web-design-guidelines', 'shadcn', 'transitions-dev', 'transitions-polish'];
const begin = '# BEGIN Japanese Next DevTools (managed by scripts/setup.mjs)';
const end = '# END Japanese Next DevTools';

export function pnpmCommand(args, platform = process.platform) {
  return platform === 'win32' ? ['cmd.exe', '/d', '/c', 'pnpm', ...args] : ['pnpm', ...args];
}

export function mcpServer(platform = process.platform) {
  const [command, ...args] = pnpmCommand(['dlx', 'next-devtools-mcp@0.4.0'], platform);
  return { type: 'stdio', command, args };
}

function tomlServer(platform) {
  const { command, args } = mcpServer(platform);
  return `[mcp_servers.next-devtools]\ncommand = ${JSON.stringify(command)}\nargs = ${JSON.stringify(args)}\nstartup_timeout_sec = 60\n`;
}

export function setupAgents(root, platform = process.platform) {
  const codexPath = join(root, '.codex/config.toml');
  const current = existsSync(codexPath) ? readFileSync(codexPath, 'utf8').replaceAll('\r\n', '\n') : '';
  const block = `${begin}\n${tomlServer(platform)}${end}`;
  const managed = /^# BEGIN Japanese Next DevTools \(managed by scripts\/setup\.mjs\)\n[\s\S]*?^# END Japanese Next DevTools$/m;
  let codex;
  if (managed.test(current)) {
    codex = current.replace(managed, () => block);
  } else if (!current.trim() || current.replaceAll(' ', '').trim() === tomlServer('win32').replaceAll(' ', '').trim()) {
    codex = `${block}\n`; // Migrate the original Windows-only setup.
  } else {
    if (/^\s*\[mcp_servers\.(?:next-devtools|"next-devtools"|'next-devtools')[.\]]/m.test(current)) {
      throw new Error('Custom next-devtools config found in .codex/config.toml; merge it manually before setup.');
    }
    codex = `${current.trimEnd()}\n\n${block}\n`;
  }

  const mcpPath = join(root, '.mcp.json');
  const mcp = existsSync(mcpPath) ? JSON.parse(readFileSync(mcpPath, 'utf8')) : {};
  mcp.mcpServers = { ...mcp.mcpServers, 'next-devtools': { ...mcp.mcpServers?.['next-devtools'], ...mcpServer(platform) } };

  // Validate all destinations before changing links or configuration.
  const links = skills.map(name => {
    const source = join(root, '.agents/skills', name);
    if (!existsSync(join(source, 'SKILL.md'))) throw new Error(`Missing skill: ${source}`);
    const target = join(root, '.claude/skills', name);
    const stat = lstatSync(target, { throwIfNoEntry: false });
    if (stat && !stat.isSymbolicLink()) throw new Error(`Refusing to overwrite directory: ${target}`);
    return { source, target, stat };
  });
  mkdirSync(join(root, '.claude/skills'), { recursive: true });
  for (const { source, target, stat } of links) {
    if (stat && existsSync(target) && realpathSync(target) === realpathSync(source)) continue;
    if (stat) unlinkSync(target); // Remove only the link, never its destination.
    symlinkSync(platform === 'win32' ? source : relative(dirname(target), source), target,
      platform === 'win32' ? 'junction' : 'dir');
  }
  mkdirSync(dirname(codexPath), { recursive: true });
  writeFileSync(codexPath, codex);
  writeFileSync(mcpPath, `${JSON.stringify(mcp, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = fileURLToPath(new URL('../', import.meta.url));
    const [command, ...args] = pnpmCommand(['install', '--frozen-lockfile']);
    const result = spawnSync(command, args, { cwd: join(root, 'web'), stdio: 'inherit', windowsHide: true });
    if (result.error || result.status !== 0) throw new Error('pnpm install failed. Install Node.js 24+ and pnpm 11.9.0, then retry.');
    setupAgents(root);
    console.log('Ready: dependencies, 5 shared skills, Codex/Claude Next DevTools config.');
    console.log('Open the repository root in your agent and approve workspace/MCP trust if prompted.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
