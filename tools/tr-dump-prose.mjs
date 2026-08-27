// Dump the castle's actual sentences from real seasons. Read the output.
const _store = new Map();
globalThis.localStorage = { getItem: k => _store.has(k) ? _store.get(k) : null,
  setItem: (k,v) => _store.set(k, String(v)), removeItem: k => _store.delete(k), clear: () => _store.clear() };
const CORE = await import('../js/core.js');
const { setPlayers } = CORE;
const { playTraitorsSeason } = await import('../js/tr/headless.js');
const { EVENTS } = await import('../js/tr/events.js');
const { seedFranchiseHistory } = await import('../tests/helpers/tr-castle-fixture.js');
const roster = (await import('../franchise_roster.json', { with: { type: "json" } })).default;
await import('../js/tr/castle/trust.js');
await import('../js/tr/castle/suspicion.js');
await import('../js/tr/castle/grief.js');
await import('../js/tr/castle/cover.js');
await import('../js/tr/castle/romance.js');
await import('../js/tr/castle/callback.js');
await import('../js/tr/castle/testing.js');
await import('../js/tr/castle/journey.js');

const N = Number(process.argv[2] || 20);
const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);

// Wrap every fire() to capture the thread notes it wrote.
const captured = [];
let cur = null;
for (const ev of EVENTS) {
  const orig = ev.fire;
  ev.fire = function (ctx, rng) {
    const before = new Set();
    for (const t of (CORE.gs?.tr?.threads || [])) for (const b of t.beats) before.add(b);
    const res = orig.call(this, ctx, rng);
    const notes = [];
    for (const t of (CORE.gs?.tr?.threads || [])) for (const b of t.beats) if (!before.has(b)) notes.push(b.note);
    captured.push({ season: cur, ep: ctx.ep, id: ev.id, family: ev.family,
      branch: res?.branch ?? null, notes });
    return res;
  };
}

for (let i = 1; i <= N; i++) {
  cur = i;
  setPlayers(ROSTER);
  seedFranchiseHistory(CAST);
  playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: i });
}

const NAMES = ROSTER.map(p => p.name).sort((a,b) => b.length - a.length);
function mask(s) {
  let out = String(s);
  for (const n of NAMES) out = out.split(n).join('~');
  return out.replace(/\d+/g, '#').replace(/~(?:'s|’s)/g, '~');
}
const mode = process.argv[3] || 'season';
if (mode === 'season') {
  let last = null;
  for (const c of captured) {
    if (c.season !== last) { console.log(`\n\n########## SEASON ${c.season} ##########`); last = c.season; }
    console.log(`[ep${c.ep}] ${c.id} :: ${c.branch}`);
    for (const n of c.notes) console.log(`    ${n}`);
  }
} else if (mode === 'byevent') {
  const byId = new Map();
  for (const c of captured) {
    if (!byId.has(c.id)) byId.set(c.id, []);
    byId.get(c.id).push(c);
  }
  for (const [id, list] of [...byId].sort()) {
    const sents = new Set();
    for (const c of list) for (const n of c.notes) sents.add(mask(String(n).split(/(?<=[.!?]) /)[0]));
    console.log(`\n=== ${id}  (${list.length} firings, ${sents.size} distinct lead sentences)`);
    for (const s of [...sents].slice(0, 8)) console.log(`   ${s}`);
  }
}
