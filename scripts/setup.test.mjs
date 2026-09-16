import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { test } from 'node:test';
import { mcpServer, pnpmCommand, setupAgents } from './setup.mjs';

test('setup is relocatable, repeatable and preserves unrelated configuration/data', t => {
  const root = mkdtempSync(join(tmpdir(), 'japanese-agents-'));
  t.after(() => {
    assert.ok(resolve(root).startsWith(resolve(tmpdir()) + sep));
    rmSync(root, { recursive: true, force: true });
  });
  for (const name of ['react-best-practices', 'web-design-guidelines', 'shadcn']) {
    const source = join(root, '.agents/skills', name);
    mkdirSync(source, { recursive: true });
    writeFileSync(join(source, 'SKILL.md'), name);
  }
  mkdirSync(join(root, '.codex'));
  const custom = 'model_reasoning_effort = "high"\n[mcp_servers.example]\ncommand = "example"\n';
  writeFileSync(join(root, '.codex/config.toml'), custom);
  writeFileSync(join(root, '.mcp.json'), JSON.stringify({ mcpServers: { example: { command: 'example' } } }));
  setupAgents(root);
  const first = readFileSync(join(root, '.codex/config.toml'), 'utf8');
  setupAgents(root);
  assert.equal(readFileSync(join(root, '.codex/config.toml'), 'utf8'), first);
  assert.ok(first.startsWith(custom.trimEnd()));
  assert.equal(first.match(/\[mcp_servers.next-devtools\]/g).length, 1);
  assert.equal(JSON.parse(readFileSync(join(root, '.mcp.json'))).mcpServers.example.command, 'example');
  for (const name of ['react-best-practices', 'web-design-guidelines', 'shadcn']) {
    assert.equal(realpathSync(join(root, '.claude/skills', name)), realpathSync(join(root, '.agents/skills', name)));
  }
  for (const platform of ['linux', 'darwin']) {
    assert.deepEqual(mcpServer(platform), { type: 'stdio', command: 'pnpm', args: ['dlx', 'next-devtools-mcp@0.4.0'] });
    assert.deepEqual(pnpmCommand(['install', '--frozen-lockfile'], platform), ['pnpm', 'install', '--frozen-lockfile']);
  }
  assert.equal(mcpServer('win32').command, 'cmd.exe');
  assert.ok(!JSON.stringify(mcpServer()).includes(root));
  const claudeSkill = join(root, '.claude/skills/shadcn');
  unlinkSync(claudeSkill);
  symlinkSync(join(root, 'old-checkout-missing'), claudeSkill, process.platform === 'win32' ? 'junction' : 'dir');
  setupAgents(root);
  assert.equal(realpathSync(claudeSkill), realpathSync(join(root, '.agents/skills/shadcn')));
  unlinkSync(claudeSkill);
  mkdirSync(claudeSkill);
  writeFileSync(join(claudeSkill, 'keep.txt'), 'user data');
  assert.throws(() => setupAgents(root), /Refusing to overwrite directory/);
  assert.equal(readFileSync(join(claudeSkill, 'keep.txt'), 'utf8'), 'user data');
  writeFileSync(join(root, '.codex/config.toml'), '[mcp_servers.next-devtools]\ncommand = "custom"\n');
  assert.throws(() => setupAgents(root), /Custom next-devtools/);
  assert.match(readFileSync(join(root, '.codex/config.toml'), 'utf8'), /"custom"/);
});
