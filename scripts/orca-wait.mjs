// Chờ tin Orca cho Điều phối, bỏ qua heartbeat: lô chỉ có heartbeat được ack ở lần chờ kế tiếp;
// gặp worker_done / escalation / question thì in cả lô (CHƯA ack) rồi thoát để Điều phối xử lý.
// node scripts/orca-wait.mjs [timeoutMs=3600000]   — sau khi xử lý: orca orchestration check --ack <deliveryId>
import { execFileSync } from 'node:child_process';

const orca = (args) =>
  JSON.parse(
    process.platform === 'win32'
      ? execFileSync('cmd.exe', ['/d', '/c', 'orca', 'orchestration', ...args, '--json'], { encoding: 'utf8', maxBuffer: 1 << 24 })
      : execFileSync('orca', ['orchestration', ...args, '--json'], { encoding: 'utf8', maxBuffer: 1 << 24 }),
  ).result;

const deadline = Date.now() + Number(process.argv[2] ?? 3600000);
let ack = null;
while (Date.now() < deadline) {
  const r = orca(['check', ...(ack ? ['--ack', ack] : []), '--wait', '--types', 'worker_done,escalation,question', '--timeout-ms', '300000']);
  ack = null;
  if (!r.messages?.length) continue;
  if (r.messages.every((m) => m.type === 'heartbeat')) {
    ack = r.deliveryId;
    continue;
  }
  console.log(JSON.stringify(r, null, 1));
  process.exit(0);
}
console.log('TIMEOUT');
