// tools/dr-print-aftermath.mjs — the aftermath, printed and read.
// A passing test proves the fields exist. Only reading them proves they say
// anything. Run: node tools/dr-print-aftermath.mjs [seed] [castSize]
const { JSDOM } = await import('jsdom');
const d = new JSDOM('<!doctype html><html></html>', { url: 'http://localhost/' });
for (const k of ['window', 'document', 'localStorage', 'navigator']) {
  if (!globalThis[k]) globalThis[k] = d.window[k];
}
const { buildDragAftermath } = await import('../js/dr/aftermath.js');
const { playDragSeason } = await import('../js/dr/season.js');
const { rngFor } = await import('../js/dr/rng.js');

const SEED = Number(process.argv[2]) || 3;
const SIZE = Number(process.argv[3]) || 12;
const S = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const A = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'schemer'];
const rng = rngFor(1200); const r = () => 1 + Math.floor(rng() * 10);
const cast = Array.from({ length: SIZE }, (_, i) => ({
  name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: A[i % A.length], age: 21 + i,
  stats: Object.fromEntries(S.map(k => [k, r()])),
  drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
}));

const out = playDragSeason({ cast, seed: SEED });
const a = buildDragAftermath(out.rows, { players: {} });

console.log(`\nseason of ${SIZE}, seed ${SEED} — winner ${out.winner}\n`);
console.log('SCREEN TIME');
const st = Object.entries(a.screenTime).sort((x, y) => y[1].total - x[1].total);
const top = st[0][1].total;
for (const [n, v] of st) {
  const eps = Object.keys(v.byEpisode).length;
  console.log(`  ${n.padEnd(5)} ${String(v.total).padStart(3)}  ${'#'.repeat(Math.round(v.total / top * 34)).padEnd(34)} ${eps} eps`);
}

console.log('\nAWARDS');
for (const [k, v] of Object.entries(a.awards)) {
  if (!v) { console.log(`  ${k.padEnd(14)} — not awarded`); continue; }
  const extra = Object.entries(v).filter(([f]) => !['name', 'label'].includes(f))
    .map(([f, x]) => `${f}=${x}`).join(' ');
  console.log(`  ${k.padEnd(14)} ${String(v.name).padEnd(5)} ${(v.label || '').padEnd(26)} ${extra}`);
}

console.log(`\nMOMENTS (${a.moments.length})`);
const byKind = {};
for (const m of a.moments) byKind[m.kind] = (byKind[m.kind] || 0) + 1;
for (const [k, v] of Object.entries(byKind).sort((x, y) => y[1] - x[1])) console.log(`  ${k.padEnd(18)} ${v}`);
for (const m of a.moments.slice(0, 6)) {
  console.log(`   ep${m.episode} ${m.name} — ${m.kind}${m.detail ? ` (${m.detail})` : ''}${m.challenge ? ` @ ${m.challenge}` : ''}`);
}

console.log(`\nARCS (${a.arcs.length})`);
for (const arc of a.arcs.filter(x => x.beats > 1).slice(0, 10)) {
  console.log(`  ${arc.arc.padEnd(20)} ${arc.players.join('+').padEnd(10)} ${arc.beats} beats  ${arc.alive ? 'alive' : 'ended'}${arc.flipped ? ` flipped:${arc.flipped}` : ''}`);
}
