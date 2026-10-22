globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null };
const { POOLS } = await import('./js/ci/lines/index.js');
const fs = await import('fs');
const keys = process.argv.slice(2);
const out = [];
for (const k of keys) for (const e of POOLS[k] || []) {
  if (e.when?.register) continue;
  const t = (e.turns || []).find(x => x.by === 'a' && (x.send || x.say || x.post));
  if (!t) continue;
  const f = ['send', 'post', 'say'].find(x => t[x]);
  out.push(`${e.id} | ${f} | ${t[f]}${e.when ? '  [when ' + JSON.stringify(e.when) + ']' : ''}`);
}
fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/claude/C--Users-yanna-OneDrive-Documents-GitHub-dc-franchise-db/c8833f21-0136-4250-9325-7631b557ffc8/scratchpad/dump.txt', out.join('\n'));
console.log(out.length);
